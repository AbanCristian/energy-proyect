<template>
  <div class="dashboard">
    <h2>Consumo eléctrico</h2>
    <div class="summary">
      <div class="card">Consumo total<br /><strong>{{ devicesData.potenciaTotal }} kWh</strong></div>
      <div class="card">Consumo actual<br /><strong>{{ devicesData.potenciaTotal }} kWh</strong></div>
      <div class="card">Dispositivos activos<br /><strong>{{numberDevicesActive}}/{{ devicesArray.length }}</strong></div>
    </div>

    <h2>Dispositivos activos</h2>
    <div class="device-buttons">
      <button v-for="device in devicesArray" :key="device.dispositivoId" class="btn">
        {{ device.ubicacion }}
      </button>
    </div>

    <div class="chart-wrapper">
      <canvas id="chart"></canvas>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { getDevice } from '@/services/deviceService';
import Chart, { scales } from 'chart.js/auto';

const devicesData = ref([]);
const devicesArray = [];
let numberDevicesActive =  ref(0);
const chartInstance = ref(null);

onMounted(async() =>{
  try {
    const response =  await getDevice();
    devicesData.value = response.data;

  } catch (error) {
    console.error('Fallo xd',error);
  } finally {
    countDevices(devicesData);
    isActiveDevice();
    renderChart();
    console.log(devicesArray.map(device => device.nombre));
  }

})

  const countDevices = (device) =>{
    devicesArray.push(device.value);
    
  }
  const isActiveDevice = () =>{
    numberDevicesActive = devicesArray.filter(device => device.tienePresencia === true).length;
  }
  const renderChart = () =>{
    if(chartInstance.value){
      chartInstance.value.destroy();
    }

    const labels = devicesArray.map(device => device.ubicacion);
    const data =  devicesArray.map(device => device.potenciaTotal)
    const chart = document.getElementById('chart');
    chartInstance.value =  new Chart(chart,{
      type: 'bar',
      data: { 
        labels,
        datasets: [{
          label: 'Consumo',
          data,
          backgroundColor: '#64b5f6'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: {beginAtZero: true} }
      }

    });
  }
 
const dispositivos = [
  { nombre: 'Dispositivo 1', consumo: 10 },
  { nombre: 'Dispositivo 2', consumo: 15 },
  { nombre: 'Dispositivo 3', consumo: 21 }
];
console.log(dispositivos);

// pendiente ajustar el generador de graficos en base al array que guarda los objetos del API
/* onMounted(() => {
  new Chart(document.getElementById('chart'), {
    type: 'bar',
    data: {
      labels: dispositivos.map(d => d.nombre),
      datasets: [{
        label: 'Consumo (kWh)',
        data: dispositivos.map(d => d.consumo),
        backgroundColor: ['#e57373', '#81c784', '#64b5f6']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}); */
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.summary {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
}

.card {
  background-color: #ffffff;
  padding: 15px;
  flex: 1;
  text-align: center;
  border-radius: 8px;
  box-shadow: 0 0 8px rgba(0,0,0,0.1);
}

.device-buttons {
  margin-bottom: 20px;
}

.btn {
  margin-right: 10px;
  background-color: #ccc;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.chart-wrapper {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  box-sizing: border-box;
}

.chart-wrapper canvas {
  width: 100% !important;
  height: auto !important;
  display: block;
}
</style>
