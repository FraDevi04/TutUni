'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  FolderOpen, 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle,
  ArrowRight 
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'

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

export function ProjectsList() {
  const { data: session } = useSession()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session) {
      fetchProjects()
    }
  }, [session])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      
      const token = localStorage.getItem('accessToken')
      if (!token) {
        setProjects([])
        return
      }

      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Errore nel caricamento dei progetti')
      }

      const data = await response.json()
      setProjects(data.slice(0, 5)) // Show only first 5 projects in sidebar
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-600 text-sm">
        <p>{error}</p>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-6">
        <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-sm text-gray-600 mb-4">
          Non hai ancora progetti
        </p>
        <Link href="/projects/new">
          <Button size="sm" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Crea Progetto
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {projects.map((project) => (
        <Link key={project.id} href={`/projects/${project.id}`}>
          <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <h4 className="font-medium text-sm truncate pr-2">
                  {project.title}
                </h4>
                <ArrowRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
              </div>
              
              {project.description && (
                <p className="text-xs text-gray-600 line-clamp-2">
                  {project.description}
                </p>
              )}
              
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1 text-gray-500">
                  <FileText className="h-3 w-3" />
                  <span>{project.document_count}</span>
                </div>
                
                <Badge 
                  variant={project.analyzed_document_count > 0 ? "default" : "secondary"}
                  className="text-xs px-1.5 py-0.5"
                >
                  {Math.round(project.progress)}%
                </Badge>
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  {formatDistanceToNow(new Date(project.updated_at), { 
                    addSuffix: true, 
                    locale: it 
                  })}
                </span>
                
                {project.analyzed_document_count > 0 ? (
                  <div className="flex items-center space-x-1 text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>Analizzato</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-orange-600">
                    <Clock className="h-3 w-3" />
                    <span>In attesa</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </Link>
      ))}
      
      {projects.length >= 5 && (
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="w-full text-xs">
            Vedi tutti i progetti
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      )}
      
      <Link href="/projects/new">
        <Button size="sm" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Progetto
        </Button>
      </Link>
    </div>
  )
} 