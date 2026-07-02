import { Button } from '../../Button'

type InlineMusicRevisionOptionsCardProps = {
  onChoose: (message: string) => void
}

const revisionOptions = [
  ['Make it instrumental', 'I will revise the mock music plan to make cues instrumental-first.'],
  ['Lower energy', 'I will lower music energy in the mock plan before any generation.'],
  ['Remove vocals', 'I will remove vocals and keep speech sections clear.'],
  ['Make it more cinematic', 'I will shift the mock prompt toward a more cinematic travel feel.'],
  ['Make it more lifestyle', 'I will shift the mock prompt toward a warmer lifestyle feel.'],
  ['Use ambience only', 'I will keep ambience and skip generated music in the mock plan.'],
  ['Regenerate this cue', 'I marked this cue for mock regeneration. No real provider is called.'],
  ['Keep this cue', 'I marked this cue as kept for the mock preview.'],
  ['Use one track only', 'I will simplify the mock cue sheet to one music cue.'],
  ['Add montage vocals only', 'I will allow vocal texture only in no-speech montage sections.'],
] as const

export function InlineMusicRevisionOptionsCard({ onChoose }: InlineMusicRevisionOptionsCardProps) {
  return (
    <section className="inline-chat-card music-inline-card music-revision-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Music revisions</span>
          <h3>Choose a mock music revision</h3>
        </div>
      </div>
      <div className="music-revision-grid">
        {revisionOptions.map(([label, message]) => (
          <Button key={label} onClick={() => onChoose(message)} variant={label.includes('Regenerate') ? 'secondary' : 'ghost'}>
            {label}
          </Button>
        ))}
      </div>
    </section>
  )
}
