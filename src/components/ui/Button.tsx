"use client"
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/helpers'

type Variant = 'primary' | 'outline' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }

export default function Button({ children, className, variant = 'primary', size = 'md', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'btn',
        variant === 'primary' ? 'btn-primary' : variant === 'outline' ? 'btn-outline' : 'btn-ghost',
        size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : undefined,
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
