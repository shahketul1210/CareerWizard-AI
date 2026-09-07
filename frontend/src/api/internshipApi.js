import api from "./axiosClient";

export const internshipApi = {
  getOverview: async (day = null) => {
    const url = day ? `/internship/overview?day=${day}` : "/internship/overview";
    const res = await api.get(url);
    return res.data;
  },

  getTasks: async (filter = "all") => {
    const res = await api.get(`/internship/tasks?filter=${filter}`);
    return res.data;
  },

  submitTask: async ({ dayNumber, githubUrl, difficultyChosen = "intermediate", taskId = null }) => {
    const res = await api.post("/internship/tasks/submit", {
      day_number: dayNumber,
      github_url: githubUrl,
      difficulty_chosen: difficultyChosen,
      task_id: taskId,
    });
    return res.data;
  },

  getLearningDays: async () => {
    const res = await api.get("/internship/learning");
    return res.data;
  },

  getLearningDayDetail: async (day, level = "intermediate") => {
    const res = await api.get(`/internship/learning/${day}?level=${level}`);
    return res.data;
  },

  saveStudyNotes: async (day, notes) => {
    const res = await api.post(`/internship/learning/${day}/notes`, { notes });
    return res.data;
  },

  getProjects: async () => {
    const res = await api.get("/internship/projects");
    return res.data;
  },

  createProject: async (projectData) => {
    const res = await api.post("/internship/projects", projectData);
    return res.data;
  },

  getSummary: async () => {
    const res = await api.get("/internship/summary");
    return res.data;
  },

  getResources: async () => {
    const res = await api.get("/internship/resources");
    return res.data;
  },

  getCertificates: async () => {
    const res = await api.get("/internship/certificates");
    return res.data;
  },

  getCertificateDetail: async (certCode) => {
    const res = await api.get(`/internship/certificates/${certCode}`);
    return res.data;
  },

  getPlansAndTracks: async () => {
    const res = await api.get("/internship/plans");
    return res.data;
  },

  enroll: async (enrollData) => {
    const res = await api.post("/internship/enroll", enrollData);
    return res.data;
  },
};

export default internshipApi;
