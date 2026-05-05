import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ResidentFormExtended from '../components/ResidentFormExtended';
import DashboardLayout from '../components/DashboardLayout';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../components/Toast';

export default function ResidentEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [resident, setResident] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchResident = async () => {
            try {
                const response = await api.get(`/residents/${id}?silent=true`);
                setResident(response.data);
            } catch (error) {
                console.error('Error fetching resident:', error);
                addToast('Error al cargar datos del residente', 'error');
                navigate('/');
            } finally {
                setLoading(false);
            }
        };

        fetchResident();
    }, [id, navigate, addToast]);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            addToast('Residente actualizado correctamente', 'success');
            navigate(`/residents/${id}?silent=true`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate(-1);
    };



    const query = new URLSearchParams(window.location.search);
    const initialTab = parseInt(query.get('tab') || '0', 10);

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="w-full h-full p-3 md:p-6">
                <ResidentFormExtended
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    initialData={resident}
                    initialTab={initialTab}
                    isSubmitting={isSubmitting}
                />
            </div>
        </DashboardLayout>
    );
}
