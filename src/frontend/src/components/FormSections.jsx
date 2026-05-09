/**
 * FormSections - Reusable section components for ResidentFormExtended
 * Contains all detailed sections for the resident comprehensive assessment
 */
import React from 'react';
import WoundManager from './WoundManager';
import NortonCalculator from './NortonCalculator';

// ==============================================================================
// 4. ACTIVIDAD-EJERCICIO (Gordon Pattern 4)
// ==============================================================================
export const MobilitySection = ({ formData, handleChange }) => (
    <div className="space-y-6">
        <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Movilidad General</h3>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nivel de Movilidad</label>
                    <select
                        name="mobility_level"
                        value={formData.mobility_level}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">Seleccionar...</option>
                        <option value="autonomous">Autónomo</option>
                        <option value="cane">Con bastón</option>
                        <option value="walker">Con andador</option>
                        <option value="wheelchair_manual">Silla de ruedas manual</option>
                        <option value="wheelchair_electric">Silla de ruedas eléctrica</option>
                        <option value="bedridden">Encamado</option>
                    </select>
                </div>
                <div>
                    <NortonCalculator
                        value={formData.norton_score}
                        onChange={handleChange}
                    />
                </div>
            </div>
        </div>

        <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Prótesis y Ayudas Sensoriales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                {/* Dentaduras */}
                <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            name="device_dentures"
                            checked={formData.device_dentures}
                            onChange={handleChange}
                            className="w-5 h-5 text-indigo-600 rounded"
                        />
                        <label className="font-medium text-slate-700">Prótesis Dental</label>
                    </div>

                    {formData.device_dentures && (
                        <div className="ml-7">
                            <label className="block text-sm text-slate-600 mb-1">Tipo</label>
                            <input
                                type="text"
                                name="device_dentures_type"
                                value={formData.device_dentures_type}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm"
                                placeholder="Ej: Completa superior"
                            />
                        </div>
                    )}
                </div>

                {/* Audífonos */}
                <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            name="device_hearing_aids"
                            checked={formData.device_hearing_aids}
                            onChange={handleChange}
                            className="w-5 h-5 text-indigo-600 rounded"
                        />
                        <label className="font-medium text-slate-700">Audífonos</label>
                    </div>

                    {formData.device_hearing_aids && (
                        <div className="ml-7 space-y-2">
                            <div>
                                <label className="block text-sm text-slate-600 mb-1">Lado</label>
                                <select
                                    name="device_hearing_aids_side"
                                    value={formData.device_hearing_aids_side}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm"
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="left">Izquierdo</option>
                                    <option value="right">Derecho</option>
                                    <option value="both">Ambos</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 mb-1">Marca</label>
                                <input
                                    type="text"
                                    name="device_hearing_aids_brand"
                                    value={formData.device_hearing_aids_brand}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Gafas */}
                <div className="col-span-1 md:col-span-2 flex items-center space-x-6 pt-2">
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            name="device_glasses"
                            checked={formData.device_glasses}
                            onChange={handleChange}
                            className="w-5 h-5 text-indigo-600 rounded"
                        />
                        <label className="font-medium text-slate-700">Usa Gafas</label>
                    </div>
                    {/* Progressive glasses removed as requested */}
                </div>
            </div>
        </div>

        <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Oxigenoterapia</h3>
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200">
                <div className="flex items-center space-x-2 mb-4">
                    <input
                        type="checkbox"
                        name="device_oxygen"
                        checked={formData.device_oxygen}
                        onChange={handleChange}
                        className="w-5 h-5 text-indigo-600 rounded"
                    />
                    <label className="font-medium text-slate-800">Precisa Oxígeno</label>
                </div>

                {formData.device_oxygen && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-7">
                        <div>
                            <label className="block text-sm text-slate-700 mb-1">Tipo Dispositivo</label>
                            <select
                                name="device_oxygen_type"
                                value={formData.device_oxygen_type}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                            >
                                <option value="">Seleccionar...</option>
                                <option value="home">Concentrador</option>
                                <option value="portable">Portátil / Bombona</option>
                                <option value="cpap">CPAP/BIPAP</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-slate-700 mb-1">Flujo (L/min)</label>
                            <input
                                type="number"
                                step="0.5"
                                name="device_oxygen_flow"
                                value={formData.device_oxygen_flow || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-700 mb-1">Horas al día</label>
                            <input
                                type="number"
                                name="device_oxygen_hours"
                                value={formData.device_oxygen_hours || ''}
                                onChange={handleChange}
                                min="0" max="24"
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>

        <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Dispositivos Invasivos</h3>
            <div className="bg-red-50 p-4 rounded-2xl border border-red-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    {[
                        { key: 'device_nasogastric', label: 'Sonda Nasogástrica' },
                        { key: 'device_veis', label: 'VEIS (Vía Subcutánea)' },
                        { key: 'device_catheter', label: 'Sonda Vesical' },
                        { key: 'device_peg', label: 'PEG (Gastrostomía)' },
                        { key: 'device_tracheostomy', label: 'Traqueostomía' }
                    ].map(({ key, label }) => (
                        <label key={key} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-red-100 rounded transition-colors">
                            <input
                                type="checkbox"
                                name={key}
                                checked={formData[key]}
                                onChange={handleChange}
                                className="w-4 h-4 text-red-600 rounded"
                            />
                            <span className="text-slate-700 font-medium">{label}</span>
                        </label>
                    ))}
                </div>
                {(formData.device_nasogastric || formData.device_veis || formData.device_catheter || formData.device_peg || formData.device_tracheostomy) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-red-200 pt-4">
                        <div>
                            <label className="block text-sm text-slate-700 mb-1">Tipo Específico</label>
                            <input
                                type="text"
                                name="device_invasive_type"
                                value={formData.device_invasive_type}
                                onChange={handleChange}
                                placeholder="Ej: Silicona, Calibre 16..."
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-700 mb-1">Fecha Último Cambio</label>
                            <input
                                type="date"
                                name="device_invasive_change_date"
                                value={formData.device_invasive_change_date || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
);

// ==============================================================================
// 2. NUTRICIONAL-METABÓLICO (Gordon Pattern 2)
// ==============================================================================
export const NutritionSection = ({ formData, handleChange }) => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800">Perfil Nutricional</h3>
                <div className="bg-green-50 p-4 rounded-2xl border border-green-200 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Dieta (Selección Múltiple)</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white/50 p-3 rounded-xl border border-green-100">
                            {[
                                { key: 'diet_normal', label: 'Basal / Normal' },
                                { key: 'diet_diabetic', label: 'Diabética' },
                                { key: 'diet_low_salt', label: 'Hiposódica (Baja sal)' },
                                { key: 'diet_astringent', label: 'Astringente' },
                                { key: 'diet_protection', label: 'Protección Gástrica (Blanda)' }
                            ].map(({ key, label }) => (
                                <label key={key} className="flex items-center space-x-2 cursor-pointer p-1.5 hover:bg-green-100/50 rounded transition-colors">
                                    <input
                                        type="checkbox"
                                        name={key}
                                        checked={formData[key] || false}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                                    />
                                    <span className="text-sm text-slate-700">{label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* TEXTURE / CONSISTENCY SELECTOR */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Textura Alimentos (Comida)</label>
                        <div className="flex flex-wrap gap-4 bg-white/50 p-3 rounded-xl border border-green-100">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="diet_texture_group"
                                    value="normal"
                                    checked={!formData.diet_soft && !formData.diet_pureed && !formData.diet_liquid}
                                    onChange={handleChange}
                                    className="text-green-600 focus:ring-green-500"
                                />
                                <span className="text-sm text-slate-700">Normal</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="diet_texture_group"
                                    value="soft"
                                    checked={formData.diet_soft && !formData.diet_pureed}
                                    onChange={handleChange}
                                    className="text-green-600 focus:ring-green-500"
                                />
                                <span className="text-sm text-slate-700">Fácil Masticación</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="diet_texture_group"
                                    value="pureed"
                                    checked={formData.diet_pureed}
                                    onChange={handleChange}
                                    className="text-green-600 focus:ring-green-500"
                                />
                                <span className="text-sm text-slate-700">Triturada (Puré)</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="diet_texture_group"
                                    value="liquid"
                                    checked={formData.diet_liquid}
                                    onChange={handleChange}
                                    className="text-green-600 focus:ring-green-500"
                                />
                                <span className="text-sm text-slate-700">Líquida (Estricta)</span>
                            </label>
                        </div>
                    </div>

                    {/* LIQUIDS TEXTURE */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Viscosidad Líquidos (Bebida)</label>
                        <div className="flex flex-wrap gap-4 bg-white/50 p-3 rounded-xl border border-green-100">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="diet_texture"
                                    value="Líquida"
                                    checked={!formData.diet_texture || formData.diet_texture === 'Líquida'}
                                    onChange={handleChange}
                                    className="text-green-600 focus:ring-green-500"
                                />
                                <span className="text-sm text-slate-700">Líquida (Normal)</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="diet_texture"
                                    value="Néctar"
                                    checked={formData.diet_texture === 'Néctar'}
                                    onChange={handleChange}
                                    className="text-green-600 focus:ring-green-500"
                                />
                                <span className="text-sm text-slate-700">Néctar</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="diet_texture"
                                    value="Miel"
                                    checked={formData.diet_texture === 'Miel'}
                                    onChange={handleChange}
                                    className="text-green-600 focus:ring-green-500"
                                />
                                <span className="text-sm text-slate-700">Miel</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="diet_texture"
                                    value="Pudding"
                                    checked={formData.diet_texture === 'Pudding'}
                                    onChange={handleChange}
                                    className="text-green-600 focus:ring-green-500"
                                />
                                <span className="text-sm text-slate-700">Pudding (Espesada)</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center space-x-2 mb-2">
                            <input
                                type="checkbox"
                                name="dysphagia"
                                checked={formData.dysphagia}
                                onChange={handleChange}
                                className="w-5 h-5 text-green-600 rounded"
                            />
                            <label className="font-medium text-slate-800">Diagnóstico de Disfagia</label>
                        </div>
                        {formData.dysphagia && (
                            <div className="ml-7 space-y-3 mt-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Grado Disfagia (1-4)</label>
                                    <input
                                        type="number"
                                        name="dysphagia_grade"
                                        min="1"
                                        max="4"
                                        value={formData.dysphagia_grade || ''}
                                        onChange={handleChange}
                                        placeholder="Grado clínico"
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Instrucciones Espesante</label>
                                    <input
                                        type="text"
                                        name="thickener_instructions"
                                        value={formData.thickener_instructions || ''}
                                        onChange={handleChange}
                                        placeholder="Ej: 1 medida por 200ml"
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800">Antropometría</h3>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Peso (kg)</label>
                            <input
                                type="number"
                                step="0.1"
                                name="weight"
                                value={formData.weight || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Altura (cm)</label>
                            <input
                                type="number"
                                step="0.1"
                                name="height"
                                value={formData.height || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">IMC (Índice Masa Corporal)</label>
                            <input
                                type="number"
                                step="0.1"
                                name="bmi"
                                value={formData.bmi || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-slate-100"
                                placeholder={formData.weight && formData.height ? (formData.weight / ((formData.height / 100) ** 2)).toFixed(2) : "Calculado auto..."}
                                readOnly
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Suplementación</h3>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Características Suplemento</label>
                    <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                            <input type="checkbox" name="supplement_hchp" checked={formData.supplement_hchp} onChange={handleChange} className="w-4 h-4 text-green-600 rounded" />
                            <span className="text-sm text-slate-700">HC / HP (Hipercalórico/Proteico)</span>
                        </label>
                        <label className="flex items-center space-x-2">
                            <input type="checkbox" name="supplement_diabetes" checked={formData.supplement_diabetes} onChange={handleChange} className="w-4 h-4 text-green-600 rounded" />
                            <span className="text-sm text-slate-700">Fórmula Diabetes</span>
                        </label>
                        <label className="flex items-center space-x-2">
                            <input type="checkbox" name="supplement_renal" checked={formData.supplement_renal} onChange={handleChange} className="w-4 h-4 text-green-600 rounded" />
                            <span className="text-sm text-slate-700">Perfil Renal</span>
                        </label>
                        <label className="flex items-center space-x-2">
                            <input type="checkbox" name="supplement_fiber" checked={formData.supplement_fiber} onChange={handleChange} className="w-4 h-4 text-green-600 rounded" />
                            <span className="text-sm text-slate-700">Con Fibra</span>
                        </label>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre / Fórmula</label>
                    <input
                        type="text"
                        name="supplementation_formula"
                        value={formData.supplementation_formula}
                        onChange={handleChange}
                        placeholder="Ej: Resource, Meritene..."
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                    />
                </div>
            </div>

            {/* Wound Management */}
            <div className="pt-6 border-t border-slate-200">
                <WoundManager
                    wounds={formData.wounds || []}
                    onChange={(newWounds) => handleChange({ target: { name: 'wounds', value: newWounds } })}
                />
            </div>
        </div>
    </div>
);

// ==============================================================================
// 3. ELIMINACIÓN (Gordon Pattern 3)
// ==============================================================================
export const HygieneSection = ({ formData, handleChange }) => (
    <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-800">Control de Esfínteres</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Urinaria */}
            <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-200 space-y-3">
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        name="urinary_incontinence"
                        checked={formData.urinary_incontinence}
                        onChange={handleChange}
                        className="w-5 h-5 text-yellow-600 rounded"
                    />
                    <label className="font-medium text-slate-800">Incontinencia Urinaria</label>
                </div>
                {formData.urinary_incontinence && (
                    <div className="ml-7 space-y-2">
                        <div>
                            <label className="block text-sm text-slate-700 mb-1">Frecuencia</label>
                            <select
                                name="urinary_incontinence_frequency"
                                value={formData.urinary_incontinence_frequency || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                            >
                                <option value="">Seleccionar...</option>
                                <option value="1">Ocasional</option>
                                <option value="2">Frecuente</option>
                                <option value="3">Total</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-slate-700 mb-1">Tipo</label>
                            <select
                                name="incontinence_type"
                                value={formData.incontinence_type || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                            >
                                <option value="">Seleccionar...</option>
                                <option value="esfuerzo">De Esfuerzo</option>
                                <option value="urgencia">De Urgencia</option>
                                <option value="rebosamiento">Por Rebosamiento</option>
                                <option value="funcional">Funcional</option>
                                <option value="refleja">Refleja</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Fecal */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        name="fecal_incontinence"
                        checked={formData.fecal_incontinence}
                        onChange={handleChange}
                        className="w-5 h-5 text-stone-600 rounded"
                    />
                    <label className="font-medium text-slate-800">Incontinencia Fecal</label>
                </div>
                {formData.fecal_incontinence && (
                    <div className="ml-7">
                        <label className="block text-sm text-slate-700 mb-1">Notas</label>
                        <input
                            type="text"
                            name="fecal_incontinence_frequency"
                            value={formData.fecal_incontinence_frequency || ''}
                            onChange={handleChange}
                            placeholder="Ej: Diarreas frecuentes..."
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                        />
                    </div>
                )}
            </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mt-4">
            <h4 className="font-medium text-slate-700 mb-3">Uso de Absorbentes (Pañales)</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center h-full">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="checkbox"
                            name="diaper_use"
                            checked={formData.diaper_use}
                            onChange={handleChange}
                            className="w-5 h-5 text-indigo-600 rounded"
                        />
                        <span className="text-slate-800">Usa Pañal</span>
                    </label>
                </div>

                {formData.diaper_use && (
                    <>
                        <div>
                            <label className="block text-sm text-slate-600 mb-1">Tipo</label>
                            <select
                                name="diaper_type"
                                value={formData.diaper_type || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-indigo-500 focus:border-blue-500"
                            >
                                <option value="">Seleccionar tipo...</option>
                                <option value="anatomical">Braga-pañal (Anatómico)</option>
                                <option value="elastic">Pañal con Tiras (Elasticos)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-slate-600 mb-1">Talla</label>
                            <select
                                name="diaper_size"
                                value={formData.diaper_size}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                            >
                                <option value="">Seleccionar...</option>
                                <option value="S">Pequeña (S)</option>
                                <option value="M">Mediana (M)</option>
                                <option value="L">Grande (L)</option>
                                <option value="XL">Extra Grande (XL)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-slate-600 mb-1">Cambios/día</label>
                            <input
                                type="number"
                                name="diaper_changes_per_day"
                                value={formData.diaper_changes_per_day || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                            />
                        </div>
                    </>
                )}
            </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 mt-4">
            <h3 className="font-medium text-slate-800 mb-3">Higiene y Ducha</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm text-slate-700 mb-1">Autonomía en el baño</label>
                    <select
                        name="bath_autonomy"
                        value={formData.bath_autonomy}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                    >
                        <option value="">Seleccionar...</option>
                        <option value="independent">Independiente</option>
                        <option value="supervision">Supervisión</option>
                        <option value="partial_help">Ayuda Parcial</option>
                        <option value="total_help">Ayuda Total</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm text-slate-700 mb-1">Frecuencia baños (sem)</label>
                    <input
                        type="number"
                        name="bath_frequency"
                        value={formData.bath_frequency || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                    />
                </div>
            </div>
        </div>
    </div>
);

// ==============================================================================
// 6. COGNITIVO-PERCEPTIVO (Gordon Pattern 6)
// ==============================================================================
export const CognitiveSection = ({ formData, handleChange }) => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1 md:col-span-2 space-y-4">
                <h3 className="text-lg font-semibold text-slate-800">Estado Cognitivo</h3>
                <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Deterioro Cognitivo (GDS)</label>
                    <select
                        name="cognitive_impairment"
                        value={formData.cognitive_impairment}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                    >
                        <option value="">Seleccionar...</option>
                        <option value="none">GDS 1 - Sin deterioro</option>
                        <option value="very_mild">GDS 2 - Deterioro muy leve</option>
                        <option value="mild">GDS 3 - Deterioro leve</option>
                        <option value="moderate">GDS 4 - Deterioro moderado</option>
                        <option value="moderate_severe">GDS 5 - Moderadamente severo</option>
                        <option value="severe">GDS 6 - Severo</option>
                        <option value="very_severe">GDS 7 - Muy severo</option>
                    </select>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800">Valoraciones</h3>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div>
                        <label className="block text-sm text-slate-600 mb-1">MEC / MMSE (0-30)</label>
                        <input
                            type="number"
                            name="mmse_score"
                            value={formData.mmse_score || ''}
                            onChange={handleChange}
                            min="0" max="30"
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Pfeiffer (0-10)</label>
                        <input
                            type="number"
                            name="pfeiffer_score"
                            value={formData.pfeiffer_score || ''}
                            onChange={handleChange}
                            min="0" max="10"
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl font-mono"
                        />
                    </div>
                </div>
            </div>
        </div>

        <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Alteraciones de Conducta</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                {/* Agitacion */}
                <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            name="behavior_agitation"
                            checked={formData.behavior_agitation}
                            onChange={handleChange}
                            className="w-4 h-4 text-purple-600 rounded"
                        />
                        <span className="font-medium text-slate-700">Agitación / Inquietud</span>
                    </label>
                </div>

                {/* Deambulacion */}
                <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            name="behavior_night_wandering"
                            checked={formData.behavior_night_wandering}
                            onChange={handleChange}
                            className="w-4 h-4 text-purple-600 rounded"
                        />
                        <span className="font-medium text-slate-700">Deambulación Nocturna / Errática</span>
                    </label>
                </div>

                {/* Agresividad */}
                <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            name="behavior_aggression"
                            checked={formData.behavior_aggression}
                            onChange={handleChange}
                            className="w-4 h-4 text-red-600 rounded"
                        />
                        <span className="font-medium text-slate-700">Agresividad (Verbal o Física)</span>
                    </label>
                    {formData.behavior_aggression && (
                        <input
                            type="text"
                            name="behavior_aggression_type"
                            value={formData.behavior_aggression_type}
                            onChange={handleChange}
                            placeholder="Describir tipo de agresividad..."
                            className="w-full px-4 py-3 ml-6 text-sm border border-slate-300 rounded-xl"
                        />
                    )}
                </div>

                {/* Desorientacion */}
                <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            name="behavior_disorientation"
                            checked={formData.behavior_disorientation}
                            onChange={handleChange}
                            className="w-4 h-4 text-purple-600 rounded"
                        />
                        <span className="font-medium text-slate-700">Desorientación</span>
                    </label>
                    {formData.behavior_disorientation && (
                        <select
                            name="behavior_disorientation_type"
                            value={formData.behavior_disorientation_type}
                            onChange={handleChange}
                            className="w-full px-4 py-3 ml-6 text-sm border border-slate-300 rounded-xl"
                        >
                            <option value="">Seleccionar tipo...</option>
                            <option value="time">Temporal (no sabe fecha/hora)</option>
                            <option value="space">Espacial (se pierde)</option>
                            <option value="person">Personal (no reconoce)</option>
                            <option value="all">Global</option>
                        </select>
                    )}
                </div>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 rounded-2xl border border-yellow-200 flex items-center space-x-3">
                <input
                    type="checkbox"
                    name="uses_psychotropics"
                    checked={formData.uses_psychotropics}
                    onChange={handleChange}
                    className="w-5 h-5 text-yellow-600 rounded"
                />
                <span className="font-medium text-slate-800">Uso de Psicofármacos (Neurolépticos, Benzodiacepinas)</span>
            </div>
        </div>
    </div>
);

// ==============================================================================
// 7. VACCINATIONS
// ==============================================================================
export const VaccineSection = ({ formData, handleChange }) => (
    <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Registro de Vacunación</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Gripe */}
            <div className="bg-teal-50 p-4 rounded-2xl border border-teal-200">
                <h4 className="font-medium text-teal-800 mb-3">Gripe</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-slate-600 mb-1">Última Dosis</label>
                        <input
                            type="date"
                            name="vaccine_flu_last"
                            value={formData.vaccine_flu_last || ''}
                            onChange={handleChange}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-600 mb-1">Lote</label>
                        <input
                            type="text"
                            name="vaccine_flu_batch"
                            value={formData.vaccine_flu_batch || ''}
                            onChange={handleChange}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded"
                            placeholder="Nº Lote"
                        />
                    </div>
                </div>
            </div>

            {/* Neumococo */}
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-3">Neumococo</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-slate-600 mb-1">Última Dosis</label>
                        <input
                            type="date"
                            name="vaccine_pneumococcal_last"
                            value={formData.vaccine_pneumococcal_last || ''}
                            onChange={handleChange}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-600 mb-1">Lote</label>
                        <input
                            type="text"
                            name="vaccine_pneumococcal_batch"
                            value={formData.vaccine_pneumococcal_batch || ''}
                            onChange={handleChange}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded"
                            placeholder="Nº Lote"
                        />
                    </div>
                </div>
            </div>

            {/* Tétanos */}
            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-200">
                <h4 className="font-medium text-orange-800 mb-3">Tétanos</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-slate-600 mb-1">Última Dosis</label>
                        <input
                            type="date"
                            name="vaccine_tetanus_last"
                            value={formData.vaccine_tetanus_last || ''}
                            onChange={handleChange}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-600 mb-1">Lote</label>
                        <input
                            type="text"
                            name="vaccine_tetanus_batch"
                            value={formData.vaccine_tetanus_batch || ''}
                            onChange={handleChange}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded"
                            placeholder="Nº Lote"
                        />
                    </div>
                </div>
            </div>

            {/* COVID-19 */}
            <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200">
                <h4 className="font-medium text-purple-800 mb-3">COVID-19</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-slate-600 mb-1">Última Dosis</label>
                        <input
                            type="date"
                            name="vaccine_covid_last"
                            value={formData.vaccine_covid_last || ''}
                            onChange={handleChange}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-600 mb-1">Lote</label>
                        <input
                            type="text"
                            name="vaccine_covid_batch"
                            value={formData.vaccine_covid_batch || ''}
                            onChange={handleChange}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded"
                            placeholder="Nº Lote"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// ==============================================================================
// 8. CARE AND WOUNDS
// ==============================================================================
export const CareSection = ({ formData, handleChange }) => (
    <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-800">Integridad Cutánea y Cuidados</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-red-50 p-4 rounded-2xl border border-red-200 space-y-3">
                <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            name="has_pressure_ulcers"
                            checked={formData.has_pressure_ulcers}
                            onChange={handleChange}
                            className="w-5 h-5 text-red-600 rounded"
                        />
                        <span className="font-medium text-slate-800">Presenta Úlceras por Presión (UPP)</span>
                    </label>
                    {formData.has_pressure_ulcers && (
                        <div className="ml-7 grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs text-slate-700">Grado</label>
                                <select
                                    name="upp_grade"
                                    value={formData.upp_grade}
                                    onChange={handleChange}
                                    className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
                                >
                                    <option value="">...</option>
                                    <option value="I">Grado I</option>
                                    <option value="II">Grado II</option>
                                    <option value="III">Grado III</option>
                                    <option value="IV">Grado IV</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-700">Tipo de Cura</label>
                                <input
                                    type="text"
                                    name="upp_cure_type"
                                    value={formData.upp_cure_type}
                                    onChange={handleChange}
                                    placeholder="Ej: Hidrocoloide"
                                    className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            name="has_surgical_wounds"
                            checked={formData.has_surgical_wounds}
                            onChange={handleChange}
                            className="w-5 h-5 text-red-600 rounded"
                        />
                        <span className="font-medium text-slate-800">Heridas Quirúrgicas / Otras</span>
                    </label>
                    {formData.has_surgical_wounds && (
                        <div className="ml-7">
                            <label className="block text-xs text-slate-700">Describir tipo y cura</label>
                            <input
                                type="text"
                                name="other_wound_cure_type"
                                value={formData.other_wound_cure_type}
                                onChange={handleChange}
                                className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 space-y-3">
                <label className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        name="uses_anti_bedsore_mattress"
                        checked={formData.uses_anti_bedsore_mattress}
                        onChange={handleChange}
                        className="w-5 h-5 text-indigo-600 rounded"
                    />
                    <span className="font-medium text-slate-800">Colchón Antiescaras</span>
                </label>

                <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            name="requires_positioning"
                            checked={formData.requires_positioning}
                            onChange={handleChange}
                            className="w-5 h-5 text-indigo-600 rounded"
                        />
                        <span className="font-medium text-slate-800">Cambios Posturales</span>
                    </label>
                    {formData.requires_positioning && (
                        <div className="flex items-center space-x-2 ml-7">
                            <span className="text-sm">Cada</span>
                            <input
                                type="number"
                                name="positioning_frequency"
                                value={formData.positioning_frequency || ''}
                                onChange={handleChange}
                                placeholder="3"
                                className="w-16 px-2 py-1 text-sm border border-slate-300 rounded"
                            />
                            <span className="text-sm">horas</span>
                        </div>
                    )}
                </div>

                <div className="space-y-2 border-t border-blue-100 pt-3">
                    <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            name="requires_diabetic_foot_care"
                            checked={formData.requires_diabetic_foot_care}
                            onChange={handleChange}
                            className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <span className="font-medium text-slate-800">Cuidado Pie Diabético</span>
                    </label>
                    <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            name="requires_special_oral_care"
                            checked={formData.requires_special_oral_care}
                            onChange={handleChange}
                            className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <span className="font-medium text-slate-800">Higiene Bucal Especial</span>
                    </label>
                </div>
            </div>
        </div>

        <h3 className="text-lg font-semibold text-slate-800 mt-4">Dolor</h3>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Escala EVA (0-10)</label>
                <div className="flex items-center space-x-4">
                    <input
                        type="range"
                        min="0" max="10"
                        name="pain_eva"
                        value={formData.pain_eva || 0}
                        onChange={handleChange}
                        className="w-full h-2 bg-slate-200 rounded-2xl appearance-none cursor-pointer"
                    />
                    <span className="font-bold text-lg text-indigo-600 w-8">{formData.pain_eva || 0}</span>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Localización Dolor</label>
                <input
                    type="text"
                    name="pain_location"
                    value={formData.pain_location}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                    placeholder="Ej: Rodilla derecha, Lumbar..."
                />
            </div>
        </div>
    </div>
);


// ==============================================================================
// 9. THERAPIES
// ==============================================================================
export const TherapySection = ({ formData, handleChange }) => (
    <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-800">Terapias Activas</h3>
        <p className="text-sm text-slate-500 mb-4">Seleccione las terapias que recibe el residente actualmente.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
                { key: 'receives_physiotherapy', label: 'Fisioterapia' },
                { key: 'receives_occupational_therapy', label: 'Terapia Ocupacional' },
                { key: 'receives_speech_therapy', label: 'Logopedia' },
                { key: 'receives_psychology', label: 'Atención Psicológica' },

            ].map(({ key, label }) => (
                <label key={key} className="flex items-center p-3 border border-slate-200 rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors shadow-sm">
                    <input
                        type="checkbox"
                        name={key}
                        checked={formData[key]}
                        onChange={handleChange}
                        className="w-5 h-5 text-teal-600 rounded mr-3"
                    />
                    <span className="font-medium text-slate-700">{label}</span>
                </label>
            ))}
        </div>
    </div>
);

// ==============================================================================
// 10. TOLERANCIA AL ESTRÉS (Gordon Pattern 10)
// ==============================================================================
export const PermissionsSection = ({ formData, handleChange }) => (
    <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-800">Gestión de Sujeciones</h3>
        <div className="bg-red-50 p-4 rounded-2xl border border-red-200">
            <div className="mb-4">
                <label className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        name="requires_restraint"
                        checked={formData.requires_restraint}
                        onChange={handleChange}
                        className="w-6 h-6 text-red-600 rounded"
                    />
                    <span className="font-bold text-red-800">Precisa Sujeción Física</span>
                </label>
            </div>

            {formData.requires_restraint && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Sujeción</label>
                        <select
                            name="restraint_type"
                            value={formData.restraint_type}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                        >
                            <option value="">Seleccionar...</option>
                            <option value="abdominal">Cinturón Abdominal (Cama)</option>
                            <option value="pelvic">Cinturón Pélvico (Silla)</option>
                            <option value="muñequeras">Muñequeras</option>
                            <option value="barandillas">Barandillas x2</option>
                        </select>

                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Pauta / Horario</label>
                        <input
                            type="text"
                            name="restraint_schedule"
                            value={formData.restraint_schedule}
                            onChange={handleChange}
                            placeholder="Ej: Sólo noche, Continua..."
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                        />
                    </div>
                </div>
            )}
        </div>
    </div>
);

// ==============================================================================
// 11. OBSERVATIONS
// ==============================================================================
// ==============================================================================
// 7. AUTOPERCEPCIÓN (Gordon Pattern 7)
// ==============================================================================
export const AutopercepcionSection = ({ formData, handleChange, handleBlur }) => (
    <div className="space-y-4">
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Estado Emocional y Autoconcepto</label>
            <textarea
                name="emotional_state"
                value={formData.emotional_state || ''}
                onChange={handleChange}
                onBlur={handleBlur}
                rows="4"
                placeholder="Estado anímico habitual, miedos, percepción de sí mismo, imagen corporal..."
                className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-pink-500 outline-none"
            />
            <p className="text-xs text-slate-500 italic mt-2">
                ℹ️ Describa cómo se siente el residente consigo mismo y su situación actual.
            </p>
        </div>
    </div>
);

// ==============================================================================
// 8. ROL Y RELACIONES (Gordon Pattern 8)
// ==============================================================================
export const RelacionesSection = ({ formData, handleChange, handleBlur }) => (
    <div className="space-y-4">
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Situación Familiar y Social</label>
            <textarea
                name="family_situation"
                value={formData.family_situation || ''}
                onChange={handleChange}
                onBlur={handleBlur}
                rows="6"
                placeholder="Estructura familiar, apoyo social, frecuencia de visitas, relación con otros residentes..."
                className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-cyan-500 outline-none"
            />
        </div>
    </div>
);

// ==============================================================================
// 11. VALORES-CREENCIAS (Gordon Pattern 11)
// ==============================================================================
export const ObservationsSection = ({ formData, handleChange, handleBlur }) => (
    <div className="space-y-6">
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Observaciones</label>
            <textarea
                name="first_impressions"
                value={formData.first_impressions || ''}
                onChange={handleChange}
                onBlur={handleBlur}
                rows="4"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-teal-500 outline-none"
                placeholder="Observaciones generales del enfermero..."
            ></textarea>
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Plan de Cuidados Inicial</label>
            <textarea
                name="care_plan"
                value={formData.care_plan || ''}
                onChange={handleChange}
                onBlur={handleBlur}
                rows="4"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-teal-500 outline-none"
                placeholder="Objetivos principales y pautas de cuidado sugeridas..."
            ></textarea>
        </div>
    </div>
);



// ==============================================================================
// 5. SUEÑO-DESCANSO (Gordon Pattern 5)
// ==============================================================================
export const SleepSection = ({ formData, handleChange }) => {
    return (
        <div className="space-y-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Medicación para dormir</label>
                    <select
                        name="sleep_medication"
                        value={formData.sleep_medication || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-indigo-500 focus:border-blue-500"
                    >
                        <option value="No precisa">No precisa</option>
                        <option value="Zolpidem">Zolpidem</option>
                        <option value="Lorazepam">Lorazepam</option>
                        <option value="Diazepam">Diazepam</option>
                        <option value="Trazodona">Trazodona</option>
                        <option value="Mirtazapina">Mirtazapina</option>
                        <option value="Melatonina">Melatonina</option>
                        <option value="Otros">Otros</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Patrón de Sueño</label>
                    <select
                        name="sleep_pattern"
                        value={formData.sleep_pattern || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-indigo-500 focus:border-blue-500"
                    >
                        <option value="Normal">Sueño reparador (Normal)</option>
                        <option value="Insomnio Conciliación">Insomnio de conciliación</option>
                        <option value="Insomnio Mantenimiento">Insomnio de mantenimiento</option>
                        <option value="Despertar Precoz">Despertar precoz</option>
                        <option value="Inversión Ritmo">Inversión del ritmo</option>
                        <option value="Somnolencia Diurna">Somnolencia diurna excesiva</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones del Sueño</label>
                    <textarea
                        name="sleep_observations"
                        value={formData.sleep_observations || ''}
                        onChange={handleChange}
                        rows="3"
                        placeholder="Describir ritmos, insomnio, ayudas no farmacológicas..."
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                    />
                </div>
            </div>
        </div>
    );
};

export const SexualitySection = ({ formData, handleChange }) => (
    <div className="space-y-4">
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Observaciones sobre Sexualidad e Intimidad</label>
            <textarea
                name="sexuality_observations"
                value={formData.sexuality_observations || ''}
                onChange={handleChange}
                rows="4"
                placeholder="Valoración de la satisfacción, preocupaciones, afectividad, intimidad..."
                className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-rose-500 outline-none"
            />
            <p className="text-xs text-slate-500 italic mt-2">
                ℹ️ Describa aspectos relevantes sobre la esfera sexual y afectiva del residente.
            </p>
        </div>
    </div>
);
