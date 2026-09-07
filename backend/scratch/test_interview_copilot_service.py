import os
import sys

# Ensure backend root is on sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.db.database import Base, engine, SessionLocal
from app.models.interview_copilot import InterviewCopilotSession, InterviewCopilotMessage
from app.services.interview_copilot_service import (
    generate_first_question,
    generate_next_turn,
    generate_final_evaluation_report,
    synthesize_speech_bytes,
    clean_for_speech
)

def run_tests():
    print("1. Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")

    print("\n2. Testing clean_for_speech...")
    test_str = "## Hello! **Welcome** to the *interview*. `const x = 1;` [Click here](http://example.com) - Item 1"
    cleaned = clean_for_speech(test_str)
    print(f"Cleaned: '{cleaned}'")
    assert "**" not in cleaned and "##" not in cleaned and "`" not in cleaned

    print("\n3. Testing Gemini generate_first_question...")
    first_q = generate_first_question(
        role="Frontend Engineer",
        company="Google",
        seniority="Senior",
        interview_type="Technical"
    )
    print(f"Generated Question 1: {first_q[:150]}...")
    assert len(first_q) > 20

    print("\n4. Testing Gemini generate_next_turn...")
    history = [
        {"role": "interviewer", "content": first_q},
        {"role": "candidate", "content": "I usually optimize web applications by code-splitting routes, using lazy loading for heavy images, and memoizing expensive computations with useMemo and useCallback."}
    ]
    spoken_reply, micro_eval, is_casual = generate_next_turn(
        role="Frontend Engineer",
        company="Google",
        seniority="Senior",
        interview_type="Technical",
        question_index=1,
        total_questions=3,
        history=history
    )
    print(f"Interviewer Next: {spoken_reply[:150]}...")
    print(f"Micro evaluation: {micro_eval}")
    assert len(spoken_reply) > 20
    assert "score" in micro_eval

    print("\n5. Testing Deepgram TTS synthesis (male aura-orion-en)...")
    audio_bytes = synthesize_speech_bytes("Welcome to your technical interview. Let's begin.")
    print(f"Deepgram TTS synthesized {len(audio_bytes)} bytes!")
    assert len(audio_bytes) > 1000

    print("\n6. Testing Gemini generate_final_evaluation_report...")
    history.append({"role": "interviewer", "content": spoken_reply})
    history.append({"role": "candidate", "content": "I use synthetic monitoring, Sentry for real-time error tracking, and Datadog for Core Web Vitals."})
    report = generate_final_evaluation_report(
        role="Frontend Engineer",
        company="Google",
        seniority="Senior",
        interview_type="Technical",
        history=history
    )
    print(f"Final Report Overall Score: {report.get('overall_score')}")
    print(f"Recommendation: {report.get('hire_recommendation')}")
    print(f"Rubric Scores: {report.get('rubric_scores')}")
    assert "overall_score" in report
    assert "rubric_scores" in report

    print("\n7. Testing DB Session insertion...")
    db = SessionLocal()
    try:
        session = InterviewCopilotSession(
            role="Frontend Engineer",
            company_name="Google",
            seniority_level="Senior",
            interview_type="Technical",
            total_questions=3,
            current_question_index=1,
            status="in_progress"
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        print(f"Session created with ID: {session.id}")

        msg = InterviewCopilotMessage(
            session_id=session.id,
            role="interviewer",
            content=first_q,
            question_index=1
        )
        db.add(msg)
        db.commit()
        print("Message saved successfully!")
    finally:
        db.close()

    print("\nALL BACKEND TESTS PASSED!")

if __name__ == "__main__":
    run_tests()
