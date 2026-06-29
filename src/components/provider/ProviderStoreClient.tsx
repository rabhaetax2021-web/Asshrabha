"use client"

import UserAvatarForm from '@/components/profile/UserAvatarForm'
import ProviderStoreForm from '@/components/provider/ProviderStoreForm'

export default function ProviderStoreClient({ provider }: { provider: any }) {
  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <h4>Your profile</h4>
        <div style={{ marginTop: 8 }}>
          <UserAvatarForm initialAvatar={provider?.user?.avatar} />
        </div>
      </div>
      <ProviderStoreForm provider={provider} />
    </div>
  )
}
