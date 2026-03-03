import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import quizService from '../../services/quizService';

// ── Thunks asynchrones ──────────────────────────────────────────────

export const fetchQuizzes = createAsyncThunk(
    'quiz/fetchQuizzes',
    async ({ page = 1, perPage = 10, difficulty = null } = {}, { rejectWithValue }) => {
        try {
            return await quizService.getQuizzes(page, perPage, difficulty);
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Erreur de chargement des quiz');
        }
    }
);

export const fetchQuiz = createAsyncThunk(
    'quiz/fetchQuiz',
    async (quizId, { rejectWithValue }) => {
        try {
            return await quizService.getQuiz(quizId);
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Quiz introuvable');
        }
    }
);

export const createQuiz = createAsyncThunk(
    'quiz/createQuiz',
    async (quizData, { rejectWithValue }) => {
        try {
            return await quizService.createQuiz(quizData);
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Erreur de création');
        }
    }
);

export const startQuiz = createAsyncThunk(
    'quiz/startQuiz',
    async (quizId, { rejectWithValue }) => {
        try {
            return await quizService.startQuiz(quizId);
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Impossible de démarrer le quiz');
        }
    }
);

export const submitQuiz = createAsyncThunk(
    'quiz/submitQuiz',
    async ({ quizId, answers, timeSpent }, { rejectWithValue }) => {
        try {
            return await quizService.submitQuiz(quizId, answers, timeSpent);
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Erreur de soumission');
        }
    }
);

export const fetchLeaderboard = createAsyncThunk(
    'quiz/fetchLeaderboard',
    async (limit = 20, { rejectWithValue }) => {
        try {
            return await quizService.getLeaderboard(limit);
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Erreur de chargement du classement');
        }
    }
);

export const fetchMyResults = createAsyncThunk(
    'quiz/fetchMyResults',
    async (_, { rejectWithValue }) => {
        try {
            return await quizService.getMyResults();
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Erreur de chargement des résultats');
        }
    }
);

// ── Slice ────────────────────────────────────────────────────────────

const initialState = {
    // Liste des quiz
    quizzes: [],
    total: 0,
    pages: 0,
    currentPage: 1,

    // Quiz en cours de jeu
    currentQuiz: null,
    session: null, // données de session (questions sans réponses)

    // Résultat après soumission
    lastResult: null,

    // Leaderboard
    leaderboard: [],

    // Mes résultats
    myResults: [],

    // État UI
    loading: false,
    error: null,
};

const quizSlice = createSlice({
    name: 'quiz',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearSession: (state) => {
            state.session = null;
            state.lastResult = null;
        },
        clearCurrentQuiz: (state) => {
            state.currentQuiz = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // ── Fetch Quizzes ──
            .addCase(fetchQuizzes.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchQuizzes.fulfilled, (state, action) => {
                state.loading = false;
                state.quizzes = action.payload.quizzes;
                state.total = action.payload.total;
                state.pages = action.payload.pages;
                state.currentPage = action.payload.current_page;
            })
            .addCase(fetchQuizzes.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // ── Fetch Quiz ──
            .addCase(fetchQuiz.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchQuiz.fulfilled, (state, action) => {
                state.loading = false;
                state.currentQuiz = action.payload;
            })
            .addCase(fetchQuiz.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // ── Create Quiz ──
            .addCase(createQuiz.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createQuiz.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(createQuiz.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // ── Start Quiz ──
            .addCase(startQuiz.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(startQuiz.fulfilled, (state, action) => {
                state.loading = false;
                state.session = action.payload;
            })
            .addCase(startQuiz.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // ── Submit Quiz ──
            .addCase(submitQuiz.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(submitQuiz.fulfilled, (state, action) => {
                state.loading = false;
                state.lastResult = action.payload;
                state.session = null;
            })
            .addCase(submitQuiz.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // ── Leaderboard ──
            .addCase(fetchLeaderboard.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchLeaderboard.fulfilled, (state, action) => {
                state.loading = false;
                state.leaderboard = action.payload.leaderboard;
            })
            .addCase(fetchLeaderboard.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // ── My Results ──
            .addCase(fetchMyResults.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchMyResults.fulfilled, (state, action) => {
                state.loading = false;
                state.myResults = action.payload.results;
            })
            .addCase(fetchMyResults.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearError, clearSession, clearCurrentQuiz } = quizSlice.actions;
export default quizSlice.reducer;
