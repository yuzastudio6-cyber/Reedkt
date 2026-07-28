import type {
  CanonicalLivingFrameExecutionRequirements,
  CanonicalLivingFrameExecutionRequirementsAuthorityBoundary,
  CanonicalLivingFrameExecutionRequirementsDraft,
  CanonicalLivingFrameSceneExecutionRequirement,
} from '../../src/types/living-frame-execution-requirements'
import {
  CANONICAL_LIVING_FRAME_EXECUTION_BLOCKER_CODES,
  CANONICAL_LIVING_FRAME_EXECUTION_REQUIREMENTS_SOURCE,
  CANONICAL_LIVING_FRAME_EXECUTION_REQUIREMENTS_VERSION,
} from '../../src/types/living-frame-execution-requirements'
import type {
  LivingFrameCapabilityKey,
  LivingFrameMiniSkillKey,
  LivingFrameQaCode,
} from '../../src/types/living-frame'
import type {
  LivingFrameMissingOperationCode,
  LivingFrameWorkExternalGateCode,
} from '../../src/types/living-frame-work-admission'
import type {
  CanonicalLivingFrameSelectedScenePublication,
  CanonicalLivingFrameSelectedSceneTreatment,
} from '../../src/types/living-frame-selected-scene-binding'
import type {
  EditWorkItemType,
} from '../../src/types/editing-agent-runtime'
import type {
  CanonicalPlanComponentsInput,
} from '../validation/edit-planning-authority-schemas'
import { ApiError } from '../errors/api-error'
import {
  compileLivingFrameWorkAdmissionCatalog,
  verifyLivingFrameWorkAdmissionCatalog,
} from './living-frame-work-admission'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

type NamedWorkItemType = Exclude<EditWorkItemType, 'custom'>

const AUTHORITY_BOUNDARY:
  CanonicalLivingFrameExecutionRequirementsAuthorityBoundary =
    Object.freeze({
      serverDerivedRequirementsAuthority: true,
      selectedSceneAuthority: false,
      masterTimingAuthority: false,
      soundSyncAuthority: false,
      estimateAuthority: false,
      customerCommercialAuthority: false,
      approvalAuthority: false,
      snapshotAuthority: false,
      workGraphAuthority: false,
      queueAuthority: false,
      assetManifestAuthority: false,
      providerAuthority: false,
      toolRouteAuthority: false,
      qaApprovalAuthority: false,
      privateReviewAuthority: false,
      rendererAuthority: false,
      runtimeAuthority: false,
      productionAuthority: false,
    })

export function compileCanonicalLivingFrameExecutionRequirements(input: {
  readonly publication:
    CanonicalLivingFrameSelectedScenePublication
  readonly components: CanonicalPlanComponentsInput
}): CanonicalLivingFrameExecutionRequirements {
  const binding = input.publication.binding
  const deferred = input.components.livingFrame
  if (
    deferred === undefined
    || deferred.contractDigestSha256 !==
      binding.sourceBindings.deferredLivingFrameComponentDigestSha256
    || sha256AuthorityValue(input.components.masterTimingPlan) !==
      binding.sourceBindings.currentMasterTimingDigestSha256
  ) {
    throw conflict(
      'Canonical Living Frame execution requirements do not match the current deferred component or MasterTiming authority.',
    )
  }

  const workAdmission = compileLivingFrameWorkAdmissionCatalog()
  if (!verifyLivingFrameWorkAdmissionCatalog(workAdmission)) {
    throw conflict(
      'Canonical Living Frame named-work admission catalog failed revalidation.',
    )
  }
  const treatmentBySceneId = new Map(
    binding.decision.selectedScenes.map((scene) => [
      scene.sceneId,
      scene.treatment,
    ]),
  )
  const scenes = binding.selectedComponent.scenePlans.map((scene) => {
    const treatment = treatmentBySceneId.get(scene.sceneId)
    if (!treatment) {
      throw conflict(
        'Canonical Living Frame selected scene has no exact selected treatment.',
      )
    }
    const segmentExpectation =
      deferred.inputBindings.segmentExpectations.find(
        (candidate) =>
          candidate.segmentExpectationId ===
          scene.segmentExpectationId,
      )
    const canonicalSegment = segmentExpectation
      ? input.components.segments[segmentExpectation.order]
      : undefined
    if (
      !segmentExpectation
      || !canonicalSegment
      || segmentExpectation.sourceSegmentRef.expectedDigestSha256 !==
        sha256AuthorityValue(canonicalSegment)
      || canonicalSegment.endFrameExclusive <=
        canonicalSegment.startFrame
    ) {
      throw conflict(
        'Canonical Living Frame selected scene cannot be mapped to one exact current timeline segment.',
      )
    }
    return compileSceneRequirement({
      scene,
      treatment,
      canonicalSegment,
      workAdmission,
    })
  })

  if (
    binding.deliberateNonUse !== (scenes.length === 0)
    || binding.selectedSceneCount !== scenes.length
  ) {
    throw conflict(
      'Canonical Living Frame selected-scene decision and execution requirements disagree.',
    )
  }

  const semanticTimingRequestCount = scenes.reduce(
    (total, scene) =>
      total + scene.semanticTimingRequestIds.length,
    0,
  )
  const soundRequestCount = scenes.reduce(
    (total, scene) => total + scene.soundRequestIds.length,
    0,
  )
  const blockerCodes = scenes.length === 0
    ? []
    : CANONICAL_LIVING_FRAME_EXECUTION_BLOCKER_CODES.filter(
        (code) =>
          code !== 'exact_soundsync_binding_required'
          || soundRequestCount > 0,
      )
  const uniqueWorkItemTypes = uniqueSorted(
    scenes.flatMap((scene) => scene.requiredNamedWorkItemTypes),
  )
  const uniqueExternalGates = uniqueSorted(
    scenes.flatMap((scene) => scene.requiredExternalGateCodes),
  )
  const uniqueMissingOperations = uniqueSorted(
    scenes.flatMap((scene) => scene.missingOperationCodes),
  )
  const uniqueQaExpectations = uniqueSorted(
    scenes.flatMap((scene) => scene.qaExpectationCodes),
  )

  const draft: CanonicalLivingFrameExecutionRequirementsDraft = {
    schemaVersion:
      CANONICAL_LIVING_FRAME_EXECUTION_REQUIREMENTS_VERSION,
    source:
      CANONICAL_LIVING_FRAME_EXECUTION_REQUIREMENTS_SOURCE,
    evidenceClass:
      'private_internal_server_derived_execution_requirements',
    identity: {
      workspaceId: binding.identity.workspaceId,
      projectId: binding.identity.projectId,
      editSessionId: binding.identity.editSessionId,
    },
    sourceBindings: {
      selectedSceneBindingDigestSha256:
        binding.bindingDigestSha256,
      deferredLivingFrameComponentDigestSha256:
        deferred.contractDigestSha256,
      currentMasterTimingDigestSha256:
        sha256AuthorityValue(input.components.masterTimingPlan),
      currentSoundSyncDigestSha256:
        sha256AuthorityValue(
          input.components.soundSyncTransitionTimingPlan,
        ),
      canonicalSegmentsDigestSha256:
        sha256AuthorityValue(input.components.segments),
      workAdmissionCatalogDigestSha256:
        workAdmission.catalogDigestSha256,
    },
    readiness: scenes.length === 0
      ? 'ready_without_living_frame_execution'
      : 'blocked_until_canonical_execution_projection',
    blockerCodes,
    scenes,
    metrics: {
      selectedSceneCount: scenes.length,
      selectedComponentCount: scenes.reduce(
        (total, scene) => total + scene.componentIds.length,
        0,
      ),
      semanticTimingRequestCount,
      soundRequestCount,
      requiredNamedWorkItemTypeCount:
        uniqueWorkItemTypes.length,
      requiredExternalGateCount: uniqueExternalGates.length,
      missingOperationCount: uniqueMissingOperations.length,
      qaExpectationCount: uniqueQaExpectations.length,
    },
    authorityBoundary: AUTHORITY_BOUNDARY,
    existingEstimateApprovalSnapshotPipelineRemainsAuthority: true,
    existingWorkAssetQaReviewPipelineRemainsAuthority: true,
    containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials: false,
    containsProviderPromptOrExecutablePayload: false,
    containsResolvedToolProviderModelOrCostRoute: false,
    subjectSpecificRouting: false,
    productionReady: false,
  }
  return {
    ...draft,
    requirementsDigestSha256: sha256AuthorityValue(draft),
  }
}

export function verifyCanonicalLivingFrameExecutionRequirements(input: {
  readonly requirements: unknown
  readonly publication:
    CanonicalLivingFrameSelectedScenePublication
  readonly components: CanonicalPlanComponentsInput
}): input is {
  readonly requirements:
    CanonicalLivingFrameExecutionRequirements
  readonly publication:
    CanonicalLivingFrameSelectedScenePublication
  readonly components: CanonicalPlanComponentsInput
} {
  try {
    const expected =
      compileCanonicalLivingFrameExecutionRequirements({
        publication: input.publication,
        components: input.components,
      })
    return (
      isRecord(input.requirements)
      && input.requirements.schemaVersion ===
        CANONICAL_LIVING_FRAME_EXECUTION_REQUIREMENTS_VERSION
      && input.requirements.source ===
        CANONICAL_LIVING_FRAME_EXECUTION_REQUIREMENTS_SOURCE
      && input.requirements.requirementsDigestSha256 ===
        sha256AuthorityValue(withoutDigest(input.requirements))
      && stableAuthorityStringify(input.requirements) ===
        stableAuthorityStringify(expected)
    )
  } catch {
    return false
  }
}

function compileSceneRequirement(input: {
  readonly scene:
    CanonicalLivingFrameSelectedScenePublication[
      'binding'
    ]['selectedComponent']['scenePlans'][number]
  readonly treatment:
    CanonicalLivingFrameSelectedSceneTreatment
  readonly canonicalSegment:
    CanonicalPlanComponentsInput['segments'][number]
  readonly workAdmission:
    ReturnType<typeof compileLivingFrameWorkAdmissionCatalog>
}): CanonicalLivingFrameSceneExecutionRequirement {
  const capabilityKeys = uniqueSorted(
    input.scene.components.flatMap(
      (component) => component.capabilityKeys,
    ),
  ) as LivingFrameCapabilityKey[]
  const miniSkillKeys = uniqueSorted(
    input.scene.skillActivations.map(
      (activation) => activation.miniSkillKey,
    ),
  ) as LivingFrameMiniSkillKey[]
  const capabilityCoverage = capabilityKeys.map((capabilityKey) => {
    const coverage =
      input.workAdmission.capabilityCoverage.find(
        (candidate) =>
          candidate.capabilityKey === capabilityKey,
      )
    if (!coverage) {
      throw conflict(
        'Canonical Living Frame capability has no named-work admission coverage.',
      )
    }
    return coverage
  })
  const miniSkillCoverage = miniSkillKeys.map((miniSkillKey) => {
    const coverage =
      input.workAdmission.miniSkillCoverage.find(
        (candidate) =>
          candidate.miniSkillKey === miniSkillKey,
      )
    if (!coverage) {
      throw conflict(
        'Canonical Living Frame mini-skill has no named-work admission coverage.',
      )
    }
    return coverage
  })
  const coverage = [
    ...capabilityCoverage,
    ...miniSkillCoverage,
  ]
  return {
    sceneId: input.scene.sceneId,
    treatment: input.treatment,
    segmentExpectationId:
      input.scene.segmentExpectationId,
    canonicalSegmentId: input.canonicalSegment.segmentId,
    canonicalSegmentDigestSha256:
      sha256AuthorityValue(input.canonicalSegment),
    startFrame: input.canonicalSegment.startFrame,
    endFrameExclusive:
      input.canonicalSegment.endFrameExclusive,
    componentIds: input.scene.components.map(
      (component) => component.componentId,
    ),
    semanticTimingRequestIds:
      input.scene.semanticTimingRequests.map(
        (request) => request.timingRequestId,
      ),
    soundRequestIds: input.scene.soundRequests.map(
      (request) => request.soundRequestId,
    ),
    capabilityKeys,
    miniSkillKeys,
    requiredNamedWorkItemTypes: uniqueSorted(
      coverage.flatMap(
        (item) => item.existingNamedWorkItemTypes,
      ),
    ) as NamedWorkItemType[],
    missingOperationCodes: uniqueSorted(
      coverage.flatMap((item) => item.missingOperationCodes),
    ) as LivingFrameMissingOperationCode[],
    requiredExternalGateCodes: uniqueSorted(
      coverage.flatMap(
        (item) => item.requiredExternalGateCodes,
      ),
    ) as LivingFrameWorkExternalGateCode[],
    qaExpectationCodes: uniqueSorted([
      ...input.scene.qaExpectationCodes,
      ...input.scene.components.flatMap(
        (component) => component.qaExpectationCodes,
      ),
      ...input.scene.skillActivations.flatMap(
        (activation) => activation.qaExpectationCodes,
      ),
    ]) as LivingFrameQaCode[],
  }
}

function uniqueSorted<T extends string>(
  values: readonly T[],
): T[] {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right))
}

function withoutDigest(
  value: Record<string, unknown>,
): Record<string, unknown> {
  const draft = { ...value }
  delete draft.requirementsDigestSha256
  return draft
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return Boolean(
    value
    && typeof value === 'object'
    && !Array.isArray(value),
  )
}

function conflict(message: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    message,
    409,
    {
      requiredGate:
        'canonical_living_frame_execution_requirements',
    },
  )
}
