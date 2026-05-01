'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { patientApi, scriptApi, chatApi } from '@/lib/api'
import type { MedicalScript, PatientReport } from '@/lib/types'
import { useEnumLabels } from '@/lib/i18n/enumLabels'
import { useTranslation } from '@/lib/i18n/I18nContext'
import { useMe } from '@/hooks/useMe'

export default function MyRecordsPage() {
  const { t } = useTranslation()
  const labels = useEnumLabels()
  const router = useRouter()
  const { data: me, isLoading: meLoading } = useMe()
  const [records, setRecords] = useState<PatientReport[]>([])
  const [scripts, setScripts] = useState<MedicalScript[]>([])
  const [loading, setLoading] = useState(false)
  const [chatLoading, setChatLoading] = useState<string | null>(null)

  useEffect(() => {
    const patientId = me?.entityId
    if (!patientId) return
    setLoading(true)
    Promise.all([
      patientApi.myRecords(patientId),
      scriptApi.byPatient(patientId),
    ]).then(([rRes, sRes]) => {
      setRecords(rRes.payload ?? [])
      setScripts(sRes.payload ?? [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [me?.entityId])

  async function handleOpenChat(interpreterId: string) {
    setChatLoading(interpreterId)
    try {
      const res = await chatApi.roomWithInterpreter(interpreterId)
      if (res.payload) router.push(`/chat/${res.payload.id}`)
    } catch { /* ignore */ } finally {
      setChatLoading(null)
    }
  }

  if (meLoading || loading) return <AppShell><Spinner /></AppShell>

  return (
    <AppShell>
      <h1 className="text-lg font-bold mb-4">{t.my_records.title}</h1>

      <section className="mb-5">
        <h2 className="font-semibold text-sm text-gray-600 mb-2">{t.my_records.patient_records_section}</h2>
        {records.length === 0 ? (
          <EmptyState message={t.my_records.no_records} />
        ) : (
          <div className="space-y-2">
            {records.map(c => (
              <div key={c.id} className="card">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{c.consultationDate}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {c.hospitalName ?? t.my_records.no_hospital}
                      {c.department && ` · ${c.department}`}
                      {c.doctorName && ` · ${c.doctorName}`}
                    </p>
                  </div>
                  {c.interpreterId && (
                    <button
                      type="button"
                      className="shrink-0 text-xs font-semibold text-primary-600 border border-primary-200 rounded-lg px-2 py-1 hover:bg-primary-50"
                      disabled={chatLoading === c.interpreterId}
                      onClick={() => handleOpenChat(c.interpreterId!)}
                    >
                      {chatLoading === c.interpreterId ? '...' : t.chat.open_chat}
                    </button>
                  )}
                </div>
                {c.diagnosisNameCode && (
                  <p className="text-sm mt-3 font-medium">{t.my_records.diagnosis_label}: {c.diagnosisNameCode}</p>
                )}
                {c.diagnosisContent && (
                  <InfoBlock label={t.my_records.diagnosis_content} value={c.diagnosisContent} />
                )}
                {c.treatmentResult && (
                  <InfoBlock label={t.my_records.treatment_result} value={c.treatmentResult} />
                )}
                {c.medicationInstruction && (
                  <InfoBlock label={t.my_records.medication} value={c.medicationInstruction} />
                )}
                {c.nextAppointmentDate && (
                  <p className="text-xs text-primary-600 mt-3">
                    {t.my_records.next_appointment}: {c.nextAppointmentDate}
                  </p>
                )}
                {c.patientComment && (
                  <InfoBlock label={t.my_records.patient_comment} value={c.patientComment} />
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-semibold text-sm text-gray-600">{t.my_records.scripts_section}</h2>
          {me?.entityId && (
            <Link href={`/scripts/patient/${me.entityId}`} className="text-xs text-primary-600">
              {t.my_records.new_script}
            </Link>
          )}
        </div>
        {scripts.length === 0 ? (
          <EmptyState message={t.my_records.no_scripts} />
        ) : (
          <div className="space-y-2">
            {scripts.map(s => (
              <div key={s.id} className="card">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-primary-600 font-medium">
                    {labels.script[s.scriptType]}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(s.createdAt).toLocaleDateString(t.locale)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2">{s.contentKo}</p>
                <Link
                  href={`/scripts/${s.id}/present`}
                  className="mt-2 block text-center py-2 rounded-lg bg-primary-50 text-primary-700 text-sm font-medium"
                >
                  {t.my_records.show_doctor}
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-3">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm whitespace-pre-wrap">{value}</p>
    </div>
  )
}
