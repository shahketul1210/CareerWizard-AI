import google.generativeai as genai
from app.core.config import settings

if settings.GEMINI_API_KEY:
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
    except Exception:
        pass

def get_job_recommendations(skill: str):
    if not settings.GEMINI_API_KEY:
        return [f"{skill} Developer", f"Junior {skill} Engineer", f"Senior {skill} Specialist", f"{skill} Consultant", f"Lead {skill} Architect"]
    try:
        model = genai.GenerativeModel(settings.GEMINI_MODEL)
        prompt = f"Suggest 5 job roles for someone skilled in {skill}. Output only list."
        result = model.generate_content(prompt)
        return [line.strip() for line in result.text.split("\n") if line.strip()]
    except Exception as e:
        print(f"Gemini job rec error: {e}")
        return [f"{skill} Developer", f"Junior {skill} Engineer", f"Senior {skill} Specialist", f"{skill} Consultant", f"Lead {skill} Architect"]
