import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Card from './Card';
import Button from './Button';
import TabbedForm from './TabbedForm';
import { ArrowLeft, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';
import DynamicListInput from './DynamicListInput';
import {
    MobilitySection,
    NutritionSection,
    HygieneSection,
    CognitiveSection,
    VaccineSection,
    CareSection,
    TherapySection,
    PermissionsSection,
    ObservationsSection,
    SleepSection,
    SexualitySection,
    AutopercepcionSection,
    RelacionesSection
} from './FormSections';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import ImageUpload from './ImageUpload';
import { z } from 'zod';
import { residentSchema } from '../utils/validationSchemas';

// Canonical 12-Section Structure: Tab 0 (Admin) + 11 Gordon Functional Health Patterns
// SECTION_PERMISSIONS: Role-Based Access Control Matrix
const SECTION_PERMISSIONS = {
    0: ['admin', 'director', 'nurse'], // 0. Identificación y Administración
    1: ['doctor', 'nurse', 'admin', 'director'], // P1: Salud (Clinical)
    2: ['nurse', 'doctor', 'aux', 'admin', 'director'], // P2: Nutricional
    3: ['nurse', 'aux', 'admin', 'director'], // P3: Eliminación
    4: ['physio', 'nurse', 'doctor', 'aux', 'admin', 'director'], // P4: Actividad
    5: ['nurse', 'doctor', 'aux', 'admin', 'director'], // P5: Sueño
    6: ['psych', 'doctor', 'nurse', 'admin', 'director'], // P6: Cognitivo (Sensitive)
    7: ['psych', 'social', 'nurse', 'admin', 'director'], // P7: Autopercepción
    8: ['social', 'nurse', 'admin', 'director'], // P8: Rol y Relaciones
    9: ['doctor', 'nurse', 'admin', 'director'], // P9: Sexualidad (Sensitive)
    10: ['psych', 'nurse', 'admin', 'director'], // P10: Adaptación (Sensitive)
    11: ['social', 'admin', 'nurse', 'director'] // P11: Valores y Creencias
};

// Spanish labels for error messages
const FIELD_LABELS = {
    // Tab 0 - Identification
    name: 'Nombre',
    surname: 'Apellidos',
    dni_nie: 'Número de Documento (DNI/NIE)',
    document_type: 'Tipo de Identificación',
    date_of_birth: 'Fecha Nacimiento',
    sex: 'Sexo',
    room_number: 'Habitación',
    admission_date: 'Fecha Ingreso',
    status: 'Estado',
    emergency_contact: 'Contacto Emergencia',
    // Tab 1 - Health
    diagnosis_diabetes_type: 'Tipo Diabetes',
    diagnosis_cancer_type: 'Tipo Cáncer',
    allergy_medication_detail: 'Detalle Alergia a Medicamentos',
    allergy_food_detail: 'Detalle Alergia Alimentaria',
    intolerance_food_detail: 'Detalle Intolerancia Alimentaria',
    allergy_material_detail: 'Detalle Alergia a Materiales',
    // Tab 2 - Nutrition
    diet_texture: 'Textura Dieta',
    dysphagia_grade: 'Grado Disfagia',
    weight: 'Peso',
    height: 'Altura',
    // Tab 3 - Elimination
    diaper_type: 'Tipo Pañal',
    diaper_size: 'Talla Pañal',
    incontinence_type: 'Tipo Incontinencia',
    urinary_incontinence_frequency: 'Frecuencia Inc. Urinaria',
    // Tab 4 - Mobility
    device_oxygen_type: 'Tipo Oxígeno',
    device_oxygen_flow: 'Flujo O2',
    mobility_level: 'Nivel Movilidad',
    // Tab 6 - Cognitive
    mmse_score: 'Puntuación MMSE',
    pfeiffer_score: 'Puntuación Pfeiffer',
    sexuality_observations: 'Observaciones sobre Sexualidad',
    first_impressions: 'Primeras Impresiones',
    emotional_state: 'Estado Emocional',
    family_situation: 'Situación Familiar',
};

// Map of Fields -> Tab Index (for auto-navigation on error)
const FIELD_TAB_MAP = {
    0: ['name', 'surname', 'dni_nie', 'document_type', 'date_of_birth', 'sex', 'room_number', 'admission_date', 'status', 'emergency_contact', 'nationality', 'phone', 'email', 'address'],
    1: ['diagnosis_diabetes', 'diagnosis_diabetes_type', 'diagnosis_cancer', 'diagnosis_cancer_type', 'has_medication_allergy', 'allergy_medication_detail', 'has_food_allergy', 'allergy_food_detail', 'has_food_intolerance', 'intolerance_food_detail', 'has_material_allergy', 'allergy_material_detail', 'no_known_allergies', 'primary_doctor', 'health_center'],
    2: ['diet_type', 'dysphagia', 'dysphagia_grade', 'diet_texture', 'thickener_instructions', 'weight', 'height', 'bmi', 'supplementation_formula'],
    3: ['urinary_incontinence', 'urinary_incontinence_frequency', 'incontinence_type', 'fecal_incontinence', 'diaper_use', 'diaper_type', 'diaper_size', 'diaper_changes_per_day', 'bath_autonomy', 'bath_frequency'],
    4: ['mobility_level', 'device_dentures', 'device_hearing_aids', 'device_glasses', 'device_oxygen', 'device_oxygen_type', 'device_oxygen_flow', 'device_oxygen_hours'],
    5: ['sleep_pattern', 'sleep_medication'],
    6: ['cognitive_impairment', 'mmse_score', 'pfeiffer_score', 'behavior_agitation', 'behavior_night_wandering', 'behavior_aggression', 'behavior_disorientation', 'uses_psychotropics'],
    7: ['emotional_state'],
    8: ['family_situation'],
    9: ['sexuality_observations'],
    10: [],
    11: ['first_impressions', 'care_plan']
};

/**
 * ResidentForm - Formulario Integral de Gestión de Residentes.
 * 
 * Este componente es el núcleo de la entrada de datos clínicos y administrativos.
 * Implementa una estructura modular basada en los 11 Patrones Funcionales de Gordon.
 * 
 * Características principales:
 * - Validación robusta mediante Zod (lado cliente).
 * - Control de acceso granular (RBAC) por sección y rol de usuario.
 * - Gestión compleja de estados (Activo, Hospitalizado, Baja, Defunción).
 * - Sincronización automática de números de emergencia según tipo de cobertura.
 */
export default function ResidentForm({ onSubmit, onCancel, initialData, initialTab = 0, isModal = false, isSubmitting = false }) {
    const { user } = useAuth();
    const { addToast } = useToast();
    const location = useLocation();
    const currentUserRole = user?.role || 'aux'; // Rol por defecto (mínimo privilegio)

    // Matriz de permisos: Determina qué roles pueden editar cada sección.
    // Sigue el principio de "Lógica de negocio soberana" definida en GEMINI.md.
    const canEditSection = (tabIndex) => {
        // Los administradores tienen acceso total.
        if (currentUserRole === 'admin') return true;

        // Durante el alta (nuevo residente), enfermería suele tener permisos extendidos.
        if (!initialData?.id && currentUserRole === 'nurse') return true;

        const allowed = SECTION_PERMISSIONS[tabIndex] || [];
        return allowed.includes(currentUserRole);
    };

    const [activeTab, setActiveTab] = useState(initialTab || 0);
    // const [completedTabs, setCompletedTabs] = useState({}); // Removed unused

    // Auto-scroll logic for Status Sections
    useEffect(() => {
        const hash = location.hash;
        if (hash === '#hospitalization-section' || hash === '#inactive-section') {
            const targetId = hash.substring(1); // remove '#'
            setTimeout(() => {
                const element = document.getElementById(targetId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Provide a visual cue depending on the section
                    const ringColor = targetId === 'hospitalization-section' ? 'ring-amber-400' : 'ring-indigo-400';
                    const bgColor = targetId === 'hospitalization-section' ? 'bg-amber-50' : 'bg-indigo-50/50';

                    element.classList.add('ring-4', ringColor, bgColor, 'rounded-lg', 'transition-all', 'duration-1000');
                    setTimeout(() => element.classList.remove('ring-4', ringColor, bgColor), 2500);
                }
            }, 600);
        }
    }, [location.hash]);

    // Auto-scroll to top when tab changes
    const contentRef = React.useRef(null);
    useEffect(() => {
        // Internal scroll (for Modal or fixed height containers)
        if (contentRef.current) {
            contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
        // Window scroll (for Page layout where content expands)
        if (!isModal) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [activeTab, isModal]);

    const [formData, setFormData] = useState({
        // === DATOS BÁSICOS (5 campos obligatorios) ===
        name: '',
        surname: '',
        date_of_birth: '',
        room_number: '',
        emergency_contact: '',
        emergency_phone: '',

        // === DATOS PERSONALES ADICIONALES ===
        document_type: 'DNI',
        dni_nie: '',
        sex: '',
        nationality: '',
        primary_language: '',
        address: '',
        postal_code: '',
        municipality: '',
        phone: '',
        email: '',
        family_contacts: [], // Initialize as array to prevent undefined errors
        admission_date: '',
        admission_time: '',

        // === SISTEMA DE BAJAS ===
        status: 'active',
        inactive_date: '',
        inactive_reason: '',

        // === HOSPITALIZACIÓN (Active) ===
        hospitalization_date: '',
        hospitalization_end_date: '',
        hospitalization_hospital: '',
        hospitalization_reason: '',
        hospitalization_history: [], // For display mainly, but good to have in state

        // === DATOS MÉDICOS ===
        primary_doctor: '',
        health_center: '',
        health_center_type: '', // 'ss' or 'private'
        health_center_phone: '',
        health_center_phone_emergency: '',
        private_health_phone: '',

        reference_hospital: '',
        last_hospital_visit: '',
        last_hospital_visit_type: '', // 'urgency' or 'specialist'

        // === ANTECEDENTES (Dynamic List) ===

        // === ANTECEDENTES (Dynamic List) ===
        medical_history: [], // [{type, name, year, status}]

        // === DIAGNÓSTICOS (Checkboxes) ===
        diagnosis_hypertension: false,
        diagnosis_hypertension_detail: '',
        diagnosis_diabetes: false,
        diagnosis_copd: false,
        diagnosis_alzheimer: false,
        diagnosis_parkinson: false,
        diagnosis_stroke: false,
        diagnosis_cardiopathy: false,
        diagnosis_renal_failure: false,
        diagnosis_osteoporosis: false,
        diagnosis_arthritis: false,
        diagnosis_cancer: false,
        diagnosis_cancer_type: '',
        diagnosis_diabetes_type: '', // 'type1' or 'type2'

        // === ALERGIAS ===
        has_medication_allergy: false,
        has_food_allergy: false,
        has_material_allergy: false,
        allergy_type: '',
        no_known_allergies: false,

        // === MOVILIDAD ===
        mobility_level: '',

        // === DISPOSITIVOS ===
        device_dentures: false,
        device_dentures_type: '',
        device_hearing_aids: false,
        device_hearing_aids_side: '',
        device_hearing_aids_brand: '',
        device_glasses: false,
        // device_glasses_progressive removed
        device_oxygen: false,
        device_oxygen_type: '',
        device_oxygen_flow: '',
        device_oxygen_hours: '',
        device_nasogastric: false,
        device_veis: false,
        device_catheter: false,
        device_peg: false,
        device_tracheostomy: false,
        device_invasive_type: '',
        device_invasive_change_date: '',

        // === NUTRICIÓN ===
        // diet_type: '', // DEPRECATED
        diet_normal: false,
        diet_diabetic: false,
        diet_low_salt: false,
        diet_astringent: false,
        diet_protection: false,
        diet_soft: false,
        diet_pureed: false,
        dysphagia: false,
        dysphagia_grade: '',
        weight: '',
        height: '',
        bmi: '',
        supplementation_type: '',
        supplementation_formula: '',

        // === HIGIENE Y CONTINENCIA ===
        urinary_incontinence: false,
        urinary_incontinence_frequency: '',
        fecal_incontinence: false,
        fecal_incontinence_frequency: '',
        incontinence_type: '',
        night_incontinence: false,
        diaper_use: false,
        diaper_type: '',
        diaper_size: '',
        diaper_brand: '',
        diaper_changes_per_day: '',
        bath_autonomy: '',
        bath_frequency: '',

        // === ESTADO COGNITIVO ===
        cognitive_impairment: '',
        mmse_score: '',
        pfeiffer_score: '',
        behavior_agitation: false,
        behavior_agitation_frequency: '',
        behavior_disorientation: false,
        behavior_disorientation_type: '',
        behavior_aggression: false,
        behavior_aggression_type: '',
        behavior_night_wandering: false,
        uses_psychotropics: false,

        // === SUEÑO ===
        sleep_medication: '',

        // === VACUNACIÓN ===
        vaccine_flu_last: '',
        vaccine_flu_batch: '',
        vaccine_pneumococcal_last: '',
        vaccine_pneumococcal_batch: '',
        vaccine_tetanus_last: '',
        vaccine_tetanus_batch: '',
        vaccine_covid_last: '',
        vaccine_covid_batch: '',

        // === HERIDAS Y CUIDADOS ===
        wounds: [],
        has_pressure_ulcers: false,
        upp_grade: '',
        upp_cure_type: '',
        has_surgical_wounds: false,
        other_wound_cure_type: '',
        requires_positioning: false,
        positioning_frequency: '',
        uses_anti_bedsore_mattress: false,
        requires_diabetic_foot_care: false,
        requires_special_oral_care: false,

        // === DOLOR ===
        pain_eva: '',
        pain_location: '',
        pain_treatment: '',

        // === TERAPIAS ===
        receives_physiotherapy: false,
        receives_occupational_therapy: false,
        receives_speech_therapy: false,
        receives_psychology: false,
        receives_respiratory_therapy: false,



        // === OBSERVACIONES ===
        first_impressions: '',
        sexuality_observations: '', // Patrón 9
        care_plan: '',
        family_situation: ''
    });

    const [, setLoading] = useState(false);
    const [, setError] = useState(null);
    const [errors, setErrors] = useState({}); // Field-level validation errors
    const [originalData, setOriginalData] = useState({}); // Store original sanitized data for diffing

    // Validation Helper
    const validateField = (name, value, contextData = null) => {
        const dataToValidate = contextData || { ...formData, [name]: value };

        // Use safeParse on the full schema to handle dependencies (like document_type + dni_nie)
        // We only care about the error for the specific field we are validating.
        const result = residentSchema.safeParse(dataToValidate);

        if (!result.success) {
            const formattedErrors = result.error.format();
            const fieldError = formattedErrors[name];

            if (fieldError && fieldError._errors.length > 0) {
                setErrors(prev => ({ ...prev, [name]: fieldError._errors[0] }));
                return false;
            } else {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[name];
                    return newErrors;
                });
                return true;
            }
        } else {
            // Success generally (or at least for this field)
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
            return true;
        }
    };

    // Sugerencia automática de teléfono de emergencias médicas.
    // Si la cobertura es Seguridad Social, se sugiere por defecto el 112.
    useEffect(() => {
        if (formData.health_center_type === 'ss') {
            if (!formData.health_center_phone_emergency) {
                setFormData(prev => ({ ...prev, health_center_phone_emergency: '112' }));
            }
        } else if (formData.health_center_type === 'private' && formData.health_center_phone_emergency === '112') {
            setFormData(prev => ({ ...prev, health_center_phone_emergency: '' }));
        }
    }, [formData.health_center_type]);

    // Populate form when editing


    useEffect(() => {
        if (initialData) {
            // Sanitize initialData to ensure no null values break controlled components
            // Y convertir tipo de documento legado 'DNI_NIE' a 'DNI'
            const sanitizedData = { ...initialData };



            // Helper para obtener valor seguro o defecto
            const safeVal = (val, defaultVal) => val === null || val === undefined ? defaultVal : val;

            // Asegurar que todos los campos tienen valores por defecto seguros según su tipo
            Object.keys(initialData).forEach(key => {
                // If it's a boolean field in default state, ensure it stays boolean
                if (typeof formData[key] === 'boolean') {
                    const val = initialData[key];
                    // Handle strings "true"/"false" from API if any, or null/undefined
                    if (val === 'true' || val === true) sanitizedData[key] = true;
                    else if (val === 'false' || val === false) sanitizedData[key] = false;
                    else sanitizedData[key] = false;
                }
                // If it's a string/number field, ensure it doesn't become null
                else {
                    sanitizedData[key] = safeVal(initialData[key], '');
                }
            });

            // Convert legacy document_type 'DNI_NIE' to 'DNI'
            // OR if it's empty/null set to 'DNI' (which matches the select visually)
            if (sanitizedData.document_type === 'DNI_NIE' || !sanitizedData.document_type) {
                sanitizedData.document_type = 'DNI';
            }

            // Preservar explícitamente profile_photo si existe en initialData
            if (initialData.profile_photo) {
                sanitizedData.profile_photo = initialData.profile_photo;
            }

            setFormData(prev => ({
                ...prev,
                ...sanitizedData
            }));
            setOriginalData(sanitizedData);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;

        // Virtual fields handling
        if (name === 'diet_texture_group') {
            setFormData(prev => ({
                ...prev,
                diet_soft: value === 'soft',
                diet_pureed: value === 'pureed',
                diet_liquid: value === 'liquid'
            }));
            return;
        }

        // === LÓGICA DE ELIMINACIÓN (Soft-Delete Preventivo) ===
        // Interceptamos el cambio de estado si es 'deleted' para solicitar confirmación crítica.
        if (name === 'status' && newValue === 'deleted') {
            if (window.confirm('⚠️ ¿Estás seguro de que quieres ELIMINAR este residente?\n\nEsta acción es irreversible y borrará todos sus datos asociados (constantes, evolutivos, historial...).')) {
                setLoading(true);
                if (initialData && initialData.id) {
                    api.delete(`/residents/${initialData.id}`)
                        .then(() => {
                            window.location.href = '/residents';
                        })
                        .catch(err => {
                            console.error(err);
                            alert("Error al eliminar el residente. Verifica permisos.");
                            setLoading(false);
                        });
                }
            }
            return; // No actualizamos el estado local si se solicita eliminación directa.
        }

        setFormData(prev => {
            const updated = { ...prev, [name]: newValue };

            // === LÓGICA DE EXCLUSIVIDAD MUTUA (Garantía de Integridad) ===

            // 1. Dietas: Si se elige 'Basal', se desmarcan las dietas especiales y viceversa.
            const specialDiets = [
                'diet_diabetic', 'diet_low_salt', 'diet_astringent',
                'diet_protection', 'diet_soft', 'diet_pureed'
            ];

            if (name === 'diet_normal' && newValue === true) {
                specialDiets.forEach(d => updated[d] = false);
            } else if (specialDiets.includes(name) && newValue === true) {
                updated.diet_normal = false;
            }

            // 2. Suplementación: Incompatibilidad entre Renal e Hiperproteico.
            if (name === 'supplement_hchp' && newValue === true) {
                updated.supplement_renal = false;
            }
            if (name === 'supplement_renal' && newValue === true) {
                updated.supplement_hchp = false;
            }

            return updated;
        });

        // Construct new data context for validation
        const newData = { ...formData, [name]: newValue };

        // Real-time validation
        // Always validate the field being changed to give immediate feedback if it's now invalid or valid
        validateField(name, newValue, newData);

        // --- DEPENDENCY VALIDATION ---
        // When a parent checkbox changes, re-validate its child field immediately
        const dependencies = {
            'diagnosis_diabetes': ['diagnosis_diabetes_type'],
            'diagnosis_cancer': ['diagnosis_cancer_type'],
            'has_medication_allergy': ['allergy_type'],
            'has_food_allergy': ['allergy_type'],
            'has_material_allergy': ['allergy_type'],
            // New dependencies
            'dysphagia': ['diet_texture', 'dysphagia_grade'],
            'diaper_use': ['diaper_type', 'diaper_size'],
            'urinary_incontinence': ['incontinence_type'],
            'device_oxygen': ['device_oxygen_type', 'device_oxygen_flow']
        };

        if (dependencies[name]) {
            // Validate dependent fields using the NEW data context
            const fields = Array.isArray(dependencies[name]) ? dependencies[name] : [dependencies[name]];
            fields.forEach(field => {
                validateField(field, formData[field], newData);
            });
        }

        // Check internal dependencies like DNI type
        if (name === 'document_type') {
            validateField('dni_nie', formData.dni_nie, newData);
        }
    };

    // Add onBlur handler to trigger validation when leaving a field
    const handleBlur = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;

        // Special DNI Immediate Validation
        if (name === 'dni_nie') {
            // Force re-validation of this specific field with explicit visual feedback
            validateField(name, val);
        } else {
            validateField(name, val);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setErrors({}); // Clear previous submission errors

        // 1. Zod Validation
        try {
            // We use partial() because the schema might be incomplete vs the massive form
            // But for the fields explicitly defined in the schema, we want strict validation.
            // Using residentSchema directly. Unknown keys are stripped by default in Zod unless passthrough() is used.
            // Since we send everything to backend, we should technically use the schema to validate, 
            // but the schema only covers Tab 0 and 1 so far.
            // Strategy: Validate what we have schemas for. 

            // For now, let's allow unknown keys until we map everything, otherwise valid fields will be stripped if we use the output.
            // We just want to check for ERRORS in the known fields.
            // residentSchema is a ZodEffects object, so it automatically ignores unknown keys (strip),
            // but we don't use the output, we just want to validate.
            // passthrough() is not available on ZodEffects.
            // passthrough() is not available on ZodEffects.
            // passthrough() is not available on ZodEffects.
            residentSchema.parse(formData);

        } catch (err) {
            setLoading(false); // Valid for all validation errors

            if (err instanceof z.ZodError) {
                const newErrors = {};
                // Canonical property is 'issues', 'errors' is alias. Using fallback for safety.
                const issues = err.issues || err.errors || [];
                issues.forEach(issue => {
                    const path = issue.path.length > 0 ? issue.path[0] : 'unknown';
                    newErrors[path] = issue.message;
                });
                setErrors(newErrors);

                // AUTO-SCROLL & FOCUS LOGIC
                const firstErrorKey = Object.keys(newErrors)[0];
                if (firstErrorKey) {
                    // 1. Determine Tab
                    let targetTab = 0; // Default
                    Object.entries(FIELD_TAB_MAP).forEach(([tabIndex, fields]) => {
                        if (fields.includes(firstErrorKey)) targetTab = parseInt(tabIndex);
                    });

                    // 2. Switch Tab if needed
                    if (activeTab !== targetTab) {
                        setActiveTab(targetTab);
                    }

                    // 3. Scroll to Element (Wait for Tab Render)
                    setTimeout(() => {
                        const element = document.getElementsByName(firstErrorKey)[0];
                        if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            element.focus();

                            // Visual Cue - Usando Tailwind con modificador '!' para asegurar prioridad
                            const highlightClasses = ['!ring-4', '!ring-red-400', '!border-red-400'];
                            element.classList.add(...highlightClasses);

                            setTimeout(() => {
                                element.classList.remove(...highlightClasses);
                            }, 2500);
                        }
                    }, 150); // Small delay for React render

                    setError(`Error en: ${FIELD_LABELS[firstErrorKey] || firstErrorKey}`);
                } else {
                    setError("Por favor, corrija los errores marcados.");
                }

            } else {
                console.error("Validation Runtime Error:", err);
                setError(`Error de validación interna: ${err.message}`);
                window.scrollTo(0, 0);
            }
            return; // STOP SUBMISSION
        }

        try {
            // Convertir valores vacíos a null para campos numéricos y fechas
            const cleanedData = { ...formData };
            // Extended numeric fields list for safety
            const numericFields = [
                'device_oxygen_flow', 'device_oxygen_hours', 'dysphagia_grade', 'weight', 'height', 'bmi',
                'urinary_incontinence_frequency', 'fecal_incontinence_frequency', 'diaper_changes_per_day', 'bath_frequency',
                'mmse_score', 'pfeiffer_score', 'pain_eva'
            ];

            Object.keys(cleanedData).forEach(key => {
                // Convert empty strings to null for specific fields to avoid 'null' strings in DB
                const value = cleanedData[key];
                const isStringEmpty = typeof value === 'string' && value.trim() === '';
                
                if (isStringEmpty) {
                    if (
                        numericFields.includes(key) || 
                        key.includes('date') || 
                        key.includes('_last') || 
                        key.includes('_expiration') ||
                        ['email', 'phone', 'emergency_phone', 'private_health_phone', 'health_center_phone', 'health_center_phone_emergency'].includes(key)
                    ) {
                        cleanedData[key] = null;
                    }
                }
            });

            console.log("Enviando datos:", cleanedData);

            let response;
            if (initialData && initialData.id) {
                // SMART UPDATE (PATCH)
                // Calculate diff - only send fields that actually changed
                const dirtyFields = {};

                // Helper: Normalize empty values (null, undefined, "") to null for comparison
                const normalizeEmpty = (val) => {
                    if (val === null || val === undefined || val === '') return null;
                    return val;
                };

                // Helper: Deep compare for objects/arrays
                // Mejorado: Comparación más robusta para detectar cambios reales
                const isDifferent = (val1, val2) => {
                    // Normalizamos ambos valores para comparación base
                    const normalizeForComp = (val) => {
                        // Importante: No normalizar booleano false a null
                        if (typeof val === 'boolean') return val;
                        if (val === null || val === undefined || String(val).trim() === '') return null;
                        // For numbers, ensure we compare numerically or as normalized strings
                        if (typeof val === 'number') return val;
                        return String(val).trim();
                    };
                    
                    const v1 = normalizeForComp(val1);
                    const v2 = normalizeForComp(val2);

                    if (v1 === v2) return false;

                    // Si son objetos/arrays, comparar por JSON (profundo)
                    if (typeof v1 === 'object' && v1 !== null && typeof v2 === 'object' && v2 !== null) {
                        // Sort keys for consistent object comparison if they are plain objects
                        if (!Array.isArray(v1) && !Array.isArray(v2)) {
                            return JSON.stringify(v1, Object.keys(v1).sort()) !== JSON.stringify(v2, Object.keys(v2).sort());
                        }
                        return JSON.stringify(v1) !== JSON.stringify(v2);
                    }

                    return v1 !== v2;
                };

                Object.keys(cleanedData).forEach(key => {
                    if (isDifferent(originalData[key], cleanedData[key])) {
                        dirtyFields[key] = cleanedData[key];
                    }
                });

                // Force include medical_history if it exists and wasn't caught (extra safety)
                if (cleanedData.medical_history && cleanedData.medical_history.length > 0) {
                    dirtyFields['medical_history'] = cleanedData.medical_history;
                }

                // CRITICAL: Always preserve photo if it changed during this session
                if (cleanedData.profile_photo && cleanedData.profile_photo !== originalData.profile_photo) {
                    dirtyFields.profile_photo = cleanedData.profile_photo;
                }

                console.log("Campos detectados como sucios (dirtyFields):", dirtyFields);

                if (Object.keys(dirtyFields).length === 0) {
                    console.log("No se detectaron cambios, saltando PATCH");
                    setLoading(false);
                    if (onSubmit) onSubmit(initialData);
                    return;
                }

                console.log("Enviando PATCH a /residents/" + initialData.id, dirtyFields);
                response = await api.patch(`/residents/${initialData.id}`, dirtyFields);
            } else {
                response = await api.post('/residents/', cleanedData);
            }

            setLoading(false); // <--- CRITICAL FIX: Unlock button after success
            if (onSubmit) {
                onSubmit(response.data);
            }
        } catch (err) {
            console.error("Error completo:", err);

            // Manejar errores de validación de FastAPI/Pydantic
            const detail = err.response?.data?.detail;

            if (Array.isArray(detail)) {
                // Lista de errores de validación
                const messages = detail.map(errorItem => {
                    const field = errorItem.loc ? errorItem.loc[errorItem.loc.length - 1] : 'Campo desconocido';
                    const msg = errorItem.msg || 'Dato inválido';
                    return `• ${field}: ${msg}`;
                }).join('\n');

                setError(`Errores de validación:\n${messages}`);

                // AUTO-SCROLL & FOCUS LOGIC FOR BACKEND ERRORS
                const firstErrorField = detail[0]?.loc ? detail[0].loc[detail[0].loc.length - 1] : null;
                if (firstErrorField) {
                    // 1. Determine Tab
                    let targetTab = 0; // Default
                    Object.entries(FIELD_TAB_MAP).forEach(([tabIndex, fields]) => {
                        if (fields.includes(firstErrorField)) targetTab = parseInt(tabIndex);
                    });

                    // 2. Switch Tab if needed
                    if (activeTab !== targetTab) {
                        setActiveTab(targetTab);
                    }

                    // 3. Scroll to Element (Wait for Tab Render)
                    setTimeout(() => {
                        const element = document.getElementsByName(firstErrorField)[0];
                        if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            element.focus();

                            // Visual Cue
                            const highlightClasses = ['!ring-4', '!ring-red-400', '!border-red-400'];
                            element.classList.add(...highlightClasses);

                            setTimeout(() => {
                                element.classList.remove(...highlightClasses);
                            }, 2500);
                        }
                    }, 150);
                    
                    setError(`Error en: ${FIELD_LABELS[firstErrorField] || firstErrorField}`);
                }
            } else if (typeof detail === 'string') {
                setError(detail);
            } else if (typeof detail === 'object' && detail !== null) {
                // Si es un objeto, lo convertimos a string legible
                setError(`Error del servidor: ${JSON.stringify(detail)}`);
            } else {
                setError(`Error inesperado: ${err.message || 'Sin detalles'}. Verifica conexión o logs.`);
            }
            // Scroll to top to show error message
            window.scrollTo(0, 0);
        } finally {
            setLoading(false);
        }
    };









    const medicalSection = (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Médico de Referencia</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Médico de Cabecera</label>
                    <input
                        type="text"
                        name="primary_doctor"
                        value={formData.primary_doctor}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Centro de Salud / Mutua</label>
                    <input
                        type="text"
                        name="health_center"
                        value={formData.health_center}
                        onChange={handleChange}
                        placeholder="Nombre Centro o Mutua"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cobertura</label>
                    <select
                        name="health_center_type"
                        value={formData.health_center_type}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                        <option value="">Seleccionar...</option>
                        <option value="ss">Seguridad Social</option>
                        <option value="private">Privado / Mutua</option>
                    </select>
                </div>

                <div>
                    {formData.health_center_type === 'private' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Urgencias Mutua</label>
                            <input
                                type="tel"
                                name="private_health_phone"
                                value={formData.private_health_phone}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Centro de Salud (8-15h)</label>
                                <input
                                    type="tel"
                                    name="health_center_phone"
                                    value={formData.health_center_phone}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">PAC / Urgencias (Fuera de horario)</label>
                                <input
                                    type="tel"
                                    name="health_center_phone_emergency"
                                    value={formData.health_center_phone_emergency}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hospital de Referencia</label>
                    <input
                        type="text"
                        name="reference_hospital"
                        value={formData.reference_hospital}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex flex-col md:flex-row gap-4 md:space-x-2 md:gap-0">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Última Visita Hosp.</label>
                        <input
                            type="date"
                            name="last_hospital_visit"
                            value={formData.last_hospital_visit || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div className="w-full md:w-1/3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                        <select
                            name="last_hospital_visit_type"
                            value={formData.last_hospital_visit_type}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                            <option value="">...</option>
                            <option value="urgency">Urgencia</option>
                            <option value="specialist">Especialista</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="mt-6 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Antecedentes Médicos y Quirúrgicos</h3>
                <DynamicListInput
                    label="Historial de Enfermedades y Cirugías Previas"
                    items={formData.medical_history || []}
                    onChange={(newItems) => {
                        setFormData(prev => ({ ...prev, medical_history: newItems }));
                    }}
                />
            </div>

            <h3 className="text-lg font-semibold text-gray-800 mt-6">Diagnósticos Principales</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                    { key: 'diagnosis_hypertension', label: 'Hipertensión' },
                    { key: 'diagnosis_diabetes', label: 'Diabetes' },
                    { key: 'diagnosis_copd', label: 'EPOC' },
                    { key: 'diagnosis_alzheimer', label: 'Alzheimer' },
                    { key: 'diagnosis_parkinson', label: 'Parkinson' },
                    { key: 'diagnosis_stroke', label: 'Ictus' },
                    { key: 'diagnosis_cardiopathy', label: 'Cardiopatía' },
                    { key: 'diagnosis_renal_failure', label: 'Insuficiencia Renal' },
                    { key: 'diagnosis_osteoporosis', label: 'Osteoporosis' },
                    { key: 'diagnosis_arthritis', label: 'Artritis' },
                    { key: 'diagnosis_cancer', label: 'Cáncer' }
                ].map(({ key, label }) => (
                    <div key={key}>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                name={key}
                                checked={formData[key] || false}
                                onChange={handleChange}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{label}</span>
                        </label>
                        {key === 'diagnosis_hypertension' && formData.diagnosis_hypertension && (
                            <div className="ml-6 mt-1">
                                <input
                                    type="text"
                                    name="diagnosis_hypertension_detail"
                                    value={formData.diagnosis_hypertension_detail || ''}
                                    onChange={handleChange}
                                    className="text-xs border border-gray-300 rounded px-2 py-1 w-full"
                                    placeholder="Detalle (ej: Sistólica aislada, Resistente...)"
                                />
                            </div>
                        )}
                        {key === 'diagnosis_diabetes' && formData.diagnosis_diabetes && (
                            <div className="ml-6 mt-1">
                                <select
                                    name="diagnosis_diabetes_type"
                                    value={formData.diagnosis_diabetes_type || ''}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className={`text-xs border rounded px-2 py-1 w-full ${errors.diagnosis_diabetes_type ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                >
                                    <option value="">Tipo...</option>
                                    <option value="type1">Tipo 1</option>
                                    <option value="type2">Tipo 2</option>
                                </select>
                                {errors.diagnosis_diabetes_type && <p className="text-red-500 text-[10px] mt-0.5">{errors.diagnosis_diabetes_type}</p>}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {formData.diagnosis_cancer && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cáncer</label>
                    <input
                        type="text"
                        name="diagnosis_cancer_type"
                        value={formData.diagnosis_cancer_type || ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 rounded-md ${errors.diagnosis_cancer_type ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                        placeholder="Especificar tipo y estadio"
                    />
                    {errors.diagnosis_cancer_type && <p className="text-red-500 text-xs mt-1">{errors.diagnosis_cancer_type}</p>}
                </div>
            )}

            <h3 className="text-lg font-semibold text-gray-800 mt-6">Alergias</h3>

            <div className="space-y-4">
                {/* Medication Allergy */}
                <div className="bg-red-50/50 p-3 rounded-xl border border-red-100">
                    <label className="flex items-center space-x-2 cursor-pointer mb-2">
                        <input
                            type="checkbox"
                            name="has_medication_allergy"
                            checked={formData.has_medication_allergy || false}
                            onChange={handleChange}
                            className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                        />
                        <span className="font-medium text-slate-800">Alergia a Medicamentos</span>
                    </label>
                    {formData.has_medication_allergy && (
                        <div className="ml-7 animate-in fade-in slide-in-from-top-2">
                            <input
                                type="text"
                                name="allergy_medication_detail"
                                value={formData.allergy_medication_detail || ''}
                                onChange={handleChange}
                                placeholder="Ej: Penicilina, AAS, Tramadol..."
                                className="w-full px-4 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 bg-white"
                            />
                        </div>
                    )}
                </div>

                {/* Food Allergy */}
                <div className="bg-orange-50/50 p-3 rounded-xl border border-orange-100">
                    <label className="flex items-center space-x-2 cursor-pointer mb-2">
                        <input
                            type="checkbox"
                            name="has_food_allergy"
                            checked={formData.has_food_allergy || false}
                            onChange={handleChange}
                            className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                        />
                        <span className="font-medium text-slate-800">Alergia Alimentaria</span>
                    </label>
                    {formData.has_food_allergy && (
                        <div className="ml-7 animate-in fade-in slide-in-from-top-2">
                            <input
                                type="text"
                                name="allergy_food_detail"
                                value={formData.allergy_food_detail || ''}
                                onChange={handleChange}
                                placeholder="Ej: Nueces, Lactosa, Gluten..."
                                className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
                            />
                        </div>
                    )}
                </div>

                {/* Food Intolerance (New) */}
                <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                    <label className="flex items-center space-x-2 cursor-pointer mb-2">
                        <input
                            type="checkbox"
                            name="has_food_intolerance"
                            checked={formData.has_food_intolerance || false}
                            onChange={(e) => {
                                handleChange(e);
                                if (e.target.checked) setFormData(prev => ({ ...prev, no_known_allergies: false }));
                            }}
                            className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                        />
                        <span className="font-medium text-slate-800">Intolerancia Alimentaria</span>
                    </label>
                    {formData.has_food_intolerance && (
                        <div className="ml-7 animate-in fade-in slide-in-from-top-2">
                            <input
                                type="text"
                                name="intolerance_food_detail"
                                value={formData.intolerance_food_detail || ''}
                                onChange={handleChange}
                                placeholder="Ej: Gluten (Celiaquía), Lactosa, Fructosa..."
                                className="w-full px-4 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                            />
                        </div>
                    )}
                </div>

                {/* Material Allergy */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <label className="flex items-center space-x-2 cursor-pointer mb-2">
                        <input
                            type="checkbox"
                            name="has_material_allergy"
                            checked={formData.has_material_allergy || false}
                            onChange={handleChange}
                            className="w-5 h-5 text-slate-600 rounded focus:ring-slate-500"
                        />
                        <span className="font-medium text-slate-800">Alergia a Materiales (Látex, etc.)</span>
                    </label>
                    {formData.has_material_allergy && (
                        <div className="ml-7 animate-in fade-in slide-in-from-top-2">
                            <input
                                type="text"
                                name="allergy_material_detail"
                                value={formData.allergy_material_detail || ''}
                                onChange={handleChange}
                                placeholder="Ej: Látex, Esparadrapo..."
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 bg-white"
                            />
                        </div>
                    )}
                </div>

                <div className="p-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="checkbox"
                            name="no_known_allergies"
                            checked={formData.no_known_allergies || false}
                            onChange={(e) => {
                                handleChange(e);
                                if (e.target.checked) {
                                    // If NKA checked -> Uncheck all others
                                    setFormData(prev => ({
                                        ...prev,
                                        has_medication_allergy: false,
                                        has_food_allergy: false,
                                        has_food_intolerance: false,
                                        has_material_allergy: false
                                    }));
                                }
                            }}
                            className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                        />
                        <span className="font-medium text-green-700">Sin Alergias Conocidas (NO RAMC)</span>
                    </label>
                </div>
            </div>
        </div>
    );

    // Due to message length limits, I'll create a placeholder for remaining sections
    // These will follow the same pattern with all fields from the formData state



    const basicInfoSection = (
        <div className="space-y-4 md:space-y-6">
            <div className="bg-white p-3 md:p-6 rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <h3 className="text-lg font-black text-slate-900 mb-4 md:mb-6 flex items-center gap-2">
                    <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">🆔</span>
                    Identificación
                </h3>

                <div className="flex flex-col gap-3 md:gap-6">
                    {/* PHOTO COLUMN - Centered on mobile, left on desktop */}
                    <div className="flex justify-center md:justify-start">
                        {initialData?.id ? (
                            <ImageUpload
                                key={initialData.id} // Force remount on resident change
                                residentId={initialData.id}
                                currentPhotoUrl={formData.profile_photo}
                                onPhotoUpdated={(newUrl) => {
                                    setFormData(prev => ({ ...prev, profile_photo: newUrl }));
                                }}
                            />
                        ) : (
                            <div className="w-24 h-24 md:w-32 md:h-32 bg-slate-100 rounded-3xl border-4 border-slate-50 shadow-inner flex items-center justify-center text-center p-2">
                                <span className="text-xs text-slate-400 font-medium">Guarde primero para subir foto</span>
                            </div>
                        )}
                    </div>

                    {/* FIELDS */}
                    <div className="space-y-3 md:space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Nombre *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    required
                                    placeholder="Ej: Josefa"
                                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-[#1E82E5] focus:bg-white outline-none transition-all font-medium ${errors.name ? 'border-red-500' : 'border-slate-200'}`}
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Apellidos *</label>
                                <input
                                    type="text"
                                    name="surname"
                                    value={formData.surname}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    required
                                    placeholder="Ej: García López"
                                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-[#1E82E5] focus:bg-white outline-none transition-all font-medium ${errors.surname ? 'border-red-500' : 'border-slate-200'}`}
                                />
                                {errors.surname && <p className="text-red-500 text-xs mt-1 font-medium">{errors.surname}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Documento de Identidad</label>
                                <div className="grid grid-cols-[85px_1fr] md:grid-cols-[100px_1fr] gap-2">
                                    <select
                                        name="document_type"
                                        value={formData.document_type || 'DNI'}
                                        onChange={handleChange}
                                        className="w-full px-2 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E82E5] outline-none text-xs md:text-sm font-medium"
                                    >
                                        <option value="DNI">DNI</option>
                                        <option value="NIE">NIE</option>
                                        <option value="PASSPORT">Pasaporte</option>
                                        <option value="OTHER">Otro</option>
                                    </select>
                                    <input
                                        type="text"
                                        name="dni_nie"
                                        value={formData.dni_nie || ''}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        autoComplete="off"
                                        placeholder={
                                            formData.document_type === 'DNI' ? "00000000X" :
                                                formData.document_type === 'NIE' ? "X0000000A" :
                                                    "Documento..."
                                        }
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-[#1E82E5] outline-none font-medium ${errors.dni_nie ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                                    />
                                </div>
                                {errors.dni_nie && <p className="text-red-500 text-xs mt-1 font-medium">{errors.dni_nie}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Fecha Nacimiento</label>
                                <input
                                    type="date"
                                    name="date_of_birth"
                                    value={formData.date_of_birth}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-[#1E82E5] outline-none ${errors.date_of_birth ? 'border-red-500' : 'border-slate-200'}`}
                                />
                                {errors.date_of_birth && <p className="text-red-500 text-xs mt-1 font-medium">{errors.date_of_birth}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Sexo</label>
                                <select
                                    name="sex"
                                    value={formData.sex || ''}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-[#1E82E5] outline-none ${errors.sex ? 'border-red-500' : 'border-slate-200'}`}
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="M">Masculino</option>
                                    <option value="F">Femenino</option>
                                </select>
                                {errors.sex && <p className="text-red-500 text-xs mt-1 font-medium">{errors.sex}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Nº Habitación *</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">#</span>
                                    <input
                                        type="text"
                                        name="room_number"
                                        value={formData.room_number}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        required
                                        placeholder="101"
                                        className={`w-full pl-8 pr-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-[#1E82E5] font-black text-lg outline-none ${errors.room_number ? 'border-red-500' : 'border-slate-200'}`}
                                    />
                                    {errors.room_number && <p className="text-red-500 text-xs mt-1 font-medium text-left">{errors.room_number}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 bg-[#1E82E5]/5 p-3 md:p-6 rounded-2xl border border-[#1E82E5]/20">
                            <div>
                                <label className="block text-sm font-bold text-[#1E82E5] mb-2">Fecha de Ingreso *</label>
                                <input
                                    type="date"
                                    name="admission_date"
                                    value={formData.admission_date || new Date().toISOString().split('T')[0]}
                                    onChange={handleChange}
                                    required
                                    max="2099-12-31" // Explicitly allow future dates
                                    className="w-full px-4 py-3 bg-white border border-[#1E82E5]/30 rounded-xl focus:ring-2 focus:ring-[#1E82E5] font-medium outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-[#1E82E5] mb-2">Hora de Ingreso</label>
                                <input
                                    type="time"
                                    name="admission_time"
                                    value={formData.admission_time || '10:00'}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-white border border-[#1E82E5]/30 rounded-xl focus:ring-2 focus:ring-[#1E82E5] font-medium outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-3 md:p-4 rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <h3 className="font-semibold text-gray-700 mb-4 border-b pb-2">Contactos y Familiares</h3>

                {/* Emergency Contact (Legacy/Primary) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-red-50 rounded-md border border-red-100">
                        <label className="block text-sm font-bold text-red-800 mb-1">Contacto Emergencia *</label>
                        <input
                            type="text"
                            name="emergency_contact"
                            value={formData.emergency_contact || ''}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            autoComplete="off"
                            required
                            placeholder="Nombre del familiar"
                            className={`w-full px-3 py-2 border rounded-md focus:ring-red-500 ${errors.emergency_contact ? 'border-red-500' : 'border-red-200'}`}
                        />
                        {errors.emergency_contact && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.emergency_contact}</p>}
                    </div>
                    <div className="p-3 bg-red-50 rounded-md border border-red-100">
                        <label className="block text-sm font-bold text-red-800 mb-1">Teléfono Emergencia *</label>
                        <input
                            type="tel"
                            name="emergency_phone"
                            value={formData.emergency_phone || ''}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            autoComplete="off"
                            required
                            placeholder="600 000 000"
                            className={`w-full px-3 py-2 border rounded-md focus:ring-red-500 ${errors.emergency_phone ? 'border-red-500' : 'border-red-200'}`}
                        />
                        {errors.emergency_phone && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.emergency_phone}</p>}
                    </div>
                </div>

                {/* Dynamic Family Contacts List */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Listado de Familiares (Orden de llamada)</label>
                    {formData.family_contacts && formData.family_contacts.length > 0 ? (
                        formData.family_contacts.map((contact, index) => (
                            <div key={index} className="flex flex-col gap-3 bg-gray-50 p-2 md:p-3 rounded-lg border border-gray-200 overflow-hidden">
                                <div className="grid grid-cols-[auto_1fr_auto] gap-2 items-center w-full">
                                    <span className="font-bold text-gray-500 text-sm min-w-[20px] text-center">{index + 1}.</span>
                                    <input
                                        type="text"
                                        placeholder="Nombre (ej: Ismael)"
                                        value={contact.name}
                                        onChange={(e) => {
                                            const newContacts = [...formData.family_contacts];
                                            newContacts[index].name = e.target.value;
                                            handleChange({ target: { name: 'family_contacts', value: newContacts } });
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-0"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newContacts = formData.family_contacts.filter((_, i) => i !== index);
                                            handleChange({ target: { name: 'family_contacts', value: newContacts } });
                                        }}
                                        className="text-red-500 hover:text-red-700 px-2 shrink-0 md:hidden"
                                    >
                                        🗑️
                                    </button>
                                </div>

                                <div className="flex flex-col md:flex-row gap-3">
                                    <input
                                        type="text"
                                        placeholder="Relación"
                                        value={contact.relation}
                                        onChange={(e) => {
                                            const newContacts = [...formData.family_contacts];
                                            newContacts[index].relation = e.target.value;
                                            handleChange({ target: { name: 'family_contacts', value: newContacts } });
                                        }}
                                        className="w-full md:flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-0"
                                    />
                                    <div className="flex gap-2 w-full md:w-auto md:flex-1">
                                        <input
                                            type="text"
                                            placeholder="Teléfono"
                                            value={contact.phone}
                                            onChange={(e) => {
                                                const newContacts = [...formData.family_contacts];
                                                newContacts[index].phone = e.target.value;
                                                handleChange({ target: { name: 'family_contacts', value: newContacts } });
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-0"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newContacts = formData.family_contacts.filter((_, i) => i !== index);
                                                handleChange({ target: { name: 'family_contacts', value: newContacts } });
                                            }}
                                            className="text-red-500 hover:text-red-700 px-2 hidden md:block"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500 italic">No hay familiares añadidos.</p>
                    )}

                    <button
                        type="button"
                        onClick={() => {
                            const current = formData.family_contacts || [];
                            handleChange({ target: { name: 'family_contacts', value: [...current, { name: '', relation: '', phone: '' }] } });
                        }}
                        className="mt-2 text-sm text-blue-600 font-medium hover:text-blue-800 flex items-center"
                    >
                        + Añadir Familiar
                    </button>
                </div>
            </div>
        </div>
    );

    const personalDataSection = (
        <div className="bg-white p-3 md:p-6 rounded-lg border border-gray-200 shadow-sm overflow-hidden space-y-4 md:space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Datos de Contacto y Personales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 items-center">
                <div className="order-2 md:order-1 space-y-4">
                    <p className="text-sm text-gray-500 italic bg-blue-50 p-3 rounded-lg border border-blue-100">
                        ℹ️ Los datos de identificación (Nombre, Apellidos, Sexo, DNI) se editan en la tarjeta superior "Identificación".
                    </p>
                </div>

                {/* PHOTO UPLOAD SECTION REMOVED FROM HERE */}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                    <input
                        type="text"
                        name="address"
                        value={formData.address || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Código Postal</label>
                        <input
                            type="text"
                            name="postal_code"
                            value={formData.postal_code || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Municipio</label>
                        <input
                            type="text"
                            name="municipality"
                            value={formData.municipality || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Residente</label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone || ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        autoComplete="off"
                        placeholder="Ej: 600123456"
                        className={`w-full px-3 py-2 border rounded-md focus:ring-slate-500 outline-none transition-all ${errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    />
                    {errors.phone && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.phone}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email || ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        autoComplete="off"
                        placeholder="ejemplo@correo.com"
                        className={`w-full px-3 py-2 border rounded-md focus:ring-slate-500 outline-none transition-all ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    />
                    {errors.email && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.email}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nacionalidad</label>
                    <input
                        type="text"
                        name="nationality"
                        value={formData.nationality || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Idioma Principal</label>
                    <input
                        type="text"
                        name="primary_language"
                        value={formData.primary_language || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                </div>
            </div>
        </div>
    );

    const statusSection = (
        <div className="space-y-6">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200 overflow-hidden">
                <h3 className="text-lg font-semibold text-red-800 mb-4">Estado y Disponibilidad</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md font-bold"
                        >
                            <option value="active">Activo</option>
                            <option value="hospitalized">Hospitalizado</option>
                            <option value="inactive">Baja Temporal</option>
                            <option value="deceased">Defunción</option>
                            <option value="deleted" className="text-red-600 font-bold bg-red-50">⚠️ ELIMINAR (Baja Definitiva)</option>
                        </select>
                    </div>
                    {formData.status === 'hospitalized' && (
                        <>
                            <div id="hospitalization-section" className="scroll-mt-24">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Hospitalización</label>
                                <div className="flex gap-2">
                                    <input
                                        type="date"
                                        name="hospitalization_date"
                                        value={formData.hospitalization_date || ''}
                                        onChange={handleChange}
                                        max={new Date().toISOString().split('T')[0]} // Block future dates
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const today = new Date().toISOString().split('T')[0];
                                            setFormData(prev => ({
                                                ...prev,
                                                hospitalization_date: today
                                            }));
                                        }}
                                        className="px-3 py-2 bg-slate-100 text-slate-700 rounded-md text-xs font-bold hover:bg-slate-200 transition-colors whitespace-nowrap"
                                        title="Poner fecha de hoy"
                                    >
                                        HOY
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Alta (Prevista/Real)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="date"
                                        name="hospitalization_end_date"
                                        value={formData.hospitalization_end_date || ''}
                                        onChange={handleChange}
                                        max={new Date().toISOString().split('T')[0]} // Block future dates
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        title="Si cambia el estado a Activo, esta será la fecha de alta histórica"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const today = new Date().toISOString().split('T')[0];
                                            setFormData(prev => ({
                                                ...prev,
                                                status: 'active',
                                                hospitalization_end_date: today
                                            }));
                                        }}
                                        className="px-3 py-2 bg-green-100 text-green-700 rounded-md text-xs font-bold hover:bg-green-200 transition-colors whitespace-nowrap"
                                        title="Marcar como Activo y poner fecha de hoy"
                                    >
                                        DAR ALTA
                                    </button>
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Hospital</label>
                                <input
                                    type="text"
                                    name="hospitalization_hospital"
                                    value={formData.hospitalization_hospital || ''}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    placeholder="Nombre del hospital"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de Hospitalización</label>
                                <textarea
                                    name="hospitalization_reason"
                                    value={formData.hospitalization_reason || ''}
                                    onChange={handleChange}
                                    rows="2"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    placeholder="Motivo del ingreso hospitalario"
                                />
                            </div>
                        </>
                    )}
                    {(formData.status === 'inactive' || formData.status === 'deceased') && (
                        <div id="inactive-section" className="scroll-mt-24">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Fecha de {formData.status === 'deceased' ? 'Defunción' : 'Baja'}
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            name="inactive_date"
                                            value={formData.inactive_date || ''}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const today = new Date().toISOString().split('T')[0];
                                                setFormData(prev => ({
                                                    ...prev,
                                                    inactive_date: today
                                                }));
                                            }}
                                            className="px-3 py-2 bg-slate-100 text-slate-700 rounded-md text-xs font-bold hover:bg-slate-200 transition-colors whitespace-nowrap"
                                            title="Poner fecha de hoy"
                                        >
                                            HOY
                                        </button>
                                    </div>
                                </div>
                                {formData.status === 'inactive' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha regreso prevista</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="date"
                                                name="return_date"
                                                value={formData.return_date || ''}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const today = new Date().toISOString().split('T')[0];
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        status: 'active',
                                                        return_date: today
                                                    }));
                                                }}
                                                className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-md text-xs font-bold hover:bg-emerald-200 transition-colors whitespace-nowrap"
                                                title="Finalizar periodo de baja y cambiar estado a Activo"
                                            >
                                                DAR ALTA
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {formData.status === 'deceased' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Lugar de Fallecimiento</label>
                                        <input
                                            type="text"
                                            name="death_place"
                                            value={formData.death_place || ''}
                                            onChange={handleChange}
                                            placeholder="Ej: Residencia, Hospital..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="md:col-span-2 mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo / Observaciones</label>
                                <textarea
                                    name="inactive_reason"
                                    value={formData.inactive_reason || ''}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder={formData.status === 'deceased' ? "Detalles opcionales..." : "Indique el motivo de la baja..."}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* HISTORIAL DE HOSPITALIZACIONES (Solo mostrar si hay datos) */}
                {formData.hospitalization_history && formData.hospitalization_history.length > 0 && (
                    <div className="mt-6 border-t border-red-200 pt-4">
                        <h4 className="font-bold text-red-800 mb-3 text-xs uppercase tracking-wider flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-400"></span>
                            Historial de Ingresos
                        </h4>
                        <div className="bg-white rounded-lg border border-red-100 overflow-hidden shadow-sm">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-red-50 text-red-900 font-bold border-b border-red-100">
                                    <tr>
                                        <th className="px-4 py-3 text-xs uppercase">Fecha Ingreso</th>
                                        <th className="px-4 py-3 text-xs uppercase">Fecha Alta</th>
                                        <th className="px-4 py-3 text-xs uppercase">Hospital</th>
                                        <th className="px-4 py-3 text-xs uppercase">Motivo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-red-50">
                                    {formData.hospitalization_history.map((h, idx) => (
                                        <tr key={idx} className="hover:bg-red-50/30 transition-colors">
                                            <td className="px-4 py-2.5 font-medium text-red-900 border-r border-red-50">{h.start || '-'}</td>
                                            <td className="px-4 py-2.5 text-gray-600 border-r border-red-50">{h.end || '-'}</td>
                                            <td className="px-4 py-2.5 font-medium text-gray-800 border-r border-red-50">{h.hospital || '-'}</td>
                                            <td className="px-4 py-2.5 text-gray-500 truncate max-w-[200px]" title={h.reason}>{h.reason || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    // === CANONICAL 12-SECTION TABS: Tab 0 (Admin) + 11 Gordon Functional Health Patterns ===
    const tabs = [
        // TAB 0: IDENTIFICACIÓN Y ADMINISTRACIÓN (Non-clinical data)
        {
            label: '0. Identificación y Admin',
            content: (
                <div className={!canEditSection(0) ? 'opacity-80 pointer-events-none' : ''}>
                    <div className="space-y-6">
                        {basicInfoSection}
                        {personalDataSection}
                        {statusSection}
                    </div>
                </div>
            ),
            badge: 'Obligatorio'
        },

        {
            label: '1. Percepción-Manejo de la salud',
            content: (
                <div className={!canEditSection(1) ? 'opacity-70 pointer-events-none' : ''}>
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-lg">
                        <p className="text-sm text-blue-700 font-bold">Patrón 1: Percepción-Manejo de la salud</p>
                        <p className="text-xs text-blue-600 mt-1">Médico, Diagnósticos, Alergias, Vacunas</p>
                    </div>
                    {medicalSection}
                    <VaccineSection formData={formData} handleChange={handleChange} />
                </div>
            )
        },

        {
            label: '2. Nutricional-Metabólico',
            content: (
                <div className={!canEditSection(2) ? 'opacity-70 pointer-events-none' : ''}>
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-lg">
                        <p className="text-sm text-green-700 font-bold">Patrón 2: Nutricional-Metabólico</p>
                        <p className="text-xs text-green-600 mt-1">Dieta, Peso, Disfagia, Suplementación</p>
                    </div>
                    <NutritionSection formData={formData} handleChange={handleChange} />
                </div>
            )
        },

        // TAB 3: PATRÓN 3 - ELIMINACIÓN
        {
            label: '3. Eliminación',
            content: (
                <div className={!canEditSection(3) ? 'opacity-70 pointer-events-none' : ''}>
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-lg">
                        <p className="text-sm text-yellow-700 font-bold">Patrón 3: Eliminación</p>
                        <p className="text-xs text-yellow-600 mt-1">Continencia, Pañales</p>
                    </div>
                    <HygieneSection formData={formData} handleChange={handleChange} />
                </div>
            )
        },

        {
            label: '4. Actividad-Ejercicio',
            content: (
                <div className={!canEditSection(4) ? 'opacity-70 pointer-events-none' : ''}>
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
                        <p className="text-sm text-red-700 font-bold">Patrón 4: Actividad-Ejercicio</p>
                        <p className="text-xs text-red-600 mt-1">Movilidad, Dispositivos, Terapias</p>
                    </div>
                    <MobilitySection formData={formData} handleChange={handleChange} />
                    <TherapySection formData={formData} handleChange={handleChange} />
                </div>
            )
        },

        {
            label: '5. Sueño-Descanso',
            content: (
                <div className={!canEditSection(5) ? 'opacity-70 pointer-events-none' : ''}>
                    <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-6 rounded-lg">
                        <p className="text-sm text-indigo-700 font-bold">Patrón 5: Sueño-Descanso</p>
                        <p className="text-xs text-indigo-600 mt-1">Patrón de sueño, Medicación</p>
                    </div>
                    <SleepSection formData={formData} handleChange={handleChange} />
                </div>
            )
        },

        {
            label: '6. Cognitivo-Perceptivo',
            content: (
                <div className={!canEditSection(6) ? 'opacity-70 pointer-events-none' : ''}>
                    <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-6 rounded-lg">
                        <p className="text-sm text-purple-700 font-bold">Patrón 6: Cognitivo-Perceptivo</p>
                        <p className="text-xs text-purple-600 mt-1">Deterioro, Dolor, Comunicación</p>
                    </div>
                    <CognitiveSection formData={formData} handleChange={handleChange} />
                </div>
            )
        },

        // TAB 7: PATRÓN 7 - AUTOPERCEPCIÓN Y AUTOCONCEPTO
        {
            label: '7. Autopercepción-Autoconcepto',
            content: (
                <div className={!canEditSection(7) ? 'opacity-70 pointer-events-none' : ''}>
                    <div className="bg-pink-50 border-l-4 border-pink-500 p-4 mb-6 rounded-lg">
                        <p className="text-sm text-pink-700 font-bold">Patrón 7: Autopercepción-Autoconcepto</p>
                        <p className="text-xs text-pink-600 mt-1">Estado de ánimo, Imagen corporal</p>
                    </div>
                    <AutopercepcionSection formData={formData} handleChange={handleChange} handleBlur={handleBlur} />
                </div>
            )
        },

        // TAB 8: PATRÓN 8 - ROL Y RELACIONES
        {
            label: '8. Rol-Relaciones',
            content: (
                <div className={!canEditSection(8) ? 'opacity-70 pointer-events-none' : ''}>
                    <div className="bg-cyan-50 border-l-4 border-cyan-500 p-4 mb-6 rounded-lg">
                        <p className="text-sm text-cyan-700 font-bold">Patrón 8: Rol-Relaciones</p>
                        <p className="text-xs text-cyan-600 mt-1">Familia, Visitas, Relaciones</p>
                    </div>
                    <RelacionesSection formData={formData} handleChange={handleChange} handleBlur={handleBlur} />
                </div>
            )
        },

        {
            label: '9. Sexualidad-Reproducción',
            content: (
                <div className={!canEditSection(9) ? 'opacity-70 pointer-events-none' : ''}>
                    <div className="bg-rose-50 border-l-4 border-rose-500 p-4 mb-6 rounded-lg">
                        <p className="text-sm text-rose-700 font-bold">Patrón 9: Sexualidad-Reproducción</p>
                        <p className="text-xs text-rose-600 mt-1">Identidad, Satisfacción sexual</p>
                    </div>
                    <SexualitySection formData={formData} handleChange={handleChange} handleBlur={handleBlur} />
                </div>
            )
        },

        // TAB 10: PATRÓN 10 - ADAPTACIÓN Y TOLERANCIA AL ESTRÉS
        {
            label: '10. Tolerancia al Estrés',
            content: (
                <div className={!canEditSection(10) ? 'opacity-70 pointer-events-none' : ''}>
                    <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6 rounded-lg">
                        <p className="text-sm text-orange-700 font-bold">Patrón 10: Adaptación y Tolerancia al Estrés</p>
                        <p className="text-xs text-orange-600 mt-1">Conductas, Sujeciones</p>
                    </div>
                    <PermissionsSection formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                </div>
            )
        },

        {
            label: '11. Valores-Creencias',
            content: (
                <div className={!canEditSection(11) ? 'opacity-70 pointer-events-none' : ''}>
                    <div className="bg-teal-50 border-l-4 border-teal-500 p-4 mb-6 rounded-lg">
                        <p className="text-sm text-teal-700 font-bold">Patrón 11: Valores-Creencias</p>
                        <p className="text-xs text-teal-600 mt-1">Voluntades Anticipadas, Observaciones</p>
                    </div>
                    <ObservationsSection formData={formData} handleChange={handleChange} handleBlur={handleBlur} errors={errors} />
                </div>
            )
        }
    ];

    // === RENDER ===
    const Content = (
        <div className={`flex flex-col bg-white overflow-hidden ${isModal ? 'rounded-3xl w-full max-w-7xl shadow-2xl h-[90vh] my-auto' : 'w-full h-full rounded-[2rem] md:border-2 md:border-[#0F172A] md:shadow-xl'}`}>
            <div className={`px-4 md:px-6 py-6 md:py-8 flex bg-white z-10 gap-2 items-center justify-between border-b-2 border-slate-100 ${isModal ? 'rounded-t-3xl' : 'md:rounded-t-[2rem]'}`}>
                <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="w-10 h-10 md:w-12 md:h-12 bg-[#0F172A] hover:bg-slate-800 text-white rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 shrink-0"
                            title="Volver"
                        >
                            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                    )}
                    <div className="min-w-0 flex-1">
                        <h2 className="text-xl md:text-3xl font-black text-slate-800 leading-tight uppercase tracking-tight block whitespace-normal break-words">
                            {initialData?.id ? `${initialData.name} ${initialData.surname || ''}` : 'Nuevo Residente'}
                        </h2>
                        <p className="hidden md:block text-slate-500 text-sm font-medium whitespace-normal break-words">
                            {initialData?.id ? 'Gestión Integral del Expediente Digital' : 'Alta en el sistema'}
                        </p>
                    </div>
                </div>

                <button
                    type="submit"
                    form="resident-form"
                    disabled={isSubmitting}
                    className={`bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg rounded-2xl w-9 h-9 md:w-12 md:h-12 flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 shrink-0`}
                    title={isSubmitting ? "Guardando..." : "Guardar Cambios"}
                >
                    {isSubmitting ? (
                        <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />
                    )}
                </button>
            </div>

            {/* Tabs (Freely scrollable on mobile) */}
            <div className="bg-slate-50 px-3 md:px-6 py-3 border-b border-slate-200">
                <TabbedForm
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />
            </div>



            {/* Scrollable Content Area */}
            <div ref={contentRef} className="flex-1 overflow-y-auto p-3 md:p-6 lg:p-8 bg-slate-50/50">
                <div className="max-w-7xl mx-auto">
                    <form id="resident-form" onSubmit={handleSubmit} className="space-y-6">
                        {tabs[activeTab]?.content}
                    </form>
                </div>
            </div>

            <div className={`px-3 md:px-6 py-8 border-t border-slate-200 bg-white flex flex-col md:flex-row justify-between items-center gap-6 z-10 ${isModal ? 'rounded-b-3xl' : 'md:rounded-b-[2rem]'}`}>
                <div className="hidden md:flex flex-1">
                    {Object.keys(errors).length > 0 && (
                        <div className="flex items-center text-red-600 text-xs font-black bg-red-50 px-4 py-2 rounded-2xl border border-red-100 animate-in fade-in slide-in-from-left-2">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Pendientes: {Object.keys(errors).length} campos
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3 md:gap-8 bg-slate-50 p-2 md:p-4 rounded-[2rem] border border-slate-100 shadow-inner w-fit mx-auto md:w-auto justify-center">
                    <button
                        type="button"
                        onClick={() => setActiveTab(Math.max(0, activeTab - 1))}
                        disabled={activeTab === 0}
                        className="w-12 h-12 md:w-14 md:h-14 bg-white border border-slate-200 shadow-sm hover:shadow-md hover:bg-slate-50 text-slate-600 rounded-2xl transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center shrink-0 active:scale-95 group"
                        title="Anterior"
                    >
                        <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 group-hover:-translate-x-0.5 transition-transform" />
                    </button>

                    <div className="flex flex-col items-center px-4 md:px-8 min-w-[100px] md:min-w-[140px]">
                        <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sección</span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-xl md:text-2xl font-black text-blue-600">{activeTab + 1}</span>
                            <span className="text-slate-300 font-bold text-lg">/</span>
                            <span className="text-xl md:text-2xl font-black text-slate-300">{tabs.length}</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setActiveTab(Math.min(tabs.length - 1, activeTab + 1))}
                        disabled={activeTab === tabs.length - 1}
                        className="w-12 h-12 md:w-14 md:h-14 bg-blue-600 border border-blue-500 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:bg-blue-700 text-white rounded-2xl transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center shrink-0 active:scale-95 group"
                        title="Siguiente"
                    >
                        <ChevronRight className="w-6 h-6 md:w-8 md:h-8 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>

                <div className="flex-1 flex justify-end">
                    <div className="text-right flex flex-col items-end">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Alta de Residente</span>
                        <div className="h-1.5 w-32 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                            <div
                                className="h-full bg-[#0F172A] transition-all duration-500"
                                style={{ width: `${((activeTab + 1) / tabs.length) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );

    if (isModal) {
        return (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                {Content}
            </div>
        );
    }

    return Content;
}
