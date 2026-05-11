import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from './Card';
import Button from './Button';
import { resolveStaticUrl } from '../utils/url';
import {
    FileText, Plus, Activity, Bed, Edit2,
    UserMinus, Skull, Calendar, AlertTriangle, RefreshCw,
    X, MapPin
} from 'lucide-react';
import api from '../api/axios';
import logo from '../assets/logo.svg';

import { useAuth } from '../context/AuthContext';
import { getResidentPhoto, calculateAge } from '../utils/residentUtils';

/**
 * ResidentList - Displays all residents in card view or list view.
 */
export default function ResidentList({
    residents,
    viewMode = 'cards', // 'cards' | 'list'
    page,
    totalPages,
    onPageChange
}) {
    const { user } = useAuth();
    const [residenceName, setResidenceName] = useState('');

    const currentUserRole = (user?.role || '').toLowerCase().trim();
    const canQuickRecord = ['admin', 'doctor', 'nurse', 'aux'].includes(currentUserRole);
    const canEditGeneral = ['admin', 'doctor', 'nurse', 'aux', 'psychologist'].includes(currentUserRole);


    // Fetch residence name from dashboard stats
    useEffect(() => {
        const fetchResidenceName = async () => {
            try {
                const res = await api.get('/dashboard/stats?source=internal_stats');
                setResidenceName(res.data.residence_name || 'Residencia');
            } catch {
                setResidenceName('Residencia');
            }
        };
        fetchResidenceName();
    }, []);

    return (
        <div className="relative">
            {residents.length === 0 ? (
                <Card>
                    <div className="text-center py-20 bg-white rounded-lg shadow-sm border border-slate-200">
                        <p className="text-slate-500 text-lg">No se encontraron residentes</p>
                    </div>
                </Card>
            ) : viewMode === 'cards' ? (
                <>
                    {/* CARD VIEW - GRID LAYOUT */}
                    <div className="w-full print:hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
                            {residents.map((resident) => {
                                const isNonActive = resident.status === 'inactive' || resident.status === 'deceased';
                                return (
                                    <div key={resident.id} className="w-full bg-white rounded-2xl shadow-md border border-slate-200 p-0 hover:shadow-xl transition-all group relative flex flex-col h-full overflow-hidden">

                                        {/* Header: Edit Button (Top Left) - Green Solid */}
                                        {canEditGeneral && (
                                            <div className="absolute top-3 left-3 z-30">
                                                <Link
                                                    to={`/residents/${resident.id}/edit?tab=0`}
                                                    className="bg-white text-emerald-500 w-10 h-10 rounded-xl shadow-sm border border-emerald-400 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-500 hover:scale-105 transition-all"
                                                    title="Editar Perfil"
                                                >
                                                    <Edit2 size={18} strokeWidth={2.5} />
                                                </Link>
                                            </div>
                                        )}

                                        {/* Clickable Area */}
                                        <Link to={`/residents/${resident.id}`} className="flex-1 p-4 flex flex-col items-center">
                                            <div className="absolute top-3 right-3 z-30">
                                                <div className="bg-white shadow-sm text-[#0F172A] px-2.5 py-1.5 rounded-xl border border-[#0F172A] flex flex-col items-center min-w-[44px]">
                                                    <span className="text-[9px] font-bold uppercase tracking-wider opacity-60 leading-none mb-0.5">Hab.</span>
                                                    <span className="text-base font-black leading-none">{resident.room_number}</span>
                                                </div>
                                            </div>

                                            {/* Avatar */}
                                            <div className="relative mb-4 mt-4">
                                                <div className="relative group-hover:scale-105 transition-transform duration-300">
                                                    <img
                                                        src={resolveStaticUrl(getResidentPhoto(resident))}
                                                        alt={resident.name}
                                                        className="w-32 h-32 rounded-3xl object-cover shadow-sm mx-auto mb-2 border border-slate-100"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = `https://ui-avatars.com/api/?name=${resident.name}+${resident.surname}&background=e0e7ff&color=4f46e5&size=150&bold=true`;
                                                        }}
                                                    />

                                                    {/* Status Indicators */}
                                                    {resident.status === 'hospitalized' && (
                                                        <div className="absolute -bottom-2 inset-x-0 flex justify-center z-10 transition-transform hover:scale-110">
                                                            <Link to="/hospitalized" className="bg-amber-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border-2 border-white shadow-md flex items-center gap-1.5" title="Ver lista de hospitalizados">
                                                                <Activity size={12} className="shrink-0" />
                                                                <span className="truncate max-w-[110px]">{resident.hospitalization_hospital || 'Hospital'}</span>
                                                            </Link>
                                                        </div>
                                                    )}
                                                    {resident.status === 'deceased' && (
                                                        <div className="absolute -bottom-2 inset-x-0 flex justify-center z-10 transition-transform hover:scale-110">
                                                            <Link to="/deceased" className="bg-rose-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border-2 border-white shadow-md flex items-center gap-1.5" title="Ver lista de defunciones">
                                                                <Skull size={12} className="shrink-0" />
                                                                <span>Defunción</span>
                                                            </Link>
                                                        </div>
                                                    )}
                                                    {resident.status === 'inactive' && (
                                                        <div className="absolute -bottom-2 inset-x-0 flex justify-center z-10 transition-transform hover:scale-110">
                                                            <Link to="/inactive" className="bg-slate-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border-2 border-white shadow-md flex items-center gap-1.5" title="Ver lista de bajas">
                                                                <UserMinus size={12} className="shrink-0" />
                                                                <span>Baja Temporal</span>
                                                            </Link>
                                                        </div>
                                                    )}

                                                </div>


                                            </div>

                                            {/* Identity */}
                                            <div className="text-center w-full px-2">
                                                <h3 className="text-xl font-black text-slate-900 leading-tight mb-1 whitespace-normal break-words hyphens-auto">
                                                    {resident.name} {resident.surname}
                                                </h3>
                                                <p className="text-sm font-medium text-slate-500">{calculateAge(resident.date_of_birth)} años</p>
                                            </div>
                                        </Link>

                                        {/* Footer: Action Buttons */}
                                        <div className="p-3 bg-[#0F172A] border-t border-slate-700 grid grid-cols-4 gap-2">
                                            <Link
                                                to={`/residents/${resident.id}?tab=history`}
                                                className="bg-white hover:bg-blue-100 border border-blue-200 text-blue-600 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm hover:shadow-lg hover:scale-105 active:scale-95 group/btn"
                                                title="Evolución"
                                            >
                                                <FileText size={18} strokeWidth={3} className="group-hover/btn:scale-110 transition-transform" />
                                            </Link>
                                            <Link
                                                to={`/residents/${resident.id}?tab=health`}
                                                className="bg-white hover:bg-rose-100 border border-rose-200 text-rose-600 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm hover:shadow-lg hover:scale-105 active:scale-95 group/btn"
                                                title="Constantes"
                                            >
                                                <Activity size={18} strokeWidth={3} className="group-hover/btn:scale-110 transition-transform" />
                                            </Link>
                                            <Link
                                                to={`/residents/${resident.id}?tab=care`}
                                                className="bg-white hover:bg-amber-100 border border-amber-200 text-amber-600 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm hover:shadow-lg hover:scale-105 active:scale-95 group/btn"
                                                title="Cuidados"
                                            >
                                                <Bed size={18} strokeWidth={3} className="group-hover/btn:scale-110 transition-transform" />
                                            </Link>
                                            {canQuickRecord ? (
                                                <Link
                                                    to={`/residents/${resident.id}/quick-record`}
                                                    className={`h-10 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95 ${resident.status === 'hospitalized' || isNonActive
                                                        ? 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed pointer-events-none'
                                                        : 'bg-indigo-600 hover:bg-indigo-700 border border-indigo-500 text-white hover:shadow-lg hover:scale-105 group/btn'
                                                        }`}
                                                    title="Registro Rápido"
                                                >
                                                    <Plus size={20} strokeWidth={3} className="group-hover/btn:rotate-90 transition-transform" />
                                                </Link>
                                            ) : (
                                                <div className="bg-slate-800/50 border border-slate-700/50 text-slate-600 h-10 rounded-xl flex items-center justify-center cursor-not-allowed opacity-50" title="Acceso de solo lectura">
                                                    <Plus size={20} strokeWidth={3} className="opacity-20" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Print fallback */}
                    <div className="hidden print:block">
                        <ResidentTable residents={residents} residenceName={residenceName} />
                    </div>
                </>
            ) : (
                /* LIST VIEW */
                <ResidentTable residents={residents} residenceName={residenceName} />
            )}

            {/* Pagination - Hide completely if no results or only 1 page */}
            {residents.length > 0 && totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8 print:hidden">
                    <Button
                        onClick={() => onPageChange(page - 1)}
                        disabled={page === 1}
                        variant="outline"
                        size="sm"
                    >
                        Anterior
                    </Button>
                    <span className="flex items-center px-4 text-sm font-bold text-slate-600">
                        Página {page} de {totalPages}
                    </span>
                    <Button
                        onClick={() => onPageChange(page + 1)}
                        disabled={page === totalPages}
                        variant="outline"
                        size="sm"
                    >
                        Siguiente
                    </Button>
                </div>
            )}
        </div>
    );
}

/**
 * ResidentTable - Clean table component for list view and printing.
 */
function ResidentTable({ residents, residenceName }) {
    return (
        <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden print:border print:border-slate-200 print:rounded-[2rem] print:bg-white p-4 md:p-8 print:m-12 print:p-8">
            <style>{`
                @media print {
                    @page { margin: 20mm !important; }
                    body { -webkit-print-color-adjust: exact !important; }
                }
            `}</style>
            {/* Print Header - Clean and Professional */}
            <div className="hidden print:block py-8 border-b-2 border-slate-900 mb-8 mx-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img src={logo} alt="Eldera Logo" className="h-14 w-14" />
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Listado de Residentes</h1>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">{residenceName}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Fecha de Informe</p>
                        <p className="text-base font-black text-slate-900">
                            {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1 italic">Total: {residents.length} registros</p>
                    </div>
                </div>
            </div>

            {/* Screen Header */}
            <div className="px-6 py-4 border-b border-slate-100 print:hidden">
                <h3 className="text-lg font-bold text-slate-800">Listado de Residentes</h3>
                <p className="text-xs text-slate-400 mt-0.5">{residents.length} residentes</p>
            </div>

            {/* Table Container with Rounded Borders and Margins */}
            <div className="mx-2 md:mx-6 mb-8 overflow-hidden print:overflow-visible border border-slate-200 rounded-3xl print:border print:border-slate-300 print:rounded-2xl shadow-sm">
                {/* Desktop Table */}
                <div className="hidden md:block print:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50 print:bg-slate-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Hab.</th>
                            <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Año Nac.</th>
                            <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Edad</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                        {residents.map((r) => (
                            <tr key={r.id} className="hover:bg-slate-50 transition-colors print:hover:bg-transparent">
                                <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-slate-900">{r.room_number}</td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-slate-800">{r.surname}, {r.name}</td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-600 uppercase font-black text-[10px] tracking-widest">
                                    {r.status === 'active' ? <span className="text-emerald-500">Activo</span> :
                                        r.status === 'hospitalized' ? <span className="text-amber-500">Hosp.</span> :
                                            r.status === 'deceased' ? <span className="text-rose-500">Defunc.</span> :
                                                <span className="text-slate-500">Baja</span>}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-600">{r.date_of_birth ? new Date(r.date_of_birth).getFullYear() : '—'}</td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-600">{calculateAge(r.date_of_birth)} años</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-100 print:hidden">
                {residents.map((r) => (
                    <div key={r.id} className="px-4 py-3 flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-700 rounded-xl flex items-center justify-center font-black text-sm shrink-0">
                            {r.room_number}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-slate-900 whitespace-normal break-words">{r.surname}, {r.name}</p>
                            <div className="flex items-center gap-3 mt-0.5">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{r.status}</span>
                                <span className="text-xs text-slate-400">{calculateAge(r.date_of_birth)} años</span>
                            </div>
                        </div>
                    </div>
                ))}
                </div>
            </div>
        );
    }
