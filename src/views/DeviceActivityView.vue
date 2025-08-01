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
        <div class="loading-spinner"></div>
        <p>{{ loadingDataMessage }}</p>
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
            <div class="metric-value">{{ telemetryData.amperios?.toFixed(2) || '--' }} mA</div>
          </div>
          <div class="metric">
            <div class="metric-label">Potencia</div>
            <div class="metric-value">{{ (telemetryData.vatios / 1000)?.toFixed(2) || '--' }} mW</div>
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
            :disabled="isLoading || deviceStatus.status !== 'online' || pendingChanges.has(canal.canalId)"
          >
            <span v-if="pendingChanges.has(canal.canalId)" class="button-spinner"></span>
            {{ getButtonText(canal.canalId, canal.releActivo) }}
          </button>
          
          <!-- Mensaje de estado del dispositivo -->
          <div v-if="deviceStatus.status !== 'online'" class="device-warning">
            <small>⚠️ ESP32 desconectado - Botones bloqueados</small>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { getOneDeviceData, setCanalRele, connectDeviceHub, getCanalEstado } from '@/services/external'
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const deviceId = parseInt(route.query.id)

// Estado reactivo
const isLoading = ref(false)
const isLoadingData = ref(true)
const loadingMessage = ref('Bloqueando el puerto...')
const loadingDataMessage = ref('Cargando información del dispositivo...')

// Control de cambios pendientes
const pendingChanges = ref(new Set())
const changeTimeouts = ref(new Map())

const device = ref({
  ubicacion: '',
  canales: []
})

// Datos de telemetría en tiempo real
const telemetryData = ref(null)

// Estado de conexión del dispositivo
const deviceStatus = ref({
  status: 'offline', // 'online', 'offline', 'error'
  text: 'ESP32 Desconectado',
  lastUpdate: null
})

// WebSocket connection
let wsConnection = null

onMounted(async () => {
  if (deviceId) {
    try {
      loadingDataMessage.value = 'Cargando datos del dispositivo...'
      
      // Cargar datos iniciales del dispositivo
      await loadDeviceData()
      
      loadingDataMessage.value = 'Conectando WebSocket...'
      
      // Conectar WebSocket para datos en tiempo real
      await connectToWebSocket()
      
      loadingDataMessage.value = 'Sincronizando estados de relés...'
      
      // Sincronizar estados entre BD y WebSocket
      await syncRelayStates()
      
      // Activar simulación para pruebas (solo en desarrollo) - DESHABILITADO
      // simulateWebSocketMessages()
    } catch (e) {
      console.error('Error al cargar datos del dispositivo:', e)
      loadingDataMessage.value = 'Error al cargar el dispositivo'
    } finally {
      // Ocultar carga después de 2 segundos
      setTimeout(() => {
        isLoadingData.value = false
      }, 2000)
    }
  }
})

onUnmounted(() => {
  // Cerrar conexión WebSocket al salir del componente
  if (wsConnection) {
    wsConnection.close()
  }
  
  // Limpiar todos los timeouts pendientes
  changeTimeouts.value.forEach((timeoutId) => {
    clearTimeout(timeoutId)
  })
  changeTimeouts.value.clear()
  pendingChanges.value.clear()
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
  return new Promise((resolve, reject) => {
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
        // NO marcar como online automáticamente, esperar telemetría o confirmación del ESP32
        console.log('🔌 WebSocket conectado, esperando confirmación del ESP32...')
        resolve()
      }

      wsConnection.onerror = (error) => {
        console.error('❌ Error en WebSocket:', error)
        deviceStatus.value = {
          status: 'error',
          text: 'ESP32 Error de conexión',
          lastUpdate: new Date().toISOString()
        }
        reject(error)
      }

      wsConnection.onclose = (event) => {
        console.log('🔌 WebSocket desconectado. Código:', event.code, 'Razón:', event.reason)
        deviceStatus.value = {
          status: 'offline',
          text: 'ESP32 Desconectado',
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
        text: 'ESP32 Error al conectar',
        lastUpdate: new Date().toISOString()
      }
      reject(error)
    }
  })
}

// Sincronizar estados entre BD y WebSocket
const syncRelayStates = async () => {
  try {
    console.log('🔄 Sincronizando estados de relés entre BD y WebSocket...')
    
    // Obtener estado actual de los canales desde la BD
    const canalResponse = await getCanalEstado(deviceId)
    console.log('📊 Estado de canales desde BD:', canalResponse)
    
    if (canalResponse && canalResponse.data && canalResponse.data.canales) {
      // Comparar y actualizar estados si es necesario
      const bdCanales = canalResponse.data.canales
      
      for (let i = 0; i < device.value.canales.length; i++) {
        const localCanal = device.value.canales[i]
        const bdCanal = bdCanales.find(c => c.canalId === localCanal.canalId)
        
        if (bdCanal && bdCanal.releActivo !== localCanal.releActivo) {
          console.log(`🔄 Sincronizando canal ${localCanal.canalId}: ${localCanal.releActivo} → ${bdCanal.releActivo}`)
          
          // Actualizar el estado local con el de la BD
          device.value.canales[i].releActivo = bdCanal.releActivo
        }
      }
    }
    
    // Esperar un momento para que el WebSocket se establezca completamente
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    console.log('✅ Sincronización de relés completada')
  } catch (error) {
    console.error('❌ Error al sincronizar estados de relés:', error)
  }
}

// Manejar mensajes del WebSocket
const handleWebSocketMessage = (data) => {
  console.log('Procesando mensaje WebSocket:', data)
  
  if (data.type === 'device_status') {
    // Actualizar estado del dispositivo (online/offline)
    const isOnline = data.status === 'online'
    deviceStatus.value = {
      status: data.status,
      text: isOnline ? 'ESP32 Conectado' : 'ESP32 Desconectado',
      lastUpdate: data.timestamp
    }
    console.log('Estado del ESP32 actualizado:', data.status)
  } 
  else if (data.type === 'telemetry') {
    // Actualizar datos de telemetría en tiempo real
    telemetryData.value = {
      voltios: data.voltios,
      amperios: data.amperios,
      vatios: data.vatios, // Mantener en mW para el cálculo interno, conversión en template
      timestamp: data.timestamp
    }
    
    // Si recibimos telemetría, el dispositivo está online
    deviceStatus.value = {
      status: 'online',
      text: 'ESP32 Conectado',
      lastUpdate: data.timestamp
    }
    console.log('ESP32 marcado como online por recepción de telemetría:', data)
  }
  else if (data.canales) {
    // Actualizar estado de los canales/relés en tiempo real desde WebSocket
    console.log('Actualizando estado de canales desde WebSocket:', data.canales)
    
    // Actualizar cada canal y confirmar cambios pendientes
    data.canales.forEach(canalWS => {
      const canalIndex = device.value.canales.findIndex(c => c.canalId === canalWS.canalId)
      if (canalIndex !== -1) {
        const oldState = device.value.canales[canalIndex].releActivo
        device.value.canales[canalIndex].releActivo = canalWS.releActivo
        
        // Confirmar el cambio si estaba pendiente
        if (pendingChanges.value.has(canalWS.canalId) && oldState !== canalWS.releActivo) {
          confirmRelayChange(canalWS.canalId, canalWS.releActivo)
        }
      }
    })
    
    device.value.canales = data.canales
  }
  else if (data.canalId && typeof data.releActivo !== 'undefined') {
    // Actualizar un canal específico desde WebSocket
    const canalIndex = device.value.canales.findIndex(c => c.canalId === data.canalId)
    if (canalIndex !== -1) {
      const oldState = device.value.canales[canalIndex].releActivo
      device.value.canales[canalIndex].releActivo = data.releActivo
      console.log(`Canal ${data.canalId} actualizado de ${oldState} a ${data.releActivo} desde WebSocket`)
      
      // Confirmar el cambio si estaba pendiente
      if (pendingChanges.value.has(data.canalId)) {
        confirmRelayChange(data.canalId, data.releActivo)
      }
    }
  }
}

// Cambiar estado del relé (solo API - el WebSocket confirmará el cambio)
const toggleRele = async (canalId, currentState, index) => {
  // Verificar que el ESP32 esté conectado
  if (deviceStatus.value.status !== 'online') {
    alert('⚠️ No se puede cambiar el estado del relé: ESP32 desconectado')
    return
  }

  // Verificar que no haya un cambio pendiente para este canal
  if (pendingChanges.value.has(canalId)) {
    console.log(`Canal ${canalId} ya tiene un cambio pendiente`)
    return
  }

  const newState = !currentState
  console.log(`Iniciando cambio de relé - Canal: ${canalId}, Estado actual: ${currentState}, Nuevo estado: ${newState}`)
  
  // Marcar como cambio pendiente
  pendingChanges.value.add(canalId)
  
  try {
    console.log('Enviando comando de cambio de relé a la API:', { canalId, releActivo: newState })
    
    // Enviar el comando a la API
    const response = await setCanalRele({ 
      canalId: canalId, 
      releActivo: newState 
    })
    
    console.log('Respuesta de la API:', response)
    
    if (response.isSuccess === false) {
      console.error('Error al cambiar estado del relé:', response.message)
      throw new Error(response.message || 'Error desconocido en la API')
    } else {
      console.log('Comando enviado exitosamente. Esperando confirmación del WebSocket...')
      
      // Configurar timeout para la confirmación
      const timeoutId = setTimeout(() => {
        console.error(`Timeout esperando confirmación para canal ${canalId}`)
        pendingChanges.value.delete(canalId)
        changeTimeouts.value.delete(canalId)
        
        alert(`⚠️ No se recibió confirmación del cambio para el Canal ${canalId}. Inténtalo de nuevo.`)
      }, 10000) // 10 segundos de timeout
      
      changeTimeouts.value.set(canalId, timeoutId)
    }
  } catch (error) {
    console.error('Error al enviar comando a la API:', error)
    
    // Limpiar el estado pendiente en caso de error
    pendingChanges.value.delete(canalId)
    
    // Mostrar error al usuario
    alert(`❌ Error al cambiar el estado del relé: ${error.message}. Inténtalo de nuevo.`)
  }
}

// Confirmar cambio de estado desde WebSocket
const confirmRelayChange = (canalId, newState) => {
  console.log(`Confirmando cambio de relé - Canal: ${canalId}, Nuevo estado: ${newState}`)
  
  // Limpiar timeout
  const timeoutId = changeTimeouts.value.get(canalId)
  if (timeoutId) {
    clearTimeout(timeoutId)
    changeTimeouts.value.delete(canalId)
  }
  
  // Quitar de cambios pendientes
  pendingChanges.value.delete(canalId)
  
  console.log(`✅ Cambio confirmado para Canal ${canalId}`)
}

// Obtener texto del botón según el estado
const getButtonText = (canalId, currentState) => {
  if (pendingChanges.value.has(canalId)) {
    return currentState ? 'Bloqueando...' : 'Desbloqueando...'
  }
  return currentState ? 'Bloquear' : 'Desbloquear'
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

.button-spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 2px solid white;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

.device-warning {
  margin-top: 8px;
  padding: 6px 12px;
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
  color: #856404;
  font-size: 12px;
  text-align: center;
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

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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