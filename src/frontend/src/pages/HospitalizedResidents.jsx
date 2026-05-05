import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Search,
    MapPin,
    Calendar,
    Clock,
    FileText,
    ExternalLink,
    AlertCircle,
    History,
    Filter,
    CheckCircle2,
    RotateCw,
    RotateCcw,
    X
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api/axios';
import { resolveStaticUrl } from '../utils/url';
import { getResidentPhoto } from '../utils/residentUtils';
import DateRangeFilter from '../components/DateRangeFilter';

export default function HospitalizedResidents() {
    const navigate = useNavigate();
    const [residents, setResidents] = useState([]);
    const [processedEvents, setProcessedEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Filters
    const [showHistory, setShowHistory] = useState(false);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        let events = [];

        residents.forEach(r => {
            // 1. Current Active Hospitalization
            if (r.status === 'hospitalized') {
                events.push({
                    type: 'active',
                    resident: r,
                    hospital: r.hospitalization_hospital, // Updated to match API
                    startDate: r.hospitalization_date,
                    endDate: null,
                    reason: r.hospitalization_reason,     // Updated to match API
                    notes: r.hospitalization_notes
                });
            }

            // 2. Historical Hospitalizations (Only if toggle ON)
            if (showHistory && r.hospitalization_history && Array.isArray(r.hospitalization_history)) {
                r.hospitalization_history.forEach(h => {
                    events.push({
                        type: 'history',
                        resident: r,
                        hospital: h.hospital,
                        startDate: h.start,
                        endDate: h.end,
                        reason: h.reason,
                        notes: h.notes
                    });
                });
            }
        });

        // Filter by Search Term
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            events = events.filter(e =>
                e.resident.name.toLowerCase().includes(lowerTerm) ||
                e.resident.surname.toLowerCase().includes(lowerTerm) ||
                (e.resident.room_number || '').toLowerCase().includes(lowerTerm) ||
                (e.hospital || '').toLowerCase().includes(lowerTerm)
            );
        }

        // Filter by Date Range
        if (dateRange.start && dateRange.end) {
            const start = new Date(dateRange.start);
            const end = new Date(dateRange.end);
            events = events.filter(e => {
                if (!e.startDate) return false;
                const eventDate = new Date(e.startDate);
                return eventDate >= start && eventDate <= end;
            });
        }

        // Sort by Date (Newest First)
        events.sort((a, b) => {
            const dateA = a.startDate ? new Date(a.startDate) : new Date(0);
            const dateB = b.startDate ? new Date(b.startDate) : new Date(0);
            return dateB - dateA;
        });

        setProcessedEvents(events);
    }, [residents, showHistory, searchTerm, dateRange]);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch all residents (max allowed is 100 per page)
            // Ideally we should loop pages, but for now we fetch max page size
            const response = await api.get('/residents/?size=100&source=hospitalized_management');

            // Handle pagination structure
            let allResidents = response.data.items || (Array.isArray(response.data) ? response.data : []);

            // If total > 100, we might need to fetch more pages. 
            // For this quick fix, if we see total > 100, we fetch page 2 to ensure we catch everyone (up to 200).
            if (response.data.total && response.data.total > 100) {
                const response2 = await api.get('/residents/?size=100&page=2');
                const items2 = response2.data.items || [];
                allResidents = [...allResidents, ...items2];
            }

            setResidents(allResidents);
        } catch (error) {
            console.error("Error fetching residents:", error);
        } finally {
            setLoading(false);
        }
    };

    // processEvents moved to useEffect

    // Stats
    const activeCount = residents.filter(r => r.status === 'hospitalized').length;
    const historyCount = processedEvents.filter(e => e.type === 'history').length;

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-8 pb-20">
                {/* Header Integrado y Premium */}
                <div className="bg-white rounded-[2rem] border-2 border-[#0F172A] shadow-sm overflow-hidden">
                    {/* Fila Superior: Título y Buscador */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-6 py-5 border-b border-slate-100 bg-slate-50/10">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/')}
                                className="w-10 h-10 bg-[#0F172A] hover:bg-slate-800 text-white rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg active:scale-95 shrink-0"
                                title="Volver"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="flex flex-col">
                                <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Hospitalizados</h1>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mt-1.5 leading-none">Gestión e Histórico</p>
                            </div>
                        </div>

                        {/* Search Bar (Unified Premium Style) */}
                        <div className="flex-1 min-w-[200px] flex items-center gap-3 bg-white border-2 border-slate-300 rounded-xl px-4 h-10 md:h-14 shadow-md focus-within:border-indigo-400 transition-all group">
                            <Search className="w-4 h-4 md:w-5 md:h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors shrink-0" />
                            <div className="flex-1 flex flex-col min-w-0">
                                <span className="text-[7px] font-black text-slate-400 uppercase tracking-wider leading-none mb-0.5">Buscador</span>
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre u hospital..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-transparent border-none text-xs md:text-sm font-black focus:ring-0 text-slate-700 p-0 w-full placeholder:text-slate-300 h-auto"
                                />
                            </div>
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

                    {/* Fila Inferior: Estadísticas y Filtros - Centrado Total */}
                    <div className="flex flex-col md:flex-row md:items-center justify-center gap-10 px-4 md:px-6 py-4 bg-white border-t border-slate-50">
                        {/* Stats Simplificadas - Centradas */}
                        <div className={`p-4 flex items-center justify-center gap-4 rounded-xl border transition-all duration-300 ${showHistory ? 'bg-indigo-50/50 border-indigo-100' : 'bg-amber-50/50 border-amber-100'} w-full md:w-auto min-w-[180px]`}>
                            <div className={`p-2.5 rounded-lg ${showHistory ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'}`}>
                                {showHistory ? <History className="w-5 h-5" strokeWidth={2.5} /> : <AlertCircle className="w-5 h-5" strokeWidth={2.5} />}
                            </div>
                            <div>
                                <span className={`block text-xl font-black leading-none ${showHistory ? 'text-indigo-900' : 'text-amber-900'}`}>
                                    {showHistory ? historyCount + activeCount : activeCount}
                                </span>
                                <span className={`text-[10px] font-black uppercase tracking-wider ${showHistory ? 'text-indigo-500' : 'text-amber-500'}`}>
                                    {showHistory ? 'Total Registros' : 'Activos Ahora'}
                                </span>
                            </div>
                        </div>

                        {/* Filtros de Histórico y Controles - Centrado Total */}
                        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 w-full md:w-auto">
                            <div className="flex items-center gap-2">
                                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-100 transition-all shadow-sm h-11 select-none shrink-0">
                                    <input
                                        type="checkbox"
                                        checked={showHistory}
                                        onChange={(e) => setShowHistory(e.target.checked)}
                                        className="w-4 h-4 text-[#0F172A] rounded border-slate-300 focus:ring-[#0F172A]"
                                    />
                                    <span className="text-xs font-black uppercase text-slate-600 tracking-tight">Ver Histórico</span>
                                </label>

                                <button
                                    onClick={fetchData}
                                    className="h-11 w-11 flex items-center justify-center bg-white border-2 border-slate-200/60 rounded-xl text-slate-400 hover:text-[#0F172A] hover:border-[#0F172A] hover:bg-slate-50 transition-all shadow-sm active:scale-95 group shrink-0"
                                    title="Refrescar datos"
                                >
                                    <RotateCw className={`w-5 h-5 group-hover:rotate-180 transition-transform duration-500 ${loading ? 'animate-spin' : ''}`} />
                                </button>
                            </div>

                            {showHistory && (
                                <DateRangeFilter
                                    startDate={dateRange.start}
                                    endDate={dateRange.end}
                                    onStartChange={(val) => setDateRange(prev => ({ ...prev, start: val }))}
                                    onEndChange={(val) => setDateRange(prev => ({ ...prev, end: val }))}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Table */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : processedEvents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-96 text-slate-400">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <FileText className="w-10 h-10 text-slate-300" />
                            </div>
                            <p className="text-lg font-medium">No se encontraron registros</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-200 hidden md:table-header-group">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider pl-8">Residente</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Hospital</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Motivo</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Fechas</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-right pr-8">Duración</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 block md:table-row-group">
                                    {processedEvents.map((event, idx) => {
                                        const startDate = event.startDate ? new Date(event.startDate) : null;
                                        const endDate = event.endDate ? new Date(event.endDate) : null;
                                        const daysElapsed = startDate ? differenceInDays(endDate || new Date(), startDate) : 0;
                                        const isActive = event.type === 'active';

                                        return (
                                            <tr
                                                key={`${event.resident.id}-${idx}`}
                                                className={`transition-all border-l-4 block md:table-row mb-4 md:mb-0 rounded-lg md:rounded-none shadow-sm md:shadow-none ${isActive
                                                    ? 'bg-amber-50/50 border-amber-400 hover:bg-amber-100/50'
                                                    : 'bg-white border-transparent hover:bg-slate-50'
                                                    }`}
                                            >
                                                {/* RESIDENTE */}
                                                <td className="px-4 py-4 md:px-6 md:py-5 md:pl-8 block md:table-cell">
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative shrink-0">
                                                            <img
                                                                src={resolveStaticUrl(getResidentPhoto(event.resident))}
                                                                alt={event.resident.name}
                                                                className={`w-12 h-12 md:w-12 md:h-12 rounded-2xl object-cover shadow-sm ${isActive ? 'ring-2 ring-amber-400 ring-offset-2' : ''}`}
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = `https://ui-avatars.com/api/?name=${event.resident.name}+${event.resident.surname}&background=e0e7ff&color=4f46e5&size=150&bold=true`;
                                                                }}
                                                                loading="lazy"
                                                            />
                                                            {isActive && (
                                                                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border-2 border-white"></span>
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-bold text-slate-800 text-lg md:text-base leading-tight truncate">{event.resident.name} {event.resident.surname}</p>
                                                            <div className="flex items-center gap-2 mt-1 md:mt-0">
                                                                <p className="text-xs text-slate-500 font-medium">Hab. {event.resident.room_number}</p>
                                                                {/* Mobile-only status badge */}
                                                                <span className={`md:hidden px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isActive ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                                                                    {isActive ? 'Ingresado' : 'Alta'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* HOSPITAL (Mobile: Part of details) */}
                                                <td className="px-4 pb-2 md:px-6 md:py-5 block md:table-cell">
                                                    <div className="flex items-center gap-2 md:hidden mb-1">
                                                        <span className="text-xs font-bold text-slate-400 uppercase w-20">Hospital:</span>
                                                        <div className="flex items-center gap-2 text-slate-800 font-bold">
                                                            <MapPin className="w-4 h-4 text-amber-500" />
                                                            <span>{event.hospital || 'No especificado'}</span>
                                                        </div>
                                                    </div>
                                                    {/* Desktop View */}
                                                    <div className="hidden md:flex items-center gap-2 text-slate-800 font-bold">
                                                        <MapPin className={`w-4 h-4 ${isActive ? 'text-amber-500' : 'text-slate-400'}`} />
                                                        <span className="truncate max-w-[150px]" title={event.hospital}>{event.hospital || '-'}</span>
                                                    </div>
                                                </td>

                                                {/* MOTIVO (Mobile: Part of details) */}
                                                <td className="px-4 pb-2 md:px-6 md:py-5 block md:table-cell">
                                                    <div className="flex md:hidden flex-col gap-1">
                                                        <div className="flex items-start gap-2">
                                                            <span className="text-xs font-bold text-slate-400 uppercase w-20 mt-0.5">Motivo:</span>
                                                            <p className="text-sm text-slate-600 line-clamp-2">{event.reason || 'Sin motivo'}</p>
                                                        </div>
                                                    </div>
                                                    {/* Desktop View */}
                                                    <div className="hidden md:block max-w-[200px]">
                                                        <p className="text-sm text-slate-600 truncate" title={event.reason}>{event.reason || '-'}</p>
                                                    </div>
                                                </td>

                                                {/* FECHAS (Mobile: Part of details) */}
                                                <td className="px-4 pb-4 md:px-6 md:py-5 text-right block md:table-cell">
                                                    {/* Desktop View */}
                                                    <div className="hidden md:flex flex-col items-end gap-0.5">
                                                        <span className="text-sm font-bold text-slate-700">{startDate ? format(startDate, 'd MMM yyyy', { locale: es }) : '--'}</span>
                                                        {endDate && <span className="text-xs text-slate-400">a {format(endDate, 'd MMM yyyy', { locale: es })}</span>}
                                                    </div>
                                                </td>

                                                {/* DURACIÓN (Mobile: Included in header or separate) */}
                                                <td className="px-4 pb-4 md:px-6 md:py-5 text-right pr-8 block md:table-cell border-t md:border-t-0 border-slate-100 pt-3 md:pt-5 mt-2 md:mt-0">
                                                    <div className="flex justify-between items-center md:flex-col md:items-end gap-1">
                                                        <span className="md:hidden text-xs font-bold text-slate-400 uppercase">Tiempo total</span>
                                                        <div className="flex flex-col items-end">
                                                            <span className={`text-xl md:text-2xl font-black ${isActive ? 'text-amber-500' : 'text-slate-600'}`}>
                                                                {daysElapsed} <span className="text-xs font-bold uppercase opacity-70">Días</span>
                                                            </span>
                                                            {!endDate && isActive && (
                                                                <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                                                                    Desde {startDate ? format(startDate, 'd MMM', { locale: es }) : ''}
                                                                </span>
                                                            )}
                                                            {/* Mobile only date range */}
                                                            <span className="md:hidden text-xs text-slate-400 mt-1">
                                                                {startDate ? format(startDate, 'd/MM/yy', { locale: es }) : ''} - {endDate ? format(endDate, 'd/MM/yy', { locale: es }) : 'Act'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-2 hidden md:table-cell">
                                                    {isActive && (
                                                        <button
                                                            onClick={() => navigate(`/residents/${event.resident.id}/edit#hospitalization-section`)}
                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                                                            title="Editar detalles"
                                                        >
                                                            <ExternalLink className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </td>

                                                {/* Mobile Edit Button (Floating or distinct) */}
                                                <td className="block md:hidden px-4 pb-4">
                                                    {isActive && (
                                                        <button
                                                            onClick={() => navigate(`/residents/${event.resident.id}/edit#hospitalization-section`)}
                                                            className="w-full py-2 flex items-center justify-center gap-2 bg-slate-50 text-slate-600 font-bold text-sm rounded-lg hover:bg-slate-100 border border-slate-200 transition-colors"
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                            Gestión de Ingreso
                                                        </button>
                                                    )}
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
