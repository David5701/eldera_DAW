from datetime import date, datetime, timedelta
from typing import Optional

import schemas_extended
from auth import get_current_user
from database import get_db
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from models import Residence, Resident, User
from models_extended import (
    ResidentFollowUp,
    ResidentVaccination,
)
from sqlalchemy.orm import Session

router = APIRouter(
    prefix="/dashboard",
    tags=["dashboard"],
    responses={404: {"description": "No encontrado"}},
)


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None,
    background_tasks: BackgroundTasks = None,
    source: Optional[str] = None,
):
    """
    Obtiene estadísticas de alto nivel para el dashboard:
    - Total de residentes
    - Ocupación (basada en capacidad de 200)
    - Alertas activas (simuladas por ahora)
    - Tareas pendientes para hoy
    - Nombre de la residencia
    """
    try:
        total_residents = (
            db.query(Resident).filter(Resident.residence_id == current_user.residence_id).count()
        )
        occupancy_rate = int((total_residents / 200) * 100)

        # Obtener nombre de la residencia
        residence = db.query(Residence).filter(Residence.id == current_user.residence_id).first()
        residence_name = residence.name if residence else "Residencia"

        # Obtener seguimientos de hoy (conteo rápido)
        today_start = datetime.combine(date.today(), datetime.min.time())
        followups_today = (
            db.query(ResidentFollowUp)
            .filter(
                ResidentFollowUp.residence_id == current_user.residence_id,
                ResidentFollowUp.created_at >= today_start,
            )
            .count()
        )

        followups = (
            db.query(
                ResidentFollowUp,
                Resident.name,
                Resident.surname,
                Resident.room_number,
                User.username,
            )
            .join(Resident, Resident.id == ResidentFollowUp.resident_id)
            .outerjoin(User, User.id == ResidentFollowUp.user_id)
            .filter(ResidentFollowUp.residence_id == current_user.residence_id)
            .order_by(ResidentFollowUp.created_at.desc())
            .limit(5)
            .all()
        )

        recent_followups = []
        for f, name, surname, room_number, username in followups:
            try:
                # Intenta validar el seguimiento con datos seguros
                followup_data = schemas_extended.ResidentFollowUp.model_validate(f).model_dump()
                recent_followups.append(
                    schemas_extended.ResidentFollowUpGlobal.model_validate(
                        {
                            **followup_data,
                            "resident_name": name or "Residente",
                            "resident_surname": surname or "",
                            "resident_room": room_number or "S/N",
                            "staff_name": username or f.staff_name or "Sistema",
                        }
                    )
                )
            except Exception as fe:
                print(
                    f"Error procesando seguimiento {f.id if hasattr(f, 'id') else 'unknown'}: {fe}"
                )
                continue

        return {
            "total_residents": total_residents,
            "occupancy": occupancy_rate,
            "active_alerts": 12,
            "pending_tasks": followups_today,
            "followups_today": followups_today,
            "recent_followups": recent_followups,
            "residence_name": residence_name,
            "user_role": current_user.role,
            "dynamic_lists_count": 8,
        }
    except Exception as e:
        import traceback

        error_msg = f"ERROR ESTADÍSTICAS DASHBOARD: {str(e)}"
        print(f"{error_msg}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=error_msg) from e


@router.get("/vaccinations/pending")
def get_pending_vaccinations(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtiene vacunaciones que vencen en los próximos X días"""
    try:
        today = date.today()
        limit_date = today + timedelta(days=days)

        vaccines = (
            db.query(ResidentVaccination, Resident)
            .join(Resident)
            .filter(
                ResidentVaccination.expiration_date >= today,
                ResidentVaccination.expiration_date <= limit_date,
                Resident.residence_id == current_user.residence_id,
            )
            .order_by(ResidentVaccination.expiration_date)
            .limit(10)
            .all()
        )

        result = []
        for vacc, res in vaccines:
            days_left = (vacc.expiration_date - today).days
            result.append(
                {
                    "resident": f"{res.name} {res.surname}",
                    "vaccine": vacc.vaccine_type.capitalize(),
                    "expires": f"{days_left} días",
                    "expiration_date": vacc.expiration_date,
                }
            )

        return result
    except Exception as e:
        print(f"ERROR VACUNACIONES: {e}")
        return []


@router.get("/birthdays")
def get_upcoming_birthdays(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtiene residentes con cumpleaños en los próximos 30 días"""
    try:
        today = date.today()

        residents = (
            db.query(Resident)
            .filter(
                Resident.date_of_birth.isnot(None),
                Resident.residence_id == current_user.residence_id,
            )
            .all()
        )

        upcoming = []
        for res in residents:
            try:
                bday_this_year = res.date_of_birth.replace(year=today.year)
            except ValueError:  # 29 de febrero
                bday_this_year = res.date_of_birth.replace(year=today.year, day=28)

            if bday_this_year < today:
                try:
                    bday_this_year = res.date_of_birth.replace(year=today.year + 1)
                except ValueError:
                    bday_this_year = res.date_of_birth.replace(year=today.year + 1, day=28)

            days_until = (bday_this_year - today).days
            if days_until <= 30:
                upcoming.append(
                    {
                        "id": res.id,
                        "name": f"{res.name} {res.surname}",
                        "date": res.date_of_birth.strftime("%d/%m"),
                        "days_until": days_until,
                        "age": today.year - res.date_of_birth.year,
                    }
                )

        return sorted(upcoming, key=lambda x: x["days_until"])
    except Exception as e:
        print(f"ERROR CUMPLEAÑOS: {e}")
        return []
