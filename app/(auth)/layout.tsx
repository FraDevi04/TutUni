import { Brain } from 'lucide-react'
import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-bg items-center justify-center p-12">
        <div className="max-w-md text-center text-white">
          <div className="flex items-center justify-center space-x-3 mb-8">
            <Brain className="h-12 w-12" />
            <h1 className="text-3xl font-bold">TutUni AI</h1>
          </div>
          <h2 className="text-xl mb-6">
            Il tuo assistente di ricerca per l'università
          </h2>
          <p className="text-lg opacity-90">
            Analizza documenti, estrae concetti chiave e supporta la tua ricerca accademica 
            con l'intelligenza artificiale più avanzata.
          </p>
          <div className="mt-8 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-white rounded-full"></div>
              <span>Analisi automatica dei documenti</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-white rounded-full"></div>
              <span>Estrazione di tesi e concetti</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-white rounded-full"></div>
              <span>Chat AI contestuale</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 auth-pattern">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="flex items-center justify-center space-x-2">
              <Brain className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">TutUni AI</span>
            </Link>
          </div>
          
          {children}
        </div>
      </div>
    </div>
  )
} 