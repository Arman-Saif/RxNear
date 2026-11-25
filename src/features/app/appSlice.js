import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  theme: "light",
  permissionModalOpen: false,
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setTheme(state, action) {
      state.theme = action.payload;
    },

    toggleTheme(state) {
      state.theme = state.theme === "light" ? "dark" : "light";
    },

    setPermissionModalOpen(state, action) {
      state.permissionModalOpen = action.payload;
    },
  },
});

export const { setTheme, toggleTheme, setPermissionModalOpen } =
  appSlice.actions;

export default appSlice.reducer;
