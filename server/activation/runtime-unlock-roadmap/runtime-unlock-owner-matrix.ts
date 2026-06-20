import type { OwnerAcceptanceMatrix, OwnerAcceptanceMatrixRow, WorkstreamId } from './runtime-unlock-roadmap-types'

const pendingOwners: WorkstreamId[] = [
  'AI_TOOLS_CREATIVE_GRAPHICS',
  'SOUND_MUSIC_AUDIO',
  'PROVIDER_GATEWAY_MODELS',
  'WORKER_RUNTIME_JOBS',
  'COMPLIANCE_SECURITY',
  'OBSERVABILITY_AUDIT_COST',
  'FRONTEND_PRODUCT_UX',
  'BILLING_STRIPE_CREDITS',
]

const acceptedPartialWithBlockersOwners: WorkstreamId[] = [
  'MAP_GEOSPATIAL',
  'TRACK_A_RENDER_EXPORT',
  'TRACK_B_MEDIA_PROCESSING',
  'SUPABASE_RLS_STORAGE_DATABASE',
]

const promptNames: Record<WorkstreamId, string> = {
  AI_TOOLS_CREATIVE_GRAPHICS: 'Prompt AITOOLS-0 — Creative Graphics Repo Audit',
  TRACK_A_RENDER_EXPORT: 'Prompt TRACKA-0 — Render Export Repo Audit',
  TRACK_B_MEDIA_PROCESSING: 'Prompt TRACKB-0 — Media Processing Runtime Repo Audit',
  MAP_GEOSPATIAL: 'Prompt MAP-0 — Map Geospatial Runtime Repo Audit',
  SOUND_MUSIC_AUDIO: 'Prompt AUDIO-0 — Sound Music Audio Repo Audit',
  SUPABASE_RLS_STORAGE_DATABASE: 'Prompt SUPABASE-0 — RLS Storage Database Repo Audit',
  PROVIDER_GATEWAY_MODELS: 'Prompt PROVIDER-0 — Provider Gateway Models Repo Audit',
  WORKER_RUNTIME_JOBS: 'Prompt WORKER-0 — Worker Runtime Jobs Repo Audit',
  COMPLIANCE_SECURITY: 'Prompt COMPLIANCE-0 — Compliance Security Repo Audit',
  OBSERVABILITY_AUDIT_COST: 'Prompt OBS-0 — Observability Audit Cost Repo Audit',
  FRONTEND_PRODUCT_UX: 'Prompt FRONTEND-0 — Frontend Product UX Repo Audit',
  BILLING_STRIPE_CREDITS: 'Prompt BILLING-0 — Billing Stripe Credits Repo Audit',
}

const owners: Record<WorkstreamId, string> = {
  AI_TOOLS_CREATIVE_GRAPHICS: 'AI Tools / Creative Graphics owner chat',
  TRACK_A_RENDER_EXPORT: 'Track A visual-video render/export owner chat',
  TRACK_B_MEDIA_PROCESSING: 'Track B media processing owner chat',
  MAP_GEOSPATIAL: 'Map/geospatial owner chat',
  SOUND_MUSIC_AUDIO: 'Sound/Music/Audio owner chat',
  SUPABASE_RLS_STORAGE_DATABASE: 'Supabase/RLS/storage/database owner chat',
  PROVIDER_GATEWAY_MODELS: 'Provider Gateway / Models owner chat',
  WORKER_RUNTIME_JOBS: 'Worker Runtime / Jobs owner chat',
  COMPLIANCE_SECURITY: 'Compliance/Security owner chat',
  OBSERVABILITY_AUDIT_COST: 'Observability/Audit/Cost owner chat',
  FRONTEND_PRODUCT_UX: 'Frontend Product UX owner chat',
  BILLING_STRIPE_CREDITS: 'Billing/Stripe/Credits owner chat',
}

export function buildOwnerAcceptanceMatrix(): OwnerAcceptanceMatrix {
  const workstreams = [...pendingOwners, ...acceptedPartialWithBlockersOwners]
  return {
    matrixId: 'phase53a_owner_acceptance_matrix',
    rows: workstreams.map((workstream) => row(workstream)),
    pendingOwners,
    acceptedPartialWithBlockersOwners,
  }
}

function row(workstream: WorkstreamId): OwnerAcceptanceMatrixRow {
  const pending = pendingOwners.includes(workstream)
  return {
    workstream,
    owner: owners[workstream],
    currentStatusFromPhase52H: pending ? 'pending_owner_response' : 'accepted_partial_with_blockers',
    currentUnlockStage: pending ? 'blocked' : 'owner_accepted',
    unlockableScopes: unlockableScopes(workstream),
    blockedScopes: blockedScopes(workstream),
    nextRequiredPrompt: promptNames[workstream],
    repoAuditPromptName: promptNames[workstream],
    acceptanceCriteria: [
      'Owner names accepted scope and blocked scope.',
      'Owner confirms no runtime execution in the repo audit phase.',
      'Owner identifies source-of-truth docs, manifests, test commands, and blockers.',
      'Owner confirms Supabase update classification and artifact policy.',
    ],
    prohibitedActions: [
      'Do not execute tools, workers, models, providers, browser capture, map rendering, or media processing.',
      'Do not apply migrations, alter RLS/schema, or write product rows.',
      'Do not create public artifacts, signed URL source-of-truth, raw prompt execution, production, external beta, paid production, or broad media unlocks.',
    ],
    supabaseUpdateClassification: {
      updateRequired: 'staging_update_candidate',
      updateStatus: 'ready_for_staging_review',
      environmentTouched: 'staging',
      sqlExecuted: false,
      migrationDeployed: false,
      nextSupabaseAction: 'milestone sync only through Phase 51D contract',
    },
    evidenceRequired: [
      'Phase 52H owner response ledger reference.',
      'Repo audit result from the owner prompt.',
      'Private artifact refs and QA gate summary.',
      'Blocked feature confirmation.',
    ],
  }
}

function unlockableScopes(workstream: WorkstreamId): string[] {
  if (workstream === 'SUPABASE_RLS_STORAGE_DATABASE') return ['milestone registry/readiness metadata', 'future schema/RLS audit planning']
  if (workstream === 'PROVIDER_GATEWAY_MODELS') return ['provider gateway policy', 'secret/cost/fail-closed planning']
  if (workstream === 'WORKER_RUNTIME_JOBS') return ['worker contract audit', 'job runtime dry-run planning']
  if (workstream === 'COMPLIANCE_SECURITY') return ['advisor/security triage ownership', 'external beta policy review']
  if (workstream === 'OBSERVABILITY_AUDIT_COST') return ['observability/cost audit ownership', 'runtime monitoring plan']
  return ['owner repo audit', 'dry-run planning', 'generated/local fixture planning']
}

function blockedScopes(workstream: WorkstreamId): string[] {
  const common = ['production', 'external beta', 'paid production', 'broad media', 'public artifacts', 'signed URL source-of-truth', 'raw prompt execution']
  if (workstream === 'SUPABASE_RLS_STORAGE_DATABASE') return [...common, 'schema/RLS changes', 'SQL migrations', 'product row writes']
  if (workstream === 'PROVIDER_GATEWAY_MODELS') return [...common, 'provider calls', 'model inference', 'secret exposure']
  if (workstream === 'WORKER_RUNTIME_JOBS') return [...common, 'worker execution', 'Docker build', 'Cloud Run deploy']
  return [...common, 'runtime execution']
}
