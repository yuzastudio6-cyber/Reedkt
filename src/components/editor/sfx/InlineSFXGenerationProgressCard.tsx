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
          <h3>{complete ? 'Mock SFX ready for QA review' : 'Planning SFX generation'}</h3>
        </div>
        <Badge accent={complete ? 'success' : 'cyan'}>{complete ? 'Complete' : 'Mock progress'}</Badge>
      </div>
      <AIProgressStepList activeIndex={activeIndex} steps={steps} />
      <p className="sfx-muted-note">No real generation is happening. ReeditPro has not called Mirelo, MMAudio, Supabase, Google Cloud, or a renderer.</p>
    </section>
  )
}
