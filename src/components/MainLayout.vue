
<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="profile">
        <!-- <img src="https://via.placeholder.com/80" alt="avatar" class="avatar" /> -->
        <p class="username">Bienvenido {{ userCorreo }}</p>
        <p class="role">Estudiante</p>
        <button class="logout-btn" @click="handleLogout">Cerrar sesión</button>
      </div>
      <nav class="menu">
        <router-link to="/" class="menu-item">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-grid-3x3-gap-fill" viewBox="0 0 16 16">
            <path d="M1 2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1zM1 7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1zM1 12a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1z"/>
          </svg>
          Inicio 
        </router-link>
        <router-link to="/devices" class="menu-item">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-usb-symbol" viewBox="0 0 16 16">
            <path d="m7.792.312-1.533 2.3A.25.25 0 0 0 6.467 3H7.5v7.319a2.5 2.5 0 0 0-.515-.298L5.909 9.56A1.5 1.5 0 0 1 5 8.18v-.266a1.5 1.5 0 1 0-1 0v.266a2.5 2.5 0 0 0 1.515 2.298l1.076.461a1.5 1.5 0 0 1 .888 1.129 2.001 2.001 0 1 0 1.021-.006v-.902a1.5 1.5 0 0 1 .756-1.303l1.484-.848A2.5 2.5 0 0 0 11.995 7h.755a.25.25 0 0 0 .25-.25v-2.5a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25v2.5c0 .138.112.25.25.25h.741a1.5 1.5 0 0 1-.747 1.142L8.76 8.99a3 3 0 0 0-.26.17V3h1.033a.25.25 0 0 0 .208-.389L8.208.312a.25.25 0 0 0-.416 0"/>
          </svg>
          Dispositivos
        </router-link>
      </nav>
    </aside>

    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
const auth = useAuthStore();
const router = useRouter();
const userCorreo = auth.user?.correo || 'usuario';

function handleLogout() {
  auth.logout();
  router.push('/login');
}
</script>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
  background-color: #f5f5f5;
}

.sidebar {
  width: 240px;
  background-color: #084cdf;
  color: white;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.profile {
  text-align: center;
  margin-bottom: 30px;
}

.avatar {
  width: 80px;
  border-radius: 50%;
  margin-bottom: 10px;
}

.username {
  font-weight: bold;
}

.role {
  font-size: 0.9em;
  color: #ccc;
}

.menu {
  display: flex;
  flex-direction: column;
}

.menu-item {
  color: white;
  padding: 10px;
  margin: 5px 0;
  background-color: transparent;
  border-radius: 6px;
  text-decoration: none;
}

.menu-item:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

  .content {
    flex: 1;
    padding: 30px;
    overflow-y: auto;
    background-color: #e9e9e9;
  }
  .logout-btn {
    margin-top: 15px;
    padding: 8px 16px;
    background: #e53935;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    width: 100%;
  }
  .logout-btn:hover {
    background: #b71c1c;
  }
</style>
