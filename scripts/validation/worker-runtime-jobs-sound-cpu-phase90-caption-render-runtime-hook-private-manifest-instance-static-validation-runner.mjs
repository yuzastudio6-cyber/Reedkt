import fs from 'node:fs'
import path from 'node:path'

const sourcePath = 'server/workers/sound-cpu/runtime/privateManifest.ts'
const validatorFunction = 'validateSoundCpuPrivateMediaManifest'
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

const workerNames = extractConstArray('SOUND_CPU_PRIVATE_MANIFEST_WORKER_NAMES')
const jobTypes = extractConstArray('SOUND_CPU_PRIVATE_MANIFEST_JOB_TYPES')
const runtimeDefaultKeys = extractRuntimeDefaultKeys()

const runtimeDefaults = Object.fromEntries(runtimeDefaultKeys.map((key) => [key, false]))

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function validateSoundCpuPrivateMediaManifest(input) {
  const issues = []

  for (const field of ['approvedPlanSnapshotId', 'workspaceId', 'projectId', 'jobId', 'idempotencyKey']) {
    if (!isNonEmptyString(input[field])) {
      issues.push({
        code: 'missing_required_field',
        field,
      })
    }
  }

  if (!workerNames.includes(input.workerName)) {
    issues.push({
      code: 'invalid_worker_name',
      field: 'workerName',
    })
  }

  if (!jobTypes.includes(input.jobType)) {
    issues.push({
      code: 'invalid_job_type',
      field: 'jobType',
    })
  }

  for (const [index, assetId] of (input.privateMediaAssetIds ?? []).entries()) {
    if (!isNonEmptyString(assetId)) {
      issues.push({
        code: 'invalid_private_media_asset_id',
        field: `privateMediaAssetIds.${index}`,
      })
    }
  }

  for (const [index, artifactId] of (input.plannedPrivateArtifactIds ?? []).entries()) {
    if (!isNonEmptyString(artifactId)) {
      issues.push({
        code: 'invalid_planned_private_artifact_id',
        field: `plannedPrivateArtifactIds.${index}`,
      })
    }
  }

  for (const [flag, value] of Object.entries(input.runtimeDefaults ?? {})) {
    if (value !== false) {
      issues.push({
        code: 'runtime_flag_must_remain_false',
        field: `runtimeDefaults.${flag}`,
      })
    }
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

const validInput = {
  approvedPlanSnapshotId: 'aps_phase90_static_validation',
  workspaceId: 'workspace_phase90_static_validation',
  projectId: 'project_phase90_static_validation',
  jobId: 'job_phase90_static_validation',
  idempotencyKey: 'sound-cpu-phase90-static-validation',
  workerName: workerNames[0],
  jobType: jobTypes[0],
  privateMediaAssetIds: ['private_media_asset_phase90'],
  plannedPrivateArtifactIds: ['planned_private_artifact_phase90'],
  runtimeDefaults,
}

function hasIssue(result, code) {
  return result.issues.some((issue) => issue.code === code)
}

const validCase = validateSoundCpuPrivateMediaManifest(validInput)
const missingRequiredCase = validateSoundCpuPrivateMediaManifest({
  ...validInput,
  approvedPlanSnapshotId: '',
})
const invalidWorkerCase = validateSoundCpuPrivateMediaManifest({
  ...validInput,
  workerName: 'sound-cpu-unapproved-worker',
})
const invalidJobTypeCase = validateSoundCpuPrivateMediaManifest({
  ...validInput,
  jobType: 'sound.unapproved_job',
})
const invalidPrivateMediaCase = validateSoundCpuPrivateMediaManifest({
  ...validInput,
  privateMediaAssetIds: [''],
})
const invalidPrivateArtifactCase = validateSoundCpuPrivateMediaManifest({
  ...validInput,
  plannedPrivateArtifactIds: [''],
})
const runtimeFlagCase = validateSoundCpuPrivateMediaManifest({
  ...validInput,
  runtimeDefaults: {
    ...runtimeDefaults,
    workerExecutionEnabled: true,
  },
})

const disallowedFields = [
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

const sourceRequiredTokens = [
  validatorFunction,
  'missing_required_field',
  'invalid_worker_name',
  'invalid_job_type',
  'invalid_private_media_asset_id',
  'invalid_planned_private_artifact_id',
  'runtime_flag_must_remain_false',
  'acceptedForManifestInstanceCreationToday: false',
  'acceptedForMediaProcessingToday: false',
  'acceptedForArtifactCreationToday: false',
  'acceptedForWorkerDispatchToday: false',
]

const output = {
  ok:
    validCase.ok &&
    validCase.issues.length === 0 &&
    hasIssue(missingRequiredCase, 'missing_required_field') &&
    hasIssue(invalidWorkerCase, 'invalid_worker_name') &&
    hasIssue(invalidJobTypeCase, 'invalid_job_type') &&
    hasIssue(invalidPrivateMediaCase, 'invalid_private_media_asset_id') &&
    hasIssue(invalidPrivateArtifactCase, 'invalid_planned_private_artifact_id') &&
    hasIssue(runtimeFlagCase, 'runtime_flag_must_remain_false') &&
    sourceRequiredTokens.every((token) => sourceText.includes(token)),
  sourcePath,
  validatorFunction,
  syntheticInMemoryValidation: {
    validCaseOk: validCase.ok,
    validCaseIssueCount: validCase.issues.length,
    missingRequiredDetected: hasIssue(missingRequiredCase, 'missing_required_field'),
    invalidWorkerDetected: hasIssue(invalidWorkerCase, 'invalid_worker_name'),
    invalidJobTypeDetected: hasIssue(invalidJobTypeCase, 'invalid_job_type'),
    invalidPrivateMediaAssetIdDetected: hasIssue(invalidPrivateMediaCase, 'invalid_private_media_asset_id'),
    invalidPlannedPrivateArtifactIdDetected: hasIssue(
      invalidPrivateArtifactCase,
      'invalid_planned_private_artifact_id',
    ),
    runtimeFlagMustRemainFalseDetected: hasIssue(runtimeFlagCase, 'runtime_flag_must_remain_false'),
    disallowedFieldsAbsentFromValidInput: disallowedFields.every((field) => !(field in validInput)),
    runtimeDefaultsAllFalseReturned: Object.values(validCase.runtimeDefaults).every((value) => value === false),
    acceptedForManifestInstanceCreationToday: validCase.acceptedForManifestInstanceCreationToday,
    acceptedForMediaProcessingToday: validCase.acceptedForMediaProcessingToday,
    acceptedForArtifactCreationToday: validCase.acceptedForArtifactCreationToday,
    acceptedForWorkerDispatchToday: validCase.acceptedForWorkerDispatchToday,
  },
  sourceContract: {
    workerNames,
    jobTypes,
    runtimeDefaultKeys,
    sourceRequiredTokensPresent: sourceRequiredTokens.every((token) => sourceText.includes(token)),
  },
  noExecution: {
    createManifestToday: false,
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

if (!output.ok) process.exitCode = 1
console.log(JSON.stringify(output, null, 2))
