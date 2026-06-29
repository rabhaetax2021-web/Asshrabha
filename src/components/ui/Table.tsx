"use client"
import { cn } from '@/lib/utils/helpers'

export default function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="ui-table-wrap" style={{ overflowX: 'auto' }}>
      <table className={cn('ui-table', className)} style={{ width: '100%', borderCollapse: 'collapse' }}>
        {children}
      </table>
    </div>
  )
}
