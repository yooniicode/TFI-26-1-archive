'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import { consultationApi, authApi } from '@/lib/api'
import type { AuthMe, Consultation, PatientReport } from '@/lib/types'
import { GENDER_LABEL, ISSUE_LABEL, METHOD_LABEL, NATIONALITY_LABEL, VISA_LABEL } from '@/lib/types'

export default function ConsultationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<Consultation | null>(null)
  const [patientReport, setPatientReport] = useState<PatientReport | null>(null)
  const [me, setMe] = useState<AuthMe | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    authApi.me()
      .then(async meRes => {
        setMe(meRes.payload)
        if (meRes.payload.role === 'patient') {
          const cRes = await consultationApi.getPatientReport(id)
          setPatientReport(cRes.payload)
          return
        }
        const cRes = await consultationApi.get(id)
        setData(cRes.payload)
      })
      .finally(() => setLoading(false))
  }, [id])

  async function handleConfirm() {
    if (!me || !data) return
    const by = me.name ?? '관리자'
    setConfirming(true)
    try {
      const res = await consultationApi.confirm(id, { confirmedBy: by, confirmedByPhone: '' })
      setData(res.payload)
    } finally {
      setConfirming(false)
    }
  }

  if (loading) return <AppShell><Spinner /></AppShell>

  if (me?.role === 'patient') {
    if (!patientReport) return <AppShell><p className="text-center text-gray-400 py-10">보고서를 찾을 수 없습니다.</p></AppShell>
    return (
      <AppShell>
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => router.back()} className="text-gray-400">←</button>
          <h1 className="text-lg font-bold flex-1">병원 방문 보고서</h1>
        </div>
        <div className="card space-y-3">
          <ReportRow label="방문 날짜" value={patientReport.consultationDate} />
          <ReportRow label="진료 병원" value={patientReport.hospitalName} />
          <ReportRow label="진료과" value={patientReport.department} />
          <ReportRow label="의사선생님" value={patientReport.doctorName} />
          <ReportRow label="진단명" value={patientReport.diagnosisNameCode} />
          <ReportBlock label="받은 진단 내용" value={patientReport.diagnosisContent} />
          <ReportBlock label="진료 결과" value={patientReport.treatmentResult} />
          <ReportBlock label="처방받은 약 복용" value={patientReport.medicationInstruction} />
          <ReportRow label="다음 진료 일정" value={patientReport.nextAppointmentDate} />
          <ReportBlock label="통번역가 코멘트" value={patientReport.patientComment} />
        </div>
      </AppShell>
    )
  }

  if (!data) return <AppShell><p className="text-center text-gray-400 py-10">보고서를 찾을 수 없습니다.</p></AppShell>

  const patientRows: [string, string | undefined | null][] = [
    ['환자 성함', data.patientName],
    ['생년월일', data.patientBirthDate],
    ['국적', data.patientNationality ? NATIONALITY_LABEL[data.patientNationality] : null],
    ['성별', data.patientGender ? GENDER_LABEL[data.patientGender] : null],
    ['비자', data.patientVisaType ? VISA_LABEL[data.patientVisaType] : null],
    ['지역', data.patientRegion],
    ['전화번호', data.patientPhone],
  ]

  const workRows: [string, string | undefined | null][] = [
    ['방문 날짜', data.consultationDate],
    ['방문 병원', data.hospitalName],
    ['진료과', data.department],
    ['의사선생님', data.doctorName],
    ['병명/문제 유형', ISSUE_LABEL[data.issueType]],
    ['진단명/질병코드', data.diagnosisNameCode],
    ['통역 방법', data.method ? METHOD_LABEL[data.method] : null],
    ['상담자', data.counselorName],
    ['통역 일한 시간', data.durationHours ? `${data.durationHours}h` : null],
    ['통역비', data.fee ? `${data.fee.toLocaleString()}원` : null],
    ['다음 진료 일정', data.nextAppointmentDate],
    ['확인자', data.confirmedBy],
    ['확인일자', data.confirmedAt],
  ]

  return (
    <AppShell>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => router.back()} className="text-gray-400">←</button>
        <h1 className="text-lg font-bold flex-1">근무 일지 보고서</h1>
        {data.confirmed
          ? <Badge variant="green">확인완료</Badge>
          : <Badge variant="yellow">미확인</Badge>}
      </div>

      <section className="card space-y-3 mb-4">
        <h2 className="text-sm font-semibold text-gray-600">환자 정보</h2>
        {patientRows.filter(([, v]) => v).map(([label, value]) => (
          <ReportRow key={label} label={label} value={value} />
        ))}
      </section>

      <section className="card space-y-3 mb-4">
        <h2 className="text-sm font-semibold text-gray-600">근무 일지</h2>
        {workRows.filter(([, v]) => v).map(([label, value]) => (
          <ReportRow key={label} label={label} value={value} />
        ))}
        <ReportBlock label="받은 진단 내용" value={data.diagnosisContent} />
        <ReportBlock label="진료 결과" value={data.treatmentResult} />
        <ReportBlock label="처방받은 약 복용" value={data.medicationInstruction} />
        <ReportBlock label="이주민에게 남긴 코멘트" value={data.patientComment} />
        <ReportBlock label="일한 내역" value={data.workDescription} />
        <ReportBlock label="메모" value={data.memo} />
        <ReportBlock label="담당의 확인 싸인란" value={data.doctorConfirmationSignature} />
      </section>

      {me?.role === 'admin' && !data.confirmed && (
        <button onClick={handleConfirm} disabled={confirming} className="btn-primary w-full">
          {confirming ? '처리 중...' : '근무 일지 확인'}
        </button>
      )}
    </AppShell>
  )
}

function ReportRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex gap-2">
      <span className="text-xs text-gray-500 w-24 flex-shrink-0">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

function ReportBlock({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm whitespace-pre-wrap">{value}</p>
    </div>
  )
}
