const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.status}`);
  }
  return response.json();
};

export const api = {
  // Data Center Endpoints
  getCustomers: (segment) => {
    const url = segment ? `${API_BASE_URL}/data/customers?segment=${encodeURIComponent(segment)}` : `${API_BASE_URL}/data/customers`;
    return fetch(url).then(handleResponse);
  },

  getOrders: () => {
    return fetch(`${API_BASE_URL}/data/orders`).then(handleResponse);
  },

  generateDemoData: () => {
    return fetch(`${API_BASE_URL}/data/seed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).then(handleResponse);
  },

  uploadCustomersCSV: (customers) => {
    return fetch(`${API_BASE_URL}/data/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customers }),
    }).then(handleResponse);
  },

  updateCustomer: (id, data) => {
    return fetch(`${API_BASE_URL}/data/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse);
  },

  deleteCustomer: (id) => {
    return fetch(`${API_BASE_URL}/data/customers/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    }).then(handleResponse);
  },

  updateOrder: (id, data) => {
    return fetch(`${API_BASE_URL}/data/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse);
  },

  deleteOrder: (id) => {
    return fetch(`${API_BASE_URL}/data/orders/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    }).then(handleResponse);
  },

  // Campaigns Endpoints
  getCampaigns: () => {
    return fetch(`${API_BASE_URL}/campaigns`).then(handleResponse);
  },

  createCampaign: (campaignData) => {
    return fetch(`${API_BASE_URL}/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campaignData),
    }).then(handleResponse);
  },

  launchCampaign: (id) => {
    return fetch(`${API_BASE_URL}/campaigns/${id}/launch`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    }).then(handleResponse);
  },

  deleteAllCampaigns: () => {
    return fetch(`${API_BASE_URL}/campaigns`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    }).then(handleResponse);
  },

  // AI Assistant Endpoints
  queryAISegment: (prompt) => {
    return fetch(`${API_BASE_URL}/campaigns/ai-segment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    }).then(handleResponse);
  },

  generateAICampaign: (prompt) => {
    return fetch(`${API_BASE_URL}/campaigns/ai-campaign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    }).then(handleResponse);
  },

  getAnalytics: (range) => {
    const url = range ? `${API_BASE_URL}/analytics?range=${encodeURIComponent(range)}` : `${API_BASE_URL}/analytics`;
    return fetch(url).then(handleResponse);
  },

  getRecommendations: () => {
    return fetch(`${API_BASE_URL}/recommendations`).then(handleResponse);
  },

  updateCampaign: (id, data) => {
    return fetch(`${API_BASE_URL}/campaigns/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse);
  },

  deleteCampaign: (id) => {
    return fetch(`${API_BASE_URL}/campaigns/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    }).then(handleResponse);
  },

  duplicateCampaign: (id) => {
    return fetch(`${API_BASE_URL}/campaigns/${id}/duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).then(handleResponse);
  },

  // Auth Endpoints
  login: (email, password) => {
    return fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(handleResponse);
  },

  register: (name, email, password) => {
    return fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    }).then(handleResponse);
  },

  googleLogin: (token) => {
    return fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }).then(handleResponse);
  },
};
