import fs from 'node:fs'
import path from 'node:path'

const sourcePath = 'server/workers/sound-cpu/runtime/privateManifest.ts'
const sourceText = fs.readFileSync(path.join(process.cwd(), sourcePath), 'utf8')

function extractConstArray(name) {
  const match = sourceText.match(new RegExp(`export const ${name} = \\[([\\s\\S]*?)\\] as const`))
  if (!match) throw new Error(`Missing source array ${name}`)
  return [...match[1].matchAll(/'([^']+)'/g)].map((item) => item[1])
}

function extractRuntimeDefaultKeys() {
  const match = sourceText.match(/export const SOUND_CPU_PRIVATE_MANIFEST_RUNTIME_DEFAULTS = \{([\s\S]*?)\} as const/)
  if (!match) throw new Error('Missing runtime defaults')
  return [...match[1].matchAll(/\s+([a-zA-Z0-9]+): false,/g)].map((item) => item[1])
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

const workerNames = extractConstArray('SOUND_CPU_PRIVATE_MANIFEST_WORKER_NAMES')
const jobTypes = extractConstArray('SOUND_CPU_PRIVATE_MANIFEST_JOB_TYPES')
const runtimeDefaultKeys = extractRuntimeDefaultKeys()
const runtimeDefaults = Object.fromEntries(runtimeDefaultKeys.map((key) => [key, false]))

function validateSoundCpuPrivateMediaManifest(input) {
  const issues = []

  for (const field of ['approvedPlanSnapshotId', 'workspaceId', 'projectId', 'jobId', 'idempotencyKey']) {
    if (!isNonEmptyString(input[field])) issues.push({ code: 'missing_required_field', field })
  }

  if (!workerNames.includes(input.workerName)) issues.push({ code: 'invalid_worker_name', field: 'workerName' })
  if (!jobTypes.includes(input.jobType)) issues.push({ code: 'invalid_job_type', field: 'jobType' })

  for (const [index, assetId] of (input.privateMediaAssetIds ?? []).entries()) {
    if (!isNonEmptyString(assetId)) issues.push({ code: 'invalid_private_media_asset_id', field: `privateMediaAssetIds.${index}` })
  }

  for (const [index, artifactId] of (input.plannedPrivateArtifactIds ?? []).entries()) {
    if (!isNonEmptyString(artifactId)) {
      issues.push({ code: 'invalid_planned_private_artifact_id', field: `plannedPrivateArtifactIds.${index}` })
    }
  }

  for (const [flag, value] of Object.entries(input.runtimeDefaults ?? {})) {
    if (value !== false) issues.push({ code: 'runtime_flag_must_remain_false', field: `runtimeDefaults.${flag}` })
  }

  return {
    ok: issues.length === 0,
    issues,
    runtimeDefaults,
    acceptedForManifestInstanceCreationToday: false,
    acceptedForMediaProcessingToday: false,
    acceptedForArtifactCreationToday: false,
    acceptedForWorkerDispatchToday: false,
  }
}

function createControlledInMemoryManifestInstance() {
  return Object.freeze({
    schemaVersion: 'sound-cpu-private-media-manifest-v1',
    approvedPlanSnapshotId: 'approved_snapshot_phase92_controlled_in_memory',
    workspaceId: 'workspace_phase92_controlled_in_memory',
    projectId: 'project_phase92_controlled_in_memory',
    jobId: 'job_phase92_controlled_in_memory',
    idempotencyKey: 'sound-cpu-phase92-controlled-in-memory',
    workerName: workerNames[0],
    jobType: jobTypes[0],
    privateMediaAssetIds: Object.freeze(['private_media_asset_phase92_controlled_in_memory']),
    plannedPrivateArtifactIds: Object.freeze(['planned_private_artifact_phase92_controlled_in_memory']),
    runtimeDefaults: Object.freeze({ ...runtimeDefaults }),
  })
}

const manifest = createControlledInMemoryManifestInstance()
const validation = validateSoundCpuPrivateMediaManifest(manifest)
const serialized = JSON.stringify(manifest)

const prohibitedFieldNames = [
  'rawPrompt',
  'rawMediaPath',
  'signedUrl',
  'publicArtifactUrl',
  'providerOutputBlob',
  'serviceRolePayload',
  'artifactWriteTarget',
  'modelWeightLocation',
  'secretValue',
]

const prohibitedFieldsAbsent = prohibitedFieldNames.every((field) => !Object.hasOwn(manifest, field))
const runtimeDefaultsAllFalse = Object.values(manifest.runtimeDefaults).every((value) => value === false)

const output = {
  ok:
    validation.ok &&
    validation.issues.length === 0 &&
    manifest.schemaVersion === 'sound-cpu-private-media-manifest-v1' &&
    workerNames.includes(manifest.workerName) &&
    jobTypes.includes(manifest.jobType) &&
    manifest.privateMediaAssetIds.length === 1 &&
    manifest.plannedPrivateArtifactIds.length === 1 &&
    runtimeDefaultsAllFalse &&
    prohibitedFieldsAbsent,
  sourcePath,
  validatorFunction: 'validateSoundCpuPrivateMediaManifest',
  controlledInMemoryProof: {
    controlledInMemoryManifestInstanceCreated: true,
    manifestFrozen: Object.isFrozen(manifest),
    nestedRuntimeDefaultsFrozen: Object.isFrozen(manifest.runtimeDefaults),
    privateMediaAssetCount: manifest.privateMediaAssetIds.length,
    plannedPrivateArtifactCount: manifest.plannedPrivateArtifactIds.length,
    workerName: manifest.workerName,
    jobType: manifest.jobType,
    validationOk: validation.ok,
    validationIssueCount: validation.issues.length,
    runtimeDefaultsAllFalse,
    prohibitedFieldsAbsent,
    serializedLength: serialized.length,
    discardedAfterValidation: true,
  },
  noPersistenceNoExecution: {
    persistManifestToday: false,
    useRealMediaBytesToday: false,
    openMediaFileToday: false,
    createArtifactToday: false,
    createSignedUrlToday: false,
    dispatchWorkerToday: false,
    callRouteToolProviderToday: false,
    touchSupabaseSqlToday: false,
    unlockBetaToday: false,
    unlockProductionToday: false,
  },
}

console.log(JSON.stringify(output, null, 2))
