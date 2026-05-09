import React, { useState } from 'react';
import {
    Activity,
    Thermometer,
    Droplet,
    Wind,
    Scale,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Trash2,
    User,
    ArrowRightLeft,
    Utensils,
    CheckCircle2,
    Lock,
    HeartPulse
} from 'lucide-react';
import api from '../api/axios';
import { useToast } from './Toast';
import { useAuth } from '../context/AuthContext';

const ALL_CATEGORIES = [
    { id: 'vitals', label: 'Constantes', icon: Activity, color: 'text-rose-700', bg: 'bg-rose-100', borderColor: 'border-rose-200', allowedRoles: ['admin', 'director', 'doctor', 'nurse'] },
    { id: 'care', label: 'Cuidados', icon: CheckCircle2, color: 'text-amber-800', bg: 'bg-amber-100', borderColor: 'border-amber-200', allowedRoles: ['admin', 'director', 'doctor', 'nurse', 'aux'] },
];

const VITAL_TYPES = [
    // TA handled separately
    // Added explicit buttonBg to avoid fragile string replacements
    { id: 'heart_rate', label: 'Frecuencia', unit: 'LPM', icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50', buttonBg: 'bg-indigo-600', focusBorder: 'focus:border-indigo-500' },
    { id: 'temperature', label: 'Temperatura', unit: '°C', icon: Thermometer, color: 'text-orange-600', bg: 'bg-orange-50', buttonBg: 'bg-orange-600', focusBorder: 'focus:border-orange-500' },
    { id: 'glucose', label: 'Glucemia', unit: 'mg/dL', icon: Droplet, color: 'text-amber-600', bg: 'bg-amber-50', buttonBg: 'bg-amber-600', focusBorder: 'focus:border-amber-500' },
    { id: 'spo2', label: 'Saturación', unit: '%', icon: Wind, color: 'text-sky-600', bg: 'bg-sky-50', buttonBg: 'bg-sky-600', focusBorder: 'focus:border-sky-500' },
    { id: 'weight', label: 'Peso', unit: 'kg', icon: Scale, color: 'text-slate-600', bg: 'bg-slate-50', buttonBg: 'bg-slate-600', focusBorder: 'focus:border-slate-500' },
];

const CARE_TYPES = [
    { id: 'diaper', label: 'Cambio Pañal', options: ['Seco', 'Mojado', 'Sucio', 'Hematuria', 'Rectorragia', 'Melenas', 'Diarrea', 'Estreñimiento'], icon: Trash2, color: 'text-amber-600', bg: 'bg-amber-50', hoverBorder: 'hover:border-amber-500', activeColor: 'text-amber-700' },
    { id: 'hygiene', label: 'Aseo e Higiene', options: ['Aseo en cama', 'Ducha completa', 'Lavado parcial', 'Cambio ropa'], icon: User, color: 'text-sky-600', bg: 'bg-sky-50', hoverBorder: 'hover:border-sky-500', activeColor: 'text-sky-700' },
    { id: 'fluid_intake', label: 'Hidratación', options: ['0%', '25%', '50%', '75%', '100%'], icon: Droplet, color: 'text-teal-600', bg: 'bg-teal-50', hoverBorder: 'hover:border-teal-500', activeColor: 'text-teal-700' },
    { id: 'food_intake', label: 'Alimentación', options: ['0%', '25%', '50%', '75%', '100%'], icon: Utensils, color: 'text-orange-600', bg: 'bg-orange-50', hoverBorder: 'hover:border-orange-500', activeColor: 'text-orange-700' },
    { id: 'positioning', label: 'C. Postural', options: ['Dcha', 'Izda', 'Supino', 'Sedestación'], icon: ArrowRightLeft, color: 'text-violet-600', bg: 'bg-violet-50', hoverBorder: 'hover:border-violet-500', activeColor: 'text-violet-700' },
    { id: 'vomiting', label: 'Vómitos', options: ['Poco', 'Moderado', 'Abundante'], icon: Activity, color: 'text-rose-600', bg: 'bg-rose-50', hoverBorder: 'hover:border-rose-500', activeColor: 'text-rose-700' },
];

const ROLE_LABELS = {
    admin: 'Administrador',
    director: 'Director',
    nurse: 'Enfermería',
    doctor: 'Médico',
    aux: 'Auxiliar',
    social_worker: 'Trabajo Social',
    physiotherapist: 'Fisioterapia',
    occupational_therapist: 'Terapia Ocupacional'
};

export default function QuickCareRecord({ onBack, residents = [], initialResident = null, hideHeader = false }) {
    const [selectedResident, setSelectedResident] = useState(initialResident);
    const [searchTerm, setSearchTerm] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [successFeedback, setSuccessFeedback] = useState({});
    
    // State for TA inputs to avoid document.getElementById
    const [taSis, setTaSis] = useState('');
    const [taDia, setTaDia] = useState('');

    const { addToast } = useToast();
    const { user } = useAuth();

    const CATEGORIES = ALL_CATEGORIES.filter(cat => cat.allowedRoles.includes(user?.role));
    const [category, setCategory] = useState(() => {
        if (user?.role === 'aux') return 'care';
        if (CATEGORIES.length > 0) return CATEGORIES[0].id;
        return 'vitals';
    });

    const filteredResidents = residents.filter(r =>
        `${r.name} ${r.surname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.room_number.includes(searchTerm)
    ).slice(0, 5);

    const showSuccess = (id, value = true) => {
        setSuccessFeedback(prev => ({ ...prev, [id]: value }));
        setTimeout(() => {
            setSuccessFeedback(prev => {
                const newState = { ...prev };
                delete newState[id];
                return newState;
            });
        }, 2000);
    };

    const handleRecordVital = async (type, value) => {
        if (!selectedResident || !value) return;
        setSubmitting(true);
        try {
            await api.post(`/residents/${selectedResident.id}/vitals`, {
                vital_type: type,
                value: parseFloat(value)
            });
            addToast('Constante registrada', 'success');
            showSuccess(type);
            return true;
        } catch {
            addToast('Error al registrar', 'error');
            return false;
        } finally {
            setSubmitting(false);
        }
    };

    const handleRecordCare = async (type, value) => {
        if (!selectedResident) return;
        setSubmitting(true);
        try {
            await api.post(`/residents/${selectedResident.id}/care-logs`, {
                care_type: type,
                value: value
            });
            addToast('Cuidado registrado', 'success');
            showSuccess(type, value);
            return true;
        } catch {
            addToast('Error al registrar', 'error');
            return false;
        } finally {
            setSubmitting(false);
        }
    };

    if (CATEGORIES.length === 0) {
        return (
            <div className="bg-white rounded-[2rem] border-2 border-[#0F172A] shadow-sm overflow-hidden">
                <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-200">
                    <button 
                        type="button"
                        onClick={onBack} 
                        className="w-10 h-10 bg-[#0F172A] hover:bg-slate-800 text-white rounded-full flex items-center justify-center transition-all shadow-md shrink-0"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Registro Rápido</h2>
                </div>
                <div className="p-6 md:p-12 text-center space-y-6">
                    <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border-2 border-rose-100">
                        <Lock className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Acceso Restringido</h3>
                    <p className="text-slate-500 font-medium max-w-sm mx-auto">Su perfil profesional ({ROLE_LABELS[user?.role] || user?.role || 'No Asistencial'}) no tiene permisos para realizar registros clínicos en este módulo.</p>
                    <button 
                        onClick={onBack}
                        className="px-10 py-4 bg-[#0F172A] text-white rounded-2xl font-black uppercase tracking-wider hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl active:scale-95"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        );
    }

    if (!selectedResident) {
        return (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white rounded-[2rem] border-2 border-[#0F172A] shadow-sm overflow-hidden">
                    <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-200">
                        <button 
                            type="button"
                            onClick={onBack} 
                            className="w-10 h-10 bg-[#0F172A] hover:bg-slate-800 text-white rounded-full flex items-center justify-center transition-all shadow-md shrink-0"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Registro Rápido</h2>
                    </div>

                    <div className="p-6 md:p-8">
                        ) : (
                            <div className="max-w-md mx-auto space-y-6">
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Activity className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">Seleccione un Residente</h3>
                                <p className="text-sm text-slate-500">Busque por nombre o número de habitación para comenzar.</p>
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Activity className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-800 font-bold placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                                    placeholder="Nombre o Habitación..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2">
                                {filteredResidents.map(r => (
                                    <button
                                        key={r.id}
                                        onClick={() => setSelectedResident(r)}
                                        className="w-full flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 hover:bg-indigo-50/50 transition-all group shadow-sm hover:shadow-md"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-500 text-xs group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                                {r.room_number}
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-slate-800 uppercase tracking-tight">{r.name} {r.surname}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{r.status === 'hospitalized' ? 'Hospitalizado' : 'Presente'}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-all group-hover:translate-x-1" />
                                    </button>
                                ))}
                                </div>
                            </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden ${hideHeader ? 'min-h-fit' : 'min-h-[500px]'} w-full animate-in fade-in slide-in-from-bottom-4 duration-500`}>
            {/* UNIFIED HEADER - INFO SECTION */}
            {!hideHeader && (
                <div className="p-3 md:p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-6">
                    <div className="flex items-center gap-3 md:gap-5 w-full">
                        <button
                            onClick={onBack}
                            className="w-10 h-10 md:w-12 md:h-12 bg-[#0F172A] hover:bg-slate-800 text-white rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95 shrink-0"
                            title="Volver"
                        >
                            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                        <div className="flex flex-col">
                            <h2 className="text-lg md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                                {selectedResident.name} {selectedResident.surname}
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] md:text-sm font-black uppercase text-slate-800 bg-white border border-slate-200 px-2 md:px-3 py-1 rounded-lg shadow-sm">
                                    Hab. {selectedResident.room_number}
                                </span>
                                {selectedResident.status === 'hospitalized' && (
                                    <span className="text-[10px] md:text-sm font-black uppercase text-amber-700 bg-amber-50 border border-amber-200 px-2 md:px-3 py-1 rounded-lg flex items-center gap-1.5">
                                        <Lock className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                        Hospitalizado
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CATEGORY SELECTOR - SEPARATE ROW */}
            {selectedResident.status !== 'hospitalized' && (
                <div className="px-3 pb-3 md:px-8 md:pb-8 pt-3 md:pt-6 border-b border-slate-100 bg-slate-50/30">
                    <div className="flex justify-center gap-2 md:gap-4 p-1 md:p-2 bg-slate-200/50 rounded-[1.2rem] md:rounded-[2rem] w-full max-w-4xl mx-auto">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setCategory(cat.id)}
                                className={`flex-1 flex items-center justify-center gap-2 md:gap-3 px-3 md:px-6 py-2.5 md:py-4 rounded-[1rem] md:rounded-[1.5rem] font-black transition-all border-4 text-xs md:text-base ${category === cat.id
                                    ? `${cat.bg} ${cat.color} ${cat.borderColor} shadow-md scale-[1.01]`
                                    : 'text-slate-500 border-transparent hover:bg-white/60 hover:text-slate-700'
                                    }`}
                            >
                                <cat.icon className={`w-4 h-4 md:w-6 md:h-6 ${category === cat.id ? cat.color : 'text-slate-400'}`} strokeWidth={2.5} />
                                <span className="uppercase tracking-widest">{cat.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className={`p-3 md:p-10 ${selectedResident.status === 'hospitalized' ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                {category === 'vitals' ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                        {/* Blood Pressure Standardized Card - UNIFIED FONTS */}
                        <div className="col-span-2 md:col-span-1 lg:col-span-1 bg-white p-3 md:p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-rose-100/50 transition-all duration-300 group flex flex-col">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                                    <HeartPulse className="w-5 h-5 md:w-6 md:h-6" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm md:text-lg font-black text-rose-500 uppercase tracking-widest leading-none">TA (mmHg)</span>
                                    <span className="text-[10px] font-bold text-rose-500 opacity-50 uppercase mt-0.5">SIS / DIA</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3 mt-auto">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        placeholder="S"
                                        value={taSis}
                                        onChange={(e) => setTaSis(e.target.value)}
                                        className="w-full bg-slate-50 rounded-xl border-2 border-slate-100 focus:border-rose-400 focus:ring-2 focus:ring-rose-50 text-base md:text-xl font-black text-rose-900 px-2 py-3 text-center outline-none transition-all placeholder:text-slate-300"
                                    />
                                    <input
                                        type="number"
                                        placeholder="D"
                                        value={taDia}
                                        onChange={(e) => setTaDia(e.target.value)}
                                        className="w-full bg-slate-50 rounded-xl border-2 border-slate-100 focus:border-rose-400 focus:ring-2 focus:ring-rose-50 text-base md:text-xl font-black text-rose-900 px-2 py-3 text-center outline-none transition-all placeholder:text-slate-300"
                                    />
                                </div>
                            <div className="mt-auto pt-4">
                                <button
                                    onClick={async () => {
                                        if (!taSis || !taDia) {
                                            addToast('Faltan valores de TA', 'error');
                                            return;
                                        }
                                        
                                        setSubmitting(true);
                                        try {
                                            const now = new Date().toISOString();
                                            const batch = [
                                                { 
                                                    vital_type: 'ta_systolic', 
                                                    value: parseFloat(taSis),
                                                    measured_at: now
                                                },
                                                { 
                                                    vital_type: 'ta_diastolic', 
                                                    value: parseFloat(taDia),
                                                    measured_at: now
                                                }
                                            ];
                                            
                                            await api.post(`/residents/${selectedResident.id}/vitals/batch`, batch);
                                            addToast('Registros guardados', 'success');
                                            showSuccess('ta_systolic');
                                            setTaSis('');
                                            setTaDia('');
                                        } catch (err) {
                                            console.error("Error saving batch vitals:", err);
                                            addToast('Error al registrar TA', 'error');
                                        } finally {
                                            setSubmitting(false);
                                        }
                                    }}
                                    className={`w-full py-4 rounded-xl font-black transition-all active:scale-95 flex items-center justify-center shadow-lg hover:shadow-xl ${successFeedback['ta_systolic']
                                        ? 'bg-emerald-500 text-white shadow-emerald-200'
                                        : 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-200'
                                        }`}
                                    disabled={submitting}
                                >
                                    <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8" strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>
                    </div>
                        {VITAL_TYPES.map((vital) => (
                            <div key={vital.id} className="col-span-1 bg-white p-3 md:p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-10 h-10 rounded-2xl ${vital.bg} ${vital.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                                        <vital.icon className="w-5 h-5 md:w-6 md:h-6" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`text-sm md:text-lg font-black ${vital.color} opacity-80 uppercase tracking-wider leading-none`}>{vital.label}</span>
                                        <span className={`text-[10px] font-bold ${vital.color} opacity-50 uppercase mt-0.5`}>{vital.unit}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 mt-auto">
                                    {/* UNIFIED INPUT FONT SIZE: Text-base for mobile (same as Care buttons approx) */}
                                    <input
                                        type="number"
                                        step="any"
                                        placeholder="0.0"
                                        className={`w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-2 py-3 text-base md:text-xl font-black text-slate-800 outline-none focus:bg-white ${vital.focusBorder} focus:ring-4 focus:ring-slate-50 transition-all placeholder:text-slate-200 text-center`}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                handleRecordVital(vital.id, e.target.value).then(success => {
                                                    if (success) e.target.value = '';
                                                });
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={(e) => {
                                            const input = e.currentTarget.previousSibling;
                                            handleRecordVital(vital.id, input.value).then(success => {
                                                if (success) input.value = '';
                                            });
                                        }}
                                        className={`w-full py-4 rounded-xl font-black transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center shadow-lg ${successFeedback[vital.id]
                                            ? 'bg-emerald-500 text-white shadow-emerald-200'
                                            : `${vital.buttonBg} text-white hover:brightness-110 shadow-slate-200`
                                            }`}
                                        disabled={submitting}
                                    >
                                        <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8" strokeWidth={2.5} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {CARE_TYPES.map(care => (
                            <div key={care.id} className={`bg-white p-3 md:p-6 rounded-[2rem] border border-slate-100 shadow-sm group hover:shadow-xl transition-all duration-300 ${care.color.replace('text-', 'hover:shadow-').replace('600', '100')}/50`}>
                                <div className="flex items-center gap-4 mb-5">
                                    <div className={`p-3 ${care.bg} ${care.color} rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                                        <care.icon className="w-5 h-5 md:w-6 md:h-6" />
                                    </div>
                                    <span className={`text-sm md:text-lg font-black ${care.activeColor} uppercase tracking-wider`}>{care.label}</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {care.options.map(opt => {
                                        const isSuccess = successFeedback[care.id] === opt;
                                        return (
                                            <button
                                                key={opt}
                                                onClick={() => handleRecordCare(care.id, opt)}
                                                className={`py-3 px-3 rounded-2xl font-bold text-xs md:text-sm transition-all active:scale-95 disabled:opacity-50 border-2 flex items-center justify-center text-center leading-tight min-h-[50px] w-full ${isSuccess
                                                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl shadow-emerald-200 scale-105 z-10'
                                                    : `bg-slate-50 border-slate-100 text-slate-600 ${care.hoverBorder} hover:${care.bg} hover:${care.color} hover:shadow-md`
                                                    }`}
                                                disabled={submitting}
                                            >
                                                {isSuccess ? (
                                                    <span className="flex flex-col items-center justify-center gap-1 animate-in zoom-in duration-200">
                                                        <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4" />
                                                        <span className="text-[10px] font-black uppercase">Registrado</span>
                                                    </span>
                                                ) : opt}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
