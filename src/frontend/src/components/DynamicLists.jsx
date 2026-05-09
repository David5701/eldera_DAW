import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Search, X, Printer } from 'lucide-react';
import Button from './Button';
import logo from '../assets/logo.svg';

export default function DynamicLists({ onBack }) {
    const [lists, setLists] = useState([]);
    const [selectedList, setSelectedList] = useState(null);
    const [, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [residenceName, setResidenceName] = useState('');
    useAuth();

    useEffect(() => {
        const fetchLists = async () => {
            try {
                // Fetch basic dynamic lists
                const listsRes = await api.get('/residents/lists/dynamic');
                let allLists = [...(listsRes.data || [])];

                // Fetch extra lists (Vaccines & Birthdays)
                const [vaccinesRes, birthdaysRes] = await Promise.all([
                    api.get('/dashboard/vaccinations/pending').catch(() => ({ data: [] })),
                    api.get('/dashboard/birthdays').catch(() => ({ data: [] }))
                ]);

                // Transform Vaccines
                if (vaccinesRes.data.length > 0) {
                    if (!allLists.some(l => l.list_type === 'vaccines')) {
                        allLists.push({
                            list_type: 'vaccines',
                            list_name: 'Vacunaciones Pendientes',
                            total: vaccinesRes.data.length,
                            residents: vaccinesRes.data.map((v, i) => ({
                                id: `v-${i}`,
                                room_number: 'N/A',
                                name: v.resident.split(' ')[0],
                                surname: v.resident.split(' ').slice(1).join(' '),
                                relevant_data: { 'Vacuna': v.vaccine || v.type, 'Vence': v.expires }
                            }))
                        });
                    }
                }

                // Transform Birthdays
                if (birthdaysRes.data.length > 0) {
                    if (!allLists.some(l => l.list_type === 'birthdays')) {
                        allLists.push({
                            list_type: 'birthdays',
                            list_name: 'Cumpleaños del Mes',
                            total: birthdaysRes.data.length,
                            residents: birthdaysRes.data.map((b, i) => ({
                                id: `b-${i}`,
                                room_number: 'N/A',
                                name: b.name ? b.name.split(' ')[0] : 'Desconocido',
                                surname: b.name ? b.name.split(' ').slice(1).join(' ') : '',
                                relevant_data: { 'Fecha': b.date, 'Edad': b.age }
                            }))
                        });
                    }
                }

                setLists(allLists);

                try {
                    const statsRes = await api.get('/dashboard/stats');
                    // SAFEGUARD: Ensure residence_name is a string
                    const name = statsRes.data.residence_name || statsRes.data.residenceName;
                    setResidenceName(typeof name === 'string' ? name : 'Residencia Eldera');
                } catch {
                    setResidenceName('Residencia Eldera');
                }

            } catch (error) {
                console.error("Error fetching dynamic lists:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLists();
    }, []);

    const getIcon = (type) => {
        switch (type) {
            case 'hta': return '❤️';
            case 'diabetes': return '💉';
            case 'psychotropics': return '💊';
            case 'postural': return '🔄';
            case 'diet': return '🥣';
            case 'absorbents': return '🧷';
            case 'vaccines': return '💉';
            case 'birthdays': return '🎂';
            default: return '📋';
        }
    };

    const getColor = (type) => {
        switch (type) {
            case 'hta': return 'hover:bg-red-50 hover:border-red-200';
            case 'diabetes': return 'hover:bg-orange-50 hover:border-orange-200';
            case 'psychotropics': return 'hover:bg-purple-50 hover:border-purple-200';
            case 'postural': return 'hover:bg-blue-50 hover:border-blue-200';
            case 'diet': return 'hover:bg-green-50 hover:border-green-200';
            case 'absorbents': return 'hover:bg-yellow-50 hover:border-yellow-200';
            case 'vaccines': return 'hover:bg-emerald-50 hover:border-emerald-200';
            case 'birthdays': return 'hover:bg-pink-50 hover:border-pink-200';
            default: return 'hover:bg-slate-50 hover:border-slate-200';
        }
    };

    const filteredLists = lists.filter(list =>
        list.list_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // --- VISTA DE DETALLE (TABLA) ---
    const [printBackground, setPrintBackground] = useState(false); // Default to clean/white for saving ink

    // --- VISTA DE DETALLE (TABLA) ---
    if (selectedList) {
        return (
            <div className={`print-container flex flex-col gap-6 w-full h-full animate-in fade-in duration-300 pt-2 md:pt-0 print:pt-0 print:block print:gap-0 print:h-auto`}>
                <style>{`
                    @media print {
                        * {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }

                        @page { 
                            margin: 10mm !important; 
                            size: auto; 
                        }
                        
                        html, body, #root, #app-layout, .min-h-screen, main, main > div {
                            background-color: ${printBackground ? '#dbeafe' : 'white'} !important;
                            width: 100% !important;
                            height: auto !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            display: block !important;
                        }

                        header, nav, aside, .no-print, [role="navigation"] { 
                            display: none !important; 
                        }

                        .print-container {
                            width: 100% !important;
                            margin: 0 !important;
                            padding: 0 !important;
                        }

                        .bg-white {
                            background-color: white !important;
                            border: none !important;
                            border-radius: ${printBackground ? '2rem' : '0'} !important;
                            box-shadow: ${printBackground ? '0 10px 20px -5px rgba(0,0,0,0.1)' : 'none'} !important;
                            padding: 10mm !important;
                            width: ${printBackground ? 'calc(100% - 20mm)' : '100%'} !important;
                            margin: ${printBackground ? '10mm auto' : '0'} !important;
                            min-height: ${printBackground ? '250mm' : 'auto'} !important;
                        }

                        table {
                            width: 100% !important;
                            border-collapse: collapse !important;
                            margin-top: 5mm !important;
                        }

                        thead th {
                            background-color: #f1f5f9 !important;
                            color: #334155 !important;
                            font-weight: bold !important;
                            padding: 4mm 2mm !important;
                            text-align: left !important;
                            border-bottom: 2px solid #e2e8f0 !important;
                        }

                        td {
                            padding: 3mm 2mm !important;
                            border-bottom: 1px solid #f1f5f9 !important;
                            color: #475569 !important;
                        }

                        .print\\:hidden { display: none !important; }
                    }
                `}</style>

                {/* Print Options Control moved to Card Header */}

                {/* Card Container */}
                <div className="bg-white rounded-[2.5rem] p-4 md:p-8 shadow-sm min-h-[500px] print:rounded-[2rem] print:border print:border-slate-200 print:p-10 print:w-full print:min-h-0 print:shadow-none">

                    {/* A) HEADER PARA IMPRESIÓN (DISEÑO PREMIUM) */}
                    <div className="hidden print:flex flex-col gap-6 mb-8">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 flex items-center justify-center">
                                    <img src={logo} alt="Eldera" className="w-full h-full object-contain" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black text-slate-900 leading-tight uppercase tracking-tight">
                                        {selectedList.list_name}
                                    </h1>
                                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                        {typeof residenceName === 'string' ? residenceName : 'Residencia Eldera'}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="mb-2">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Fecha de Informe</p>
                                    <p className="text-xs font-black text-slate-900">{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                </div>
                                <p className="text-[9px] font-bold text-slate-400">Total: {selectedList.residents.length} registros</p>
                            </div>
                        </div>
                        <div className="h-0.5 bg-slate-900 w-full opacity-80" />
                    </div>

                    {/* B) HEADER PARA PANTALLA (Compacto & Responsive) */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8 print:hidden">
                        <div className="flex items-center gap-3 flex-1 min-w-0 w-full sm:w-auto">
                            <button
                                onClick={() => setSelectedList(null)}
                                className="w-10 h-10 md:w-12 md:h-12 bg-[#0F172A] hover:bg-slate-800 text-white rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg shrink-0"
                                title="Volver a tableros"
                            >
                                <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                            <h1 className="text-lg sm:text-2xl md:text-3xl font-black text-slate-900 leading-tight break-words pr-2">
                                {selectedList.list_name}
                            </h1>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                            <button
                                onClick={() => setPrintBackground(!printBackground)}
                                className="no-print flex items-center gap-2 px-3 h-10 md:h-12 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-indigo-300 transition-all text-slate-600 shadow-sm"
                                title={printBackground ? "Modo PDF Activado" : "Modo Tinta (Ahorro) Activado"}
                            >
                                {printBackground ? (
                                    <>
                                        <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-sm ring-2 ring-indigo-200" />
                                        <span className="text-xs font-bold whitespace-nowrap">PDF</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-3 h-3 rounded-full bg-white border-2 border-slate-400" />
                                        <span className="text-xs font-bold whitespace-nowrap">Tinta</span>
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => window.print()}
                                className="w-10 h-10 md:w-12 md:h-12 bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 rounded-full flex items-center justify-center transition-all shadow-sm hover:shadow-md shrink-0"
                                title="Imprimir"
                            >
                                <Printer className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>

                    {/* CONTENEDOR DE TABLA */}
                    <div className="overflow-x-auto rounded-3xl border border-slate-200 overflow-hidden print:w-full print:border-none print:rounded-none">
                        <table className="min-w-full divide-y divide-slate-200 hidden md:table border-collapse print:table print:w-full print:divide-y-0">
                            <thead className="bg-slate-50 print:bg-transparent">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-wider print:bg-slate-100 print:rounded-l-xl print:text-slate-700 print:py-3">Hab.</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-wider print:bg-slate-100 print:text-slate-700 print:py-3">Residente</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-wider print:bg-slate-100 print:rounded-r-xl print:text-slate-700 print:py-3">Detalles</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200 print:divide-slate-200">
                                {selectedList.residents.map((r) => (
                                    <tr key={r.id} className="hover:bg-slate-50 transition-colors print:break-inside-avoid">
                                        <td className="px-6 py-5 whitespace-nowrap text-xs md:text-sm font-bold text-slate-900 print:px-3 print:py-4 print:text-[11px]">{r.room_number}</td>
                                        <td className="px-6 py-5 whitespace-nowrap text-xs md:text-sm font-medium text-slate-900 print:px-3 print:py-4 print:text-[11px]">{r.surname}, {r.name}</td>
                                        <td className="px-6 py-5 text-sm text-slate-600 print:px-3 print:py-4 print:text-[11px]">
                                            <div className="flex flex-wrap gap-2 print:gap-1.5">
                                                {Object.entries(r.relevant_data).map(([key, value]) => (
                                                    <span key={key} className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 print:bg-transparent print:border-none print:text-black print:px-0 print:py-0 print:rounded-none">
                                                        <span className='font-bold mr-1.5 uppercase text-[10px] text-slate-500 print:text-slate-400 print:text-[9px]'>{key}:</span>
                                                        {value != null ? value.toString() : '--'}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* MOBILE CARDS (Print Hidden) */}
                    <div className="md:hidden space-y-4 mt-4 print:hidden">
                        {selectedList.residents.map((r) => (
                            <div key={r.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4">
                                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                                    <div>
                                        <h3 className="font-black text-slate-900 text-sm md:text-base">{r.name} {r.surname}</h3>
                                        <span className="inline-block bg-indigo-50 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded uppercase mt-1">
                                            Habitación {r.room_number}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {Object.entries(r.relevant_data).map(([key, value]) => (
                                        <div key={key} className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">{key}</p>
                                            <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-normal break-words">
                                                {value != null ? value.toString() : '--'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // --- VISTA DASHBOARD (TARJETAS) ---
    return (
        <div className="space-y-6 pt-2 md:pt-0 pb-20">
            {/* Card Container for Grid */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm">

                {/* Header (Back, Title & Search) INSIDE Card */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="w-10 h-10 bg-[#0F172A] hover:bg-slate-800 text-white rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg shrink-0"
                                title="Volver al Dashboard"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                        )}
                        <div>
                            <h2 className="text-2xl font-black text-slate-900">Listados Dinámicos</h2>
                            <p className="text-sm text-slate-500 mt-1">{filteredLists.length} {filteredLists.length === 1 ? 'listado disponible' : 'listados disponibles'}</p>
                        </div>
                    </div>

                    <div className="relative w-full md:w-64">
                        <input
                            type="text"
                            placeholder="Buscar listado..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="px-4 py-2 pl-10 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm w-full"
                        />
                        <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredLists.map(list => (
                        <div
                            key={list.list_type}
                            onClick={() => setSelectedList(list)}
                            className={`
                                p-7 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95
                                ${getColor(list.list_type)}
                            `}
                        >
                            <div className="flex justify-between items-start mb-5">
                                <span className="text-4xl">{getIcon(list.list_type)}</span>
                                <span className="bg-white/80 p-1.5 px-3 rounded-full text-[10px] font-black shadow-sm uppercase tracking-wider">
                                    {list.total} registros
                                </span>
                            </div>
                            <h3 className="text-xl font-bold mb-1.5 text-slate-800">{list.list_name}</h3>
                            <p className="text-xs font-medium text-slate-500 leading-relaxed">
                                {list.list_type === 'hta' && 'Seguimiento de tensión arterial'}
                                {list.list_type === 'diabetes' && 'Control de insulinas y pautas'}
                                {list.list_type === 'psychotropics' && 'Control de neurolépticos y sueño'}
                                {list.list_type === 'postural' && 'Reloj de cambios posturales'}
                                {list.list_type === 'diet' && 'Alergias, intolerancias y texturas'}
                                {list.list_type === 'absorbents' && 'Control de absorbentes y pañales'}
                                {list.list_type === 'vaccines' && 'Previsión de próximas vacunaciones'}
                                {list.list_type === 'birthdays' && 'Cumpleaños del mes en curso'}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
