import { createHash } from 'node:crypto'
import { z } from 'zod'
import type { SkillQualificationStatus } from '../../src/types/skill-capability-manifest'
import {
  TOOL_CAPABILITY_MANIFEST_SCHEMA_VERSION,
  type ToolCapabilityManifest,
  type ToolExecutionMode,
  type ToolOperationCapability,
  type ToolRuntimeStatus,
  type UnpublishedToolCapabilityManifest,
} from './tool-capability-manifest-types'

const safeKey = z.string().trim().min(1).max(220)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'), 'Unsafe key sequence.')
const hash = z.string().regex(/^[a-f0-9]{64}$/)
const stringList = z.array(z.string().trim().min(1).max(2_000)).max(512)
const keyList = z.array(safeKey).max(512)
const qualification = z.enum([
  'declared', 'planning_qualified', 'fixture_qualified',
  'private_internal_qualified', 'production_qualified', 'blocked', 'deprecated',
])
const scope = z.enum(['clip', 'range', 'multi_range', 'scene', 'boundary', 'sequence', 'video'])
const qualificationRank: Record<SkillQualificationStatus, number> = {
  blocked: 0,
  deprecated: 0,
  declared: 1,
  planning_qualified: 2,
  fixture_qualified: 3,
  private_internal_qualified: 4,
  production_qualified: 5,
}

const operationSchema: z.ZodType<ToolOperationCapability> = z.object({
  operationKey: safeKey,
  operationVersion: safeKey,
  displayName: z.string().trim().min(1).max(180),
  description: z.string().trim().min(1).max(2_000),
  supportedJobTypes: keyList,
  conditioningModes: keyList,
  supportedScopes: z.array(scope).min(1).max(7),
  requiredInputs: keyList,
  optionalInputs: keyList,
  acceptedArtifactTypes: keyList,
  producedArtifactTypes: keyList,
  mediaConstraints: z.object({
    acceptedContentTypes: z.array(z.string().trim().min(1).max(120)).max(64),
    maximumInputBytes: z.number().int().positive().optional(),
    maximumInputDurationSeconds: z.number().positive().optional(),
    maximumOutputBytes: z.number().int().positive().optional(),
    maximumOutputDurationSeconds: z.number().positive().optional(),
    allowedSampleRates: z.array(z.number().int().positive()).max(16).optional(),
    allowedChannelCounts: z.array(z.number().int().positive()).max(16).optional(),
    carrierVisualMayReplaceApprovedVisual: z.literal(false),
  }).strict(),
  mutationPolicy: z.enum([
    'read_only_analysis', 'create_versioned_private_artifact', 'private_provider_ingest',
    'coordination_record_only', 'no_mutation',
  ]),
  determinism: z.enum(['deterministic', 'bounded_nondeterministic', 'decision_deterministic']),
  executionRequirements: z.object({
    serverOwnedProfileRequired: z.literal(true),
    approvedSnapshotRequired: z.boolean(),
    creditReservationRequired: z.boolean(),
    privateArtifactInputsRequired: z.boolean(),
    privateArtifactOutputsRequired: z.boolean(),
    runtimeAvailabilityRequired: z.boolean(),
    licenseEvidenceRequired: z.boolean(),
    rateCardSnapshotRequired: z.boolean(),
    arbitraryCommandAllowed: z.literal(false),
    arbitraryArgumentsAllowed: z.literal(false),
    arbitraryPathsAllowed: z.literal(false),
    arbitraryNetworkTargetsAllowed: z.literal(false),
    callerSuppliedCredentialsAllowed: z.literal(false),
  }).strict(),
  qualificationByMode: z.object({
    planning: qualification,
    preview_execution: qualification,
    final_execution: qualification,
  }).strict(),
  qualificationEvidenceRefs: keyList,
  timeEstimatorKey: safeKey,
  creditEstimatorKey: safeKey,
  attemptPolicyKey: safeKey,
  requiredPlanningQa: keyList,
  requiredOutputQa: keyList,
  requiredIntegrationQa: keyList,
  invalidationRules: keyList,
  knownLimitations: stringList,
}).strict()

export const toolCapabilityManifestSchema: z.ZodType<ToolCapabilityManifest> = z.object({
  manifestSchemaVersion: z.literal(TOOL_CAPABILITY_MANIFEST_SCHEMA_VERSION),
  toolManifestId: safeKey,
  toolManifestHash: hash,
  toolKey: safeKey,
  toolVersion: safeKey,
  adapterVersion: safeKey,
  contractVersion: safeKey,
  toolClass: z.enum([
    'external_provider', 'system_binary', 'python_library', 'open_source_model',
    'internal_service', 'decision_route',
  ]),
  executionBoundary: z.enum([
    'server_provider_adapter', 'private_cpu_worker', 'private_gpu_worker',
    'private_artifact_service', 'private_coordination_service', 'planning_only',
  ]),
  owningSystem: safeKey,
  qualificationStatus: qualification,
  qualificationEvidenceRefs: keyList,
  operations: z.array(operationSchema).min(1).max(256),
  privacyPolicy: z.object({
    policyKey: safeKey,
    privateInputsOnly: z.boolean(),
    privateOutputsOnly: z.boolean(),
    providerOutputUntrustedUntilIngestAndQa: z.boolean(),
    durableProviderUrlsAllowed: z.literal(false),
    secretValuesAllowedInManifest: z.literal(false),
    retentionApprovalRequired: z.boolean(),
  }).strict(),
  securityPolicy: z.object({
    policyKey: safeKey,
    serverOwnedProfilesOnly: z.literal(true),
    sourceOverwriteAllowed: z.literal(false),
    checksumValidationRequired: z.boolean(),
    mediaValidationRequired: z.boolean(),
    networkDenyByDefault: z.boolean(),
    callerSelectedExecutableAllowed: z.literal(false),
    callerSelectedArgumentsAllowed: z.literal(false),
    callerSelectedPathsAllowed: z.literal(false),
    callerSelectedProviderRouteAllowed: z.literal(false),
  }).strict(),
  licensePolicyRef: safeKey,
  rateCardRef: safeKey,
  runtimeProbeKey: safeKey,
  knownLimitations: stringList,
}).strict().superRefine((manifest, context) => {
  const operationIdentities = new Set<string>()
  for (const operation of manifest.operations) {
    const identity = `${operation.operationKey}@${operation.operationVersion}`
    if (operationIdentities.has(identity)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: `Duplicate operation ${identity}.` })
    }
    operationIdentities.add(identity)
    const evidence = new Set([...manifest.qualificationEvidenceRefs, ...operation.qualificationEvidenceRefs])
    if (operation.qualificationByMode.final_execution === 'production_qualified' && evidence.size === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Production-qualified operation ${operation.operationKey} requires evidence.`,
      })
    }
  }
  if (manifest.qualificationStatus === 'production_qualified' && manifest.operations.some(
    (operation) => operation.qualificationByMode.final_execution !== 'production_qualified',
  )) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'A production-qualified tool summary cannot contain a non-production final operation.',
    })
  }
  const lowestPlanningOperation = Math.min(...manifest.operations.map(
    (operation) => qualificationRank[operation.qualificationByMode.planning],
  ))
  if (qualificationRank[manifest.qualificationStatus] > lowestPlanningOperation) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Tool qualification summary cannot exceed its least-qualified planning operation.',
    })
  }
})

const runtimeStatusSchema: z.ZodType<ToolRuntimeStatus> = z.object({
  toolKey: safeKey,
  toolVersion: safeKey,
  observedAt: z.string().datetime({ offset: true }),
  availabilityStatus: z.enum(['available', 'degraded', 'unavailable', 'not_configured', 'blocked', 'unknown']),
  runtimeVersion: z.string().trim().min(1).max(180).optional(),
  credentialsConfigured: z.boolean(),
  healthProbePassed: z.boolean(),
  currentQueueDepth: z.number().int().nonnegative().max(1_000_000),
  availableConcurrency: z.number().int().nonnegative().max(1_000_000),
  providerQuotaAvailable: z.boolean().nullable(),
  currentRateCardSnapshotId: safeKey.optional(),
  lastSuccessfulCanaryEvidenceRef: safeKey.optional(),
  blockingReasons: stringList,
}).strict()

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, stableValue(item)]))
  }
  return value
}

export function canonicalToolManifestJson(
  manifest: ToolCapabilityManifest | UnpublishedToolCapabilityManifest,
): string {
  const { toolManifestHash: _ignored, ...hashable } = manifest as ToolCapabilityManifest
  void _ignored
  return JSON.stringify(stableValue(hashable))
}

export function calculateToolCapabilityManifestHash(
  manifest: ToolCapabilityManifest | UnpublishedToolCapabilityManifest,
): string {
  return createHash('sha256').update(canonicalToolManifestJson(manifest)).digest('hex')
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
  }
  return value
}

export function publishToolCapabilityManifest(
  input: UnpublishedToolCapabilityManifest,
): Readonly<ToolCapabilityManifest> {
  const candidate = {
    ...structuredClone(input),
    toolManifestHash: calculateToolCapabilityManifestHash(input),
  }
  const parsed = toolCapabilityManifestSchema.parse(candidate)
  if (calculateToolCapabilityManifestHash(parsed) !== parsed.toolManifestHash) {
    throw new Error('Tool capability manifest hash verification failed.')
  }
  return deepFreeze(parsed)
}

const manifestsByIdentity = new Map<string, Readonly<ToolCapabilityManifest>>()

export function registerToolCapabilityManifest(
  manifest: Readonly<ToolCapabilityManifest>,
): void {
  toolCapabilityManifestSchema.parse(manifest)
  const identity = `${manifest.toolKey}@${manifest.toolVersion}`
  const existing = manifestsByIdentity.get(identity)
  if (existing && existing.toolManifestHash !== manifest.toolManifestHash) {
    throw new Error(`Published tool manifest version ${identity} is immutable.`)
  }
  manifestsByIdentity.set(identity, manifest)
}

export function getToolCapabilityManifest(
  toolKey: string,
  toolVersion?: string,
): Readonly<ToolCapabilityManifest> | undefined {
  if (toolVersion) return manifestsByIdentity.get(`${toolKey}@${toolVersion}`)
  return [...manifestsByIdentity.values()]
    .filter((manifest) => manifest.toolKey === toolKey)
    .sort((left, right) => right.toolVersion.localeCompare(left.toolVersion))[0]
}

export function listToolCapabilityManifests(): readonly Readonly<ToolCapabilityManifest>[] {
  return [...manifestsByIdentity.values()].sort((left, right) =>
    `${left.toolKey}@${left.toolVersion}`.localeCompare(`${right.toolKey}@${right.toolVersion}`))
}

export function getToolOperationCapability(
  toolKey: string,
  operationKey: string,
  toolVersion?: string,
): { manifest: Readonly<ToolCapabilityManifest>; operation: Readonly<ToolOperationCapability> } | undefined {
  const manifest = getToolCapabilityManifest(toolKey, toolVersion)
  const operation = manifest?.operations.find((candidate) => candidate.operationKey === operationKey)
  return manifest && operation ? { manifest, operation } : undefined
}

export function qualificationSupportsToolMode(
  status: SkillQualificationStatus,
  mode: ToolExecutionMode,
): boolean {
  if (status === 'blocked' || status === 'deprecated' || status === 'declared') return false
  if (mode === 'planning') return [
    'planning_qualified', 'fixture_qualified', 'private_internal_qualified', 'production_qualified',
  ].includes(status)
  if (mode === 'preview_execution') return [
    'fixture_qualified', 'private_internal_qualified', 'production_qualified',
  ].includes(status)
  return status === 'production_qualified'
}

export function parseToolRuntimeStatus(input: unknown): ToolRuntimeStatus {
  return runtimeStatusSchema.parse(input)
}

export function toolRuntimeIsAvailable(status: ToolRuntimeStatus): boolean {
  return status.availabilityStatus === 'available' &&
    status.healthProbePassed &&
    status.availableConcurrency > 0 &&
    status.providerQuotaAvailable !== false
}
