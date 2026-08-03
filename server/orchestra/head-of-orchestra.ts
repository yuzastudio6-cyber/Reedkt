import type {
  SkillActiveAssignment,
  SkillAssignmentBlockCode,
  SkillAssignmentEvaluation,
  SkillCapabilityEntry,
  SkillCapabilityManifest,
  SkillEstimate,
  SkillInvalidationRule,
  SkillJobDescriptor,
  SkillManifestBinding,
  SkillRequestedMode,
  SkillPlanInvalidationResult,
  SkillRouteDefinition,
  SkillTimeRange,
} from '../../src/types/skill-capability-manifest'
import { qualificationSupportsMode } from './skill-capability-manifest'
import {
  canonicalSkillCapabilityRegistry,
  findEligibleSkills,
  getSkillCapabilityManifest,
  resolveSkillCapabilityEntry,
} from './skill-capability-registry'
import { canonicalSkillEstimatorRegistry } from './skill-estimator-registry'
import { registerCanonicalSoundSkill } from '../sound/sound-manifest'
import type { ToolRuntimeStatus } from '../tool-registry'

export {
  findEligibleSkills,
  getSkillCapabilityManifest,
  resolveSkillCapabilityEntry,
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values))
}

function blocked(
  code: SkillAssignmentBlockCode,
  reasons: string[],
  partial?: Partial<SkillAssignmentEvaluation>,
): SkillAssignmentEvaluation {
  return {
    ok: false,
    status: 'blocked',
    blockCode: code,
    reasons,
    dependencies: [],
    ordering: {
      mustRunBefore: [],
      mustRunAfter: [],
      planningPhase: 'scene_planning',
      allowedExecutionPhases: [],
    },
    conflicts: [],
    primaryToolRoutes: [],
    fallbackRoutes: [],
    lowerCostRoutes: [],
    requiredQa: { planning: [], output: [], integration: [] },
    invalidationRules: [],
    revisionRules: [],
    ...partial,
  }
}

function manifestBinding(
  manifest: SkillCapabilityManifest,
  capability: SkillCapabilityEntry,
  requestedMode: SkillRequestedMode,
): SkillManifestBinding {
  return {
    skillKey: manifest.skillKey,
    skillVersion: manifest.skillVersion,
    manifestSchemaVersion: manifest.manifestSchemaVersion,
    manifestId: manifest.manifestId,
    manifestHash: manifest.manifestHash,
    capabilityKey: capability.capabilityKey,
    capabilityVersion: capability.capabilityVersion,
    qualificationStatus: requestedMode === 'planning'
      ? capability.qualificationByExecutionMode.planning
      : requestedMode === 'production'
        ? capability.qualificationByExecutionMode.final_execution
        : capability.qualificationByExecutionMode.preview_execution,
  }
}

function rangesOverlap(left: SkillTimeRange, right: SkillTimeRange): boolean {
  return left.startFrame < right.endFrameExclusive &&
    left.endFrameExclusive > right.startFrame
}

function anyRangeOverlap(left: SkillTimeRange[], right: SkillTimeRange[]): boolean {
  return left.some((leftRange) => right.some((rightRange) => rangesOverlap(leftRange, rightRange)))
}

export function resolveSkillConflicts(
  job: SkillJobDescriptor,
  manifest: SkillCapabilityManifest,
  capability: SkillCapabilityEntry,
  activeAssignments: SkillActiveAssignment[] = job.activeAssignments,
): string[] {
  const conflicts: string[] = []
  for (const active of activeAssignments) {
    if (active.readOnly) continue
    if (capability.conflictsWith.includes(active.skillKey) || manifest.conflictsWith.includes(active.skillKey)) {
      conflicts.push(`declared_conflict:${active.assignmentId}`)
    }
    if (anyRangeOverlap(job.audioWriteRanges, active.audioWriteRanges)) {
      conflicts.push(`concurrent_audio_write:${active.assignmentId}`)
    }
    if (anyRangeOverlap(job.visualWriteRanges, active.visualWriteRanges)) {
      conflicts.push(`concurrent_visual_write:${active.assignmentId}`)
    }
  }
  return unique(conflicts)
}

export function resolveSkillDependencies(
  capability: SkillCapabilityEntry,
): string[] {
  return unique([
    ...capability.requiredInputs.map((value) => `input:${value}`),
    ...capability.requiredEvidence.map((value) => `evidence:${value}`),
    ...capability.mustRunAfter.map((value) => `after:${value}`),
  ])
}

export function resolveSkillOrdering(capability: SkillCapabilityEntry) {
  return {
    mustRunBefore: [...capability.mustRunBefore],
    mustRunAfter: [...capability.mustRunAfter],
    planningPhase: capability.planningPhase,
    allowedExecutionPhases: [...capability.allowedExecutionPhases],
  }
}

function resolveRoutes(
  manifest: SkillCapabilityManifest,
  keys: string[],
): SkillRouteDefinition[] {
  const routeByKey = new Map(manifest.toolRoutes.map((route) => [route.routeKey, route]))
  return keys.map((key) => routeByKey.get(key)).filter(
    (route): route is SkillRouteDefinition => Boolean(route),
  )
}

export function resolvePrimaryToolRoute(
  manifest: SkillCapabilityManifest,
  capability: SkillCapabilityEntry,
): SkillRouteDefinition[] {
  return resolveRoutes(manifest, capability.primaryToolRoutes)
}

export function resolveFallbackRoutes(
  manifest: SkillCapabilityManifest,
  capability: SkillCapabilityEntry,
): SkillRouteDefinition[] {
  return resolveRoutes(manifest, capability.fallbackRoutes)
}

export function resolveLowerCostRoutes(
  manifest: SkillCapabilityManifest,
  capability: SkillCapabilityEntry,
): SkillRouteDefinition[] {
  return resolveRoutes(manifest, capability.lowerCostRoutes)
}

export function resolveRequiredQa(capability: SkillCapabilityEntry) {
  return {
    planning: [...capability.planningQa],
    output: [...capability.outputQa],
    integration: [...capability.integrationQa],
  }
}

export function resolveInvalidationRules(
  manifest: SkillCapabilityManifest,
  capability: SkillCapabilityEntry,
): SkillInvalidationRule[] {
  const keys = new Set(capability.invalidationRules)
  return manifest.invalidationRules.filter((rule) => keys.has(rule.ruleKey))
}

export function estimateSkillTime(
  job: SkillJobDescriptor,
  capability: SkillCapabilityEntry,
): SkillEstimate | undefined {
  return canonicalSkillEstimatorRegistry.getTime(capability.timeEstimatorKey)?.(job, capability)
}

export function estimateSkillCredits(
  job: SkillJobDescriptor,
  capability: SkillCapabilityEntry,
): SkillEstimate | undefined {
  return canonicalSkillEstimatorRegistry.getCredit(capability.creditEstimatorKey)?.(job, capability)
}

export function evaluateSkillAssignment(
  job: SkillJobDescriptor,
  manifest: SkillCapabilityManifest,
  capability: SkillCapabilityEntry,
): SkillAssignmentEvaluation {
  const binding = manifestBinding(manifest, capability, job.requestedMode)
  const ordering = resolveSkillOrdering(capability)
  const shared = {
    binding,
    dependencies: resolveSkillDependencies(capability),
    ordering,
    requiredQa: resolveRequiredQa(capability),
    invalidationRules: resolveInvalidationRules(manifest, capability),
    revisionRules: manifest.revisionRules.filter((rule) => capability.revisionRules.includes(rule.ruleKey)),
  }

  if (manifest.unsupportedJobTypes.includes(job.jobType) || capability.supportedJobType !== job.jobType) {
    return blocked('unsupported_capability', [`Sound does not support ${job.jobType}.`], shared)
  }
  if (!capability.supportedScopeLevels.includes(job.scopeLevel)) {
    return blocked('scope_not_supported', [`${job.scopeLevel} scope is not supported.`], shared)
  }
  if (!capability.acceptedCallerTypes.includes(job.callerType)) {
    return blocked('caller_not_supported', [`${job.callerType} is not an accepted caller.`], shared)
  }
  if (job.primaryVisualOwnershipRequested && !manifest.canOwnPrimaryVisual) {
    return blocked('ownership_not_supported', ['Sound cannot own the primary visual.'], shared)
  }
  const missingInputs = capability.requiredInputs.filter(
    (value) => !job.inputArtifactTypes.includes(value),
  )
  const missingEvidence = capability.requiredEvidence.filter(
    (value) => !job.evidenceKeys.includes(value),
  )
  if (missingInputs.length > 0 || missingEvidence.length > 0) {
    return blocked('unmet_requirements', [
      ...missingInputs.map((value) => `missing_input:${value}`),
      ...missingEvidence.map((value) => `missing_evidence:${value}`),
    ], shared)
  }
  if (!qualificationSupportsMode(binding.qualificationStatus, job.requestedMode)) {
    return blocked('qualification_blocked', [
      `${capability.capabilityKey} is ${binding.qualificationStatus}, not ${job.requestedMode} qualified.`,
    ], shared)
  }
  if (
    job.planningPhase !== capability.planningPhase &&
    job.planningPhase !== 'revision'
  ) {
    return blocked('phase_not_supported', [
      `${capability.capabilityKey} requires ${capability.planningPhase}, not ${job.planningPhase}.`,
    ], shared)
  }
  const conflicts = resolveSkillConflicts(job, manifest, capability)
  if (conflicts.length > 0) {
    return blocked('conflict_detected', conflicts, { ...shared, conflicts })
  }

  const timeEstimate = estimateSkillTime(job, capability)
  const creditEstimate = estimateSkillCredits(job, capability)
  if (!timeEstimate || !creditEstimate) {
    return blocked('unmet_requirements', ['required_estimator_not_registered'], shared)
  }
  if (
    job.maximumExpectedMinutes !== undefined &&
    timeEstimate.expected > job.maximumExpectedMinutes
  ) {
    return blocked('time_limit_exceeded', ['expected_time_exceeds_job_limit'], {
      ...shared,
      timeEstimate,
      creditEstimate,
    })
  }
  if (
    job.maximumExpectedCredits !== undefined &&
    creditEstimate.expected > job.maximumExpectedCredits
  ) {
    return blocked('credit_limit_exceeded', ['expected_credits_exceed_job_limit'], {
      ...shared,
      timeEstimate,
      creditEstimate,
    })
  }

  const attemptPolicy = manifest.attemptPolicies.find(
    (policy) => policy.attemptPolicyKey === capability.attemptPolicyKey,
  )
  return {
    ok: true,
    status: 'eligible',
    reasons: [],
    ...shared,
    conflicts: [],
    timeEstimate,
    creditEstimate,
    primaryToolRoutes: resolvePrimaryToolRoute(manifest, capability),
    fallbackRoutes: resolveFallbackRoutes(manifest, capability),
    lowerCostRoutes: resolveLowerCostRoutes(manifest, capability),
    attemptPolicy,
  }
}

export function planSkillAssignment(
  skillKey: string,
  job: SkillJobDescriptor,
  skillVersion?: string,
): SkillAssignmentEvaluation {
  registerCanonicalSoundSkill()
  const manifest = canonicalSkillCapabilityRegistry.get(skillKey, skillVersion)
  if (!manifest) return blocked('unknown_skill', [`Unknown skill ${skillKey}.`])
  const capability = manifest.capabilityEntries.find(
    (entry) => entry.supportedJobType === job.jobType,
  )
  if (!capability) {
    return blocked('unsupported_capability', [
      manifest.unsupportedJobTypes.includes(job.jobType)
        ? `${job.jobType} is explicitly unsupported by ${skillKey}.`
        : `${skillKey} does not declare ${job.jobType}.`,
    ])
  }
  return evaluateSkillAssignment(job, manifest, capability)
}

/**
 * Orchestra-owned Sound inspection. The dynamic import avoids making the
 * generic skill registry depend on Sound's controller implementation while
 * still exposing the complete skill -> capability -> route -> operation view
 * from the Head-of-Orchestra boundary.
 */
export async function inspectSoundAssignmentTools(input: {
  job: SkillJobDescriptor
  runtimeStatuses: ToolRuntimeStatus[]
}) {
  const { createHeadOfOrchestraSoundView } = await import('../sound/sound-tool-views')
  return createHeadOfOrchestraSoundView(input)
}

export function evaluateManifestBindingInvalidation(input: {
  binding: SkillManifestBinding
  currentManifest: SkillCapabilityManifest
  changedSignals?: SkillInvalidationRule['trigger'][]
  executed: boolean
}): SkillPlanInvalidationResult {
  const reasons: string[] = []
  const triggers = new Set(input.changedSignals ?? [])
  if (input.binding.skillVersion !== input.currentManifest.skillVersion) {
    triggers.add('manifest_version_changed')
    reasons.push('manifest_version_changed')
  }
  if (input.binding.manifestHash !== input.currentManifest.manifestHash) {
    triggers.add('manifest_hash_changed')
    reasons.push('manifest_hash_changed')
  }
  const rules = input.currentManifest.invalidationRules.filter((rule) => triggers.has(rule.trigger))
  const incompatible = !input.executed && rules.some(
    (rule) => rule.effect === 'invalidate_all' || rule.effect === 'block_execution',
  )
  return {
    stale: rules.length > 0,
    incompatible,
    reasons: unique([...reasons, ...rules.map((rule) => rule.ruleKey)]),
    rules,
  }
}
