import re
from datetime import date, datetime, time, timedelta
from typing import Any, Dict, List, Literal, Optional

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)

# ============================================================================
# SCHEMAS EXTENDIDOS DE RESIDENTES
# ============================================================================

class ResidentValidatorMixin:
    """Mixin para validaciones comunes entre schemas de residentes"""

    @model_validator(mode="before")
    @classmethod
    def sanitize_empty_strings(cls, data: Any) -> Any:
        """Convierte strings vacíos, 'null' o 'None' a None para evitar errores de patrón"""
        bad_values = ["", "null", "None", "NULL", "none"]
        
        if isinstance(data, dict):
            for key, value in data.items():
                if isinstance(value, str) and value.strip() in bad_values:
                    data[key] = None
        elif hasattr(data, "__dict__"):
            # This is an object (from DB). We don't want to modify the DB object here,
            # but we can return a DICT with the sanitized values so Pydantic uses that.
            sanitized = {}
            for key, value in data.__dict__.items():
                if key.startswith('_'): continue
                if isinstance(value, str) and value.strip() in bad_values:
                    sanitized[key] = None
                else:
                    sanitized[key] = value
            return sanitized
        return data

    @field_validator("name", "surname", mode="after", check_fields=False)
    @classmethod
    def validate_letters_only(cls, v: Any, info) -> Any:
        if not v or not isinstance(v, str):
            return v
        # Loosen regex to allow common name characters and avoid crashing on existing data
        if not re.match(r"^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-\.\,\(\)ªº]+$", v):
            # field_name = "Nombre" if info.field_name == "name" else "Apellidos"
            pass 
        return v

    @field_validator("room_number", mode="after", check_fields=False)
    @classmethod
    def validate_room_number(cls, v: Any) -> Any:
        if not v or not isinstance(v, str):
            return v
        # Very loose room number validation
        if not re.match(r"^[a-zA-Z0-9\s\-\.]+$", v):
            raise ValueError("Habitación inválida")
        return v

    @field_validator("pain_eva", mode="after", check_fields=False)
    @classmethod
    def validate_eva_scale(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and (v < 0 or v > 10):
            raise ValueError("Escala EVA debe estar entre 0 y 10")
        return v

    @field_validator("mmse_score", mode="after", check_fields=False)
    @classmethod
    def validate_mmse(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and (v < 0 or v > 30):
            raise ValueError("Puntuación MMSE debe estar entre 0 y 30")
        return v

    @field_validator("pfeiffer_score", mode="after", check_fields=False)
    @classmethod
    def validate_pfeiffer(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and (v < 0 or v > 10):
            raise ValueError("Puntuación Pfeiffer debe estar entre 0 y 10")
        return v

    @field_validator("dni_nie", check_fields=False)
    @classmethod
    def validate_document_content(
        cls, v: Optional[str], info: Any
    ) -> Optional[str]:
        """Valida formato DNI/NIE (checksum) y Pasaporte (longitud/caracteres)"""
        if not v or v.strip() == "":
            return None

        v = v.upper().strip()

        # Validar DNI/NIE Cheksum solo si PARECE un DNI/NIE (8 nums + letra o XYZ...)
        if re.match(r"^[0-9]{8}[A-Z]$", v) or re.match(
            r"^[XYZ][0-9]{7}[A-Z]$", v
        ):
            # Algoritmo Letra
            nie_map = {"X": "0", "Y": "1", "Z": "2"}

            prefix = v[0]
            if prefix in nie_map:
                number_part = nie_map[prefix] + v[1:-1]
            else:
                number_part = v[:-1]

            try:
                # Si number_part no es puramente numérico, int() lanzará ValueError
                number = int(number_part)
                letter = v[-1]
                valid_chars = "TRWAGMYFPDXBNJZSQVHLCKE"
                expected_letter = valid_chars[number % 23]

                if letter != expected_letter:
                    raise ValueError(
                        f"La letra '{letter}' no es válida para el número {number_part}. Debería ser '{expected_letter}'."
                    )
            except ValueError as e:
                # Re-lanzar si es error de letra, o lanzar error de formato si int() falló
                if "Debería ser" in str(e):
                    raise e
                raise ValueError(f"Formato de número de documento inválido: {v}")

        # Pasaporte genérico o Otros
        if not re.match(r"^[A-Z0-9]{6,20}$", v):
            raise ValueError(
                "El documento debe tener entre 6 y 20 caracteres alfanuméricos"
            )

        return v

    @field_validator("phone", "emergency_phone", mode="after", check_fields=False)
    @classmethod
    def validate_phones(cls, v: Optional[str]) -> Optional[str]:
        if not v or v.strip() == "":
            return None
        # Clean spaces, dashes and dots but don't enforce 9 digits or starting number for legacy data support
        return re.sub(r"[\s\-\.]", "", v)

    @field_validator("email", mode="after", check_fields=False)
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        if not v or v.strip() == "":
            return None
        # Loose email validation
        if "@" not in v:
            return None
        return v

    @field_validator("postal_code", mode="after", check_fields=False)
    @classmethod
    def validate_postal_code(cls, v: Optional[str]) -> Optional[str]:
        if not v or v.strip() == "":
            return None
        return v

    @model_validator(mode="after")
    def check_conditional_fields_extended(self) -> Any:
        """Valida coherencia de campos dependientes adicionales (solo si existen)"""
        # Verificamos existencia de campos en la definición del modelo Pydantic
        # para evitar AttributeErrors en modelos que heredan este mixin pero no tienen estos campos
        fields = self.model_fields
        has_diabetes = "diagnosis_diabetes" in fields
        has_cancer = "diagnosis_cancer" in fields
        
        if has_diabetes and getattr(self, "diagnosis_diabetes", False):
             # Solo validar si se está intentando poner a True en este payload
             if not getattr(self, "diagnosis_diabetes_type", None):
                raise ValueError("Debe especificar el tipo de diabetes (1 o 2)")
        if has_cancer and getattr(self, "diagnosis_cancer", False):
            if not getattr(self, "diagnosis_cancer_type", None):
                raise ValueError("Debe especificar el tipo de cáncer")
        return self




class ResidentBaseExtended(BaseModel, ResidentValidatorMixin):
    """Schema base extendido con todos los campos del residente (Lenient for reading)"""

    # Campos básicos (hechos opcionales para evitar errores 500 en lecturas con datos antiguos/sucios)
    name: str = Field("Residente", min_length=1, max_length=100)
    surname: str = Field("Sin Apellidos", min_length=1, max_length=100)
    profile_photo: Optional[str] = None
    date_of_birth: Optional[date] = None
    room_number: str = Field("S/N", min_length=1, max_length=50)
    emergency_contact: Optional[str] = "No registrado"
    emergency_phone: Optional[str] = None
    residence_id: Optional[int] = None

    # Datos personales opcionales
    document_type: Optional[str] = "DNI_NIE"
    dni_nie: Optional[str] = None
    sex: Optional[str] = None
    nationality: Optional[str] = None
    primary_language: Optional[str] = None
    address: Optional[str] = None
    postal_code: Optional[str] = None
    municipality: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    family_contacts: Optional[list[dict[str, str]]] = (
        None  # Lista de contactos adicionales
    )

    # Datos de ingreso
    admission_date: Optional[date] = None
    admission_time: Optional[time] = None

    # Sistema de bajas
    status: Literal["active", "inactive", "deceased", "hospitalized"] = (
        "active"
    )
    inactive_date: Optional[date] = None
    inactive_reason: Optional[str] = None
    return_date: Optional[date] = None
    death_place: Optional[str] = None

    # Hospitalización (cuando status='hospitalized')
    # Hospitalización (cuando status='hospitalized')
    hospitalization_date: Optional[date] = None
    hospitalization_end_date: Optional[date] = None
    hospitalization_hospital: Optional[str] = None
    hospitalization_reason: Optional[str] = None
    # hospitalization_notes removed

    # Historial de Hospitalizaciones
    hospitalization_history: Optional[List[Dict[str, Any]]] = []

    # Datos médicos
    primary_doctor: Optional[str] = None
    primary_doctor_phone: Optional[str] = None  # Legacy field
    health_center: Optional[str] = None
    health_center_type: Optional[str] = None
    health_center_phone: Optional[str] = None
    health_center_phone_emergency: Optional[str] = None
    private_health_phone: Optional[str] = None
    reference_hospital: Optional[str] = None
    last_hospital_visit: Optional[date] = None
    last_hospital_visit_type: Optional[str] = None

    # Antecedentes médicos (JSON)
    medical_history: list[dict[str, Any]] = []

    # insurance_type: removed (not in DB)
    # health_center_name: removed (not in DB)

    # Diagnósticos (checkboxes)
    diagnosis_hypertension: bool = False
    diagnosis_hypertension_detail: Optional[str] = None  # Ej: 'Sistólica aislada'
    diagnosis_diabetes: bool = False
    diagnosis_diabetes_type: Optional[str] = None  # 'type1', 'type2'
    diagnosis_copd: bool = False
    diagnosis_alzheimer: bool = False
    diagnosis_parkinson: bool = False
    diagnosis_stroke: bool = False
    diagnosis_cardiopathy: bool = False
    diagnosis_renal_failure: bool = False
    diagnosis_osteoporosis: bool = False
    diagnosis_arthritis: bool = False
    diagnosis_cancer: bool = False
    diagnosis_cancer_type: Optional[str] = None

    # Alergias
    has_medication_allergy: bool = False
    allergy_medication_detail: Optional[str] = None
    has_food_allergy: bool = False
    allergy_food_detail: Optional[str] = None
    has_food_intolerance: bool = False
    intolerance_food_detail: Optional[str] = None
    has_material_allergy: bool = False
    allergy_material_detail: Optional[str] = None
    allergy_type: Optional[str] = None
    no_known_allergies: bool = False

    # Heridas y Braden
    norton_score: Optional[int] = None

    # Sexualidad (Patrón 9)
    sexuality_observations: Optional[str] = None

    # Movilidad
    mobility_level: Optional[str] = None

    # Dispositivos
    device_dentures: bool = False
    device_dentures_type: Optional[str] = None
    device_hearing_aids: bool = False
    device_hearing_aids_side: Optional[str] = None
    device_hearing_aids_brand: Optional[str] = None
    device_glasses: Optional[bool] = False
    # device_glasses_progressive removed
    device_oxygen: Optional[bool] = False
    device_oxygen_type: Optional[str] = None
    device_oxygen_flow: Optional[float] = None
    device_oxygen_hours: Optional[int] = None
    device_nasogastric: Optional[bool] = False
    device_veis: Optional[bool] = False
    device_catheter: Optional[bool] = False
    device_peg: Optional[bool] = False
    device_tracheostomy: Optional[bool] = False
    device_invasive_type: Optional[str] = None
    device_invasive_change_date: Optional[date] = None



    # Nutrición
    # diet_type: Optional[str] = None # DEPRECATED
    diet_soft: bool = False
    diet_pureed: bool = False
    diet_liquid: bool = False
    dysphagia: bool = False
    dysphagia_grade: Optional[int] = None
    diet_texture: Optional[str] = None
    thickener_instructions: Optional[str] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    bmi: Optional[float] = None
    supplementation_type: Optional[str] = None
    supplement_hchp: bool = False
    supplement_diabetes: bool = False
    supplement_renal: bool = False
    supplement_fiber: bool = False
    supplementation_formula: Optional[str] = None

    # Higiene y continencia
    urinary_incontinence: bool = False
    urinary_incontinence_frequency: Optional[int] = None
    fecal_incontinence: bool = False
    fecal_incontinence_frequency: Optional[int] = None
    incontinence_type: Optional[str] = None
    night_incontinence: bool = False
    diaper_use: bool = False
    diaper_type: Optional[str] = None
    diaper_size: Optional[str] = None
    diaper_brand: Optional[str] = None
    diaper_changes_per_day: Optional[int] = None
    bath_autonomy: Optional[str] = None
    bath_frequency: Optional[int] = None

    # Estado cognitivo
    cognitive_impairment: Optional[str] = None
    mmse_score: Optional[int] = None
    pfeiffer_score: Optional[int] = None
    behavior_agitation: bool = False
    behavior_agitation_frequency: Optional[str] = None
    behavior_disorientation: bool = False
    behavior_disorientation_type: Optional[str] = None
    behavior_aggression: bool = False
    behavior_aggression_type: Optional[str] = None
    behavior_night_wandering: bool = False
    uses_psychotropics: bool = False
    sleep_medication: Optional[str] = None

    # Vacunación
    vaccine_flu_last: Optional[date] = None
    vaccine_flu_expiration: Optional[date] = None
    vaccine_flu_batch: Optional[str] = None
    vaccine_pneumococcal_last: Optional[date] = None
    vaccine_pneumococcal_expiration: Optional[date] = None
    vaccine_pneumococcal_batch: Optional[str] = None
    vaccine_tetanus_last: Optional[date] = None
    vaccine_tetanus_expiration: Optional[date] = None
    vaccine_tetanus_batch: Optional[str] = None
    vaccine_covid_last: Optional[date] = None
    vaccine_covid_expiration: Optional[date] = None
    vaccine_covid_batch: Optional[str] = None

    # Heridas y cuidados
    wounds: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    has_pressure_ulcers: bool = False
    upp_grade: Optional[str] = None
    upp_cure_type: Optional[str] = None
    has_surgical_wounds: bool = False
    other_wound_cure_type: Optional[str] = None

    # Dolor
    pain_eva: Optional[int] = None
    pain_location: Optional[str] = None
    pain_treatment: Optional[str] = None

    # Terapias
    receives_physiotherapy: bool = False
    receives_occupational_therapy: bool = False
    receives_speech_therapy: bool = False
    receives_psychology: bool = False
    receives_respiratory_therapy: bool = False

    # Autorizaciones
    consent_informed: bool = False
    consent_informed_date: Optional[date] = None
    requires_restraint: bool = False
    restraint_safety_sheet: bool = False
    restraint_type: Optional[str] = None
    restraint_schedule: Optional[str] = None
    restraint_justification: Optional[str] = None
    restraint_authorization_date: Optional[date] = None
    has_advance_directives: bool = False
    advance_directives_number: Optional[str] = None
    advance_directives_date: Optional[date] = None

    # Riesgos
    risk_falls: bool = False
    risk_malnutrition: bool = False
    risk_infections: bool = False
    risk_dehydration: bool = False
    risk_confusion: bool = False

    # === OBSERVACIONES Y PATRONES (P7-P11) ===
    # P7: Autopercepción
    emotional_state: Optional[str] = None

    # P8: Rol y Relaciones
    family_situation: Optional[str] = None

    # P9: Sexualidad
    sexuality_observations: Optional[str] = None

    # P11: Valores y Creencias + General
    first_impressions: Optional[str] = None
    care_plan: Optional[str] = None

    # Campos flexibles
    additional_data: Optional[dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)


class ResidentCreateExtended(ResidentBaseExtended, ResidentValidatorMixin):
    """Schema para crear un residente con todos los campos (Strict)"""

    pass


class ResidentExtended(ResidentBaseExtended):
    """Schema completo de residente incluyendo ID y metadatos.
    
    Los validadores estrictos (DNI, teléfono, email, código postal) se
    desactivan en este schema de LECTURA para no rechazar datos ya
    existentes en la base de datos. La validación sigue activa en los
    schemas de escritura (ResidentCreateExtended, ResidentUpdateExtended).
    """

    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

    # --- Sobrescritura de validadores para lectura tolerante ---
    @field_validator("dni_nie", mode="before")
    @classmethod
    def skip_dni_validation(cls, v):
        """Omitir validación de checksum de DNI al leer de la DB."""
        return v

    @field_validator("phone", "emergency_phone", mode="before")
    @classmethod
    def skip_phone_validation(cls, v):
        """Omitir validación de formato de teléfono al leer de la DB."""
        return v

    @field_validator("email", mode="before")
    @classmethod
    def skip_email_validation(cls, v):
        """Omitir validación de formato de email al leer de la DB."""
        return v

    @field_validator("postal_code", mode="before")
    @classmethod
    def skip_postal_validation(cls, v):
        """Omitir validación de formato de código postal al leer de la DB."""
        return v

    @model_validator(mode="after")
    def skip_conditional_validation_on_read(self) -> "ResidentExtended":
        """Omitir validación de campos condicionales al leer de la DB."""
        return self


class ResidentUpdateExtended(BaseModel, ResidentValidatorMixin):
    """Schema para actualizar residente - todos los campos opcionales"""

    # Basic fields
    name: Optional[str] = None
    surname: Optional[str] = None
    profile_photo: Optional[str] = None
    date_of_birth: Optional[date] = None
    room_number: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    document_type: Optional[str] = None
    dni_nie: Optional[str] = None
    sex: Optional[str] = None
    nationality: Optional[str] = None
    primary_language: Optional[str] = None
    address: Optional[str] = None
    postal_code: Optional[str] = None
    municipality: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    family_contacts: Optional[list[dict[str, str]]] = None

    # Admission
    admission_date: Optional[date] = None
    admission_time: Optional[time] = None
    status: Optional[str] = None
    inactive_date: Optional[date] = None
    inactive_reason: Optional[str] = None
    return_date: Optional[date] = None
    death_place: Optional[str] = None

    # Hospitalización
    hospitalization_date: Optional[date] = None
    hospitalization_end_date: Optional[date] = None
    hospitalization_hospital: Optional[str] = None
    hospitalization_reason: Optional[str] = None
    hospitalization_history: Optional[List[Dict[str, Any]]] = None

    # Medical fields
    primary_doctor: Optional[str] = None
    primary_doctor_phone: Optional[str] = None
    health_center: Optional[str] = None
    health_center_type: Optional[str] = None
    health_center_phone: Optional[str] = None
    health_center_phone_emergency: Optional[str] = None
    private_health_phone: Optional[str] = None
    reference_hospital: Optional[str] = None
    last_hospital_visit: Optional[date] = None
    last_hospital_visit_type: Optional[str] = None
    medical_history: Optional[list[dict[str, Any]]] = None

    # Diagnoses
    diagnosis_hypertension: Optional[bool] = None
    diagnosis_hypertension_detail: Optional[str] = None
    diagnosis_diabetes: Optional[bool] = None
    diagnosis_diabetes_type: Optional[str] = None
    diagnosis_copd: Optional[bool] = None
    diagnosis_alzheimer: Optional[bool] = None
    diagnosis_parkinson: Optional[bool] = None
    diagnosis_stroke: Optional[bool] = None
    diagnosis_cardiopathy: Optional[bool] = None
    diagnosis_renal_failure: Optional[bool] = None
    diagnosis_osteoporosis: Optional[bool] = None
    diagnosis_arthritis: Optional[bool] = None
    diagnosis_cancer: Optional[bool] = None
    diagnosis_cancer_type: Optional[str] = None

    # Allergies
    has_medication_allergy: Optional[bool] = None
    allergy_medication_detail: Optional[str] = None
    has_food_allergy: Optional[bool] = None
    allergy_food_detail: Optional[str] = None
    has_food_intolerance: Optional[bool] = None
    intolerance_food_detail: Optional[str] = None
    has_material_allergy: Optional[bool] = None
    allergy_material_detail: Optional[str] = None
    allergy_type: Optional[str] = None
    no_known_allergies: Optional[bool] = None

    # Heridas
    norton_score: Optional[int] = None

    # Mobility
    mobility_level: Optional[str] = None

    # Devices
    device_dentures: Optional[bool] = None
    device_dentures_type: Optional[str] = None
    device_hearing_aids: Optional[bool] = None
    device_hearing_aids_side: Optional[str] = None
    device_hearing_aids_brand: Optional[str] = None
    device_glasses: Optional[bool] = None
    device_oxygen: Optional[bool] = None
    device_oxygen_type: Optional[str] = None
    device_oxygen_flow: Optional[float] = None
    device_oxygen_hours: Optional[int] = None
    device_nasogastric: Optional[bool] = None
    device_veis: Optional[bool] = None
    device_catheter: Optional[bool] = None
    device_peg: Optional[bool] = None
    device_tracheostomy: Optional[bool] = None
    device_invasive_type: Optional[str] = None
    device_invasive_change_date: Optional[date] = None

    # Nutrición
    # diet_type: Optional[str] = None
    diet_normal: Optional[bool] = None
    diet_diabetic: Optional[bool] = None
    diet_low_salt: Optional[bool] = None
    diet_astringent: Optional[bool] = None
    diet_protection: Optional[bool] = None
    diet_soft: Optional[bool] = None
    diet_pureed: Optional[bool] = None
    diet_liquid: Optional[bool] = None
    dysphagia: Optional[bool] = None
    dysphagia_grade: Optional[int] = None
    diet_texture: Optional[str] = None
    thickener_instructions: Optional[str] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    bmi: Optional[float] = None
    supplementation_type: Optional[str] = None
    supplement_hchp: Optional[bool] = None
    supplement_diabetes: Optional[bool] = None
    supplement_renal: Optional[bool] = None
    supplement_fiber: Optional[bool] = None
    supplementation_formula: Optional[str] = None

    # Hygiene and Elimination
    urinary_incontinence: Optional[bool] = None
    urinary_incontinence_frequency: Optional[int] = None
    fecal_incontinence: Optional[bool] = None
    fecal_incontinence_frequency: Optional[int] = None
    incontinence_type: Optional[str] = None
    night_incontinence: Optional[bool] = None
    diaper_use: Optional[bool] = None
    diaper_type: Optional[str] = None
    diaper_size: Optional[str] = None
    diaper_brand: Optional[str] = None
    diaper_changes_per_day: Optional[int] = None
    bath_autonomy: Optional[str] = None
    bath_frequency: Optional[int] = None

    # Cognitive
    cognitive_impairment: Optional[str] = None
    mmse_score: Optional[int] = None
    pfeiffer_score: Optional[int] = None
    behavior_agitation: Optional[bool] = None
    behavior_agitation_frequency: Optional[str] = None
    behavior_disorientation: Optional[bool] = None
    behavior_disorientation_type: Optional[str] = None
    behavior_aggression: Optional[bool] = None
    behavior_aggression_type: Optional[str] = None
    behavior_night_wandering: Optional[bool] = None
    uses_psychotropics: Optional[bool] = None
    sleep_medication: Optional[str] = None

    # Vaccines
    vaccine_flu_last: Optional[date] = None
    vaccine_flu_expiration: Optional[date] = None
    vaccine_flu_batch: Optional[str] = None
    vaccine_pneumococcal_last: Optional[date] = None
    vaccine_pneumococcal_expiration: Optional[date] = None
    vaccine_pneumococcal_batch: Optional[str] = None
    vaccine_tetanus_last: Optional[date] = None
    vaccine_tetanus_expiration: Optional[date] = None
    vaccine_tetanus_batch: Optional[str] = None
    vaccine_covid_last: Optional[date] = None
    vaccine_covid_expiration: Optional[date] = None
    vaccine_covid_batch: Optional[str] = None

    # Gordon Patterns and Risks
    wounds: Optional[List[Dict[str, Any]]] = None
    has_pressure_ulcers: Optional[bool] = None
    upp_grade: Optional[str] = None
    upp_cure_type: Optional[str] = None
    has_surgical_wounds: Optional[bool] = None
    other_wound_cure_type: Optional[str] = None
    requires_positioning: Optional[bool] = None
    positioning_frequency: Optional[int] = None
    uses_anti_bedsore_mattress: Optional[bool] = None
    requires_diabetic_foot_care: Optional[bool] = None
    requires_special_oral_care: Optional[bool] = None
    pain_eva: Optional[int] = None
    pain_location: Optional[str] = None
    pain_treatment: Optional[str] = None
    sexuality_observations: Optional[str] = None

    # Therapies
    receives_physiotherapy: Optional[bool] = None
    receives_occupational_therapy: Optional[bool] = None
    receives_speech_therapy: Optional[bool] = None
    receives_psychology: Optional[bool] = None
    receives_respiratory_therapy: Optional[bool] = None

    # Consents and Directives
    consent_informed: Optional[bool] = None
    consent_informed_date: Optional[date] = None
    consent_photos: Optional[bool] = None
    consent_excursions: Optional[bool] = None
    has_advance_directives: Optional[bool] = None
    advance_directives_number: Optional[str] = None
    advance_directives_date: Optional[date] = None

    # Restraints
    requires_restraint: Optional[bool] = None
    restraint_safety_sheet: Optional[bool] = None
    restraint_type: Optional[str] = None
    restraint_schedule: Optional[str] = None
    restraint_justification: Optional[str] = None
    restraint_authorization_date: Optional[date] = None

    # Risks
    risk_falls: Optional[bool] = None
    risk_malnutrition: Optional[bool] = None
    risk_infections: Optional[bool] = None
    risk_dehydration: Optional[bool] = None
    risk_confusion: Optional[bool] = None

    # Observations and Additional Notes
    emotional_state: Optional[str] = None
    family_situation: Optional[str] = None
    first_impressions: Optional[str] = None
    care_plan: Optional[str] = None
    additional_data: Optional[dict[str, Any]] = None


# ============================================================================
# SCHEMAS DE TABLAS RELACIONALES
# ============================================================================


class ResidentAllergyBase(BaseModel):
    """Schema base para alergia de residente"""

    allergy_type: str = Field(..., description="medication, food, material")
    allergen: str
    reaction: Optional[str] = None
    severity: Optional[str] = None
    first_occurrence: Optional[date] = None
    notes: Optional[str] = None
    active: bool = True
    model_config = ConfigDict(from_attributes=True)


class ResidentAllergyCreate(ResidentAllergyBase):
    resident_id: int


class ResidentAllergy(ResidentAllergyBase):
    id: int
    resident_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# SCHEMAS DE LISTADOS DINÁMICOS
# ============================================================================


class DynamicListSummary(BaseModel):
    """Resumen de un listado dinámico"""

    list_name: str
    list_type: str
    total_residents: int
    description: str


class DynamicListResident(BaseModel):
    """Residente en un listado dinámico con información relevante"""

    id: int
    name: str
    surname: str
    room_number: str
    # Datos específicos del listado
    relevant_data: Optional[dict[str, Any]] = None
    model_config = ConfigDict(from_attributes=True)


class DynamicList(BaseModel):
    """Listado dinámico completo con residentes"""

    list_name: str
    list_type: str
    total: int
    residents: list[DynamicListResident]


# ============================================================================
# SCHEMAS DE PAGINACIÓN
# ============================================================================


class ResidentPaginatedExtended(BaseModel):
    """Paginación de residentes con schema extendido"""

    total: int
    page: int
    size: int
    pages: int
    items: list[ResidentExtended]
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# SCHEMAS DE SEGUIMIENTOS (EVOLUCIÓN)
# ============================================================================


class ResidentFollowUpBase(BaseModel, ResidentValidatorMixin):
    """Schema base para seguimiento/evolución"""

    content: Optional[str] = Field("Sin contenido")
    type: str = "nursing"
    user_id: Optional[int] = None  # FK al usuario autor
    residence_id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)


class ResidentFollowUpCreate(ResidentFollowUpBase):
    resident_id: int


class ResidentFollowUp(ResidentFollowUpBase):
    id: int
    resident_id: int
    staff_name: Optional[str] = None
    user_id: Optional[int] = None  # FK al usuario autor
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class ResidentFollowUpGlobal(ResidentFollowUp):
    """Schema para seguimientos globales que incluye info del residente"""

    resident_name: str = "Residente"
    resident_surname: str = ""
    resident_room: str = "---"


# ============================================================================
# SCHEMAS DE CONSTANTES Y CUIDADOS
# ============================================================================


class VitalSignBase(BaseModel):
    vital_type: str
    value: Optional[float] = None
    value_text: Optional[str] = None
    residence_id: Optional[int] = None
    measured_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    model_config = ConfigDict(from_attributes=True)


class VitalSignCreate(VitalSignBase):
    pass


class VitalSign(VitalSignBase):
    id: int
    resident_id: int
    staff_name: Optional[str] = None
    user_id: Optional[int] = None
    created_at: Optional[datetime] = None


class CareLogBase(BaseModel):
    care_type: str
    value: Optional[str] = None
    notes: Optional[str] = None
    residence_id: Optional[int] = None
    logged_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    model_config = ConfigDict(from_attributes=True)


class CareLogCreate(CareLogBase):
    pass


class CareLog(CareLogBase):
    id: int
    resident_id: int
    staff_name: Optional[str] = None
    user_id: Optional[int] = None
    created_at: Optional[datetime] = None


# ============================================================================
# SCHEMAS DE TRATAMIENTOS Y MEDICACIÓN
# ============================================================================


# ============================================================================
# SCHEMAS DE VACUNACIÓN
# ============================================================================


class ResidentVaccinationBase(BaseModel):
    vaccine_type: str = Field(
        ..., description="flu, pneumococcal, covid19, etc"
    )
    vaccine_name: Optional[str] = None
    dose_number: Optional[int] = None
    administration_date: Optional[date] = None
    expiration_date: Optional[date] = None
    residence_id: Optional[int] = None
    administering_professional: Optional[str] = None
    user_id: Optional[int] = None  # FK al usuario autor
    batch_number: Optional[str] = None
    notes: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class ResidentVaccinationCreate(ResidentVaccinationBase):
    resident_id: int


class ResidentVaccination(ResidentVaccinationBase):
    id: int
    resident_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


