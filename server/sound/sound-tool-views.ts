import type {
  SkillAssignmentEvaluation,
  SkillCallerType,
  SkillJobDescriptor,
  SkillManifestBinding,
  SkillTimeRange,
} from '../../src/types/skill-capability-manifest'
import {
  getToolCapabilityManifest,
  type ToolOperationBinding,
  type ToolRuntimeStatus,
} from '../tool-registry'
import { planSkillAssignment } from '../orchestra/head-of-orchestra'
import { soundSkillCapabilityManifest } from './sound-manifest'
import {
  evaluateSoundToolRouteAdmission,
  getSoundToolRouteManifest,
  listSoundToolRouteManifests,
  type SoundRouteAdmissionInput,
  type SoundToolRouteBinding,
} from './sound-tool-route-manifest'
import { registerCanonicalSoundToolRoutes } from './sound-tool-routes'

export function createHeadOfOrchestraSoundView(input: {
  job: SkillJobDescriptor
  runtimeStatuses: ToolRuntimeStatus[]
}) {
  registerCanonicalSoundToolRoutes()
  const assignment = planSkillAssignment('sound', input.job)
  const capability = assignment.binding
    ? soundSkillCapabilityManifest.capabilityEntries.find((entry) =>
        entry.capabilityKey === assignment.binding?.capabilityKey)
    : undefined
  const routeKeys = new Set([
    ...(capability?.primaryToolRoutes ?? []),
    ...(capability?.fallbackRoutes ?? []),
    ...(capability?.lowerCostRoutes ?? []),
  ])
  const routes = listSoundToolRouteManifests()
    .filter((route) => route.capabilityKeys.includes(capability?.capabilityKey ?? '') || routeKeys.has(route.routeKey))
    .map((route) => ({
      routeKey: route.routeKey,
      routeVersion: route.routeVersion,
      routeHash: route.routeHash,
      routeRole: route.routeRole,
      qualificationStatus: route.qualificationStatus,
      qualificationByMode: { ...route.qualificationByMode },
      supportedScopes: [...route.supportedScopes],
      dependencies: route.orderedOrGraphSteps.map((step) => ({
        stepKey: step.stepKey,
        dependencies: [...step.orderOrDependencies],
      })),
      fallbackRouteKeys: [...route.fallbackPolicy.fallbackRouteKeys],
      attemptPolicyKey: route.attemptPolicyKey,
      qa: {
        planning: [...route.planningQa],
        output: [...route.finalOutputQa],
        integration: [...route.integrationQa],
      },
      limitations: [...route.knownLimitations],
      runtimeAvailability: route.orderedOrGraphSteps.map((step) => {
        const status = input.runtimeStatuses.find((candidate) =>
          candidate.toolKey === step.toolKey && candidate.toolVersion === step.toolVersionConstraint)
        return {
          stepKey: step.stepKey,
          toolKey: step.toolKey,
          availabilityStatus: status?.availabilityStatus ?? 'unknown',
          blockingReasons: [...(status?.blockingReasons ?? ['runtime_status_missing'])],
        }
      }),
    }))
  return {
    skillKey: 'sound' as const,
    skillVersion: soundSkillCapabilityManifest.skillVersion,
    manifestHash: soundSkillCapabilityManifest.manifestHash,
    supportedJobs: [...soundSkillCapabilityManifest.supportedJobTypes],
    unsupportedJobs: [...soundSkillCapabilityManifest.unsupportedJobTypes],
    scopeSupport: {
      video: soundSkillCapabilityManifest.canOperateAtVideoLevel,
      scene: soundSkillCapabilityManifest.canOperateAtSceneLevel,
      boundary: soundSkillCapabilityManifest.canOperateAtBoundaryLevel,
    },
    ownership: [...soundSkillCapabilityManifest.ownershipRequirements],
    dependencies: assignment.dependencies,
    phaseOrdering: assignment.ordering,
    conflicts: assignment.conflicts,
    estimates: { time: assignment.timeEstimate, credits: assignment.creditEstimate },
    attemptPolicy: assignment.attemptPolicy,
    routes,
    assignment,
  }
}

export function createPeerSoundCapabilityView(input: {
  callerType: Exclude<SkillCallerType, 'head_of_orchestra'>
  callerSkillKey: string
  job: SkillJobDescriptor
  runtimeStatuses: ToolRuntimeStatus[]
}) {
  const assignment = planSkillAssignment('sound', input.job)
  const capability = assignment.binding
    ? soundSkillCapabilityManifest.capabilityEntries.find((entry) =>
        entry.capabilityKey === assignment.binding?.capabilityKey)
    : undefined
  return {
    skillKey: 'sound' as const,
    callableCapability: capability?.capabilityKey,
    acceptedCaller: capability?.acceptedCallerTypes.includes(input.callerType) ?? false,
    requiredInputs: [...(capability?.requiredInputs ?? [])],
    optionalInputs: [...(capability?.optionalInputs ?? [])],
    supportedScopes: [...(capability?.supportedScopeLevels ?? [])],
    producedArtifacts: [...(capability?.producedArtifactTypes ?? [])],
    supportByMode: {
      planning: capability ? capability.qualificationByExecutionMode.planning !== 'blocked' : false,
      preview: capability ? ['fixture_qualified', 'private_internal_qualified', 'production_qualified']
        .includes(capability.qualificationByExecutionMode.preview_execution) : false,
      final: capability?.qualificationByExecutionMode.final_execution === 'production_qualified',
    },
    requiredVisualStability: capability?.visualIntelligenceRequirements ?? [],
    expectedTime: assignment.timeEstimate,
    expectedCredits: assignment.creditEstimate,
    currentAdmissionStatus: assignment.status,
    admissionReasons: [...assignment.reasons],
    knownLimitations: [...(capability?.knownLimitations ?? [])],
    requestBoundary: {
      peerMayCallSoundCapability: true as const,
      peerMayInvokeSoundToolsDirectly: false as const,
      peerMaySupplyProviderPayload: false as const,
      peerMaySupplyCredentials: false as const,
      peerMaySelectExecutableOrArguments: false as const,
      peerMayDispatchWorkers: false as const,
    },
  }
}

export function createSoundControllerToolView() {
  registerCanonicalSoundToolRoutes()
  return listSoundToolRouteManifests().map((route) => ({
    route,
    operations: route.orderedOrGraphSteps.map((step) => {
      const manifest = getToolCapabilityManifest(step.toolKey, step.toolVersionConstraint)
      const operation = manifest?.operations.find((candidate) => candidate.operationKey === step.operationKey)
      if (!manifest || !operation) throw new Error(`Controller route operation is missing: ${step.stepKey}.`)
      return { manifest, operation, operationProfileKey: step.operationProfileKey,
        operationProfileVersion: step.operationProfileVersion }
    }),
  }))
}

export function admitSoundControllerRoute(
  input: SoundRouteAdmissionInput,
) {
  registerCanonicalSoundToolRoutes()
  return evaluateSoundToolRouteAdmission(input)
}

export interface SoundWorkerArtifactBinding {
  artifactId: string
  artifactType: string
  checksumSha256: string
  version: number
  access: 'read_only' | 'create_new_version'
}

export interface SoundWorkerOperationPackage {
  schemaVersion: 'sound-worker-operation-package-v1'
  skillBinding: SkillManifestBinding
  routeBinding: Omit<SoundToolRouteBinding, 'toolOperations'> & {
    toolOperations: [ToolOperationBinding]
  }
  stepKey: string
  operationProfile: {
    operationProfileKey: string
    operationProfileVersion: string
  }
  artifactBindings: SoundWorkerArtifactBinding[]
  rangeAuthority: {
    inspectRanges: SkillTimeRange[]
    audioWriteRanges: SkillTimeRange[]
    visualWriteRanges: SkillTimeRange[]
  }
  attemptIdentity: {
    attemptId: string
    idempotencyKey: string
  }
  outputContract: {
    artifactTypes: string[]
    privateOnly: true
    sourceOverwriteAllowed: false
    providerVisualMayReplaceApprovedVisual: false
  }
}

export function createSoundWorkerOperationPackage(input: {
  skillBinding: SkillManifestBinding
  routeBinding: SoundToolRouteBinding
  stepKey: string
  artifactBindings: SoundWorkerArtifactBinding[]
  inspectRanges: SkillTimeRange[]
  audioWriteRanges: SkillTimeRange[]
  visualWriteRanges: SkillTimeRange[]
  attemptId: string
  idempotencyKey: string
}): SoundWorkerOperationPackage {
  const route = getSoundToolRouteManifest(input.routeBinding.routeKey, input.routeBinding.routeVersion)
  if (!route || route.routeHash !== input.routeBinding.routeHash) throw new Error('Sound worker route binding is stale.')
  const step = route.orderedOrGraphSteps.find((candidate) => candidate.stepKey === input.stepKey)
  if (!step) throw new Error('Sound worker step is not part of the bound route.')
  const operationBinding = input.routeBinding.toolOperations.find((candidate) =>
    candidate.toolKey === step.toolKey &&
    candidate.operationKey === step.operationKey &&
    candidate.operationProfileKey === step.operationProfileKey)
  if (!operationBinding) throw new Error('Sound worker step lacks an exact qualified operation binding.')
  return {
    schemaVersion: 'sound-worker-operation-package-v1',
    skillBinding: structuredClone(input.skillBinding),
    routeBinding: {
      routeKey: input.routeBinding.routeKey,
      routeVersion: input.routeBinding.routeVersion,
      routeHash: input.routeBinding.routeHash,
      qualificationEvidenceRefs: [...input.routeBinding.qualificationEvidenceRefs],
      toolOperations: [structuredClone(operationBinding)],
    },
    stepKey: step.stepKey,
    operationProfile: {
      operationProfileKey: step.operationProfileKey,
      operationProfileVersion: step.operationProfileVersion,
    },
    artifactBindings: input.artifactBindings.map((binding) => structuredClone(binding)),
    rangeAuthority: {
      inspectRanges: input.inspectRanges.map((range) => ({ ...range })),
      audioWriteRanges: input.audioWriteRanges.map((range) => ({ ...range })),
      visualWriteRanges: input.visualWriteRanges.map((range) => ({ ...range })),
    },
    attemptIdentity: { attemptId: input.attemptId, idempotencyKey: input.idempotencyKey },
    outputContract: {
      artifactTypes: [...step.outputBindings],
      privateOnly: true,
      sourceOverwriteAllowed: false,
      providerVisualMayReplaceApprovedVisual: false,
    },
  }
}

export function assignmentHasSoundToolAuthority(
  assignment: SkillAssignmentEvaluation,
): assignment is SkillAssignmentEvaluation & { binding: SkillManifestBinding } {
  return assignment.ok && assignment.binding?.skillKey === 'sound'
}
