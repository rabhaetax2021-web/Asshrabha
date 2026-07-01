"use client"

import UserAvatarForm from '@/components/profile/UserAvatarForm'
import ProviderStoreForm from '@/components/provider/ProviderStoreForm'

export default function ProviderStoreClient({ provider }: { provider: any }) {
  return (
    <div>
      <ProviderStoreForm provider={provider} />
    </div>
  )
}
