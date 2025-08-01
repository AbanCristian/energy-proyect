<template>
  <div class="login-container">
    <h2>Iniciar sesión</h2>
    <form @submit.prevent="handleLogin">
      <input v-model="correo" type="email" placeholder="Correo" required />
      <input v-model="contrasena" type="password" placeholder="Contraseña" required />
      <button type="submit">Entrar</button>
      <p v-if="error" class="error">{{ error }}</p>
    </form>
    <router-link to="/registro">¿No tienes cuenta? Regístrate</router-link>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { login } from '../services/authService';

const correo = ref('');
const contrasena = ref('');
const error = ref('');
const router = useRouter();
const auth = useAuthStore();

async function handleLogin() {
  error.value = '';
  try {
    const res = await login(correo.value, contrasena.value);
    if (res.isSuccess) {
      auth.login(res.data);
      router.push('/');
    } else {
      error.value = res.message || 'Error al iniciar sesión';
    }
  } catch (e) {
    error.value = 'Credenciales incorrectas';
  }
}
</script>

<style scoped>
.login-container { max-width: 400px; margin: 50px auto; padding: 2rem; border-radius: 8px; background: #fff; box-shadow: 0 2px 8px #0001; }
input { display: block; width: 100%; margin-bottom: 1rem; padding: 0.5rem; }
button { width: 100%; padding: 0.7rem; background: #1976d2; color: #fff; border: none; border-radius: 4px; }
.error { color: red; margin-top: 1rem; }
</style>
