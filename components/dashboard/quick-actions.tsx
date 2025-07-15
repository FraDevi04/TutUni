'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Plus, 
  Upload, 
  Search, 
  FileText, 
  FolderPlus,
  Brain,
  MessageCircle,
  Sparkles
} from 'lucide-react'

export function QuickActions() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const quickActionButtons = [
    {
      label: 'Nuovo Progetto',
      icon: FolderPlus,
      href: '/projects/new',
      description: 'Crea un nuovo progetto di ricerca',
      color: 'bg-blue-500 hover:bg-blue-600 text-white'
    },
    {
      label: 'Carica Documento',
      icon: Upload,
      href: '/dashboard#upload',
      description: 'Carica PDF o DOCX per analisi',
      color: 'bg-green-500 hover:bg-green-600 text-white'
    },
    {
      label: 'Chat AI',
      icon: MessageCircle,
      href: '/dashboard#chat',
      description: 'Inizia una conversazione AI',
      color: 'bg-purple-500 hover:bg-purple-600 text-white'
    },
    {
      label: 'Analisi AI',
      icon: Sparkles,
      href: '/dashboard#analysis',
      description: 'Visualizza analisi documenti',
      color: 'bg-orange-500 hover:bg-orange-600 text-white'
    }
  ]

  return (
    <div className="space-y-4">
      {/* Search */}
      <form onSubmit={handleSearch} className="space-y-2">
        <Label htmlFor="quick-search" className="text-sm font-medium">
          Ricerca Rapida
        </Label>
        <div className="flex space-x-2">
          <Input
            id="quick-search"
            placeholder="Cerca progetti, documenti..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="sm" variant="outline">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </form>

      {/* Quick Actions */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Azioni Rapide</Label>
        
        <div className="grid grid-cols-1 gap-2">
          {quickActionButtons.map((action, index) => (
            <Link key={index} href={action.href}>
              <Button 
                variant="outline" 
                className="w-full justify-start h-auto p-3 text-left hover:shadow-sm"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-md ${action.color}`}>
                    <action.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{action.label}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {action.description}
                    </div>
                  </div>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Suggerimenti</Label>
        
        <div className="space-y-2">
          <div className="p-3 bg-blue-50 rounded-lg border">
            <div className="flex items-start space-x-2">
              <FileText className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Inizia con i documenti
                </p>
                <p className="text-xs text-blue-700">
                  Carica i tuoi PDF o DOCX per iniziare l'analisi AI
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-purple-50 rounded-lg border">
            <div className="flex items-start space-x-2">
              <Brain className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-purple-900">
                  Usa la Chat AI
                </p>
                <p className="text-xs text-purple-700">
                  Fai domande specifiche sui tuoi documenti analizzati
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 