import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { projectId } = params
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') || '50'
    const offset = searchParams.get('offset') || '0'

    // Forward request to FastAPI backend
    const response = await fetch(
      `${process.env.BACKEND_URL}/chat/projects/${projectId}/history?limit=${limit}&offset=${offset}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.user.id}`, // Use user ID for now
        },
      }
    )

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { error: error.detail || 'Failed to fetch chat history' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching chat history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { projectId } = params

    // Forward request to FastAPI backend
    const response = await fetch(
      `${process.env.BACKEND_URL}/chat/projects/${projectId}/history`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.user.id}`, // Use user ID for now
        },
      }
    )

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { error: error.detail || 'Failed to clear chat history' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error clearing chat history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 