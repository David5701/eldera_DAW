import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Search,
    Skull,
    Calendar,
    FileText,
    ExternalLink,
    AlertCircle,
    X,
    RotateCw,
    MapPin
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api/axios';
import { resolveStaticUrl } from '../utils/url';
import { getResidentPhoto } from '../utils/residentUtils';

export default function DeceasedResidents() {
    const navigate = useNavigate();
    const [residents, setResidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/residents/?size=100');
            let allResidents = response.data.items || (Array.isArray(response.data) ? response.data : []);

            if (response.data.total && response.data.total > 100) {
                const response2 = await api.get('/residents/?size=100&page=2');
                const items2 = response2.data.items || [];
                allResidents = [...allResidents, ...items2];
            }

            // Filtrar solo Defunciones
            setResidents(allResidents.filter(r => r.status === 'deceased'));
        } catch (error) {
            console.error("Error fetching deceased residents:", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter by Search Term
    let filteredResidents = residents;
    if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        filteredResidents = residents.filter(r =>
            r.name.toLowerCase().includes(lowerTerm) ||
            r.surname.toLowerCase().includes(lowerTerm) ||
            (r.death_place || '').toLowerCase().includes(lowerTerm)
        );
    }

    // Sort by Date (Newest First)
    filteredResidents.sort((a, b) => {
        const dateA = a.inactive_date ? new Date(a.inactive_date) : new Date(0);
        const dateB = b.inactive_date ? new Date(b.inactive_date) : new Date(0);
        return dateB - dateA;
    });

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-8 pb-20">
                {/* Header Integrado y Premium */}
                <div className="bg-white rounded-[2rem] border-2 border-[#0F172A] shadow-sm overflow-hidden">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-6 py-5 border-b border-slate-100 bg-slate-50/10">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="w-10 h-10 bg-[#0F172A] hover:bg-slate-800 text-white rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg active:scale-95 shrink-0"
                                title="Volver"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="flex flex-col">
                                <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Defunciones</h1>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mt-1.5 leading-none">Registro Histórico</p>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="flex-1 min-w-[200px] flex items-center gap-3 bg-white border-2 border-slate-200/60 rounded-2xl px-4 h-12 shadow-sm focus-within:border-indigo-300 focus-within:shadow-md focus-within:shadow-indigo-50/50 transition-all group">
                            <Search className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Buscar en defunciones..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-transparent border-none text-sm font-bold focus:ring-0 text-slate-700 p-0 w-full placeholder:text-slate-300 placeholder:font-medium"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-300 hover:text-rose-500 transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="w-full h-px bg-slate-100 md:hidden" />

                    <div className="flex flex-col md:flex-row md:items-center justify-center gap-10 px-4 md:px-6 py-4 bg-white border-t border-slate-50">
                        <div className={`p-4 flex items-center justify-center gap-4 rounded-xl border transition-all duration-300 bg-rose-50/50 border-rose-200 w-full md:w-auto min-w-[180px]`}>
                            <div className="p-2.5 rounded-lg bg-rose-100 text-rose-700">
                                <AlertCircle className="w-5 h-5" strokeWidth={2.5} />
                            </div>
                            <div>
                                <span className="block text-xl font-black leading-none text-rose-900">
                                    {residents.length}
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-wider text-rose-600">
                                    Total Registros
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 w-full md:w-auto">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={fetchData}
                                    className="h-11 w-11 flex items-center justify-center bg-white border-2 border-slate-200/60 rounded-xl text-slate-400 hover:text-[#0F172A] hover:border-[#0F172A] hover:bg-slate-50 transition-all shadow-sm active:scale-95 group shrink-0"
                                    title="Refrescar datos"
                                >
                                    <RotateCw className={`w-5 h-5 group-hover:rotate-180 transition-transform duration-500 ${loading ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Table */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
                        </div>
                    ) : filteredResidents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-96 text-slate-400">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <Skull className="w-10 h-10 text-slate-300" />
                            </div>
                            <p className="text-lg font-medium">No hay defunciones registradas</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-200 hidden md:table-header-group">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider pl-8">Residente</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Lugar & Motivo</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-right pr-8">Fecha de Defunción</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 block md:table-row-group">
                                    {filteredResidents.map((r, idx) => {
                                        const deathDate = r.inactive_date ? new Date(r.inactive_date) : null;

                                        return (
                                            <tr
                                                key={`${r.id}-${idx}`}
                                                className="transition-all border-l-4 block md:table-row mb-4 md:mb-0 rounded-lg md:rounded-none shadow-sm md:shadow-none bg-slate-50 border-rose-400 hover:bg-slate-100/50"
                                            >
                                                {/* RESIDENTE */}
                                                <td className="px-4 py-4 md:px-6 md:py-5 md:pl-8 block md:table-cell">
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative shrink-0">
                                                            <img
                                                                src={resolveStaticUrl(getResidentPhoto(r))}
                                                                alt={r.name}
                                                                className="w-12 h-12 md:w-12 md:h-12 rounded-2xl object-cover shadow-sm ring-2 ring-rose-400 ring-offset-2 grayscale opacity-90"
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = `https://ui-avatars.com/api/?name=${r.name}+${r.surname}&background=ffe4e6&color=e11d48&size=150&bold=true`;
                                                                }}
                                                                loading="lazy"
                                                            />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-bold text-slate-800 text-lg md:text-base leading-tight truncate">{r.name} {r.surname}</p>
                                                            <div className="flex items-center gap-2 mt-1 md:mt-0">
                                                                <span className="md:hidden px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700">
                                                                    Defunción
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* LUGAR Y MOTIVO */}
                                                <td className="px-4 pb-2 md:px-6 md:py-5 block md:table-cell">
                                                    <div className="flex md:hidden flex-col gap-2">
                                                        <div className="flex items-start gap-2">
                                                            <MapPin className="w-4 h-4 text-rose-400 mt-0.5" />
                                                            <span className="text-sm font-bold text-slate-700">{r.death_place || 'No especificado'}</span>
                                                        </div>
                                                        <div className="flex items-start gap-2">
                                                            <span className="text-xs font-bold text-slate-400 uppercase w-20 mt-0.5">Motivo:</span>
                                                            <p className="text-sm text-slate-600 line-clamp-2">{r.inactive_reason || '-'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="hidden md:block max-w-[250px]">
                                                        <div className="flex items-center gap-1 text-slate-800 font-bold mb-1">
                                                            <MapPin className="w-4 h-4 text-rose-400" />
                                                            <span className="truncate" title={r.death_place}>{r.death_place || 'Lugar no especificado'}</span>
                                                        </div>
                                                        <p className="text-sm text-slate-500 truncate" title={r.inactive_reason}>{r.inactive_reason || '-'}</p>
                                                    </div>
                                                </td>

                                                {/* FECHAS */}
                                                <td className="px-4 pb-4 md:px-6 md:py-5 text-right block md:table-cell pr-8">
                                                    <div className="flex justify-between items-center md:flex-col md:items-end gap-1">
                                                        <span className="md:hidden text-xs font-bold text-slate-400 uppercase">Fecha</span>
                                                        <span className="text-xl font-black text-rose-600">
                                                            {deathDate ? format(deathDate, 'd MMM yyyy', { locale: es }) : '--'}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* ACCIONES */}
                                                <td className="px-2 hidden md:table-cell">
                                                    <button
                                                        onClick={() => navigate(`/residents/${r.id}/edit?tab=0#inactive-section`)}
                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
                                                        title="Editar detalles"
                                                    >
                                                        <ExternalLink className="w-5 h-5" />
                                                    </button>
                                                </td>
                                                <td className="block md:hidden px-4 pb-4">
                                                    <button
                                                        onClick={() => navigate(`/residents/${r.id}/edit?tab=0#inactive-section`)}
                                                        className="w-full py-2 flex items-center justify-center gap-2 bg-rose-50 text-rose-700 font-bold text-sm rounded-lg hover:bg-rose-100 border border-rose-200 transition-colors"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                        Gestión de Defunción
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
