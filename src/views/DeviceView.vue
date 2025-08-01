<template>
  <div class="device-view">
    <h2>Dispositivos adquiridos</h2>

    <div v-if="isLoading" class="modal-carga">
      <div class="modal-contenido">
        <p>Cargando dispositivos...</p>
      </div>
    </div>

    <div class="device-grid">
      <div v-for="device in devices" :key="device.dispositivoId" class="device-card">
        <p><strong>Ubicación:</strong> {{ device.ubicacion}}</p>
        <p><strong>Estado:</strong> {{ device.tienePresencia === true ? 'Activo' : 'Inactivo' }}</p>
        <p><strong>Tiempo activo:</strong> {{ device.ubicacion }}</p>
        <p v-if="device.potenciaTotal"><strong>Consumo eléctrico:</strong> {{ device.potenciaTotal }}</p>

        <div class="icon">
          <svg v-if="device.tienePresencia === true" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
               viewBox="0 0 24 24" fill="none" stroke="green" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" class="icon-svg">
            <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
            <path d="M8.5 16.15a6 6 0 0 1 7 0"/>
            <path d="M12 20h.01"/>
          </svg>

          <svg v-else-if="device.tienePresencia === false" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
               viewBox="0 0 24 24" fill="none" stroke="red" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" class="icon-svg">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>

          <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24"
               viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" class="icon-svg">
            <path d="M3 7v13h18V7L12 3z" />
            <path d="M9 22v-4h6v4" />
          </svg>
          
        </div>
        <button @click="verActividad(device)" class="actividad-btn">
            📊 Ver actividad
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { getDevice } from '@/services/deviceService';
import { useRouter } from 'vue-router';

const router = useRouter();
const devices = ref([]);
const isLoading = ref(true);
onMounted(async () =>{
  try {
    const response = await getDevice();
    devices.value.push(response.data);
    console.log(typeof(devices));
  } catch (error) {
   console.error('Fallo xd',error);
  } finally {
    isLoading.value = false;
  }
});

const verActividad = (device) =>{
  router.push({
    name: 'actividad-dispositivo',
    query: {
      id: device.dispositivoId
    }
  })
}

</script>

<style scoped>
.device-view {
  padding: 20px;
}

.device-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 0.3fr));
  gap: 20px;
}

.device-card {
  background-color: #ffffff;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 0 8px rgba(0,0,0,0.1);
}

.icon {
  margin-top: 10px;
  display: flex;
  justify-content: center;
}

.icon-svg {
  width: 28px;
  height: 28px;
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

.actividad-btn {
  margin-top: 12px;
  background-color: #1976d2;
  color: #fff;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.actividad-btn:hover {
  background-color: #1565c0;
}
</style>
