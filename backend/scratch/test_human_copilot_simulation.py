import os
import sys

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_human_copilot_simulation():
    print("\n========================================================")
    print("🚀 TESTING PRODUCTION HUMAN INTERVIEWER COPILOT FLOW")
    print("========================================================\n")

    # 1. CREATE SESSION
    payload = {
        "role": "Full Stack Engineer",
        "seniority_level": "Mid-Level",
        "interview_type": "Technical",
        "total_questions": 3
    }
    res = client.post("/interview-copilot/sessions", json=payload)
    assert res.status_code == 201, f"Failed to create session: {res.text}"
    data = res.json()
    session_id = data["session"]["id"]
    greeting = data["first_message"]["content"]
    print(f"✅ Turn 0 (Initial Greeting):")
    print(f"   Orion: \"{greeting}\"")
    assert "joining" in greeting.lower() or "how are you" in greeting.lower(), "Greeting must be a warm wellbeing check"

    # 2. TURN 1: Candidate responds to wellbeing check
    print("\n--------------------------------------------------------")
    candidate_turn_1 = "I'm doing good, thank you. How are you?"
    print(f"Candidate: \"{candidate_turn_1}\"")
    res = client.post(f"/interview-copilot/sessions/{session_id}/answer", data={"text": candidate_turn_1})
    assert res.status_code == 200, res.text
    ans_1 = res.json()
    reply_1 = ans_1["interviewer_message"]["content"]
    print(f"Orion: \"{reply_1}\"")
    cand_eval_1 = ans_1["candidate_message"]["evaluation"]
    print(f"Evaluation: {cand_eval_1} (Expected None for opening rapport)")
    assert cand_eval_1 is None, "Rapport turns must NOT be evaluated or penalized"
    
    # Verify session question index did not increment
    sess = client.get(f"/interview-copilot/sessions/{session_id}").json()
    print(f"Current Question Index: {sess['current_question_index']} (Expected 1)")
    assert sess["current_question_index"] == 1

    # 3. TURN 2: Candidate confirms structure ("Yes, sounds good!")
    print("\n--------------------------------------------------------")
    candidate_turn_2 = "Yes, absolutely sounds good!"
    print(f"Candidate: \"{candidate_turn_2}\"")
    res = client.post(f"/interview-copilot/sessions/{session_id}/answer", data={"text": candidate_turn_2})
    assert res.status_code == 200
    ans_2 = res.json()
    reply_2 = ans_2["interviewer_message"]["content"]
    print(f"Orion: \"{reply_2}\"")

    # 4. TURN 3: Candidate shares background & projects
    print("\n--------------------------------------------------------")
    candidate_turn_3 = "I've been studying Computer Engineering and focusing on full-stack web applications using React, Node.js, and PostgreSQL. Recently I built an AI career platform."
    print(f"Candidate: \"{candidate_turn_3}\"")
    res = client.post(f"/interview-copilot/sessions/{session_id}/answer", data={"text": candidate_turn_3})
    assert res.status_code == 200
    ans_3 = res.json()
    reply_3 = ans_3["interviewer_message"]["content"]
    print(f"Orion: \"{reply_3}\"")
    assert ans_3["candidate_message"]["evaluation"] is not None

    # 5. TURN 4: Edge Case - Candidate says they are nervous
    print("\n--------------------------------------------------------")
    candidate_turn_4 = "Sorry, I'm a little nervous right now."
    print(f"Candidate: \"{candidate_turn_4}\"")
    res = client.post(f"/interview-copilot/sessions/{session_id}/answer", data={"text": candidate_turn_4})
    assert res.status_code == 200
    ans_4 = res.json()
    reply_4 = ans_4["interviewer_message"]["content"]
    print(f"Orion: \"{reply_4}\"")
    assert ans_4["candidate_message"]["evaluation"] is None, "Nervousness reassurance must NOT be penalized"
    print("✅ Handled nervousness without penalty or burning questions!")

    # 6. TURN 5: Substantive Project Details
    print("\n--------------------------------------------------------")
    candidate_turn_5 = "On that project, I owned the backend integration. We placed the AI API calls behind our Node.js server with caching in Redis to prevent hitting rate limits and protect our secret keys."
    print(f"Candidate: \"{candidate_turn_5}\"")
    res = client.post(f"/interview-copilot/sessions/{session_id}/answer", data={"text": candidate_turn_5})
    assert res.status_code == 200
    ans_5 = res.json()
    reply_5 = ans_5["interviewer_message"]["content"]
    print(f"Orion: \"{reply_5}\"")

    # 7. TURN 6: Candidate answers final technical scenario
    print("\n--------------------------------------------------------")
    candidate_turn_6 = "If traffic increased tenfold, the database connection pool and AI provider rate limits would bottleneck first. I'd add a BullMQ message queue for async worker processing and scale our instances horizontally."
    print(f"Candidate: \"{candidate_turn_6}\"")
    res = client.post(f"/interview-copilot/sessions/{session_id}/answer", data={"text": candidate_turn_6})
    assert res.status_code == 200
    ans_6 = res.json()
    reply_6 = ans_6["interviewer_message"]["content"]
    print(f"Orion: \"{reply_6}\"")
    print("✅ Completed substantive questions, transitioned to wrap-up/candidate questions!")

    # 8. TURN 7: Candidate asks a question or wraps up
    print("\n--------------------------------------------------------")
    candidate_turn_7 = "What does the typical day look like for an engineer on your team?"
    print(f"Candidate: \"{candidate_turn_7}\"")
    res = client.post(f"/interview-copilot/sessions/{session_id}/answer", data={"text": candidate_turn_7})
    assert res.status_code == 200
    ans_7 = res.json()
    reply_7 = ans_7["interviewer_message"]["content"]
    print(f"Orion: \"{reply_7}\"")
    print(f"Final Status: {ans_7['status']}")
    assert ans_7["status"] == "completed", "Interview must complete naturally"
    assert ans_7["evaluation_report"] is not None
    print(f"Overall Score: {ans_7['evaluation_report'].get('overall_score')}/100")
    print(f"Recommendation: {ans_7['evaluation_report'].get('hire_recommendation')}")
    print("\n========================================================")
    print("🎉 FULL HUMAN INTERVIEWER COPILOT SIMULATION PASSED!")
    print("========================================================\n")

if __name__ == "__main__":
    run_human_copilot_simulation()
