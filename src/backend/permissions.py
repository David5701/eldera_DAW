# Define available roles
ROLES = ["admin", "director", "nurse", "doctor", "aux", "fisio", "terapeuta", "trabajador_social"]

# Permission matrix: action -> list of roles allowed
PERMISSIONS = {
    # Resident Management
    "create_resident": ["admin", "director", "nurse", "doctor"],
    "edit_resident_basic": ["admin", "director", "nurse", "doctor", "aux"],
    "edit_resident_clinical": ["admin", "director", "nurse", "doctor"],
    "delete_resident": ["admin"],

    # View permissions
    "view_resident_basic": ROLES,
    "view_resident_clinical": ["admin", "director", "nurse", "doctor", "fisio", "terapeuta", "trabajador_social"],

    # Care & Vitals
    "manage_vitals": ["admin", "director", "nurse", "doctor", "aux", "fisio"],
    "manage_care": ["admin", "director", "nurse", "doctor", "aux", "fisio", "terapeuta"],

    # Admin actions
    "export_resident": ["admin", "director"],
    "import_resident": ["admin"],
}


def has_permission(action: str, role: str) -> bool:
    """Return True if the given role is allowed to perform the action."""
    allowed = PERMISSIONS.get(action, [])
    return role in allowed
