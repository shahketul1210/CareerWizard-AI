import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.core.auth import get_current_user_optional
from app.models.user import User
from app.models.interview_copilot import InterviewCopilotSession, InterviewCopilotMessage
from app.schemas.interview_copilot_schema import (
    InterviewSessionCreate,
    InterviewSessionResponse,
    InterviewSessionSummary,
    CreateSessionResponse,
    SubmitAnswerResponse,
    InterviewMessageResponse,
    TtsRequest
)
from app.services.interview_copilot_service import (
    transcribe_audio_bytes,
    synthesize_speech_bytes,
    synthesize_speech_base64,
    generate_first_question,
    generate_next_turn,
    generate_final_evaluation_report
)

router = APIRouter(prefix="/interview-copilot", tags=["Interview Copilot"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/sessions", response_model=CreateSessionResponse, status_code=status.HTTP_201_CREATED)
def create_session(
    payload: InterviewSessionCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Start a new AI Interview Copilot session."""
    user_id = current_user.id if current_user else None

    # Create session record
    session = InterviewCopilotSession(
        user_id=user_id,
        role=payload.role,
        company_name=payload.company_name,
        seniority_level=payload.seniority_level,
        interview_type=payload.interview_type,
        job_description=payload.job_description,
        resume_context=payload.resume_context,
        total_questions=max(1, min(15, payload.total_questions)),
        current_question_index=1,
        status="in_progress"
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Extract candidate name if available for personalized greeting
    candidate_name = None
    if current_user and current_user.name:
        candidate_name = current_user.name.split()[0]

    # Generate initial question using Gemini
    first_question_text = generate_first_question(
        candidate_name=candidate_name,
        role=session.role,
        company=session.company_name,
        seniority=session.seniority_level,
        interview_type=session.interview_type,
        job_description=session.job_description,
        resume_context=session.resume_context
    )

    # Save first interviewer message
    first_msg = InterviewCopilotMessage(
        session_id=session.id,
        role="interviewer",
        content=first_question_text,
        question_index=1
    )
    db.add(first_msg)
    db.commit()
    db.refresh(first_msg)
    db.refresh(session)

    # Generate Deepgram Aura TTS audio
    audio_b64 = None
    try:
        audio_b64 = synthesize_speech_base64(first_question_text)
    except Exception as e:
        print(f"Initial TTS synthesis warning: {e}")

    return CreateSessionResponse(
        session=InterviewSessionResponse.model_validate(session),
        first_message=InterviewMessageResponse.model_validate(first_msg),
        audio_base64=audio_b64
    )

@router.get("/sessions", response_model=List[InterviewSessionSummary])
def list_sessions(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """List recent interview copilot sessions."""
    query = db.query(InterviewCopilotSession)
    if current_user:
        query = query.filter(InterviewCopilotSession.user_id == current_user.id)
    sessions = query.order_by(InterviewCopilotSession.created_at.desc()).limit(limit).all()
    return [InterviewSessionSummary.model_validate(s) for s in sessions]

@router.get("/sessions/{session_id}", response_model=InterviewSessionResponse)
def get_session(session_id: str, db: Session = Depends(get_db)):
    """Retrieve full session details, transcript history, and evaluation report."""
    try:
        uid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session ID format")

    session = db.query(InterviewCopilotSession).filter(InterviewCopilotSession.id == uid).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    return InterviewSessionResponse.model_validate(session)

@router.post("/sessions/{session_id}/answer", response_model=SubmitAnswerResponse)
async def submit_answer(
    session_id: str,
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Submit candidate answer via voice audio recording or text fallback."""
    try:
        uid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session ID format")

    session = db.query(InterviewCopilotSession).filter(InterviewCopilotSession.id == uid).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    if session.status == "completed":
        raise HTTPException(status_code=400, detail="This interview session has already ended.")

    # Determine candidate answer text
    candidate_text = ""
    if file and file.filename:
        try:
            audio_bytes = await file.read()
            content_type = file.content_type or "audio/webm"
            candidate_text = transcribe_audio_bytes(audio_bytes, content_type)
        except Exception as e:
            print(f"Deepgram transcription error or fallback: {e}")
            if text:
                candidate_text = text.strip()
    
    # Fallback to text if audio didn't yield text or wasn't provided
    if not candidate_text and text:
        candidate_text = text.strip()

    if not candidate_text:
        # Gracefully handle empty or inaudible speech without raising 400 error
        empty_reply = "I didn't catch anything there. Whenever you're ready, feel free to speak or continue."
        audio_b64 = None
        try:
            audio_b64 = synthesize_speech_base64(empty_reply)
        except Exception as e:
            print(f"Empty speech TTS error: {e}")

        interviewer_msg = InterviewCopilotMessage(
            session_id=session.id,
            role="interviewer",
            content=empty_reply,
            question_index=session.current_question_index
        )
        db.add(interviewer_msg)
        db.commit()
        db.refresh(interviewer_msg)

        dummy_cand = InterviewCopilotMessage(
            id=uuid.uuid4(),
            session_id=session.id,
            role="candidate",
            content="[Silence or inaudible]",
            question_index=session.current_question_index,
            created_at=interviewer_msg.created_at
        )

        return SubmitAnswerResponse(
            status="continue",
            candidate_message=InterviewMessageResponse.model_validate(dummy_cand),
            interviewer_message=InterviewMessageResponse.model_validate(interviewer_msg),
            audio_base64=audio_b64
        )

    current_q_idx = session.current_question_index

    # Record candidate message
    cand_msg = InterviewCopilotMessage(
        session_id=session.id,
        role="candidate",
        content=candidate_text,
        question_index=current_q_idx
    )
    db.add(cand_msg)
    db.flush()

    # Build history context
    all_messages = (
        db.query(InterviewCopilotMessage)
        .filter(InterviewCopilotMessage.session_id == session.id)
        .order_by(InterviewCopilotMessage.created_at.asc())
        .all()
    )
    history_dicts = [{"role": m.role, "content": m.content, "evaluation": m.evaluation} for m in all_messages]

    # Generate next turn with human-like intelligence
    spoken_reply, micro_eval, turn_meta = generate_next_turn(
        role=session.role,
        company=session.company_name,
        seniority=session.seniority_level,
        interview_type=session.interview_type,
        question_index=current_q_idx,
        total_questions=session.total_questions,
        history=history_dicts,
        job_description=session.job_description,
        resume_context=session.resume_context
    )

    is_substantive = turn_meta.get("is_substantive_turn", True)
    is_closing = turn_meta.get("is_final_closing", False)

    if is_substantive:
        cand_msg.evaluation = micro_eval
        # Only advance question index during substantive topics up to total_questions
        if session.current_question_index < session.total_questions:
            session.current_question_index += 1
    else:
        cand_msg.evaluation = None

    db.flush()

    # Save interviewer response message
    interviewer_msg = InterviewCopilotMessage(
        session_id=session.id,
        role="interviewer",
        content=spoken_reply,
        question_index=session.current_question_index
    )
    db.add(interviewer_msg)
    db.flush()

    # Synthesize natural spoken audio with Deepgram Aura TTS
    audio_b64 = None
    try:
        audio_b64 = synthesize_speech_base64(spoken_reply)
    except Exception as e:
        print(f"TTS synthesis error: {e}")

    # Check if final interview wrap-up
    if is_closing:
        all_messages.append(interviewer_msg)
        full_history = [{"role": m.role, "content": m.content} for m in all_messages]

        report = generate_final_evaluation_report(
            role=session.role,
            company=session.company_name,
            seniority=session.seniority_level,
            interview_type=session.interview_type,
            history=full_history
        )

        session.status = "completed"
        session.overall_score = report.get("overall_score")
        session.evaluation_report = report
        db.commit()
        db.refresh(cand_msg)
        db.refresh(interviewer_msg)

        return SubmitAnswerResponse(
            status="completed",
            candidate_message=InterviewMessageResponse.model_validate(cand_msg),
            interviewer_message=InterviewMessageResponse.model_validate(interviewer_msg),
            audio_base64=audio_b64,
            evaluation_report=report
        )

    db.commit()
    db.refresh(cand_msg)
    db.refresh(interviewer_msg)

    return SubmitAnswerResponse(
        status="continue",
        candidate_message=InterviewMessageResponse.model_validate(cand_msg),
        interviewer_message=InterviewMessageResponse.model_validate(interviewer_msg),
        audio_base64=audio_b64
    )

@router.post("/sessions/{session_id}/end", response_model=InterviewSessionResponse)
def end_session_early(session_id: str, db: Session = Depends(get_db)):
    """End an active session early and produce the evaluation report."""
    try:
        uid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session ID format")

    session = db.query(InterviewCopilotSession).filter(InterviewCopilotSession.id == uid).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    if session.status != "completed":
        all_messages = (
            db.query(InterviewCopilotMessage)
            .filter(InterviewCopilotMessage.session_id == session.id)
            .order_by(InterviewCopilotMessage.created_at.asc())
            .all()
        )
        history = [{"role": m.role, "content": m.content} for m in all_messages]
        report = generate_final_evaluation_report(
            role=session.role,
            company=session.company_name,
            seniority=session.seniority_level,
            interview_type=session.interview_type,
            history=history
        )
        session.status = "completed"
        session.overall_score = report.get("overall_score")
        session.evaluation_report = report
        db.commit()
        db.refresh(session)

    return InterviewSessionResponse.model_validate(session)

@router.post("/transcribe")
async def transcribe_audio_endpoint(file: UploadFile = File(...)):
    """Standalone endpoint to transcribe an audio snippet."""
    audio_bytes = await file.read()
    content_type = file.content_type or "audio/webm"
    transcript = transcribe_audio_bytes(audio_bytes, content_type)
    return {"transcript": transcript}

@router.post("/tts")
def text_to_speech_endpoint(payload: TtsRequest):
    """Standalone endpoint for TTS synthesis returning MP3 audio stream."""
    audio_bytes = synthesize_speech_bytes(payload.text, voice=payload.voice)
    return Response(content=audio_bytes, media_type="audio/mp3")
