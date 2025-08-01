// Servicio de autenticación
import axios from 'axios';

const API_URL = 'https://api-powergate.onrender.com/api/Auth';

export async function login(correo, contrasena) {
  const res = await axios.post(`${API_URL}/login`, { correo, contrasena });
  return res.data;
}

export async function registro(correo, contrasena) {
  const res = await axios.post(`${API_URL}/registro`, { correo, contrasena });
  return res.data;
}
