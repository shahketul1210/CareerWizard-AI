import uuid
from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class InterviewCopilotSession(Base):
    __tablename__ = "interview_copilot_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    role = Column(String(100), nullable=False)
    company_name = Column(String(100), nullable=True)
    seniority_level = Column(String(50), nullable=False, default="Mid-Level")
    interview_type = Column(String(50), nullable=False, default="Technical")
    job_description = Column(Text, nullable=True)
    resume_context = Column(Text, nullable=True)
    total_questions = Column(Integer, default=5, nullable=False)
    current_question_index = Column(Integer, default=0, nullable=False)
    status = Column(String(30), default="in_progress", nullable=False)  # in_progress, completed, cancelled
    overall_score = Column(Integer, nullable=True)
    evaluation_report = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=func.now(), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now(), nullable=True)

    messages = relationship(
        "InterviewCopilotMessage",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="InterviewCopilotMessage.created_at"
    )
    user = relationship("User")


class InterviewCopilotMessage(Base):
    __tablename__ = "interview_copilot_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("interview_copilot_sessions.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False)  # "interviewer" or "candidate"
    content = Column(Text, nullable=False)
    question_index = Column(Integer, default=0, nullable=False)
    audio_url = Column(String(500), nullable=True)
    evaluation = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=func.now(), server_default=func.now(), nullable=False)

    session = relationship("InterviewCopilotSession", back_populates="messages")
