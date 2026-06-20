import {
  PRODUCTION_TOOL_IDS,
} from '../tool-registry'
import type {
  SyntheticFixtureDryRunArtifact,
  SyntheticFixtureDryRunResult,
  SyntheticFixtureDryRunValidationSummary,
} from './synthetic-fixture-dry-run-types'
import {
  listRuntimeIdReconciliationResults,
} from './tool-runtime-id-aliases'

export const FORBIDDEN_SYNTHETIC_FIXTURE_DRY_RUN_KEYS = [
  'rawPrompt',
  'raw_prompt',
  'rawUserChat',
  'signedUrl',
  'signed_url',
  'serviceRole',
  'service_role',
  'serviceRoleKey',
  'providerApiKey',
  'secretValue',
  'arbitraryArgs',
  'arbitrary_args',
  'shellCommand',
  'shell_command',
  'command',
  'args',
  'argv',
  'exec',
  'spawn',
  'outputPath',
  'output_path',
  'localPath',
  'local_path',
  'absolutePath',
  'absolute_path',
  'httpUrl',
  'httpsUrl',
] as const

const forbiddenKeySet = new Set<string>(FORBIDDEN_SYNTHETIC_FIXTURE_DRY_RUN_KEYS)
const productionToolIds = new Set<string>(PRODUCTION_TOOL_IDS)

function pendingExternalToolIds(): Set<string> {
  return new Set(
    listRuntimeIdReconciliationResults()
      .filter((result) => result.status === 'pending_production_tool_registry_expansion')
      .map((result) => result.externalToolId ?? result.inputToolId),
  )
}

function collectKeysDeep(value: unknown, path = '$', keys: string[] = []): string[] {
  if (!value || typeof value !== 'object') return keys
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectKeysDeep(item, `${path}[${index}]`, keys))
    return keys
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    keys.push(`${path}.${key}`)
    collectKeysDeep(nestedValue, `${path}.${key}`, keys)
  }

  return keys
}

function collectStringsDeep(value: unknown, path = '$', values: string[] = []): string[] {
  if (typeof value === 'string') {
    values.push(`${path}=${value}`)
    return values
  }
  if (!value || typeof value !== 'object') return values
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectStringsDeep(item, `${path}[${index}]`, values))
    return values
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    collectStringsDeep(nestedValue, `${path}.${key}`, values)
  }

  return values
}

function keyName(path: string): string {
  const parts = path.split('.')
  return parts[parts.length - 1] ?? path
}

function looksLikeUnsafeString(valueWithPath: string): boolean {
  const value = valueWithPath.slice(valueWithPath.indexOf('=') + 1)
  return (
    value.startsWith('/') ||
    /^[A-Za-z]:[\\/]/.test(value) ||
    /^https?:\/\//i.test(value) ||
    /&&|\|\||[|;`<>]|\$\(|\r|\n/.test(value)
  )
}

function payloadKindMatchesArtifact(artifact: SyntheticFixtureDryRunArtifact): boolean {
  if (artifact.fixtureKind === 'synthetic_video') return artifact.payloadKind === 'descriptor_json'
  if (artifact.fixtureKind === 'synthetic_audio') return artifact.payloadKind === 'descriptor_json'
  if (artifact.fixtureKind === 'synthetic_image') return artifact.payloadKind === 'descriptor_json'
  if (artifact.fixtureKind === 'synthetic_mask') return artifact.payloadKind === 'mask_descriptor_json'
  if (artifact.fixtureKind === 'synthetic_timeline') return artifact.payloadKind === 'timeline_json'
  if (artifact.fixtureKind === 'synthetic_caption_segments') return artifact.payloadKind === 'caption_segments_json'
  if (artifact.fixtureKind === 'synthetic_render_manifest') return artifact.payloadKind === 'render_manifest_json'
  if (artifact.fixtureKind === 'synthetic_json') {
    return artifact.payloadKind === 'descriptor_json' ||
      artifact.payloadKind === 'transcript_json' ||
      artifact.payloadKind === 'final_delivery_manifest_json'
  }

  return false
}

function validateArtifactInternal(
  artifact: SyntheticFixtureDryRunArtifact,
  forbiddenFieldsFound: string[],
  unsafeStringValues: string[],
  missingArtifactFields: string[],
  invalidPayloadKinds: string[],
): boolean {
  let ok = true

  for (const path of collectKeysDeep(artifact)) {
    if (forbiddenKeySet.has(keyName(path))) {
      forbiddenFieldsFound.push(path)
      ok = false
    }
  }

  for (const value of collectStringsDeep(artifact)) {
    if (looksLikeUnsafeString(value)) {
      unsafeStringValues.push(value)
      ok = false
    }
  }

  if (!artifact.artifactType) {
    missingArtifactFields.push(`${artifact.dryRunArtifactId}.artifactType`)
    ok = false
  }
  if (!artifact.storageBucketPurpose) {
    missingArtifactFields.push(`${artifact.dryRunArtifactId}.storageBucketPurpose`)
    ok = false
  }
  if (!artifact.checksum || !/^[a-f0-9]{64}$/.test(artifact.checksum)) {
    missingArtifactFields.push(`${artifact.dryRunArtifactId}.checksum`)
    ok = false
  }
  if (!Number.isFinite(artifact.sizeBytes) || artifact.sizeBytes <= 0) {
    missingArtifactFields.push(`${artifact.dryRunArtifactId}.sizeBytes`)
    ok = false
  }
  if (!payloadKindMatchesArtifact(artifact)) {
    invalidPayloadKinds.push(`${artifact.fixtureId}:${artifact.payloadKind}`)
    ok = false
  }
  if (!productionToolIds.has(artifact.sourceToolId)) ok = false
  if (pendingExternalToolIds().has(artifact.sourceToolId)) ok = false

  const requiredBooleansOk = (
    artifact.privateByDefault === true &&
    artifact.sourceOfTruth === true &&
    artifact.signedUrlAllowed === false &&
    artifact.localPathAllowed === false &&
    artifact.binaryMediaGenerated === false &&
    artifact.toolExecutionPerformed === false &&
    artifact.mediaProcessingPerformed === false &&
    artifact.workerExecutionPerformed === false
  )
  if (!requiredBooleansOk) ok = false

  return ok
}

function validateResultInternal(
  result: SyntheticFixtureDryRunResult,
  forbiddenFieldsFound: string[],
  unsafeStringValues: string[],
  missingArtifactFields: string[],
  invalidPayloadKinds: string[],
): boolean {
  let ok = true
  for (const path of collectKeysDeep(result)) {
    if (forbiddenKeySet.has(keyName(path))) {
      forbiddenFieldsFound.push(path)
      ok = false
    }
  }
  for (const value of collectStringsDeep(result)) {
    if (looksLikeUnsafeString(value)) {
      unsafeStringValues.push(value)
      ok = false
    }
  }

  if (!productionToolIds.has(result.toolId)) ok = false
  if (pendingExternalToolIds().has(result.toolId)) ok = false
  if (result.artifacts.length === 0) {
    missingArtifactFields.push(`${result.dryRunId}.artifacts`)
    ok = false
  }
  if (result.artifacts.some((artifact) => artifact.sourceFixturePlanId !== result.sourceFixturePlanId)) ok = false
  if (result.artifacts.some((artifact) => artifact.sourceCommandIntentId !== result.commandIntentId)) ok = false

  const requiredBooleansOk = (
    result.generatedJsonOnly === true &&
    result.binaryMediaGenerated === false &&
    result.fixtureGenerationPerformed === true &&
    result.toolExecutionPerformed === false &&
    result.shellExecutionPerformed === false &&
    result.mediaProcessingPerformed === false &&
    result.workerExecutionPerformed === false &&
    result.providerCallsPerformed === false &&
    result.supabaseMutationPerformed === false &&
    result.sqlExecuted === false &&
    result.executesTools === false
  )
  if (!requiredBooleansOk) ok = false

  for (const artifact of result.artifacts) {
    if (!validateArtifactInternal(
      artifact,
      forbiddenFieldsFound,
      unsafeStringValues,
      missingArtifactFields,
      invalidPayloadKinds,
    )) {
      ok = false
    }
  }

  return ok
}

function summary(input: {
  ok: boolean
  dryRunResultCount: number
  dryRunArtifactCount: number
  forbiddenFieldsFound: string[]
  unsafeStringValues: string[]
  missingArtifactFields: string[]
  invalidPayloadKinds: string[]
  pendingExternalToolsUsed: boolean
}): SyntheticFixtureDryRunValidationSummary {
  return {
    ...input,
    generatedJsonOnly: true,
    binaryMediaGenerated: false,
    fixtureGenerationPerformed: true,
    toolExecutionPerformed: false,
    shellExecutionPerformed: false,
    mediaProcessingPerformed: false,
    workerExecutionPerformed: false,
    providerCallsPerformed: false,
    supabaseMutationPerformed: false,
    sqlExecuted: false,
    executesTools: false,
  }
}

export function validateSyntheticFixtureDryRunArtifact(
  artifact: SyntheticFixtureDryRunArtifact,
): SyntheticFixtureDryRunValidationSummary {
  const forbiddenFieldsFound: string[] = []
  const unsafeStringValues: string[] = []
  const missingArtifactFields: string[] = []
  const invalidPayloadKinds: string[] = []
  const ok = validateArtifactInternal(
    artifact,
    forbiddenFieldsFound,
    unsafeStringValues,
    missingArtifactFields,
    invalidPayloadKinds,
  )

  return summary({
    ok,
    dryRunResultCount: 0,
    dryRunArtifactCount: 1,
    forbiddenFieldsFound,
    unsafeStringValues,
    missingArtifactFields,
    invalidPayloadKinds,
    pendingExternalToolsUsed: pendingExternalToolIds().has(artifact.sourceToolId),
  })
}

export function validateSyntheticFixtureDryRunResult(
  result: SyntheticFixtureDryRunResult,
): SyntheticFixtureDryRunValidationSummary {
  const forbiddenFieldsFound: string[] = []
  const unsafeStringValues: string[] = []
  const missingArtifactFields: string[] = []
  const invalidPayloadKinds: string[] = []
  const ok = validateResultInternal(
    result,
    forbiddenFieldsFound,
    unsafeStringValues,
    missingArtifactFields,
    invalidPayloadKinds,
  )

  return summary({
    ok: ok &&
      forbiddenFieldsFound.length === 0 &&
      unsafeStringValues.length === 0 &&
      missingArtifactFields.length === 0 &&
      invalidPayloadKinds.length === 0,
    dryRunResultCount: 1,
    dryRunArtifactCount: result.artifacts.length,
    forbiddenFieldsFound,
    unsafeStringValues,
    missingArtifactFields,
    invalidPayloadKinds,
    pendingExternalToolsUsed: pendingExternalToolIds().has(result.toolId),
  })
}

export function validateSyntheticFixtureDryRunResults(
  results: readonly SyntheticFixtureDryRunResult[],
): SyntheticFixtureDryRunValidationSummary {
  const forbiddenFieldsFound: string[] = []
  const unsafeStringValues: string[] = []
  const missingArtifactFields: string[] = []
  const invalidPayloadKinds: string[] = []
  let ok = true
  const pendingToolIds = pendingExternalToolIds()

  for (const result of results) {
    if (!validateResultInternal(
      result,
      forbiddenFieldsFound,
      unsafeStringValues,
      missingArtifactFields,
      invalidPayloadKinds,
    )) {
      ok = false
    }
  }

  return summary({
    ok: ok &&
      forbiddenFieldsFound.length === 0 &&
      unsafeStringValues.length === 0 &&
      missingArtifactFields.length === 0 &&
      invalidPayloadKinds.length === 0,
    dryRunResultCount: results.length,
    dryRunArtifactCount: results.reduce((count, result) => count + result.artifacts.length, 0),
    forbiddenFieldsFound,
    unsafeStringValues,
    missingArtifactFields,
    invalidPayloadKinds,
    pendingExternalToolsUsed: results.some((result) => pendingToolIds.has(result.toolId)),
  })
}
