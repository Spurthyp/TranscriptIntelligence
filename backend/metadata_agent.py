"""
Transcript Intelligence - Metadata Agent
Extracts operational call channel (Internal vs Support vs AM), client name, and product lines.
"""

import re
from typing import Dict, Any
from state import TranscriptState

def metadata_agent_node(state: TranscriptState) -> Dict[str, Any]:
    """Node 2: Extracts call channel (Internal vs Support vs AM), client name, and impacted products."""
    m_info = state["meeting_info"]
    title = m_info.get("title", "")
    emails = m_info.get("allEmails", [])
    summary = state["summary_data"].get("summary", "")
    topics = state["summary_data"].get("topics", [])
    
    domains = list(set(e.split("@")[-1] for e in emails if "@" in e))
    is_internal = len(domains) == 1 and domains[0] == "aegiscloud.com"
    
    # 1. Operational Call Type
    if "Support Case" in title:
        call_type = "Customer Support"
    elif is_internal:
        call_type = "Internal Engineering & Exec"
    else:
        call_type = "External AM / CS"
        
    # 2. Extract Customer Name
    customer_name = None
    if not is_internal:
        # Pattern 1: Aegis / [Customer Name] - ...
        m = re.search(r"Aegis\s*/\s*([^-–]+)", title)
        if m:
            customer_name = m.group(1).strip()
        # Pattern 2: Support Case #1234 - [Customer Name] ...
        elif "Support Case" in title:
            m = re.search(r"Support Case #\d+\s*-\s*([A-Za-z0-9\s]+?)(?=\s+[A-Z][a-z]+|\s*$)", title)
            if m:
                customer_name = m.group(1).strip()
        # Pattern 3: ESCALATION: [Customer Name] - ... or URGENT: [Customer Name]
        elif "ESCALATION:" in title or "URGENT:" in title:
            m = re.search(r"(?:ESCALATION|URGENT):\s*([^-–]+)", title)
            if m:
                customer_name = m.group(1).strip()
                
    if not customer_name and not is_internal:
        # Fallback to domain name
        ext_domains = [d for d in domains if d != "aegiscloud.com"]
        if ext_domains:
            customer_name = ext_domains[0].split(".")[0].capitalize()
            
    # 3. Detect Product Lines involved
    full_text = f"{title} {summary} {' '.join(topics)}".lower()
    products = []
    if "detect" in full_text or "threat" in full_text or "siem" in full_text or "ingestion" in full_text:
        products.append("Detect")
    if "comply" in full_text or "compliance" in full_text or "soc 2" in full_text or "hipaa" in full_text or "iso 27001" in full_text:
        products.append("Comply")
    if "protect" in full_text or "backup" in full_text or "restore" in full_text or "s3" in full_text or "logvault" in full_text:
        products.append("Protect")
    if "identity" in full_text or "mfa" in full_text or "scim" in full_text or "sso" in full_text or "okta" in full_text:
        products.append("Identity")
    if not products:
        products = ["Core Platform"]
        
    duration = float(m_info.get("duration", 0.0))
    
    trace_entry = {
        "node": "MetadataExtractionNode",
        "status": "completed",
        "details": f"Classified as '{call_type}' | Customer: {customer_name or 'N/A (Internal)'} | Products: {', '.join(products)}"
    }
    
    current_traces = list(state.get("pipeline_trace", []))
    current_traces.append(trace_entry)
    
    return {
        "call_type": call_type,
        "customer_name": customer_name,
        "attendee_domains": domains,
        "duration_minutes": duration,
        "product_lines": products,
        "pipeline_trace": current_traces
    }
