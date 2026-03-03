import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import resourceService from '../../services/resourceService';

// ── Thunks asynchrones ──────────────────────────────────────────────

export const fetchResources = createAsyncThunk(
    'resources/fetchResources',
    async ({ page = 1, perPage = 10, filters = {} } = {}, { rejectWithValue }) => {
        try {
            return await resourceService.getResources(page, perPage, filters);
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Erreur de chargement');
        }
    }
);

export const fetchResource = createAsyncThunk(
    'resources/fetchResource',
    async (resourceId, { rejectWithValue }) => {
        try {
            return await resourceService.getResource(resourceId);
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Ressource introuvable');
        }
    }
);

export const createResource = createAsyncThunk(
    'resources/createResource',
    async (resourceData, { rejectWithValue }) => {
        try {
            return await resourceService.createResource(resourceData);
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Erreur lors de la création');
        }
    }
);

export const rateResource = createAsyncThunk(
    'resources/rateResource',
    async ({ resourceId, rating, comment }, { rejectWithValue }) => {
        try {
            return await resourceService.rateResource(resourceId, rating, comment);
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Erreur lors de la notation');
        }
    }
);

export const deleteResource = createAsyncThunk(
    'resources/deleteResource',
    async (resourceId, { rejectWithValue }) => {
        try {
            await resourceService.deleteResource(resourceId);
            return resourceId;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Erreur lors de la suppression');
        }
    }
);

// ── Slice ────────────────────────────────────────────────────────────

const initialState = {
    resources: [],
    total: 0,
    pages: 0,
    currentPage: 1,
    currentResource: null,
    loading: false,
    error: null,
};

const resourceSlice = createSlice({
    name: 'resources',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearCurrentResource: (state) => {
            state.currentResource = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // ── Fetch Resources ──
            .addCase(fetchResources.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchResources.fulfilled, (state, action) => {
                state.loading = false;
                state.resources = action.payload.resources;
                state.total = action.payload.total;
                state.pages = action.payload.pages;
                state.currentPage = action.payload.current_page;
            })
            .addCase(fetchResources.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // ── Fetch Resource ──
            .addCase(fetchResource.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchResource.fulfilled, (state, action) => {
                state.loading = false;
                state.currentResource = action.payload;
            })
            .addCase(fetchResource.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // ── Create Resource ──
            .addCase(createResource.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createResource.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(createResource.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // ── Rate Resource ──
            .addCase(rateResource.fulfilled, (state, action) => {
                state.currentResource = action.payload;
            })
            .addCase(rateResource.rejected, (state, action) => {
                state.error = action.payload;
            })

            // ── Delete Resource ──
            .addCase(deleteResource.fulfilled, (state, action) => {
                state.resources = state.resources.filter(r => r.id !== action.payload);
            })
            .addCase(deleteResource.rejected, (state, action) => {
                state.error = action.payload;
            });
    },
});

export const { clearError, clearCurrentResource } = resourceSlice.actions;
export default resourceSlice.reducer;
