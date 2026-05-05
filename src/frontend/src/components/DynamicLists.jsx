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
            <div className="print-container flex flex-col gap-6 w-full h-full animate-in fade-in duration-300 pt-2 md:pt-0 print:pt-0 print:block print:gap-0 print:h-auto">
                <style>{`
                    @media print {
                        /* 1. PAGE SETUP */
                        @page { margin: 10mm !important; size: auto; }
                        
                        * {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            box-sizing: border-box !important;
                        }

                        /* 2. ROOT RESET */
                        :root {
                            --app-bg: ${printBackground ? '#dbeafe' : 'white'} !important;
                        }

                        html, body, #root, #app-layout, .min-h-screen, main {
                            background-color: var(--app-bg) !important;
                            width: 100% !important;
                            height: auto !important;
                            min-height: 0 !important;
                            margin: 0 !important;
                            padding: 20mm !important; /* Document breathing space */
                            overflow: visible !important;
                            position: static !important;
                        }

                        /* 3. CONTAINER */
                        .print-container {
                            width: 100% !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            display: block !important;
                        }

                        header, nav, .no-print { display: none !important; }

                        /* 4. OUTER CARD - SPACIOUS & RESTORED */
                        .bg-white {
                            border-radius: 1.5rem !important;
                            /* Ink: 1px Solid. PDF: None/Shadow */
                            border: ${printBackground ? 'none' : '1px solid #cbd5e1'} !important;
                            box-shadow: ${printBackground ? '0 10px 20px -5px rgba(0,0,0,0.1)' : 'none'} !important;
                            background-color: white !important;
                            padding: 2.5rem !important; /* Generous padding as requested */
                            margin-bottom: 1rem !important;
                        }
                        
                        /* Allow inner content to breathe */
                        .print\\:p-8 { padding: 2.5rem !important; }

                        /* 5. INNER TABLE WRAPPER */
                        .overflow-x-auto {
                            border: 1px solid #cbd5e1 !important;
                            border-radius: 1rem !important;
                            overflow: hidden !important;
                            background-color: white !important;
                            margin-top: 2rem !important; /* separation from header */
                            width: 100% !important;
                        }

                        /* 6. TABLE STYLES */
                        table {
                            border-collapse: collapse !important;
                            width: 100% !important;
                            border-spacing: 0 !important;
                            table-layout: auto !important;
                        }
                        
                        th, td {
                            border-bottom: 1px solid #cbd5e1 !important;
                            border-top: none !important;
                            border-left: none !important;
                            border-right: none !important;
                            padding: 12px 10px !important; /* Comfortable spacing */
                            font-size: 10px !important;
                        }
                        
                        /* HEADER STYLES inside table */
                        thead th {
                            background-color: #f8fafc !important;
                            color: #64748b !important;
                            font-weight: 800 !important;
                        }

                        td {
                            word-wrap: break-word !important; 
                            overflow-wrap: break-word !important;
                        }
                        
                        /* Helpers */
                        .max-w-2xl, .max-w-3xl, .max-w-4xl, .max-w-5xl, .w-full {
                            max-width: 100% !important;
                            width: 100% !important;
                        }
                    }
                `}</style>

                {/* Print Options Control moved to Card Header */}

                {/* Card Container */}
                {/* RESTORED: Premium Layout (Rounded, White, Shadow) */}
                <div className="bg-white rounded-[2.5rem] p-4 md:p-8 shadow-sm min-h-[500px] print:rounded-[2rem] print:border print:border-slate-300 print:shadow-sm print:p-8 print:w-full print:h-full print:min-h-0">

                    {/* A) HEADER PARA IMPRESIÓN (Oculto en pantalla) */}
                    <div className="hidden print:flex flex-col gap-4 mb-6 border-b border-slate-200 pb-4">
                        <div className="flex justify-between items-start">
                            <img src={logo} alt="Eldera" className="h-10" />
                            <div className="text-right">
                                <p className="text-lg font-bold text-slate-900">
                                    {typeof residenceName === 'string' ? residenceName : 'Residencia Eldera'}
                                </p>
                                <p className="text-sm text-slate-500">{new Date().toLocaleDateString()}</p>
                            </div>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 mt-2">{selectedList.list_name}</h1>
                    </div>

                    {/* B) HEADER PARA PANTALLA (Compacto) */}
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
                    <div className="overflow-x-auto rounded-3xl border border-slate-200 overflow-hidden print:w-full print:border print:border-slate-300 print:rounded-2xl">
                        <table className="min-w-full divide-y divide-slate-200 hidden md:table border-collapse print:table print:w-full">
                            <thead className="bg-slate-50 print:bg-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-wider print:px-2 print:py-2 print:text-[9px] print:text-black">Hab.</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-wider print:px-2 print:py-2 print:text-[9px] print:text-black">Residente</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-wider print:px-2 print:py-2 print:text-[9px] print:text-black">Detalles</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200 print:divide-slate-300">
                                {selectedList.residents.map((r) => (
                                    <tr key={r.id} className="hover:bg-slate-50 transition-colors print:break-inside-avoid">
                                        <td className="px-6 py-5 whitespace-nowrap text-xs md:text-sm font-bold text-slate-900 print:px-2 print:py-2 print:text-xs">{r.room_number}</td>
                                        <td className="px-6 py-5 whitespace-nowrap text-xs md:text-sm font-medium text-slate-900 print:px-2 print:py-2 print:text-xs">{r.surname}, {r.name}</td>
                                        <td className="px-6 py-5 text-sm text-slate-600 print:px-2 print:py-2 print:text-xs">
                                            <div className="flex flex-wrap gap-2">
                                                {Object.entries(r.relevant_data).map(([key, value]) => (
                                                    <span key={key} className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 print:bg-white print:border-slate-300 print:text-black print:px-1.5 print:py-0.5 print:rounded-md print:leading-tight">
                                                        <span className='font-bold mr-1.5 uppercase text-[10px] text-slate-500 print:text-black print:text-[9px]'>{key}:</span>
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
