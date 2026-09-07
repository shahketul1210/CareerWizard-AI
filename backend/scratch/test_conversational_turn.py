import os
import sys

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app
from app.services.interview_copilot_service import is_casual_or_mic_check

client = TestClient(app)

def test_conversational_behavior():
    print("=== Testing Casual Mic Check & 2-Person Dialogue Behavior ===")

    # 1. Test helper
    assert is_casual_or_mic_check("Hello?") == True
    assert is_casual_or_mic_check("Hi") == True
    assert is_casual_or_mic_check("Can you hear me?") == True
    assert is_casual_or_mic_check("Could you please repeat that?") == True
    assert is_casual_or_mic_check("In our microservices architecture, we implemented Kafka event-driven decoupling.") == False
    print("1. is_casual_or_mic_check detection: PASSED")

    # 2. Create session
    payload = {
        "role": "Full Stack Developer",
        "seniority_level": "Senior",
        "interview_type": "Technical",
        "total_questions": 3
    }
    res = client.post("/interview-copilot/sessions", json=payload)
    assert res.status_code == 201
    data = res.json()
    session_id = data["session"]["id"]
    opening_q = data["first_message"]["content"]
    print(f"2. Opening Greeting: '{opening_q}'")
    word_count = len(opening_q.split())
    print(f"   Word count: {word_count} words (Fast & punchy)")
    assert word_count < 40

    # 3. Candidate says "Hello?" (Mic check / casual greeting)
    res = client.post(f"/interview-copilot/sessions/{session_id}/answer", data={"text": "Hello?"})
    assert res.status_code == 200
    turn_data = res.json()
    cand_eval = turn_data["candidate_message"]["evaluation"]
    interviewer_reply = turn_data["interviewer_message"]["content"]
    
    print(f"3. Candidate said 'Hello?'")
    print(f"   Candidate evaluation: {cand_eval} (Must be None, NOT 0/100!)")
    assert cand_eval is None
    print(f"   Orion Spoke: '{interviewer_reply}'")
    assert "hear you" in interviewer_reply.lower()

    # Check session question index did NOT advance
    res_sess = client.get(f"/interview-copilot/sessions/{session_id}")
    sess_obj = res_sess.json()
    print(f"   Current Question Index: {sess_obj['current_question_index']} (Expected 1)")
    assert sess_obj["current_question_index"] == 1

    # 4. Candidate gives a real technical answer
    real_ans = "I usually structure web apps using Next.js with React Server Components to reduce client-side JavaScript, and Tailwind for styling."
    res = client.post(f"/interview-copilot/sessions/{session_id}/answer", data={"text": real_ans})
    assert res.status_code == 200
    ans_data = res.json()
    interviewer_reply_2 = ans_data["interviewer_message"]["content"]
    print(f"4. Candidate gave real answer: '{real_ans[:60]}...'")
    print(f"   Orion Next Turn: '{interviewer_reply_2}'")
    print(f"   Orion Word Count: {len(interviewer_reply_2.split())} words")
    assert len(interviewer_reply_2.split()) < 40

    res_sess = client.get(f"/interview-copilot/sessions/{session_id}")
    assert res_sess.json()["current_question_index"] == 2
    print(f"   Question Index now advanced to: {res_sess.json()['current_question_index']}")

    print("\n=== ALL CONVERSATIONAL DIALOGUE TESTS PASSED! ===")

if __name__ == "__main__":
    test_conversational_behavior()
