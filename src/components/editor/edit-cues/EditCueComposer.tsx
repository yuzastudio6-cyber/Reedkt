import { ListPlus } from 'lucide-react'
import { Button } from '../../Button'

type EditCueComposerProps = {
  onCreateCue?: () => void
}

export function EditCueComposer({ onCreateCue }: EditCueComposerProps) {
  return (
    <section className="inline-chat-card edit-cue-composer">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">New cue</span>
          <h3>Add a precise instruction</h3>
        </div>
      </div>
      <p className="inline-helper">
        Tell AI where a clip, overlay, caption, sound, or rule should apply.
      </p>
      <Button icon={ListPlus} onClick={onCreateCue} variant="secondary">
        Add Cue
      </Button>
    </section>
  )
}
