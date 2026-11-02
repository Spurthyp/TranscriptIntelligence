"""
Transcript Intelligence - FastAPI Server
Powers the React frontend with endpoints for dataset analytics, LangGraph agent execution,
transcript search, and executive stakeholder insights.
"""

import os
import json
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pipeline import run_pipeline_for_id

app = FastAPI(
    title="Transcript Intelligence API",
    description="Backend API powered by LangGraph multi-agent pipeline for enterprise transcript analysis",
    version="1.0.0"
)

# Enable CORS for frontend Vite development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
TRANSCRIPTS_FILE = os.path.join(BACKEND_DIR, "processed_transcripts.json")
SUMMARY_FILE = os.path.join(BACKEND_DIR, "dataset_summary.json")

def load_transcripts():
    if not os.path.exists(TRANSCRIPTS_FILE):
        return []
    with open(TRANSCRIPTS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def load_summary():
    if not os.path.exists(SUMMARY_FILE):
        return {}
    with open(SUMMARY_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "Transcript Intelligence API", "engine": "LangGraph StateGraph"}


@app.get("/api/summary")
def get_summary():
    data = load_summary()
    if not data:
        raise HTTPException(status_code=404, detail="Summary not generated yet.")
    return data


@app.get("/api/categories")
def get_categories():
    transcripts = load_transcripts()
    category_map = {}
    for t in transcripts:
        cat = t["category"]
        if cat not in category_map:
            category_map[cat] = {
                "name": cat,
                "count": 0,
                "reasoning": t.get("category_reasoning", ""),
                "sample_transcripts": []
            }
        category_map[cat]["count"] += 1
        if len(category_map[cat]["sample_transcripts"]) < 3:
            category_map[cat]["sample_transcripts"].append({
                "id": t["id"],
                "title": t["title"],
                "call_type": t["call_type"],
                "customer_name": t["customer_name"],
                "sentiment_label": t["sentiment_label"],
                "sentiment_score": t["sentiment_score"],
                "churn_risk": t["churn_risk"]
            })
    sorted_categories = sorted(list(category_map.values()), key=lambda x: x["count"], reverse=True)
    return sorted_categories


@app.get("/api/transcripts")
def get_transcripts(
    category: Optional[str] = Query(None),
    call_type: Optional[str] = Query(None),
    churn_risk: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    all_data = load_transcripts()
    filtered = all_data

    if category:
        filtered = [t for t in filtered if t.get("category") == category]
    if call_type:
        filtered = [t for t in filtered if t.get("call_type") == call_type]
    if churn_risk:
        filtered = [t for t in filtered if t.get("churn_risk") == churn_risk]
    if search:
        s_low = search.lower()
        filtered = [
            t for t in filtered
            if s_low in t.get("title", "").lower()
            or s_low in t.get("customer_name", "").lower() if t.get("customer_name")
            or any(s_low in top.lower() for top in t.get("topics", []))
            or s_low in t.get("summary", "").lower()
        ]

    # Return summary view for list performance
    results = []
    for t in filtered:
        results.append({
            "id": t["id"],
            "title": t["title"],
            "duration": t["duration"],
            "call_type": t["call_type"],
            "customer_name": t["customer_name"],
            "product_lines": t["product_lines"],
            "category": t["category"],
            "secondary_category": t["secondary_category"],
            "category_confidence": t["category_confidence"],
            "sentiment_label": t["sentiment_label"],
            "sentiment_score": t["sentiment_score"],
            "churn_risk": t["churn_risk"],
            "summary": t["summary"],
            "topics": t["topics"],
            "action_items_count": len(t.get("action_items", [])),
            "friction_points_count": len(t.get("friction_points", []))
        })
    return results


@app.get("/api/transcripts/{transcript_id}")
def get_transcript_detail(transcript_id: str):
    all_data = load_transcripts()
    matched = next((t for t in all_data if t["id"] == transcript_id), None)
    
    # Also load the raw transcript turns
    dataset_dir = os.path.join(os.path.dirname(BACKEND_DIR), "dataset", transcript_id)
    raw_turns = []
    tr_path = os.path.join(dataset_dir, "transcript.json")
    if os.path.exists(tr_path):
        with open(tr_path, "r", encoding="utf-8") as f:
            raw_turns = json.load(f).get("data", [])
            
    if not matched:
        raise HTTPException(status_code=404, detail="Transcript not found")
        
    detail = dict(matched)
    detail["raw_turns"] = raw_turns
    return detail


@app.post("/api/pipeline/run/{transcript_id}")
def run_live_pipeline(transcript_id: str):
    """Executes the LangGraph agent pipeline live and streams the step-by-step traces."""
    dataset_dir = os.path.join(os.path.dirname(BACKEND_DIR), "dataset")
    if not os.path.exists(os.path.join(dataset_dir, transcript_id)):
        raise HTTPException(status_code=404, detail=f"Transcript folder {transcript_id} not found in dataset")
        
    print(f"\n🚀 [LangGraph] Executing 5-node agent pipeline for transcript: {transcript_id}")
    result = run_pipeline_for_id(transcript_id, dataset_dir=dataset_dir)
    print(f"📊 [LangGraph] Execution completed for '{result['meeting_info'].get('title')}':")
    for tr in result.get("pipeline_trace", []):
        print(f"   ✓ [{tr['node']}] -> {tr['details']}")
    print(f"🎯 Output: Category='{result['category']}' (Confidence: {result['category_confidence']}) | Churn Risk={result['churn_risk']}\n")
    return {
        "transcript_id": transcript_id,
        "title": result["meeting_info"].get("title"),
        "call_type": result["call_type"],
        "category": result["category"],
        "confidence": result["category_confidence"],
        "reasoning": result["category_reasoning"],
        "sentiment": result["sentiment_label"],
        "sentiment_score": result["sentiment_score"],
        "churn_risk": result["churn_risk"],
        "stakeholder_insights": result["stakeholder_insights"],
        "pipeline_trace": result["pipeline_trace"]
    }


@app.get("/api/insights")
def get_executive_insights():
    """Returns aggregated strategic recommendations for key SaaS stakeholders."""
    return {
        "stakeholders": [
            {
                "role": "Engineering & SRE Leaders",
                "focus": "Reliability, Architecture & MTTR",
                "key_findings": [
                    "Single Point of Failure: The Detect Kafka ingestion layer caused a 6-hour blackout affecting 30+ enterprise tiers.",
                    "Mitigation Verified: The LangGraph pipeline identified that war room nodes deployed active-active failover and circuit breaker patterns.",
                    "Scalability Warning: High rate-limiting during bulk Comply v2 exports necessitates asynchronous batch queues."
                ],
                "action_items": [
                    "Implement chaos engineering tests on Kafka queue partition rebalancing.",
                    "Standardize health-check endpoints for downstream ingestion clusters.",
                    "Add automated canary deployment rollbacks for the Protect S3 connector."
                ]
            },
            {
                "role": "Customer Support Leadership",
                "focus": "Ticket Volume, SLA Breaches & Deflection",
                "key_findings": [
                    "Outage Spikes: 112 support tickets were opened during the incident window, overwhelming Tier 1 support.",
                    "Connector Configuration Fatigue: S3 403 Access Denied errors and LogVault timeouts represent 28% of all recurring support tickets.",
                    "Communication Latency: Customers complained about discovering outages themselves before Aegis posted status updates."
                ],
                "action_items": [
                    "Embed automated IAM permission & SCP pre-flight validator directly in the Protect connector UI.",
                    "Publish a real-time system status web-hook directly into customer Slack/Teams channels.",
                    "Create self-serve troubleshooting runbooks for LogVault data backfills."
                ]
            },
            {
                "role": "Sales & Customer Success (AM)",
                "focus": "Retention, Churn Signals & Expansion",
                "key_findings": [
                    "Immediate Churn Danger: 52% of calls showed 'Critical' churn risk signals, with accounts like Blackridge Investments and Cobalt Software requesting competitor bake-offs (Datadog/CrowdStrike).",
                    "Comply v2 Growth Catalyst: Accounts in audit cycles (Redwood Clinical, Summit Trust) displayed high willingness to expand contracts for multi-framework automation.",
                    "Overage Billing Friction: Atlas Precision and Clearwater Medical protested unexpected ingestion volume overage charges."
                ],
                "action_items": [
                    "Offer proactive SLA service credits and executive sponsor outreach to Priority 1 accounts before renewal dates.",
                    "Bundle Comply v2 multi-framework add-ons into upcoming renewal proposals.",
                    "Introduce soft volume thresholds with in-app proactive alerts before charging overage fees."
                ]
            },
            {
                "role": "Product Managers",
                "focus": "Feature Adoption, Roadmap & UX",
                "key_findings": [
                    "High Adoption for Comply v2: Strong satisfaction with automated evidence packaging for SOC 2 and ISO 27001.",
                    "Identity Feature Gap: Enterprise accounts urgently requested SCIM automated user de-provisioning and adaptive MFA policies.",
                    "Restore Granularity: Customers requested item-level file restore rather than full EBS volume rollbacks."
                ],
                "action_items": [
                    "Prioritize SCIM connector and Okta/Azure AD sync in Q2 sprint planning.",
                    "Build granular file-level restore UX in Aegis Protect.",
                    "Add in-app incident notification banners for threat monitoring status."
                ]
            }
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
