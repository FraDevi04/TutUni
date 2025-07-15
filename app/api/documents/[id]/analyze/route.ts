import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Token di autorizzazione richiesto' }, { status: 401 })
    }

    const response = await fetch(`${process.env.API_URL}/documents/${documentId}/analyze`, {
      method: 'POST',
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
    console.error('Errore nell\'analisi del documento:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

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

    const response = await fetch(`${process.env.API_URL}/documents/${documentId}/analysis`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ error: error.detail || 'Errore del server' }, { status: response.status })
    }

    const analysis = await response.json()
    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Errore nel recupero dell\'analisi:', error)
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

    const response = await fetch(`${process.env.API_URL}/documents/${documentId}/analysis`, {
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
    console.error('Errore nel reset dell\'analisi:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
} 