'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import AppShell from '@/components/AppShell'
import EmptyState from '@/components/ui/EmptyState'
import Spinner from '@/components/ui/Spinner'
import { centerApi } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import type { Center } from '@/lib/types'

export default function CentersPage() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<Center | null>(null)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')

  const { data: centers = [], isLoading } = useQuery({
    queryKey: queryKeys.centers,
    queryFn: () => centerApi.list().then(r => r.payload ?? []),
  })

  useEffect(() => {
    if (!editing) return
    setName(editing.name)
    setAddress(editing.address ?? '')
    setPhone(editing.phone ?? '')
  }, [editing])

  const { mutate: saveCenter, isPending, error } = useMutation({
    mutationFn: () => {
      const body = {
        name: name.trim(),
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        active: true,
      }
      if (!body.name) return Promise.reject(new Error('센터 이름을 입력해주세요.'))
      return editing
        ? centerApi.update(editing.id, body)
        : centerApi.create(body)
    },
    onSuccess: () => {
      setEditing(null)
      setName('')
      setAddress('')
      setPhone('')
      queryClient.invalidateQueries({ queryKey: queryKeys.centers })
    },
  })

  if (isLoading) return <AppShell><Spinner /></AppShell>

  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-bold">센터 관리</h1>
          <p className="text-xs text-gray-500 mt-1">
            센터 직원과 통번역가는 같은 근무 센터일 때만 관리할 수 있습니다.
          </p>
        </div>

        <form onSubmit={e => { e.preventDefault(); saveCenter() }} className="card space-y-3">
          <h2 className="font-semibold text-sm">{editing ? '센터 정보 수정' : '센터 생성'}</h2>
          <div>
            <label className="label">센터 이름</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="예: 동행센터" />
          </div>
          <div>
            <label className="label">주소</label>
            <input className="input" value={address} onChange={e => setAddress(e.target.value)} />
          </div>
          <div>
            <label className="label">연락처</label>
            <input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="02-000-0000" />
          </div>
          {error && <p className="text-xs text-red-500">{error instanceof Error ? error.message : '저장에 실패했습니다.'}</p>}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setEditing(null)
                setName('')
                setAddress('')
                setPhone('')
              }}
            >
              초기화
            </button>
            <button type="submit" className="btn-primary" disabled={isPending}>
              {isPending ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>

        {centers.length === 0 ? (
          <EmptyState message="등록된 센터가 없습니다." />
        ) : (
          <div className="space-y-2">
            {centers.map(center => (
              <button
                key={center.id}
                type="button"
                onClick={() => setEditing(center)}
                className="card block w-full text-left hover:border-primary-200 transition-colors"
              >
                <p className="text-sm font-semibold">{center.name}</p>
                {center.address && <p className="text-xs text-gray-400 mt-1">{center.address}</p>}
                {center.phone && <p className="text-xs text-gray-400">{center.phone}</p>}
              </button>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
