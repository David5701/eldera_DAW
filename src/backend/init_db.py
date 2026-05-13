import auth
import models
from database import SessionLocal, engine
from sqlalchemy import text


def init_db():
    db = SessionLocal()
    try:
        # 0. Habilitar extensiones de PostgreSQL
        print("Habilitando extensiones de PostgreSQL (unaccent)...")
        try:
            db.execute(text("CREATE EXTENSION IF NOT EXISTS unaccent"))
            db.commit()
            print("✅ Extensión unaccent habilitada.")
        except Exception as e:
            print(f"⚠️  No se pudo habilitar unaccent automáticamente: {e}")
            db.rollback()

        # 0.1 Sincronización de esquema (Asegurar columnas nuevas tras actualizaciones de modelos)
        print("Verificando integridad del esquema de base de datos...")
        from sqlalchemy import inspect

        inspector = inspect(engine)
        if "residents" in inspector.get_table_names():
            columns = [col["name"] for col in inspector.get_columns("residents")]

            # Listado de columnas críticas añadidas recientemente
            required_cols = [
                ("surgical_history", "TEXT"),
                ("other_diseases", "TEXT"),
                ("diagnosis_hypertension_detail", "VARCHAR"),
                ("diagnosis_cancer_type", "VARCHAR"),
                ("requires_positioning", "BOOLEAN DEFAULT FALSE"),
                ("positioning_frequency", "INTEGER"),
                ("uses_anti_bedsore_mattress", "BOOLEAN DEFAULT FALSE"),
                ("requires_diabetic_foot_care", "BOOLEAN DEFAULT FALSE"),
                ("requires_special_oral_care", "BOOLEAN DEFAULT FALSE"),
                ("additional_data", "JSON"),
                ("family_contacts", "JSON"),
                ("sleep_medication", "VARCHAR"),
                ("sleep_pattern", "VARCHAR"),
                ("sleep_observations", "TEXT"),
            ]

            for col_name, col_type in required_cols:
                if col_name not in columns:
                    print(f"   🔧 Añadiendo columna faltante: {col_name}...")
                    try:
                        # Usar JSON en lugar de JSONB para compatibilidad si no es Postgres
                        db.execute(text(f"ALTER TABLE residents ADD COLUMN {col_name} {col_type}"))
                        db.commit()
                    except Exception as col_err:
                        print(f"   ⚠️ Error al añadir {col_name}: {col_err}")
                        db.rollback()

        # 1. Asegurar que existe la Residencia 1 (DEPENDENCIA CRÍTICA)
        residence = db.query(models.Residence).filter(models.Residence.id == 1).first()
        if not residence:
            print("Creando residencia por defecto (ID=1)...")
            residence = models.Residence(
                id=1,
                name="Residencia Eldera Demo",
                cif="DEMO12345",
                plan="pro",
            )
            db.add(residence)
            db.commit()
            print("✅ Residencia por defecto creada.")

        # 2. Verificar/Crear Usuario Administrador
        user = db.query(models.User).filter(models.User.username == "admin").first()
        if not user:
            print("Creando usuario administrador...")
            hashed_password = auth.get_password_hash("admin123")
            admin_user = models.User(
                username="admin",
                hashed_password=hashed_password,
                role="admin",
                residence_id=1,  # Vinculado a la residencia por defecto
                is_active=True,
            )
            db.add(admin_user)
            db.commit()
            print("✅ Usuario administrador creado con éxito.")
        # Migración y creación de usuarios de prueba
        test_users_data = [
            ("admin", "admin123", "admin"),
            ("nurse1", "nurse123", "nurse"),
            ("aux1", "aux123", "aux"),
            ("doctor_test", "eldera2024", "doctor"),
            ("social_test", "eldera2024", "social_worker"),
            ("occupational_test", "eldera2024", "occupational_therapist"),
            ("physio_test", "eldera2024", "physiotherapist"),
            ("psi1", "psi123", "psychologist"),
        ]

        for username, password, role in test_users_data:
            existing_user = db.query(models.User).filter(models.User.username == username).first()
            if not existing_user:
                print(f"Creando usuario {role} '{username}'...")
                hashed_password = auth.get_password_hash(password)
                new_user = models.User(
                    username=username,
                    hashed_password=hashed_password,
                    role=role,
                    residence_id=1,
                    is_active=True,
                )
                db.add(new_user)
            else:
                # MIGRACIÓN: Si el usuario existe pero no tiene hash bcrypt, lo actualizamos
                if not existing_user.hashed_password.startswith("$2b$"):
                    print(f"⚠️ Migrando contraseña de {username} ({role}) a bcrypt...")
                    existing_user.hashed_password = auth.get_password_hash(password)
                    existing_user.role = role  # Asegurar que el rol es el correcto

        db.commit()
        print("✅ Usuarios de prueba sincronizados y migrados a bcrypt.")

        # SEMILLA DE RESIDENTES si está vacío — usar seed_test_data para la versión académica
        resident_count = db.query(models.Resident).count()
        if resident_count == 0:
            print("Poblando residentes iniciales con seed_test_data...")
            try:
                from seed_test_data import seed

                seed()
                print("✅ seed_test_data completado.")
            except Exception as seed_err:
                print(f"⚠️  seed_test_data falló (no crítico): {seed_err}")

        # MIGRACIÓN: Asegurar que todos los residentes tienen una residencia asignada
        # (ID=1 por defecto).
        # Esto es crítico para que nuevos roles como psicólogo puedan ver los datos previos.
        residents_without_residence = (
            db.query(models.Resident).filter(models.Resident.residence_id is None).count()
        )
        if residents_without_residence > 0:
            print(
                f"🔧 Migrando {residents_without_residence} residentes "
                f"sin ID de residencia a ID=1..."
            )
            db.query(models.Resident).filter(models.Resident.residence_id is None).update(
                {models.Resident.residence_id: 1}
            )
            db.commit()
            print("✅ Residentes migrados correctamente.")

        # SANITIZACIÓN: Limpiar datos existentes para asegurar cumplimiento de esquema
        print("🧹 Ejecutando Sanitización de Datos (Contactos de Emergencia)...")
        all_residents = db.query(models.Resident).all()
        import re

        count = 0
        for r in all_residents:
            if r.emergency_contact:
                # Extraer solo dígitos
                nums = re.findall(r"\d+", r.emergency_contact)
                clean_num = "".join(nums)
                # Si la extracción funcionó y es distinta, actualizar
                if clean_num and clean_num != r.emergency_contact:
                    print(f"   Sanitizando ID {r.id}: '{r.emergency_contact}' -> '{clean_num}'")
                    r.emergency_contact = clean_num
                    count += 1
        if count > 0:
            db.commit()
            print(f"✅ Sanitizados {count} residentes.")
        else:
            print("✨ Base de datos ya limpia.")

    except Exception as e:
        print(f"Error inicializando la base de datos: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
