import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';
import QuickCareRecord from '../components/QuickCareRecord';
import { useToast } from '../components/Toast';
import { Activity, ChevronLeft } from 'lucide-react';

const QuickRecordPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [resident, setResident] = useState(null);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();

    useEffect(() => {
        const fetchResident = async () => {
            try {
                const response = await api.get(`/residents/${id}`);
                setResident(response.data);
            } catch (error) {
                console.error('Error fetching resident:', error);
                addToast('Error al cargar la información del residente', 'error');
                navigate('/residents');
            } finally {
                setLoading(false);
            }
        };
        fetchResident();
    }, [id]);

    if (loading) {
        return (
            <DashboardLayout title="Cargando...">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (!resident) return null;

    return (
        <DashboardLayout title="Registro Rápido">
            <div className="flex flex-col gap-6">
                <div className="bg-white rounded-[2rem] border-2 border-[#0F172A] shadow-sm min-h-[500px] overflow-hidden">
                    {/* Integrated Header - Matching other views */}
                    <div className="flex items-center gap-2 md:gap-4 px-3 py-3 md:px-6 md:py-4 border-b border-slate-200">
                        <button
                            type="button"
                            onClick={() => navigate('/residents')}
                            className="w-10 h-10 md:w-12 md:h-12 bg-[#0F172A] hover:bg-slate-800 text-white rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg shrink-0"
                            title="Volver al listado"
                        >
                            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-lg md:text-2xl font-black text-slate-800 flex items-center gap-2 whitespace-normal leading-tight">
                                Registro Rápido
                            </h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs md:text-sm font-bold text-slate-500">
                                    {resident.name} {resident.surname}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wider">
                                    Hab. {resident.room_number}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Section Content Area */}
                    <div className="p-4 md:p-8">
                        <QuickCareRecord
                            residents={[resident]}
                            initialResident={resident}
                            hideHeader={true}
                            onBack={() => navigate('/residents')}
                        />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default QuickRecordPage;
