import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { deflateSync } from "node:zlib";

import type {
  LivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt,
} from "../../src/types/living-frame-controlled-image-selected-scene-private-operation-request";
import {
  LivingFrameControlledImageSelectedScenePrivateOutputObservationError,
  createLivingFrameControlledImageSelectedScenePrivateOutputReader,
  createLivingFrameControlledImageSelectedSceneVerifiedOutputConsumer,
  observeLivingFrameControlledImageSelectedScenePrivateOutput,
  verifyLivingFrameControlledImageSelectedScenePrivateOutputObservation,
  type LivingFrameControlledImageSelectedScenePrivateOutputPacket,
} from "../living-frame/living-frame-controlled-image-selected-scene-private-output-observation";
import {
  createLivingFrameControlledImageSelectedScenePrivateOperationRequestSmokeFixture,
} from "./fixtures/living-frame-controlled-image-selected-scene-private-operation-request-fixture";

const PNG_CRC32_TABLE = Uint32Array.from(
  { length: 256 },
  (_, index) => {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value =
        (value & 1) === 1
          ? 0xedb88320 ^ (value >>> 1)
          : value >>> 1;
    }
    return value >>> 0;
  },
);

const fullFrameFixture =
  await createLivingFrameControlledImageSelectedScenePrivateOperationRequestSmokeFixture(
    "full_frame",
  );
const fullFrameReceipt = fullFrameFixture.receipt;
const fullFramePng = createOpaquePng(1920, 1080);
let fullFrameDelivered:
  | {
      readonly outputPng: Buffer;
      readonly decodedRgba: Buffer;
    }
  | undefined;
const fullFrameReader = readerFor(fullFrameReceipt, fullFramePng);
const fullFrameConsumer =
  createLivingFrameControlledImageSelectedSceneVerifiedOutputConsumer(
    async (payload) => {
      fullFrameDelivered = {
        outputPng: Buffer.from(payload.outputPng),
        decodedRgba: Buffer.from(payload.decodedRgba),
      };
      assert.equal(
        payload.verification.operationRequestReceiptDigestSha256,
        fullFrameReceipt.operationRequestReceiptDigestSha256,
      );
      assert.equal(payload.verification.widthPixels, 1920);
      assert.equal(payload.verification.heightPixels, 1080);
      assert.equal(
        payload.verification.stillAlphaPipelineRequired,
        false,
      );
      assert.equal(
        payload.verification.opaqueGeneratedSourceOnly,
        true,
      );
    },
  );
const fullFrameObservation =
  await observeLivingFrameControlledImageSelectedScenePrivateOutput({
    operationRequestReceipt: fullFrameReceipt,
    outputReader: fullFrameReader,
    outputConsumer: fullFrameConsumer,
  });

assert.equal(
  verifyLivingFrameControlledImageSelectedScenePrivateOutputObservation(
    fullFrameObservation,
  ),
  true,
);
assert(fullFrameDelivered);
assert.equal(
  fullFrameDelivered.outputPng.byteLength,
  fullFramePng.byteLength,
);
assert.equal(
  fullFrameDelivered.decodedRgba.byteLength,
  1920 * 1080 * 4,
);
assert.equal(fullFrameObservation.verifiedOutput.widthPixels, 1920);
assert.equal(fullFrameObservation.verifiedOutput.heightPixels, 1080);
assert.equal(
  fullFrameObservation.verifiedOutput.opaquePixelCount,
  1920 * 1080,
);
assert.equal(
  fullFrameObservation.verifiedOutput.canvasClass,
  "confirmed_full_frame_ratio",
);
assert.equal(
  fullFrameObservation.verifiedOutput.stillAlphaPipelineRequired,
  false,
);
assert.equal(
  fullFrameObservation.verifiedOutput.sourceDisposition,
  "opaque_full_frame_plate_requires_destination_continuity_and_documentary_fact_qa",
);
assert.equal(
  fullFrameObservation.fixedRuntimeLineage
    .exactModelArtifactByteLength,
  11_700_367_157,
);
assert.deepEqual(
  fullFrameObservation.fixedRuntimeLineage.deniedTopLevelImports,
  ["sam2"],
);
assert.equal(
  fullFrameObservation.costLineage
    .fiveGpuCapabilitiesCreateOneAttemptCostEvent,
  true,
);
assert.equal(
  fullFrameObservation.registryPolicy.registryExpansionPermitted,
  true,
);
assert.equal(fullFrameObservation.workerCompletionInferred, false);
assert.equal(fullFrameObservation.gpuAttemptCreated, false);
assert.equal(
  fullFrameObservation.actualAttemptCostEvidenceVerified,
  false,
);
assert.equal(fullFrameObservation.artifactPersisted, false);
assert.equal(fullFrameObservation.assetManifestMutated, false);
assert.equal(fullFrameObservation.qaApproved, false);
assert.equal(fullFrameObservation.privateReviewApproved, false);
assert.equal(fullFrameObservation.renderAuthorized, false);
assert.equal(
  fullFrameObservation.finalCanvasCreatedByComfyUi,
  false,
);
assert.equal(fullFrameObservation.productionReady, false);

const isolatedFixture =
  await createLivingFrameControlledImageSelectedScenePrivateOperationRequestSmokeFixture(
    "isolated",
  );
const isolatedReceipt = isolatedFixture.receipt;
const isolatedPng = createOpaquePng(1024, 1024);
const isolatedObservation =
  await observeWithOutput(isolatedReceipt, isolatedPng);
assert.equal(
  verifyLivingFrameControlledImageSelectedScenePrivateOutputObservation(
    isolatedObservation,
  ),
  true,
);
assert.equal(isolatedObservation.verifiedOutput.widthPixels, 1024);
assert.equal(isolatedObservation.verifiedOutput.heightPixels, 1024);
assert.equal(
  isolatedObservation.verifiedOutput.canvasClass,
  "isolated_component_square_1024",
);
assert.equal(
  isolatedObservation.verifiedOutput.stillAlphaPipelineRequired,
  true,
);
assert.equal(
  isolatedObservation.verifiedOutput.sourceDisposition,
  "opaque_component_source_requires_segmentation_matting_decontamination_and_alpha_qa",
);

for (const observation of [
  fullFrameObservation,
  isolatedObservation,
]) {
  const serialized = JSON.stringify(observation);
  for (const forbidden of [
    '"outputPng":',
    '"decodedRgba":',
    '"bytes":',
    '"path":',
    '"url":',
    '"prompt":',
    '"privateAlias":',
    '"seed":',
    '"command":',
    '"environment":',
    "https://",
    "file://",
    "/tmp/",
    "musashi",
    "hormuz",
    "helicopter",
  ]) {
    assert.equal(serialized.includes(forbidden), false);
  }
}

let adversarialAssertions = 0;

await expectIssue(
  () =>
    observeLivingFrameControlledImageSelectedScenePrivateOutput({
      operationRequestReceipt: fullFrameReceipt,
      outputReader: fullFrameReader,
      outputConsumer: successConsumer(),
    }),
  "reader_reused",
);
adversarialAssertions += 1;

await expectIssue(
  () =>
    observeLivingFrameControlledImageSelectedScenePrivateOutput({
      operationRequestReceipt: fullFrameReceipt,
      outputReader: {
        ...readerFor(fullFrameReceipt, fullFramePng),
      },
      outputConsumer: successConsumer(),
    }),
  "reader_invalid",
);
adversarialAssertions += 1;

const crossReader = readerFor(isolatedReceipt, isolatedPng);
await expectIssue(
  () =>
    observeLivingFrameControlledImageSelectedScenePrivateOutput({
      operationRequestReceipt: fullFrameReceipt,
      outputReader: crossReader,
      outputConsumer: successConsumer(),
    }),
  "reader_lineage_invalid",
);
adversarialAssertions += 1;

const reusedConsumer = successConsumer();
await observeLivingFrameControlledImageSelectedScenePrivateOutput({
  operationRequestReceipt: fullFrameReceipt,
  outputReader: readerFor(fullFrameReceipt, fullFramePng),
  outputConsumer: reusedConsumer,
});
await expectIssue(
  () =>
    observeLivingFrameControlledImageSelectedScenePrivateOutput({
      operationRequestReceipt: fullFrameReceipt,
      outputReader: readerFor(fullFrameReceipt, fullFramePng),
      outputConsumer: reusedConsumer,
    }),
  "consumer_reused",
);
adversarialAssertions += 1;

await expectIssue(
  () =>
    observeLivingFrameControlledImageSelectedScenePrivateOutput({
      operationRequestReceipt: fullFrameReceipt,
      outputReader: readerFor(fullFrameReceipt, fullFramePng),
      outputConsumer: {
        ...successConsumer(),
      },
    }),
  "consumer_invalid",
);
adversarialAssertions += 1;

await expectIssue(
  () =>
    observeLivingFrameControlledImageSelectedScenePrivateOutput({
      operationRequestReceipt: fullFrameReceipt,
      outputReader: readerFor(fullFrameReceipt, fullFramePng),
      outputConsumer:
        createLivingFrameControlledImageSelectedSceneVerifiedOutputConsumer(
          async () => {
            throw new Error("controlled consumer failure");
          },
        ),
    }),
  "consumer_failed",
);
adversarialAssertions += 1;

for (const [
  expectedCode,
  mutate,
] of [
  [
    "cross_scene_work_item_or_output_substitution",
    (packet: MutableOutputPacket) => {
      packet.sceneId = "scene-cross-substituted";
    },
  ],
  [
    "cross_scene_work_item_or_output_substitution",
    (packet: MutableOutputPacket) => {
      packet.componentId = "component-cross-substituted";
    },
  ],
  [
    "cross_scene_work_item_or_output_substitution",
    (packet: MutableOutputPacket) => {
      packet.approvedWorkItemId = "work-cross-substituted";
    },
  ],
  [
    "cross_scene_work_item_or_output_substitution",
    (packet: MutableOutputPacket) => {
      packet.outputKey = "output.cross-substituted";
    },
  ],
  [
    "cross_scene_work_item_or_output_substitution",
    (packet: MutableOutputPacket) => {
      packet.approvedPlannedAssetManifestEntryId =
        "asset-manifest-cross-substituted";
    },
  ],
  [
    "output_lineage_invalid",
    (packet: MutableOutputPacket) => {
      packet.operationRequestReceiptId =
        "operation-request-cross-substituted";
    },
  ],
  [
    "output_lineage_invalid",
    (packet: MutableOutputPacket) => {
      packet.privateOperationRequestDigestSha256 = "f".repeat(64);
    },
  ],
  [
    "output_lineage_invalid",
    (packet: MutableOutputPacket) => {
      packet.confirmedOutputFrameExpectationDigestSha256 =
        "e".repeat(64);
    },
  ],
  [
    "output_lineage_invalid",
    (packet: MutableOutputPacket) => {
      packet.widthPixels = 1024;
      packet.heightPixels = 1024;
    },
  ],
  [
    "output_digest_mismatch",
    (packet: MutableOutputPacket) => {
      packet.outputContentSha256 = "d".repeat(64);
    },
  ],
  [
    "output_digest_mismatch",
    (packet: MutableOutputPacket) => {
      packet.outputByteLength += 1;
    },
  ],
  [
    "authority_promotion_forbidden",
    (packet: MutableOutputPacket) => {
      packet.workerCompletionAuthority = true as false;
    },
  ],
] as const) {
  await expectPacketMutation(
    fullFrameReceipt,
    fullFramePng,
    mutate,
    expectedCode,
  );
  adversarialAssertions += 1;
}

await expectUnknownPacketKey(fullFrameReceipt, fullFramePng);
adversarialAssertions += 1;

await expectIssue(
  () => observeWithOutput(fullFrameReceipt, Buffer.from("not-a-png")),
  "output_format_invalid",
);
adversarialAssertions += 1;

await expectIssue(
  () =>
    observeWithOutput(
      fullFrameReceipt,
      createOpaquePng(1024, 1024),
    ),
  "output_dimension_invalid",
);
adversarialAssertions += 1;

await expectIssue(
  () =>
    observeWithOutput(
      fullFrameReceipt,
      createOpaquePng(1080, 1920),
    ),
  "output_dimension_invalid",
);
adversarialAssertions += 1;

await expectIssue(
  () =>
    observeWithOutput(
      fullFrameReceipt,
      createAlphaPng(1920, 1080),
    ),
  "output_alpha_policy_invalid",
);
adversarialAssertions += 1;

const tamperedReceipt = structuredClone(fullFrameReceipt);
(tamperedReceipt as { productionReady: boolean }).productionReady = true;
await expectIssue(
  () =>
    observeLivingFrameControlledImageSelectedScenePrivateOutput({
      operationRequestReceipt: tamperedReceipt,
      outputReader: readerFor(fullFrameReceipt, fullFramePng),
      outputConsumer: successConsumer(),
    }),
  "operation_request_receipt_invalid",
);
adversarialAssertions += 1;

for (const mutate of [
  (observation: Record<string, unknown>) => {
    observation.outputPng = "forbidden";
  },
  (observation: Record<string, unknown>) => {
    observation.actualCostMicros = 100;
  },
  (observation: Record<string, unknown>) => {
    observation.benchmarkCaseId = "full_combined_primary";
  },
  (observation: Record<string, unknown>) => {
    observation.artifactPersisted = true;
    observation.assetManifestMutated = true;
    observation.qaApproved = true;
    observation.privateReviewApproved = true;
    observation.renderAuthorized = true;
    observation.productionReady = true;
  },
  (observation: Record<string, unknown>) => {
    const output = observation.verifiedOutput as
      Record<string, unknown>;
    output.widthPixels = 1024;
    output.heightPixels = 1024;
    output.opaquePixelCount = 1_048_576;
  },
  (observation: Record<string, unknown>) => {
    const runtime = observation.fixedRuntimeLineage as
      Record<string, unknown>;
    runtime.deniedTopLevelImports = [];
  },
] as const) {
  const tampered = structuredClone(
    fullFrameObservation,
  ) as unknown as Record<string, unknown>;
  mutate(tampered);
  assert.equal(
    verifyLivingFrameControlledImageSelectedScenePrivateOutputObservation(
      tampered,
    ),
    false,
  );
  adversarialAssertions += 1;
}

assert.equal(adversarialAssertions, 30);
process.stdout.write(
  JSON.stringify(
    {
      status: "passed",
      contractVersion: fullFrameObservation.contractVersion,
      observedCanvases: [
        {
          canvasClass:
            fullFrameObservation.verifiedOutput.canvasClass,
          dimensions: [
            fullFrameObservation.verifiedOutput.widthPixels,
            fullFrameObservation.verifiedOutput.heightPixels,
          ],
          stillAlphaPipelineRequired:
            fullFrameObservation.verifiedOutput
              .stillAlphaPipelineRequired,
        },
        {
          canvasClass:
            isolatedObservation.verifiedOutput.canvasClass,
          dimensions: [
            isolatedObservation.verifiedOutput.widthPixels,
            isolatedObservation.verifiedOutput.heightPixels,
          ],
          stillAlphaPipelineRequired:
            isolatedObservation.verifiedOutput
              .stillAlphaPipelineRequired,
        },
      ],
      adversarialAssertions,
      fixedFiveModelByteLength:
        fullFrameObservation.fixedRuntimeLineage
          .exactModelArtifactByteLength,
      oneGpuAttemptCostEvent:
        fullFrameObservation.costLineage
          .fiveGpuCapabilitiesCreateOneAttemptCostEvent,
      workerCompletionInferred: false,
      artifactPersisted: false,
      qaApproved: false,
      privateReviewApproved: false,
      renderAuthorized: false,
      productionReady: false,
    },
    null,
    2,
  ),
);
process.stdout.write("\n");

function readerFor(
  receipt:
    LivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt,
  outputPng: Buffer,
) {
  return createLivingFrameControlledImageSelectedScenePrivateOutputReader({
    operationRequestReceipt: receipt,
    evidenceClass: "controlled_source_fixture",
    readServerOwnedOutput: async () =>
      packetFor(receipt, outputPng),
  });
}

function packetFor(
  receipt:
    LivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt,
  outputPng: Buffer,
): LivingFrameControlledImageSelectedScenePrivateOutputPacket {
  return {
    packetClass:
      "server_owned_selected_scene_comfyui_opaque_png_output_packet_v1",
    evidenceClass: "controlled_source_fixture",
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
    approvedWorkItemKey:
      receipt.exactOutputLineage.approvedWorkItemKey,
    approvedPlannedAssetManifestEntryId:
      receipt.exactOutputLineage
        .approvedPlannedAssetManifestEntryId,
    confirmedOutputFrameExpectationDigestSha256:
      receipt.sourceBindings
        .confirmedOutputFrameExpectationDigestSha256,
    widthPixels: receipt.generationCanvas.widthPixels,
    heightPixels: receipt.generationCanvas.heightPixels,
    outputCandidateId: `selected-output-candidate.${digest({
      request: receipt.operationRequestReceiptDigestSha256,
      output: digestBytes(outputPng),
    }).slice(0, 32)}`,
    outputContentType: "image/png",
    outputByteLength: outputPng.byteLength,
    outputContentSha256: digestBytes(outputPng),
    outputPng: Buffer.from(outputPng),
    callerBytesPathUrlCredentialPromptSeedDimensionModelCommandOrEnvironmentAccepted:
      false,
    workerCompletionAuthority: false,
    gpuAttemptAuthority: false,
    actualCostAuthority: false,
    artifactPersistenceAuthority: false,
    qaApprovalAuthority: false,
    finalCanvasAuthority: false,
    productionReady: false,
  };
}

function successConsumer() {
  return createLivingFrameControlledImageSelectedSceneVerifiedOutputConsumer(
    async () => undefined,
  );
}

async function observeWithOutput(
  receipt:
    LivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt,
  outputPng: Buffer,
) {
  return observeLivingFrameControlledImageSelectedScenePrivateOutput({
    operationRequestReceipt: receipt,
    outputReader: readerFor(receipt, outputPng),
    outputConsumer: successConsumer(),
  });
}

type MutableOutputPacket = {
  -readonly [Key in keyof
    LivingFrameControlledImageSelectedScenePrivateOutputPacket]:
      LivingFrameControlledImageSelectedScenePrivateOutputPacket[Key];
};

async function expectPacketMutation(
  receipt:
    LivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt,
  outputPng: Buffer,
  mutate: (packet: MutableOutputPacket) => void,
  expectedCode: string,
): Promise<void> {
  const packet = packetFor(receipt, outputPng) as MutableOutputPacket;
  mutate(packet);
  await expectIssue(
    () =>
      observeLivingFrameControlledImageSelectedScenePrivateOutput({
        operationRequestReceipt: receipt,
        outputReader:
          createLivingFrameControlledImageSelectedScenePrivateOutputReader(
            {
              operationRequestReceipt: receipt,
              evidenceClass: "controlled_source_fixture",
              readServerOwnedOutput: async () => packet,
            },
          ),
        outputConsumer: successConsumer(),
      }),
    expectedCode,
  );
}

async function expectUnknownPacketKey(
  receipt:
    LivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt,
  outputPng: Buffer,
): Promise<void> {
  const packet = packetFor(
    receipt,
    outputPng,
  ) as unknown as Record<string, unknown>;
  packet.benchmarkCaseId = "full_combined_primary";
  await expectIssue(
    () =>
      observeLivingFrameControlledImageSelectedScenePrivateOutput({
        operationRequestReceipt: receipt,
        outputReader:
          createLivingFrameControlledImageSelectedScenePrivateOutputReader(
            {
              operationRequestReceipt: receipt,
              evidenceClass: "controlled_source_fixture",
              readServerOwnedOutput: async () =>
                packet as unknown as
                  LivingFrameControlledImageSelectedScenePrivateOutputPacket,
            },
          ),
        outputConsumer: successConsumer(),
      }),
    "output_packet_invalid",
  );
}

function createOpaquePng(width: number, height: number): Buffer {
  const rgb = Buffer.alloc(width * height * 3);
  for (let offset = 0; offset < rgb.length; offset += 3) {
    const pixel = offset / 3;
    rgb[offset] = pixel % 251;
    rgb[offset + 1] = (pixel * 3) % 253;
    rgb[offset + 2] = (pixel * 7) % 255;
  }
  return encodePng(width, height, 2, rgb, 3);
}

function createAlphaPng(width: number, height: number): Buffer {
  const rgba = Buffer.alloc(width * height * 4);
  for (let offset = 0; offset < rgba.length; offset += 4) {
    rgba[offset] = 120;
    rgba[offset + 1] = 70;
    rgba[offset + 2] = 180;
    rgba[offset + 3] = offset % 8 === 0 ? 128 : 255;
  }
  return encodePng(width, height, 6, rgba, 4);
}

function encodePng(
  width: number,
  height: number,
  colorType: 2 | 6,
  pixels: Buffer,
  channels: 3 | 4,
): Buffer {
  assert.equal(pixels.byteLength, width * height * channels);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = colorType;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const rowByteLength = width * channels;
  const raw = Buffer.alloc((rowByteLength + 1) * height);
  for (let row = 0; row < height; row += 1) {
    const rowOffset = row * (rowByteLength + 1);
    raw[rowOffset] = 0;
    pixels.copy(
      raw,
      rowOffset + 1,
      row * rowByteLength,
      (row + 1) * rowByteLength,
    );
  }
  return Buffer.concat([
    Buffer.from("89504e470d0a1a0a", "hex"),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBytes = Buffer.from(type, "ascii");
  const chunk = Buffer.alloc(12 + data.byteLength);
  chunk.writeUInt32BE(data.byteLength, 0);
  typeBytes.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(
    pngCrc32(Buffer.concat([typeBytes, data])),
    8 + data.byteLength,
  );
  return chunk;
}

function pngCrc32(bytes: Buffer): number {
  let value = 0xffffffff;
  for (const byte of bytes) {
    value =
      PNG_CRC32_TABLE[(value ^ byte) & 0xff]! ^
      (value >>> 8);
  }
  return (value ^ 0xffffffff) >>> 0;
}

async function expectIssue(
  action: () => Promise<unknown>,
  expectedCode: string,
): Promise<void> {
  let thrown: unknown;
  try {
    await action();
  } catch (error) {
    thrown = error;
  }
  assert(
    thrown instanceof
      LivingFrameControlledImageSelectedScenePrivateOutputObservationError,
  );
  assert.equal(thrown.issues[0]?.code, expectedCode);
}

function digest(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(canonicalize(value)), "utf8")
    .digest("hex");
}

function digestBytes(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => canonicalize(entry));
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    );
  }
  return value;
}
