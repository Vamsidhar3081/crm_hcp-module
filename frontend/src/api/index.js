import axios from 'axios';

const API = axios.create({ 
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api' 
});

export const agentChat = (message, interactionId, currentFormData) =>
  API.post('/interactions/chat', {
    message,
    interaction_id: interactionId || null,
    current_form_data: currentFormData || null,
  });

export const saveInteraction = (data) => API.post('/agent/', data);
export const updateInteraction = (id, data) => API.put(`/agent/${id}`, data);
export const listInteractions = () => API.get('/agent/');
export const deleteInteraction = (id) => API.delete(`/agent/${id}`);