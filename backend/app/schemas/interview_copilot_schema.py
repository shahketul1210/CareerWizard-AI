from typing import List, Optional, Dict, Any, Union
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel

class InterviewSessionCreate(BaseModel):
    role: str
    company_name: Optional[str] = None
    seniority_level: str = "Mid-Level"
    interview_type: str = "Technical"  # Technical, Behavioral, System Design, Mixed
    job_description: Optional[str] = None
    resume_context: Optional[str] = None
    total_questions: int = 5

class InterviewMessageResponse(BaseModel):
    id: Union[UUID, str]
    session_id: Union[UUID, str]
    role: str  # "interviewer" or "candidate"
    content: str
    question_index: int
    audio_url: Optional[str] = None
    evaluation: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class InterviewSessionResponse(BaseModel):
    id: Union[UUID, str]
    user_id: Optional[Union[UUID, str]] = None
    role: str
    company_name: Optional[str] = None
    seniority_level: str
    interview_type: str
    job_description: Optional[str] = None
    resume_context: Optional[str] = None
    total_questions: int
    current_question_index: int
    status: str
    overall_score: Optional[int] = None
    evaluation_report: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    messages: Optional[List[InterviewMessageResponse]] = []

    class Config:
        from_attributes = True

class InterviewSessionSummary(BaseModel):
    id: Union[UUID, str]
    role: str
    company_name: Optional[str] = None
    seniority_level: str
    interview_type: str
    total_questions: int
    current_question_index: int
    status: str
    overall_score: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class SubmitAnswerRequest(BaseModel):
    answer_text: Optional[str] = None

class SubmitAnswerResponse(BaseModel):
    status: str  # "continue" | "completed"
    candidate_message: InterviewMessageResponse
    interviewer_message: Optional[InterviewMessageResponse] = None
    audio_base64: Optional[str] = None
    evaluation_report: Optional[Dict[str, Any]] = None

class CreateSessionResponse(BaseModel):
    session: InterviewSessionResponse
    first_message: InterviewMessageResponse
    audio_base64: Optional[str] = None

class TtsRequest(BaseModel):
    text: str
    voice: Optional[str] = None
