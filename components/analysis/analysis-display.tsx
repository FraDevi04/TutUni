'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Brain, 
  FileText, 
  Users, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  BookOpen,
  List,
  Quote,
  Lightbulb,
  Eye,
  Sparkles,
  Clock
} from 'lucide-react'
import { toast } from 'sonner'

interface AnalysisResult {
  document_id: number
  filename: string
  analyzed_at: string
  central_thesis: string
  key_concepts: string[]
  argumentative_structure: {
    introduction: string
    main_arguments: string[]
    logical_flow: string
    conclusion: string
    argumentative_strategy: string
  }
  cited_sources: Array<{
    author: string
    title: string
    year: string
    type: string
    citation_context: string
  }>
  analysis_metadata: {
    ai_model: string
    processing_time_ms: number
    analyzed_at: string
    document_length: number
    filename: string
  }
}

interface AnalysisDisplayProps {
  projectId: number
  onAnalysisUpdate?: () => void
}

export function AnalysisDisplay({ projectId, onAnalysisUpdate }: AnalysisDisplayProps) {
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState<Set<number>>(new Set())

  useEffect(() => {
    fetchAnalyses()
  }, [projectId])

  const fetchAnalyses = async () => {
    try {
      setLoading(true)
      
      // First, get all documents for the project
      const documentsResponse = await fetch(`/api/documents/project/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (!documentsResponse.ok) {
        throw new Error('Errore nel recupero dei documenti')
      }

      const documents = await documentsResponse.json()
      
      // Then fetch analyses for each analyzed document
      const analysisPromises = documents
        .filter((doc: any) => doc.is_analyzed)
        .map(async (doc: any) => {
          try {
            const analysisResponse = await fetch(`/api/documents/${doc.id}/analyze`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
              }
            })
            
            if (analysisResponse.ok) {
              return await analysisResponse.json()
            }
            return null
          } catch (error) {
            console.error(`Error fetching analysis for document ${doc.id}:`, error)
            return null
          }
        })

      const analysisResults = await Promise.all(analysisPromises)
      const validAnalyses = analysisResults.filter(Boolean)
      
      setAnalyses(validAnalyses)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
    } finally {
      setLoading(false)
    }
  }

  const startAnalysis = async (documentId: number) => {
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

      toast.success('Analisi completata con successo!')
      await fetchAnalyses()
      onAnalysisUpdate?.()
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

  const resetAnalysis = async (documentId: number) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/analyze`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Errore nel reset')
      }

      toast.success('Analisi resettata. Puoi richiedere una nuova analisi.')
      await fetchAnalyses()
      onAnalysisUpdate?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore nel reset')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-8 w-32" />
        </div>
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchAnalyses} variant="outline">
          Riprova
        </Button>
      </div>
    )
  }

  if (analyses.length === 0) {
    return (
      <div className="text-center py-12">
        <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Nessuna analisi disponibile
        </h3>
        <p className="text-gray-600 mb-6">
          Carica e analizza i documenti per vedere i risultati dell'analisi AI
        </p>
        <Button onClick={fetchAnalyses} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Aggiorna
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <h2 className="text-lg font-semibold">Analisi AI dei Documenti</h2>
          <Badge variant="secondary">{analyses.length}</Badge>
        </div>
        <Button onClick={fetchAnalyses} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Aggiorna
        </Button>
      </div>

      {analyses.map((analysis) => (
        <Card key={analysis.document_id} className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-blue-500" />
                <div>
                  <CardTitle className="text-lg">{analysis.filename}</CardTitle>
                  <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      Analizzato il {new Date(analysis.analyzed_at).toLocaleDateString()}
                    </span>
                    {analysis.analysis_metadata && (
                      <span className="text-gray-400">
                        • {analysis.analysis_metadata.processing_time_ms}ms
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => startAnalysis(analysis.document_id)}
                  disabled={analyzing.has(analysis.document_id)}
                  variant="outline"
                  size="sm"
                >
                  {analyzing.has(analysis.document_id) ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Brain className="h-4 w-4 mr-2" />
                  )}
                  Ri-analizza
                </Button>
                <Button
                  onClick={() => resetAnalysis(analysis.document_id)}
                  variant="ghost"
                  size="sm"
                >
                  Reset
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Central Thesis */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                <h3 className="font-semibold text-gray-900">Tesi Centrale</h3>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-gray-800 leading-relaxed">
                  {analysis.central_thesis}
                </p>
              </div>
            </div>

            {/* Key Concepts */}
            {analysis.key_concepts && analysis.key_concepts.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  <h3 className="font-semibold text-gray-900">Concetti Chiave</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {analysis.key_concepts.map((concept, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {concept}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Argumentative Structure */}
            {analysis.argumentative_structure && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <List className="h-4 w-4 text-green-500" />
                  <h3 className="font-semibold text-gray-900">Struttura Argomentativa</h3>
                </div>
                <div className="space-y-4">
                  {analysis.argumentative_structure.introduction && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-medium text-green-800 mb-2">Introduzione</h4>
                      <p className="text-green-700 text-sm">
                        {analysis.argumentative_structure.introduction}
                      </p>
                    </div>
                  )}
                  
                  {analysis.argumentative_structure.main_arguments && 
                   analysis.argumentative_structure.main_arguments.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 mb-2">Argomenti Principali</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {analysis.argumentative_structure.main_arguments.map((arg, index) => (
                          <li key={index} className="text-blue-700 text-sm">
                            {arg}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {analysis.argumentative_structure.conclusion && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h4 className="font-medium text-purple-800 mb-2">Conclusione</h4>
                      <p className="text-purple-700 text-sm">
                        {analysis.argumentative_structure.conclusion}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cited Sources */}
            {analysis.cited_sources && analysis.cited_sources.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Quote className="h-4 w-4 text-red-500" />
                  <h3 className="font-semibold text-gray-900">Fonti Citate</h3>
                </div>
                <div className="space-y-3">
                  {analysis.cited_sources.map((source, index) => (
                    <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-red-800">
                          {source.author} ({source.year})
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {source.type}
                        </Badge>
                      </div>
                      <p className="text-red-700 text-sm font-medium mb-1">
                        {source.title}
                      </p>
                      {source.citation_context && (
                        <p className="text-red-600 text-xs">
                          {source.citation_context}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 