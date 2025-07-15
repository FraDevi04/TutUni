'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error('Tutti i campi sono obbligatori')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Le password non corrispondono')
      return
    }

    if (formData.password.length < 6) {
      toast.error('La password deve essere di almeno 6 caratteri')
      return
    }

    // Enhanced password validation to match backend requirements
    const passwordRegex = {
      hasLowercase: /[a-z]/.test(formData.password),
      hasUppercase: /[A-Z]/.test(formData.password),
      hasNumber: /\d/.test(formData.password),
    }

    if (!passwordRegex.hasLowercase) {
      toast.error('La password deve contenere almeno una lettera minuscola')
      return
    }

    if (!passwordRegex.hasUppercase) {
      toast.error('La password deve contenere almeno una lettera maiuscola')
      return
    }

    if (!passwordRegex.hasNumber) {
      toast.error('La password deve contenere almeno un numero')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error('Inserisci un indirizzo email valido')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Errore nella registrazione')
      }

      toast.success('Registrazione completata con successo!')
      
      // Auto-login after successful registration
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false
      })

      if (result?.ok) {
        router.push('/dashboard')
      } else {
        router.push('/auth/login')
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast.error(error instanceof Error ? error.message : 'Errore nella registrazione')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Registrati
          </CardTitle>
          <CardDescription>
            Crea un account per accedere a TutUni AI
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                Nome completo
              </Label>
              <div className="relative">
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="pl-10"
                  placeholder="Il tuo nome completo"
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10"
                  placeholder="tua@email.com"
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 pr-10"
                  placeholder="Crea una password"
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="text-xs text-gray-500">
                <p>La password deve contenere:</p>
                <ul className="mt-1 space-y-1">
                  <li className={`${/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                    • Almeno una lettera minuscola
                  </li>
                  <li className={`${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                    • Almeno una lettera maiuscola
                  </li>
                  <li className={`${/\d/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                    • Almeno un numero
                  </li>
                  <li className={`${formData.password.length >= 6 ? 'text-green-600' : 'text-gray-500'}`}>
                    • Almeno 6 caratteri
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Conferma Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pl-10 pr-10"
                  placeholder="Conferma la password"
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Registrazione in corso...' : 'Registrati'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Hai già un account?{' '}
              <Link 
                href="/auth/login" 
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Accedi
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 