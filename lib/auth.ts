import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { signInSchema } from '@/lib/validations/auth'
import { verifyPassword } from '@/lib/utils/password'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          // Validate input
          const { email, password } = signInSchema.parse(credentials)

          // Call our API to authenticate
          const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
          const response = await fetch(`${backendUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          })

          if (!response.ok) {
            console.error('Auth failed:', response.status, await response.text())
            return null
          }

          const authData = await response.json()
          console.log('[NEXTAUTH DEBUG] Backend auth response:', {
            hasAccessToken: !!authData.access_token,
            tokenLength: authData.access_token?.length || 0,
            tokenPreview: authData.access_token?.slice(0, 20) || 'null'
          })
          
          // Get user profile with the access token
          const userResponse = await fetch(`${backendUrl}/auth/me`, {
            method: 'GET',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authData.access_token}`
            },
          })

          if (!userResponse.ok) {
            console.error('Failed to get user profile:', userResponse.status)
            return null
          }

          const userData = await userResponse.json()
          console.log('[NEXTAUTH DEBUG] User data from backend:', userData)
          
          const userObj = {
            id: userData.id.toString(),
            email: userData.email,
            name: userData.name,
            role: userData.role || 'free',
            accessToken: authData.access_token
          }
          console.log('[NEXTAUTH DEBUG] Returning user object:', {
            ...userObj,
            accessToken: `${userObj.accessToken?.slice(0, 20)}...`
          })

          return userObj
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        console.log('[NEXTAUTH JWT] Received user in JWT callback:', {
          ...user,
          accessToken: `${user.accessToken?.slice(0, 20)}...`
        })
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = user.role
        token.accessToken = user.accessToken
        console.log('[NEXTAUTH JWT] Stored in token:', {
          id: token.id,
          email: token.email,
          name: token.name,
          role: token.role,
          accessToken: `${token.accessToken?.slice(0, 20)}...`
        })
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        console.log('[NEXTAUTH SESSION] Received token in session callback:', {
          id: token.id,
          email: token.email,
          name: token.name,
          role: token.role,
          accessToken: `${token.accessToken?.slice(0, 20)}...`
        })
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.role = token.role as string
        session.accessToken = token.accessToken as string
        console.log('[NEXTAUTH SESSION] Final session:', {
          user: session.user,
          accessToken: `${session.accessToken?.slice(0, 20)}...`
        })
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-key',
} 