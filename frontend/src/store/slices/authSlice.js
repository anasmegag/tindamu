import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/authService';

// ── Thunks asynchrones ──────────────────────────────────────────────

export const login = createAsyncThunk(
    'auth/login',
    async (credentials, { rejectWithValue }) => {
        try {
            const data = await authService.login(credentials);
            return data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Erreur de connexion'
            );
        }
    }
);

export const register = createAsyncThunk(
    'auth/register',
    async (userData, { rejectWithValue }) => {
        try {
            const data = await authService.register(userData);
            return data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Erreur lors de l'inscription"
            );
        }
    }
);

export const fetchMe = createAsyncThunk(
    'auth/fetchMe',
    async (_, { rejectWithValue }) => {
        try {
            const data = await authService.getMe();
            return data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Erreur de récupération du profil'
            );
        }
    }
);

export const logout = createAsyncThunk('auth/logout', async () => {
    await authService.logout();
});

// ── Slice ────────────────────────────────────────────────────────────

const initialState = {
    user: null,
    isAuthenticated: !!localStorage.getItem('access_token'),
    loading: false,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // ── Login ──
            .addCase(login.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.user = action.payload.user;
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // ── Register ──
            .addCase(register.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(register.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // ── Fetch Me ──
            .addCase(fetchMe.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchMe.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.user = action.payload;
            })
            .addCase(fetchMe.rejected, (state) => {
                state.loading = false;
                state.isAuthenticated = false;
                state.user = null;
            })

            // ── Logout ──
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
                state.isAuthenticated = false;
            });
    },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
