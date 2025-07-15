import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    // Proxy to backend
    const response = await fetch(`${BACKEND_URL}/projects`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json({ error: 'Errore backend' }, { status: response.status })
    }

    const projects = await response.json()
    return NextResponse.json(projects)
  } catch (error) {
    console.error('Projects GET error:', error)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/projects called')
    const session = await getServerSession(authOptions)
    console.log('Session:', session ? 'exists' : 'null')
    console.log('Access token:', session?.accessToken ? `${session.accessToken.slice(0, 20)}...` : 'null')
    
    if (!session?.accessToken) {
      console.log('No session or access token')
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Request body:', body)
    
    // Validate input
    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ error: 'Il titolo è obbligatorio' }, { status: 400 })
    }

    if (body.title.length > 200) {
      return NextResponse.json({ error: 'Il titolo è troppo lungo (max 200 caratteri)' }, { status: 400 })
    }

    if (body.description && body.description.length > 1000) {
      return NextResponse.json({ error: 'La descrizione è troppo lunga (max 1000 caratteri)' }, { status: 400 })
    }

    // Proxy to backend
    console.log('Calling backend:', `${BACKEND_URL}/projects`)
    const projectData = {
      title: body.title.trim(),
      description: body.description?.trim() || ''
    }
    console.log('Sending to backend:', projectData)

    const response = await fetch(`${BACKEND_URL}/projects`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData),
    })

    console.log('Backend response status:', response.status)

    if (!response.ok) {
      const error = await response.text()
      console.error('Backend error:', error)
      return NextResponse.json({ error: 'Errore nella creazione del progetto' }, { status: response.status })
    }

    const project = await response.json()
    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Projects POST error:', error)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
} 