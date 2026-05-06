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

## 🌐 Despliegue Cloud (Render)

El proyecto está preparado para el despliegue automático en **Render** mediante el archivo `render.yaml` (Blueprint).

### Componentes en Render:
- **API (Backend)**: Desplegado como servicio web Docker (`src/backend/Dockerfile`).
- **Web (Frontend)**: Desplegado como sitio estático (`src/frontend`).

### Configuración Necesaria:
Es obligatorio configurar las siguientes variables de entorno en el panel de Render:
- `DATABASE_URL`: Conexión a PostgreSQL (Render DB o externa).
- `SECRET_KEY`: Cadena aleatoria para seguridad de tokens.
- `FORCE_RESET`: Debe estar en `false` para evitar borrado de datos en cada despliegue.

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
| `director1` | `director123` | Dirección |
| `nurse1` | `nurse123` | Enfermería |
| `doctor_test` | `eldera2024` | Medicina |
| `social_test` | `eldera2024` | Trabajo Social |
| `physio_test` | `eldera2024` | Fisioterapia |

## 🛡️ Calidad de Código
El proyecto utiliza **Ruff** para linting y **Pytest** para pruebas:
```bash
docker exec -it eldera_daw_backend pytest
```

---
*Proyecto desarrollado para la entrega académica final del Grado Superior en Desarrollo de Aplicaciones Web (DAW).*
