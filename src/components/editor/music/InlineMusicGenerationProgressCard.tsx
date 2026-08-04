import { Badge } from '../../Badge'
import { AIProgressStepList } from '../AIProgressStepList'

type InlineMusicGenerationProgressCardProps = {
  activeIndex: number
  complete: boolean
  steps: string[]
}

export function InlineMusicGenerationProgressCard({ activeIndex, complete, steps }: InlineMusicGenerationProgressCardProps) {
  return (
    <section className="inline-chat-card music-inline-card music-generation-progress-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Music progress</span>
          <h3>{complete ? 'Music ready for QA' : 'Preparing music cue'}</h3>
        </div>
        <Badge accent={complete ? 'success' : 'cyan'}>{complete ? 'Complete' : 'Progress'}</Badge>
      </div>
      <AIProgressStepList activeIndex={activeIndex} steps={steps} />
      <p className="music-muted-note">Local progress only. No music asset call, rendering, or credit deduction is happening.</p>
    </section>
  )
}
