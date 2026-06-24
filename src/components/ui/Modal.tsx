"use client"
import React from 'react'

export default function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />
      <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 20, minWidth: 320, maxWidth: '90%', zIndex: 201 }}>
        {children}
      </div>
    </div>
  )
}
