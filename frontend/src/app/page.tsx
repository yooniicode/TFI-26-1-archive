import Link from 'next/link'

const FEATURES = [
  {
    icon: '□',
    title: '통번역 보고서 관리',
    desc: '진료·상담 내역을 구조화된 양식으로 기록하고, 필요할 때 바로 꺼내볼 수 있습니다.',
  },
  {
    icon: '◇',
    title: '이주민 케어',
    desc: '이주민별 방문 이력·메모·비자 정보를 한 곳에서 관리하고 담당자 간 공유합니다.',
  },
  {
    icon: '↔',
    title: '인수인계',
    desc: '센터 직원과 통번역가 간 인수인계 내용을 빠짐없이 기록하고 전달합니다.',
  },
  {
    icon: '◎',
    title: '매칭 & 배정',
    desc: '이주민과 통번역가를 연결하고, 배정 현황을 실시간으로 파악합니다.',
  },
]

interface CenterSummary {
  id: string
  name: string
  address?: string | null
  phone?: string | null
  active: boolean
}

async function fetchCenters(): Promise<CenterSummary[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'
    const res = await fetch(`${apiUrl}/api/v1/centers?page=0&size=100`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.payload ?? []) as CenterSummary[]
  } catch {
    return []
  }
}

export default async function LandingPage() {
  const centers = await fetchCenters()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <span className="text-xl font-bold text-primary-700">TFI</span>
        <Link href="/login" className="btn-primary text-sm px-4 py-2">
          로그인
        </Link>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-medium text-primary-600 mb-3 tracking-wide uppercase">
            통번역 지원 플랫폼
          </p>
          <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-4">
            이주민과 통번역가를 <br className="hidden sm:block" />
            <span className="text-primary-600">스마트하게 연결</span>합니다
          </h1>
          <p className="text-lg text-gray-500 mb-10 leading-relaxed">
            이주민 의료·법률 통번역 센터의 반복되는 인수인계, 보고서 작성,
            담당자 배정을 하나의 플랫폼에서 처리하세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login" className="btn-primary px-8 py-3 text-base">
              시작하기
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-10">
            주요 기능
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {FEATURES.map(f => (
              <div key={f.title} className="card p-5">
                <span className="text-2xl text-primary-600 mb-3 block">{f.icon}</span>
                <h3 className="font-semibold text-gray-800 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Participating Centers */}
      {centers.length > 0 && (
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
              참여 센터
            </h2>
            <p className="text-center text-sm text-gray-500 mb-10">
              TFI를 도입한 이주민 지원 센터입니다.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {centers.map(center => (
                <Link
                  key={center.id}
                  href="/login"
                  className="group block rounded-xl border border-gray-200 bg-white p-5 hover:border-primary-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 text-sm font-bold">
                      {center.name.charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 group-hover:text-primary-700 transition-colors truncate">
                        {center.name}
                      </p>
                      {center.address && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{center.address}</p>
                      )}
                      {center.phone && (
                        <p className="text-xs text-gray-400 mt-0.5">{center.phone}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 px-6 text-center bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          지금 바로 사용해보세요
        </h2>
        <p className="text-gray-500 mb-8">
          센터 직원, 통번역가, 이주민 모두를 위한 전용 화면이 준비되어 있습니다.
        </p>
        <Link href="/login" className="btn-primary px-10 py-3 text-base">
          로그인 / 회원가입
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        © 2026 TFI 통번역 지원 플랫폼
      </footer>
    </div>
  )
}
