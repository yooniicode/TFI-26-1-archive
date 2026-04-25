'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { authApi } from '@/lib/api'
import type { Gender, InterpreterRole, Nationality, UserRole, VisaType } from '@/lib/types'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState('')
  const [role, setRole] = useState<Extract<UserRole, 'INTERPRETER' | 'PATIENT'>>('PATIENT')
  const [nationality, setNationality] = useState<Nationality>('OTHER')
  const [gender, setGender] = useState<Gender>('OTHER')
  const [visaType, setVisaType] = useState<VisaType>('OTHER')
  const [interpreterRole, setInterpreterRole] = useState<InterpreterRole>('FREELANCER')
  const [phone, setPhone] = useState('')
  const [isSignupMode, setIsSignupMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [magicSent, setMagicSent] = useState(false)
  const [signupDone, setSignupDone] = useState(false)

  async function ensureProfile() {
    const supabase = createClient()
    const { data } = await supabase.auth.getUser()
    const user = data.user
    if (!user) return

    const userRole = user.user_metadata?.app_role ?? user.user_metadata?.role ?? role
    const resolvedName = String(
      user.user_metadata?.name ??
      name ??
      user.email?.split('@')[0] ??
      '사용자',
    ).trim()
    await authApi.registerProfile({
      name: resolvedName,
      phone: phone || undefined,
      nationality: userRole === 'PATIENT' ? nationality : undefined,
      gender: userRole === 'PATIENT' ? gender : undefined,
      visaType: userRole === 'PATIENT' ? visaType : undefined,
      interpreterRole: userRole === 'INTERPRETER' ? interpreterRole : undefined,
    })
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    try {
      await ensureProfile()
    } catch (e) {
      setError(e instanceof Error ? e.message : '프로필 생성에 실패했습니다.')
      setLoading(false)
      return
    }
    router.push('/dashboard')
  }

  async function handleMagicLink() {
    if (!email) { setError('이메일을 입력해주세요.'); return }
    setLoading(true); setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) { setError(error.message); setLoading(false); return }
    setMagicSent(true); setLoading(false)
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('이름을 입력해주세요.'); return }
    if (!email) { setError('이메일을 입력해주세요.'); return }
    if (!signupPassword) { setError('비밀번호를 입력해주세요.'); return }
    if (signupPassword.length < 8) { setError('비밀번호는 8자 이상이어야 합니다.'); return }
    if (signupPassword !== signupPasswordConfirm) {
      setError('비밀번호 확인이 일치하지 않습니다.')
      return
    }

    setLoading(true); setError('')
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password: signupPassword,
      options: {
        data: {
          name: name.trim(),
          app_role: role,
          role,
          phone,
          nationality,
          gender,
          visa_type: visaType,
          interpreter_role: interpreterRole,
        },
      },
    })

    if (error) { setError(error.message); setLoading(false); return }

    if (data.session) {
      // Email confirmation disabled → 즉시 로그인됨
      try {
        await ensureProfile()
      } catch (e) {
        setError(e instanceof Error ? e.message : '프로필 생성에 실패했습니다.')
        setLoading(false)
        return
      }
      router.push('/dashboard')
    } else {
      setSignupDone(true)
      setLoading(false)
    }
  }

  if (magicSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="card max-w-sm w-full text-center py-10">
          <p className="text-4xl mb-4">📧</p>
          <h2 className="font-bold text-lg mb-2">이메일을 확인해주세요</h2>
          <p className="text-sm text-gray-500">
            {email} 로 로그인 링크를 보냈습니다.
          </p>
        </div>
      </div>
    )
  }

  if (signupDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="card max-w-sm w-full text-center py-10">
          <p className="text-4xl mb-4">✅</p>
          <h2 className="font-bold text-lg mb-2">회원가입이 완료되었습니다</h2>
          <p className="text-sm text-gray-500">
            {email} 로 인증 메일을 보냈습니다. 메일 인증 후 로그인해주세요.
          </p>
          <button
            type="button"
            className="btn-primary w-full mt-5"
            onClick={() => {
              setSignupDone(false)
              setIsSignupMode(false)
            }}
          >
            로그인 화면으로
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="card max-w-sm w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-primary-700">TFI</h1>
          <p className="text-sm text-gray-500 mt-1">통번역 지원 플랫폼</p>
        </div>

        {isSignupMode ? (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="label">이름</label>
              <input
                type="text"
                className="input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="이름"
                required
              />
            </div>
            <div>
              <label className="label">역할</label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'PATIENT', label: '이주민', desc: '의료·법률 통번역 지원이 필요해요' },
                  { value: 'INTERPRETER', label: '통번역가', desc: '통번역 활동가·프리랜서·센터직원' },
                ] as const).map(({ value, label, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRole(value)}
                    className={`rounded-lg border-2 p-3 text-left transition-colors ${
                      role === value
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className={`text-sm font-semibold ${role === value ? 'text-primary-700' : 'text-gray-700'}`}>
                      {label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">이메일</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="이메일 주소"
                required
              />
            </div>
            <div>
              <label className="label">연락처(선택)</label>
              <input
                type="text"
                className="input"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="010-0000-0000"
              />
            </div>
            {role === 'PATIENT' && (
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
                    <option value="MALE">남</option>
                    <option value="FEMALE">여</option>
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
            {role === 'INTERPRETER' && (
              <div>
                <label className="label">통번역가 구분</label>
                <select className="input" value={interpreterRole} onChange={e => setInterpreterRole(e.target.value as InterpreterRole)}>
                  <option value="ACTIVIST">통번역활동가</option>
                  <option value="FREELANCER">프리랜서</option>
                  <option value="STAFF">센터직원</option>
                </select>
              </div>
            )}
            <div>
              <label className="label">비밀번호</label>
              <input
                type="password"
                className="input"
                value={signupPassword}
                onChange={e => setSignupPassword(e.target.value)}
                placeholder="8자 이상"
                required
              />
            </div>
            <div>
              <label className="label">비밀번호 확인</label>
              <input
                type="password"
                className="input"
                value={signupPasswordConfirm}
                onChange={e => setSignupPasswordConfirm(e.target.value)}
                placeholder="비밀번호 재입력"
                required
              />
            </div>

            {error && <p className="text-red-500 text-xs">{error}</p>}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? '가입 중...' : '회원가입'}
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="label">이메일</label>
                <input
                  type="email"
                  className="input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="이메일 주소"
                  required
                />
              </div>
              <div>
                <label className="label">비밀번호</label>
                <input
                  type="password"
                  className="input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="비밀번호"
                />
              </div>

              {error && <p className="text-red-500 text-xs">{error}</p>}

              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? '로그인 중...' : '로그인'}
              </button>
            </form>

            <div className="mt-3 text-center">
              <button
                onClick={handleMagicLink}
                disabled={loading}
                className="text-sm text-primary-600 hover:underline"
              >
                이메일 링크로 로그인
              </button>
            </div>
          </>
        )}

        <div className="mt-4 text-center">
          <button
            type="button"
            disabled={loading}
            className="text-sm text-gray-600 hover:underline"
            onClick={() => {
              setError('')
              setIsSignupMode(prev => !prev)
            }}
          >
            {isSignupMode ? '이미 계정이 있어요 (로그인)' : '회원가입'}
          </button>
        </div>
      </div>
    </div>
  )
}
