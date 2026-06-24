"use client"
import React from 'react'

type CardProps = React.HTMLAttributes<HTMLDivElement> & { elevated?: boolean }

export default function Card({ children, className, elevated = true, ...props }: CardProps) {
  return (
    <div {...props} className={[`card`, elevated ? 'glass' : '', className || ''].join(' ')} style={{ padding: 12, borderRadius: 'var(--radius-md)', ...(props.style as any) }}>
      {children}
    </div>
  )
}
