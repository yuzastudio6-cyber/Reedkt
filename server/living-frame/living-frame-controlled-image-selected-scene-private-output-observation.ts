import { createHash } from "node:crypto";

import { z } from "zod";

import {
  LIVING_FRAME_ALPHA_FINDING_CODES,
  type LivingFrameAlphaMeasurementReport,
} from "../../src/types/living-frame-alpha-measurement";
import type {
  LivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt,
} from "../../src/types/living-frame-controlled-image-selected-scene-private-operation-request";
import {
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OUTPUT_EVIDENCE_CLASSES,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OUTPUT_ISSUE_CODES,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OUTPUT_OBSERVATION_CLASS,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OUTPUT_OBSERVATION_STATE,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OUTPUT_OBSERVATION_VERSION,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OUTPUT_OPEN_GATES,
  type LivingFrameControlledImageSelectedScenePrivateOutputAuthority,
  type LivingFrameControlledImageSelectedScenePrivateOutputEvidenceClass,
  type LivingFrameControlledImageSelectedScenePrivateOutputIssue,
  type LivingFrameControlledImageSelectedScenePrivateOutputIssueCode,
  type LivingFrameControlledImageSelectedScenePrivateOutputObservation,
  type LivingFrameControlledImageSelectedScenePrivateOutputObservationDraft,
} from "../../src/types/living-frame-controlled-image-selected-scene-private-output-observation";
import {
  measureLivingFrameAlphaArtifact,
  verifyLivingFrameAlphaMeasurementReportDigest,
} from "./living-frame-alpha-measurement";
import {
  verifyLivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt,
} from "./living-frame-controlled-image-selected-scene-private-operation-request";
import {
  LivingFramePrivateOpaqueRgbPngVerificationError,
  verifyLivingFramePrivateOpaqueRgbPng,
} from "./living-frame-private-opaque-rgb-png-verifier";

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u;
const SHA256 = /^[a-f0-9]{64}$/u;
const MAXIMUM_OUTPUT_BYTES = 64 * 1_024 * 1_024;
const MAXIMUM_DIMENSION = 4_096;
const MAXIMUM_PIXEL_COUNT = 8_294_400;
const URL_LIKE = /(?:https?:\/\/|file:\/\/|data:|javascript:)/iu;
const SECRET_LIKE =
  /(?:-----BEGIN [A-Z ]+PRIVATE KEY-----|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9_-]{16,})/u;

const AUTHORITY_BOUNDARY: LivingFrameControlledImageSelectedScenePrivateOutputAuthority =
  deepFreeze({
    privateOutputRereadAndObservationAuthority: true,
    selectedSceneAuthority: false,
    visualContinuityPackAuthority: false,
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
    approvedWorkItemMutationAuthority: false,
    workGraphMutationAuthority: false,
    artifactPersistenceAuthority: false,
    assetManifestAuthority: false,
    segmentationOrMattingAuthority: false,
    alphaQaAuthority: false,
    continuityQaAuthority: false,
    documentaryFactAuthority: false,
    privateReviewAuthority: false,
    renderAuthority: false,
    finalCanvasAuthority: false,
    productionAuthority: false,
  });

export interface LivingFrameControlledImageSelectedScenePrivateOutputPacket {
  readonly packetClass:
    "server_owned_selected_scene_comfyui_opaque_png_output_packet_v1";
  readonly evidenceClass:
    LivingFrameControlledImageSelectedScenePrivateOutputEvidenceClass;
  readonly operationRequestReceiptId: string;
  readonly operationRequestReceiptDigestSha256: string;
  readonly privateOperationRequestDigestSha256: string;
  readonly materializationUnitId: string;
  readonly requestUnitId: string;
  readonly sceneId: string;
  readonly componentId: string;
  readonly outputKey: string;
  readonly approvedWorkItemId: string;
  readonly approvedWorkItemKey: string;
  readonly approvedPlannedAssetManifestEntryId: string;
  readonly confirmedOutputFrameExpectationDigestSha256: string;
  readonly widthPixels: number;
  readonly heightPixels: number;
  readonly outputCandidateId: string;
  readonly outputContentType: "image/png";
  readonly outputByteLength: number;
  readonly outputContentSha256: string;
  readonly outputPng: Buffer;
  readonly callerBytesPathUrlCredentialPromptSeedDimensionModelCommandOrEnvironmentAccepted:
    false;
  readonly workerCompletionAuthority: false;
  readonly gpuAttemptAuthority: false;
  readonly actualCostAuthority: false;
  readonly artifactPersistenceAuthority: false;
  readonly qaApprovalAuthority: false;
  readonly finalCanvasAuthority: false;
  readonly productionReady: false;
}

export interface LivingFrameControlledImageSelectedScenePrivateOutputReader {
  readonly readerVersion:
    "living-frame-controlled-image-selected-scene-private-output-reader-v1";
  readonly readerClass:
    "process_bound_server_owned_selected_scene_comfyui_output_reader";
  readonly evidenceClass:
    LivingFrameControlledImageSelectedScenePrivateOutputEvidenceClass;
  readonly binding: {
    readonly operationRequestReceiptId: string;
    readonly operationRequestReceiptDigestSha256: string;
    readonly privateOperationRequestDigestSha256: string;
    readonly materializationUnitId: string;
    readonly requestUnitId: string;
    readonly sceneId: string;
    readonly componentId: string;
    readonly outputKey: string;
    readonly approvedWorkItemId: string;
    readonly approvedPlannedAssetManifestEntryId: string;
    readonly confirmedOutputFrameExpectationDigestSha256: string;
    readonly widthPixels: number;
    readonly heightPixels: number;
    readonly readerBindingDigestSha256: string;
  };
  readonly callerBytesPathUrlCredentialPromptSeedDimensionModelCommandOrEnvironmentAccepted:
    false;
  readonly workerCompletionAuthority: false;
  readonly gpuAttemptAuthority: false;
  readonly actualCostAuthority: false;
  readonly artifactPersistenceAuthority: false;
  readonly productionReady: false;
  readServerOwnedOutput(): Promise<LivingFrameControlledImageSelectedScenePrivateOutputPacket>;
}

export interface LivingFrameControlledImageSelectedSceneVerifiedOpaqueOutput {
  readonly outputPng: Buffer;
  readonly decodedRgba: Buffer;
  readonly verification: {
    readonly operationRequestReceiptDigestSha256: string;
    readonly privateOperationRequestDigestSha256: string;
    readonly sceneId: string;
    readonly componentId: string;
    readonly outputKey: string;
    readonly approvedWorkItemId: string;
    readonly approvedPlannedAssetManifestEntryId: string;
    readonly outputCandidateId: string;
    readonly outputContentSha256: string;
    readonly decodedRgbaSha256: string;
    readonly widthPixels: number;
    readonly heightPixels: number;
    readonly alphaMeasurementReportDigestSha256: string;
    readonly stillAlphaPipelineRequired: boolean;
    readonly opaqueGeneratedSourceOnly: true;
  };
}

export interface LivingFrameControlledImageSelectedSceneVerifiedOutputConsumer {
  readonly consumerVersion:
    "living-frame-controlled-image-selected-scene-verified-output-consumer-v1";
  readonly consumerClass:
    "process_bound_server_owned_selected_scene_verified_output_consumer";
  readonly acceptsOnlyVerifiedOpaqueOutput: true;
  readonly browserShareable: false;
  readonly artifactPersistenceAuthority: false;
  readonly segmentationOrMattingAuthority: false;
  readonly qaApprovalAuthority: false;
  readonly productionReady: false;
  consume(
    payload: LivingFrameControlledImageSelectedSceneVerifiedOpaqueOutput,
  ): Promise<void>;
}

const authoritySchema = z
  .object({
    privateOutputRereadAndObservationAuthority: z.literal(true),
    ...Object.fromEntries(
      Object.keys(AUTHORITY_BOUNDARY)
        .filter(
          (key) =>
            key !== "privateOutputRereadAndObservationAuthority",
        )
        .map((key) => [key, z.literal(false)]),
    ),
  })
  .strict();

const observationDraftSchema = z
  .object({
    contractVersion: z.literal(
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OUTPUT_OBSERVATION_VERSION,
    ),
    resultClass: z.literal(
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OUTPUT_OBSERVATION_CLASS,
    ),
    observationState: z.literal(
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OUTPUT_OBSERVATION_STATE,
    ),
    observationId: z.string().regex(SAFE_ID),
    canonicalScope: z
      .object({
        workspaceId: z.string().regex(SAFE_ID),
        projectId: z.string().regex(SAFE_ID),
        editSessionId: z.string().regex(SAFE_ID),
        sceneId: z.string().regex(SAFE_ID),
      })
      .strict(),
    exactOutputLineage: z
      .object({
        materializationUnitId: z.string().regex(SAFE_ID),
        requestUnitId: z.string().regex(SAFE_ID),
        requestUnitDigestSha256: z.string().regex(SHA256),
        componentId: z.string().regex(SAFE_ID),
        outputKey: z.string().regex(SAFE_ID),
        approvedWorkItemId: z.string().regex(SAFE_ID),
        approvedWorkItemKey: z.string().regex(SAFE_ID),
        approvedPlannedAssetManifestEntryId:
          z.string().regex(SAFE_ID),
        rendererLayerId: z.string().regex(SAFE_ID),
      })
      .strict(),
    sourceBindings: z
      .object({
        operationRequestReceiptId: z.string().regex(SAFE_ID),
        operationRequestReceiptDigestSha256: z.string().regex(SHA256),
        privateOperationRequestDigestSha256: z.string().regex(SHA256),
        selectedSceneRequestBindingDigestSha256:
          z.string().regex(SHA256),
        fullFrameRatioExtensionDigestSha256:
          z.string().regex(SHA256),
        admissionCandidateDigestSha256: z.string().regex(SHA256),
        promptMaterializationDigestSha256: z.string().regex(SHA256),
        promptMaterializationUnitDigestSha256:
          z.string().regex(SHA256),
        approvedSnapshotId: z.string().regex(SAFE_ID),
        approvedSnapshotHashSha256: z.string().regex(SHA256),
        selectedSceneBindingDigestSha256: z.string().regex(SHA256),
        visualContinuityPackDigestSha256:
          z.string().regex(SHA256).nullable(),
        currentMasterTimingDigestSha256: z.string().regex(SHA256),
        canonicalWorkGraphProjectionDigestSha256:
          z.string().regex(SHA256),
        plannedAssetAndApprovedOutputLineageDigestSha256:
          z.string().regex(SHA256),
        controlledIllustrationCostWorkBindingDigestSha256:
          z.string().regex(SHA256),
        confirmedOutputFrameExpectationDigestSha256:
          z.string().regex(SHA256),
        artifactSetDigestSha256: z.string().regex(SHA256),
        artifactPacketDigestSha256: z.string().regex(SHA256),
        readerBindingDigestSha256: z.string().regex(SHA256),
      })
      .strict(),
    outputReader: z
      .object({
        evidenceClass: z.enum(
          LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OUTPUT_EVIDENCE_CLASSES,
        ),
        oneShotReaderConsumed: z.literal(true),
        oneShotConsumerConsumed: z.literal(true),
        verifiedBytesDeliveredOutOfBand: z.literal(true),
      })
      .strict(),
    verifiedOutput: z
      .object({
        outputCandidateId: z.string().regex(SAFE_ID),
        contentType: z.literal("image/png"),
        byteLength: z.number().int().positive().max(MAXIMUM_OUTPUT_BYTES),
        contentSha256: z.string().regex(SHA256),
        decodedRgbaSha256: z.string().regex(SHA256),
        widthPixels: z.number().int().min(64).max(MAXIMUM_DIMENSION),
        heightPixels: z.number().int().min(64).max(MAXIMUM_DIMENSION),
        decodedChannelCount: z.literal(4),
        sourcePngHadAlphaChannel: z.literal(false),
        transparentPixelCount: z.literal(0),
        semiTransparentPixelCount: z.literal(0),
        opaquePixelCount: z
          .number()
          .int()
          .positive()
          .max(MAXIMUM_PIXEL_COUNT),
        alphaMeasurementReportDigestSha256:
          z.string().regex(SHA256),
        alphaFindingCodes: z
          .array(z.enum(LIVING_FRAME_ALPHA_FINDING_CODES))
          .min(1)
          .max(LIVING_FRAME_ALPHA_FINDING_CODES.length),
        canvasClass: z.enum([
          "isolated_component_square_1024",
          "confirmed_full_frame_ratio",
        ]),
        stillAlphaPipelineRequired: z.boolean(),
        sourceDisposition: z.enum([
          "opaque_component_source_requires_segmentation_matting_decontamination_and_alpha_qa",
          "opaque_full_frame_plate_requires_destination_continuity_and_documentary_fact_qa",
        ]),
      })
      .strict(),
    fixedRuntimeLineage: z
      .object({
        expectedCanonicalToolId: z.literal("comfyui"),
        expectedCanonicalOperationId: z.literal(
          "tool.comfyui.generate_controlled_image.v1",
        ),
        processEntrypointKind: z.literal(
          "fixed_supervised_python_process",
        ),
        runtimeConfinementRequirementDigestSha256:
          z.string().regex(SHA256),
        deniedTopLevelImports: z.tuple([z.literal("sam2")]),
        nonRootRequired: z.literal(true),
        readOnlyRootFilesystemRequired: z.literal(true),
        allLinuxCapabilitiesDroppedRequired: z.literal(true),
        noNewPrivilegesRequired: z.literal(true),
        externalNetworkAllowed: z.literal(false),
        runtimeDownloadsAllowed: z.literal(false),
        exactModelArtifactCount: z.literal(5),
        exactModelArtifactByteLength: z.literal(11_700_367_157),
        allFiveModelRolesMountedReadOnlyForAttempt: z.literal(true),
        allFiveModelRolesVerifiedBeforeAndAfterInference: z.literal(true),
        oneProcessPerAttemptRequired: z.literal(true),
      })
      .strict(),
    costLineage: z
      .object({
        costComponentId: z.literal(
          "shared_controlled_illustration_gpu_host",
        ),
        oneObservedOutputBelongsToOneFutureGpuAttempt: z.literal(true),
        fiveGpuCapabilitiesShareAttemptLifetime: z.literal(true),
        fiveGpuCapabilitiesCreateOneAttemptCostEvent: z.literal(true),
        auraFaceCpuMeasurementExcluded: z.literal(true),
        completedFailedOrUnknownOutcomeNotInferred: z.literal(true),
        canonicalWorkerResourceCostEvidenceRequired: z.literal(true),
        actualCostAmountIncluded: z.literal(false),
        customerPriceOrCreditIncluded: z.literal(false),
        serviceFeeIncluded: z.literal(false),
      })
      .strict(),
    registryPolicy: z
      .object({
        currentObservedCountIsProductCap: z.literal(false),
        registryExpansionPermitted: z.literal(true),
        postAdmissionCountDerivedFromReleasedDistinctIdentities:
          z.literal(true),
        oneComfyUiIdentityForSharedGpuAttempt: z.literal(true),
        fakeIdentityForModelWeightAdapterLibraryOrPreprocessorAllowed:
          z.literal(false),
      })
      .strict(),
    openGateCodes: z
      .array(
        z.enum(
          LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OUTPUT_OPEN_GATES,
        ),
      )
      .length(
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OUTPUT_OPEN_GATES.length,
      ),
    authorityBoundary: authoritySchema,
    operationRequestReceiptRevalidated: z.literal(true),
    exactSceneWorkItemOutputAndFrameLineageMatched: z.literal(true),
    exactPrivateOutputBytesRereadAndDecoded: z.literal(true),
    alphaMeasurementRecomputedFromDecodedBytes: z.literal(true),
    outputIsOpaqueGeneratedSourceOnly: z.literal(true),
    benchmarkRequestOrOutputSubstitutionAllowed: z.literal(false),
    workerCompletionInferred: z.literal(false),
    gpuAttemptCreated: z.literal(false),
    actualAttemptCostEvidenceVerified: z.literal(false),
    artifactPersisted: z.literal(false),
    assetManifestMutated: z.literal(false),
    qaApproved: z.literal(false),
    privateReviewApproved: z.literal(false),
    renderAuthorized: z.literal(false),
    finalCanvasCreatedByComfyUi: z.literal(false),
    containsOutputBytesPathUrlCredentialPromptAliasModelCommandOrEnvironment:
      z.literal(false),
    containsPriceCreditServiceFeeReservationWalletOrLedgerData:
      z.literal(false),
    productionReady: z.literal(false),
  })
  .strict();

const observationSchema = observationDraftSchema
  .extend({
    observationDigestSha256: z.string().regex(SHA256),
  })
  .strict();

const outputReaders = new WeakSet<object>();
const consumedOutputReaders = new WeakSet<object>();
const outputConsumers = new WeakSet<object>();
const consumedOutputConsumers = new WeakSet<object>();

export class LivingFrameControlledImageSelectedScenePrivateOutputObservationError extends Error {
  readonly issues:
    readonly LivingFrameControlledImageSelectedScenePrivateOutputIssue[];

  constructor(
    issues: readonly LivingFrameControlledImageSelectedScenePrivateOutputIssue[],
  ) {
    super(
      "Living Frame selected-scene private output observation failed.",
    );
    this.name =
      "LivingFrameControlledImageSelectedScenePrivateOutputObservationError";
    this.issues = issues;
  }
}

export function createLivingFrameControlledImageSelectedScenePrivateOutputReader(
  input: {
    readonly operationRequestReceipt:
      LivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt;
    readonly evidenceClass:
      LivingFrameControlledImageSelectedScenePrivateOutputEvidenceClass;
    readonly readServerOwnedOutput:
      LivingFrameControlledImageSelectedScenePrivateOutputReader["readServerOwnedOutput"];
  },
): LivingFrameControlledImageSelectedScenePrivateOutputReader {
  if (
    !verifyLivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt(
      input.operationRequestReceipt,
    ) ||
    !(
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OUTPUT_EVIDENCE_CLASSES as
        readonly string[]
    ).includes(input.evidenceClass) ||
    typeof input.readServerOwnedOutput !== "function"
  ) {
    throw invalid("reader_invalid", "$.outputReader");
  }
  const receipt = input.operationRequestReceipt;
  const bindingDraft = compileReaderBindingDraft(receipt);
  const reader =
    Object.freeze<LivingFrameControlledImageSelectedScenePrivateOutputReader>({
      readerVersion:
        "living-frame-controlled-image-selected-scene-private-output-reader-v1",
      readerClass:
        "process_bound_server_owned_selected_scene_comfyui_output_reader",
      evidenceClass: input.evidenceClass,
      binding: Object.freeze({
        ...bindingDraft,
        readerBindingDigestSha256: digest(bindingDraft),
      }),
      callerBytesPathUrlCredentialPromptSeedDimensionModelCommandOrEnvironmentAccepted:
        false,
      workerCompletionAuthority: false,
      gpuAttemptAuthority: false,
      actualCostAuthority: false,
      artifactPersistenceAuthority: false,
      productionReady: false,
      readServerOwnedOutput:
        input.readServerOwnedOutput.bind(undefined),
    });
  outputReaders.add(reader);
  return reader;
}

export function createLivingFrameControlledImageSelectedSceneVerifiedOutputConsumer(
  consume:
    LivingFrameControlledImageSelectedSceneVerifiedOutputConsumer["consume"],
): LivingFrameControlledImageSelectedSceneVerifiedOutputConsumer {
  if (typeof consume !== "function") {
    throw invalid("consumer_invalid", "$.outputConsumer");
  }
  const consumer =
    Object.freeze<LivingFrameControlledImageSelectedSceneVerifiedOutputConsumer>(
      {
        consumerVersion:
          "living-frame-controlled-image-selected-scene-verified-output-consumer-v1",
        consumerClass:
          "process_bound_server_owned_selected_scene_verified_output_consumer",
        acceptsOnlyVerifiedOpaqueOutput: true,
        browserShareable: false,
        artifactPersistenceAuthority: false,
        segmentationOrMattingAuthority: false,
        qaApprovalAuthority: false,
        productionReady: false,
        consume: consume.bind(undefined),
      },
    );
  outputConsumers.add(consumer);
  return consumer;
}

export async function observeLivingFrameControlledImageSelectedScenePrivateOutput(
  input: {
    readonly operationRequestReceipt:
      LivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt;
    readonly outputReader:
      LivingFrameControlledImageSelectedScenePrivateOutputReader;
    readonly outputConsumer:
      LivingFrameControlledImageSelectedSceneVerifiedOutputConsumer;
  },
): Promise<LivingFrameControlledImageSelectedScenePrivateOutputObservation> {
  assertInput(input);
  const receipt = input.operationRequestReceipt;
  const reader = requireReader(input.outputReader, receipt);
  const consumer = requireConsumer(input.outputConsumer);
  consumedOutputReaders.add(reader);

  let packetValue:
    LivingFrameControlledImageSelectedScenePrivateOutputPacket;
  try {
    packetValue = await reader.readServerOwnedOutput();
  } catch {
    throw invalid("reader_failed", "$.outputReader");
  }
  const packet = assertOutputPacket(packetValue, receipt, reader);
  const outputPng = Buffer.from(packet.outputPng);
  const outputContentSha256 = digestBytes(outputPng);
  if (
    outputPng.byteLength !== packet.outputByteLength ||
    outputContentSha256 !== packet.outputContentSha256
  ) {
    throw invalid(
      "output_digest_mismatch",
      "$.outputPacket.outputPng",
    );
  }

  const decoded = decodeOutput(outputPng, receipt);
  const alphaReport = measureLivingFrameAlphaArtifact({
    artifactId: packet.outputCandidateId,
    artifactDigestSha256: outputContentSha256,
    width: decoded.widthPixels,
    height: decoded.heightPixels,
    rgbaBytes: Uint8Array.from(decoded.decodedRgba),
    alphaMode: "straight_alpha",
    alphaExpectation: "opaque_plate_expected",
  });
  assertOpaqueAlphaMeasurement(alphaReport, receipt);

  const stillAlphaPipelineRequired =
    receipt.generationCanvas.canvasClass ===
    "isolated_component_square_1024";
  const sourceDisposition = stillAlphaPipelineRequired
    ? ("opaque_component_source_requires_segmentation_matting_decontamination_and_alpha_qa" as const)
    : ("opaque_full_frame_plate_requires_destination_continuity_and_documentary_fact_qa" as const);
  assertDownstreamDisposition(receipt, stillAlphaPipelineRequired);

  const decodedRgbaSha256 = digestBytes(decoded.decodedRgba);
  const verification = Object.freeze({
    operationRequestReceiptDigestSha256:
      receipt.operationRequestReceiptDigestSha256,
    privateOperationRequestDigestSha256:
      receipt.requestSummary.privateOperationRequestDigestSha256,
    sceneId: receipt.canonicalScope.sceneId,
    componentId: receipt.exactOutputLineage.componentId,
    outputKey: receipt.exactOutputLineage.outputKey,
    approvedWorkItemId:
      receipt.exactOutputLineage.approvedWorkItemId,
    approvedPlannedAssetManifestEntryId:
      receipt.exactOutputLineage
        .approvedPlannedAssetManifestEntryId,
    outputCandidateId: packet.outputCandidateId,
    outputContentSha256,
    decodedRgbaSha256,
    widthPixels: decoded.widthPixels,
    heightPixels: decoded.heightPixels,
    alphaMeasurementReportDigestSha256:
      alphaReport.reportDigestSha256,
    stillAlphaPipelineRequired,
    opaqueGeneratedSourceOnly: true as const,
  });

  consumedOutputConsumers.add(consumer);
  try {
    await consumer.consume({
      outputPng: Buffer.from(outputPng),
      decodedRgba: Buffer.from(decoded.decodedRgba),
      verification,
    });
  } catch {
    throw invalid("consumer_failed", "$.outputConsumer");
  }

  const observationId = `lf-selected-output.${digest({
    operationRequestReceiptDigestSha256:
      receipt.operationRequestReceiptDigestSha256,
    outputContentSha256,
    decodedRgbaSha256,
  }).slice(0, 40)}`;
  const draft: LivingFrameControlledImageSelectedScenePrivateOutputObservationDraft =
    {
      contractVersion:
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OUTPUT_OBSERVATION_VERSION,
      resultClass:
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OUTPUT_OBSERVATION_CLASS,
      observationState:
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OUTPUT_OBSERVATION_STATE,
      observationId,
      canonicalScope: receipt.canonicalScope,
      exactOutputLineage: receipt.exactOutputLineage,
      sourceBindings: {
        operationRequestReceiptId:
          receipt.operationRequestReceiptId,
        operationRequestReceiptDigestSha256:
          receipt.operationRequestReceiptDigestSha256,
        privateOperationRequestDigestSha256:
          receipt.requestSummary.privateOperationRequestDigestSha256,
        selectedSceneRequestBindingDigestSha256:
          receipt.sourceBindings
            .selectedSceneRequestBindingDigestSha256,
        fullFrameRatioExtensionDigestSha256:
          receipt.sourceBindings
            .fullFrameRatioExtensionDigestSha256,
        admissionCandidateDigestSha256:
          receipt.sourceBindings.admissionCandidateDigestSha256,
        promptMaterializationDigestSha256:
          receipt.sourceBindings
            .promptMaterializationDigestSha256,
        promptMaterializationUnitDigestSha256:
          receipt.sourceBindings
            .promptMaterializationUnitDigestSha256,
        approvedSnapshotId:
          receipt.sourceBindings.approvedSnapshotId,
        approvedSnapshotHashSha256:
          receipt.sourceBindings.approvedSnapshotHashSha256,
        selectedSceneBindingDigestSha256:
          receipt.sourceBindings.selectedSceneBindingDigestSha256,
        visualContinuityPackDigestSha256:
          receipt.sourceBindings
            .visualContinuityPackDigestSha256,
        currentMasterTimingDigestSha256:
          receipt.sourceBindings.currentMasterTimingDigestSha256,
        canonicalWorkGraphProjectionDigestSha256:
          receipt.sourceBindings
            .canonicalWorkGraphProjectionDigestSha256,
        plannedAssetAndApprovedOutputLineageDigestSha256:
          receipt.sourceBindings
            .plannedAssetAndApprovedOutputLineageDigestSha256,
        controlledIllustrationCostWorkBindingDigestSha256:
          receipt.sourceBindings
            .controlledIllustrationCostWorkBindingDigestSha256,
        confirmedOutputFrameExpectationDigestSha256:
          receipt.sourceBindings
            .confirmedOutputFrameExpectationDigestSha256,
        artifactSetDigestSha256:
          receipt.sourceBindings.artifactSetDigestSha256,
        artifactPacketDigestSha256:
          receipt.sourceBindings.artifactPacketDigestSha256,
        readerBindingDigestSha256:
          reader.binding.readerBindingDigestSha256,
      },
      outputReader: {
        evidenceClass: reader.evidenceClass,
        oneShotReaderConsumed: true,
        oneShotConsumerConsumed: true,
        verifiedBytesDeliveredOutOfBand: true,
      },
      verifiedOutput: {
        outputCandidateId: packet.outputCandidateId,
        contentType: "image/png",
        byteLength: outputPng.byteLength,
        contentSha256: outputContentSha256,
        decodedRgbaSha256,
        widthPixels: decoded.widthPixels,
        heightPixels: decoded.heightPixels,
        decodedChannelCount: 4,
        sourcePngHadAlphaChannel: false,
        transparentPixelCount: 0,
        semiTransparentPixelCount: 0,
        opaquePixelCount: decoded.pixelCount,
        alphaMeasurementReportDigestSha256:
          alphaReport.reportDigestSha256,
        alphaFindingCodes: alphaReport.findingCodes,
        canvasClass: receipt.generationCanvas.canvasClass,
        stillAlphaPipelineRequired,
        sourceDisposition,
      },
      fixedRuntimeLineage: {
        expectedCanonicalToolId: "comfyui",
        expectedCanonicalOperationId:
          "tool.comfyui.generate_controlled_image.v1",
        processEntrypointKind:
          receipt.fixedRuntimePolicy.processEntrypointKind,
        runtimeConfinementRequirementDigestSha256:
          receipt.fixedRuntimePolicy
            .runtimeConfinementRequirementDigestSha256,
        deniedTopLevelImports: ["sam2"],
        nonRootRequired: true,
        readOnlyRootFilesystemRequired: true,
        allLinuxCapabilitiesDroppedRequired: true,
        noNewPrivilegesRequired: true,
        externalNetworkAllowed: false,
        runtimeDownloadsAllowed: false,
        exactModelArtifactCount: 5,
        exactModelArtifactByteLength: 11_700_367_157,
        allFiveModelRolesMountedReadOnlyForAttempt: true,
        allFiveModelRolesVerifiedBeforeAndAfterInference: true,
        oneProcessPerAttemptRequired: true,
      },
      costLineage: {
        costComponentId:
          "shared_controlled_illustration_gpu_host",
        oneObservedOutputBelongsToOneFutureGpuAttempt: true,
        fiveGpuCapabilitiesShareAttemptLifetime: true,
        fiveGpuCapabilitiesCreateOneAttemptCostEvent: true,
        auraFaceCpuMeasurementExcluded: true,
        completedFailedOrUnknownOutcomeNotInferred: true,
        canonicalWorkerResourceCostEvidenceRequired: true,
        actualCostAmountIncluded: false,
        customerPriceOrCreditIncluded: false,
        serviceFeeIncluded: false,
      },
      registryPolicy: {
        currentObservedCountIsProductCap: false,
        registryExpansionPermitted: true,
        postAdmissionCountDerivedFromReleasedDistinctIdentities: true,
        oneComfyUiIdentityForSharedGpuAttempt: true,
        fakeIdentityForModelWeightAdapterLibraryOrPreprocessorAllowed:
          false,
      },
      openGateCodes:
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OUTPUT_OPEN_GATES,
      authorityBoundary: AUTHORITY_BOUNDARY,
      operationRequestReceiptRevalidated: true,
      exactSceneWorkItemOutputAndFrameLineageMatched: true,
      exactPrivateOutputBytesRereadAndDecoded: true,
      alphaMeasurementRecomputedFromDecodedBytes: true,
      outputIsOpaqueGeneratedSourceOnly: true,
      benchmarkRequestOrOutputSubstitutionAllowed: false,
      workerCompletionInferred: false,
      gpuAttemptCreated: false,
      actualAttemptCostEvidenceVerified: false,
      artifactPersisted: false,
      assetManifestMutated: false,
      qaApproved: false,
      privateReviewApproved: false,
      renderAuthorized: false,
      finalCanvasCreatedByComfyUi: false,
      containsOutputBytesPathUrlCredentialPromptAliasModelCommandOrEnvironment:
        false,
      containsPriceCreditServiceFeeReservationWalletOrLedgerData:
        false,
      productionReady: false,
    };
  assertObservationSafe(draft);
  return deepFreeze({
    ...draft,
    observationDigestSha256: digest(draft),
  });
}

export function verifyLivingFrameControlledImageSelectedScenePrivateOutputObservation(
  value: unknown,
): value is LivingFrameControlledImageSelectedScenePrivateOutputObservation {
  try {
    const parsed = observationSchema.safeParse(value);
    if (!parsed.success) return false;
    const { observationDigestSha256, ...draft } = parsed.data;
    assertObservationSafe(
      draft as unknown as LivingFrameControlledImageSelectedScenePrivateOutputObservationDraft,
    );
    return digest(draft) === observationDigestSha256;
  } catch {
    return false;
  }
}

function compileReaderBindingDraft(
  receipt:
    LivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt,
) {
  return {
    operationRequestReceiptId: receipt.operationRequestReceiptId,
    operationRequestReceiptDigestSha256:
      receipt.operationRequestReceiptDigestSha256,
    privateOperationRequestDigestSha256:
      receipt.requestSummary.privateOperationRequestDigestSha256,
    materializationUnitId:
      receipt.exactOutputLineage.materializationUnitId,
    requestUnitId: receipt.exactOutputLineage.requestUnitId,
    sceneId: receipt.canonicalScope.sceneId,
    componentId: receipt.exactOutputLineage.componentId,
    outputKey: receipt.exactOutputLineage.outputKey,
    approvedWorkItemId:
      receipt.exactOutputLineage.approvedWorkItemId,
    approvedPlannedAssetManifestEntryId:
      receipt.exactOutputLineage
        .approvedPlannedAssetManifestEntryId,
    confirmedOutputFrameExpectationDigestSha256:
      receipt.sourceBindings
        .confirmedOutputFrameExpectationDigestSha256,
    widthPixels: receipt.generationCanvas.widthPixels,
    heightPixels: receipt.generationCanvas.heightPixels,
  };
}

function assertInput(
  value: unknown,
): asserts value is {
  readonly operationRequestReceipt:
    LivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt;
  readonly outputReader:
    LivingFrameControlledImageSelectedScenePrivateOutputReader;
  readonly outputConsumer:
    LivingFrameControlledImageSelectedSceneVerifiedOutputConsumer;
} {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "operationRequestReceipt",
      "outputReader",
      "outputConsumer",
    ])
  ) {
    throw invalid("input_invalid", "$");
  }
  if (
    !verifyLivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt(
      value.operationRequestReceipt,
    )
  ) {
    throw invalid(
      "operation_request_receipt_invalid",
      "$.operationRequestReceipt",
    );
  }
}

function requireReader(
  reader: LivingFrameControlledImageSelectedScenePrivateOutputReader,
  receipt:
    LivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt,
): LivingFrameControlledImageSelectedScenePrivateOutputReader {
  if (
    reader &&
    outputReaders.has(reader) &&
    consumedOutputReaders.has(reader)
  ) {
    throw invalid("reader_reused", "$.outputReader");
  }
  if (
    !reader ||
    !outputReaders.has(reader) ||
    consumedOutputReaders.has(reader) ||
    reader.readerVersion !==
      "living-frame-controlled-image-selected-scene-private-output-reader-v1" ||
    reader.readerClass !==
      "process_bound_server_owned_selected_scene_comfyui_output_reader" ||
    !(
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OUTPUT_EVIDENCE_CLASSES as
        readonly string[]
    ).includes(reader.evidenceClass) ||
    reader
      .callerBytesPathUrlCredentialPromptSeedDimensionModelCommandOrEnvironmentAccepted !==
      false ||
    reader.workerCompletionAuthority !== false ||
    reader.gpuAttemptAuthority !== false ||
    reader.actualCostAuthority !== false ||
    reader.artifactPersistenceAuthority !== false ||
    reader.productionReady !== false
  ) {
    throw invalid("reader_invalid", "$.outputReader");
  }
  const bindingDraft = compileReaderBindingDraft(receipt);
  if (
    reader.binding.operationRequestReceiptId !==
      bindingDraft.operationRequestReceiptId ||
    reader.binding.operationRequestReceiptDigestSha256 !==
      bindingDraft.operationRequestReceiptDigestSha256 ||
    reader.binding.privateOperationRequestDigestSha256 !==
      bindingDraft.privateOperationRequestDigestSha256 ||
    reader.binding.materializationUnitId !==
      bindingDraft.materializationUnitId ||
    reader.binding.requestUnitId !== bindingDraft.requestUnitId ||
    reader.binding.sceneId !== bindingDraft.sceneId ||
    reader.binding.componentId !== bindingDraft.componentId ||
    reader.binding.outputKey !== bindingDraft.outputKey ||
    reader.binding.approvedWorkItemId !==
      bindingDraft.approvedWorkItemId ||
    reader.binding.approvedPlannedAssetManifestEntryId !==
      bindingDraft.approvedPlannedAssetManifestEntryId ||
    reader.binding.confirmedOutputFrameExpectationDigestSha256 !==
      bindingDraft.confirmedOutputFrameExpectationDigestSha256 ||
    reader.binding.widthPixels !== bindingDraft.widthPixels ||
    reader.binding.heightPixels !== bindingDraft.heightPixels ||
    reader.binding.readerBindingDigestSha256 !== digest(bindingDraft)
  ) {
    throw invalid("reader_lineage_invalid", "$.outputReader.binding");
  }
  return reader;
}

function requireConsumer(
  consumer:
    LivingFrameControlledImageSelectedSceneVerifiedOutputConsumer,
): LivingFrameControlledImageSelectedSceneVerifiedOutputConsumer {
  if (
    consumer &&
    outputConsumers.has(consumer) &&
    consumedOutputConsumers.has(consumer)
  ) {
    throw invalid("consumer_reused", "$.outputConsumer");
  }
  if (
    !consumer ||
    !outputConsumers.has(consumer) ||
    consumedOutputConsumers.has(consumer) ||
    consumer.consumerVersion !==
      "living-frame-controlled-image-selected-scene-verified-output-consumer-v1" ||
    consumer.consumerClass !==
      "process_bound_server_owned_selected_scene_verified_output_consumer" ||
    consumer.acceptsOnlyVerifiedOpaqueOutput !== true ||
    consumer.browserShareable !== false ||
    consumer.artifactPersistenceAuthority !== false ||
    consumer.segmentationOrMattingAuthority !== false ||
    consumer.qaApprovalAuthority !== false ||
    consumer.productionReady !== false
  ) {
    throw invalid("consumer_invalid", "$.outputConsumer");
  }
  return consumer;
}

function assertOutputPacket(
  value: unknown,
  receipt:
    LivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt,
  reader: LivingFrameControlledImageSelectedScenePrivateOutputReader,
): LivingFrameControlledImageSelectedScenePrivateOutputPacket {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "packetClass",
      "evidenceClass",
      "operationRequestReceiptId",
      "operationRequestReceiptDigestSha256",
      "privateOperationRequestDigestSha256",
      "materializationUnitId",
      "requestUnitId",
      "sceneId",
      "componentId",
      "outputKey",
      "approvedWorkItemId",
      "approvedWorkItemKey",
      "approvedPlannedAssetManifestEntryId",
      "confirmedOutputFrameExpectationDigestSha256",
      "widthPixels",
      "heightPixels",
      "outputCandidateId",
      "outputContentType",
      "outputByteLength",
      "outputContentSha256",
      "outputPng",
      "callerBytesPathUrlCredentialPromptSeedDimensionModelCommandOrEnvironmentAccepted",
      "workerCompletionAuthority",
      "gpuAttemptAuthority",
      "actualCostAuthority",
      "artifactPersistenceAuthority",
      "qaApprovalAuthority",
      "finalCanvasAuthority",
      "productionReady",
    ]) ||
    value.packetClass !==
      "server_owned_selected_scene_comfyui_opaque_png_output_packet_v1" ||
    value.evidenceClass !== reader.evidenceClass ||
    typeof value.outputCandidateId !== "string" ||
    !SAFE_ID.test(value.outputCandidateId) ||
    value.outputContentType !== "image/png" ||
    !Number.isSafeInteger(value.outputByteLength) ||
    (value.outputByteLength as number) < 1 ||
    (value.outputByteLength as number) > MAXIMUM_OUTPUT_BYTES ||
    typeof value.outputContentSha256 !== "string" ||
    !SHA256.test(value.outputContentSha256) ||
    !Buffer.isBuffer(value.outputPng) ||
    value.outputPng.buffer instanceof SharedArrayBuffer
  ) {
    throw invalid("output_packet_invalid", "$.outputPacket");
  }
  if (
    value
      .callerBytesPathUrlCredentialPromptSeedDimensionModelCommandOrEnvironmentAccepted !==
      false ||
    value.workerCompletionAuthority !== false ||
    value.gpuAttemptAuthority !== false ||
    value.actualCostAuthority !== false ||
    value.artifactPersistenceAuthority !== false ||
    value.qaApprovalAuthority !== false ||
    value.finalCanvasAuthority !== false ||
    value.productionReady !== false
  ) {
    throw invalid("authority_promotion_forbidden", "$.outputPacket");
  }
  if (
    value.operationRequestReceiptId !==
      receipt.operationRequestReceiptId ||
    value.operationRequestReceiptDigestSha256 !==
      receipt.operationRequestReceiptDigestSha256 ||
    value.privateOperationRequestDigestSha256 !==
      receipt.requestSummary.privateOperationRequestDigestSha256 ||
    value.confirmedOutputFrameExpectationDigestSha256 !==
      receipt.sourceBindings
        .confirmedOutputFrameExpectationDigestSha256 ||
    value.widthPixels !== receipt.generationCanvas.widthPixels ||
    value.heightPixels !== receipt.generationCanvas.heightPixels
  ) {
    throw invalid("output_lineage_invalid", "$.outputPacket");
  }
  const lineage = receipt.exactOutputLineage;
  if (
    value.materializationUnitId !== lineage.materializationUnitId ||
    value.requestUnitId !== lineage.requestUnitId ||
    value.sceneId !== receipt.canonicalScope.sceneId ||
    value.componentId !== lineage.componentId ||
    value.outputKey !== lineage.outputKey ||
    value.approvedWorkItemId !== lineage.approvedWorkItemId ||
    value.approvedWorkItemKey !== lineage.approvedWorkItemKey ||
    value.approvedPlannedAssetManifestEntryId !==
      lineage.approvedPlannedAssetManifestEntryId
  ) {
    throw invalid(
      "cross_scene_work_item_or_output_substitution",
      "$.outputPacket",
    );
  }
  return value as unknown as
    LivingFrameControlledImageSelectedScenePrivateOutputPacket;
}

function decodeOutput(
  outputPng: Buffer,
  receipt:
    LivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt,
) {
  try {
    return verifyLivingFramePrivateOpaqueRgbPng(outputPng, {
      widthPixels: receipt.generationCanvas.widthPixels,
      heightPixels: receipt.generationCanvas.heightPixels,
      maximumOutputBytes: MAXIMUM_OUTPUT_BYTES,
      maximumDimension: MAXIMUM_DIMENSION,
      maximumPixelCount: MAXIMUM_PIXEL_COUNT,
    });
  } catch (error) {
    if (
      error instanceof
      LivingFramePrivateOpaqueRgbPngVerificationError
    ) {
      const code = {
        format_invalid: "output_format_invalid",
        dimension_invalid: "output_dimension_invalid",
        alpha_policy_invalid: "output_alpha_policy_invalid",
        decode_failed: "output_decode_failed",
      }[error.code] as
        LivingFrameControlledImageSelectedScenePrivateOutputIssueCode;
      throw invalid(code, "$.outputPacket.outputPng");
    }
    throw invalid("output_decode_failed", "$.outputPacket.outputPng");
  }
}

function assertOpaqueAlphaMeasurement(
  report: LivingFrameAlphaMeasurementReport,
  receipt:
    LivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt,
): void {
  const pixelCount =
    receipt.generationCanvas.widthPixels *
    receipt.generationCanvas.heightPixels;
  if (
    !verifyLivingFrameAlphaMeasurementReportDigest(report) ||
    report.raster.width !== receipt.generationCanvas.widthPixels ||
    report.raster.height !== receipt.generationCanvas.heightPixels ||
    report.raster.alphaExpectation !== "opaque_plate_expected" ||
    report.distribution.pixelCount !== pixelCount ||
    report.distribution.transparentPixelCount !== 0 ||
    report.distribution.semiTransparentPixelCount !== 0 ||
    report.distribution.opaquePixelCount !== pixelCount ||
    !report.findingCodes.includes("alpha_channel_fully_opaque")
  ) {
    throw invalid("alpha_measurement_invalid", "$.alphaMeasurement");
  }
}

function assertDownstreamDisposition(
  receipt:
    LivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt,
  stillAlphaPipelineRequired: boolean,
): void {
  const isolated =
    receipt.generationCanvas.canvasClass ===
    "isolated_component_square_1024";
  if (
    isolated !== stillAlphaPipelineRequired ||
    (isolated &&
      (receipt.generationCanvas.widthPixels !== 1_024 ||
        receipt.generationCanvas.heightPixels !== 1_024)) ||
    receipt.generationCanvas.finalCanvasCreatedByComfyUi !== false
  ) {
    throw invalid(
      "downstream_disposition_invalid",
      "$.verifiedOutput",
    );
  }
}

function assertObservationSafe(
  draft:
    LivingFrameControlledImageSelectedScenePrivateOutputObservationDraft,
): void {
  if (!observationDraftSchema.safeParse(draft).success) {
    throw invalid("unsafe_receipt_forbidden", "$");
  }
  if (
    canonicalJson(draft.openGateCodes) !==
      canonicalJson(
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OUTPUT_OPEN_GATES,
      ) ||
    canonicalJson(draft.authorityBoundary) !==
      canonicalJson(AUTHORITY_BOUNDARY) ||
    draft.verifiedOutput.opaquePixelCount !==
      draft.verifiedOutput.widthPixels *
        draft.verifiedOutput.heightPixels ||
    !draft.verifiedOutput.alphaFindingCodes.includes(
      "alpha_channel_fully_opaque",
    ) ||
    (draft.verifiedOutput.canvasClass ===
      "isolated_component_square_1024") !==
      draft.verifiedOutput.stillAlphaPipelineRequired ||
    draft.workerCompletionInferred !== false ||
    draft.gpuAttemptCreated !== false ||
    draft.actualAttemptCostEvidenceVerified !== false ||
    draft.artifactPersisted !== false ||
    draft.assetManifestMutated !== false ||
    draft.qaApproved !== false ||
    draft.privateReviewApproved !== false ||
    draft.renderAuthorized !== false ||
    draft.finalCanvasCreatedByComfyUi !== false ||
    draft.productionReady !== false ||
    containsUnsafeReceiptKey(draft)
  ) {
    throw invalid("unsafe_receipt_forbidden", "$");
  }
}

function containsUnsafeReceiptKey(value: unknown): boolean {
  const denied = new Set([
    "outputPng",
    "decodedRgba",
    "bytes",
    "path",
    "url",
    "credential",
    "secret",
    "prompt",
    "privateAlias",
    "modelAlias",
    "seed",
    "command",
    "environment",
    "actualCostMicros",
    "price",
    "credits",
    "serviceFeeAmount",
    "reservation",
    "wallet",
    "ledger",
  ]);
  let unsafe = false;
  walkEntries(value, (key, child) => {
    if (denied.has(key)) unsafe = true;
    if (
      typeof child === "string" &&
      (URL_LIKE.test(child) || SECRET_LIKE.test(child))
    ) {
      unsafe = true;
    }
  });
  return unsafe;
}

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  return (
    canonicalJson(Object.keys(value).sort()) ===
    canonicalJson([...expected].sort())
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    value !== null && typeof value === "object" && !Array.isArray(value)
  );
}

function walkEntries(
  value: unknown,
  visitor: (key: string, child: unknown) => void,
): void {
  if (Array.isArray(value)) {
    value.forEach((child) => walkEntries(child, visitor));
    return;
  }
  if (!isRecord(value)) return;
  Object.entries(value).forEach(([key, child]) => {
    visitor(key, child);
    walkEntries(child, visitor);
  });
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => canonicalize(entry));
  }
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, child]) => child !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    );
  }
  return value;
}

function digest(value: unknown): string {
  return createHash("sha256")
    .update(canonicalJson(value), "utf8")
    .digest("hex");
}

function digestBytes(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function deepFreeze<T>(value: T): T {
  if (
    value !== null &&
    typeof value === "object" &&
    !Object.isFrozen(value) &&
    !Buffer.isBuffer(value)
  ) {
    Object.freeze(value);
    Object.values(value).forEach((child) => deepFreeze(child));
  }
  return value;
}

function invalid(
  code:
    LivingFrameControlledImageSelectedScenePrivateOutputIssueCode,
  path: string,
): LivingFrameControlledImageSelectedScenePrivateOutputObservationError {
  if (
    !(
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OUTPUT_ISSUE_CODES as
        readonly string[]
    ).includes(code)
  ) {
    throw new Error(
      "Unknown Living Frame selected-scene private output issue code.",
    );
  }
  return new LivingFrameControlledImageSelectedScenePrivateOutputObservationError(
    [{ code, path }],
  );
}
