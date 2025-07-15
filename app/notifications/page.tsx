import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Bell, 
  Check, 
  AlertCircle, 
  Info, 
  Sparkles,
  ArrowLeft,
  Filter,
  Search
} from 'lucide-react'
import Link from 'next/link'
import { NotificationsDropdown } from '@/components/dashboard/notifications-dropdown'
import { UserDropdown } from '@/components/dashboard/user-dropdown'

// Mock data - replace with actual API call
const mockNotifications = [
  {
    id: '1',
    type: 'feature' as const,
    title: 'Nuova Funzionalità!',
    message: 'È ora possibile analizzare documenti PDF con OCR avanzato per un\'estrazione del testo più precisa. Questa funzionalità migliora significativamente la qualità dell\'analisi dei documenti scansionati.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: false,
    actionUrl: '/features/ocr',
    category: 'product'
  },
  {
    id: '2',
    type: 'info' as const,
    title: 'Sistema Aggiornato',
    message: 'Abbiamo migliorato le prestazioni del motore AI per analisi più veloci. I tempi di elaborazione sono stati ridotti del 40% per documenti di grandi dimensioni.',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    read: false,
    category: 'system'
  },
  {
    id: '3',
    type: 'success' as const,
    title: 'Documento Analizzato',
    message: 'L\'analisi del documento "Storia del Rinascimento.pdf" è stata completata con successo. Sono stati estratti 23 concetti chiave e 156 entità.',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    read: true,
    actionUrl: '/documents/analysis/123',
    category: 'document'
  },
  {
    id: '4',
    type: 'warning' as const,
    title: 'Limite Quasi Raggiunto',
    message: 'Hai utilizzato 45/50 domande AI giornaliere. Considera l\'upgrade a Pro per sbloccare domande illimitate e funzionalità avanzate.',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    read: true,
    actionUrl: '/upgrade',
    category: 'billing'
  },
  {
    id: '5',
    type: 'feature' as const,
    title: 'Chat AI Migliorata',
    message: 'Nuovi modelli linguistici per risposte più precise e contestuali. La chat ora supporta anche l\'analisi di immagini e grafici.',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    read: true,
    category: 'product'
  },
  {
    id: '6',
    type: 'info' as const,
    title: 'Manutenzione Programmata',
    message: 'Il sistema sarà in manutenzione domenica 12 gennaio dalle 02:00 alle 04:00. Durante questo periodo il servizio potrebbe essere temporaneamente non disponibile.',
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    read: true,
    category: 'system'
  },
  {
    id: '7',
    type: 'success' as const,
    title: 'Progetto Completato',
    message: 'Il progetto "Analisi Storica Medievale" è stato completato. Tutti i documenti sono stati analizzati e le relazioni sono disponibili.',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    read: true,
    actionUrl: '/projects/medieval-analysis',
    category: 'project'
  },
  {
    id: '8',
    type: 'feature' as const,
    title: 'Nuove Template di Progetto',
    message: 'Sono disponibili nuove template per progetti di ricerca in Storia dell\'Arte, Letteratura e Filosofia. Accelera il tuo lavoro con strutture predefinite.',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    read: true,
    category: 'product'
  }
]

function getNotificationIcon(type: string) {
  switch (type) {
    case 'success':
      return <Check className="h-5 w-5 text-green-600" />
    case 'warning':
      return <AlertCircle className="h-5 w-5 text-amber-600" />
    case 'feature':
      return <Sparkles className="h-5 w-5 text-purple-600" />
    default:
      return <Info className="h-5 w-5 text-blue-600" />
  }
}

function formatTime(date: Date) {
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 1) {
    return 'Appena adesso'
  } else if (diffInHours < 24) {
    return `${diffInHours}h fa`
  } else {
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}g fa`
  }
}

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  const notifications = mockNotifications
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-600">Dashboard</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <NotificationsDropdown />
            <UserDropdown />
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Notifiche
              </h1>
              <p className="text-gray-600">
                Rimani aggiornato su tutte le novità e attività del tuo account
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-sm">
                {unreadCount} non lette
              </Badge>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm" className="text-sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtra
                </Button>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" className="text-xs">
                    Tutte
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs">
                    Non lette
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs">
                    Prodotto
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs">
                    Sistema
                  </Button>
                </div>
              </div>
              <Button variant="outline" size="sm" className="text-sm">
                Segna tutte come lette
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card 
              key={notification.id}
              className={`hover:shadow-md transition-shadow ${
                !notification.read ? 'ring-2 ring-blue-500/20 bg-blue-50/30' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                          {notification.title}
                          {!notification.read && (
                            <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full inline-block"></span>
                          )}
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>{formatTime(notification.timestamp)}</span>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs">
                            {notification.category}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {!notification.read && (
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-4 leading-relaxed">
                      {notification.message}
                    </p>
                    
                    {notification.actionUrl && (
                      <Button variant="outline" size="sm">
                        Visualizza dettagli
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-8">
          <Button variant="outline" className="px-8">
            Carica altre notifiche
          </Button>
        </div>
      </div>
    </div>
  )
} 