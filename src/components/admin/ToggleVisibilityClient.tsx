"use client"

import ToggleVisibilityButton from './ToggleVisibilityButton'

export default function ToggleVisibilityClient({ providerId, visible }: { providerId: string, visible: boolean }) {
  return <ToggleVisibilityButton providerId={providerId} visible={visible} />
}
