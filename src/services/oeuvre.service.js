/* eslint-disable prettier/prettier */
import api from "../utils/axiosInstance";

// Get all active oeuvres
export const getOeuvres = async () => {
  const res = await api.get("/oeuvres");
  return res.data;
};

export const getOeuvreById = async (id) => {
  const res = await api.get(`/oeuvres/${id}`);
  return res.data;
};


// Create a new oeuvre (with FormData for PDF upload)
export const createOeuvre = async (formData) => {
  const res = await api.post("/oeuvres", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// Update an existing oeuvre (with FormData for PDF upload)
export const updateOeuvre = async (id, formData) => {
  const res = await api.patch(`/oeuvres/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// Permanently delete an oeuvre
export const deleteOeuvrePermanent = async (id) => {
  const res = await api.delete(`/oeuvres/${id}/permanent`);
  return res.data;
};

// ==========================================
// MEDIA MANAGEMENT (Pupitre/Tutti)
// ==========================================

// Upload media for a specific pupitre
export const uploadOeuvreMedia = async (oeuvreId, formData) => {
  const res = await api.post(`/oeuvres/${oeuvreId}/media`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// Delete specific media for a specific pupitre
export const deleteOeuvreMedia = async (oeuvreId, pupitre, mediaType) => {
  const res = await api.delete(`/oeuvres/${oeuvreId}/media`, {
    data: { pupitre, mediaType },
  });
  return res.data;
};
