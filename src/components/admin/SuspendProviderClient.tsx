"use client"
import React from 'react'
import SuspendProviderButton from './SuspendProviderButton'

export default function SuspendProviderClient({ providerId }: { providerId: string }) {
  return <SuspendProviderButton providerId={providerId} />
}
