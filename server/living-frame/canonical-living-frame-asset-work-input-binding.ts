import type {
  CanonicalLivingFrameAssetIntentInputResolutionState,
  CanonicalLivingFrameAssetWorkInputBinding,
  CanonicalLivingFrameAssetWorkInputBindingAuthorityBoundary,
  CanonicalLivingFrameAssetWorkInputBindingDraft,
  CanonicalLivingFrameBoundAssetIntent,
  CanonicalLivingFrameNamedWorkInput,
  CanonicalLivingFrameSceneAssetWorkInputBinding,
  CanonicalLivingFrameSourceAssetBinding,
} from '../../src/types/living-frame-asset-work-input-binding'
import {
  CANONICAL_LIVING_FRAME_ASSET_WORK_INPUT_BINDING_SOURCE,
  CANONICAL_LIVING_FRAME_ASSET_WORK_INPUT_BINDING_VERSION,
} from '../../src/types/living-frame-asset-work-input-binding'
import type {
  LivingFrameComponentAssetIntent,
} from '../../src/types/living-frame-component-asset-intent'
import type {
  CanonicalLivingFrameExecutionRequirements,
} from '../../src/types/living-frame-execution-requirements'
import type {
  CanonicalLivingFrameProjectedWorkItemType,
} from '../../src/types/living-frame-estimate-work-asset-projection'
import type {
  CanonicalLivingFrameSelectedScenePublication,
} from '../../src/types/living-frame-selected-scene-binding'
import type {
  LivingFrameSemanticPlanProjection,
} from '../../src/types/living-frame-semantic-plan-projection'
import type {
  CanonicalLivingFrameTimingBinding,
} from '../../src/types/living-frame-timing-binding'
import { ApiError } from '../errors/api-error'
import type {
  SourceBindingManifestCandidate,
} from '../validation/source-media-authority-schemas'
import type {
  CanonicalPlanComponentsInput,
} from '../validation/edit-planning-authority-schemas'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  compileLivingFrameComponentAssetIntents,
  verifyLivingFrameComponentAssetIntentBundle,
} from './living-frame-component-asset-intent'
import {
  verifyLivingFrameSemanticPlanProjection,
} from './living-frame-semantic-plan-projection'
import {
  compileLivingFrameSynthesisRouting,
  verifyLivingFrameSynthesisRoutingDigest,
} from './living-frame-synthesis-routing'
import {
  compileLivingFrameWorkAdmissionCatalog,
  verifyLivingFrameWorkAdmissionCatalog,
} from './living-frame-work-admission'

const ASSET_PRODUCING_WORK_TYPES = new Set<
  CanonicalLivingFrameProjectedWorkItemType
>([
  'generate_mask_asset',
  'process_image_asset',
  'reconstruct_background_plate',
])

const AUTHORITY_BOUNDARY:
  CanonicalLivingFrameAssetWorkInputBindingAuthorityBoundary =
    Object.freeze({
      serverDerivedAssetIntentAuthority: true,
      serverDerivedSourceInputBindingAuthority: true,
      serverDerivedNamedWorkInputAuthority: true,
      selectedSceneAuthority: false,
      sourceMediaMutationAuthority: false,
      sourceCleanupMutationAuthority: false,
      estimateAuthority: false,
      approvalAuthority: false,
      snapshotAuthority: false,
      workGraphMutationAuthority: false,
      queueAuthority: false,
      assetManifestMutationAuthority: false,
      providerAuthority: false,
      toolRouteAuthority: false,
      artifactQaAuthority: false,
      privateReviewAuthority: false,
      rendererAuthority: false,
      runtimeAuthority: false,
      productionAuthority: false,
    })

export async function compileCanonicalLivingFrameAssetWorkInputBinding(
  input: {
    readonly publication:
      CanonicalLivingFrameSelectedScenePublication
    readonly requirements:
      CanonicalLivingFrameExecutionRequirements
    readonly timingBinding:
      CanonicalLivingFrameTimingBinding
    readonly components: CanonicalPlanComponentsInput
    readonly sourceMediaAuthority:
      SourceBindingManifestCandidate
  },
): Promise<CanonicalLivingFrameAssetWorkInputBinding> {
  const semanticPlanProjection =
    await requireSemanticPlanProjection(input.publication)
  assertSourceLineage({
    ...input,
    semanticPlanProjection,
  })
  const synthesisRouting =
    await compileLivingFrameSynthesisRouting({
      semanticPlanProjection,
    })
  if (!verifyLivingFrameSynthesisRoutingDigest(
    synthesisRouting,
  )) {
    throw conflict(
      'Canonical Living Frame synthesis routing failed revalidation.',
    )
  }
  const workAdmissionCatalog =
    compileLivingFrameWorkAdmissionCatalog()
  if (!verifyLivingFrameWorkAdmissionCatalog(
    workAdmissionCatalog,
  )) {
    throw conflict(
      'Canonical Living Frame work-admission catalog failed revalidation.',
    )
  }
  const assetIntentBundle =
    await compileLivingFrameComponentAssetIntents({
      semanticPlanProjection,
      synthesisRouting,
      workAdmissionCatalog,
    })
  if (!verifyLivingFrameComponentAssetIntentBundle(
    assetIntentBundle,
  )) {
    throw conflict(
      'Canonical Living Frame component asset-intent bundle failed revalidation.',
    )
  }

  const requirementsBySceneId = new Map(
    input.requirements.scenes.map((scene) => [
      scene.sceneId,
      scene,
    ]),
  )
  const timingBySceneId = new Map(
    input.timingBinding.scenes.map((scene) => [
      scene.sceneId,
      scene,
    ]),
  )
  const selectedScenePlans =
    input.publication.binding.selectedComponent.scenePlans
  const selectedComponentKeys = new Set(
    selectedScenePlans.flatMap((scene) =>
      scene.components.map((component) =>
        componentKey(scene.sceneId, component.componentId))),
  )
  const selectedAssetIntents =
    assetIntentBundle.assetIntents.filter((intent) =>
      selectedComponentKeys.has(
        componentKey(intent.sceneId, intent.componentId),
      ))
  const coveredComponentKeys = new Set(
    selectedAssetIntents.map((intent) =>
      componentKey(intent.sceneId, intent.componentId)),
  )
  const selectedBlockedComponentKeys = new Set(
    selectedScenePlans.flatMap((scene) =>
      scene.components
        .filter((component) =>
          assetIntentBundle.blockedComponentIds.includes(
            component.componentId,
          ))
        .map((component) =>
          componentKey(scene.sceneId, component.componentId))),
  )
  if (
    selectedBlockedComponentKeys.size > 0
    || [...selectedComponentKeys].some(
      (key) => !coveredComponentKeys.has(key),
    )
  ) {
    throw conflict(
      'Canonical Living Frame selected components do not have one complete safe asset-intent chain.',
    )
  }

  const scenes = selectedScenePlans.map((scenePlan) => {
    const requirement =
      requirementsBySceneId.get(scenePlan.sceneId)
    const timingScene =
      timingBySceneId.get(scenePlan.sceneId)
    if (!requirement || !timingScene) {
      throw conflict(
        'Canonical Living Frame selected scene is missing its exact execution requirement or timing binding.',
      )
    }
    const sceneAssetIntents = selectedAssetIntents
      .filter((intent) => intent.sceneId === scenePlan.sceneId)
      .sort((left, right) => left.order - right.order)
    return compileSceneBinding({
      scenePlan,
      requirement,
      timingScene,
      assetIntents: sceneAssetIntents,
      components: input.components,
      sourceMediaAuthority: input.sourceMediaAuthority,
    })
  })
  if (
    scenes.length !== input.requirements.scenes.length
    || scenes.length !==
      input.publication.binding.selectedSceneCount
  ) {
    throw conflict(
      'Canonical Living Frame asset/work inputs do not cover the selected-scene set exactly.',
    )
  }

  const unresolvedPrimaryAssetIntentIds = uniqueSorted(
    scenes.flatMap((scene) =>
      scene.assetIntents
        .filter((intent) =>
          intent.inputResolutionState ===
          'pending_provider_asset_artifact')
        .map((intent) => intent.assetIntentId)),
  )
  const draft:
    CanonicalLivingFrameAssetWorkInputBindingDraft = {
      schemaVersion:
        CANONICAL_LIVING_FRAME_ASSET_WORK_INPUT_BINDING_VERSION,
      source:
        CANONICAL_LIVING_FRAME_ASSET_WORK_INPUT_BINDING_SOURCE,
      evidenceClass:
        'private_internal_server_derived_asset_work_input_binding',
      identity: {
        workspaceId:
          input.publication.binding.identity.workspaceId,
        projectId:
          input.publication.binding.identity.projectId,
        editSessionId:
          input.publication.binding.identity.editSessionId,
      },
      sourceBindings: {
        selectedSceneBindingDigestSha256:
          input.publication.binding.bindingDigestSha256,
        executionRequirementsDigestSha256:
          input.requirements.requirementsDigestSha256,
        timingBindingDigestSha256:
          input.timingBinding.timingBindingDigestSha256,
        semanticPlanProjectionDigestSha256:
          semanticPlanProjection.projectionDigestSha256,
        sourceMediaCandidateHash:
          input.sourceMediaAuthority.candidateHash,
        sourceSequenceHash:
          input.sourceMediaAuthority.sourceSequenceHash,
        sourceSequenceDigestSha256:
          sha256AuthorityValue(
            input.components.sourceSequence,
          ),
        sourceCleanupPlanDigestSha256:
          sha256AuthorityValue(
            input.components.sourceCleanupPlan,
          ),
        synthesisRoutingDigestSha256:
          synthesisRouting.routingDigestSha256,
        componentAssetIntentBundleDigestSha256:
          assetIntentBundle.bundleDigestSha256,
        workAdmissionCatalogDigestSha256:
          workAdmissionCatalog.catalogDigestSha256,
      },
      readiness: scenes.length === 0
        ? 'ready_without_living_frame_asset_work_inputs'
        : unresolvedPrimaryAssetIntentIds.length > 0
          ? 'blocked_by_unresolved_primary_asset_inputs'
          : 'source_inputs_bound_operation_admission_pending',
      scenes,
      unresolvedPrimaryAssetIntentIds,
      metrics: {
        selectedSceneCount: scenes.length,
        selectedComponentCount: selectedComponentKeys.size,
        selectedAssetIntentCount: scenes.reduce(
          (total, scene) =>
            total + scene.assetIntents.length,
          0,
        ),
        exactSourceAssetBindingCount: scenes.reduce(
          (total, scene) =>
            total + scene.sourceAssetBindings.length,
          0,
        ),
        exactSourceFrameBindingCount: scenes.reduce(
          (total, scene) =>
            total + scene.sourceAssetBindings.length,
          0,
        ),
        unresolvedPrimaryAssetIntentCount:
          unresolvedPrimaryAssetIntentIds.length,
        originalNamedWorkItemCount: scenes.reduce(
          (total, scene) =>
            total
            + scene.originalRequiredNamedWorkItemTypes.length,
          0,
        ),
        refinedNamedWorkItemCount: scenes.reduce(
          (total, scene) =>
            total
            + scene.refinedRequiredNamedWorkItemTypes.length,
          0,
        ),
        omittedOverbroadNamedWorkItemCount:
          scenes.reduce(
            (total, scene) =>
              total
              + scene.omittedOverbroadNamedWorkItemTypes.length,
            0,
          ),
      },
      authorityBoundary: AUTHORITY_BOUNDARY,
      existingApprovedWorkGraphRemainsAuthority: true,
      existingApprovedAssetManifestRemainsAuthority: true,
      containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials:
        false,
      containsProviderPromptOrExecutablePayload: false,
      createsCanonicalWorkItems: false,
      createsAssetManifestEntries: false,
      expandsExactFiftyToolRegistry: false,
      subjectSpecificRouting: false,
      productionReady: false,
    }
  return {
    ...draft,
    bindingDigestSha256: sha256AuthorityValue(draft),
  }
}

export async function verifyCanonicalLivingFrameAssetWorkInputBinding(
  input: {
    readonly binding: unknown
    readonly publication:
      CanonicalLivingFrameSelectedScenePublication
    readonly requirements:
      CanonicalLivingFrameExecutionRequirements
    readonly timingBinding:
      CanonicalLivingFrameTimingBinding
    readonly components: CanonicalPlanComponentsInput
    readonly sourceMediaAuthority:
      SourceBindingManifestCandidate
  },
): Promise<boolean> {
  try {
    const expected =
      await compileCanonicalLivingFrameAssetWorkInputBinding({
        publication: input.publication,
        requirements: input.requirements,
        timingBinding: input.timingBinding,
        components: input.components,
        sourceMediaAuthority: input.sourceMediaAuthority,
      })
    return (
      isRecord(input.binding)
      && input.binding.schemaVersion ===
        CANONICAL_LIVING_FRAME_ASSET_WORK_INPUT_BINDING_VERSION
      && input.binding.source ===
        CANONICAL_LIVING_FRAME_ASSET_WORK_INPUT_BINDING_SOURCE
      && input.binding.bindingDigestSha256 ===
        sha256AuthorityValue(
          withoutDigest(input.binding),
        )
      && stableAuthorityStringify(input.binding) ===
        stableAuthorityStringify(expected)
    )
  } catch {
    return false
  }
}

function compileSceneBinding(input: {
  readonly scenePlan:
    CanonicalLivingFrameSelectedScenePublication[
      'binding'
    ]['selectedComponent']['scenePlans'][number]
  readonly requirement:
    CanonicalLivingFrameExecutionRequirements['scenes'][number]
  readonly timingScene:
    CanonicalLivingFrameTimingBinding['scenes'][number]
  readonly assetIntents:
    readonly LivingFrameComponentAssetIntent[]
  readonly components: CanonicalPlanComponentsInput
  readonly sourceMediaAuthority:
    SourceBindingManifestCandidate
}): CanonicalLivingFrameSceneAssetWorkInputBinding {
  const expectation =
    input.scenePlan.segmentExpectationId
      ? input.components.livingFrame?.inputBindings
        .segmentExpectations.find((candidate) =>
          candidate.segmentExpectationId ===
          input.scenePlan.segmentExpectationId)
      : undefined
  if (
    !expectation
    || input.components.segments[expectation.order]?.segmentId
      !== input.requirement.canonicalSegmentId
  ) {
    throw conflict(
      'Canonical Living Frame selected scene lost its exact source-segment order.',
    )
  }
  const approvedSourceAssetIntents =
    input.assetIntents.filter((intent) =>
      intent.assetKind ===
      'approved_source_asset_reference')
  const sourceContext =
    approvedSourceAssetIntents.length > 0
      ? resolveSceneSourceContext({
          requirement: input.requirement,
          timingScene: input.timingScene,
          components: input.components,
          sourceMediaAuthority:
            input.sourceMediaAuthority,
        })
      : undefined
  if (
    approvedSourceAssetIntents.length > 0
    && !sourceContext
  ) {
    throw conflict(
      'Canonical Living Frame approved-source intents lost their exact source context.',
    )
  }
  const sourceAssetBindings =
    sourceContext
      ? approvedSourceAssetIntents
      .map((intent) => ({
        assetIntentId: intent.assetIntentId,
        sceneId: intent.sceneId,
        componentId: intent.componentId,
        sourceSequenceItemId:
          sourceContext.sourceSequenceItemId,
        mediaAssetId: sourceContext.mediaAssetId,
        uploadedOrder: sourceContext.uploadedOrder,
        sourceCleanupDecisionId:
          sourceContext.sourceCleanupDecisionId,
        masterFrameIndex:
          sourceContext.masterFrameIndex,
        sourceFrameIndex:
          sourceContext.sourceFrameIndex,
        frameRate: sourceContext.frameRate,
        frameSelectionPolicy:
          sourceContext.frameSelectionPolicy,
        sourceFrameSelectionDigestSha256:
          sourceContext.sourceFrameSelectionDigestSha256,
        checksumSha256: sourceContext.checksumSha256,
        mimeType: sourceContext.mimeType,
        sizeBytes: sourceContext.sizeBytes,
        sourceBindingHash:
          sourceContext.sourceBindingHash,
        storageIdentityHash:
          sourceContext.storageIdentityHash,
        required: true,
        authorityState:
          'exact_verified_source_media_and_cleanup_bound',
      } satisfies CanonicalLivingFrameSourceAssetBinding))
      : []
  const sourceAssetIntentIds = new Set(
    sourceAssetBindings.map((binding) =>
      binding.assetIntentId),
  )
  const assetIntents = input.assetIntents.map(
    (intent) => ({
      assetIntentId: intent.assetIntentId,
      order: intent.order,
      sceneId: intent.sceneId,
      componentId: intent.componentId,
      stage: intent.stage,
      assetKind: intent.assetKind,
      dependencyAssetIntentIds: [
        ...intent.dependencyAssetIntentIds,
      ],
      expectedNamedWorkItemTypes: [
        ...intent.expectedNamedWorkItemTypes,
      ],
      inputResolutionState: resolveInputState(
        intent,
        sourceAssetIntentIds,
      ),
    } satisfies CanonicalLivingFrameBoundAssetIntent),
  )
  const actualAssetWorkTypes = uniqueSorted(
    assetIntents.flatMap((intent) =>
      intent.expectedNamedWorkItemTypes),
  )
  const originalRequiredNamedWorkItemTypes = [
    ...input.requirement.requiredNamedWorkItemTypes,
  ]
  const missingFromBroadRequirement =
    actualAssetWorkTypes.filter((workItemType) =>
      !originalRequiredNamedWorkItemTypes.includes(
        workItemType,
      ))
  if (missingFromBroadRequirement.length > 0) {
    throw conflict(
      'Canonical Living Frame asset intents require named work absent from the admitted scene requirements.',
    )
  }
  const refinedNamedWorkItemCandidates = uniqueSorted([
    ...originalRequiredNamedWorkItemTypes.filter(
      (workItemType) =>
        !ASSET_PRODUCING_WORK_TYPES.has(workItemType),
    ),
    ...actualAssetWorkTypes,
  ])
  const omittedOverbroadNamedWorkItemTypes =
    originalRequiredNamedWorkItemTypes.filter(
      (workItemType) =>
        !refinedNamedWorkItemCandidates.includes(
          workItemType,
        ),
    )
  const namedWorkInputs = orderNamedWorkInputs(
    refinedNamedWorkItemCandidates.map((workItemType) =>
      compileNamedWorkInput({
        workItemType,
        assetIntents,
        sourceAssetBindings,
        refinedRequiredNamedWorkItemTypes:
          refinedNamedWorkItemCandidates,
      })),
  )
  const refinedRequiredNamedWorkItemTypes =
    namedWorkInputs.map((input) => input.workItemType)
  return {
    sceneId: input.scenePlan.sceneId,
    canonicalSegmentId:
      input.requirement.canonicalSegmentId,
    canonicalSegmentOrder: expectation.order,
    originalRequiredNamedWorkItemTypes,
    refinedRequiredNamedWorkItemTypes,
    omittedOverbroadNamedWorkItemTypes,
    assetIntents,
    sourceAssetBindings,
    namedWorkInputs,
  }
}

function compileNamedWorkInput(input: {
  readonly workItemType:
    CanonicalLivingFrameProjectedWorkItemType
  readonly assetIntents:
    readonly CanonicalLivingFrameBoundAssetIntent[]
  readonly sourceAssetBindings:
    readonly CanonicalLivingFrameSourceAssetBinding[]
  readonly refinedRequiredNamedWorkItemTypes:
    readonly CanonicalLivingFrameProjectedWorkItemType[]
}): CanonicalLivingFrameNamedWorkInput {
  const intentById = new Map(
    input.assetIntents.map((intent) => [
      intent.assetIntentId,
      intent,
    ]),
  )
  const outputIntents = input.assetIntents.filter(
    (intent) =>
      intent.expectedNamedWorkItemTypes.includes(
        input.workItemType,
      ),
  )
  const dependedIntentIds = new Set(
    input.assetIntents.flatMap((intent) =>
      intent.dependencyAssetIntentIds),
  )
  const terminalIntents = input.assetIntents.filter(
    (intent) =>
      !dependedIntentIds.has(intent.assetIntentId),
  )
  const inputAssetIntentIds = uniqueSorted(
    input.workItemType === 'prepare_remotion_layer'
      ? terminalIntents.map((intent) =>
          intent.assetIntentId)
      : outputIntents.flatMap((intent) =>
          intent.dependencyAssetIntentIds),
  )
  const dependencyNamedWorkItemTypes = uniqueSorted(
    inputAssetIntentIds.flatMap((assetIntentId) =>
      intentById.get(assetIntentId)
        ?.expectedNamedWorkItemTypes ?? []),
  ).filter((workItemType) =>
    workItemType !== input.workItemType
    && input.refinedRequiredNamedWorkItemTypes.includes(
      workItemType,
    ))
  const directlyBoundSourceIds = new Set(
    inputAssetIntentIds,
  )
  const sourceBindings = input.sourceAssetBindings.filter(
    (binding) =>
      directlyBoundSourceIds.has(binding.assetIntentId),
  )
  return {
    workItemType: input.workItemType,
    inputAssetIntentIds,
    outputAssetIntentIds: uniqueSorted(
      outputIntents.map((intent) =>
        intent.assetIntentId),
    ),
    dependencyNamedWorkItemTypes,
    sourceSequenceItemIds: uniqueSorted(
      sourceBindings.map((binding) =>
        binding.sourceSequenceItemId),
    ),
    sourceCleanupDecisionIds: uniqueSorted(
      sourceBindings.map((binding) =>
        binding.sourceCleanupDecisionId),
    ),
    sourceFrameInputs: sourceBindings.map((binding) => ({
      assetIntentId: binding.assetIntentId,
      sourceSequenceItemId:
        binding.sourceSequenceItemId,
      sourceCleanupDecisionId:
        binding.sourceCleanupDecisionId,
      masterFrameIndex:
        binding.masterFrameIndex,
      sourceFrameIndex:
        binding.sourceFrameIndex,
      frameRate: binding.frameRate,
      frameSelectionPolicy:
        binding.frameSelectionPolicy,
      sourceFrameSelectionDigestSha256:
        binding.sourceFrameSelectionDigestSha256,
    })),
  }
}

function orderNamedWorkInputs(
  inputs: readonly CanonicalLivingFrameNamedWorkInput[],
): CanonicalLivingFrameNamedWorkInput[] {
  const remaining = new Map(
    inputs.map((input) => [
      input.workItemType,
      input,
    ]),
  )
  const ordered:
    CanonicalLivingFrameNamedWorkInput[] = []
  const resolved = new Set<
    CanonicalLivingFrameProjectedWorkItemType
  >()
  while (remaining.size > 0) {
    const ready = [...remaining.values()]
      .filter((input) =>
        input.dependencyNamedWorkItemTypes.every(
          (dependency) => resolved.has(dependency),
        ))
      .sort((left, right) =>
        left.workItemType.localeCompare(
          right.workItemType,
        ))
    if (ready.length === 0) {
      throw conflict(
        'Canonical Living Frame named-work input graph contains a dependency cycle or missing dependency.',
      )
    }
    for (const input of ready) {
      remaining.delete(input.workItemType)
      resolved.add(input.workItemType)
      ordered.push(input)
    }
  }
  return ordered
}

function resolveSceneSourceContext(input: {
  readonly requirement:
    CanonicalLivingFrameExecutionRequirements['scenes'][number]
  readonly timingScene:
    CanonicalLivingFrameTimingBinding['scenes'][number]
  readonly components: CanonicalPlanComponentsInput
  readonly sourceMediaAuthority:
    SourceBindingManifestCandidate
}): {
  readonly sourceSequenceItemId: string
  readonly mediaAssetId: string
  readonly uploadedOrder: number
  readonly sourceCleanupDecisionId: string
  readonly masterFrameIndex: number
  readonly sourceFrameIndex: number
  readonly frameRate: number
  readonly frameSelectionPolicy:
    'scene_start_meaning_anchor_v1'
  readonly sourceFrameSelectionDigestSha256: string
  readonly checksumSha256: string
  readonly mimeType: string
  readonly sizeBytes: number
  readonly sourceBindingHash: string
  readonly storageIdentityHash: string
} {
  if (
    input.sourceMediaAuthority.schemaVersion !==
      'private-source-binding-manifest-candidate-v1'
  ) {
    throw conflict(
      'Canonical Living Frame source-backed asset intents require uploaded source-media authority.',
    )
  }
  const sourceMatch =
    resolveCanonicalLivingFrameSourceTimelineSpan({
      sourceSequence: input.components.sourceSequence,
      sourceCleanupPlan:
        input.components.sourceCleanupPlan,
      startFrame: input.requirement.startFrame,
      endFrameExclusive:
        input.requirement.endFrameExclusive,
  })
  const source = sourceMatch.source
  const masterFrameIndex =
    input.timingScene.visualTiming
      .frameRange.startFrame
  const sourceFrameIndex =
    sourceMatch.cleanupDecision.startFrame
    + (
      masterFrameIndex
      - sourceMatch.timelineStartFrame
    )
  const frameRate =
    input.components.timingSummary.fps
  const frameSelectionPolicy =
    'scene_start_meaning_anchor_v1' as const
  const authorityBinding =
    input.sourceMediaAuthority.bindings.find(
      (binding) =>
        binding.sourceSequenceItemId ===
          source.sourceSequenceItemId
        && binding.mediaAssetId === source.mediaAssetId,
    )
  if (
    !source.checksumSha256
    || !authorityBinding
    || authorityBinding.uploadedOrder !==
      source.uploadedOrder
    || authorityBinding.checksumSha256 !==
      source.checksumSha256
    || input.timingScene.sceneId !==
      input.requirement.sceneId
    || input.timingScene.canonicalSegmentId !==
      input.requirement.canonicalSegmentId
    || masterFrameIndex <
      input.requirement.startFrame
    || masterFrameIndex >=
      input.requirement.endFrameExclusive
    || !Number.isInteger(masterFrameIndex)
    || !Number.isInteger(sourceFrameIndex)
    || sourceFrameIndex <
      sourceMatch.cleanupDecision.startFrame
    || sourceFrameIndex >=
      sourceMatch.cleanupDecision.endFrameExclusive
    || !Number.isInteger(frameRate)
    || frameRate < 1
    || frameRate > 240
  ) {
    throw conflict(
      'Canonical Living Frame scene cannot bind one exact verified source-media and cleanup input.',
    )
  }
  const sourceFrameSelectionDigestSha256 =
    sha256AuthorityValue({
      sourceSequenceItemId:
        source.sourceSequenceItemId,
      mediaAssetId: source.mediaAssetId,
      sourceCleanupDecisionId:
        sourceMatch.cleanupDecision.decisionId,
      masterFrameIndex,
      sourceFrameIndex,
      frameRate,
      frameSelectionPolicy,
      sourceChecksumSha256:
        authorityBinding.checksumSha256,
      sourceBindingHash:
        authorityBinding.bindingHash,
    })
  return {
    sourceSequenceItemId: source.sourceSequenceItemId,
    mediaAssetId: source.mediaAssetId,
    uploadedOrder: source.uploadedOrder,
    sourceCleanupDecisionId:
      sourceMatch.cleanupDecision.decisionId,
    masterFrameIndex,
    sourceFrameIndex,
    frameRate,
    frameSelectionPolicy,
    sourceFrameSelectionDigestSha256,
    checksumSha256: authorityBinding.checksumSha256,
    mimeType: authorityBinding.mimeType,
    sizeBytes: authorityBinding.sizeBytes,
    sourceBindingHash: authorityBinding.bindingHash,
    storageIdentityHash:
      authorityBinding.storageIdentityHash,
  }
}

export function resolveCanonicalLivingFrameSourceTimelineSpan(
  input: {
    readonly sourceSequence:
      CanonicalPlanComponentsInput['sourceSequence']
    readonly sourceCleanupPlan:
      CanonicalPlanComponentsInput['sourceCleanupPlan']
    readonly startFrame: number
    readonly endFrameExclusive: number
  },
): {
  readonly source:
    CanonicalPlanComponentsInput['sourceSequence'][number]
  readonly cleanupDecision:
    CanonicalPlanComponentsInput[
      'sourceCleanupPlan'
    ]['decisions'][number]
  readonly timelineStartFrame: number
  readonly timelineEndFrameExclusive: number
} {
  if (
    !Number.isInteger(input.startFrame)
    || !Number.isInteger(input.endFrameExclusive)
    || input.startFrame < 0
    || input.endFrameExclusive <= input.startFrame
  ) {
    throw conflict(
      'Canonical Living Frame source timeline resolution requires one valid frame range.',
    )
  }
  let timelineStartFrame = 0
  const timelineSources =
    input.sourceSequence.flatMap((source) => {
      const cleanupDecisions =
        input.sourceCleanupPlan.decisions.filter(
          (decision) =>
            decision.sourceSequenceItemId ===
              source.sourceSequenceItemId,
        )
      if (
        cleanupDecisions.length !== 1
        || cleanupDecisions[0]!.endFrameExclusive <=
          cleanupDecisions[0]!.startFrame
      ) {
        throw conflict(
          'Canonical Living Frame source-backed asset intents require one exact cleanup span per source.',
        )
      }
      const cleanupDecision = cleanupDecisions[0]!
      const durationFrames =
        cleanupDecision.endFrameExclusive
        - cleanupDecision.startFrame
      const timelineEndFrameExclusive =
        timelineStartFrame + durationFrames
      const result = {
        source,
        cleanupDecision,
        timelineStartFrame,
        timelineEndFrameExclusive,
      }
      timelineStartFrame = timelineEndFrameExclusive
      return [result]
    })
  const sourceMatches = timelineSources.filter(
    (candidate) =>
      candidate.cleanupDecision.action !== 'cut'
      && input.startFrame >=
        candidate.timelineStartFrame
      && input.endFrameExclusive <=
        candidate.timelineEndFrameExclusive,
  )
  if (sourceMatches.length !== 1) {
    throw conflict(
      'Canonical Living Frame scene must resolve inside one exact current source timeline span.',
    )
  }
  return sourceMatches[0]!
}

function resolveInputState(
  intent: LivingFrameComponentAssetIntent,
  sourceAssetIntentIds: ReadonlySet<string>,
): CanonicalLivingFrameAssetIntentInputResolutionState {
  if (sourceAssetIntentIds.has(intent.assetIntentId)) {
    return 'canonical_source_media_bound'
  }
  if (
    intent.assetKind === 'procedural_graphic_spec'
    || intent.assetKind === 'exact_map_spec'
    || intent.assetKind === 'exact_data_graphic_spec'
  ) {
    return 'semantic_deterministic_spec_bound'
  }
  if (
    intent.stage === 'source_or_generated_anchor'
  ) {
    return 'pending_provider_asset_artifact'
  }
  return 'pending_named_work_output'
}

async function requireSemanticPlanProjection(
  publication:
    CanonicalLivingFrameSelectedScenePublication,
): Promise<LivingFrameSemanticPlanProjection> {
  if (!(await verifyLivingFrameSemanticPlanProjection(
    publication.semanticPlanProjection,
  ))) {
    throw conflict(
      'Canonical Living Frame asset/work inputs require the exact verified semantic-plan projection.',
    )
  }
  return publication.semanticPlanProjection as
    LivingFrameSemanticPlanProjection
}

function assertSourceLineage(input: {
  readonly publication:
    CanonicalLivingFrameSelectedScenePublication
  readonly requirements:
    CanonicalLivingFrameExecutionRequirements
  readonly timingBinding:
    CanonicalLivingFrameTimingBinding
  readonly components: CanonicalPlanComponentsInput
  readonly sourceMediaAuthority:
    SourceBindingManifestCandidate
  readonly semanticPlanProjection:
    LivingFrameSemanticPlanProjection
}): void {
  const binding = input.publication.binding
  if (
    binding.sourceBindings
      .semanticPlanProjectionDigestSha256 !==
      input.semanticPlanProjection.projectionDigestSha256
    || input.requirements.sourceBindings
      .selectedSceneBindingDigestSha256 !==
      binding.bindingDigestSha256
    || input.timingBinding.sourceBindings
      .executionRequirementsDigestSha256 !==
      input.requirements.requirementsDigestSha256
    || input.sourceMediaAuthority.workspaceId !==
      binding.identity.workspaceId
    || input.sourceMediaAuthority.projectId !==
      binding.identity.projectId
    || input.sourceMediaAuthority.sourceSequenceHash !==
      sha256AuthorityValue(input.components.sourceSequence)
  ) {
    throw conflict(
      'Canonical Living Frame asset/work input source lineage is stale or inconsistent.',
    )
  }
}

function componentKey(
  sceneId: string,
  componentId: string,
): string {
  return `${sceneId}\u0000${componentId}`
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
  const {
    bindingDigestSha256: _bindingDigestSha256,
    ...rest
  } = value
  void _bindingDigestSha256
  return rest
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
        'canonical_living_frame_asset_work_input_binding',
    },
  )
}
