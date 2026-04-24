export type UserRole = 'ADMIN' | 'INTERPRETER' | 'PATIENT'

export type Nationality =
  | 'VIETNAM' | 'CHINA' | 'CAMBODIA' | 'MYANMAR' | 'PHILIPPINES'
  | 'INDONESIA' | 'THAILAND' | 'NEPAL' | 'MONGOLIA' | 'UZBEKISTAN'
  | 'SRI_LANKA' | 'BANGLADESH' | 'PAKISTAN' | 'OTHER'

export type Gender = 'MALE' | 'FEMALE' | 'OTHER'
export type VisaType = 'E9' | 'E6' | 'F1' | 'F2' | 'F4' | 'F5' | 'F6' | 'H2' | 'D2' | 'U' | 'OTHER'
export type IssueType = 'MEDICAL' | 'LEGAL' | 'LABOR' | 'IMMIGRATION' | 'OTHER'
export type ConsultationMethod = 'VISIT' | 'PHONE' | 'VIDEO' | 'OTHER'
export type ProcessingType = 'INTERPRETATION' | 'TRANSLATION' | 'COUNSELING' | 'OTHER'
export type InterpreterRole = 'ACTIVIST' | 'FREELANCER' | 'STAFF'
export type ScriptType = 'GENERAL' | 'EMERGENCY'

export const NATIONALITY_LABEL: Record<Nationality, string> = {
  VIETNAM: '베트남', CHINA: '중국', CAMBODIA: '캄보디아', MYANMAR: '미얀마',
  PHILIPPINES: '필리핀', INDONESIA: '인도네시아', THAILAND: '태국',
  NEPAL: '네팔', MONGOLIA: '몽골', UZBEKISTAN: '우즈베키스탄',
  SRI_LANKA: '스리랑카', BANGLADESH: '방글라데시', PAKISTAN: '파키스탄', OTHER: '기타',
}
export const GENDER_LABEL: Record<Gender, string> = { MALE: '남', FEMALE: '여', OTHER: '기타' }
export const VISA_LABEL: Record<VisaType, string> = {
  E9: 'E-9', E6: 'E-6', F1: 'F-1', F2: 'F-2', F4: 'F-4', F5: 'F-5',
  F6: 'F-6', H2: 'H-2', D2: 'D-2', U: '미등록', OTHER: '기타',
}
export const ISSUE_LABEL: Record<IssueType, string> = {
  MEDICAL: '의료', LEGAL: '법률', LABOR: '노동', IMMIGRATION: '출입국', OTHER: '기타',
}
export const METHOD_LABEL: Record<ConsultationMethod, string> = {
  VISIT: '출장/동행', PHONE: '전화', VIDEO: '영상', OTHER: '기타',
}
export const SCRIPT_LABEL: Record<ScriptType, string> = { GENERAL: '일반 진료', EMERGENCY: '응급' }

// API response types
export interface ApiResponse<T> {
  statusCode: number
  isSuccess: boolean
  message: string
  payload: T
  pageInfo?: PageInfo
}
export interface PageInfo {
  page: number
  size: number
  hasNext: boolean
  totalElements: number
  totalPages: number
}

export interface Patient {
  id: string
  name: string
  nationality: Nationality
  gender: Gender
  visaType: VisaType
  visaNote?: string
  birthDate?: string
  phone?: string
  region?: string
  workplaceName?: string
  createdAt: string
  updatedAt: string
}

export interface Interpreter {
  id: string
  name: string
  phone?: string
  role: InterpreterRole
  languages: string[]
  active: boolean
  createdAt: string
}

export interface Hospital { id: string; name: string; address?: string; phone?: string }

export interface Consultation {
  id: string
  consultationDate: string
  patientId: string
  patientName: string
  interpreterId?: string
  interpreterName?: string
  hospitalId?: string
  hospitalName?: string
  department?: string
  issueType: IssueType
  method?: ConsultationMethod
  processing?: ProcessingType
  memo?: string
  durationHours?: number
  fee?: number
  nextAppointmentDate?: string
  confirmedAt?: string
  confirmedBy?: string
  confirmedByPhone?: string
  confirmed: boolean
  createdAt: string
  updatedAt: string
}

export interface Handover {
  id: string
  patientId: string
  patientName: string
  fromInterpreterId?: string
  fromInterpreterName?: string
  toInterpreterId?: string
  toInterpreterName?: string
  consultationId?: string
  reason: string
  notes?: string
  assigned: boolean
  createdAt: string
}

export interface PatientMatch {
  id: string
  patientId: string
  patientName: string
  interpreterId: string
  interpreterName: string
  active: boolean
  createdAt: string
}

export interface MedicalScript {
  id: string
  patientId: string
  patientName: string
  consultationId?: string
  scriptType: ScriptType
  contentKo: string
  contentOrigin?: string
  createdAt: string
}

export interface AuthMe {
  authUserId: string
  role: UserRole
  name?: string
  entityId?: string
}

export interface RegisterProfileRequest {
  name: string
  nationality?: Nationality
  gender?: Gender
  visaType?: VisaType
  visaNote?: string
  phone?: string
  region?: string
  workplaceName?: string
  interpreterRole?: InterpreterRole
}
