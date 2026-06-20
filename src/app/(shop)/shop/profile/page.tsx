import React from 'react'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import Link from 'next/link'
import ProfileActions from '@/components/shop/ProfileActions'

export default async function ProfilePage() {
  const current = await getCurrentUser()
  if (!current) return <div className="container" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Please login</div>

  // Fetch full user data with stats
  const fullUser = await prisma.user.findUnique({
    where: { id: current.id },
    include: {
      addresses: true,
      wallet: true,
      _count: {
        select: {
          customerOrders: true,
          reviews: true,
          addresses: true,
        }
      }
    }
  })

  if (!fullUser) return <div className="container" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>User not found</div>

  // ── PROVIDER PROFILE ──
  if (current.role === 'PROVIDER') {
    const profile = await prisma.providerProfile.findFirst({
      where: { userId: current.id },
      include: {
        user: true,
        products: { where: { status: 'APPROVED' } },
        deliveryZones: true,
        _count: {
          select: {
            products: true,
            orders: true,
            reviews: true,
          }
        }
      }
    })
    if (!profile) return <div className="container" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>No store profile</div>

    const pending = await prisma.providerProfileEdit.findFirst({
      where: { providerId: profile.id, status: 'PENDING' },
      orderBy: { createdAt: 'desc' }
    })

    const ratingStars = profile.rating > 0
      ? Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < Math.round(profile.rating) ? '#fbbf24' : 'var(--gray-400)' }}>★</span>
      ))
      : null

    const firstLetter = (profile.shopNameEN || profile.shopNameAR || 'S')?.charAt(0).toUpperCase()

    return (
      <section className="profile container">
        {/* Store Banner */}
        {profile.banner && (
          <div style={{
            width: '100%',
            height: '160px',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            marginBottom: 'var(--space-6)',
            position: 'relative',
          }}>
            <img src={profile.banner} alt="Store banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, transparent 40%, rgba(15,15,35,0.8) 100%)'
            }} />
          </div>
        )}

        {/* Profile Header Card */}
        <div className="card" style={{
          padding: 'var(--space-6)',
          marginBottom: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 'var(--space-4)',
        }}>
          {/* Logo / Avatar */}
          <div style={{
            width: '100px', height: '100px', borderRadius: 'var(--radius-xl)',
            background: profile.logo ? 'transparent' : 'var(--gradient-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', color: 'white',
            boxShadow: 'var(--shadow-primary-lg)',
            overflow: 'hidden', border: '3px solid var(--bg-elevated)',
            marginTop: profile.banner ? '-70px' : 0,
            position: 'relative', zIndex: 2,
          }}>
            {profile.logo ? <img src={profile.logo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : firstLetter}
          </div>

          <div>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>
              {profile.shopNameEN || profile.shopNameAR}
            </h1>
            {profile.shopNameEN && profile.shopNameAR && profile.shopNameEN !== profile.shopNameAR && (
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>{profile.shopNameAR}</p>
            )}
          </div>

          {/* Badges Row */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span className="badge" style={{
              background: 'var(--gradient-primary)', color: 'white', padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)'
            }}>🏪 Store Owner</span>
            <span className={`badge ${profile.isVisible ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: 'var(--text-xs)' }}>
              {profile.isVisible ? '✅ Visible' : '⏳ Hidden'}
            </span>
            {pending && (
              <span className="badge badge-warning" style={{ fontSize: 'var(--text-xs)' }}>
                ⏳ Edit Pending Approval
              </span>
            )}
          </div>

          {/* Rating */}
          {ratingStars && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
              <span>{ratingStars}</span>
              <span style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>{profile.rating.toFixed(1)}</span>
              <span style={{ color: 'var(--text-muted)' }}>({profile.reviewCount} reviews)</span>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-6)'
        }}>
          <StatCard label="Products" value={profile._count.products} icon="📦" />
          <StatCard label="Orders" value={profile._count.orders} icon="📋" />
          <StatCard label="Reviews" value={profile._count.reviews} icon="⭐" />
          <StatCard label="Delivery Zones" value={profile.deliveryZones.length} icon="🚚" />
        </div>

        {/* Details Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          {/* Owner Info */}
          <DetailCard title="Owner Information" icon="👤">
            <DetailRow label="Name" value={profile.user?.nameEN || profile.user?.nameAR || '—'} />
            <DetailRow label="Phone" value={profile.user?.mobile || '—'} />
            <DetailRow label="Email" value={profile.user?.email || '—'} />
          </DetailCard>

          {/* Store Description */}
          {(profile.descriptionEN || profile.descriptionAR) && (
            <DetailCard title="About Store" icon="📝">
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
                {profile.descriptionEN || profile.descriptionAR}
              </p>
              {profile.descriptionEN && profile.descriptionAR && profile.descriptionEN !== profile.descriptionAR && (
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', lineHeight: 1.6, marginTop: 'var(--space-2)', borderTop: '1px solid var(--border-light)', paddingTop: 'var(--space-2)' }}>
                  {profile.descriptionAR}
                </p>
              )}
            </DetailCard>
          )}

          {/* Location */}
          {(profile.locationAddress || (typeof profile.locationLat === 'number' && typeof profile.locationLng === 'number')) && (
            <DetailCard title="Location" icon="📍">
              {profile.locationAddress && <DetailRow label="Address" value={profile.locationAddress} />}
              {typeof profile.locationLat === 'number' && typeof profile.locationLng === 'number' && (
                <DetailRow label="Coordinates" value={`${profile.locationLat.toFixed(6)}, ${profile.locationLng.toFixed(6)}`} />
              )}
              {profile.locationPhoto && (
                <div style={{ marginTop: 'var(--space-3)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                  <img src={profile.locationPhoto} alt="Location" style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }} />
                </div>
              )}
            </DetailCard>
          )}

          {/* Member Since */}
          <DetailCard title="Account Info" icon="📅">
            <DetailRow label="Member Since" value={new Date(fullUser.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} />
            <DetailRow label="Last Updated" value={new Date(profile.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} />
            <DetailRow label="Language" value={fullUser.locale === 'ar' ? 'العربية' : 'English'} />
          </DetailCard>
        </div>

        <ProfileActions />
      </section>
    )
  }

  // ── CUSTOMER PROFILE ──
  const firstLetter = (fullUser.nameEN || fullUser.nameAR || fullUser.mobile || 'U')?.charAt(0).toUpperCase()
  const displayName = fullUser.nameEN || fullUser.nameAR || fullUser.mobile

  return (
    <section className="profile container">
      {/* Profile Header Card */}
      <div className="card" style={{
        padding: 'var(--space-6)',
        marginBottom: 'var(--space-6)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 'var(--space-4)',
      }}>
        {/* Avatar */}
        <div style={{
          width: '96px', height: '96px', borderRadius: '50%',
          background: fullUser.avatar ? 'transparent' : 'var(--gradient-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', color: 'white',
          boxShadow: 'var(--shadow-primary-lg)',
          overflow: 'hidden', border: '3px solid var(--bg-elevated)',
        }}>
          {fullUser.avatar ? (
            <img src={fullUser.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            firstLetter
          )}
        </div>

        <div>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>
            {displayName}
          </h1>
          {fullUser.nameEN && fullUser.nameAR && fullUser.nameEN !== fullUser.nameAR && (
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>{fullUser.nameAR}</p>
          )}
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span className="badge" style={{
            background: 'var(--gradient-primary)', color: 'white', padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)'
          }}>
            🛒 Customer
          </span>
          <StatusBadge status={fullUser.status} />
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-6)'
      }}>
        <StatCard label="Orders" value={fullUser._count.customerOrders} icon="📋" />
        <StatCard label="Reviews" value={fullUser._count.reviews} icon="⭐" />
        <StatCard label="Addresses" value={fullUser._count.addresses} icon="📍" />
        <StatCard label="Wallet" value={`${(fullUser.wallet?.availableBalance || 0).toFixed(0)} EGP`} icon="💰" />
      </div>

      {/* Details Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <DetailCard title="Contact Information" icon="📞">
          <DetailRow label="Phone" value={fullUser.mobile} />
          <DetailRow label="Email" value={fullUser.email || '—'} />
        </DetailCard>

        <DetailCard title="Account Details" icon="⚙️">
          <DetailRow label="Account Type" value={fullUser.role.replace('_', ' ')} />
          <DetailRow label="Language" value={fullUser.locale === 'ar' ? 'العربية' : 'English'} />
          <DetailRow label="Member Since" value={new Date(fullUser.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} />
          <DetailRow label="Last Login" value={fullUser.lastLoginAt ? new Date(fullUser.lastLoginAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'} />
        </DetailCard>

        {/* Saved Addresses */}
        {fullUser.addresses.length > 0 && (
          <DetailCard title="Saved Addresses" icon="🏠">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {fullUser.addresses.map((addr) => (
                <div key={addr.id} style={{
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)',
                  border: addr.isDefault ? '1px solid var(--primary-300)' : '1px solid var(--border-light)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-1)' }}>
                    <span style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{addr.label}</span>
                    {addr.isDefault && <span className="badge badge-success" style={{ fontSize: 'var(--text-2xs)' }}>Default</span>}
                  </div>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    {addr.fullName} · {addr.mobile}
                  </p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
                    {addr.addressLine}, {addr.city}{addr.area ? `, ${addr.area}` : ''}
                  </p>
                </div>
              ))}
            </div>
          </DetailCard>
        )}
      </div>

      <ProfileActions />
    </section>
  )
}

// ── Sub-components ──

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="card" style={{
      padding: 'var(--space-4)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: 'var(--space-2)',
    }}>
      <span style={{ fontSize: 'var(--text-2xl)' }}>{icon}</span>
      <span style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)' }}>{value}</span>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
    </div>
  )
}

function DetailCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 'var(--space-4)' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
        marginBottom: 'var(--space-4)',
        paddingBottom: 'var(--space-3)',
        borderBottom: '1px solid var(--border-light)',
      }}>
        <span style={{ fontSize: 'var(--text-lg)' }}>{icon}</span>
        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: 'var(--space-2) 0',
      borderBottom: '1px solid var(--border-light)',
    }}>
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', minWidth: '100px' }}>{label}</span>
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 'var(--font-medium)', textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    ACTIVE: { bg: 'hsl(142, 71%, 92%)', color: 'var(--success-dark)' },
    PENDING: { bg: 'hsl(38, 92%, 92%)', color: 'var(--warning-dark)' },
    DISABLED: { bg: 'hsl(0, 84%, 93%)', color: 'var(--error-dark)' },
    SUSPENDED: { bg: 'hsl(0, 84%, 93%)', color: 'var(--error-dark)' },
  }
  const c = colors[status] || colors.PENDING
  return (
    <span style={{
      background: c.bg, color: c.color,
      padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-full)',
      fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)'
    }}>
      {status}
    </span>
  )
}
