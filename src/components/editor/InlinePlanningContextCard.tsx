import { Badge } from '../Badge'
import type { EditPlan, ReferenceAdaptationFocus, ReferenceVideoPlan } from '../../types/reeditpro'

type InlinePlanningContextCardProps = {
  plan: EditPlan
}

const focusLabels: Record<ReferenceAdaptationFocus, string> = {
  overall_style: 'overall style',
  opening_style: 'opening style',
  pacing: 'pacing',
  caption_style: 'captions',
  transition_style: 'transitions',
  music_sound: 'music/SoundSync',
  visual_effects: 'visual effects',
  b_roll: 'b-roll',
  color_mood: 'color/mood',
  signature_system_usage: 'signature systems',
  ignore_reference: 'ignored',
}

function getReferenceStatus(referenceVideoPlan?: ReferenceVideoPlan) {
  if (!referenceVideoPlan || referenceVideoPlan.mode === 'no_reference') {
    return 'No reference'
  }

  if (referenceVideoPlan.skipped) {
    return 'Skipped'
  }

  if (referenceVideoPlan.status === 'analyzed_mock') {
    return 'Mock DNA ready'
  }

  return 'Reference attached'
}

export function InlinePlanningContextCard({ plan }: InlinePlanningContextCardProps) {
  const referenceDNA = plan.referenceVideoPlan?.referenceDNA
  const focusSummary = referenceDNA?.focus.map((focus) => focusLabels[focus]).join(', ') ?? 'none'
  const browserCaptureStatus = plan.browserCapturePlan?.active
    ? `Active: ${plan.browserCapturePlan.items.map((item) => item.browserVisualType.replaceAll('_', ' ')).join(', ')}`
    : 'No browser/app capture need detected'
  const browserSourceSummary =
    plan.browserCapturePlan?.items.map((item) => `${item.source.permissionStatus.replaceAll('_', ' ')} / ${item.source.safeWording}`).join(', ') ??
    'none'

  return (
    <section className="inline-chat-card planning-context-card">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Planning context</span>
          <h3>Raw chat becomes structured intent</h3>
        </div>
        <Badge accent={referenceDNA ? 'cyan' : 'muted'}>{getReferenceStatus(plan.referenceVideoPlan)}</Badge>
      </div>

      <div className="chat-plan-grid">
        <div>
          <strong>Intent</strong>
          <p>{plan.compiledIntent?.goalSummary ?? plan.goalSummary}</p>
        </div>
        <div>
          <strong>Reference focus</strong>
          <p>{focusSummary}</p>
        </div>
        <div>
          <strong>Browser/app visuals</strong>
          <p>{browserCaptureStatus}</p>
        </div>
        <div>
          <strong>Source status</strong>
          <p>{browserSourceSummary}</p>
        </div>
      </div>

      <div className="reference-do-not-copy-note">
        <strong>Style guidance only</strong>
        <p>Reference DNA guides pacing, captions, transitions, SoundSync, mood, and layout. It does not copy the reference or override your instructions.</p>
      </div>
    </section>
  )
}
