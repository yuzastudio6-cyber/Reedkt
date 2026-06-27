const decision =
  'worker_runtime_jobs_sound_cpu_controlled_runner_boundary_proof_after_image_import_proof_passed_with_warnings_ready_for_runner_boundary_proof_owner_review_after_image_import_proof'

export const acceptedToolIds = [
  'librosa',
  'audioread',
  'pydub',
  'scipy',
  'resampy',
  'pyloudnorm',
  'audioflux',
  'music21',
  'pretty_midi',
  'mido',
  'noisereduce',
  'pedalboard',
  'mir_eval',
  'pydub_effects',
  'ebu_r128_pyloudnorm'
]

const requiredFields = [
  'approvedPlanSnapshotId',
  'workspaceId',
  'projectId',
  'jobId',
  'idempotencyKey',
  'toolId',
  'attempt',
  'runtimeFlags',
  'syntheticInputRef'
]

const forbiddenFieldStops = [
  ['rawPrompt', 'raw_prompt_detected'],
  ['mediaPath', 'media_path_or_url_detected'],
  ['mediaUrl', 'media_path_or_url_detected'],
  ['signedUrl', 'signed_or_public_url_detected'],
  ['publicUrl', 'signed_or_public_url_detected'],
  ['artifactWriteTarget', 'artifact_write_target_detected'],
  ['supabaseSql', 'supabase_or_sql_requested'],
  ['serviceRolePayload', 'service_role_payload_detected'],
  ['providerOutputBlob', 'provider_or_model_call_requested'],
  ['modelWeightLocation', 'provider_or_model_call_requested'],
  ['secret', 'secret_payload_detected'],
  ['gcpResourceName', 'docker_or_gcp_requested'],
  ['dockerImagePushTarget', 'docker_or_gcp_requested']
]

const requiredFalseFlags = [
  'REEDITPRO_SOUND_CPU_RUNTIME_ENABLED',
  'REEDITPRO_WORKER_EXECUTION_ENABLED',
  'REEDITPRO_ROUTE_EXECUTION_ENABLED',
  'REEDITPRO_MEDIA_PROCESSING_ENABLED',
  'REEDITPRO_ARTIFACT_WRITE_ENABLED',
  'REEDITPRO_SUPABASE_SQL_ENABLED',
  'REEDITPRO_PROVIDER_MODEL_CALLS_ENABLED',
  'REEDITPRO_EXTERNAL_BETA_UNLOCK_ENABLED'
]

function hasUnsafeValue(value) {
  if (value === undefined || value === null || value === false) return false
  if (typeof value === 'string') return value.trim() !== ''
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value).length > 0
  return true
}

function basePayload(toolId) {
  return {
    approvedPlanSnapshotId: 'approved-plan-snapshot-synthetic-runner-boundary-proof',
    workspaceId: 'workspace_synthetic',
    projectId: 'project_synthetic',
    jobId: `job_${toolId}`,
    idempotencyKey: `runner-boundary-${toolId}`,
    toolId,
    attempt: { number: 1, max: 1, reason: 'synthetic_runner_boundary_guard_proof' },
    runtimeFlags: Object.fromEntries(requiredFalseFlags.map((flag) => [flag, '0'])),
    syntheticInputRef: { kind: 'in_memory', fixtureId: `synthetic_${toolId}`, media: false, artifact: false }
  }
}

function validatePayload(payload) {
  const stopReasons = []

  for (const field of requiredFields) {
    if (!hasUnsafeValue(payload[field])) stopReasons.push(`missing_${field}`)
  }

  if (!acceptedToolIds.includes(payload.toolId)) stopReasons.push('tool_id_not_allowlisted')
  if (payload.syntheticInputRef?.kind !== 'in_memory') stopReasons.push('media_path_or_url_detected')

  for (const [field, stopReason] of forbiddenFieldStops) {
    if (hasUnsafeValue(payload[field])) stopReasons.push(stopReason)
  }

  for (const flag of requiredFalseFlags) {
    const value = payload.runtimeFlags?.[flag]
    if (!(value === '0' || value === 0 || value === false)) stopReasons.push('runtime_flag_true_without_owner_review')
  }

  for (const claim of [
    'generated_local_fixture_passed',
    'dry_run_passed',
    'runtimeReadiness',
    'workerReadiness',
    'mediaReadiness',
    'externalBetaReady',
    'productionReady'
  ]) {
    if (payload.claims?.[claim] === true) stopReasons.push('generated_local_fixture_or_dry_run_or_readiness_claim_requested')
  }

  return {
    allowed: stopReasons.length === 0,
    stopReasons: [...new Set(stopReasons)]
  }
}

export function runProof() {
  const allowFixtures = acceptedToolIds.map((toolId) => ({ fixtureId: `allow_${toolId}`, payload: basePayload(toolId) }))
  const blockedFixtures = [
    ['block_missing_approved_snapshot', { approvedPlanSnapshotId: '' }],
    ['block_missing_idempotency', { idempotencyKey: '' }],
    ['block_raw_prompt', { rawPrompt: 'make this sound better' }],
    ['block_media_path', { mediaPath: '/tmp/source.wav' }],
    ['block_signed_url', { signedUrl: 'https://example.invalid/signed' }],
    ['block_artifact_target', { artifactWriteTarget: 'gs://example/output.wav' }],
    ['block_supabase_sql', { supabaseSql: 'select 1' }],
    ['block_service_role_payload', { serviceRolePayload: { role: 'service' } }],
    ['block_provider_output', { providerOutputBlob: { provider: 'model' } }],
    ['block_model_weight_location', { modelWeightLocation: '/models/not-allowed.bin' }],
    ['block_docker_gcp', { dockerImagePushTarget: 'registry.invalid/reeditpro/sound-cpu' }],
    ['block_worker_route_flag', { runtimeFlags: { REEDITPRO_WORKER_EXECUTION_ENABLED: '1' } }],
    ['block_external_beta_claim', { claims: { externalBetaReady: true } }],
    ['block_dry_run_claim', { claims: { dry_run_passed: true } }]
  ].map(([fixtureId, mutation]) => {
    const payload = basePayload('librosa')
    if (mutation.runtimeFlags) payload.runtimeFlags = { ...payload.runtimeFlags, ...mutation.runtimeFlags }
    if (mutation.claims) payload.claims = mutation.claims
    for (const [key, value] of Object.entries(mutation)) {
      if (key !== 'runtimeFlags' && key !== 'claims') payload[key] = value
    }
    return { fixtureId, payload }
  })

  const allowResults = allowFixtures.map(({ fixtureId, payload }) => ({
    fixtureId,
    toolId: payload.toolId,
    ...validatePayload(payload)
  }))
  const blockedResults = blockedFixtures.map(({ fixtureId, payload }) => ({
    fixtureId,
    toolId: payload.toolId,
    ...validatePayload(payload)
  }))

  const allowPassedCount = allowResults.filter((result) => result.allowed).length
  const blockedPassedCount = blockedResults.filter((result) => !result.allowed && result.stopReasons.length > 0).length
  const failedFixtures = [
    ...allowResults.filter((result) => !result.allowed).map((result) => result.fixtureId),
    ...blockedResults.filter((result) => result.allowed || result.stopReasons.length === 0).map((result) => result.fixtureId)
  ]

  return {
    status: failedFixtures.length === 0 ? 'passed' : 'failed',
    decision,
    sourceMergeCommit: '95279e0f36e2eb70d69086fb5537657f53e11896',
    acceptedToolCount: acceptedToolIds.length,
    requiredFieldCount: requiredFields.length,
    forbiddenFieldCount: forbiddenFieldStops.length,
    allowFixtureCount: allowFixtures.length,
    allowPassedCount,
    blockedFixtureCount: blockedFixtures.length,
    blockedPassedCount,
    failedFixtures,
    runtimeFlagsFalse: true,
    sanitizedEvidenceOnly: true,
    productToolCallExecution: 'no',
    workerExecution: 'no',
    routeExecution: 'no',
    mediaProcessing: 'no',
    artifactWrites: 'no',
    supabaseSql: 'no',
    providerModelCalls: 'no',
    dockerGcp: 'no',
    externalBetaUnlock: 'no',
    productionUnlock: 'no'
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(runProof(), null, 2))
}
