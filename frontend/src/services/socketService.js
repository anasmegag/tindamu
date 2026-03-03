/**
 * Service Socket.IO — Connexion temps réel pour la messagerie.
 */
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const connectSocket = () => {
    if (socket?.connected) return socket;

    socket = io(SOCKET_URL, {
        transports: ['polling'],
        autoConnect: false,
    });

    socket.connect();
    return socket;
};

export const authenticateSocket = () => {
    const token = localStorage.getItem('access_token');
    if (socket && token) {
        socket.emit('authenticate', { token });
    }
};

export const joinConversation = (conversationId) => {
    if (socket) {
        socket.emit('join_conversation', { conversation_id: conversationId });
    }
};

export const sendSocketMessage = (conversationId, contenu) => {
    if (socket) {
        socket.emit('send_message', {
            conversation_id: conversationId,
            contenu,
        });
    }
};

export const onNewMessage = (callback) => {
    if (socket) {
        socket.on('new_message', callback);
    }
};

export const offNewMessage = () => {
    if (socket) {
        socket.off('new_message');
    }
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export const getSocket = () => socket;
