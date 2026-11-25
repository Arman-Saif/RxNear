import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  pharmacies: [],
  currentPharmacy: null,
  searchStatus: "idle",
  searchError: null,
  searchMeta: {
    searchRadius: null,
    resultCount: 0,
    expandedSearch: false,
    partialResults: false,
    message: "",
  },
};

const pharmacySlice = createSlice({
  name: "pharmacy",
  initialState,
  reducers: {
    setPharmacies(state, action) {
      state.pharmacies = action.payload;
      state.searchStatus = "succeeded";
      state.searchError = null;
    },

    setCurrentPharmacy(state, action) {
      state.currentPharmacy = action.payload;
    },

    setSearchStatus(state, action) {
      state.searchStatus = action.payload;
    },

    setSearchError(state, action) {
      state.searchError = action.payload;
      state.searchStatus = "failed";
    },

    setSearchMeta(state, action) {
      state.searchMeta = {
        ...state.searchMeta,
        ...action.payload,
      };
    },

    clearPharmacies(state) {
      state.pharmacies = [];
      state.currentPharmacy = null;
      state.searchStatus = "idle";
      state.searchError = null;
      state.searchMeta = {
        searchRadius: null,
        resultCount: 0,
        expandedSearch: false,
        partialResults: false,
        message: "",
      };
    },

    resetSearch(state) {
      state.searchStatus = "idle";
      state.searchError = null;
    },
  },
});

export const {
  setPharmacies,
  setCurrentPharmacy,
  setSearchStatus,
  setSearchError,
  setSearchMeta,
  clearPharmacies,
  resetSearch,
} = pharmacySlice.actions;

export default pharmacySlice.reducer;
