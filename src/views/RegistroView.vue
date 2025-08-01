<template>
  <div class="registro-container">
    <h2>Registro</h2>
    <form @submit.prevent="handleRegistro">
      <input v-model="correo" type="email" placeholder="Correo" required />
      <input v-model="contrasena" type="password" placeholder="Contraseña" required />
      <button type="submit">Registrarse</button>
      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="success" class="success">{{ success }}</p>
    </form>
    <router-link to="/login">¿Ya tienes cuenta? Inicia sesión</router-link>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { registro } from '../services/authService';

const correo = ref('');
const contrasena = ref('');
const error = ref('');
const success = ref('');
const router = useRouter();

async function handleRegistro() {
  error.value = '';
  success.value = '';
  try {
    const res = await registro(correo.value, contrasena.value);
    if (res.isSuccess) {
      success.value = res.message;
      setTimeout(() => router.push('/login'), 1500);
    } else {
      error.value = res.message || 'Error al registrar';
    }
  } catch (e) {
    error.value = 'Error al registrar';
  }
}
</script>

<style scoped>
.registro-container { max-width: 400px; margin: 50px auto; padding: 2rem; border-radius: 8px; background: #fff; box-shadow: 0 2px 8px #0001; }
input { display: block; width: 100%; margin-bottom: 1rem; padding: 0.5rem; }
button { width: 100%; padding: 0.7rem; background: #388e3c; color: #fff; border: none; border-radius: 4px; }
.error { color: red; margin-top: 1rem; }
.success { color: green; margin-top: 1rem; }
</style>
