from datetime import datetime

from database import Base
from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)


class ResidentVaccination(Base):
    """Registro detallado de vacunaciones con dosis y vencimientos"""

    __tablename__ = "resident_vaccinations"

    id = Column(Integer, primary_key=True, index=True)
    resident_id = Column(
        Integer, ForeignKey("residents.id", ondelete="CASCADE"), index=True
    )
    residence_id = Column(
        Integer, ForeignKey("residences.id", ondelete="CASCADE"), index=True
    )
    # 'flu', 'pneumococcal', 'tetanus', 'covid19', 'shingles', 'other'
    vaccine_type = Column(String, index=True)
    vaccine_name = Column(String, nullable=True)  # Nombre comercial
    dose_number = Column(Integer, nullable=True)  # Número de dosis
    administration_date = Column(Date, index=True)
    expiration_date = Column(Date, nullable=True, index=True)
    administering_professional = Column(String, nullable=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    batch_number = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class ResidentFollowUp(Base):
    """Seguimientos y evolución clínica cronológica"""

    __tablename__ = "resident_followups"

    id = Column(Integer, primary_key=True, index=True)
    resident_id = Column(
        Integer, ForeignKey("residents.id", ondelete="CASCADE"), index=True
    )
    residence_id = Column(
        Integer, ForeignKey("residences.id", ondelete="CASCADE"), index=True
    )
    # 'nursing', 'medical', 'social', 'admin', 'psychology', etc.
    type = Column(String, index=True, default="nursing")
    content = Column(Text, nullable=False)
    staff_name = Column(
        String, nullable=True
    )  # Nombre del profesional (legacy)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )  # FK al usuario autor
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class ResidentVitalSign(Base):
    """Registro de constantes vitales (TA, SatO2, FC, Glucemia, etc.)"""

    __tablename__ = "resident_vitals"

    id = Column(Integer, primary_key=True, index=True)
    resident_id = Column(
        Integer, ForeignKey("residents.id", ondelete="CASCADE"), index=True
    )
    residence_id = Column(
        Integer, ForeignKey("residences.id", ondelete="CASCADE"), index=True
    )
    # 'ta_systolic', 'ta_diastolic', 'heart_rate', 'spo2', 'temperature',
    # 'glucose', 'weight', 'height', 'inr'
    vital_type = Column(String, index=True)
    value = Column(Float)
    value_text = Column(
        String, nullable=True
    )  # Para valores compuestos o notas
    measured_at = Column(DateTime, default=datetime.utcnow, index=True)
    staff_name = Column(String, nullable=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    created_at = Column(DateTime, default=datetime.utcnow)


class ResidentCareLog(Base):
    """Registro de cuidados básicos (pañal, deposiciones, ingestas, etc.)"""

    __tablename__ = "resident_care_logs"

    id = Column(Integer, primary_key=True, index=True)
    resident_id = Column(
        Integer, ForeignKey("residents.id", ondelete="CASCADE"), index=True
    )
    residence_id = Column(
        Integer, ForeignKey("residences.id", ondelete="CASCADE"), index=True
    )
    # 'diaper', 'stool', 'voiding', 'positioning', 'fluid_intake', 'food_intake'
    care_type = Column(String, index=True)
    # Valor/cantidad (ej: ml de agua, o 1 para pañal seco, 2 mojado, etc.)
    value = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    logged_at = Column(DateTime, default=datetime.utcnow, index=True)
    staff_name = Column(String, nullable=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    created_at = Column(DateTime, default=datetime.utcnow)
