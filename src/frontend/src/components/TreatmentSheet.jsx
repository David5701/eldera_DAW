import React, { useState, useEffect } from 'react';
import {
    Plus,
    Syringe,
    Clock,
    Trash2,
    AlertCircle,
    CheckCircle2,
    Calendar,
    Activity
} from 'lucide-react';
import api from '../api/axios';
import Button from './Button';
import Card from './Card';

const TreatmentSheet = ({ residentId, addToast }) => {
    const [treatments, setTreatments] = useState([]);

    const [isAdding, setIsAdding] = useState(false);
    const [newTreatment, setNewTreatment] = useState({
        drug_name: '',
        dose: '',
        route: 'Oral',
        schedule_type: 'morning',
        is_injectable: false,
        instructions: '',
        start_date: new Date().toISOString().split('T')[0],
        is_active: true
    });

    // fetchTreatments movido dentro de useEffect

    useEffect(() => {
        const fetchTreatments = async () => {
            try {
                const response = await api.get(`/residents/${residentId}/treatments`);
                setTreatments(response.data);
            } catch (error) {
                console.error("Error fetching treatments:", error);
                addToast("Error al cargar tratamientos", "error");
            }
        };
        fetchTreatments();
    }, [residentId, addToast]);

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/residents/${residentId}/treatments`, newTreatment);
            addToast("Tratamiento añadido correctamente", "success");
            // Actualización optimista
            setTreatments(prev => [...prev, { ...newTreatment, id: Date.now() }]);
        } catch {
            addToast("Error al añadir tratamiento", "error");
        }
    }

    const scheduleLabels = {
        morning: 'Mañana',
        noon: 'Mediodía',
        evening: 'Tarde',
        night: 'Noche',
        as_needed: 'Si precisa'
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Hoja de Tratamiento</h3>
                <Button onClick={() => setIsAdding(true)} className="bg-emerald-600 hover:bg-emerald-700 text-xs py-2 shadow-sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Añadir Fármaco
                </Button>
            </div>

            {isAdding && (
                <Card className="p-6 border-indigo-200 bg-indigo-50/30">
                    <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Medicamento</label>
                            <input
                                required
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold"
                                value={newTreatment.drug_name}
                                onChange={e => setNewTreatment({ ...newTreatment, drug_name: e.target.value })}
                                placeholder="Ej: Paracetamol, Enoxaparina..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dosis</label>
                            <input
                                required
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold"
                                value={newTreatment.dose}
                                onChange={e => setNewTreatment({ ...newTreatment, dose: e.target.value })}
                                placeholder="Ej: 1g, 40mg, 1 comprimido"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vía</label>
                            <select
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold"
                                value={newTreatment.route}
                                onChange={e => setNewTreatment({ ...newTreatment, route: e.target.value })}
                            >
                                <option value="Oral">Oral</option>
                                <option value="SC">Subcutánea (SC)</option>
                                <option value="IM">Intramuscular (IM)</option>
                                <option value="IV">Intravenosa (IV)</option>
                                <option value="Tópica">Tópica</option>
                                <option value="Inhalada">Inhalada</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pauta</label>
                            <select
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold"
                                value={newTreatment.schedule_type}
                                onChange={e => setNewTreatment({ ...newTreatment, schedule_type: e.target.value })}
                            >
                                <option value="morning">Desayuno (Mañana)</option>
                                <option value="noon">Comida (Mediodía)</option>
                                <option value="evening">Merienda (Tarde)</option>
                                <option value="night">Cena (Noche)</option>
                                <option value="as_needed">Si precisa (S.O.S)</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-3 py-2">
                            <input
                                type="checkbox"
                                id="is_injectable"
                                checked={newTreatment.is_injectable}
                                onChange={e => setNewTreatment({ ...newTreatment, is_injectable: e.target.checked })}
                                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                            <label htmlFor="is_injectable" className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                                <Syringe className="w-4 h-4 text-rose-500" />
                                Es Inyectable
                            </label>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Instrucciones</label>
                            <textarea
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium h-20"
                                value={newTreatment.instructions}
                                onChange={e => setNewTreatment({ ...newTreatment, instructions: e.target.value })}
                                placeholder="Notas adicionales, ayunas, dilución..."
                            />
                        </div>
                        <div className="flex justify-end gap-2 md:col-span-2">
                            <Button type="button" variant="ghost" onClick={() => setIsAdding(false)} className="text-xs">Cancelar</Button>
                            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-xs shadow-md">Guardar Tratamiento</Button>
                        </div>
                    </form>
                </Card>
            )}

            <div className="grid grid-cols-1 gap-4">
                {treatments.length === 0 ? (
                    <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-12 text-center">
                        <Activity className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No hay tratamientos activos</p>
                    </div>
                ) : (
                    treatments.map(t => (
                        <div key={t.id} className={`bg-white border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-start gap-4 ${t.is_injectable ? 'border-rose-100 bg-rose-50/10' : 'border-slate-100'}`}>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${t.is_injectable ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                {t.is_injectable ? <Syringe className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">{t.drug_name}</h4>
                                        <div className="flex gap-2 mt-1">
                                            <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                                                {t.dose}
                                            </span>
                                            <span className="text-[10px] font-black uppercase bg-slate-50 text-[#0F172A] px-2 py-0.5 rounded border border-slate-200">
                                                {t.route}
                                            </span>
                                            {t.is_injectable && (
                                                <span className="text-[10px] font-black uppercase bg-rose-100 text-rose-700 px-2 py-0.5 rounded border border-rose-200">
                                                    Inyectable
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${t.schedule_type === 'as_needed' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                            }`}>
                                            {scheduleLabels[t.schedule_type]}
                                        </span>
                                    </div>
                                </div>
                                {t.instructions && (
                                    <p className="mt-3 text-xs text-slate-500 font-medium italic border-l-2 border-slate-200 pl-3">
                                        "{t.instructions}"
                                    </p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TreatmentSheet;
