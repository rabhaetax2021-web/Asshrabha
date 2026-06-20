import React from 'react'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import dynamic from 'next/dynamic'
const AddListingForm = dynamic(() => import('@/components/provider/AddListingForm'))

export default async function AddListingPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = await params
  const id = resolvedParams?.id
  if (!id) return <div>Missing product id</div>
  const catalog = await prisma.catalogProduct.findUnique({ where: { id }, include: { unitRanges: true } })
  if (!catalog) return <div>Product not found</div>

  const current = await getCurrentUser()
  let providerId = ''
  if (current) {
    const profile = await prisma.providerProfile.findUnique({ where: { userId: current.id } })
    if (profile) providerId = profile.id
  }

  return (
    <section className="add-listing container">
      <h1>Add Listing for {catalog.nameEN || catalog.nameAR}</h1>
      {/* Client form handles submission and shows a popup */}
      <AddListingForm catalog={catalog} providerId={providerId} />
    </section>
  )
}
