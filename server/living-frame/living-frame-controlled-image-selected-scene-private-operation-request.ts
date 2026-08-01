import { createHash } from "node:crypto";

import {
  LIVING_FRAME_CONTROLLED_MODEL_FAMILY_ROLES,
  type LivingFrameControlledModelFamilyRole,
} from "../../src/types/living-frame-controlled-model-family-binding";
import type { LivingFrameComfyUiOperationAdmissionCandidate } from "../../src/types/living-frame-comfyui-operation-admission-candidate";
import type { LivingFrameControlledImageFullFrameRatioExtension } from "../../src/types/living-frame-controlled-image-full-frame-ratio-extension";
import type {
  LivingFrameControlledImageSelectedSceneRequest,
  LivingFrameControlledImageSelectedSceneRequestUnit,
} from "../../src/types/living-frame-controlled-image-selected-scene-request";
import {
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OPERATION_REQUEST_CLASS,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OPERATION_REQUEST_ISSUE_CODES,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OPERATION_REQUEST_OPEN_GATES,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OPERATION_REQUEST_STATE,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OPERATION_REQUEST_VERSION,
  type LivingFrameControlledImageSelectedScenePrivateOperationArtifactReceipt,
  type LivingFrameControlledImageSelectedScenePrivateOperationRequestAuthority,
  type LivingFrameControlledImageSelectedScenePrivateOperationRequestIssue,
  type LivingFrameControlledImageSelectedScenePrivateOperationRequestIssueCode,
  type LivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt,
  type LivingFrameControlledImageSelectedScenePrivateOperationRequestReceiptDraft,
} from "../../src/types/living-frame-controlled-image-selected-scene-private-operation-request";
import type {
  LivingFrameControlledImageSelectedScenePrivatePromptMaterialization,
  LivingFrameControlledImageSelectedScenePrivatePromptMaterializationUnit,
} from "../../src/types/living-frame-controlled-image-selected-scene-private-prompt-materialization";
import { LIVING_FRAME_COMFYUI_RUNTIME_CONFINEMENT_REQUIREMENT_DIGEST_SHA256 } from "./living-frame-controlled-sdxl-comfyui-canonical-mount-host-session";
import {
  type CreateLivingFrameControlledImageFullFrameRatioExtensionInput,
  verifyLivingFrameControlledImageFullFrameRatioExtension,
} from "./living-frame-controlled-image-full-frame-ratio-extension";
import {
  type CreateLivingFrameControlledImageSelectedSceneRequestInput,
  verifyLivingFrameControlledImageSelectedSceneRequest,
} from "./living-frame-controlled-image-selected-scene-request";
import {
  consumeLivingFrameControlledImageSelectedScenePrivatePromptRequestLease,
  type LivingFrameControlledImageSelectedScenePrivateComfyUiPrompt,
  type LivingFrameControlledImageSelectedScenePrivatePromptRequest,
  type LivingFrameControlledImageSelectedScenePrivatePromptRequestLease,
  verifyLivingFrameControlledImageSelectedScenePrivatePromptMaterialization,
} from "./living-frame-controlled-image-selected-scene-private-prompt-materialization";
import { verifyLivingFrameComfyUiOperationAdmissionCandidate } from "./living-frame-comfyui-operation-admission-candidate";

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u;
const SHA256 = /^[a-f0-9]{64}$/u;
const PRIVATE_ALIAS = /^[A-Za-z0-9][A-Za-z0-9._-]{0,126}[A-Za-z0-9]$/u;
const URL_LIKE = /(?:https?:\/\/|file:\/\/|data:|javascript:)/iu;
const SECRET_LIKE =
  /(?:-----BEGIN [A-Z ]+PRIVATE KEY-----|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9_-]{16,})/u;
const MAX_WIRE_REQUEST_BYTES = 256 * 1_024;
const MAX_ARTIFACT_BYTES = 20 * 1_024 * 1_024 * 1_024;
const EXACT_MODEL_ARTIFACT_BYTE_LENGTH = 11_700_367_157;

const MODEL_ROLE_BINDINGS = [
  {
    role: "base_checkpoint",
    slotKind: "base_checkpoint_artifact",
  },
  {
    role: "controlnet_checkpoint",
    slotKind: "controlnet_checkpoint_artifact",
  },
  {
    role: "lora_adapter",
    slotKind: "lora_adapter_artifact",
  },
  {
    role: "generic_ipadapter_checkpoint",
    slotKind: "generic_ipadapter_checkpoint_artifact",
  },
  {
    role: "clip_vision_checkpoint",
    slotKind: "clip_vision_checkpoint_artifact",
  },
] as const;

type ModelSlotKind = (typeof MODEL_ROLE_BINDINGS)[number]["slotKind"];
type InputImageSlotKind = "control_image_artifact" | "reference_image_artifact";

const AUTHORITY_BOUNDARY: LivingFrameControlledImageSelectedScenePrivateOperationRequestAuthority =
  deepFreeze({
    privateOperationRequestCompilationAuthority: true,
    selectedSceneAuthority: false,
    visualContinuityPackAuthority: false,
    outputFrameAuthority: false,
    promptPlanningAuthority: false,
    promptMaterializationAuthority: false,
    modelArtifactRepositoryAuthority: false,
    inputArtifactRepositoryAuthority: false,
    artifactMountAuthority: false,
    toolRegistryAuthority: false,
    operationRegistryAuthority: false,
    providerAuthority: false,
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
    queueAuthority: false,
    dispatchAuthority: false,
    workerLeaseAuthority: false,
    gpuAttemptAuthority: false,
    artifactPersistenceAuthority: false,
    assetManifestAuthority: false,
    qaApprovalAuthority: false,
    privateReviewAuthority: false,
    renderAuthority: false,
    runtimeAuthority: false,
    productionAuthority: false,
  });

export interface LivingFrameControlledImageSelectedScenePrivateOperationModelArtifact {
  readonly order: number;
  readonly role: LivingFrameControlledModelFamilyRole;
  readonly slotKind: ModelSlotKind;
  readonly artifactRecordId: string;
  readonly artifactContentSha256: string;
  readonly artifactByteLength: number;
  readonly artifactSourceBindingDigestSha256: string;
  readonly privateAlias: string;
  readonly readOnlyMountRequired: true;
}

export interface LivingFrameControlledImageSelectedScenePrivateOperationInputImageArtifact {
  readonly order: number;
  readonly promptSlotOrder: number;
  readonly slotKind: InputImageSlotKind;
  readonly artifactRecordId: string;
  readonly artifactContentSha256: string;
  readonly artifactByteLength: number;
  readonly artifactSourceBindingDigestSha256: string;
  readonly privateAlias: string;
  readonly readOnlyMountRequired: true;
}

export interface LivingFrameControlledImageSelectedScenePrivateOperationArtifactPacket {
  readonly packetClass: "server_owned_selected_scene_comfyui_operation_artifact_packet_v1";
  readonly evidenceClass: "controlled_non_executable_selected_scene_operation_artifact_packet";
  readonly selectedSceneRequestBindingDigestSha256: string;
  readonly promptMaterializationDigestSha256: string;
  readonly promptMaterializationUnitDigestSha256: string;
  readonly materializationUnitId: string;
  readonly requestUnitId: string;
  readonly sceneId: string;
  readonly outputKey: string;
  readonly approvedWorkItemId: string;
  readonly approvedWorkItemKey: string;
  readonly approvedPlannedAssetManifestEntryId: string;
  readonly confirmedOutputFrameExpectationDigestSha256: string;
  readonly modelArtifacts: readonly LivingFrameControlledImageSelectedScenePrivateOperationModelArtifact[];
  readonly inputImageArtifacts: readonly LivingFrameControlledImageSelectedScenePrivateOperationInputImageArtifact[];
  readonly artifactSetDigestSha256: string;
  readonly fixedRuntimeExpectation: {
    readonly processEntrypointKind: "fixed_supervised_python_process";
    readonly runtimeRegion: "europe-west1";
    readonly accelerator: "nvidia_l4";
    readonly gpuCount: 1;
    readonly cpuFallbackAllowed: false;
    readonly runtimeConfinementRequirementDigestSha256: string;
    readonly deniedTopLevelImports: readonly ["sam2"];
    readonly externalNetworkAllowed: false;
    readonly runtimeDownloadsAllowed: false;
    readonly atomicFiveModelReadOnlyMountRequired: true;
    readonly verifyAllFiveModelsBeforeAndAfterInference: true;
    readonly oneProcessPerAttemptRequired: true;
  };
  readonly callerArtifactPacketAccepted: false;
  readonly callerModelOrImageBytesAccepted: false;
  readonly callerPromptSeedDimensionModelPathUrlCredentialCommandOrEnvironmentAccepted: false;
  readonly operationAuthority: false;
  readonly dispatchAuthority: false;
  readonly runtimeAuthority: false;
  readonly productionReady: false;
  readonly artifactPacketDigestSha256: string;
}

export interface LivingFrameControlledImageSelectedScenePrivateOperationArtifactReaderPort {
  readonly readerClass: "process_bound_server_owned_selected_scene_operation_artifact_reader_v1";
  readonly sourceAuthority: "current_canonical_model_and_selected_scene_input_artifact_repository";
  readonly callerArtifactPacketAccepted: false;
  readonly callerModelOrImageBytesAccepted: false;
  readonly callerPromptSeedDimensionModelPathUrlCredentialCommandOrEnvironmentAccepted: false;
  readonly operationAuthority: false;
  readonly dispatchAuthority: false;
  readonly runtimeAuthority: false;
  readonly productionReady: false;
  readCurrentByServerOwnedLocator(
    serverOwnedArtifactLocatorId: string,
  ): Promise<unknown>;
}

export interface LivingFrameControlledImageSelectedScenePrivateOperationRequest {
  readonly requestClass: "selected_scene_private_comfyui_operation_request_v1";
  readonly protocolVersion: typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OPERATION_REQUEST_VERSION;
  readonly requestId: string;
  readonly clientId: string;
  readonly exactOutputLineage: {
    readonly materializationUnitId: string;
    readonly requestUnitId: string;
    readonly sceneId: string;
    readonly outputKey: string;
    readonly approvedWorkItemId: string;
    readonly approvedWorkItemKey: string;
    readonly approvedPlannedAssetManifestEntryId: string;
  };
  readonly expectedOperation: {
    readonly canonicalToolId: "comfyui";
    readonly operationId: "tool.comfyui.generate_controlled_image.v1";
  };
  readonly prompt: LivingFrameControlledImageSelectedScenePrivateComfyUiPrompt;
  readonly artifactMountBindings: readonly {
    readonly order: number;
    readonly artifactClass:
      | "canonical_model_artifact"
      | "private_selected_scene_input_image_artifact";
    readonly modelRole: LivingFrameControlledModelFamilyRole | null;
    readonly slotKind: ModelSlotKind | InputImageSlotKind;
    readonly artifactRecordId: string;
    readonly artifactContentSha256: string;
    readonly artifactSourceBindingDigestSha256: string;
    readonly privateAlias: string;
    readonly readOnlyMountRequired: true;
  }[];
  readonly outputExpectation: {
    readonly transport: "websocket_image_output";
    readonly contentType: "image/png";
    readonly widthPixels: number;
    readonly heightPixels: number;
    readonly imageCount: 1;
    readonly finalCanvasCreatedByComfyUi: false;
  };
  readonly fixedRuntimePolicy: {
    readonly processEntrypointKind: "fixed_supervised_python_process";
    readonly runtimeRegion: "europe-west1";
    readonly accelerator: "nvidia_l4";
    readonly gpuCount: 1;
    readonly cpuFallbackAllowed: false;
    readonly runtimeConfinementRequirementDigestSha256: string;
    readonly deniedTopLevelImports: readonly ["sam2"];
    readonly externalNetworkAllowed: false;
    readonly runtimeDownloadsAllowed: false;
    readonly atomicFiveModelReadOnlyMountRequired: true;
    readonly verifyAllFiveModelsBeforeAndAfterInference: true;
    readonly oneProcessPerAttemptRequired: true;
    readonly callerCommandArgumentsEnvironmentPathUrlOrCredentialAllowed: false;
  };
  readonly costEventExpectation: {
    readonly costComponentId: "shared_controlled_illustration_gpu_host";
    readonly sharedGpuCapabilityKeys: readonly [
      "comfyui",
      "comfyui_controlnet_aux",
      "controlnet",
      "ip_adapter",
      "peft_lora",
    ];
    readonly separateCpuQaCapabilityKey: "auraface";
    readonly oneRequestEqualsOneGpuAttempt: true;
    readonly fiveGpuCapabilitiesShareAttemptLifetime: true;
    readonly fiveGpuCapabilitiesCreateOneAttemptCostEvent: true;
    readonly auraFaceCpuMeasurementExcluded: true;
    readonly exactReuseCreatesNoNewGpuAttempt: true;
    readonly failedOrUnknownAttemptCostMustBeRetained: true;
  };
  readonly operationRegistered: false;
  readonly dispatchAuthority: false;
  readonly workerLeaseAuthority: false;
  readonly runtimeAuthority: false;
  readonly assetAuthority: false;
  readonly finalCanvasAuthority: false;
  readonly productionReady: false;
}

export interface LivingFrameControlledImageSelectedScenePrivateOperationRequestLease {
  readonly leaseClass: "process_bound_single_use_non_dispatched_selected_scene_comfyui_operation_request_lease_v1";
  readonly leaseId: string;
  readonly operationRequestReceiptDigestSha256: string;
  readonly materializationUnitId: string;
  readonly requestUnitId: string;
  readonly callerSerializable: false;
  readonly dispatchAuthority: false;
  readonly workerLeaseAuthority: false;
  readonly runtimeAuthority: false;
  readonly assetAuthority: false;
  readonly finalCanvasAuthority: false;
  readonly productionReady: false;
}

export interface LivingFrameControlledImageSelectedScenePrivateOperationRequestResult {
  readonly receipt: LivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt;
  readonly privateOperationRequestLease: LivingFrameControlledImageSelectedScenePrivateOperationRequestLease;
}

export interface CreateLivingFrameControlledImageSelectedScenePrivateOperationRequestInput {
  readonly serverOwnedArtifactLocatorId: string;
  readonly selectedSceneRequest: LivingFrameControlledImageSelectedSceneRequest;
  readonly selectedSceneRequestInput: CreateLivingFrameControlledImageSelectedSceneRequestInput;
  readonly fullFrameRatioExtension: LivingFrameControlledImageFullFrameRatioExtension;
  readonly fullFrameRatioExtensionInput: CreateLivingFrameControlledImageFullFrameRatioExtensionInput;
  readonly admissionCandidate: LivingFrameComfyUiOperationAdmissionCandidate;
  readonly promptMaterialization: LivingFrameControlledImageSelectedScenePrivatePromptMaterialization;
  readonly materializationUnitId: string;
  readonly privatePromptRequestLease: LivingFrameControlledImageSelectedScenePrivatePromptRequestLease;
  readonly artifactReader: LivingFrameControlledImageSelectedScenePrivateOperationArtifactReaderPort | null;
}

const artifactReaders = new WeakSet<object>();
const consumedArtifactReaders = new WeakSet<object>();
const operationRequestLeases = new WeakSet<object>();
const consumedOperationRequestLeases = new WeakSet<object>();
const privateOperationRequests = new WeakMap<
  object,
  LivingFrameControlledImageSelectedScenePrivateOperationRequest
>();

export class LivingFrameControlledImageSelectedScenePrivateOperationRequestError extends Error {
  readonly issues: readonly LivingFrameControlledImageSelectedScenePrivateOperationRequestIssue[];

  constructor(
    issues: readonly LivingFrameControlledImageSelectedScenePrivateOperationRequestIssue[],
  ) {
    super(
      "Living Frame selected-scene private operation request compilation failed.",
    );
    this.name =
      "LivingFrameControlledImageSelectedScenePrivateOperationRequestError";
    this.issues = issues;
  }
}

export function createLivingFrameControlledImageSelectedScenePrivateOperationArtifactReader(
  readCurrentByServerOwnedLocator: LivingFrameControlledImageSelectedScenePrivateOperationArtifactReaderPort["readCurrentByServerOwnedLocator"],
): LivingFrameControlledImageSelectedScenePrivateOperationArtifactReaderPort {
  if (typeof readCurrentByServerOwnedLocator !== "function") {
    throw invalid("reader_invalid", "$.artifactReader");
  }
  const reader =
    Object.freeze<LivingFrameControlledImageSelectedScenePrivateOperationArtifactReaderPort>(
      {
        readerClass:
          "process_bound_server_owned_selected_scene_operation_artifact_reader_v1",
        sourceAuthority:
          "current_canonical_model_and_selected_scene_input_artifact_repository",
        callerArtifactPacketAccepted: false,
        callerModelOrImageBytesAccepted: false,
        callerPromptSeedDimensionModelPathUrlCredentialCommandOrEnvironmentAccepted: false,
        operationAuthority: false,
        dispatchAuthority: false,
        runtimeAuthority: false,
        productionReady: false,
        readCurrentByServerOwnedLocator:
          readCurrentByServerOwnedLocator.bind(undefined),
      },
    );
  artifactReaders.add(reader);
  return reader;
}

export async function compileLivingFrameControlledImageSelectedScenePrivateOperationRequest(
  input: CreateLivingFrameControlledImageSelectedScenePrivateOperationRequestInput,
): Promise<LivingFrameControlledImageSelectedScenePrivateOperationRequestResult> {
  assertInput(input);
  if (
    !verifyLivingFrameControlledImageSelectedSceneRequest(
      input.selectedSceneRequest,
      input.selectedSceneRequestInput,
    )
  )
    throw invalid("selected_scene_request_invalid", "$.selectedSceneRequest");
  if (
    !(await verifyLivingFrameControlledImageFullFrameRatioExtension(
      input.fullFrameRatioExtension,
      input.fullFrameRatioExtensionInput,
    ))
  )
    throw invalid(
      "full_frame_ratio_extension_invalid",
      "$.fullFrameRatioExtension",
    );
  if (
    !(await verifyLivingFrameComfyUiOperationAdmissionCandidate(
      input.admissionCandidate,
      { candidateId: input.admissionCandidate.candidateId },
    ))
  )
    throw invalid("admission_candidate_invalid", "$.admissionCandidate");
  if (
    !verifyLivingFrameControlledImageSelectedScenePrivatePromptMaterialization(
      input.promptMaterialization,
    )
  )
    throw invalid("prompt_materialization_invalid", "$.promptMaterialization");
  assertSourceLineage(input);
  const materializationUnit = selectedMaterializationUnit(input);
  const requestUnit = selectedRequestUnit(input, materializationUnit);
  assertPromptLease(
    input.privatePromptRequestLease,
    input.promptMaterialization,
    materializationUnit,
  );
  const reader = requireArtifactReader(input.artifactReader);
  consumedArtifactReaders.add(reader);
  let packetValue: unknown;
  try {
    packetValue = await reader.readCurrentByServerOwnedLocator(
      input.serverOwnedArtifactLocatorId,
    );
  } catch {
    throw invalid("reader_failed", "$.artifactReader");
  }
  const packet = assertArtifactPacket(
    packetValue,
    input,
    materializationUnit,
    requestUnit,
  );
  let privatePromptRequest:
    LivingFrameControlledImageSelectedScenePrivatePromptRequest;
  try {
    privatePromptRequest =
      consumeLivingFrameControlledImageSelectedScenePrivatePromptRequestLease(
        input.privatePromptRequestLease,
      );
  } catch {
    throw invalid(
      "prompt_lease_reused",
      "$.privatePromptRequestLease",
    );
  }
  assertPrivatePromptRequest(
    privatePromptRequest,
    materializationUnit,
    requestUnit,
  );
  assertPromptArtifactBindings(
    privatePromptRequest.prompt,
    materializationUnit,
    packet,
  );
  const operationRequestReceiptId = `lf-selected-opreq.${digest({
    materializationUnitId: materializationUnit.materializationUnitId,
    materializationUnitDigestSha256:
      materializationUnit.materializationUnitDigestSha256,
    artifactSetDigestSha256: packet.artifactSetDigestSha256,
    confirmedOutputFrameExpectationDigestSha256:
      materializationUnit.generationCanvas
        .confirmedOutputFrameExpectationDigestSha256,
  }).slice(0, 40)}`;
  const privateOperationRequest = compilePrivateOperationRequest({
    operationRequestReceiptId,
    materializationUnit,
    privatePromptRequest,
    packet,
  });
  const serializedOperationRequestByteLength = Buffer.byteLength(
    canonicalJson(privateOperationRequest),
    "utf8",
  );
  if (
    serializedOperationRequestByteLength < 2 ||
    serializedOperationRequestByteLength > MAX_WIRE_REQUEST_BYTES
  )
    throw invalid(
      "wire_request_too_large",
      "$.requestSummary.serializedOperationRequestByteLength",
    );
  const privateOperationRequestDigestSha256 = digest(privateOperationRequest);
  const leaseId = `lf-selected-opreq-lease.${digest({
    operationRequestReceiptId,
    privateOperationRequestDigestSha256,
  }).slice(0, 40)}`;
  const draft = compileReceiptDraft({
    input,
    materializationUnit,
    requestUnit,
    packet,
    operationRequestReceiptId,
    leaseId,
    privateOperationRequestDigestSha256,
    serializedOperationRequestByteLength,
  });
  assertReceiptSemantics(draft);
  assertSafeReceipt(draft);
  const receipt = deepFreeze({
    ...draft,
    operationRequestReceiptDigestSha256: digest(draft),
  });
  const lease =
    Object.freeze<LivingFrameControlledImageSelectedScenePrivateOperationRequestLease>(
      {
        leaseClass:
          "process_bound_single_use_non_dispatched_selected_scene_comfyui_operation_request_lease_v1",
        leaseId,
        operationRequestReceiptDigestSha256:
          receipt.operationRequestReceiptDigestSha256,
        materializationUnitId: materializationUnit.materializationUnitId,
        requestUnitId: requestUnit.requestUnitId,
        callerSerializable: false,
        dispatchAuthority: false,
        workerLeaseAuthority: false,
        runtimeAuthority: false,
        assetAuthority: false,
        finalCanvasAuthority: false,
        productionReady: false,
      },
    );
  operationRequestLeases.add(lease);
  privateOperationRequests.set(lease, privateOperationRequest);
  return Object.freeze({
    receipt,
    privateOperationRequestLease: lease,
  });
}

export function consumeLivingFrameControlledImageSelectedScenePrivateOperationRequestLease(
  lease: LivingFrameControlledImageSelectedScenePrivateOperationRequestLease,
): LivingFrameControlledImageSelectedScenePrivateOperationRequest {
  if (
    !operationRequestLeases.has(lease) ||
    consumedOperationRequestLeases.has(lease) ||
    lease.leaseClass !==
      "process_bound_single_use_non_dispatched_selected_scene_comfyui_operation_request_lease_v1" ||
    lease.callerSerializable !== false ||
    lease.dispatchAuthority !== false ||
    lease.workerLeaseAuthority !== false ||
    lease.runtimeAuthority !== false ||
    lease.assetAuthority !== false ||
    lease.finalCanvasAuthority !== false ||
    lease.productionReady !== false
  )
    throw invalid(
      "wire_request_lease_reused",
      "$.privateOperationRequestLease",
    );
  const request = privateOperationRequests.get(lease);
  if (!request) {
    throw invalid(
      "wire_request_lease_invalid",
      "$.privateOperationRequestLease",
    );
  }
  consumedOperationRequestLeases.add(lease);
  privateOperationRequests.delete(lease);
  return request;
}

export function verifyLivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt(
  value: unknown,
): value is LivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt {
  try {
    if (
      !isRecord(value) ||
      value.contractVersion !==
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OPERATION_REQUEST_VERSION ||
      value.resultClass !==
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OPERATION_REQUEST_CLASS ||
      value.requestState !==
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OPERATION_REQUEST_STATE ||
      typeof value.operationRequestReceiptDigestSha256 !== "string" ||
      !SHA256.test(value.operationRequestReceiptDigestSha256)
    )
      return false;
    const { operationRequestReceiptDigestSha256, ...draft } = value;
    assertReceiptSemantics(
      draft as unknown as LivingFrameControlledImageSelectedScenePrivateOperationRequestReceiptDraft,
    );
    assertSafeReceipt(draft);
    return digest(draft) === operationRequestReceiptDigestSha256;
  } catch {
    return false;
  }
}

function selectedMaterializationUnit(
  input: CreateLivingFrameControlledImageSelectedScenePrivateOperationRequestInput,
): LivingFrameControlledImageSelectedScenePrivatePromptMaterializationUnit {
  const units = input.promptMaterialization.materializationUnits.filter(
    (unit) => unit.materializationUnitId === input.materializationUnitId,
  );
  if (units.length !== 1) {
    throw invalid("materialization_unit_missing", "$.materializationUnitId");
  }
  return units[0]!;
}

function selectedRequestUnit(
  input: CreateLivingFrameControlledImageSelectedScenePrivateOperationRequestInput,
  materializationUnit: LivingFrameControlledImageSelectedScenePrivatePromptMaterializationUnit,
): LivingFrameControlledImageSelectedSceneRequestUnit {
  const units = input.selectedSceneRequest.requestUnits.filter(
    (unit) => unit.requestUnitId === materializationUnit.requestUnitId,
  );
  if (units.length !== 1) {
    throw invalid(
      "materialization_unit_missing",
      "$.selectedSceneRequest.requestUnits",
    );
  }
  const unit = units[0]!;
  if (
    unit.requestUnitDigestSha256 !==
      materializationUnit.requestUnitDigestSha256 ||
    unit.sceneId !== materializationUnit.sceneId ||
    unit.componentId !== materializationUnit.componentId ||
    unit.outputKey !== materializationUnit.outputKey ||
    unit.approvedWorkItemId !== materializationUnit.approvedWorkItemId ||
    unit.approvedWorkItemKey !== materializationUnit.approvedWorkItemKey ||
    unit.approvedPlannedAssetManifestEntryId !==
      materializationUnit.approvedPlannedAssetManifestEntryId ||
    unit.rendererLayerId !== materializationUnit.rendererLayerId
  )
    throw invalid(
      "cross_scene_work_item_or_output_substitution",
      "$.materializationUnitId",
    );
  return unit;
}

function assertSourceLineage(
  input: CreateLivingFrameControlledImageSelectedScenePrivateOperationRequestInput,
): void {
  const request = input.selectedSceneRequest;
  const ratio = input.fullFrameRatioExtension;
  const materialization = input.promptMaterialization;
  const admission = input.admissionCandidate;
  if (
    ratio.sourceBindings.selectedSceneRequestBindingDigestSha256 !==
      request.requestBindingDigestSha256 ||
    ratio.sourceBindings.confirmedOutputFrameExpectationDigestSha256 !==
      request.sourceBindings.outputFrameExpectationDigestSha256 ||
    materialization.sourceBindings.selectedSceneRequestBindingDigestSha256 !==
      request.requestBindingDigestSha256 ||
    materialization.sourceBindings.fullFrameRatioExtensionDigestSha256 !==
      ratio.extensionDigestSha256 ||
    materialization.sourceBindings.admissionCandidateDigestSha256 !==
      admission.candidateDigestSha256 ||
    materialization.canonicalScope.sceneId !== request.canonicalScope.sceneId ||
    materialization.sourceBindings.approvedSnapshotId !==
      request.sourceBindings.approvedSnapshotId ||
    materialization.sourceBindings.approvedSnapshotHashSha256 !==
      request.sourceBindings.approvedSnapshotHashSha256 ||
    materialization.sourceBindings.selectedSceneBindingDigestSha256 !==
      request.sourceBindings.selectedSceneBindingDigestSha256 ||
    materialization.sourceBindings.visualContinuityPackDigestSha256 !==
      request.sourceBindings.visualContinuityPackDigestSha256 ||
    materialization.sourceBindings.currentMasterTimingDigestSha256 !==
      request.sourceBindings.currentMasterTimingDigestSha256 ||
    materialization.sourceBindings.canonicalWorkGraphProjectionDigestSha256 !==
      request.sourceBindings.canonicalWorkGraphProjectionDigestSha256 ||
    materialization.sourceBindings
      .controlledIllustrationCostWorkBindingDigestSha256 !==
      request.sourceBindings
        .controlledIllustrationCostWorkBindingDigestSha256 ||
    materialization.sourceBindings
      .confirmedOutputFrameExpectationDigestSha256 !==
      request.sourceBindings.outputFrameExpectationDigestSha256 ||
    admission.admissionDecision.registryExpansionPermitted !== true ||
    admission.admissionDecision
      .postAdmissionToolIdentityCountDerivedFromReleasedDistinctIdentities !==
      true ||
    admission.admissionDecision
      .fakeIdentityForModelWeightAdapterOrLibraryAllowed !== false ||
    admission.workerRuntimeExpectation.processEntrypointKind !==
      "fixed_supervised_python_process" ||
    admission.sourceBindings.deniedTopLevelImports.length !== 1 ||
    admission.sourceBindings.deniedTopLevelImports[0] !== "sam2" ||
    admission.operationRegistered !== false ||
    admission.dispatchGranted !== false ||
    admission.productionReady !== false
  )
    throw invalid("source_lineage_mismatch", "$");
}

function assertPromptLease(
  lease: LivingFrameControlledImageSelectedScenePrivatePromptRequestLease,
  materialization: LivingFrameControlledImageSelectedScenePrivatePromptMaterialization,
  unit: LivingFrameControlledImageSelectedScenePrivatePromptMaterializationUnit,
): void {
  if (
    !isRecord(lease) ||
    lease.leaseClass !==
      "process_bound_single_use_selected_scene_comfyui_prompt_request_lease_v1" ||
    lease.leaseId !== unit.privatePromptRequest.leaseId ||
    lease.materializationDigestSha256 !==
      materialization.materializationDigestSha256 ||
    lease.materializationUnitId !== unit.materializationUnitId ||
    lease.requestUnitId !== unit.requestUnitId ||
    lease.callerSerializable !== false ||
    lease.dispatchAuthority !== false ||
    lease.runtimeAuthority !== false ||
    lease.finalCanvasAuthority !== false ||
    lease.productionReady !== false
  )
    throw invalid("prompt_lease_invalid", "$.privatePromptRequestLease");
}

function requireArtifactReader(
  reader: LivingFrameControlledImageSelectedScenePrivateOperationArtifactReaderPort | null,
): LivingFrameControlledImageSelectedScenePrivateOperationArtifactReaderPort {
  if (
    reader &&
    artifactReaders.has(reader) &&
    consumedArtifactReaders.has(reader)
  )
    throw invalid("reader_reused", "$.artifactReader");
  if (
    !reader ||
    !artifactReaders.has(reader) ||
    consumedArtifactReaders.has(reader) ||
    reader.readerClass !==
      "process_bound_server_owned_selected_scene_operation_artifact_reader_v1" ||
    reader.sourceAuthority !==
      "current_canonical_model_and_selected_scene_input_artifact_repository" ||
    reader.callerArtifactPacketAccepted !== false ||
    reader.callerModelOrImageBytesAccepted !== false ||
    reader.callerPromptSeedDimensionModelPathUrlCredentialCommandOrEnvironmentAccepted !==
      false ||
    reader.operationAuthority !== false ||
    reader.dispatchAuthority !== false ||
    reader.runtimeAuthority !== false ||
    reader.productionReady !== false
  )
    throw invalid("reader_invalid", "$.artifactReader");
  return reader;
}

function assertArtifactPacket(
  value: unknown,
  input: CreateLivingFrameControlledImageSelectedScenePrivateOperationRequestInput,
  unit: LivingFrameControlledImageSelectedScenePrivatePromptMaterializationUnit,
  requestUnit: LivingFrameControlledImageSelectedSceneRequestUnit,
): LivingFrameControlledImageSelectedScenePrivateOperationArtifactPacket {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "packetClass",
      "evidenceClass",
      "selectedSceneRequestBindingDigestSha256",
      "promptMaterializationDigestSha256",
      "promptMaterializationUnitDigestSha256",
      "materializationUnitId",
      "requestUnitId",
      "sceneId",
      "outputKey",
      "approvedWorkItemId",
      "approvedWorkItemKey",
      "approvedPlannedAssetManifestEntryId",
      "confirmedOutputFrameExpectationDigestSha256",
      "modelArtifacts",
      "inputImageArtifacts",
      "artifactSetDigestSha256",
      "fixedRuntimeExpectation",
      "callerArtifactPacketAccepted",
      "callerModelOrImageBytesAccepted",
      "callerPromptSeedDimensionModelPathUrlCredentialCommandOrEnvironmentAccepted",
      "operationAuthority",
      "dispatchAuthority",
      "runtimeAuthority",
      "productionReady",
      "artifactPacketDigestSha256",
    ]) ||
    value.packetClass !==
      "server_owned_selected_scene_comfyui_operation_artifact_packet_v1" ||
    value.evidenceClass !==
      "controlled_non_executable_selected_scene_operation_artifact_packet" ||
    !Array.isArray(value.modelArtifacts) ||
    !Array.isArray(value.inputImageArtifacts) ||
    typeof value.artifactSetDigestSha256 !== "string" ||
    typeof value.artifactPacketDigestSha256 !== "string"
  )
    throw invalid("artifact_packet_invalid", "$.artifactPacket");
  const { artifactPacketDigestSha256, ...packetDraft } = value;
  if (
    !SHA256.test(artifactPacketDigestSha256) ||
    digest(packetDraft) !== artifactPacketDigestSha256
  )
    throw invalid(
      "artifact_packet_digest_mismatch",
      "$.artifactPacket.artifactPacketDigestSha256",
    );
  if (
    value.selectedSceneRequestBindingDigestSha256 !==
      input.selectedSceneRequest.requestBindingDigestSha256 ||
    value.promptMaterializationDigestSha256 !==
      input.promptMaterialization.materializationDigestSha256 ||
    value.promptMaterializationUnitDigestSha256 !==
      unit.materializationUnitDigestSha256 ||
    value.materializationUnitId !== unit.materializationUnitId ||
    value.requestUnitId !== requestUnit.requestUnitId ||
    value.sceneId !== requestUnit.sceneId ||
    value.outputKey !== requestUnit.outputKey ||
    value.approvedWorkItemId !== requestUnit.approvedWorkItemId ||
    value.approvedWorkItemKey !== requestUnit.approvedWorkItemKey ||
    value.approvedPlannedAssetManifestEntryId !==
      requestUnit.approvedPlannedAssetManifestEntryId ||
    value.confirmedOutputFrameExpectationDigestSha256 !==
      requestUnit.generationCanvas.finalOutputFrameExpectationDigestSha256
  )
    throw invalid(
      "cross_scene_work_item_or_output_substitution",
      "$.artifactPacket",
    );
  const modelArtifacts = value.modelArtifacts.map((artifact, order) =>
    assertModelArtifact(artifact, order),
  );
  const inputImageArtifacts = value.inputImageArtifacts.map((artifact, order) =>
    assertInputImageArtifact(artifact, MODEL_ROLE_BINDINGS.length + order),
  );
  if (
    digest({
      modelArtifacts,
      inputImageArtifacts,
    }) !== value.artifactSetDigestSha256
  )
    throw invalid(
      "artifact_packet_digest_mismatch",
      "$.artifactPacket.artifactSetDigestSha256",
    );
  assertModelArtifactSet(modelArtifacts, unit);
  assertInputImageArtifactSet(inputImageArtifacts, unit);
  assertFixedRuntimeExpectation(value.fixedRuntimeExpectation);
  if (
    value.callerArtifactPacketAccepted !== false ||
    value.callerModelOrImageBytesAccepted !== false ||
    value.callerPromptSeedDimensionModelPathUrlCredentialCommandOrEnvironmentAccepted !==
      false ||
    value.operationAuthority !== false ||
    value.dispatchAuthority !== false ||
    value.runtimeAuthority !== false ||
    value.productionReady !== false
  )
    throw invalid("authority_promotion_forbidden", "$.artifactPacket");
  return deepFreeze({
    ...packetDraft,
    modelArtifacts,
    inputImageArtifacts,
    artifactPacketDigestSha256,
  } as unknown as
    LivingFrameControlledImageSelectedScenePrivateOperationArtifactPacket);
}

function assertModelArtifact(
  value: unknown,
  order: number,
): LivingFrameControlledImageSelectedScenePrivateOperationModelArtifact {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "order",
      "role",
      "slotKind",
      "artifactRecordId",
      "artifactContentSha256",
      "artifactByteLength",
      "artifactSourceBindingDigestSha256",
      "privateAlias",
      "readOnlyMountRequired",
    ])
  )
    throw invalid(
      "model_artifact_set_invalid",
      `$.artifactPacket.modelArtifacts.${order}`,
    );
  const expected = MODEL_ROLE_BINDINGS[order];
  if (
    !expected ||
    value.order !== order ||
    value.role !== expected.role ||
    value.slotKind !== expected.slotKind
  )
    throw invalid(
      "model_artifact_set_invalid",
      `$.artifactPacket.modelArtifacts.${order}`,
    );
  assertArtifactCommon(value, "model", order);
  return value as unknown as LivingFrameControlledImageSelectedScenePrivateOperationModelArtifact;
}

function assertInputImageArtifact(
  value: unknown,
  order: number,
): LivingFrameControlledImageSelectedScenePrivateOperationInputImageArtifact {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "order",
      "promptSlotOrder",
      "slotKind",
      "artifactRecordId",
      "artifactContentSha256",
      "artifactByteLength",
      "artifactSourceBindingDigestSha256",
      "privateAlias",
      "readOnlyMountRequired",
    ]) ||
    value.order !== order ||
    !Number.isInteger(value.promptSlotOrder) ||
    !["control_image_artifact", "reference_image_artifact"].includes(
      String(value.slotKind),
    )
  )
    throw invalid(
      "input_image_artifact_set_invalid",
      `$.artifactPacket.inputImageArtifacts.${order}`,
    );
  assertArtifactCommon(value, "image", order);
  return value as unknown as LivingFrameControlledImageSelectedScenePrivateOperationInputImageArtifact;
}

function assertArtifactCommon(
  value: Record<string, unknown>,
  aliasKind: "model" | "image",
  order: number,
): void {
  if (
    typeof value.artifactRecordId !== "string" ||
    !SAFE_ID.test(value.artifactRecordId) ||
    URL_LIKE.test(value.artifactRecordId) ||
    SECRET_LIKE.test(value.artifactRecordId) ||
    typeof value.artifactContentSha256 !== "string" ||
    !SHA256.test(value.artifactContentSha256) ||
    typeof value.artifactByteLength !== "number" ||
    !Number.isSafeInteger(value.artifactByteLength) ||
    value.artifactByteLength < 1 ||
    value.artifactByteLength > MAX_ARTIFACT_BYTES ||
    typeof value.artifactSourceBindingDigestSha256 !== "string" ||
    !SHA256.test(value.artifactSourceBindingDigestSha256) ||
    typeof value.privateAlias !== "string" ||
    !validPrivateAlias(value.privateAlias, aliasKind) ||
    value.readOnlyMountRequired !== true
  )
    throw invalid(
      "private_alias_invalid",
      `$.artifactPacket.artifacts.${order}`,
    );
}

function assertModelArtifactSet(
  artifacts: readonly LivingFrameControlledImageSelectedScenePrivateOperationModelArtifact[],
  unit: LivingFrameControlledImageSelectedScenePrivatePromptMaterializationUnit,
): void {
  if (
    artifacts.length !== 5 ||
    new Set(artifacts.map((artifact) => artifact.role)).size !== 5 ||
    new Set(artifacts.map((artifact) => artifact.slotKind)).size !== 5 ||
    new Set(artifacts.map((artifact) => artifact.artifactRecordId)).size !==
      5 ||
    new Set(artifacts.map((artifact) => artifact.privateAlias)).size !== 5 ||
    artifacts.reduce(
      (total, artifact) => total + artifact.artifactByteLength,
      0,
    ) !== EXACT_MODEL_ARTIFACT_BYTE_LENGTH ||
    canonicalJson(artifacts.map((artifact) => artifact.role)) !==
      canonicalJson(LIVING_FRAME_CONTROLLED_MODEL_FAMILY_ROLES) ||
    unit.atomicModelMountPolicy.exactModelRoleCount !== 5 ||
    unit.atomicModelMountPolicy.exactModelArtifactByteLength !==
      EXACT_MODEL_ARTIFACT_BYTE_LENGTH ||
    unit.atomicModelMountPolicy.allRolesMountedReadOnlyForAttempt !== true ||
    unit.atomicModelMountPolicy.allRolesVerifiedBeforeAndAfterInference !== true
  )
    throw invalid(
      "model_artifact_set_invalid",
      "$.artifactPacket.modelArtifacts",
    );
  const usedModelSlots = unit.privatePromptRequest.slotReceipts.filter(
    (slot) => slot.valueClass === "private_model_alias",
  );
  for (const slot of usedModelSlots) {
    const matches = artifacts.filter(
      (artifact) => artifact.slotKind === slot.slotKind,
    );
    if (
      matches.length !== 1 ||
      digest(matches[0]!.privateAlias) !== slot.valueDigestSha256 ||
      Buffer.byteLength(matches[0]!.privateAlias, "utf8") !==
        slot.valueByteLength
    )
      throw invalid(
        "model_artifact_set_invalid",
        "$.artifactPacket.modelArtifacts",
      );
  }
}

function assertInputImageArtifactSet(
  artifacts: readonly LivingFrameControlledImageSelectedScenePrivateOperationInputImageArtifact[],
  unit: LivingFrameControlledImageSelectedScenePrivatePromptMaterializationUnit,
): void {
  const expected = unit.privatePromptRequest.slotReceipts.filter(
    (slot) => slot.valueClass === "private_image_alias",
  );
  if (
    artifacts.length !== expected.length ||
    artifacts.length > 2 ||
    new Set(artifacts.map((artifact) => artifact.slotKind)).size !==
      artifacts.length ||
    new Set(artifacts.map((artifact) => artifact.artifactRecordId)).size !==
      artifacts.length ||
    new Set(artifacts.map((artifact) => artifact.privateAlias)).size !==
      artifacts.length
  )
    throw invalid(
      "input_image_artifact_set_invalid",
      "$.artifactPacket.inputImageArtifacts",
    );
  artifacts.forEach((artifact, order) => {
    const expectedSlot = expected[order];
    if (
      !expectedSlot ||
      artifact.promptSlotOrder !== expectedSlot.order ||
      artifact.slotKind !== expectedSlot.slotKind ||
      digest(artifact.privateAlias) !== expectedSlot.valueDigestSha256 ||
      Buffer.byteLength(artifact.privateAlias, "utf8") !==
        expectedSlot.valueByteLength
    )
      throw invalid(
        "input_image_artifact_set_invalid",
        `$.artifactPacket.inputImageArtifacts.${order}`,
      );
  });
}

function assertFixedRuntimeExpectation(value: unknown): void {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "processEntrypointKind",
      "runtimeRegion",
      "accelerator",
      "gpuCount",
      "cpuFallbackAllowed",
      "runtimeConfinementRequirementDigestSha256",
      "deniedTopLevelImports",
      "externalNetworkAllowed",
      "runtimeDownloadsAllowed",
      "atomicFiveModelReadOnlyMountRequired",
      "verifyAllFiveModelsBeforeAndAfterInference",
      "oneProcessPerAttemptRequired",
    ]) ||
    value.processEntrypointKind !== "fixed_supervised_python_process" ||
    value.runtimeRegion !== "europe-west1" ||
    value.accelerator !== "nvidia_l4" ||
    value.gpuCount !== 1 ||
    value.cpuFallbackAllowed !== false ||
    value.runtimeConfinementRequirementDigestSha256 !==
      LIVING_FRAME_COMFYUI_RUNTIME_CONFINEMENT_REQUIREMENT_DIGEST_SHA256 ||
    !Array.isArray(value.deniedTopLevelImports) ||
    value.deniedTopLevelImports.length !== 1 ||
    value.deniedTopLevelImports[0] !== "sam2" ||
    value.externalNetworkAllowed !== false ||
    value.runtimeDownloadsAllowed !== false ||
    value.atomicFiveModelReadOnlyMountRequired !== true ||
    value.verifyAllFiveModelsBeforeAndAfterInference !== true ||
    value.oneProcessPerAttemptRequired !== true
  )
    throw invalid(
      "fixed_runtime_policy_invalid",
      "$.artifactPacket.fixedRuntimeExpectation",
    );
}

function assertPrivatePromptRequest(
  request: LivingFrameControlledImageSelectedScenePrivatePromptRequest,
  unit: LivingFrameControlledImageSelectedScenePrivatePromptMaterializationUnit,
  requestUnit: LivingFrameControlledImageSelectedSceneRequestUnit,
): void {
  if (
    request.requestClass !==
      "selected_scene_private_comfyui_prompt_request_v1" ||
    request.materializationUnitId !== unit.materializationUnitId ||
    request.requestUnitId !== unit.requestUnitId ||
    request.sceneId !== requestUnit.sceneId ||
    request.outputKey !== requestUnit.outputKey ||
    request.approvedWorkItemId !== requestUnit.approvedWorkItemId ||
    request.approvedWorkItemKey !== requestUnit.approvedWorkItemKey ||
    request.approvedPlannedAssetManifestEntryId !==
      requestUnit.approvedPlannedAssetManifestEntryId ||
    request.widthPixels !== unit.generationCanvas.widthPixels ||
    request.heightPixels !== unit.generationCanvas.heightPixels ||
    request.outputContentType !== "image/png" ||
    request.outputImageCount !== 1 ||
    Object.keys(request.prompt).length !==
      unit.privatePromptRequest.nodeCount ||
    digest(request) !== unit.privatePromptRequest.promptRequestDigestSha256 ||
    request.dispatchAuthority !== false ||
    request.runtimeAuthority !== false ||
    request.finalCanvasAuthority !== false ||
    request.productionReady !== false
  )
    throw invalid(
      "private_prompt_lineage_invalid",
      "$.privatePromptRequestLease",
    );
  assertGenerationCanvas(unit, requestUnit);
}

function assertGenerationCanvas(
  unit: LivingFrameControlledImageSelectedScenePrivatePromptMaterializationUnit,
  requestUnit: LivingFrameControlledImageSelectedSceneRequestUnit,
): void {
  const canvas = unit.generationCanvas;
  const fullFrame = canvas.canvasClass === "confirmed_full_frame_ratio";
  if (
    canvas.widthPixels < 64 ||
    canvas.heightPixels < 64 ||
    canvas.confirmedOutputFrameExpectationDigestSha256 !==
      requestUnit.generationCanvas.finalOutputFrameExpectationDigestSha256 ||
    canvas.callerSelectedDimensionsAllowed !== false ||
    canvas.squareSubstitutionApplied !== false ||
    canvas.finalCanvasCreatedByComfyUi !== false ||
    (fullFrame &&
      (canvas.widthPixels !==
        requestUnit.generationCanvas.finalOutputFrameWidthPixels ||
        canvas.heightPixels !==
          requestUnit.generationCanvas.finalOutputFrameHeightPixels ||
        unit.fullFrameRatioExtensionUnitId === null ||
        unit.fullFrameRatioExtensionUnitDigestSha256 === null)) ||
    (!fullFrame &&
      (canvas.canvasClass !== "isolated_component_square_1024" ||
        canvas.widthPixels !== 1_024 ||
        canvas.heightPixels !== 1_024 ||
        unit.fullFrameRatioExtensionUnitId !== null ||
        unit.fullFrameRatioExtensionUnitDigestSha256 !== null))
  )
    throw invalid("generation_canvas_invalid", "$.generationCanvas");
}

function assertPromptArtifactBindings(
  prompt: LivingFrameControlledImageSelectedScenePrivateComfyUiPrompt,
  unit: LivingFrameControlledImageSelectedScenePrivatePromptMaterializationUnit,
  packet: LivingFrameControlledImageSelectedScenePrivateOperationArtifactPacket,
): void {
  const strings: string[] = [];
  walkValues(prompt, (value) => {
    if (typeof value === "string") strings.push(value);
  });
  const usedSlots = new Set(
    unit.privatePromptRequest.slotReceipts
      .filter((slot) => slot.valueClass !== "private_conditioning_text")
      .map((slot) => slot.slotKind),
  );
  for (const artifact of packet.modelArtifacts) {
    const appearances = strings.filter(
      (value) => value === artifact.privateAlias,
    ).length;
    if (appearances !== (usedSlots.has(artifact.slotKind) ? 1 : 0))
      throw invalid(
        "model_artifact_set_invalid",
        "$.artifactPacket.modelArtifacts",
      );
  }
  for (const artifact of packet.inputImageArtifacts) {
    if (strings.filter((value) => value === artifact.privateAlias).length !== 1)
      throw invalid(
        "input_image_artifact_set_invalid",
        "$.artifactPacket.inputImageArtifacts",
      );
  }
}

function compilePrivateOperationRequest(input: {
  readonly operationRequestReceiptId: string;
  readonly materializationUnit: LivingFrameControlledImageSelectedScenePrivatePromptMaterializationUnit;
  readonly privatePromptRequest: LivingFrameControlledImageSelectedScenePrivatePromptRequest;
  readonly packet: LivingFrameControlledImageSelectedScenePrivateOperationArtifactPacket;
}): LivingFrameControlledImageSelectedScenePrivateOperationRequest {
  const modelBindings = input.packet.modelArtifacts.map((artifact) => ({
    order: artifact.order,
    artifactClass: "canonical_model_artifact" as const,
    modelRole: artifact.role,
    slotKind: artifact.slotKind,
    artifactRecordId: artifact.artifactRecordId,
    artifactContentSha256: artifact.artifactContentSha256,
    artifactSourceBindingDigestSha256:
      artifact.artifactSourceBindingDigestSha256,
    privateAlias: artifact.privateAlias,
    readOnlyMountRequired: true as const,
  }));
  const imageBindings = input.packet.inputImageArtifacts.map((artifact) => ({
    order: artifact.order,
    artifactClass: "private_selected_scene_input_image_artifact" as const,
    modelRole: null,
    slotKind: artifact.slotKind,
    artifactRecordId: artifact.artifactRecordId,
    artifactContentSha256: artifact.artifactContentSha256,
    artifactSourceBindingDigestSha256:
      artifact.artifactSourceBindingDigestSha256,
    privateAlias: artifact.privateAlias,
    readOnlyMountRequired: true as const,
  }));
  return deepFreeze({
    requestClass: "selected_scene_private_comfyui_operation_request_v1",
    protocolVersion:
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OPERATION_REQUEST_VERSION,
    requestId: input.operationRequestReceiptId,
    clientId: `lf-selected-client.${digest(
      input.operationRequestReceiptId,
    ).slice(0, 40)}`,
    exactOutputLineage: {
      materializationUnitId: input.materializationUnit.materializationUnitId,
      requestUnitId: input.materializationUnit.requestUnitId,
      sceneId: input.materializationUnit.sceneId,
      outputKey: input.materializationUnit.outputKey,
      approvedWorkItemId: input.materializationUnit.approvedWorkItemId,
      approvedWorkItemKey: input.materializationUnit.approvedWorkItemKey,
      approvedPlannedAssetManifestEntryId:
        input.materializationUnit.approvedPlannedAssetManifestEntryId,
    },
    expectedOperation: {
      canonicalToolId: "comfyui",
      operationId: "tool.comfyui.generate_controlled_image.v1",
    },
    prompt: input.privatePromptRequest.prompt,
    artifactMountBindings: [...modelBindings, ...imageBindings],
    outputExpectation: {
      transport: "websocket_image_output",
      contentType: "image/png",
      widthPixels: input.materializationUnit.generationCanvas.widthPixels,
      heightPixels: input.materializationUnit.generationCanvas.heightPixels,
      imageCount: 1,
      finalCanvasCreatedByComfyUi: false,
    },
    fixedRuntimePolicy: {
      processEntrypointKind: "fixed_supervised_python_process",
      runtimeRegion: "europe-west1",
      accelerator: "nvidia_l4",
      gpuCount: 1,
      cpuFallbackAllowed: false,
      runtimeConfinementRequirementDigestSha256:
        LIVING_FRAME_COMFYUI_RUNTIME_CONFINEMENT_REQUIREMENT_DIGEST_SHA256,
      deniedTopLevelImports: ["sam2"],
      externalNetworkAllowed: false,
      runtimeDownloadsAllowed: false,
      atomicFiveModelReadOnlyMountRequired: true,
      verifyAllFiveModelsBeforeAndAfterInference: true,
      oneProcessPerAttemptRequired: true,
      callerCommandArgumentsEnvironmentPathUrlOrCredentialAllowed: false,
    },
    costEventExpectation: {
      costComponentId: "shared_controlled_illustration_gpu_host",
      sharedGpuCapabilityKeys: [
        "comfyui",
        "comfyui_controlnet_aux",
        "controlnet",
        "ip_adapter",
        "peft_lora",
      ],
      separateCpuQaCapabilityKey: "auraface",
      oneRequestEqualsOneGpuAttempt: true,
      fiveGpuCapabilitiesShareAttemptLifetime: true,
      fiveGpuCapabilitiesCreateOneAttemptCostEvent: true,
      auraFaceCpuMeasurementExcluded: true,
      exactReuseCreatesNoNewGpuAttempt: true,
      failedOrUnknownAttemptCostMustBeRetained: true,
    },
    operationRegistered: false,
    dispatchAuthority: false,
    workerLeaseAuthority: false,
    runtimeAuthority: false,
    assetAuthority: false,
    finalCanvasAuthority: false,
    productionReady: false,
  });
}

function compileReceiptDraft(input: {
  readonly input: CreateLivingFrameControlledImageSelectedScenePrivateOperationRequestInput;
  readonly materializationUnit: LivingFrameControlledImageSelectedScenePrivatePromptMaterializationUnit;
  readonly requestUnit: LivingFrameControlledImageSelectedSceneRequestUnit;
  readonly packet: LivingFrameControlledImageSelectedScenePrivateOperationArtifactPacket;
  readonly operationRequestReceiptId: string;
  readonly leaseId: string;
  readonly privateOperationRequestDigestSha256: string;
  readonly serializedOperationRequestByteLength: number;
}): LivingFrameControlledImageSelectedScenePrivateOperationRequestReceiptDraft {
  const request = input.input.selectedSceneRequest;
  const unit = input.materializationUnit;
  const artifacts = [
    ...input.packet.modelArtifacts.map((artifact) => ({
      order: artifact.order,
      artifactClass: "canonical_model_artifact" as const,
      modelRole: artifact.role,
      slotKind: artifact.slotKind,
      artifactRecordId: artifact.artifactRecordId,
      artifactContentSha256: artifact.artifactContentSha256,
      artifactByteLength: artifact.artifactByteLength,
      artifactSourceBindingDigestSha256:
        artifact.artifactSourceBindingDigestSha256,
      privateAliasDigestSha256: digest(artifact.privateAlias),
      privateAliasIncluded: false as const,
      artifactBytesIncluded: false as const,
      pathOrUrlIncluded: false as const,
      readOnlyMountRequired: true as const,
    })),
    ...input.packet.inputImageArtifacts.map((artifact) => ({
      order: artifact.order,
      artifactClass: "private_selected_scene_input_image_artifact" as const,
      modelRole: null,
      slotKind: artifact.slotKind,
      artifactRecordId: artifact.artifactRecordId,
      artifactContentSha256: artifact.artifactContentSha256,
      artifactByteLength: artifact.artifactByteLength,
      artifactSourceBindingDigestSha256:
        artifact.artifactSourceBindingDigestSha256,
      privateAliasDigestSha256: digest(artifact.privateAlias),
      privateAliasIncluded: false as const,
      artifactBytesIncluded: false as const,
      pathOrUrlIncluded: false as const,
      readOnlyMountRequired: true as const,
    })),
  ] satisfies LivingFrameControlledImageSelectedScenePrivateOperationArtifactReceipt[];
  return deepFreeze({
    contractVersion:
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OPERATION_REQUEST_VERSION,
    resultClass:
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OPERATION_REQUEST_CLASS,
    requestState:
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OPERATION_REQUEST_STATE,
    operationRequestReceiptId: input.operationRequestReceiptId,
    serverOwnedArtifactLocatorId: input.input.serverOwnedArtifactLocatorId,
    canonicalScope: request.canonicalScope,
    exactOutputLineage: {
      materializationUnitId: unit.materializationUnitId,
      requestUnitId: unit.requestUnitId,
      requestUnitDigestSha256: unit.requestUnitDigestSha256,
      componentId: unit.componentId,
      outputKey: unit.outputKey,
      approvedWorkItemId: unit.approvedWorkItemId,
      approvedWorkItemKey: unit.approvedWorkItemKey,
      approvedPlannedAssetManifestEntryId:
        unit.approvedPlannedAssetManifestEntryId,
      rendererLayerId: unit.rendererLayerId,
    },
    sourceBindings: {
      selectedSceneRequestBindingDigestSha256:
        request.requestBindingDigestSha256,
      fullFrameRatioExtensionDigestSha256:
        input.input.fullFrameRatioExtension.extensionDigestSha256,
      admissionCandidateDigestSha256:
        input.input.admissionCandidate.candidateDigestSha256,
      promptMaterializationDigestSha256:
        input.input.promptMaterialization.materializationDigestSha256,
      promptMaterializationUnitDigestSha256:
        unit.materializationUnitDigestSha256,
      privatePromptRequestDigestSha256:
        unit.privatePromptRequest.promptRequestDigestSha256,
      privatePromptRequestLeaseId: unit.privatePromptRequest.leaseId,
      approvedSnapshotId: request.sourceBindings.approvedSnapshotId,
      approvedSnapshotHashSha256:
        request.sourceBindings.approvedSnapshotHashSha256,
      selectedSceneBindingDigestSha256:
        request.sourceBindings.selectedSceneBindingDigestSha256,
      visualContinuityPackDigestSha256:
        request.sourceBindings.visualContinuityPackDigestSha256,
      currentMasterTimingDigestSha256:
        request.sourceBindings.currentMasterTimingDigestSha256,
      canonicalWorkGraphProjectionDigestSha256:
        request.sourceBindings.canonicalWorkGraphProjectionDigestSha256,
      plannedAssetAndApprovedOutputLineageDigestSha256:
        request.sourceBindings.estimateWorkAssetProjectionDigestSha256,
      controlledIllustrationCostWorkBindingDigestSha256:
        request.sourceBindings
          .controlledIllustrationCostWorkBindingDigestSha256,
      confirmedOutputFrameExpectationDigestSha256:
        request.sourceBindings.outputFrameExpectationDigestSha256,
      fullFrameRatioExtensionUnitDigestSha256:
        unit.fullFrameRatioExtensionUnitDigestSha256,
      artifactSetDigestSha256: input.packet.artifactSetDigestSha256,
      artifactPacketDigestSha256: input.packet.artifactPacketDigestSha256,
    },
    graphProfile: {
      qualifiedGraphFamily: "controlled_sdxl_selected_scene_v1",
      enabledFeatures: unit.graphProfile.enabledFeatures,
      graphTopologyDigestSha256: unit.graphProfile.graphTopologyDigestSha256,
      benchmarkCaseOrRecipeUsed: false,
      faceIdOrInsightFaceAllowed: false,
      inGraphPreprocessorAllowed: false,
      arbitrarySaveOrPreviewNodeAllowed: false,
      websocketOutputOnly: true,
    },
    generationCanvas: {
      canvasClass: unit.generationCanvas.canvasClass,
      widthPixels: unit.generationCanvas.widthPixels,
      heightPixels: unit.generationCanvas.heightPixels,
      confirmedOutputFrameExpectationDigestSha256:
        unit.generationCanvas.confirmedOutputFrameExpectationDigestSha256,
      callerSelectedDimensionsAllowed: false,
      squareSubstitutionApplied: false,
      finalCanvasCreatedByComfyUi: false,
    },
    operationExpectation: {
      expectedCanonicalToolId: "comfyui",
      expectedCanonicalOperationId: "tool.comfyui.generate_controlled_image.v1",
      sharedWorkerType: "gpu_ai_worker",
      executionTarget: "google_cloud_run_gpu",
      runtimeRegion: "europe-west1",
      accelerator: "nvidia_l4",
      gpuCount: 1,
      cpuFallbackAllowed: false,
    },
    fixedRuntimePolicy: {
      processEntrypointKind: "fixed_supervised_python_process",
      runtimeConfinementRequirementDigestSha256:
        LIVING_FRAME_COMFYUI_RUNTIME_CONFINEMENT_REQUIREMENT_DIGEST_SHA256,
      deniedTopLevelImports: ["sam2"],
      nonRootRequired: true,
      readOnlyRootFilesystemRequired: true,
      allLinuxCapabilitiesDroppedRequired: true,
      noNewPrivilegesRequired: true,
      externalNetworkAllowed: false,
      runtimeDownloadsAllowed: false,
      allFiveModelRolesMountedReadOnlyForAttempt: true,
      allFiveModelRolesVerifiedBeforeAndAfterInference: true,
      oneProcessPerAttemptRequired: true,
      callerCommandArgumentsEnvironmentPathUrlOrCredentialAllowed: false,
    },
    requestSummary: {
      privateOperationRequestLeaseId: input.leaseId,
      privateOperationRequestDigestSha256:
        input.privateOperationRequestDigestSha256,
      serializedOperationRequestByteLength:
        input.serializedOperationRequestByteLength,
      promptNodeCount: unit.privatePromptRequest.nodeCount,
      exactModelArtifactCount: 5,
      exactModelArtifactByteLength: EXACT_MODEL_ARTIFACT_BYTE_LENGTH,
      inputImageArtifactCount: input.packet.inputImageArtifacts.length,
      artifactReceipts: artifacts,
      outputContentType: "image/png",
      outputImageCount: 1,
      websocketImageOutputRequired: true,
      privateOperationRequestIncludedInReceipt: false,
      privatePromptIncludedInReceipt: false,
    },
    attemptAndCostBinding: {
      costComponentId: "shared_controlled_illustration_gpu_host",
      sharedGpuCapabilityKeys: [
        "comfyui",
        "comfyui_controlnet_aux",
        "controlnet",
        "ip_adapter",
        "peft_lora",
      ],
      separateCpuQaCapabilityKey: "auraface",
      oneOperationRequestRepresentsOneGpuAttempt: true,
      oneMaterializationUnitRepresentsOneApprovedOutput: true,
      outputBatchingAllowed: false,
      fiveGpuCapabilitiesShareAttemptLifetime: true,
      fiveGpuCapabilitiesCreateOneAttemptCostEvent: true,
      auraFaceExcludedFromGpuAttempt: true,
      exactReuseCreatesNoNewGpuAttempt: true,
      failedOrUnknownAttemptCostMustBeRetained: true,
      actualWorkerResourceCostEvidenceRequired: true,
      costAmountIncluded: false,
      customerCreditAmountIncluded: false,
      serviceFeeIncluded: false,
    },
    registryPolicy: {
      currentObservedCountIsProductCap: false,
      registryExpansionPermitted: true,
      postAdmissionCountDerivedFromReleasedDistinctIdentities: true,
      oneComfyUiIdentityForSharedGpuAttempt: true,
      fakeIdentityForModelWeightAdapterLibraryOrPreprocessorAllowed: false,
      auraFaceMayUseDistinctReleasedCpuQaIdentity: true,
    },
    openGateCodes:
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OPERATION_REQUEST_OPEN_GATES,
    authorityBoundary: AUTHORITY_BOUNDARY,
    selectedSceneRequestRevalidated: true,
    fullFrameRatioExtensionRevalidated: true,
    admissionCandidateRevalidated: true,
    promptMaterializationRevalidated: true,
    exactSelectedOutputLineageRevalidated: true,
    privatePromptRequestLeaseConsumedExactlyOnce: true,
    artifactPacketReadThroughProcessBoundPort: true,
    exactFiveModelArtifactsBound: true,
    exactPrivateInputImageArtifactsBound: true,
    privateOperationRequestLeaseCreated: true,
    benchmarkPromptOrRuntimePathUsed: false,
    operationRegistered: false,
    dispatchGranted: false,
    workerLeaseCreated: false,
    gpuAttemptCreated: false,
    runtimeExecuted: false,
    actualCostReceiptCreated: false,
    assetCreated: false,
    assetManifestMutated: false,
    approvalPromoted: false,
    finalCanvasClaimAllowed: false,
    containsRawPromptAliasPathUrlModelBytesCredentialCommandOrEnvironment: false,
    containsPriceCreditServiceFeeReservationWalletOrLedgerData: false,
    productionReady: false,
  });
}

function assertReceiptSemantics(
  draft: LivingFrameControlledImageSelectedScenePrivateOperationRequestReceiptDraft,
): void {
  if (
    !isRecord(draft) ||
    !hasExactKeys(draft as unknown as Record<string, unknown>, [
      "contractVersion",
      "resultClass",
      "requestState",
      "operationRequestReceiptId",
      "serverOwnedArtifactLocatorId",
      "canonicalScope",
      "exactOutputLineage",
      "sourceBindings",
      "graphProfile",
      "generationCanvas",
      "operationExpectation",
      "fixedRuntimePolicy",
      "requestSummary",
      "attemptAndCostBinding",
      "registryPolicy",
      "openGateCodes",
      "authorityBoundary",
      "selectedSceneRequestRevalidated",
      "fullFrameRatioExtensionRevalidated",
      "admissionCandidateRevalidated",
      "promptMaterializationRevalidated",
      "exactSelectedOutputLineageRevalidated",
      "privatePromptRequestLeaseConsumedExactlyOnce",
      "artifactPacketReadThroughProcessBoundPort",
      "exactFiveModelArtifactsBound",
      "exactPrivateInputImageArtifactsBound",
      "privateOperationRequestLeaseCreated",
      "benchmarkPromptOrRuntimePathUsed",
      "operationRegistered",
      "dispatchGranted",
      "workerLeaseCreated",
      "gpuAttemptCreated",
      "runtimeExecuted",
      "actualCostReceiptCreated",
      "assetCreated",
      "assetManifestMutated",
      "approvalPromoted",
      "finalCanvasClaimAllowed",
      "containsRawPromptAliasPathUrlModelBytesCredentialCommandOrEnvironment",
      "containsPriceCreditServiceFeeReservationWalletOrLedgerData",
      "productionReady",
    ]) ||
    !receiptNestedKeysValid(draft) ||
    !receiptIdentifiersAndDigestsValid(draft) ||
    draft.contractVersion !==
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OPERATION_REQUEST_VERSION ||
    draft.resultClass !==
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OPERATION_REQUEST_CLASS ||
    draft.requestState !==
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OPERATION_REQUEST_STATE ||
    !SAFE_ID.test(draft.operationRequestReceiptId) ||
    !SAFE_ID.test(draft.serverOwnedArtifactLocatorId) ||
    draft.graphProfile.qualifiedGraphFamily !==
      "controlled_sdxl_selected_scene_v1" ||
    draft.graphProfile.benchmarkCaseOrRecipeUsed !== false ||
    draft.graphProfile.faceIdOrInsightFaceAllowed !== false ||
    draft.graphProfile.inGraphPreprocessorAllowed !== false ||
    draft.graphProfile.arbitrarySaveOrPreviewNodeAllowed !== false ||
    draft.graphProfile.websocketOutputOnly !== true ||
    draft.graphProfile.enabledFeatures.length < 1 ||
    draft.graphProfile.enabledFeatures[0] !== "base" ||
    new Set(draft.graphProfile.enabledFeatures).size !==
      draft.graphProfile.enabledFeatures.length ||
    draft.graphProfile.enabledFeatures.some(
      (feature) =>
        !["base", "lora", "controlnet", "generic_ipadapter"].includes(
          feature,
        ),
    ) ||
    draft.operationExpectation.expectedCanonicalToolId !== "comfyui" ||
    draft.operationExpectation.expectedCanonicalOperationId !==
      "tool.comfyui.generate_controlled_image.v1" ||
    draft.operationExpectation.sharedWorkerType !== "gpu_ai_worker" ||
    draft.operationExpectation.executionTarget !== "google_cloud_run_gpu" ||
    draft.operationExpectation.runtimeRegion !== "europe-west1" ||
    draft.operationExpectation.accelerator !== "nvidia_l4" ||
    draft.operationExpectation.gpuCount !== 1 ||
    draft.operationExpectation.cpuFallbackAllowed !== false ||
    draft.fixedRuntimePolicy.processEntrypointKind !==
      "fixed_supervised_python_process" ||
    draft.fixedRuntimePolicy.runtimeConfinementRequirementDigestSha256 !==
      LIVING_FRAME_COMFYUI_RUNTIME_CONFINEMENT_REQUIREMENT_DIGEST_SHA256 ||
    canonicalJson(draft.fixedRuntimePolicy.deniedTopLevelImports) !==
      canonicalJson(["sam2"]) ||
    draft.fixedRuntimePolicy.externalNetworkAllowed !== false ||
    draft.fixedRuntimePolicy.runtimeDownloadsAllowed !== false ||
    draft.fixedRuntimePolicy.nonRootRequired !== true ||
    draft.fixedRuntimePolicy.readOnlyRootFilesystemRequired !== true ||
    draft.fixedRuntimePolicy.allLinuxCapabilitiesDroppedRequired !== true ||
    draft.fixedRuntimePolicy.noNewPrivilegesRequired !== true ||
    draft.fixedRuntimePolicy.allFiveModelRolesMountedReadOnlyForAttempt !==
      true ||
    draft.fixedRuntimePolicy
      .allFiveModelRolesVerifiedBeforeAndAfterInference !== true ||
    draft.fixedRuntimePolicy.oneProcessPerAttemptRequired !== true ||
    draft.fixedRuntimePolicy
      .callerCommandArgumentsEnvironmentPathUrlOrCredentialAllowed !== false ||
    draft.requestSummary.exactModelArtifactCount !== 5 ||
    draft.requestSummary.exactModelArtifactByteLength !==
      EXACT_MODEL_ARTIFACT_BYTE_LENGTH ||
    draft.requestSummary.inputImageArtifactCount < 0 ||
    draft.requestSummary.inputImageArtifactCount > 2 ||
    draft.requestSummary.artifactReceipts.length !==
      5 + draft.requestSummary.inputImageArtifactCount ||
    draft.requestSummary.serializedOperationRequestByteLength < 2 ||
    draft.requestSummary.serializedOperationRequestByteLength >
      MAX_WIRE_REQUEST_BYTES ||
    draft.requestSummary.promptNodeCount < 1 ||
    draft.requestSummary.promptNodeCount > 64 ||
    draft.requestSummary.outputContentType !== "image/png" ||
    draft.requestSummary.outputImageCount !== 1 ||
    draft.requestSummary.websocketImageOutputRequired !== true ||
    draft.requestSummary.privateOperationRequestIncludedInReceipt !== false ||
    draft.requestSummary.privatePromptIncludedInReceipt !== false ||
    draft.generationCanvas.widthPixels < 64 ||
    draft.generationCanvas.heightPixels < 64 ||
    draft.generationCanvas.widthPixels > 16_384 ||
    draft.generationCanvas.heightPixels > 16_384 ||
    draft.generationCanvas.callerSelectedDimensionsAllowed !== false ||
    draft.generationCanvas.squareSubstitutionApplied !== false ||
    draft.generationCanvas.finalCanvasCreatedByComfyUi !== false ||
    draft.generationCanvas.confirmedOutputFrameExpectationDigestSha256 !==
      draft.sourceBindings.confirmedOutputFrameExpectationDigestSha256 ||
    (draft.generationCanvas.canvasClass === "isolated_component_square_1024" &&
      (draft.generationCanvas.widthPixels !== 1_024 ||
        draft.generationCanvas.heightPixels !== 1_024)) ||
    canonicalJson(draft.openGateCodes) !==
      canonicalJson(
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OPERATION_REQUEST_OPEN_GATES,
      ) ||
    canonicalJson(draft.authorityBoundary) !==
      canonicalJson(AUTHORITY_BOUNDARY) ||
    draft.registryPolicy.currentObservedCountIsProductCap !== false ||
    draft.registryPolicy.registryExpansionPermitted !== true ||
    draft.registryPolicy
      .postAdmissionCountDerivedFromReleasedDistinctIdentities !== true ||
    draft.registryPolicy.oneComfyUiIdentityForSharedGpuAttempt !== true ||
    draft.registryPolicy
      .fakeIdentityForModelWeightAdapterLibraryOrPreprocessorAllowed !==
      false ||
    draft.registryPolicy.auraFaceMayUseDistinctReleasedCpuQaIdentity !== true ||
    draft.attemptAndCostBinding.costComponentId !==
      "shared_controlled_illustration_gpu_host" ||
    canonicalJson(draft.attemptAndCostBinding.sharedGpuCapabilityKeys) !==
      canonicalJson([
        "comfyui",
        "comfyui_controlnet_aux",
        "controlnet",
        "ip_adapter",
        "peft_lora",
      ]) ||
    draft.attemptAndCostBinding.separateCpuQaCapabilityKey !== "auraface" ||
    draft.attemptAndCostBinding.oneOperationRequestRepresentsOneGpuAttempt !==
      true ||
    draft.attemptAndCostBinding
      .oneMaterializationUnitRepresentsOneApprovedOutput !== true ||
    draft.attemptAndCostBinding.outputBatchingAllowed !== false ||
    draft.attemptAndCostBinding.fiveGpuCapabilitiesShareAttemptLifetime !==
      true ||
    draft.attemptAndCostBinding.fiveGpuCapabilitiesShareAttemptLifetime !==
      true ||
    draft.attemptAndCostBinding.fiveGpuCapabilitiesCreateOneAttemptCostEvent !==
      true ||
    draft.attemptAndCostBinding.auraFaceExcludedFromGpuAttempt !== true ||
    draft.attemptAndCostBinding.exactReuseCreatesNoNewGpuAttempt !== true ||
    draft.attemptAndCostBinding.failedOrUnknownAttemptCostMustBeRetained !==
      true ||
    draft.attemptAndCostBinding.actualWorkerResourceCostEvidenceRequired !==
      true ||
    draft.attemptAndCostBinding.costAmountIncluded !== false ||
    draft.attemptAndCostBinding.customerCreditAmountIncluded !== false ||
    draft.attemptAndCostBinding.serviceFeeIncluded !== false ||
    draft.selectedSceneRequestRevalidated !== true ||
    draft.fullFrameRatioExtensionRevalidated !== true ||
    draft.admissionCandidateRevalidated !== true ||
    draft.promptMaterializationRevalidated !== true ||
    draft.exactSelectedOutputLineageRevalidated !== true ||
    draft.privatePromptRequestLeaseConsumedExactlyOnce !== true ||
    draft.artifactPacketReadThroughProcessBoundPort !== true ||
    draft.exactFiveModelArtifactsBound !== true ||
    draft.exactPrivateInputImageArtifactsBound !== true ||
    draft.privateOperationRequestLeaseCreated !== true ||
    draft.benchmarkPromptOrRuntimePathUsed !== false ||
    draft.operationRegistered !== false ||
    draft.dispatchGranted !== false ||
    draft.workerLeaseCreated !== false ||
    draft.gpuAttemptCreated !== false ||
    draft.runtimeExecuted !== false ||
    draft.actualCostReceiptCreated !== false ||
    draft.assetCreated !== false ||
    draft.assetManifestMutated !== false ||
    draft.approvalPromoted !== false ||
    draft.finalCanvasClaimAllowed !== false ||
    draft
      .containsRawPromptAliasPathUrlModelBytesCredentialCommandOrEnvironment !==
      false ||
    draft.containsPriceCreditServiceFeeReservationWalletOrLedgerData !==
      false ||
    draft.productionReady !== false
  )
    throw invalid("unsafe_receipt_forbidden", "$");
  assertReceiptArtifacts(draft.requestSummary.artifactReceipts);
}

function receiptNestedKeysValid(
  draft: LivingFrameControlledImageSelectedScenePrivateOperationRequestReceiptDraft,
): boolean {
  return (
    hasExactKeys(draft.canonicalScope as unknown as Record<string, unknown>, [
      "workspaceId",
      "projectId",
      "editSessionId",
      "sceneId",
    ]) &&
    hasExactKeys(
      draft.exactOutputLineage as unknown as Record<string, unknown>,
      [
        "materializationUnitId",
        "requestUnitId",
        "requestUnitDigestSha256",
        "componentId",
        "outputKey",
        "approvedWorkItemId",
        "approvedWorkItemKey",
        "approvedPlannedAssetManifestEntryId",
        "rendererLayerId",
      ],
    ) &&
    hasExactKeys(draft.sourceBindings as unknown as Record<string, unknown>, [
      "selectedSceneRequestBindingDigestSha256",
      "fullFrameRatioExtensionDigestSha256",
      "admissionCandidateDigestSha256",
      "promptMaterializationDigestSha256",
      "promptMaterializationUnitDigestSha256",
      "privatePromptRequestDigestSha256",
      "privatePromptRequestLeaseId",
      "approvedSnapshotId",
      "approvedSnapshotHashSha256",
      "selectedSceneBindingDigestSha256",
      "visualContinuityPackDigestSha256",
      "currentMasterTimingDigestSha256",
      "canonicalWorkGraphProjectionDigestSha256",
      "plannedAssetAndApprovedOutputLineageDigestSha256",
      "controlledIllustrationCostWorkBindingDigestSha256",
      "confirmedOutputFrameExpectationDigestSha256",
      "fullFrameRatioExtensionUnitDigestSha256",
      "artifactSetDigestSha256",
      "artifactPacketDigestSha256",
    ]) &&
    hasExactKeys(draft.graphProfile as unknown as Record<string, unknown>, [
      "qualifiedGraphFamily",
      "enabledFeatures",
      "graphTopologyDigestSha256",
      "benchmarkCaseOrRecipeUsed",
      "faceIdOrInsightFaceAllowed",
      "inGraphPreprocessorAllowed",
      "arbitrarySaveOrPreviewNodeAllowed",
      "websocketOutputOnly",
    ]) &&
    hasExactKeys(draft.generationCanvas as unknown as Record<string, unknown>, [
      "canvasClass",
      "widthPixels",
      "heightPixels",
      "confirmedOutputFrameExpectationDigestSha256",
      "callerSelectedDimensionsAllowed",
      "squareSubstitutionApplied",
      "finalCanvasCreatedByComfyUi",
    ]) &&
    hasExactKeys(
      draft.operationExpectation as unknown as Record<string, unknown>,
      [
        "expectedCanonicalToolId",
        "expectedCanonicalOperationId",
        "sharedWorkerType",
        "executionTarget",
        "runtimeRegion",
        "accelerator",
        "gpuCount",
        "cpuFallbackAllowed",
      ],
    ) &&
    hasExactKeys(
      draft.fixedRuntimePolicy as unknown as Record<string, unknown>,
      [
        "processEntrypointKind",
        "runtimeConfinementRequirementDigestSha256",
        "deniedTopLevelImports",
        "nonRootRequired",
        "readOnlyRootFilesystemRequired",
        "allLinuxCapabilitiesDroppedRequired",
        "noNewPrivilegesRequired",
        "externalNetworkAllowed",
        "runtimeDownloadsAllowed",
        "allFiveModelRolesMountedReadOnlyForAttempt",
        "allFiveModelRolesVerifiedBeforeAndAfterInference",
        "oneProcessPerAttemptRequired",
        "callerCommandArgumentsEnvironmentPathUrlOrCredentialAllowed",
      ],
    ) &&
    hasExactKeys(draft.requestSummary as unknown as Record<string, unknown>, [
      "privateOperationRequestLeaseId",
      "privateOperationRequestDigestSha256",
      "serializedOperationRequestByteLength",
      "promptNodeCount",
      "exactModelArtifactCount",
      "exactModelArtifactByteLength",
      "inputImageArtifactCount",
      "artifactReceipts",
      "outputContentType",
      "outputImageCount",
      "websocketImageOutputRequired",
      "privateOperationRequestIncludedInReceipt",
      "privatePromptIncludedInReceipt",
    ]) &&
    hasExactKeys(
      draft.attemptAndCostBinding as unknown as Record<string, unknown>,
      [
        "costComponentId",
        "sharedGpuCapabilityKeys",
        "separateCpuQaCapabilityKey",
        "oneOperationRequestRepresentsOneGpuAttempt",
        "oneMaterializationUnitRepresentsOneApprovedOutput",
        "outputBatchingAllowed",
        "fiveGpuCapabilitiesShareAttemptLifetime",
        "fiveGpuCapabilitiesCreateOneAttemptCostEvent",
        "auraFaceExcludedFromGpuAttempt",
        "exactReuseCreatesNoNewGpuAttempt",
        "failedOrUnknownAttemptCostMustBeRetained",
        "actualWorkerResourceCostEvidenceRequired",
        "costAmountIncluded",
        "customerCreditAmountIncluded",
        "serviceFeeIncluded",
      ],
    ) &&
    hasExactKeys(draft.registryPolicy as unknown as Record<string, unknown>, [
      "currentObservedCountIsProductCap",
      "registryExpansionPermitted",
      "postAdmissionCountDerivedFromReleasedDistinctIdentities",
      "oneComfyUiIdentityForSharedGpuAttempt",
      "fakeIdentityForModelWeightAdapterLibraryOrPreprocessorAllowed",
      "auraFaceMayUseDistinctReleasedCpuQaIdentity",
    ])
  );
}

function receiptIdentifiersAndDigestsValid(
  draft: LivingFrameControlledImageSelectedScenePrivateOperationRequestReceiptDraft,
): boolean {
  const ids = [
    ...Object.values(draft.canonicalScope),
    draft.exactOutputLineage.materializationUnitId,
    draft.exactOutputLineage.requestUnitId,
    draft.exactOutputLineage.componentId,
    draft.exactOutputLineage.outputKey,
    draft.exactOutputLineage.approvedWorkItemId,
    draft.exactOutputLineage.approvedWorkItemKey,
    draft.exactOutputLineage.approvedPlannedAssetManifestEntryId,
    draft.exactOutputLineage.rendererLayerId,
    draft.sourceBindings.privatePromptRequestLeaseId,
    draft.sourceBindings.approvedSnapshotId,
    draft.requestSummary.privateOperationRequestLeaseId,
  ];
  const digests = [
    draft.exactOutputLineage.requestUnitDigestSha256,
    draft.sourceBindings.selectedSceneRequestBindingDigestSha256,
    draft.sourceBindings.fullFrameRatioExtensionDigestSha256,
    draft.sourceBindings.admissionCandidateDigestSha256,
    draft.sourceBindings.promptMaterializationDigestSha256,
    draft.sourceBindings.promptMaterializationUnitDigestSha256,
    draft.sourceBindings.privatePromptRequestDigestSha256,
    draft.sourceBindings.approvedSnapshotHashSha256,
    draft.sourceBindings.selectedSceneBindingDigestSha256,
    draft.sourceBindings.currentMasterTimingDigestSha256,
    draft.sourceBindings.canonicalWorkGraphProjectionDigestSha256,
    draft.sourceBindings.plannedAssetAndApprovedOutputLineageDigestSha256,
    draft.sourceBindings.controlledIllustrationCostWorkBindingDigestSha256,
    draft.sourceBindings.confirmedOutputFrameExpectationDigestSha256,
    draft.sourceBindings.artifactSetDigestSha256,
    draft.sourceBindings.artifactPacketDigestSha256,
    draft.graphProfile.graphTopologyDigestSha256,
    draft.generationCanvas.confirmedOutputFrameExpectationDigestSha256,
    draft.fixedRuntimePolicy.runtimeConfinementRequirementDigestSha256,
    draft.requestSummary.privateOperationRequestDigestSha256,
  ];
  const nullableDigests = [
    draft.sourceBindings.visualContinuityPackDigestSha256,
    draft.sourceBindings.fullFrameRatioExtensionUnitDigestSha256,
  ];
  return (
    ids.every((value) => SAFE_ID.test(value)) &&
    digests.every((value) => SHA256.test(value)) &&
    nullableDigests.every((value) => value === null || SHA256.test(value)) &&
    (draft.generationCanvas.canvasClass === "confirmed_full_frame_ratio"
      ? draft.sourceBindings.fullFrameRatioExtensionUnitDigestSha256 !== null
      : draft.generationCanvas.canvasClass ===
          "isolated_component_square_1024" &&
        draft.sourceBindings.fullFrameRatioExtensionUnitDigestSha256 === null)
  );
}

function assertReceiptArtifacts(
  artifacts: readonly LivingFrameControlledImageSelectedScenePrivateOperationArtifactReceipt[],
): void {
  artifacts.forEach((artifact, order) => {
    if (
      !hasExactKeys(
        artifact as unknown as Record<string, unknown>,
        [
          "order",
          "artifactClass",
          "modelRole",
          "slotKind",
          "artifactRecordId",
          "artifactContentSha256",
          "artifactByteLength",
          "artifactSourceBindingDigestSha256",
          "privateAliasDigestSha256",
          "privateAliasIncluded",
          "artifactBytesIncluded",
          "pathOrUrlIncluded",
          "readOnlyMountRequired",
        ],
      ) ||
      artifact.order !== order ||
      !SAFE_ID.test(artifact.artifactRecordId) ||
      !SHA256.test(artifact.artifactContentSha256) ||
      !Number.isSafeInteger(artifact.artifactByteLength) ||
      artifact.artifactByteLength < 1 ||
      artifact.artifactByteLength > MAX_ARTIFACT_BYTES ||
      !SHA256.test(artifact.artifactSourceBindingDigestSha256) ||
      !SHA256.test(artifact.privateAliasDigestSha256) ||
      artifact.privateAliasIncluded !== false ||
      artifact.artifactBytesIncluded !== false ||
      artifact.pathOrUrlIncluded !== false ||
      artifact.readOnlyMountRequired !== true
    )
      throw invalid(
        "unsafe_receipt_forbidden",
        `$.requestSummary.artifactReceipts.${order}`,
      );
    if (order < 5) {
      const expected = MODEL_ROLE_BINDINGS[order]!;
      if (
        artifact.artifactClass !== "canonical_model_artifact" ||
        artifact.modelRole !== expected.role ||
        artifact.slotKind !== expected.slotKind
      )
        throw invalid(
          "unsafe_receipt_forbidden",
          `$.requestSummary.artifactReceipts.${order}`,
        );
    } else if (
      artifact.artifactClass !==
        "private_selected_scene_input_image_artifact" ||
      artifact.modelRole !== null ||
      !["control_image_artifact", "reference_image_artifact"].includes(
        artifact.slotKind,
      )
    )
      throw invalid(
        "unsafe_receipt_forbidden",
        `$.requestSummary.artifactReceipts.${order}`,
      );
  });
}

function assertSafeReceipt(value: unknown): void {
  const deniedKeys = new Set([
    "prompt",
    "rawPrompt",
    "conditioningText",
    "privateAlias",
    "modelBytes",
    "artifactBytes",
    "bytes",
    "path",
    "url",
    "credential",
    "secret",
    "command",
    "environment",
    "seed",
    "price",
    "credits",
    "serviceFeeAmount",
    "reservation",
    "wallet",
    "ledger",
  ]);
  let unsafe = false;
  walkEntries(value, (key, child) => {
    if (deniedKeys.has(key)) unsafe = true;
    if (
      typeof child === "string" &&
      (URL_LIKE.test(child) || SECRET_LIKE.test(child))
    )
      unsafe = true;
  });
  if (unsafe) {
    throw invalid("unsafe_receipt_forbidden", "$");
  }
}

function assertInput(
  value: unknown,
): asserts value is CreateLivingFrameControlledImageSelectedScenePrivateOperationRequestInput {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "serverOwnedArtifactLocatorId",
      "selectedSceneRequest",
      "selectedSceneRequestInput",
      "fullFrameRatioExtension",
      "fullFrameRatioExtensionInput",
      "admissionCandidate",
      "promptMaterialization",
      "materializationUnitId",
      "privatePromptRequestLease",
      "artifactReader",
    ]) ||
    typeof value.serverOwnedArtifactLocatorId !== "string" ||
    !SAFE_ID.test(value.serverOwnedArtifactLocatorId) ||
    typeof value.materializationUnitId !== "string" ||
    !SAFE_ID.test(value.materializationUnitId) ||
    !isRecord(value.selectedSceneRequest) ||
    !isRecord(value.selectedSceneRequestInput) ||
    !isRecord(value.fullFrameRatioExtension) ||
    !isRecord(value.fullFrameRatioExtensionInput) ||
    !isRecord(value.admissionCandidate) ||
    !isRecord(value.promptMaterialization) ||
    !isRecord(value.privatePromptRequestLease)
  )
    throw invalid("input_invalid", "$");
}

function validPrivateAlias(value: string, kind: "model" | "image"): boolean {
  return (
    value.length >= 3 &&
    value.length <= 128 &&
    PRIVATE_ALIAS.test(value) &&
    !value.includes("..") &&
    !value.includes("/") &&
    !value.includes("\\") &&
    !URL_LIKE.test(value) &&
    !SECRET_LIKE.test(value) &&
    (kind === "model" ? value.endsWith(".safetensors") : value.endsWith(".png"))
  );
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
  return value !== null && typeof value === "object" && !Array.isArray(value);
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

function walkValues(value: unknown, visitor: (value: unknown) => void): void {
  visitor(value);
  if (Array.isArray(value)) {
    value.forEach((child) => walkValues(child, visitor));
    return;
  }
  if (!isRecord(value)) return;
  Object.values(value).forEach((child) => walkValues(child, visitor));
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

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach((child) => deepFreeze(child));
  }
  return value;
}

function invalid(
  code: LivingFrameControlledImageSelectedScenePrivateOperationRequestIssueCode,
  path: string,
): LivingFrameControlledImageSelectedScenePrivateOperationRequestError {
  if (
    !(
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OPERATION_REQUEST_ISSUE_CODES as readonly string[]
    ).includes(code)
  )
    throw new Error(
      "Unknown Living Frame selected-scene operation request issue code.",
    );
  return new LivingFrameControlledImageSelectedScenePrivateOperationRequestError(
    [{ code, path }],
  );
}
