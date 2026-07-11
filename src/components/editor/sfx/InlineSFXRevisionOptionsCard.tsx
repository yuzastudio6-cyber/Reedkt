import { Button } from '../../Button'

type InlineSFXRevisionOptionsCardProps = {
  onChoose: (message: string) => void
}

const revisionOptions = [
  ['Make quieter', 'I will lower SFX volume and keep the speaker first.'],
  ['Trim again', 'I marked this SFX for another trim and hit-alignment pass.'],
  ['Regenerate', 'I marked this sound for regeneration planning. Audio preparation remains gated.'],
  ['Replace with library', 'I will prefer an approved internal library cue.'],
  ['Use draft route', 'I will route this as a draft/fallback cue.'],
  ['Use production route', 'I will route key final-polish SFX to production-quality planning.'],
  ['Remove SFX', 'I removed this SFX from the plan.'],
  ['Keep ambience only', 'I will preserve natural ambience and skip decorative SFX here.'],
  ['Approve this SFX', 'This SFX is approved for internal review, pending the overall edit approval gate.'],
  ['No source-footage sounds', 'I will keep source-footage SFX disabled unless you ask for full sound design.'],
] as const

export function InlineSFXRevisionOptionsCard({ onChoose }: InlineSFXRevisionOptionsCardProps) {
  return (
    <section className="inline-chat-card sfx-inline-card sfx-revision-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">SFX revisions</span>
          <h3>Choose an SFX revision</h3>
        </div>
      </div>
      <div className="sfx-revision-grid">
        {revisionOptions.map(([label, message]) => (
          <Button key={label} onClick={() => onChoose(message)} variant={label === 'Regenerate' ? 'secondary' : 'ghost'}>
            {label}
          </Button>
        ))}
      </div>
    </section>
  )
}
