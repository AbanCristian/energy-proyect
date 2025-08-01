// Store de autenticación con Pinia
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    isAuthenticated: !!localStorage.getItem('user'),
  }),
  actions: {
    login(user) {
      this.user = user;
      this.isAuthenticated = true;
      localStorage.setItem('user', JSON.stringify(user));
    },
    logout() {
      this.user = null;
      this.isAuthenticated = false;
      localStorage.removeItem('user');
    },
  },
});
