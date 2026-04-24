'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { consultationApi, patientApi, hospitalApi } from '@/lib/api'
import type { Patient, Hospital } from '@/lib/types'
import { ISSUE_LABEL, METHOD_LABEL } from '@/lib/types'

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
    issueType: 'MEDICAL',
    method: '',
    processing: '',
    memo: '',
    durationHours: '',
    fee: '',
    nextAppointmentDate: '',
  })

  useEffect(() => {
    Promise.all([patientApi.list(), hospitalApi.search()])
      .then(([p, h]) => {
        setPatients(p.payload ?? [])
        setHospitals(h.payload ?? [])
      })
  }, [])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.patientId) { setError('이주민을 선택해주세요.'); return }
    setSubmitting(true); setError('')
    try {
      const body = {
        ...form,
        hospitalId: form.hospitalId || null,
        durationHours: form.durationHours ? Number(form.durationHours) : null,
        fee: form.fee ? Number(form.fee) : null,
        nextAppointmentDate: form.nextAppointmentDate || null,
        method: form.method || null,
        processing: form.processing || null,
      }
      await consultationApi.create(body)
      router.push('/consultations')
    } catch (e: any) {
      setError(e.message)
      setSubmitting(false)
    }
  }

  return (
    <AppShell>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => router.back()} className="text-gray-400">←</button>
        <h1 className="text-lg font-bold">보고서 작성</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">상담일자 *</label>
          <input type="date" className="input" value={form.consultationDate}
            onChange={e => set('consultationDate', e.target.value)} required />
        </div>

        <div>
          <label className="label">내담자 (이주민) *</label>
          <select className="input" value={form.patientId}
            onChange={e => set('patientId', e.target.value)} required>
            <option value="">선택하세요</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">문제 유형 *</label>
          <select className="input" value={form.issueType}
            onChange={e => set('issueType', e.target.value)}>
            {Object.entries(ISSUE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">방법</label>
          <select className="input" value={form.method}
            onChange={e => set('method', e.target.value)}>
            <option value="">선택</option>
            {Object.entries(METHOD_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">병원</label>
          <select className="input" value={form.hospitalId}
            onChange={e => set('hospitalId', e.target.value)}>
            <option value="">선택 (없으면 비워두기)</option>
            {hospitals.map(h => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">진료과</label>
          <input type="text" className="input" placeholder="내분비내과, 산부인과 등"
            value={form.department} onChange={e => set('department', e.target.value)} />
        </div>

        <div>
          <label className="label">상담내용 메모 (Rm)</label>
          <textarea className="input min-h-[100px] resize-none" placeholder="증상, 진료 결과, 처방, 후속 조치 등"
            value={form.memo} onChange={e => set('memo', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">통역시간 (h)</label>
            <input type="number" step="0.5" className="input" placeholder="예: 1.5"
              value={form.durationHours} onChange={e => set('durationHours', e.target.value)} />
          </div>
          <div>
            <label className="label">통역비 (원)</label>
            <input type="number" className="input" placeholder="예: 50000"
              value={form.fee} onChange={e => set('fee', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">다음 예약일정</label>
          <input type="date" className="input" value={form.nextAppointmentDate}
            onChange={e => set('nextAppointmentDate', e.target.value)} />
        </div>

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? '저장 중...' : '보고서 저장'}
        </button>
      </form>
    </AppShell>
  )
}
