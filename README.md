# Eldera - Clinical Management Ecosystem

Eldera es una plataforma avanzada de gestión clínica y administrativa diseñada específicamente para entornos residenciales geriátricos. El sistema ofrece un núcleo de software de alta disponibilidad, centrado en la seguridad del paciente y la eficiencia operativa del personal multidisciplinar.

## 🏗️ Arquitectura y Principios de Diseño

El sistema se fundamenta en tres pilares de ingeniería:

1.  **Lógica de Negocio Soberana**: Implementación de una Arquitectura Hexagonal que aisla las reglas clínicas de la infraestructura, facilitando la testabilidad y el mantenimiento a largo plazo.
2.  **Seguridad "Zero Footprint" (BYOD)**: Diseñado para dispositivos personales. Los datos de salud (PHI) residen exclusivamente en memoria volátil (RAM), sin persistencia en el dispositivo cliente, garantizando el cumplimiento normativo en entornos de movilidad.
3.  **Contexto por Rol**: La interfaz se adapta dinámicamente al perfil del profesional (Enfermería, Medicina, Fisioterapia, etc.), optimizando los flujos de trabajo y minimizando la posibilidad de error humano.

## 🛠️ Stack Tecnológico

Eldera utiliza un conjunto de tecnologías modernas seleccionadas por su robustez y rendimiento:

*   **Frontend**: SPA desarrollada con **React 19**, utilizando **Vite** para la compilación y **Tailwind CSS** para un diseño responsivo y premium.
*   **Backend**: API asíncrona de alto rendimiento construida con **FastAPI** (Python 3.11+).
*   **Persistencia**: **PostgreSQL 15** con integridad referencial estricta y arquitectura multi-tenant nativa.
*   **Seguridad**: Protocolo **OAuth2** con Bearer Tokens (JWT) y cifrado de alta seguridad.
*   **Infraestructura**: Contenerización completa mediante **Docker** y orquestación con **Docker Compose**.

## 📁 Estructura del Proyecto

```text
eldera/
├── src/
│   ├── backend/          # API FastAPI, esquemas Pydantic y lógica ORM
│   │   ├── models.py     # Modelos de datos de residentes y clínica
│   │   ├── routers/      # Endpoints organizados por módulos
│   │   └── main.py       # Punto de entrada y middlewares de seguridad
│   └── frontend/         # Interfaz de usuario React
│       ├── src/pages/    # Vistas principales del sistema
│       └── src/components/# Componentes reutilizables y formularios
├── docker-compose.yml    # Orquestación de servicios
└── pyproject.toml        # Gestión de dependencias y calidad (Ruff)
```

## 🚀 Instalación y Despliegue

La plataforma está diseñada para ser desplegada en segundos en cualquier entorno compatible con Docker.

### 1. Despliegue de Servicios
```bash
# Construir e iniciar el stack completo
docker-compose up -d --build
```

### 2. Inicialización de la Base de Datos
```bash
# Crear esquema y cargar datos maestros/semilla
docker exec eldera_backend python init_db.py
```

## 📋 Requisitos del Sistema
*   Docker Engine 20.10+
*   Docker Compose v2.0+
*   8GB RAM Recomendados para el stack completo

## 💻 Acceso al Sistema
Una vez iniciado, el sistema es accesible en las siguientes direcciones:

*   **Interfaz de Usuario**: [http://localhost:5180](http://localhost:5180)
*   **Documentación API**: [http://localhost:8000/docs](http://localhost:8000/docs)

### Credenciales de Acceso (Desarrollo)
| Usuario | Contraseña | Perfil |
|---------|------------|--------|
| `admin` | `admin123` | Administrador |
| `nurse` | `nurse123` | Enfermería |
| `director` | `director123` | Dirección |

## 🛡️ Calidad de Código y Mantenimiento
Eldera utiliza **Ruff** para garantizar la consistencia del código y **Pytest** para la validación de la lógica clínica. Para asegurar la integridad del sistema antes de cada despliegue, se recomienda ejecutar:
```bash
docker exec eldera_backend pytest
```

---
*Proyecto desarrollado para la entrega académica final del Grado Superior en Desarrollo de Aplicaciones Web (DAW).*
