/**
 * Funciones auxiliares para la lógica relacionada con los residentes.
 */

/**
 * Genera una foto de demostración o avatar consistente para un residente.
 * Centraliza la lógica para evitar cambios "aleatorios" y garantizar
 * avatares dignos como sustitutos cuando no hay foto real.
 * 
 * @param {Object} resident - El objeto residente
 * @returns {string} - La URL de la imagen
 */
export const getResidentPhoto = (resident) => {
    // 1. Si hay una foto real almacenada en base de datos, devolverla
    if (resident?.profile_photo) {
        // Si ya es una URL completa, devolverla tal cual
        if (resident.profile_photo.startsWith('http')) {
            return resident.profile_photo;
        }
        // Si es una ruta relativa (del sistema de subida de archivos), devolverla tal cual.
        // El componente se encargará de resolver la URL final (via resolveStaticUrl)
        // para que funcione también desde IPs de móvil en la red local.
        if (resident.profile_photo.startsWith('/static')) {
            return resident.profile_photo;
        }
        return resident.profile_photo;
    }

    // 2. Fallback si el objeto residente es nulo
    if (!resident) return "https://ui-avatars.com/api/?name=Usuario&background=e2e8f0&color=64748b";

    // 3. Fallback: Avatar de iniciales con estética profesional
    // Se usa una paleta Índigo/Pizarra en lugar de colores aleatorios llamativos.
    const name = `${resident.name || ''} ${resident.surname || ''}`.trim() || 'Residente';
    
    // Parámetros del avatar de alta calidad:
    // background=e0e7ff (Índigo 50), color=4338ca (Índigo 700),
    // bold=true, size=256 (alta resolución)
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=e0e7ff&color=4338ca&size=256&bold=true&font-size=0.4`;
};

/**
 * Calcula la edad a partir de la fecha de nacimiento.
 * @param {string} dateOfBirth - Fecha de nacimiento en formato ISO
 * @returns {number|string} - Edad en años
 */
export const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};
