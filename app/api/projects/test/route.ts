import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    return NextResponse.json({
      debug: true,
      hasSession: !!session,
      sessionUser: session?.user || null,
      hasAccessToken: !!session?.accessToken,
      accessTokenLength: session?.accessToken?.length || 0,
      accessTokenPreview: session?.accessToken ? session.accessToken.substring(0, 20) + '...' : null
    })
  } catch (error) {
    return NextResponse.json({
      debug: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 