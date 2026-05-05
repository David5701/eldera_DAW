import React from 'react';
import AppLayout from '../components/AppLayout';
import { FileText, Heart, TrendingDown, Skull, Syringe } from 'lucide-react';

export default function Records() {
    const recordTypes = [
        {
            title: 'Caídas',
            icon: TrendingDown,
            description: 'Registro de incidencias y caídas',
            count: '23 este mes',
            color: 'rose'
        },
        {
            title: 'Hospitalizaciones',
            icon: Heart,
            description: 'Ingresos hospitalarios y derivaciones',
            count: '5 activas',
            color: 'orange'
        },
        {
            title: 'Fallecimientos',
            icon: Skull,
            description: 'Registro histórico de fallecimientos',
            count: '2 este año',
            color: 'slate'
        },
        {
            title: 'Vacunación',
            icon: Syringe,
            description: 'Control de vacunas y campañas',
            count: '145 residentes',
            color: 'emerald'
        }
    ];

    const getColorClasses = (color) => {
        const colors = {
            rose: 'bg-rose-50 text-rose-600 group-hover:bg-rose-600',
            orange: 'bg-orange-50 text-orange-600 group-hover:bg-orange-600',
            slate: 'bg-slate-50 text-slate-600 group-hover:bg-slate-600',
            emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600'
        };
        return colors[color] || colors.slate;
    };

    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto flex flex-col gap-16">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                            <FileText className="w-6 h-6" />
                        </div>
                        Registros Especiales
                    </h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium">
                        Gestión de incidencias, hospitalizaciones y registros históricos
                    </p>
                </div>

                {/* Records Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {recordTypes.map((record) => {
                        const Icon = record.icon;
                        return (
                            <div
                                key={record.title}
                                className="bg-white rounded-2xl border border-slate-200 p-8 hover:shadow-lg transition-all cursor-pointer group"
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:text-white transition-colors shrink-0 ${getColorClasses(record.color)}`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-black text-slate-900 mb-2">
                                            {record.title}
                                        </h3>
                                        <p className="text-sm text-slate-500 mb-4">
                                            {record.description}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-indigo-600">
                                                {record.count}
                                            </span>
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                Próximamente →
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Info Banner */}
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
                    <div className="flex gap-4">
                        <div className="w-8 h-8 bg-amber-600 text-white rounded-lg flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-amber-900 mb-1">
                                Digitalización de Registros Excel
                            </h4>
                            <p className="text-sm text-amber-700">
                                Estos módulos digitalizarán los actuales registros en Excel de caídas, hospitalizaciones y fallecimientos,
                                centralizando toda la información y permitiendo análisis y reportes automáticos.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
