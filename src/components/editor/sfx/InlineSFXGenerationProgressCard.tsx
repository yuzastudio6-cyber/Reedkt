import { Badge } from '../../Badge'
import { AIProgressStepList } from '../AIProgressStepList'

type InlineSFXGenerationProgressCardProps = {
  activeIndex: number
  complete: boolean
  steps: string[]
}

export function InlineSFXGenerationProgressCard({
  activeIndex,
  complete,
  steps,
}: InlineSFXGenerationProgressCardProps) {
  return (
    <section className="inline-chat-card sfx-inline-card sfx-generation-progress-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">SFX progress</span>
          <h3>{complete ? 'SFX ready for QA review' : 'Preparing SFX cues'}</h3>
        </div>
        <Badge accent={complete ? 'success' : 'cyan'}>{complete ? 'Complete' : 'Progress'}</Badge>
      </div>
      <AIProgressStepList activeIndex={activeIndex} steps={steps} />
      <p className="sfx-muted-note">SFX preparation is waiting for approval; audio preparation, private storage writes, background jobs, and rendering remain disabled.</p>
    </section>
  )
}
