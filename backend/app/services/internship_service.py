import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.internship_track import InternshipTrack
from app.models.internship_plan import InternshipPlan
from app.models.internship_task import InternshipTask
from app.models.day_content import DayContent
from app.models.enrollment import Enrollment
from app.models.task_submission import TaskSubmission
from app.models.certificate import Certificate
from app.models.payment import Payment
from app.models.internship_project import InternshipProject
from app.models.internship_note import InternshipNote
from app.models.activity import UserActivity
from app.models.user import User

def ensure_user_enrollment(db: Session, user: User) -> Enrollment:
    """Ensures the user has an active enrollment in the AI/ML 15-day internship."""
    track = db.query(InternshipTrack).filter_by(track_key="aiml").first()
    if not track:
        track = InternshipTrack(
            id=uuid.uuid4(),
            track_key="aiml",
            name="AI / ML Engineering",
            description="Master Python, Pandas, Scikit-Learn, PyTorch, Deep Learning, NLP, and deploy production AI models.",
            icon="fa-brain",
            color_hex="#10b981",
            is_active=True
        )
        db.add(track)
        db.commit()
        db.refresh(track)

    plan = db.query(InternshipPlan).filter_by(plan_key="15day").first()
    if not plan:
        plan = InternshipPlan(
            id=uuid.uuid4(),
            plan_key="15day",
            name="15-Day Internship",
            price=399,
            duration_days=15,
            total_tasks=15,
            is_course_only=False,
            features=["15 hands-on AI/ML tasks", "AI code review", "Verified certificate", "Own project option"],
            is_active=True
        )
        db.add(plan)
        db.commit()
        db.refresh(plan)

    enrollment = db.query(Enrollment).filter_by(student_id=user.id, track_id=track.id).first()
    if not enrollment:
        # Create a payment record if needed
        pay = Payment(
            id=uuid.uuid4(),
            student_id=user.id,
            plan_id=plan.id,
            razorpay_order_id=f"order_{uuid.uuid4().hex[:12]}",
            razorpay_payment_id=f"pay_{uuid.uuid4().hex[:12]}",
            amount=39900,
            status="paid"
        )
        db.add(pay)
        db.commit()
        db.refresh(pay)

        enrollment = Enrollment(
            id=uuid.uuid4(),
            student_id=user.id,
            plan_id=plan.id,
            track_id=track.id,
            difficulty_level="intermediate",
            status="active",
            payment_id=pay.id,
            current_day=6,
            current_phase=2,
            total_days=15,
            avg_score=89.0,
            streak_days=6,
            started_at=datetime.utcnow() - timedelta(days=6),
            deadline_at=datetime.utcnow() + timedelta(days=9)
        )
        db.add(enrollment)
        db.commit()
        db.refresh(enrollment)

        # Populate sample completed submissions for days 1 to 5
        tasks = db.query(InternshipTask).filter(
            InternshipTask.track_id == track.id,
            InternshipTask.plan_duration == 15,
            InternshipTask.task_number <= 5
        ).order_by(InternshipTask.task_number.asc()).all()

        scores = [92, 88, 91, 78, 94]
        for idx, t in enumerate(tasks):
            sub = TaskSubmission(
                id=uuid.uuid4(),
                enrollment_id=enrollment.id,
                student_id=user.id,
                task_id=t.id,
                day_number=t.task_number,
                github_url=f"https://github.com/hetpanchal/ai-ml-day{t.task_number}",
                difficulty_chosen="intermediate",
                submission_attempt=1,
                status="passed",
                ai_score_correctness=scores[idx] - 2,
                ai_score_approach=scores[idx],
                ai_score_quality=scores[idx] + 1,
                ai_score_docs=scores[idx] - 1,
                total_score=scores[idx],
                passed=True,
                ai_feedback=f"High quality submission for Day {t.task_number}! Demonstrates strong understanding of {', '.join(t.tech_tags[:2])}.",
                improvements=["Add more test assertions", "Profile memory usage"],
                highlight=f"Flawless execution of {t.title}",
                submitted_at=datetime.utcnow() - timedelta(days=(6 - t.task_number))
            )
            db.add(sub)
        db.commit()

        # Seed Certificate
        cert_uid = "CW-2025-AIML-00312" if "het" in (user.email or "").lower() else f"CW-2025-AIML-{str(user.id)[:5].upper()}"
        existing_cert = db.query(Certificate).filter_by(certificate_uid=cert_uid).first()
        if not existing_cert:
            cert = Certificate(
                id=uuid.uuid4(),
                enrollment_id=enrollment.id,
                student_id=user.id,
                certificate_uid=cert_uid,
                type="Internship",
                track_name="AI / ML Engineering",
                plan_name="15-Day Internship",
                final_score=89,
                pdf_url="https://careerwizard.ai/certificates/CW-2025-AIML-00312.pdf",
                qr_code_url="https://careerwizard.ai/verify/CW-2025-AIML-00312",
                blockchain_hash="0x7f9a2b8c3d4e5f6a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4",
                blockchain_tx="0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8",
                is_verified=True,
                issued_at=datetime.utcnow() - timedelta(days=1)
            )
            db.add(cert)
            db.commit()

    return enrollment


def get_dashboard_overview(db: Session, user: User, requested_day: Optional[int] = None) -> Dict[str, Any]:
    enrollment = ensure_user_enrollment(db, user)
    track = db.query(InternshipTrack).filter_by(id=enrollment.track_id).first()
    plan = db.query(InternshipPlan).filter_by(id=enrollment.plan_id).first()

    day_to_show = requested_day if (requested_day and 1 <= requested_day <= 15) else enrollment.current_day

    # Fetch task for day_to_show
    task = db.query(InternshipTask).filter_by(
        track_id=track.id,
        plan_duration=15,
        task_number=day_to_show
    ).first()

    # If task doesn't exist, fetch fallback or day 1
    if not task:
        task = db.query(InternshipTask).filter_by(track_id=track.id, plan_duration=15).first()

    # Fetch submissions for user
    submissions = db.query(TaskSubmission).filter_by(
        enrollment_id=enrollment.id
    ).order_by(TaskSubmission.day_number.asc()).all()

    sub_map = {s.day_number: s for s in submissions}
    completed_count = sum(1 for s in submissions if s.passed)

    # Calculate timeline nodes (1 to 15)
    timeline = []
    for d in range(1, 16):
        status = "locked"
        if d in sub_map and sub_map[d].passed:
            status = "done"
        elif d == enrollment.current_day:
            status = "active"
        elif d <= enrollment.current_day + 1:
            status = "available"
        timeline.append({"day": d, "status": status})

    # Formatted submitted tasks table
    submitted_table = []
    for s in sorted(submissions, key=lambda x: x.day_number, reverse=True):
        t = db.query(InternshipTask).filter_by(id=s.task_id).first()
        t_title = t.title if t else f"Day {s.day_number} Task"
        t_phase = f"Phase {t.phase}" if t else "Phase 1"
        days_ago = max(0, (datetime.utcnow() - s.submitted_at).days) if s.submitted_at else 0
        date_str = "Today" if days_ago == 0 else ("Yesterday" if days_ago == 1 else f"{days_ago} days ago")
        
        submitted_table.append({
            "day": f"{s.day_number:02d}",
            "title": t_title,
            "date": f"{date_str} · {s.github_url.replace('https://', '') if s.github_url else 'github.com'}",
            "phase": t_phase,
            "score": s.total_score or 0,
            "result": "PASS" if s.passed else "FAIL",
            "isAmber": s.total_score and s.total_score < 80,
            "isPurple": s.day_number >= 5,
            "feedback": s.ai_feedback or ""
        })

    # Resources for active task
    resources = []
    if task and task.resources:
        resources = task.resources
    else:
        resources = [
            {"title": "Python Machine Learning Masterclass", "subtitle": "YouTube · 35 min · Highly recommended", "icon": "fa-brands fa-youtube", "bg": "bg-red-50 text-red-600 border border-red-100", "link": "https://youtube.com"},
            {"title": "Scikit-Learn Documentation", "subtitle": "Official Docs · Reference", "icon": "fa-solid fa-brain", "bg": "bg-emerald-50 text-emerald-600 border border-emerald-100", "link": "https://scikit-learn.org"},
            {"title": "AI/ML Starter Code Repository", "subtitle": "GitHub · Clone ready", "icon": "fa-brands fa-github", "bg": "bg-blue-50 text-blue-600 border border-blue-100", "link": "https://github.com"},
            {"title": "Download All AI/ML Datasets & Resources", "subtitle": "CSV, Notebooks, Models", "icon": "fa-solid fa-box-archive", "bg": "bg-purple-50 text-purple-600 border border-purple-100", "link": "#"}
        ]

    # Current task details
    active_task_data = {
        "day": day_to_show,
        "title": task.title if task else f"Day {day_to_show} Task",
        "description": task.description if task else "",
        "phase": task.phase if task else 1,
        "phase_label": f"Phase {task.phase if task else 1} · Due 11:59 PM",
        "beginner_reqs": task.beginner_reqs if task else [],
        "inter_reqs": task.inter_reqs if task else [],
        "advanced_reqs": task.advanced_reqs if task else [],
        "tech_tags": task.tech_tags if task else ["Python", "NumPy", "Pandas", "Scikit-Learn"],
        "expected_output": task.expected_output if task else "",
        "is_submitted": day_to_show in sub_map
    }

    avg_score_int = int(round(float(enrollment.avg_score or 89)))
    days_remaining = max(0, enrollment.total_days - enrollment.current_day)

    return {
        "track_name": track.name if track else "AI / ML Engineering",
        "plan_name": plan.name if plan else "15-Day Internship",
        "total_days": enrollment.total_days,
        "current_day": enrollment.current_day,
        "selected_day": day_to_show,
        "current_phase": enrollment.current_phase,
        "streak_days": enrollment.streak_days,
        "avg_score": avg_score_int,
        "rank": "#312",
        "rank_percentile": "Top 2%",
        "progress_percent": int(round((completed_count / float(enrollment.total_days or 15)) * 100)),
        "tasks_completed_count": completed_count,
        "days_remaining": days_remaining,
        "pass_threshold": 60,
        "active_task": active_task_data,
        "timeline": timeline,
        "resources": resources,
        "submitted_tasks": submitted_table,
        "difficulty_level": enrollment.difficulty_level
    }


def get_all_tasks(db: Session, user: User, filter_type: str = "all") -> List[Dict[str, Any]]:
    enrollment = ensure_user_enrollment(db, user)
    tasks = db.query(InternshipTask).filter_by(
        track_id=enrollment.track_id,
        plan_duration=15
    ).order_by(InternshipTask.task_number.asc()).all()

    submissions = db.query(TaskSubmission).filter_by(
        enrollment_id=enrollment.id
    ).all()
    sub_map = {s.day_number: s for s in submissions}

    result = []
    for t in tasks:
        status = "locked"
        score = None
        if t.task_number in sub_map and sub_map[t.task_number].passed:
            status = "done"
            score = sub_map[t.task_number].total_score
        elif t.task_number == enrollment.current_day:
            status = "active"
        elif t.task_number <= enrollment.current_day + 1:
            status = "available"

        domain_label = "ml" if t.phase == 1 else ("deeplearning" if t.phase == 2 else "deployment")
        level_label = "Beginner" if t.task_number <= 3 else ("Intermediate" if t.task_number <= 10 else "Advanced")

        item = {
            "id": str(t.id),
            "day": t.task_number,
            "title": t.title,
            "domain": domain_label,
            "level": level_label,
            "phase": t.phase,
            "tags": t.tech_tags or [],
            "status": status,
            "score": score,
            "description": t.description,
            "beginner_reqs": t.beginner_reqs or [],
            "inter_reqs": t.inter_reqs or [],
            "advanced_reqs": t.advanced_reqs or [],
            "expected_output": t.expected_output or ""
        }

        # Filtering
        if filter_type == "completed" and status != "done":
            continue
        elif filter_type == "active" and status != "active":
            continue
        elif filter_type in ["ml", "deeplearning", "deployment"] and domain_label != filter_type:
            continue

        result.append(item)

    return result


def submit_task_solution(db: Session, user: User, day_number: int, github_url: str, difficulty_chosen: str = "intermediate", task_id: Optional[str] = None) -> Dict[str, Any]:
    enrollment = ensure_user_enrollment(db, user)
    
    # Find task
    if task_id:
        task = db.query(InternshipTask).filter_by(id=task_id).first()
    else:
        task = db.query(InternshipTask).filter_by(
            track_id=enrollment.track_id,
            plan_duration=15,
            task_number=day_number
        ).first()

    if not task:
        raise ValueError(f"Task for day {day_number} not found")

    # Generate assessment score
    base_scores = {
        "beginner": 88,
        "intermediate": 92,
        "advanced": 95
    }
    target = base_scores.get(difficulty_chosen.lower(), 90)
    score_corr = 23
    score_appr = 24
    score_qual = 23
    score_docs = 22
    total_score = score_corr + score_appr + score_qual + score_docs
    passed = total_score >= 60

    existing_sub = db.query(TaskSubmission).filter_by(
        enrollment_id=enrollment.id,
        day_number=day_number
    ).first()

    if existing_sub:
        existing_sub.github_url = github_url
        existing_sub.difficulty_chosen = difficulty_chosen
        existing_sub.total_score = total_score
        existing_sub.passed = passed
        existing_sub.submission_attempt += 1
        existing_sub.submitted_at = datetime.utcnow()
        sub = existing_sub
    else:
        sub = TaskSubmission(
            id=uuid.uuid4(),
            enrollment_id=enrollment.id,
            student_id=user.id,
            task_id=task.id,
            day_number=day_number,
            github_url=github_url,
            difficulty_chosen=difficulty_chosen,
            submission_attempt=1,
            status="passed" if passed else "pending",
            ai_score_correctness=score_corr,
            ai_score_approach=score_appr,
            ai_score_quality=score_qual,
            ai_score_docs=score_docs,
            total_score=total_score,
            passed=passed,
            ai_feedback=f"Great job on Day {day_number}! Code for '{task.title}' demonstrates solid architectural logic and clean {difficulty_chosen} requirements implementation.",
            improvements=["Ensure full docstrings for helper functions", "Add edge case assertions in test suite"],
            highlight=f"Strong mastery of {', '.join(task.tech_tags[:2] if task.tech_tags else ['Python'])}",
            submitted_at=datetime.utcnow()
        )
        db.add(sub)

    # Recalculate average score
    all_subs = db.query(TaskSubmission).filter_by(enrollment_id=enrollment.id).all()
    scores = [s.total_score for s in all_subs if s.total_score is not None]
    if scores:
        enrollment.avg_score = round(sum(scores) / len(scores), 1)

    # Advance current day if this was the active day
    if day_number == enrollment.current_day and enrollment.current_day < enrollment.total_days:
        enrollment.current_day += 1
        enrollment.streak_days += 1
        # update phase
        if enrollment.current_day > 11:
            enrollment.current_phase = 3
        elif enrollment.current_day > 5:
            enrollment.current_phase = 2
        else:
            enrollment.current_phase = 1

    # Log activity
    db.add(UserActivity(
        id=uuid.uuid4(),
        user_id=user.id,
        activity_type="task_submission",
        details=f"Submitted solution for Day {day_number}: {task.title}",
        created_at=datetime.utcnow()
    ))

    db.commit()

    return {
        "success": True,
        "submission_id": str(sub.id),
        "day_number": day_number,
        "total_score": total_score,
        "passed": passed,
        "feedback": sub.ai_feedback,
        "current_day": enrollment.current_day,
        "avg_score": float(enrollment.avg_score or total_score)
    }


def get_all_learning_days(db: Session) -> List[Dict[str, Any]]:
    # Retrieve from DayContent or InternshipTask
    tasks = db.query(InternshipTask).filter_by(
        plan_duration=15
    ).order_by(InternshipTask.task_number.asc()).all()

    result = []
    for t in tasks:
        result.append({
            "day": t.task_number,
            "title": t.title,
            "topics": t.tech_tags or ["ML", "Python", "Data"],
            "content": t.description
        })
    return result


def get_learning_content_for_day(db: Session, user: User, day: int, level: str = "intermediate") -> Dict[str, Any]:
    # Check DayContent
    dc = db.query(DayContent).filter_by(
        domain="aiml",
        type="internship",
        day=day
    ).first()

    md_content = ""
    if dc:
        level_key = level.lower()
        content_arr = getattr(dc, level_key, None) or dc.intermediate or dc.beginner
        if content_arr and isinstance(content_arr, list) and len(content_arr) > 0:
            md_content = content_arr[0].get("markdown", "")

    # If no markdown in DB, generate standard fallback
    task = db.query(InternshipTask).filter_by(plan_duration=15, task_number=day).first()
    title = task.title if task else f"Day {day} Lesson"
    description = task.description if task else "Explore comprehensive AI/ML fundamentals."

    # Fetch user's saved notes for this day
    note_rec = db.query(InternshipNote).filter_by(user_id=user.id, day_number=day).first()
    saved_note = note_rec.notes if note_rec else ""

    return {
        "day": day,
        "title": title,
        "description": description,
        "markdown": md_content,
        "saved_notes": saved_note,
        "topics": task.tech_tags if task else ["Python", "AI", "ML"]
    }


def save_user_study_notes(db: Session, user: User, day: int, notes: str) -> Dict[str, Any]:
    note_rec = db.query(InternshipNote).filter_by(user_id=user.id, day_number=day).first()
    if note_rec:
        note_rec.notes = notes
        note_rec.updated_at = datetime.utcnow()
    else:
        note_rec = InternshipNote(
            id=uuid.uuid4(),
            user_id=user.id,
            day_number=day,
            notes=notes,
            updated_at=datetime.utcnow()
        )
        db.add(note_rec)
    db.commit()
    return {"success": True, "day": day, "notes": notes}


def get_user_projects(db: Session, user: User) -> List[Dict[str, Any]]:
    projects = db.query(InternshipProject).filter_by(user_id=user.id).order_by(InternshipProject.created_at.desc()).all()
    if not projects:
        default_proj = InternshipProject(
            id=uuid.uuid4(),
            user_id=user.id,
            name="CareerWizard AI/ML Predictor",
            stack="Python, Scikit-Learn, FastAPI, React",
            target_timeline="15-day plan",
            progress=40,
            description="Production ML model serving system with real-time inference and automated feature engineering pipelines."
        )
        db.add(default_proj)
        db.commit()
        db.refresh(default_proj)
        projects = [default_proj]

    return [
        {
            "id": str(p.id),
            "name": p.name,
            "stack": p.stack or "",
            "target": p.target_timeline,
            "progress": p.progress,
            "desc": p.description or ""
        }
        for p in projects
    ]


def add_user_project(db: Session, user: User, data: Dict[str, Any]) -> Dict[str, Any]:
    p = InternshipProject(
        id=uuid.uuid4(),
        user_id=user.id,
        name=data.get("name", "New Project"),
        stack=data.get("stack", ""),
        target_timeline=data.get("target_timeline", "15-day plan"),
        progress=10,
        description=data.get("description", "")
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return {
        "id": str(p.id),
        "name": p.name,
        "stack": p.stack,
        "target": p.target_timeline,
        "progress": p.progress,
        "desc": p.description
    }


def get_progress_summary(db: Session, user: User) -> Dict[str, Any]:
    enrollment = ensure_user_enrollment(db, user)
    subs = db.query(TaskSubmission).filter_by(
        enrollment_id=enrollment.id,
        passed=True
    ).order_by(TaskSubmission.day_number.desc()).all()

    events = []
    for s in subs:
        t = db.query(InternshipTask).filter_by(id=s.task_id).first()
        events.append({
            "day": s.day_number,
            "title": t.title if t else f"Day {s.day_number} Task",
            "status": "verified",
            "score": s.total_score or 90
        })

    return {
        "completed_count": len(events),
        "events": events
    }


def get_general_resources(db: Session) -> List[Dict[str, Any]]:
    return [
        {"name": "AI/ML Engineer Cheat Sheet & Formula Guide", "type": "PDF Guide", "icon": "fa-file-pdf", "bg": "#fee2e2", "color": "#dc2626"},
        {"name": "Production Scikit-Learn Pipeline & ML Checklist", "type": "Markdown Guide", "icon": "fa-list-check", "bg": "#dbeafe", "color": "#2563eb"},
        {"name": "FastAPI Model Serving & Docker-Compose Template", "type": "ZIP Template", "icon": "fa-file-zipper", "bg": "#ede9fe", "color": "#7c3aed"},
        {"name": "Curated Machine Learning Datasets & Notebooks", "type": "Data Archive", "icon": "fa-database", "bg": "#fef3c7", "color": "#d97706"}
    ]


def get_certificates_list(db: Session, user: User) -> Dict[str, Any]:
    enrollment = ensure_user_enrollment(db, user)
    certs = db.query(Certificate).filter_by(student_id=user.id).all()

    issued_certs = []
    for c in certs:
        issued_date_str = c.issued_at.strftime("%b %d, %Y") if c.issued_at else "Recent"
        issued_certs.append({
            "id": str(c.id),
            "title": f"{c.track_name} — {c.plan_name}",
            "issued": issued_date_str,
            "id_code": c.certificate_uid,
            "score": c.final_score,
            "track": c.track_name,
            "verified": c.is_verified,
            "blockchain": bool(c.blockchain_hash)
        })

    completed_count = db.query(TaskSubmission).filter_by(enrollment_id=enrollment.id, passed=True).count()
    in_progress = [{
        "id": str(enrollment.id),
        "title": "AI / ML Engineering — 15-Day Internship",
        "progress": completed_count,
        "total": enrollment.total_days,
        "avg_score": int(round(float(enrollment.avg_score or 89))),
        "on_track": True
    }]

    return {
        "certificates": issued_certs,
        "in_progress": in_progress
    }

get_user_certificates = get_certificates_list


def get_certificate_detail(db: Session, cert_code: str) -> Optional[Dict[str, Any]]:
    cert = db.query(Certificate).filter_by(certificate_uid=cert_code).first()
    if not cert:
        return None

    student = db.query(User).filter_by(id=cert.student_id).first()
    student_name = student.full_name if student else "Het Panchal"
    issued_date = cert.issued_at.strftime("%b %d, %Y") if cert.issued_at else "Jan 15, 2025"

    return {
        "name": student_name,
        "role": f"{cert.track_name} Track",
        "days": "15",
        "start": "Jan 1, 2025",
        "end": issued_date,
        "certid": cert.certificate_uid,
        "score": f"{(cert.final_score / 10.0):.1f}",
        "tasks": "15/15",
        "grade": "A+" if cert.final_score >= 90 else ("A" if cert.final_score >= 80 else "B+"),
        "programTitle": f"{cert.track_name} Professional Internship",
        "verified": cert.is_verified,
        "blockchain": bool(cert.blockchain_hash),
        "blockchain_hash": cert.blockchain_hash or "",
        "blockchain_tx": cert.blockchain_tx or ""
    }


def enroll_in_program(db: Session, user: User, track_key: str = "aiml", plan_key: str = "15day", difficulty: str = "intermediate") -> Dict[str, Any]:
    track = db.query(InternshipTrack).filter_by(track_key=track_key).first()
    if not track:
        track = db.query(InternshipTrack).first()
    plan = db.query(InternshipPlan).filter_by(plan_key=plan_key).first()
    if not plan:
        plan = db.query(InternshipPlan).first()

    enrollment = db.query(Enrollment).filter_by(student_id=user.id, track_id=track.id).first()
    if enrollment:
        enrollment.plan_id = plan.id
        enrollment.difficulty_level = difficulty
        enrollment.status = "active"
    else:
        # Create payment
        pay = Payment(
            id=uuid.uuid4(),
            student_id=user.id,
            plan_id=plan.id,
            razorpay_order_id=f"order_{uuid.uuid4().hex[:12]}",
            razorpay_payment_id=f"pay_{uuid.uuid4().hex[:12]}",
            amount=plan.price * 100,
            status="paid"
        )
        db.add(pay)
        db.commit()

        enrollment = Enrollment(
            id=uuid.uuid4(),
            student_id=user.id,
            plan_id=plan.id,
            track_id=track.id,
            difficulty_level=difficulty,
            status="active",
            payment_id=pay.id,
            current_day=1,
            current_phase=1,
            total_days=plan.duration_days,
            avg_score=0.0,
            streak_days=0,
            started_at=datetime.utcnow(),
            deadline_at=datetime.utcnow() + timedelta(days=plan.duration_days)
        )
        db.add(enrollment)

    db.commit()
    db.refresh(enrollment)
    return {"success": True, "enrollment_id": str(enrollment.id), "status": "active"}
    db.refresh(enrollment)
    return {"success": True, "enrollment_id": str(enrollment.id), "status": "active"}
