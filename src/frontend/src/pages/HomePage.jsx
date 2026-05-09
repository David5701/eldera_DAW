import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api/axios';
import {
    Users,
    BedDouble,
    AlertCircle,
    FileText,
    Activity,
    TrendingUp,
    Calendar,
    Syringe,
    ClipboardList,
    Ambulance,
    Skull,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GeneralFollowups from '../components/GeneralFollowups';

const ResidentStatusCarousel = ({ stats, navigate }) => {
    const slides = [
        {
            title: 'Residentes Activos',
            value: stats.activeResidents,
            subtitle: `${stats.occupancy}% Ocupación`,
            icon: Users,
            color: 'indigo',
            cardLink: '/residents?view=cards&status=active'
        },
        {
            title: 'Hospitalizados',
            value: stats.hospitalized,
            subtitle: 'En centro externo',
            icon: Ambulance,
            color: 'amber',
            cardLink: '/residents?view=cards&status=hospitalized',
            actionText: 'Ver Todos',
            actionLink: '/hospitalized'
        },
        {
            title: 'Bajas Temporales',
            value: stats.inactive,
            subtitle: 'Ausencias en curso',
            icon: Calendar,
            color: 'blue',
            cardLink: '/residents?view=cards&status=inactive',
            actionText: 'Ver Todos',
            actionLink: '/residents?view=cards&status=inactive'
        },
        {
            title: 'Defunciones',
            value: stats.deceased,
            subtitle: 'Registro histórico',
            icon: Skull,
            color: 'rose',
            cardLink: '/residents?view=cards&status=deceased',
            actionText: 'Ver Todos',
            actionLink: '/residents?view=cards&status=deceased'
        },
        {
            title: 'Residentes Totales',
            value: stats.totalResidents,
            subtitle: 'Histórico Completo',
            icon: Users,
            color: 'slate',
            cardLink: '/residents?view=cards&status=all'
        }
    ];

    const colorMap = {
        indigo: 'bg-indigo-50 text-indigo-600',
        amber: 'bg-amber-50 text-amber-600',
        blue: 'bg-blue-50 text-blue-600',
        rose: 'bg-rose-50 text-rose-600',
        slate: 'bg-slate-50 text-slate-600',
    };
    const buttonMap = {
        indigo: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200',
        amber: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
        blue: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
        rose: 'bg-rose-100 text-rose-700 hover:bg-rose-200',
        slate: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    };

    const scrollRef = useRef(null);
    const [currentIndex, setCurrentIndex] = useState(() => {
        const saved = sessionStorage.getItem('dashboardCarouselIndex');
        return saved ? parseInt(saved, 10) : 0;
    });

    useEffect(() => {
        if (!scrollRef.current) return;

        // Pequeño timeout para asegurar que el DOM ha calculado su width completo
        const timer = setTimeout(() => {
            if (scrollRef.current) {
                const width = scrollRef.current.clientWidth;
                if (width > 0) {
                    scrollRef.current.scrollTo({ left: width * currentIndex, behavior: 'instant' });
                }
            }
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    const scrollToIndex = (dir) => {
        if (!scrollRef.current) return;
        const width = scrollRef.current.clientWidth;
        const newIndex = dir === 'next'
            ? Math.min(currentIndex + 1, slides.length - 1)
            : Math.max(currentIndex - 1, 0);

        scrollRef.current.scrollTo({ left: width * newIndex, behavior: 'smooth' });
        setCurrentIndex(newIndex);
        sessionStorage.setItem('dashboardCarouselIndex', newIndex);
    };

    const handleScroll = (e) => {
        const width = e.target.clientWidth;
        if (width === 0) return;
        const index = Math.round(e.target.scrollLeft / width);
        if (index !== currentIndex) {
            setCurrentIndex(index);
            sessionStorage.setItem('dashboardCarouselIndex', index);
        }
    };

    return (
        <div className="relative group col-span-1 sm:col-span-2 lg:col-span-1 w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col z-10" style={{ minHeight: '140px' }}>
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar w-full h-full pb-0"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {slides.map((slide, idx) => {
                    const Icon = slide.icon;
                    return (
                        <div
                            key={idx}
                            onClick={() => navigate(slide.cardLink || slide.actionLink)}
                            className="w-full shrink-0 snap-center p-6 flex flex-col justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-sm ${colorMap[slide.color]}`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div className="flex gap-1.5" aria-hidden="true">
                                    {slides.map((_, dotIdx) => (
                                        <div key={dotIdx} className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${idx === dotIdx ? 'bg-slate-800' : 'bg-slate-200'}`} />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">
                                    {slide.title}
                                </h3>
                                <div className="flex gap-2 items-end justify-between">
                                    <div className="flex-1">
                                        <p className="text-3xl font-black text-slate-900 mb-0 leading-none">
                                            {slide.value}
                                        </p>
                                        <p className="text-xs text-slate-400 font-medium mt-1">
                                            {slide.subtitle}
                                        </p>
                                    </div>
                                    {slide.actionText && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); navigate(slide.actionLink); }}
                                            className={`px-4 py-2 rounded-lg text-sm font-black shadow-sm transition-transform active:scale-95 border border-transparent hover:border-current/20 ${buttonMap[slide.color]}`}
                                        >
                                            {slide.actionText}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Nav Arrows (Desktop only) */}
            {currentIndex > 0 && (
                <button
                    onClick={(e) => { e.stopPropagation(); scrollToIndex('prev'); }}
                    className="hidden lg:flex absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 shadow-md border border-slate-100 p-1.5 rounded-full text-slate-400 hover:text-slate-800 opacity-0 group-hover:opacity-100 transition-all z-20 hover:scale-110"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
            )}
            {currentIndex < slides.length - 1 && (
                <button
                    onClick={(e) => { e.stopPropagation(); scrollToIndex('next'); }}
                    className="hidden lg:flex absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 shadow-md border border-slate-100 p-1.5 rounded-full text-slate-400 hover:text-slate-800 opacity-0 group-hover:opacity-100 transition-all z-20 hover:scale-110"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            )}
        </div>
    );
};

export default function HomePage() {
    const [isFollowupsOpen, setIsFollowupsOpen] = useState(false);
    const [stats, setStats] = useState({
        totalResidents: 0,
        activeResidents: 0,
        inactive: 0,
        deceased: 0,
        occupancy: 0,
        hospitalized: 0,
        activeAlerts: 0,
        pendingTasks: 0,
        residenceName: ''
    });

    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const residentsRes = await api.get('/residents/?size=100&source=dashboard_widget');
                let residents = residentsRes.data.items || [];
                const total = residentsRes.data.total || residents.length;

                // Get page 2 if needed (for accurate inactive/deceased counts)
                if (total > 100) {
                    const response2 = await api.get('/residents/?size=100&page=2&source=dashboard_widget');
                    residents = [...residents, ...(response2.data.items || [])];
                }

                const hospitalized = residents.filter(r => r.status === 'hospitalized' || r.is_hospitalized).length;
                const active = residents.filter(r => r.status === 'active').length;
                const inactive = residents.filter(r => r.status === 'inactive').length;
                const deceased = residents.filter(r => r.status === 'deceased').length;

                const [statsRes] = await Promise.all([
                    api.get('/dashboard/stats')
                ]);

                setStats({
                    totalResidents: total,
                    activeResidents: active,
                    occupancy: Math.round(((active + hospitalized) / 120) * 100),
                    hospitalized: hospitalized,
                    inactive: inactive,
                    deceased: deceased,
                    activeAlerts: statsRes.data.active_alerts || 0,
                    pendingTasks: statsRes.data.pending_tasks || 0,
                    followups_today: statsRes.data.followups_today || 0,
                    dynamic_lists_count: statsRes.data.dynamic_lists_count || 8,
                    residenceName: statsRes.data.residence_name || 'Residencia Eldera'
                });

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const kpis = [
        {
            title: 'Evolutivos',
            value: stats.followups_today ?? 0,
            subtitle: `${stats.followups_today === 1 ? 'registro hoy' : 'registros hoy'}`,
            icon: FileText,
            color: 'blue',
            action: () => setIsFollowupsOpen(true),
            isAction: true
        },
        {
            title: 'Listados',
            value: stats.dynamic_lists_count ?? 8,
            subtitle: 'Informes Globales',
            icon: ClipboardList,
            color: 'emerald',
            link: '/lists',
            isAction: true
        }
    ];

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-[calc(100vh-100px)]">
                    <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (isFollowupsOpen) {
        return (
            <DashboardLayout>
                <GeneralFollowups onBack={() => setIsFollowupsOpen(false)} />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout headerContent={stats.residenceName ? { residenceName: stats.residenceName } : undefined}>
            <div className="flex flex-col gap-4 md:gap-8 pb-20 pt-2 md:pt-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
                    {/* Tarjeta de Estados de Residentes (Carrusel Modular) */}
                    <ResidentStatusCarousel stats={stats} navigate={navigate} />

                    {/* Otras Tarjetas Rápidas */}
                    {kpis.map((kpi, idx) => {
                        const Icon = kpi.icon;
                        const colorClasses = {
                            indigo: 'bg-indigo-50 text-indigo-600',
                            rose: 'bg-rose-50 text-rose-600',
                            amber: 'bg-amber-50 text-amber-600',
                            emerald: 'bg-emerald-50 text-emerald-600',
                            blue: 'bg-blue-50 text-blue-600',
                        }[kpi.color];

                        return (
                            <div
                                key={idx}
                                onClick={() => {
                                    if (kpi.action) kpi.action();
                                    else if (kpi.link) navigate(kpi.link);
                                }}
                                className={`w-full bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all ${kpi.link || kpi.action ? 'cursor-pointer hover:border-indigo-300 group' : ''}`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`w-12 h-12 rounded-xl ${colorClasses} flex items-center justify-center`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">
                                        {kpi.title}
                                    </h3>
                                    {(kpi.value !== undefined && kpi.value !== null && kpi.value !== '') && (
                                        <p className="text-3xl font-black text-slate-900 mb-1">
                                            {kpi.value}
                                        </p>
                                    )}
                                    <p className="text-xs text-slate-400 font-medium">
                                        {kpi.subtitle}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </DashboardLayout>
    );
}

