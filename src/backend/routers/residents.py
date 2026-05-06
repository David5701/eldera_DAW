from datetime import date, datetime, timedelta
import traceback
from typing import Optional

import auth
import database
import models
import models_extended
import permissions
import schemas_extended
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    Path,
    Query,
    Request,
    UploadFile,
    status,
)
from fastapi.responses import Response
from services.storage import storage_service
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from utils import paginate

# Diccionarios de traducción para auditoría
VITAL_TRANSLATIONS = {
    "temperature": "Temperatura",
    "glucose": "Glucemia",
    "spo2": "Saturación",
    "weight": "Peso",
    "inr": "INR",
    "ta_systolic": "Tensión Sistólica",
    "ta_diastolic": "Tensión Diastólica",
    "blood_pressure": "Presión Arterial",
    "heart_rate": "Frecuencia Cardíaca",
    "oxygen_saturation": "Saturación de Oxígeno",
    "blood_glucose": "Glucosa en Sangre",
    "height": "Altura",
    "pain_level": "Nivel de Dolor",
    "respiratory_rate": "Frecuencia Respiratoria",
    "consciousness_level": "Nivel de Conciencia",
    "urine_output": "Diuresis",
    "stool_frequency": "Frecuencia Deposiciones",
    "fluid_intake": "Ingesta de Líquidos",
    "fluid_output": "Eliminación de Líquidos",
    "glasgow_scale": "Escala de Glasgow",
    "braden_scale": "Escala de Braden",
    "norton_scale": "Escala de Norton",
    "barthel_index": "Índice de Barthel",
    "fall_risk": "Riesgo de Caídas",
    "mood": "Estado de Ánimo",
    "sleep_quality": "Calidad del Sueño",
    "appetite": "Apetito",
    "hydration": "Hidratación",
    "skin_integrity": "Integridad Cutánea",
    "mobility": "Movilidad",
    "speech": "Habla",
    "swallowing": "Deglución",
    "cognitive_function": "Función Cognitiva",
    "wound_status": "Estado de Herida",
    "other": "Otro",
}

CARE_TRANSLATIONS = {
    "diaper": "Cambio Pañal",
    "hygiene": "Aseo e Higiene",
    "fluid_intake": "Hidratación",
    "food_intake": "Alimentación",
    "positioning": "C. Postural",
    "vomiting": "Vómitos",
    "medication": "Medicación",
    "feeding": "Alimentación",
    "mobilization": "Movilización",
    "wound_care": "Cura de Heridas",
    "monitoring": "Monitorización",
    "activity": "Actividad",
    "rest": "Descanso",
    "social_interaction": "Interacción Social",
    "psychological_support": "Apoyo Psicológico",
    "elimination": "Eliminación",
}

LIST_TRANSLATIONS = {
    "hta": "Hipertensión (HTA)",
    "diabetes": "Diabéticos",
    "psychotropics": "Psicofármacos y Sueño",
    "postural": "Cambios Posturales",
    "cures": "Curas de Enfermería",
    "diet": "Dietas Especiales",
    "absorbents": "Absorbentes (Incontinencia)",
    "birthdays": "Cumpleaños",
}

router = APIRouter(prefix="/residents", tags=["Residents"])


@router.get(
    "/followups/all",
    response_model=list[schemas_extended.ResidentFollowUpGlobal],
)
def get_all_followups(
    q: Optional[str] = Query(None, alias="q"),
    search: Optional[str] = Query(None, alias="search"),
    type: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
    request: Request = None,
    background_tasks: BackgroundTasks = None,
):
    if not permissions.has_permission("view_resident_basic", current_user.role):
        raise HTTPException(status_code=403, detail="Permiso denegado")

    query = db.query(
        models_extended.ResidentFollowUp,
        models.Resident.name,
        models.Resident.surname,
        models.Resident.room_number,
        models.User.username,
    ).filter(
        models.Resident.id == models_extended.ResidentFollowUp.resident_id,
        models_extended.ResidentFollowUp.residence_id
        == current_user.residence_id,
    ).outerjoin(
        models.User, models_extended.ResidentFollowUp.user_id == models.User.id
    )

    q_final = q or search
    if q_final and q_final.strip():
        q_search = f"%{q_final.strip()}%"
        # Búsqueda simple compatible con cualquier DB (fallback de unaccent)
        query = query.filter(
            or_(
                models_extended.ResidentFollowUp.content.ilike(q_search),
                models.Resident.name.ilike(q_search),
                models.Resident.surname.ilike(q_search),
                models.Resident.room_number.ilike(q_search),
            )
        )

    if type:
        query = query.filter(models_extended.ResidentFollowUp.type == type)

    if start_date:
        query = query.filter(
            models_extended.ResidentFollowUp.created_at
            >= datetime.combine(start_date, datetime.min.time())
        )

    if end_date:
        query = query.filter(
            models_extended.ResidentFollowUp.created_at
            <= datetime.combine(end_date, datetime.max.time())
        )

    try:
        results = query.order_by(
            models_extended.ResidentFollowUp.created_at.desc()
        ).all()

        followups = []
        for f, name, surname, room, username in results:
            # Manual construction to ensure stability and match global schema
            followups.append({
                "id": f.id,
                "resident_id": f.resident_id,
                "content": f.content,
                "type": f.type,
                "staff_name": username or f.staff_name or "Sistema",
                "resident_name": name or "Residente",
                "resident_surname": surname or "",
                "resident_room": room or "---",
                "user_id": f.user_id,
                "created_at": f.created_at.isoformat() if f.created_at else None,
                "updated_at": f.updated_at.isoformat() if f.updated_at else None
            })

        return followups
    except Exception as e:
        print(f"ERROR en get_all_followups: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error interno al cargar todos los seguimientos: {str(e)}"
        )


@router.post("/", response_model=schemas_extended.ResidentExtended)
def create_resident(
    resident: schemas_extended.ResidentCreateExtended,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
    request: Request = None,
    background_tasks: BackgroundTasks = None,
):
    if not permissions.has_permission("create_resident", current_user.role):
        raise HTTPException(status_code=403, detail="Permiso denegado")
    db_resident = models.Resident(**resident.model_dump())
    # SAAS: Asignar el residente a la misma residencia que el usuario que lo crea
    db_resident.residence_id = current_user.residence_id
    db.add(db_resident)
    db.commit()
    db.refresh(db_resident)

    return db_resident


@router.delete("/{resident_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resident(
    resident_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    if not permissions.has_permission("delete_resident", current_user.role):
        raise HTTPException(status_code=403, detail="Permiso denegado")
    resident = (
        db.query(models.Resident)
        .filter(
            models.Resident.id == resident_id,
            models.Resident.residence_id == current_user.residence_id,
        )
        .first()
    )
    if not resident:
        raise HTTPException(status_code=404, detail="Residente no encontrado")

    if resident.profile_photo:
        # Eliminar archivo de foto de perfil
        await storage_service.delete_file(resident.profile_photo)

    db.delete(resident)
    db.commit()
    return None


@router.get("/", response_model=schemas_extended.ResidentPaginatedExtended)
def read_residents(
    skip: int = 0,
    limit: int = 100,
    q: Optional[str] = Query(
        None, description="Término de búsqueda para nombre o apellidos"
    ),
    room: Optional[str] = Query(None, description="Filtrar por número de habitación"),
    fil_status: Optional[str] = Query(None, alias="status", description="Filtrar por estado (active, hospitalized, inactive, deceased)"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    source: Optional[str] = Query(None, description="Origen de la navegación (dashboard, profile, etc.)"),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
    request: Request = None,
    background_tasks: BackgroundTasks = None,
):
    if not permissions.has_permission("view_resident_basic", current_user.role):
        raise HTTPException(status_code=403, detail="Permiso denegado")

    try:
        query = db.query(models.Resident).filter(
            models.Resident.residence_id == current_user.residence_id
        )

        # Aplicar filtros de búsqueda
        if q:
            q_search = f"%{q}%"
            # Búsqueda simple compatible con cualquier DB
            query = query.filter(
                (models.Resident.name.ilike(q_search))
                | (models.Resident.surname.ilike(q_search))
                | (models.Resident.room_number.ilike(q_search))
            )
        if room:
            query = query.filter(models.Resident.room_number == room)

        if fil_status and fil_status != "all":
            query = query.filter(models.Resident.status == fil_status)

        # Retornar resultados paginados
        return paginate(
            query, schemas_extended.ResidentExtended, page=page, size=size
        )
    except Exception as e:
        import traceback

        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"ERROR CRÍTICO: {str(e)} TIPO: {type(e).__name__}",
        )


@router.get(
    "/lists/dynamic", response_model=list[schemas_extended.DynamicList]
)
def get_dynamic_lists(
    type: Optional[str] = Query(
        None,
        description=(
            "Filtrar por tipo de lista: evacuación, dieta, enfermería, cumpleaños"
        ),
    ),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
    request: Request = None,
    background_tasks: BackgroundTasks = None,
):
    if not permissions.has_permission("view_resident_basic", current_user.role):
        raise HTTPException(status_code=403, detail="Permiso denegado")

    # ==============================================================================
    # Sistema de Traducción de Valores (Patrón Presentación)
    # ==============================================================================
    # Se implementa traducción en la capa de presentación, manteniendo los valores
    # de la base de datos en inglés según las mejores prácticas de la industria SaaS.
    #
    # Ventajas de este enfoque:
    # - Escalabilidad internacional: Fácil añadir más idiomas (en, fr, de)
    # - Evita problemas de encoding con caracteres especiales (á, é, í, ñ)
    # - Consistencia con el stack tecnológico (Python, SQL en inglés)
    # - Estándar usado por empresas como Typeform, Cabify, Jobandtalent
    # ==============================================================================
    def translate_value(value: str) -> str:
        """Traduce valores de la BD del inglés al español para la UI."""
        if not value:
            return value
        translations = {
            # Tipos de dieta
            "basal": "Basal",
            "protection": "Protección",
            "diabetic": "Diabética",
            "hypocaloric": "Hipocalórica",
            "low_sodium": "Bajo Sodio",
            "renal": "Renal",
            "normal": "Normal",
            # Texturas
            "pureed": "Triturado",
            "soft": "Blando",
            "chopped": "Picado",
            "easy": "Fácil",
            # Medicación sueño (valores comunes)
            "lorazepam": "Lorazepam",
            "lormetazepam": "Lormetazepam",
            "zolpidem": "Zolpidem",
            # Estados generales
            "yes": "Sí",
            "no": "No",
        }
        # Normalizar a minúsculas para búsqueda, mantener valor original si no existe traducción
        value_lower = (
            value.lower() if isinstance(value, str) else str(value).lower()
        )
        return translations.get(value_lower, value)

    # Helper to build resident summary
    def build_resident_summary(r, extra_data=None):
        return schemas_extended.DynamicListResident(
            id=r.id,
            name=r.name,
            surname=r.surname,
            room_number=r.room_number,
            relevant_data=extra_data or {},
        )

    lists_to_return = []

    # Lógica de listas dinámicas (HTA, Diabetes, Psicofármacos, Cambios Posturales, Dietas,
    # Absorbentes, Cumpleaños)
    # 1. HIPERTENSIÓN (HTA)
    if not type or type == "hta":
        residents = (
            db.query(models.Resident)
            .filter(
                models.Resident.diagnosis_hypertension.is_(True),
                models.Resident.residence_id == current_user.residence_id,
            )
            .all()
        )
        items = [
            build_resident_summary(r, {
                "Detalle": r.diagnosis_hypertension_detail or "Sin especificar"
            }) for r in residents
        ]
        lists_to_return.append(
            schemas_extended.DynamicList(
                list_name="Hipertensión (HTA)",
                list_type="hta",
                total=len(items),
                residents=items,
            )
        )

    # 2. DIABETES
    if not type or type == "diabetes":
        residents = (
            db.query(models.Resident)
            .filter(
                models.Resident.diagnosis_diabetes.is_(True),
                models.Resident.residence_id == current_user.residence_id,
            )
            .all()
        )
        items = [
            build_resident_summary(
                r,
                {
                    "Tipo": {"type1": "Tipo 1", "type2": "Tipo 2"}.get(
                        r.diagnosis_diabetes_type or "", r.diagnosis_diabetes_type or "No especificado"
                    ),
                    "Insulina": "Sí" if r.supplement_diabetes else "No",
                },
            )
            for r in residents
        ]
        lists_to_return.append(
            schemas_extended.DynamicList(
                list_name="Diabéticos",
                list_type="diabetes",
                total=len(items),
                residents=items,
            )
        )

    # 3. PSICOFARMACOS
    if not type or type == "psychotropics":
        residents = (
            db.query(models.Resident)
            .filter(
                models.Resident.residence_id == current_user.residence_id,
                (
                    (models.Resident.uses_psychotropics.is_(True))
                    | (models.Resident.sleep_medication.isnot(None))
                ),
            )
            .all()
        )
        items = [
            build_resident_summary(
                r,
                {
                    "Psicofármacos": "Sí" if r.uses_psychotropics else "No",
                    "Med. Sueño": translate_value(r.sleep_medication)
                    if r.sleep_medication
                    else "-",
                },
            )
            for r in residents
        ]
        lists_to_return.append(
            schemas_extended.DynamicList(
                list_name="Psicofármacos y Sueño",
                list_type="psychotropics",
                total=len(items),
                residents=items,
            )
        )

    # 4. POSTURAL CHANGES
    if not type or type == "postural":
        residents = (
            db.query(models.Resident)
            .filter(
                models.Resident.requires_positioning.is_(True),
                models.Resident.residence_id == current_user.residence_id,
            )
            .all()
        )
        items = [
            build_resident_summary(
                r,
                {
                    "Frecuencia": f"Cada {r.positioning_frequency}h"
                    if r.positioning_frequency
                    else "Según pauta",
                    "Colchón": "Antiescaras"
                    if r.uses_anti_bedsore_mattress
                    else "Normal",
                },
            )
            for r in residents
        ]
        lists_to_return.append(
            schemas_extended.DynamicList(
                list_name="Cambios Posturales",
                list_type="postural",
                total=len(items),
                residents=items,
            )
        )

    # 5. CURES (Wound Care)
    if not type or type == "cures":
        # Get all residents and filter in python to handle JSONB safely
        all_residents = (
            db.query(models.Resident)
            .filter(models.Resident.residence_id == current_user.residence_id)
            .all()
        )
        items = []
        for r in all_residents:
            has_wounds = r.wounds and len(r.wounds) > 0
            has_legacy = r.has_pressure_ulcers or r.has_surgical_wounds

            if has_wounds or has_legacy:
                # Build summary string
                wounds_summary = []
                if r.wounds:
                    for w in r.wounds:
                        w_str = f"{w.get('type', 'Herida')} {w.get('location', '')}: {w.get('cure_type', 'Sin pauta')} ({w.get('frequency', '')})"
                        wounds_summary.append(w_str)
                elif has_legacy:
                    if r.has_pressure_ulcers:
                        wounds_summary.append(
                            f"UPP {r.upp_grade or ''} ({r.upp_cure_type or '?'})"
                        )
                    if r.has_surgical_wounds:
                        wounds_summary.append("Herida Qx")

                items.append(
                    build_resident_summary(
                        r,
                        {
                            "Curas": "; ".join(wounds_summary)
                            if wounds_summary
                            else "Ver Ficha",
                            "Riesgo UPP": f"Norton: {r.norton_score}"
                            if r.norton_score
                            else "-",
                        },
                    )
                )

        lists_to_return.append(
            schemas_extended.DynamicList(
                list_name="Curas de Enfermería",
                list_type="cures",
                total=len(items),
                residents=items,
            )
        )

    # 5. DIETS
    if not type or type == "diet":
        residents = (
            db.query(models.Resident)
            .filter(
                models.Resident.residence_id == current_user.residence_id,
                (
                    (
                        models.Resident.diet_normal.is_(False)
                    )  # Not standard diet
                    | (models.Resident.diet_diabetic.is_(True))
                    | (models.Resident.diet_low_salt.is_(True))
                    | (models.Resident.diet_astringent.is_(True))
                    | (models.Resident.diet_protection.is_(True))
                    | (models.Resident.diet_soft.is_(True))
                    | (models.Resident.diet_pureed.is_(True))
                    | (models.Resident.dysphagia.is_(True))
                    | (models.Resident.has_food_allergy.is_(True))
                ),
            )
            .all()
        )

        def get_diet_label(r):
            diets = []
            if r.diet_diabetic:
                diets.append("Diabética")
            if r.diet_low_salt:
                diets.append("Hiposódica")
            if r.diet_astringent:
                diets.append("Astringente")
            if r.diet_protection:
                diets.append("Protección Gástrica")

            if not diets:
                return "Basal" if r.diet_normal else "Sin pauta dietética"
            return ", ".join(diets)

        def get_texture_label(r):
            if r.diet_liquid:
                return "Líquida"
            if r.diet_pureed:
                return "Triturada"
            if r.diet_soft:
                return "Fácil Masticación"
            return "Normal"

        items = [
            build_resident_summary(
                r,
                {
                    "Dieta": get_diet_label(r),
                    "Textura": get_texture_label(r),
                    "Alergias": (
                        (
                            (r.allergy_food_detail or "Sí")
                            if r.has_food_allergy
                            else ""
                        )
                        + (
                            ", "
                            if r.has_food_allergy and r.has_food_intolerance
                            else ""
                        )
                        + (
                            f"Intolerancia: {r.intolerance_food_detail or '?'}"
                            if r.has_food_intolerance
                            else ""
                        )
                    )
                    or "-",
                },
            )
            for r in residents
        ]
        lists_to_return.append(
            schemas_extended.DynamicList(
                list_name="Dietas Especiales",
                list_type="diet",
                total=len(items),
                residents=items,
            )
        )

    # 6. ABSORBENTS
    if not type or type == "absorbents":
        residents = (
            db.query(models.Resident)
            .filter(
                models.Resident.diaper_use.is_(True),
                models.Resident.residence_id == current_user.residence_id,
            )
            .all()
        )
        def translate_diaper_type(val):
            _tipos = {
                "anatomy": "Anatómico",
                "pant": "Bragapañal",
                "elastic": "Elástico",
            }
            return _tipos.get(val, val or "Pañal")

        items = [
            build_resident_summary(
                r,
                {
                    "Tipo": translate_diaper_type(r.diaper_type),
                    "Talla": r.diaper_size or "M",
                    "Cambios/día": r.diaper_changes_per_day or "-",
                },
            )
            for r in residents
        ]
        lists_to_return.append(
            schemas_extended.DynamicList(
                list_name="Absorbentes (Incontinencia)",
                list_type="absorbents",
                total=len(items),
                residents=items,
            )
        )

    # 7. BIRTHDAYS
    if not type or type == "birthdays":
        current_date = datetime.now()
        current_month = current_date.month
        residents = (
            db.query(models.Resident)
            .filter(models.Resident.residence_id == current_user.residence_id)
            .all()
        )
        birthday_residents = [
            r
            for r in residents
            if r.date_of_birth and r.date_of_birth.month == current_month
        ]
        items = [
            build_resident_summary(
                r, {"Cumpleaños": r.date_of_birth.strftime("%d/%m")}
            )
            for r in birthday_residents
        ]
        # Traducir el nombre del mes al español
        _meses_es = {
            1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril",
            5: "Mayo", 6: "Junio", 7: "Julio", 8: "Agosto",
            9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre"
        }
        _mes_actual = _meses_es.get(datetime.now().month, "")
        lists_to_return.append(
            schemas_extended.DynamicList(
                list_name=f"Cumpleaños ({_mes_actual})",
                list_type="birthdays",
                total=len(items),
                residents=items,
            )
        )

    return lists_to_return


@router.get("/export")
def export_residents(
    format: str = Query("pdf", pattern="^(json|csv|pdf)$"),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    if not permissions.has_permission("export_resident", current_user.role):
        raise HTTPException(status_code=403, detail="Permission denied")
    residents = (
        db.query(models.Resident)
        .filter(models.Resident.residence_id == current_user.residence_id)
        .all()
    )
    if format == "pdf":
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        import io

        output = io.BytesIO()
        doc = SimpleDocTemplate(output, pagesize=A4)
        elements = []
        styles = getSampleStyleSheet()

        # Title
        title = Paragraph(f"Listado de Residentes - {current_user.residence_id}", styles['Title'])
        elements.append(title)
        elements.append(Spacer(1, 12))

        # Table Header
        data = [["Nombre", "Apellidos", "Habitación", "Estado"]]
        for r in residents:
            data.append([
                r.name, 
                r.surname, 
                r.room_number or "-", 
                r.status.capitalize() if r.status else "-"
            ])

        t = Table(data)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.blue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
        ]))
        elements.append(t)
        doc.build(elements)
        
        pdf_content = output.getvalue()
        output.close()
        
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=listado_residentes.pdf"}
        )

    if format == "json":
        return [
            schemas_extended.ResidentExtended.model_validate(r).model_dump()
            for r in residents
        ]

    import csv
    import io

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "id",
            "name",
            "surname",
            "date_of_birth",
            "room_number",
            "emergency_contact",
        ]
    )
    for r in residents:
        writer.writerow(
            [
                r.id,
                r.name,
                r.surname,
                r.date_of_birth,
                r.room_number,
                r.emergency_contact,
            ]
        )
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=residentes.{format}"}
    )

@router.post("/import")
async def import_residents(
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    if not permissions.has_permission("import_resident", current_user.role):
        raise HTTPException(status_code=403, detail="Permission denied")
    if file.content_type != "text/csv":
        raise HTTPException(
            status_code=400, detail="Only CSV files are supported"
        )
    import csv
    import io

    content = await file.read()
    text = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(text))
    count = 0
    for row in reader:
        resident = models.Resident(
            name=row["name"],
            surname=row["surname"],
            date_of_birth=row["date_of_birth"],
            room_number=row["room_number"],
            emergency_contact=row["emergency_contact"],
            residence_id=current_user.residence_id,
        )
        db.add(resident)
        count += 1
    db.commit()
    return {"imported": count}


@router.get("/{resident_id}", response_model=schemas_extended.ResidentExtended)
def read_resident(
    resident_id: int,
    silent: Optional[bool] = Query(False, description="Skip audit log for this request"),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
    request: Request = None,
    background_tasks: BackgroundTasks = None,
):
    if not permissions.has_permission("view_resident_basic", current_user.role):
        raise HTTPException(status_code=403, detail="Permission denied")
    resident = (
        db.query(models.Resident)
        .filter(
            models.Resident.id == resident_id,
            models.Resident.residence_id == current_user.residence_id,
        )
        .first()
    )

    if resident is None:
        raise HTTPException(status_code=404, detail="Resident not found")

    return resident


@router.put("/{resident_id}", response_model=schemas_extended.ResidentExtended)
def update_resident(
    resident_id: int,
    resident: schemas_extended.ResidentUpdateExtended,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
    request: Request = None,
    background_tasks: BackgroundTasks = None,
):
    if not permissions.has_permission("edit_resident_basic", current_user.role):
        raise HTTPException(status_code=403, detail="Permission denied")
    db_resident = (
        db.query(models.Resident)
        .filter(
            models.Resident.id == resident_id,
            models.Resident.residence_id == current_user.residence_id,
        )
        .first()
    )
    if db_resident is None:
        raise HTTPException(status_code=404, detail="Resident not found")

    # DEBUG LOG
    raw_data = resident.model_dump(exclude_unset=True)
    print(f"DEBUG PUT RECEIVED ID={resident_id}: {raw_data}")

    # === LOGICA DE ALTA HOSPITALARIA ===
    # Si pasa de 'hospitalized' a 'active', guardar historial
    new_status = raw_data.get("status")
    if db_resident.status == "hospitalized" and new_status == "active":
        print(
            f"DEBUG: Processing Hospital Discharge for Resident {resident_id}"
        )

        # 1. Determinar fecha fin
        end_date = raw_data.get("hospitalization_end_date") or date.today()

        # 2. Crear entrada histórica
        history_entry = {
            "start": db_resident.hospitalization_date.isoformat()
            if db_resident.hospitalization_date
            else None,
            "end": end_date.isoformat()
            if isinstance(end_date, date)
            else end_date,
            "hospital": db_resident.hospitalization_hospital,
            "reason": db_resident.hospitalization_reason,
        }

        # 3. Actualizar historial (asegurar que es lista)
        current_history = (
            list(db_resident.hospitalization_history)
            if db_resident.hospitalization_history
            else []
        )
        current_history.append(history_entry)

        # Modificar directamente el objeto DB (se guardará al commit)
        db_resident.hospitalization_history = current_history

        # 4. Limpiar campos de hospitalización actuales EN EL OBJETO DE ACTUALIZACIÓN
        # Para que al iterar raw_data no se sobrescriban con los valores antiguos si vinieran
        # Y también forzar su limpieza en el objeto DB
        db_resident.hospitalization_date = None
        db_resident.hospitalization_end_date = None
        db_resident.hospitalization_hospital = None
        db_resident.hospitalization_reason = None
        # hospitalization_notes removed

        # Eliminar campos de hospitalización del raw_data para que no interfieran
        # (aunque si los seteamos a None aquí, el loop de abajo los pondría a None, lo cual es correcto)

    update_data = raw_data
    for key, value in update_data.items():
        # Evitar sobrescribir la limpieza que acabamos de hacer si el payload trae datos viejos
        if (
            key.startswith("hospitalization_")
            and new_status == "active"
            and db_resident.status == "active"
        ):  # Hacky check
            continue

        # === LOGICA DE BAJA / DEFUNCIÓN ===
        if key == "status" and value in ["inactive", "deceased"]:
            # Si no se provee fecha, usar hoy
            if not update_data.get("inactive_date"):
                db_resident.inactive_date = date.today()
            # Si pasamos a fallecido, podemos setear un motivo por defecto si no hay uno
            if value == "deceased" and not update_data.get("inactive_reason"):
                db_resident.inactive_reason = "Defunción registrada"

            # Limpiar campos de hospitalización si estaba hospitalizado
            if db_resident.status == "hospitalized":
                db_resident.hospitalization_date = None
                db_resident.hospitalization_hospital = None
                db_resident.hospitalization_reason = None

        setattr(db_resident, key, value)

    db.commit()
    db.refresh(db_resident)
    return db_resident


@router.patch(
    "/{resident_id}", response_model=schemas_extended.ResidentExtended
)
def partial_update_resident(
    resident_id: int,
    resident: schemas_extended.ResidentUpdateExtended,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
    request: Request = None,
    background_tasks: BackgroundTasks = None,
):
    """Smart PATCH: Only updates fields that are explicitly provided (dirty fields)."""
    if not permissions.has_permission("edit_resident_basic", current_user.role):
        raise HTTPException(status_code=403, detail="Permission denied")
    db_resident = (
        db.query(models.Resident)
        .filter(
            models.Resident.id == resident_id,
            models.Resident.residence_id == current_user.residence_id,
        )
        .first()
    )
    if db_resident is None:
        raise HTTPException(status_code=404, detail="Resident not found")

    # Only update fields that were explicitly set (exclude_unset=True)
    update_data = resident.model_dump(exclude_unset=True)
    print(f"DEBUG: [PATCH] Resident ID={resident_id} | Payload Recibido: {update_data}")

    # === LOGICA DE ALTA HOSPITALARIA (PATCH) ===
    new_status = update_data.get("status")
    if db_resident.status == "hospitalized" and new_status == "active":
        # 1. Determinar fecha fin
        end_date = update_data.get("hospitalization_end_date") or date.today()

        # 2. Crear entrada histórica
        history_entry = {
            "start": db_resident.hospitalization_date.isoformat()
            if db_resident.hospitalization_date
            else None,
            "end": end_date.isoformat()
            if isinstance(end_date, date)
            else end_date,
            "hospital": db_resident.hospitalization_hospital,
            "reason": db_resident.hospitalization_reason,
        }

        # 3. Actualizar historial
        current_history = (
            list(db_resident.hospitalization_history)
            if db_resident.hospitalization_history
            else []
        )
        current_history.append(history_entry)
        db_resident.hospitalization_history = current_history

        # 4. Limpiar campos actuales en DB
        db_resident.hospitalization_date = None
        db_resident.hospitalization_end_date = None
        db_resident.hospitalization_hospital = None
        db_resident.hospitalization_reason = None
        # hospitalization_notes removed

    for key, value in update_data.items():
        # Si estamos dando de alta, ignorar updates a campos de hospitalización que vendrían del form (que a veces manda los datos viejos)
        if key.startswith("hospitalization_") and new_status == "active":
            continue

        # === LOGICA DE BAJA / DEFUNCIÓN (PATCH) ===
        if key == "status" and value in ["inactive", "deceased"]:
            if not update_data.get("inactive_date") and not db_resident.inactive_date:
                db_resident.inactive_date = date.today()
            if value == "deceased" and not update_data.get("inactive_reason") and not db_resident.inactive_reason:
                db_resident.inactive_reason = "Defunción registrada"

            if db_resident.status == "hospitalized":
                db_resident.hospitalization_date = None
                db_resident.hospitalization_hospital = None
                db_resident.hospitalization_reason = None

        setattr(db_resident, key, value)

    db.commit()
    db.refresh(db_resident)

    return db_resident


@router.post(
    "/{resident_id}/photo", response_model=schemas_extended.ResidentExtended
)
async def upload_resident_photo(
    resident_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
    request: Request = None,
    background_tasks: BackgroundTasks = None,
):
    if not permissions.has_permission("edit_resident_basic", current_user.role):
        raise HTTPException(status_code=403, detail="Permission denied")

    resident = (
        db.query(models.Resident)
        .filter(
            models.Resident.id == resident_id,
            models.Resident.residence_id == current_user.residence_id,
        )
        .first()
    )
    if not resident:
        raise HTTPException(status_code=404, detail="Resident not found")

    # Validate file type
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG and WebP images are allowed",
        )

    # Delete old photo if exists
    if resident.profile_photo:
        await storage_service.delete_file(resident.profile_photo)

    # Save new photo
    # Create filename: resident_{id}_{timestamp}.ext
    ext = file.filename.split(".")[-1]
    filename = (
        f"resident_{resident_id}_{int(datetime.now().timestamp())}.{ext}"
    )

    # Save to "photos/{resident_id}" directory
    try:
        file_url = await storage_service.save_file(
            file, f"photos/{resident_id}", filename
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Could not save file: {str(e)}"
        )

    # Update DB
    resident.profile_photo = file_url
    db.commit()
    db.refresh(resident)

    return resident


# === SEGUIMIENTOS (EVOLUCIÓN) ===


@router.get(
    "/{resident_id}/followups",
    response_model=list[schemas_extended.ResidentFollowUp],
)
def get_resident_followups(
    resident_id: int,
    silent: Optional[bool] = Query(False, description="Skip audit log"),
    q: Optional[str] = Query(None, alias="q"),
    search: Optional[str] = Query(None, alias="search"),
    type: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
    request: Request = None,
    background_tasks: BackgroundTasks = None,
):
    if not permissions.has_permission("view_resident_basic", current_user.role):
        raise HTTPException(status_code=403, detail="Permiso denegado")

    try:
        query = db.query(models_extended.ResidentFollowUp, models.User.username).filter(
            models_extended.ResidentFollowUp.resident_id == resident_id,
            models_extended.ResidentFollowUp.residence_id
            == current_user.residence_id,
        ).outerjoin(
            models.User, models_extended.ResidentFollowUp.user_id == models.User.id
        )

        q_final = q or search
        if q_final:
            query = query.filter(
                models_extended.ResidentFollowUp.content.ilike(f"%{q_final}%")
            )

        if type:
            query = query.filter(models_extended.ResidentFollowUp.type == type)

        if start_date:
            # Assuming created_at is DateTime, we compare with the start of the day
            query = query.filter(
                models_extended.ResidentFollowUp.created_at
                >= datetime.combine(start_date, datetime.min.time())
            )

        if end_date:
            # Compare with the end of the day
            query = query.filter(
                models_extended.ResidentFollowUp.created_at
                <= datetime.combine(end_date, datetime.max.time())
            )

        results = query.order_by(
            models_extended.ResidentFollowUp.created_at.desc()
        ).all()

        followups = []
        for f, username in results:
            # Manual construction to ensure serializability and no Pydantic overhead
            followups.append({
                "id": f.id,
                "resident_id": f.resident_id,
                "content": f.content,
                "type": f.type,
                "staff_name": username or f.staff_name or "Sistema",
                "user_id": f.user_id,
                "created_at": f.created_at.isoformat() if f.created_at else None,
                "updated_at": f.updated_at.isoformat() if f.updated_at else None
            })

        return followups
    except Exception as e:
        print(f"CRITICAL ERROR in get_resident_followups: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error interno al cargar seguimientos: {str(e)}"
        )


@router.post(
    "/{resident_id}/followups",
    response_model=schemas_extended.ResidentFollowUp,
)
def create_resident_followup(
    resident_id: int,
    followup: schemas_extended.ResidentFollowUpBase,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
    request: Request = None,
    background_tasks: BackgroundTasks = None,
):
    # DEBUG
    print(
        f"DEBUG: create_followup | user={current_user.username} role={current_user.role} type={followup.type}"
    )

    # Verificación de permisos para acceso a la residencia
    if not permissions.has_permission("edit_resident_basic", current_user.role):
        raise HTTPException(status_code=403, detail="Permiso denegado")

    # Lógica basada en roles para el registro de seguimientos
    if current_user.role == "nurse" and followup.type != "nursing":
        raise HTTPException(
            status_code=403,
            detail=f"Enfermería solo puede registrar seguimientos de enfermería. (Rol: {current_user.role}, Tipo: {followup.type})",
        )

    if current_user.role == "aux" and followup.type != "auxiliar":
        raise HTTPException(
            status_code=403,
            detail=f"Auxiliares solo pueden registrar seguimientos auxiliares. (Rol: {current_user.role}, Tipo: {followup.type})",
        )

    # Admins can post any type but default to 'admin' if not specified (already in schema)
    # or keep it flexible.

    # Crear seguimiento - excluir user_id y residence_id del dump para evitar duplicados
    followup_data = followup.model_dump(exclude={"user_id", "residence_id"})
    db_followup = models_extended.ResidentFollowUp(
        **followup_data,
        resident_id=resident_id,
        residence_id=current_user.residence_id,
        staff_name=current_user.username,  # Legacy field
        user_id=current_user.id,  # ⭐ Guardar ID del autor
    )
    db.add(db_followup)
    db.commit()
    db.refresh(db_followup)

    return db_followup


@router.post(
    "/{resident_id}/vitals", response_model=schemas_extended.VitalSign
)
def create_vital_sign(
    resident_id: int,
    vital: schemas_extended.VitalSignCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
    request: Request = None,
    background_tasks: BackgroundTasks = None,
):
    if not permissions.has_permission("manage_vitals", current_user.role):
        raise HTTPException(status_code=403, detail="Permission denied")

    # Check if resident belongs to residence
    resident = db.query(models.Resident).filter(
        models.Resident.id == resident_id,
        models.Resident.residence_id == current_user.residence_id
    ).first()
    if not resident:
        raise HTTPException(status_code=404, detail="Resident not found")

    new_vital = models_extended.ResidentVitalSign()
    new_vital.vital_type = vital.vital_type
    new_vital.value = vital.value
    new_vital.value_text = vital.value_text
    new_vital.measured_at = vital.measured_at or datetime.utcnow()
    new_vital.resident_id = resident_id
    new_vital.residence_id = current_user.residence_id
    new_vital.user_id = current_user.id
    new_vital.staff_name = current_user.username
    db.add(new_vital)
    db.commit()
    db.refresh(new_vital)

    return new_vital


@router.post(
    "/{resident_id}/vitals/batch",
    response_model=list[schemas_extended.VitalSign],
)
def create_vital_signs_batch(
    resident_id: int,
    vitals: list[schemas_extended.VitalSignCreate],
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
    request: Request = None,
    background_tasks: BackgroundTasks = None,
):
    print(f"DEBUG: Batch create vitals for resident {resident_id}. Payload size: {len(vitals)}")
    
    if not permissions.has_permission("manage_vitals", current_user.role):
        raise HTTPException(status_code=403, detail="Permission denied")

    try:
        # Check if resident belongs to residence
        resident = db.query(models.Resident).filter(
            models.Resident.id == resident_id,
            models.Resident.residence_id == current_user.residence_id
        ).first()
        
        if not resident:
            raise HTTPException(status_code=404, detail="Resident not found")

        created_vitals = []
        for vital in vitals:
            # Validar que tengamos un valor numérico
            if vital.value is None and not vital.value_text:
                continue

            db_vital = models_extended.ResidentVitalSign()
            db_vital.vital_type = vital.vital_type
            db_vital.value = vital.value
            db_vital.value_text = vital.value_text
            db_vital.measured_at = vital.measured_at or datetime.utcnow()
            db_vital.resident_id = resident_id
            db_vital.residence_id = current_user.residence_id
            db_vital.user_id = current_user.id
            db_vital.staff_name = current_user.username
            db.add(db_vital)
            created_vitals.append(db_vital)

        if created_vitals:
            db.commit()
            for v in created_vitals:
                db.refresh(v)
        
        return created_vitals
        
    except Exception as e:
        print(f"CRITICAL ERROR in batch vitals: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@router.get(
    "/{resident_id}/vitals", response_model=list[schemas_extended.VitalSign]
)
def get_resident_vitals(
    resident_id: int,
    silent: Optional[bool] = Query(False, description="Skip audit log"),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
    request: Request = None,
    background_tasks: BackgroundTasks = None,
):
    if not permissions.has_permission("view_resident_clinical", current_user.role):
        raise HTTPException(status_code=403, detail="Permiso denegado")

    try:
        vitals = (
            db.query(models_extended.ResidentVitalSign)
            .filter(
                models_extended.ResidentVitalSign.resident_id == resident_id,
                models_extended.ResidentVitalSign.residence_id == current_user.residence_id,
            )
            .order_by(models_extended.ResidentVitalSign.measured_at.desc())
            .limit(100)
            .all()
        )

        return vitals
    except Exception as e:
        print(f"ERROR EN GET_RESIDENT_VITALS: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error interno al obtener constantes: {str(e)}"
        )


@router.post(
    "/{resident_id}/care-logs", response_model=schemas_extended.CareLog
)
def create_care_log(
    resident_id: int,
    log: schemas_extended.CareLogCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
    request: Request = None,
    background_tasks: BackgroundTasks = None,
):
    if not permissions.has_permission("manage_care", current_user.role):
        raise HTTPException(status_code=403, detail="Permiso denegado")

    db_log = models_extended.ResidentCareLog()
    db_log.care_type = log.care_type
    db_log.value = log.value
    db_log.notes = log.notes
    db_log.logged_at = log.logged_at or datetime.utcnow()
    db_log.resident_id = resident_id
    db_log.residence_id = current_user.residence_id
    db_log.user_id = current_user.id
    db_log.staff_name = current_user.username
    db.add(db_log)
    db.commit()
    db.refresh(db_log)

    return db_log


@router.get(
    "/{resident_id}/care-logs", response_model=list[schemas_extended.CareLog]
)
def get_resident_care_logs(
    resident_id: int,
    silent: Optional[bool] = Query(False, description="Skip audit log"),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
    request: Request = None,
    background_tasks: BackgroundTasks = None,
):
    if not permissions.has_permission("manage_care", current_user.role):
        raise HTTPException(status_code=403, detail="Permiso denegado")

    try:
        care_logs = (
            db.query(models_extended.ResidentCareLog)
            .filter(
                models_extended.ResidentCareLog.resident_id == resident_id,
                models_extended.ResidentCareLog.residence_id
                == current_user.residence_id,
            )
            .order_by(models_extended.ResidentCareLog.logged_at.desc())
            .all()
        )

        return care_logs
    except Exception as e:
        print(f"ERROR EN GET_RESIDENT_CARE_LOGS: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error interno al obtener cuidados: {str(e)}"
        )
