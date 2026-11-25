import { configureStore } from "@reduxjs/toolkit";
import appReducer from "../features/app/appSlice";
import pharmacyReducer from "../features/pharmacy/pharmacySlice";

export const store = configureStore({
  reducer: {
    app: appReducer,
    pharmacy: pharmacyReducer,
  },
});

export default store;
