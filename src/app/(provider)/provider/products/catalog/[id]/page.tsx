import React from 'react'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import dynamic from 'next/dynamic'
const AddListingForm = dynamic(() => import('@/components/provider/AddListingForm'))

export default async function AddListingPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = await params
  const id = resolvedParams?.id
  if (!id) return <div>Missing product id</div>
  const catalog = await prisma.catalogProduct.findUnique({
    where: { id },
    select: {
      id: true,
      nameEN: true,
      nameAR: true,
      descriptionEN: true,
      descriptionAR: true,
      images: true,
      wholesaleMinPrice: true,
      wholesaleMaxPrice: true,
      retailMinPrice: true,
      retailMaxPrice: true,
      unitType: true,
      unitRanges: true,
    },
  })
  if (!catalog) return <div>Product not found</div>

  const current = await getCurrentUser()
  let existingListing: { id: string; status: string } | null = null
  if (current?.role === 'PROVIDER' && current.status === 'APPROVED') {
    const profile = await prisma.providerProfile.findUnique({ where: { userId: current.id } })
    if (profile) {
      existingListing = await prisma.providerProduct.findFirst({
        where: { providerId: profile.id, catalogProductId: id },
        select: { id: true, status: true },
      })
    }
  }

  return (
    <section className="add-listing container">
      <h1>Add Listing for {catalog.nameEN || catalog.nameAR}</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>
        <div>
          <p>{catalog.descriptionEN || catalog.descriptionAR || 'No description available.'}</p>
          <div style={{ display: 'grid', gap: 8, marginTop: 'var(--space-4)' }}>
            <div><strong>Wholesale range:</strong> {catalog.wholesaleMinPrice} - {catalog.wholesaleMaxPrice} EGP</div>
            <div><strong>Retail range:</strong> {catalog.retailMinPrice} - {catalog.retailMaxPrice} EGP</div>
            <div><strong>Unit type:</strong> {catalog.unitType}</div>
            {catalog.unitRanges && catalog.unitRanges.length > 0 && (
              <div>
                <strong>Available unit options:</strong>
                <ul style={{ marginTop: 8, paddingLeft: 18 }}>
                  {catalog.unitRanges.map((range) => (
                    <li key={range.id}>{range.unitType}: {range.minPrice} - {range.maxPrice} EGP</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        <aside>
          {catalog.images?.length > 0 ? (
            <img src={catalog.images[0]} alt={catalog.nameEN || catalog.nameAR} style={{ width: '100%', borderRadius: '12px', objectFit: 'cover', minHeight: 240 }} />
          ) : (
            <div style={{ width: '100%', minHeight: 240, borderRadius: 12, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No image</div>
          )}
        </aside>
      </div>
      <div style={{ marginTop: 'var(--space-6)' }}>
        {existingListing ? (
          <div className="provider-form-message">
            {existingListing.status === 'PENDING_APPROVAL' ? (
              <div>
                <h3>This product is already listed.</h3>
                <p>Your listing is currently pending approval.</p>
              </div>
            ) : (
              <div>
                <h3>This product is already listed.</h3>
                <p>Your store already has an approved listing for this catalog item.</p>
                <a className="btn btn-primary" href={`/provider/products/edit/${existingListing.id}`}>Edit listing</a>
              </div>
            )}
          </div>
        ) : (
          <AddListingForm catalog={catalog} />
        )}
      </div>
    </section>
  )
}
