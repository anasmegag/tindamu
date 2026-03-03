import api from './api';

const resourceService = {
    /**
     * Liste paginée des ressources avec filtres
     */
    getResources: async (page = 1, perPage = 10, filters = {}) => {
        const params = { page, per_page: perPage };
        if (filters.file_type) params.file_type = filters.file_type;
        if (filters.matiere) params.matiere = filters.matiere;
        if (filters.niveau) params.niveau = filters.niveau;
        const response = await api.get('/resources', { params });
        return response.data;
    },

    /**
     * Détail d'une ressource avec ses notes
     */
    getResource: async (resourceId) => {
        const response = await api.get(`/resources/${resourceId}`);
        return response.data;
    },

    /**
     * Créer une nouvelle ressource
     */
    createResource: async (resourceData) => {
        const response = await api.post('/resources', resourceData);
        return response.data;
    },

    /**
     * Supprimer une ressource
     */
    deleteResource: async (resourceId) => {
        const response = await api.delete(`/resources/${resourceId}`);
        return response.data;
    },

    /**
     * Noter une ressource (1-5 étoiles)
     */
    rateResource: async (resourceId, rating, comment = null) => {
        const body = { rating };
        if (comment) body.comment = comment;
        const response = await api.post(`/resources/${resourceId}/rate`, body);
        return response.data;
    },
};

export default resourceService;
