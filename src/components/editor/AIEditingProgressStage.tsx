import { Badge } from '../Badge'
import { progressSteps } from './chatNativeData'
import { AIProgressStepList } from './AIProgressStepList'

type AIEditingProgressStageProps = {
  activeIndex: number
  complete: boolean
}

export function AIEditingProgressStage({ activeIndex, complete }: AIEditingProgressStageProps) {
  return (
    <section className="inline-chat-card ai-editing-stage">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">AI editing in background</span>
          <h3>{complete ? 'Mock preview prepared' : 'ReeditPro is editing'}</h3>
        </div>
        <Badge accent={complete ? 'success' : 'cyan'}>{complete ? 'Complete' : 'Working'}</Badge>
      </div>
      <div className="ai-stage-visual" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <AIProgressStepList activeIndex={activeIndex} steps={progressSteps} />
      <p className="inline-helper">
        This is mock progress only. Production would run AI editing only after the edit plan and credit estimate are approved.
      </p>
    </section>
  )
}
