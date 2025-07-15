import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Call the FastAPI backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    const response = await fetch(`${backendUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      // Handle FastAPI validation errors
      if (data.detail && Array.isArray(data.detail)) {
        const validationErrors = data.detail.map((error: any) => error.msg).join(', ')
        return NextResponse.json(
          { message: validationErrors },
          { status: response.status }
        )
      }
      
      return NextResponse.json(
        { message: data.detail || 'Errore nel login' },
        { status: response.status }
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { message: 'Errore interno del server' },
      { status: 500 }
    )
  }
} 