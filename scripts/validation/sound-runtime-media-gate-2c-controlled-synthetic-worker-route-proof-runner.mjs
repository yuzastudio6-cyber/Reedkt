#!/usr/bin/env node
const decision = 'sound_runtime_media_gate_2c_controlled_synthetic_worker_route_proof_passed_with_warnings_ready_for_route_proof_owner_review'

const routeContracts = [
  {
    jobType: 'sound.package_import_smoke',
    worker: 'sound-cpu-analysis-worker',
    image: 'reeditpro/sound-cpu-analysis-worker',
    syntheticFixture: 'package-import-smoke-no-media',
  },
  {
    jobType: 'sound.numeric_array_analysis',
    worker: 'sound-cpu-analysis-worker',
    image: 'reeditpro/sound-cpu-analysis-worker',
    syntheticFixture: 'numeric-array-analysis-no-media',
  },
  {
    jobType: 'sound.symbolic_midi_analysis',
    worker: 'sound-audio-metadata-worker',
    image: 'reeditpro/sound-audio-metadata-worker',
    syntheticFixture: 'symbolic-midi-in-memory-no-file',
  },
  {
    jobType: 'sound.loudness_synthetic_analysis',
    worker: 'sound-cpu-analysis-worker',
    image: 'reeditpro/sound-cpu-analysis-worker',
    syntheticFixture: 'loudness-synthetic-array-no-media',
  },
]

const rejectedPayloadFields = [
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

const falseRuntimeFlags = {
  mediaFileOpenEnabled: false,
  audioreadAudioOpenEnabled: false,
  pydubFileImportExportEnabled: false,
  ffmpegEnabled: false,
  ffprobeEnabled: false,
  dockerRunEnabled: false,
  dockerPushEnabled: false,
  gcpEnabled: false,
  supabaseEnabled: false,
  sqlEnabled: false,
  artifactWriteEnabled: false,
  workerExecutionEnabled: false,
  routeExecutionEnabled: false,
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function makeBasePayload(contract, index) {
  return {
    approvedPlanSnapshotId: `approved-plan-snapshot-gate-2c-${index}`,
    workspaceId: 'workspace-gate-2c-synthetic',
    projectId: 'project-gate-2c-synthetic',
    jobId: `job-gate-2c-${index}`,
    idempotencyKey: `sound-gate-2c-${contract.jobType}`,
    workerName: contract.worker,
    imageName: contract.image,
    jobType: contract.jobType,
    attemptMetadata: {
      attempt: 1,
      source: 'gate_2c_synthetic_route_proof',
    },
    syntheticFixtureDescriptor: contract.syntheticFixture,
    staticOnlyRuntimeFlags: falseRuntimeFlags,
  }
}

function validatePayload(payload) {
  for (const field of rejectedPayloadFields) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      return { accepted: false, rejectedField: field }
    }
  }

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
    if (!Object.prototype.hasOwnProperty.call(payload, field)) {
      return { accepted: false, missingField: field }
    }
  }

  for (const [flag, value] of Object.entries(payload.staticOnlyRuntimeFlags)) {
    if (value !== false) return { accepted: false, unsafeRuntimeFlag: flag }
  }

  const contract = routeContracts.find((candidate) => candidate.jobType === payload.jobType)
  if (!contract) return { accepted: false, unknownJobType: payload.jobType }
  if (contract.worker !== payload.workerName) return { accepted: false, workerMismatch: payload.workerName }
  if (contract.image !== payload.imageName) return { accepted: false, imageMismatch: payload.imageName }

  return {
    accepted: true,
    routeDecision: {
      jobType: payload.jobType,
      worker: contract.worker,
      image: contract.image,
      fixture: payload.syntheticFixtureDescriptor,
    },
  }
}

const routeResults = routeContracts.map((contract, index) => validatePayload(makeBasePayload(contract, index + 1)))
const rejectionResults = rejectedPayloadFields.map((field, index) => {
  const payload = makeBasePayload(routeContracts[index % routeContracts.length], index + 100)
  payload[field] = `blocked-${field}`
  return validatePayload(payload)
})

for (const result of routeResults) {
  assert(result.accepted === true, `valid synthetic route payload was rejected: ${JSON.stringify(result)}`)
}

for (const result of rejectionResults) {
  assert(result.accepted === false && result.rejectedField, `unsafe payload was not rejected: ${JSON.stringify(result)}`)
}

const output = {
  status: 'passed',
  decision,
  routeDecisionProofRun: true,
  routeDecisionCount: routeResults.length,
  rejectedPayloadFieldCount: rejectionResults.length,
  rejectedPayloadFields,
  workerExecutionRun: false,
  routeExecutionRun: false,
  toolExecutionRun: false,
  mediaProcessingRun: false,
  audioreadAudioOpenRun: false,
  pydubFileImportExportRun: false,
  ffmpegRun: false,
  ffprobeRun: false,
  dockerRun: false,
  dockerPush: false,
  gcpTouched: false,
  supabaseTouched: false,
  sqlExecuted: false,
  artifactCreated: false,
  internalBetaUnlocked: false,
  externalBetaUnlocked: false,
  productionUnlocked: false,
  routeDecisions: routeResults.map((result) => result.routeDecision),
}

console.log(JSON.stringify(output, null, 2))
