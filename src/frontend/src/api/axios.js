import axios from 'axios';

const getBaseURL = () => {
    const { hostname, protocol } = window.location;

    // Detección dinámica para desarrollo local (PC y móvil en LAN)
    // Esto permite que al acceder desde 192.168.x.x el API apunte
    // al mismo host en vez de a "localhost" (que falla en móvil).
    const isLocal = hostname === 'localhost' || 
                   hostname === '127.0.0.1' || 
                   hostname.startsWith('192.168.') || 
                   hostname.startsWith('10.') || 
                   hostname.startsWith('172.');

    if (isLocal) {
        // Puerto 8085 = backend eldera-daw (configurado en docker-compose para evitar conflictos)
        return `${protocol}//${hostname}:8085`;
    }

    // Producción: usar variable de entorno o fallback
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    return 'https://eldera-api-daw.onrender.com';
};

const api = axios.create({
    baseURL: getBaseURL(),
});

export default api;
