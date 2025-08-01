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
            <p>Bloqueando el puerto...</p>
        </div>
    </div>

<!--     <div v-else class="modal-carga">
        <div class="modal-contenido">
            <p>desbloqueando el puerto...</p>
        </div>
    </div> -->

    <div v-if="isLoadingData" class="modal-carga">
      <div class="modal-contenido">
        <p>Recopilando información...</p>
      </div>
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
              {{ canal.releActivo ? 'Activo' : 'Bloquedo' }}
            </span>
          </p>
          <button
            @click="postWebSocket(canal.canalId, canal.releActivo, index)"
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
const isLoading = ref(false);
const isLoadingData = ref(true);
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
      isLoadingData.value = false;
    }
  }
})

const postWebSocket = async (channelId, channelState,index) => {
    isLoading.value = true;
    const response = await sentChangeStateWS({ channelId, channelState })
    if (!response.isSuccess) {
      console.error('Conexion fallida', response.message)
      isLoading.value = false;
      return;
    }
    const changeState = !channelState;
    device.value.canales[index].releActivo = changeState;
    isLoading.value = false;
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
.modal-carga {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-contenido {
  background-color: white;
  padding: 20px 30px;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0,0,0,0.3);
}
</style>