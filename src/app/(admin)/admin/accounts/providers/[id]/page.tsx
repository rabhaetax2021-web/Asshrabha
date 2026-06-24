import React from 'react'
import { getProviderById } from '@/lib/actions/admin.actions'
import ProviderActions from '@/components/admin/ProviderActions'
import SaveLocationButton from '@/components/admin/SaveLocationButton'

type Props = { params: Promise<{ id: string }> }

export default async function ProviderDetailPage({ params }: Props) {
  const { id } = await params
  const provider = await getProviderById(id)

  if (!provider) return <div>Provider not found</div>

  return (
    <section className="provider-detail container">
      <h1>Provider: {provider.shopNameEN || provider.shopNameAR}</h1>

      <div className="provider-grid">
        <div className="card">
          <h3>Owner</h3>
          <p>{provider.user?.nameEN || provider.user?.nameAR}</p>
          <p>{provider.user?.mobile}</p>
          <p>Status: {provider.user?.status}</p>
        </div>

        <div className="card">
          <h3>Store</h3>
          <p>Visible: {provider.isVisible ? 'Yes' : 'No'}</p>
          <p>Rating: {provider.rating ?? 0}</p>
          <p>Products: {provider.products?.length ?? 0}</p>
          <SaveLocationButton providerId={provider.id} initialLat={provider.locationLat ?? null} initialLng={provider.locationLng ?? null} />
        </div>
      </div>

      <ProviderActions providerId={provider.id} />
    </section>
  )
}
