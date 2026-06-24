"use client"
import React from 'react'

export default function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`ui-table-wrap`} style={{ overflowX: 'auto' }}>
      <table className={`ui-table ${className || ''}`} style={{ width: '100%', borderCollapse: 'collapse' }}>
        {children}
      </table>
    </div>
  )
}
