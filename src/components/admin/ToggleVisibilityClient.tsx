"use client"
import React from 'react'
import ToggleVisibilityButton from './ToggleVisibilityButton'

export default function ToggleVisibilityClient({ providerId, visible }: { providerId: string, visible: boolean }) {
  return <ToggleVisibilityButton providerId={providerId} visible={visible} />
}
