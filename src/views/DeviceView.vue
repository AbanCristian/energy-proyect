<template>
  <div class="device-view">
    <h2>Dispositivos adquiridos</h2>
    <div class="device-grid">
      <div v-for="(d, i) in dispositivos" :key="i" class="device-card">
        <p><strong>Ubicación:</strong> {{ d.ubicacion }}</p>
        <p><strong>Estado:</strong> {{ d.estado }}</p>
        <p><strong>Tiempo activo:</strong> {{ d.tiempo }}</p>
        <p v-if="d.consumo"><strong>Consumo eléctrico:</strong> {{ d.consumo }}</p>

        <div class="icon">
          <svg v-if="d.estado === 'activo'" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
               viewBox="0 0 24 24" fill="none" stroke="green" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" class="icon-svg">
            <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
            <path d="M8.5 16.15a6 6 0 0 1 7 0"/>
            <path d="M12 20h.01"/>
          </svg>

          <svg v-else-if="d.estado === 'desconectado'" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
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
      </div>
    </div>
  </div>
</template>

<script setup>
const dispositivos = [
  { ubicacion: 'Cocina', estado: 'activo', tiempo: '65 minutos' },
  { ubicacion: 'Sala principal', estado: 'activo', tiempo: '10 minutos', consumo: '10 kWh' },
  { ubicacion: 'Habitación María', estado: 'desconectado', tiempo: '0 minutos' },
  { ubicacion: 'Habitación Mario', estado: 'desconectado', tiempo: '0 minutos' }
];
</script>

<style scoped>
.device-view {
  padding: 20px;
}

.device-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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
</style>
