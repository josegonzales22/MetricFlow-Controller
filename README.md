# K6 Monitor Project

Este proyecto permite ejecutar **k6** con monitoreo de CPU y RAM de la VM usando **Prometheus**.  
Si alguno de los valores supera los umbrales configurados, se detiene la prueba automáticamente y Jenkins marca el job como fallido.

## Variables de entorno

- `PROMETHEUS_HOST`: URL de tu Prometheus (ej: http://192.168.47.131:9090)
- `CPU_THRESHOLD`: Umbral de CPU en porcentaje (default 80)
- `RAM_THRESHOLD`: Umbral de RAM en porcentaje (default 85)
- `CHECK_INTERVAL`: Intervalo de chequeo en ms (default 5000)
- `K6_SCRIPT`: Ruta al script de k6 a ejecutar (default `k6-scripts/load-test.js`)

## Uso

```bash
npm install
npm start
