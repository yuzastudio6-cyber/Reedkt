import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const requiredFiles = [
  'docs/track-a/track-a-private-e2e-revalidation-1-planning.md',
  'docs/track-a/track-a-private-e2e-revalidation-1-scope-contract.md',
  'docs/track-a/track-a-private-e2e-revalidation-1-input-manifest.md',
  'docs/track-a/track-a-private-e2e-revalidation-1-execution-boundary.md',
  'docs/track-a/track-a-private-e2e-revalidation-1-artifact-policy.md',
  'docs/track-a/track-a-private-e2e-revalidation-1-qa-gate-map.md',
  'docs/track-a/track-a-private-e2e-revalidation-1-observability-cost-plan.md',
  'docs/track-a/track-a-private-e2e-revalidation-1-compliance-privacy-plan.md',
  'docs/track-a/track-a-private-e2e-revalidation-1-worker-tool-route-handoff.md',
  'docs/track-a/track-a-private-e2e-revalidation-1-next-phase-plan.md',
  'docs/activation-phase-tracka-private-e2e-revalidation-1-results.md',
  'docs/implementation-prompts/prompt-tracka-private-e2e-revalidation-2-guarded-execution-packet.md',
  'docs/implementation-prompts/prompt-internal-beta-tracka-readiness-rollup-1.md',
  'docs/implementation-prompts/prompt-worker-runtime-tracka-private-e2e-execution-gate-1.md',
  'docs/implementation-prompts/prompt-tool-route-tracka-private-e2e-execution-gate-1.md',
]

const requiredText = [
  'TRACKA-PRIVATE-E2E-REVALIDATION-1',
  '#497',
  '59f82beb641fd772bfeddc8a244f148c3dbb267a',
  'trackARestrictedInternalBetaScopeDecision: approved_for_private_e2e_revalidation_planning',
  '#492',
  'accepted_for_restricted_internal_beta_scope_with_configurable_caption_policy',
  'defaultCaptionPreset: `one_line_bottom_safe_area`',
  'defaultMaxLines: `1`',
  'defaultPlacement: `bottom_center_safe_area`',
  'defaultAvoidFaceObstruction: `true`',
  'defaultSafeMarginsRequired: `true`',
  'defaultTranscriptAccuracyClaim: `false`',
  'one_line_bottom_safe_area',
  'two_line_subtitle',
  'auto_wrap_subtitle',
  'creator_large_caption',
  'lower_third_caption',
  'manual_position_and_size',
  '#452',
  'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
  '#463',
  'repo_owned_render_worker_ffmpeg_libass_runtime_path',
  '#475',
  '#488',
  '#434',
  'Included Scope Matrix',
  'Excluded Scope Matrix',
  'tracka_private_render_export_review_path',
  'corrected_caption_burnin',
  'caption_layout_policy',
  'libass_caption_burnin_runtime',
  'ffmpeg_ffprobe_private_validation',
  'remotion_private_preview_path',
  'private_artifact_manifest_checksums_qa',
  'birefnet_text_behind_subject_masking',
  'BiRefNet excluded',
  'real_esrgan_enhancement',
  'Real-ESRGAN excluded',
  'sam2_segmentation_runtime',
  'film_interpolation_runtime',
  'opencolorio_openimageio_production_color_management',
  'public artifacts blocked',
  'signed URL source-of-truth blocked',
  'final delivery blocked',
  'trackAInternalBetaUnlocked: false',
  'handoffExists: true',
  'prompt-tracka-private-e2e-revalidation-2-guarded-execution-packet.md',
  'prompt-internal-beta-tracka-readiness-rollup-1.md',
  'prompt-worker-runtime-tracka-private-e2e-execution-gate-1.md',
  'prompt-tool-route-tracka-private-e2e-execution-gate-1.md',
  'runtimeExecutionClaim: false',
  'privateArtifactAccessClaim: false',
  'supabaseMutationInThisPr: false',
  'TRACKA-PRIVATE-E2E-REVALIDATION-2 readiness: `ready_for_guarded_execution_packet_planning`',
  'WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-1 readiness: `ready_for_repo_audit_or_gate_planning`',
  'TOOL-ROUTE-TRACKA-PRIVATE-E2E-EXECUTION-GATE-1 readiness: `ready_for_repo_audit_or_gate_planning`',
  'INTERNAL-BETA-READINESS-ROLLUP readiness: `blocked_pending_tracka_private_e2e_execution_packet_and_worker_tool_route_gates`',
  'Supabase update status: docs_only',
  'SQL executed: none',
  'Migration deployed: no',
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.',
]

const forbidden = [
  /trackAInternalBetaUnlocked:\s*true/i,
  /internalBetaReady:\s*true/i,
  /productionReady:\s*true/i,
  /externalBetaReady:\s*true/i,
  /finalDeliveryReady:\s*true/i,
  /runtimeExecutionInThisPr:\s*true/i,
  /gcsAccessInThisPr:\s*true/i,
  /privateArtifactAccessInThisPr:\s*true/i,
  /ffmpegExecutionInThisPr:\s*true/i,
  /ffprobeExecutionInThisPr:\s*true/i,
  /libassExecutionInThisPr:\s*true/i,
  /remotionExecutionInThisPr:\s*true/i,
  /mediaProcessingInThisPr:\s*true/i,
  /frameExtractionInThisPr:\s*true/i,
  /workerExecutionInThisPr:\s*true/i,
  /toolRouteExecutionInThisPr:\s*true/i,
  /providerModelCallInThisPr:\s*true/i,
  /routeExecutionInThisPr:\s*true/i,
  /supabaseMutationInThisPr:\s*true/i,
  /sqlExecutedInThisPr:\s*true/i,
  /dependencyMutationInThisPr:\s*true/i,
  /packageLockMutationInThisPr:\s*true/i,
  /signedUrlsCreated:\s*true/i,
  /publicArtifactsCreated:\s*true/i,
  /publicArtifactAllowed:\s*true/i,
  /signedUrlSourceOfTruthAllowed:\s*true/i,
  /finalDeliveryAllowed:\s*true/i,
  /runtimeExecutionClaim:\s*true/i,
  /privateArtifactAccessClaim:\s*true/i,
  /E2E execution allowed in this phase:\s*true/i,
  /GCS access:\s*(approved|enabled|true)/i,
  /private artifact access:\s*(approved|enabled|true)/i,
  /runtime execution:\s*(approved|enabled|true)/i,
  /Supabase mutation:\s*(approved|enabled|true)/i,
  /SQL execution:\s*(approved|enabled|true)/i,
  /internal beta unlock:\s*(approved|enabled|true)/i,
  /external beta unlock:\s*(approved|enabled|true)/i,
  /production unlock:\s*(approved|enabled|true)/i,
  /final delivery:\s*(approved|enabled|true)/i,
  /public artifact source-of-truth:\s*(true|ready|approved)/i,
  /signed URL source-of-truth:\s*(true|ready|approved)/i,
]

function fail(message) {
  console.error(message)
  process.exit(1)
}

for (const file of requiredFiles) {
  if (!existsSync(file)) fail(`missing required file: ${file}`)
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
if (
  packageJson.scripts?.['track-a:private-e2e-revalidation-1:diagnostics'] !==
  'node scripts/validation/track-a-private-e2e-revalidation-1-diagnostics.mjs'
) {
  fail('missing package script: track-a:private-e2e-revalidation-1:diagnostics')
}

const docsText = requiredFiles.map((file) => readFileSync(file, 'utf8')).join('\n')

for (const token of requiredText) {
  if (!docsText.includes(token)) fail(`missing required text: ${token}`)
}

const packageLockStatus = execFileSync('git', ['status', '--short', 'package-lock.json'], {
  encoding: 'utf8',
  env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
}).trim()
if (packageLockStatus) fail(`package lock changed: ${packageLockStatus}`)

for (const pattern of forbidden) {
  if (pattern.test(docsText)) fail(`forbidden claim matched: ${pattern}`)
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'TRACKA-PRIVATE-E2E-REVALIDATION-1',
  patchType: 'Track A private E2E revalidation planning',
  trackAPrivateE2ERevalidation2Readiness: 'ready_for_guarded_execution_packet_planning',
  workerRuntimeGateReadiness: 'ready_for_repo_audit_or_gate_planning',
  toolRouteGateReadiness: 'ready_for_repo_audit_or_gate_planning',
  internalBetaReadinessRollup: 'blocked_pending_tracka_private_e2e_execution_packet_and_worker_tool_route_gates',
  trackAInternalBetaUnlocked: false,
  productionExternalBetaBroadMedia: 'blocked',
  trackAFinalDelivery: 'blocked',
  noRuntimeExecutionInThisPr: true,
  noPrivateArtifactAccessInThisPr: true,
  noSupabaseMutation: true,
  noPublicArtifacts: true,
  noSignedUrls: true,
}, null, 2))
