import { create } from "zustand";
import api from "../services/api";

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: (user) =>
    set({
      user,
      isAuthenticated: true,
    }),

  // Update the authenticated user in memory (e.g. after a profile picture
  // change) without touching auth tokens.
  setUser: (user) => set({ user }),

  checkAuth: async () => {
    try {
      const response = await api.get("/auth/current-user");

      const user = response.data.data;

      set({
        user,
        isAuthenticated: true,
      });
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
      });
    } finally {
      set({
        isLoading: false,
      });
    }
  },

  
  logout: async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      set({
        user: null,
        isAuthenticated: false,
      });
    }
  },
}));

export default useAuthStore;