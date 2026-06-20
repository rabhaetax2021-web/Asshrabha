import React from 'react'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import EditProfileForm from '@/components/shop/EditProfileForm'
import CustomerEditForm from '@/components/shop/CustomerEditForm'

export default async function EditProfilePage() {
  const current = await getCurrentUser()
  if (!current) return <div>No user</div>

  if (current.role === 'PROVIDER') {
    const profile = await prisma.providerProfile.findFirst({ where: { userId: current.id } })
    if (!profile) return <div>No store profile</div>

    // pass current user basic info too
    const user = await prisma.user.findUnique({ where: { id: current.id }, select: { mobile: true, nameEN: true, nameAR: true } })

    return (
      <section className="profile container">
        <h1>Edit Store Profile</h1>
        <EditProfileForm profile={profile} user={user} />
      </section>
    )
  }

  // non-provider: render customer edit form
  const fullUser = await prisma.user.findUnique({ where: { id: current.id } })
  if (!fullUser) return <div>User not found</div>

  return (
    <section className="profile container">
      <h1>Edit Profile</h1>
      <CustomerEditForm user={fullUser} />
    </section>
  )
}
