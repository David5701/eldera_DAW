import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import {
    Calendar,
    Filter,
    User,
    Clock,
    FileText,
    RotateCw,
    Search,
    Plus,
    X,
    Send,
    ArrowLeft,
    Trash2,
    Edit2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import DateRangeFilter from './DateRangeFilter';

const TYPE_LABELS = {
    nursing: { label: 'Enfermería', color: 'bg-blue-100 text-blue-800' },
    medical: { label: 'Médico', color: 'bg-red-100 text-red-800' },
    auxiliar: { label: 'Auxiliar', color: 'bg-green-100 text-green-800' },
    social: { label: 'Social', color: 'bg-purple-100 text-purple-800' },
    psychology: { label: 'Psicología', color: 'bg-pink-100 text-pink-800' },
    physiotherapy: { label: 'Fisioterapia', color: 'bg-teal-100 text-teal-800' },
    occupational: { label: 'Terapia Ocupacional', color: 'bg-indigo-100 text-indigo-800' },
    admin: { label: 'Admin', color: 'bg-gray-100 text-gray-800' }
};

export default function GeneralFollowups({ onBack, residentId = null, resident = null, externalFilters = null, className = 'gap-6' }) {
    const { user } = useAuth();
    const { addToast } = useToast();

    // Date Helpers
    const getTodayLocal = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getLastWeekLocal = () => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Filter States (Use external if provided, otherwise internal)
    const [followups, setFollowups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [typeFilterInternal, setTypeFilterInternal] = useState('');
    const [searchQueryInternal, setSearchQueryInternal] = useState('');
    const [startDateInternal, setStartDateInternal] = useState(getLastWeekLocal());
    const [endDateInternal, setEndDateInternal] = useState(getTodayLocal());

    // Derived values
    const typeFilter = externalFilters ? externalFilters.type : typeFilterInternal;
    const setTypeFilter = externalFilters ? externalFilters.onTypeChange : setTypeFilterInternal;
    const searchQuery = externalFilters ? externalFilters.search : searchQueryInternal;
    const setSearchQuery = externalFilters ? externalFilters.onSearchChange : setSearchQueryInternal;
    const startDate = externalFilters ? (externalFilters.startDate || '') : startDateInternal;
    const setStartDate = externalFilters ? externalFilters.onStartChange : setStartDateInternal;
    const endDate = externalFilters ? (externalFilters.endDate || '') : endDateInternal;
    const setEndDate = externalFilters ? externalFilters.onEndChange : setEndDateInternal;

    // Creation States
    const [isAdding, setIsAdding] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [residentSearch, setResidentSearch] = useState('');
    const [foundResidents, setFoundResidents] = useState([]);
    const [selectedResident, setSelectedResident] = useState(null);
    const [newNote, setNewNote] = useState('');
    const getRoleBasedType = (role) => {
        const roleMapping = {
            'nurse': 'nursing',
            'aux': 'auxiliar',
            'doctor': 'medical',
            'social_worker': 'social',
            'physiotherapist': 'physiotherapy',
            'occupational_therapist': 'occupational',
            'admin': 'admin'
        };
        return roleMapping[role] || 'nursing';
    };

    const [newType, setNewType] = useState('admin');
    const [showResidentResults, setShowResidentResults] = useState(false);
    const searchRef = useRef(null);

    // Sync newType when user loads
    useEffect(() => {
        if (user?.role) {
            setNewType(getRoleBasedType(user.role));
        }
    }, [user?.role]);

    const fetchFollowups = React.useCallback(async () => {
        setLoading(true);
        try {
            let url = residentId
                ? `/residents/${residentId}/followups?`
                : `/residents/followups/all?`;

            const params = new URLSearchParams();
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            if (typeFilter) params.append('type', typeFilter);
            if (searchQuery) params.append('q', searchQuery);

            url += params.toString();

            const response = await api.get(url);
            setFollowups(response.data);
        } catch (error) {
            console.error('Error fetching general followups:', error);
            addToast('Error al cargar seguimientos', 'error');
        } finally {
            setLoading(false);
        }
    }, [residentId, startDate, endDate, typeFilter, searchQuery, addToast]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchFollowups();
        }, 300);
        return () => clearTimeout(timer);
    }, [startDate, endDate, typeFilter, searchQuery, residentId, fetchFollowups]);

    // Si se pasa la prop 'resident' (ej. desde el Perfil), establecerlo como seleccionado
    useEffect(() => {
        if (resident) {
            setSelectedResident(resident);
        }
    }, [resident]);

    const handleResidentSearch = async (val) => {
        setResidentSearch(val);
        if (val.length < 2) {
            setFoundResidents([]);
            setShowResidentResults(false);
            return;
        }

        try {
            const response = await api.get(`/residents/?q=${encodeURIComponent(val)}&size=5`);
            setFoundResidents(response.data.items);
            setShowResidentResults(true);
        } catch (error) {
            console.error('Error searching residents:', error);
        }
    };

    const handleAddFollowup = async (e) => {
        e.preventDefault();
        if (!selectedResident || !newNote.trim()) {
            addToast('Selecciona un residente y escribe una nota', 'warning');
            return;
        }

        setSubmitting(true);
        try {
            await api.post(`/residents/${selectedResident.id}/followups`, {
                content: newNote,
                type: newType
            });
            addToast('Seguimiento registrado correctamente', 'success');
            setNewNote('');
            if (!residentId) {
                // Only clear resident if we are in general view
                setSelectedResident(null);
                setResidentSearch('');
            }
            setIsAdding(false);
            fetchFollowups();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error('Error creating followup:', error);
            const msg = error.response?.data?.detail || 'Error al registrar el seguimiento';
            addToast(msg, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowResidentResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e) => {
        if (e.key === 'Enter') fetchFollowups();
    };

    return (
        <div className={`flex flex-col w-full h-full ${className}`}>
            {/* 1. CONTROL PANEL CARD (Header + Filters + Form) */}
            <div className="bg-white rounded-[2rem] border-2 border-[#0F172A] shadow-sm overflow-visible flex flex-col shrink-0 z-20 relative">

                {/* Header Section */}
                <div className="flex flex-row items-center justify-between gap-4 px-6 py-5 border-b border-slate-100 bg-slate-50/10 shrink-0">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                        <button
                            type="button"
                            onClick={onBack}
                            className="w-12 h-12 bg-[#0F172A] hover:bg-slate-800 text-white rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg active:scale-95 shrink-0"
                            title="Volver"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div className="flex flex-col min-w-0 flex-1">
                            {/* Title - WRAPPING allowed, NO truncate */}
                            <h2 className="text-xl md:text-2xl font-black text-slate-800 flex flex-wrap items-center gap-2 tracking-tight leading-tight pr-2">
                                <FileText className="w-6 h-6 text-[#0F172A] shrink-0" />
                                <span className="break-words">
                                    {residentId ? (resident ? `${resident.name} ${resident.surname}` : "Evolutivos") : "Evolución General"}
                                </span>
                            </h2>
                            {!loading && (
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">
                                        {followups.length} registros
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsAdding(!isAdding)}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md active:scale-95 shrink-0 ${isAdding ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-emerald-200'}`}
                        title={isAdding ? "Cancelar" : "Nuevo Seguimiento"}
                    >
                        {isAdding ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                    </button>
                </div>

                {/* Filters Section (Always Visible) */}
                <div className={`p-4 space-y-3 shrink-0 bg-white transition-all ${!isAdding ? 'rounded-b-[2rem]' : ''}`}>
                    <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
                        {/* Search */}
                        <div className="flex-1 min-w-0">
                            <div className="bg-white rounded-xl px-4 h-10 md:h-14 shadow-md transition-all group flex items-center gap-3 border-2 border-slate-300 focus-within:border-indigo-400">
                                <Search className="w-4 h-4 md:w-5 md:h-5 text-slate-400 group-focus-within:text-indigo-500 shrink-0" />
                                <div className="flex-1 flex flex-col min-w-0">
                                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-wider leading-none mb-0.5">Buscador</span>
                                    <input
                                        type="text"
                                        placeholder="Nombre o contenido..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={handleSearch}
                                        className="bg-transparent border-none focus:ring-0 text-slate-700 p-0 w-full h-auto placeholder:text-slate-300 min-w-0 block appearance-none outline-none ring-0 shadow-none font-black text-xs md:text-sm"
                                    />
                                </div>
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="p-1 hover:bg-slate-100 rounded-lg text-slate-300 shrink-0">
                                        <X className="w-3 h-3 md:w-4 md:h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Filters Group */}
                        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center shrink-0">
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <div className="flex-1 md:flex-none md:w-[200px] flex items-center gap-2 bg-white border-2 border-slate-300 rounded-xl px-3 h-10 md:h-14 shadow-md focus-within:border-indigo-400 transition-all group">
                                    <Filter className="w-3 h-3 md:w-4 md:h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors shrink-0" />
                                    <div className="flex-1 flex flex-col min-w-0">
                                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-wider leading-none mb-0.5">Categoría</span>
                                        <select
                                            value={typeFilter}
                                            onChange={(e) => setTypeFilter(e.target.value)}
                                            className="bg-transparent border-none text-[11px] md:text-xs font-black uppercase tracking-tight focus:ring-0 text-slate-700 p-0 pr-6 w-full cursor-pointer h-auto leading-none"
                                        >
                                            <option value="">Todas</option>
                                            {Object.entries(TYPE_LABELS).map(([key, { label }]) => (
                                                <option key={key} value={key}>{label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <button
                                    onClick={fetchFollowups}
                                    className="h-10 md:h-14 w-10 md:w-14 flex items-center justify-center bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl transition-all shadow-md active:scale-95 group shrink-0"
                                    title="Refrescar"
                                >
                                    <RotateCw className={`w-4 h-4 md:w-5 md:h-5 group-hover:rotate-180 transition-transform duration-500 ${loading ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                            <div className="w-full md:w-auto">
                                <DateRangeFilter
                                    startDate={startDate}
                                    endDate={endDate}
                                    onStartChange={setStartDate}
                                    onEndChange={setEndDate}
                                    className="w-full md:w-auto h-10 md:h-14"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add New Form (Expandable) */}
                {isAdding && (
                    <div className="border-t border-slate-100 bg-slate-50 p-6 animate-in slide-in-from-top-4 fade-in duration-300 rounded-b-[2rem]">
                        <form onSubmit={handleAddFollowup} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


                                {/* Resident Selector (Only if not pre-selected) */}
                                {!residentId && (
                                    <div ref={searchRef} className="relative">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Residente</label>
                                        {selectedResident ? (
                                            <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-indigo-600 font-bold border border-indigo-100">
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold text-indigo-900">{selectedResident.name} {selectedResident.surname}</p>
                                                    <p className="text-xs text-indigo-600">Hab. {selectedResident.room_number}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedResident(null);
                                                        setResidentSearch('');
                                                    }}
                                                    className="p-2 hover:bg-white rounded-lg text-indigo-400 hover:text-red-500 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={residentSearch}
                                                        onChange={(e) => handleResidentSearch(e.target.value)}
                                                        placeholder="Buscar residente..."
                                                        className="w-full p-3 pl-10 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    />
                                                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                                </div>
                                                {showResidentResults && foundResidents.length > 0 && (
                                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 z-50 max-h-60 overflow-y-auto">
                                                        {foundResidents.map(r => (
                                                            <button
                                                                key={r.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedResident(r);
                                                                    setShowResidentResults(false);
                                                                }}
                                                                className="w-full px-4 py-3 text-left hover:bg-indigo-50 flex items-center gap-3 transition-colors border-b border-slate-50 last:border-0"
                                                            >
                                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                                    <User className="w-4 h-4" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-slate-800">{r.name} {r.surname}</p>
                                                                    <p className="text-[10px] text-slate-500 uppercase font-medium">Hab. {r.room_number}</p>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Category */}
                                <div>
                                    <label className="block text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">Categoría</label>
                                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100 h-[46px]">
                                        <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></div>
                                        {TYPE_LABELS[newType]?.label || newType}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <textarea
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    placeholder="Escribe aquí el seguimiento clínico..."
                                    className="w-full min-h-[140px] p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                                />
                                <div className="flex items-center justify-end gap-3">
                                    <span className={`text-[10px] font-bold uppercase ${newNote.length > 0 ? 'text-indigo-400' : 'text-slate-300'}`}>
                                        {newNote.length} caracteres
                                    </span>
                                    <button
                                        type="submit"
                                        disabled={submitting || !newNote.trim() || !selectedResident}
                                        className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {submitting ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <Send className="w-4 h-4" />
                                        )}
                                        Guardar
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {/* 2. FLOATING CONTENT LIST (Cards) */}
            <div className="flex-1 w-full relative min-h-[200px]">
                {loading && followups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="text-sm font-medium text-slate-500 tracking-wide">Cargando registros...</p>
                    </div>
                ) : followups.length === 0 ? (
                    <div className="text-center py-20 flex flex-col items-center justify-center bg-white rounded-[2rem] border border-slate-200 border-dashed">
                        <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">No se han encontrado seguimientos.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {followups.map((f) => {
                            const typeConfig = TYPE_LABELS[f.type] || TYPE_LABELS['admin'];
                            const date = new Date(f.created_at);

                            return (
                                <div
                                    key={f.id}
                                    className="bg-white rounded-3xl border-2 border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden"
                                >
                                    {/* Card Header (Mobile Friendly) */}
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-slate-50/50 border-b border-slate-100">
                                        <div className="flex items-center gap-4">
                                            {/* Resident Info (If Global View) */}
                                            {!residentId && f.resident_name ? (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-200 flex items-center justify-center text-slate-400 shadow-sm shrink-0">
                                                        <User className="w-6 h-6" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-base font-black text-slate-900 leading-tight">
                                                            {f.resident_name} {f.resident_surname}
                                                        </p>
                                                        <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                                                            Habitación {f.resident_room || '?'}
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                                        <Clock className="w-5 h-5" />
                                                    </div>
                                                    <span className="text-sm font-black text-slate-900 uppercase tracking-tight">
                                                        {date.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-none pt-3 md:pt-0">
                                            {/* Date/Time for Global, or just Time for Individual */}
                                            <div className="flex flex-col items-end md:items-end">
                                                {!residentId && (
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:block">
                                                        {date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                                    </span>
                                                )}
                                                <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5 text-slate-300" />
                                                    {date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            
                                            {/* Category Badge */}
                                            <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${typeConfig.color} border border-current/10 shadow-sm`}>
                                                {typeConfig.label}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Card Content */}
                                    <div className="p-6">
                                        <div className="prose prose-sm max-w-none text-slate-700 font-medium leading-relaxed text-sm md:text-base">
                                            {f.content}
                                        </div>

                                        {/* Footer: Author */}
                                        {f.staff_name && (
                                            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-50">
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                                    Autor:
                                                </span>
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border-2 border-slate-100 shadow-sm">
                                                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] font-bold">
                                                        {f.staff_name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-xs font-black text-slate-600 uppercase tracking-tight">
                                                        {f.staff_name}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
