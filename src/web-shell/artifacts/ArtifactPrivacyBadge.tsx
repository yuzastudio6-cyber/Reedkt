import { LockKeyhole } from 'lucide-react'
import { StatusBadge } from '../components/StatusBadge'

export function ArtifactPrivacyBadge() {
  return (
    <StatusBadge tone="private">
      <LockKeyhole aria-hidden="true" size={14} />
      Private
    </StatusBadge>
  )
}
