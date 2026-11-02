"""
Transcript Intelligence - Category Agent
Performs semantic business categorization and calculates dynamic multi-field confidence scores.
"""

from typing import Dict, Any, List, Optional
from state import TranscriptState

def calculate_dynamic_confidence(
    category_keywords: List[str], 
    title: str, 
    topics: List[str], 
    summary: str, 
    call_type: str, 
    expected_call_type: Optional[str] = None
) -> float:
    """
    Calculates dynamic confidence score based on multi-field evidence and boosting:
    1. Base confidence for text match: 0.65
    2. Field Boosting (Title): +0.15 if keyword appears in meeting title
    3. Field Boosting (Topics): +0.10 if keyword appears in formal topics array
    4. Multi-Signal Corroboration: +0.02 for each distinct keyword matched (up to +0.08)
    5. Operational Alignment: +0.05 if call_type aligns with category
    """
    title_lower = title.lower()
    topics_lower = " ".join(topics).lower()
    summary_lower = summary.lower()
    
    # 1. Base confidence for matching
    confidence = 0.65
    
    # 2. Field Boosting: Did the keyword appear in the Title? (+0.15)
    matched_in_title = any(k in title_lower for k in category_keywords)
    if matched_in_title:
        confidence += 0.15
        
    # 3. Field Boosting: Did it appear in the formal Topics list? (+0.10)
    matched_in_topics = any(k in topics_lower for k in category_keywords)
    if matched_in_topics:
        confidence += 0.10
        
    # 4. Multi-Signal Corroboration: Count how many distinct keywords matched (+0.02 each, max 0.08)
    distinct_matches = sum(1 for k in category_keywords if k in (title_lower + " " + summary_lower))
    confidence += min(distinct_matches * 0.02, 0.08)
    
    # 5. Call Type Alignment (+0.05)
    if expected_call_type and call_type == expected_call_type:
        confidence += 0.05
        
    # Return capped confidence (0.60 to 0.99) rounded to 2 decimals
    return round(min(max(confidence, 0.60), 0.99), 2)


def categorization_agent_node(state: TranscriptState) -> Dict[str, Any]:
    """Node 3: Performs semantic categorization into the 6 verified business themes with dynamic confidence."""
    title = state["meeting_info"].get("title", "")
    summary = state["summary_data"].get("summary", "")
    topics = [t.lower() for t in state["summary_data"].get("topics", [])]
    call_type = state["call_type"]
    text_corpus = f"{title} {summary} {' '.join(topics)}".lower()
    
    category = "General Platform Discussion"
    secondary = None
    reasoning = ""
    confidence = 0.85
    
    # Priority 1: Incident & Outage Management
    outage_keywords = [
        "detect outage", "pipeline failure", "war room", "loss of threat visibility",
        "service outage", "outage remediation", "outage post-mortem", "root cause analysis",
        "escalation bridge", "threat monitoring failure", "single point of failure", "circuit breaker"
    ]
    if any(k in text_corpus for k in outage_keywords) and not ("comply v2" in title.lower() and "launch" in title.lower()):
        category = "Incident & Outage Management"
        confidence = calculate_dynamic_confidence(outage_keywords, title, topics, summary, call_type)
        reasoning = (
            "Transcript focuses on the severe Detect event ingestion pipeline failure, covering active war rooms, "
            "loss of real-time threat monitoring visibility for customers, root-cause diagnostics, and remediation architecture."
        )
        if "churn risk" in text_corpus or "sla breach" in text_corpus:
            secondary = "Commercials & Renewals"
            
    # Priority 2: Compliance & Audit Readiness
    elif any(k in text_corpus for k in ["comply v2", "soc 2", "iso 27001", "hipaa", "compliance reporting", "pci dss", "audit prep", "compliance automation"]):
        compliance_keywords = ["comply v2", "soc 2", "iso 27001", "hipaa", "compliance reporting", "pci dss", "audit prep", "compliance automation"]
        category = "Compliance & Audit Readiness"
        confidence = calculate_dynamic_confidence(compliance_keywords, title, topics, summary, call_type)
        reasoning = (
            "Centered on enterprise regulatory frameworks (SOC 2, HIPAA, ISO 27001), automated evidence collection, "
            "or the rollout and validation of the Comply v2 platform."
        )
        if "onboarding" in text_corpus:
            secondary = "Customer Onboarding"
            
    # Priority 3: Commercials & Renewals
    elif any(k in text_corpus for k in ["renewal", "contract discussion", "billing dispute", "overage charges", "pricing pressure", "sla credit", "multi-year renewal"]):
        commercial_keywords = ["renewal", "contract discussion", "billing dispute", "overage charges", "pricing pressure", "sla credit", "multi-year renewal"]
        category = "Commercials & Renewals"
        confidence = calculate_dynamic_confidence(commercial_keywords, title, topics, summary, call_type, expected_call_type="External AM / CS")
        reasoning = (
            "Focuses on contractual and financial engagements between Aegis Cloud and customers, including renewal terms, "
            "seat/ingestion overage disputes, pricing concessions, and churn mitigation."
        )
        if "outage" in text_corpus:
            secondary = "Incident & Outage Management"
            
    # Priority 4: Technical Support
    elif call_type == "Customer Support" or any(k in text_corpus for k in ["connector", "s3 backup", "403 error", "logvault", "timeout", "slow backup", "granular restore", "bug fix"]):
        support_keywords = ["support case", "connector", "s3 backup", "403 error", "logvault", "timeout", "slow backup", "granular restore", "bug fix"]
        category = "Technical Support"
        confidence = calculate_dynamic_confidence(support_keywords, title, topics, summary, call_type, expected_call_type="Customer Support")
        reasoning = (
            "Tactical customer engineering and support interaction diagnosing configuration errors, IAM/S3 permissions, "
            "LogVault timeouts, or backup performance degradation."
        )
        
    # Priority 5: Customer Onboarding
    elif any(k in text_corpus for k in ["onboarding kickoff", "module deployment", "identity module setup", "initial configuration", "proof of concept"]):
        onboarding_keywords = ["onboarding kickoff", "module deployment", "identity module setup", "initial configuration", "proof of concept"]
        category = "Customer Onboarding"
        confidence = calculate_dynamic_confidence(onboarding_keywords, title, topics, summary, call_type, expected_call_type="External AM / CS")
        reasoning = (
            "Proactive customer success onboarding for new logos or deployment of new security modules (Detect, Identity, Protect)."
        )
        
    # Priority 6: Product Strategy, Roadmap & Internal Operations
    else:
        roadmap_keywords = ["roadmap", "sprint planning", "competitive", "win/loss", "quarterly planning", "all hands"]
        category = "Product Strategy, Roadmap & Internal Operations"
        confidence = calculate_dynamic_confidence(roadmap_keywords, title, topics, summary, call_type, expected_call_type="Internal Engineering & Exec")
        reasoning = (
            "Internal engineering sync, sprint planning, competitive landscape review, or cross-functional roadmap prioritization."
        )
        
    trace_entry = {
        "node": "SemanticCategorizationAgent",
        "status": "completed",
        "details": f"Assigned Category: '{category}' (Dynamic Confidence: {confidence:.2f})"
    }
    
    current_traces = list(state.get("pipeline_trace", []))
    current_traces.append(trace_entry)
    
    return {
        "category": category,
        "secondary_category": secondary,
        "category_reasoning": reasoning,
        "category_confidence": confidence,
        "pipeline_trace": current_traces
    }
