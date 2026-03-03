import api from './api';

const authService = {
    /**
     * Inscription d'un nouvel étudiant
     */
    register: async (userData) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },

    /**
     * Connexion → retourne access_token + refresh_token
     */
    login: async (credentials) => {
        const response = await api.post('/auth/login', credentials);
        const { access_token, refresh_token, user } = response.data;

        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        localStorage.setItem('user_id', user.id);

        return { user, access_token, refresh_token };
    },

    /**
     * Déconnexion — supprime les tokens
     */
    logout: async () => {
        try {
            await api.post('/auth/logout');
        } catch {
            // Même si le serveur échoue, on supprime les tokens localement
        }
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    },

    /**
     * Récupérer le profil de l'utilisateur connecté
     */
    getMe: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },

    /**
     * Modifier le profil (bio, avatar, spécialité)
     */
    updateMe: async (data) => {
        const response = await api.put('/auth/me', data);
        return response.data;
    },
};

export default authService;
