import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId = params.projectId
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Token di autorizzazione richiesto' }, { status: 401 })
    }

    const response = await fetch(`${process.env.API_URL}/documents/project/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ error: error.detail || 'Errore del server' }, { status: response.status })
    }

    const documents = await response.json()
    return NextResponse.json(documents)
  } catch (error) {
    console.error('Errore nel recupero dei documenti del progetto:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
} 