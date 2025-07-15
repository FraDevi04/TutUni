import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Token di autorizzazione richiesto' }, { status: 401 })
    }

    const response = await fetch(`${process.env.API_URL}/documents/${documentId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ error: error.detail || 'Errore del server' }, { status: response.status })
    }

    const document = await response.json()
    return NextResponse.json(document)
  } catch (error) {
    console.error('Errore nel recupero del documento:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Token di autorizzazione richiesto' }, { status: 401 })
    }

    const response = await fetch(`${process.env.API_URL}/documents/${documentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ error: error.detail || 'Errore del server' }, { status: response.status })
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Errore nella cancellazione del documento:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
} 