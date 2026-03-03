/**
 * Service Recherche — Appels API REST pour la recherche et le follow.
 */
import api from './api';

export const searchUsers = (params) =>
    api.get('/users/search', { params }).then(r => r.data);

export const getUserProfile = (userId) =>
    api.get(`/users/${userId}`).then(r => r.data);

export const followUser = (userId) =>
    api.post(`/users/${userId}/follow`).then(r => r.data);

export const unfollowUser = (userId) =>
    api.delete(`/users/${userId}/follow`).then(r => r.data);

export const getFollowers = (userId) =>
    api.get(`/users/${userId}/followers`).then(r => r.data);

export const getFollowing = (userId) =>
    api.get(`/users/${userId}/following`).then(r => r.data);
