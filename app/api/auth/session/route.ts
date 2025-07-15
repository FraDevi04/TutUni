import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ 
        authenticated: false, 
        message: 'No active session' 
      }, { status: 401 })
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role
      },
      sessionExpiry: session.expires
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ 
      authenticated: false, 
      error: 'Session check failed' 
    }, { status: 500 })
  }
} 