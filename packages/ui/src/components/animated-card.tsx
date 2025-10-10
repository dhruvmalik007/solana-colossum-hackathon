"use client"

import * as React from "react"
import { motion } from "motion/react"
import { Card } from "./ui/card"
import { cn } from "@repo/ui/lib/utils"

interface AnimatedCardProps extends React.ComponentProps<typeof Card> {
  children: React.ReactNode
  hoverScale?: number
  className?: string
}

export function AnimatedCard({ 
  children, 
  hoverScale = 1.02, 
  className,
  ...props 
}: AnimatedCardProps) {
  return (
    <motion.div
      whileHover={{ scale: hoverScale, y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card className={cn("transition-shadow hover:shadow-lg", className)} {...props}>
        {children}
      </Card>
    </motion.div>
  )
}
