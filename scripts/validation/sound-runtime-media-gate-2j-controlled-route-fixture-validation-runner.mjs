#!/usr/bin/env node

const decision = 'sound_runtime_media_gate_2j_controlled_route_fixture_validation_passed_with_warnings_ready_for_fixture_validation_owner_review'
const sourceHead = '0d700a3bdc36d4aa79063db30462d0d237e9f256'
const jobTypes = [
  'sound.package_import_smoke',
  'sound.numeric_array_analysis',
  'sound.symbolic_midi_analysis',
  'sound.loudness_synthetic_analysis',
]
const workers = {
  'sound.package_import_smoke': 'sound-cpu-analysis-worker',
  'sound.numeric_array_analysis': 'sound-cpu-analysis-worker',
  'sound.symbolic_midi_analysis': 'sound-audio-metadata-worker',
  'sound.loudness_synthetic_analysis': 'sound-audio-metadata-worker',
}
const images = {
  'sound.package_import_smoke': 'reeditpro/sound-cpu-analysis-worker',
  'sound.numeric_array_analysis': 'reeditpro/sound-cpu-analysis-worker',
  'sound.symbolic_midi_analysis': 'reeditpro/sound-audio-metadata-worker',
  'sound.loudness_synthetic_analysis': 'reeditpro/sound-audio-metadata-worker',
}
const descriptors = {
  'sound.package_import_smoke': 'synthetic-package-import-smoke-v1',
  'sound.numeric_array_analysis': 'synthetic-numeric-array-analysis-v1',
  'sound.symbolic_midi_analysis': 'synthetic-symbolic-midi-analysis-v1',
  'sound.loudness_synthetic_analysis': 'synthetic-loudness-analysis-v1',
}
const rejectedFields = [
  'rawPrompt',
  'uploadedMediaUri',
  'signedUrl',
  'publicArtifactUrl',
  'mediaFilePath',
  'providerOutputBlob',
  'secretValue',
  'serviceRolePayload',
  'modelWeightPath',
  'artifactWriteTarget',
  'supabaseMutation',
  'sqlText',
  'dockerCommand',
  'gcpCommand',
]
const runtimeFlags = [
  'mediaFileOpenEnabled',
  'mediaProcessingEnabled',
  'audioreadAudioOpenEnabled',
  'pydubFileImportExportEnabled',
  'ffmpegEnabled',
  'ffprobeEnabled',
  'dockerRunEnabled',
  'dockerPushEnabled',
  'gcpEnabled',
  'supabaseEnabled',
  'sqlEnabled',
  'artifactWriteEnabled',
  'toolExecutionEnabled',
  'workerExecutionEnabled',
  'routeExecutionEnabled',
]
const mismatchCases = [
  'unsafe_runtime_flag',
  'worker_mismatch',
  'image_mismatch',
  'fixture_mismatch',
  'unknown_job_type',
]

function buildFlags() {
  return Object.fromEntries(runtimeFlags.map((flag) => [flag, false]))
}

function buildFixture(jobType, index) {
  return {
    approvedPlanSnapshotId: `approved-plan-snapshot-gate-2j-${index + 1}`,
    workspaceId: `workspace-gate-2j-${index + 1}`,
    projectId: `project-gate-2j-${index + 1}`,
    jobId: `job-gate-2j-${index + 1}`,
    idempotencyKey: `gate-2j-${jobType}`,
    workerName: workers[jobType],
    imageName: images[jobType],
    jobType,
    attemptMetadata: {
      attempt: 1,
      source: 'sound-runtime-media-gate-2j-static-fixture-validation',
      ownerReviewDecision: 'worker_runtime_jobs_sound_cpu_route_fixture_hardening_owner_review_passed_with_warnings_ready_for_controlled_fixture_validation',
    },
    syntheticFixtureDescriptor: descriptors[jobType],
    staticOnlyRuntimeFlags: buildFlags(),
  }
}

function validateFixture(fixture) {
  const required = [
    'approvedPlanSnapshotId',
    'workspaceId',
    'projectId',
    'jobId',
    'idempotencyKey',
    'workerName',
    'imageName',
    'jobType',
    'attemptMetadata',
    'syntheticFixtureDescriptor',
    'staticOnlyRuntimeFlags',
  ]
  for (const field of required) {
    if (!(field in fixture)) return { accepted: false, reason: 'missing_required_field', field }
  }
  for (const field of rejectedFields) {
    if (field in fixture) return { accepted: false, reason: 'rejected_payload_field', field }
  }
  if (!jobTypes.includes(fixture.jobType)) return { accepted: false, reason: 'unknown_job_type' }
  if (fixture.workerName !== workers[fixture.jobType]) return { accepted: false, reason: 'worker_mismatch' }
  if (fixture.imageName !== images[fixture.jobType]) return { accepted: false, reason: 'image_mismatch' }
  if (fixture.syntheticFixtureDescriptor !== descriptors[fixture.jobType]) return { accepted: false, reason: 'fixture_mismatch' }
  for (const flag of runtimeFlags) {
    if (fixture.staticOnlyRuntimeFlags?.[flag] !== false) {
      return { accepted: false, reason: 'unsafe_runtime_flag', field: flag }
    }
  }
  if (Object.keys(fixture.staticOnlyRuntimeFlags).length !== runtimeFlags.length) {
    return { accepted: false, reason: 'invalid_runtime_flags' }
  }
  return {
    accepted: true,
    jobType: fixture.jobType,
    workerName: fixture.workerName,
    imageName: fixture.imageName,
    syntheticFixtureDescriptor: fixture.syntheticFixtureDescriptor,
  }
}

const validFixtures = jobTypes.map(buildFixture)
const acceptedResults = validFixtures.map(validateFixture)
const rejectedPayloadResults = rejectedFields.map((field) => validateFixture({ ...validFixtures[0], [field]: `blocked-${field}` }))
const mismatchResults = [
  validateFixture({ ...validFixtures[0], staticOnlyRuntimeFlags: { ...buildFlags(), workerExecutionEnabled: true } }),
  validateFixture({ ...validFixtures[0], workerName: 'sound-audio-metadata-worker' }),
  validateFixture({ ...validFixtures[0], imageName: 'reeditpro/sound-audio-metadata-worker' }),
  validateFixture({ ...validFixtures[0], syntheticFixtureDescriptor: 'wrong-fixture' }),
  validateFixture({ ...validFixtures[0], jobType: 'sound.unknown_job_type' }),
]

const accepted = acceptedResults.filter((result) => result.accepted).length
const rejectedPayloadCaseCount = rejectedPayloadResults.filter((result) => !result.accepted && result.reason === 'rejected_payload_field').length
const mismatchCaseCount = mismatchResults.filter((result) => !result.accepted).length
const passed = accepted === 4 && rejectedPayloadCaseCount === 14 && mismatchCaseCount === 5

if (!passed) {
  console.log(JSON.stringify({
    status: 'sound_runtime_media_gate_2j_controlled_route_fixture_validation_failed',
    decision: 'sound_runtime_media_gate_2j_blocked_fixture_validation_failure',
    accepted,
    rejectedPayloadCaseCount,
    mismatchCaseCount,
  }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2j_controlled_route_fixture_validation_passed',
  decision,
  sourceHead,
  validationMode: 'local_in_memory_static_fixture_shape_only',
  routeResolverImported: false,
  routeExecutionRun: false,
  serverRouteExecuted: false,
  workerDispatchRun: false,
  workerExecutionRun: false,
  mediaFileOpenRun: false,
  mediaProcessingRun: false,
  ffmpegRun: false,
  ffprobeRun: false,
  dockerBuildRun: false,
  dockerRun: false,
  dockerPush: false,
  gcpTouched: false,
  cloudRunTouched: false,
  supabaseTouched: false,
  sqlExecuted: false,
  artifactCreated: false,
  signedUrlCreated: false,
  publicArtifactCreated: false,
  providerCallRun: false,
  modelCallRun: false,
  generatedLocalFixturePassedClaimed: false,
  dryRunPassedClaimed: false,
  routeReadinessClaimed: false,
  workerReadinessClaimed: false,
  runtimeReadinessClaimed: false,
  mediaReadinessClaimed: false,
  betaReadinessClaimed: false,
  productionReadinessClaimed: false,
  fixtureCount: validFixtures.length,
  acceptedFixtureCount: accepted,
  rejectedPayloadFieldCount: rejectedFields.length,
  rejectedPayloadCaseCount,
  mismatchCaseCount,
  runtimeFalseFlagCount: runtimeFlags.length,
  acceptedJobTypes: jobTypes,
}, null, 2))
