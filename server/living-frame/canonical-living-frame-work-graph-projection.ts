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
  CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_TOOL_OPERATION,
  CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_WORKER_CLASS,
  CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_WORK_INPUT_VERSION,
  CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_WORK_ITEM_OPERATION,
  CANONICAL_LIVING_FRAME_SHARP_COMPONENT_RECIPE,
  CANONICAL_LIVING_FRAME_SHARP_COMPONENT_TOOL_OPERATION,
  CANONICAL_LIVING_FRAME_SHARP_COMPONENT_WORKER_CLASS,
  CANONICAL_LIVING_FRAME_SHARP_COMPONENT_WORK_ITEM_OPERATION,
  CANONICAL_LIVING_FRAME_FINAL_OVERLAY_POLICY,
  CANONICAL_LIVING_FRAME_REMOTION_LAYER_WORKER_CLASS,
  CANONICAL_LIVING_FRAME_REMOTION_LAYER_WORK_INPUT_VERSION,
  CANONICAL_LIVING_FRAME_REMOTION_LAYER_WORK_ITEM_OPERATION,
  CANONICAL_EXACT_SOURCE_FRAME_PNG_OUTPUT_ROLE,
  CANONICAL_EXACT_SOURCE_FRAME_PNG_WORK_ITEM_OPERATION,
  CANONICAL_EXACT_SOURCE_FRAME_PNG_WORKER_CLASS,
  type CanonicalLivingFrameExactSourceFramePngWorkItem,
  CANONICAL_LIVING_FRAME_WORK_GRAPH_PROJECTION_SOURCE,
  CANONICAL_LIVING_FRAME_WORK_GRAPH_PROJECTION_VERSION,
  type CanonicalLivingFramePendingWorkItem,
  type CanonicalLivingFrameProjectedCanonicalWorkItem,
  type CanonicalLivingFrameRembgGpuMaskWorkItem,
  type CanonicalLivingFrameRemotionLayerWorkItem,
  type CanonicalLivingFrameSharpComponentWorkItem,
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
  assertCanonicalExactSourceFramePngWorkItem,
} from '../edit-architecture/canonical-exact-source-frame-png-authority'
import {
  assertCanonicalLivingFrameRembgGpuMaskWorkItem,
} from '../edit-architecture/canonical-living-frame-rembg-gpu-mask-authority'
import {
  assertCanonicalLivingFrameSharpComponentWorkItem,
} from '../edit-architecture/canonical-living-frame-sharp-component-authority'
import {
  OFFLINE_EXACT_SOURCE_FRAME_PNG_PROFILE,
  OFFLINE_MEDIA_BINARY_OPERATIONS,
} from '../tool-execution/media-binary-execution'
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
      serverDerivedExactSourceFrameOperationAuthority: true,
      serverDerivedRembgGpuMaskOperationAuthority: true,
      serverDerivedSharpComponentOperationAuthority: true,
      serverDerivedRemotionLayerManifestAuthority: true,
      serverDerivedFinalCompositionDependencyAuthority: true,
      callerWorkGraphMutationAuthority: false,
      approvedWorkGraphAuthority: false,
      remainingLivingFrameExactToolOperationAuthority: false,
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
  'artifact_qa_work_items_required',
  'private_review_required',
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
  const workItems:
    CanonicalLivingFrameProjectedCanonicalWorkItem[] = []
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
    let admittedExactSourceFrameWorkItem:
      CanonicalLivingFrameExactSourceFramePngWorkItem | undefined
    let admittedRembgGpuMaskWorkItem:
      CanonicalLivingFrameRembgGpuMaskWorkItem | undefined
    let admittedSharpComponentWorkItem:
      CanonicalLivingFrameSharpComponentWorkItem | undefined
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
        || stableAuthorityStringify(
          workInput.sourceFrameInputs,
        ) !== stableAuthorityStringify(
          workRequirement.sourceFrameInputs,
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
      const exactSourceFrameWorkItem =
        workRequirement.workItemType ===
          'generate_mask_asset'
          ? compileExactSourceFrameWorkItem({
              workRequirement,
              expectedOutput,
            })
          : undefined
      if (exactSourceFrameWorkItem) {
        workItems.push(exactSourceFrameWorkItem)
        admittedExactSourceFrameWorkItem =
          exactSourceFrameWorkItem
      }
      const admittedDependencyKeys =
        exactSourceFrameWorkItem
          ? uniqueSorted([
              ...workRequirement
                .dependencyWorkItemKeys,
              exactSourceFrameWorkItem.workItemKey,
            ])
          : [
              ...workRequirement
                .dependencyWorkItemKeys,
            ]
      if (exactSourceFrameWorkItem) {
        const rembgGpuMaskWorkItem =
          compileRembgGpuMaskWorkItem({
            workRequirement,
            expectedOutput,
            exactSourceFrameWorkItem,
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
            maximumCreditBudget:
              line.estimatedCredits,
          })
        workItems.push(rembgGpuMaskWorkItem)
        admittedRembgGpuMaskWorkItem =
          rembgGpuMaskWorkItem
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
          sourceFrameInputs:
            workRequirement.sourceFrameInputs.map(
              (sourceFrameInput) => ({
                ...sourceFrameInput,
              }),
            ),
          dependencyWorkItemKeys: [
            ...admittedDependencyKeys,
          ],
          workItemDigestSha256:
            sha256AuthorityValue(rembgGpuMaskWorkItem),
        })
        continue
      }
      if (
        workRequirement.workItemType ===
          'process_image_asset'
      ) {
        if (
          !admittedExactSourceFrameWorkItem
          || !admittedRembgGpuMaskWorkItem
        ) {
          throw conflict(
            'Canonical Living Frame Sharp component requires the already-admitted exact source frame and rembg mask.',
          )
        }
        const sharpComponentWorkItem =
          compileSharpComponentWorkItem({
            workRequirement,
            expectedOutput,
            exactSourceFrameWorkItem:
              admittedExactSourceFrameWorkItem,
            rembgGpuMaskWorkItem:
              admittedRembgGpuMaskWorkItem,
            outputWidth:
              input.components.confirmedSettings
                .outputFrame.width,
            outputHeight:
              input.components.confirmedSettings
                .outputFrame.height,
            maximumCreditBudget:
              line.estimatedCredits,
          })
        workItems.push(sharpComponentWorkItem)
        admittedSharpComponentWorkItem =
          sharpComponentWorkItem
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
          sourceFrameInputs:
            workRequirement.sourceFrameInputs.map(
              (sourceFrameInput) => ({
                ...sourceFrameInput,
              }),
            ),
          dependencyWorkItemKeys: [
            ...sharpComponentWorkItem
              .dependencyKeys,
          ],
          workItemDigestSha256:
            sha256AuthorityValue(
              sharpComponentWorkItem,
            ),
        })
        continue
      }
      if (
        workRequirement.workItemType ===
          'prepare_remotion_layer'
      ) {
        if (!admittedSharpComponentWorkItem) {
          throw conflict(
            'Canonical Living Frame Remotion layer requires the already-admitted Sharp RGBA component.',
          )
        }
        const timingScene =
          input.timingBinding.scenes.find(
            (scene) =>
              scene.sceneId === projectedScene.sceneId,
          )
        if (!timingScene) {
          throw conflict(
            'Canonical Living Frame Remotion layer lost its exact MasterTiming scene.',
          )
        }
        const remotionLayerWorkItem =
          compileRemotionLayerWorkItem({
            workRequirement,
            expectedOutput,
            sharpComponentWorkItem:
              admittedSharpComponentWorkItem,
            selectedSceneBindingDigestSha256:
              input.publication.binding.bindingDigestSha256,
            timingBindingDigestSha256:
              input.timingBinding.timingBindingDigestSha256,
            startFrame:
              timingScene.visualTiming.frameRange.startFrame,
            endFrameExclusive:
              timingScene.visualTiming.frameRange.endFrameExclusive,
            outputWidth:
              input.components.confirmedSettings
                .outputFrame.width,
            outputHeight:
              input.components.confirmedSettings
                .outputFrame.height,
            maximumCreditBudget:
              line.estimatedCredits,
          })
        workItems.push(remotionLayerWorkItem)
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
          sourceFrameInputs: [],
          dependencyWorkItemKeys: [
            ...remotionLayerWorkItem.dependencyKeys,
          ],
          workItemDigestSha256:
            sha256AuthorityValue(
              remotionLayerWorkItem,
            ),
        })
        continue
      }
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
        sourceFrameInputs:
          workRequirement.sourceFrameInputs.map(
            (sourceFrameInput) => ({
              ...sourceFrameInput,
            }),
          ),
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
            ...admittedDependencyKeys,
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
        sourceFrameInputs:
          workRequirement.sourceFrameInputs.map(
            (sourceFrameInput) => ({
              ...sourceFrameInput,
            }),
          ),
        dependencyWorkItemKeys: [
          ...admittedDependencyKeys,
        ],
        workItemDigestSha256:
          sha256AuthorityValue(workItem),
      })
    }
  }
  assertProjectedWorkGraph(workItems)
  const selectedSceneCount =
    input.publication.binding.selectedSceneCount
  const remotionLayerWorkItems =
    workItems.filter(
      (item): item is CanonicalLivingFrameRemotionLayerWorkItem =>
        item.workerClass ===
          CANONICAL_LIVING_FRAME_REMOTION_LAYER_WORKER_CLASS,
    )
  const finalCompositionBindingDraft =
    selectedSceneCount === 0
      ? null
      : {
          policy:
            CANONICAL_LIVING_FRAME_FINAL_OVERLAY_POLICY,
          requiredFinalWorkItemType:
            'render_final_export' as const,
          requiredRemotionOperation:
            'tool.remotion.render_approved_composition.v1' as const,
          overlayLayers:
            remotionLayerWorkItems.map((workItem) => {
              const payload =
                workItem.executionInput.structuredPayload
              return {
                sceneId: payload.sceneId,
                layerId: payload.layerId,
                manifestWorkItemKey:
                  workItem.workItemKey,
                manifestOutputKey:
                  workItem.expectedOutputs[0].outputKey,
                componentWorkItemKey:
                  payload.componentDependency.workItemKey,
                componentOutputKey:
                  payload.componentDependency.outputKey,
                startFrame: payload.startFrame,
                endFrameExclusive:
                  payload.endFrameExclusive,
                fit: payload.fit,
                opacity: payload.opacity,
              }
            }),
          requiredDependencyWorkItemKeys:
            uniqueSorted(
              remotionLayerWorkItems.flatMap((workItem) => [
                workItem.workItemKey,
                workItem.executionInput.structuredPayload
                  .componentDependency.workItemKey,
              ]),
            ),
          captionPlaneRemainsAboveLivingFrame:
            true as const,
        }
  const finalCompositionBinding =
    finalCompositionBindingDraft === null
      ? null
      : {
          ...finalCompositionBindingDraft,
          bindingDigestSha256:
            sha256AuthorityValue(
              finalCompositionBindingDraft,
            ),
        }
  const draft:
    CanonicalLivingFrameWorkGraphProjectionDraft = {
      schemaVersion:
        CANONICAL_LIVING_FRAME_WORK_GRAPH_PROJECTION_VERSION,
      source:
        CANONICAL_LIVING_FRAME_WORK_GRAPH_PROJECTION_SOURCE,
      evidenceClass:
        'private_internal_server_derived_canonical_work_graph_projection',
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
        : workItems.some((item) =>
            item.workerClass ===
              CANONICAL_LIVING_FRAME_REMOTION_LAYER_WORKER_CLASS)
        ? 'canonical_work_items_projected_remotion_layer_and_final_composition_bound'
        : workItems.some((item) =>
            item.workerClass ===
              CANONICAL_LIVING_FRAME_SHARP_COMPONENT_WORKER_CLASS)
        ? 'canonical_work_items_projected_sharp_component_operation_admitted'
        : workItems.some((item) =>
            item.workerClass ===
              CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_WORKER_CLASS)
        ? 'canonical_work_items_projected_rembg_gpu_operation_admitted'
        : workItems.some((item) =>
            item.workerClass ===
              CANONICAL_EXACT_SOURCE_FRAME_PNG_WORKER_CLASS)
        ? 'canonical_work_items_projected_exact_source_frame_admitted'
        : 'canonical_work_items_projected_operation_admission_pending',
      projectedItems,
      workItems,
      finalCompositionBinding,
      blockerCodes: selectedSceneCount === 0
        ? []
        : BLOCKER_CODES,
      metrics: {
        selectedSceneCount,
        canonicalWorkItemCount: workItems.length,
        admittedExactSourceFrameWorkItemCount:
          workItems.filter((item) =>
            item.workerClass ===
              CANONICAL_EXACT_SOURCE_FRAME_PNG_WORKER_CLASS)
            .length,
        admittedRembgGpuMaskWorkItemCount:
          workItems.filter((item) =>
            item.workerClass ===
              CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_WORKER_CLASS)
            .length,
        admittedSharpComponentWorkItemCount:
          workItems.filter((item) =>
            item.workerClass ===
              CANONICAL_LIVING_FRAME_SHARP_COMPONENT_WORKER_CLASS)
            .length,
        admittedRemotionLayerWorkItemCount:
          remotionLayerWorkItems.length,
        finalCompositionBindingCount:
          finalCompositionBinding === null ? 0 : 1,
        executableWorkItemCount:
          workItems.filter((item) =>
            item.workerClass ===
              CANONICAL_EXACT_SOURCE_FRAME_PNG_WORKER_CLASS
            || item.workerClass ===
              CANONICAL_LIVING_FRAME_SHARP_COMPONENT_WORKER_CLASS
            || item.workerClass ===
              CANONICAL_LIVING_FRAME_REMOTION_LAYER_WORKER_CLASS)
            .length,
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
        blockedWorkItemCount:
          workItems.filter((item) =>
            item.workerClass ===
              CANONICAL_LIVING_FRAME_PENDING_OPERATION_WORKER_CLASS
            || item.workerClass ===
              CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_WORKER_CLASS)
            .length,
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
      containsProviderPrompt: false,
      containsExactSourceFrameExecutablePayload: true,
      containsRembgGpuOperationPayload: true,
      containsSharpComponentOperationPayload: true,
      containsRemotionLayerManifestPayload: true,
      containsFinalCompositionDependencyBinding: true,
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

export function bindCanonicalLivingFrameFinalCompositionWorkItems(
  input: {
    readonly workItems:
      readonly CanonicalWorkItemInput[]
    readonly projection:
      CanonicalLivingFrameWorkGraphProjection | undefined
  },
): CanonicalWorkItemInput[] {
  const workItems = input.workItems.map((item) =>
    structuredClone(item))
  const binding =
    input.projection?.finalCompositionBinding
  if (!binding) return workItems
  const finalIndexes = workItems
    .map((item, index) =>
      item.workItemType === 'render_final_export'
      && item.approvedToolIds.includes('remotion')
        ? index
        : -1)
    .filter((index) => index >= 0)
  if (finalIndexes.length !== 1) {
    throw conflict(
      'Canonical Living Frame final composition requires exactly one existing Remotion final-export work item.',
    )
  }
  const finalIndex = finalIndexes[0]!
  const finalItem = workItems[finalIndex]!
  const executionInput =
    finalItem.executionInput
  if (!isRecord(executionInput.structuredPayload)) {
    throw conflict(
      'Canonical Living Frame final composition requires a structured Remotion payload.',
    )
  }
  const structuredPayload =
    executionInput.structuredPayload
  const expectedOutputs =
    finalItem.expectedOutputs
  if (
    executionInput.operation !==
      'render_approved_source_caption_final'
    || stableAuthorityStringify(
      executionInput.approvedToolOperationIds,
    ) !== stableAuthorityStringify([
      binding.requiredRemotionOperation,
    ])
    || ![
      'approved_source_caption_final_v1',
      'approved_source_caption_track_final_v1',
      'approved_source_sequence_caption_final_v1',
      'approved_source_sequence_caption_track_final_v1',
    ].includes(
      String(structuredPayload.compositionProfileId),
    )
    || Object.hasOwn(
      structuredPayload,
      'livingFrameOverlayPolicy',
    )
    || Object.hasOwn(
      structuredPayload,
      'livingFrameOverlayLayers',
    )
    || expectedOutputs.length !== 1
  ) {
    throw conflict(
      'Canonical Living Frame final composition cannot mutate an unsupported or already-bound renderer payload.',
    )
  }
  const durationFrames =
    Number(structuredPayload.durationFrames)
  if (
    !Number.isSafeInteger(durationFrames)
    || binding.overlayLayers.some((layer) =>
      layer.startFrame < 0
      || layer.endFrameExclusive <= layer.startFrame
      || layer.endFrameExclusive > durationFrames)
  ) {
    throw conflict(
      'Canonical Living Frame overlay timing is outside the approved final-composition duration.',
    )
  }
  const output = expectedOutputs[0]!
  const rendererLayerIds = [
    ...output.rendererLayerIds,
  ]
  const captionIndex = rendererLayerIds.findIndex(
    (layerId) =>
      layerId.toLowerCase().includes('caption'),
  )
  const insertionIndex =
    captionIndex < 0
      ? rendererLayerIds.length
      : captionIndex
  rendererLayerIds.splice(
    insertionIndex,
    0,
    ...binding.overlayLayers.map((layer) =>
      layer.layerId),
  )
  if (
    new Set(rendererLayerIds).size !==
      rendererLayerIds.length
  ) {
    throw conflict(
      'Canonical Living Frame renderer layer identities collide with the existing final composition.',
    )
  }
  workItems[finalIndex] = {
    ...finalItem,
    executionInput: {
      ...executionInput,
      structuredPayload: {
        ...structuredPayload,
        livingFrameOverlayPolicy:
          binding.policy,
        livingFrameOverlayLayers:
          binding.overlayLayers.map((layer) => ({
            sceneId: layer.sceneId,
            layerId: layer.layerId,
            manifestOutputKey:
              layer.manifestOutputKey,
            componentOutputKey:
              layer.componentOutputKey,
            startFrame: layer.startFrame,
            endFrameExclusive:
              layer.endFrameExclusive,
            fit: layer.fit,
            opacity: layer.opacity,
          })),
      },
    },
    expectedOutputs: [{
      ...output,
      rendererLayerIds,
    }],
    dependencyKeys: uniqueSorted([
      ...finalItem.dependencyKeys,
      ...binding.requiredDependencyWorkItemKeys,
    ]),
  } as CanonicalWorkItemInput
  return workItems
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

function assertProjectedWorkGraph(
  workItems:
    readonly CanonicalLivingFrameProjectedCanonicalWorkItem[],
): void {
  const keys = new Set(
    workItems.map((item) => item.workItemKey),
  )
  if (
    keys.size !== workItems.length
    || workItems.some((item) =>
      Array.from(item.dependencyKeys).includes(
        item.workItemKey,
      )
      || item.dependencyKeys.some(
        (dependencyKey) =>
          !keys.has(dependencyKey),
      )
      || new Set(item.dependencyKeys).size !==
        item.dependencyKeys.length
      || !validProjectedWorkItem(item)
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

function compileExactSourceFrameWorkItem(input: {
  readonly workRequirement:
    CanonicalLivingFrameEstimateWorkAssetProjection[
      'scenes'
    ][number]['workRequirements'][number]
  readonly expectedOutput:
    CanonicalLivingFrameEstimateWorkAssetProjection[
      'scenes'
    ][number]['workRequirements'][number]['expectedOutput']
}): CanonicalLivingFrameExactSourceFramePngWorkItem {
  const sourceFrame =
    input.workRequirement.sourceFrameInputs[0]
  if (
    input.workRequirement.sourceFrameInputs.length !== 1
    || !sourceFrame
    || ![24, 25, 30, 50, 60].includes(
      sourceFrame.frameRate,
    )
  ) {
    throw conflict(
      'Canonical Living Frame mask extraction requires one exact source frame at an admitted frame rate.',
    )
  }
  const workItemKey =
    `${input.workRequirement.workItemKey}-exact-source-frame-png`
  const outputKey = `${workItemKey}-output`
  const workItem:
    CanonicalLivingFrameExactSourceFramePngWorkItem = {
      workItemKey,
      workItemType: 'process_image_asset',
      workerClass:
        CANONICAL_EXACT_SOURCE_FRAME_PNG_WORKER_CLASS,
      executionInput: {
        operation:
          CANONICAL_EXACT_SOURCE_FRAME_PNG_WORK_ITEM_OPERATION,
        approvedToolOperationIds: [
          OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
        ],
        expectedOutputKeys: [outputKey],
        structuredPayload: {
          recipeProfileId:
            OFFLINE_EXACT_SOURCE_FRAME_PNG_PROFILE,
          timestampPolicy:
            'select_exact_decoded_source_frame',
          overwriteExistingArtifact: false,
          allowUnreviewedCodec: false,
          sourceSequenceItemId:
            sourceFrame.sourceSequenceItemId,
          sourceCleanupDecisionId:
            sourceFrame.sourceCleanupDecisionId,
          masterFrameIndex:
            sourceFrame.masterFrameIndex,
          sourceFrameIndex:
            sourceFrame.sourceFrameIndex,
          frameRate: sourceFrame.frameRate as
            24 | 25 | 30 | 50 | 60,
          sourceFrameSelectionDigestSha256:
            sourceFrame
              .sourceFrameSelectionDigestSha256,
          frameSelectionPolicy:
            'approved_source_frame_ordinal_v1',
          outputContainer: 'png',
          outputCodec: 'png',
          outputPixelFormat: 'rgba',
          metadataPolicy: 'strip_all',
          preserveAudio: false,
          maximumWidth: 4096,
          maximumHeight: 4096,
          maximumPixelCount: 16_777_216,
          maximumOutputBytes: 16_777_216,
        },
      },
      sourceSequenceItemIds: [
        sourceFrame.sourceSequenceItemId,
      ],
      sourceCleanupDecisionIds: [
        sourceFrame.sourceCleanupDecisionId,
      ],
      expectedOutputs: [{
        outputKey,
        artifactType:
          CANONICAL_EXACT_SOURCE_FRAME_PNG_OUTPUT_ROLE,
        assetRole: 'processed',
        required: true,
        previewPlaceholderAllowed: false,
        contentType: 'image/png',
        segmentIds: [
          ...input.expectedOutput.segmentIds,
        ],
        timingIds: [
          ...input.expectedOutput.timingIds,
        ],
        rendererLayerIds: [
          ...input.expectedOutput.rendererLayerIds,
        ],
      }],
      dependencyKeys: [],
      approvedToolIds: ['ffmpeg'],
      providerExecutionMode: 'none',
      fallbackPolicy: {
        policy:
          'block_living_frame_mask_until_exact_source_frame_exists',
        unapprovedFallbackAllowed: false,
        finalRenderBlockedWhilePending: true,
      },
      maxAttempts: 2,
      attemptTimeoutSeconds: 300,
      scheduledDelaySeconds: 0,
      maximumCreditBudget: 0,
      required: true,
    }
  assertCanonicalExactSourceFramePngWorkItem(
    workItem,
  )
  return workItem
}

function compileRembgGpuMaskWorkItem(input: {
  readonly workRequirement:
    CanonicalLivingFrameEstimateWorkAssetProjection[
      'scenes'
    ][number]['workRequirements'][number]
  readonly expectedOutput:
    CanonicalLivingFrameEstimateWorkAssetProjection[
      'scenes'
    ][number]['workRequirements'][number]['expectedOutput']
  readonly exactSourceFrameWorkItem:
    CanonicalLivingFrameExactSourceFramePngWorkItem
  readonly selectedSceneBindingDigestSha256: string
  readonly assetWorkInputBindingDigestSha256: string
  readonly estimateWorkAssetProjectionDigestSha256: string
  readonly customerEstimateAuthorityDigestSha256: string
  readonly maximumCreditBudget: number
}): CanonicalLivingFrameRembgGpuMaskWorkItem {
  const sourceFrame =
    input.workRequirement.sourceFrameInputs[0]
  const sourceOutput =
    input.exactSourceFrameWorkItem.expectedOutputs[0]
  if (
    input.workRequirement.workItemType !==
      'generate_mask_asset'
    || input.workRequirement.costOwnerToolId !== 'rembg'
    || input.workRequirement.costOwnerOperationId !==
      CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_TOOL_OPERATION
    || input.workRequirement.executionPlacement !==
      'google_cloud_run_gpu'
    || input.workRequirement.cpuFallbackAllowed
    || input.workRequirement.sourceFrameInputs.length !== 1
    || !sourceFrame
    || input.expectedOutput.artifactType !==
      'living_frame_alpha_mask_png'
    || input.expectedOutput.contentType !== 'image/png'
    || !Number.isInteger(input.maximumCreditBudget)
    || input.maximumCreditBudget <= 0
  ) {
    throw conflict(
      'Canonical Living Frame rembg mask work requires the exact GPU-only operation, source frame, output, and estimate authority.',
    )
  }
  const workItem:
    CanonicalLivingFrameRembgGpuMaskWorkItem = {
      workItemKey:
        input.workRequirement.workItemKey,
      workItemType: 'generate_mask_asset',
      workerClass:
        CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_WORKER_CLASS,
      executionInput: {
        operation:
          CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_WORK_ITEM_OPERATION,
        approvedToolOperationIds: [
          CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_TOOL_OPERATION,
        ],
        expectedOutputKeys: [
          input.expectedOutput.outputKey,
        ],
        structuredPayload: {
          schemaVersion:
            CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_WORK_INPUT_VERSION,
          selectedSceneBindingDigestSha256:
            input.selectedSceneBindingDigestSha256,
          assetWorkInputBindingDigestSha256:
            input.assetWorkInputBindingDigestSha256,
          estimateWorkAssetProjectionDigestSha256:
            input.estimateWorkAssetProjectionDigestSha256,
          customerEstimateAuthorityDigestSha256:
            input.customerEstimateAuthorityDigestSha256,
          sceneId: input.workRequirement.sceneId,
          workRequirementDigestSha256:
            sha256AuthorityValue(input.workRequirement),
          inputAssetIntentIds: [
            ...input.workRequirement.inputAssetIntentIds,
          ],
          outputAssetIntentIds: [
            ...input.workRequirement.outputAssetIntentIds,
          ],
          sourceFrameDependency: {
            workItemKey:
              input.exactSourceFrameWorkItem.workItemKey,
            outputKey: sourceOutput.outputKey,
            artifactType:
              CANONICAL_EXACT_SOURCE_FRAME_PNG_OUTPUT_ROLE,
            sourceSequenceItemId:
              sourceFrame.sourceSequenceItemId,
            sourceCleanupDecisionId:
              sourceFrame.sourceCleanupDecisionId,
            masterFrameIndex:
              sourceFrame.masterFrameIndex,
            sourceFrameIndex:
              sourceFrame.sourceFrameIndex,
            frameRate: sourceFrame.frameRate as
              24 | 25 | 30 | 50 | 60,
            frameSelectionPolicy:
              'approved_source_frame_ordinal_v1',
            sourceFrameSelectionDigestSha256:
              sourceFrame.sourceFrameSelectionDigestSha256,
            contentType: 'image/png',
          },
          runtimePolicy: {
            executionTarget: 'google_cloud_run_gpu',
            workerType:
              CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_WORKER_CLASS,
            accelerator: 'nvidia_l4',
            gpuCount: 1,
            device: 'cuda',
            modelId: 'u2netp',
            outputMode: 'mask_only_png',
            confidenceThreshold: 0.5,
            alphaMatteMode: 'straight',
            edgeRefinementProfileId:
              'approved_u2netp_default_v1',
            maximumSubjects: 1,
            preserveSourceDimensions: true,
            cpuFallbackAllowed: false,
            runtimeDownloadAllowed: false,
            networkFetchAllowed: false,
          },
          requiredQaGates: [
            'mask_edge_quality',
            'mask_subject_coverage',
          ],
          runtimeQualificationRequired: true,
          outputArtifactCommitRequired: true,
          artifactQaPassRequired: true,
        },
      },
      sourceSequenceItemIds: [
        sourceFrame.sourceSequenceItemId,
      ],
      sourceCleanupDecisionIds: [
        sourceFrame.sourceCleanupDecisionId,
      ],
      expectedOutputs: [{
        outputKey: input.expectedOutput.outputKey,
        artifactType: 'living_frame_alpha_mask_png',
        assetRole: 'processed',
        required: true,
        previewPlaceholderAllowed: false,
        contentType: 'image/png',
        segmentIds: [
          ...input.expectedOutput.segmentIds,
        ],
        timingIds: [
          ...input.expectedOutput.timingIds,
        ],
        rendererLayerIds: [
          ...input.expectedOutput.rendererLayerIds,
        ],
      }],
      dependencyKeys: uniqueSorted([
        ...input.workRequirement.dependencyWorkItemKeys,
        input.exactSourceFrameWorkItem.workItemKey,
      ]),
      approvedToolIds: ['rembg'],
      providerExecutionMode: 'none',
      fallbackPolicy: {
        policy:
          'block_living_frame_branch_until_gpu_runtime_and_mask_qa_pass',
        unapprovedFallbackAllowed: false,
        cpuFallbackAllowed: false,
        finalRenderBlockedWhilePending: true,
      },
      maxAttempts: 2,
      attemptTimeoutSeconds: 3_600,
      scheduledDelaySeconds: 0,
      maximumCreditBudget:
        input.maximumCreditBudget,
      required: true,
    }
  assertCanonicalLivingFrameRembgGpuMaskWorkItem(
    workItem,
  )
  return workItem
}

function compileSharpComponentWorkItem(input: {
  readonly workRequirement:
    CanonicalLivingFrameEstimateWorkAssetProjection[
      'scenes'
    ][number]['workRequirements'][number]
  readonly expectedOutput:
    CanonicalLivingFrameEstimateWorkAssetProjection[
      'scenes'
    ][number]['workRequirements'][number]['expectedOutput']
  readonly exactSourceFrameWorkItem:
    CanonicalLivingFrameExactSourceFramePngWorkItem
  readonly rembgGpuMaskWorkItem:
    CanonicalLivingFrameRembgGpuMaskWorkItem
  readonly outputWidth: number
  readonly outputHeight: number
  readonly maximumCreditBudget: number
}): CanonicalLivingFrameSharpComponentWorkItem {
  const sourceFrame =
    input.workRequirement.sourceFrameInputs[0]
  const dependencyKeys = uniqueSorted([
    ...input.workRequirement.dependencyWorkItemKeys,
    input.exactSourceFrameWorkItem.workItemKey,
  ])
  if (
    input.workRequirement.workItemType !==
      'process_image_asset'
    || input.workRequirement.costOwnerToolId !==
      'sharp'
    || input.workRequirement.costOwnerOperationId !==
      CANONICAL_LIVING_FRAME_SHARP_COMPONENT_TOOL_OPERATION
    || input.workRequirement.executionPlacement !==
      'private_render_worker'
    || !input.workRequirement.cpuFallbackAllowed
    || input.workRequirement.sourceFrameInputs.length !== 1
    || !sourceFrame
    || input.expectedOutput.artifactType !==
      'living_frame_component_rgba_png'
    || input.expectedOutput.contentType !== 'image/png'
    || dependencyKeys.length !== 2
    || !dependencyKeys.includes(
      input.rembgGpuMaskWorkItem.workItemKey,
    )
    || !dependencyKeys.includes(
      input.exactSourceFrameWorkItem.workItemKey,
    )
    || input.rembgGpuMaskWorkItem
      .sourceSequenceItemIds[0] !==
        sourceFrame.sourceSequenceItemId
    || input.exactSourceFrameWorkItem
      .sourceSequenceItemIds[0] !==
        sourceFrame.sourceSequenceItemId
    || input.rembgGpuMaskWorkItem
      .sourceCleanupDecisionIds[0] !==
        sourceFrame.sourceCleanupDecisionId
    || input.exactSourceFrameWorkItem
      .sourceCleanupDecisionIds[0] !==
        sourceFrame.sourceCleanupDecisionId
    || !Number.isSafeInteger(input.outputWidth)
    || input.outputWidth < 1
    || input.outputWidth > 4_096
    || !Number.isSafeInteger(input.outputHeight)
    || input.outputHeight < 1
    || input.outputHeight > 4_096
    || input.outputWidth * input.outputHeight >
      16_777_216
    || !Number.isInteger(input.maximumCreditBudget)
    || input.maximumCreditBudget <= 0
  ) {
    throw conflict(
      'Canonical Living Frame Sharp component requires the exact source PNG, QA-bound rembg mask, output frame, and estimate authority.',
    )
  }
  const workItem:
    CanonicalLivingFrameSharpComponentWorkItem = {
      workItemKey:
        input.workRequirement.workItemKey,
      workItemType: 'process_image_asset',
      workerClass:
        CANONICAL_LIVING_FRAME_SHARP_COMPONENT_WORKER_CLASS,
      executionInput: {
        operation:
          CANONICAL_LIVING_FRAME_SHARP_COMPONENT_WORK_ITEM_OPERATION,
        approvedToolOperationIds: [
          CANONICAL_LIVING_FRAME_SHARP_COMPONENT_TOOL_OPERATION,
        ],
        expectedOutputKeys: [
          input.expectedOutput.outputKey,
        ],
        structuredPayload: {
          imageRecipeId:
            CANONICAL_LIVING_FRAME_SHARP_COMPONENT_RECIPE,
          outputFormat: 'png',
          outputWidth: input.outputWidth,
          outputHeight: input.outputHeight,
          preserveMetadata: false,
          allowUpscale: false,
        },
      },
      sourceSequenceItemIds: [
        sourceFrame.sourceSequenceItemId,
      ],
      sourceCleanupDecisionIds: [
        sourceFrame.sourceCleanupDecisionId,
      ],
      expectedOutputs: [{
        outputKey: input.expectedOutput.outputKey,
        artifactType:
          'living_frame_component_rgba_png',
        assetRole: 'processed',
        required: true,
        previewPlaceholderAllowed: false,
        contentType: 'image/png',
        segmentIds: [
          ...input.expectedOutput.segmentIds,
        ],
        timingIds: [
          ...input.expectedOutput.timingIds,
        ],
        rendererLayerIds: [
          ...input.expectedOutput.rendererLayerIds,
        ],
      }],
      dependencyKeys,
      approvedToolIds: ['sharp'],
      providerExecutionMode: 'none',
      fallbackPolicy: {
        policy:
          'block_living_frame_branch_until_source_mask_component_and_alpha_qa_pass',
        unapprovedFallbackAllowed: false,
        finalRenderBlockedWhilePending: true,
      },
      maxAttempts: 2,
      attemptTimeoutSeconds: 300,
      scheduledDelaySeconds: 0,
      maximumCreditBudget:
        input.maximumCreditBudget,
      required: true,
    }
  assertCanonicalLivingFrameSharpComponentWorkItem(
    workItem,
  )
  return workItem
}

function compileRemotionLayerWorkItem(input: {
  readonly workRequirement:
    CanonicalLivingFrameEstimateWorkAssetProjection[
      'scenes'
    ][number]['workRequirements'][number]
  readonly expectedOutput:
    CanonicalLivingFrameEstimateWorkAssetProjection[
      'scenes'
    ][number]['workRequirements'][number]['expectedOutput']
  readonly sharpComponentWorkItem:
    CanonicalLivingFrameSharpComponentWorkItem
  readonly selectedSceneBindingDigestSha256: string
  readonly timingBindingDigestSha256: string
  readonly startFrame: number
  readonly endFrameExclusive: number
  readonly outputWidth: number
  readonly outputHeight: number
  readonly maximumCreditBudget: number
}): CanonicalLivingFrameRemotionLayerWorkItem {
  const componentOutput =
    input.sharpComponentWorkItem.expectedOutputs[0]
  const layerId =
    input.expectedOutput.rendererLayerIds[0]
  if (
    input.workRequirement.workItemType !==
      'prepare_remotion_layer'
    || input.workRequirement.costOwnerToolId !==
      'remotion'
    || input.workRequirement.executionPlacement !==
      'private_render_worker'
    || !input.workRequirement.cpuFallbackAllowed
    || input.workRequirement.sourceFrameInputs.length !== 0
    || input.expectedOutput.artifactType !==
      'living_frame_remotion_layer_manifest'
    || input.expectedOutput.contentType !==
      'application/json'
    || input.expectedOutput.rendererLayerIds.length !== 1
    || !layerId
    || input.workRequirement
      .dependencyWorkItemKeys.length !== 1
    || input.workRequirement
      .dependencyWorkItemKeys[0] !==
        input.sharpComponentWorkItem.workItemKey
    || input.startFrame < 0
    || input.endFrameExclusive <= input.startFrame
    || !Number.isSafeInteger(input.outputWidth)
    || !Number.isSafeInteger(input.outputHeight)
    || input.outputWidth < 1
    || input.outputHeight < 1
    || input.outputWidth > 4_096
    || input.outputHeight > 4_096
    || !Number.isInteger(input.maximumCreditBudget)
    || input.maximumCreditBudget <= 0
  ) {
    throw conflict(
      'Canonical Living Frame Remotion layer requires one exact RGBA dependency, MasterTiming range, output frame, and estimate authority.',
    )
  }
  return {
    workItemKey:
      input.workRequirement.workItemKey,
    workItemType: 'prepare_remotion_layer',
    workerClass:
      CANONICAL_LIVING_FRAME_REMOTION_LAYER_WORKER_CLASS,
    executionInput: {
      operation:
        CANONICAL_LIVING_FRAME_REMOTION_LAYER_WORK_ITEM_OPERATION,
      approvedToolOperationIds: [],
      expectedOutputKeys: [
        input.expectedOutput.outputKey,
      ],
      structuredPayload: {
        schemaVersion:
          CANONICAL_LIVING_FRAME_REMOTION_LAYER_WORK_INPUT_VERSION,
        selectedSceneBindingDigestSha256:
          input.selectedSceneBindingDigestSha256,
        timingBindingDigestSha256:
          input.timingBindingDigestSha256,
        sceneId:
          input.workRequirement.sceneId,
        layerId,
        startFrame: input.startFrame,
        endFrameExclusive:
          input.endFrameExclusive,
        outputWidth: input.outputWidth,
        outputHeight: input.outputHeight,
        fit: 'fill',
        opacity: 1,
        compositionPolicy:
          CANONICAL_LIVING_FRAME_FINAL_OVERLAY_POLICY,
        captionPlaneRemainsAboveLivingFrame:
          true,
        componentDependency: {
          workItemKey:
            input.sharpComponentWorkItem.workItemKey,
          outputKey:
            componentOutput.outputKey,
          artifactType:
            'living_frame_component_rgba_png',
          contentType: 'image/png',
        },
      },
    },
    sourceSequenceItemIds: [
      ...input.sharpComponentWorkItem
        .sourceSequenceItemIds,
    ],
    sourceCleanupDecisionIds: [
      ...input.sharpComponentWorkItem
        .sourceCleanupDecisionIds,
    ],
    expectedOutputs: [{
      outputKey:
        input.expectedOutput.outputKey,
      artifactType:
        'living_frame_remotion_layer_manifest',
      assetRole: 'processed',
      required: true,
      previewPlaceholderAllowed: false,
      contentType: 'application/json',
      segmentIds: [
        ...input.expectedOutput.segmentIds,
      ],
      timingIds: [
        ...input.expectedOutput.timingIds,
      ],
      rendererLayerIds: [layerId],
    }],
    dependencyKeys: [
      input.sharpComponentWorkItem.workItemKey,
    ],
    approvedToolIds: [],
    providerExecutionMode: 'none',
    fallbackPolicy: {
      policy:
        'block_final_composition_until_living_frame_component_and_layer_manifest_qa_pass',
      unapprovedFallbackAllowed: false,
      finalRenderBlockedWhilePending: true,
    },
    maxAttempts: 2,
    attemptTimeoutSeconds: 300,
    scheduledDelaySeconds: 0,
    maximumCreditBudget:
      input.maximumCreditBudget,
    required: true,
  }
}

function validProjectedWorkItem(
  item: CanonicalLivingFrameProjectedCanonicalWorkItem,
): boolean {
  if (
    item.workerClass ===
      CANONICAL_EXACT_SOURCE_FRAME_PNG_WORKER_CLASS
  ) {
    try {
      assertCanonicalExactSourceFramePngWorkItem(
        item,
      )
      return item.maximumCreditBudget === 0
        && item.maxAttempts === 2
        && item.dependencyKeys.length === 0
    } catch {
      return false
    }
  }
  if (
    item.workerClass ===
      CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_WORKER_CLASS
  ) {
    try {
      assertCanonicalLivingFrameRembgGpuMaskWorkItem(
        item,
      )
      return item.maximumCreditBudget > 0
        && item.dependencyKeys.some(
          (dependencyKey) =>
            dependencyKey.endsWith(
              '-exact-source-frame-png',
            ),
        )
    } catch {
      return false
    }
  }
  if (
    item.workerClass ===
      CANONICAL_LIVING_FRAME_SHARP_COMPONENT_WORKER_CLASS
  ) {
    try {
      assertCanonicalLivingFrameSharpComponentWorkItem(
        item,
      )
      return item.maximumCreditBudget > 0
        && item.dependencyKeys.length === 2
    } catch {
      return false
    }
  }
  if (
    item.workerClass ===
      CANONICAL_LIVING_FRAME_REMOTION_LAYER_WORKER_CLASS
  ) {
    const payload =
      item.executionInput.structuredPayload
    return (
      item.workItemType ===
        'prepare_remotion_layer'
      && item.approvedToolIds.length === 0
      && item.executionInput
        .approvedToolOperationIds.length === 0
      && item.dependencyKeys.length === 1
      && item.dependencyKeys[0] ===
        payload.componentDependency.workItemKey
      && item.expectedOutputs[0].outputKey ===
        item.executionInput.expectedOutputKeys[0]
      && item.expectedOutputs[0]
        .rendererLayerIds[0] === payload.layerId
      && payload.startFrame >= 0
      && payload.endFrameExclusive >
        payload.startFrame
      && payload.compositionPolicy ===
        CANONICAL_LIVING_FRAME_FINAL_OVERLAY_POLICY
      && payload.captionPlaneRemainsAboveLivingFrame
      && payload.fit === 'fill'
      && payload.opacity === 1
    )
  }
  return (
    item.approvedToolIds.length === 0
    && item.executionInput
      .approvedToolOperationIds.length === 0
    && !item.executionInput
      .pendingOperationAuthority
      .executableStructuredPayloadPresent
    && new Set(
      item.executionInput.pendingOperationAuthority
        .sourceFrameInputs.map((source) =>
          source.assetIntentId),
    ).size ===
      item.executionInput.pendingOperationAuthority
        .sourceFrameInputs.length
    && item.executionInput.pendingOperationAuthority
      .sourceFrameInputs.every((source) =>
        item.sourceSequenceItemIds.includes(
          source.sourceSequenceItemId,
        )
        && item.sourceCleanupDecisionIds.includes(
          source.sourceCleanupDecisionId,
        )
        && Number.isInteger(source.masterFrameIndex)
        && Number.isInteger(source.sourceFrameIndex)
        && Number.isInteger(source.frameRate)
        && source.masterFrameIndex >= 0
        && source.sourceFrameIndex >= 0
        && source.frameRate >= 1
        && source.frameRate <= 240
      )
    && (
      !item.executionInput
        .pendingOperationAuthority
        .exactDependencyInputOperationAdmitted
      || (
        item.workItemType ===
          'generate_mask_asset'
        && item.dependencyKeys.some(
          (dependencyKey) =>
            dependencyKey.endsWith(
              '-exact-source-frame-png',
            ),
        )
      )
    )
  )
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

function uniqueSorted(
  values: readonly string[],
): string[] {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right))
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
