'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import AppShell from '@/components/AppShell'
import { adminApi, centerApi, patientApi, interpreterApi } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { createClient } from '@/lib/supabase'
import { useMe } from '@/hooks/useMe'
import type { AdminWorkLog, AdminWorkLogTask, Center, Patient, Interpreter, VisaType } from '@/lib/types'
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

  const { data: adminProfile, isLoading: adminProfileLoading } = useQuery({
    queryKey: queryKeys.adminProfile,
    queryFn: () => adminApi.profile().then(r => r.payload),
    enabled: me?.role === 'admin',
  })

  const { data: workLogs = [], isLoading: workLogsLoading } = useQuery({
    queryKey: queryKeys.adminWorkLogs(0),
    queryFn: () => adminApi.workLogs(0).then(r => r.payload ?? []),
    enabled: me?.role === 'admin',
  })

  const { data: centers = [], isLoading: centersLoading } = useQuery({
    queryKey: queryKeys.centers,
    queryFn: () => centerApi.list().then(r => r.payload ?? []),
    enabled: me?.role === 'admin',
  })

  const [phone, setPhone] = useState('')
  const [region, setRegion] = useState('')
  const [visaType, setVisaType] = useState<VisaType>('OTHER')
  const [visaNote, setVisaNote] = useState('')
  const [intPhone, setIntPhone] = useState('')
  const [centerId, setCenterId] = useState('')
  const [centerName, setCenterName] = useState('')
  const [centerAddress, setCenterAddress] = useState('')
  const [centerPhone, setCenterPhone] = useState('')
  const [nickname, setNickname] = useState('')
  const [workDate, setWorkDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [workMemo, setWorkMemo] = useState('')
  const [workTaskLines, setWorkTaskLines] = useState('')

  useEffect(() => {
    if (patient) {
      setPhone(patient.phone ?? '')
      setRegion(patient.region ?? '')
      setVisaType(patient.visaType)
      setVisaNote(patient.visaNote ?? '')
    }
  }, [patient])

  useEffect(() => {
    if (interpreter) setIntPhone(interpreter.phone ?? '')
  }, [interpreter])

  useEffect(() => {
    if (adminProfile) {
      setCenterId(adminProfile.centerId ?? '')
      setCenterName(adminProfile.centerName ?? '')
      setNickname(adminProfile.nickname ?? '')
    }
  }, [adminProfile])

  useEffect(() => {
    const selected = centers.find(center => center.id === centerId)
    if (!selected) return
    setCenterName(selected.name)
    setCenterAddress(selected.address ?? '')
    setCenterPhone(selected.phone ?? '')
  }, [centerId, centers])

  const { mutate: save, isPending: saving, isSuccess, error: saveError } = useMutation<unknown, Error>({
    mutationFn: () => {
      if (!me?.entityId) return Promise.reject(new Error('프로필 정보를 불러오지 못했습니다.'))
      if (me.role === 'patient') {
        return patientApi.update(me.entityId, { phone, region, visaType, visaNote })
      }
      return interpreterApi.update(me.entityId, { phone: intPhone })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.detail(me?.entityId ?? '') })
      queryClient.invalidateQueries({ queryKey: queryKeys.interpreters.detail(me?.entityId ?? '') })
    },
  })

  const { mutate: saveAdminProfile, isPending: savingAdminProfile, isSuccess: adminSaved, error: adminSaveError } =
    useMutation<unknown, Error>({
      mutationFn: () => adminApi.updateProfile({
        centerId: centerId || undefined,
        centerName: centerId ? undefined : centerName,
        nickname,
      }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.adminProfile })
        queryClient.invalidateQueries({ queryKey: queryKeys.me })
      },
    })

  const { mutate: saveCenterInfo, isPending: savingCenterInfo, error: centerSaveError } =
    useMutation<Center, Error>({
      mutationFn: () => {
        if (!centerName.trim()) return Promise.reject(new Error('센터 이름을 입력해주세요.'))
        const body = {
          name: centerName.trim(),
          address: centerAddress.trim() || undefined,
          phone: centerPhone.trim() || undefined,
          active: true,
        }
        return centerId
          ? centerApi.update(centerId, body).then(r => r.payload as Center)
          : centerApi.create(body).then(r => r.payload as Center)
      },
      onSuccess: (center) => {
        setCenterId(center.id)
        queryClient.invalidateQueries({ queryKey: queryKeys.centers })
      },
    })

  const { mutate: createWorkLog, isPending: creatingWorkLog, error: workLogError } = useMutation<unknown, Error>({
    mutationFn: () => adminApi.createWorkLog({
      workDate,
      memo: workMemo,
      tasks: workTaskLines
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .map(content => ({ content, checked: false })),
    }),
    onSuccess: () => {
      setWorkMemo('')
      setWorkTaskLines('')
      queryClient.invalidateQueries({ queryKey: queryKeys.adminWorkLogs(0) })
    },
  })

  const { mutate: updateWorkLog } = useMutation<unknown, Error, AdminWorkLog>({
    mutationFn: (log) => adminApi.updateWorkLog(log.id, {
      workDate: log.workDate,
      memo: log.memo ?? '',
      tasks: log.tasks,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.adminWorkLogs(0) }),
  })

  function toggleTask(log: AdminWorkLog, index: number) {
    const tasks: AdminWorkLogTask[] = log.tasks.map((task, idx) =>
      idx === index ? { ...task, checked: !task.checked } : task,
    )
    updateWorkLog({ ...log, tasks })
  }

  async function handleLogout() {
    await createClient().auth.signOut()
    window.location.href = '/login'
  }

  const loading = meLoading || patientLoading || interpreterLoading || adminProfileLoading || workLogsLoading || centersLoading
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

        {me?.role === 'admin' && (
          <div className="space-y-6">
            <form onSubmit={e => { e.preventDefault(); saveAdminProfile() }} className="space-y-4">
              <div>
                <label className="label">센터 이름(근무지)</label>
                <select className="input mb-2" value={centerId} onChange={e => setCenterId(e.target.value)}>
                  <option value="">새 센터 직접 입력</option>
                  {centers.map(center => (
                    <option key={center.id} value={center.id}>{center.name}</option>
                  ))}
                </select>
                <input className="input" value={centerName} onChange={e => setCenterName(e.target.value)} placeholder="예: 동행센터" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">센터 연락처</label>
                  <input className="input" value={centerPhone} onChange={e => setCenterPhone(e.target.value)} placeholder="센터 전화번호" />
                </div>
                <div>
                  <label className="label">센터 주소</label>
                  <input className="input" value={centerAddress} onChange={e => setCenterAddress(e.target.value)} placeholder="센터 주소" />
                </div>
              </div>
              <div>
                <label className="label">닉네임</label>
                <input className="input" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="화면에 표시할 이름" />
              </div>
              {adminSaveError && <p className="text-red-500 text-xs">{adminSaveError.message}</p>}
              {centerSaveError && <p className="text-red-500 text-xs">{centerSaveError.message}</p>}
              {adminSaved && <p className="text-green-600 text-xs">관리자 정보가 저장되었습니다.</p>}
              <button type="button" className="btn-secondary w-full" disabled={savingCenterInfo} onClick={() => saveCenterInfo()}>
                {savingCenterInfo ? '저장 중...' : centerId ? '센터 정보 수정' : '센터 생성'}
              </button>
              <button type="submit" className="btn-primary w-full" disabled={savingAdminProfile}>
                {savingAdminProfile ? '저장 중...' : '내 근무 센터/닉네임 저장'}
              </button>
            </form>

            <section className="border-t pt-5 space-y-4">
              <div>
                <h2 className="font-semibold">센터장 근무일지</h2>
                <p className="text-xs text-gray-500 mt-1">날짜별 업무 내용을 체크리스트로 정리합니다.</p>
              </div>

              <form onSubmit={e => { e.preventDefault(); createWorkLog() }} className="space-y-3">
                <div>
                  <label className="label">날짜</label>
                  <input type="date" className="input" value={workDate} onChange={e => setWorkDate(e.target.value)} required />
                </div>
                <div>
                  <label className="label">업무 메모</label>
                  <textarea className="input min-h-20" value={workMemo} onChange={e => setWorkMemo(e.target.value)} placeholder="오늘 처리한 주요 업무" />
                </div>
                <div>
                  <label className="label">체크리스트</label>
                  <textarea
                    className="input min-h-24"
                    value={workTaskLines}
                    onChange={e => setWorkTaskLines(e.target.value)}
                    placeholder={'한 줄에 하나씩 입력\n예: 신규 이주민 상담\n예: 병원 동행 일정 조율'}
                  />
                </div>
                {workLogError && <p className="text-red-500 text-xs">{workLogError.message}</p>}
                <button type="submit" className="btn-secondary w-full" disabled={creatingWorkLog}>
                  {creatingWorkLog ? '저장 중...' : '근무일지 저장'}
                </button>
              </form>

              <div className="space-y-2">
                {workLogs.length === 0 && <p className="text-sm text-gray-400 text-center py-4">작성된 근무일지가 없습니다.</p>}
                {workLogs.map(log => (
                  <div key={log.id} className="card space-y-2">
                    <div>
                      <p className="text-sm font-semibold">{log.workDate}</p>
                      {log.memo && <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{log.memo}</p>}
                    </div>
                    {log.tasks.length > 0 && (
                      <div className="space-y-1">
                        {log.tasks.map((task, idx) => (
                          <label key={`${log.id}-${idx}`} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={task.checked}
                              onChange={() => toggleTask(log, idx)}
                            />
                            <span className={task.checked ? 'line-through text-gray-400' : ''}>{task.content}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

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
