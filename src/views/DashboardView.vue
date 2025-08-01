<template>
  <div class="dashboard-container">
    <div v-if="isLoading" class="loading-modal">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p>{{ loadingMessage }}</p>
      </div>
    </div>

    <div class="header">
      <h1>Monitor Eléctrico en Tiempo Real</h1>
      <div class="websocket-status">
        <span :class="['ws-indicator', wsStatus.connected ? 'connected' : 'disconnected']"></span>
        <span class="ws-text">{{ wsStatus.text }}</span>
      </div>
    </div>
    
    <div class="metrics-grid">
      <div class="card">
        <h2>Estado del Dispositivo ESP32</h2>
        <div class="metric">
          <span :class="['status-indicator', deviceStatus.status]"></span>
          <span>{{ deviceStatus.text }}</span>
        </div>
        <div class="metric">
          <div class="metric-label">Device ID</div>
          <div class="metric-value">{{ mainDevice?.dispositivoId || '--' }}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Última Telemetría</div>
          <div class="metric-value">{{ formatTime(currentTelemetry.timestamp) }}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Sesión iniciada</div>
          <div class="metric-value">{{ formatTime(sessionStartTime) }}</div>
        </div>
      </div>

      <div class="card">
        <h2>Mediciones Actuales</h2>
        <div class="metric">
          <div class="metric-label">Voltaje (V)</div>
          <div class="metric-value">{{ currentTelemetry.voltios?.toFixed(2) || '--' }} V</div>
        </div>
        <div class="metric">
          <div class="metric-label">Corriente (A)</div>
          <div class="metric-value">{{ currentTelemetry.amperios?.toFixed(2) || '--' }} A</div>
        </div>
        <div class="metric">
          <div class="metric-label">Potencia (W)</div>
          <div class="metric-value">{{ currentTelemetry.vatios?.toFixed(2) || '--' }} W</div>
        </div>
      </div>

      <div class="card">
        <h2>Consumo de la Sesión</h2>
        <div class="metric">
          <div class="metric-label">Consumo Total</div>
          <div class="metric-value">{{ sessionConsumption.toFixed(3) }} kWh</div>
        </div>
        <div class="metric">
          <div class="metric-label">Tiempo Activo</div>
          <div class="metric-value">{{ formatDuration(sessionDuration) }}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Dispositivos Online</div>
          <div class="metric-value">{{ activeDevicesCount }}</div>
        </div>
      </div>
    </div>

    <div class="card chart-card">
      <h2>Gráfico de Potencia</h2>
      <div class="chart-container">
        <canvas ref="chartCanvas"></canvas>
      </div>
    </div>

    <div class="card table-card">
      <h2>Historial de Telemetrías</h2>
      <div class="table-controls">
        <button @click="clearHistory" class="btn-secondary">Limpiar Historial</button>
        <span class="records-count">{{ telemetryHistory.length }} registros</span>
      </div>
      <div class="table-container">
        <table class="telemetry-table">
          <thead>
            <tr>
              <th>Hora</th>
              <th>Voltaje (V)</th>
              <th>Corriente (A)</th>
              <th>Potencia (W)</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(record, index) in telemetryHistory.slice().reverse()" :key="index">
              <td>{{ formatTime(record.timestamp) }}</td>
              <td>{{ record.voltios.toFixed(2) }}</td>
              <td>{{ record.amperios.toFixed(2) }}</td>
              <td>{{ record.vatios.toFixed(2) }}</td>
              <td>
                <span :class="['status-badge', record.status]">
                  {{ record.status === 'online' ? 'Online' : 'Offline' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="telemetryHistory.length === 0" class="no-data">
          No hay datos de telemetría disponibles
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { getDevice, connectDeviceHub, getCanalEstado, setCanalRele } from '@/services/external'
import Chart from 'chart.js/auto'

// Estados reactivos
const chartCanvas = ref(null)
const mainDevice = ref(null)
const isLoading = ref(true)
const loadingMessage = ref('Cargando información del dispositivo...')

const currentTelemetry = ref({
  voltios: 0,
  amperios: 0,
  vatios: 0,
  timestamp: null
})

const deviceStatus = ref({
  status: 'offline',
  text: 'ESP32 Desconectado',
  lastTelemetry: null
})

const wsStatus = ref({
  connected: false,
  text: 'WebSocket Desconectado'
})

// Historial de telemetrías
const telemetryHistory = ref([])
const sessionStartTime = ref(new Date().toISOString())
const sessionConsumption = ref(0) // kWh acumulado
const lastPowerCalculation = ref(null)

// Variables para el gráfico
let powerChart = null
let wsConnection = null

// Computed properties
const sessionDuration = computed(() => {
  if (!sessionStartTime.value) return 0
  return Date.now() - new Date(sessionStartTime.value).getTime()
})

const activeDevicesCount = computed(() => {
  return deviceStatus.value.status === 'online' ? 1 : 0
})

onMounted(async () => {
  try {
    loadingMessage.value = 'Cargando datos del dispositivo...'
    
    // Cargar datos iniciales
    await loadInitialData()
    
    loadingMessage.value = 'Inicializando gráficos...'
    
    // Inicializar gráfico
    await initializeChart()
    
    loadingMessage.value = 'Conectando WebSocket...'
    
    // Conectar WebSocket
    await connectToWebSocket()
    
    loadingMessage.value = 'Sincronizando estados...'
    
    // Sincronizar estados entre BD y WebSocket
    await syncDeviceStates()
    
  } catch (error) {
    console.error('Error al inicializar dashboard:', error)
    loadingMessage.value = 'Error al cargar el dashboard'
  } finally {
    // Ocultar carga después de 2 segundos para mostrar el resultado
    setTimeout(() => {
      isLoading.value = false
    }, 2000)
  }
})

onUnmounted(() => {
  // Cleanup
  if (wsConnection) {
    wsConnection.close()
  }
  if (powerChart) {
    powerChart.destroy()
  }
})

// Cargar datos iniciales del dispositivo
const loadInitialData = async () => {
  try {
    console.log('🔄 Cargando datos iniciales del dispositivo...')
    const response = await getDevice()
    mainDevice.value = response.data
    console.log('✅ Datos del dispositivo cargados:', response.data)
  } catch (error) {
    console.error('❌ Error al cargar datos iniciales:', error)
  }
}

// Conectar al WebSocket
const connectToWebSocket = () => {
  return new Promise((resolve, reject) => {
    if (!mainDevice.value?.dispositivoId) {
      console.log('⚠️ No hay dispositivo para conectar WebSocket')
      reject(new Error('No hay dispositivo'))
      return
    }

    try {
      const deviceId = mainDevice.value.dispositivoId
      console.log('🔌 Conectando WebSocket para dispositivo:', deviceId)
      
      wsConnection = connectDeviceHub(deviceId, (data) => {
        console.log('📨 Datos WebSocket recibidos:', data)
        handleWebSocketMessage(data)
      })

      wsConnection.onopen = () => {
        console.log('✅ WebSocket conectado')
        wsStatus.value = {
          connected: true,
          text: 'WebSocket Conectado'
        }
        resolve()
      }

      wsConnection.onerror = (error) => {
        console.error('❌ Error WebSocket:', error)
        wsStatus.value = {
          connected: false,
          text: 'WebSocket Error'
        }
        
        // Resetear cálculo de consumo cuando hay error
        lastPowerCalculation.value = null
        reject(error)
      }

      wsConnection.onclose = () => {
        console.log('🔌 WebSocket desconectado')
        wsStatus.value = {
          connected: false,
          text: 'WebSocket Desconectado'
        }
        
        // Resetear cálculo de consumo cuando se desconecta
        lastPowerCalculation.value = null
        
        // Reconectar después de 5 segundos
        setTimeout(() => {
          console.log('🔄 Reintentando conexión WebSocket...')
          connectToWebSocket()
        }, 5000)
      }
    } catch (error) {
      console.error('❌ Error al conectar WebSocket:', error)
      reject(error)
    }
  })
}

// Sincronizar estados entre BD y WebSocket
const syncDeviceStates = async () => {
  if (!mainDevice.value?.dispositivoId) {
    console.log('⚠️ No hay dispositivo para sincronizar')
    return
  }

  try {
    console.log('🔄 Sincronizando estados entre BD y WebSocket...')
    
    // Obtener estado actual de los canales desde la BD
    const canalResponse = await getCanalEstado(mainDevice.value.dispositivoId)
    console.log('📊 Estado de canales desde BD:', canalResponse)
    
    // Esperar un momento para que el WebSocket se establezca completamente
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Aquí se podría implementar lógica adicional para sincronizar
    // Por ejemplo, si hay discrepancias entre BD y WebSocket
    
    console.log('✅ Sincronización completada')
  } catch (error) {
    console.error('❌ Error al sincronizar estados:', error)
  }
}

// Manejar mensajes del WebSocket
const handleWebSocketMessage = (data) => {
  if (data.type === 'device_status') {
    console.log('📊 Estado del ESP32:', data.status)
    const isOnline = data.status === 'online'
    deviceStatus.value = {
      status: data.status,
      text: isOnline ? 'ESP32 Conectado' : 'ESP32 Desconectado',
      lastTelemetry: isOnline ? new Date().toISOString() : deviceStatus.value.lastTelemetry
    }
  } 
  else if (data.type === 'telemetry') {
    console.log('⚡ Telemetría ESP32 - mW:', data.vatios, '→ W:', (data.vatios / 1000).toFixed(3))
    
    // Actualizar estado del ESP32 como conectado cuando recibimos telemetría
    deviceStatus.value = {
      status: 'online',
      text: 'ESP32 Conectado',
      lastTelemetry: new Date().toISOString()
    }
    
    updateTelemetryData(data)
    addToHistory(data)
    updateChart(data)
    calculateConsumption(data)
  }
}

// Actualizar datos de telemetría actuales
const updateTelemetryData = (data) => {
  // Convertir miliwatts a watts
  const wattsFromMW = data.vatios / 1000
  
  currentTelemetry.value = {
    voltios: data.voltios,
    amperios: data.amperios,
    vatios: wattsFromMW, // Convertido de mW a W
    timestamp: data.timestamp
  }
}

// Agregar al historial
const addToHistory = (data) => {
  // Convertir miliwatts a watts para el historial
  const wattsFromMW = data.vatios / 1000
  
  const historyEntry = {
    ...data,
    vatios: wattsFromMW, // Convertido de mW a W
    status: deviceStatus.value.status
  }
  
  telemetryHistory.value.push(historyEntry)
  
  // Mantener solo los últimos 100 registros
  if (telemetryHistory.value.length > 100) {
    telemetryHistory.value.shift()
  }
}

// Calcular consumo de la sesión (solo cuando está online)
const calculateConsumption = (data) => {
  // Solo calcular si el dispositivo está online
  if (deviceStatus.value.status !== 'online') {
    return
  }
  
  // Convertir miliwatts a watts
  const wattsFromMW = data.vatios / 1000
  
  if (!lastPowerCalculation.value) {
    lastPowerCalculation.value = {
      power: wattsFromMW,
      timestamp: new Date(data.timestamp)
    }
    return
  }
  
  const currentTime = new Date(data.timestamp)
  const timeDiffHours = (currentTime - lastPowerCalculation.value.timestamp) / (1000 * 60 * 60)
  const avgPower = (wattsFromMW + lastPowerCalculation.value.power) / 2
  const energyKWh = (avgPower * timeDiffHours) / 1000 // Convertir W a kWh
  
  sessionConsumption.value += energyKWh
  
  lastPowerCalculation.value = {
    power: wattsFromMW,
    timestamp: currentTime
  }
}

// Inicializar gráfico
const initializeChart = async () => {
  return new Promise((resolve) => {
    if (!chartCanvas.value) {
      setTimeout(() => initializeChart().then(resolve), 100)
      return
    }
    
    const ctx = chartCanvas.value.getContext('2d')
    powerChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Potencia (W)',
          data: [],
          borderColor: '#3498db',
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          tension: 0.1,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: { display: true, text: 'Tiempo' }
          },
          y: {
            title: { display: true, text: 'Potencia (W)' },
            beginAtZero: true
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top'
          }
        }
      }
    })
    
    resolve()
  })
}

// Actualizar gráfico
const updateChart = (data) => {
  if (!powerChart) return
  
  // Convertir miliwatts a watts para el gráfico
  const wattsFromMW = data.vatios / 1000
  
  const timeLabel = new Date(data.timestamp).toLocaleTimeString()
  
  powerChart.data.labels.push(timeLabel)
  powerChart.data.datasets[0].data.push(wattsFromMW) // Usar watts convertidos
  
  // Mantener solo los últimos 20 puntos
  if (powerChart.data.labels.length > 20) {
    powerChart.data.labels.shift()
    powerChart.data.datasets[0].data.shift()
  }
  
  powerChart.update('none') // Actualización sin animación para mejor rendimiento
}

// Limpiar historial
const clearHistory = () => {
  telemetryHistory.value = []
  sessionConsumption.value = 0
  sessionStartTime.value = new Date().toISOString()
  lastPowerCalculation.value = null
  console.log('🗑️ Historial limpiado - Reiniciando contadores')
}

// Utilidades de formato
const formatTime = (timestamp) => {
  if (!timestamp) return '--'
  return new Date(timestamp).toLocaleTimeString('es-ES')
}

const formatDuration = (milliseconds) => {
  if (!milliseconds) return '0h 0m'
  const hours = Math.floor(milliseconds / (1000 * 60 * 60))
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}h ${minutes}m`
}

</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  /* background-color: #F0F2F5;  */
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header h1 {
  color: #2c3e50;
  font-size: 2rem;
  font-weight: 600;
  margin: 0;
}

.websocket-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #F7F7F7;
  border-radius: 20px;
  border: 1px solid #E0E0E0;
}

.ws-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.ws-indicator.connected {
  background-color: #2ecc71;
}

.ws-indicator.disconnected {
  background-color: #e74c3c;
}

.ws-text {
  font-size: 0.85rem;
  font-weight: 500;
  color: #2c3e50;
}

/* Loading Modal */
.loading-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 12px;
  border: 1px solid #E0E0E0;
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

.loading-content p {
  margin: 0;
  font-size: 16px;
  color: #2c3e50;
  font-weight: 500;
}

/* Status Section */
.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  animation: pulse 2s infinite;
  margin-right: 8px;
}

.status-indicator.online {
  background-color: #2ecc71;
}

.status-indicator.offline {
  background-color: #e74c3c;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

/* Se elimina la clase .metric para que los elementos dentro de las tarjetas no tengan estilos duplicados */

.metric-label {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin-bottom: 8px;
  font-weight: 500;
}

.metric-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #2c3e50;
}

/* Cards */
.card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 25px;
  border: 1px solid #E0E0E0; /* Añadimos un borde para delimitar las tarjetas */
}

.card:hover {
  /* Eliminamos la sombra al hacer hover */
}

.card h2 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 1.4rem;
  font-weight: 600;
}

/* Estilo para los elementos internos de las tarjetas de métricas */
.card .metric {
  text-align: center;
  padding: 20px;
  border-radius: 8px; /* Un poco menos de borde para los elementos internos */
  background: #F7F7F7; /* Fondo más claro */
  border: 1px solid #E0E0E0; /* Borde para el recuadro interno */
  margin-bottom: 10px; /* Espaciado entre los recuadros internos */
}

/* Eliminamos el último margin-bottom para que no haya espaciado extra */
.card .metric:last-child {
  margin-bottom: 0;
}

/* Chart Card */
.chart-card {
  min-height: 400px;
}

.chart-container {
  position: relative;
  height: 350px;
  width: 100%;
}

.chart-container canvas {
  border-radius: 8px;
}

/* Table Card */
.table-card {
  max-height: 600px;
  overflow: hidden;
}

.table-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ecf0f1;
}

.btn-secondary {
  background: #0f79eb;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

.records-count {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.table-container {
  max-height: 400px;
  overflow-y: auto;
  border-radius: 8px;
  border: 1px solid #ecf0f1;
}

.telemetry-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.telemetry-table th {
  background: #f8f9fa;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #ecf0f1;
  position: sticky;
  top: 0;
  z-index: 10;
}

.telemetry-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #ecf0f1;
  color: #34495e;
}

.telemetry-table tbody tr:hover {
  background-color: #f8f9fa;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
}

.status-badge.online {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.offline {
  background-color: #f8d7da;
  color: #721c24;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
  font-style: italic;
}

/* Responsive Design */
@media (max-width: 768px) {
  .dashboard-container {
    padding: 15px;
  }
  
  .header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .header h1 {
    font-size: 1.5rem;
    text-align: center;
  }
  
  .websocket-status {
    justify-content: center;
  }
  
  .metrics-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
  }
  
  .card {
    padding: 20px;
    margin-bottom: 20px;
  }
  
  .chart-container {
    height: 250px;
  }
  
  .table-container {
    max-height: 300px;
  }
  
  .telemetry-table {
    font-size: 0.8rem;
  }
  
  .telemetry-table th,
  .telemetry-table td {
    padding: 8px 6px;
  }
}

@media (max-width: 480px) {
  .metrics-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .metric-value {
    font-size: 1.4rem;
  }
  
  .table-controls {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
}
</style>