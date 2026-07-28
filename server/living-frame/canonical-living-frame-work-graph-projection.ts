import type {
  CanonicalCustomerEstimateAuthority,
} from '../../src/types/canonical-customer-estimate-authority'
import type {
  CanonicalLivingFrameAssetWorkInputBinding,
} from '../../src/types/living-frame-asset-work-input-binding'
import {
  CANONICAL_LIVING_FRAME_PENDING_OPERATION,
  CANONICAL_LIVING_FRAME_PENDING_OPERATION_AUTHORITY_VERSION,
  CANONICAL_LIVING_FRAME_PENDING_OPERATION_WORKER_CLASS,
  CANONICAL_LIVING_FRAME_WORK_GRAPH_PROJECTION_SOURCE,
  CANONICAL_LIVING_FRAME_WORK_GRAPH_PROJECTION_VERSION,
  type CanonicalLivingFramePendingWorkItem,
  type CanonicalLivingFrameWorkGraphProjection,
  type CanonicalLivingFrameWorkGraphProjectionAuthorityBoundary,
  type CanonicalLivingFrameWorkGraphProjectionDraft,
  type CanonicalLivingFrameWorkGraphProjectedItem,
} from '../../src/types/living-frame-canonical-work-graph-projection'
import type {
  CanonicalLivingFrameEstimateWorkAssetProjection,
} from '../../src/types/living-frame-estimate-work-asset-projection'
import type {
  CanonicalLivingFrameExecutionRequirements,
} from '../../src/types/living-frame-execution-requirements'
import type {
  CanonicalLivingFrameSelectedScenePublication,
} from '../../src/types/living-frame-selected-scene-binding'
import type {
  CanonicalLivingFrameTimingBinding,
} from '../../src/types/living-frame-timing-binding'
import { ApiError } from '../errors/api-error'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import type {
  CanonicalPlanComponentsInput,
  CanonicalWorkItemInput,
} from '../validation/edit-planning-authority-schemas'

const AUTHORITY_BOUNDARY:
  CanonicalLivingFrameWorkGraphProjectionAuthorityBoundary =
    Object.freeze({
      serverDerivedPendingWorkGraphMutationAuthority: true,
      callerWorkGraphMutationAuthority: false,
      approvedWorkGraphAuthority: false,
      exactToolOperationAuthority: false,
      queueAuthority: false,
      assetManifestAuthority: false,
      artifactQaAuthority: false,
      privateReviewAuthority: false,
      finalCompositionAuthority: false,
      rendererAuthority: false,
      runtimeAuthority: false,
      productionAuthority: false,
    })

const BLOCKER_CODES = Object.freeze([
  'exact_dependency_input_operations_required',
  'artifact_qa_work_items_required',
  'private_review_required',
  'final_composition_dependency_binding_required',
] as const)

export function compileCanonicalLivingFrameWorkGraphProjection(
  input: {
    readonly publication:
      CanonicalLivingFrameSelectedScenePublication
    readonly requirements:
      CanonicalLivingFrameExecutionRequirements
    readonly timingBinding:
      CanonicalLivingFrameTimingBinding
    readonly assetWorkInputBinding:
      CanonicalLivingFrameAssetWorkInputBinding
    readonly estimateWorkAssetProjection:
      CanonicalLivingFrameEstimateWorkAssetProjection
    readonly customerEstimateAuthority:
      CanonicalCustomerEstimateAuthority
    readonly components: CanonicalPlanComponentsInput
  },
): CanonicalLivingFrameWorkGraphProjection {
  assertSourceLineage(input)
  const workItems: CanonicalLivingFramePendingWorkItem[] = []
  const projectedItems:
    CanonicalLivingFrameWorkGraphProjectedItem[] = []

  for (const projectedScene of
    input.estimateWorkAssetProjection.scenes) {
    const boundScene =
      input.assetWorkInputBinding.scenes.find(
        (candidate) =>
          candidate.sceneId === projectedScene.sceneId,
      )
    if (!boundScene) {
      throw conflict(
        'Canonical Living Frame work-graph projection lost its exact scene asset/work binding.',
      )
    }
    const workInputByType = new Map(
      boundScene.namedWorkInputs.map((workInput) => [
        workInput.workItemType,
        workInput,
      ]),
    )
    for (const workRequirement of
      projectedScene.workRequirements) {
      const workInput =
        workInputByType.get(
          workRequirement.workItemType,
        )
      const matchingEstimateLines =
        projectedScene.estimateLineItems.filter(
          (line) =>
            line.workItemType ===
              workRequirement.workItemType
            && line.costOwnerToolId ===
              workRequirement.costOwnerToolId
            && line.costOwnerOperationId ===
              workRequirement.costOwnerOperationId,
        )
      if (
        !workInput
        || matchingEstimateLines.length !== 1
        || stableAuthorityStringify(
          workInput.inputAssetIntentIds,
        ) !== stableAuthorityStringify(
          workRequirement.inputAssetIntentIds,
        )
        || stableAuthorityStringify(
          workInput.outputAssetIntentIds,
        ) !== stableAuthorityStringify(
          workRequirement.outputAssetIntentIds,
        )
        || workRequirement.currentRuntimeAdmission !==
          'blocked_until_real_dependency_input_operation_is_admitted'
        || workRequirement.workGraphMutationAuthorized
        || workRequirement.executablePayloadPresent
      ) {
        throw conflict(
          'Canonical Living Frame pending work lost its exact input, output, estimate, or runtime-admission lineage.',
        )
      }
      const line = matchingEstimateLines[0]!
      const expectedOutput =
        workRequirement.expectedOutput
      const pendingAuthority = {
        schemaVersion:
          CANONICAL_LIVING_FRAME_PENDING_OPERATION_AUTHORITY_VERSION,
        selectedSceneBindingDigestSha256:
          input.publication.binding.bindingDigestSha256,
        assetWorkInputBindingDigestSha256:
          input.assetWorkInputBinding.bindingDigestSha256,
        estimateWorkAssetProjectionDigestSha256:
          input.estimateWorkAssetProjection
            .projectionDigestSha256,
        customerEstimateAuthorityDigestSha256:
          input.customerEstimateAuthority
            .authorityDigestSha256,
        sceneId: projectedScene.sceneId,
        workRequirementDigestSha256:
          sha256AuthorityValue(workRequirement),
        inputAssetIntentIds: [
          ...workRequirement.inputAssetIntentIds,
        ],
        outputAssetIntentIds: [
          ...workRequirement.outputAssetIntentIds,
        ],
        costOwnerToolId:
          workRequirement.costOwnerToolId,
        costOwnerOperationId:
          workRequirement.costOwnerOperationId,
        executionPlacement:
          workRequirement.executionPlacement,
        cpuFallbackAllowed:
          workRequirement.cpuFallbackAllowed,
        exactDependencyInputOperationAdmitted:
          false as const,
        executableStructuredPayloadPresent:
          false as const,
      }
      const workItem:
        CanonicalLivingFramePendingWorkItem = {
          workItemKey:
            workRequirement.workItemKey,
          workItemType:
            workRequirement.workItemType,
          workerClass:
            CANONICAL_LIVING_FRAME_PENDING_OPERATION_WORKER_CLASS,
          executionInput: {
            operation:
              CANONICAL_LIVING_FRAME_PENDING_OPERATION,
            approvedToolOperationIds: [],
            expectedOutputKeys: [
              expectedOutput.outputKey,
            ],
            pendingOperationAuthority:
              pendingAuthority,
          },
          sourceSequenceItemIds: [
            ...workInput.sourceSequenceItemIds,
          ],
          sourceCleanupDecisionIds: [
            ...workInput.sourceCleanupDecisionIds,
          ],
          expectedOutputs: [{
            outputKey: expectedOutput.outputKey,
            artifactType:
              expectedOutput.artifactType,
            assetRole: 'processed',
            required: true,
            previewPlaceholderAllowed: false,
            contentType:
              expectedOutput.contentType,
            segmentIds: [
              ...expectedOutput.segmentIds,
            ],
            timingIds: [
              ...expectedOutput.timingIds,
            ],
            rendererLayerIds: [
              ...expectedOutput.rendererLayerIds,
            ],
          }],
          dependencyKeys: [
            ...workRequirement
              .dependencyWorkItemKeys,
          ],
          approvedToolIds: [],
          providerExecutionMode: 'none',
          fallbackPolicy: {
            policy:
              'block_affected_living_frame_branch_until_exact_operation_admission',
            unapprovedFallbackAllowed: false,
            finalRenderBlockedWhilePending: true,
          },
          maxAttempts: 1,
          attemptTimeoutSeconds: 300,
          scheduledDelaySeconds: 0,
          maximumCreditBudget:
            line.estimatedCredits,
          required: true,
        }
      workItems.push(workItem)
      projectedItems.push({
        sceneId: projectedScene.sceneId,
        workItemKey:
          workRequirement.workItemKey,
        workItemType:
          workRequirement.workItemType,
        costOwnerToolId:
          workRequirement.costOwnerToolId,
        costOwnerOperationId:
          workRequirement.costOwnerOperationId,
        executionPlacement:
          workRequirement.executionPlacement,
        cpuFallbackAllowed:
          workRequirement.cpuFallbackAllowed,
        inputAssetIntentIds: [
          ...workRequirement.inputAssetIntentIds,
        ],
        outputAssetIntentIds: [
          ...workRequirement.outputAssetIntentIds,
        ],
        dependencyWorkItemKeys: [
          ...workRequirement
            .dependencyWorkItemKeys,
        ],
        workItemDigestSha256:
          sha256AuthorityValue(workItem),
      })
    }
  }
  assertPendingWorkGraph(workItems)
  const selectedSceneCount =
    input.publication.binding.selectedSceneCount
  const draft:
    CanonicalLivingFrameWorkGraphProjectionDraft = {
      schemaVersion:
        CANONICAL_LIVING_FRAME_WORK_GRAPH_PROJECTION_VERSION,
      source:
        CANONICAL_LIVING_FRAME_WORK_GRAPH_PROJECTION_SOURCE,
      evidenceClass:
        'private_internal_server_derived_pending_canonical_work_graph',
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
        assetWorkInputBindingDigestSha256:
          input.assetWorkInputBinding.bindingDigestSha256,
        estimateWorkAssetProjectionDigestSha256:
          input.estimateWorkAssetProjection
            .projectionDigestSha256,
        customerEstimateAuthorityDigestSha256:
          input.customerEstimateAuthority
            .authorityDigestSha256,
        currentMasterTimingDigestSha256:
          sha256AuthorityValue(
            input.components.masterTimingPlan,
          ),
        currentSoundSyncDigestSha256:
          sha256AuthorityValue(
            input.components
              .soundSyncTransitionTimingPlan,
          ),
      },
      readiness: selectedSceneCount === 0
        ? 'ready_without_living_frame_work_items'
        : 'canonical_work_items_projected_operation_admission_pending',
      projectedItems,
      workItems,
      blockerCodes: selectedSceneCount === 0
        ? []
        : BLOCKER_CODES,
      metrics: {
        selectedSceneCount,
        canonicalWorkItemCount: workItems.length,
        requiredExpectedOutputCount:
          workItems.reduce(
            (total, item) =>
              total + item.expectedOutputs.length,
            0,
          ),
        gpuPendingWorkItemCount:
          projectedItems.filter(
            (item) =>
              item.executionPlacement ===
              'google_cloud_run_gpu',
          ).length,
        blockedWorkItemCount: workItems.length,
        maximumCreditBudget:
          workItems.reduce(
            (total, item) =>
              total + item.maximumCreditBudget,
            0,
          ),
      },
      authorityBoundary: AUTHORITY_BOUNDARY,
      createsCanonicalWorkItems: true,
      createsApprovedWorkItems: false,
      createsAssetManifestEntries: false,
      currentResourcePlacementExecutionReady: false,
      existingApprovedAssetManifestRemainsAuthority: true,
      containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials:
        false,
      containsProviderPromptOrExecutablePayload: false,
      expandsExactFiftyToolRegistry: false,
      subjectSpecificRouting: false,
      productionReady: false,
    }
  return {
    ...draft,
    projectionDigestSha256:
      sha256AuthorityValue(draft),
  }
}

export function verifyCanonicalLivingFrameWorkGraphProjection(
  input: {
    readonly projection: unknown
    readonly publication:
      CanonicalLivingFrameSelectedScenePublication
    readonly requirements:
      CanonicalLivingFrameExecutionRequirements
    readonly timingBinding:
      CanonicalLivingFrameTimingBinding
    readonly assetWorkInputBinding:
      CanonicalLivingFrameAssetWorkInputBinding
    readonly estimateWorkAssetProjection:
      CanonicalLivingFrameEstimateWorkAssetProjection
    readonly customerEstimateAuthority:
      CanonicalCustomerEstimateAuthority
    readonly components: CanonicalPlanComponentsInput
  },
): input is {
  readonly projection:
    CanonicalLivingFrameWorkGraphProjection
} & Omit<typeof input, 'projection'> {
  try {
    const expected =
      compileCanonicalLivingFrameWorkGraphProjection({
        publication: input.publication,
        requirements: input.requirements,
        timingBinding: input.timingBinding,
        assetWorkInputBinding:
          input.assetWorkInputBinding,
        estimateWorkAssetProjection:
          input.estimateWorkAssetProjection,
        customerEstimateAuthority:
          input.customerEstimateAuthority,
        components: input.components,
      })
    return (
      isRecord(input.projection)
      && input.projection.schemaVersion ===
        CANONICAL_LIVING_FRAME_WORK_GRAPH_PROJECTION_VERSION
      && input.projection.source ===
        CANONICAL_LIVING_FRAME_WORK_GRAPH_PROJECTION_SOURCE
      && input.projection.projectionDigestSha256 ===
        sha256AuthorityValue(
          withoutDigest(input.projection),
        )
      && stableAuthorityStringify(
        input.projection,
      ) === stableAuthorityStringify(expected)
    )
  } catch {
    return false
  }
}

export function canonicalLivingFrameProjectedWorkItems(
  projection:
    CanonicalLivingFrameWorkGraphProjection | undefined,
): CanonicalWorkItemInput[] {
  return projection
    ? projection.workItems.map((workItem) =>
        structuredClone(workItem) as unknown as
          CanonicalWorkItemInput)
    : []
}

function assertSourceLineage(input: {
  readonly publication:
    CanonicalLivingFrameSelectedScenePublication
  readonly requirements:
    CanonicalLivingFrameExecutionRequirements
  readonly timingBinding:
    CanonicalLivingFrameTimingBinding
  readonly assetWorkInputBinding:
    CanonicalLivingFrameAssetWorkInputBinding
  readonly estimateWorkAssetProjection:
    CanonicalLivingFrameEstimateWorkAssetProjection
  readonly customerEstimateAuthority:
    CanonicalCustomerEstimateAuthority
  readonly components: CanonicalPlanComponentsInput
}): void {
  const selectedSceneCount =
    input.publication.binding.selectedSceneCount
  const noUse =
    input.publication.binding.deliberateNonUse
  if (
    input.requirements.sourceBindings
      .selectedSceneBindingDigestSha256 !==
      input.publication.binding.bindingDigestSha256
    || input.timingBinding.sourceBindings
      .executionRequirementsDigestSha256 !==
      input.requirements.requirementsDigestSha256
    || input.assetWorkInputBinding.sourceBindings
      .timingBindingDigestSha256 !==
      input.timingBinding.timingBindingDigestSha256
    || input.estimateWorkAssetProjection.sourceBindings
      .assetWorkInputBindingDigestSha256 !==
      input.assetWorkInputBinding.bindingDigestSha256
    || input.customerEstimateAuthority.sourceBindings
      .livingFrameEstimateWorkAssetProjectionDigestSha256 !==
      input.estimateWorkAssetProjection
        .projectionDigestSha256
    || input.estimateWorkAssetProjection.sourceBindings
      .currentMasterTimingDigestSha256 !==
      sha256AuthorityValue(
        input.components.masterTimingPlan,
      )
    || input.estimateWorkAssetProjection.sourceBindings
      .currentSoundSyncDigestSha256 !==
      sha256AuthorityValue(
        input.components.soundSyncTransitionTimingPlan,
      )
    || selectedSceneCount !==
      input.requirements.scenes.length
    || selectedSceneCount !==
      input.timingBinding.scenes.length
    || selectedSceneCount !==
      input.assetWorkInputBinding.scenes.length
    || selectedSceneCount !==
      input.estimateWorkAssetProjection.scenes.length
    || noUse !== (selectedSceneCount === 0)
    || (
      selectedSceneCount === 0
      && (
        input.assetWorkInputBinding.readiness !==
          'ready_without_living_frame_asset_work_inputs'
        || input.estimateWorkAssetProjection.readiness !==
          'ready_without_living_frame_projection'
      )
    )
    || (
      selectedSceneCount > 0
      && (
        input.assetWorkInputBinding.readiness !==
          'source_inputs_bound_operation_admission_pending'
        || input.estimateWorkAssetProjection.readiness !==
          'requirements_projected_execution_admission_pending'
        || input.assetWorkInputBinding
          .unresolvedPrimaryAssetIntentIds.length !== 0
      )
    )
  ) {
    throw conflict(
      'Canonical Living Frame work-graph projection source lineage is stale or incomplete.',
    )
  }
}

function assertPendingWorkGraph(
  workItems:
    readonly CanonicalLivingFramePendingWorkItem[],
): void {
  const keys = new Set(
    workItems.map((item) => item.workItemKey),
  )
  if (
    keys.size !== workItems.length
    || workItems.some((item) =>
      item.dependencyKeys.includes(
        item.workItemKey,
      )
      || item.dependencyKeys.some(
        (dependencyKey) =>
          !keys.has(dependencyKey),
      )
      || new Set(item.dependencyKeys).size !==
        item.dependencyKeys.length
      || item.approvedToolIds.length !== 0
      || item.executionInput
        .approvedToolOperationIds.length !== 0
      || item.executionInput
        .pendingOperationAuthority
        .exactDependencyInputOperationAdmitted
      || item.executionInput
        .pendingOperationAuthority
        .executableStructuredPayloadPresent
    )
  ) {
    throw conflict(
      'Canonical Living Frame pending work graph contains an invalid identity, dependency, or execution promotion.',
    )
  }
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const byKey = new Map(
    workItems.map((item) => [
      item.workItemKey,
      item,
    ]),
  )
  const visit = (key: string): void => {
    if (visited.has(key)) return
    if (visiting.has(key)) {
      throw conflict(
        'Canonical Living Frame pending work graph contains a cycle.',
      )
    }
    visiting.add(key)
    for (const dependency of
      byKey.get(key)?.dependencyKeys ?? []) {
      visit(dependency)
    }
    visiting.delete(key)
    visited.add(key)
  }
  for (const key of keys) visit(key)
}

function withoutDigest(
  value: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...value }
  delete result.projectionDigestSha256
  return result
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
        'canonical_living_frame_work_graph_projection',
    },
  )
}
