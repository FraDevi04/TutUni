import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TutUni AI - Assistente di Ricerca Universitario',
  description: 'Assistente AI specializzato per studenti di facoltà umanistiche. Analizza documenti, estrae concetti chiave e supporta la ricerca accademica.',
  keywords: ['AI', 'università', 'ricerca', 'documenti', 'storia', 'economia', 'beni culturali'],
  authors: [{ name: 'TutUni AI Team' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-background">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
} 