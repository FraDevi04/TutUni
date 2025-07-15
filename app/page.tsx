import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { Brain, BookOpen, MessageSquare, Lightbulb, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <header className="relative">
              <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex justify-between items-center py-6 md:justify-start md:space-x-10">
                  <div className="flex justify-start lg:w-0 lg:flex-1">
                    <Link href="/" className="flex items-center space-x-2">
                      <Brain className="h-8 w-8 text-indigo-600" />
                      <span className="text-2xl font-bold text-gray-900">TutUni AI</span>
                    </Link>
                  </div>
                  <div className="hidden md:flex items-center justify-end md:flex-1 lg:w-0">
                    <Link
                      href="/login"
                      className="whitespace-nowrap text-base font-medium text-gray-500 hover:text-gray-900"
                    >
                      Accedi
                    </Link>
                    <Link href="/register">
                      <Button className="ml-8 whitespace-nowrap">
                        Inizia gratis
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </header>

            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Il tuo assistente AI</span>{' '}
                  <span className="block text-indigo-600 xl:inline">per l'università</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Analizza documenti accademici, estrae concetti chiave e supporta la tua ricerca 
                  con l'intelligenza artificiale più avanzata. Specializzato per studenti di facoltà umanistiche.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link href="/register">
                      <Button size="lg" className="w-full flex items-center justify-center">
                        Inizia gratis
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link href="/demo">
                      <Button variant="outline" size="lg" className="w-full">
                        Guarda la demo
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <div className="h-56 w-full sm:h-72 md:h-96 lg:w-full lg:h-full gradient-bg flex items-center justify-center">
            <div className="text-white text-center">
              <Brain className="h-32 w-32 mx-auto mb-4 opacity-20" />
              <p className="text-lg opacity-80">Intelligenza Artificiale per la Ricerca</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">Funzionalità</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Tutto quello che ti serve per studiare meglio
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  <BookOpen className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Analisi Documenti</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Carica PDF e DOCX per un'analisi automatica completa. Estrazione di tesi, concetti e struttura.
                </p>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  <Lightbulb className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Concetti Chiave</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Identificazione automatica dei concetti più importanti e delle connessioni tra argomenti.
                </p>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Chat Intelligente</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Fai domande sui tuoi documenti e ricevi risposte precise e contestualizzate.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-indigo-700">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Pronto a migliorare il tuo studio?</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-indigo-200">
            Unisciti a centinaia di studenti che utilizzano già TutUni AI per eccellere nei loro studi.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="mt-8">
              Inizia gratis oggi
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
} 