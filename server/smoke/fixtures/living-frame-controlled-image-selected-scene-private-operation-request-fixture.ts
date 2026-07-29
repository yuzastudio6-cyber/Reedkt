import { createHash } from "node:crypto";

import type {
  LivingFrameControlledSdxlBenchmarkRequestSlotKind,
} from "../../../src/types/living-frame-controlled-sdxl-benchmark-request-blueprint";
import type {
  LivingFrameControlledImageSelectedScenePrivatePromptMaterialization,
} from "../../../src/types/living-frame-controlled-image-selected-scene-private-prompt-materialization";
import {
  createLivingFrameComfyUiOperationAdmissionCandidate,
} from "../../living-frame/living-frame-comfyui-operation-admission-candidate";
import {
  createLivingFrameControlledImageFullFrameRatioExtension,
} from "../../living-frame/living-frame-controlled-image-full-frame-ratio-extension";
import {
  compileLivingFrameControlledImageSelectedScenePrivateOperationRequest,
  createLivingFrameControlledImageSelectedScenePrivateOperationArtifactReader,
  type LivingFrameControlledImageSelectedScenePrivateOperationArtifactPacket,
} from "../../living-frame/living-frame-controlled-image-selected-scene-private-operation-request";
import {
  createLivingFrameControlledImageSelectedScenePrivatePromptReader,
  materializeLivingFrameControlledImageSelectedScenePrivatePrompt,
  type LivingFrameControlledImageSelectedScenePrivatePromptPacket,
} from "../../living-frame/living-frame-controlled-image-selected-scene-private-prompt-materialization";
import {
  livingFrameControlledImageSelectedSceneSmokeInput,
  livingFrameControlledImageSelectedSceneSmokeRequest,
} from "../living-frame-controlled-image-selected-scene-request-smoke";

const MODEL_ARTIFACTS = [
  {
    role: "base_checkpoint",
    slotKind: "base_checkpoint_artifact",
    privateAlias: "private-base.safetensors",
    artifactByteLength: 6_938_078_334,
    artifactContentSha256:
      "31e35c80fc4829d14f90153f4c74cd59c90b779f6afe05a74cd6120b893f7e5b",
  },
  {
    role: "controlnet_checkpoint",
    slotKind: "controlnet_checkpoint_artifact",
    privateAlias: "private-controlnet.safetensors",
    artifactByteLength: 320_237_179,
    artifactContentSha256:
      "fde4888a5f0a5648118991cc50e0ac4d60a2356dbaddf5e0649dd69c1119a2f9",
  },
  {
    role: "lora_adapter",
    slotKind: "lora_adapter_artifact",
    privateAlias: "private-lora.safetensors",
    artifactByteLength: 49_553_604,
    artifactContentSha256:
      "4852686128f953d0277d0793e2f0335352f96a919c9c16a09787d77f55cbdf6f",
  },
  {
    role: "generic_ipadapter_checkpoint",
    slotKind: "generic_ipadapter_checkpoint_artifact",
    privateAlias: "private-ipadapter.safetensors",
    artifactByteLength: 702_585_376,
    artifactContentSha256:
      "ba1002529e783604c5f326d49f0122025392d1d20ac8d573b3eeb3e6dea4ebb6",
  },
  {
    role: "clip_vision_checkpoint",
    slotKind: "clip_vision_checkpoint_artifact",
    privateAlias: "private-clipvision.safetensors",
    artifactByteLength: 3_689_912_664,
    artifactContentSha256:
      "657723e09f46a7c3957df651601029f66b1748afb12b419816330f16ed45d64d",
  },
] as const;

let sequence = 0;

export async function createLivingFrameControlledImageSelectedScenePrivateOperationRequestSmokeFixture(
  target: "full_frame" | "isolated" = "full_frame",
) {
  const selectedSceneRequest =
    livingFrameControlledImageSelectedSceneSmokeRequest;
  const selectedSceneRequestInput =
    livingFrameControlledImageSelectedSceneSmokeInput;
  const admissionCandidate =
    await createLivingFrameComfyUiOperationAdmissionCandidate({
      candidateId: `living-frame.comfyui.selected-output.${nextId()}`,
    });
  const fullFrameRatioExtensionInput = {
    extensionId: `living-frame.full-frame-ratio.selected-output.${nextId()}`,
    selectedSceneRequest,
    selectedSceneRequestInput,
    admissionCandidate,
  } as const;
  const fullFrameRatioExtension =
    await createLivingFrameControlledImageFullFrameRatioExtension(
      fullFrameRatioExtensionInput,
    );
  const promptPacket = createPromptPacket(
    selectedSceneRequest,
    fullFrameRatioExtension,
  );
  const promptReader =
    createLivingFrameControlledImageSelectedScenePrivatePromptReader(
      async () => structuredClone(promptPacket),
    );
  const promptResult =
    await materializeLivingFrameControlledImageSelectedScenePrivatePrompt({
      materializationBatchId:
        `living-frame.selected-output-materialization.${nextId()}`,
      serverOwnedMaterializationLocatorId:
        `selected-output-materialization-locator.${nextId()}`,
      selectedSceneRequest,
      selectedSceneRequestInput,
      fullFrameRatioExtension,
      fullFrameRatioExtensionInput,
      admissionCandidate,
      reader: promptReader,
    });
  const canvasClass =
    target === "full_frame"
      ? "confirmed_full_frame_ratio"
      : "isolated_component_square_1024";
  const unit = promptResult.receipt.materializationUnits.find(
    (candidate) =>
      candidate.generationCanvas.canvasClass === canvasClass,
  );
  if (!unit) throw new Error(`Missing ${canvasClass} test fixture unit.`);
  const promptLease = promptResult.privatePromptRequestLeases.find(
    (candidate) =>
      candidate.materializationUnitId === unit.materializationUnitId,
  );
  if (!promptLease) throw new Error("Missing test prompt lease.");
  const operationPacket = createOperationPacket({
    selectedSceneRequest,
    promptMaterialization: promptResult.receipt,
    unit,
  });
  const artifactReader =
    createLivingFrameControlledImageSelectedScenePrivateOperationArtifactReader(
      async () => structuredClone(operationPacket),
    );
  const result =
    await compileLivingFrameControlledImageSelectedScenePrivateOperationRequest(
      {
        serverOwnedArtifactLocatorId:
          `selected-output-artifact-locator.${nextId()}`,
        selectedSceneRequest,
        selectedSceneRequestInput,
        fullFrameRatioExtension,
        fullFrameRatioExtensionInput,
        admissionCandidate,
        promptMaterialization: promptResult.receipt,
        materializationUnitId: unit.materializationUnitId,
        privatePromptRequestLease: promptLease,
        artifactReader,
      },
    );
  return {
    receipt: result.receipt,
    privateOperationRequestLease:
      result.privateOperationRequestLease,
  };
}

function createPromptPacket(
  selectedSceneRequest:
    typeof livingFrameControlledImageSelectedSceneSmokeRequest,
  fullFrameRatioExtension: {
    readonly extensionDigestSha256: string;
  },
): LivingFrameControlledImageSelectedScenePrivatePromptPacket {
  return {
    selectedSceneRequestBindingDigestSha256:
      selectedSceneRequest.requestBindingDigestSha256,
    fullFrameRatioExtensionDigestSha256:
      fullFrameRatioExtension.extensionDigestSha256,
    approvedSnapshotId:
      selectedSceneRequest.sourceBindings.approvedSnapshotId,
    approvedSnapshotHashSha256:
      selectedSceneRequest.sourceBindings.approvedSnapshotHashSha256,
    sceneId: selectedSceneRequest.canonicalScope.sceneId,
    units: selectedSceneRequest.requestUnits.map((unit) => ({
      order: unit.order,
      requestUnitId: unit.requestUnitId,
      requestUnitDigestSha256: unit.requestUnitDigestSha256,
      sceneId: unit.sceneId,
      outputKey: unit.outputKey,
      approvedWorkItemId: unit.approvedWorkItemId,
      approvedWorkItemKey: unit.approvedWorkItemKey,
      approvedPlannedAssetManifestEntryId:
        unit.approvedPlannedAssetManifestEntryId,
      serverOwnedConditioningLocatorId:
        unit.serverOwnedConditioningLocatorId,
      resolvedSlots: unit.privateSlotKinds.map((slotKind, order) =>
        privateSlot(slotKind, order),
      ),
    })),
  };
}

function privateSlot(
  slotKind: LivingFrameControlledSdxlBenchmarkRequestSlotKind,
  order: number,
) {
  const values: Record<
    LivingFrameControlledSdxlBenchmarkRequestSlotKind,
    readonly [
      | "private_model_alias"
      | "private_conditioning_text"
      | "private_image_alias",
      string,
    ]
  > = {
    base_checkpoint_artifact: [
      "private_model_alias",
      "private-base.safetensors",
    ],
    controlnet_checkpoint_artifact: [
      "private_model_alias",
      "private-controlnet.safetensors",
    ],
    lora_adapter_artifact: [
      "private_model_alias",
      "private-lora.safetensors",
    ],
    generic_ipadapter_checkpoint_artifact: [
      "private_model_alias",
      "private-ipadapter.safetensors",
    ],
    clip_vision_checkpoint_artifact: [
      "private_model_alias",
      "private-clipvision.safetensors",
    ],
    positive_conditioning_text: [
      "private_conditioning_text",
      "Premium editorial illustration with animation-aware layer separation.",
    ],
    negative_conditioning_text: [
      "private_conditioning_text",
      "No text, no watermark, no fused moving components.",
    ],
    control_image_artifact: [
      "private_image_alias",
      "private-control.png",
    ],
    reference_image_artifact: [
      "private_image_alias",
      "private-reference.png",
    ],
  };
  const [valueClass, value] = values[slotKind];
  return {
    order,
    slotKind,
    valueClass,
    value,
  };
}

function createOperationPacket(input: {
  readonly selectedSceneRequest:
    typeof livingFrameControlledImageSelectedSceneSmokeRequest;
  readonly promptMaterialization:
    LivingFrameControlledImageSelectedScenePrivatePromptMaterialization;
  readonly unit:
    LivingFrameControlledImageSelectedScenePrivatePromptMaterialization["materializationUnits"][number];
}): LivingFrameControlledImageSelectedScenePrivateOperationArtifactPacket {
  const requestUnit = input.selectedSceneRequest.requestUnits.find(
    (candidate) =>
      candidate.requestUnitId === input.unit.requestUnitId,
  );
  if (!requestUnit) throw new Error("Missing selected request unit.");
  const modelArtifacts = MODEL_ARTIFACTS.map((artifact, order) => ({
    order,
    role: artifact.role,
    slotKind: artifact.slotKind,
    artifactRecordId: `model-artifact.${artifact.role}.001`,
    artifactContentSha256: artifact.artifactContentSha256,
    artifactByteLength: artifact.artifactByteLength,
    artifactSourceBindingDigestSha256: digest({
      role: artifact.role,
      artifactContentSha256: artifact.artifactContentSha256,
    }),
    privateAlias: artifact.privateAlias,
    readOnlyMountRequired: true as const,
  }));
  const imageSlots =
    input.unit.privatePromptRequest.slotReceipts.filter(
      (slot) => slot.valueClass === "private_image_alias",
    );
  const inputImageArtifacts = imageSlots.map((slot, order) => ({
    order: 5 + order,
    promptSlotOrder: slot.order,
    slotKind: slot.slotKind as
      | "control_image_artifact"
      | "reference_image_artifact",
    artifactRecordId: `input-artifact.${slot.slotKind}.${nextId()}`,
    artifactContentSha256: digest({
      requestUnitId: input.unit.requestUnitId,
      slotKind: slot.slotKind,
    }),
    artifactByteLength: 48_044 + order,
    artifactSourceBindingDigestSha256: digest({
      requestUnitId: input.unit.requestUnitId,
      outputKey: input.unit.outputKey,
      slotKind: slot.slotKind,
    }),
    privateAlias:
      slot.slotKind === "control_image_artifact"
        ? "private-control.png"
        : "private-reference.png",
    readOnlyMountRequired: true as const,
  }));
  const artifactSetDigestSha256 = digest({
    modelArtifacts,
    inputImageArtifacts,
  });
  const draft = {
    packetClass:
      "server_owned_selected_scene_comfyui_operation_artifact_packet_v1",
    evidenceClass:
      "controlled_non_executable_selected_scene_operation_artifact_packet",
    selectedSceneRequestBindingDigestSha256:
      input.selectedSceneRequest.requestBindingDigestSha256,
    promptMaterializationDigestSha256:
      input.promptMaterialization.materializationDigestSha256,
    promptMaterializationUnitDigestSha256:
      input.unit.materializationUnitDigestSha256,
    materializationUnitId: input.unit.materializationUnitId,
    requestUnitId: input.unit.requestUnitId,
    sceneId: input.unit.sceneId,
    outputKey: input.unit.outputKey,
    approvedWorkItemId: input.unit.approvedWorkItemId,
    approvedWorkItemKey: input.unit.approvedWorkItemKey,
    approvedPlannedAssetManifestEntryId:
      input.unit.approvedPlannedAssetManifestEntryId,
    confirmedOutputFrameExpectationDigestSha256:
      requestUnit.generationCanvas
        .finalOutputFrameExpectationDigestSha256,
    modelArtifacts,
    inputImageArtifacts,
    artifactSetDigestSha256,
    fixedRuntimeExpectation: {
      processEntrypointKind: "fixed_supervised_python_process",
      runtimeRegion: "europe-west1",
      accelerator: "nvidia_l4",
      gpuCount: 1,
      cpuFallbackAllowed: false,
      runtimeConfinementRequirementDigestSha256:
        input.unit.attemptPolicy.confinementDigestSha256,
      deniedTopLevelImports: ["sam2"] as const,
      externalNetworkAllowed: false,
      runtimeDownloadsAllowed: false,
      atomicFiveModelReadOnlyMountRequired: true,
      verifyAllFiveModelsBeforeAndAfterInference: true,
      oneProcessPerAttemptRequired: true,
    },
    callerArtifactPacketAccepted: false,
    callerModelOrImageBytesAccepted: false,
    callerPromptSeedDimensionModelPathUrlCredentialCommandOrEnvironmentAccepted:
      false,
    operationAuthority: false,
    dispatchAuthority: false,
    runtimeAuthority: false,
    productionReady: false,
  } as const;
  return {
    ...draft,
    artifactPacketDigestSha256: digest(draft),
  };
}

function nextId(): string {
  sequence += 1;
  return String(sequence).padStart(4, "0");
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => canonicalize(entry));
  }
  if (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
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
