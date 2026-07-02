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
          <span className="section-eyebrow">SoundSync progress</span>
          <h3>{complete ? 'Mock music ready for QA' : 'Planning music generation'}</h3>
        </div>
        <Badge accent={complete ? 'success' : 'cyan'}>{complete ? 'Complete' : 'Mock progress'}</Badge>
      </div>
      <AIProgressStepList activeIndex={activeIndex} steps={steps} />
      <p className="music-muted-note">This is a placeholder only. No Lyria call, Google API call, rendering, or credit deduction is happening.</p>
    </section>
  )
}
