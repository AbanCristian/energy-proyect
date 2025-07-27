<template>
  <div class="dashboard">
    <h2>Consumo eléctrico</h2>
    <div class="summary">
      <div class="card">Consumo total<br /><strong>12.17 kWh</strong></div>
      <div class="card">Consumo actual<br /><strong>12.17 kWh</strong></div>
      <div class="card">Dispositivos activos<br /><strong>3/5</strong></div>
    </div>

    <h2>Dispositivos activos</h2>
    <div class="device-buttons">
      <button v-for="(d, i) in dispositivos" :key="i" class="btn">
        {{ d.nombre }}
      </button>
    </div>

    <div class="chart-wrapper">
      <canvas id="chart"></canvas>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import Chart from 'chart.js/auto';

const dispositivos = [
  { nombre: 'Dispositivo 1', consumo: 10 },
  { nombre: 'Dispositivo 2', consumo: 15 },
  { nombre: 'Dispositivo 3', consumo: 21 }
];

onMounted(() => {
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
});
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
