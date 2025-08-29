import api from '../utils/axiosInstance';


// Get all commitment charts
export const getCommitmentCharts = async () => {
  try {
    const response = await api.get('/commitment-charts');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des chartes');
  }
};

// Get single commitment chart by ID
export const getCommitmentChartById = async (id) => {
  try {
    const response = await api.get(`/commitment-charts/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur lors de la récupération de la charte');
  }
};

// Get active commitment chart for current year
export const getActiveCommitmentChart = async () => {
  try {
    const response = await api.get('/commitment-charts/active');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur lors de la récupération de la charte active');
  }
};

// Create new commitment chart
export const createCommitmentChart = async (chartData) => {
  try {
    const response = await api.post('/commitment-charts', chartData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur lors de la création de la charte');
  }
};

// Update commitment chart
export const updateCommitmentChart = async (id, chartData) => {
  try {
    const response = await api.put(`/commitment-charts/${id}`, chartData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur lors de la mise à jour de la charte');
  }
};

// Toggle commitment chart active status
export const toggleCommitmentChartStatus = async (id) => {
  try {
    const response = await api.patch(`/commitment-charts/${id}/toggle`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur lors du changement de statut');
  }
};

// Delete commitment chart
export const deleteCommitmentChart = async (id) => {
  try {
    const response = await api.delete(`/commitment-charts/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur lors de la suppression de la charte');
  }
};