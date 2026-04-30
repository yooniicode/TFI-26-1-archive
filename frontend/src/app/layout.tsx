import type { Metadata, Viewport } from 'next'
import './globals.css'
import QueryProvider from '@/components/QueryProvider'

export const metadata: Metadata = {
  title: 'LinkUs 통번역 지원 플랫폼',
  description: '이주민 의료 통번역 지원 시스템',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'LinkUs' },
}

export const viewport: Viewport = {
  themeColor: '#16a34a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body><QueryProvider>{children}</QueryProvider></body>
    </html>
  )
}
