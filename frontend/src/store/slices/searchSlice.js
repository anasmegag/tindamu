/**
 * Redux slice — Recherche d'utilisateurs.
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as searchApi from '../../services/searchService';

export const searchForUsers = createAsyncThunk(
    'search/searchUsers',
    async (params, { rejectWithValue }) => {
        try {
            return await searchApi.searchUsers(params);
        } catch (err) {
            return rejectWithValue(err.response?.data?.error || 'Erreur');
        }
    }
);

export const fetchUserProfile = createAsyncThunk(
    'search/fetchProfile',
    async (userId, { rejectWithValue }) => {
        try {
            return await searchApi.getUserProfile(userId);
        } catch (err) {
            return rejectWithValue(err.response?.data?.error || 'Erreur');
        }
    }
);

export const toggleFollow = createAsyncThunk(
    'search/toggleFollow',
    async ({ userId, isFollowing }, { rejectWithValue }) => {
        try {
            if (isFollowing) {
                await searchApi.unfollowUser(userId);
            } else {
                await searchApi.followUser(userId);
            }
            return { userId, isFollowing: !isFollowing };
        } catch (err) {
            return rejectWithValue(err.response?.data?.error || 'Erreur');
        }
    }
);

const searchSlice = createSlice({
    name: 'search',
    initialState: {
        results: [],
        total: 0,
        selectedProfile: null,
        loading: false,
        error: null,
    },
    reducers: {
        clearSearch: (state) => {
            state.results = [];
            state.total = 0;
        },
        clearProfile: (state) => {
            state.selectedProfile = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(searchForUsers.pending, (state) => { state.loading = true; })
            .addCase(searchForUsers.fulfilled, (state, action) => {
                state.loading = false;
                state.results = action.payload.users;
                state.total = action.payload.total;
            })
            .addCase(searchForUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(fetchUserProfile.fulfilled, (state, action) => {
                state.selectedProfile = action.payload;
            })
            .addCase(toggleFollow.fulfilled, (state, action) => {
                const { userId, isFollowing } = action.payload;
                if (state.selectedProfile?.id === userId) {
                    state.selectedProfile.is_following = isFollowing;
                }
                const user = state.results.find(u => u.id === userId);
                if (user) user.is_following = isFollowing;
            });
    },
});

export const { clearSearch, clearProfile } = searchSlice.actions;
export default searchSlice.reducer;
