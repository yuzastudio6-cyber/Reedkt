const decision =
  'worker_runtime_jobs_sound_cpu_controlled_limited_beta_runner_boundary_preflight_proof_after_image_import_proof_passed_with_warnings_ready_for_controlled_limited_beta_runner_boundary_preflight_proof_owner_review_after_image_import_proof'

export const acceptedToolIds = [
  'librosa',
  'audioread',
  'pydub',
  'pydub_effects',
  'scipy',
  'resampy',
  'pyloudnorm',
  'ebu_r128_pyloudnorm',
  'audioflux',
  'music21',
  'pretty_midi',
  'mido',
  'noisereduce',
  'pedalboard',
  'mir_eval'
]

const requiredFields = [
  'approvedPlanSnapshotId',
  'workspaceId',
  'projectId',
  'jobId',
  'idempotencyKey',
  'workerName',
  'imageName',
  'jobType',
  'toolId'
]

const forbiddenPayloadFamilies = [
  ['rawPrompt', 'raw_prompt_detected'],
  ['mediaFilePath', 'media_file_path_detected'],
  ['sourceMediaUrl', 'source_media_url_detected'],
  ['signedUrl', 'signed_url_detected'],
  ['publicArtifactUrl', 'public_artifact_url_detected'],
  ['artifactWriteTarget', 'artifact_write_target_detected'],
  ['providerOutputBlob', 'provider_model_payload_detected'],
  ['serviceRolePayload', 'service_role_payload_detected'],
  ['supabaseWriteIntent', 'supabase_write_intent_detected'],
  ['sqlStatement', 'sql_statement_detected'],
  ['modelWeightLocation', 'model_weight_location_detected'],
  ['gcpResourceTarget', 'gcp_resource_target_detected'],
  ['dockerRunRequest', 'docker_run_request_detected'],
  ['betaUserExecutionRequest', 'beta_user_execution_request_detected']
]

const requiredFalseFlags = [
  'REEDITPRO_SOUND_CPU_RUNTIME_ENABLED',
  'REEDITPRO_WORKER_EXECUTION_ENABLED',
  'REEDITPRO_MEDIA_PROCESSING_ENABLED'
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
    approvedPlanSnapshotId: 'approved-plan-snapshot-synthetic-limited-beta-runner-boundary',
    workspaceId: 'workspace_synthetic',
    projectId: 'project_synthetic',
    jobId: `job_${toolId}`,
    idempotencyKey: `limited-beta-runner-boundary-${toolId}`,
    workerName: 'sound-cpu-analysis-worker',
    imageName: 'reeditpro/sound-cpu-analysis-worker',
    jobType: 'sound.package_import_smoke',
    toolId,
    runtimeFlags: Object.fromEntries(requiredFalseFlags.map((flag) => [flag, '0'])),
    syntheticInputRef: {
      kind: 'in_memory',
      mediaFileOpen: false,
      mediaProcessing: false,
      artifactWrite: false
    }
  }
}

function validatePayload(payload) {
  const stopReasons = []

  for (const field of requiredFields) {
    if (!hasUnsafeValue(payload[field])) stopReasons.push(`missing_${field}`)
  }

  if (!acceptedToolIds.includes(payload.toolId)) stopReasons.push('tool_id_not_allowlisted')
  if (payload.syntheticInputRef?.kind !== 'in_memory') stopReasons.push('media_file_path_detected')
  if (payload.syntheticInputRef?.mediaFileOpen !== false) stopReasons.push('media_file_open_requested')
  if (payload.syntheticInputRef?.mediaProcessing !== false) stopReasons.push('media_processing_requested')
  if (payload.syntheticInputRef?.artifactWrite !== false) stopReasons.push('artifact_write_requested')

  for (const [field, stopReason] of forbiddenPayloadFamilies) {
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
    if (payload.claims?.[claim] === true) stopReasons.push('forbidden_status_claim_requested')
  }

  return {
    allowed: stopReasons.length === 0,
    stopReasons: [...new Set(stopReasons)]
  }
}

export function runProof() {
  const allowFixtures = acceptedToolIds.map((toolId) => ({ fixtureId: `allow_${toolId}`, payload: basePayload(toolId) }))
  const blockedFixtures = forbiddenPayloadFamilies.map(([field], index) => {
    const payload = basePayload('librosa')
    payload[field] = field === 'sqlStatement' ? 'select 1' : `${field}_not_allowed`
    return { fixtureId: `block_${String(index + 1).padStart(2, '0')}_${field}`, payload }
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
    sourcePr: 1198,
    sourceMergeCommit: 'acb7fe959a19b923d324ca14adde18cb5136a7ef',
    acceptedToolCount: acceptedToolIds.length,
    requiredFieldCount: requiredFields.length,
    forbiddenPayloadFamilyCount: forbiddenPayloadFamilies.length,
    runtimeFlagsRequiredFalseCount: requiredFalseFlags.length,
    allowFixtureCount: allowFixtures.length,
    allowPassedCount,
    blockedFixtureCount: blockedFixtures.length,
    blockedPassedCount,
    failedFixtures,
    sanitizedEvidenceOnly: true,
    productToolCallExecution: 'no',
    workerExecution: 'no',
    routeExecution: 'no',
    mediaFileOpen: 'no',
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
