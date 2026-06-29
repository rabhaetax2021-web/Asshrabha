"use client"
import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/helpers'

export default function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn('input', className)} />
}
