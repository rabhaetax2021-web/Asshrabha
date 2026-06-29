"use client"
import * as Lucide from 'lucide-react'

export default function Icon({ name, size = 18, className }: { name: string; size?: number; className?: string }) {
  const Comp = (Lucide as any)[name] || Lucide.Square
  return <Comp size={size} className={className} aria-hidden="true" />
}
