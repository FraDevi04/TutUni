'use client'

import { useState, useEffect } from 'react'
import { Bell, X, Check, AlertCircle, Info, Star, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'feature'
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
}

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)

  // Mock notifications data - replace with actual API call
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'feature',
        title: 'Nuova Funzionalità!',
        message: 'È ora possibile analizzare documenti PDF con OCR avanzato',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        read: false,
        actionUrl: '/features/ocr'
      },
      {
        id: '2',
        type: 'info',
        title: 'Sistema Aggiornato',
        message: 'Abbiamo migliorato le prestazioni del motore AI per analisi più veloci',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        read: false
      },
      {
        id: '3',
        type: 'success',
        title: 'Documento Analizzato',
        message: 'L\'analisi del documento "Storia del Rinascimento.pdf" è completata',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        read: true,
        actionUrl: '/documents/analysis/123'
      },
      {
        id: '4',
        type: 'warning',
        title: 'Limite Quasi Raggiunto',
        message: 'Hai utilizzato 45/50 domande AI giornaliere. Considera l\'upgrade a Pro.',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        read: true,
        actionUrl: '/upgrade'
      },
      {
        id: '5',
        type: 'feature',
        title: 'Chat AI Migliorata',
        message: 'Nuovi modelli linguistici per risposte più precise e contestuali',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        read: true
      }
    ]
    setNotifications(mockNotifications)
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    )
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <Check className="h-4 w-4 text-green-600" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-amber-600" />
      case 'feature':
        return <Sparkles className="h-4 w-4 text-purple-600" />
      default:
        return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  const formatTime = (date: Date) => {
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

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">Notifiche</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-8 px-2 text-xs"
              >
                Segna tutte come lette
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Nessuna notifica</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                            {!notification.read && (
                              <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full inline-block"></span>
                            )}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {formatTime(notification.timestamp)}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="h-6 w-6 p-0"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeNotification(notification.id)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {notification.actionUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 h-7 text-xs"
                          onClick={() => {
                            // Navigate to action URL
                            window.location.href = notification.actionUrl!
                          }}
                        >
                          Visualizza
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="border-t p-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-xs"
              onClick={() => {
                // Navigate to full notifications page
                window.location.href = '/notifications'
                setIsOpen(false)
              }}
            >
              Vedi tutte le notifiche
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 