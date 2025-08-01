<template>
  <div class="device-activity-container">
    <div class="header">
        <button @click="$router.back()" class="back-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-arrow-left-circle" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8m15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-4.5-.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5z"/>
            </svg>
            <br>
            Volver
        </button>
        <br>
      <h2>Actividad del dispositivo “{{ device.ubicacion }}”</h2>
    </div>

    <div v-if="isLoading" class="modal-carga">
        <div class="modal-contenido">
            <p>{{ loadingMessage }}</p>
        </div>
    </div>

    <div v-if="isLoadingData" class="modal-carga">
      <div class="modal-contenido">
        <p>Recopilando información...</p>
      </div>
    </div>

    <!-- Estado de conexión WebSocket -->
    <div class="connection-status">
      <div class="status-indicator" :class="deviceStatus.status">
        <span class="status-dot"></span>
        <span>{{ deviceStatus.text }}</span>
      </div>
      <div v-if="deviceStatus.lastUpdate" class="last-update">
        Última actualización: {{ formatTime(deviceStatus.lastUpdate) }}
      </div>
      <div class="websocket-info">
        <small>
          📡 WebSocket: {{ wsConnection?.readyState === 1 ? 'Conectado' : 'Desconectado' }}
          | 🏠 Dispositivo: {{ telemetryData ? 'Online' : 'Sin datos' }}
        </small>
      </div>
    </div>

    <!-- Información básica del dispositivo -->
    <div class="card">
      <p><strong>Ubicación:</strong> {{ device.ubicacion }}</p>
      <p><strong>Device ID:</strong> {{ deviceId }}</p>
      
      <!-- Datos de telemetría en tiempo real -->
      <div v-if="telemetryData" class="telemetry-section">
        <h3>Mediciones Eléctricas</h3>
        <div class="telemetry-grid">
          <div class="metric">
            <div class="metric-label">Voltaje</div>
            <div class="metric-value">{{ telemetryData.voltios?.toFixed(2) || '--' }} V</div>
          </div>
          <div class="metric">
            <div class="metric-label">Corriente</div>
            <div class="metric-value">{{ telemetryData.amperios?.toFixed(2) || '--' }} A</div>
          </div>
          <div class="metric">
            <div class="metric-label">Potencia</div>
            <div class="metric-value">{{ telemetryData.vatios?.toFixed(2) || '--' }} W</div>
          </div>
        </div>
      </div>

      <p><strong>Control de Relés</strong></p>

      <div v-for="(canal, index) in device.canales" :key="canal.canalId" class="plug-section">
        <p class="channel-title">Canal {{ canal.canalId }}</p>
        <div class="status-container">
          <p>
            Estado del relé:
            <span :class="canal.releActivo ? 'status-on' : 'status-off'">
              {{ canal.releActivo ? 'Activo' : 'Bloqueado' }}
            </span>
          </p>
          <button
            @click="toggleRele(canal.canalId, canal.releActivo, index)"
            :class="['action-button', canal.releActivo ? 'turn-off' : 'turn-on']"
            :disabled="isLoading"
          >
            {{ canal.releActivo ? 'Bloquear' : 'Desbloquear' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { getOneDeviceData, setCanalRele, connectDeviceHub } from '@/services/external'
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const deviceId = parseInt(route.query.id)

// Estado reactivo
const isLoading = ref(false)
const isLoadingData = ref(true)
const loadingMessage = ref('Bloqueando el puerto...')

const device = ref({
  ubicacion: '',
  canales: []
})

// Datos de telemetría en tiempo real
const telemetryData = ref(null)

// Estado de conexión del dispositivo
const deviceStatus = ref({
  status: 'offline',
  text: 'Desconectado',
  lastUpdate: null
})

// WebSocket connection
let wsConnection = null

onMounted(async () => {
  if (deviceId) {
    try {
      // Cargar datos iniciales del dispositivo
      await loadDeviceData()
      
      // Conectar WebSocket para datos en tiempo real
      connectToWebSocket()
      
      // Activar simulación para pruebas (solo en desarrollo)
      simulateWebSocketMessages()
    } catch (e) {
      console.error('Error al cargar datos del dispositivo:', e)
    } finally {
      isLoadingData.value = false
    }
  }
})

onUnmounted(() => {
  // Cerrar conexión WebSocket al salir del componente
  if (wsConnection) {
    wsConnection.close()
  }
})

// Cargar datos del dispositivo desde la API
const loadDeviceData = async () => {
  try {
    console.log('Cargando datos del dispositivo:', deviceId)
    const response = await getOneDeviceData({ id: deviceId })
    device.value = response
    console.log('Datos del dispositivo cargados:', response)
  } catch (error) {
    console.error('Error al cargar dispositivo:', error)
    throw error
  }
}

// Conectar al WebSocket para recibir datos en tiempo real
const connectToWebSocket = () => {
  try {
    console.log('🔌 Conectando WebSocket para dispositivo:', deviceId)
    console.log('🔗 URL WebSocket:', `wss://3b423adeb4d0.ngrok-free.app/ws/web?deviceId=${deviceId}`)
    
    wsConnection = connectDeviceHub(deviceId, (data) => {
      console.log('📨 Mensaje WebSocket recibido:', data)
      handleWebSocketMessage(data)
    })

    // Manejar eventos de conexión
    wsConnection.onopen = () => {
      console.log('✅ WebSocket conectado exitosamente')
      deviceStatus.value = {
        status: 'online',
        text: 'Conectado al WebSocket',
        lastUpdate: new Date().toISOString()
      }
    }

    wsConnection.onerror = (error) => {
      console.error('❌ Error en WebSocket:', error)
      deviceStatus.value = {
        status: 'error',
        text: 'Error de conexión WebSocket',
        lastUpdate: new Date().toISOString()
      }
    }

    wsConnection.onclose = (event) => {
      console.log('🔌 WebSocket desconectado. Código:', event.code, 'Razón:', event.reason)
      deviceStatus.value = {
        status: 'offline',
        text: 'WebSocket desconectado',
        lastUpdate: new Date().toISOString()
      }
      
      // Intentar reconectar después de 5 segundos
      setTimeout(() => {
        if (!wsConnection || wsConnection.readyState === WebSocket.CLOSED) {
          console.log('🔄 Intentando reconectar WebSocket...')
          connectToWebSocket()
        }
      }, 5000)
    }
  } catch (error) {
    console.error('❌ Error al inicializar WebSocket:', error)
    deviceStatus.value = {
      status: 'error',
      text: 'Error al conectar WebSocket',
      lastUpdate: new Date().toISOString()
    }
  }
}

// Manejar mensajes del WebSocket
const handleWebSocketMessage = (data) => {
  console.log('Procesando mensaje WebSocket:', data)
  
  if (data.type === 'device_status') {
    // Actualizar estado del dispositivo (online/offline)
    deviceStatus.value = {
      status: data.status,
      text: data.status === 'online' ? 'Conectado' : 'Desconectado',
      lastUpdate: data.timestamp
    }
    console.log('Estado del dispositivo actualizado:', data.status)
  } 
  else if (data.type === 'telemetry') {
    // Actualizar datos de telemetría en tiempo real
    telemetryData.value = {
      voltios: data.voltios,
      amperios: data.amperios,
      vatios: data.vatios,
      timestamp: data.timestamp
    }
    
    // Si recibimos telemetría, el dispositivo está online
    deviceStatus.value = {
      status: 'online',
      text: 'Conectado',
      lastUpdate: data.timestamp
    }
    console.log('Datos de telemetría actualizados:', data)
  }
  else if (data.canales) {
    // Actualizar estado de los canales/relés en tiempo real desde WebSocket
    console.log('Actualizando estado de canales desde WebSocket:', data.canales)
    device.value.canales = data.canales
  }
  else if (data.canalId && typeof data.releActivo !== 'undefined') {
    // Actualizar un canal específico desde WebSocket
    const canalIndex = device.value.canales.findIndex(c => c.canalId === data.canalId)
    if (canalIndex !== -1) {
      device.value.canales[canalIndex].releActivo = data.releActivo
      console.log(`Canal ${data.canalId} actualizado a ${data.releActivo} desde WebSocket`)
    }
  }
}

// Cambiar estado del relé (solo API - el WebSocket confirmará el cambio)
const toggleRele = async (canalId, currentState, index) => {
  isLoading.value = true
  const newState = !currentState
  loadingMessage.value = newState ? 'Desbloqueando el puerto...' : 'Bloqueando el puerto...'
  
  try {
    console.log('Enviando comando de cambio de relé a la API:', { canalId, releActivo: newState })
    
    // Solo enviar el comando a la API - NO actualizar el estado local aquí
    const response = await setCanalRele({ 
      canalId: canalId, 
      releActivo: newState 
    })
    
    console.log('Respuesta de la API:', response)
    
    if (response.isSuccess === false) {
      console.error('Error al cambiar estado del relé:', response.message)
      // Mostrar error al usuario si es necesario
    } else {
      console.log('Comando enviado exitosamente. Esperando confirmación del WebSocket...')
      // El estado se actualizará cuando llegue la confirmación por WebSocket
    }
  } catch (error) {
    console.error('Error al enviar comando a la API:', error)
    // En caso de error, mantener el estado original
  } finally {
    isLoading.value = false
  }
}

// Formatear tiempo para mostrar
const formatTime = (timestamp) => {
  if (!timestamp) return '--'
  return new Date(timestamp).toLocaleTimeString('es-ES')
}

// Función de prueba para simular mensajes WebSocket (solo para desarrollo)
const simulateWebSocketMessages = () => {
  if (import.meta.env.DEV) {
    console.log('🧪 Modo desarrollo: simulando mensajes WebSocket cada 10 segundos')
    
    let counter = 0
    setInterval(() => {
      counter++
      
      if (counter % 3 === 0) {
        // Simular datos de telemetría
        handleWebSocketMessage({
          type: 'telemetry',
          deviceId: deviceId.toString(),
          voltios: 220 + Math.random() * 10,
          amperios: 1.5 + Math.random() * 0.5,
          vatios: 300 + Math.random() * 100,
          timestamp: new Date().toISOString()
        })
      } else if (counter % 5 === 0) {
        // Simular cambio de estado del dispositivo
        handleWebSocketMessage({
          type: 'device_status',
          deviceId: deviceId.toString(),
          status: Math.random() > 0.3 ? 'online' : 'offline',
          timestamp: new Date().toISOString()
        })
      } else {
        // Simular cambio de estado de relé
        const randomChannel = Math.floor(Math.random() * (device.value.canales.length || 1)) + 1
        handleWebSocketMessage({
          canalId: randomChannel,
          releActivo: Math.random() > 0.5,
          timestamp: new Date().toISOString()
        })
      }
    }, 10000)
  }
}

</script>

<style scoped>
.device-activity-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.back-button {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

/* Estado de conexión */
.connection-status {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  border-left: 4px solid #6c757d;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: bold;
}

.status-indicator.online {
  color: #28a745;
  border-left-color: #28a745;
}

.status-indicator.offline {
  color: #dc3545;
  border-left-color: #dc3545;
}

.status-indicator.error {
  color: #ffc107;
  border-left-color: #ffc107;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: currentColor;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.last-update {
  font-size: 12px;
  color: #6c757d;
  margin-top: 5px;
}

.websocket-info {
  font-size: 11px;
  color: #6c757d;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #dee2e6;
}

/* Tarjeta principal */
.card {
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
}

/* Sección de telemetría */
.telemetry-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
}

.telemetry-section h3 {
  margin: 0 0 15px 0;
  color: #495057;
}

.telemetry-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 20px;
}

.metric {
  text-align: center;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.metric-label {
  font-size: 12px;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 5px;
}

.metric-value {
  font-size: 20px;
  font-weight: bold;
  color: #2c3e50;
}

/* Secciones de enchufes */
.plug-section {
  margin-bottom: 25px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border-bottom: none;
}

.plug-section:last-child {
  margin-bottom: 0;
}

.channel-title {
  font-weight: bold;
  font-size: 16px;
  margin: 0 0 15px 0;
  color: #495057;
}

.status-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.status-on {
  color: #28a745;
  font-weight: bold;
}

.status-off {
  color: #dc3545;
  font-weight: bold;
}

.action-button {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
}

.action-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.turn-off {
  background-color: #dc3545;
}

.turn-off:hover:not(:disabled) {
  background-color: #c82333;
}

.turn-on {
  background-color: #28a745;
}

.turn-on:hover:not(:disabled) {
  background-color: #218838;
}

/* Modal de carga */
.modal-carga {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-contenido {
  background-color: white;
  padding: 30px 40px;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  text-align: center;
}

.modal-contenido p {
  margin: 0;
  font-size: 16px;
  color: #495057;
}

/* Responsive design */
@media (max-width: 768px) {
  .device-activity-container {
    padding: 15px;
  }
  
  .header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .telemetry-grid {
    grid-template-columns: 1fr;
  }
  
  .status-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .action-button {
    width: 100%;
  }
}
</style>