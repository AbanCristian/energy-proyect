<template>
  <div class="device-activity-container">
    <div class="header">
      <button @click="$router.back()" class="back-button">← Volver</button>
      <h2>Actividad del dispositivo “{{ device.ubicacion }}”</h2>
    </div>

    <div class="card">
      <p><strong>Ubicación:</strong> {{ device.ubicacion }}.</p>
      <p><strong>Enchufes activos</strong></p>

      <div v-for="(canal, index) in device.canales" :key="canal.canalId" class="plug-section">
        <p class="channel-title">Canal principal (A{{ canal.canalId }})</p>
        <div class="status-container">
          <p>
            Estado del relé:
            <span :class="canal.releActivo ? 'status-on' : 'status-off'">
              {{ canal.releActivo ? 'Encendido' : 'Bloquedo' }}
            </span>
          </p>
          <button
            @click="postWebSocket(canal.canalId, canal.releActivo)"
            :class="['action-button', canal.releActivo ? 'turn-off' : 'turn-on']"
          >
            {{ canal.releActivo ? 'Bloquear' : 'Desbloquear' }}
          </button>
        </div>
      </div>
      </div>
  </div>
</template>

<script setup>
import { getOneDeviceData, sentChangeStateWS } from '@/services/deviceService'
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const device = ref({
  ubicacion: '',
  canales: []
})

onMounted(async () => {
  if (route.query.id) {
    try {
      const id = parseInt(route.query.id)
      device.value = await getOneDeviceData({ id })
    } catch (e) {
      console.error('Error al parsear datos del dispositivo:', e)
    } finally {
      console.log(device)
    }
  }
})

const postWebSocket = async (channelId, channelState) => {
  console.log(channelId)
  console.log(channelState)
  const response = await sentChangeStateWS({ channelId, channelState })
  if (!response.isSuccess) {
    console.error('Conexion fallida', response.message)
    return;
  }
  const changeState = !channelState
  device.canales[channelId].releActivo = changeState
}
</script>

<style scoped>
.device-activity-container {
  padding: 20px;
}

.header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.back-button {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
}

.card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  width: 250px;
  box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.2);
  margin-top: 20px;
}

/* Estilos para la nueva seccion de enchufes */
.plug-section {
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
  padding-bottom: 15px;
}

.plug-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.channel-title {
  font-weight: bold;
  font-size: 16px;
  margin: 0;
}

.status-container {
  margin-top: 10px;
}

.status-on {
  color: green;
  font-weight: bold;
}

.status-off {
  color: red;
  font-weight: bold;
}

.action-button {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: bold;
  cursor: pointer;
  margin-top: 10px;
}

.turn-off {
  background-color: #007bff;
}

.turn-on {
  background-color: #dc3545;
}
</style>