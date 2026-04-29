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
const nullableString = z.string().nullable().optional().transform(v => v ?? undefined)
const nullableUuid = z.string().uuid().nullable().optional().transform(v => v ?? undefined)
const nullableNumber = z.number().nullable().optional().transform(v => v ?? undefined)

export const patientSchema = z.object({
  id:            z.string().uuid(),
  name:          z.string(),
  nationality:   nationalitySchema,
  gender:        genderSchema,
  visaType:      visaTypeSchema,
  visaNote:      nullableString,
  birthDate:     nullableString,
  phone:         nullableString,
  region:        nullableString,
  workplaceName: nullableString,
  accountLinked: z.boolean().optional().default(false),
  createdAt:     z.string(),
  updatedAt:     z.string().optional().default(''),
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
  patientBirthDate:    nullableString,
  patientNationality:  nationalitySchema.nullable().optional().transform(v => v ?? undefined),
  patientGender:       genderSchema.nullable().optional().transform(v => v ?? undefined),
  patientVisaType:     visaTypeSchema.nullable().optional().transform(v => v ?? undefined),
  patientWorkplaceName: nullableString,
  patientRegion:       nullableString,
  patientPhone:        nullableString,
  interpreterId:       nullableUuid,
  interpreterName:     nullableString,
  hospitalId:          nullableUuid,
  hospitalName:        nullableString,
  department:          nullableString,
  doctorName:          nullableString,
  issueType:           issueTypeSchema,
  method:              methodSchema.nullable().optional().transform(v => v ?? undefined),
  processing:          processingTypeSchema.nullable().optional().transform(v => v ?? undefined),
  memo:                nullableString,
  patientComment:      nullableString,
  treatmentResult:     nullableString,
  diagnosisContent:    nullableString,
  diagnosisNameCode:   nullableString,
  medicationInstruction: nullableString,
  counselorName:       nullableString,
  workDescription:     nullableString,
  doctorConfirmationSignature: nullableString,
  durationHours:       nullableNumber,
  fee:                 nullableNumber,
  nextAppointmentDate: nullableString,
  confirmedAt:         nullableString,
  confirmedBy:         nullableString,
  confirmedByPhone:    nullableString,
  confirmed:           z.boolean(),
  createdAt:           z.string().optional().default(''),
  updatedAt:           z.string().optional().default(''),
})

export const patientReportSchema = z.object({
  id:                    z.string().uuid(),
  consultationDate:      z.string(),
  hospitalName:          nullableString,
  department:            nullableString,
  doctorName:            nullableString,
  patientComment:        nullableString,
  treatmentResult:       nullableString,
  diagnosisContent:      nullableString,
  diagnosisNameCode:     nullableString,
  medicationInstruction: nullableString,
  nextAppointmentDate:   nullableString,
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
  name:       z.string().nullable().optional(),
  entityId:   z.string().uuid().nullable().optional(),
})

export const memberSchema = z.object({
  authUserId: z.string().uuid(),
  email: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  role: z.enum(['admin', 'interpreter']),
  interpreterRole: interpreterRoleSchema.nullable().optional(),
  interpreterId: z.string().uuid().nullable().optional(),
  profileRegistered: z.boolean(),
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
  patientReport: patientReportSchema,
  patientReports: z.array(patientReportSchema),
  handover:      handoverSchema,
  handovers:     z.array(handoverSchema),
  match:         patientMatchSchema,
  matches:       z.array(patientMatchSchema),
  script:        medicalScriptSchema,
  scripts:       z.array(medicalScriptSchema),
  authMe:        authMeSchema,
  member:        memberSchema,
  members:       z.array(memberSchema),
}
