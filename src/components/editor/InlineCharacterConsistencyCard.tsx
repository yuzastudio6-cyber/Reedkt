import { Badge } from '../Badge'
import type { ChatPlanningCardDescriptor, CharacterImportance, CharacterRealityStatus, EditPlan } from '../../types/reeditpro'
import { InlinePlanCardShell } from './InlinePlanCardShell'

type InlineCharacterConsistencyCardProps = {
  plan: EditPlan
  descriptor?: ChatPlanningCardDescriptor
}

const importanceAccent: Record<CharacterImportance, 'blue' | 'cyan' | 'violet' | 'warning' | 'muted'> = {
  group: 'violet',
  mention_only: 'muted',
  primary: 'cyan',
  secondary: 'blue',
  symbolic: 'violet',
}

const realityAccent: Record<CharacterRealityStatus, 'blue' | 'cyan' | 'violet' | 'warning' | 'muted'> = {
  fictional: 'violet',
  public_figure: 'warning',
  real_named_person: 'warning',
  unknown: 'muted',
  user_provided_person: 'blue',
}

function formatLabel(value: string) {
  return value.replaceAll('_', ' ')
}

export function InlineCharacterConsistencyCard({ descriptor, plan }: InlineCharacterConsistencyCardProps) {
  const characterPlan = plan.characterConsistencyPlan
  const packs = characterPlan?.packs ?? []

  if (!characterPlan || packs.length === 0) {
    return null
  }

  const primaryCount = packs.filter((pack) => pack.importance === 'primary').length
  const secondaryCount = packs.filter((pack) => pack.importance === 'secondary').length
  const mentionOnlyCount = packs.filter((pack) => pack.importance === 'mention_only').length

  return (
    <InlinePlanCardShell
      className="character-consistency-card"
      compactSummary={(
        <div className="compact-summary-row">
          <span className="compact-summary-chip">{packs.length} packs</span>
          <span className="compact-summary-chip">{primaryCount} primary</span>
          <span className="compact-summary-chip">{secondaryCount} secondary</span>
          <span className="compact-summary-chip">{mentionOnlyCount} mention-only</span>
        </div>
      )}
      defaultExpanded={descriptor?.defaultExpanded ?? false}
      eyebrow="Character consistency"
      helper="Recurring people and story figures use reference packs so stills, keyframes, cards, and animations stay visually consistent."
      priority={descriptor?.priority}
      status={descriptor?.status}
      title="Character consistency"
    >
      <div className="qa-badge-row">
        <Badge accent="cyan">Character pack planned</Badge>
        <Badge accent="muted">Prompt identity guardrails</Badge>
      </div>
      <div className="character-pack-list">
        {packs.slice(0, 4).map((pack) => (
          <article className="character-pack-item" key={pack.id}>
            <div className="segment-plan-header">
              <div>
                <strong>{pack.displayName}</strong>
                <small>{pack.roleInStory}</small>
              </div>
              <div className="character-pack-meta">
                <Badge accent={importanceAccent[pack.importance]}>{formatLabel(pack.importance)}</Badge>
                <Badge accent={realityAccent[pack.realityStatus]}>{formatLabel(pack.realityStatus)}</Badge>
              </div>
            </div>

            <div className="qa-summary-grid">
              <span><strong>Beats</strong>{pack.appearsInBeatIds.length}</span>
              <span><strong>Segments</strong>{pack.appearsInSegmentIds.length}</span>
              <span><strong>References</strong>{pack.referenceAssetsNeeded.length}</span>
              <span><strong>QA checks</strong>{pack.qaChecks.length}</span>
            </div>

            <p className="inline-helper">{pack.appearance.visualDescription}</p>

            <div className="character-reference-list">
              {pack.referenceAssetsNeeded.slice(0, 5).map((referenceAsset) => (
                <span key={referenceAsset.id}>
                  {referenceAsset.label}
                  {referenceAsset.required ? '' : ' / optional'}
                </span>
              ))}
            </div>

            <div className="intent-rule-list">
              {pack.consistencyRules.slice(0, 2).map((rule) => (
                <span className="intent-rule-item" key={rule}>{rule}</span>
              ))}
              {pack.avoidRules.slice(0, 2).map((rule) => (
                <span className="intent-rule-item" key={rule}>{rule}</span>
              ))}
            </div>
          </article>
        ))}
      </div>

      {packs.length > 4 && <p className="inline-helper">+ {packs.length - 4} more character pack{packs.length - 4 === 1 ? '' : 's'} included in the mock plan.</p>}

      <div className="renderer-notes">
        {characterPlan.globalRules.slice(0, 4).map((rule) => (
          <span key={rule}>{rule}</span>
        ))}
      </div>
    </InlinePlanCardShell>
  )
}
