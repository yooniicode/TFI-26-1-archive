'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import AppShell from '@/components/AppShell'
import { patientApi, interpreterApi } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { createClient } from '@/lib/supabase'
import { useMe } from '@/hooks/useMe'
import type { Patient, Interpreter, VisaType } from '@/lib/types'
import { VISA_LABEL } from '@/lib/types'
import Spinner from '@/components/ui/Spinner'

export default function MyPage() {
  const queryClient = useQueryClient()
  const { data: me, isLoading: meLoading } = useMe()

  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: queryKeys.patients.detail(me?.entityId ?? ''),
    queryFn: () => patientApi.get(me!.entityId!).then(r => r.payload as Patient),
    enabled: me?.role === 'patient' && !!me?.entityId,
  })

  const { data: interpreter, isLoading: interpreterLoading } = useQuery({
    queryKey: queryKeys.interpreters.detail(me?.entityId ?? ''),
    queryFn: () => interpreterApi.get(me!.entityId!).then(r => r.payload as Interpreter),
    enabled: me?.role === 'interpreter' && !!me?.entityId,
  })

  const [phone, setPhone] = useState('')
  const [region, setRegion] = useState('')
  const [workplaceName, setWorkplaceName] = useState('')
  const [visaType, setVisaType] = useState<VisaType>('OTHER')
  const [visaNote, setVisaNote] = useState('')
  const [intPhone, setIntPhone] = useState('')

  useEffect(() => {
    if (patient) {
      setPhone(patient.phone ?? '')
      setRegion(patient.region ?? '')
      setWorkplaceName(patient.workplaceName ?? '')
      setVisaType(patient.visaType)
      setVisaNote(patient.visaNote ?? '')
    }
  }, [patient])

  useEffect(() => {
    if (interpreter) setIntPhone(interpreter.phone ?? '')
  }, [interpreter])

  const { mutate: save, isPending: saving, isSuccess, error: saveError } = useMutation<unknown, Error>({
    mutationFn: () => {
      if (!me?.entityId) return Promise.reject(new Error('프로필 정보를 불러오지 못했습니다.'))
      if (me.role === 'patient') {
        return patientApi.update(me.entityId, { phone, region, workplaceName, visaType, visaNote })
      }
      return interpreterApi.update(me.entityId, { phone: intPhone })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.detail(me?.entityId ?? '') })
      queryClient.invalidateQueries({ queryKey: queryKeys.interpreters.detail(me?.entityId ?? '') })
    },
  })

  async function handleLogout() {
    await createClient().auth.signOut()
    window.location.href = '/login'
  }

  const loading = meLoading || patientLoading || interpreterLoading
  if (loading) return <AppShell><Spinner /></AppShell>
  if (!meLoading && me && me.role !== 'admin' && !me.entityId) {
    window.location.replace('/auth/complete')
    return null
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold">마이페이지</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {me?.role === 'admin' ? '센터 직원' : me?.role === 'interpreter' ? '통번역가' : '이주민'} · {me?.name}
          </p>
        </div>

        {me?.role !== 'admin' && (
          <form onSubmit={e => { e.preventDefault(); save() }} className="space-y-4">
            {me?.role === 'patient' && (
              <>
                <div>
                  <label className="label">연락처</label>
                  <input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="010-0000-0000" />
                </div>
                <div>
                  <label className="label">거주 지역</label>
                  <input className="input" value={region} onChange={e => setRegion(e.target.value)} />
                </div>
                <div>
                  <label className="label">사업장명</label>
                  <input className="input" value={workplaceName} onChange={e => setWorkplaceName(e.target.value)} />
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
                  <input className="input" value={visaNote} onChange={e => setVisaNote(e.target.value)} />
                </div>
              </>
            )}

            {me?.role === 'interpreter' && (
              <div>
                <label className="label">연락처</label>
                <input className="input" value={intPhone} onChange={e => setIntPhone(e.target.value)} placeholder="010-0000-0000" />
                <p className="text-xs text-gray-500 mt-2">통번역가 구분과 권한은 센터 직원이 회원 관리에서 변경합니다.</p>
              </div>
            )}

            {saveError && <p className="text-red-500 text-xs">{saveError.message}</p>}
            {isSuccess && <p className="text-green-600 text-xs">저장되었습니다.</p>}

            <button type="submit" className="btn-primary w-full" disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </button>
          </form>
        )}

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
