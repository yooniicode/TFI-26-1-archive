'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import Spinner from '@/components/ui/Spinner'
import { scriptApi, patientApi, consultationApi } from '@/lib/api'
import type { MedicalScript, Patient, Consultation } from '@/lib/types'
import { SCRIPT_LABEL } from '@/lib/types'

export default function ScriptGeneratePage() {
  const { patientId } = useParams<{ patientId: string }>()
  const router = useRouter()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [scripts, setScripts] = useState<MedicalScript[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [form, setForm] = useState({
    scriptType: 'GENERAL',
    consultationId: '',
    additionalContext: '',
  })
  const [error, setError] = useState('')

  function loadScripts() {
    return scriptApi.byPatient(patientId).then(r => setScripts(r.payload ?? []))
  }

  useEffect(() => {
    Promise.all([
      patientApi.get(patientId),
      consultationApi.byPatient(patientId),
      loadScripts(),
    ]).then(([pRes, cRes]) => {
      setPatient(pRes.payload)
      setConsultations(cRes.payload ?? [])
    }).finally(() => setLoading(false))
  }, [patientId])

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setGenerating(true); setError('')
    try {
      await scriptApi.generate({
        patientId,
        consultationId: form.consultationId || null,
        scriptType: form.scriptType,
        additionalContext: form.additionalContext || null,
      })
      await loadScripts()
      setForm(f => ({ ...f, additionalContext: '' }))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  if (loading) return <AppShell><Spinner /></AppShell>

  return (
    <AppShell>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => router.back()} className="text-gray-400">←</button>
        <h1 className="text-lg font-bold">의료 대본</h1>
        {patient && <span className="text-sm text-gray-400">— {patient.name}</span>}
      </div>

      {/* 생성 폼 */}
      <form onSubmit={handleGenerate} className="card mb-4 space-y-3">
        <h2 className="font-semibold text-sm">새 대본 생성</h2>
        <div>
          <label className="label">대본 유형</label>
          <select className="input" value={form.scriptType}
            onChange={e => setForm(f => ({ ...f, scriptType: e.target.value }))}>
            <option value="GENERAL">일반 진료</option>
            <option value="EMERGENCY">응급 상황</option>
          </select>
        </div>
        <div>
          <label className="label">참조 상담 기록</label>
          <select className="input" value={form.consultationId}
            onChange={e => setForm(f => ({ ...f, consultationId: e.target.value }))}>
            <option value="">최근 기록 자동 참조</option>
            {consultations.map(c => (
              <option key={c.id} value={c.id}>
                {c.consultationDate} — {c.hospitalName ?? '병원 미입력'}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">추가 증상/상황</label>
          <textarea className="input resize-none min-h-[60px]"
            placeholder="오늘 특별히 전달할 내용 (예: 두통이 3일째 지속됨)"
            value={form.additionalContext}
            onChange={e => setForm(f => ({ ...f, additionalContext: e.target.value }))} />
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={generating}>
          {generating ? '🤖 생성 중...' : '✨ AI 대본 생성'}
        </button>
      </form>

      {/* 저장된 대본 목록 */}
      <h2 className="font-semibold text-sm mb-2">저장된 대본 ({scripts.length}개)</h2>
      {scripts.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">생성된 대본이 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {scripts.map(s => (
            <div key={s.id} className="card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-primary-600">
                  {SCRIPT_LABEL[s.scriptType]}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(s.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-700 line-clamp-3">{s.contentKo}</p>
              <Link href={`/scripts/${s.id}/present`}
                className="mt-2 block text-center text-xs text-primary-600 hover:underline">
                📱 화면 모드로 보기
              </Link>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  )
}
