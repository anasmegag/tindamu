/**
 * Service Messagerie — Appels API REST pour les conversations et messages.
 */
import api from './api';

// ─── CONVERSATIONS ───────────────────────────────────────────

export const getConversations = () =>
    api.get('/conversations').then(r => r.data);

export const createGroupConversation = (nom, memberIds) =>
    api.post('/conversations', { nom, member_ids: memberIds }).then(r => r.data);

export const getConversation = (convId) =>
    api.get(`/conversations/${convId}`).then(r => r.data);

export const updateConversation = (convId, data) =>
    api.put(`/conversations/${convId}`, data).then(r => r.data);

export const leaveConversation = (convId) =>
    api.delete(`/conversations/${convId}`).then(r => r.data);

// ─── MESSAGES ────────────────────────────────────────────────

export const getMessages = (convId, page = 1) =>
    api.get(`/conversations/${convId}/messages`, { params: { page } }).then(r => r.data);

export const sendMessage = (convId, contenu, typeMessage = 'TEXTE') =>
    api.post(`/conversations/${convId}/messages`, { contenu, type_message: typeMessage }).then(r => r.data);
