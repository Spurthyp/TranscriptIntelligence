"""
Transcript Intelligence - LangGraph Multi-Agent Pipeline
Assembles modular agent nodes into a compiled LangGraph StateGraph.
"""

from typing import Dict, Any
from langgraph.graph import StateGraph, END

# Import shared state
from state import TranscriptState

# Import modular agent nodes from their individual files
from ingest_node import ingest_node
from metadata_agent import metadata_agent_node
from category_agent import categorization_agent_node, calculate_dynamic_confidence
from sentiment_agent import sentiment_agent_node
from insights_agent import stakeholder_insights_agent_node


def build_transcript_pipeline():
    """Builds and compiles the LangGraph StateGraph agent pipeline."""
    graph = StateGraph(TranscriptState)
    
    # Add Nodes
    graph.add_node("ingest", ingest_node)
    graph.add_node("metadata_agent", metadata_agent_node)
    graph.add_node("categorization_agent", categorization_agent_node)
    graph.add_node("sentiment_agent", sentiment_agent_node)
    graph.add_node("insights_agent", stakeholder_insights_agent_node)
    
    # Add Edges (Linear sequential agent workflow)
    graph.set_entry_point("ingest")
    graph.add_edge("ingest", "metadata_agent")
    graph.add_edge("metadata_agent", "categorization_agent")
    graph.add_edge("categorization_agent", "sentiment_agent")
    graph.add_edge("sentiment_agent", "insights_agent")
    graph.add_edge("insights_agent", END)
    
    compiled_app = graph.compile()
    return compiled_app


def run_pipeline_for_id(transcript_id: str, dataset_dir: str = "dataset") -> Dict[str, Any]:
    """Executes the compiled LangGraph pipeline on a single transcript ID."""
    pipeline = build_transcript_pipeline()
    initial_state = {
        "transcript_id": transcript_id,
        "dataset_dir": dataset_dir,
        "meeting_info": {},
        "summary_data": {},
        "speaker_meta": {},
        "events": [],
        "transcript_turns": [],
        "call_type": "",
        "customer_name": None,
        "attendee_domains": [],
        "duration_minutes": 0.0,
        "product_lines": [],
        "category": "",
        "secondary_category": None,
        "category_reasoning": "",
        "category_confidence": 0.0,
        "sentiment_label": "",
        "sentiment_score": 0.0,
        "churn_risk": "Low",
        "friction_points": [],
        "positive_pivots": [],
        "stakeholder_insights": {},
        "action_items": [],
        "pipeline_trace": []
    }
    result = pipeline.invoke(initial_state)
    return result


if __name__ == "__main__":
    import sys
    test_id = sys.argv[1] if len(sys.argv) > 1 else "01KQ38C4101D6774F2F02331"
    print(f"\n🚀 Running Modular LangGraph pipeline on transcript: {test_id}...\n")
    res = run_pipeline_for_id(test_id)
    print("=" * 60)
    print(f"📌 Meeting:     {res['meeting_info'].get('title', 'Unknown')}")
    print(f"📞 Channel:     {res['call_type']}")
    print(f"🎯 Category:    {res['category']} (Confidence: {res['category_confidence']})")
    print(f"💭 Sentiment:   {res['sentiment_label']} ({res['sentiment_score']}/5.0) | Churn Risk: {res['churn_risk']}")
    print("=" * 60)
    print(f"🔍 LangGraph Node Traces ({len(res['pipeline_trace'])} steps):")
    for i, trace in enumerate(res["pipeline_trace"], start=1):
        print(f"  {i}. [{trace['node']}] -> {trace['details']}")
    print("=" * 60 + "\n")
