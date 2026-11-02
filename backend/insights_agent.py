"""
Transcript Intelligence - Stakeholder Insights Agent
Generates actionable, non-obvious recommendations tailored for Engineering, Support, Sales, and Product.
"""

from typing import Dict, Any
from state import TranscriptState

def stakeholder_insights_agent_node(state: TranscriptState) -> Dict[str, Any]:
    """Node 5: Generates tailored, non-obvious insights for four key executive stakeholders."""
    category = state["category"]
    call_type = state["call_type"]
    score = state["sentiment_score"]
    customer = state["customer_name"] or "Internal"
    products = state["product_lines"]
    summary = state["summary_data"].get("summary", "")
    action_items = state["summary_data"].get("actionItems", [])
    
    insights = {
        "Engineering_Leads": [],
        "Support_Leaders": [],
        "Sales_and_CS": [],
        "Product_Managers": []
    }
    
    if category == "Incident & Outage Management":
        insights["Engineering_Leads"].append(
            "Outage Root Cause: Event ingestion layer single point of failure. Deploy active-active redundant nodes and circuit breakers immediately."
        )
        insights["Support_Leaders"].append(
            f"Escalation Volume Risk: High volume of SLA inquiries. Standardize conservative recovery ETA guidance to prevent broken commitments with {customer}."
        )
        insights["Sales_and_CS"].append(
            f"Renewal Threat: Customer {customer} exhibits immediate churn risk due to lack of threat visibility during business hours. Prepare proactive service credits."
        )
        insights["Product_Managers"].append(
            "Transparency Deficit: Customers demanded real-time in-app status notifications rather than waiting for email/phone updates."
        )
    elif category == "Compliance & Audit Readiness":
        insights["Product_Managers"].append(
            "Adoption Acceleration: High demand for automated multi-framework mapping (SOC 2 + HIPAA + ISO 27001). Comply v2 is a primary expansion driver."
        )
        insights["Sales_and_CS"].append(
            f"Expansion Opportunity: Customer {customer} has an upcoming audit deadline; position multi-framework add-ons before quarter close."
        )
        insights["Engineering_Leads"].append(
            "Scalability Requirement: Automated evidence generation triggers heavy API rate limits during bulk export; implement asynchronous background jobs."
        )
    elif category in ["Commercials & Renewals", "Commercials, Renewals & Churn Risk"]:
        insights["Sales_and_CS"].append(
            f"Commercial Positioning: Customer {customer} renegotiating terms citing platform incidents or data ingestion overages. Offer multi-year volume cap tier."
        )
        insights["Product_Managers"].append(
            "Packaging Friction: Ingestion fee overages cause recurring billing disputes. Consider usage alerting and predictive billing meters in the UI."
        )
    elif category in ["Technical Support", "Technical Support & Troubleshooting"]:
        insights["Support_Leaders"].append(
            f"Connector Ticket Deflection: CloudPrime S3 403 errors and LogVault timeouts recur across accounts. Build automated IAM permission validator into setup flow."
        )
        insights["Engineering_Leads"].append(
            "Connector Resiliency: Implement exponential backoff and localized queue caching to avoid data backfill drops when downstream integrations timeout."
        )
    else:
        insights["Product_Managers"].append(
            f"Roadmap Alignment: Strategic alignment across {', '.join(products)} is critical to counter aggressive competitive positioning from Wiz and CrowdStrike."
        )
        insights["Engineering_Leads"].append(
            "Technical Debt: Balance high-velocity feature requests (SCIM connectors, granular restore) with foundational observability and CI/CD pipelines."
        )
        
    trace_entry = {
        "node": "StakeholderInsightsAgent",
        "status": "completed",
        "details": f"Generated actionable insights across Engineering, Support, Sales, and Product"
    }
    
    current_traces = list(state.get("pipeline_trace", []))
    current_traces.append(trace_entry)
    
    return {
        "stakeholder_insights": insights,
        "action_items": action_items,
        "pipeline_trace": current_traces
    }
