import os
import sys

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.services.interview_copilot_service import clean_for_speech

def test_clean_speech():
    sample = "**Got it.** That *makes* total sense. `code` here. \n- Bullet 1\n# Heading\n[Link](http://example.com)"
    cleaned = clean_for_speech(sample)
    print("Original:", sample)
    print("Cleaned :", cleaned)
    assert "**" not in cleaned
    assert "*" not in cleaned
    assert "`" not in cleaned
    assert "#" not in cleaned
    assert "http" not in cleaned
    print("Speech clean test PASSED.")

if __name__ == "__main__":
    test_clean_speech()
