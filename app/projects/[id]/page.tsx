'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DocumentUpload } from '@/components/documents/document-upload'
import { DocumentsList } from '@/components/documents/documents-list'
import { ChatInterface } from '@/components/chat/chat-interface'
import { AnalysisDisplay } from '@/components/analysis/analysis-display'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { FileText, BarChart3, MessageCircle, Settings } from 'lucide-react'

interface Project {
  id: number
  title: string
  description: string
  progress: number
  document_count: number
  analyzed_document_count: number
  created_at: string
  updated_at: string
}

export default function ProjectPage() {
  const { id } = useParams()
  const { data: session } = useSession()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id && session?.accessToken) {
      fetchProject()
    }
  }, [id, session])

  const fetchProject = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${id}`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Errore nel caricamento del progetto')
      }
      
      const data = await response.json()
      setProject(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="container mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="container mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={fetchProject}>Riprova</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="container mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-600">Progetto non trovato</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
              <p className="text-gray-600 mt-2">{project.description}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">
                {project.document_count} documenti
              </Badge>
              <Badge variant="outline">
                {Math.round(project.progress)}% completato
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documenti</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{project.document_count}</div>
              <p className="text-xs text-muted-foreground">
                {project.analyzed_document_count} analizzati
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progresso</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(project.progress)}%</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stato</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Attivo</div>
              <p className="text-xs text-muted-foreground">
                Ultimo aggiornamento: {new Date(project.updated_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="documents" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="documents">Documenti</TabsTrigger>
            <TabsTrigger value="analysis">Analisi</TabsTrigger>
            <TabsTrigger value="chat">Chat AI</TabsTrigger>
            <TabsTrigger value="settings">Impostazioni</TabsTrigger>
          </TabsList>
          
          <TabsContent value="documents" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Upload Area */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Carica Documenti</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DocumentUpload 
                      projectId={parseInt(id as string)} 
                      onUploadSuccess={fetchProject}
                    />
                  </CardContent>
                </Card>
              </div>
              
              {/* Documents List */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Documenti del Progetto</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DocumentsList 
                      projectId={parseInt(id as string)}
                      onDocumentChange={fetchProject}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="analysis" className="mt-6">
            <AnalysisDisplay 
              projectId={parseInt(id as string)} 
              onAnalysisUpdate={fetchProject}
            />
          </TabsContent>
          
          <TabsContent value="chat" className="mt-6">
            <div className="h-[600px]">
              <ChatInterface projectId={parseInt(id as string)} />
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Impostazioni Progetto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Impostazioni non ancora disponibili</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 