from datetime import datetime

from database import Base
from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    Time,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID

# Compatibilidad Multi-DB (Postgres JSONB vs SQLite JSON para tests)
JSON_TYPE = JSON().with_variant(JSONB(), "postgresql")


class Residence(Base):
    """Modelo Multi-tenancy: Representa una Residencia/Cliente"""

    __tablename__ = "residences"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    cif = Column(String, nullable=True)  # ID Fiscal
    plan = Column(String, default="free")  # 'free', 'pro', 'enterprise'
    created_at = Column(DateTime, default=datetime.utcnow)


class Resident(Base):
    __tablename__ = "residents"

    # === IDENTIFICACIÓN BÁSICA ===
    id = Column(Integer, primary_key=True, index=True)
    # Multi-tenancy: Vinculación a una residencia (Nullable al principio para migración)
    residence_id = Column(
        Integer,
        ForeignKey("residences.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    name = Column(String, index=True)
    surname = Column(String, index=True)
    profile_photo = Column(String, nullable=True)  # URL o ruta a la imagen
    date_of_birth = Column(Date)
    dni_nie = Column(String, nullable=True)
    document_type = Column(String, default="DNI_NIE")  # 'DNI_NIE', 'PASSPORT', 'OTHER'

    # === DATOS PERSONALES EXPANDIDOS ===
    sex = Column(String, nullable=True)  # 'M', 'F', 'O'
    nationality = Column(String, nullable=True)
    primary_language = Column(String, nullable=True)
    address = Column(String, nullable=True)
    postal_code = Column(String, nullable=True)
    municipality = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)

    # === DATOS DE INGRESO ===
    room_number = Column(String)
    admission_date = Column(Date, nullable=True)
    admission_time = Column(Time, nullable=True)

    # === SISTEMA DE BAJAS (SOFT DELETE) ===
    # 'active', 'inactive', 'deceased', 'hospitalized'
    status = Column(String, default="active", index=True)
    inactive_date = Column(Date, nullable=True)
    inactive_reason = Column(Text, nullable=True)
    return_date = Column(Date, nullable=True)  # Próximo regreso (baja temporal)
    death_place = Column(String, nullable=True)  # Lugar de fallecimiento

    # === HOSPITALIZACIÓN ===
    # Hospitalización (cuando status='hospitalized')
    hospitalization_date = Column(Date, nullable=True)
    hospitalization_end_date = Column(Date, nullable=True)
    hospitalization_hospital = Column(String, nullable=True)
    hospitalization_reason = Column(String, nullable=True)
    # Historial de ingresos previos
    # Lista de dicts: [{start, end, hospital, reason}, ...]
    hospitalization_history = Column(JSON_TYPE, default=list)

    # === CONTACTO DE EMERGENCIA ===
    # (básico - detallados en tabla relacional)
    emergency_contact = Column(String)
    emergency_phone = Column(String, nullable=True)

    # === DATOS MÉDICOS - MÉDICO Y HOSPITAL ===
    primary_doctor = Column(String, nullable=True)
    primary_doctor_phone = Column(String, nullable=True)
    health_center = Column(String, nullable=True)
    health_center_type = Column(String, nullable=True)  # 'ss', 'private'
    health_center_phone = Column(String, nullable=True)
    health_center_phone_emergency = Column(String, nullable=True)
    private_health_phone = Column(String, nullable=True)
    reference_hospital = Column(String, nullable=True)
    last_hospital_visit = Column(Date, nullable=True)
    # 'urgency', 'specialist'
    last_hospital_visit_type = Column(String, nullable=True)

    # === ANTECEDENTES (JSONB Dinámico) ===
    # Estructura: [{type: 'disease'|'surgery', name: str, year: str, status: str}]
    medical_history = Column(JSON_TYPE, default=list)
    surgical_history = Column(Text, nullable=True)
    other_diseases = Column(Text, nullable=True)

    # === DIAGNÓSTICOS PRINCIPALES (CHECKBOXES para listados rápidos) ===
    diagnosis_hypertension = Column(Boolean, default=False, index=True)
    # Detalle opcional: ej. 'Sistólica aislada', 'Resistente', 'Secundaria'
    diagnosis_hypertension_detail = Column(String, nullable=True)
    diagnosis_diabetes = Column(Boolean, default=False, index=True)
    # 'type1', 'type2'
    diagnosis_diabetes_type = Column(String, nullable=True)
    diagnosis_copd = Column(Boolean, default=False, index=True)
    diagnosis_alzheimer = Column(Boolean, default=False, index=True)
    diagnosis_parkinson = Column(Boolean, default=False, index=True)
    diagnosis_stroke = Column(Boolean, default=False, index=True)
    diagnosis_cardiopathy = Column(Boolean, default=False, index=True)
    diagnosis_renal_failure = Column(Boolean, default=False, index=True)
    diagnosis_osteoporosis = Column(Boolean, default=False, index=True)
    diagnosis_arthritis = Column(Boolean, default=False, index=True)
    diagnosis_cancer = Column(Boolean, default=False, index=True)
    # Tipo específico de cáncer
    diagnosis_cancer_type = Column(String, nullable=True)

    # === ALERGIAS (indicadores básicos - detalles en tabla relacional) ===
    has_medication_allergy = Column(Boolean, default=False, index=True)
    has_food_allergy = Column(Boolean, default=False, index=True)
    has_material_allergy = Column(Boolean, default=False, index=True)
    # Detalles específicos de alergia
    allergy_type = Column(String, nullable=True)
    allergy_medication_detail = Column(String, nullable=True)
    allergy_food_detail = Column(String, nullable=True)
    allergy_material_detail = Column(String, nullable=True)
    has_food_intolerance = Column(Boolean, default=False)
    intolerance_food_detail = Column(String, nullable=True)
    no_known_allergies = Column(Boolean, default=False)

    # === MOVILIDAD Y AYUDAS TÉCNICAS ===
    # 'autonomous', 'cane', 'walker', 'wheelchair_manual',
    # 'wheelchair_electric', 'bedridden'
    mobility_level = Column(String, nullable=True, index=True)

    # Ayudas técnicas comunes (CHECKBOXES)
    device_dentures = Column(Boolean, default=False)
    # 'superior', 'inferior', 'parcial'
    device_dentures_type = Column(String, nullable=True)
    device_hearing_aids = Column(Boolean, default=False)
    # 'right', 'left', 'both'
    device_hearing_aids_side = Column(String, nullable=True)
    device_hearing_aids_brand = Column(String, nullable=True)
    device_glasses = Column(Boolean, default=False)
    # device_glasses_progressive eliminado según requisitos
    device_oxygen = Column(Boolean, default=False, index=True)
    device_oxygen_type = Column(String, nullable=True)  # 'home', 'portable'
    device_oxygen_flow = Column(Float(), nullable=True)  # L/min
    device_oxygen_hours = Column(Integer, nullable=True)  # horas/día

    # Sondas y dispositivos médicos
    device_nasogastric = Column(Boolean, default=False)
    device_nasogastric_type = Column(String, nullable=True)
    device_nasogastric_date = Column(Date, nullable=True)

    device_veis = Column(Boolean, default=False)
    device_veis_type = Column(String, nullable=True)
    device_veis_date = Column(Date, nullable=True)

    device_catheter = Column(Boolean, default=False)
    device_catheter_type = Column(String, nullable=True)
    device_catheter_date = Column(Date, nullable=True)

    device_peg = Column(Boolean, default=False)
    device_peg_type = Column(String, nullable=True)
    device_peg_date = Column(Date, nullable=True)

    device_tracheostomy = Column(Boolean, default=False)
    device_tracheostomy_type = Column(String, nullable=True)
    device_tracheostomy_date = Column(Date, nullable=True)

    device_invasive_type = Column(String, nullable=True)  # Legacy
    device_invasive_change_date = Column(Date, nullable=True)  # Legacy

    # === NUTRICIÓN Y DIETA ===
    # 'normal', 'soft', 'pureed', 'liquid', 'low_salt', 'diabetic', etc.
    # Refactor Multi-Selección (Flags Booleanos)
    # diet_type = Column(String, nullable=True, index=True) # DEPRECADO
    diet_normal = Column(Boolean, default=False)
    diet_diabetic = Column(Boolean, default=False)
    diet_low_salt = Column(Boolean, default=False)
    diet_astringent = Column(Boolean, default=False)
    diet_protection = Column(Boolean, default=False)
    diet_soft = Column(Boolean, default=False)
    diet_pureed = Column(Boolean, default=False)
    diet_liquid = Column(Boolean, default=False)

    dysphagia = Column(Boolean, default=False, index=True)
    dysphagia_grade = Column(Integer, nullable=True)
    diet_texture = Column(String, nullable=True)
    thickener_instructions = Column(String, nullable=True)
    weight = Column(Float(), nullable=True)  # kg
    height = Column(Float(), nullable=True)  # cm
    bmi = Column(Float(), nullable=True)
    supplementation_type = Column(String, nullable=True)  # 'enteral', 'oral'
    # Casillas de verificación para propiedades adicionales
    supplement_hchp = Column(Boolean, default=False)
    supplement_diabetes = Column(Boolean, default=False)
    supplement_renal = Column(Boolean, default=False)
    supplement_fiber = Column(Boolean, default=False)
    # 'renal', 'hp_hc', 'fiber', etc.
    supplementation_formula = Column(String, nullable=True)

    # === HIGIENE Y CONTINENCIA ===
    urinary_incontinence = Column(Boolean, default=False, index=True)
    urinary_incontinence_frequency = Column(
        String, nullable=True
    )  # '1', '2', '3' (ocasional, frecuente, total)
    fecal_incontinence = Column(Boolean, default=False, index=True)
    fecal_incontinence_notes = Column(Text, nullable=True)
    # 'esfuerzo', 'urgencia', etc.
    incontinence_type = Column(String, nullable=True)
    night_incontinence = Column(Boolean, default=False)
    diaper_use = Column(Boolean, default=False)
    diaper_type = Column(String, nullable=True)  # 'bragapanal', 'panal'
    diaper_size = Column(String, nullable=True)  # 'S', 'M', 'L', 'XL'
    diaper_changes_per_day = Column(Integer, nullable=True)
    # 'autonomous', 'partial_help', 'dependent'
    bath_autonomy = Column(String, nullable=True)
    bath_frequency = Column(Integer, nullable=True)  # veces/semana

    # === ESTADO COGNITIVO Y CONDUCTUAL ===
    # 'none', 'mild', 'moderate', 'severe'
    cognitive_impairment = Column(String, nullable=True, index=True)
    mmse_score = Column(Integer, nullable=True)  # 0-30
    pfeiffer_score = Column(Integer, nullable=True)  # 0-10

    # Comportamientos (CHECKBOXES para listados)
    behavior_agitation = Column(Boolean, default=False, index=True)
    # 'frequent' (frecuente), 'occasional' (ocasional), 'never' (nunca)
    behavior_agitation_frequency = Column(String, nullable=True)
    behavior_disorientation = Column(Boolean, default=False, index=True)
    # 'temporal', 'spatial', 'personal'
    behavior_disorientation_type = Column(String, nullable=True)
    behavior_aggression = Column(Boolean, default=False, index=True)
    # 'verbal', 'physical'
    behavior_aggression_type = Column(String, nullable=True)
    behavior_night_wandering = Column(Boolean, default=False)
    uses_psychotropics = Column(Boolean, default=False)

    # === VACUNACIÓN (fechas básicas - detalles en tabla relacional) ===
    vaccine_flu_last = Column(Date, nullable=True)
    vaccine_flu_expiration = Column(Date, nullable=True)
    vaccine_flu_batch = Column(String, nullable=True)
    vaccine_pneumococcal_last = Column(Date, nullable=True)
    vaccine_pneumococcal_expiration = Column(Date, nullable=True)
    vaccine_pneumococcal_batch = Column(String, nullable=True)
    vaccine_tetanus_last = Column(Date, nullable=True)
    vaccine_tetanus_expiration = Column(Date, nullable=True)
    vaccine_tetanus_batch = Column(String, nullable=True)
    vaccine_covid_last = Column(Date, nullable=True)
    vaccine_covid_expiration = Column(Date, nullable=True)
    vaccine_covid_batch = Column(String, nullable=True)

    # === HERIDAS Y CUIDADOS ===
    wounds = Column(JSON_TYPE, default=list)  # [{type, location, grade, cure, frequency}]
    norton_score = Column(Integer, nullable=True)  # Riesgo UPP (Norton)
    has_pressure_ulcers = Column(Boolean, default=False, index=True)
    upp_grade = Column(String, nullable=True)  # Grado UPP
    upp_cure_type = Column(String, nullable=True)  # Tipo de cura UPP
    has_surgical_wounds = Column(Boolean, default=False)
    # Tipo de cura otras heridas
    other_wound_cure_type = Column(String, nullable=True)
    requires_positioning = Column(Boolean, default=False)
    positioning_frequency = Column(Integer, nullable=True)  # horas
    uses_anti_bedsore_mattress = Column(Boolean, default=False)
    requires_diabetic_foot_care = Column(Boolean, default=False)
    requires_special_oral_care = Column(Boolean, default=False)

    # === DOLOR ===
    pain_eva = Column(Integer, nullable=True)  # 0-10 escala EVA
    pain_location = Column(String, nullable=True)
    pain_treatment = Column(String, nullable=True)

    # === TERAPIAS (indicadores - detalles en tabla relacional) ===
    receives_physiotherapy = Column(Boolean, default=False, index=True)
    receives_occupational_therapy = Column(Boolean, default=False)
    receives_speech_therapy = Column(Boolean, default=False)
    receives_psychology = Column(Boolean, default=False)
    receives_respiratory_therapy = Column(Boolean, default=False)

    # === AUTORIZACIONES ===
    consent_informed = Column(Boolean, default=False)
    consent_informed_date = Column(Date, nullable=True)
    consent_photos = Column(Boolean, default=False)
    consent_excursions = Column(Boolean, default=False)

    # Sujeción mecánica
    requires_restraint = Column(Boolean, default=False, index=True)
    # 'belt', 'handcuffs', 'shackles', 'safety_sheet'
    restraint_safety_sheet = Column(Boolean, default=False)
    restraint_type = Column(String, nullable=True)
    restraint_schedule = Column(String, nullable=True)
    restraint_justification = Column(Text, nullable=True)
    restraint_authorization_date = Column(Date, nullable=True)

    # Directrices avanzadas
    has_advance_directives = Column(Boolean, default=False)
    advance_directives_number = Column(String, nullable=True)
    advance_directives_date = Column(Date, nullable=True)

    # === RIESGOS IDENTIFICADOS (checkboxes básicos) ===
    risk_falls = Column(Boolean, default=False, index=True)
    risk_malnutrition = Column(Boolean, default=False, index=True)
    risk_infections = Column(Boolean, default=False, index=True)
    risk_dehydration = Column(Boolean, default=False, index=True)
    risk_confusion = Column(Boolean, default=False, index=True)

    # === OBSERVACIONES Y PATRONES (P7-P11) ===
    # P7: Autopercepción
    emotional_state = Column(Text, nullable=True)

    # P8: Rol y Relaciones
    family_situation = Column(Text, nullable=True)

    # P9: Sexualidad
    sexuality_observations = Column(Text, nullable=True)

    # P11: Valores y Creencias + General
    first_impressions = Column(Text, nullable=True)
    care_plan = Column(Text, nullable=True)

    # === CAMPOS DE EXTENSIÓN DE DATOS ===
    # Para campos que requieran persistencia adicional
    additional_data = Column(JSON_TYPE, nullable=True)

    # === NUEVOS CAMPOS (FEEDBACK USUARIO) ===
    # Lista de contactos familiares: [{name, relation, phone}, ...]
    family_contacts = Column(JSON_TYPE, nullable=True)
    # Medicación y patrón de sueño
    sleep_medication = Column(String, nullable=True)
    sleep_pattern = Column(String, nullable=True)
    sleep_observations = Column(Text, nullable=True)

    # === METADATOS ===
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    # Multi-tenancy: Vinculación a una residencia (Nullable al principio)
    residence_id = Column(
        Integer,
        ForeignKey("residences.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String)  # 'admin', 'nurse', 'aux'
    is_active = Column(Boolean, default=True)
    supabase_uid = Column(UUID(as_uuid=True), unique=True, nullable=True)
