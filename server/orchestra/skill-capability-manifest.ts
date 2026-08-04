import { createHash } from 'node:crypto'
import { z } from 'zod'
import {
  SKILL_CAPABILITY_MANIFEST_SCHEMA_VERSION,
  SKILL_CAPABILITY_MANIFEST_SCHEMA_VERSION_V2,
  type AnySkillCapabilityManifest,
  type SkillCapabilityEntry,
  type SkillCapabilityManifest,
  type SkillCapabilityManifestV2,
  type SkillQualificationStatus,
  type UnpublishedSkillCapabilityManifest,
  type UnpublishedSkillCapabilityManifestV2,
} from '../../src/types/skill-capability-manifest'
import { assertClosedContractTree, isClosedContractRecord } from '../../src/lib/closed-contract-validation'

const safeKey = z.string().trim().min(1).max(180)
  .regex(/^[a-z0-9][a-z0-9._:-]*$/)
const nonEmpty = z.string().trim().min(1).max(2_000)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/)

export const skillQualificationStatusSchema = z.enum([
  'declared',
  'planning_qualified',
  'fixture_qualified',
  'private_internal_qualified',
  'production_qualified',
  'blocked',
  'deprecated',
])

const stringList = z.array(nonEmpty).max(256)
const keyList = z.array(safeKey).max(256)
const phase = z.enum([
  'early_study',
  'scene_planning',
  'boundary_planning',
  'post_visual_generation_support',
  'post_visual_timing_lock_synchronization',
  'pre_final_composition_mixing',
  'qa',
  'revision',
])
const executionPhase = z.enum([
  'planning',
  'approved_private_execution',
  'provider_generation',
  'synchronization',
  'mixing',
  'qa',
  'handoff',
  'revision',
])
const scope = z.enum([
  'clip', 'range', 'multi_range', 'scene', 'boundary', 'sequence', 'video',
])
const caller = z.enum([
  'head_of_orchestra',
  'living_frame',
  'three_d',
  'motion_design',
  'transitions',
  'graphic_design',
  'typed_peer_skill',
])
const overlap = z.object({
  skillKey: safeKey,
  mode: z.enum([
    'parallel_planning',
    'read_only_overlap',
    'ordered_execution',
    'mutually_exclusive_write',
  ]),
}).strict()

const evidence = z.object({
  evidenceId: safeKey,
  evidenceType: z.enum([
    'test', 'smoke_test', 'fixture', 'provider_canary', 'runtime', 'artifact',
    'qa', 'license', 'privacy', 'deployment',
  ]),
  location: nonEmpty,
  assertion: nonEmpty,
  verifiedAt: z.string().datetime({ offset: true }).optional(),
}).strict()

const route = z.object({
  routeKey: safeKey,
  routeVersion: safeKey,
  category: z.enum([
    'project_source', 'internal_library', 'project_extraction',
    'local_processing', 'provider', 'no_output',
  ]),
  displayName: nonEmpty,
  qualificationStatus: skillQualificationStatusSchema,
  qualificationEvidenceRefs: keyList,
  serverOwned: z.literal(true),
  paid: z.boolean(),
  providerProfileKey: safeKey.optional(),
  toolOperationProfileKeys: keyList.optional(),
  knownLimitations: stringList,
}).strict()

const attemptPolicy = z.object({
  attemptPolicyKey: safeKey,
  attemptPolicyVersion: safeKey,
  operationClass: z.enum(['deterministic_local', 'provider_generation', 'planning']),
  defaultCandidateCount: z.number().int().min(0).max(16),
  maximumCandidateCount: z.number().int().min(0).max(32),
  maximumAttempts: z.number().int().min(1).max(10),
  retryEligibility: z.enum(['idempotent_only', 'reconciled_failure_only', 'not_applicable']),
  fallbackEligibility: z.enum(['after_reconciled_failure', 'before_provider_submission_only', 'not_applicable']),
  unknownOutcomeBehavior: z.enum(['reconcile_without_resubmission', 'not_applicable']),
  cancellationBehavior: nonEmpty,
  timeoutSeconds: z.number().int().min(1).max(86_400),
  idempotencyRequired: z.boolean(),
  failedAttemptsMayRetainCost: z.boolean(),
  freshApprovalRequiredAfterExhaustion: z.boolean(),
}).strict().superRefine((value, context) => {
  if (value.defaultCandidateCount > value.maximumCandidateCount) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Attempt-policy default candidate count exceeds its maximum.',
    })
  }
})

const estimator = z.object({
  estimatorKey: safeKey,
  estimatorVersion: safeKey,
  factors: keyList,
}).strict()

const invalidation = z.object({
  ruleKey: safeKey,
  trigger: z.enum([
    'source_video_hash_changed', 'source_audio_hash_changed',
    'visual_artifact_version_changed', 'visual_timing_changed',
    'transition_timing_changed', 'tracking_changed', 'motion_path_changed',
    'material_metadata_changed', 'speech_timing_changed',
    'dialogue_ranges_changed', 'music_context_changed',
    'authorized_range_changed', 'locked_layer_state_changed',
    'provider_profile_changed', 'tool_profile_changed',
    'manifest_version_changed', 'manifest_hash_changed',
    'approval_snapshot_changed', 'provenance_status_changed',
  ]),
  effect: z.enum([
    'invalidate_all', 'invalidate_affected_ranges', 'recheck_qa', 'block_execution',
  ]),
  appliesToPhases: z.array(executionPhase).min(1),
}).strict()

const revision = z.object({
  ruleKey: safeKey,
  behavior: z.enum([
    'preserve_unaffected_cues', 'preserve_valid_asset_versions',
    'reprocess_invalidated_ranges_only', 'update_cue_manifest',
    'update_mix_manifest', 'rerun_affected_qa', 'update_caller_receipt',
    'maintain_revision_lineage',
  ]),
}).strict()

export const skillCapabilityEntrySchema: z.ZodType<SkillCapabilityEntry> = z.object({
  capabilityKey: safeKey,
  capabilityVersion: safeKey,
  displayName: nonEmpty,
  description: nonEmpty,
  supportedJobType: safeKey,
  qualificationStatus: skillQualificationStatusSchema,
  qualificationByExecutionMode: z.object({
    planning: skillQualificationStatusSchema,
    preview_execution: skillQualificationStatusSchema,
    final_execution: skillQualificationStatusSchema,
  }).strict(),
  qualificationEvidenceRefs: keyList,
  supportedScopeLevels: z.array(scope).min(1),
  acceptedCallerTypes: z.array(caller).min(1),
  requiredInputs: keyList,
  optionalInputs: keyList,
  requiredEvidence: keyList,
  acceptedArtifactTypes: keyList,
  producedArtifactTypes: keyList,
  requiredContext: keyList,
  visualIntelligenceRequirements: keyList,
  trackingRequirements: keyList,
  planningPhase: phase,
  allowedExecutionPhases: z.array(executionPhase).min(1),
  mustRunBefore: keyList,
  mustRunAfter: keyList,
  conflictsWith: keyList,
  mayOverlapWith: z.array(overlap),
  ownershipRequirements: keyList,
  timeEstimatorKey: safeKey,
  creditEstimatorKey: safeKey,
  attemptPolicyKey: safeKey,
  primaryToolRoutes: keyList,
  fallbackRoutes: keyList,
  lowerCostRoutes: keyList,
  planningQa: keyList,
  outputQa: keyList,
  integrationQa: keyList,
  invalidationRules: keyList,
  revisionRules: keyList,
  qualificationFixtures: keyList,
  knownLimitations: stringList,
}).strict()

export const skillCapabilityManifestSchema: z.ZodType<SkillCapabilityManifest> = z.object({
  manifestSchemaVersion: z.literal(SKILL_CAPABILITY_MANIFEST_SCHEMA_VERSION),
  manifestId: safeKey,
  manifestHash: sha256,
  skillKey: safeKey,
  skillVersion: safeKey,
  contractVersion: safeKey,
  qualificationStatus: skillQualificationStatusSchema,
  qualificationByExecutionMode: z.object({
    planning: skillQualificationStatusSchema,
    preview_execution: skillQualificationStatusSchema,
    final_execution: skillQualificationStatusSchema,
  }).strict(),
  qualificationEvidenceRefs: z.array(evidence).min(1).max(512),
  skillClass: nonEmpty,
  coordinationCritical: z.boolean(),
  canOwnPrimaryVisual: z.boolean(),
  canActAsSupport: z.boolean(),
  canOperateAtVideoLevel: z.boolean(),
  canOperateAtSceneLevel: z.boolean(),
  canOperateAtBoundaryLevel: z.boolean(),
  supportedJobTypes: keyList,
  unsupportedJobTypes: keyList,
  requiredInputs: keyList,
  optionalInputs: keyList,
  requiredSceneContext: keyList,
  requiredSourceEvidence: keyList,
  visualIntelligenceRequirements: keyList,
  trackingRequirements: keyList,
  acceptedArtifactTypes: keyList,
  producedArtifactTypes: keyList,
  planningPhase: phase,
  allowedExecutionPhases: z.array(executionPhase).min(1),
  mustRunBefore: keyList,
  mustRunAfter: keyList,
  conflictsWith: keyList,
  mayOverlapWith: z.array(overlap),
  ownershipRequirements: keyList,
  timeEstimator: estimator,
  creditEstimator: estimator,
  attemptPolicies: z.array(attemptPolicy).min(1),
  toolRoutes: z.array(route).min(1),
  fallbackRoutes: keyList,
  lowerCostRoutes: keyList,
  planningQa: keyList,
  outputQa: keyList,
  integrationQa: keyList,
  invalidationRules: z.array(invalidation).min(1),
  revisionRules: z.array(revision).min(1),
  qualificationFixtures: keyList,
  knownLimitations: stringList,
  capabilityEntries: z.array(skillCapabilityEntrySchema).min(1).max(512),
}).strict().superRefine((manifest, context) => {
  validateManifestRelationships(manifest).forEach((message) => context.addIssue({
    code: z.ZodIssueCode.custom,
    message,
  }))
})

function validateManifestRelationships(manifest: SkillCapabilityManifest): string[] {
  const errors: string[] = []
  const evidenceIds = new Set(manifest.qualificationEvidenceRefs.map((item) => item.evidenceId))
  const routeIds = new Set(manifest.toolRoutes.map((item) => item.routeKey))
  const attemptIds = new Set(manifest.attemptPolicies.map((item) => item.attemptPolicyKey))
  const invalidationIds = new Set(manifest.invalidationRules.map((item) => item.ruleKey))
  const revisionIds = new Set(manifest.revisionRules.map((item) => item.ruleKey))
  const capabilityIds = new Set<string>()
  const jobTypes = new Set<string>()

  for (const routeEntry of manifest.toolRoutes) {
    for (const ref of routeEntry.qualificationEvidenceRefs) {
      if (!evidenceIds.has(ref)) errors.push(`Route ${routeEntry.routeKey} references unknown evidence ${ref}.`)
    }
  }

  for (const entry of manifest.capabilityEntries) {
    if (capabilityIds.has(entry.capabilityKey)) errors.push(`Duplicate capability key ${entry.capabilityKey}.`)
    if (jobTypes.has(entry.supportedJobType)) errors.push(`Duplicate supported job type ${entry.supportedJobType}.`)
    capabilityIds.add(entry.capabilityKey)
    jobTypes.add(entry.supportedJobType)
    if (entry.qualificationStatus !== entry.qualificationByExecutionMode.planning) {
      errors.push(`Capability ${entry.capabilityKey} summary must equal its planning qualification.`)
    }
    if (!manifest.supportedJobTypes.includes(entry.supportedJobType)) {
      errors.push(`Capability ${entry.capabilityKey} job is absent from supportedJobTypes.`)
    }
    for (const ref of entry.qualificationEvidenceRefs) {
      if (!evidenceIds.has(ref)) errors.push(`Capability ${entry.capabilityKey} references unknown evidence ${ref}.`)
    }
    for (const ref of [...entry.primaryToolRoutes, ...entry.fallbackRoutes, ...entry.lowerCostRoutes]) {
      if (!routeIds.has(ref)) errors.push(`Capability ${entry.capabilityKey} references unknown route ${ref}.`)
    }
    if (!attemptIds.has(entry.attemptPolicyKey)) {
      errors.push(`Capability ${entry.capabilityKey} references unknown attempt policy ${entry.attemptPolicyKey}.`)
    }
    for (const ref of entry.invalidationRules) {
      if (!invalidationIds.has(ref)) errors.push(`Capability ${entry.capabilityKey} references unknown invalidation rule ${ref}.`)
    }
    for (const ref of entry.revisionRules) {
      if (!revisionIds.has(ref)) errors.push(`Capability ${entry.capabilityKey} references unknown revision rule ${ref}.`)
    }
  }

  if (jobTypes.size !== manifest.supportedJobTypes.length) {
    errors.push('Every supported job type must have exactly one capability entry.')
  }
  if (manifest.unsupportedJobTypes.some((jobType) => jobTypes.has(jobType))) {
    errors.push('Supported and unsupported job types must be disjoint.')
  }
  if (manifest.qualificationStatus !== manifest.qualificationByExecutionMode.planning) {
    errors.push('Top-level skill qualification summary must equal its planning qualification.')
  }
  if (manifest.qualificationStatus === 'production_qualified') {
    const notProduction = manifest.capabilityEntries.filter(
      (entry) => entry.qualificationStatus !== 'production_qualified',
    )
    if (notProduction.length > 0) {
      errors.push('A production-qualified manifest cannot aggregate non-production capability entries.')
    }
  }
  return errors
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, stableValue(item)]),
    )
  }
  return value
}

export function canonicalManifestJson(
  manifest:
    | UnpublishedSkillCapabilityManifest
    | SkillCapabilityManifest
    | UnpublishedSkillCapabilityManifestV2
    | SkillCapabilityManifestV2,
): string {
  const { manifestHash: _ignored, ...hashable } = manifest as AnySkillCapabilityManifest
  void _ignored
  return JSON.stringify(stableValue(hashable))
}

export function calculateSkillCapabilityManifestHash(
  manifest:
    | UnpublishedSkillCapabilityManifest
    | SkillCapabilityManifest
    | UnpublishedSkillCapabilityManifestV2
    | SkillCapabilityManifestV2,
): string {
  return createHash('sha256').update(canonicalManifestJson(manifest)).digest('hex')
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
  }
  return value
}

export function publishSkillCapabilityManifest(
  input: UnpublishedSkillCapabilityManifest,
): Readonly<SkillCapabilityManifest> {
  assertClosedContractTree(input, 'Skill capability manifest v1')
  const candidate: SkillCapabilityManifest = {
    ...structuredClone(input),
    manifestHash: calculateSkillCapabilityManifestHash(input),
  }
  const parsed = skillCapabilityManifestSchema.parse(candidate)
  if (calculateSkillCapabilityManifestHash(parsed) !== parsed.manifestHash) {
    throw new Error('Skill capability manifest hash verification failed.')
  }
  return deepFreeze(parsed)
}

function isSafeKey(value: unknown): value is string {
  return typeof value === 'string'
    && value.length > 0
    && value.length <= 180
    && /^[a-z0-9][a-z0-9._:-]*$/u.test(value)
}

function isSha256(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value)
}

function hasExactlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length
    && actual.every((key, index) => key === expected[index])
}

export function parseSkillCapabilityManifestV2(
  value: unknown,
): SkillCapabilityManifestV2 {
  assertClosedContractTree(value, 'Skill capability manifest v2')
  if (!isClosedContractRecord(value)) {
    throw new Error('Skill capability manifest v2 must be a record.')
  }
  const {
    canOwnPrimaryAnalysis,
    invocationPolicy,
    resultContract,
    failureSemantics,
    securityPolicyRef,
    manifestSchemaVersion,
    ...v1Body
  } = value
  if (manifestSchemaVersion !== SKILL_CAPABILITY_MANIFEST_SCHEMA_VERSION_V2) {
    throw new Error('Skill capability manifest v2 has the wrong schema version.')
  }
  const parsedV1 = skillCapabilityManifestSchema.parse({
    ...v1Body,
    manifestSchemaVersion: SKILL_CAPABILITY_MANIFEST_SCHEMA_VERSION,
  })
  if (typeof canOwnPrimaryAnalysis !== 'boolean') {
    throw new Error('Skill capability manifest v2 requires canOwnPrimaryAnalysis.')
  }
  if (!isClosedContractRecord(invocationPolicy) || !hasExactlyKeys(invocationPolicy, [
    'acceptedCallContractVersions', 'hqMediated', 'directPeerDispatchAllowed',
    'missingDependencyDisposition', 'resumeRequiresExactRequestBinding',
    'resumeRequiresApprovedArtifactInjection',
  ])) {
    throw new Error('Skill capability manifest v2 has an invalid invocationPolicy.')
  }
  if (!Array.isArray(invocationPolicy.acceptedCallContractVersions)
    || invocationPolicy.acceptedCallContractVersions.length < 1
    || invocationPolicy.acceptedCallContractVersions.some((item) => !isSafeKey(item))
    || invocationPolicy.hqMediated !== true
    || invocationPolicy.directPeerDispatchAllowed !== false
    || invocationPolicy.missingDependencyDisposition !== 'needs_followup'
    || invocationPolicy.resumeRequiresExactRequestBinding !== true
    || invocationPolicy.resumeRequiresApprovedArtifactInjection !== true) {
    throw new Error('Skill capability manifest v2 invocationPolicy violates the neutral call boundary.')
  }
  if (!isClosedContractRecord(resultContract) || !hasExactlyKeys(resultContract, [
    'jobResultSchemaVersion', 'supportRequestSchemaVersion', 'byteFreeCoordinationPayloads',
    'closedSerializedDataRequired', 'exactScopeEchoRequired',
    'exactQualificationBindingRequired',
  ]) || !isSafeKey(resultContract.jobResultSchemaVersion)
    || !isSafeKey(resultContract.supportRequestSchemaVersion)
    || resultContract.byteFreeCoordinationPayloads !== true
    || resultContract.closedSerializedDataRequired !== true
    || resultContract.exactScopeEchoRequired !== true
    || resultContract.exactQualificationBindingRequired !== true) {
    throw new Error('Skill capability manifest v2 has an invalid resultContract.')
  }
  if (!isClosedContractRecord(failureSemantics) || !hasExactlyKeys(failureSemantics, [
    'unsupportedJobDisposition', 'missingEvidenceDisposition', 'staleAuthorityDisposition',
    'invalidInputDisposition', 'maskFailureScope', 'unrelatedWorkMayContinue',
    'noImplicitFallback',
  ]) || failureSemantics.unsupportedJobDisposition !== 'unsupported'
    || failureSemantics.missingEvidenceDisposition !== 'needs_followup'
    || failureSemantics.staleAuthorityDisposition !== 'blocked'
    || failureSemantics.invalidInputDisposition !== 'blocked'
    || failureSemantics.maskFailureScope !== 'mask_dependent_work_only'
    || failureSemantics.unrelatedWorkMayContinue !== true
    || failureSemantics.noImplicitFallback !== true) {
    throw new Error('Skill capability manifest v2 has invalid failureSemantics.')
  }
  if (!isClosedContractRecord(securityPolicyRef) || !hasExactlyKeys(securityPolicyRef, [
    'policyId', 'policyVersion', 'contentHash',
  ]) || !isSafeKey(securityPolicyRef.policyId)
    || !isSafeKey(securityPolicyRef.policyVersion)
    || !isSha256(securityPolicyRef.contentHash)) {
    throw new Error('Skill capability manifest v2 has an invalid securityPolicyRef.')
  }
  const parsed: SkillCapabilityManifestV2 = {
    ...parsedV1,
    manifestSchemaVersion: SKILL_CAPABILITY_MANIFEST_SCHEMA_VERSION_V2,
    canOwnPrimaryAnalysis,
    invocationPolicy: invocationPolicy as unknown as SkillCapabilityManifestV2['invocationPolicy'],
    resultContract: resultContract as unknown as SkillCapabilityManifestV2['resultContract'],
    failureSemantics: failureSemantics as unknown as SkillCapabilityManifestV2['failureSemantics'],
    securityPolicyRef: securityPolicyRef as unknown as SkillCapabilityManifestV2['securityPolicyRef'],
  }
  return parsed
}

export function publishSkillCapabilityManifestV2(
  input: UnpublishedSkillCapabilityManifestV2,
): Readonly<SkillCapabilityManifestV2> {
  assertClosedContractTree(input, 'Skill capability manifest v2 input')
  const candidate = {
    ...structuredClone(input),
    manifestHash: calculateSkillCapabilityManifestHash(input),
  }
  const parsed = parseSkillCapabilityManifestV2(candidate)
  if (calculateSkillCapabilityManifestHash(parsed) !== parsed.manifestHash) {
    throw new Error('Skill capability manifest v2 hash verification failed.')
  }
  return deepFreeze(parsed)
}

export function qualificationSupportsMode(
  qualification: SkillQualificationStatus,
  mode: 'planning' | 'fixture' | 'private_internal' | 'production',
): boolean {
  if (qualification === 'blocked' || qualification === 'deprecated' || qualification === 'declared') {
    return false
  }
  if (mode === 'planning') return true
  if (mode === 'fixture') {
    return qualification === 'fixture_qualified' ||
      qualification === 'private_internal_qualified' ||
      qualification === 'production_qualified'
  }
  if (mode === 'private_internal') {
    return qualification === 'private_internal_qualified' ||
      qualification === 'production_qualified'
  }
  return qualification === 'production_qualified'
}
