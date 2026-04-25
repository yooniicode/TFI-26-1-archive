'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { authApi, handoverApi, interpreterApi, patientApi } from '@/lib/api'
import type { AuthMe, Handover, Patient, Interpreter } from '@/lib/types'

export default function HandoversPage() {
  const router = useRouter()
  const [me, setMe] = useState<AuthMe | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [interpreters, setInterpreters] = useState<Interpreter[]>([])
  const [loading, setLoading] = useState(true)

  // 인수인계 요청 폼
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ patientId: '', reason: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    Promise.all([authApi.me(), patientApi.list()])
      .then(([meRes, pRes]) => {
        setMe(meRes.payload)
        setPatients(pRes.payload ?? [])
        if (meRes.payload.role === 'admin') {
          return interpreterApi.list().then(r => setInterpreters(r.payload ?? []))
        }
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await handoverApi.create(form)
      setSuccess(true); setShowForm(false)
    } finally { setSubmitting(false) }
  }

  if (loading) return <AppShell><Spinner /></AppShell>

  return (
    <AppShell>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-lg font-bold">인수인계</h1>
        {me?.role === 'interpreter' && (
          <button onClick={() => setShowForm(v => !v)} className="btn-primary text-sm py-1.5 px-3">
            + 요청
          </button>
        )}
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-sm text-green-700">
          인수인계 요청이 접수되었습니다. 센터장이 배정 후 연락드립니다.
        </div>
      )}

      {/* 요청 폼 */}
      {showForm && me?.role === 'interpreter' && (
        <form onSubmit={handleCreate} className="card mb-4 space-y-3">
          <h2 className="font-semibold text-sm">인수인계 요청</h2>
          <div>
            <label className="label">이주민 *</label>
            <select className="input" value={form.patientId}
              onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))} required>
              <option value="">선택</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">인수인계 사유 *</label>
            <textarea className="input resize-none min-h-[80px]"
              value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} required />
          </div>
          <div>
            <label className="label">메모</label>
            <textarea className="input resize-none min-h-[60px]" placeholder="인계할 특이사항 등"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? '제출 중...' : '인수인계 요청'}
          </button>
        </form>
      )}

      <div className="text-center py-12 text-gray-400">
        <p className="text-4xl mb-2">🔄</p>
        <p className="text-sm">이주민 상세 페이지에서<br/>인수인계 이력을 확인할 수 있습니다.</p>
        <button onClick={() => router.push('/patients')} className="mt-4 btn-secondary text-sm">
          이주민 목록 보기
        </button>
      </div>
    </AppShell>
  )
}
