import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
    User, FileText, Calendar, Clock, Phone,
    Syringe, Activity, Bed, Trash2, HeartPulse,
    Utensils, Droplet, Thermometer, Wind, Scale,
    ChevronLeft, Plus, X, ArrowUp, ArrowDown,
    MapPin, AlertCircle, ShieldAlert, PhoneCall,
    Pill, FileCheck, Users, Dumbbell,
    Brain, Stethoscope, ChevronRight,
    Search, Filter, Layers, RefreshCw, Heart, TrendingUp, RotateCw, RotateCcw, ArrowLeft, ArrowRightLeft, Edit2,
    History, Moon, Shield, BookOpen, UserMinus, Skull, AlertTriangle, ShieldCheck, Smile
} from 'lucide-react';

import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { resolveStaticUrl } from '../utils/url';
import GeneralFollowups from '../components/GeneralFollowups';
import ResidentFormExtended from '../components/ResidentFormExtended';
import QuickCareRecord from '../components/QuickCareRecord';
import DateRangeFilter from '../components/DateRangeFilter';
import { getResidentPhoto } from '../utils/residentUtils';

/**
 * Calcula la edad de un residente basándose en su fecha de nacimiento.
 * Sigue la lógica estándar de comparación de meses y días para precisión geriátrica.
 */
const calculateAge = (dateString) => {
    if (!dateString) return 0;
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

const safeParseDate = (dateString) => {
    if (!dateString) return new Date();
    try {
        let validString = dateString;
        if (typeof dateString === 'string' && !dateString.endsWith('Z') && !dateString.includes('+')) {
            validString += 'Z';
        }
        const date = parseISO(validString);
        return isNaN(date.getTime()) ? new Date() : date;
    } catch {
        return new Date();
    }
};

const translateCareType = (key) => {
    return TRANSLATIONS[key] || key.replace(/_/g, ' ');
};

/**
 * Diccionario de traducciones para el Patrón de Presentación.
 * Centraliza la conversión de claves de base de datos (inglés) a etiquetas legibles (español).
 * Incluye roles, estados clínicos, tipos de dieta, niveles de movilidad y dispositivos.
 */
const TRANSLATIONS = {
    // Movilidad y Estados
    'autonomous': 'Autónomo',
    'cane': 'Con bastón',
    'walker': 'Con andador',
    'wheelchair_manual': 'Silla de ruedas manual',
    'wheelchair_electric': 'Silla de ruedas eléctrica',
    'bedridden': 'Encamado',
    'independent': 'Independiente',
    'supervision': 'Supervisión',
    'partial_help': 'Ayuda Parcial',
    'total_help': 'Ayuda Total',
    
    // Dietas y Nutrición
    'normal': 'Basal',
    'diabetic': 'Diabética',
    'low_salt': 'Hiposódica',
    'astringent': 'Astringente',
    'protection': 'Protección Gástrica',
    'soft': 'Blanda / Fácil Masticación',
    'pureed': 'Triturada',
    
    // Incontinencia y Eliminación
    'esfuerzo': 'De Esfuerzo',
    'urgencia': 'De Urgencia',
    'rebosamiento': 'Por Rebosamiento',
    'funcional': 'Funcional',
    'refleja': 'Refleja',
    'anatomical': 'Anatómico',
    'anatomy': 'Anatómico',
    'elastic': 'Elástico',
    'pant': 'Bragapañal',
    
    // Deterioro y Escalas
    'none': 'Sin deterioro',
    'mild': 'Leve',
    'moderate': 'Moderado',
    'severe': 'Grave',
    'specialist': 'Especialista',
    'urgency': 'Urgencias',

    // Booleans y Genéricos
    'true': 'Sí',
    'false': 'No',
    'yes': 'Sí',
    'no': 'No',
    
    // Sujeciones
    'bed_rails': 'Barandillas',
    'waist_belt': 'Cinturón abdominal',
    'chest_vest': 'Chaleco torácico',
    'pelvic_strap': 'Cincha pélvica',
    'mittens': 'Manoplas',
    
    // Roles de Usuario
    'admin': 'Administrador / Dirección',
    'doctor': 'Médico',
    'nurse': 'Enfermería',
    'physiotherapist': 'Fisioterapia',
    'occupational_therapist': 'Terapia Ocupacional',
    'social_worker': 'Trabajo Social',
    'psychologist': 'Psicólogo',
    'nursing_assistant': 'Auxiliar / Gerocultor',
    'abdominal': 'Cinturón Abdominal',
    'pelvic': 'Cinturón Pélvico',
    'muñequeras': 'Muñequeras',
    'wrist': 'Muñequeras',
    'barandillas': 'Barandillas',
    'bars': 'Barandillas x2',
    
    // Cuidados y Evolutivos
    'hygiene': 'Higiene',
    'diaper': 'Cambio de Pañal',
    'fluid_intake': 'Ingesta Líquidos',
    'food_intake': 'Ingesta Comida',
    'positioning': 'Cambios Posturales',
    'vomiting': 'Vómitos',
    'stool': 'Deposición',
    'voiding': 'Micción',
    'fecal_incontinence': 'Incontinencia Fecal',
    'urinary_incontinence': 'Incontinencia Urinaria',
    'physical_restraint': 'Sujeción Física',
    'safety_sheet': 'Hoja de Seguridad',
    'first_impressions': 'Observaciones',
    'care_plan': 'Plan de Cuidados',
    
    // Estados de Residente
    'active': 'Activo',
    'hospitalized': 'Hospitalizado',
    'inactive': 'Baja Temporal',
    'deceased': 'Defunción',
    
    // Otros
    'yes': 'Sí',
    'no': 'No',
    'M': 'Masculino',
    'F': 'Femenino',
    'ss': 'Seguridad Social',
    'private': 'Privado',
};

const EDIT_TAB_MAP = {
    admin: 0, salud: 1, nutrition: 2, elimination: 3,
    mobility: 4, sleep: 5, cognitive: 6, self_perception: 7,
    social: 8, sexuality: 9, stress: 10, values: 11
};

const canEditSection = (sectionId, userRole) => {
    if (!userRole) return false;
    const role = userRole.toLowerCase().trim();
    if (['admin', 'doctor', 'nurse'].includes(role)) return true;
    
    // Aux can edit basic identification and some functional patterns
    if (role === 'aux') {
        const auxAllowed = ['admin', 'nutrition', 'elimination', 'mobility', 'sleep', 'values'];
        return auxAllowed.includes(sectionId);
    }
    
    // Technical roles (Social/Physio/Occupational/Psychologist) can only edit their specific sections
    if (role === 'social_worker') {
        return ['self_perception', 'social', 'values'].includes(sectionId);
    }
    if (role === 'psicologo' || role === 'psychologist') {
        return ['cognitive', 'self_perception'].includes(sectionId);
    }
    if (role === 'physiotherapist' && sectionId === 'mobility') return true;
    if (role === 'occupational_therapist' && sectionId === 'cognitive') return true;

    return false;
};

const t = (value) => {
    if (value === true) return 'Sí';
    if (value === false) return 'No';
    if (value === null || value === undefined || value === '') return '--';
    return TRANSLATIONS[value] || value;
};

function InfoRow({ label, value }) {
    const isBad = (v) => {
        if (v === null || v === undefined) return true;
        if (typeof v === 'string') {
            const clean = v.trim().toLowerCase();
            return clean === '' || clean === 'null' || clean === 'none' || clean === 'undefined';
        }
        return false;
    };

    return (
        <div className="flex justify-between border-b border-slate-100 py-2.5 last:border-0 hover:bg-slate-50/50 transition-colors px-1 rounded-lg">
            <span className="text-slate-500 font-medium text-sm">{label}</span>
            <span className="text-slate-900 font-bold text-right text-sm">{isBad(value) ? '--' : value}</span>
        </div>
    );
}


function HealthDetail({ groupedVitals, onRefresh, startDate, endDate, onStartChange, onEndChange }) {
    const vitalsTypes = [
        { id: 'blood_pressure', label: 'Tensión Arterial', icon: Activity, color: 'indigo', unit: 'mmHg' },
        { id: 'heart_rate', label: 'Frecuencia Cardíaca', icon: Heart, color: 'rose', unit: 'LPM' },
        { id: 'oxygen_saturation', label: 'Saturación O2', icon: Wind, color: 'blue', unit: '%' },
        { id: 'temperature', label: 'Temperatura', icon: Thermometer, color: 'orange', unit: '°C' },
        { id: 'blood_sugar', label: 'Glucemia', icon: Activity, color: 'emerald', unit: 'mg/dL' },
        { id: 'weight', label: 'Peso', icon: Scale, color: 'purple', unit: 'kg' }
    ];

    const allVitals = useMemo(() => {
        const raw = Object.entries(groupedVitals)
            .flatMap(([type, logs]) => logs);
        
        const result = [];
        const processedIds = new Set();
        
        raw.forEach(v => {
            if (processedIds.has(v.id)) return;
            
            if (v.vital_type === 'ta_systolic' || v.vital_type === 'ta_diastolic') {
                const otherType = v.vital_type === 'ta_systolic' ? 'ta_diastolic' : 'ta_systolic';
                const partner = raw.find(o => 
                    o.vital_type === otherType && 
                    Math.abs(safeParseDate(o.measured_at) - safeParseDate(v.measured_at)) < 60000 &&
                    !processedIds.has(o.id)
                );
                
                if (partner) {
                    const sis = v.vital_type === 'ta_systolic' ? v : partner;
                    const dia = v.vital_type === 'ta_systolic' ? partner : v;
                    result.push({
                        ...sis,
                        vital_type: 'blood_pressure',
                        value: `${Math.round(sis.value)}/${Math.round(dia.value)}`,
                        isGrouped: true,
                        partnerId: partner.id
                    });
                    processedIds.add(v.id);
                    processedIds.add(partner.id);
                } else {
                    result.push(v);
                    processedIds.add(v.id);
                }
            } else if (v.vital_type === 'spo2' || v.vital_type === 'oxygen_saturation') {
                result.push({ ...v, vital_type: 'oxygen_saturation' });
                processedIds.add(v.id);
            } else if (v.vital_type === 'glucose' || v.vital_type === 'blood_sugar') {
                result.push({ ...v, vital_type: 'blood_sugar' });
                processedIds.add(v.id);
            } else {
                result.push(v);
                processedIds.add(v.id);
            }
        });
        
        return result.sort((a, b) => safeParseDate(b.measured_at) - safeParseDate(a.measured_at));
    }, [groupedVitals]);

    const VitalCard = ({ type, icon: Icon, color, title, unit }) => {
        const filtered = allVitals.filter(v => v.vital_type === type);
        
        const colorClasses = {
            indigo: { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200', iconBg: 'bg-indigo-600 text-white', valueText: 'text-indigo-700' },
            rose: { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-200', iconBg: 'bg-rose-600 text-white', valueText: 'text-rose-700' },
            blue: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', iconBg: 'bg-blue-600 text-white', valueText: 'text-blue-700' },
            orange: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200', iconBg: 'bg-orange-600 text-white', valueText: 'text-orange-700' },
            emerald: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', iconBg: 'bg-emerald-600 text-white', valueText: 'text-emerald-700' },
            purple: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200', iconBg: 'bg-purple-600 text-white', valueText: 'text-purple-700' },
        };
        
        const cls = colorClasses[color] || colorClasses.indigo;

        return (
            <div className={`bg-white rounded-[2rem] border border-slate-100 shadow-sm flex flex-col h-auto min-h-[150px] max-h-[400px] md:max-h-[500px] overflow-hidden animate-in fade-in slide-in-from-bottom-4`}>
                <div className={`p-4 md:p-6 border-b ${cls.border} flex items-center justify-between gap-2 ${cls.bg}`}>
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className={`w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-xl md:rounded-2xl flex items-center justify-center ${cls.iconBg} shadow-sm`}>
                            <Icon size={18} />
                        </div>
                        <h3 className={`text-xs sm:text-sm md:text-base font-black ${cls.text} uppercase tracking-tight truncate`}>{title}</h3>
                    </div>
                    <span className={`shrink-0 text-[9px] md:text-[10px] font-black px-2 py-1 bg-white rounded-lg ${cls.text} border ${cls.border} uppercase shadow-sm`}>{unit}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {filtered.length > 0 ? (
                        filtered.map((log, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-slate-50/30 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-white transition-all group">
                                <div>
                                    <p className="text-[11px] font-bold text-slate-500 first-letter:uppercase">
                                        {formatDistanceToNow(safeParseDate(log.measured_at), { addSuffix: true, locale: es })}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-medium">
                                        {format(safeParseDate(log.measured_at), 'dd MMM HH:mm')}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className={`text-2xl font-black ${cls.valueText}`}>
                                        {typeof log.value === 'number' ? Math.round(log.value) : log.value}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-30 gap-3">
                            <Icon size={48} className="text-slate-300" />
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">Sin registros</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Grilla Principal de 3 Columnas para las constantes clave */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <VitalCard type="blood_pressure" title="Tensión Arterial" icon={Activity} color="indigo" unit="mmHg" />
                <VitalCard type="heart_rate" title="Frecuencia Cardíaca" icon={Heart} color="rose" unit="LPM" />
                <VitalCard type="oxygen_saturation" title="Saturación O2" icon={Wind} color="blue" unit="%" />
            </div>

            {/* Segunda fila para constantes adicionales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <VitalCard type="temperature" title="Temperatura" icon={Thermometer} color="orange" unit="°C" />
                <VitalCard type="blood_sugar" title="Glucemia" icon={Activity} color="emerald" unit="mg/dL" />
                <VitalCard type="weight" title="Peso" icon={Scale} color="purple" unit="kg" />
            </div>
        </div>
    );
}


function CareDetail({ groupedCare }) {
    const categories = useMemo(() => {
        const flat = Object.values(groupedCare).flat();
        const sorted = flat.sort((a, b) => safeParseDate(b.logged_at) - safeParseDate(a.logged_at));
        
        // Get unique care types in the logs to create specific cards
        const uniqueTypes = [...new Set(sorted.map(l => l.care_type))];
        
        // Define colors/icons for each type for consistent styling, ensuring distinct colors
        const typeStyles = {
            'hygiene': { icon: User, color: 'text-teal-800', bg: 'bg-teal-100', iconBg: 'bg-teal-600 text-white', border: 'border-teal-200' },
            'diaper': { icon: Droplet, color: 'text-fuchsia-800', bg: 'bg-fuchsia-100', iconBg: 'bg-fuchsia-600 text-white', border: 'border-fuchsia-200' },
            'fluid_intake': { icon: Droplet, color: 'text-cyan-800', bg: 'bg-cyan-100', iconBg: 'bg-cyan-600 text-white', border: 'border-cyan-200' },
            'food_intake': { icon: Utensils, color: 'text-emerald-800', bg: 'bg-emerald-100', iconBg: 'bg-emerald-600 text-white', border: 'border-emerald-200' },
            'positioning': { icon: ArrowRightLeft, color: 'text-violet-800', bg: 'bg-violet-100', iconBg: 'bg-violet-600 text-white', border: 'border-violet-200' },
            'vomiting': { icon: AlertTriangle, color: 'text-rose-800', bg: 'bg-rose-100', iconBg: 'bg-rose-600 text-white', border: 'border-rose-200' },
            'stool': { icon: Layers, color: 'text-amber-800', bg: 'bg-amber-100', iconBg: 'bg-amber-600 text-white', border: 'border-amber-200' },
            'voiding': { icon: Droplet, color: 'text-blue-800', bg: 'bg-blue-100', iconBg: 'bg-blue-600 text-white', border: 'border-blue-200' }
        };

        return uniqueTypes.map(type => ({
            id: type,
            label: translateCareType(type).toUpperCase(),
            style: typeStyles[type] || { icon: FileCheck, color: 'text-slate-600', bg: 'bg-slate-50' },
            logs: sorted.filter(l => l.care_type === type)
        }));
    }, [groupedCare]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {categories.length === 0 ? (
                <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 text-slate-300">
                    <FileText size={60} className="opacity-10 mb-4" />
                    <p className="text-sm font-black uppercase tracking-[0.2em] italic opacity-30">No hay registros para este periodo</p>
                </div>
            ) : (
                categories.map(cat => (
                    <div key={cat.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-auto min-h-[150px] max-h-[400px] md:max-h-[500px] hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
                        <div className={`p-4 md:p-6 border-b ${cat.style.border} ${cat.style.bg} flex items-center gap-3 md:gap-4 overflow-hidden`}>
                            <div className={`w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-2xl flex items-center justify-center ${cat.style.iconBg} shadow-sm`}>
                                <cat.style.icon size={20} className="md:w-6 md:h-6" />
                            </div>
                            <h3 className={`text-sm sm:text-base md:text-lg font-black ${cat.style.color} tracking-tight truncate`}>{cat.label}</h3>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {cat.logs.map((log) => (
                                <div key={log.id} className="group bg-slate-50/30 hover:bg-white p-4 rounded-[1.5rem] border border-transparent hover:border-slate-100 transition-all hover:shadow-lg hover:shadow-slate-100/50">
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">
                                                {formatDistanceToNow(safeParseDate(log.logged_at), { addSuffix: true, locale: es })}
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                {format(safeParseDate(log.logged_at), 'dd MMM HH:mm', { locale: es })}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            {/* Mostrar valor solo si aporta información extra (no es redundante con el título) */}
                                            {log.value && 
                                             translateCareType(log.value) !== translateCareType(log.care_type) && 
                                             log.value !== 'Registrado' && (
                                                <div className="bg-white border border-slate-200 px-4 py-1.5 rounded-xl shadow-sm text-[11px] font-black text-slate-900 uppercase tracking-tighter">
                                                    {translateCareType(log.value)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {log.notes && (
                                        <div className="mt-2 text-[9px] font-medium text-slate-500 italic bg-white/50 p-2 rounded-lg border border-slate-100/50">
                                            "{log.notes}"
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100/60">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white shadow-sm ring-2 ring-indigo-50">
                                                {(log.staff_name || 'U').charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-800 leading-none">
                                                    {log.staff_name || 'Sistema'}
                                                </span>
                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {log.staff_name ? 'Registrado por' : 'Automático'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

function LoadingScreen() {
    return (
        <DashboardLayout>
            <div className="h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        </DashboardLayout>
    );
}

function BioDetail({ resident }) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-500" /> Información de Estado
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">Situación actual de ocupación del residente.</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border-2 ${resident.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        resident.status === 'hospitalized' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            'bg-rose-50 text-rose-700 border-rose-100'
                        }`}>
                        {t(resident.status)}
                    </span>
                </div>
            </div>

            {resident.status !== 'active' && (
                <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoRow label="Estado Actual" value={t(resident.status)} />
                    <InfoRow label="Fecha de Efecto" value={resident.inactive_date ? new Date(resident.inactive_date).toLocaleDateString() : '--'} />
                    {resident.status === 'inactive' && (
                        <InfoRow label="Regreso Previsto" value={resident.return_date ? new Date(resident.return_date).toLocaleDateString() : '--'} />
                    )}
                    {resident.status === 'deceased' && (
                        <InfoRow label="Lugar de Fallecimiento" value={resident.death_place || '--'} />
                    )}
                    <div className="md:col-span-2">
                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">Motivo / Observaciones</p>
                        <p className="text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">{resident.inactive_reason || 'No se registraron observaciones.'}</p>
                    </div>
                </div>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200">
                <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-indigo-500" /> Datos Personales
                </h3>
                <div className="space-y-3">
                    <InfoRow label="Nombre Completo" value={`${resident.name} ${resident.surname}`} />
                    <InfoRow label="DNI/NIE" value={resident.dni_nie ? `${resident.dni_nie} (${t(resident.document_type) || 'DNI'})` : '--'} />
                    <InfoRow label="Edad" value={`${calculateAge(resident.date_of_birth)} años`} />
                    <InfoRow label="Fecha Nacimiento" value={resident.date_of_birth ? new Date(resident.date_of_birth).toLocaleDateString() : '--'} />
                    <InfoRow label="Género" value={t(resident.sex)} />
                    <InfoRow label="Nacionalidad" value={resident.nationality || '--'} />
                    <InfoRow label="Idioma Principal" value={resident.primary_language || '--'} />
                    <InfoRow label="Teléfono" value={resident.phone || '--'} />
                    <InfoRow label="Email" value={resident.email || '--'} />
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <h4 className="text-xs font-black text-rose-600 uppercase mb-3 tracking-widest flex items-center gap-2">
                            <PhoneCall className="w-3.5 h-3.5" /> Contacto de Emergencia (Familiar)
                        </h4>
                        <InfoRow label="Nombre" value={resident.emergency_contact || '--'} />
                        <InfoRow label="Teléfono" value={resident.emergency_phone || '--'} />
                    </div>

                    <div className="mt-4 pt-4 border-t border-rose-100 bg-rose-50/30 p-3 rounded-xl border border-dashed">
                        <h4 className="text-xs font-black text-rose-700 uppercase mb-3 tracking-widest flex items-center gap-2">
                            <ShieldAlert className="w-3.5 h-3.5" /> Urgencias Médicas (Auto)
                        </h4>
                        {resident.health_center_type === 'ss' ? (
                            <>
                                <InfoRow label="PAC / Urgencias" value={resident.health_center_phone_emergency || 'Llamar 112'} />
                                <div className="flex justify-between py-2 px-1">
                                    <span className="text-slate-500 font-medium text-sm">Emergencias</span>
                                    <span className="text-rose-700 font-black text-right text-sm px-2 py-0.5 bg-rose-100 rounded">112</span>
                                </div>
                            </>
                        ) : (
                            <InfoRow label="Mutua / Privado" value={resident.private_health_phone || '--'} />
                        )}
                        <p className="text-[10px] text-slate-500 mt-2 italic">* Número asignado automáticamente según cobertura.</p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200">
                <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-indigo-500" /> Ubicación y Residencia
                </h3>
                <div className="space-y-3">
                    <InfoRow label="Habitación" value={resident.room_number || 'No asignada'} />
                    <InfoRow label="Fecha Ingreso" value={resident.admission_date ? `${new Date(resident.admission_date).toLocaleDateString()} ${resident.admission_time || ''}` : '--'} />
                    <InfoRow label="Dirección" value={`${resident.address || ''} ${resident.municipality || ''} ${resident.postal_code || ''}`.trim() || '--'} />
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200">
                <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-500" /> Otros Familiares y Contactos
                </h3>
                <div className="space-y-3">
                    {resident.family_contacts && resident.family_contacts.length > 0 ? (
                        resident.family_contacts.map((contact, idx) => (
                            <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 transition-colors group">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{contact.name}</p>
                                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-wider">{contact.relation || 'Familiar'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-slate-700">{contact.phone || '--'}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-6">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                <User className="w-6 h-6 text-slate-300" />
                            </div>
                            <p className="text-slate-400 text-sm italic">No hay otros familiares registrados.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

    </div>
    );
}

function InfoRowDark({ label, value }) {
    return (
    <div className="flex justify-between border-b border-slate-800 pb-3 last:border-0">
        <span className="text-slate-500 font-medium">{label}</span>
        <span className="text-white font-bold text-right">{value}</span>
    </div>
    );
}

function MedicalDetail({ resident }) {
    return (
        <div className="space-y-8">
            {(resident.has_medication_allergy || resident.has_food_allergy || resident.has_material_allergy || resident.has_food_intolerance) && (
                <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100">
                    <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2 text-rose-700">
                        <ShieldAlert className="w-5 h-5 text-rose-500" /> Alergias e Intolerancias
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {resident.has_medication_allergy && (
                            <div className="p-3 bg-white rounded-xl border border-rose-100 shadow-sm">
                                <p className="text-xs font-bold text-rose-700 uppercase mb-1">Medicamentos</p>
                                <p className="text-rose-900 font-medium">{resident.allergy_medication_detail || 'Especificado en valoración'}</p>
                            </div>
                        )}
                        {resident.has_food_allergy && (
                            <div className="p-3 bg-white rounded-xl border border-rose-100 shadow-sm">
                                <p className="text-xs font-bold text-rose-700 uppercase mb-1">Alimentarias</p>
                                <p className="text-rose-900 font-medium">{resident.allergy_food_detail || 'Especificado en valoración'}</p>
                            </div>
                        )}
                        {resident.has_material_allergy && (
                            <div className="p-3 bg-white rounded-xl border border-rose-100 shadow-sm">
                                <p className="text-xs font-bold text-rose-700 uppercase mb-1">Materiales / Otros</p>
                                <p className="text-rose-900 font-medium">{resident.allergy_material_detail || 'Especificado en valoración'}</p>
                            </div>
                        )}
                        {resident.has_food_intolerance && (
                            <div className="p-3 bg-white rounded-xl border border-amber-100 shadow-sm">
                                <p className="text-xs font-bold text-amber-700 uppercase mb-1">Intolerancias</p>
                                <p className="text-amber-900 font-medium">{resident.intolerance_food_detail || 'Especificado en valoración'}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                    <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                        <Stethoscope className="w-5 h-5 text-indigo-500" /> Diagnósticos
                    </h3>
                    <div className="space-y-2">
                        {[
                            { key: 'diagnosis_hypertension', label: 'Hipertensión Arterial', detail: resident.diagnosis_hypertension_detail },
                            { key: 'diagnosis_diabetes', label: 'Diabetes', detail: resident.diagnosis_diabetes_type === 'type1' ? 'Tipo 1' : resident.diagnosis_diabetes_type === 'type2' ? 'Tipo 2' : null },
                            { key: 'diagnosis_copd', label: 'EPOC' },
                            { key: 'diagnosis_alzheimer', label: 'Alzheimer / Demencia' },
                            { key: 'diagnosis_parkinson', label: 'Parkinson' },
                            { key: 'diagnosis_stroke', label: 'Ictus / ACV' },
                            { key: 'diagnosis_cardiopathy', label: 'Cardiopatía' },
                            { key: 'diagnosis_renal_failure', label: 'Insuficiencia Renal' },
                            { key: 'diagnosis_osteoporosis', label: 'Osteoporosis' },
                            { key: 'diagnosis_arthritis', label: 'Artritis / Artrosis' },
                            { key: 'diagnosis_cancer', label: 'Cáncer', detail: resident.diagnosis_cancer_type },
                        ].filter(d => resident[d.key]).map((diag, i) => (
                            <div key={i} className="flex flex-col p-3 bg-slate-50 rounded-xl border border-slate-100 shadow-sm group hover:border-indigo-100 transition-colors">
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></span>
                                    <span className="text-sm font-bold text-slate-700">{diag.label}</span>
                                </div>
                                {diag.detail && (
                                    <span className="text-[10px] text-indigo-600 font-bold uppercase ml-3.5 mt-1 bg-white px-2 py-0.5 rounded-md border border-indigo-50 w-fit">
                                        {diag.detail}
                                    </span>
                                )}
                            </div>
                        ))}
                        {!Object.keys(resident).some(k => k.startsWith('diagnosis_') && resident[k] === true) && (
                            <p className="text-slate-400 italic text-sm text-center py-4">Sin diagnósticos registrados</p>
                        )}
                    </div>
                </div>

                {/* Clinical History Sections */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-8">
                    {/* Section: Pathologies */}
                    <div>
                        <h3 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2">
                            <History className="w-5 h-5 text-indigo-500" /> Otras Patologías
                        </h3>
                        <div className="space-y-3">
                            {resident.other_diseases && (
                                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap">
                                    {resident.other_diseases}
                                </p>
                            )}
                            
                            {/* Legacy Diseases */}
                            {Array.isArray(resident.medical_history) && resident.medical_history.filter(m => m.type !== 'surgery').length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {resident.medical_history.filter(m => m.type !== 'surgery').map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] border bg-blue-50 border-blue-200 text-blue-700">
                                            <span className="font-bold">{item.name}</span>
                                            {item.year && <span className="opacity-75 text-[10px]">({item.year})</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {!resident.other_diseases && (!Array.isArray(resident.medical_history) || resident.medical_history.filter(m => m.type !== 'surgery').length === 0) && (
                                <p className="text-slate-400 text-sm italic">Sin patologías adicionales registradas.</p>
                            )}
                        </div>
                    </div>

                    {/* Section: Surgeries */}
                    <div>
                        <h3 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2">
                            <History className="w-5 h-5 text-purple-500" /> Antecedentes Quirúrgicos
                        </h3>
                        <div className="space-y-3">
                            {resident.surgical_history && (
                                <p className="text-sm text-slate-700 bg-purple-50 p-3 rounded-xl border border-purple-100 whitespace-pre-wrap">
                                    {resident.surgical_history}
                                </p>
                            )}
                            
                            {/* Legacy Surgeries */}
                            {Array.isArray(resident.medical_history) && resident.medical_history.filter(m => m.type === 'surgery').length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {resident.medical_history.filter(m => m.type === 'surgery').map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] border bg-purple-50 border-purple-200 text-purple-700">
                                            <span className="font-bold">{item.name}</span>
                                            {item.year && <span className="opacity-75 text-[10px]">({item.year})</span>}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!resident.surgical_history && (!Array.isArray(resident.medical_history) || resident.medical_history.filter(m => m.type === 'surgery').length === 0) && (
                                <p className="text-slate-400 text-sm italic">Sin intervenciones quirúrgicas registradas.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>



            {/* Vaccination Integrated List */}
            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm">
                <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                    <Syringe className="w-5 h-5 text-emerald-600" /> Registro de Vacunación
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <VaccineCard
                        label="Gripe"
                        date={resident.vaccine_flu_last}
                        batch={resident.vaccine_flu_batch}
                        icon={Wind}
                        color="teal"
                    />
                    <VaccineCard
                        label="Neumococo"
                        date={resident.vaccine_pneumococcal_last}
                        batch={resident.vaccine_pneumococcal_batch}
                        icon={Activity}
                        color="blue"
                    />
                    <VaccineCard
                        label="Tétanos"
                        date={resident.vaccine_tetanus_last}
                        batch={resident.vaccine_tetanus_batch}
                        icon={Shield}
                        color="orange"
                    />
                    <VaccineCard
                        label="COVID-19"
                        date={resident.vaccine_covid_last}
                        batch={resident.vaccine_covid_batch}
                        icon={Activity}
                        color="purple"
                    />
                </div>
                {!resident.vaccine_flu_last && !resident.vaccine_pneumococcal_last && 
                 !resident.vaccine_tetanus_last && !resident.vaccine_covid_last && (
                    <p className="text-emerald-600 text-sm italic text-center py-4">No hay vacunas registradas.</p>
                )}
            </div>

            {/* Profesionales y Centros de Referencia */}
            <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 shadow-sm mt-6">
                <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" /> Profesionales y Centros de Referencia
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <InfoRow label="Centro Salud" value={resident.health_center || '--'} />
                        <InfoRow label="Tipo Centro" value={t(resident.health_center_type)} />
                        {resident.health_center_phone && <InfoRow label="Teléfono Centro" value={resident.health_center_phone} />}
                        {resident.health_center_phone_emergency && <InfoRow label="Urgencias Centro" value={resident.health_center_phone_emergency} />}
                    </div>
                    <div className="space-y-3">
                        <InfoRow label="Médico Referencia" value={resident.primary_doctor || '--'} />
                        <InfoRow label="Hospital Referencia" value={resident.reference_hospital || '--'} />
                        {resident.private_health_phone && <InfoRow label="Seguro Privado" value={resident.private_health_phone} />}
                        <InfoRow label="Última Visita Hosp." value={resident.last_hospital_visit ? `${new Date(resident.last_hospital_visit).toLocaleDateString()} (${t(resident.last_hospital_visit_type) || ''})` : '--'} />
                    </div>
                </div>
            </div>


        </div>
    );
};


function VaccineCard({ label, date, batch, icon: Icon, color }) {
    if (!date && !batch) return null;

    const colors = {
        teal: 'bg-teal-50 border-teal-200 text-teal-800',
        blue: 'bg-blue-50 border-blue-200 text-blue-800',
        orange: 'bg-orange-50 border-orange-200 text-orange-800',
        purple: 'bg-purple-50 border-purple-200 text-purple-800'
    };

    return (
        <div className={`p-4 rounded-2xl border ${colors[color] || 'bg-white'} shadow-sm transition-all hover:shadow-md`}>
            <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-white/50">
                    <Icon className="w-4 h-4 opacity-70" />
                </div>
                <span className="font-bold text-sm uppercase tracking-tight">{label}</span>
            </div>
            <div className="space-y-1">
                <p className="text-xs font-medium">Fecha: <span className="font-bold">{date ? new Date(date).toLocaleDateString() : '--'}</span></p>
                {batch && <p className="text-xs font-medium">Lote: <span className="font-mono bg-white/50 px-1 rounded">{batch}</span></p>}
            </div>
        </div>
    );
};

function EliminationDetail({ resident }) {
    return (
        <div className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                    <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                        <Droplet className="w-5 h-5 text-amber-500" /> Eliminación Urinaria
                    </h3>
                    <div className="space-y-3">
                        <InfoRow label="Incontinencia" value={t(resident.urinary_incontinence)} />
                        {resident.urinary_incontinence && (
                            <InfoRow label="Tipo" value={t(resident.incontinence_type)} />
                        )}
                        
                        {/* Only show devices/extra if active/true */}
                        {resident.night_incontinence && (
                            <InfoRow label="Incontinencia Nocturna" value="Sí" />
                        )}
                        {resident.device_catheter && (
                            <div className="mt-2 pt-2 border-t border-amber-200/50">
                                <InfoRow label="Sonda Vesical" value="Sí" />
                                {resident.device_invasive_type && (
                                    <p className="text-[10px] text-amber-700 font-bold uppercase mt-1 ml-auto text-right italic">
                                        {resident.device_invasive_type}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                    <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                        <Wind className="w-5 h-5 text-amber-600" /> Eliminación Fecal
                    </h3>
                    <div className="space-y-3">
                        <InfoRow label="Incontinencia" value={t(resident.fecal_incontinence)} />
                        {resident.fecal_incontinence && (
                            <div className="mt-2 pt-2 border-t border-amber-200/50">
                                <p className="text-[10px] font-black text-amber-800 uppercase mb-2">Notas / Observaciones</p>
                                <p className="text-sm text-slate-700 bg-white/50 p-3 rounded-xl border border-amber-100 italic leading-relaxed">
                                    {resident.fecal_incontinence_notes || 'Sin observaciones registradas'}
                                </p>
                            </div>
                        )}
                        {resident.device_peg && (
                            <div className="mt-2 pt-2 border-t border-amber-200/50">
                                <InfoRow label="Ostomía (PEG/Estoma)" value="Sí" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                    <Droplet className="w-5 h-5 text-amber-600 opacity-70" /> Pañales y Absorbentes
                </h3>
                <div className="space-y-3">
                    <InfoRow label="Uso de Pañales" value={t(resident.diaper_use)} />
                    {resident.diaper_use && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                            <InfoRow label="Tipo" value={
                                resident.diaper_type === 'anatomical' || resident.diaper_type === 'anatomy' ? 'Anatómico' :
                                    resident.diaper_type === 'pant' ? 'Bragapañal' :
                                        resident.diaper_type === 'elastic' ? 'Elástico' : resident.diaper_type || '--'
                            } />
                            <InfoRow label="Talla" value={resident.diaper_size || '--'} />
                            <InfoRow label="Cambios / Día" value={resident.diaper_changes_per_day || '--'} />
                        </div>
                    )}
                    <div className="mt-4 pt-4 border-t border-amber-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InfoRow label="Autonomía Baño" value={t(resident.bath_autonomy) || '--'} />
                        <InfoRow label="Frecuencia Baño" value={resident.bath_frequency ? `${resident.bath_frequency} veces/semana` : '--'} />
                    </div>
                </div>
            </div>

        </div>
    );
};

function SelfPerceptionDetail({ resident }) {
    return (
    <div className="space-y-6">

        <div className="bg-pink-50 p-6 rounded-2xl border border-pink-100">
            <div className="space-y-6">
                {resident.emotional_state && (
                    <div>
                        <h4 className="font-bold text-pink-800 text-sm mb-2 uppercase tracking-wider">Estado Emocional</h4>
                        <p className="text-slate-600 leading-relaxed bg-white/50 p-4 rounded-xl border border-pink-100">
                            {resident.emotional_state || 'No se ha registrado el estado emocional.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    </div>
    );
}

function SexualityDetail({ resident }) {
    return (
    <div className="space-y-6">

        <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100">
            <div className="space-y-4">
                <p className="text-slate-600 text-sm leading-relaxed">
                    Este patrón valora la satisfacción o alteraciones en la sexualidad y etapas reproductivas.
                </p>
                {resident.sexuality_observations ? (
                    <div className="bg-white/80 p-4 rounded-xl border border-rose-100">
                        <p className="text-xs font-black text-rose-700 uppercase mb-2 tracking-widest">Observaciones</p>
                        <p className="text-slate-700 italic">"{resident.sexuality_observations}"</p>
                    </div>
                ) : (
                    <div className="text-center p-6 bg-white/40 rounded-xl border border-dashed border-rose-200 text-slate-400 text-sm">
                        No se han registrado observaciones específicas en este patrón.
                    </div>
                )}
            </div>
        </div>
    </div>
    );
}

function StressDetail({ resident }) {
    return (
        <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
            <h4 className="font-bold text-orange-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" /> Sujeciones y Conductas
            </h4>
            <div className="space-y-3">
                <InfoRow label="Requiere Sujeción" value={t(resident.requires_restraint)} />
                {resident.requires_restraint && (
                    <>
                        {resident.restraint_type && <InfoRow label="Tipo de Sujeción" value={t(resident.restraint_type)} />}
                        {resident.restraint_schedule && <InfoRow label="Horario / Pauta" value={resident.restraint_schedule} />}
                        {resident.restraint_justification && (
                            <div className="mt-3">
                                <p className="text-xs font-bold text-orange-700 mb-1">JUSTIFICACIÓN MÉDICA:</p>
                                <p className="text-slate-700 text-sm bg-white p-3 rounded-xl border border-orange-100">{resident.restraint_justification}</p>
                            </div>
                        )}
                        {resident.restraint_authorization_date && (
                            <InfoRow label="Fecha Autorización" value={new Date(resident.restraint_authorization_date).toLocaleDateString()} />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function ValuesDetail({ resident }) {
    return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h4 className="font-black text-slate-900 mb-4 uppercase tracking-widest text-xs flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-slate-500" /> Plan de Cuidados
                </h4>
                {resident.care_plan ? (
                    <p className="text-slate-700 whitespace-pre-wrap bg-white p-4 rounded-xl border border-slate-100 leading-relaxed italic text-sm">
                        {resident.care_plan}
                    </p>
                ) : (
                    <p className="text-slate-400 italic text-sm">No hay un plan de cuidados registrado.</p>
                )}
            </div>

            <div className="bg-teal-50 p-6 rounded-2xl border border-teal-100">
                <h4 className="font-black text-teal-900 mb-4 uppercase tracking-widest text-xs flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-teal-500" /> Observaciones
                </h4>
                {resident.first_impressions ? (
                    <p className="text-slate-700 whitespace-pre-wrap bg-white p-4 rounded-xl border border-teal-100 leading-relaxed text-sm">
                        {resident.first_impressions}
                    </p>
                ) : (
                    <p className="text-slate-400 italic text-sm">Sin observaciones registradas.</p>
                )}
            </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-100 mt-4">
            <h4 className="font-bold text-slate-400 text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2">
                <Smile className="w-3 h-3" /> Valores y Creencias
            </h4>
            <p className="text-slate-500 text-sm italic">Este apartado permite valorar la esfera espiritual y ética del residente.</p>
        </div>
    </div>
    );
}
function PhysioDetail({ resident }) {
    const hasDevices = resident.device_dentures || resident.device_glasses || resident.device_hearing_aids ||
        resident.device_oxygen || resident.device_nasogastric || resident.device_catheter ||
        resident.device_peg || resident.device_tracheostomy || resident.device_veis;

    const hasTherapies = resident.receives_physiotherapy || resident.receives_occupational_therapy ||
        resident.receives_speech_therapy || resident.receives_psychology ||
        resident.receives_respiratory_therapy;

    const hasWoundCare = resident.has_pressure_ulcers || resident.has_surgical_wounds ||
        resident.requires_positioning || resident.requires_diabetic_foot_care;

    return (
        <div className="space-y-6">

            {/* Mobility */}
            <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 shadow-sm">
                <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                    <Dumbbell className="w-5 h-5 text-purple-500" /> Movilidad y Desplazamiento
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <InfoRow label="Nivel de Movilidad" value={t(resident.mobility_level) || 'Autónomo'} />
                    </div>
                    <div className="space-y-3">
                        <InfoRow
                            label="Riesgo UPP (Norton)"
                            value={
                                resident.norton_score ? (
                                    <span className={`px-3 py-1 rounded-full font-black text-xs border ${resident.norton_score <= 12 ? 'bg-rose-100 text-rose-800 border-rose-200' :
                                        resident.norton_score <= 14 ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                            'bg-emerald-100 text-emerald-800 border-emerald-200'
                                        }`}>
                                        {resident.norton_score} - {resident.norton_score <= 12 ? 'Alto Riesgo' : resident.norton_score <= 14 ? 'Riesgo Medio' : 'Bajo Riesgo'}
                                    </span>
                                ) : 'Sin valorar'
                            }
                        />
                        {resident.braden_score && (
                            <InfoRow
                                label="Braden Score"
                                value={<span className="font-bold text-slate-700">{resident.braden_score}</span>}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Technical Aids & Sensory */}
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
                <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                    <Pill className="w-5 h-5 text-blue-500" /> Ayudas Técnicas y Sensoriales
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Glasses */}
                    <div className={`p-4 rounded-xl border flex flex-col gap-2 ${resident.device_glasses ? 'bg-white border-blue-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-50'}`}>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase text-slate-400">Visión</span>
                            {resident.device_glasses ? <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">Gafas</span> : <span className="text-[10px] text-slate-400">Normal</span>}
                        </div>
                        {/* No additional vision fields currently in form */}
                    </div>

                    {/* Hearing */}
                    <div className={`p-4 rounded-xl border flex flex-col gap-2 ${resident.device_hearing_aids ? 'bg-white border-blue-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-50'}`}>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase text-slate-400">Audición</span>
                            {resident.device_hearing_aids ? <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold">Audífonos</span> : <span className="text-[10px] text-slate-400">Normal</span>}
                        </div>
                        {resident.device_hearing_aids && (
                            <div className="text-xs space-y-1">
                                <p className="font-bold text-slate-700">Lado: <span className="text-indigo-600">{t(resident.device_hearing_aids_side)}</span></p>
                                {resident.device_hearing_aids_brand && <p className="text-slate-500">Marca: {resident.device_hearing_aids_brand}</p>}
                            </div>
                        )}
                    </div>

                    {/* Oxygen */}
                    <div className={`p-4 rounded-xl border flex flex-col gap-2 ${resident.device_oxygen ? 'bg-white border-blue-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-50'}`}>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase text-slate-400">Respiratorio</span>
                            {resident.device_oxygen ? <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">O2</span> : <span className="text-[10px] text-slate-400">Normal</span>}
                        </div>
                        {resident.device_oxygen && (
                            <div className="text-xs space-y-1">
                                <p className="font-bold text-slate-700">Flujo: <span className="text-emerald-600">{resident.device_oxygen_flow} L/min</span></p>
                                <p className="text-slate-500">{t(resident.device_oxygen_type)} ({resident.device_oxygen_hours}h/día)</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Invasive Devices & Wounds */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 shadow-sm">
                    <h3 className="font-bold text-rose-900 mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5" /> Dispositivos Invasivos
                    </h3>
                    <div className="space-y-3">
                        <InfoRow label="PEG / Gastrostomía" value={t(resident.device_peg)} />
                        <InfoRow label="Sonda Nasogástrica" value={t(resident.device_nasogastric)} />
                        <InfoRow label="Traqueostomía" value={t(resident.device_tracheostomy)} />
                        <InfoRow label="VEIS (Subcutánea)" value={t(resident.device_veis)} />
                        {resident.device_invasive_change_date && (
                            <div className="mt-3 p-3 bg-white rounded-xl border border-rose-200">
                                <p className="text-[10px] font-black text-rose-800 uppercase mb-1">Próximo Cambio / Revisión</p>
                                <p className="text-sm font-bold text-slate-700">{new Date(resident.device_invasive_change_date).toLocaleDateString()}</p>
                                {resident.device_invasive_type && <p className="text-xs text-slate-500 mt-1">{resident.device_invasive_type}</p>}
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 shadow-sm">
                    <h3 className="font-bold text-orange-900 mb-4 flex items-center gap-2">
                        <User className="w-5 h-5" /> Cuidados de Integridad
                    </h3>
                    <div className="space-y-3">
                        {resident.has_pressure_ulcers && (
                            <div className="p-3 bg-white rounded-xl border border-orange-200 mb-3">
                                <p className="text-xs font-black text-rose-600 uppercase mb-1">Úlcera Activa</p>
                                <p className="text-sm font-bold text-slate-800">Grado {resident.upp_grade || '?'}</p>
                            </div>
                        )}
                        
                        {/* Integrated Wounds Array */}
                        {resident.wounds && resident.wounds.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-orange-200">
                                <p className="text-xs font-black text-slate-400 uppercase mb-3">Registro de Heridas</p>
                                <div className="grid gap-2">
                                    {resident.wounds.map((wound, idx) => (
                                        <div key={wound.id || idx} className="p-3 bg-white rounded-xl border border-rose-100 shadow-sm">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-bold text-slate-800 text-sm">{wound.location}</span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${wound.type === 'upp' ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                                                    {wound.type === 'upp' ? `UPP G${wound.grade || '?'}` : wound.type}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500">{wound.cure_type} · {wound.frequency}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Therapies */}
            {hasTherapies && (
                <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm">
                    <h3 className="font-bold text-emerald-900 mb-4 flex items-center gap-2">
                        <Heart className="w-5 h-5" /> Programas de Rehabilitación
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {resident.receives_physiotherapy && <span className="px-4 py-2 bg-white border border-emerald-200 text-emerald-700 rounded-xl text-xs font-black uppercase tracking-tight">Fisioterapia</span>}
                        {resident.receives_occupational_therapy && <span className="px-4 py-2 bg-white border border-cyan-200 text-cyan-700 rounded-xl text-xs font-black uppercase tracking-tight">Terapia Ocupacional</span>}
                        {resident.receives_speech_therapy && <span className="px-4 py-2 bg-white border border-indigo-200 text-indigo-700 rounded-xl text-xs font-black uppercase tracking-tight">Logopedia</span>}
                        {resident.receives_psychology && <span className="px-4 py-2 bg-white border border-pink-200 text-pink-700 rounded-xl text-xs font-black uppercase tracking-tight">Psicología</span>}
                        {resident.receives_respiratory_therapy && <span className="px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-xl text-xs font-black uppercase tracking-tight">Terapia Respiratoria</span>}
                    </div>
                </div>
            )}
        </div>
    );
};

function SocialDetail({ resident }) {
    return (
    <div className="space-y-8 relative">

        <div className="bg-teal-50 p-6 rounded-2xl border border-teal-100">
            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-500" /> Social y Familiar
            </h3>
            <div className="space-y-6">
                <div>
                    <p className="text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">Situación Familiar</p>
                    <p className="text-slate-600 text-sm leading-relaxed">{resident.family_situation || 'No hay descripción de la situación familiar.'}</p>
                </div>

                {/* Eliminado 'social_support_network' por no registrarse en formulario */}

                {(resident.family_contacts && resident.family_contacts.length > 0) ? (
                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Otros Contactos</p>
                        {resident.family_contacts.map((contact, i) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm border border-slate-200">
                                <div>
                                    <p className="font-bold text-slate-800">{contact.name}</p>
                                    <p className="text-xs text-slate-500">{contact.relation}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-mono font-medium text-slate-600 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm select-all">
                                        {contact.phone}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-4 bg-slate-50 rounded-xl text-slate-400 text-sm">Sin contactos adicionales registrados</div>
                )}
            </div>
        </div>

    </div>
    );
}

function DocsDetail({ resident }) {
    return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-slate-600" /> Documentación Legal
            </h3>
            <InfoRow label="DNI/NIE" value={resident.dni_nie || resident.id_card || '--'} />
            <InfoRow label="Nº Seg. Social" value={resident.ss_number || '--'} />
            <InfoRow label="Fecha Ingreso" value={resident.admission_date ? new Date(resident.admission_date).toLocaleDateString() : '--'} />
        </div>

        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 border-dashed flex flex-col items-center justify-center text-center">
            <FileText className="w-12 h-12 text-slate-300 mb-3" />
            <h4 className="font-bold text-slate-600">Archivo Digital</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Aquí aparecerán los PDFs escaneados (DNI, Tarjeta Sanitaria, Informes externos).</p>
            <Button variant="outline" className="mt-4" size="sm">Subir Documento</Button>
        </div>
    </div>
    );
}

// --- PATTERN DETAIL COMPONENTS ---

function NutritionDetail({ resident }) {
    const hasSupplements = resident.supplement_hchp || resident.supplement_diabetes ||
        resident.supplement_renal || resident.supplement_fiber;

    return (
        <div className="space-y-10">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50 p-6 rounded-2xl border border-green-100 shadow-sm">
                    <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                        <Utensils className="w-5 h-5 text-green-500" /> Dieta y Texturas
                    </h3>
                    <div className="space-y-3">
                        <InfoRow
                            label="Tipo de Dieta"
                            value={(
                                [
                                    resident.diet_normal && 'Basal',
                                    resident.diet_diabetic && 'Diabética',
                                    resident.diet_low_salt && 'Hiposódica',
                                    resident.diet_astringent && 'Astringente',
                                    resident.diet_protection && 'Protección Gástrica'
                                ].filter(Boolean).join(', ') || 'Sin pauta específica'
                            )}
                        />
                        <InfoRow
                            label="Textura Comida"
                            value={
                                resident.diet_liquid ? 'Líquida (Estricta)' :
                                resident.diet_pureed ? 'Triturada' :
                                resident.diet_soft ? 'Fácil Masticación' :
                                'Normal'
                            }
                        />
                        <InfoRow
                            label="Viscosidad Bebida"
                            value={resident.diet_texture || 'Líquida'}
                        />
                        <InfoRow label="Disfagia" value={t(resident.dysphagia)} />
                        {resident.dysphagia && (
                            <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                                {resident.dysphagia_grade && (
                                    <InfoRow label="Grado" value={`Nivel ${resident.dysphagia_grade}`} />
                                )}
                                {resident.thickener_instructions && (
                                    <div className="mt-2">
                                        <p className="text-xs font-semibold text-green-800 uppercase mb-1">Espesante</p>
                                        <p className="text-green-900 font-medium bg-white p-2 rounded border border-green-100">{resident.thickener_instructions}</p>
                                    </div>
                                )}
                            </div>
                        )}
                        <InfoRow
                            label="Alergias Alimentarias"
                            value={resident.has_food_allergy ? (
                                <span className="text-rose-600 font-bold"> Sí {resident.allergy_food_detail ? `(${resident.allergy_food_detail})` : ''}</span>
                            ) : t(false)}
                        />
                    </div>
                </div>

                <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm">
                    <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                        <Scale className="w-5 h-5 text-emerald-500" /> Antropometría y Salud Bucal
                    </h3>
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center mb-6">
                        <div className="p-2 md:p-3 bg-white rounded-xl shadow-sm border border-slate-200">
                            <p className="text-[9px] md:text-xs text-slate-500 uppercase font-bold">Peso</p>
                            <p className="text-sm md:text-xl font-black text-slate-800">{resident.weight || '--'} <span className="text-[10px] md:text-xs font-normal">kg</span></p>
                        </div>
                        <div className="p-2 md:p-3 bg-white rounded-xl shadow-sm border border-slate-200">
                            <p className="text-[9px] md:text-xs text-slate-500 uppercase font-bold">Talla</p>
                            <p className="text-sm md:text-xl font-black text-slate-800">{resident.height || '--'} <span className="text-[10px] md:text-xs font-normal">cm</span></p>
                        </div>
                        <div className="p-2 md:p-3 bg-white rounded-xl shadow-sm border border-slate-200">
                            <p className="text-[9px] md:text-xs text-slate-500 uppercase font-bold">IMC</p>
                            <p className="text-sm md:text-xl font-black text-slate-800">
                                {resident.bmi ? parseFloat(resident.bmi).toFixed(1) : 
                                 (resident.weight && resident.height) ? 
                                 (resident.weight / ((resident.height/100) * (resident.height/100))).toFixed(1) : '--'}
                            </p>
                        </div>
                    </div>
                    <div className="space-y-3 bg-white p-4 rounded-xl border border-emerald-100">
                        <InfoRow label="Prótesis Dental" value={t(resident.device_dentures)} />
                        {resident.device_dentures && resident.device_dentures_type && (
                            <p className="text-xs text-slate-500 ml-7">
                                Tipo: <span className="font-bold text-slate-700">{resident.device_dentures_type}</span>
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {(resident.supplementation_type || hasSupplements) && (
                <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm">
                    <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                        <Pill className="w-5 h-5 text-emerald-600" /> Suplementación {resident.supplementation_type === 'oral' ? 'Oral' : resident.supplementation_type === 'enteral' ? 'Enteral' : ''}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {resident.supplementation_formula && (
                            <div>
                                <p className="text-xs font-bold text-emerald-700 uppercase mb-1">Fórmula / Pauta</p>
                                <p className="text-slate-700 bg-white p-3 rounded-lg border border-emerald-100 font-medium">{resident.supplementation_formula}</p>
                            </div>
                        )}
                        {hasSupplements && (
                            <div>
                                <p className="text-xs font-bold text-emerald-700 uppercase mb-2">Tipos de Suplemento</p>
                                <div className="flex flex-wrap gap-2">
                                    {resident.supplement_hchp && <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold border border-amber-200">HCHP (Hiper)</span>}
                                    {resident.supplement_diabetes && <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold border border-blue-200">Diabético</span>}
                                    {resident.supplement_renal && <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold border border-purple-200">Renal</span>}
                                    {resident.supplement_fiber && <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold border border-green-200">Con Fibra</span>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

function SleepDetail({ resident }) {
    return (
    <div className="space-y-6">

        <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 space-y-4">
            {resident.sleep_medication && (
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-indigo-100 shadow-sm">
                    <Moon className="w-5 h-5 text-indigo-500" />
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Medicación</p>
                        <p className="text-sm font-bold text-slate-700">{resident.sleep_medication}</p>
                    </div>
                </div>
            )}
            {resident.sleep_pattern && (
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-indigo-100 shadow-sm">
                    <Clock className="w-5 h-5 text-indigo-500" />
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Patrón</p>
                        <p className="text-sm font-bold text-slate-700">{resident.sleep_pattern}</p>
                    </div>
                </div>
            )}
            {resident.sleep_observations && (
                <div className="p-4 bg-white rounded-xl border border-indigo-100 shadow-sm">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <FileText className="w-3 h-3" /> Observaciones
                    </h4>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">{resident.sleep_observations}</p>
                </div>
            )}
            {!resident.sleep_medication && !resident.sleep_pattern && !resident.sleep_observations && (
                <p className="text-slate-500 italic text-sm">No hay información registrada sobre sueño y descanso.</p>
            )}
        </div>
    </div>
    );
}

function PsychDetail({ resident }) {
    const hasBehaviors = resident.behavior_agitation || resident.behavior_aggression ||
        resident.behavior_disorientation || resident.behavior_night_wandering;

    return (
        <div className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-violet-50 p-6 rounded-2xl border border-violet-100">
                    <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                        <Brain className="w-5 h-5 text-purple-500" /> Estado Cognitivo
                    </h3>
                    <div className="space-y-3">
                        <InfoRow label="Deterioro Cognitivo" value={t(resident.cognitive_impairment)} />
                        <InfoRow label="MMSE (Folstein)" value={resident.mmse_score ? `${resident.mmse_score}/30` : '--'} />
                        <InfoRow label="Pfeiffer" value={resident.pfeiffer_score ? `${resident.pfeiffer_score} errores` : '--'} />
                        <InfoRow label="Usa Psicofármacos" value={t(resident.uses_psychotropics)} />
                    </div>
                </div>

                <div className="bg-violet-50 p-6 rounded-2xl border border-violet-100">
                    <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-rose-500" /> Perfil Conductual
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {resident.behavior_agitation && <span className="px-3 py-1 bg-rose-50 text-rose-700 rounded-full text-xs font-bold">Agitación</span>}
                        {resident.behavior_aggression && <span className="px-3 py-1 bg-rose-50 text-rose-700 rounded-full text-xs font-bold">Agresividad</span>}
                        {resident.behavior_disorientation && <span className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-bold">Desorientación</span>}
                        {resident.behavior_night_wandering && <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">Deambulación Nocturna</span>}
                        {!hasBehaviors &&
                            <span className="text-slate-400 italic text-sm">Sin alteraciones conductuales registradas.</span>
                        }
                    </div>
                </div>
            </div>

            {(resident.pain_eva || resident.pain_location || resident.pain_treatment) && (
                <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                    <h3 className="font-bold text-red-900 mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5" /> Manejo del Dolor
                    </h3>
                    <div className="space-y-3">
                        {resident.pain_eva && (
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold text-red-700">EVA:</span>
                                <div className="flex-1 bg-white rounded-full h-6 relative overflow-hidden">
                                    <div
                                        className={`h-full ${resident.pain_eva <= 3 ? 'bg-green-400' : resident.pain_eva <= 6 ? 'bg-yellow-400' : 'bg-red-500'}`}
                                        style={{ width: `${(resident.pain_eva / 10) * 100}%` }}
                                    ></div>
                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700">
                                        {resident.pain_eva}/10
                                    </span>
                                </div>
                            </div>
                        )}
                        {resident.pain_location && <InfoRow label="Localización" value={resident.pain_location} />}
                        {resident.pain_treatment && <InfoRow label="Tratamiento" value={resident.pain_treatment} />}
                    </div>
                </div>
            )}
        </div>
    );
};





// --- MAIN COMPONENT ---
function ResidentProfile() {
    const { id } = useParams();
    const navigate = useNavigate();

    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams(); // Hook to read and write query params

    // Fetch residence name for Header
    const [residenceName, setResidenceName] = useState('Residencia Eldera Demo');
    useEffect(() => {
        api.get('/dashboard/stats').then(res => {
            if (res.data.residence_name) setResidenceName(res.data.residence_name);
        }).catch(() => { });
    }, []);


    // Data State
    const [resident, setResident] = useState(null);
    const [loading, setLoading] = useState(true);
    const [vitalsLoading, setVitalsLoading] = useState(false);
    const [careLoading, setCareLoading] = useState(false);
    const [groupedVitals, setGroupedVitals] = useState({});
    const [groupedCare, setGroupedCare] = useState({});

    // Filter State (Elevated)
    // Date State with Defaults (Matching GeneralFollowups)
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

    const [startDate, setStartDate] = useState(getLastWeekLocal());
    const [endDate, setEndDate] = useState(getTodayLocal());

    // Filter States for Followups (integrated in header)
    const [followupSearch, setFollowupSearch] = useState('');
    const [followupType, setFollowupType] = useState('');

    // UI State
    const [activeSection, setActiveSection] = useState(() => searchParams.get('tab'));


    // Removed legacy recording state (recordType, quickType, substituting) in favor of QuickCareRecord component



    // Sync state if URL changes while component is mounted
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && tab !== activeSection) {
            setActiveSection(tab);
        } else if (!tab && activeSection) {
            setActiveSection(null);
        }
    }, [searchParams, activeSection, user, setSearchParams]);

    const handleBack = useCallback(() => {
        // If we are in health, care or history, back goes to the residents list
        if (activeSection === 'health' || activeSection === 'care' || activeSection === 'history') {
            navigate('/residents');
        } else {
            // If we are in a Gordon pattern section, back goes to the profile menu (null section)
            setActiveSection(null);
            setSearchParams({});
        }
    }, [activeSection, navigate, setSearchParams]);

    // FETCHING INDIVIDUAL MODULES
    const fetchResident = useCallback(async (silent = false) => {
        setLoading(silent ? false : true);
        try {
            const res = await api.get(`/residents/${id}${silent ? '?silent=true' : ''}`);
            setResident(res.data);
        } catch (error) {
            console.error("Error loading resident profile:", error);
            if (!silent) navigate('/residents');
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    const fetchVitals = useCallback(async (silent = false) => {
        if (!silent) setVitalsLoading(true);
        try {
            const params = new URLSearchParams();
            if (silent) params.append('silent', 'true');
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            
            const res = await api.get(`/residents/${id}/vitals?${params.toString()}`);
            const groupedV = {};
            res.data.forEach(v => {
                if (!groupedV[v.vital_type]) groupedV[v.vital_type] = [];
                groupedV[v.vital_type].push(v);
            });

            Object.keys(groupedV).forEach(type => {
                groupedV[type].sort((a, b) => safeParseDate(b.measured_at) - safeParseDate(a.measured_at));
            });
            setGroupedVitals(groupedV);
        } catch (error) {
            console.error("Error loading vitals:", error);
        } finally {
            setVitalsLoading(false);
        }
    }, [id, startDate, endDate]);

    const fetchCareLogs = useCallback(async (silent = false) => {
        if (!silent) setCareLoading(true);
        try {
            const params = new URLSearchParams();
            if (silent) params.append('silent', 'true');
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);

            const res = await api.get(`/residents/${id}/care-logs?${params.toString()}`);
            const groupedC = {};
            res.data.forEach(log => {
                if (!groupedC[log.care_type]) groupedC[log.care_type] = [];
                groupedC[log.care_type].push(log);
            });

            Object.keys(groupedC).forEach(type => {
                groupedC[type].sort((a, b) => safeParseDate(b.logged_at) - safeParseDate(a.logged_at));
            });
            setGroupedCare(groupedC);
        } catch (error) {
            console.error("Error loading care logs:", error);
        } finally {
            setCareLoading(false);
        }
    }, [id, startDate, endDate]);

    // Initial load - Deduplicated and Rigid
    useEffect(() => {
        const silentParam = searchParams.get('silent') === 'true';
        const tabParam = searchParams.get('tab');
        const clinicalTabs = ['health', 'care', 'followups', 'history'];

        // Silence profile access log if entering via a clinical tab directly
        const shouldBeSilent = silentParam || (tabParam && clinicalTabs.includes(tabParam));

        if (id) fetchResident(shouldBeSilent);
    }, [id]); // Strict dependency on id only
    // Lazy load clinical data
    useEffect(() => {
        if (!id) return;
        if (activeSection === 'health') {
            fetchVitals();
        } else if (activeSection === 'care') {
            fetchCareLogs();
        }
    }, [id, activeSection, fetchVitals, fetchCareLogs, startDate, endDate]);

    const fetchAllData = useCallback(async (silent = false) => {
        // Wrapper for compatibility with refresh buttons
        // Profile fetch is ALWAYS silent here to avoid redundant view logs
        await fetchResident(true);
        if (activeSection === 'health') await fetchVitals(silent);
        if (activeSection === 'care') await fetchCareLogs(silent);
    }, [fetchResident, fetchVitals, fetchCareLogs, activeSection]);

    const getTrend = (current, previous) => {
        if (!previous) return 'stable';
        if (current.value > previous.value) return 'up';
        if (current.value < previous.value) return 'down';
        return 'stable';
    };

    // Removed handleRecord function - now handled by QuickCareRecord component





    if (loading || !resident) return <LoadingScreen />;

    // === CANONICAL 12 SECTIONS (Matching ResidentFormExtended) ===
    const ALL_SECTIONS = [
        { id: 'admin', label: '0. Identificación y Admin', icon: User, color: 'slate', desc: 'Datos personales, Bajas' },
        { id: 'salud', label: '1. Percepción-Manejo de la salud', icon: Stethoscope, color: 'blue', desc: 'Médico, Diagnósticos, Alergias' },
        { id: 'nutrition', label: '2. Nutricional-Metabólico', icon: Utensils, color: 'green', desc: 'Dieta, Peso, Disfagia' },
        { id: 'elimination', label: '3. Eliminación', icon: Droplet, color: 'yellow', desc: 'Continencia, Pañales' },
        { id: 'mobility', label: '4. Actividad-Ejercicio', icon: Dumbbell, color: 'red', desc: 'Movilidad, Terapias' },
        { id: 'sleep', label: '5. Sueño-Descanso', icon: Moon, color: 'indigo', desc: 'Patrón de sueño, Medicación' },
        { id: 'cognitive', label: '6. Cognitivo-Perceptivo', icon: Brain, color: 'purple', desc: 'Deterioro, Dolor' },
        { id: 'self_perception', label: '7. Autopercepción-Autoconcepto', icon: Heart, color: 'pink', desc: 'Estado emocional' },
        { id: 'social', label: '8. Rol-Relaciones', icon: Users, color: 'teal', desc: 'Familia, Contactos' },
        { id: 'sexuality', label: '9. Sexualidad-Reproducción', icon: FileCheck, color: 'rose', desc: 'Aspectos sexuales' },
        { id: 'stress', label: '10. Tolerancia al Estrés', icon: Activity, color: 'orange', desc: 'Manejo del estrés' },
        { id: 'values', label: '11. Valores-Creencias', icon: FileCheck, color: 'indigo', desc: 'Creencias, Religión' },
    ];

    // RBAC: Show all sections to everyone, but editing is restricted elsewhere
    const SECTIONS = ALL_SECTIONS;

    return (
        <DashboardLayout headerContent={residenceName ? { residenceName } : undefined}>
            <div className="flex flex-col gap-8 pb-20 pt-2 md:pt-0">
                {/* --- HEADER WITH INTEGRATED NAV (VISIBLE ONLY IN MAIN PROFILE) --- */}
                {!activeSection && (
                    <header className="bg-white rounded-[2rem] border-2 border-[#0F172A] shadow-sm overflow-hidden">
                        {/* Content */}
                        <div className="px-4 py-8 flex flex-col items-center relative">
                            {/* Integrated Navigation */}
                            <div className="absolute top-4 left-4 z-20 flex items-center gap-3 flex-1 min-w-0">
                                <button
                                    onClick={() => navigate('/residents')}
                                    className="w-10 h-10 md:w-12 md:h-12 bg-[#0F172A] hover:bg-slate-800 text-white rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg shrink-0"
                                    title="Volver a Residentes"
                                >
                                    <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
                                </button>
                                <div className="hidden md:flex flex-col min-w-0">
                                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none">Perfil del Residente</h2>
                                </div>
                            </div>



                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                <User className="w-48 h-48 text-indigo-900 transform rotate-12" />
                            </div>

                            <div className="relative group shrink-0 mb-2">
                                <img
                                    src={resolveStaticUrl(getResidentPhoto(resident))}
                                    alt={resident.name}
                                    className="w-32 h-32 md:w-36 md:h-36 rounded-[2rem] object-cover border-4 border-slate-50 shadow-lg"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(resident.name + ' ' + resident.surname)}&background=e0e7ff&color=4338ca&size=256&bold=true`;
                                    }}
                                />
                                {resident.status === 'hospitalized' ? (
                                    <Link to="/hospitalized" className="absolute -bottom-1 -right-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border-2 border-white bg-amber-500 text-white hover:bg-amber-600 shadow-md transition-colors cursor-pointer z-10" title="Ver lista de hospitalizados">
                                        Hospitalizado
                                    </Link>
                                ) : resident.status === 'deceased' ? (
                                    <Link to="/deceased" className="absolute -bottom-1 -right-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border-2 border-white bg-rose-600 text-white hover:bg-rose-700 shadow-md transition-colors cursor-pointer z-10" title="Ver lista de defunciones">
                                        Defunción
                                    </Link>
                                ) : resident.status === 'inactive' ? (
                                    <Link to="/inactive" className="absolute -bottom-1 -right-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border-2 border-white bg-slate-600 text-white hover:bg-slate-700 shadow-md transition-colors cursor-pointer z-10" title="Ver lista de bajas temporales">
                                        Baja Temporal
                                    </Link>
                                ) : (
                                    <span className="absolute -bottom-1 -right-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border-2 border-white bg-emerald-500 text-white shadow-md">
                                        Activo
                                    </span>
                                )}
                            </div>

                            <div className="text-center z-10 w-full">
                                <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
                                    {resident.name} {resident.surname}
                                </h1>
                                <p className="text-slate-500 font-medium flex items-center justify-center gap-2 mt-2 text-sm">
                                    <span className="bg-[#0F172A] border border-slate-700 shadow-sm px-2.5 py-1 rounded-lg text-[11px] font-bold text-white flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                        Hab. {resident.room_number}
                                    </span>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-slate-600 font-bold">{calculateAge(resident.date_of_birth)} años</span>
                                </p>
                            </div>
                        </div>
                    </header>
                )}

                {/* Navigation UI removed as requested - navigation is handled via Resident Cards in the list view */}


                {/* --- CONTENT AREA: EITHER GRID OR DETAIL --- */}
                {activeSection ? (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-300">

                        {(activeSection === 'followups' || activeSection === 'history') ? (
                            /* DIRECT RENDER for Followups (Floating Cards Layout) */
                            <GeneralFollowups
                                residentId={id}
                                resident={resident}
                                onBack={handleBack}
                                externalFilters={{
                                    startDate,
                                    endDate,
                                    onStartChange: setStartDate,
                                    onEndChange: setEndDate,
                                    onRefresh: fetchAllData,
                                    search: followupSearch,
                                    onSearchChange: setFollowupSearch,
                                    type: followupType,
                                    onTypeChange: setFollowupType
                                }}
                            />
                        ) : (
                            /* STANDARD CARD for other sections */
                            <div className="bg-white rounded-[2rem] border-2 border-[#0F172A] shadow-sm min-h-[500px] overflow-hidden">
                                {/* Integrated Nav Bar */}
                                <div className="flex items-center gap-2 md:gap-4 px-3 py-3 md:px-6 md:py-4 border-b border-slate-200">
                                    <button
                                        type="button"
                                        onClick={handleBack}
                                        className="w-10 h-10 md:w-12 md:h-12 bg-[#0F172A] hover:bg-slate-800 text-white rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg shrink-0"
                                        title="Volver al listado"
                                    >
                                        <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-lg md:text-2xl font-black text-slate-800 flex items-center gap-2 whitespace-normal leading-tight">
                                            {(() => {
                                                const sec = SECTIONS.find(s => s.id === activeSection);
                                                const hiddenSections = {
                                                    'health': { label: 'Constantes' },
                                                    'care': { label: 'Cuidados' }
                                                };
                                                return sec?.label || hiddenSections[activeSection]?.label || 'Sección';
                                            })()}
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

                                    {/* Header Controls (PC) */}
                                    <div className="hidden lg:flex flex-1 items-center justify-center gap-10 px-4">
                                        {/* Date Filter (Used by Health, Care) */}
                                        {(activeSection === 'health' || activeSection === 'care') && (
                                            <div className="flex items-center gap-3">
                                                <DateRangeFilter
                                                    startDate={startDate}
                                                    endDate={endDate}
                                                    onStartChange={setStartDate}
                                                    onEndChange={setEndDate}
                                                />
                                                <button
                                                    onClick={fetchAllData}
                                                    className="h-11 w-11 flex items-center justify-center bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl transition-all shadow-md active:scale-95"
                                                    title="Refrescar"
                                                >
                                                    <RefreshCw className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {!((activeSection === 'health' || activeSection === 'care')) && null}

                                    {/* Edit Button */}
                                    {EDIT_TAB_MAP[activeSection] !== undefined && canEditSection(activeSection, user?.role) && (
                                        <Link
                                            to={`/residents/${resident.id}/edit?tab=${EDIT_TAB_MAP[activeSection]}`}
                                            className="bg-white text-emerald-500 px-2.5 py-1.5 rounded-xl shadow-sm border border-emerald-400 flex items-center justify-center min-w-[44px] min-h-[44px] hover:bg-emerald-50 hover:border-emerald-500 hover:scale-105 transition-all shrink-0 ml-auto"
                                            title="Editar Sección"
                                        >
                                            <Edit2 size={18} strokeWidth={2.5} />
                                        </Link>
                                    )}
                                </div>

                                {/* Mobile Date Filter (Visible only on small screens for Health/Care) */}
                                {(activeSection === 'health' || activeSection === 'care') && (
                                    <div className="lg:hidden px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
                                        <DateRangeFilter
                                            startDate={startDate}
                                            endDate={endDate}
                                            onStartChange={setStartDate}
                                            onEndChange={setEndDate}
                                        />
                                        <button
                                            onClick={fetchAllData}
                                            className="h-10 w-10 shrink-0 flex items-center justify-center bg-[#0F172A] text-white rounded-xl shadow-sm active:scale-95 transition-all"
                                            title="Actualizar datos"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                {/* Section Content Area */}
                                <div className="p-4 md:p-12">
                                    {/* RENDER ACTIVE SECTION CONTENT */}
                                    <div className="animate-in slide-in-from-top-4 duration-300">
                                        <>
                                            {/* SPECIAL QUICK-ACCESS SECTIONS (from list buttons) */}
                                            {activeSection === 'health' && (vitalsLoading ? <div className="py-20 flex justify-center"><RotateCw className="animate-spin text-indigo-500" /></div> : <HealthDetail groupedVitals={groupedVitals} onRefresh={fetchVitals} startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />)}
                                            {activeSection === 'care' && (careLoading ? <div className="py-20 flex justify-center"><RotateCw className="animate-spin text-indigo-500" /></div> : <CareDetail groupedCare={groupedCare} onRefresh={fetchCareLogs} startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />)}

                                            {/* GORDON PATTERN SECTIONS (from profile grid) */}
                                            {activeSection === 'admin' && <BioDetail resident={resident} />}
                                            {activeSection === 'salud' && <MedicalDetail resident={resident} />}
                                            {activeSection === 'nutrition' && <NutritionDetail resident={resident} />}
                                            {activeSection === 'elimination' && <EliminationDetail resident={resident} />}
                                            {activeSection === 'mobility' && <PhysioDetail resident={resident} />}
                                            {activeSection === 'sleep' && <SleepDetail resident={resident} />}
                                            {activeSection === 'cognitive' && <PsychDetail resident={resident} />}
                                            {activeSection === 'self_perception' && <SelfPerceptionDetail resident={resident} />}
                                            {activeSection === 'social' && <SocialDetail resident={resident} />}
                                            {activeSection === 'sexuality' && <SexualityDetail resident={resident} />}
                                            {activeSection === 'stress' && <StressDetail resident={resident} />}
                                            {activeSection === 'values' && <ValuesDetail resident={resident} />}
                                        </>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        {/* --- MAIN GRID (GORDON PATTERNS) --- */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                            {SECTIONS.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => setSearchParams({ tab: section.id })}
                                    className="group bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-300 rounded-[2rem] p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-xl relative overflow-hidden flex flex-col justify-between h-48"
                                >
                                    <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-5 transition-opacity duration-500">
                                        <section.icon className="w-32 h-32" />
                                    </div>

                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                                        section.color === 'slate' ? 'bg-slate-50 text-slate-600 group-hover:bg-slate-600 group-hover:text-white' :
                                        section.color === 'blue' ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' :
                                        section.color === 'green' ? 'bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white' :
                                        section.color === 'yellow' ? 'bg-yellow-50 text-yellow-600 group-hover:bg-yellow-600 group-hover:text-white' :
                                        section.color === 'red' ? 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white' :
                                        section.color === 'indigo' ? 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white' :
                                        section.color === 'purple' ? 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white' :
                                        section.color === 'pink' ? 'bg-pink-50 text-pink-600 group-hover:bg-pink-600 group-hover:text-white' :
                                        section.color === 'cyan' ? 'bg-cyan-50 text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white' :
                                        section.color === 'rose' ? 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white' :
                                        section.color === 'orange' ? 'bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white' :
                                        section.color === 'teal' ? 'bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white' :
                                        'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
                                    }`}>
                                        <section.icon className="w-6 h-6" />
                                    </div>

                                    <div>
                                        <h3 className="text-base md:text-lg font-black text-slate-800 group-hover:text-indigo-900 leading-tight mb-1 break-normal pr-2">{section.label}</h3>
                                        <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-tight group-hover:text-slate-500 break-normal pr-2">{section.desc}</p>
                                    </div>

                                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300">
                                        <ChevronRight className="w-5 h-5 text-indigo-400" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

export default ResidentProfile;
