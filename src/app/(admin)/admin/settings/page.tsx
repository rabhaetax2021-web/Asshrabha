import React from 'react'
import { prisma } from '@/lib/prisma'

export default async function AdminSettingsPage() {
  const settings = await prisma.systemSetting.findMany()

  return (
    <section className="admin-settings container">
      <h1>Settings</h1>
      <ul>
        {settings.map(s => (
          <li key={s.key}>{s.key}: {s.value}</li>
        ))}
      </ul>
    </section>
  )
}
