'use client'

import { useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { 
  User, 
  Settings, 
  CreditCard, 
  LogOut, 
  Crown,
  FileText,
  BarChart3,
  HelpCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function UserDropdown() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    setIsOpen(false)
    await signOut({ 
      callbackUrl: '/',
      redirect: true 
    })
  }

  const userInitials = session?.user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'U'

  const userRole = session?.user?.role || 'free'
  const isPro = userRole === 'pro' || userRole === 'premium'

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center space-x-2 h-auto p-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={session?.user?.image || ''} />
            <AvatarFallback className="bg-indigo-100 text-indigo-600 text-sm">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start text-sm">
            <span className="font-medium">
              {session?.user?.name || 'Utente'}
            </span>
            <div className="flex items-center space-x-1">
              {isPro ? (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs px-1.5 py-0">
                  <Crown className="h-3 w-3 mr-1" />
                  Pro
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs px-1.5 py-0">
                  Free
                </Badge>
              )}
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {session?.user?.name || 'Utente'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {session?.user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => {
            window.location.href = '/profile'
            setIsOpen(false)
          }}
        >
          <User className="mr-2 h-4 w-4" />
          <span>Profilo</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => {
            window.location.href = '/dashboard/analytics'
            setIsOpen(false)
          }}
        >
          <BarChart3 className="mr-2 h-4 w-4" />
          <span>Statistiche</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => {
            window.location.href = '/documents'
            setIsOpen(false)
          }}
        >
          <FileText className="mr-2 h-4 w-4" />
          <span>I Miei Documenti</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {!isPro && (
          <DropdownMenuItem
            className="cursor-pointer text-yellow-600"
            onClick={() => {
              window.location.href = '/upgrade'
              setIsOpen(false)
            }}
          >
            <Crown className="mr-2 h-4 w-4" />
            <span>Passa a Pro</span>
          </DropdownMenuItem>
        )}
        
        {isPro && (
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => {
              window.location.href = '/billing'
              setIsOpen(false)
            }}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Fatturazione</span>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => {
            window.location.href = '/settings'
            setIsOpen(false)
          }}
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Impostazioni</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => {
            window.location.href = '/help'
            setIsOpen(false)
          }}
        >
          <HelpCircle className="mr-2 h-4 w-4" />
          <span>Aiuto</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Disconnetti</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 