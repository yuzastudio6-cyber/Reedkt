import { Badge } from '../Badge'
import type { Accent } from '../../data/productContent'
import type { ApprovedEditExecutionAdapterGateActivityGroup } from '../../lib/approved-edit-execution-package-client'
import { hideInternalToolNamesInCopy } from '../../lib/tool-display-labels'
import {
  createProfessionalSkillDisplayModel,
  professionalSkillReviewContextSummary,
} from '../../lib/professional-skills'
import type { ProfessionalSkillPlan } from '../../types'

type PrivateReviewPreparationSummary = {
  resolvedActivityCount?: number
  blockedActivityCount?: number
  privateFallbackReviewOnly?: boolean
  privateRenderIntegrationReady?: boolean
  privateRenderIntegratedActivityCount?: number
  backendIntegrationPendingActivityCount?: number
  backendIntegrationBlockers?: string[]
  serverSourceTruthRequiredForFullExecution?: boolean
  userFacingReadinessSummary?: string
  activityGroups?: ApprovedEditExecutionAdapterGateActivityGroup[]
}

type PrivateReviewPreparationStatusCardProps = {
  skillPlan?: ProfessionalSkillPlan | null
  summary: PrivateReviewPreparationSummary
}

const STATUS_LABELS: Record<ApprovedEditExecutionAdapterGateActivityGroup['status'], string> = {
  ready: 'Attached',
  partial: 'Partly attached',
  pending: 'Waiting',
  blocked: 'Evidence pending',
}

const STATUS_ACCENTS: Record<ApprovedEditExecutionAdapterGateActivityGroup['status'], Accent | 'muted'> = {
  ready: 'success',
  partial: 'info',
  pending: 'warning',
  blocked: 'warning',
}

export function PrivateReviewPreparationStatusCard({ skillPlan, summary }: PrivateReviewPreparationStatusCardProps) {
  const activityGroups = summary.activityGroups ?? []
  const resolvedCount = summary.resolvedActivityCount ?? 0
  const blockedCount = summary.blockedActivityCount ?? 0
  const pendingCount = summary.backendIntegrationPendingActivityCount ?? 0
  const hasBlockers = blockedCount > 0 || (summary.backendIntegrationBlockers?.length ?? 0) > 0
  const integratedCount = summary.privateRenderIntegratedActivityCount ?? 0
  const skillDisplay = skillPlan
    ? createProfessionalSkillDisplayModel(skillPlan, { activityLimit: 4, evidenceLimit: 3 })
    : null

  return (
    <section className="private-review-preparation-card" data-testid="private-review-preparation-status-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Preparation status</span>
          <h3>Private review preparation</h3>
        </div>
        <Badge accent={hasBlockers ? 'warning' : summary.privateRenderIntegrationReady ? 'success' : 'info'}>
          {hasBlockers ? 'Evidence pending' : summary.privateRenderIntegrationReady ? 'Ready' : 'Internal review'}
        </Badge>
      </div>

      <p className="inline-helper">
        {summary.userFacingReadinessSummary
          ? cleanPreparationCopy(summary.userFacingReadinessSummary)
          : buildPreparationSummaryText({
            blockedCount,
            integratedCount,
            pendingCount,
            privateRenderIntegrationReady: summary.privateRenderIntegrationReady === true,
            resolvedCount,
          })}
      </p>

      {skillPlan && (
        <div className="private-review-skill-trace" data-testid="private-review-preparation-skill-trace">
          <div className="private-review-skill-trace-heading">
            <strong>Approved edit direction</strong>
            <span>{skillPlan.selectedSkillCount} activities</span>
          </div>
          <p>
            {cleanPreparationCopy(professionalSkillReviewContextSummary(skillPlan))}
          </p>
          {skillDisplay && skillDisplay.activityItems.length > 0 && (
            <ul>
              {skillDisplay.activityItems.map((group) => (
                <li key={group.id}>
                  <span>{cleanPreparationCopy(group.label)}</span>
                  {group.summary && <small>{cleanPreparationCopy(group.summary)}</small>}
                </li>
              ))}
            </ul>
          )}
          {skillDisplay && skillDisplay.evidenceItems.length > 0 && (
            <details>
              <summary>Why this direction was selected</summary>
              <ul>
                {skillDisplay.evidenceItems.map((evidence) => (
                  <li key={evidence.id}>
                    <span>{cleanPreparationCopy(evidence.label)}</span>
                    <small>{cleanPreparationCopy(evidence.summary)}</small>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {activityGroups.length > 0 && (
        <div className="private-review-activity-grid" aria-label="Private review preparation areas">
          {activityGroups.map((group) => (
            <article className={`private-review-activity-card private-review-activity-${group.status}`} key={group.id}>
              <div className="private-review-activity-card-heading">
                <strong>{cleanPreparationCopy(group.label)}</strong>
                <Badge accent={STATUS_ACCENTS[group.status]}>{getActivityStatusLabel(group)}</Badge>
              </div>
              <p>{cleanPreparationCopy(group.userFacingSummary)}</p>
            </article>
          ))}
        </div>
      )}

      <p className="private-review-next-action">
        <strong>Next action:</strong> {buildPreparationNextAction({
          hasBlockers,
          pendingCount,
          privateFallbackReviewOnly: summary.privateFallbackReviewOnly === true,
          privateRenderIntegrationReady: summary.privateRenderIntegrationReady === true,
          serverSourceTruthRequiredForFullExecution: summary.serverSourceTruthRequiredForFullExecution === true,
        })}
      </p>
    </section>
  )
}

function getActivityStatusLabel(group: ApprovedEditExecutionAdapterGateActivityGroup): string {
  if (group.status === 'partial') {
    return `${group.integratedActivityCount}/${group.resolvedActivityCount} attached`
  }

  return STATUS_LABELS[group.status]
}

function cleanPreparationCopy(value: string): string {
  return hideInternalToolNamesInCopy(value)
    .replace(/\bbackend evidence\b/gi, 'approved evidence')
    .replace(/\bbackend runtime evidence\b/gi, 'approved evidence')
    .replace(/\bbackend\b/gi, 'approved')
    .replace(/\bsource-truth\b/gi, 'approved')
    .replace(/\bsource truth\b/gi, 'approved')
}

function buildPreparationSummaryText(input: {
  blockedCount: number
  integratedCount: number
  pendingCount: number
  privateRenderIntegrationReady: boolean
  resolvedCount: number
}): string {
  if (input.blockedCount > 0) {
    return `The private review is available, with ${input.blockedCount} preparation ${pluralize(input.blockedCount, 'area')} still waiting for approved evidence before wider testing.`
  }

  if (input.privateRenderIntegrationReady) {
    return `${input.integratedCount} preparation ${pluralize(input.integratedCount, 'area')} were attached to the private review package for internal inspection.`
  }

  if (input.pendingCount > 0) {
    return `${input.resolvedCount} preparation ${pluralize(input.resolvedCount, 'area')} were planned for this review. ${input.pendingCount} still need approved evidence before external testing.`
  }

  return `${input.resolvedCount} preparation ${pluralize(input.resolvedCount, 'area')} were checked for this private review.`
}

function buildPreparationNextAction(input: {
  hasBlockers: boolean
  pendingCount: number
  privateFallbackReviewOnly: boolean
  privateRenderIntegrationReady: boolean
  serverSourceTruthRequiredForFullExecution: boolean
}): string {
  if (input.hasBlockers) {
    return 'finish the missing approved evidence before wider testing or release paths are considered.'
  }

  if (input.privateRenderIntegrationReady) {
    return 'inspect the private review, then approve it for the next gate or request changes.'
  }

  if (input.pendingCount > 0 || input.serverSourceTruthRequiredForFullExecution) {
    return 'keep this review internal until the remaining preparation evidence is attached.'
  }

  if (input.privateFallbackReviewOnly) {
    return 'review privately; sharing, billing, and public delivery stay off.'
  }

  return 'review the edit and decide whether to approve it or request changes.'
}

function pluralize(count: number, singular: string): string {
  return count === 1 ? singular : `${singular}s`
}
