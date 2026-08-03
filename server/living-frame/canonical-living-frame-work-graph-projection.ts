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
  type CanonicalLivingFrameSam31TemporalMaskRequirement,
  type CanonicalLivingFrameTemporalSourcePreparationRequirement,
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
  CANONICAL_SAM3_1_OPERATION_ID,
  CANONICAL_SAM3_1_SOURCE_RUNTIME_CANDIDATE_VERSION,
  createCanonicalSam31SourceRuntimeCandidate,
} from '../model-artifacts/canonical-sam3_1-source-runtime-candidate'
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
      serverDerivedTemporalSourceAndSam31AdmissionAuthority:
        true,
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
const TEMPORAL_MASK_BLOCKER_CODES = Object.freeze([
  ...BLOCKER_CODES,
  'temporal_source_recipe_and_private_metadata_required',
  'sam3_1_checkpoint_runtime_and_cost_admission_required',
  'sam3_1_inference_and_temporal_qa_required',
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
    const workInputByKey = new Map(
      boundScene.namedWorkInputs.map((workInput) => [
        workInput.workInputKey,
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
        workInputByKey.get(
          workRequirement.workInputKey,
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
          workInput.outputAssetKinds,
        ) !== stableAuthorityStringify(
          workRequirement.outputAssetKinds,
        )
        || workInput.operationClass !==
          workRequirement.operationClass
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
        || ![
          'blocked_until_real_dependency_input_operation_is_admitted',
          'blocked_until_temporal_source_recipe_and_sam3_1_model_runtime_are_admitted',
        ].includes(
          workRequirement.currentRuntimeAdmission,
        )
        || workRequirement.workGraphMutationAuthorized
        || workRequirement.executablePayloadPresent
      ) {
        throw conflict(
          'Canonical Living Frame pending work lost its exact input, output, estimate, or runtime-admission lineage.',
        )
      }
      const line = matchingEstimateLines[0]!
      const expectedOutputs =
        workRequirement.expectedOutputs
      const expectedOutput = expectedOutputs[0]
      if (!expectedOutput || expectedOutputs.length < 1) {
        throw conflict(
          'Canonical Living Frame work requirement lost its exact expected outputs.',
        )
      }
      const exactSourceFrameWorkItem =
        workRequirement.operationClass ===
          'remove_still_image_background'
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
          workInputKey:
            workRequirement.workInputKey,
          operationClass:
            workRequirement.operationClass,
          outputAssetKinds: [
            ...workRequirement.outputAssetKinds,
          ],
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
        workRequirement.operationClass ===
          'prepare_straight_alpha_component'
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
          workInputKey:
            workRequirement.workInputKey,
          operationClass:
            workRequirement.operationClass,
          outputAssetKinds: [
            ...workRequirement.outputAssetKinds,
          ],
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
        workRequirement.operationClass ===
          'compile_remotion_layer'
        && admittedSharpComponentWorkItem
      ) {
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
          workInputKey:
            workRequirement.workInputKey,
          operationClass:
            workRequirement.operationClass,
          outputAssetKinds: [
            ...workRequirement.outputAssetKinds,
          ],
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
      const temporalAdmissionRequirements =
        compileTemporalAdmissionRequirements({
          projectedScene,
          workRequirement,
          masterFps: input.timingBinding.fps,
        })
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
        workInputKey:
          workRequirement.workInputKey,
        operationClass:
          workRequirement.operationClass,
        outputAssetKinds: [
          ...workRequirement.outputAssetKinds,
        ],
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
        requestedToolId:
          workRequirement.costOwnerToolId,
        requestedToolOperationId:
          workRequirement.costOwnerOperationId,
        executionPlacement:
          workRequirement.executionPlacement,
        cpuFallbackAllowed:
          workRequirement.cpuFallbackAllowed,
        temporalSourcePreparationRequirement:
          temporalAdmissionRequirements
            .temporalSourcePreparationRequirement,
        sam3_1TemporalMaskRequirement:
          temporalAdmissionRequirements
            .sam3_1TemporalMaskRequirement,
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
            expectedOutputKeys:
              expectedOutputs.map((output) =>
                output.outputKey),
            pendingOperationAuthority:
              pendingAuthority,
          },
          sourceSequenceItemIds: [
            ...workInput.sourceSequenceItemIds,
          ],
          sourceCleanupDecisionIds: [
            ...workInput.sourceCleanupDecisionIds,
          ],
          expectedOutputs:
            expectedOutputs.map((output) => ({
              outputKey: output.outputKey,
              artifactType: output.artifactType,
              assetRole: output.assetRole,
              required: true as const,
              previewPlaceholderAllowed:
                false as const,
              contentType: output.contentType,
              segmentIds: [...output.segmentIds],
              timingIds: [...output.timingIds],
              rendererLayerIds: [
                ...output.rendererLayerIds,
              ],
            })),
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
        workInputKey:
          workRequirement.workInputKey,
        operationClass:
          workRequirement.operationClass,
        outputAssetKinds: [
          ...workRequirement.outputAssetKinds,
        ],
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
  const pendingTemporalSourceVideoWorkItems =
    workItems.filter((item) =>
      item.workerClass ===
        CANONICAL_LIVING_FRAME_PENDING_OPERATION_WORKER_CLASS
      && item.executionInput.pendingOperationAuthority
        .operationClass ===
        'prepare_temporal_source_video')
  const pendingSam31TemporalMaskWorkItems =
    workItems.filter((item) =>
      item.workerClass ===
        CANONICAL_LIVING_FRAME_PENDING_OPERATION_WORKER_CLASS
      && item.executionInput.pendingOperationAuthority
        .operationClass ===
        'temporal_video_subject_segmentation_and_tracking')
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
        : pendingSam31TemporalMaskWorkItems.length > 0
          ? 'canonical_work_items_projected_temporal_mask_admission_pending'
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
        : pendingSam31TemporalMaskWorkItems.length > 0
          ? TEMPORAL_MASK_BLOCKER_CODES
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
        pendingTemporalSourceVideoWorkItemCount:
          pendingTemporalSourceVideoWorkItems.length,
        pendingSam31TemporalMaskWorkItemCount:
          pendingSam31TemporalMaskWorkItems.length,
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
        assignedWorkItemCreditBudget:
          workItems.reduce(
            (total, item) =>
              total + item.maximumCreditBudget,
            0,
          ),
        unassignedControlledIllustrationCreditBudget:
          input.estimateWorkAssetProjection.scenes
            .flatMap((scene) =>
              scene.estimateLineItems)
            .filter((line) =>
              line.costOwnerClass ===
                'shared_controlled_illustration_runtime')
            .reduce(
              (total, line) =>
                total + line.estimatedCredits,
              0,
            ),
        maximumCreditBudget:
          workItems.reduce(
            (total, item) =>
              total + item.maximumCreditBudget,
            0,
          )
          + input.estimateWorkAssetProjection.scenes
            .flatMap((scene) =>
              scene.estimateLineItems)
            .filter((line) =>
              line.costOwnerClass ===
                'shared_controlled_illustration_runtime')
            .reduce(
              (total, line) =>
                total + line.estimatedCredits,
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
      containsTemporalSourceAndSam31PendingAuthority:
        pendingTemporalSourceVideoWorkItems.length > 0
        || pendingSam31TemporalMaskWorkItems.length > 0,
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
        || ![
          'requirements_projected_execution_admission_pending',
          'requirements_projected_unreleased_cost_and_execution_admission_pending',
        ].includes(
          input.estimateWorkAssetProjection.readiness,
        )
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
  for (const item of workItems) {
    if (
      item.workerClass !==
        CANONICAL_LIVING_FRAME_PENDING_OPERATION_WORKER_CLASS
      || item.executionInput.pendingOperationAuthority
        .operationClass !==
        'temporal_video_subject_segmentation_and_tracking'
    ) continue
    const dependency =
      byKey.get(item.dependencyKeys[0] ?? '')
    if (
      !dependency
      || dependency.workerClass !==
        CANONICAL_LIVING_FRAME_PENDING_OPERATION_WORKER_CLASS
      || dependency.executionInput.pendingOperationAuthority
        .operationClass !==
        'prepare_temporal_source_video'
      || dependency.expectedOutputs[0]?.artifactType !==
        'living_frame_temporal_source_video_mp4'
    ) {
      throw conflict(
        'Canonical Living Frame SAM 3.1 temporal mask must depend on the exact pending FFmpeg temporal source-video work item.',
      )
    }
  }
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
    ][number]['workRequirements'][number]['expectedOutputs'][number]
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
    ][number]['workRequirements'][number]['expectedOutputs'][number]
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
    ][number]['workRequirements'][number]['expectedOutputs'][number]
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
      'google_cloud_run_gpu'
    || input.workRequirement.cpuFallbackAllowed
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
    ][number]['workRequirements'][number]['expectedOutputs'][number]
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
      'google_cloud_run_gpu'
    || input.workRequirement.cpuFallbackAllowed
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
    && item.expectedOutputs.length > 0
    && item.expectedOutputs.length <= 3
    && stableAuthorityStringify(
      item.executionInput.expectedOutputKeys,
    ) === stableAuthorityStringify(
      item.expectedOutputs.map((output) =>
        output.outputKey),
    )
    && item.executionInput.pendingOperationAuthority
      .requestedToolId ===
      item.executionInput.pendingOperationAuthority
        .costOwnerToolId
    && item.executionInput.pendingOperationAuthority
      .requestedToolOperationId ===
      item.executionInput.pendingOperationAuthority
        .costOwnerOperationId
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
    && validPendingOperationClass(item)
  )
}

function validPendingOperationClass(
  item: CanonicalLivingFramePendingWorkItem,
): boolean {
  const authority =
    item.executionInput.pendingOperationAuthority
  if (
    authority.operationClass ===
      'prepare_temporal_source_video'
  ) {
    const source = authority.sourceFrameInputs[0]
    const requirement =
      authority.temporalSourcePreparationRequirement
    return (
      item.workItemType === 'process_video_asset'
      && authority.requestedToolId === 'ffmpeg'
      && authority.requestedToolOperationId ===
        'tool.ffmpeg.execute_approved_media_recipe.v1'
      && stableAuthorityStringify(
        authority.outputAssetKinds,
      ) === stableAuthorityStringify([
        'prepared_temporal_source_video',
      ])
      && authority.sourceFrameInputs.length === 1
      && source !== undefined
      && requirement !== null
      && authority.sam3_1TemporalMaskRequirement === null
      && requirement.operation ===
        'prepare_approved_living_frame_temporal_source_video'
      && requirement.transcodeProfile ===
        'approved_sam3_1_gpu_source_proxy_lossless_mapping_v1'
      && authority.executionPlacement ===
        'google_cloud_run_gpu'
      && !authority.cpuFallbackAllowed
      && requirement.selectedMasterFrameRange
            .startFrame === source.masterFrameIndex
      && requirement.selectedMasterFrameRange
        .durationFrames ===
          requirement.selectedMasterFrameRange
            .endFrameExclusive
          - requirement.selectedMasterFrameRange
            .startFrame
      && requirement.selectedSourceTimeRange
        .startSourceFrameIndex ===
          source.sourceFrameIndex
      && requirement.selectedSourceTimeRange
        .sourceFpsNumerator === source.frameRate
      && requirement.sourceMedia
        .sourceSequenceItemId ===
          source.sourceSequenceItemId
      && requirement.sourceMedia.mediaAssetId ===
        source.mediaAssetId
      && requirement.sourceMedia.contentSha256 ===
        source.contentSha256
      && requirement.sourceMedia.byteLength ===
        source.byteLength
      && requirement.outputArtifactType ===
        'living_frame_temporal_source_video_mp4'
      && requirement.maximumOutputBytes ===
        4_294_901_760
      && !requirement.recipeOperationRegistered
      && !requirement.dispatchAuthorized
      && item.dependencyKeys.length === 0
      && item.expectedOutputs.length === 1
      && item.expectedOutputs[0]?.artifactType ===
        'living_frame_temporal_source_video_mp4'
      && item.expectedOutputs[0]?.contentType ===
        'video/mp4'
    )
  }
  if (
    authority.operationClass ===
      'temporal_video_subject_segmentation_and_tracking'
  ) {
    const requirement =
      authority.sam3_1TemporalMaskRequirement
    return (
      item.workItemType === 'generate_mask_asset'
      && authority.requestedToolId === 'sam3_1'
      && authority.requestedToolOperationId ===
        CANONICAL_SAM3_1_OPERATION_ID
      && stableAuthorityStringify(
        authority.outputAssetKinds,
      ) === stableAuthorityStringify([
        'temporal_subject_mask_sequence',
      ])
      && authority.sourceFrameInputs.length === 0
      && authority.temporalSourcePreparationRequirement ===
        null
      && requirement !== null
      && requirement.sourceCandidateVersion ===
        CANONICAL_SAM3_1_SOURCE_RUNTIME_CANDIDATE_VERSION
      && /^[a-f0-9]{64}$/u.test(
        requirement.sourceCandidateHash,
      )
      && requirement.operationId ===
        CANONICAL_SAM3_1_OPERATION_ID
      && requirement.checkpointSlotId ===
        'sam3_1_checkpoint'
      && requirement.checkpointRepositoryRevision ===
        'daa63191845a41281374e725f4c9e51c7a824460'
      && requirement.checkpointFileName ===
        'sam3.1_multiplex.pt'
      && requirement.checkpointExactByteLengthAndSha256State ===
        'pending_authorized_private_ingest'
      && requirement.primaryExecutionTarget ===
        'google_cloud_batch_a2_ultra_job'
      && requirement.primaryAccelerator ===
        'nvidia_a100_80gb'
      && requirement.fallbackExecutionTarget ===
        'google_cloud_run_l4_job'
      && requirement.fallbackAccelerator === 'nvidia_l4'
      && requirement.costProfileId ===
        'sam3_1_multiplex_video_segmentation_v1'
      && requirement.modelAccelerator === 'cuda_12_8'
      && !requirement.cpuOnlySubstantiveExecutionAllowed
      && authority.executionPlacement ===
        'google_cloud_run_gpu'
      && !authority.cpuFallbackAllowed
      && !requirement.runtimeDownloadAllowed
      && !requirement.networkFetchAllowed
      && requirement.maximumSubjects === 16
      && requirement.gpuDecodeRequired
      && requirement.gpuDecodeBackend ===
        'torchcodec_0_10_cuda_nvdec'
      && !requirement.cpuOpenCvOrPillowDecodeAllowed
      && requirement.preserveContactObjects
      && requirement.subjectPromptBindingState ===
        'pending_server_compiled_approved_text_subject'
      && stableAuthorityStringify(
        requirement.outputEncodingProfiles,
      ) === stableAuthorityStringify([
        'lossless_grayscale_png_mask_sequence_v1',
        'sam3_1_tracking_analysis_report_json_v1',
        'sam3_1_mask_qa_measurement_report_json_v1',
      ])
      && stableAuthorityStringify(
        requirement.requiredQaGates,
      ) === stableAuthorityStringify([
        'mask_edge_quality',
        'mask_temporal_stability',
        'mask_subject_coverage',
        'mask_contact_object_preservation',
        'complete_selected_interval_inspection',
      ])
      && !requirement.authorizedTermsAndLicenseApproved
      && !requirement.checkpointIngested
      && !requirement.readOnlyMountVerified
      && !requirement.sourceCheckpointCompatibilityQualified
      && !requirement.immutableA100ImageQualified
      && !requirement.immutableL4ImageQualified
      && !requirement.a100RuntimeQualified
      && !requirement.l4RuntimeQualified
      && !requirement.primaryAndFallbackRateAuthoritiesReread
      && !requirement.customerEstimateAndFundedReservationComplete
      && !requirement.operationRegistered
      && !requirement.dispatchAuthorized
      && !requirement.modelInferenceAuthorized
      && !requirement.runtimeCostAdmissionComplete
      && !requirement.temporalQaComplete
      && !requirement.privateReviewComplete
      && item.dependencyKeys.length === 1
      && item.expectedOutputs.length === 3
      && item.expectedOutputs[0]?.artifactType ===
        'living_frame_temporal_subject_mask_sequence_ffv1_mkv'
      && item.expectedOutputs[0]?.contentType ===
        'video/x-matroska'
      && item.expectedOutputs[1]?.artifactType ===
        'living_frame_temporal_subject_tracking_analysis_json'
      && item.expectedOutputs[1]?.contentType ===
        'application/json'
      && item.expectedOutputs[2]?.artifactType ===
        'living_frame_temporal_subject_mask_qa_json'
      && item.expectedOutputs[2]?.assetRole === 'qa'
    )
  }
  return (
    authority.temporalSourcePreparationRequirement === null
    && authority.sam3_1TemporalMaskRequirement === null
  )
}

function compileTemporalAdmissionRequirements(input: {
  readonly projectedScene:
    CanonicalLivingFrameEstimateWorkAssetProjection[
      'scenes'
    ][number]
  readonly workRequirement:
    CanonicalLivingFrameEstimateWorkAssetProjection[
      'scenes'
    ][number]['workRequirements'][number]
  readonly masterFps: number
}): {
  readonly temporalSourcePreparationRequirement:
    CanonicalLivingFrameTemporalSourcePreparationRequirement | null
  readonly sam3_1TemporalMaskRequirement:
    CanonicalLivingFrameSam31TemporalMaskRequirement | null
} {
  if (
    input.workRequirement.operationClass ===
      'prepare_temporal_source_video'
  ) {
    const source =
      input.workRequirement.sourceFrameInputs[0]
    const durationFrames =
      input.projectedScene.endFrameExclusive
      - input.projectedScene.startFrame
    if (
      input.workRequirement.sourceFrameInputs.length !== 1
      || !source
      || source.masterFrameIndex !==
        input.projectedScene.startFrame
      || !source.contentType.startsWith('video/')
      || !Number.isSafeInteger(source.byteLength)
      || source.byteLength < 1
      || !Number.isSafeInteger(source.sourceFrameIndex)
      || source.sourceFrameIndex < 0
      || !Number.isSafeInteger(source.frameRate)
      || source.frameRate < 1
      || source.frameRate > 240
      || !Number.isSafeInteger(input.masterFps)
      || input.masterFps < 1
      || input.masterFps > 240
      || !Number.isSafeInteger(durationFrames)
      || durationFrames < 1
    ) {
      throw conflict(
        'Canonical Living Frame temporal source preparation requires one exact private source-video identity and selected MasterTiming range.',
      )
    }
    return {
      temporalSourcePreparationRequirement: {
        requirementVersion:
          'canonical-living-frame-temporal-source-preparation-requirement-v1',
        operation:
          'prepare_approved_living_frame_temporal_source_video',
        transcodeProfile:
          'approved_sam3_1_gpu_source_proxy_lossless_mapping_v1',
        selectedMasterFrameRange: {
          startFrame:
            input.projectedScene.startFrame,
          endFrameExclusive:
            input.projectedScene.endFrameExclusive,
          durationFrames,
        },
        selectedSourceTimeRange: {
          startSourceFrameIndex:
            source.sourceFrameIndex,
          sourceFpsNumerator: source.frameRate,
          sourceFpsDenominator: 1,
          durationMasterFrames: durationFrames,
          masterFpsNumerator: input.masterFps,
          masterFpsDenominator: 1,
        },
        sourceMedia: {
          sourceSequenceItemId:
            source.sourceSequenceItemId,
          mediaAssetId: source.mediaAssetId,
          contentSha256: source.contentSha256,
          contentType: source.contentType,
          byteLength: source.byteLength,
          sourceBindingHash:
            source.sourceBindingHash,
          storageIdentityHash:
            source.storageIdentityHash,
          dimensionsBindingState:
            'pending_server_owned_private_source_metadata',
        },
        outputArtifactType:
          'living_frame_temporal_source_video_mp4',
        outputContentType: 'video/mp4',
        displayOrientationNormalized: true,
        preserveDisplayAspectRatio: true,
        maximumOutputBytes: 4_294_901_760,
        privateArtifactRequired: true,
        exactSceneRangeRequired: true,
        metadataStripped: true,
        audioRemoved: true,
        runtimeDownloadAllowed: false,
        networkFetchAllowed: false,
        recipeOperationRegistered: false,
        dispatchAuthorized: false,
      },
      sam3_1TemporalMaskRequirement: null,
    }
  }
  if (
    input.workRequirement.operationClass ===
      'temporal_video_subject_segmentation_and_tracking'
  ) {
    const candidate =
      createCanonicalSam31SourceRuntimeCandidate()
    if (
      candidate.schemaVersion !==
        CANONICAL_SAM3_1_SOURCE_RUNTIME_CANDIDATE_VERSION
      || candidate.operationId !== CANONICAL_SAM3_1_OPERATION_ID
      || candidate.registryIdentity.canonicalToolId !== 'sam3_1'
      || candidate.replacement.supersedesForNewPlans !== 'sam2'
      || candidate.replacement
        .sam2MayAuthorizeNewPlanWorkFallbackOrRepair
      || !candidate.registryIdentity.gpuRequired
      || candidate.registryIdentity.cpuAllowed
      || candidate.officialCheckpoint.repositoryRevision !==
        'daa63191845a41281374e725f4c9e51c7a824460'
      || candidate.officialCheckpoint.fileName !==
        'sam3.1_multiplex.pt'
      || candidate.cost.costProfileId !==
        'sam3_1_multiplex_video_segmentation_v1'
      || !candidate.cost.primaryAndFallbackRateAuthoritiesRequired
      || candidate.authority.termsAccepted
      || candidate.authority.checkpointIngested
      || candidate.authority.imageBuiltOrPushed
      || candidate.authority.runtimeExecuted
      || candidate.authority.workDispatched
      || candidate.authority.productionReady
    ) {
      throw conflict(
        'Canonical Living Frame SAM 3.1 temporal masking lost its exact replacement, gated checkpoint, GPU, or cost boundary.',
      )
    }
    return {
      temporalSourcePreparationRequirement: null,
      sam3_1TemporalMaskRequirement: {
        requirementVersion:
          'canonical-living-frame-sam3_1-temporal-mask-requirement-v1',
        sourceCandidateVersion:
          CANONICAL_SAM3_1_SOURCE_RUNTIME_CANDIDATE_VERSION,
        sourceCandidateHash: candidate.candidateHash,
        operationId: CANONICAL_SAM3_1_OPERATION_ID,
        checkpointSlotId: 'sam3_1_checkpoint',
        checkpointRepositoryRevision:
          'daa63191845a41281374e725f4c9e51c7a824460',
        checkpointFileName: 'sam3.1_multiplex.pt',
        checkpointExactByteLengthAndSha256State:
          'pending_authorized_private_ingest',
        primaryExecutionTarget:
          'google_cloud_batch_a2_ultra_job',
        primaryAccelerator: 'nvidia_a100_80gb',
        fallbackExecutionTarget:
          'google_cloud_run_l4_job',
        fallbackAccelerator: 'nvidia_l4',
        costProfileId:
          'sam3_1_multiplex_video_segmentation_v1',
        modelAccelerator: 'cuda_12_8',
        cpuOnlySubstantiveExecutionAllowed: false,
        runtimeDownloadAllowed: false,
        networkFetchAllowed: false,
        maximumSubjects: 16,
        gpuDecodeRequired: true,
        gpuDecodeBackend:
          'torchcodec_0_10_cuda_nvdec',
        cpuOpenCvOrPillowDecodeAllowed: false,
        preserveContactObjects: true,
        subjectPromptBindingState:
          'pending_server_compiled_approved_text_subject',
        outputEncodingProfiles: [
          'lossless_grayscale_png_mask_sequence_v1',
          'sam3_1_tracking_analysis_report_json_v1',
          'sam3_1_mask_qa_measurement_report_json_v1',
        ],
        requiredQaGates: [
          'mask_edge_quality',
          'mask_temporal_stability',
          'mask_subject_coverage',
          'mask_contact_object_preservation',
          'complete_selected_interval_inspection',
        ],
        authorizedTermsAndLicenseApproved: false,
        checkpointIngested: false,
        readOnlyMountVerified: false,
        sourceCheckpointCompatibilityQualified: false,
        immutableA100ImageQualified: false,
        immutableL4ImageQualified: false,
        a100RuntimeQualified: false,
        l4RuntimeQualified: false,
        primaryAndFallbackRateAuthoritiesReread: false,
        customerEstimateAndFundedReservationComplete: false,
        operationRegistered: false,
        dispatchAuthorized: false,
        modelInferenceAuthorized: false,
        runtimeCostAdmissionComplete: false,
        temporalQaComplete: false,
        privateReviewComplete: false,
      },
    }
  }
  return {
    temporalSourcePreparationRequirement: null,
    sam3_1TemporalMaskRequirement: null,
  }
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
