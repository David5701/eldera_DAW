import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
    Search, 
    Plus, 
    LayoutGrid, 
    List, 
    ChevronLeft, 
    ChevronRight,
    Printer,
    Activity,
    X
} from 'lucide-react';
import api from '../api/axios';
import logo from '../assets/logo.svg';
import DashboardLayout from '../components/DashboardLayout';
import ResidentFormExtended from '../components/ResidentFormExtended';
import ResidentList from '../components/ResidentList';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import QuickCareRecord from '../components/QuickCareRecord';

const ResidentsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuth();
    const [residents, setResidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const viewMode = searchParams.get('view') || 'cards';
    
    const toggleViewMode = () => {
        const newMode = viewMode === 'cards' ? 'list' : 'cards';
        const newParams = new URLSearchParams(searchParams);
        newParams.set('view', newMode);
        setSearchParams(newParams);
    };

    const [searchQuery, setSearchQuery] = useState('');
    const statusFilter = searchParams.get('status') || 'active';
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [residenceName, setResidenceName] = useState('Residencia Eldera Demo');
    const { addToast } = useToast();

    // Reset page when status or search changes
    useEffect(() => {
        setPage(1);
    }, [statusFilter, searchQuery]);

    useEffect(() => {
        api.get('/dashboard/stats?source=internal_stats').then(res => {
            if (res.data.residence_name) {
                const name = res.data.residence_name.includes('Demo')
                    ? res.data.residence_name
                    : `${res.data.residence_name} Demo`;
                setResidenceName(name);
            }
        });
    }, []);

    const fetchResidents = async () => {
        setLoading(true);
        try {
            const response = await api.get('/residents/', {
                params: {
                    page,
                    size: 12,
                    q: searchQuery,
                    status: statusFilter
                }
            });
            setResidents(response.data.items);
            setTotalPages(response.data.pages);
        } catch (error) {
            console.error('Error fetching residents:', error);
            addToast('Error al cargar los residentes', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResidents();
    }, [page, statusFilter, searchQuery]);

    const handleSearch = (value) => {
        setSearchQuery(value);
    };

    const handleExport = () => {
        window.print();
    };

    const handleStatusChange = (newStatus) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('status', newStatus);
        newParams.set('page', '1');
        setSearchParams(newParams);
    };

    const handleAddResident = async (formData) => {
        setIsSubmitting(true);
        try {
            await api.post('/residents/', formData);
            addToast('Residente añadido correctamente', 'success');
            setIsFormOpen(false);
            fetchResidents();
        } catch (error) {
            console.error('Error adding resident:', error);
            addToast('Error al añadir el residente', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const searchAndToggleControls = (isHeader = false) => {
        if (isHeader) {
            return {
                residenceName,
                customContent: (
                    <div className="flex items-center gap-3 w-full">
                        {/* Search Bar */}
                        <div className="flex-1 max-w-md relative group">
                            <div className="flex items-center rounded-xl h-9 md:h-10 transition-all bg-white/10 backdrop-blur-md border border-white/30 focus-within:border-white focus-within:bg-white/20 shadow-md">
                                <Search className={`w-4 h-4 ml-3 shrink-0 ${searchQuery ? 'text-white' : 'text-blue-100'}`} />
                                <input
                                    type="text"
                                    placeholder="Nombre o habitación..."
                                    value={searchQuery}
                                    className="bg-transparent border-none focus:ring-0 outline-none text-[10px] md:text-xs text-white placeholder:text-blue-100/50 font-black px-2 w-full"
                                    onChange={(e) => handleSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Export Button (Only in List View) */}
                        {viewMode === 'list' && (
                            <button
                                onClick={handleExport}
                                className="h-10 w-10 md:h-12 md:w-12 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-all shadow-sm flex items-center justify-center shrink-0"
                                title="Imprimir Listado"
                            >
                                <Printer className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
                            </button>
                        )}

                        {/* View Toggles */}
                        <div className="flex items-center bg-blue-700/30 p-0.5 rounded-xl border border-blue-400/20 h-9 md:h-10">
                            <button
                                onClick={() => {
                                    const newParams = new URLSearchParams(searchParams);
                                    newParams.set('view', 'cards');
                                    setSearchParams(newParams);
                                }}
                                className={`p-1.5 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-white text-blue-600 shadow-sm' : 'text-blue-100 hover:bg-white/10'}`}
                            >
                                <LayoutGrid className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                            <button
                                onClick={() => {
                                    const newParams = new URLSearchParams(searchParams);
                                    newParams.set('view', 'list');
                                    setSearchParams(newParams);
                                }}
                                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-blue-100 hover:bg-white/10'}`}
                            >
                                <List className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                        </div>
                    </div>
                )
            };
        }

        return (
            <div className="flex flex-col gap-4 w-full">
                {/* Status Tabs */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 overflow-x-auto no-scrollbar">
                    {[
                        { id: 'active', label: 'Activos', color: 'blue' },
                        { id: 'hospitalized', label: 'Hospitalizados', color: 'amber' },
                        { id: 'inactive', label: 'Bajas', color: 'slate' },
                        { id: 'deceased', label: 'Defunciones', color: 'rose' },
                        { id: 'all', label: 'Todos', color: 'indigo' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => handleStatusChange(tab.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                                statusFilter === tab.id 
                                ? `bg-white text-${tab.color}-600 shadow-sm border border-${tab.color}-200` 
                                : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center rounded-xl overflow-hidden h-11 transition-all bg-white shadow-md focus-within:border-blue-400">
                        <Search className="w-4 h-4 ml-3 shrink-0 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar residente..."
                            value={searchQuery}
                            className="flex-1 px-2 py-2 bg-transparent border-none focus:ring-0 outline-none text-sm text-slate-700 placeholder:text-slate-400 font-medium"
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={toggleViewMode}
                        className="w-11 h-11 rounded-xl flex items-center justify-center bg-white border border-slate-200 text-slate-600 shadow-sm active:bg-slate-50"
                    >
                        {viewMode === 'cards' ? <List className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        );
    };



    return (
        <DashboardLayout 
            title="Gestión de Residentes" 
            headerContent={searchAndToggleControls(true)}
        >
            <style>{`
                @media print {
                    @page { margin: 1.5cm; size: A4; }
                    body { background: white !important; }
                    .print\:hidden, nav, header, aside, .dashboard-sidebar, .dashboard-header { display: none !important; }
                    main { padding: 0 !important; margin: 0 !important; }
                    .shadow-sm, .shadow-md, .shadow-lg { box-shadow: none !important; }
                    .bg-white { background: white !important; }
                }
            `}</style>
            
            <div className="p-4 md:p-8">

                {/* Mobile Controls */}
                <div className="md:hidden mb-6">
                    {searchAndToggleControls(false)}
                </div>



                {/* Residents List/Grid */}
                <ResidentList 
                    residents={residents} 
                    loading={loading} 
                    viewMode={viewMode}
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                />


            </div>


            {/* Modal de Alta */}
            {isFormOpen && (
                <ResidentFormExtended
                    onClose={() => setIsFormOpen(false)}
                    onSubmit={handleAddResident}
                    isSubmitting={isSubmitting}
                />
            )}


        </DashboardLayout>
    );
};

export default ResidentsPage;
