import { API_BASE_URL, WS_BASE_URL } from "@/config";

// Configuración común para las peticiones
const commonHeaders = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true' // Para evitar la página de advertencia de ngrok
};

export const apiUrls = {
    canalRele: `${API_BASE_URL}/Canal/rele`,
    canalEstado: dispositivoId => `${API_BASE_URL}/Canal/${dispositivoId}/estado`,
    dispositivoEstado: dispositivoId => `${API_BASE_URL}/Dispositivo/${dispositivoId}/estado`,
    // URL genérica para obtener dispositivo por ID
    dispositivo: dispositivoId => `${API_BASE_URL}/Dispositivo/${dispositivoId}/estado`,
};

export const wsUrls = {
    deviceHub: deviceId => `${WS_BASE_URL}?deviceId=${deviceId}`,
};

// POST /api/Canal/rele - Cambiar estado del relé
export async function setCanalRele({ canalId, releActivo }) {
    try {
        console.log('Enviando cambio de estado:', { canalId, releActivo });
        const response = await fetch(apiUrls.canalRele, {
            method: 'POST',
            headers: commonHeaders,
            body: JSON.stringify({ canalId, releActivo }),
        });
        
        if (!response.ok) {
            throw new Error(`Error al cambiar estado del relé: ${response.status} ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
            const text = await response.text();
            console.error('Response no es JSON:', text.substring(0, 200));
            throw new Error(`El servidor devolvió ${contentType} en lugar de JSON`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error en setCanalRele:', error);
        throw error;
    }
}

// GET /api/Canal/{dispositivoId}/estado
export async function getCanalEstado(dispositivoId) {
    try {
        const response = await fetch(apiUrls.canalEstado(dispositivoId), {
            headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        
        if (!response.ok) {
            throw new Error(`Error al obtener estado del canal: ${response.status} ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
            const text = await response.text();
            console.error('Response no es JSON:', text.substring(0, 200));
            throw new Error(`El servidor devolvió ${contentType} en lugar de JSON`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error en getCanalEstado:', error);
        throw error;
    }
}

// GET /api/Dispositivo/{dispositivoId}/estado
export async function getDispositivoEstado(dispositivoId) {
    try {
        const response = await fetch(apiUrls.dispositivoEstado(dispositivoId), {
            headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        
        if (!response.ok) {
            throw new Error(`Error al obtener estado del dispositivo: ${response.status} ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
            const text = await response.text();
            console.error('Response no es JSON:', text.substring(0, 200));
            throw new Error(`El servidor devolvió ${contentType} en lugar de JSON`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error en getDispositivoEstado:', error);
        throw error;
    }
}

// GET /api/Dispositivo/1/estado - Para obtener dispositivo por defecto
export async function getDevice() {
    try {
        console.log('Intentando conectar a:', apiUrls.dispositivo(1));
        const response = await fetch(apiUrls.dispositivo(1), {
            headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
            const text = await response.text();
            console.error('Response no es JSON:', text.substring(0, 200));
            throw new Error(`El servidor devolvió ${contentType} en lugar de JSON`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error en getDevice:', error);
        throw error;
    }
}

// GET /api/Dispositivo/{id}/estado - Obtener datos de un dispositivo específico con formato personalizado
export async function getOneDeviceData({ id }) {
    try {
        console.log('Intentando conectar a:', apiUrls.dispositivo(id));
        const response = await fetch(apiUrls.dispositivo(id), {
            headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Fallo la carga de datos ${response.status}: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
            const text = await response.text();
            console.error('Response no es JSON:', text.substring(0, 200));
            throw new Error(`El servidor devolvió ${contentType} en lugar de JSON`);
        }
        
        const device = await response.json();
        console.log('Device data received:', device);

        const newObjDevice = {
            ubicacion: device.data?.ubicacion || 'Ubicación no disponible',
            canales: device.data?.canales || []
        };

        return newObjDevice;
    } catch (error) {
        console.error('Error al conectar con el servicio', error);
        throw error;
    }
}

// POST /api/Canal/rele - Alias para compatibilidad con el código existente
export async function sentChangeStateWS({ channelId, state }) {
    return setCanalRele({ canalId: channelId, releActivo: state });
}

// WebSocket connection for deviceHub
export function connectDeviceHub(deviceId, onMessage) {
    const ws = new WebSocket(wsUrls.deviceHub(deviceId));
    ws.onmessage = event => {
        if (onMessage) onMessage(JSON.parse(event.data));
    };
    return ws;
}