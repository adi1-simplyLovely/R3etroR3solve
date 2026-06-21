const BASE_URL = 'http://localhost:8080/api/v1';

export const getAuthToken = () => sessionStorage.getItem('helpdesk_token');
export const setAuthToken = (token) => sessionStorage.setItem('helpdesk_token', token);
export const clearAuthToken = () => sessionStorage.removeItem('helpdesk_token');

export const getUserFromToken = () => {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload; // contains 'sub' (email), 'userId', 'role'
  } catch (e) {
    return null;
  }
};

export const apiCall = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Something went wrong');
  }

  return data;
};

// --- AUTH API ---
export const login = async (credentials) => {
  const res = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  if (res.data.token) {
    setAuthToken(res.data.token);
  }
  return res.data;
};

// --- TICKETS API ---
export const getMyTickets = async () => {
  const res = await apiCall('/tickets/my');
  return res.data;
};

export const getCurrentUserApi = async () => {
  const res = await apiCall('/users/me');
  return res.data;
};

export const getTicketHistory = async (ticketId) => {
  const res = await apiCall(`/tickets/${ticketId}/history`);
  return res.data;
};

export const createTicket = async (ticketData) => {
  const res = await apiCall('/tickets', {
    method: 'POST',
    body: JSON.stringify(ticketData),
  });
  return res.data;
};

export const getAllTickets = async () => {
  const res = await apiCall('/tickets');
  return res.data;
};

// --- WORKFLOW API ---
export const pickupTicket = async (ticketId) => {
  const res = await apiCall(`/tickets/${ticketId}/pickup`, {
    method: 'POST',
  });
  return res;
};

export const resolveTicket = async (ticketId, resolutionNote) => {
  const res = await apiCall(`/tickets/${ticketId}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ resolutionNote }),
  });
  return res;
};

export const ignoreTicket = async (ticketId, reason) => {
  const res = await apiCall(`/tickets/${ticketId}/ignore`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  return res;
};
// --- CHAT API ---
export const getChatHistory = async () => {
  const res = await apiCall('/chat/history');
  return res.data;
};

export const getOnlineUsersApi = async () => {
  const res = await apiCall('/chat/online-users');
  return res.data;
};

export const clearChatHistory = async () => {
  const res = await apiCall('/chat/history', {
    method: 'DELETE',
  });
  return res;
};

// --- WORKFORCE & ADMIN API ---
export const getMe = async () => {
  const res = await apiCall('/users/me');
  return res.data;
};

export const getWorkforce = async () => {
  return await apiCall('/workforce');
};

export const requestDeletion = async () => {
  return await apiCall('/users/me/deletion-request', { method: 'POST' });
};

export const deleteAdminSelf = async () => {
  return await apiCall('/users/me', { method: 'DELETE' });
};

export const getDeletionRequests = async () => {
  return await apiCall('/admin/deletion-requests');
};

export const approveDeletion = async (id) => {
  return await apiCall(`/admin/deletion-requests/${id}/approve`, { method: 'POST' });
};

export const rejectDeletion = async (id, reason) => {
  return await apiCall(`/admin/deletion-requests/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
};

export const logout = async () => {
  try {
    await apiCall('/auth/logout', { method: 'POST' });
  } catch (e) {
    console.error(e);
  }
  clearAuthToken();
};

// --- AI API ---
export const getDraftReply = async (ticketData) => {
  const res = await apiCall('/ai/draft-reply', {
    method: 'POST',
    body: JSON.stringify(ticketData)
  });
  return res.data;
};

export const getCopilotResponse = async (message, context) => {
  const res = await apiCall('/ai/copilot-chat', {
    method: 'POST',
    body: JSON.stringify({ message, context })
  });
  return res.data;
};

export const getRouteSuggestion = async (title, description) => {
  const res = await apiCall('/ai/route-ticket', {
    method: 'POST',
    body: JSON.stringify({ title, description })
  });
  return res.data;
};

export const getDeflectionSuggestion = async (title, description) => {
  const res = await apiCall('/ai/deflect-ticket', {
    method: 'POST',
    body: JSON.stringify({ title, description })
  });
  return res.data;
};
