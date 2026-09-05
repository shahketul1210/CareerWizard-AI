from typing import List, Optional, Union
from uuid import UUID
from pydantic import BaseModel, field_validator
from datetime import datetime

class InterviewCreate(BaseModel):
    domain: str
    sub_domain: Optional[str] = None
    difficulty: str
    category: str
    question_text: str
    model_answer: Optional[str] = None
    star_example: Optional[str] = None
    tags: Optional[List[str]] = None
    companies: Optional[List[str]] = None

class InterviewResponse(BaseModel):
    id: Union[UUID, str]
    domain: str
    sub_domain: Optional[str] = None
    difficulty: str
    category: str
    question_text: str
    model_answer: Optional[str] = None
    star_example: Optional[str] = None
    tags: Optional[List[str]] = None
    companies: Optional[List[str]] = None
    is_active: bool
    created_at: datetime

    @field_validator("tags", mode="before")
    @classmethod
    def parse_tags(cls, v):
        if not v:
            return []
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            v_clean = v.strip("{}[] \t\r\n")
            if not v_clean:
                return []
            return [t.strip().strip('"\'') for t in v_clean.split(",") if t.strip()]
        return []

    class Config:
        from_attributes = True

# Also schema for Interview Progress (User-wise)
class InterviewProgressUpdate(BaseModel):
    status: str
    student_notes: Optional[str] = None

class InterviewProgressResponse(BaseModel):
    id: Union[UUID, str]
    student_id: Union[UUID, str]
    question_id: Union[UUID, str]
    status: str
    student_notes: Optional[str] = None
    ai_answer_generated: bool
    practiced_count: int
    last_practiced: Optional[datetime] = None

    class Config:
        from_attributes = True
