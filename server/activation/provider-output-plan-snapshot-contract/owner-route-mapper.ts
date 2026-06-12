import {
  PROVIDER_OUTPUT_PLAN_SNAPSHOT_REQUIRED_OWNER_ROUTES,
} from './provider-output-plan-snapshot-policy'
import type {
  ImplementationProposalRef,
  OwnerRouteEntry,
  PlanSnapshotOwnerRoute,
  SelectedIntent,
} from './provider-output-plan-snapshot-types'

const OWNER_PURPOSES: Record<PlanSnapshotOwnerRoute, string> = {
  MODEL_ORCHESTRATION: 'Review provider-derived planning intent labels and candidate snapshot structure.',
  COORDINATOR_PRODUCER_QA: 'Review professional editing QA requirements and user-approval gate implications.',
  WORKER_RUNTIME_JOBS: 'Audit future worker-runtime contract boundaries before any execution implementation.',
  TRACK_A_RENDER_EXPORT: 'Review render/export implications as handoff metadata only.',
  TRACK_B_MEDIA_PROCESSING: 'Review media-processing implications as handoff metadata only.',
  AI_TOOLS_CREATIVE_GRAPHICS: 'Review chart/card/graphics route labels before any tool strategy work.',
  MAP_GEOSPATIAL: 'Review map route labels before any map/geospatial tool strategy work.',
  SOUND_MUSIC_AUDIO: 'Review sound/music/audio implications before any audio planning work.',
  PROVIDER_GATEWAY_MODELS: 'Review provider policy boundaries and future provider route approval requirements.',
  SUPABASE_RLS_STORAGE_DATABASE: 'Review future approved-plan persistence needs; no SQL or row writes in this phase.',
  COMPLIANCE_SECURITY: 'Review privacy, redaction, source-of-truth, and signed URL blockers.',
  OBSERVABILITY_AUDIT_COST: 'Review traceability, cost limits, and audit fields before runtime work.',
  FRONTEND_PRODUCT_UX: 'Review candidate snapshot UX exposure boundaries before product UI work.',
  BILLING_STRIPE_CREDITS: 'Review credit-estimate and reservation implications; no billing action authorized.',
  PUBLIC_ARTIFACT_SIGNED_URL_POLICY: 'Keep public artifacts and signed URL source-of-truth blocked pending future policy.',
}

function hasOwner(owner: PlanSnapshotOwnerRoute, selectedIntents: SelectedIntent[], refs: ImplementationProposalRef[]) {
  return selectedIntents.some((intent) => intent.ownerRoute === owner) ||
    refs.some((ref) => ref.ownerRoute === owner)
}

export function buildOwnerRouteMap(input: {
  selectedIntents: SelectedIntent[]
  implementationProposalRefs: ImplementationProposalRef[]
}): { phase: 'PLAN_SNAPSHOT_1'; status: 'passed'; ownerRoutes: OwnerRouteEntry[] } {
  return {
    phase: 'PLAN_SNAPSHOT_1',
    status: 'passed',
    ownerRoutes: PROVIDER_OUTPUT_PLAN_SNAPSHOT_REQUIRED_OWNER_ROUTES.map((owner) => ({
      owner,
      routePurpose: OWNER_PURPOSES[owner],
      source: hasOwner(owner, input.selectedIntents, input.implementationProposalRefs)
        ? 'qwen_plan_candidate'
        : owner === 'MODEL_ORCHESTRATION'
          ? 'deepseek_implementation_findings'
          : 'policy_required_review',
      status: owner === 'PUBLIC_ARTIFACT_SIGNED_URL_POLICY' ? 'blocked_future_policy' : 'handoff_required',
      executionAllowed: false,
      runtimeReady: false,
      requiredBeforeRuntimeApproval: true,
    })),
  }
}
