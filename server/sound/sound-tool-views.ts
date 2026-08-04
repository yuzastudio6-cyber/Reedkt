import {
  getToolCapabilityManifest,
  type ToolOperationBinding,
} from '../tool-registry'
import {
  evaluateSoundToolRouteAdmission,
  getSoundToolRouteManifest,
  listSoundToolRouteManifests,
  type SoundRouteAdmissionInput,
  type SoundToolRouteBinding,
} from './sound-tool-route-manifest'
import { registerCanonicalSoundToolRoutes } from './sound-tool-routes'
import type { SkillQualificationStatus } from '../edit-skills/core/edit-skill-ids'

export function createSoundControllerToolView() {
  registerCanonicalSoundToolRoutes()
  return listSoundToolRouteManifests().map((route) => ({
    route,
    operations: route.orderedOrGraphSteps.map((step) => {
      const manifest = getToolCapabilityManifest(step.toolKey, step.toolVersionConstraint)
      const operation = manifest?.operations.find((candidate) => candidate.operationKey === step.operationKey)
      if (!manifest || !operation) throw new Error(`Controller route operation is missing: ${step.stepKey}.`)
      return {
        manifest,
        operation,
        operationProfileKey: step.operationProfileKey,
        operationProfileVersion: step.operationProfileVersion,
      }
    }),
  }))
}

export function admitSoundControllerRoute(input: SoundRouteAdmissionInput) {
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

export interface SoundWorkerSkillBinding {
  skillKey: 'sound'
  skillVersion: string
  manifestSchemaVersion: string
  manifestHash: string
  capabilityKey: string
  capabilityVersion: string
  qualificationStatus: SkillQualificationStatus
}

export interface SoundWorkerFrameRange {
  startFrame: number
  endFrameExclusive: number
}

export interface SoundWorkerOperationPackage {
  schemaVersion: 'sound-worker-operation-package-v2'
  skillBinding: SoundWorkerSkillBinding
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
    inspectRanges: SoundWorkerFrameRange[]
    audioWriteRanges: SoundWorkerFrameRange[]
    visualWriteRanges: SoundWorkerFrameRange[]
  }
  attemptIdentity: { attemptId: string; idempotencyKey: string }
  outputContract: {
    artifactTypes: string[]
    privateOnly: true
    sourceOverwriteAllowed: false
    providerVisualMayReplaceApprovedVisual: false
  }
}

export function createSoundWorkerOperationPackage(input: {
  skillBinding: SoundWorkerSkillBinding
  routeBinding: SoundToolRouteBinding
  stepKey: string
  artifactBindings: SoundWorkerArtifactBinding[]
  inspectRanges: SoundWorkerFrameRange[]
  audioWriteRanges: SoundWorkerFrameRange[]
  visualWriteRanges: SoundWorkerFrameRange[]
  attemptId: string
  idempotencyKey: string
}): SoundWorkerOperationPackage {
  const route = getSoundToolRouteManifest(input.routeBinding.routeKey, input.routeBinding.routeVersion)
  if (!route || route.routeHash !== input.routeBinding.routeHash) throw new Error('Sound worker route binding is stale.')
  const step = route.orderedOrGraphSteps.find((candidate) => candidate.stepKey === input.stepKey)
  if (!step) throw new Error('Sound worker step is not part of the bound route.')
  const operationBinding = input.routeBinding.toolOperations.find((candidate) =>
    candidate.toolKey === step.toolKey && candidate.operationKey === step.operationKey &&
    candidate.operationProfileKey === step.operationProfileKey &&
    candidate.operationProfileVersion === step.operationProfileVersion)
  if (!operationBinding) throw new Error('Sound worker step lacks an exact qualified operation binding.')
  return {
    schemaVersion: 'sound-worker-operation-package-v2',
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
      artifactTypes: [...step.outputBindings], privateOnly: true,
      sourceOverwriteAllowed: false, providerVisualMayReplaceApprovedVisual: false,
    },
  }
}
