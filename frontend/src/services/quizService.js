import api from './api';

const quizService = {
    /**
     * Liste paginée des quiz publiés
     */
    getQuizzes: async (page = 1, perPage = 10, difficulty = null) => {
        const params = { page, per_page: perPage };
        if (difficulty) params.difficulty = difficulty;
        const response = await api.get('/quiz', { params });
        return response.data;
    },

    /**
     * Détail d'un quiz avec ses questions
     */
    getQuiz: async (quizId) => {
        const response = await api.get(`/quiz/${quizId}`);
        return response.data;
    },

    /**
     * Créer un nouveau quiz
     */
    createQuiz: async (quizData) => {
        const response = await api.post('/quiz', quizData);
        return response.data;
    },

    /**
     * Modifier un quiz
     */
    updateQuiz: async (quizId, quizData) => {
        const response = await api.put(`/quiz/${quizId}`, quizData);
        return response.data;
    },

    /**
     * Supprimer un quiz
     */
    deleteQuiz: async (quizId) => {
        const response = await api.delete(`/quiz/${quizId}`);
        return response.data;
    },

    /**
     * Démarrer une session de quiz (questions sans réponses)
     */
    startQuiz: async (quizId) => {
        const response = await api.post(`/quiz/${quizId}/start`);
        return response.data;
    },

    /**
     * Soumettre les réponses d'un quiz
     */
    submitQuiz: async (quizId, answers, timeSpent = null) => {
        const body = { answers };
        if (timeSpent !== null) body.time_spent = timeSpent;
        const response = await api.post(`/quiz/${quizId}/submit`, body);
        return response.data;
    },

    /**
     * Classement global
     */
    getLeaderboard: async (limit = 20) => {
        const response = await api.get('/quiz/leaderboard', { params: { limit } });
        return response.data;
    },

    /**
     * Historique des résultats de l'utilisateur connecté
     */
    getMyResults: async () => {
        const response = await api.get('/quiz/me/results');
        return response.data;
    },
};

export default quizService;
