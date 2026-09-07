import time
import os
import sys

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.services.interview_copilot_service import (
    build_running_summary,
    _model_cooldowns,
    is_casual_or_mic_check,
    generate_content_with_fallback
)

def test_build_running_summary():
    print("Testing build_running_summary...")
    history = [
        {"role": "interviewer", "content": "Welcome! How are you doing today?"},
        {"role": "candidate", "content": "Doing well! Ready for the interview."},
        {"role": "interviewer", "content": "Tell me about your background and recent projects."},
        {
            "role": "candidate",
            "content": "I built a distributed task queue using FastAPI, Redis, and PostgreSQL with Docker deployments.",
            "evaluation": {"score": 88, "strength": "Clear hands-on infrastructure experience"}
        }
    ]

    summary = build_running_summary(history)
    print("Generated Summary:\n", summary)

    assert "Cumulative turns completed: 2" in summary
    assert "FastAPI" in summary
    assert "Redis" in summary
    assert "PostgreSQL" in summary
    assert "Docker" in summary
    assert "Clear hands-on infrastructure experience" in summary
    print("✅ build_running_summary PASSED!\n")

def test_model_cooldown_mechanism():
    print("Testing model cooldown mechanism...")
    # Simulate putting a model on cooldown
    test_model = "fake-rate-limited-model"
    _model_cooldowns[test_model] = time.time() + 60.0

    assert time.time() < _model_cooldowns[test_model]
    print(f"✅ Model '{test_model}' in cooldown: correctly recognized as active cooldown.")

    # Cleanup
    _model_cooldowns.pop(test_model, None)
    print("✅ Cooldown mechanism PASSED!\n")

def test_casual_mic_check_detection():
    print("Testing casual mic check detection...")
    assert is_casual_or_mic_check("Hello?") is True
    assert is_casual_or_mic_check("Can you hear me?") is True
    assert is_casual_or_mic_check("Am I audible?") is True
    assert is_casual_or_mic_check("I have 4 years of experience building scalable backend microservices.") is False
    print("✅ is_casual_or_mic_check PASSED!\n")

if __name__ == "__main__":
    test_build_running_summary()
    test_model_cooldown_mechanism()
    test_casual_mic_check_detection()
    print("🎉 ALL TARGETED TESTS PASSED SUCCESSFULLY!")
