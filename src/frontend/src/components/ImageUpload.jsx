import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import api from '../api/axios';
import { useToast } from './Toast';
import { resolveStaticUrl } from '../utils/url';

export default function ImageUpload({ residentId, currentPhotoUrl, onPhotoUpdated }) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(null);
    const fileInputRef = useRef(null);
    const { addToast } = useToast();

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validar tipo
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            addToast('Solo se permiten imágenes (JPG, PNG, WEBP)', 'error');
            return;
        }

        // Validar tamaño (max 20MB)
        if (file.size > 20 * 1024 * 1024) {
            addToast('La imagen no debe superar los 20MB', 'error');
            return;
        }

        // Show preview immediately
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);

        // Upload
        await uploadPhoto(file);
    };

    const uploadPhoto = async (file) => {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post(`/residents/${residentId}/photo`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            addToast('Foto actualizada correctamente', 'success');
            if (onPhotoUpdated) {
                onPhotoUpdated(response.data.profile_photo);
            }
            setPreview(null); // Limpiar preview local ya que ahora usamos el real
        } catch (error) {
            console.error("Upload error:", error);
            addToast('Error al subir la foto', 'error');
            setPreview(null); // Revertir en caso de error
        } finally {
            setUploading(false);
            // Reset input value to allow selecting same file again
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    const displayUrl = preview || resolveStaticUrl(currentPhotoUrl) || "https://ui-avatars.com/api/?name=User";

    return (
        <div className="relative group inline-block">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl overflow-hidden border-4 border-white shadow-lg bg-gray-100 relative">
                {uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                )}

                <img
                    src={displayUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        e.target.style.display = 'none'; // Hide broken image
                    }}
                />

                {/* Overlay on hover */}
                <div
                    onClick={triggerFileSelect}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer z-10"
                >
                    <Camera className="w-8 h-8 text-white mb-1" />
                    <span className="text-white text-xs font-bold">Cambiar</span>
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                className="hidden"
                onChange={handleFileSelect}
            />

            <button
                type="button"
                onClick={triggerFileSelect}
                className="absolute -bottom-2 -right-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-md z-20 transition-transform active:scale-95"
                title="Subir foto"
            >
                <div className="w-4 h-4 flex items-center justify-center">
                    <Upload className="w-3 h-3" strokeWidth={3} />
                </div>
            </button>
        </div>
    );
}
