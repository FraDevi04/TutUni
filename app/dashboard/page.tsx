import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Brain, 
  FileText, 
  FolderOpen, 
  Plus, 
  Sparkles,
  MessageCircle,
  BarChart3,
  Clock,
  User,
  Bell
} from 'lucide-react'
import Link from 'next/link'
import { NotificationsDropdown } from '@/components/dashboard/notifications-dropdown'
import { UserDropdown } from '@/components/dashboard/user-dropdown'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-indigo-600" />
              <span className="text-xl font-bold text-gray-900">TutUni AI</span>
              <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
                Beta
              </Badge>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <NotificationsDropdown />
            <UserDropdown />
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Benvenuto, {session.user?.name}
          </h1>
          <p className="text-gray-600">
            Gestisci i tuoi progetti di ricerca e analizza documenti con l'AI
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progetti</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                0/5 utilizzati
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documenti</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                0 analizzati (0%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Domande AI</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                50 rimanenti oggi
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Analisi AI</CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Documenti analizzati
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Azioni Rapide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/projects/new">
                  <Button className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuovo Progetto
                  </Button>
                </Link>
                
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Carica Documento
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat AI
                </Button>
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">I Tuoi Progetti</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-4">
                    Non hai ancora progetti
                  </p>
                  <Link href="/projects/new">
                    <Button size="sm" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Crea il primo progetto
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Inizia con TutUni AI</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-blue-500 rounded-md">
                        <FolderOpen className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-blue-900">1. Crea un progetto</h3>
                        <p className="text-sm text-blue-700 mt-1">
                          Organizza i tuoi documenti in progetti tematici
                        </p>
                        <Link href="/projects/new">
                          <Button size="sm" className="mt-2">Inizia</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg border">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-green-500 rounded-md">
                        <FileText className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-green-900">2. Carica documenti</h3>
                        <p className="text-sm text-green-700 mt-1">
                          Upload PDF e DOCX per l'analisi automatica
                        </p>
                        <Button size="sm" variant="outline" className="mt-2" disabled>
                          Carica
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg border">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-purple-500 rounded-md">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-purple-900">3. Analisi AI</h3>
                        <p className="text-sm text-purple-700 mt-1">
                          Estrai tesi, concetti e strutture automaticamente
                        </p>
                        <Button size="sm" variant="outline" className="mt-2" disabled>
                          Analizza
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-orange-50 rounded-lg border">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-orange-500 rounded-md">
                        <MessageCircle className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-orange-900">4. Chat AI</h3>
                        <p className="text-sm text-orange-700 mt-1">
                          Fai domande sui tuoi documenti analizzati
                        </p>
                        <Button size="sm" variant="outline" className="mt-2" disabled>
                          Chat
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 