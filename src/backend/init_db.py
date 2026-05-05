
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
            print("   Esto es normal en algunos entornos gestionados. Asegúrese de habilitarla manualmente si es necesario.")
            db.rollback()

        # 1. Asegurar que existe la Residencia 1 (DEPENDENCIA CRÍTICA)
        residence = db.query(models.Residence).filter(models.Residence.id == 1).first()
        if not residence:
            print("Creando residencia por defecto (ID=1)...")
            residence = models.Residence(
                id=1,
                name="Residencia Eldera Demo",
                cif="DEMO12345",
                plan="pro"
            )
            db.add(residence)
            db.commit()
            print("✅ Residencia por defecto creada.")

        # 2. Verificar/Crear Usuario Administrador
        user = (
            db.query(models.User)
            .filter(models.User.username == "admin")
            .first()
        )
        if not user:
            print("Creando usuario administrador...")
            hashed_password = auth.get_password_hash("admin123")
            admin_user = models.User(
                username="admin",
                hashed_password=hashed_password,
                role="admin",
                residence_id=1, # Vinculado a la residencia por defecto
                is_active=True,
            )
            db.add(admin_user)
            db.commit()
            print("✅ Usuario administrador creado con éxito.")
        else:
            # CORRECCIÓN DE MIGRACIÓN: Asegurar que el admin tiene hash bcrypt (empieza por $2b$)
            # Esto soluciona fallos de login tras cambiar de passlib a bcrypt
            if not user.hashed_password.startswith("$2b$"):
                print("⚠️ Migrando contraseña de admin al formato bcrypt...")
                user.hashed_password = auth.get_password_hash("admin123")
                db.commit()
                print("✅ Contraseña de admin migrada con éxito.")

        # Crear usuarios de prueba para todos los roles
        test_users_data = [
            ("admin", "admin123", "admin"),
            ("director1", "director123", "director"),
            ("nurse1", "nurse123", "nurse"),
            ("aux1", "aux123", "aux"),
            ("doctor_test", "eldera2024", "doctor"),
            ("social_test", "eldera2024", "social_worker"),
            ("occupational_test", "eldera2024", "occupational_therapist"),
            ("physio_test", "eldera2024", "physiotherapist"),
        ]

        for username, password, role in test_users_data:
            existing_user = (
                db.query(models.User)
                .filter(models.User.username == username)
                .first()
            )
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
        db.commit()
        print("✅ Usuarios de prueba creados con éxito")

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
                    print(
                        f"   Sanitizando ID {r.id}: '{r.emergency_contact}' -> '{clean_num}'"
                    )
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
