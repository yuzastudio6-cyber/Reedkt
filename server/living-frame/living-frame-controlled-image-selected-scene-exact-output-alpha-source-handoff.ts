import { createHash } from 'node:crypto'

import type {
  CanonicalLivingFrameControlledIllustrationGenerationWorkItem,
  CanonicalLivingFrameProjectedCanonicalWorkItem,
  CanonicalLivingFrameWorkGraphProjection,
} from '../../src/types/living-frame-canonical-work-graph-projection'
import {
  CANONICAL_LIVING_FRAME_GENERATED_OPAQUE_STILL_OUTPUT_ROLE,
  CANONICAL_LIVING_FRAME_PENDING_OPERATION,
  CANONICAL_LIVING_FRAME_PENDING_OPERATION_WORKER_CLASS,
  CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_TOOL_OPERATION,
  CANONICAL_LIVING_FRAME_SHARP_COMPONENT_TOOL_OPERATION,
  CANONICAL_LIVING_FRAME_WORK_GRAPH_PROJECTION_SOURCE,
  CANONICAL_LIVING_FRAME_WORK_GRAPH_PROJECTION_VERSION,
} from '../../src/types/living-frame-canonical-work-graph-projection'
import type {
  LivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliation,
} from '../../src/types/living-frame-controlled-image-selected-scene-alpha-work-chain-reconciliation'
import {
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_EXACT_OUTPUT_ALPHA_SOURCE_HANDOFF_CLASS,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_EXACT_OUTPUT_ALPHA_SOURCE_HANDOFF_ISSUE_CODES,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_EXACT_OUTPUT_ALPHA_SOURCE_HANDOFF_OPEN_GATES,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_EXACT_OUTPUT_ALPHA_SOURCE_HANDOFF_STATE,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_EXACT_OUTPUT_ALPHA_SOURCE_HANDOFF_VERSION,
  type LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoff,
  type LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoffAuthority,
  type LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoffDraft,
  type LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoffIssue,
  type LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoffIssueCode,
} from '../../src/types/living-frame-controlled-image-selected-scene-exact-output-alpha-source-handoff'
import {
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OUTPUT_EVIDENCE_CLASSES,
  type LivingFrameControlledImageSelectedScenePrivateOutputEvidenceClass,
  type LivingFrameControlledImageSelectedScenePrivateOutputObservation,
} from '../../src/types/living-frame-controlled-image-selected-scene-private-output-observation'
import type {
  LivingFrameControlledImageSelectedSceneRequest,
} from '../../src/types/living-frame-controlled-image-selected-scene-request'
import {
  type CreateLivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliationInput,
  verifyLivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliation,
} from './living-frame-controlled-image-selected-scene-alpha-work-chain-reconciliation'
import {
  verifyLivingFrameControlledImageSelectedScenePrivateOutputObservation,
} from './living-frame-controlled-image-selected-scene-private-output-observation'
import {
  type CreateLivingFrameControlledImageSelectedSceneRequestInput,
  verifyLivingFrameControlledImageSelectedSceneRequest,
} from './living-frame-controlled-image-selected-scene-request'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const EXPECTED_WIDTH = 1_024 as const
const EXPECTED_HEIGHT = 1_024 as const
const EXPECTED_PIXEL_COUNT = 1_048_576 as const
const EXPECTED_RGBA_BYTE_LENGTH = 4_194_304 as const
const MAX_OUTPUT_BYTE_LENGTH = 32 * 1_024 * 1_024
const URL_LIKE = /(?:https?:\/\/|file:\/\/|data:|javascript:)/iu
const SECRET_LIKE =
  /(?:-----BEGIN [A-Z ]+PRIVATE KEY-----|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9_-]{16,})/u

const EXPECTED_CONFLICT_CODES = [
  'canonical_multi_output_generation_not_admitted_to_rembg',
  'canonical_rembg_mask_output_missing',
  'canonical_rembg_work_item_missing',
  'canonical_sharp_rgba_output_missing',
  'canonical_sharp_work_item_missing',
] as const

const AUTHORITY_BOUNDARY:
  LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoffAuthority =
  deepFreeze({
    privateExactOutputRereadAndLeaseAuthority: true,
    selectedSceneAuthority: false,
    outputFrameAuthority: false,
    operationRegistryAuthority: false,
    providerAuthority: false,
    queueAuthority: false,
    dispatchAuthority: false,
    workerLeaseAuthority: false,
    workerCompletionAuthority: false,
    runtimeAuthority: false,
    gpuAttemptAuthority: false,
    timingAuthority: false,
    soundAuthority: false,
    estimateAuthority: false,
    actualCostAuthority: false,
    customerPriceAuthority: false,
    customerCreditAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    workItemAuthority: false,
    workGraphMutationAuthority: false,
    artifactPersistenceAuthority: false,
    assetManifestAuthority: false,
    rembgAdmissionAuthority: false,
    rembgDispatchAuthority: false,
    maskArtifactAuthority: false,
    sharpAdmissionAuthority: false,
    alphaComponentAuthority: false,
    qaApprovalAuthority: false,
    privateReviewAuthority: false,
    renderAuthority: false,
    finalCanvasAuthority: false,
    productionAuthority: false,
  })

export interface LivingFrameControlledImageSelectedSceneExactOutputAlphaSourcePacket {
  readonly packetClass:
    'server_owned_exact_selected_scene_isolated_opaque_alpha_source_packet_v1'
  readonly evidenceClass:
    LivingFrameControlledImageSelectedScenePrivateOutputEvidenceClass
  readonly privateOutputObservationId: string
  readonly privateOutputObservationDigestSha256: string
  readonly alphaWorkChainReconciliationId: string
  readonly alphaWorkChainReconciliationDigestSha256: string
  readonly sceneId: string
  readonly componentId: string
  readonly outputKey: string
  readonly approvedWorkItemId: string
  readonly parentGenerationWorkItemKey: string
  readonly parentExpectedOutputIndex: number
  readonly generatedAssetIntentId: string
  readonly approvedPlannedAssetManifestEntryId: string
  readonly outputCandidateId: string
  readonly outputContentType: 'image/png'
  readonly outputByteLength: number
  readonly outputContentSha256: string
  readonly decodedRgbaSha256: string
  readonly outputPng: Buffer
  readonly decodedRgba: Buffer
  readonly callerBytesPathUrlCredentialPromptSeedDimensionModelCommandOrEnvironmentAccepted:
    false
  readonly workGraphMutationAuthority: false
  readonly rembgAdmissionAuthority: false
  readonly dispatchAuthority: false
  readonly artifactPersistenceAuthority: false
  readonly actualCostAuthority: false
  readonly productionReady: false
}

export interface LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceReader {
  readonly readerVersion:
    'living-frame-controlled-image-selected-scene-exact-output-alpha-source-reader-v1'
  readonly readerClass:
    'process_bound_server_owned_exact_selected_scene_alpha_source_reader'
  readonly evidenceClass:
    LivingFrameControlledImageSelectedScenePrivateOutputEvidenceClass
  readonly binding: {
    readonly privateOutputObservationId: string
    readonly privateOutputObservationDigestSha256: string
    readonly alphaWorkChainReconciliationId: string
    readonly alphaWorkChainReconciliationDigestSha256: string
    readonly canonicalWorkGraphProjectionDigestSha256: string
    readonly sceneId: string
    readonly componentId: string
    readonly outputKey: string
    readonly approvedWorkItemId: string
    readonly approvedPlannedAssetManifestEntryId: string
    readonly outputCandidateId: string
    readonly outputContentSha256: string
    readonly decodedRgbaSha256: string
    readonly sourceReaderBindingDigestSha256: string
  }
  readonly callerBytesPathUrlCredentialPromptSeedDimensionModelCommandOrEnvironmentAccepted:
    false
  readonly workGraphMutationAuthority: false
  readonly rembgAdmissionAuthority: false
  readonly dispatchAuthority: false
  readonly artifactPersistenceAuthority: false
  readonly actualCostAuthority: false
  readonly productionReady: false
  readCurrentExactOpaqueOutput():
    Promise<LivingFrameControlledImageSelectedSceneExactOutputAlphaSourcePacket>
}

export interface LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceLease {
  readonly leaseClass:
    'process_bound_single_use_exact_selected_scene_isolated_alpha_source_lease_v1'
  readonly leaseId: string
  readonly handoffDigestSha256: string
  readonly sceneId: string
  readonly componentId: string
  readonly outputKey: string
  readonly outputCandidateId: string
  readonly exactSourceSelectorDigestSha256: string
  readonly callerSerializable: false
  readonly workGraphMutationAuthority: false
  readonly rembgAdmissionAuthority: false
  readonly dispatchAuthority: false
  readonly artifactPersistenceAuthority: false
  readonly actualCostAuthority: false
  readonly productionReady: false
}

export interface LivingFrameControlledImageSelectedSceneExactOutputAlphaSource {
  readonly sourceClass:
    'verified_exact_selected_scene_isolated_opaque_png_for_canonical_alpha_owner_v1'
  readonly exactSourceSelector:
    LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoff[
      'exactSourceSelector'
    ]
  readonly outputPng: Buffer
  readonly decodedRgba: Buffer
  readonly verification: {
    readonly handoffDigestSha256: string
    readonly privateOutputObservationDigestSha256: string
    readonly alphaWorkChainReconciliationDigestSha256: string
    readonly canonicalWorkGraphProjectionDigestSha256: string
    readonly outputContentSha256: string
    readonly decodedRgbaSha256: string
    readonly widthPixels: 1_024
    readonly heightPixels: 1_024
    readonly opaqueGeneratedSourceOnly: true
  }
  readonly dispatchAuthority: false
  readonly artifactPersistenceAuthority: false
  readonly productionReady: false
}

export interface LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoffResult {
  readonly receipt:
    LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoff
  readonly privateSourceLease:
    LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceLease
}

export interface CreateLivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoffInput {
  readonly selectedSceneRequest:
    LivingFrameControlledImageSelectedSceneRequest
  readonly selectedSceneRequestInput:
    CreateLivingFrameControlledImageSelectedSceneRequestInput
  readonly privateOutputObservation:
    LivingFrameControlledImageSelectedScenePrivateOutputObservation
  readonly alphaWorkChainReconciliation:
    LivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliation
  readonly canonicalWorkGraphProjection:
    CanonicalLivingFrameWorkGraphProjection
  readonly sourceReader:
    LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceReader
}

interface ExactSelection {
  readonly requestUnit:
    LivingFrameControlledImageSelectedSceneRequest['requestUnits'][number]
  readonly generation:
    CanonicalLivingFrameControlledIllustrationGenerationWorkItem
  readonly outputIndex: number
  readonly generatedAssetIntentId: string
}

const sourceReaders = new WeakSet<object>()
const consumedSourceReaders = new WeakSet<object>()
const sourceLeases = new WeakSet<object>()
const consumedSourceLeases = new WeakSet<object>()
const privateSources = new WeakMap<
  object,
  LivingFrameControlledImageSelectedSceneExactOutputAlphaSource
>()

export class LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoffError
  extends Error {
  readonly issues:
    readonly LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoffIssue[]

  constructor(
    issues:
      readonly LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoffIssue[],
  ) {
    super(
      'Living Frame selected-scene exact-output alpha source handoff failed.',
    )
    this.name =
      'LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoffError'
    this.issues = issues
  }
}

export function createLivingFrameControlledImageSelectedSceneExactOutputAlphaSourceReader(
  input: {
    readonly privateOutputObservation:
      LivingFrameControlledImageSelectedScenePrivateOutputObservation
    readonly alphaWorkChainReconciliation:
      LivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliation
    readonly canonicalWorkGraphProjection:
      CanonicalLivingFrameWorkGraphProjection
    readonly readCurrentExactOpaqueOutput:
      LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceReader[
        'readCurrentExactOpaqueOutput'
      ]
  },
): LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceReader {
  if (
    !verifyLivingFrameControlledImageSelectedScenePrivateOutputObservation(
      input.privateOutputObservation,
    )
    || !isRecord(input.alphaWorkChainReconciliation)
    || !SHA256.test(
      String(
        input.alphaWorkChainReconciliation
          .reconciliationDigestSha256,
      ),
    )
    || !isCanonicalProjectionShape(
      input.canonicalWorkGraphProjection,
    )
    || typeof input.readCurrentExactOpaqueOutput !== 'function'
  ) {
    throw invalid('source_reader_invalid', '$.sourceReader')
  }
  const bindingDraft = compileReaderBindingDraft({
    observation: input.privateOutputObservation,
    reconciliation: input.alphaWorkChainReconciliation,
    projection: input.canonicalWorkGraphProjection,
  })
  const reader:
    LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceReader =
    Object.freeze({
      readerVersion:
        'living-frame-controlled-image-selected-scene-exact-output-alpha-source-reader-v1',
      readerClass:
        'process_bound_server_owned_exact_selected_scene_alpha_source_reader',
      evidenceClass:
        input.privateOutputObservation.outputReader.evidenceClass,
      binding: Object.freeze({
        ...bindingDraft,
        sourceReaderBindingDigestSha256:
          digest(bindingDraft),
      }),
      callerBytesPathUrlCredentialPromptSeedDimensionModelCommandOrEnvironmentAccepted:
        false,
      workGraphMutationAuthority: false,
      rembgAdmissionAuthority: false,
      dispatchAuthority: false,
      artifactPersistenceAuthority: false,
      actualCostAuthority: false,
      productionReady: false,
      readCurrentExactOpaqueOutput:
        input.readCurrentExactOpaqueOutput.bind(undefined),
    })
  sourceReaders.add(reader)
  return reader
}

export async function compileLivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoff(
  input:
    CreateLivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoffInput,
): Promise<LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoffResult> {
  const selection = assertCanonicalInputs(input)
  const reader = requireSourceReader(
    input.sourceReader,
    input.privateOutputObservation,
    input.alphaWorkChainReconciliation,
    input.canonicalWorkGraphProjection,
  )
  consumedSourceReaders.add(reader)
  let packetValue:
    LivingFrameControlledImageSelectedSceneExactOutputAlphaSourcePacket
  try {
    packetValue = await reader.readCurrentExactOpaqueOutput()
  } catch {
    throw invalid('source_reader_failed', '$.sourceReader')
  }
  const packet = assertSourcePacket(
    packetValue,
    input,
    selection,
    reader,
  )
  const outputPng = Buffer.from(packet.outputPng)
  const decodedRgba = Buffer.from(packet.decodedRgba)
  if (
    outputPng.byteLength !== packet.outputByteLength
    || digestBytes(outputPng) !== packet.outputContentSha256
  ) {
    throw invalid(
      'source_byte_digest_mismatch',
      '$.sourcePacket.outputPng',
    )
  }
  if (decodedRgba.byteLength !== EXPECTED_RGBA_BYTE_LENGTH) {
    throw invalid(
      'decoded_rgba_shape_invalid',
      '$.sourcePacket.decodedRgba',
    )
  }
  if (digestBytes(decodedRgba) !== packet.decodedRgbaSha256) {
    throw invalid(
      'decoded_rgba_digest_mismatch',
      '$.sourcePacket.decodedRgba',
    )
  }
  for (
    let offset = 3;
    offset < decodedRgba.byteLength;
    offset += 4
  ) {
    if (decodedRgba[offset] !== 255) {
      throw invalid(
        'opaque_alpha_policy_invalid',
        '$.sourcePacket.decodedRgba',
      )
    }
  }

  const observation = input.privateOutputObservation
  const reconciliation = input.alphaWorkChainReconciliation
  const selector =
    compileExactSourceSelector(selection, observation)
  const handoffId =
    `lf-selected-alpha-source.${digest({
      observation: observation.observationDigestSha256,
      reconciliation:
        reconciliation.reconciliationDigestSha256,
      workGraph:
        input.canonicalWorkGraphProjection
          .projectionDigestSha256,
      selector,
      output: packet.outputContentSha256,
    }).slice(0, 40)}`
  const draft:
    LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoffDraft =
    {
      contractVersion:
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_EXACT_OUTPUT_ALPHA_SOURCE_HANDOFF_VERSION,
      resultClass:
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_EXACT_OUTPUT_ALPHA_SOURCE_HANDOFF_CLASS,
      handoffState:
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_EXACT_OUTPUT_ALPHA_SOURCE_HANDOFF_STATE,
      handoffId,
      canonicalScope: observation.canonicalScope,
      exactSourceSelector: selector,
      sourceBindings: {
        selectedSceneRequestBindingDigestSha256:
          input.selectedSceneRequest.requestBindingDigestSha256,
        privateOutputObservationId:
          observation.observationId,
        privateOutputObservationDigestSha256:
          observation.observationDigestSha256,
        alphaWorkChainReconciliationId:
          reconciliation.reconciliationId,
        alphaWorkChainReconciliationDigestSha256:
          reconciliation.reconciliationDigestSha256,
        canonicalWorkGraphProjectionDigestSha256:
          input.canonicalWorkGraphProjection
            .projectionDigestSha256,
        approvedSnapshotId:
          observation.sourceBindings.approvedSnapshotId,
        approvedSnapshotHashSha256:
          observation.sourceBindings
            .approvedSnapshotHashSha256,
        selectedSceneBindingDigestSha256:
          observation.sourceBindings
            .selectedSceneBindingDigestSha256,
        currentMasterTimingDigestSha256:
          observation.sourceBindings
            .currentMasterTimingDigestSha256,
        controlledIllustrationCostWorkBindingDigestSha256:
          observation.sourceBindings
            .controlledIllustrationCostWorkBindingDigestSha256,
        confirmedOutputFrameExpectationDigestSha256:
          observation.sourceBindings
            .confirmedOutputFrameExpectationDigestSha256,
        outputContentSha256:
          packet.outputContentSha256,
        decodedRgbaSha256: packet.decodedRgbaSha256,
        sourceReaderBindingDigestSha256:
          reader.binding.sourceReaderBindingDigestSha256,
      },
      verifiedPrivateSource: {
        evidenceClass: reader.evidenceClass,
        contentType: 'image/png',
        byteLength: outputPng.byteLength,
        widthPixels: EXPECTED_WIDTH,
        heightPixels: EXPECTED_HEIGHT,
        decodedChannelCount: 4,
        decodedRgbaByteLength:
          EXPECTED_RGBA_BYTE_LENGTH,
        transparentPixelCount: 0,
        semiTransparentPixelCount: 0,
        opaquePixelCount: EXPECTED_PIXEL_COUNT,
        sourceIsFfmpegExtractedFrame: false,
        sourceIsCommittedArtifact: false,
        oneShotReaderConsumed: true,
        oneShotPrivateSourceLeaseIssued: true,
        verifiedBytesDeliveredOnlyOutOfBand: true,
      },
      canonicalOwnerHandoff: {
        canonicalOwnerMustSelectExactParentOutput: true,
        parentGenerationMayContainMultipleExactOutputs: true,
        duplicateOutputOrAssetIntentMatchAllowed: false,
        requiredRembgWorkItemType: 'generate_mask_asset',
        requiredRembgToolId: 'rembg',
        requiredRembgOperationId:
          CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_TOOL_OPERATION,
        requiredRembgMaskArtifactType:
          'living_frame_alpha_mask_png',
        requiredSharpWorkItemType: 'process_image_asset',
        requiredSharpToolId: 'sharp',
        requiredSharpOperationId:
          CANONICAL_LIVING_FRAME_SHARP_COMPONENT_TOOL_OPERATION,
        requiredSharpRgbaArtifactType:
          'living_frame_component_rgba_png',
        existingCanonicalWorkGraphRemainsSoleOwner: true,
        existingCanonicalAssetManifestRemainsSoleOwner: true,
        remotionRemainsFinalCanvasOwner: true,
      },
      knownCanonicalConflict: {
        parentGenerationHasMultipleExpectedOutputs: true,
        exactGenerationWorkItemMatched: true,
        exactGenerationOutputMatched: true,
        exactGeneratedAssetIntentMatched: true,
        currentCanonicalRembgWorkItemMissing: true,
        currentCanonicalSharpWorkItemMissing: true,
        canonicalOwnerReconciliationRequired: true,
      },
      fixedRuntimeLineage: {
        expectedCanonicalToolId: 'comfyui',
        expectedCanonicalOperationId:
          'tool.comfyui.generate_controlled_image.v1',
        processEntrypointKind:
          observation.fixedRuntimeLineage.processEntrypointKind,
        runtimeConfinementRequirementDigestSha256:
          observation.fixedRuntimeLineage
            .runtimeConfinementRequirementDigestSha256,
        deniedTopLevelImports: ['sam2'],
        exactModelArtifactCount: 5,
        exactModelArtifactByteLength: 11_700_367_157,
        allFiveModelRolesMountedReadOnlyForAttempt: true,
        oneRequestOneImageOneAttemptRequired: true,
      },
      costLineage: {
        comfyUiGpuAttemptMustNotBeChargedAgain: true,
        rembgAndSharpKeepExistingIndependentCostOwners: true,
        costAmountIncluded: false,
        customerPriceOrCreditIncluded: false,
        serviceFeeIncluded: false,
      },
      registryPolicy: {
        currentObservedCountIsProductCap: false,
        registryExpansionPermitted: true,
        postAdmissionCountDerivedFromReleasedDistinctIdentities:
          true,
        oneComfyUiIdentityForSharedGpuAttempt: true,
        fakeIdentityForModelWeightAdapterLibraryOrPreprocessorAllowed:
          false,
      },
      openGateCodes:
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_EXACT_OUTPUT_ALPHA_SOURCE_HANDOFF_OPEN_GATES,
      authorityBoundary: AUTHORITY_BOUNDARY,
      selectedSceneRequestRevalidated: true,
      privateOutputObservationRevalidated: true,
      alphaWorkChainReconciliationRevalidated: true,
      canonicalWorkGraphIntegrityRevalidated: true,
      exactPrivateSourceBytesReread: true,
      sourceLeaseCreated: true,
      canonicalWorkGraphMutated: false,
      rembgRequestCreated: false,
      rembgInferenceExecuted: false,
      sharpRequestCreated: false,
      maskArtifactCreated: false,
      transparentComponentCreated: false,
      assetManifestMutated: false,
      qaApproved: false,
      privateReviewApproved: false,
      renderAuthorized: false,
      finalCanvasCreatedByComfyUi: false,
      containsBytesPathUrlCredentialPromptSeedDimensionModelCommandOrEnvironment:
        false,
      containsPriceCreditServiceFeeReservationWalletOrLedgerData:
        false,
      productionReady: false,
    }
  assertSafeHandoff(draft)
  const receipt =
    deepFreeze<LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoff>({
      ...draft,
      handoffDigestSha256: digest(draft),
    })
  const lease =
    Object.freeze<LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceLease>({
      leaseClass:
        'process_bound_single_use_exact_selected_scene_isolated_alpha_source_lease_v1',
      leaseId:
        `lf-selected-alpha-source-lease.${digest({
          handoff: receipt.handoffDigestSha256,
          selector,
        }).slice(0, 40)}`,
      handoffDigestSha256:
        receipt.handoffDigestSha256,
      sceneId: receipt.canonicalScope.sceneId,
      componentId: selector.componentId,
      outputKey: selector.outputKey,
      outputCandidateId: selector.outputCandidateId,
      exactSourceSelectorDigestSha256:
        digest(selector),
      callerSerializable: false,
      workGraphMutationAuthority: false,
      rembgAdmissionAuthority: false,
      dispatchAuthority: false,
      artifactPersistenceAuthority: false,
      actualCostAuthority: false,
      productionReady: false,
    })
  const privateSource =
    Object.freeze<LivingFrameControlledImageSelectedSceneExactOutputAlphaSource>({
      sourceClass:
        'verified_exact_selected_scene_isolated_opaque_png_for_canonical_alpha_owner_v1',
      exactSourceSelector: receipt.exactSourceSelector,
      outputPng: Buffer.from(outputPng),
      decodedRgba: Buffer.from(decodedRgba),
      verification: Object.freeze({
        handoffDigestSha256:
          receipt.handoffDigestSha256,
        privateOutputObservationDigestSha256:
          observation.observationDigestSha256,
        alphaWorkChainReconciliationDigestSha256:
          reconciliation.reconciliationDigestSha256,
        canonicalWorkGraphProjectionDigestSha256:
          input.canonicalWorkGraphProjection
            .projectionDigestSha256,
        outputContentSha256:
          packet.outputContentSha256,
        decodedRgbaSha256: packet.decodedRgbaSha256,
        widthPixels: EXPECTED_WIDTH,
        heightPixels: EXPECTED_HEIGHT,
        opaqueGeneratedSourceOnly: true,
      }),
      dispatchAuthority: false,
      artifactPersistenceAuthority: false,
      productionReady: false,
    })
  sourceLeases.add(lease)
  privateSources.set(lease, privateSource)
  return Object.freeze({
    receipt,
    privateSourceLease: lease,
  })
}

export function consumeLivingFrameControlledImageSelectedSceneExactOutputAlphaSourceLease(
  lease:
    LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceLease,
): LivingFrameControlledImageSelectedSceneExactOutputAlphaSource {
  if (
    !lease
    || !sourceLeases.has(lease)
    || consumedSourceLeases.has(lease)
    || lease.leaseClass !==
      'process_bound_single_use_exact_selected_scene_isolated_alpha_source_lease_v1'
    || !SAFE_ID.test(lease.leaseId)
    || !SHA256.test(lease.handoffDigestSha256)
    || !SHA256.test(lease.exactSourceSelectorDigestSha256)
    || lease.callerSerializable !== false
    || lease.workGraphMutationAuthority !== false
    || lease.rembgAdmissionAuthority !== false
    || lease.dispatchAuthority !== false
    || lease.artifactPersistenceAuthority !== false
    || lease.actualCostAuthority !== false
    || lease.productionReady !== false
  ) {
    throw invalid(
      consumedSourceLeases.has(lease)
        ? 'lease_reused'
        : 'lease_invalid',
      '$.privateSourceLease',
    )
  }
  const source = privateSources.get(lease)
  if (
    !source
    || source.verification.handoffDigestSha256 !==
      lease.handoffDigestSha256
    || digest(source.exactSourceSelector) !==
      lease.exactSourceSelectorDigestSha256
    || source.exactSourceSelector.componentId !==
      lease.componentId
    || source.exactSourceSelector.outputKey !== lease.outputKey
    || source.exactSourceSelector.outputCandidateId !==
      lease.outputCandidateId
  ) {
    throw invalid('lease_invalid', '$.privateSourceLease')
  }
  consumedSourceLeases.add(lease)
  privateSources.delete(lease)
  return {
    ...source,
    outputPng: Buffer.from(source.outputPng),
    decodedRgba: Buffer.from(source.decodedRgba),
  }
}

export function verifyLivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoff(
  value: unknown,
  input:
    CreateLivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoffInput,
): value is LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoff {
  try {
    const selection = assertCanonicalInputs(input)
    if (
      !isRecord(value)
      || value.contractVersion !==
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_EXACT_OUTPUT_ALPHA_SOURCE_HANDOFF_VERSION
      || value.resultClass !==
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_EXACT_OUTPUT_ALPHA_SOURCE_HANDOFF_CLASS
      || value.handoffState !==
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_EXACT_OUTPUT_ALPHA_SOURCE_HANDOFF_STATE
      || typeof value.handoffDigestSha256 !== 'string'
      || !SHA256.test(value.handoffDigestSha256)
    ) return false
    const candidate =
      value as unknown as
        LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoff
    const {
      handoffDigestSha256,
      ...draft
    } = candidate
    if (digest(draft) !== handoffDigestSha256) return false
    assertSafeHandoff(
      draft as unknown as
        LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoffDraft,
    )
    const expectedSelector = compileExactSourceSelector(
      selection,
      input.privateOutputObservation,
    )
    return (
      canonicalJson(candidate.canonicalScope) ===
        canonicalJson(
          input.privateOutputObservation.canonicalScope,
        )
      && canonicalJson(candidate.exactSourceSelector) ===
        canonicalJson(expectedSelector)
      && candidate.sourceBindings
        .selectedSceneRequestBindingDigestSha256 ===
          input.selectedSceneRequest.requestBindingDigestSha256
      && candidate.sourceBindings
        .privateOutputObservationDigestSha256 ===
          input.privateOutputObservation.observationDigestSha256
      && candidate.sourceBindings
        .alphaWorkChainReconciliationDigestSha256 ===
          input.alphaWorkChainReconciliation
            .reconciliationDigestSha256
      && candidate.sourceBindings
        .canonicalWorkGraphProjectionDigestSha256 ===
          input.canonicalWorkGraphProjection
            .projectionDigestSha256
      && candidate.sourceBindings
        .sourceReaderBindingDigestSha256 ===
          input.sourceReader.binding
            .sourceReaderBindingDigestSha256
    )
  } catch {
    return false
  }
}

function assertCanonicalInputs(
  input:
    CreateLivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoffInput,
): ExactSelection {
  if (
    !input
    || !verifyLivingFrameControlledImageSelectedSceneRequest(
      input.selectedSceneRequest,
      input.selectedSceneRequestInput,
    )
  ) {
    throw invalid(
      'selected_scene_request_invalid',
      '$.selectedSceneRequest',
    )
  }
  if (
    !verifyLivingFrameControlledImageSelectedScenePrivateOutputObservation(
      input.privateOutputObservation,
    )
  ) {
    throw invalid(
      'output_observation_invalid',
      '$.privateOutputObservation',
    )
  }
  const reconciliationInput:
    CreateLivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliationInput =
    {
      selectedSceneRequest: input.selectedSceneRequest,
      selectedSceneRequestInput:
        input.selectedSceneRequestInput,
      privateOutputObservation:
        input.privateOutputObservation,
      canonicalWorkGraphProjection:
        input.canonicalWorkGraphProjection,
    }
  if (
    !verifyLivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliation(
      input.alphaWorkChainReconciliation,
      reconciliationInput,
    )
  ) {
    throw invalid(
      'alpha_work_chain_reconciliation_invalid',
      '$.alphaWorkChainReconciliation',
    )
  }
  if (!isCanonicalProjectionShape(
    input.canonicalWorkGraphProjection,
  )) {
    throw invalid(
      'work_graph_integrity_invalid',
      '$.canonicalWorkGraphProjection',
    )
  }
  const observation = input.privateOutputObservation
  const requestUnit =
    input.selectedSceneRequest.requestUnits.find(
      (unit) =>
        unit.requestUnitId ===
          observation.exactOutputLineage.requestUnitId
        && unit.componentId ===
          observation.exactOutputLineage.componentId
        && unit.outputKey ===
          observation.exactOutputLineage.outputKey
        && unit.approvedWorkItemId ===
          observation.exactOutputLineage.approvedWorkItemId
        && unit.approvedWorkItemKey ===
          observation.exactOutputLineage.approvedWorkItemKey
        && unit.approvedPlannedAssetManifestEntryId ===
          observation.exactOutputLineage
            .approvedPlannedAssetManifestEntryId,
    )
  if (!requestUnit) {
    throw invalid(
      'cross_scene_work_item_or_output_substitution',
      '$.privateOutputObservation.exactOutputLineage',
    )
  }
  if (
    requestUnit.generationCanvas.canvasClass !==
      'isolated_component_square_1024'
    || requestUnit.generationCanvas.widthPixels !== EXPECTED_WIDTH
    || requestUnit.generationCanvas.heightPixels !== EXPECTED_HEIGHT
    || !requestUnit.downstreamPolicy.stillAlphaPipelineRequired
    || observation.verifiedOutput.canvasClass !==
      'isolated_component_square_1024'
    || observation.verifiedOutput.widthPixels !== EXPECTED_WIDTH
    || observation.verifiedOutput.heightPixels !== EXPECTED_HEIGHT
    || !observation.verifiedOutput.stillAlphaPipelineRequired
    || observation.verifiedOutput.sourcePngHadAlphaChannel
    || observation.verifiedOutput.transparentPixelCount !== 0
    || observation.verifiedOutput.semiTransparentPixelCount !== 0
    || observation.verifiedOutput.opaquePixelCount !==
      EXPECTED_PIXEL_COUNT
  ) {
    throw invalid(
      'isolated_component_required',
      '$.privateOutputObservation.verifiedOutput',
    )
  }
  const reconciliation = input.alphaWorkChainReconciliation
  if (
    reconciliation.reconciliationState !==
      'blocked_by_missing_canonical_generated_alpha_work_chain'
    || canonicalJson(reconciliation.conflictCodes) !==
      canonicalJson(EXPECTED_CONFLICT_CODES)
    || !reconciliation.workGraphEvidence.generationWorkItemMatched
    || !reconciliation.workGraphEvidence.generationOutputMatched
    || !reconciliation.workGraphEvidence
      .exactGeneratedAssetIntentMatched
    || reconciliation.workGraphEvidence
      .exactRembgGeneratedSourceDependencyMatched
    || reconciliation.workGraphEvidence
      .sharpDependsOnExactGenerationAndMask
    || reconciliation.exactOutputLineage.rembgWorkItemKey !== null
    || reconciliation.exactOutputLineage.sharpWorkItemKey !== null
  ) {
    throw invalid(
      'known_canonical_conflict_not_present',
      '$.alphaWorkChainReconciliation',
    )
  }
  const generationCandidates =
    input.canonicalWorkGraphProjection.workItems
      .filter(isControlledGenerationWorkItem)
      .filter((item) =>
        item.workItemKey === requestUnit.approvedWorkItemKey)
  if (generationCandidates.length !== 1) {
    throw invalid(
      'exact_generation_output_selector_invalid',
      '$.canonicalWorkGraphProjection.workItems',
    )
  }
  const generation = generationCandidates[0]!
  if (
    generation.expectedOutputs.length <= 1
    || generation.expectedOutputs.length !==
      generation.executionInput.pendingOperationAuthority
        .generatedAssetIntentIds.length
    || generation.expectedOutputs.length !==
      generation.executionInput.expectedOutputKeys.length
    || new Set(
      generation.expectedOutputs.map((output) => output.outputKey),
    ).size !== generation.expectedOutputs.length
    || new Set(
      generation.executionInput.pendingOperationAuthority
        .generatedAssetIntentIds,
    ).size !== generation.expectedOutputs.length
  ) {
    throw invalid(
      'exact_generation_output_selector_invalid',
      '$.canonicalWorkGraphProjection.workItems',
    )
  }
  const matchingIndexes =
    generation.expectedOutputs.flatMap((output, index) =>
      output.outputKey === requestUnit.outputKey
      && output.artifactType ===
        CANONICAL_LIVING_FRAME_GENERATED_OPAQUE_STILL_OUTPUT_ROLE
      && output.contentType === 'image/png'
        ? [index]
        : [])
  if (matchingIndexes.length !== 1) {
    throw invalid(
      'exact_generation_output_selector_invalid',
      '$.canonicalWorkGraphProjection.workItems',
    )
  }
  const outputIndex = matchingIndexes[0]!
  const generatedAssetIntentId =
    generation.executionInput.pendingOperationAuthority
      .generatedAssetIntentIds[outputIndex]
  const expectedOutput = generation.expectedOutputs[outputIndex]
  if (
    !generatedAssetIntentId
    || generatedAssetIntentId !== requestUnit.assetIntentId
    || generatedAssetIntentId !==
      reconciliation.exactOutputLineage.generatedAssetIntentId
    || generation.executionInput
      .expectedOutputKeys[outputIndex] !== requestUnit.outputKey
    || expectedOutput?.artifactType !==
      CANONICAL_LIVING_FRAME_GENERATED_OPAQUE_STILL_OUTPUT_ROLE
    || expectedOutput.contentType !== 'image/png'
    || reconciliation.exactOutputLineage
      .generationWorkItemKey !== generation.workItemKey
    || reconciliation.workGraphEvidence
      .generationWorkItemExpectedOutputCount !==
        generation.expectedOutputs.length
  ) {
    throw invalid(
      'exact_generation_output_selector_invalid',
      '$.canonicalWorkGraphProjection.workItems',
    )
  }
  return {
    requestUnit,
    generation,
    outputIndex,
    generatedAssetIntentId,
  }
}

function compileExactSourceSelector(
  selection: ExactSelection,
  observation:
    LivingFrameControlledImageSelectedScenePrivateOutputObservation,
): LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoff[
  'exactSourceSelector'
] {
  return {
    sourceVariant: 'living_frame_generated_opaque_still',
    componentId: selection.requestUnit.componentId,
    outputKey: selection.requestUnit.outputKey,
    approvedWorkItemId:
      selection.requestUnit.approvedWorkItemId,
    parentGenerationWorkItemKey:
      selection.generation.workItemKey,
    parentExpectedOutputIndex: selection.outputIndex,
    parentExpectedOutputCount:
      selection.generation.expectedOutputs.length,
    generatedAssetIntentId:
      selection.generatedAssetIntentId,
    expectedArtifactType:
      CANONICAL_LIVING_FRAME_GENERATED_OPAQUE_STILL_OUTPUT_ROLE,
    expectedContentType: 'image/png',
    approvedPlannedAssetManifestEntryId:
      selection.requestUnit
        .approvedPlannedAssetManifestEntryId,
    rendererLayerId:
      selection.requestUnit.rendererLayerId,
    outputCandidateId:
      observation.verifiedOutput.outputCandidateId,
  }
}

function compileReaderBindingDraft(input: {
  readonly observation:
    LivingFrameControlledImageSelectedScenePrivateOutputObservation
  readonly reconciliation:
    LivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliation
  readonly projection: CanonicalLivingFrameWorkGraphProjection
}) {
  return {
    privateOutputObservationId:
      input.observation.observationId,
    privateOutputObservationDigestSha256:
      input.observation.observationDigestSha256,
    alphaWorkChainReconciliationId:
      input.reconciliation.reconciliationId,
    alphaWorkChainReconciliationDigestSha256:
      input.reconciliation.reconciliationDigestSha256,
    canonicalWorkGraphProjectionDigestSha256:
      input.projection.projectionDigestSha256,
    sceneId: input.observation.canonicalScope.sceneId,
    componentId:
      input.observation.exactOutputLineage.componentId,
    outputKey:
      input.observation.exactOutputLineage.outputKey,
    approvedWorkItemId:
      input.observation.exactOutputLineage.approvedWorkItemId,
    approvedPlannedAssetManifestEntryId:
      input.observation.exactOutputLineage
        .approvedPlannedAssetManifestEntryId,
    outputCandidateId:
      input.observation.verifiedOutput.outputCandidateId,
    outputContentSha256:
      input.observation.verifiedOutput.contentSha256,
    decodedRgbaSha256:
      input.observation.verifiedOutput.decodedRgbaSha256,
  }
}

function requireSourceReader(
  reader:
    LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceReader,
  observation:
    LivingFrameControlledImageSelectedScenePrivateOutputObservation,
  reconciliation:
    LivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliation,
  projection: CanonicalLivingFrameWorkGraphProjection,
): LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceReader {
  if (
    reader
    && sourceReaders.has(reader)
    && consumedSourceReaders.has(reader)
  ) {
    throw invalid('source_reader_reused', '$.sourceReader')
  }
  if (
    !reader
    || !sourceReaders.has(reader)
    || consumedSourceReaders.has(reader)
    || reader.readerVersion !==
      'living-frame-controlled-image-selected-scene-exact-output-alpha-source-reader-v1'
    || reader.readerClass !==
      'process_bound_server_owned_exact_selected_scene_alpha_source_reader'
    || !(
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OUTPUT_EVIDENCE_CLASSES as
        readonly string[]
    ).includes(reader.evidenceClass)
    || reader.evidenceClass !==
      observation.outputReader.evidenceClass
    || reader
      .callerBytesPathUrlCredentialPromptSeedDimensionModelCommandOrEnvironmentAccepted
      !== false
    || reader.workGraphMutationAuthority !== false
    || reader.rembgAdmissionAuthority !== false
    || reader.dispatchAuthority !== false
    || reader.artifactPersistenceAuthority !== false
    || reader.actualCostAuthority !== false
    || reader.productionReady !== false
  ) {
    throw invalid('source_reader_invalid', '$.sourceReader')
  }
  const expected = compileReaderBindingDraft({
    observation,
    reconciliation,
    projection,
  })
  if (
    canonicalJson({
      ...reader.binding,
      sourceReaderBindingDigestSha256: undefined,
    }) !== canonicalJson({
      ...expected,
      sourceReaderBindingDigestSha256: undefined,
    })
    || reader.binding.sourceReaderBindingDigestSha256 !==
      digest(expected)
  ) {
    throw invalid(
      'source_reader_lineage_invalid',
      '$.sourceReader.binding',
    )
  }
  return reader
}

function assertSourcePacket(
  value: unknown,
  input:
    CreateLivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoffInput,
  selection: ExactSelection,
  reader:
    LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceReader,
): LivingFrameControlledImageSelectedSceneExactOutputAlphaSourcePacket {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'packetClass',
      'evidenceClass',
      'privateOutputObservationId',
      'privateOutputObservationDigestSha256',
      'alphaWorkChainReconciliationId',
      'alphaWorkChainReconciliationDigestSha256',
      'sceneId',
      'componentId',
      'outputKey',
      'approvedWorkItemId',
      'parentGenerationWorkItemKey',
      'parentExpectedOutputIndex',
      'generatedAssetIntentId',
      'approvedPlannedAssetManifestEntryId',
      'outputCandidateId',
      'outputContentType',
      'outputByteLength',
      'outputContentSha256',
      'decodedRgbaSha256',
      'outputPng',
      'decodedRgba',
      'callerBytesPathUrlCredentialPromptSeedDimensionModelCommandOrEnvironmentAccepted',
      'workGraphMutationAuthority',
      'rembgAdmissionAuthority',
      'dispatchAuthority',
      'artifactPersistenceAuthority',
      'actualCostAuthority',
      'productionReady',
    ])
    || value.packetClass !==
      'server_owned_exact_selected_scene_isolated_opaque_alpha_source_packet_v1'
    || value.evidenceClass !== reader.evidenceClass
    || value.outputContentType !== 'image/png'
    || typeof value.outputByteLength !== 'number'
    || !Number.isSafeInteger(value.outputByteLength)
    || value.outputByteLength < 1
    || value.outputByteLength > MAX_OUTPUT_BYTE_LENGTH
    || typeof value.outputContentSha256 !== 'string'
    || !SHA256.test(value.outputContentSha256)
    || typeof value.decodedRgbaSha256 !== 'string'
    || !SHA256.test(value.decodedRgbaSha256)
    || !Buffer.isBuffer(value.outputPng)
    || value.outputPng.buffer instanceof SharedArrayBuffer
    || !Buffer.isBuffer(value.decodedRgba)
    || value.decodedRgba.buffer instanceof SharedArrayBuffer
    || value
      .callerBytesPathUrlCredentialPromptSeedDimensionModelCommandOrEnvironmentAccepted
      !== false
    || value.workGraphMutationAuthority !== false
    || value.rembgAdmissionAuthority !== false
    || value.dispatchAuthority !== false
    || value.artifactPersistenceAuthority !== false
    || value.actualCostAuthority !== false
    || value.productionReady !== false
  ) {
    throw invalid('source_packet_invalid', '$.sourcePacket')
  }
  const observation = input.privateOutputObservation
  const reconciliation = input.alphaWorkChainReconciliation
  if (
    value.privateOutputObservationId !==
      observation.observationId
    || value.privateOutputObservationDigestSha256 !==
      observation.observationDigestSha256
    || value.alphaWorkChainReconciliationId !==
      reconciliation.reconciliationId
    || value.alphaWorkChainReconciliationDigestSha256 !==
      reconciliation.reconciliationDigestSha256
    || value.sceneId !== observation.canonicalScope.sceneId
    || value.componentId !== selection.requestUnit.componentId
    || value.outputKey !== selection.requestUnit.outputKey
    || value.approvedWorkItemId !==
      selection.requestUnit.approvedWorkItemId
    || value.parentGenerationWorkItemKey !==
      selection.generation.workItemKey
    || value.parentExpectedOutputIndex !== selection.outputIndex
    || value.generatedAssetIntentId !==
      selection.generatedAssetIntentId
    || value.approvedPlannedAssetManifestEntryId !==
      selection.requestUnit
        .approvedPlannedAssetManifestEntryId
    || value.outputCandidateId !==
      observation.verifiedOutput.outputCandidateId
    || value.outputByteLength !==
      observation.verifiedOutput.byteLength
    || value.outputContentSha256 !==
      observation.verifiedOutput.contentSha256
    || value.decodedRgbaSha256 !==
      observation.verifiedOutput.decodedRgbaSha256
  ) {
    throw invalid(
      'source_packet_lineage_invalid',
      '$.sourcePacket',
    )
  }
  return value as unknown as
    LivingFrameControlledImageSelectedSceneExactOutputAlphaSourcePacket
}

function assertSafeHandoff(
  draft:
    LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoffDraft,
): void {
  if (
    !SAFE_ID.test(draft.handoffId)
    || canonicalJson(draft.openGateCodes) !==
      canonicalJson(
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_EXACT_OUTPUT_ALPHA_SOURCE_HANDOFF_OPEN_GATES,
      )
    || canonicalJson(draft.authorityBoundary) !==
      canonicalJson(AUTHORITY_BOUNDARY)
    || draft.exactSourceSelector.parentExpectedOutputCount <= 1
    || draft.exactSourceSelector.parentExpectedOutputIndex < 0
    || draft.exactSourceSelector.parentExpectedOutputIndex >=
      draft.exactSourceSelector.parentExpectedOutputCount
    || draft.verifiedPrivateSource.widthPixels !==
      EXPECTED_WIDTH
    || draft.verifiedPrivateSource.heightPixels !==
      EXPECTED_HEIGHT
    || draft.verifiedPrivateSource.decodedRgbaByteLength !==
      EXPECTED_RGBA_BYTE_LENGTH
    || draft.verifiedPrivateSource.opaquePixelCount !==
      EXPECTED_PIXEL_COUNT
    || draft.canonicalWorkGraphMutated
    || draft.rembgRequestCreated
    || draft.rembgInferenceExecuted
    || draft.sharpRequestCreated
    || draft.maskArtifactCreated
    || draft.transparentComponentCreated
    || draft.assetManifestMutated
    || draft.qaApproved
    || draft.privateReviewApproved
    || draft.renderAuthorized
    || draft.finalCanvasCreatedByComfyUi
    || draft.productionReady
    || containsUnsafeKeyOrValue(draft)
  ) {
    throw invalid('unsafe_handoff_forbidden', '$')
  }
}

function isCanonicalProjectionShape(
  projection: unknown,
): projection is CanonicalLivingFrameWorkGraphProjection {
  if (
    !isRecord(projection)
    || projection.schemaVersion !==
      CANONICAL_LIVING_FRAME_WORK_GRAPH_PROJECTION_VERSION
    || projection.source !==
      CANONICAL_LIVING_FRAME_WORK_GRAPH_PROJECTION_SOURCE
    || typeof projection.projectionDigestSha256 !== 'string'
    || !SHA256.test(projection.projectionDigestSha256)
    || projection.projectionDigestSha256 !==
      digest(withoutProjectionDigest(
        projection as unknown as
          CanonicalLivingFrameWorkGraphProjection,
      ))
    || projection.containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials
      !== false
    || projection.containsProviderPrompt !== false
    || projection.containsControlledIllustrationExecutablePayload
      !== false
    || projection.createsApprovedWorkItems !== false
    || projection.createsAssetManifestEntries !== false
    || projection.currentResourcePlacementExecutionReady !== false
    || projection.productionReady !== false
  ) return false
  return true
}

function isControlledGenerationWorkItem(
  item: CanonicalLivingFrameProjectedCanonicalWorkItem,
): item is CanonicalLivingFrameControlledIllustrationGenerationWorkItem {
  return (
    item.workItemType === 'generate_image_asset'
    && item.workerClass ===
      CANONICAL_LIVING_FRAME_PENDING_OPERATION_WORKER_CLASS
    && item.executionInput.operation ===
      CANONICAL_LIVING_FRAME_PENDING_OPERATION
  )
}

function containsUnsafeKeyOrValue(value: unknown): boolean {
  const deniedKeys = new Set([
    'bytes',
    'path',
    'url',
    'credential',
    'secret',
    'prompt',
    'seed',
    'modelAlias',
    'command',
    'environment',
    'actualCostMicros',
    'price',
    'credits',
    'serviceFeeAmount',
    'reservation',
    'wallet',
    'ledger',
  ])
  let unsafe = false
  walk(value, (key, child) => {
    if (deniedKeys.has(key)) unsafe = true
    if (
      typeof child === 'string'
      && (URL_LIKE.test(child) || SECRET_LIKE.test(child))
    ) unsafe = true
  })
  return unsafe
}

function walk(
  value: unknown,
  visit: (key: string, child: unknown) => void,
): void {
  if (Array.isArray(value)) {
    value.forEach((child) => walk(child, visit))
    return
  }
  if (!isRecord(value)) return
  for (const [key, child] of Object.entries(value)) {
    visit(key, child)
    walk(child, visit)
  }
}

function withoutProjectionDigest(
  projection: CanonicalLivingFrameWorkGraphProjection,
): Record<string, unknown> {
  const clone =
    structuredClone(projection) as unknown as Record<string, unknown>
  delete clone.projectionDigestSha256
  return clone
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, child]) => child !== undefined)
        .sort(([left], [right]) =>
          left.localeCompare(right))
        .map(([key, child]) => [
          key,
          canonicalize(child),
        ]),
    )
  }
  return value
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(canonicalJson(value), 'utf8')
    .digest('hex')
}

function digestBytes(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  const required = [...expected].sort()
  return (
    actual.length === required.length
    && actual.every((key, index) => key === required[index])
  )
}

function deepFreeze<T>(value: T): T {
  if (
    value !== null
    && typeof value === 'object'
    && !Object.isFrozen(value)
  ) {
    Object.freeze(value)
    for (const child of Object.values(
      value as Record<string, unknown>,
    )) deepFreeze(child)
  }
  return value
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
  )
}

function invalid(
  code:
    LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoffIssueCode,
  path: string,
): LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoffError {
  if (
    !(
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_EXACT_OUTPUT_ALPHA_SOURCE_HANDOFF_ISSUE_CODES as
        readonly string[]
    ).includes(code)
  ) throw new TypeError('unknown issue code')
  return new LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoffError([
    { code, path },
  ])
}
