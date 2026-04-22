// Configuración centralizada de la API
// Cambia esta IP por la dirección IP de tu máquina cuando accedas desde otros dispositivos
// Para desarrollo local usa localhost, para acceso desde otras máquinas usa la IP de la red
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export const API_URL = API_BASE_URL;
