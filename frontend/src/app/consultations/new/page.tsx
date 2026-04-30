'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { consultationApi, patientApi, hospitalApi } from '@/lib/api'
import type { ConsultationMethod, Hospital, IssueType, Patient, ProcessingType } from '@/lib/types'
import {
  GENDER_LABEL,
  ISSUE_LABEL,
  METHOD_LABEL,
  NATIONALITY_LABEL,
  VISA_LABEL,
} from '@/lib/types'

const processingLabel: Record<ProcessingType, string> = {
  INTERPRETATION: '통역',
  TRANSLATION: '번역',
  COUNSELING: '상담',
  OTHER: '기타',
}

export default function NewConsultationPage() {
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    consultationDate: today,
    patientId: '',
    hospitalId: '',
    department: '',
    doctorName: '',
    issueType: 'MEDICAL' as IssueType,
    method: '' as '' | ConsultationMethod,
    processing: 'INTERPRETATION' as ProcessingType,
    patientComment: '',
    treatmentResult: '',
    diagnosisContent: '',
    diagnosisNameCode: '',
    medicationInstruction: '',
    nextAppointmentDate: '',
    counselorName: '',
    durationHours: '',
    fee: '',
    workDescription: '',
    doctorConfirmationSignature: '',
    memo: '',
  })

  useEffect(() => {
    Promise.all([patientApi.list(), hospitalApi.search()])
      .then(([p, h]) => {
        setPatients(p.payload ?? [])
        setHospitals(h.payload ?? [])
      })
  }, [])

  const selectedPatient = useMemo(
    () => patients.find(p => p.id === form.patientId),
    [patients, form.patientId],
  )

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.patientId) { setError('이주민을 선택해주세요.'); return }
    setSubmitting(true)
    setError('')
    try {
      await consultationApi.create({
        ...form,
        hospitalId: form.hospitalId || null,
        method: form.method || null,
        durationHours: form.durationHours ? Number(form.durationHours) : null,
        fee: form.fee ? Number(form.fee) : null,
        nextAppointmentDate: form.nextAppointmentDate || null,
      })
      router.push('/consultations')
    } catch (e) {
      setError(e instanceof Error ? e.message : '보고서 저장에 실패했습니다.')
      setSubmitting(false)
    }
  }

  return (
    <AppShell>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => router.back()} className="text-gray-400">←</button>
        <h1 className="text-lg font-bold">병원 방문 보고서 작성</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-600">기본 정보</h2>
          <div>
            <label className="label">방문 날짜 *</label>
            <input
              type="date"
              className="input"
              value={form.consultationDate}
              onChange={e => set('consultationDate', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">이주민 *</label>
            <select
              className="input"
              value={form.patientId}
              onChange={e => set('patientId', e.target.value)}
              required
            >
              <option value="">선택해주세요</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {selectedPatient && (
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs text-gray-600">
              <p className="font-medium text-gray-700 mb-1">{selectedPatient.name}</p>
              <p>
                {NATIONALITY_LABEL[selectedPatient.nationality]} · {GENDER_LABEL[selectedPatient.gender]} · {VISA_LABEL[selectedPatient.visaType]}
              </p>
              <p>
                {[selectedPatient.birthDate, selectedPatient.region, selectedPatient.phone]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
          )}

          <div>
            <label className="label">진료 병원</label>
            <select
              className="input"
              value={form.hospitalId}
              onChange={e => set('hospitalId', e.target.value)}
            >
              <option value="">선택</option>
              {hospitals.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">진료과</label>
              <input
                className="input"
                value={form.department}
                onChange={e => set('department', e.target.value)}
                placeholder="내과, 정형외과"
              />
            </div>
            <div>
              <label className="label">의사선생님</label>
              <input
                className="input"
                value={form.doctorName}
                onChange={e => set('doctorName', e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-600">이주민 열람용 병원 방문 보고서</h2>
          <div>
            <label className="label">진단명/질병코드</label>
            <input
              className="input"
              value={form.diagnosisNameCode}
              onChange={e => set('diagnosisNameCode', e.target.value)}
              placeholder="예: 감기(J00)"
            />
          </div>
          <FieldTextArea
            label="받은 진단 내용"
            value={form.diagnosisContent}
            onChange={v => set('diagnosisContent', v)}
          />
          <FieldTextArea
            label="이주민의 진료 결과"
            value={form.treatmentResult}
            onChange={v => set('treatmentResult', v)}
          />
          <FieldTextArea
            label="처방받은 약 복용"
            value={form.medicationInstruction}
            onChange={v => set('medicationInstruction', v)}
            placeholder="예: 식후 3회, 5일간 복용"
          />
          <div>
            <label className="label">다음 진료 일정</label>
            <input
              type="date"
              className="input"
              value={form.nextAppointmentDate}
              onChange={e => set('nextAppointmentDate', e.target.value)}
            />
          </div>
          <FieldTextArea
            label="통번역가가 이주민에게 남기는 코멘트"
            value={form.patientComment}
            onChange={v => set('patientComment', v)}
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-600">센터/통번역가용 근무 일지</h2>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">병명/문제 유형</label>
              <select
                className="input"
                value={form.issueType}
                onChange={e => set('issueType', e.target.value)}
              >
                {Object.entries(ISSUE_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">통역 방법</label>
              <select
                className="input"
                value={form.method}
                onChange={e => set('method', e.target.value)}
              >
                <option value="">선택</option>
                {Object.entries(METHOD_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">처리 구분</label>
              <select
                className="input"
                value={form.processing}
                onChange={e => set('processing', e.target.value)}
              >
                {Object.entries(processingLabel).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">상담자</label>
              <input
                className="input"
                value={form.counselorName}
                onChange={e => set('counselorName', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">통역 일한 시간</label>
              <input
                type="number"
                step="0.5"
                className="input"
                value={form.durationHours}
                onChange={e => set('durationHours', e.target.value)}
                placeholder="예: 1.5"
              />
            </div>
            <div>
              <label className="label">통역비</label>
              <input
                type="number"
                className="input"
                value={form.fee}
                onChange={e => set('fee', e.target.value)}
                placeholder="예: 50000"
              />
            </div>
          </div>
          <FieldTextArea
            label="일한 내역"
            value={form.workDescription}
            onChange={v => set('workDescription', v)}
          />
          <FieldTextArea
            label="메모"
            value={form.memo}
            onChange={v => set('memo', v)}
          />
          <FieldTextArea
            label="담당의 확인 싸인란"
            value={form.doctorConfirmationSignature}
            onChange={v => set('doctorConfirmationSignature', v)}
            placeholder="서명 전이면 비워두세요"
          />
        </section>

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? '저장 중...' : '두 보고서로 저장'}
        </button>
      </form>
    </AppShell>
  )
}

function FieldTextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <textarea
        className="input min-h-24 resize-none"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}
