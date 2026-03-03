import api from './api';

/**
 * Service pour interagir avec le Feed (Posts, Swipes, Matches).
 */
const feedService = {
    /**
     * Crée un nouveau post.
     * @param {Object} postData { type, thematique, titre, contenu, tags }
     */
    createPost: async (postData) => {
        const response = await api.post('/feed/posts', postData);
        return response.data;
    },

    /**
     * Récupère les posts pour la découverte (Tinder feed).
     */
    getDiscoveryFeed: async () => {
        const response = await api.get('/feed/posts');
        return response.data;
    },

    /**
     * Envoie un swipe (LIKE/SKIP) pour un post.
     * @param {string} postId 
     * @param {string} direction 'LIKE' | 'SKIP'
     */
    swipe: async (postId, direction) => {
        const response = await api.post('/feed/swipe', { post_id: postId, direction });
        return response.data;
    }
};

export default feedService;
