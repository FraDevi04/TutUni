import React from "react"
import { cn } from "@/lib/utils"

interface BadgeProps {
  variant?: "default" | "secondary" | "destructive" | "outline"
  className?: string
  children: React.ReactNode
}

const Badge = ({ variant = "default", className, children }: BadgeProps) => {
  const variants = {
    default: "bg-slate-900 text-slate-50 hover:bg-slate-900/80",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-100/80",
    destructive: "bg-red-500 text-slate-50 hover:bg-red-500/80",
    outline: "border border-slate-200 text-slate-900 hover:bg-slate-100"
  }

  return (
    <div className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2",
      variants[variant],
      className
    )}>
      {children}
    </div>
  )
}

export { Badge } 