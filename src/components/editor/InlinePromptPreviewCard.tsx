import { Badge } from '../Badge'
import type { ChatPlanningCardDescriptor, EditPlan, PromptTargetProvider, ProviderPromptPlan } from '../../types/reeditpro'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlinePromptPreviewCardProps = {
  plan: EditPlan
  descriptor?: ChatPlanningCardDescriptor
}

const providerLabels: Record<PromptTargetProvider, string> = {
  editor_motion: 'Editor motion',
  gpt_image_2: 'GPT-Image-2',
  hailuo: 'Hailuo',
  none: 'None',
  remotion: 'Remotion',
  veo: 'Veo',
  wan: 'Wan',
}

const providerOrder: PromptTargetProvider[] = ['gpt_image_2', 'wan', 'hailuo', 'veo', 'remotion', 'editor_motion', 'none']

function formatLabel(value: string) {
  return value.replaceAll('_', ' ')
}

function groupPromptPlans(promptPlans: ProviderPromptPlan[]) {
  return providerOrder
    .map((provider) => ({
      provider,
      plans: promptPlans.filter((promptPlan) => promptPlan.targetProvider === provider),
    }))
    .filter((group) => group.plans.length > 0)
}

function promptPreviewText(promptPlan: ProviderPromptPlan) {
  if (promptPlan.prompt.length <= 360) {
    return promptPlan.prompt
  }

  return `${promptPlan.prompt.slice(0, 360).trim()}...`
}

export function InlinePromptPreviewCard({ descriptor, plan }: InlinePromptPreviewCardProps) {
  const promptPlans = plan.providerPromptPlans ?? []

  if (promptPlans.length === 0) {
    return null
  }

  const groupedProviders = groupPromptPlans(promptPlans)

  return (
    <InlinePlanCardShell
      className="prompt-preview-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{promptPlans.length} prompt plans</span>
          <span className="compact-summary-chip">{groupedProviders.map((group) => providerLabels[group.provider]).join(', ')}</span>
          <span className="compact-summary-chip">Mock only</span>
          <span className="compact-summary-chip">No provider calls</span>
        </div>
      )}
      defaultExpanded={descriptor?.defaultExpanded ?? false}
      eyebrow="Provider prompt preview"
      helper="These are mock prompt plans. In production, workers would use approved prompt plans to generate images, cards, keyframes, AI animation clips, or Remotion motion briefs. No provider is called in this demo."
      priority={descriptor?.priority}
      status={descriptor?.status}
      title="Provider prompt preview"
    >
      <div className="qa-badge-row">
        <Badge accent="cyan">Mock only</Badge>
        <Badge accent="muted">Advanced planning details</Badge>
      </div>
      <p className="prompt-policy-note">
        Provider dollar costs are not shown here. Prompts are not sent yet. AI models generate assets/clips only; ReeditPro owns final composition and approval.
      </p>

      <div className="prompt-group-list">
        {groupedProviders.map((group) => {
          const visiblePlans = group.plans.slice(0, 3)
          const hiddenCount = Math.max(0, group.plans.length - visiblePlans.length)

          return (
            <article className="prompt-group" key={group.provider}>
              <div className="prompt-plan-header">
                <div>
                  <strong>{providerLabels[group.provider]}</strong>
                  <small>{group.plans.length} prompt plan{group.plans.length === 1 ? '' : 's'}</small>
                </div>
                {group.provider === 'veo' && <span className="prompt-locked-note">Premium final fallback only</span>}
              </div>

              {visiblePlans.map((promptPlan) => (
                <div className="prompt-plan-item" key={promptPlan.id}>
                  <div className="prompt-plan-header">
                    <div>
                      <strong>{promptPlan.title}</strong>
                      <small>{formatLabel(promptPlan.planType)} / {formatLabel(promptPlan.providerModel)}</small>
                    </div>
                    <span className={promptPlan.tierAllowed ? 'prompt-tier-allowed' : 'prompt-tier-locked'}>
                      {promptPlan.tierAllowed ? 'Tier allowed' : 'Tier locked'}
                    </span>
                  </div>

                  <div className="prompt-plan-meta">
                    <span><strong>Resolution</strong>{promptPlan.resolution ?? 'frame'}</span>
                    <span><strong>Duration</strong>{promptPlan.durationSeconds ? `${promptPlan.durationSeconds}s` : 'editor controlled'}</span>
                    <span><strong>Frame</strong>{formatLabel(promptPlan.frameTemplateType ?? 'auto')}</span>
                    <span><strong>Panel</strong>{promptPlan.panelBackgroundColor ?? '#FFFFFF'}</span>
                    <span><strong>Constraints</strong>{promptPlan.constraints.length}</span>
                    <span><strong>QA notes</strong>{promptPlan.qaNotes.length}</span>
                  </div>

                  <div className="prompt-plan-body">
                    <p className="prompt-plan-text">{promptPreviewText(promptPlan)}</p>
                    {promptPlan.negativePrompt && (
                      <p className="prompt-negative-text">
                        <strong>Negative:</strong> {promptPlan.negativePrompt}
                      </p>
                    )}
                  </div>

                  <div className="prompt-constraint-list">
                    {promptPlan.constraints.slice(0, 3).map((constraint) => (
                      <span key={constraint.id}>{constraint.label}</span>
                    ))}
                    {promptPlan.constraints.length > 3 && <span>+ {promptPlan.constraints.length - 3} more constraints</span>}
                  </div>
                </div>
              ))}

              {hiddenCount > 0 && (
                <p className="inline-helper">+ {hiddenCount} more {providerLabels[group.provider]} prompt plan{hiddenCount === 1 ? '' : 's'} included in the approved mock plan.</p>
              )}
            </article>
          )
        })}
      </div>
    </InlinePlanCardShell>
  )
}
