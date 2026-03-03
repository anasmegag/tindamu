import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import quizReducer from './slices/quizSlice';
import resourcesReducer from './slices/resourceSlice';
import messagingReducer from './slices/messagingSlice';
import searchReducer from './slices/searchSlice';

const store = configureStore({
        reducer: {
                auth: authReducer,
                quiz: quizReducer,
                resources: resourcesReducer,
                messaging: messagingReducer,   // M3
                search: searchReducer,         // M3
                // feed: feedReducer,          // M1
                // profile: profileReducer,    // M4
        },
});

export default store;

