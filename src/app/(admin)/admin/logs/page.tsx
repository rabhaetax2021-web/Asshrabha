import React from 'react'
import { prisma } from '@/lib/prisma'

export default async function AdminLogsPage() {
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 200 })

  return (
    <section className="admin-logs container">
      <h1>Audit Logs</h1>
      <ul>
        {logs.map(l => (
          <li key={l.id}>{l.createdAt.toISOString()} - {l.action} - {l.entity} - {l.entityId}</li>
        ))}
      </ul>
    </section>
  )
}
