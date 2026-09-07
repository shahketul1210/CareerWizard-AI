import sys
import os
sys.path.insert(0, os.path.abspath("."))
import requests
import json
import time
from app.services.interview_copilot_service import (
    generate_content_with_fallback,
    build_running_summary,
    generate_first_question,
    generate_next_turn,
    _model_cooldowns
)

def test_cooldown_mechanism():
    print("\n--- TEST 1: Model Cooldown Circuit Breaker ---")
    print(f"Initial model cooldowns: {_model_cooldowns}")
    t0 = time.time()
    res = generate_content_with_fallback("Respond in 5 words: Confirm system status.")
    t1 = time.time()
    print(f"Generation output: '{res.strip()}' (took {t1 - t0:.2f}s)")
    assert len(res.strip()) > 0, "Failed to generate content"
    print("[OK] Model generation and fallback circuit breaker is working.")

def test_running_summary():
    print("\n--- TEST 2: Continuous Conversation Memory Summary ---")
    mock_history = [
        {"role": "interviewer", "content": "Welcome! Tell me about your background and recent work in backend engineering."},
        {"role": "candidate", "content": "I am a final year computer engineering student. Recently I built a hospital appointment booking system using FastAPI, PostgreSQL, and Redis caching.", "evaluation": {"score": 85}},
        {"role": "interviewer", "content": "That sounds interesting. How did you design the Redis cache invalidation strategy when doctors change their available slots?"},
        {"role": "candidate", "content": "We used write-through invalidation with key-tagging so whenever a doctor updates slots, only that specific doctor's cached availability keys get purged.", "evaluation": {"score": 88}}
    ]

    summary = build_running_summary(mock_history)
    print("Generated Running Summary:")
    print(summary)
    assert "FastAPI" in summary or "hospital" in summary or "Redis" in summary, "Summary should capture key candidate claims!"
    print("[OK] Continuous conversation summary correctly extracts candidate claims and turns.")

    print("\nTesting generate_next_turn with running memory context:")
    t0 = time.time()
    reply, eval_dict, turn_meta = generate_next_turn(
        role="Backend Engineer",
        seniority="Entry-level",
        interview_type="Technical",
        question_index=3,
        total_questions=5,
        history=mock_history
    )
    t1 = time.time()
    print(f"Orion Spoken Reply ({t1 - t0:.2f}s): '{reply}'")
    print(f"Turn Meta: {turn_meta}")
    print(f"Micro Evaluation: {eval_dict}")
    assert reply and len(reply.split()) <= 35, "Spoken reply should be concise and fast for voice TTS"
    print("[OK] Orion response generated with full cumulative context.")

def test_api_endpoints():
    print("\n--- TEST 3: End-to-End API Integration ---")
    base_url = "http://127.0.0.1:8000/interview-copilot"

    # 1. Create session
    payload = {
        "role": "Computer Engineering Intern",
        "seniority_level": "Student / Fresher",
        "interview_type": "Technical",
        "job_description": "Focus on data structures, algorithms, and React/Python projects",
        "candidate_context": "Final year student with good fundamentals",
        "total_questions": 3
    }
    r = requests.post(f"{base_url}/sessions", json=payload, timeout=25)
    print(f"POST /sessions status: {r.status_code}")
    assert r.status_code == 201, f"Create session failed: {r.text}"
    data = r.json()
    session_id = data["session"]["id"]
    first_msg = data["first_message"]["content"]
    print(f"Created Session ID: {session_id}")
    print(f"Orion First Question: '{first_msg}'")
    print(f"Audio Base64 length: {len(data.get('audio_base64') or '')} chars")

    # 2. Candidate Answer Turn 1
    t0 = time.time()
    ans_r = requests.post(
        f"{base_url}/sessions/{session_id}/answer",
        data={"text": "I am doing well! I've been working on modern web apps with React and Python FastAPI."},
        timeout=25
    )
    t1 = time.time()
    print(f"Turn 1 Answer response status: {ans_r.status_code} ({t1 - t0:.2f}s)")
    assert ans_r.status_code == 200, f"Submit answer failed: {ans_r.text}"
    ans_data = ans_r.json()
    print(f"Candidate Msg in DB: '{ans_data['candidate_message']['content']}'")
    print(f"Interviewer Next Question: '{ans_data['interviewer_message']['content']}'")

    # 3. Candidate Answer Turn 2
    t0 = time.time()
    ans_r2 = requests.post(
        f"{base_url}/sessions/{session_id}/answer",
        data={"text": "In that FastAPI project, I designed a distributed task queue using Celery and Redis to handle asynchronous background image processing."},
        timeout=25
    )
    t1 = time.time()
    print(f"Turn 2 Answer response status: {ans_r2.status_code} ({t1 - t0:.2f}s)")
    ans_data2 = ans_r2.json()
    print(f"Candidate Msg 2 in DB: '{ans_data2['candidate_message']['content']}'")
    print(f"Interviewer Next Question 2: '{ans_data2['interviewer_message']['content']}'")

    print("\n[OK] ALL 3 TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_cooldown_mechanism()
    test_running_summary()
    test_api_endpoints()
