<template>
  <div class="form-container registro-form">
    <div class="back-button-container">
      <router-link to="/login" class="back-button">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="arrow-icon"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
          />
        </svg>
        Volver
      </router-link>
    </div>
    <form @submit.prevent="handleRegistro">
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
      <div class="input-group">
        <label for="confirmarContrasena">Confirmar contraseña</label>
        <input
          v-model="confirmarContrasena"
          id="confirmarContrasena"
          type="password"
          placeholder=" "
          required
        />
      </div>
      <button type="submit">Registrarse</button>
      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="success" class="success">{{ success }}</p>
    </form>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { registro } from '../services/authService';

const correo = ref('');
const contrasena = ref('');
const confirmarContrasena = ref(''); // Nuevo campo para el registro
const error = ref('');
const success = ref('');
const router = useRouter();

async function handleRegistro() {
  error.value = '';
  success.value = '';

  if (contrasena.value !== confirmarContrasena.value) {
    error.value = 'Las contraseñas no coinciden.';
    return;
  }

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
/* Estilos generales para ambos formularios */
.form-container {
  max-width: 400px;
  margin: 50px auto;
  padding: 40px;
  background-color: #1548ef; /* Fondo azul oscuro */
  color: #fff;
  border-radius: 20px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.registro-form h2 {
  display: none; /* Ocultamos el h2 de "Registro" ya que no está en la imagen */
}

.back-button-container {
  width: 100%;
  margin-bottom: 20px;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  text-decoration: none;
  font-size: 16px;
  font-weight: bold;
}

.arrow-icon {
  width: 24px;
  height: 24px;
  stroke: #fff;
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

.success {
  color: #ccffcc;
  margin-top: 15px;
  font-weight: bold;
}
</style>