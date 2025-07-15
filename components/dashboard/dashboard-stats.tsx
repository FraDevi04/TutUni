'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  FileText, 
  FolderOpen, 
  MessageCircle, 
  Brain, 
  TrendingUp, 
  Clock,
  CheckCircle,
  Sparkles
} from 'lucide-react'

interface DashboardStatsProps {
  projects?: any[]
}

interface UserStats {
  total_projects: number
  total_documents: number
  analyzed_documents: number
  ai_questions_asked: number
  ai_questions_today: number
  ai_questions_limit: number
  documents_uploaded_today: number
  recent_activity_count: number
}

export function DashboardStats({ projects = [] }: DashboardStatsProps) {
  const { data: session } = useSession()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session) {
      fetchUserStats()
    }
  }, [session])

  const fetchUserStats = async () => {
    try {
      setLoading(true)
      
      // Get token from localStorage (simplified approach)
      const token = localStorage.getItem('accessToken')
      
      if (!token) {
        // Fallback to static data if no token
        setStats({
          total_projects: projects.length,
          total_documents: 0,
          analyzed_documents: 0,
          ai_questions_asked: 0,
          ai_questions_today: 0,
          ai_questions_limit: 50,
          documents_uploaded_today: 0,
          recent_activity_count: 0
        })
        return
      }

      // Fetch projects for additional stats
      const projectsResponse = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      let projectStats = {
        total_projects: 0,
        total_documents: 0,
        analyzed_documents: 0
      }

      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json()
        projectStats = {
          total_projects: projectsData.length,
          total_documents: projectsData.reduce((sum: number, p: any) => sum + (p.document_count || 0), 0),
          analyzed_documents: projectsData.reduce((sum: number, p: any) => sum + (p.analyzed_document_count || 0), 0)
        }
      }

      setStats({
        ...projectStats,
        ai_questions_asked: 0, // Would come from user profile endpoint
        ai_questions_today: 0,
        ai_questions_limit: 50, // Default for free users
        documents_uploaded_today: 0,
        recent_activity_count: 0
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>Errore nel caricamento delle statistiche: {error}</p>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const progressPercentage = stats.total_documents > 0 
    ? Math.round((stats.analyzed_documents / stats.total_documents) * 100)
    : 0

  const aiQuestionsRemaining = stats.ai_questions_limit === -1 
    ? 'Illimitate' 
    : Math.max(0, stats.ai_questions_limit - stats.ai_questions_today)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Progetti */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Progetti</CardTitle>
          <FolderOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_projects}</div>
          <p className="text-xs text-muted-foreground">
            {stats.total_projects}/5 utilizzati
          </p>
        </CardContent>
      </Card>

      {/* Documenti */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Documenti</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_documents}</div>
          <p className="text-xs text-muted-foreground">
            {stats.analyzed_documents} analizzati ({progressPercentage}%)
          </p>
        </CardContent>
      </Card>

      {/* Domande AI */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Domande AI</CardTitle>
          <Brain className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.ai_questions_today}</div>
          <p className="text-xs text-muted-foreground">
            {aiQuestionsRemaining} rimanenti oggi
          </p>
        </CardContent>
      </Card>

      {/* Analisi Complete */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Analisi AI</CardTitle>
          <Sparkles className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.analyzed_documents}</div>
          <p className="text-xs text-muted-foreground">
            Documenti analizzati
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 