const { spawn } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const ejs = require('ejs');
const path = require('path');

const PROMETHEUS_HOST = process.env.PROMETHEUS_HOST || "http://192.168.47.131:9090";

// Queries
const CPU_QUERY = '100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[2m])) * 100)';
const RAM_QUERY = '(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100';

// Umbrales
const CPU_THRESHOLD = parseFloat(process.env.CPU_THRESHOLD) || 15;
const RAM_THRESHOLD = parseFloat(process.env.RAM_THRESHOLD) || 85;

const CHECK_INTERVAL = parseInt(process.env.CHECK_INTERVAL) || 5000;
const K6_SCRIPT = process.env.K6_SCRIPT || "k6/index.js";

// Lanzar k6
const k6 = spawn('k6', ['run', K6_SCRIPT], { stdio: 'inherit' });

let stopped = false;

// Histórico de métricas
const metricsHistory = [];

async function checkMetrics() {
  try {
    const cpuResp = await axios.get(`${PROMETHEUS_HOST}/api/v1/query`, { params: { query: CPU_QUERY } });
    const ramResp = await axios.get(`${PROMETHEUS_HOST}/api/v1/query`, { params: { query: RAM_QUERY } });

    const cpu = parseFloat(cpuResp.data.data.result[0].value[1]);
    const ram = parseFloat(ramResp.data.data.result[0].value[1]);

    const timestamp = new Date().toISOString();

    metricsHistory.push({ time: timestamp, cpu, ram });

    console.log(`[${timestamp}] CPU: ${cpu.toFixed(2)}%, RAM: ${ram.toFixed(2)}%`);

    if (!stopped && (cpu > CPU_THRESHOLD || ram > RAM_THRESHOLD)) {
      console.error(`❌ Umbral superado! CPU: ${cpu.toFixed(2)}%, RAM: ${ram.toFixed(2)}%`);

      stopped = true;
      k6.kill('SIGINT');
      generateReport("FAIL");
      process.exit(1);
    }

  } catch (err) {
    console.error("Error consultando Prometheus:", err.message);
    stopped = true;
    k6.kill('SIGINT');
    generateReport("FAIL");
    process.exit(1);
  }
}

const interval = setInterval(checkMetrics, CHECK_INTERVAL);

k6.on('exit', () => {
  clearInterval(interval);
  if (!stopped) {
    generateReport("PASS");
  }
});

// --------------------------
// 📝 Generación del reporte
// --------------------------
function generateReport(status) {
  if (metricsHistory.length === 0) return;

  const cpuValues = metricsHistory.map(m => m.cpu);
  const ramValues = metricsHistory.map(m => m.ram);

  const reportData = {
    status,
    metrics: metricsHistory,
    minCPU: Math.min(...cpuValues),
    maxCPU: Math.max(...cpuValues),
    finalCPU: cpuValues[cpuValues.length - 1],

    minRAM: Math.min(...ramValues),
    maxRAM: Math.max(...ramValues),
    finalRAM: ramValues[ramValues.length - 1],
  };

  const templatePath = path.join(__dirname, "template.ejs");
  const outputPath = path.join(__dirname, "index.html");

  ejs.renderFile(templatePath, reportData, (err, html) => {
    if (err) {
      console.error("❌ Error generando el reporte:", err);
      return;
    }

    fs.writeFileSync(outputPath, html);
    console.log(`📄 Reporte generado: ${outputPath}`);
  });
}
