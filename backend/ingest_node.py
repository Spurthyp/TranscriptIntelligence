"""
Transcript Intelligence - Ingest Node
Loads raw JSON meeting files from disk into the LangGraph state.
"""

import os
import json
from typing import Dict, Any
from state import TranscriptState

def ingest_node(state: TranscriptState) -> Dict[str, Any]:
    """Node 1: Ingests raw files from disk for a given transcript ID."""
    t_id = state["transcript_id"]
    base_dir = state.get("dataset_dir", "dataset")
    if not os.path.exists(base_dir):
        fallback = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dataset")
        if os.path.exists(fallback):
            base_dir = fallback
    folder = os.path.join(base_dir, t_id)
    
    meeting_info = {}
    summary_data = {}
    speaker_meta = {}
    events = []
    turns = []
    
    m_path = os.path.join(folder, "meeting-info.json")
    if os.path.exists(m_path):
        with open(m_path, "r", encoding="utf-8") as f:
            meeting_info = json.load(f)
            
    s_path = os.path.join(folder, "summary.json")
    if os.path.exists(s_path):
        with open(s_path, "r", encoding="utf-8") as f:
            summary_data = json.load(f)
            
    spk_path = os.path.join(folder, "speaker-meta.json")
    if os.path.exists(spk_path):
        with open(spk_path, "r", encoding="utf-8") as f:
            speaker_meta = json.load(f)
            
    ev_path = os.path.join(folder, "events.json")
    if os.path.exists(ev_path):
        with open(ev_path, "r", encoding="utf-8") as f:
            events = json.load(f)
            
    tr_path = os.path.join(folder, "transcript.json")
    if os.path.exists(tr_path):
        with open(tr_path, "r", encoding="utf-8") as f:
            tr_content = json.load(f)
            turns = tr_content.get("data", [])
            
    trace_entry = {
        "node": "IngestNode",
        "status": "completed",
        "details": f"Loaded {len(turns)} transcript utterances, metadata for {meeting_info.get('title', 'Unknown')}"
    }
    
    current_traces = list(state.get("pipeline_trace", []))
    current_traces.append(trace_entry)
    
    return {
        "meeting_info": meeting_info,
        "summary_data": summary_data,
        "speaker_meta": speaker_meta,
        "events": events,
        "transcript_turns": turns,
        "pipeline_trace": current_traces
    }
