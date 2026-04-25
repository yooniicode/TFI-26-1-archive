import { z } from 'zod'

// ─── 공통 Enum ───────────────────────────────────────────────
export const nationalitySchema = z.enum([
  'VIETNAM','CHINA','CAMBODIA','MYANMAR','PHILIPPINES',
  'INDONESIA','THAILAND','NEPAL','MONGOLIA','UZBEKISTAN',
  'SRI_LANKA','BANGLADESH','PAKISTAN','OTHER',
])
export const genderSchema          = z.enum(['MALE','FEMALE','OTHER'])
export const visaTypeSchema        = z.enum(['E9','E6','F1','F2','F4','F5','F6','H2','D2','U','OTHER'])
export const issueTypeSchema       = z.enum(['MEDICAL','LEGAL','LABOR','IMMIGRATION','OTHER'])
export const methodSchema          = z.enum(['VISIT','PHONE','VIDEO','OTHER'])
export const processingTypeSchema  = z.enum(['INTERPRETATION','TRANSLATION','COUNSELING','OTHER'])
export const interpreterRoleSchema = z.enum(['ACTIVIST','FREELANCER','STAFF'])
export const scriptTypeSchema      = z.enum(['GENERAL','EMERGENCY'])
export const userRoleSchema        = z.enum(['admin','interpreter','patient'])

// ─── 엔티티 ─────────────────────────────────────────────────
export const patientSchema = z.object({
  id:            z.string().uuid(),
  name:          z.string(),
  nationality:   nationalitySchema,
  gender:        genderSchema,
  visaType:      visaTypeSchema,
  visaNote:      z.string().optional(),
  birthDate:     z.string().optional(),
  phone:         z.string().optional(),
  region:        z.string().optional(),
  workplaceName: z.string().optional(),
  createdAt:     z.string(),
  updatedAt:     z.string(),
})

export const interpreterSchema = z.object({
  id:        z.string().uuid(),
  name:      z.string(),
  phone:     z.string().optional(),
  role:      interpreterRoleSchema,
  languages: z.array(z.string()),
  active:    z.boolean(),
  createdAt: z.string(),
})

export const hospitalSchema = z.object({
  id:      z.string().uuid(),
  name:    z.string(),
  address: z.string().optional(),
  phone:   z.string().optional(),
})

export const consultationSchema = z.object({
  id:                  z.string().uuid(),
  consultationDate:    z.string(),
  patientId:           z.string().uuid(),
  patientName:         z.string(),
  interpreterId:       z.string().uuid().optional(),
  interpreterName:     z.string().optional(),
  hospitalId:          z.string().uuid().optional(),
  hospitalName:        z.string().optional(),
  department:          z.string().optional(),
  issueType:           issueTypeSchema,
  method:              methodSchema.optional(),
  processing:          processingTypeSchema.optional(),
  memo:                z.string().optional(),
  durationHours:       z.number().optional(),
  fee:                 z.number().optional(),
  nextAppointmentDate: z.string().optional(),
  confirmedAt:         z.string().optional(),
  confirmedBy:         z.string().optional(),
  confirmedByPhone:    z.string().optional(),
  confirmed:           z.boolean(),
  createdAt:           z.string(),
  updatedAt:           z.string(),
})

export const handoverSchema = z.object({
  id:                   z.string().uuid(),
  patientId:            z.string().uuid(),
  patientName:          z.string(),
  fromInterpreterId:    z.string().uuid().optional(),
  fromInterpreterName:  z.string().optional(),
  toInterpreterId:      z.string().uuid().optional(),
  toInterpreterName:    z.string().optional(),
  consultationId:       z.string().uuid().optional(),
  reason:               z.string(),
  notes:                z.string().optional(),
  assigned:             z.boolean(),
  createdAt:            z.string(),
})

export const patientMatchSchema = z.object({
  id:              z.string().uuid(),
  patientId:       z.string().uuid(),
  patientName:     z.string(),
  interpreterId:   z.string().uuid(),
  interpreterName: z.string(),
  active:          z.boolean(),
  createdAt:       z.string(),
})

export const medicalScriptSchema = z.object({
  id:            z.string().uuid(),
  patientId:     z.string().uuid(),
  patientName:   z.string(),
  consultationId: z.string().uuid().optional(),
  scriptType:    scriptTypeSchema,
  contentKo:     z.string(),
  contentOrigin: z.string().optional(),
  createdAt:     z.string(),
})

export const authMeSchema = z.object({
  authUserId: z.string(),
  role:       userRoleSchema,
  name:       z.string().optional(),
  entityId:   z.string().uuid().optional(),
})

// ─── 배열 스키마 ─────────────────────────────────────────────
export const schemas = {
  patient:       patientSchema,
  patients:      z.array(patientSchema),
  interpreter:   interpreterSchema,
  interpreters:  z.array(interpreterSchema),
  hospital:      hospitalSchema,
  hospitals:     z.array(hospitalSchema),
  consultation:  consultationSchema,
  consultations: z.array(consultationSchema),
  handover:      handoverSchema,
  handovers:     z.array(handoverSchema),
  match:         patientMatchSchema,
  matches:       z.array(patientMatchSchema),
  script:        medicalScriptSchema,
  scripts:       z.array(medicalScriptSchema),
  authMe:        authMeSchema,
}
