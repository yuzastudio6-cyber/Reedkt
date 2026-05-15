import { CheckCircle2, Loader2 } from 'lucide-react'

type AIProgressStepListProps = {
  activeIndex: number
  steps: string[]
}

export function AIProgressStepList({ activeIndex, steps }: AIProgressStepListProps) {
  return (
    <ol className="ai-progress-list" aria-label="AI editing progress">
      {steps.map((step, index) => {
        const state = index < activeIndex ? 'done' : index === activeIndex ? 'active' : 'pending'

        return (
          <li className={`ai-progress-step ${state}`} key={step}>
            {state === 'done' ? <CheckCircle2 size={16} /> : <Loader2 className={state === 'active' ? 'spin-icon' : ''} size={16} />}
            <span>{step}</span>
          </li>
        )
      })}
    </ol>
  )
}
