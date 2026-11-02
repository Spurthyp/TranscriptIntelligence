"""
Transcript Intelligence - Pipeline State Definition
Defines the shared state dictionary passed between LangGraph nodes.
"""

from typing import TypedDict, List, Dict, Any, Optional

class TranscriptState(TypedDict):
    # Ingestion inputs
    transcript_id: str
    dataset_dir: str
    meeting_info: Dict[str, Any]
    summary_data: Dict[str, Any]
    speaker_meta: Dict[str, str]
    events: List[Dict[str, Any]]
    transcript_turns: List[Dict[str, Any]]
    
    # Metadata Agent output
    call_type: str                  # 'Customer Support', 'External AM / CS', 'Internal Engineering & Exec'
    customer_name: Optional[str]    # Extracted client organization (e.g. 'Blackridge Investments')
    attendee_domains: List[str]
    duration_minutes: float
    product_lines: List[str]        # ['Detect', 'Comply', 'Protect', 'Identity']
    
    # Semantic Categorization Agent output
    category: str                   # Primary business category
    secondary_category: Optional[str]
    category_reasoning: str         # Detailed justification for the category
    category_confidence: float      # Dynamic confidence score (0.0 - 1.0)
    
    # Sentiment & Risk Agent output
    sentiment_label: str            # 'very-positive', 'positive', 'mixed-positive', etc.
    sentiment_score: float          # 1.0 - 5.0
    churn_risk: str                 # 'Critical', 'High', 'Medium', 'Low'
    friction_points: List[str]
    positive_pivots: List[str]
    
    # Stakeholder Insights Agent output
    stakeholder_insights: Dict[str, List[str]] # Insights for 'Engineering', 'Support', 'Sales', 'Product'
    action_items: List[str]
    pipeline_trace: List[Dict[str, Any]]       # Execution audit log across nodes
