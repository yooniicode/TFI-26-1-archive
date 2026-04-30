'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { matchApi, patientApi, interpreterApi } from '@/lib/api'
import type { PatientMatch, Patient, Interpreter } from '@/lib/types'
import { useTranslation } from '@/lib/i18n/I18nContext'

export default function MatchingPage() {
  const { t } = useTranslation()
  const [matches, setMatches] = useState<PatientMatch[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [interpreters, setInterpreters] = useState<Interpreter[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ patientId: '', interpreterId: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function load() {
    return Promise.all([
      matchApi.list(),
      patientApi.list(),
      interpreterApi.list(),
    ]).then(([mRes, pRes, iRes]) => {
      setMatches(mRes.payload ?? [])
      setPatients(pRes.payload ?? [])
      setInterpreters((iRes.payload ?? []).filter(i => i.active))
    })
  }

  useEffect(() => { load().finally(() => setLoading(false)) }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true); setError('')
    try {
      await matchApi.create(form)
      setForm({ patientId: '', interpreterId: '' })
      await load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRemove(id: string) {
    if (!confirm(t.matching.confirm_remove)) return
    await matchApi.remove(id)
    await load()
  }

  function interpreterOptionLabel(interpreter: Interpreter) {
    const detail = [interpreter.languages.join(', '), interpreter.availabilityNote].filter(Boolean).join(' · ')
    return detail ? `${interpreter.name} (${detail})` : interpreter.name
  }

  if (loading) return <AppShell><Spinner /></AppShell>

  return (
    <AppShell>
      <h1 className="text-lg font-bold mb-4">{t.matching.title}</h1>

      <form onSubmit={handleCreate} className="card mb-4 space-y-3">
        <h2 className="font-semibold text-sm">{t.matching.form_title}</h2>
        <div>
          <label className="label">{t.matching.patient_label}</label>
          <select className="input" value={form.patientId}
            onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))} required>
            <option value="">{t.common.select}</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">{t.matching.interpreter_label}</label>
          <select className="input" value={form.interpreterId}
            onChange={e => setForm(f => ({ ...f, interpreterId: e.target.value }))} required>
            <option value="">{t.common.select}</option>
            {interpreters.map(i => (
              <option key={i.id} value={i.id}>{interpreterOptionLabel(i)}</option>
            ))}
          </select>
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? t.matching.processing : t.matching.create_btn}
        </button>
      </form>

      <h2 className="font-semibold text-sm mb-2">{t.matching.active_matches} ({matches.length})</h2>
      {matches.length === 0 ? (
        <EmptyState message={t.matching.empty} />
      ) : (
        <div className="space-y-2">
          {matches.map(m => (
            <div key={m.id} className="card flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{m.patientName}</p>
                <p className="text-xs text-gray-400">→ {m.interpreterName}</p>
              </div>
              <button onClick={() => handleRemove(m.id)}
                className="text-xs text-red-400 hover:text-red-600">
                {t.matching.remove_btn}
              </button>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  )
}
