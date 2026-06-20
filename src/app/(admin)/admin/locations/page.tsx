import React from 'react'
import { getCurrentUser } from '@/lib/auth'
import LocationsManager from '@/components/admin/LocationsManager'

export default async function LocationsPage() {
  const current = await getCurrentUser()
  if (!current || !['ROOT_ADMIN','SUB_ADMIN'].includes(current.role) || current.status !== 'APPROVED') return <div>Unauthorized</div>

  return (
    <section className="admin container">
      <h1>Locations</h1>
      <LocationsManager />
    </section>
  )
}
