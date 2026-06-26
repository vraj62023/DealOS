import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/authSlice.js';
import companyReducer from './features/companySlice.js';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        company: companyReducer
    }
});