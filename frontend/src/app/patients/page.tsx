'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import Badge from '@/components/ui/Badge'
import { patientApi } from '@/lib/api'
import { useMe } from '@/hooks/useMe'
import type { Gender, Nationality, Patient, VisaType } from '@/lib/types'
import { NATIONALITY_LABEL, GENDER_LABEL, VISA_LABEL } from '@/lib/types'

interface CreatePatientForm {
  name: string
  nationality: Nationality
  gender: Gender
  visaType: VisaType
  birthDate: string
  phone: string
  region: string
  workplaceName: string
  visaNote: string
}

const initialForm: CreatePatientForm = {
  name: '',
  nationality: 'OTHER',
  gender: 'OTHER',
  visaType: 'OTHER',
  birthDate: '',
  phone: '',
  region: '',
  workplaceName: '',
  visaNote: '',
}

const nationalities: Nationality[] = [
  'VIETNAM','CHINA','CAMBODIA','MYANMAR','PHILIPPINES','INDONESIA','THAILAND',
  'NEPAL','MONGOLIA','UZBEKISTAN','SRI_LANKA','BANGLADESH','PAKISTAN','OTHER',
]
const genders: Gender[] = ['MALE','FEMALE','OTHER']
const visas: VisaType[] = ['E9','E6','F1','F2','F4','F5','F6','H2','D2','U','OTHER']

export default function PatientsPage() {
  const { data: me } = useMe()
  const [items, setItems] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<CreatePatientForm>(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    patientApi.list(0, submittedQuery)
      .then(r => {
        if (!cancelled) setItems(r.payload ?? [])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [submittedQuery])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('이름을 입력해주세요.'); return }
    setSaving(true)
    setError('')
    try {
      await patientApi.create({
        name: form.name.trim(),
        nationality: form.nationality,
        gender: form.gender,
        visaType: form.visaType,
        birthDate: form.birthDate || undefined,
        phone: form.phone.trim() || undefined,
        region: form.region.trim() || undefined,
        workplaceName: form.workplaceName.trim() || undefined,
        visaNote: form.visaNote.trim() || undefined,
      })
      setForm(initialForm)
      setShowCreate(false)
      setSubmittedQuery(query.trim())
    } catch (e) {
      setError(e instanceof Error ? e.message : '이주민 등록에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold">이주민 목록</h1>
            {me?.role === 'interpreter' && (
              <p className="text-xs text-gray-500 mt-1">
                센터장이 매칭 승인한 이주민만 검색됩니다.
              </p>
            )}
          </div>
          {me?.role === 'admin' && (
            <button
              type="button"
              className="btn-primary text-sm shrink-0"
              onClick={() => setShowCreate(prev => !prev)}
            >
              이주민 등록
            </button>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            setSubmittedQuery(query.trim())
          }}
          className="flex gap-2"
        >
          <input
            className="input flex-1"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="이름, 연락처, 지역 검색"
          />
          <button type="submit" className="btn-secondary shrink-0">검색</button>
        </form>

        {showCreate && me?.role === 'admin' && (
          <form onSubmit={handleCreate} className="card space-y-3">
            <div>
              <label className="label">이름</label>
              <input
                className="input"
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">국적</label>
                <select
                  className="input"
                  value={form.nationality}
                  onChange={e => setForm(prev => ({ ...prev, nationality: e.target.value as Nationality }))}
                >
                  {nationalities.map(n => <option key={n} value={n}>{NATIONALITY_LABEL[n]}</option>)}
                </select>
              </div>
              <div>
                <label className="label">성별</label>
                <select
                  className="input"
                  value={form.gender}
                  onChange={e => setForm(prev => ({ ...prev, gender: e.target.value as Gender }))}
                >
                  {genders.map(g => <option key={g} value={g}>{GENDER_LABEL[g]}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">비자</label>
                <select
                  className="input"
                  value={form.visaType}
                  onChange={e => setForm(prev => ({ ...prev, visaType: e.target.value as VisaType }))}
                >
                  {visas.map(v => <option key={v} value={v}>{VISA_LABEL[v]}</option>)}
                </select>
              </div>
              <div>
                <label className="label">생년월일</label>
                <input
                  type="date"
                  className="input"
                  value={form.birthDate}
                  onChange={e => setForm(prev => ({ ...prev, birthDate: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="label">연락처</label>
              <input
                className="input"
                value={form.phone}
                onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="010-0000-0000"
              />
            </div>
            <div>
              <label className="label">지역</label>
              <input
                className="input"
                value={form.region}
                onChange={e => setForm(prev => ({ ...prev, region: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">사업장</label>
              <input
                className="input"
                value={form.workplaceName}
                onChange={e => setForm(prev => ({ ...prev, workplaceName: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">비자 메모</label>
              <textarea
                className="input min-h-20"
                value={form.visaNote}
                onChange={e => setForm(prev => ({ ...prev, visaNote: e.target.value }))}
              />
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>
                취소
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <Spinner />
        ) : items.length === 0 ? (
          <EmptyState
            message={
              me?.role === 'interpreter'
                ? '현재 매칭된 이주민이 없습니다.'
                : '등록된 이주민이 없습니다.'
            }
          />
        ) : (
          <div className="space-y-2">
            {items.map(p => (
              <Link
                key={p.id}
                href={`/patients/${p.id}`}
                className="card block hover:border-primary-200 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{p.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {NATIONALITY_LABEL[p.nationality]} · {GENDER_LABEL[p.gender]} · {VISA_LABEL[p.visaType]}
                    </p>
                    {p.region && <p className="text-xs text-gray-400">{p.region}</p>}
                  </div>
                  <Badge variant={p.accountLinked ? 'green' : 'yellow'}>
                    {p.accountLinked ? '계정 연결' : '계정 미연결'}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
