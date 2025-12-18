import http from 'k6/http';
import { check, sleep } from 'k6';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// Configuración de K6
export let options = {
    vus: 1,          // 1 usuario virtual
    duration: '30m',  // Duración total de la prueba
};

// Función principal
export default function () {
    let res = http.get('https://www.google.com.pe');

    check(res, {
        'status 200': (r) => r.status === 200,
    });

    sleep(10); // Ejecutar cada 10 segundos
}

// Generar reporte al finalizar
export function handleSummary(data) {
    return {
        'reporte.html': htmlReport(data),
        stdout: textSummary(data, { indent: ' ', enableColors: true }),
    };
}
