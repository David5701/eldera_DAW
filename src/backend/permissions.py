# Define los roles disponibles en el sistema
ROLES = [
    "admin",
    "nurse",
    "doctor",
    "aux",
    "physiotherapist",
    "occupational_therapist",
    "social_worker",
    "psychologist",
]

# Matriz de permisos: acción -> lista de roles autorizados
PERMISSIONS = {
    # Gestión de Residentes
    "create_resident": ["admin", "nurse", "doctor"],
    "edit_resident_basic": [
        "admin",
        "nurse",
        "doctor",
        "aux",
        "physiotherapist",
        "occupational_therapist",
        "social_worker",
        "psychologist",
    ],
    "edit_resident_clinical": ["admin", "nurse", "doctor"],
    "delete_resident": ["admin"],
    # Permisos de visualización
    "view_resident_basic": ROLES,
    "view_resident_clinical": ROLES,
    # Cuidados y Constantes Vitales
    "manage_vitals": ["admin", "nurse", "doctor"],
    "manage_care": ["admin", "nurse", "doctor", "aux"],
    # Acciones de administración
    "export_resident": ["admin"],
    "import_resident": ["admin"],
}


def has_permission(action: str, role: str) -> bool:
    """Devuelve True si el rol tiene permiso para realizar la acción indicada."""
    allowed = PERMISSIONS.get(action, [])
    return role.lower().strip() in allowed
