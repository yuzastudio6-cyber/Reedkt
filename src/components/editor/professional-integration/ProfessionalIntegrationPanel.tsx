import { Sparkles } from 'lucide-react'
import { Button } from '../../Button'
import type { ProfessionalIntegrationOperation, ProfessionalIntegrationState } from '../../../types'
import { AssetTreatmentPlanCard } from './AssetTreatmentPlanCard'
import { BrollIntegrationPlanCard } from './BrollIntegrationPlanCard'
import { CueComplianceCheckCard } from './CueComplianceCheckCard'
import { OverlayCompositionPlanCard } from './OverlayCompositionPlanCard'
import { ProfessionalIntegrationSummaryCard } from './ProfessionalIntegrationSummaryCard'
import { ProfessionalIntegrationToolbar } from './ProfessionalIntegrationToolbar'
import { ProfessionalQaRiskList } from './ProfessionalQaRiskList'
import { ProfessionalTreatmentExplainer } from './ProfessionalTreatmentExplainer'

type ProfessionalIntegrationPanelProps = {
  state: ProfessionalIntegrationState | null
  readinessMessage?: string
  onCreateProfessionalIntegration?: () => void
  onRegenerateProfessionalIntegration?: () => void
  onAcceptProfessionalIntegration?: () => void
  onAcceptAssetTreatment?: (treatmentId: string) => void
  onAcceptBrollTreatment?: (treatmentId: string) => void
  onAcceptOverlayTreatment?: (treatmentId: string) => void
  onAcceptCueCompliance?: (checkId: string) => void
  onResetProfessionalIntegration?: () => void
  className?: string
}

function operationPatchString(operation: ProfessionalIntegrationOperation, key: string) {
  const value = operation.patch?.[key]
  return typeof value === 'string' ? value : undefined
}

function acceptedIds(
  operations: ProfessionalIntegrationOperation[],
  type: ProfessionalIntegrationOperation['type'],
  patchKey: string,
) {
  return new Set(
    operations
      .filter((operation) => operation.type === type && operation.status === 'applied')
      .map((operation) => operationPatchString(operation, patchKey))
      .filter((value): value is string => Boolean(value)),
  )
}

export function ProfessionalIntegrationPanel({
  className = '',
  onAcceptAssetTreatment,
  onAcceptBrollTreatment,
  onAcceptCueCompliance,
  onAcceptOverlayTreatment,
  onAcceptProfessionalIntegration,
  onCreateProfessionalIntegration,
  onRegenerateProfessionalIntegration,
  onResetProfessionalIntegration,
  readinessMessage,
  state,
}: ProfessionalIntegrationPanelProps) {
  if (!state) {
    return (
      <section className={`inline-chat-card professional-integration-panel ${className}`.trim()}>
        <div className="inline-card-heading">
          <div>
            <span className="section-eyebrow">Professional Integration</span>
            <h3>Create professional treatment decisions before rendering</h3>
          </div>
        </div>
        <p className="inline-helper">
          Create professional treatment decisions before rendering. This turns cues and asset roles into polished edit execution.
        </p>
        <Button icon={Sparkles} onClick={onCreateProfessionalIntegration} variant="primary">
          Create Professional Integration
        </Button>
      </section>
    )
  }

  const acceptedAssetTreatments = acceptedIds(state.operations, 'accept_asset_treatment', 'treatmentId')
  const acceptedBrollTreatments = acceptedIds(state.operations, 'accept_broll_treatment', 'treatmentId')
  const acceptedOverlayTreatments = acceptedIds(state.operations, 'accept_overlay_treatment', 'treatmentId')
  const acceptedCueChecks = acceptedIds(state.operations, 'accept_cue_compliance', 'checkId')

  return (
    <section className={`professional-integration-panel ${className}`.trim()}>
      <section className="inline-chat-card professional-integration-intro">
        <div className="inline-card-heading">
          <div>
            <span className="section-eyebrow">Professional Integration</span>
            <h3>Polished execution before render</h3>
          </div>
        </div>
        <p className="inline-helper">
          Professional Integration makes sure clips, overlays, captions, graphics, and audio are polished before render.
        </p>
        <p className="inline-helper">
          User direction stays intact, but AI handles crop, placement, safe zones, transitions, and audio polish.
        </p>
      </section>

      <ProfessionalIntegrationSummaryCard
        readinessMessage={readinessMessage}
        summary={state.summary}
      />
      <ProfessionalIntegrationToolbar
        onAccept={onAcceptProfessionalIntegration}
        onCreate={onCreateProfessionalIntegration}
        onRegenerate={onRegenerateProfessionalIntegration}
        onReset={onResetProfessionalIntegration}
        operationCount={state.operations.length}
        summary={state.summary}
      />
      <ProfessionalTreatmentExplainer />
      <ProfessionalQaRiskList issues={state.issues} />

      <section className="professional-treatment-section">
        <div className="professional-treatment-section-heading">
          <span className="section-eyebrow">Asset treatments</span>
          <h3>How source assets will be prepared</h3>
        </div>
        <div className="professional-treatment-stack">
          {state.assetTreatmentPlans.length === 0 ? (
            <p className="inline-helper">No asset treatments are needed yet.</p>
          ) : state.assetTreatmentPlans.map((plan) => (
            <AssetTreatmentPlanCard
              accepted={acceptedAssetTreatments.has(plan.id)}
              key={plan.id}
              onAccept={onAcceptAssetTreatment}
              plan={plan}
            />
          ))}
        </div>
      </section>

      <section className="professional-treatment-section">
        <div className="professional-treatment-section-heading">
          <span className="section-eyebrow">B-roll integration</span>
          <h3>Timing, crop, color, and audio treatment</h3>
        </div>
        <div className="professional-treatment-stack">
          {state.brollIntegrationPlans.length === 0 ? (
            <p className="inline-helper">No B-roll integration plans are needed yet.</p>
          ) : state.brollIntegrationPlans.map((plan) => (
            <BrollIntegrationPlanCard
              accepted={acceptedBrollTreatments.has(plan.id)}
              key={plan.id}
              onAccept={onAcceptBrollTreatment}
              plan={plan}
            />
          ))}
        </div>
      </section>

      <section className="professional-treatment-section">
        <div className="professional-treatment-section-heading">
          <span className="section-eyebrow">Overlay composition</span>
          <h3>Safe, readable overlay treatment</h3>
        </div>
        <div className="professional-treatment-stack">
          {state.overlayCompositionPlans.length === 0 ? (
            <p className="inline-helper">No overlay composition plans are needed yet.</p>
          ) : state.overlayCompositionPlans.map((plan) => (
            <OverlayCompositionPlanCard
              accepted={acceptedOverlayTreatments.has(plan.id)}
              key={plan.id}
              onAccept={onAcceptOverlayTreatment}
              plan={plan}
            />
          ))}
        </div>
      </section>

      <section className="professional-treatment-section">
        <div className="professional-treatment-section-heading">
          <span className="section-eyebrow">Cue compliance</span>
          <h3>Whether each cue has a treatment path</h3>
        </div>
        <div className="professional-treatment-stack">
          {state.cueComplianceChecks.length === 0 ? (
            <p className="inline-helper">No cue compliance checks are needed yet.</p>
          ) : state.cueComplianceChecks.map((check) => (
            <CueComplianceCheckCard
              accepted={acceptedCueChecks.has(check.id)}
              check={check}
              key={check.id}
              onAccept={onAcceptCueCompliance}
            />
          ))}
        </div>
      </section>
    </section>
  )
}
