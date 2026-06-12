import { resolveWorkstreamReadiness } from '../system-readiness-reconciliation'
import type { GoNoGoEvidenceContext, WorkstreamGoNoGoDecision, WorkstreamId } from './controlled-internal-test-go-no-go-types'

export function evaluateWorkstreamGoNoGo(evidence: GoNoGoEvidenceContext): WorkstreamGoNoGoDecision[] {
  const readiness = resolveWorkstreamReadiness(evidence.baseContext)
  return readiness.map((record) => {
    const mapped = expectedDecision(record.workstream)
    return {
      workstream: record.workstream,
      decision: mapped.decision,
      runtimeDecision: 'no_go',
      planningAllowed: mapped.planningAllowed,
      handoffRequired: mapped.handoffRequired,
      reason: mapped.reason,
      requiredOwner: record.requiredOwner,
      recommendedNextPrompt: record.recommendedNextPrompt,
      evidence: record.currentEvidence,
      blockedScope: record.blockedScope,
    }
  })
}

function expectedDecision(workstream: WorkstreamId): Pick<WorkstreamGoNoGoDecision, 'decision' | 'planningAllowed' | 'handoffRequired' | 'reason'> {
  const map: Record<WorkstreamId, Pick<WorkstreamGoNoGoDecision, 'decision' | 'planningAllowed' | 'handoffRequired' | 'reason'>> = {
    AI_TOOLS_CREATIVE_GRAPHICS: {
      decision: 'go_for_owner_handoff',
      planningAllowed: true,
      handoffRequired: true,
      reason: 'Placeholder manifests exist; implementation and runtime are owned by the AI Tools chat.',
    },
    MAP_GEOSPATIAL: {
      decision: 'go_for_controlled_internal_planning',
      planningAllowed: true,
      handoffRequired: true,
      reason: 'Phase 50G marks map/geospatial ready for controlled internal testing, but Phase 52G does not render maps or run geospatial tools.',
    },
    SOUND_MUSIC_AUDIO: {
      decision: 'owner_handoff_required',
      planningAllowed: true,
      handoffRequired: true,
      reason: 'Sound/music/audio ownership and evidence require a dedicated owner response.',
    },
    TRACK_A_RENDER_EXPORT: {
      decision: 'go_for_owner_handoff',
      planningAllowed: true,
      handoffRequired: true,
      reason: 'Track A has internal private visual-video evidence; execution remains owned by Track A and Worker Runtime.',
    },
    TRACK_B_MEDIA_PROCESSING: {
      decision: 'partial_owner_handoff_required',
      planningAllowed: true,
      handoffRequired: true,
      reason: 'Track B is partial; VLM remains excluded and Demucs remains blocked pending provenance/runtime QA.',
    },
    SUPABASE_RLS_STORAGE_DATABASE: {
      decision: 'milestone_sync_ready',
      planningAllowed: true,
      handoffRequired: true,
      reason: 'Milestone sync is operational, but schema/RLS/migrations remain owned by the Supabase workstream.',
    },
    PROVIDER_GATEWAY_MODELS: {
      decision: 'no_go_for_execution',
      planningAllowed: false,
      handoffRequired: true,
      reason: 'Provider/model execution is not enabled.',
    },
    WORKER_RUNTIME_JOBS: {
      decision: 'no_go_for_execution',
      planningAllowed: false,
      handoffRequired: true,
      reason: 'Worker claim/execution contracts are owned elsewhere and are not enabled.',
    },
    COMPLIANCE_SECURITY: {
      decision: 'owner_handoff_required',
      planningAllowed: true,
      handoffRequired: true,
      reason: 'Compliance/security review is required before external beta or production.',
    },
    OBSERVABILITY_AUDIT_COST: {
      decision: 'owner_handoff_required',
      planningAllowed: true,
      handoffRequired: true,
      reason: 'Monitoring, abuse, audit, and cost controls need owner follow-up.',
    },
    FRONTEND_PRODUCT_UX: {
      decision: 'owner_handoff_required',
      planningAllowed: true,
      handoffRequired: true,
      reason: 'User-facing controlled internal flows need frontend UX owner validation.',
    },
    BILLING_STRIPE_CREDITS: {
      decision: 'owner_handoff_required',
      planningAllowed: true,
      handoffRequired: true,
      reason: 'Paid production and credit/Stripe execution remain blocked pending billing owner review.',
    },
  }
  return map[workstream]
}
