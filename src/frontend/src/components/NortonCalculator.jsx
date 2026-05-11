import React, { useState } from 'react';
import { Calculator, Check, X, ClipboardList } from 'lucide-react';
import Button from './Button';

const NORTON_SCALES = [
    {
        id: 'physical',
        label: 'Estado Físico General',
        options: [
            { value: 4, label: '4. Bueno', desc: 'Nutrición correcta, hidratado, temperatura normal.' },
            { value: 3, label: '3. Regular', desc: 'Problemas leves de salud.' },
            { value: 2, label: '2. Malo', desc: 'Deterioro general importante.' },
            { value: 1, label: '1. Muy Malo', desc: 'Situación crítica, caquexia.' }
        ]
    },
    {
        id: 'mental',
        label: 'Estado Mental',
        options: [
            { value: 4, label: '4. Alerta', desc: 'Orientado en tiempo y espacio.' },
            { value: 3, label: '3. Apático', desc: 'Pasivo, pero atento a órdenes.' },
            { value: 2, label: '2. Confuso', desc: 'Desorientado intermitente/permanente.' },
            { value: 1, label: '1. Estuporoso / Coma', desc: 'Desconectado del medio.' }
        ]
    },
    {
        id: 'activity',
        label: 'Actividad',
        options: [
            { value: 4, label: '4. Ambulante', desc: 'Camina solo/con ayuda técnica normal.' },
            { value: 3, label: '3. Camina con Ayuda', desc: 'Necesita otra persona.' },
            { value: 2, label: '2. Sentado', desc: 'No camina. Permanece en silla.' },
            { value: 1, label: '1. Encamado', desc: 'Confinado a cama 24h.' }
        ]
    },
    {
        id: 'mobility',
        label: 'Movilidad',
        options: [
            { value: 4, label: '4. Total', desc: 'Se mueve voluntariamente.' },
            { value: 3, label: '3. Disminuida', desc: 'Ligeramente limitada.' },
            { value: 2, label: '2. Muy Limitada', desc: 'Necesita ayuda para cambios posturales.' },
            { value: 1, label: '1. Inmóvil', desc: 'Dependencia total para moverse.' }
        ]
    },
    {
        id: 'incontinence',
        label: 'Incontinencia',
        options: [
            { value: 4, label: '4. Ninguna', desc: 'Control total de esfínteres.' },
            { value: 3, label: '3. Ocasional', desc: 'Fugas esporádicas.' },
            { value: 2, label: '2. Urinaria o Fecal', desc: 'Habitual de uno de los dos.' },
            { value: 1, label: '1. Urinaria y Fecal', desc: 'Doble incontinencia habitual.' }
        ]
    }
];

const NortonCalculator = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [scores, setScores] = useState({
        physical: 4,
        mental: 4,
        activity: 4,
        mobility: 4,
        incontinence: 4
    });

    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

    const getRiskLabel = (score) => {
        if (score <= 12) return { text: 'Alto Riesgo', color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200' };
        if (score <= 14) return { text: 'Riesgo Medio', color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-200' };
        return { text: 'Riesgo Bajo / Mínimo', color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200' };
    };

    const risk = getRiskLabel(totalScore);

    const handleSave = () => {
        onChange({
            target: {
                name: 'norton_score',
                value: totalScore,
                type: 'number'
            }
        });
        setIsOpen(false);
    };

    const handleSelect = (category, val) => {
        setScores(prev => ({ ...prev, [category]: val }));
    };

    return (
        <div className="w-full">
            <label className="block text-sm font-medium text-slate-700 mb-1">Escala Norton (Riesgo UPP)</label>

            {!isOpen ? (
                <div
                    onClick={() => setIsOpen(true)}
                    className={`cursor-pointer w-full px-4 py-3 border rounded-xl flex items-center justify-between transition-all hover:shadow-md ${value ? 'border-slate-300 bg-white' : 'border-dashed border-slate-300 bg-slate-50'}`}
                >
                    {value ? (
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${risk.bg} ${risk.color}`}>
                                {value}
                            </div>
                            <div>
                                <p className={`font-bold ${risk.color}`}>{risk.text}</p>
                                <p className="text-xs text-slate-500">Escala Norton (5-20)</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-slate-500">
                            <ClipboardList className="w-5 h-5" />
                            <span>Calcular Norton</span>
                        </div>
                    )}
                </div>
            ) : (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <ClipboardList className="w-5 h-5 text-indigo-600" /> Calculadora Norton
                            </h3>
                            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {NORTON_SCALES.map((scale) => (
                                <div key={scale.id} className="space-y-2">
                                    <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wide border-b border-slate-100 pb-1">{scale.label}</h4>
                                    <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                                        {scale.options.map((opt) => (
                                            <button
                                                type="button"
                                                key={opt.value}
                                                onClick={() => handleSelect(scale.id, opt.value)}
                                                className={`text-left p-2 md:p-3 rounded-xl border transition-all ${scores[scale.id] === opt.value
                                                    ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500 shadow-sm'
                                                    : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-center mb-0.5">
                                                    <span className={`font-black text-[10px] md:text-sm uppercase tracking-tight leading-none ${scores[scale.id] === opt.value ? 'text-indigo-700' : 'text-slate-700'}`}>
                                                        {opt.label}
                                                    </span>
                                                    {scores[scale.id] === opt.value && <Check className="w-3 h-3 md:w-4 md:h-4 text-indigo-600" />}
                                                </div>
                                                <p className="text-[9px] md:text-xs text-slate-500 leading-tight opacity-80">{opt.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-xs text-slate-500 uppercase font-bold">Total Norton</p>
                                    <p className="text-2xl font-black text-slate-800">{totalScore}</p>
                                </div>
                                <div className={`px-3 py-1 rounded-lg border ${getRiskLabel(totalScore).bg} ${getRiskLabel(totalScore).border}`}>
                                    <p className={`text-sm font-bold ${getRiskLabel(totalScore).color}`}>
                                        {getRiskLabel(totalScore).text}
                                    </p>
                                </div>
                            </div>
                            <Button variant="primary" onClick={handleSave} icon={Check}>
                                Guardar Norton
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NortonCalculator;
