import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { Activity } from 'lucide-react';

export default function HealthTrendsWidget() {
    // Mock data based on typical nursing home metrics
    const data = [
        { name: 'Tensión Arterial', count: 45, alert: 5 },
        { name: 'Glucemia', count: 32, alert: 3 },
        { name: 'Saturación O2', count: 28, alert: 2 },
        { name: 'Temperatura', count: 15, alert: 0 },
        { name: 'Peso', count: 12, alert: 1 },
    ];

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all h-full">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
                    <Activity className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-black text-slate-900">
                        Actividad de Enfermería (24h)
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                        Registros realizados vs Alertas detectadas
                    </p>
                </div>
            </div>

            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{
                            top: 5,
                            right: 30,
                            left: -20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                        />
                        <Tooltip
                            cursor={{ fill: '#f1f5f9' }}
                            contentStyle={{
                                borderRadius: '12px',
                                border: 'none',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }}
                        />
                        <Bar dataKey="count" name="Registros" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={32} />
                        <Bar dataKey="alert" name="Valores Alterados" fill="#e11d48" radius={[4, 4, 0, 0]} barSize={32} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
