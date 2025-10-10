"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { Progress } from "./ui/progress"

export function TopLoadingBar() {
  const pathname = usePathname()
  const [progress, setProgress] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    setIsLoading(true)
    setProgress(30)
    
    const timer1 = setTimeout(() => setProgress(70), 100)
    const timer2 = setTimeout(() => {
      setProgress(100)
      setTimeout(() => setIsLoading(false), 200)
    }, 400)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [pathname])

  if (!isLoading) return null

  return (
    <div className="fixed left-0 top-0 z-50 w-full">
      <Progress 
        value={progress} 
        className="h-1 rounded-none bg-transparent"
      />
    </div>
  )
}
