import type { SystemEvidenceContext, WorkstreamReadinessRecord } from './system-readiness-reconciliation-types'

export function resolveWorkstreamReadiness(evidence: SystemEvidenceContext): WorkstreamReadinessRecord[] {
  return [
    record('AI_TOOLS_CREATIVE_GRAPHICS', 'external_track_owned_pending_manifest', ['handoff planning only'], ['runtime execution by this chat', 'production graphics execution'], ['Phase 52B AI Tools placeholder records', 'Phase 52E validated AI Tools handoff'], 'AI Tools chat', 'Prompt GD-0 — AI Tools / Graphic Design Stack Repo Audit', false, false),
    record('MAP_GEOSPATIAL', 'ready_for_controlled_internal_testing', ['generated/local map planning evidence', 'controlled internal planning'], ['live tiles', 'geocoding', 'routing', 'paid map providers', 'public OSM tiles', 'production/external beta'], ['Phase 50G', 'Phase 50F', evidence.upstreamEvidence.find((item) => item.phaseId === '50G')?.reference ?? 'Phase 50G evidence'], 'map/geospatial owner', 'Phase 52G owner handoff or map internal test packet', true, false),
    record('SOUND_MUSIC_AUDIO', 'owner_follow_up_required', ['handoff planning only'], ['creative audio runtime', 'voice/TTS models', 'unowned sound execution'], ['Track B/audio placeholders where available'], 'Sound/Music/Audio owner', 'Prompt AUDIO-0 — Sound/Music readiness reconciliation', false, false),
    record('TRACK_A_RENDER_EXPORT', 'ready_for_internal_private_visual_video_testing', ['internal private visual-video testing evidence'], ['production', 'external beta', 'broad real media', 'final delivery beyond approved private review'], ['Phase 45F Track A readiness closure'], 'Track A visual/video owner', 'Track A controlled internal private review go/no-go', true, false),
    record('TRACK_B_MEDIA_PROCESSING', 'partial', ['placeholder planning', 'restricted internal capability handoff'], ['Qwen/VLM/vLLM', 'Demucs until provenance', 'unowned media runtime execution'], ['Phase 52B Track B placeholder records'], 'Track B media/audio/VLM owner', 'Track B runtime manifest and blocker reconciliation', false, false),
    record('SUPABASE_RLS_STORAGE_DATABASE', 'milestone_registry_operational', ['activation milestone registry and sync metadata'], ['unrelated schema/RLS/storage mutations by this chat', 'migrations in Phase 52F'], ['Phase 51B', 'Phase 51C', 'Phase 51D', 'Phase 52E sync readback'], 'Supabase RLS/storage/database owner', 'Phase 52G Supabase milestone verification only', true, false),
    record('PROVIDER_GATEWAY_MODELS', 'owner_follow_up_required', ['policy handoff only'], ['provider/model execution', 'API calls', 'paid provider activation'], ['Phase 52B provider execution blocked feature gates'], 'Provider Gateway/models owner', 'Provider Gateway execution policy review', false, false),
    record('WORKER_RUNTIME_JOBS', 'owner_follow_up_required', ['approved-plan execution contract handoff only'], ['worker claims', 'leases', 'runtime dispatch', 'tool execution'], ['Phase 52D/52E worker runtime handoffs'], 'Worker Runtime/jobs owner', 'Worker Runtime approved snapshot execution contract review', false, false),
    record('COMPLIANCE_SECURITY', 'owner_follow_up_required', ['blocker review and checklist handoff'], ['production/external beta until compliance/security review'], ['Production readiness remains blocked'], 'Compliance/security owner', 'Compliance/security internal beta prerequisite review', false, false),
    record('OBSERVABILITY_AUDIT_COST', 'owner_follow_up_required', ['audit/cost control requirements handoff'], ['production/beta without audit/abuse/cost controls'], ['Production readiness remains blocked'], 'Observability/audit/cost owner', 'Observability abuse and cost control readiness review', false, false),
    record('FRONTEND_PRODUCT_UX', 'owner_follow_up_required', ['internal UX contract planning'], ['user-facing beta flows until UX contracts validate'], ['Phase 49I internal UI/API gating evidence', 'Phase 52E source-of-truth policy'], 'Frontend product UX owner', 'Frontend internal test UX contract review', false, false),
    record('BILLING_STRIPE_CREDITS', 'owner_follow_up_required', ['billing/credit gate handoff planning'], ['paid production', 'credit charge flows', 'Stripe execution'], ['Production readiness remains blocked'], 'Billing/Stripe credits owner', 'Billing/credit internal test gate review', false, false),
  ]
}

function record(
  workstream: WorkstreamReadinessRecord['workstream'],
  status: WorkstreamReadinessRecord['status'],
  readyFor: string[],
  blockedScope: string[],
  currentEvidence: string[],
  requiredOwner: string,
  recommendedNextPrompt: string,
  internalTestingCandidate: boolean,
  internalBetaCandidate: boolean,
): WorkstreamReadinessRecord {
  return { workstream, status, readyFor, blockedScope, currentEvidence, requiredOwner, recommendedNextPrompt, internalTestingCandidate, internalBetaCandidate }
}
