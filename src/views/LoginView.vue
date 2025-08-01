<template>
  <div class="form-container login-form">
    <div class="icon-wrapper">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        class="user-icon"
      >
        <path
          d="M12 2.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9zM4 19.5a8 8 0 0116 0H4z"
        />
      </svg>
    </div>
    <form @submit.prevent="handleLogin">
      <div class="input-group">
        <label for="correo">Correo electrónico</label>
        <input
          v-model="correo"
          id="correo"
          type="email"
          placeholder=" "
          required
        />
      </div>
      <div class="input-group">
        <label for="contrasena">Contraseña</label>
        <input
          v-model="contrasena"
          id="contrasena"
          type="password"
          placeholder=" "
          required
        />
      </div>
      <button type="submit">Iniciar sesión</button>
      <p v-if="error" class="error">{{ error }}</p>
    </form>
    <router-link to="/registro" class="link-text"
      >¿No tienes una cuenta? Regístrate</router-link
    >
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
/* Estilos generales para ambos formularios */
.form-container {
  max-width: 400px;
  margin: 50px auto;
  padding: 40px;
  background-color: #1548ef; /* Fondo azul oscuro */
  color: #dedbdb;
  border-radius: 20px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.icon-wrapper {
  margin-bottom: 20px;
  width: 100px;
  height: 100px;
  background-color: #fff;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
}

.user-icon {
  width: 80px;
  height: 80px;
  fill: #2a3a89;
}

form {
  width: 100%;
}

.input-group {
  margin-bottom: 20px;
  text-align: left;
}

.input-group label {
  display: block;
  font-size: 14px;
  margin-bottom: 5px;
}

input {
  width: 100%;
  padding: 12px;
  background-color: #f0f4f7;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  color: #333;
}

input:focus {
  outline: none;
  box-shadow: 0 0 0 2px #007bff;
}

button {
  width: 100%;
  padding: 15px;
  font-size: 18px;
  font-weight: bold;
  background-color: #007bff; /* Color azul */
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #0056b3;
}

.error {
  color: #ffcccc;
  margin-top: 15px;
  font-weight: bold;
}

.link-text {
  color: #fff;
  margin-top: 20px;
  text-decoration: underline;
  cursor: pointer;
  font-size: 14px;
}

.login-form h2 {
  display: none; /* Ocultamos el h2 de "Iniciar sesión" ya que no está en la imagen */
}
</style>