import { z } from 'zod';

// --- HELPER SCHEMAS ---
const optionalString = z.string().optional().or(z.literal(''));
const optionalDate = z.string().optional().or(z.literal(''));
const optionalNumber = z.number().optional().or(z.string().optional().transform(val => val === '' ? undefined : Number(val)));

// --- REFINEMENT LOGIC (Extracted for reuse) ---
const dniRefinement = (data, ctx) => {
  if (data.document_type === 'DNI' || data.document_type === 'NIE' || data.document_type === 'DNI_NIE') {
      if (!data.dni_nie) {
          ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "El documento es obligatorio",
              path: ["dni_nie"]
          });
          return;
      }
      
      const str = data.dni_nie.toUpperCase().trim();
      
      // Determine if it looks like a DNI or a NIE
      const isNIE = /^[XYZ]/.test(str);
      const isDNI = /^[0-9]/.test(str);
      
      if (isDNI) {
          const dniRexp = /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i;
          if (!dniRexp.test(str)) {
              ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: "Formato DNI incorrecto (8 números + letra)",
                  path: ["dni_nie"]
              });
              return;
          }
          const validChars = 'TRWAGMYFPDXBNJZSQVHLCKE';
          const numberPart = str.substr(0, 8);
          const charIndex = parseInt(numberPart) % 23;
          if (validChars.charAt(charIndex) !== str.substr(-1)) {
              ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: `Letra DNI incorrecta (debería ser ${validChars.charAt(charIndex)})`,
                  path: ["dni_nie"]
              });
          }
      } else if (isNIE) {
          const nieRexp = /^[XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/i;
          if (!nieRexp.test(str)) {
              ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: "Formato NIE incorrecto (X/Y/Z + 7 números + letra)",
                  path: ["dni_nie"]
              });
              return;
          }
          const validChars = 'TRWAGMYFPDXBNJZSQVHLCKE';
          const nie = str.replace(/^[X]/, '0').replace(/^[Y]/, '1').replace(/^[Z]/, '2');
          const numberPart = nie.substr(0, 8);
          const charIndex = parseInt(numberPart) % 23;
          if (validChars.charAt(charIndex) !== str.substr(-1)) {
               ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: `Letra NIE incorrecta (debería ser ${validChars.charAt(charIndex)})`,
                  path: ["dni_nie"]
              });
          }
      } else {
          ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Formato de documento no reconocido (DNI o NIE)",
              path: ["dni_nie"]
          });
      }
  }
  
    // 3. PASSPORT Validation
    if (data.document_type === 'PASSPORT') {
        if (!data.dni_nie) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "El Pasaporte es obligatorio",
                path: ["dni_nie"]
            });
            return;
        }
        const str = data.dni_nie;
        // Generic International Passport: 6-20 Alphanumeric characters
        const passportRegex = /^[A-Z0-9]{6,20}$/i;
  
        if (!passportRegex.test(str)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Formato Pasaporte inválido (6-20 caracteres alfanuméricos)",
                path: ["dni_nie"]
            });
        }
    }
};

const healthRefinement = (data, ctx) => {
  // Se eliminan las restricciones estrictas de tipo para evitar bloqueos en el formulario
  // y permitir un registro más ágil según feedback del usuario.
  
  // 3. Allergy Details Required
  if (data.has_medication_allergy && !data.allergy_medication_detail) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Especifique el medicamento al que tiene alergia",
      path: ["allergy_medication_detail"],
    });
  }
  if (data.has_food_allergy && !data.allergy_food_detail) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Especifique el alimento al que tiene alergia",
      path: ["allergy_food_detail"],
    });
  }
  if (data.has_material_allergy && !data.allergy_material_detail) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Especifique el material al que tiene alergia",
      path: ["allergy_material_detail"],
    });
  }
  if (data.has_food_intolerance && !data.intolerance_food_detail) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Especifique a qué alimento tiene intolerancia",
      path: ["intolerance_food_detail"],
    });
  }
};

const nutritionRefinement = (data, ctx) => {
  if (data.dysphagia) {
      if (!data.diet_texture || data.diet_texture === 'Líquida') {
          ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Un paciente con disfagia requiere textura engrosada (Néctar, Miel, Pudding)",
              path: ["diet_texture"]
          });
      }
      if (data.dysphagia_grade && (data.dysphagia_grade < 1 || data.dysphagia_grade > 4)) {
          ctx.addIssue({
               code: z.ZodIssueCode.custom,
               message: "Grado debe ser entre 1 y 4",
               path: ["dysphagia_grade"]
          });
      }
  }
};

const eliminationRefinement = (data, ctx) => {
    if (data.diaper_use) {
        if (!data.diaper_type) {
             ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Seleccione tipo de pañal",
              path: ["diaper_type"]
          });
        }
        if (!data.diaper_size) {
             ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Seleccione talla de pañal",
              path: ["diaper_size"]
          });
        }
    }
    if (data.urinary_incontinence === true && !data.incontinence_type) {
         ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Especifique tipo de incontinencia",
              path: ["incontinence_type"]
          });
    }
};

const mobilityRefinement = (data, ctx) => {
   if (data.device_oxygen) {
       if (!data.device_oxygen_type) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Especifique tipo de dispositivo de O2",
              path: ["device_oxygen_type"]
          });
       }
       if (!data.device_oxygen_flow) {
           ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Especifique flujo (L/min)",
              path: ["device_oxygen_flow"]
          });
       }
   }
};

const cognitiveRefinement = (data, ctx) => {
    // Basic range checks (optional but safer)
    if (data.mmse_score !== undefined && data.mmse_score !== null && (data.mmse_score < 0 || data.mmse_score > 30)) {
        ctx.addIssue({
           code: z.ZodIssueCode.custom,
           message: "MMSE debe ser entre 0 y 30",
           path: ["mmse_score"]
        });
    }
    if (data.pfeiffer_score !== undefined && data.pfeiffer_score !== null && (data.pfeiffer_score < 0 || data.pfeiffer_score > 10)) {
        ctx.addIssue({
           code: z.ZodIssueCode.custom,
           message: "Pfeiffer debe ser entre 0 y 10",
           path: ["pfeiffer_score"]
        });
    }
};

// --- SECTION SCHEMAS (Base Objects) ---

// 1. Basic Information Base
export const basicInfoBase = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  surname: z.string().min(2, "Los apellidos deben tener al menos 2 caracteres"),
  document_type: z.enum(['DNI', 'NIE', 'PASSPORT', 'OTHER', 'DNI_NIE']).default('DNI'),
  dni_nie: z.string().optional().or(z.literal('')),
  date_of_birth: z.string().refine(val => !isNaN(Date.parse(val)), "Fecha inválida"),
  sex: z.enum(['M', 'F'], { errorMap: () => ({ message: "Seleccione un sexo" }) }),
  admission_date: z.string().refine(val => !isNaN(Date.parse(val)), "Fecha de ingreso inválida"),
  room_number: z.string().min(1, "Asigne una habitación"),
  status: z.enum(['active', 'inactive', 'hospitalized', 'deceased']),
  
  // Contact & Address
  address: optionalString,
  postal_code: z.string().optional().or(z.literal('')),
  municipality: optionalString,
  phone: z.string().optional().or(z.literal('')),
  email: z.string().optional().or(z.literal('')),

  // Emergency Contact (Optional but recommended)
  emergency_contact: z.string().min(3, "Indique un contacto de emergencia"),
  emergency_phone: z.string().optional().or(z.literal('')),
});

// 2. Health Base
export const healthBase = z.object({
  // Medical Core
  primary_doctor: optionalString,
  health_center: optionalString,
  health_center_type: optionalString,
  health_center_phone: optionalString,
  private_health_phone: optionalString,
  reference_hospital: optionalString,
  last_hospital_visit: optionalDate,
  last_hospital_visit_type: optionalString,

  // Diagnoses (Checkboxes)
  diagnosis_hypertension: z.boolean().optional(),
  diagnosis_diabetes: z.boolean().optional(),
  diagnosis_diabetes_type: optionalString,
  diagnosis_copd: z.boolean().optional(),
  diagnosis_alzheimer: z.boolean().optional(),
  diagnosis_parkinson: z.boolean().optional(),
  diagnosis_stroke: z.boolean().optional(),
  diagnosis_cardiopathy: z.boolean().optional(),
  diagnosis_renal_failure: z.boolean().optional(),
  diagnosis_osteoporosis: z.boolean().optional(),
  diagnosis_arthritis: z.boolean().optional(),
  diagnosis_cancer: z.boolean().optional(),
  diagnosis_cancer_type: optionalString,

  // Allergies
  has_medication_allergy: z.boolean().optional(),
  allergy_medication_detail: optionalString,
  has_food_allergy: z.boolean().optional(),
  allergy_food_detail: optionalString,
  has_food_intolerance: z.boolean().optional(),
  intolerance_food_detail: optionalString,
  has_material_allergy: z.boolean().optional(),
  allergy_material_detail: optionalString,
  no_known_allergies: z.boolean().optional(),
});

// 3. Nutrition Base
export const nutritionBase = z.object({
  // diet_type: optionalString, // DEPRECATED
  diet_normal: z.boolean().optional(),
  diet_diabetic: z.boolean().optional(),
  diet_low_salt: z.boolean().optional(),
  diet_astringent: z.boolean().optional(),
  diet_protection: z.boolean().optional(),
  diet_soft: z.boolean().optional(),
  diet_pureed: z.boolean().optional(),
  dysphagia: z.boolean().optional(),
  dysphagia_grade: optionalNumber,
  diet_texture: optionalString,
  thickener_instructions: optionalString,
  weight: optionalNumber,
  height: optionalNumber,
  bmi: optionalNumber,
  supplementation_formula: optionalString,
  supplement_hchp: z.boolean().optional(),
  supplement_diabetes: z.boolean().optional(),
  supplement_renal: z.boolean().optional(),
  supplement_fiber: z.boolean().optional(),
});

// 4. Elimination Base
export const eliminationBase = z.object({
  urinary_incontinence: z.boolean().optional(),
  urinary_incontinence_frequency: optionalNumber,
  incontinence_type: optionalString,
  fecal_incontinence: z.boolean().optional(),
  fecal_incontinence_frequency: optionalNumber,
  diaper_use: z.boolean().optional(),
  diaper_type: optionalString,
  diaper_size: optionalString,
  diaper_changes_per_day: optionalNumber,
  bath_autonomy: optionalString,
  bath_frequency: optionalNumber,
});

// 5. Mobility Base
export const mobilityBase = z.object({
  mobility_level: optionalString,
  device_dentures: z.boolean().optional(),
  device_dentures_type: optionalString,
  device_hearing_aids: z.boolean().optional(),
  device_hearing_aids_side: optionalString,
  device_hearing_aids_brand: optionalString,
  device_glasses: z.boolean().optional(),
  device_oxygen: z.boolean().optional(),
  device_oxygen_type: optionalString,
  device_oxygen_flow: optionalNumber,
  device_oxygen_hours: optionalNumber,
});

// 6. Cognitive Base
export const cognitiveBase = z.object({
  cognitive_impairment: optionalString,
  mmse_score: optionalNumber,
  pfeiffer_score: optionalNumber,
  behavior_agitation: z.boolean().optional(),
  behavior_night_wandering: z.boolean().optional(),
  behavior_aggression: z.boolean().optional(),
  behavior_aggression_type: optionalString,
  behavior_disorientation: z.boolean().optional(),
  behavior_disorientation_type: optionalString,
  uses_psychotropics: z.boolean().optional(),
});

// 9. Sexuality Base
export const sexualityBase = z.object({
  sexuality_observations: optionalString,
});


// --- EXPORTED SCHEMAS (With Logic) ---

// Individual schemas (for partial validation if needed)
export const basicInfoSchema = basicInfoBase.superRefine(dniRefinement);
export const healthSchema = healthBase.superRefine(healthRefinement);

// MAIN SCHEMA (Aggregator)
// Merge base objects first, THEN apply all refinements
export const residentSchema = basicInfoBase
    .merge(healthBase)
    .merge(nutritionBase)
    .merge(eliminationBase)
    .merge(mobilityBase)
    .merge(cognitiveBase)
    .merge(sexualityBase)
    .superRefine(dniRefinement)
    .superRefine(healthRefinement)
    .superRefine(nutritionRefinement)
    .superRefine(eliminationRefinement)
    .superRefine(mobilityRefinement)
    .superRefine(cognitiveRefinement);
