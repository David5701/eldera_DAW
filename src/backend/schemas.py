import re
from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ResidentBase(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=50,
        description="First name (letters only)",
    )
    surname: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Last name (letters only)",
    )
    date_of_birth: date
    room_number: str = Field(
        ...,
        min_length=1,
        max_length=10,
        description="Room number (numbers only)",
    )
    emergency_contact: str = Field(
        ..., description="Emergency contact phone number"
    )

    model_config = ConfigDict(from_attributes=True)

    @field_validator("name", "surname", mode="after")
    @classmethod
    def validate_letters_only(cls, v: str, info) -> str:
        if not re.match(r"^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s-]+$", v):
            field_name = "Nombre" if info.field_name == "name" else "Apellidos"
            raise ValueError(
                f"{field_name} solo puede contener letras, espacios y guiones"
            )
        return v

    @field_validator("room_number", mode="after")
    @classmethod
    def validate_numbers_only(cls, v: str) -> str:
        if not re.match(r"^[0-9]+$", v):
            raise ValueError("Habitación solo puede contener números")
        return v

    @field_validator("emergency_contact", mode="after")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        if not re.match(r"^\+?[0-9\s-]{9,15}$", v):
            raise ValueError(
                "Contacto de emergencia debe ser un número de teléfono "
                "válido (9-15 dígitos)"
            )
        return v


class ResidentCreate(ResidentBase):
    pass


class Resident(ResidentBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# Schema for partial updates (all fields optional)


class ResidentUpdate(BaseModel):
    name: Optional[str] = None
    surname: Optional[str] = None
    date_of_birth: Optional[date] = None
    room_number: Optional[str] = None
    emergency_contact: Optional[str] = None


class ResidentPaginated(BaseModel):
    total: int
    page: int
    size: int
    items: list[Resident]
    model_config = ConfigDict(from_attributes=True)




class UserBase(BaseModel):
    username: str
    role: Literal[
        "admin",
        "nurse",
        "aux",
        "doctor",
        "social_worker",
        "occupational_therapist",
        "physiotherapist",
    ] = "aux"


class UserCreate(UserBase):
    password: str


class User(UserBase):
    id: int
    is_active: bool
    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None
