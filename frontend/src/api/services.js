/**
 * API service functions for all endpoints
 */

import api from './axios';

// ============================================
// AUTH
// ============================================

export const authAPI = {
    login: (data) => api.post('/auth/login', data),
    register: (data) => api.post('/auth/register', data),
    getMe: () => api.get('/auth/me'),
    updateProfile: (data) => api.put('/auth/me', data),
};

// ============================================
// EQUIPMENT
// ============================================

export const equipmentAPI = {
    getAll: (params) => api.get('/equipment', { params }),
    getById: (id) => api.get(`/equipment/${id}`),
    create: (data) => api.post('/equipment', data),
    update: (id, data) => api.put(`/equipment/${id}`, data),
    delete: (id) => api.delete(`/equipment/${id}`),
    getDepartments: () => api.get('/equipment/departments'),
};

// ============================================
// TEAMS
// ============================================

export const teamsAPI = {
    getAll: () => api.get('/teams'),
    getById: (id) => api.get(`/teams/${id}`),
    create: (data) => api.post('/teams', data),
    update: (id, data) => api.put(`/teams/${id}`, data),
    delete: (id) => api.delete(`/teams/${id}`),
    addMember: (teamId, userId) => api.post(`/teams/${teamId}/members`, { userId }),
    removeMember: (teamId, userId) => api.delete(`/teams/${teamId}/members/${userId}`),
};

// ============================================
// REQUESTS
// ============================================

export const requestsAPI = {
    getAll: (params) => api.get('/requests', { params }),
    getKanban: () => api.get('/requests/kanban'),
    getCalendar: (params) => api.get('/requests/calendar', { params }),
    getStats: () => api.get('/requests/stats'),
    getById: (id) => api.get(`/requests/${id}`),
    create: (data) => api.post('/requests', data),
    update: (id, data) => api.put(`/requests/${id}`, data),
    delete: (id) => api.delete(`/requests/${id}`),
    updateStage: (id, stage) => api.patch(`/requests/${id}/stage`, { stage }),
    assign: (id, technicianId) => api.patch(`/requests/${id}/assign`, { technicianId }),
    complete: (id, data) => api.patch(`/requests/${id}/complete`, data),
};

// ============================================
// USERS
// ============================================

export const usersAPI = {
    getAll: (params) => api.get('/users', { params }),
    getTechnicians: (params) => api.get('/users/technicians', { params }),
    getById: (id) => api.get(`/users/${id}`),
    updateRole: (id, data) => api.patch(`/users/${id}/role`, data),
};
