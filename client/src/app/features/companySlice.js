import { createSlice } from "@reduxjs/toolkit";

const companySlice = createSlice({
    name: 'company',
    initialState: {
        data: null,
        loading: false,
    },
    reducers: {
        setCompany: (state, action) => {
            state.data = action.payload;
        },
        clearCompany: (state) => {
            state.data = null;
        }
    }
});

export const { setCompany, clearCompany } = companySlice.actions;
export default companySlice.reducer;