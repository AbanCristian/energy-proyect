// Servicio de autenticación
import { API_BASE_URL } from "@/config";

export const authUrls = {
    login: `${API_BASE_URL}/Auth/login`,
    registro: `${API_BASE_URL}/Auth/registro`,
};

export async function login(correo, contrasena) {
    const response = await fetch(authUrls.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, contrasena }),
    });
    
    if (!response.ok) {
        throw new Error(`Error en login: ${response.status}`);
    }
    
    return response.json();
}

export async function registro(correo, contrasena) {
    const response = await fetch(authUrls.registro, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, contrasena }),
    });
    
    if (!response.ok) {
        throw new Error(`Error en registro: ${response.status}`);
    }
    
    return response.json();
}
