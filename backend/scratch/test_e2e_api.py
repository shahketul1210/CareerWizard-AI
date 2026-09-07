import os
import sys

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_interview_copilot_e2e():
    print("=== Testing Interview Copilot API Endpoints ===")

    # 1. Health check
    res = client.get("/")
    assert res.status_code == 200
    print("1. Root health check: OK")

    # 2. Standalone TTS endpoint
    res = client.post("/interview-copilot/tts", json={"text": "This is Orion testing text to speech."})
    assert res.status_code == 200
    assert len(res.content) > 1000
    assert res.headers["content-type"] == "audio/mp3"
    print(f"2. Standalone TTS: OK ({len(res.content)} bytes received)")

    # 3. Create Interview Session
    payload = {
        "role": "Full Stack Developer",
        "company_name": "Stripe",
        "seniority_level": "Senior",
        "interview_type": "Technical",
        "total_questions": 2,
        "job_description": "React, Python, distributed systems, payment ledgers."
    }
    res = client.post("/interview-copilot/sessions", json=payload)
    assert res.status_code == 201, f"Create session failed: {res.text}"
    session_data = res.json()
    session = session_data["session"]
    first_msg = session_data["first_message"]
    audio_b64 = session_data["audio_base64"]

    session_id = session["id"]
    print(f"3. Session Created: ID={session_id}")
    print(f"   Question 1: {first_msg['content'][:120]}...")
    assert audio_b64 is not None and audio_b64.startswith("data:audio/mp3;base64,")
    print("   Audio TTS: Generated successfully!")

    # 4. Submit Answer for Question 1
    answer_payload = {
        "text": "For a resilient payment ledger, I enforce idempotency keys on every transaction request, use double-entry bookkeeping with strict database constraints, and publish domain events to a partitioned Kafka topic with dead-letter queue retries."
    }
    res = client.post(f"/interview-copilot/sessions/{session_id}/answer", data=answer_payload)
    assert res.status_code == 200, f"Submit answer failed: {res.text}"
    answer_data = res.json()
    print("4. Submitted Answer 1: OK")
    print(f"   Status: {answer_data['status']}")
    print(f"   Interviewer Next: {answer_data['interviewer_message']['content'][:120]}...")
    assert answer_data["status"] == "continue"

    # 5. Submit Final Answer for Question 2 (wraps up and creates full evaluation)
    answer_payload_2 = {
        "text": "To handle eventual consistency across read replicas, we route critical ledger queries strictly to the primary node and use write-through Redis caching with short TTLs for dashboard views."
    }
    res = client.post(f"/interview-copilot/sessions/{session_id}/answer", data=answer_payload_2)
    assert res.status_code == 200, f"Submit final answer failed: {res.text}"
    final_data = res.json()
    print("5. Submitted Answer 2 (Final): OK")
    print(f"   Status: {final_data['status']}")
    if final_data["status"] != "completed":
        print("   Session continuing naturally. Now testing End Session endpoint (/sessions/{id}/end)...")
        end_res = client.post(f"/interview-copilot/sessions/{session_id}/end")
        assert end_res.status_code == 200, f"End session failed: {end_res.text}"
        end_data = end_res.json()
        report = end_data["evaluation_report"]
    else:
        report = final_data["evaluation_report"]

    assert report is not None
    print(f"   Evaluation Overall Score: {report.get('overall_score')}")
    print(f"   Hire Recommendation: {report.get('hire_recommendation')}")
    print(f"   Rubrics: {report.get('rubric_scores')}")

    # 6. List Sessions
    res = client.get("/interview-copilot/sessions")
    assert res.status_code == 200
    sessions_list = res.json()
    assert len(sessions_list) > 0
    print(f"6. List Sessions: Found {len(sessions_list)} sessions in history")

    # 7. Get Full Session
    res = client.get(f"/interview-copilot/sessions/{session_id}")
    assert res.status_code == 200
    full_session = res.json()
    assert full_session["status"] == "completed"
    assert len(full_session["messages"]) >= 4
    print(f"7. Get Session Details: OK (Contains {len(full_session['messages'])} dialogue turns)")

    print("\n=== ALL E2E API TESTS PASSED PERFECTLY! ===")

if __name__ == "__main__":
    test_interview_copilot_e2e()
