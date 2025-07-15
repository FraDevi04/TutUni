'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, FolderPlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ProjectFormData {
  title: string
  description: string
}

export function NewProjectForm() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    description: ''
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast.error('Il titolo del progetto è obbligatorio')
      return
    }

    // Debug autenticazione
    console.log('Session status:', status)
    console.log('Session data:', session)
    
    if (status === 'unauthenticated') {
      toast.error('Devi essere autenticato per creare un progetto')
      router.push('/login')
      return
    }

    if (status === 'loading') {
      toast.error('Caricamento sessione in corso, riprova')
      return
    }

    setLoading(true)

    try {
      // Test debug endpoint first
      const debugResponse = await fetch('/api/projects/test')
      const debugData = await debugResponse.json()
      console.log('Debug API response:', debugData)
      
      if (!debugData.hasSession) {
        toast.error('Sessione non valida, effettua di nuovo il login')
        router.push('/login')
        return
      }

      // Ora l'endpoint API gestisce l'autenticazione via NextAuth session
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim()
        })
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('API Error:', error)
        throw new Error(error.error || 'Errore nella creazione del progetto')
      }

      const project = await response.json()
      
      toast.success('Progetto creato con successo!')
      router.push(`/projects/${project.id}`)
      
    } catch (error) {
      console.error('Error creating project:', error)
      toast.error(error instanceof Error ? error.message : 'Errore sconosciuto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alla Dashboard
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Crea Nuovo Progetto
          </h1>
          <p className="text-gray-600">
            Organizza i tuoi documenti in progetti tematici per un'analisi più efficace
          </p>
        </div>

        {/* Debug Info */}
        {status === 'authenticated' && session && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">
              ✅ Autenticato come: {session.user?.name} ({session.user?.email})
            </p>
            <details className="mt-2">
              <summary className="text-xs text-green-600 cursor-pointer">Debug Session (clicca per vedere)</summary>
              <pre className="text-xs mt-1 bg-white p-2 rounded overflow-auto">
                {JSON.stringify(session, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {status === 'unauthenticated' && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              ❌ Non autenticato - Effettua il login
            </p>
          </div>
        )}

        {status === 'loading' && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              ⏳ Caricamento sessione...
            </p>
          </div>
        )}

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <FolderPlus className="h-5 w-5 text-indigo-600" />
                <CardTitle>Informazioni Progetto</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Titolo del Progetto <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    type="text"
                    placeholder="es. Tesi di Laurea - Arte Rinascimentale"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    maxLength={200}
                  />
                  <p className="text-xs text-gray-500">
                    Scegli un titolo chiaro e descrittivo (max 200 caratteri)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrizione (Opzionale)</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Descrivi brevemente l'obiettivo e il contenuto del progetto..."
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    maxLength={1000}
                  />
                  <p className="text-xs text-gray-500">
                    Aggiungi dettagli che ti aiuteranno a ricordare il contesto del progetto (max 1000 caratteri)
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border">
                  <h3 className="font-medium text-blue-900 mb-2">
                    Cosa puoi fare dopo aver creato il progetto:
                  </h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Caricare documenti PDF e DOCX</li>
                    <li>• Ottenere analisi AI automatiche</li>
                    <li>• Usare la chat AI per fare domande sui documenti</li>
                    <li>• Visualizzare tesi centrali, concetti chiave e strutture</li>
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <Link href="/dashboard">
                    <Button type="button" variant="outline">
                      Annulla
                    </Button>
                  </Link>
                  
                  <Button 
                    type="submit" 
                    disabled={loading || !formData.title.trim() || status !== 'authenticated'}
                    className="min-w-32"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creazione...
                      </>
                    ) : (
                      <>
                        <FolderPlus className="h-4 w-4 mr-2" />
                        Crea Progetto
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 