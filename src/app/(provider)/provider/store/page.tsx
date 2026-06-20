import React from 'react'
import { getFirstProvider } from '@/lib/actions/provider.actions'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ProviderStoreForm from '@/components/provider/ProviderStoreForm'
import ProviderStoreClient from '@/components/provider/ProviderStoreClient'

export default async function StorePage() {
  // Load the provider for the current logged-in user
  const current = await getCurrentUser()
  if (!current) return <div>Please sign in as a provider to manage your store.</div>

  const provider = await prisma.providerProfile.findFirst({ where: { userId: current.id }, include: { user: true } })
  if (!provider) return <div>No provider account found for your user.</div>

  return (
    <section className="provider-store container">
      <h1>Store Profile</h1>
      <div className="store-grid">
        <div className="store-card">
          <h3>Store Details</h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
            {provider.logo ? (
              <img src={provider.logo} alt="logo" style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8 }} />
            ) : (
              <div style={{ width: 96, height: 96, borderRadius: 8, background: '#f3f3f3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{(provider.shopNameEN || provider.shopNameAR || 'S')?.charAt(0)}</div>
            )}
            <div style={{ minWidth: 0 }}>
              <h4 style={{ margin: 0 }}>{provider.shopNameEN || provider.shopNameAR}</h4>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>{provider.user?.nameEN || provider.user?.nameAR}</div>
                {provider.user?.avatar && (
                  <img src={provider.user.avatar} alt="user avatar" style={{ width: 40, height: 40, borderRadius: 999, objectFit: 'cover' }} />
                )}
              </div>
            </div>
          </div>

          {provider.banner && <div style={{ marginBottom: 12 }}><img src={provider.banner} alt="banner" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 8 }} /></div>}

          <div style={{ marginBottom: 8 }}><strong>Names:</strong> {provider.shopNameEN || '-'} / {provider.shopNameAR || '-'}</div>
          <div style={{ marginBottom: 8 }}><strong>Descriptions:</strong>
            <div style={{ marginTop: 6 }}>{provider.descriptionEN || '-'} </div>
            <div style={{ marginTop: 6, direction: 'rtl' }}>{provider.descriptionAR || '-'}</div>
          </div>

          {provider.locationPhoto && <div style={{ marginTop: 12 }}><strong>Location Photo</strong><div><img src={provider.locationPhoto} alt="location" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 8 }} /></div></div>}

          <div style={{ marginTop: 12 }}>
            <div><strong>Address:</strong> {provider.locationAddress || '-'}</div>
            <div><strong>Visible:</strong> {provider.isVisible ? 'Yes' : 'No'}</div>
            <div><strong>Rating:</strong> {provider.rating?.toFixed ? provider.rating.toFixed(1) : provider.rating || 0} ({provider.reviewCount || 0} reviews)</div>
            <div><strong>Created:</strong> {new Date(provider.createdAt).toLocaleString()}</div>
            <div><strong>Updated:</strong> {new Date(provider.updatedAt).toLocaleString()}</div>
          </div>

          
        </div>

        <div className="store-form">
          <ProviderStoreClient provider={provider} />
        </div>
      </div>
    </section>
  )
}
