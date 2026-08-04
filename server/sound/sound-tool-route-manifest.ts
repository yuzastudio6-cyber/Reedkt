import { createHash } from 'node:crypto'
import { z } from 'zod'
import type { SkillQualificationStatus } from '../edit-skills/core/edit-skill-ids'
import type { SkillScopeLevel } from '../edit-skills/core/skill-capability-manifest-types'
import {
  getToolOperationCapability,
  qualificationSupportsToolMode,
  toolRuntimeIsAvailable,
  type ToolExecutionMode,
  type ToolOperationBinding,
  type ToolRuntimeStatus,
} from '../tool-registry'

export const SOUND_TOOL_ROUTE_MANIFEST_SCHEMA_VERSION =
  'sound-tool-route-manifest-v1' as const

export interface SoundToolRouteStep {
  stepKey: string
  orderOrDependencies: string[]
  required: boolean
  toolKey: string
  toolVersionConstraint: string
  operationKey: string
  operationProfileKey: string
  operationProfileVersion: string
  inputBindings: string[]
  outputBindings: string[]
  executionCondition: string
  timeoutPolicy: {
    timeoutSeconds: number
    unknownOutcomeBehavior: 'fail_closed' | 'reconcile_without_resubmission'
  }
  retryPolicy: {
    maximumAttempts: number
    retryEligibility: 'idempotent_only' | 'reconciled_failure_only' | 'none'
  }
  requiredQualificationStatus: SkillQualificationStatus
  failureBehavior: 'block_route' | 'use_declared_fallback' | 'continue_without_optional_step'
}

export interface SoundToolRouteManifest {
  manifestSchemaVersion: typeof SOUND_TOOL_ROUTE_MANIFEST_SCHEMA_VERSION
  routeKey: string
  routeVersion: string
  routeHash: string
  skillKey: 'sound'
  capabilityKeys: string[]
  supportedJobTypes: string[]
  routeRole: 'primary' | 'fallback' | 'lower_cost' | 'no_sound' | 'qa' | 'support'
  qualificationStatus: SkillQualificationStatus
  qualificationByMode: Record<ToolExecutionMode, SkillQualificationStatus>
  qualificationEvidenceRefs: string[]
  requiredInputs: string[]
  producedArtifactTypes: string[]
  supportedScopes: SkillScopeLevel[]
  eligibilityRules: string[]
  orderedOrGraphSteps: SoundToolRouteStep[]
  timeEstimatorKey: string
  creditEstimatorKey: string
  attemptPolicyKey: string
  fallbackPolicy: {
    fallbackRouteRefs: Array<{ routeKey: string; routeVersion: string }>
    automaticFallbackAllowed: boolean
    unknownOutcomeResubmissionAllowed: false
    freshApprovalRequiredForCostIncrease: true
  }
  planningQa: string[]
  stepQa: string[]
  finalOutputQa: string[]
  integrationQa: string[]
  invalidationRules: string[]
  knownLimitations: string[]
}

export type UnpublishedSoundToolRouteManifest = Omit<
  SoundToolRouteManifest,
  'routeHash' | 'qualificationStatus' | 'qualificationByMode'
>

export interface SoundToolRouteBinding {
  routeKey: string
  routeVersion: string
  routeHash: string
  qualificationEvidenceRefs: string[]
  toolOperations: ToolOperationBinding[]
}

const safeKey = z.string().trim().min(1).max(220)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))
const hash = z.string().regex(/^[a-f0-9]{64}$/)
const keyList = z.array(safeKey).max(512)
const stringList = z.array(z.string().trim().min(1).max(2_000)).max(512)
const qualification = z.enum([
  'declared', 'implementation_pending', 'planning_qualified',
  'internal_execution_qualified', 'production_qualified', 'blocked', 'retired',
])
const scope = z.enum(['clip', 'range', 'multi_range', 'scene', 'boundary', 'sequence', 'video'])

const routeStepSchema: z.ZodType<SoundToolRouteStep> = z.object({
  stepKey: safeKey,
  orderOrDependencies: keyList,
  required: z.boolean(),
  toolKey: safeKey,
  toolVersionConstraint: safeKey,
  operationKey: safeKey,
  operationProfileKey: safeKey,
  operationProfileVersion: safeKey,
  inputBindings: keyList,
  outputBindings: keyList,
  executionCondition: safeKey,
  timeoutPolicy: z.object({
    timeoutSeconds: z.number().int().positive().max(86_400),
    unknownOutcomeBehavior: z.enum(['fail_closed', 'reconcile_without_resubmission']),
  }).strict(),
  retryPolicy: z.object({
    maximumAttempts: z.number().int().min(1).max(10),
    retryEligibility: z.enum(['idempotent_only', 'reconciled_failure_only', 'none']),
  }).strict(),
  requiredQualificationStatus: qualification,
  failureBehavior: z.enum(['block_route', 'use_declared_fallback', 'continue_without_optional_step']),
}).strict()

export const soundToolRouteManifestSchema: z.ZodType<SoundToolRouteManifest> = z.object({
  manifestSchemaVersion: z.literal(SOUND_TOOL_ROUTE_MANIFEST_SCHEMA_VERSION),
  routeKey: safeKey,
  routeVersion: safeKey,
  routeHash: hash,
  skillKey: z.literal('sound'),
  capabilityKeys: keyList,
  supportedJobTypes: keyList,
  routeRole: z.enum(['primary', 'fallback', 'lower_cost', 'no_sound', 'qa', 'support']),
  qualificationStatus: qualification,
  qualificationByMode: z.object({
    planning: qualification,
    preview_execution: qualification,
    final_execution: qualification,
  }).strict(),
  qualificationEvidenceRefs: keyList,
  requiredInputs: keyList,
  producedArtifactTypes: keyList,
  supportedScopes: z.array(scope).min(1).max(7),
  eligibilityRules: stringList,
  orderedOrGraphSteps: z.array(routeStepSchema).min(1).max(128),
  timeEstimatorKey: safeKey,
  creditEstimatorKey: safeKey,
  attemptPolicyKey: safeKey,
  fallbackPolicy: z.object({
    fallbackRouteRefs: z.array(z.object({
      routeKey: safeKey,
      routeVersion: safeKey,
    }).strict()).max(64),
    automaticFallbackAllowed: z.boolean(),
    unknownOutcomeResubmissionAllowed: z.literal(false),
    freshApprovalRequiredForCostIncrease: z.literal(true),
  }).strict(),
  planningQa: keyList,
  stepQa: keyList,
  finalOutputQa: keyList,
  integrationQa: keyList,
  invalidationRules: keyList,
  knownLimitations: stringList,
}).strict().superRefine((route, context) => {
  const stepKeys = new Set(route.orderedOrGraphSteps.map((step) => step.stepKey))
  if (stepKeys.size !== route.orderedOrGraphSteps.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Sound route step keys must be unique.' })
  }
  for (const step of route.orderedOrGraphSteps) {
    for (const dependency of step.orderOrDependencies) {
      if (!stepKeys.has(dependency)) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: `Unknown step dependency ${dependency}.` })
      }
      if (dependency === step.stepKey) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: `Step ${step.stepKey} cannot depend on itself.` })
      }
    }
  }
})

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

export function canonicalSoundRouteJson(
  route: SoundToolRouteManifest | Omit<SoundToolRouteManifest, 'routeHash'>,
): string {
  const { routeHash: _ignored, ...hashable } = route as SoundToolRouteManifest
  void _ignored
  return JSON.stringify(stableValue(hashable))
}

export function calculateSoundToolRouteHash(
  route: SoundToolRouteManifest | Omit<SoundToolRouteManifest, 'routeHash'>,
): string {
  return createHash('sha256').update(canonicalSoundRouteJson(route)).digest('hex')
}

const qualificationRank: Record<SkillQualificationStatus, number> = {
  blocked: 0,
  retired: 0,
  declared: 1,
  implementation_pending: 1,
  planning_qualified: 2,
  internal_execution_qualified: 4,
  production_qualified: 5,
}

function lowerQualification(
  left: SkillQualificationStatus,
  right: SkillQualificationStatus,
): SkillQualificationStatus {
  return qualificationRank[left] <= qualificationRank[right] ? left : right
}

function deriveQualification(
  steps: SoundToolRouteStep[],
): Record<ToolExecutionMode, SkillQualificationStatus> {
  const required = steps.filter((step) => step.required)
  const modes: ToolExecutionMode[] = ['planning', 'preview_execution', 'final_execution']
  return Object.fromEntries(modes.map((mode) => {
    let status: SkillQualificationStatus = 'production_qualified'
    for (const step of required) {
      const resolved = getToolOperationCapability(
        step.toolKey,
        step.operationKey,
        step.toolVersionConstraint,
      )
      if (!resolved) throw new Error(`Sound route references unknown operation ${step.toolKey}:${step.operationKey}.`)
      status = lowerQualification(status, resolved.operation.qualificationByMode[mode])
      if (qualificationRank[resolved.operation.qualificationByMode[mode]] < qualificationRank[step.requiredQualificationStatus]) {
        throw new Error(`Sound route step ${step.stepKey} does not meet its declared qualification requirement.`)
      }
    }
    return [mode, status]
  })) as Record<ToolExecutionMode, SkillQualificationStatus>
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
  }
  return value
}

export function publishSoundToolRouteManifest(
  input: UnpublishedSoundToolRouteManifest,
): Readonly<SoundToolRouteManifest> {
  const routeOutputs = new Set<string>()
  for (const step of input.orderedOrGraphSteps) {
    const resolved = getToolOperationCapability(
      step.toolKey,
      step.operationKey,
      step.toolVersionConstraint,
    )
    if (!resolved) throw new Error(`Sound route references unknown operation ${step.toolKey}:${step.operationKey}.`)
    const unsupportedJobs = input.supportedJobTypes.filter(
      (jobType) => !resolved.operation.supportedJobTypes.includes(jobType),
    )
    if (unsupportedJobs.length > 0) {
      throw new Error(
        `Sound route step ${step.stepKey} does not support route jobs: ${unsupportedJobs.join(',')}.`,
      )
    }
    const unsupportedOutputs = step.outputBindings.filter(
      (artifactType) => !resolved.operation.producedArtifactTypes.includes(artifactType),
    )
    if (unsupportedOutputs.length > 0) {
      throw new Error(
        `Sound route step ${step.stepKey} claims undeclared operation outputs: ${unsupportedOutputs.join(',')}.`,
      )
    }
    for (const output of step.outputBindings) routeOutputs.add(output)
  }
  const unboundRouteOutputs = input.producedArtifactTypes.filter((output) => !routeOutputs.has(output))
  if (unboundRouteOutputs.length > 0) {
    throw new Error(`Sound route claims outputs not produced by any step: ${unboundRouteOutputs.join(',')}.`)
  }
  const qualificationByMode = deriveQualification(input.orderedOrGraphSteps)
  const withoutHash = {
    ...structuredClone(input),
    qualificationStatus: qualificationByMode.final_execution,
    qualificationByMode,
  }
  const candidate = {
    ...withoutHash,
    routeHash: calculateSoundToolRouteHash(withoutHash),
  }
  const parsed = soundToolRouteManifestSchema.parse(candidate)
  if (calculateSoundToolRouteHash(parsed) !== parsed.routeHash) {
    throw new Error('Sound tool route hash verification failed.')
  }
  return deepFreeze(parsed)
}

const routes = new Map<string, Readonly<SoundToolRouteManifest>>()

export function registerSoundToolRouteManifest(route: Readonly<SoundToolRouteManifest>): void {
  soundToolRouteManifestSchema.parse(route)
  const identity = `${route.routeKey}@${route.routeVersion}`
  const existing = routes.get(identity)
  if (existing && existing.routeHash !== route.routeHash) {
    throw new Error(`Published Sound route version ${identity} is immutable.`)
  }
  routes.set(identity, route)
}

export function getSoundToolRouteManifest(
  routeKey: string,
  routeVersion?: string,
): Readonly<SoundToolRouteManifest> | undefined {
  if (routeVersion) return routes.get(`${routeKey}@${routeVersion}`)
  return [...routes.values()].filter((route) => route.routeKey === routeKey)
    .sort((left, right) => right.routeVersion.localeCompare(left.routeVersion))[0]
}

export function listSoundToolRouteManifests(): readonly Readonly<SoundToolRouteManifest>[] {
  return [...routes.values()].sort((left, right) =>
    `${left.routeKey}@${left.routeVersion}`.localeCompare(`${right.routeKey}@${right.routeVersion}`))
}

export function validateSoundToolRouteRegistry(): void {
  for (const route of listSoundToolRouteManifests()) {
    for (const fallbackRef of route.fallbackPolicy.fallbackRouteRefs) {
      const fallback = getSoundToolRouteManifest(fallbackRef.routeKey, fallbackRef.routeVersion)
      if (!fallback) {
        throw new Error(`Sound route ${route.routeKey} references unknown fallback ${fallbackRef.routeKey}@${fallbackRef.routeVersion}.`)
      }
      if (!route.supportedJobTypes.some((job) => fallback.supportedJobTypes.includes(job))) {
        throw new Error(`Sound fallback ${fallback.routeKey} supports none of ${route.routeKey}'s jobs.`)
      }
      const availableInputs = new Set([
        ...route.requiredInputs,
        ...route.orderedOrGraphSteps.flatMap((step) => step.outputBindings),
      ])
      const unavailable = fallback.requiredInputs.filter((input) => !availableInputs.has(input))
      if (unavailable.length > 0) {
        throw new Error(`Sound fallback ${fallback.routeKey} cannot accept route inputs: ${unavailable.join(',')}.`)
      }
    }
  }
}

export interface SoundRouteAdmissionInput {
  routeKey: string
  routeVersion?: string
  capabilityKey: string
  jobType: string
  mode: ToolExecutionMode
  scope: SkillScopeLevel
  availableInputKeys: string[]
  availableQaKeys: string[]
  runtimeStatuses: ToolRuntimeStatus[]
  budgetApproved: boolean
  rateCardSnapshotIds: Record<string, string | undefined>
  licenseEvidenceRefs: Record<string, string | undefined>
  selectedOptionalStepKeys?: string[]
}

export interface SoundRouteAdmissionResult {
  admitted: boolean
  reasons: string[]
  route?: Readonly<SoundToolRouteManifest>
  binding?: SoundToolRouteBinding
}

export function evaluateSoundToolRouteAdmission(
  input: SoundRouteAdmissionInput,
): SoundRouteAdmissionResult {
  const route = getSoundToolRouteManifest(input.routeKey, input.routeVersion)
  if (!route) return { admitted: false, reasons: ['unknown_sound_route'] }
  const reasons: string[] = []
  if (!route.capabilityKeys.includes(input.capabilityKey)) reasons.push('capability_not_supported_by_route')
  if (!route.supportedJobTypes.includes(input.jobType)) reasons.push('job_not_supported_by_route')
  if (!route.supportedScopes.includes(input.scope)) reasons.push('scope_not_supported_by_route')
    const routeFixtureEvidence = route.qualificationEvidenceRefs.some((ref) => ref.includes('injected_transport'))
    if (!qualificationSupportsToolMode(
      route.qualificationByMode[input.mode], input.mode, routeFixtureEvidence ? 'fixture' : undefined,
    )) {
    reasons.push(`route_not_${input.mode}_qualified`)
  }
  for (const required of route.requiredInputs) {
    if (!input.availableInputKeys.includes(required)) reasons.push(`missing_route_input:${required}`)
  }
  for (const qa of [...route.stepQa, ...route.finalOutputQa, ...route.integrationQa]) {
    if (input.mode !== 'planning' && !input.availableQaKeys.includes(qa)) reasons.push(`missing_qa:${qa}`)
  }
  const toolOperations: ToolOperationBinding[] = []
  const selectedOptional = new Set(input.selectedOptionalStepKeys ?? [])
  for (const optionalKey of selectedOptional) {
    const optional = route.orderedOrGraphSteps.find((step) => step.stepKey === optionalKey)
    if (!optional || optional.required) reasons.push(`invalid_optional_step_selection:${optionalKey}`)
  }
  for (const step of route.orderedOrGraphSteps.filter((candidate) =>
    candidate.required || selectedOptional.has(candidate.stepKey))) {
    const resolved = getToolOperationCapability(step.toolKey, step.operationKey, step.toolVersionConstraint)
    if (!resolved) {
      reasons.push(`missing_operation:${step.toolKey}:${step.operationKey}`)
      continue
    }
    const operationStatus = resolved.operation.qualificationByMode[input.mode]
    if (!resolved.operation.supportedJobTypes.includes(input.jobType)) {
      reasons.push(`operation_job_not_supported:${step.toolKey}:${step.operationKey}:${input.jobType}`)
    }
    if (!qualificationSupportsToolMode(operationStatus, input.mode, resolved.operation.qualificationEvidenceLevel)) {
      reasons.push(`operation_not_${input.mode}_qualified:${step.toolKey}:${step.operationKey}`)
    }
    const requirements = resolved.operation.executionRequirements
    if (input.mode !== 'planning' && requirements.creditReservationRequired && !input.budgetApproved) {
      reasons.push(`budget_not_approved:${step.toolKey}:${step.operationKey}`)
    }
    const runtime = input.runtimeStatuses.find((status) =>
      status.toolKey === resolved.manifest.toolKey && status.toolVersion === resolved.manifest.toolVersion)
    if (input.mode !== 'planning' && requirements.runtimeAvailabilityRequired && (!runtime || !toolRuntimeIsAvailable(runtime))) {
      reasons.push(`runtime_unavailable:${step.toolKey}`)
    }
    const rateCardSnapshotId = input.rateCardSnapshotIds[step.toolKey]
    if (input.mode !== 'planning' && requirements.rateCardSnapshotRequired && !rateCardSnapshotId) {
      reasons.push(`rate_card_snapshot_missing:${step.toolKey}`)
    }
    const licenseEvidenceRef = input.licenseEvidenceRefs[step.toolKey]
    if (input.mode !== 'planning' && requirements.licenseEvidenceRequired && !licenseEvidenceRef) {
      reasons.push(`license_evidence_missing:${step.toolKey}`)
    }
    toolOperations.push({
      toolKey: resolved.manifest.toolKey,
      toolVersion: resolved.manifest.toolVersion,
      toolManifestHash: resolved.manifest.toolManifestHash,
      operationKey: resolved.operation.operationKey,
      operationVersion: resolved.operation.operationVersion,
      operationProfileKey: step.operationProfileKey,
      operationProfileVersion: step.operationProfileVersion,
      qualificationEvidenceRefs: [...new Set([
        ...resolved.manifest.qualificationEvidenceRefs,
        ...resolved.operation.qualificationEvidenceRefs,
      ])],
      ...(rateCardSnapshotId ? { rateCardSnapshotId } : {}),
      ...(licenseEvidenceRef ? { licenseEvidenceRef } : {}),
    })
  }
  if (reasons.length > 0) return { admitted: false, reasons: [...new Set(reasons)], route }
  return {
    admitted: true,
    reasons: [],
    route,
    binding: {
      routeKey: route.routeKey,
      routeVersion: route.routeVersion,
      routeHash: route.routeHash,
      qualificationEvidenceRefs: [...route.qualificationEvidenceRefs],
      toolOperations,
    },
  }
}

export function evaluateSoundRouteBindingInvalidation(input: {
  binding: SoundToolRouteBinding
  materialProfileChanges?: string[]
}): { stale: boolean; reasons: string[] } {
  const reasons: string[] = []
  const currentRoute = getSoundToolRouteManifest(input.binding.routeKey, input.binding.routeVersion)
  if (!currentRoute || currentRoute.routeHash !== input.binding.routeHash) reasons.push('sound_route_manifest_changed')
  if (currentRoute) {
    const currentEvidence = [...currentRoute.qualificationEvidenceRefs].sort()
    const boundEvidence = [...input.binding.qualificationEvidenceRefs].sort()
    if (JSON.stringify(currentEvidence) !== JSON.stringify(boundEvidence)) {
      reasons.push('sound_route_qualification_evidence_changed')
    }
  }
  for (const binding of input.binding.toolOperations) {
    const current = getToolOperationCapability(binding.toolKey, binding.operationKey, binding.toolVersion)
    if (!current || current.manifest.toolManifestHash !== binding.toolManifestHash ||
      current.operation.operationVersion !== binding.operationVersion) {
      reasons.push(`tool_operation_manifest_changed:${binding.toolKey}:${binding.operationKey}`)
    }
    const currentStep = currentRoute?.orderedOrGraphSteps.find((step) =>
      step.toolKey === binding.toolKey &&
      step.toolVersionConstraint === binding.toolVersion &&
      step.operationKey === binding.operationKey &&
      step.operationProfileKey === binding.operationProfileKey &&
      step.operationProfileVersion === binding.operationProfileVersion)
    if (!currentStep) {
      reasons.push(`operation_profile_changed:${binding.toolKey}:${binding.operationKey}`)
    }
    if (current) {
      const currentOperationEvidence = [...new Set([
        ...current.manifest.qualificationEvidenceRefs,
        ...current.operation.qualificationEvidenceRefs,
      ])].sort()
      const boundOperationEvidence = [...binding.qualificationEvidenceRefs].sort()
      if (JSON.stringify(currentOperationEvidence) !== JSON.stringify(boundOperationEvidence)) {
        reasons.push(`tool_operation_qualification_evidence_changed:${binding.toolKey}:${binding.operationKey}`)
      }
    }
  }
  for (const changed of input.materialProfileChanges ?? []) reasons.push(`operation_profile_changed:${changed}`)
  return { stale: reasons.length > 0, reasons: [...new Set(reasons)] }
}
