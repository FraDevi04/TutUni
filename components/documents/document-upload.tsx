'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react'
import { toast } from 'sonner'

interface DocumentUploadProps {
  projectId: number
  onUploadSuccess?: () => void
}

interface UploadFile {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

export function DocumentUpload({ projectId, onUploadSuccess }: DocumentUploadProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Filter for PDF and DOCX files
    const validFiles = acceptedFiles.filter(file => {
      const fileType = file.type
      const fileName = file.name.toLowerCase()
      return fileType === 'application/pdf' || 
             fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
             fileName.endsWith('.pdf') ||
             fileName.endsWith('.docx')
    })

    if (validFiles.length !== acceptedFiles.length) {
      toast.error('Solo file PDF e DOCX sono supportati')
    }

    // Check file size (50MB limit)
    const oversizedFiles = validFiles.filter(file => file.size > 50 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      toast.error('Alcuni file superano il limite di 50MB')
      return
    }

    // Add to upload queue
    const newUploadFiles = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const
    }))

    setUploadFiles(prev => [...prev, ...newUploadFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: true
  })

  const uploadFile = async (uploadFile: UploadFile) => {
    const formData = new FormData()
    formData.append('file', uploadFile.file)

    try {
      setUploadFiles(prev => 
        prev.map(f => 
          f.file === uploadFile.file 
            ? { ...f, status: 'uploading' }
            : f
        )
      )

      const response = await fetch(`/api/documents/upload/${projectId}`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Errore durante l\'upload')
      }

      const result = await response.json()
      
      setUploadFiles(prev => 
        prev.map(f => 
          f.file === uploadFile.file 
            ? { ...f, status: 'success', progress: 100 }
            : f
        )
      )

      toast.success(`${uploadFile.file.name} caricato con successo`)
      onUploadSuccess?.()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto'
      
      setUploadFiles(prev => 
        prev.map(f => 
          f.file === uploadFile.file 
            ? { ...f, status: 'error', error: errorMessage }
            : f
        )
      )

      toast.error(`Errore caricando ${uploadFile.file.name}: ${errorMessage}`)
    }
  }

  const uploadAll = async () => {
    if (uploadFiles.length === 0) return

    setIsUploading(true)
    
    try {
      const pendingFiles = uploadFiles.filter(f => f.status === 'pending')
      
      // Upload files sequentially to avoid overwhelming the server
      for (const fileToUpload of pendingFiles) {
        await uploadFile(fileToUpload)
      }
    } finally {
      setIsUploading(false)
    }
  }

  const removeFile = (fileToRemove: File) => {
    setUploadFiles(prev => prev.filter(f => f.file !== fileToRemove))
  }

  const clearCompleted = () => {
    setUploadFiles(prev => prev.filter(f => f.status !== 'success'))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-blue-600">Rilascia i file qui...</p>
        ) : (
          <div>
            <p className="text-gray-600 mb-2">
              Trascina i file qui o clicca per selezionare
            </p>
            <p className="text-sm text-gray-500">
              Supporta file PDF e DOCX (max 50MB)
            </p>
          </div>
        )}
      </div>

      {/* Upload Queue */}
      {uploadFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">
              File da caricare ({uploadFiles.length})
            </h3>
            <div className="flex space-x-2">
              <Button
                onClick={clearCompleted}
                variant="outline"
                size="sm"
                disabled={!uploadFiles.some(f => f.status === 'success')}
              >
                Rimuovi completati
              </Button>
              <Button
                onClick={uploadAll}
                size="sm"
                disabled={isUploading || !uploadFiles.some(f => f.status === 'pending')}
              >
                {isUploading ? 'Caricando...' : 'Carica tutto'}
              </Button>
            </div>
          </div>

          {uploadFiles.map((uploadFile, index) => (
            <Card key={index} className="p-3">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-blue-500" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">
                      {uploadFile.file.name}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(uploadFile.file)}
                      disabled={uploadFile.status === 'uploading'}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(uploadFile.file.size)}
                  </p>
                  
                  {uploadFile.status === 'uploading' && (
                    <Progress value={uploadFile.progress} className="mt-2" />
                  )}
                  
                  {uploadFile.status === 'error' && (
                    <div className="flex items-center mt-2 text-red-600">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      <span className="text-xs">{uploadFile.error}</span>
                    </div>
                  )}
                  
                  {uploadFile.status === 'success' && (
                    <div className="flex items-center mt-2 text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <span className="text-xs">Caricato con successo</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 