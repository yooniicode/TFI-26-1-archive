'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { authApi, patientApi, interpreterApi } from '@/lib/api'
import { createClient } from '@/lib/supabase'
import type { AuthMe, Patient, Interpreter, VisaType, InterpreterRole } from '@/lib/types'
import { VISA_LABEL } from '@/lib/types'
import Spinner from '@/components/ui/Spinner'

export default function MyPage() {
  const router = useRouter()
  const [me, setMe] = useState<AuthMe | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // PATIENT 수정 필드
  const [phone, setPhone] = useState('')
  const [region, setRegion] = useState('')
  const [workplaceName, setWorkplaceName] = useState('')
  const [visaType, setVisaType] = useState<VisaType>('OTHER')
  const [visaNote, setVisaNote] = useState('')

  // INTERPRETER 수정 필드
  const [intPhone, setIntPhone] = useState('')
  const [intRole, setIntRole] = useState<InterpreterRole>('FREELANCER')

  useEffect(() => {
    authApi.me().then(async r => {
      const meData = r.payload
      setMe(meData)
      if (meData.role === 'patient' && meData.entityId) {
        const res = await patientApi.get(meData.entityId)
        const p = res.payload as Patient
        setPhone(p.phone ?? '')
        setRegion(p.region ?? '')
        setWorkplaceName(p.workplaceName ?? '')
        setVisaType(p.visaType)
        setVisaNote(p.visaNote ?? '')
      }
      if (meData.role === 'interpreter' && meData.entityId) {
        const res = await interpreterApi.get(meData.entityId)
        const i = res.payload as Interpreter
        setIntPhone(i.phone ?? '')
        setIntRole(i.role)
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!me?.entityId) return
    setSaving(true); setError(''); setSuccess(false)
    try {
      if (me.role === 'patient') {
        await patientApi.update(me.entityId, { phone, region, workplaceName, visaType, visaNote })
      } else if (me.role === 'interpreter') {
        await interpreterApi.update(me.entityId, { phone: intPhone, role: intRole })
      }
      setSuccess(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    await createClient().auth.signOut()
    router.push('/login')
  }

  if (loading) return <AppShell><Spinner /></AppShell>

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold">마이페이지</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {me?.role === 'interpreter' ? '통번역가' : '이주민'} · {me?.name}
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {me?.role === 'patient' && (
            <>
              <div>
                <label className="label">연락처</label>
                <input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="010-0000-0000" />
              </div>
              <div>
                <label className="label">거주 지역</label>
                <input className="input" value={region} onChange={e => setRegion(e.target.value)} placeholder="예: 경기 안산시" />
              </div>
              <div>
                <label className="label">사업장명</label>
                <input className="input" value={workplaceName} onChange={e => setWorkplaceName(e.target.value)} placeholder="사업장 이름" />
              </div>
              <div>
                <label className="label">비자 종류</label>
                <select className="input" value={visaType} onChange={e => setVisaType(e.target.value as VisaType)}>
                  {(Object.entries(VISA_LABEL) as [VisaType, string][]).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">비자 비고</label>
                <input className="input" value={visaNote} onChange={e => setVisaNote(e.target.value)} placeholder="추가 비자 정보" />
              </div>
            </>
          )}

          {me?.role === 'interpreter' && (
            <>
              <div>
                <label className="label">연락처</label>
                <input className="input" value={intPhone} onChange={e => setIntPhone(e.target.value)} placeholder="010-0000-0000" />
              </div>
              <div>
                <label className="label">통번역가 구분</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: 'ACTIVIST', label: '통번역활동가' },
                    { value: 'FREELANCER', label: '프리랜서' },
                    { value: 'STAFF', label: '센터직원' },
                  ] as const).map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setIntRole(value)}
                      className={`rounded-lg border-2 py-2 text-sm font-medium transition-colors ${
                        intRole === value
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {error && <p className="text-red-500 text-xs">{error}</p>}
          {success && <p className="text-green-600 text-xs">저장되었습니다.</p>}

          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? '저장 중...' : '저장'}
          </button>
        </form>

        <div className="border-t pt-4">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-sm text-red-500 hover:text-red-600 py-2"
          >
            로그아웃
          </button>
        </div>
      </div>
    </AppShell>
  )
}
