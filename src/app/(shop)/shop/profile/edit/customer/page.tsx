import React from 'react'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import CustomerEditForm from '@/components/shop/CustomerEditForm'

export default async function CustomerEditPage() {
  const current = await getCurrentUser()
  if (!current) return <div>Please login</div>

  const user = await prisma.user.findUnique({ where: { id: current.id } })
  if (!user) return <div>User not found</div>

  return (
    <section className="profile container">
      <h1>Edit Profile</h1>
      <CustomerEditForm user={user} />
    </section>
  )
}
