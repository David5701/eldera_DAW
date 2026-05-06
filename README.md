# Eldera - Clinical Management Ecosystem

Eldera es una plataforma avanzada de gestión clínica y administrativa diseñada específicamente para entornos residenciales geriátricos. El sistema ofrece un núcleo de software de alta disponibilidad, centrado en la seguridad del paciente y la eficiencia operativa del personal multidisciplinar.

## 🏗️ Arquitectura y Principios de Diseño

El sistema se fundamenta en tres pilares de ingeniería:

1.  **Lógica de Negocio Soberana**: Implementación de una Arquitectura Hexagonal que aisla las reglas clínicas de la infraestructura.
2.  **Seguridad "Zero Footprint" (BYOD)**: Los datos de salud (PHI) residen exclusivamente en memoria volátil (RAM), sin persistencia en el dispositivo cliente.
3.  **Contexto por Rol**: La interfaz se adapta dinámicamente al perfil del profesional (Enfermería, Medicina, Fisioterapia, etc.).

## 🛠️ Stack Tecnológico

*   **Frontend**: SPA desarrollada con **React 19**, utilizando **Vite** y **Tailwind CSS**.
*   **Backend**: API asíncrona construida con **FastAPI** (Python 3.11+) y **uv** para la gestión de dependencias.
*   **Persistencia**: **PostgreSQL 15** con arquitectura multi-tenant nativa.
*   **Infraestructura**: Contenerización completa mediante **Docker** y **Docker Compose**.

## 📁 Estructura del Proyecto

```text
eldera-daw/
├── src/
│   ├── backend/             # Lógica API (FastAPI)
│   │   ├── alembic/         # Migraciones de base de datos
│   │   ├── routers/         # Endpoints por módulo
│   │   ├── models.py        # Esquemas base (SQLAlchemy)
│   │   ├── models_extended.py # Extensiones de modelos clínicos
│   │   ├── schemas_extended.py # Validaciones Pydantic avanzadas
│   │   ├── init_db.py       # Script de inicialización y semillas
│   │   └── main.py          # Punto de entrada de la aplicación
│   └── frontend/            # Interfaz de usuario (React)
├── docker-compose.yml       # Orquestación de servicios
├── pyproject.toml           # Gestión de dependencias y calidad (Ruff)
└── uv.lock                  # Lockfile de dependencias ultra-rápido
```

## 🚀 Instalación y Despliegue

### 1. Despliegue de Servicios
```bash
# Construir e iniciar el stack completo
docker-compose up -d --build
```

### 2. Inicialización de la Base de Datos
Es fundamental ejecutar la inicialización para cargar los datos maestros y usuarios de prueba:
```bash
# Crear esquema y cargar datos maestros/semilla
docker exec -it eldera_daw_backend python src/backend/init_db.py
```

## 📋 Requisitos del Sistema
*   Docker Engine 20.10+
*   Docker Compose v2.0+
*   8GB RAM Recomendados

## 💻 Acceso al Sistema
*   **Interfaz de Usuario**: [http://localhost:5180](http://localhost:5180)
*   **Documentación API**: [http://localhost:8085/docs](http://localhost:8085/docs)

### Credenciales de Acceso (Desarrollo)
| Usuario | Contraseña | Perfil |
|---------|------------|--------|
| `admin` | `admin123` | Administrador |
| `nurse` | `nurse123` | Enfermería |
| `director` | `director123` | Dirección |

## 🛡️ Calidad de Código
El proyecto utiliza **Ruff** para linting y **Pytest** para pruebas:
```bash
docker exec -it eldera_daw_backend pytest
```

---
*Proyecto desarrollado para la entrega académica final del Grado Superior en Desarrollo de Aplicaciones Web (DAW).*
