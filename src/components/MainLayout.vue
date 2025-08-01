
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
        <router-link to="/" class="menu-item">Inicio</router-link>
        <router-link to="/devices" class="menu-item">Dispositivos</router-link>
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
