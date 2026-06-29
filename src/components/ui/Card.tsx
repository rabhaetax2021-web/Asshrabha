"use client"
import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/utils/helpers'

type CardProps = ComponentPropsWithoutRef<'div'> & { elevated?: boolean }

export default function Card({ children, className, elevated = true, style, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={cn('card', elevated && 'glass', className)}
      style={{ padding: 12, borderRadius: 'var(--radius-md)', ...style }}
    >
      {children}
    </div>
  )
}
