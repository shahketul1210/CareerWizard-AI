from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class TaskSubmitRequest(BaseModel):
    task_id: Optional[str] = None
    day_number: int
    github_url: str
    difficulty_chosen: str = "intermediate"

class EnrollRequest(BaseModel):
    track_id: Optional[str] = "aiml"
    plan_id: Optional[str] = "15day"
    difficulty_level: Optional[str] = "intermediate"

class ProjectCreateRequest(BaseModel):
    name: str
    stack: Optional[str] = ""
    target_timeline: Optional[str] = "15-day plan"
    description: Optional[str] = ""

class NoteSaveRequest(BaseModel):
    notes: str
