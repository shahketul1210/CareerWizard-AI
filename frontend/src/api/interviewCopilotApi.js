import api from "./axiosClient";

export const interviewCopilotApi = {
  /**
   * Create and initialize a new live interview copilot session
   */
  async createSession({
    role,
    company_name,
    seniority_level,
    interview_type,
    job_description,
    resume_context,
    total_questions = 5,
  }) {
    const response = await api.post("/interview-copilot/sessions", {
      role,
      company_name,
      seniority_level,
      interview_type,
      job_description,
      resume_context,
      total_questions,
    });
    return response.data;
  },

  /**
   * List recent sessions for user history
   */
  async listSessions(limit = 20) {
    const response = await api.get(`/interview-copilot/sessions?limit=${limit}`);
    return response.data;
  },

  /**
   * Get full session state, transcript messages, and evaluation report
   */
  async getSession(sessionId) {
    const response = await api.get(`/interview-copilot/sessions/${sessionId}`);
    return response.data;
  },

  /**
   * Submit candidate answer (audio file recording or text fallback)
   */
  async submitAnswer(sessionId, { file, text }) {
    if (file) {
      const formData = new FormData();
      formData.append("file", file, "answer.webm");
      if (text) {
        formData.append("text", text);
      }
      const response = await api.post(
        `/interview-copilot/sessions/${sessionId}/answer`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } else {
      const formData = new FormData();
      formData.append("text", text || "");
      const response = await api.post(
        `/interview-copilot/sessions/${sessionId}/answer`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    }
  },

  /**
   * Manually wrap up session early and request evaluation report
   */
  async endSessionEarly(sessionId) {
    const response = await api.post(`/interview-copilot/sessions/${sessionId}/end`);
    return response.data;
  },

  /**
   * Synthesize speech for any text on demand
   */
  async getTtsAudio(text) {
    const response = await api.post(
      "/interview-copilot/tts",
      { text },
      { responseType: "blob" }
    );
    return URL.createObjectURL(response.data);
  },

  /**
   * Test audio snippet transcription
   */
  async testTranscribe(file) {
    const formData = new FormData();
    formData.append("file", file, "test.webm");
    const response = await api.post("/interview-copilot/transcribe", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
};

export default interviewCopilotApi;
