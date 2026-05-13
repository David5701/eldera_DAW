// Función auxiliar para resolver URLs estáticas del backend.
// El backend devuelve rutas como "/static/photos/2/image.jpg"
// Necesitamos convertirlas a URLs completas como "http://hostname:8085/static/..."

export const getBackendUrl = () => {
    // Detección dinámica para desarrollo local (PC y móvil en LAN)
    const { hostname, protocol } = window.location;
    const isLocal = hostname === 'localhost' || 
                   hostname === '127.0.0.1' || 
                   hostname.startsWith('192.168.') || 
                   hostname.startsWith('10.') || 
                   hostname.startsWith('172.');

    if (isLocal) {
        // En eldera-daw académico el puerto ahora es 8085 (para evitar conflictos)
        return `${protocol}//${hostname}:8085`;
    }

    // Si hay una URL definida en el entorno (ej. Producción), usarla
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    return 'https://eldera-api-daw.onrender.com';
};

export const resolveStaticUrl = (path) => {
    if (!path) return null;
    
    // Si ya es una URL completa, devolverla tal cual
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    
    // Si es una ruta relativa que empieza por /static, añadir la URL del backend
    if (path.startsWith('/static')) {
        return `${getBackendUrl()}${path}`;
    }
    
    // En cualquier otro caso, devolver tal cual (para ui-avatars, etc.)
    return path;
};
