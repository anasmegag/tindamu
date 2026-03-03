/**
 * Redux slice — Messagerie (conversations + messages).
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as msgApi from '../../services/messagingService';

// ─── Async Thunks ────────────────────────────────────────────

export const fetchConversations = createAsyncThunk(
    'messaging/fetchConversations',
    async (_, { rejectWithValue }) => {
        try {
            return await msgApi.getConversations();
        } catch (err) {
            return rejectWithValue(err.response?.data?.error || 'Erreur');
        }
    }
);

export const fetchMessages = createAsyncThunk(
    'messaging/fetchMessages',
    async ({ convId, page = 1 }, { rejectWithValue }) => {
        try {
            return await msgApi.getMessages(convId, page);
        } catch (err) {
            return rejectWithValue(err.response?.data?.error || 'Erreur');
        }
    }
);

export const sendNewMessage = createAsyncThunk(
    'messaging/sendMessage',
    async ({ convId, contenu }, { rejectWithValue }) => {
        try {
            return await msgApi.sendMessage(convId, contenu);
        } catch (err) {
            return rejectWithValue(err.response?.data?.error || 'Erreur');
        }
    }
);

export const createGroup = createAsyncThunk(
    'messaging/createGroup',
    async ({ nom, memberIds }, { rejectWithValue }) => {
        try {
            return await msgApi.createGroupConversation(nom, memberIds);
        } catch (err) {
            return rejectWithValue(err.response?.data?.error || 'Erreur');
        }
    }
);

// ─── Slice ───────────────────────────────────────────────────

const messagingSlice = createSlice({
    name: 'messaging',
    initialState: {
        conversations: [],
        activeConversation: null,
        messages: [],
        totalMessages: 0,
        currentPage: 1,
        hasMore: false,
        loading: false,
        error: null,
    },
    reducers: {
        setActiveConversation: (state, action) => {
            state.activeConversation = action.payload;
            state.messages = [];
            state.currentPage = 1;
        },
        addRealtimeMessage: (state, action) => {
            const msg = action.payload;
            // Éviter les doublons
            if (!state.messages.find(m => m.id === msg.id)) {
                state.messages.unshift(msg);
            }
        },
        clearMessaging: (state) => {
            state.activeConversation = null;
            state.messages = [];
        },
    },
    extraReducers: (builder) => {
        builder
            // fetchConversations
            .addCase(fetchConversations.pending, (state) => { state.loading = true; })
            .addCase(fetchConversations.fulfilled, (state, action) => {
                state.loading = false;
                state.conversations = action.payload;
            })
            .addCase(fetchConversations.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // fetchMessages
            .addCase(fetchMessages.fulfilled, (state, action) => {
                const { messages, total, has_next, current_page } = action.payload;
                if (current_page === 1) {
                    state.messages = messages;
                } else {
                    state.messages = [...state.messages, ...messages];
                }
                state.totalMessages = total;
                state.hasMore = has_next;
                state.currentPage = current_page;
            })
            // sendMessage
            .addCase(sendNewMessage.fulfilled, (state, action) => {
                state.messages.unshift(action.payload);
            })
            // createGroup
            .addCase(createGroup.fulfilled, (state, action) => {
                state.conversations.unshift(action.payload);
                state.activeConversation = action.payload;
            });
    },
});

export const { setActiveConversation, addRealtimeMessage, clearMessaging } = messagingSlice.actions;
export default messagingSlice.reducer;
