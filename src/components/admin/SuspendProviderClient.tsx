"use client"

import SuspendProviderButton from './SuspendProviderButton'

export default function SuspendProviderClient({ providerId }: { providerId: string }) {
  return <SuspendProviderButton providerId={providerId} />
}
