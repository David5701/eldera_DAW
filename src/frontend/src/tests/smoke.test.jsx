import { describe, it, expect } from 'vitest';

describe('Smoke Test - Eldera Frontend', () => {
  it('el entorno de tests está correctamente configurado', () => {
    expect(true).toBe(true);
  });

  it('el DOM está disponible (jsdom)', () => {
    expect(typeof document).toBe('object');
    expect(document.createElement('div')).toBeTruthy();
  });

  it('lógica RBAC: los roles permitidos pueden editar secciones', () => {
    // Replica la lógica de canEditSection de ResidentFormExtended
    const SECTION_PERMISSIONS = {
      1:  ['admin', 'nurse', 'doctor'],
      2:  ['admin', 'nurse', 'doctor'],
      6:  ['admin', 'nurse', 'doctor', 'psychologist'],
      10: ['admin', 'nurse', 'doctor', 'social_worker'],
    };

    const canEdit = (sectionId, role) => {
      const allowed = SECTION_PERMISSIONS[sectionId];
      if (!allowed) return true; // Sin restricción explícita → editable
      return allowed.includes(role);
    };

    // Enfermería puede editar constantes vitales (sección 1)
    expect(canEdit(1, 'nurse')).toBe(true);
    // social_worker NO puede editar constantes vitales (sección 1)
    expect(canEdit(1, 'social_worker')).toBe(false);
    // social_worker SÍ puede editar su sección (sección 10)
    expect(canEdit(10, 'social_worker')).toBe(true);
    // Psicología SÍ puede editar sección cognitiva (sección 6)
    expect(canEdit(6, 'psychologist')).toBe(true);
    // Auxiliar NO puede editar constantes (sección 1)
    expect(canEdit(1, 'aux')).toBe(false);
  });
});
