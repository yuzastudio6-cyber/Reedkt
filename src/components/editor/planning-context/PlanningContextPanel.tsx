import { Sparkles } from 'lucide-react'
import { Button } from '../../Button'
import type {
  ContextAwareMockEditPlanResult,
  PlanningContext,
  PlanningContextSummary,
} from '../../../types'
import { PlanningBriefSummaryCard } from './PlanningBriefSummaryCard'
import { PlanningConflictNotice } from './PlanningConflictNotice'
import { PlanningCueUsageCard } from './PlanningCueUsageCard'
import { PlanningReadinessCard } from './PlanningReadinessCard'
import { PlanningSkillSummaryCard } from './PlanningSkillSummaryCard'
import { PlanningSourceSummaryCard } from './PlanningSourceSummaryCard'

type PlanningContextPanelProps = {
  canCreatePlanFromContext?: boolean
  createPlanBlockedReason?: string
  planningContext: PlanningContext | null
  summary?: PlanningContextSummary | null
  readinessMessage?: string
  latestPlanResult?: ContextAwareMockEditPlanResult | null
  onCreatePlanFromContext?: () => void
  className?: string
}

export function PlanningContextPanel({
  canCreatePlanFromContext = true,
  className = '',
  createPlanBlockedReason,
  latestPlanResult,
  onCreatePlanFromContext,
  planningContext,
  readinessMessage,
  summary,
}: PlanningContextPanelProps) {
  if (!planningContext || !summary) {
    return (
      <section className={`inline-chat-card planning-context-panel ${className}`.trim()}>
        <div className="inline-card-heading">
          <div>
            <span className="section-eyebrow">Planning context</span>
            <h3>Planning context will appear after source prep.</h3>
          </div>
        </div>
      </section>
    )
  }

  const blocked = planningContext.status === 'blocked'

  return (
    <section className={`planning-context-panel ${className}`.trim()}>
      <section className="inline-chat-card planning-context-intro">
        <div className="inline-card-heading">
          <div>
              <span className="section-eyebrow">Planning context</span>
              <h3>Context for your edit plan</h3>
          </div>
        </div>
        <p className="inline-helper">
          This gathers the prompt, cleaned footage, asset roles, optional brief, and cues into one planning draft. The next step is plan review before any private review work begins.
        </p>
        {createPlanBlockedReason && <p className="frame-confirmation-warning">{createPlanBlockedReason}</p>}
        <div className="planning-context-actions">
          <Button
            disabled={!canCreatePlanFromContext}
            icon={Sparkles}
            onClick={onCreatePlanFromContext}
            variant={blocked ? 'secondary' : 'primary'}
          >
            {!canCreatePlanFromContext
              ? 'Complete required setup first'
              : blocked
              ? 'Create draft plan with issues'
              : 'Create edit plan'}
          </Button>
        </div>
      </section>

      <PlanningReadinessCard
        readinessMessage={readinessMessage}
        status={planningContext.status}
        summary={summary}
      />
      <PlanningSourceSummaryCard planningContext={planningContext} />
      <PlanningBriefSummaryCard brief={planningContext.editBrief} />
      <PlanningCueUsageCard cueUsages={planningContext.cueUsages} />
      <PlanningConflictNotice planningContext={planningContext} />

      {latestPlanResult && (
        <section className="inline-chat-card planning-context-plan-result">
          <div className="inline-card-heading">
            <div>
              <span className="section-eyebrow">Draft plan</span>
              <h3>Edit plan created from this context</h3>
            </div>
          </div>
          <p>{latestPlanResult.planSummary}</p>
          <p className="inline-helper">
            This does not approve credits or start generation. Review the planned treatment before any private review work starts.
          </p>
        </section>
      )}

      {latestPlanResult && (
        <PlanningSkillSummaryCard skillPlan={latestPlanResult.professionalSkillPlan} />
      )}
    </section>
  )
}
