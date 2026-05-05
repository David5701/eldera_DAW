import React, { useState } from 'react';
import { Plus, Trash2, Edit2, AlertCircle, Bandage } from 'lucide-react';

export const WoundManager = ({ wounds = [], onChange }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [currentWound, setCurrentWound] = useState({
        type: 'upp',
        location: '',
        grade: '',
        size: '',
        cure_type: '',
        frequency: '',
        description: ''
    });

    const handleAdd = () => {
        setIsAdding(true);
        setEditingId(null);
        setCurrentWound({
            type: 'upp',
            location: '',
            grade: '',
            size: '',
            cure_type: '',
            frequency: '',
            description: ''
        });
    };

    const handleSave = () => {
        if (!currentWound.location || !currentWound.type) return;

        const newWound = {
            ...currentWound,
            id: editingId || crypto.randomUUID(),
            start_date: new Date().toISOString()
        };

        const newList = editingId
            ? wounds.map(w => w.id === editingId ? newWound : w)
            : [...wounds, newWound];

        onChange(newList);
        setIsAdding(false);
        setEditingId(null);
    };

    const handleDelete = (id) => {
        onChange(wounds.filter(w => w.id !== id));
    };

    const handleEdit = (wound) => {
        setCurrentWound(wound);
        setEditingId(wound.id);
        setIsAdding(true);
    };

    return (
        <div className="space-y-4 px-1 md:px-0">
            <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-700 flex items-center gap-2">
                    <Bandage className="w-5 h-5 text-rose-500" />
                    Registro de Heridas y Curas
                </h4>
                <button
                    type="button"
                    onClick={handleAdd}
                    className="text-sm bg-rose-50 text-rose-600 px-3 py-1 rounded-lg font-bold border border-rose-200 hover:bg-rose-100"
                >
                    + Nueva Herida
                </button>
            </div>

            {wounds.length === 0 && !isAdding && (
                <p className="text-sm text-slate-400 italic text-center p-4 border border-dashed rounded-lg">
                    No hay heridas registradas.
                </p>
            )}

            {/* List */}
            <div className="grid gap-3">
                {wounds.map(wound => (
                    <div key={wound.id} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${wound.type === 'upp' ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'
                                    }`}>
                                    {wound.type === 'upp' ? `UPP Grado ${wound.grade}` : wound.type}
                                </span>
                                <span className="font-bold text-slate-700">{wound.location}</span>
                            </div>
                            <p className="text-sm text-slate-600">
                                <span className="font-semibold">Cura:</span> {wound.cure_type} ({wound.frequency})
                            </p>
                        </div>
                        <div className="flex gap-1">
                            <button type="button" onClick={() => handleEdit(wound)} className="p-1.5 text-slate-400 hover:text-blue-500 rounded hover:bg-blue-50">
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button type="button" onClick={() => handleDelete(wound.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded hover:bg-red-50">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Editor Modal/Form */}
            {isAdding && (
                <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-in fade-in zoom-in-95">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Tipo</label>
                            <select
                                value={currentWound.type}
                                onChange={e => setCurrentWound({ ...currentWound, type: e.target.value })}
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                            >
                                <option value="upp">Úlcera por Presión (UPP)</option>
                                <option value="vascular">Úlcera Vascular</option>
                                <option value="quirurgica">Herida Quirúrgica</option>
                                <option value="traumatica">Traumática</option>
                                <option value="otra">Otra</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Localización</label>
                            <input
                                type="text"
                                value={currentWound.location}
                                onChange={e => setCurrentWound({ ...currentWound, location: e.target.value })}
                                placeholder="Ej: Sacro, Talón Dcho..."
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                            />
                        </div>
                    </div>

                    {currentWound.type === 'upp' && (
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Grado (Estadio)</label>
                            <select
                                value={currentWound.grade}
                                onChange={e => setCurrentWound({ ...currentWound, grade: e.target.value })}
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                            >
                                <option value="">Seleccione...</option>
                                <option value="1">Grado I (Eritema)</option>
                                <option value="2">Grado II (Dermis)</option>
                                <option value="3">Grado III (Subcutáneo)</option>
                                <option value="4">Grado IV (Músculo/Hueso)</option>
                                <option value="no_estadiable">No Estadiable</option>
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Protocolo de Cura (Material y Procedimiento)</label>
                        <textarea
                            value={currentWound.cure_type}
                            onChange={e => setCurrentWound({ ...currentWound, cure_type: e.target.value })}
                            placeholder="Ej: Lavado SF + Hidrogel + Espuma..."
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm h-20"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Frecuencia</label>
                            <select
                                value={currentWound.frequency}
                                onChange={e => setCurrentWound({ ...currentWound, frequency: e.target.value })}
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                            >
                                <option value="">Seleccione...</option>
                                <option value="24h">Cada 24h (Diaria)</option>
                                <option value="48h">Cada 48h</option>
                                <option value="72h">Cada 72h</option>
                                <option value="semanal">Semanal</option>
                                <option value="sos">A demanda (Si precisa)</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={handleSave}
                            className="flex-1 bg-rose-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-rose-700"
                        >
                            Guardar Herida
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsAdding(false)}
                            className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-lg font-bold text-sm hover:bg-slate-200"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WoundManager;
