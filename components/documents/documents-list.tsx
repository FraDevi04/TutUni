'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Download, Trash2, RefreshCw, Clock, CheckCircle, AlertCircle, Brain, Eye, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface Document {
  id: number
  filename: string
  original_filename: string
  file_size: number
  file_type: string
  page_count: number | null
  status: string
  is_analyzed: boolean
  error_message: string | null
  created_at: string
  updated_at: string
  analyzed_at: string | null
}

interface DocumentsListProps {
  projectId: number
  onDocumentChange?: () => void
}

export function DocumentsList({ projectId, onDocumentChange }: DocumentsListProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState<Set<number>>(new Set())

  useEffect(() => {
    fetchDocuments()
  }, [projectId])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/documents/project/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (!response.ok) {
        throw new Error('Errore nel caricamento dei documenti')
      }

      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
    } finally {
      setLoading(false)
    }
  }

  const deleteDocument = async (documentId: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo documento?')) {
      return
    }

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (!response.ok) {
        throw new Error('Errore nell\'eliminazione del documento')
      }

      toast.success('Documento eliminato con successo')
      fetchDocuments()
      onDocumentChange?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore sconosciuto')
    }
  }

  const reprocessDocument = async (documentId: number) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/reprocess`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (!response.ok) {
        throw new Error('Errore nel riprocessamento del documento')
      }

      toast.success('Riprocessamento avviato')
      fetchDocuments()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore sconosciuto')
    }
  }

  const analyzeDocument = async (documentId: number) => {
    try {
      setAnalyzing(prev => new Set(prev).add(documentId))
      
      const response = await fetch(`/api/documents/${documentId}/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Errore nell\'analisi')
      }

      toast.success('Analisi AI completata!')
      fetchDocuments()
      onDocumentChange?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore nell\'analisi')
    } finally {
      setAnalyzing(prev => {
        const newSet = new Set(prev)
        newSet.delete(documentId)
        return newSet
      })
    }
  }

  const viewAnalysis = async (documentId: number) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/analyze`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Analisi non disponibile')
      }

      const analysis = await response.json()
      
      // For now, just show a success message
      // In a real app, we might open a modal or navigate to analysis page
      toast.success('Analisi caricata - vai alla tab Analisi per visualizzare i dettagli')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore nel caricamento dell\'analisi')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusIcon = (status: string, isAnalyzed: boolean) => {
    switch (status) {
      case 'UPLOADED':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'PROCESSING':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'PROCESSED':
        return isAnalyzed ? <Sparkles className="h-4 w-4 text-purple-500" /> : <CheckCircle className="h-4 w-4 text-green-500" />
      case 'ANALYZED':
        return <Sparkles className="h-4 w-4 text-purple-500" />
      case 'ERROR':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'UPLOADED':
        return 'Caricato'
      case 'PROCESSING':
        return 'In elaborazione'
      case 'PROCESSED':
        return 'Elaborato'
      case 'ANALYZED':
        return 'Analizzato'
      case 'ERROR':
        return 'Errore'
      default:
        return 'Sconosciuto'
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'UPLOADED':
        return 'secondary'
      case 'PROCESSING':
        return 'default'
      case 'PROCESSED':
        return 'default'
      case 'ANALYZED':
        return 'default'
      case 'ERROR':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchDocuments} variant="outline">
          Riprova
        </Button>
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nessun documento caricato</p>
        <p className="text-sm mt-2">
          Carica i tuoi primi documenti per iniziare l'analisi
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {documents.map((document) => (
        <Card key={document.id} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <FileText className="h-8 w-8 text-blue-500" />
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium">{document.original_filename}</h3>
                  <Badge variant={getStatusVariant(document.status)}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(document.status, document.is_analyzed)}
                      <span>{getStatusText(document.status)}</span>
                    </div>
                  </Badge>
                  {document.is_analyzed && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  <span>{formatFileSize(document.file_size)}</span>
                  {document.page_count && (
                    <span> • {document.page_count} pagine</span>
                  )}
                  <span> • {new Date(document.created_at).toLocaleDateString()}</span>
                </div>
                {document.error_message && (
                  <div className="text-sm text-red-600 mt-1">
                    {document.error_message}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* AI Analysis Buttons */}
              {(document.status === 'PROCESSED' || document.status === 'ANALYZED') && (
                <>
                  {document.is_analyzed ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => viewAnalysis(document.id)}
                      className="text-purple-600 hover:text-purple-700 border-purple-200 hover:border-purple-300"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Visualizza
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => analyzeDocument(document.id)}
                      disabled={analyzing.has(document.id)}
                      className="text-purple-600 hover:text-purple-700 border-purple-200 hover:border-purple-300"
                    >
                      {analyzing.has(document.id) ? (
                        <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Brain className="h-4 w-4 mr-1" />
                      )}
                      Analizza
                    </Button>
                  )}
                  {document.is_analyzed && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => analyzeDocument(document.id)}
                      disabled={analyzing.has(document.id)}
                      className="text-purple-600 hover:text-purple-700"
                    >
                      {analyzing.has(document.id) ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Brain className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </>
              )}
              
              {/* Standard Buttons */}
              {document.status === 'ERROR' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => reprocessDocument(document.id)}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Riprova
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => deleteDocument(document.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
} 