import { Network } from 'lucide-react'
import { Button } from '../../Button'

type EditMapEmptyStateProps = {
  previewReady?: boolean
  onCreateEditMap?: () => void
}

export function EditMapEmptyState({ onCreateEditMap, previewReady = false }: EditMapEmptyStateProps) {
  return (
    <section className="inline-chat-card edit-map-empty-state">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Edit Map</span>
          <h3>Open Edit Map</h3>
        </div>
      </div>
      <p className="inline-helper">
        After preview is ready, ReeditPro can turn the result into connected editable systems: captions, B-roll, overlays,
        audio, design, and platform layout.
      </p>
      {!previewReady && (
        <p className="inline-helper">Edit Map becomes available after the private review is ready.</p>
      )}
      <div className="inline-card-actions">
        <Button disabled={!previewReady} icon={Network} onClick={onCreateEditMap} variant="primary">
          Create Edit Map
        </Button>
      </div>
    </section>
  )
}
