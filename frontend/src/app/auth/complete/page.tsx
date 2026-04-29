'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api'
import { getRequestedMemberRole, type RequestedMemberRole } from '@/lib/authMetadata'
import { createClient } from '@/lib/supabase'
import type { Gender, Nationality, UserRole, VisaType } from '@/lib/types'

const requestedRoleLabel = (request: RequestedMemberRole) => {
  if (request.role === 'admin') return '센터 직원'
  if (request.interpreterRole === 'FREELANCER') return '프리랜서'
  if (request.interpreterRole === 'STAFF') return '센터 직원'
  return '통번역가'
}

export default function AuthCompletePage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [needsProfile, setNeedsProfile] = useState(false)
  const [pendingRequest, setPendingRequest] = useState<RequestedMemberRole | null>(null)
  const [isOtpUser, setIsOtpUser] = useState(false)
  const [role, setRole] = useState<Extract<UserRole, 'interpreter' | 'patient'>>('patient')

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [nationality, setNationality] = useState<Nationality>('OTHER')
  const [gender, setGender] = useState<Gender>('OTHER')
  const [visaType, setVisaType] = useState<VisaType>('OTHER')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [bootstrapCode, setBootstrapCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.access_token) {
        router.replace('/login')
        setChecking(false)
        return
      }

      const metadata = session.user.user_metadata ?? {}
      const requestedMemberRole = getRequestedMemberRole(metadata)
      if (typeof metadata.name === 'string') setName(metadata.name)
      if (typeof metadata.phone === 'string') setPhone(metadata.phone)

      try {
        const b64 = session.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
        const payload = JSON.parse(atob(b64))
        setIsOtpUser(payload.amr?.some((a: { method: string }) => a.method === 'otp') ?? false)
      } catch { /* ignore decode errors */ }

      authApi.me()
        .then((res) => {
          if (res.payload.role === 'admin') {
            router.replace('/dashboard')
            return
          }
          if (res.payload.role === 'interpreter') setRole('interpreter')
          if (res.payload.role === 'patient' && requestedMemberRole) {
            setPendingRequest(requestedMemberRole)
            setNeedsProfile(false)
            return
          }
          if (res.payload?.entityId) {
            router.replace('/dashboard')
          } else {
            setNeedsProfile(true)
          }
        })
        .catch(async () => {
          await supabase.auth.signOut()
          router.replace('/login')
        })
        .finally(() => setChecking(false))
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('이름을 입력해주세요.'); return }
    if (role === 'patient' && !phone.trim()) { setError('연락처를 입력해주세요.'); return }
    if (isOtpUser && newPassword) {
      if (newPassword.length < 8) { setError('비밀번호는 8자 이상이어야 합니다.'); return }
      if (newPassword !== newPasswordConfirm) { setError('비밀번호가 일치하지 않습니다.'); return }
    }
    setLoading(true)
    setError('')
    try {
      await authApi.registerProfile({
        name: name.trim(),
        role,
        phone: phone.trim() || undefined,
        nationality: role === 'patient' ? nationality : undefined,
        gender: role === 'patient' ? gender : undefined,
        visaType: role === 'patient' ? visaType : undefined,
        interpreterRole: role === 'interpreter' ? 'FREELANCER' : undefined,
      })
      if (isOtpUser && newPassword) {
        await createClient().auth.updateUser({ password: newPassword })
      }
      await createClient().auth.refreshSession()
      router.replace('/dashboard')
    } catch (e) {
      setError(e instanceof Error ? e.message : '프로필 저장에 실패했습니다.')
      setLoading(false)
    }
  }

  async function handleBootstrapAdmin() {
    setLoading(true)
    setError('')
    try {
      if (!bootstrapCode.trim()) {
        setError('관리자 초기 가입 코드를 입력해주세요.')
        setLoading(false)
        return
      }
      await authApi.bootstrapAdmin(bootstrapCode.trim())
      await createClient().auth.refreshSession()
      router.replace('/dashboard')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : '최초 센터 직원 계정 생성에 실패했습니다.')
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">잠시만요...</p>
      </div>
    )
  }

  if (pendingRequest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="card max-w-sm w-full text-center py-8">
          <h1 className="text-xl font-bold text-primary-700">승인 대기 중</h1>
          <p className="text-sm text-gray-500 mt-3">
            {requestedRoleLabel(pendingRequest)} 계정으로 가입 요청이 접수되었습니다.
            센터 직원이 회원 관리에서 권한을 승인하면 이용할 수 있습니다.
          </p>
          <div className="mt-6 space-y-2">
            {pendingRequest.role === 'admin' && (
              <>
                <input
                  className="input text-left"
                  type="password"
                  value={bootstrapCode}
                  onChange={e => setBootstrapCode(e.target.value)}
                  placeholder="관리자 초기 가입 코드"
                />
                <button
                  type="button"
                  className="btn-primary w-full"
                  disabled={loading}
                  onClick={handleBootstrapAdmin}
                >
                  {loading ? '확인 중...' : '최초 센터 직원 계정 만들기'}
                </button>
              </>
            )}
            <button
              type="button"
              className={pendingRequest.role === 'admin' ? 'btn-secondary w-full' : 'btn-primary w-full'}
              disabled={loading}
              onClick={async () => {
                await createClient().auth.refreshSession()
                window.location.reload()
              }}
            >
              승인 상태 다시 확인
            </button>
            <button
              type="button"
              className="btn-secondary w-full"
              onClick={async () => {
                await createClient().auth.signOut()
                router.replace('/login')
              }}
            >
              로그아웃
            </button>
          </div>
          {error && <p className="text-xs text-red-500 mt-4">{error}</p>}
        </div>
      </div>
    )
  }

  if (!needsProfile) return null

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="card max-w-sm w-full">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-primary-700">프로필 설정</h1>
          <p className="text-sm text-gray-500 mt-1">
            {role === 'interpreter' ? '통번역가 기본 정보를 입력해주세요.' : '이주민 기본 정보를 입력해주세요.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">이름</label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">연락처</label>
            <input
              type="text"
              className="input"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="010-0000-0000"
            />
          </div>

          {role === 'patient' && (
            <>
              <div>
                <label className="label">국적</label>
                <select className="input" value={nationality} onChange={e => setNationality(e.target.value as Nationality)}>
                  <option value="VIETNAM">베트남</option>
                  <option value="CHINA">중국</option>
                  <option value="CAMBODIA">캄보디아</option>
                  <option value="MYANMAR">미얀마</option>
                  <option value="PHILIPPINES">필리핀</option>
                  <option value="INDONESIA">인도네시아</option>
                  <option value="THAILAND">태국</option>
                  <option value="NEPAL">네팔</option>
                  <option value="MONGOLIA">몽골</option>
                  <option value="UZBEKISTAN">우즈베키스탄</option>
                  <option value="SRI_LANKA">스리랑카</option>
                  <option value="BANGLADESH">방글라데시</option>
                  <option value="PAKISTAN">파키스탄</option>
                  <option value="OTHER">기타</option>
                </select>
              </div>
              <div>
                <label className="label">성별</label>
                <select className="input" value={gender} onChange={e => setGender(e.target.value as Gender)}>
                  <option value="MALE">남성</option>
                  <option value="FEMALE">여성</option>
                  <option value="OTHER">기타</option>
                </select>
              </div>
              <div>
                <label className="label">비자</label>
                <select className="input" value={visaType} onChange={e => setVisaType(e.target.value as VisaType)}>
                  <option value="E9">E-9</option>
                  <option value="E6">E-6</option>
                  <option value="F1">F-1</option>
                  <option value="F2">F-2</option>
                  <option value="F4">F-4</option>
                  <option value="F5">F-5</option>
                  <option value="F6">F-6</option>
                  <option value="H2">H-2</option>
                  <option value="D2">D-2</option>
                  <option value="U">미등록</option>
                  <option value="OTHER">기타</option>
                </select>
              </div>
            </>
          )}

          {isOtpUser && (
            <div className="border-t pt-4 space-y-3">
              <p className="text-xs text-gray-500">비밀번호를 설정하면 이메일/비밀번호로도 로그인할 수 있습니다. 선택 사항입니다.</p>
              <div>
                <label className="label">비밀번호</label>
                <input
                  type="password"
                  className="input"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="8자 이상"
                />
              </div>
              {newPassword && (
                <div>
                  <label className="label">비밀번호 확인</label>
                  <input
                    type="password"
                    className="input"
                    value={newPasswordConfirm}
                    onChange={e => setNewPasswordConfirm(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? '저장 중...' : '시작하기'}
          </button>
        </form>
      </div>
    </div>
  )
}
