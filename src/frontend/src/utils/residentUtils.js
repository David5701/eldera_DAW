/**
 * Utility functions for Resident related logic
 */

/**
 * Generates a consistent demo photo or avatar for a resident.
 * Centralizes the logic to avoid "random" changes and ensures dignified placeholders.
 * 
 * @param {Object} resident - The resident object
 * @returns {string} - The URL for the image source
 */
export const getResidentPhoto = (resident) => {
    // 1. If we had a real photo stored in DB, return it
    if (resident?.profile_photo) {
        // If it's a full URL, return as is
        if (resident.profile_photo.startsWith('http')) {
            return resident.profile_photo;
        }
        // If it's a relative path (from our new upload system), return it as is
        // Let the component handle the URL resolution (via resolveStaticUrl) to support mobile IPs
        if (resident.profile_photo.startsWith('/static')) {
            return resident.profile_photo;
        }
        return resident.profile_photo;
    }

    // 2. Fallback if resident is null
    if (!resident) return "https://ui-avatars.com/api/?name=Usuario&background=e2e8f0&color=64748b";

    // 3. Fallback: Dignified Initials Avatar
    // We use a professional color scheme (Indigo/Slate) instead of random bright colors
    const name = `${resident.name || ''} ${resident.surname || ''}`.trim() || 'Residente';
    
    // Construct a high-quality avatar URL
    // background=e0e7ff (Indigo 50)
    // color=4338ca (Indigo 700)
    // bold=true
    // size=256 (High resolution)
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=e0e7ff&color=4338ca&size=256&bold=true&font-size=0.4`;
};

/**
 * Calculates age from date of birth
 * @param {string} dateOfBirth 
 * @returns {number|string}
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
