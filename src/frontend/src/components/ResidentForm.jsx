import React, { useState, useEffect } from 'react';
import Card from './Card';
import Button from './Button';
// CSS migrated to Tailwind, import removed

/**
 * ResidentForm - Form to add new residents
 * Optimized for mobile input
 */
import api from '../api/axios';

/**
 * ResidentForm - Form to add new residents
 * Optimized for mobile input
 */
export default function ResidentForm({ onSubmit, onCancel, initialData }) {
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        date_of_birth: '',
        room_number: '',
        emergency_contact: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Populate form when editing
    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                surname: initialData.surname || '',
                date_of_birth: initialData.date_of_birth || '',
                room_number: initialData.room_number || '',
                emergency_contact: initialData.emergency_contact || ''
            });
        }
    }, [initialData]);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            let response;
            if (initialData && initialData.id) {
                // Update existing resident
                response = await api.put(`/residents/${initialData.id}`, formData);
            } else {
                // Create new resident
                response = await api.post('/residents/', formData);
            }

            if (onSubmit) {
                onSubmit(response.data);
            }
        } catch (err) {
            console.error("Registration/Update error:", err);
            const detail = err.response?.data?.detail;

            if (Array.isArray(detail)) {
                // Es un error de validación de FastAPI (lista de errores)
                const messages = detail.map(errorItem => {
                    const field = errorItem.loc[errorItem.loc.length - 1];
                    let msg = errorItem.msg;

                    // Traducciones básicas de errores comunes
                    if (msg.includes('match pattern')) msg = 'Formato inválido (revise letras/números)';
                    if (msg.includes('ensure this value has at least')) msg = `Mínimo ${errorItem.ctx?.limit_value} caracteres`;
                    if (msg.includes('field required')) msg = 'Campo obligatorio';

                    // Mapa de nombres de campos
                    const fieldNameMap = {
                        name: 'Nombre',
                        surname: 'Apellidos',
                        room_number: 'Habitación',
                        emergency_contact: 'Contacto Emergencia',
                        date_of_birth: 'Fecha Nacimiento'
                    };

                    return `• ${fieldNameMap[field] || field}: ${msg}`;
                }).join('\n');

                setError(messages);
            } else if (typeof detail === 'object') {
                setError(JSON.stringify(detail));
            } else {
                setError(detail || 'Error al guardar residente');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto py-4 px-4">
            <Card>
                <h2 className="text-xl mb-4">Nuevo Residente</h2>
                {error && (
                    <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm whitespace-pre-wrap font-medium">
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="name" className="font-medium text-gray-700 text-sm">Nombre *</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            minLength={2}
                            pattern="[a-zA-ZáéíóúÁÉÍÓÚñÑ\s-]+"
                            title="Solo letras, espacios y guiones"
                            className="p-3 border-2 border-gray-300 rounded-md text-base bg-white text-gray-900 focus:border-primary transition-colors"
                            placeholder="Ej: María"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="surname" className="font-medium text-gray-700 text-sm">Apellidos *</label>
                        <input
                            type="text"
                            id="surname"
                            name="surname"
                            value={formData.surname}
                            onChange={handleChange}
                            required
                            minLength={2}
                            pattern="[a-zA-ZáéíóúÁÉÍÓÚñÑ\s-]+"
                            title="Solo letras, espacios y guiones"
                            className="p-3 border-2 border-gray-300 rounded-md text-base bg-white text-gray-900 focus:border-primary transition-colors"
                            placeholder="Ej: García López"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="date_of_birth" className="font-medium text-gray-700 text-sm">Fecha de Nacimiento *</label>
                        <input
                            type="date"
                            id="date_of_birth"
                            name="date_of_birth"
                            value={formData.date_of_birth}
                            onChange={handleChange}
                            required
                            max={new Date().toISOString().split('T')[0]}
                            className="p-3 border-2 border-gray-300 rounded-md text-base bg-white text-gray-900 focus:border-primary transition-colors"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="room_number" className="font-medium text-gray-700 text-sm">Número de Habitación *</label>
                        <input
                            type="text"
                            id="room_number"
                            name="room_number"
                            value={formData.room_number}
                            onChange={handleChange}
                            required
                            minLength={1}
                            maxLength={10}
                            pattern="[0-9]+"
                            title="Solo números"
                            className="p-3 border-2 border-gray-300 rounded-md text-base bg-white text-gray-900 focus:border-primary transition-colors"
                            placeholder="Ej: 101"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="emergency_contact" className="font-medium text-gray-700 text-sm">Contacto de Emergencia *</label>
                        <input
                            type="tel"
                            id="emergency_contact"
                            name="emergency_contact"
                            value={formData.emergency_contact}
                            onChange={handleChange}
                            required
                            pattern="[\+0-9\s-]{9,15}"
                            title="Debe ser un número de teléfono válido (9-15 dígitos)"
                            className="p-3 border-2 border-gray-300 rounded-md text-base bg-white text-gray-900 focus:border-primary transition-colors"
                            placeholder="Ej: 612 345 678"
                        />
                    </div>
                    <div className="flex flex-col gap-2 mt-4 md:flex-row md:justify-end">
                        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar Residente'}</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
