import os
import sys
import csv
import json
import re
import uuid
from datetime import datetime

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.database import engine, SessionLocal, Base
from app.models.user import User
from app.models.user_profile import StudentProfile
from app.models.job import Job, Skill, job_skill_table
from app.models.interview import InterviewQuestion
from app.models.resume import ResumeAnalysis
from app.models.roadmap import Roadmap, SkillProgress
from app.models.activity import UserActivity
from app.models.admin import Admin
from app.models.internship_plan import InternshipPlan
from app.models.internship_track import InternshipTrack
from app.models.internship_task import InternshipTask

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")

def parse_pg_copy_line(line):
    parts = line.rstrip('\r\n').split('\t')
    res = []
    for p in parts:
        if p == r'\N':
            res.append(None)
        else:
            p = p.replace(r'\\', '\\').replace(r'\n', '\n').replace(r'\r', '\r').replace(r'\t', '\t')
            res.append(p)
    return res

def parse_sql_copy_table(sql_path, target_table):
    rows = []
    if not os.path.exists(sql_path):
        return rows
    with open(sql_path, 'r', encoding='utf-8', errors='replace') as fp:
        in_copy = False
        columns = []
        for line in fp:
            if line.startswith(f"COPY public.{target_table} "):
                m = re.match(r'COPY\s+public\.' + target_table + r'\s*\(([^)]+)\)\s+FROM\s+stdin;', line)
                if m:
                    columns = [c.strip() for c in m.group(1).split(',')]
                    in_copy = True
            elif in_copy:
                if line.strip() == r'\.':
                    in_copy = False
                    break
                else:
                    vals = parse_pg_copy_line(line)
                    rows.append(dict(zip(columns, vals)))
    return rows

def parse_csv_table(filename):
    path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(path):
        return []
    with open(path, 'r', encoding='utf-8', errors='replace') as fp:
        return list(csv.DictReader(fp))

def clean_tags(tags_val):
    if not tags_val:
        return []
    if isinstance(tags_val, list):
        return tags_val
    if isinstance(tags_val, str):
        tags_str = tags_val.strip("{}[] \t\r\n")
        if not tags_str:
            return []
        return [t.strip().strip('"\'') for t in tags_str.split(",") if t.strip()]
    return []

def safe_json(val, default=None):
    if not val:
        return default
    if isinstance(val, (dict, list)):
        return val
    try:
        return json.loads(val)
    except Exception:
        return default

def safe_int(val, default=None):
    try:
        return int(val)
    except Exception:
        return default

def safe_datetime(val):
    if not val:
        return datetime.utcnow()
    try:
        return datetime.fromisoformat(val.replace("Z", "+00:00"))
    except Exception:
        try:
            return datetime.strptime(val, "%Y-%m-%d %H:%M:%S")
        except Exception:
            return datetime.utcnow()

def deterministic_uuid(prefix, key):
    return uuid.uuid5(uuid.NAMESPACE_DNS, f"{prefix}_{key}")

def seed_database(force=False):
    print("Ensuring database tables exist...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        jobs_count = db.query(Job).count()
        questions_count = db.query(InterviewQuestion).count()
        if not force and jobs_count > 0 and questions_count > 0:
            print(f"Database already populated ({jobs_count} jobs, {questions_count} questions). Skipping.")
            return

        print("Seeding database from backup files...")
        sql_path = os.path.join(DATA_DIR, "jobrecdb_backup.sql")

        # 1. Seed Skills
        skills_csv = parse_csv_table("skills.csv")
        for row in skills_csv:
            s_id = safe_int(row.get("id"))
            name = row.get("name")
            if s_id and name:
                existing = db.query(Skill).filter(Skill.id == s_id).first()
                if not existing:
                    db.add(Skill(id=s_id, name=name))
        db.commit()
        print(f"Skills seeded: {db.query(Skill).count()}")

        # 2. Seed Jobs
        jobs_csv = parse_csv_table("jobs.csv")
        for row in jobs_csv:
            j_id = safe_int(row.get("id"))
            if not j_id:
                continue
            title_val = row.get("title", "")
            company_val = row.get("company", "")
            location_val = row.get("location", "")
            link_val = row.get("apply_link", "")
            if not link_val or link_val == "#" or not link_val.startswith("http"):
                c_lower = company_val.lower()
                import urllib.parse
                t_encoded = urllib.parse.quote(title_val or "Software Engineer")
                if "microsoft" in c_lower:
                    link_val = f"https://careers.microsoft.com/us/en/search-results?q={t_encoded}"
                elif "google" in c_lower:
                    link_val = f"https://www.google.com/about/careers/applications/jobs/results/?q={t_encoded}"
                elif "amazon" in c_lower:
                    link_val = f"https://www.amazon.jobs/en/search?base_query={t_encoded}"
                elif "meta" in c_lower or "facebook" in c_lower:
                    link_val = f"https://www.metacareers.com/jobs?q={t_encoded}"
                elif "apple" in c_lower:
                    link_val = f"https://jobs.apple.com/en-us/search?search={t_encoded}"
                elif "netflix" in c_lower:
                    link_val = f"https://jobs.netflix.com/search?q={t_encoded}"
                elif "stability" in c_lower:
                    link_val = "https://stability.ai/careers"
                elif "openai" in c_lower:
                    link_val = f"https://openai.com/careers/search?q={t_encoded}"
                elif "flipkart" in c_lower:
                    link_val = "https://www.flipkartcareers.com/#!/searchjobs"
                elif "zomato" in c_lower:
                    link_val = "https://www.zomato.com/careers"
                elif "spotify" in c_lower:
                    link_val = f"https://www.lifeatspotify.com/jobs?q={t_encoded}"
                elif "stripe" in c_lower:
                    link_val = f"https://stripe.com/jobs/search?query={t_encoded}"
                elif "nvidia" in c_lower:
                    link_val = f"https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite?q={t_encoded}"
                elif "salesforce" in c_lower:
                    link_val = f"https://salesforce.wd1.myworkdayjobs.com/External_Career_Site?q={t_encoded}"
                elif "adobe" in c_lower:
                    link_val = f"https://careers.adobe.com/us/en/search-results?keywords={t_encoded}"
                else:
                    q_enc = urllib.parse.quote(f"{title_val} {company_val}".strip() or "Software Engineer")
                    link_val = f"https://www.linkedin.com/jobs/search/?keywords={q_enc}"

            existing = db.query(Job).filter(Job.id == j_id).first()
            if not existing:
                job = Job(
                    id=j_id,
                    title=title_val,
                    company=company_val,
                    location=location_val,
                    salary=row.get("salary", ""),
                    type=row.get("type", "Full-time"),
                    description=row.get("description", ""),
                    posted=row.get("posted", ""),
                    apply_link=link_val,
                    is_api=False,
                    created_at=datetime.utcnow()
                )
                db.add(job)
            elif not existing.apply_link or existing.apply_link == "#":
                existing.apply_link = link_val
        db.commit()
        print(f"Jobs seeded: {db.query(Job).count()}")

        # 3. Seed Job-Skill Mappings
        job_skills_csv = parse_csv_table("job_skill.csv")
        js_count = 0
        for row in job_skills_csv:
            j_id = safe_int(row.get("job_id"))
            s_id = safe_int(row.get("skill_id"))
            if j_id and s_id:
                stmt = job_skill_table.select().where(
                    (job_skill_table.c.job_id == j_id) & (job_skill_table.c.skill_id == s_id)
                )
                if not db.execute(stmt).first():
                    db.execute(job_skill_table.insert().values(job_id=j_id, skill_id=s_id))
                    js_count += 1
        db.commit()
        print(f"Job-Skill mappings seeded: {js_count}")

        # 4. Seed Interview Questions (743 questions from backup)
        questions_data = parse_sql_copy_table(sql_path, "interview_questions")
        if not questions_data:
            questions_data = parse_csv_table("interview_questions.csv")

        iq_count = 0
        for row in questions_data:
            orig_id = row.get("id") or str(iq_count)
            q_uuid = deterministic_uuid("interview_q", orig_id)
            existing = db.query(InterviewQuestion).filter(InterviewQuestion.id == q_uuid).first()
            if not existing:
                domain = row.get("role") or row.get("domain") or "General"
                sub_domain = row.get("skills") or row.get("sub_domain") or ""
                question_text = row.get("title") or row.get("question_text") or ""
                model_answer = row.get("answer_explanation") or row.get("model_answer") or ""
                star_example = row.get("answer_code") or row.get("star_example") or ""
                tags = clean_tags(row.get("tags"))
                difficulty = row.get("difficulty", "medium")
                category = row.get("category", "Fundamentals")

                q = InterviewQuestion(
                    id=q_uuid,
                    domain=domain,
                    sub_domain=sub_domain,
                    difficulty=difficulty,
                    category=category,
                    question_text=question_text,
                    model_answer=model_answer,
                    star_example=star_example,
                    tags=tags,
                    companies=[],
                    is_active=True,
                    created_at=datetime.utcnow()
                )
                db.add(q)
                iq_count += 1
        db.commit()
        print(f"Interview questions seeded: {db.query(InterviewQuestion).count()}")

        # 5. Seed Users
        users_csv = parse_csv_table("users.csv")
        user_uuid_map = {}
        for row in users_csv:
            u_id = row.get("id")
            email = row.get("email")
            if not email:
                continue
            u_uuid = deterministic_uuid("user", u_id)
            user_uuid_map[u_id] = u_uuid
            existing = db.query(User).filter(User.email == email).first()
            if not existing:
                u = User(
                    id=u_uuid,
                    email=email,
                    password_hash=row.get("password", ""),
                    full_name=row.get("name", "User"),
                    role="student"
                )
                db.add(u)
        db.commit()
        print(f"Users seeded: {db.query(User).count()}")

        # 6. Seed Student Profiles
        profiles_csv = parse_csv_table("user_profiles.csv")
        for row in profiles_csv:
            u_id = row.get("user_id")
            u_uuid = user_uuid_map.get(u_id) or deterministic_uuid("user", u_id)
            existing = db.query(StudentProfile).filter(StudentProfile.user_id == u_uuid).first()
            if not existing:
                sp = StudentProfile(
                    id=deterministic_uuid("profile", row.get("id")),
                    user_id=u_uuid,
                    city=row.get("location"),
                    target_role=row.get("target_roles"),
                    bio=row.get("bio"),
                    skills=clean_tags(row.get("skills")),
                    resume_url=row.get("resume_file_path")
                )
                db.add(sp)
        db.commit()
        print(f"Student profiles seeded: {db.query(StudentProfile).count()}")

        # 7. Seed Resume Analyses
        resume_csv = parse_csv_table("resume_analysis.csv")
        for row in resume_csv:
            r_id = safe_int(row.get("id"))
            if not r_id:
                continue
            existing = db.query(ResumeAnalysis).filter(ResumeAnalysis.id == r_id).first()
            if not existing:
                u_id = row.get("user_id", "1")
                u_uuid = user_uuid_map.get(u_id) or deterministic_uuid("user", u_id)
                r = ResumeAnalysis(
                    id=r_id,
                    filename=row.get("filename"),
                    text_content=row.get("text_content"),
                    ats_score=safe_int(row.get("ats_score"), 65),
                    strengths=safe_json(row.get("strengths"), []),
                    improvements=safe_json(row.get("improvements"), []),
                    parsed_skills=safe_json(row.get("parsed_skills"), []),
                    user_id=u_uuid
                )
                db.add(r)
        db.commit()
        print(f"Resume analyses seeded: {db.query(ResumeAnalysis).count()}")

        # 8. Seed Roadmaps
        roadmaps_csv = parse_csv_table("roadmaps.csv")
        for row in roadmaps_csv:
            rm_id = safe_int(row.get("id"))
            if not rm_id:
                continue
            existing = db.query(Roadmap).filter(Roadmap.id == rm_id).first()
            if not existing:
                u_id = row.get("user_id", "1")
                u_uuid = user_uuid_map.get(u_id) or deterministic_uuid("user", u_id)
                rm = Roadmap(
                    id=rm_id,
                    user_id=u_uuid,
                    domain=row.get("domain", "General"),
                    content=safe_json(row.get("content"), {}),
                    progress=safe_json(row.get("progress"), {}),
                    created_at=safe_datetime(row.get("created_at"))
                )
                db.add(rm)
        db.commit()
        print(f"Roadmaps seeded: {db.query(Roadmap).count()}")

        # 9. Seed Skill Progress
        sp_csv = parse_csv_table("skill_progress.csv")
        for row in sp_csv:
            sp_id = safe_int(row.get("id"))
            if not sp_id:
                continue
            existing = db.query(SkillProgress).filter(SkillProgress.id == sp_id).first()
            if not existing:
                u_id = row.get("user_id", "1")
                u_uuid = user_uuid_map.get(u_id) or deterministic_uuid("user", u_id)
                sp = SkillProgress(
                    id=sp_id,
                    user_id=u_uuid,
                    role_key=row.get("role_key", "frontend"),
                    progress_data=safe_json(row.get("progress_data"), {}),
                    updated_at=safe_datetime(row.get("updated_at"))
                )
                db.add(sp)
        db.commit()
        print(f"Skill progress seeded: {db.query(SkillProgress).count()}")

        # 10. Seed User Activities
        act_csv = parse_csv_table("user_activities.csv")
        for row in act_csv:
            act_id = safe_int(row.get("id"))
            if not act_id:
                continue
            existing = db.query(UserActivity).filter(UserActivity.id == act_id).first()
            if not existing:
                u_id = row.get("user_id", "1")
                u_uuid = user_uuid_map.get(u_id) or deterministic_uuid("user", u_id)
                act = UserActivity(
                    id=act_id,
                    user_id=u_uuid,
                    activity_type=row.get("activity_type", "login"),
                    details=row.get("details"),
                    created_at=safe_datetime(row.get("created_at"))
                )
                db.add(act)
        db.commit()
        print(f"User activities seeded: {db.query(UserActivity).count()}")

        print("Database seeding completed successfully for main1!")
    finally:
        db.close()

if __name__ == "__main__":
    force_seed = "--force" in sys.argv
    seed_database(force=force_seed)
