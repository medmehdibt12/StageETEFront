import api from "../utils/axiosInstance";

// 📊 Get Admin dashboard data
export const getAdminDashboard = async () => {
  const res = await api.get("/dashboard/admin");
  return res.data;
};

// 📊 Get Manager dashboard data
export const getManagerDashboard = async () => {
  const res = await api.get("/dashboard/manager");
  return res.data;
};

// 🔔 NEW: Notifications de candidatures (manager / admin / chef de chœur)
export const getCandidatureNotifications = async () => {
  const res = await api.get("/dashboard/manager/notifications");
  return res.data;
};

export const getChoristeDashboard = async () => {
  const res = await api.get("/dashboard/choriste");
  return res.data;
};

// 🔔 NEW: Notifications d'activité pour le choriste (nouveaux concerts / répétitions / carnet de chant)
export const getChoristeActivityNotifications = async () => {
  const res = await api.get("/dashboard/choriste/notifications");
  return res.data;
};

// ✅ NEW: Chef de Chœur Dashboard Service
export const getChefDeChoeurDashboard = async () => {
  try {
    const response = await api.get("/dashboard/chef-de-choeur");
    return response.data;
  } catch (error) {
    console.error("Error fetching chef de chœur dashboard:", error);
    throw error;
  }
};
// 📊 Get Choriste & Chef de choeur dashboard data
// export const getChoristeChefDashboard = async () => {
//   const res = await api.get('/dashboard/choriste-chef');
//   return res.data;
// };
