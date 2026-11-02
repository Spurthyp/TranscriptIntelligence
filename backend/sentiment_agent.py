"""
Transcript Intelligence - Sentiment & Risk Agent
Evaluates sentiment distribution, positive pivots, friction moments, and calculates Churn Risk.
"""

from typing import Dict, Any
from state import TranscriptState

def sentiment_agent_node(state: TranscriptState) -> Dict[str, Any]:
    """Node 4: Evaluates sentiment distribution, churn risk triggers, and friction points."""
    s_data = state["summary_data"]
    score = float(s_data.get("sentimentScore", 3.0))
    label = s_data.get("overallSentiment", "neutral")
    key_moments = s_data.get("keyMoments", [])
    
    friction_points = []
    positive_pivots = []
    has_churn_signal = False
    
    for km in key_moments:
        m_type = km.get("type", "")
        m_text = km.get("text", "")
        if m_type in ["churn_signal", "technical_issue", "concern", "sla_breach"]:
            friction_points.append(f"[{km.get('speaker', 'Speaker')}]: {m_text}")
        if m_type == "churn_signal":
            has_churn_signal = True
        elif m_type in ["positive_pivot", "resolution", "feature_validation", "agreement"]:
            positive_pivots.append(f"[{km.get('speaker', 'Speaker')}]: {m_text}")
            
    # Compute Churn Risk level
    if has_churn_signal or score < 2.0:
        churn_risk = "Critical"
    elif score <= 2.8:
        churn_risk = "High"
    elif score <= 3.6:
        churn_risk = "Medium"
    else:
        churn_risk = "Low"
        
    trace_entry = {
        "node": "SentimentAndRiskAgent",
        "status": "completed",
        "details": f"Sentiment: {label} ({score}/5.0) | Churn Risk: {churn_risk} | Friction: {len(friction_points)} moments"
    }
    
    current_traces = list(state.get("pipeline_trace", []))
    current_traces.append(trace_entry)
    
    return {
        "sentiment_label": label,
        "sentiment_score": score,
        "churn_risk": churn_risk,
        "friction_points": friction_points,
        "positive_pivots": positive_pivots,
        "pipeline_trace": current_traces
    }
