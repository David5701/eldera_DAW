// Helper to resolve backend static URLs
// Backend returns paths like "/static/photos/2/image.jpg"
// We need to convert them to full URLs like "http://hostname:8001/static/..."

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

    return 'https://eldera-api.onrender.com';
};

export const resolveStaticUrl = (path) => {
    if (!path) return null;
    
    // If already a full URL, return as-is
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    
    // If it's a relative path starting with /static, prepend backend URL
    if (path.startsWith('/static')) {
        return `${getBackendUrl()}${path}`;
    }
    
    // Otherwise return as-is (for ui-avatars, etc)
    return path;
};
