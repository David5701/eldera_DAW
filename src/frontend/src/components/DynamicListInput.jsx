import React, { useState } from 'react';
import { Plus, X, AlertCircle } from 'lucide-react';

export default function DynamicListInput({ items = [], onChange, label }) {
    // Local state for the "new item" inputs
    const [newItem, setNewItem] = useState({
        type: 'disease', // 'disease' or 'surgery'
        name: '',
        year: '',
        status: 'active' // 'active', 'resolved', 'periodic'
    });
    const [error, setError] = useState('');

    const handleAddItem = () => {
        if (!newItem.name.trim()) {
            setError('El nombre es obligatorio');
            return;
        }

        const updatedItems = [...items, { ...newItem, id: Date.now() }];
        onChange(updatedItems);

        // Reset form
        setNewItem({
            type: 'disease',
            name: '',
            year: '',
            status: 'active'
        });
        setError('');
    };

    const handleRemoveItem = (index) => {
        const updatedItems = items.filter((_, i) => i !== index);
        onChange(updatedItems);
    };

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">{label}</label>

            {/* List of existing items */}
            <div className="flex flex-wrap gap-2 mb-2">
                {items.map((item, index) => (
                    <div key={index} className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border
                        ${item.type === 'surgery' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-blue-50 border-blue-200 text-blue-700'}
                    `}>
                        <span className="font-semibold text-xs uppercase px-1.5 py-0.5 rounded-md bg-white/50">
                            {item.type === 'surgery' ? 'CIR' : 'ENF'}
                        </span>
                        <span className="font-medium">{item.name}</span>
                        {item.year && <span className="opacity-75 text-xs">({item.year})</span>}
                        <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="hover:bg-black/10 rounded-full p-0.5 transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}
                {items.length === 0 && <p className="text-sm text-gray-400 italic">Sin antecedentes registrados</p>}
            </div>

            {/* Add new item form */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex flex-wrap gap-2 items-end">
                <div className="w-24">
                    <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Tipo</label>
                    <select
                        value={newItem.type}
                        onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
                        className="w-full text-sm border-gray-300 rounded-md py-1.5 px-2 focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="disease">Enfermedad</option>
                        <option value="surgery">Cirugía</option>
                    </select>
                </div>

                <div className="flex-1 min-w-[120px]">
                    <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Nombre</label>
                    <input
                        type="text"
                        value={newItem.name}
                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                        placeholder="Ej: Apendicitis, Psoriasis..."
                        className="w-full text-sm border-gray-300 rounded-md py-1.5 px-2 focus:ring-1 focus:ring-blue-500"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddItem())}
                    />
                </div>

                <div className="w-20">
                    <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Año</label>
                    <input
                        type="text"
                        value={newItem.year}
                        onChange={(e) => setNewItem({ ...newItem, year: e.target.value })}
                        placeholder="AAAA"
                        className="w-full text-sm border-gray-300 rounded-md py-1.5 px-2 focus:ring-1 focus:ring-blue-500"
                    />
                </div>

                <button
                    type="button"
                    onClick={handleAddItem}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md transition-colors flex items-center justify-center h-[34px] w-[34px]"
                    title="Añadir antecedente"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>
            {error && (
                <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}
