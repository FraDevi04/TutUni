import React from "react"
import { cn } from "@/lib/utils"

interface TabsProps {
  defaultValue?: string
  className?: string
  children: React.ReactNode
}

interface TabsListProps {
  className?: string
  children: React.ReactNode
}

interface TabsTriggerProps {
  value: string
  className?: string
  children: React.ReactNode
}

interface TabsContentProps {
  value: string
  className?: string
  children: React.ReactNode
}

const TabsContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
}>({
  value: '',
  onValueChange: () => {}
})

const Tabs = ({ defaultValue = '', className, children }: TabsProps) => {
  const [value, setValue] = React.useState(defaultValue)

  return (
    <TabsContext.Provider value={{ value, onValueChange: setValue }}>
      <div className={cn("w-full", className)}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

const TabsList = ({ className, children }: TabsListProps) => {
  return (
    <div className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500",
      className
    )}>
      {children}
    </div>
  )
}

const TabsTrigger = ({ value, className, children }: TabsTriggerProps) => {
  const { value: currentValue, onValueChange } = React.useContext(TabsContext)
  const isActive = currentValue === value

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900",
        className
      )}
      onClick={() => onValueChange(value)}
    >
      {children}
    </button>
  )
}

const TabsContent = ({ value, className, children }: TabsContentProps) => {
  const { value: currentValue } = React.useContext(TabsContext)
  
  if (currentValue !== value) {
    return null
  }

  return (
    <div className={cn(
      "mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2",
      className
    )}>
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent } 