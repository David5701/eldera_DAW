import React, { useState } from 'react';
import AppLayout from '../components/AppLayout';
import { AlertCircle, AlertTriangle, Info, Clock, CheckCircle } from 'lucide-react';

export default function Alerts() {
    const [filter, setFilter] = useState('all'); // all, critical, warning, info

    const mockAlerts = [
        {
            id: 1,
            type: 'critical',
            title: 'Caída registrada',
            description: 'María González - Habitación 203',
            time: 'Hace 5 minutos',
            unread: true
        },
        {
            id: 2,
            type: 'warning',
            title: 'Vacuna próxima a vencer',
            description: 'Gripe - Alberto Martínez - Vence en 7 días',
            time: 'Hace 2 horas',
            unread: true
        },
        {
            id: 3,
            type: 'warning',
            title: 'Cita médica mañana',
            description: 'Revisión cardiología - Juan Pérez - 10:00',
            time: 'Hace 4 horas',
            unread: false
        },
        {
            id: 4,
            type: 'info',
            title: 'Cumpleaños próximo',
            description: 'Carmen López cumple 85 años en 3 días',
            time: 'Hace 6 horas',
            unread: false
        },
        {
            id: 5,
            type: 'critical',
            title: 'Constantes fuera de rango',
            description: 'TA elevada - Pedro Sánchez (180/95)',
            time: 'Hace 1 día',
            unread: false
        }
    ];

    const getAlertIcon = (type) => {
        switch (type) {
            case 'critical': return AlertCircle;
            case 'warning': return AlertTriangle;
            case 'info': return Info;
            default: return AlertCircle;
        }
    };

    const getAlertStyles = (type) => {
        switch (type) {
            case 'critical': return 'bg-rose-50 border-rose-200 text-rose-700';
            case 'warning': return 'bg-amber-50 border-amber-200 text-amber-700';
            case 'info': return 'bg-blue-50 border-blue-200 text-blue-700';
            default: return 'bg-slate-50 border-slate-200 text-slate-700';
        }
    };

    const getIconBg = (type) => {
        switch (type) {
            case 'critical': return 'bg-rose-500';
            case 'warning': return 'bg-amber-500';
            case 'info': return 'bg-blue-500';
            default: return 'bg-slate-500';
        }
    };

    const filteredAlerts = filter === 'all'
        ? mockAlerts
        : mockAlerts.filter(alert => alert.type === filter);

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto flex flex-col gap-16">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 text-[#0F172A] rounded-xl flex items-center justify-center border border-slate-200">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            Centro de Alertas
                        </h1>
                        <p className="text-sm text-slate-500 mt-1 font-medium">
                            Gestión centralizada de notificaciones y alertas
                        </p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors shadow-sm">
                        <CheckCircle className="w-4 h-4" />
                        Marcar todo como leído
                    </button>
                </div>

                {/* Filters */}
                <div className="flex gap-2 bg-white border border-slate-200 rounded-xl p-2">
                    {[
                        { id: 'all', label: 'Todas', count: mockAlerts.length },
                        { id: 'critical', label: 'Críticas', count: mockAlerts.filter(a => a.type === 'critical').length },
                        { id: 'warning', label: 'Advertencias', count: mockAlerts.filter(a => a.type === 'warning').length },
                        { id: 'info', label: 'Informativas', count: mockAlerts.filter(a => a.type === 'info').length }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id)}
                            className={`flex-1 px-4 py-2 rounded-lg font-bold text-sm transition-all ${filter === tab.id
                                ? 'bg-[#0F172A] text-white shadow-md'
                                : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            {tab.label}
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${filter === tab.id
                                ? 'bg-white/20'
                                : 'bg-slate-100'
                                }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Alerts List */}
                <div className="space-y-3">
                    {filteredAlerts.map(alert => {
                        const Icon = getAlertIcon(alert.type);
                        return (
                            <div
                                key={alert.id}
                                className={`border rounded-xl p-5 transition-all hover:shadow-md cursor-pointer ${getAlertStyles(alert.type)} ${alert.unread ? 'border-l-4' : ''
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-10 h-10 ${getIconBg(alert.type)} text-white rounded-xl flex items-center justify-center shrink-0`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between gap-4 mb-1">
                                            <h3 className="font-bold text-slate-900">
                                                {alert.title}
                                                {alert.unread && (
                                                    <span className="ml-2 w-2 h-2 bg-emerald-500 rounded-full inline-block"></span>
                                                )}
                                            </h3>
                                            <div className="flex items-center gap-1 text-slate-400 text-xs shrink-0">
                                                <Clock className="w-3 h-3" />
                                                {alert.time}
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-600">
                                            {alert.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Empty State */}
                {filteredAlerts.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                        <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">No hay alertas de este tipo</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
