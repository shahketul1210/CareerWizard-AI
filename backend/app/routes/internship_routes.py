from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List

from app.db.database import get_db
from app.core.auth import get_current_user_optional
from app.models.user import User
from app.models.internship_track import InternshipTrack
from app.models.internship_plan import InternshipPlan
from app.schemas.internship_schema import (
    TaskSubmitRequest,
    EnrollRequest,
    ProjectCreateRequest,
    NoteSaveRequest
)
from app.services import internship_service

router = APIRouter(prefix="/internship", tags=["Internship Portal"])

def resolve_user(db: Session, auth_user: Optional[User]) -> User:
    """Returns the authenticated user, or falls back to first student user in DB."""
    if auth_user:
        return auth_user
    # Fallback to het or first user in db
    user = db.query(User).filter(User.email.ilike("%het%")).first()
    if not user:
        user = db.query(User).first()
    if not user:
        import uuid
        user = User(
            id=uuid.uuid4(),
            email="student@careerwizard.ai",
            password_hash="mock_hash",
            full_name="Het Panchal",
            role="student"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@router.get("/overview")
def get_overview(
    day: Optional[int] = Query(None, description="Selected day to view"),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    user = resolve_user(db, current_user)
    return internship_service.get_dashboard_overview(db, user, requested_day=day)


@router.get("/tasks")
def list_tasks(
    filter: str = Query("all", description="Filter tasks: all, completed, active, ml, deeplearning, deployment"),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    user = resolve_user(db, current_user)
    return internship_service.get_all_tasks(db, user, filter_type=filter)


@router.post("/tasks/submit")
def submit_task(
    payload: TaskSubmitRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    user = resolve_user(db, current_user)
    if not payload.github_url or not payload.github_url.startswith("http"):
        raise HTTPException(status_code=400, detail="Please provide a valid GitHub repository URL")
    
    return internship_service.submit_task_solution(
        db,
        user,
        day_number=payload.day_number,
        github_url=payload.github_url,
        difficulty_chosen=payload.difficulty_chosen,
        task_id=payload.task_id
    )


@router.get("/learning")
def list_learning_days(
    db: Session = Depends(get_db)
):
    return internship_service.get_all_learning_days(db)


@router.get("/learning/{day}")
def get_learning_day_detail(
    day: int,
    level: str = Query("intermediate", description="Difficulty level: beginner, intermediate, advanced"),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    user = resolve_user(db, current_user)
    return internship_service.get_learning_content_for_day(db, user, day=day, level=level)


@router.post("/learning/{day}/notes")
def save_study_notes(
    day: int,
    payload: NoteSaveRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    user = resolve_user(db, current_user)
    return internship_service.save_user_study_notes(db, user, day=day, notes=payload.notes)


@router.get("/projects")
def list_projects(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    user = resolve_user(db, current_user)
    return internship_service.get_user_projects(db, user)


@router.post("/projects")
def create_project(
    payload: ProjectCreateRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    user = resolve_user(db, current_user)
    return internship_service.add_user_project(db, user, payload.dict())


@router.get("/summary")
def get_summary(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    user = resolve_user(db, current_user)
    return internship_service.get_progress_summary(db, user)


@router.get("/resources")
def list_resources(
    db: Session = Depends(get_db)
):
    return internship_service.get_general_resources(db)


@router.get("/certificates")
def list_certificates(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    user = resolve_user(db, current_user)
    return internship_service.get_user_certificates(db, user)


@router.get("/certificates/{cert_code}")
def get_certificate(
    cert_code: str,
    db: Session = Depends(get_db)
):
    cert = internship_service.get_certificate_detail(db, cert_code)
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return cert


@router.post("/enroll")
def enroll(
    payload: EnrollRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    user = resolve_user(db, current_user)
    return internship_service.enroll_in_program(
        db,
        user,
        track_key=payload.track_id or "aiml",
        plan_key=payload.plan_id or "15day",
        difficulty=payload.difficulty_level or "intermediate"
    )


@router.get("/plans")
def list_plans_and_tracks(
    db: Session = Depends(get_db)
):
    tracks = db.query(InternshipTrack).filter_by(is_active=True).all()
    plans = db.query(InternshipPlan).filter_by(is_active=True).all()
    return {
        "tracks": [
            {
                "id": t.track_key,
                "name": t.name,
                "icon": t.icon or "fa-brain",
                "desc": t.description or ""
            }
            for t in tracks
        ],
        "plans": [
            {
                "id": p.plan_key,
                "name": p.name,
                "price": p.price,
                "duration": f"{p.duration_days} Days",
                "popular": p.plan_key == "30day",
                "tag": "Most Popular" if p.plan_key == "30day" else None,
                "features": p.features or []
            }
            for p in plans
        ]
    }
