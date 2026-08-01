import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { deflateSync } from 'node:zlib'

import type {
  LivingFrameCharacterControlledPreparationCanonicalV2ResultEnvelope,
} from '../../src/types/living-frame-character-controlled-preparation-private-output'
import {
  consumeLivingFrameCharacterControlledPreparationPrivateOutputLease,
  createLivingFrameCharacterControlledPreparationPrivateOutputReader,
  LivingFrameCharacterControlledPreparationPrivateOutputError,
  observeLivingFrameCharacterControlledPreparationPrivateOutput,
  type LivingFrameCharacterControlledPreparationPrivateOutputPacket,
  verifyCanonicalV2ResultEnvelope,
  verifyLivingFrameCharacterControlledPreparationPrivateOutput,
} from '../living-frame/living-frame-character-controlled-preparation-private-output'
import {
  verifyLivingFramePrivateOpaqueRgbPng,
} from '../living-frame/living-frame-private-opaque-rgb-png-verifier'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  livingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationSmokeReceipt,
  livingFrameCharacterControlledPreparationPrivatePromptSmokeReceipt,
} from './living-frame-character-controlled-preparation-canonical-comfyui-reconciliation-smoke'
import {
  livingFrameCharacterControlledPreparationSmokeInput,
  livingFrameCharacterControlledPreparationSmokeResult,
} from './living-frame-character-controlled-preparation-smoke'

const preparation =
  livingFrameCharacterControlledPreparationSmokeResult
const preparationInput =
  livingFrameCharacterControlledPreparationSmokeInput
const privatePrompt =
  livingFrameCharacterControlledPreparationPrivatePromptSmokeReceipt
const canonicalReconciliation =
  livingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationSmokeReceipt
const plateUnit =
  preparation.preparationUnits.find((unit) =>
    unit.purpose ===
      'reconstruct_exposed_source_plate')!
const promptUnit =
  privatePrompt.promptUnits.find((unit) =>
    unit.preparationUnitId ===
      plateUnit.preparationUnitId)!
const outputPng =
  createOpaqueRgbPng(
    plateUnit.generationCanvas.widthPixels,
    plateUnit.generationCanvas.heightPixels,
  )
const decoded =
  verifyLivingFramePrivateOpaqueRgbPng(
    outputPng,
    {
      widthPixels:
        plateUnit.generationCanvas.widthPixels,
      heightPixels:
        plateUnit.generationCanvas.heightPixels,
    },
  )
const envelope = createEnvelope()
const packet = createPacket(envelope, outputPng)
const input = createInput(envelope, packet)
const result =
  await observeLivingFrameCharacterControlledPreparationPrivateOutput(
    input,
  )

assert.equal(
  verifyCanonicalV2ResultEnvelope(envelope),
  true,
)
assert.equal(
  verifyLivingFrameCharacterControlledPreparationPrivateOutput(
    result.receipt,
  ),
  true,
)
assert.equal(
  result.receipt.exactOutputLineage.purpose,
  'reconstruct_exposed_source_plate',
)
assert.equal(
  result.receipt.verifiedOutput.canvasClass,
  'confirmed_full_frame_ratio',
)
assert.deepEqual([
  result.receipt.verifiedOutput.widthPixels,
  result.receipt.verifiedOutput.heightPixels,
], [1920, 1080])
assert.equal(
  result.receipt.verifiedOutput.sourceDisposition,
  'opaque_masked_plate_requires_hidden_plate_continuity_fact_and_destination_qa',
)
assert.equal(
  result.receipt.canonicalV2Boundary
    .exactMaskLoader,
  'LoadImageMask',
)
assert.equal(
  result.receipt.canonicalV2Boundary
    .exactMaskChannel,
  'red',
)
assert.equal(
  result.receipt.canonicalV2Boundary
    .exactMaskOutputIndex,
  0,
)
assert.equal(
  result.receipt.canonicalV2Boundary
    .maskPolarity,
  'white_one_means_inpaint',
)
assert.equal(
  result.receipt.canonicalV2Boundary
    .exactInpaintEncoder,
  'VAEEncodeForInpaint',
)
assert.equal(
  result.receipt.canonicalV2Boundary
    .exactGrowMaskBy,
  6,
)
assert.equal(
  result.receipt.canonicalV2Boundary
    .exactSamplerDenoise,
  0.55,
)
assert.equal(
  result.receipt.downstreamRequirements
    .routeRecompileAfterQaRequired,
  true,
)
assert.equal(
  result.receipt.downstreamRequirements
    .existingSelectedScenePrivateOutputObservationV2AdapterRequired,
  true,
)
assert.equal(
  result.receipt.downstreamRequirements
    .remotionOwnsFinalCanvas,
  true,
)
assert.equal(
  result.receipt.canonicalWorkerCompletionInferred,
  false,
)
assert.equal(
  result.receipt.gpuAttemptCreated,
  false,
)
assert.equal(
  result.receipt.actualAttemptCostEvidenceVerified,
  false,
)
assert.equal(result.receipt.artifactPersisted, false)
assert.equal(result.receipt.qaApproved, false)
assert.equal(
  result.receipt.characterRouteRecompiled,
  false,
)
assert.equal(
  result.receipt.privateReviewApproved,
  false,
)
assert.equal(result.receipt.renderAuthorized, false)
assert.equal(result.receipt.productionReady, false)
assert.equal(
  JSON.stringify(result.receipt).includes(
    outputPng.toString('base64'),
  ),
  false,
)

const leased =
  consumeLivingFrameCharacterControlledPreparationPrivateOutputLease(
    result.outputLease,
  )
assert.equal(
  sha256Bytes(leased.outputPng),
  envelope.outputContentSha256,
)
assert.equal(
  sha256Bytes(leased.decodedRgba),
  envelope.decodedRgbaSha256,
)
assert.equal(
  leased.selector.approvedWorkItemId,
  plateUnit.approvedWorkItemId,
)
assert.equal(
  leased.selector
    .approvedPlannedAssetManifestEntryId,
  plateUnit.approvedPlannedAssetManifestEntryId,
)
assert.throws(
  () =>
    consumeLivingFrameCharacterControlledPreparationPrivateOutputLease(
      result.outputLease,
    ),
  (error) =>
    hasIssue(error, 'lease_reused'),
)

await assertRejectsWith(
  createInput(
    envelope,
    packet,
  ),
  'reader_reused',
  async (candidate) => {
    await observeLivingFrameCharacterControlledPreparationPrivateOutput(
      candidate,
    )
    return candidate
  },
)

await assertEnvelopeRejects((draft) => {
  draft.preparationUnitId =
    preparation.preparationUnits.find((unit) =>
      unit.purpose ===
        'prepare_clean_isolated_component')!
      .preparationUnitId
}, 'masked_plate_contract_invalid')

await assertEnvelopeRejects((draft) => {
  draft.approvedWorkItemId =
    'work.cross-substituted'
}, 'result_lineage_invalid')

await assertEnvelopeRejects((draft) => {
  draft.sceneId =
    'scene.cross-substituted'
}, 'source_lineage_mismatch')

await assertEnvelopeRejects((draft) => {
  draft.componentId =
    'component.cross-substituted'
}, 'result_lineage_invalid')

await assertEnvelopeRejects((draft) => {
  draft.outputKey =
    'output.cross-substituted'
}, 'result_lineage_invalid')

await assertEnvelopeRejects((draft) => {
  draft.confirmedOutputFrameExpectationDigestSha256 =
    sha256AuthorityValue('frame.cross-substituted')
}, 'source_lineage_mismatch')

await assertEnvelopeRejects((draft) => {
  draft.graphTopologyDigestSha256 =
    sha256AuthorityValue('graph.generic-empty-latent')
}, 'result_lineage_invalid')

await assertEnvelopeRejects((draft) => {
  draft.canvasClass =
    'isolated_component_square_1024'
  draft.widthPixels = 1024
  draft.heightPixels = 1024
}, 'result_lineage_invalid')

await assertPacketRejects((draft) => {
  draft.outputContentSha256 =
    sha256AuthorityValue('wrong-output')
}, 'result_lineage_invalid')

await assertPacketRejects((draft) => {
  draft.outputPng =
    Buffer.from(draft.outputPng)
  draft.outputPng[32] =
    (draft.outputPng[32] ?? 0) ^ 0xff
}, 'output_digest_mismatch')

await assertPacketRejects((draft) => {
  const mutable = draft as unknown as {
    workerCompletionAuthority: boolean
  }
  mutable.workerCompletionAuthority = true
}, 'output_packet_invalid')

const unsafeEnvelope = {
  ...envelope,
  sourceUrl: 'https://example.test/private.png',
}
assert.equal(
  verifyCanonicalV2ResultEnvelope(unsafeEnvelope),
  false,
)

const {
  observationDigestSha256:
    _observationDigestSha256,
  ...authorityBody
} = result.receipt
void _observationDigestSha256
const forgedAuthorityBody = {
  ...authorityBody,
  artifactPersisted: true,
  assetManifestMutated: true,
  qaApproved: true,
  characterRouteRecompiled: true,
  privateReviewApproved: true,
  renderAuthorized: true,
  productionReady: true,
}
const authorityForgery = {
  ...forgedAuthorityBody,
  observationDigestSha256:
    sha256AuthorityValue(forgedAuthorityBody),
}
assert.equal(
  verifyLivingFrameCharacterControlledPreparationPrivateOutput(
    authorityForgery,
  ),
  false,
)

const forgedMaskBody = {
  ...authorityBody,
  canonicalV2Boundary: {
    ...authorityBody.canonicalV2Boundary,
    exactMaskLoader: 'LoadImage',
  },
}
assert.equal(
  verifyLivingFrameCharacterControlledPreparationPrivateOutput({
    ...forgedMaskBody,
    observationDigestSha256:
      sha256AuthorityValue(forgedMaskBody),
  }),
  false,
)

const forgedRuntimeBody = {
  ...authorityBody,
  runtimePolicy: {
    ...authorityBody.runtimePolicy,
    canonicalToolId: 'unapproved-runtime',
  },
}
assert.equal(
  verifyLivingFrameCharacterControlledPreparationPrivateOutput({
    ...forgedRuntimeBody,
    observationDigestSha256:
      sha256AuthorityValue(forgedRuntimeBody),
  }),
  false,
)

const extraFieldBody = {
  ...authorityBody,
  unrelatedMetadata: 'must-fail-closed',
}
assert.equal(
  verifyLivingFrameCharacterControlledPreparationPrivateOutput({
    ...extraFieldBody,
    observationDigestSha256:
      sha256AuthorityValue(extraFieldBody),
  }),
  false,
)

const forgedPrivacyFlagBody = {
  ...authorityBody,
  containsOutputBytesPathUrlPromptModelCredentialCommandOrEnvironment:
    true,
}
assert.equal(
  verifyLivingFrameCharacterControlledPreparationPrivateOutput({
    ...forgedPrivacyFlagBody,
    observationDigestSha256:
      sha256AuthorityValue(forgedPrivacyFlagBody),
  }),
  false,
)

const forgedAlphaFindingBody = {
  ...authorityBody,
  verifiedOutput: {
    ...authorityBody.verifiedOutput,
    alphaFindingCodes: [
      ...authorityBody.verifiedOutput.alphaFindingCodes,
      'invented_alpha_finding',
    ],
  },
}
assert.equal(
  verifyLivingFrameCharacterControlledPreparationPrivateOutput({
    ...forgedAlphaFindingBody,
    observationDigestSha256:
      sha256AuthorityValue(forgedAlphaFindingBody),
  }),
  false,
)

console.log(JSON.stringify({
  smoke:
    'living_frame_character_controlled_preparation_private_output',
  status: 'passed',
  evidenceClass:
    result.receipt.evidenceClass,
  dimensions: [
    result.receipt.verifiedOutput.widthPixels,
    result.receipt.verifiedOutput.heightPixels,
  ],
  byteLength:
    result.receipt.verifiedOutput.byteLength,
  exactMaskLoader:
    result.receipt.canonicalV2Boundary
      .exactMaskLoader,
  exactMaskChannel:
    result.receipt.canonicalV2Boundary
      .exactMaskChannel,
  exactMaskOutputIndex:
    result.receipt.canonicalV2Boundary
      .exactMaskOutputIndex,
  routeRecompileAfterQa:
    result.receipt.downstreamRequirements
      .routeRecompileAfterQaRequired,
  remotionOwnsFinalCanvas:
    result.receipt.downstreamRequirements
      .remotionOwnsFinalCanvas,
  adversarialAssertions: 20,
  artifactPersisted:
    result.receipt.artifactPersisted,
  qaApproved: result.receipt.qaApproved,
  runtimeExecuted:
    result.receipt.gpuAttemptCreated,
  productionReady:
    result.receipt.productionReady,
}))

function createEnvelope():
LivingFrameCharacterControlledPreparationCanonicalV2ResultEnvelope {
  const draft = {
    envelopeClass:
      'canonical_comfyui_v2_character_preparation_result_envelope_candidate' as const,
    evidenceClass:
      'controlled_source_fixture' as const,
    requestCandidateVersion:
      'canonical-comfyui-gpu-runtime-request-candidate-v2' as const,
    resultCandidateVersion:
      'canonical-comfyui-gpu-runtime-result-candidate-v2' as const,
    canonicalToolId: 'comfyui' as const,
    canonicalOperationId:
      'tool.comfyui.generate_controlled_image.v1' as const,
    requestCandidateDigestSha256:
      sha256AuthorityValue('request-v2'),
    resultCandidateDigestSha256:
      sha256AuthorityValue('result-v2'),
    workerCompletionReceiptDigestSha256:
      sha256AuthorityValue('completion-structural-fixture'),
    runtimeIdentityDigestSha256:
      sha256AuthorityValue('runtime-identity-fixture'),
    runtimeConfinementRequirementDigestSha256:
      sha256AuthorityValue(
        'runtime-confinement-requirement-fixture',
      ),
    modelMountRereadDigestSha256:
      sha256AuthorityValue('model-mount-fixture'),
    resourceCostEvidenceDigestSha256:
      sha256AuthorityValue('resource-cost-fixture'),
    approvedSnapshotId:
      preparation.sourceBindings.approvedSnapshotId,
    approvedSnapshotHashSha256:
      preparation.sourceBindings.approvedSnapshotHashSha256,
    approvedWorkGraphDigestSha256:
      preparation.sourceBindings.approvedWorkGraphDigestSha256,
    currentMasterTimingDigestSha256:
      preparation.sourceBindings.currentMasterTimingDigestSha256,
    confirmedOutputFrameExpectationDigestSha256:
      preparation.sourceBindings
        .confirmedOutputFrameExpectationDigestSha256,
    preparationUnitId:
      plateUnit.preparationUnitId,
    preparationUnitDigestSha256:
      plateUnit.preparationUnitDigestSha256,
    promptUnitId: promptUnit.promptUnitId,
    promptUnitDigestSha256:
      promptUnit.promptUnitDigestSha256,
    graphTopologyDigestSha256:
      promptUnit.graphProfile.graphTopologyDigestSha256,
    sceneId: plateUnit.sceneId,
    componentId: plateUnit.componentId,
    approvedWorkItemId:
      plateUnit.approvedWorkItemId,
    approvedWorkItemKey:
      plateUnit.approvedWorkItemKey,
    approvedPlannedAssetManifestEntryId:
      plateUnit.approvedPlannedAssetManifestEntryId,
    outputKey: plateUnit.outputKey,
    canvasClass:
      plateUnit.generationCanvas.canvasClass,
    widthPixels:
      plateUnit.generationCanvas.widthPixels,
    heightPixels:
      plateUnit.generationCanvas.heightPixels,
    outputCandidateId:
      'output.character.masked-plate.v2.001',
    outputContentType: 'image/png' as const,
    outputByteLength: outputPng.byteLength,
    outputContentSha256:
      sha256Bytes(outputPng),
    decodedRgbaSha256:
      sha256Bytes(decoded.decodedRgba),
    exactModelArtifactCount: 5 as const,
    exactModelRoles: [
      'base_checkpoint',
      'controlnet_checkpoint',
      'lora_adapter',
      'generic_ipadapter_checkpoint',
      'clip_vision_checkpoint',
    ] as const,
    exactModelArtifactByteLength:
      11_700_367_157 as const,
    processEntrypointKind:
      'fixed_supervised_python_process' as const,
    fixedSupervisedProcessRequired:
      true as const,
    atomicFiveModelReadOnlyMountLifetimeRequired:
      true as const,
    allFiveModelRolesVerifiedBeforeAndAfterInferenceRequired:
      true as const,
    deniedTopLevelImports:
      ['sam2'] as const,
    externalNetworkAllowed: false as const,
    runtimeDownloadsAllowed: false as const,
    oneRequestOneProcessOneImageOneAttempt:
      true as const,
    outputBytesIncluded: false as const,
    promptModelPathUrlCredentialCommandOrEnvironmentIncluded:
      false as const,
    canonicalWorkerCompletionAuthority:
      false as const,
    artifactCommitAuthority: false as const,
    qaPassAuthority: false as const,
    customerCostAuthority: false as const,
    finalCanvasAuthority: false as const,
    productionReady: false as const,
  }
  return Object.freeze({
    ...draft,
    envelopeDigestSha256:
      sha256AuthorityValue(draft),
  })
}

function createPacket(
  sourceEnvelope:
    LivingFrameCharacterControlledPreparationCanonicalV2ResultEnvelope,
  bytes: Buffer,
): LivingFrameCharacterControlledPreparationPrivateOutputPacket {
  return {
    packetClass:
      'server_owned_character_preparation_canonical_v2_opaque_png_packet',
    envelopeDigestSha256:
      sourceEnvelope.envelopeDigestSha256,
    preparationUnitId:
      sourceEnvelope.preparationUnitId,
    preparationUnitDigestSha256:
      sourceEnvelope.preparationUnitDigestSha256,
    promptUnitId:
      sourceEnvelope.promptUnitId,
    promptUnitDigestSha256:
      sourceEnvelope.promptUnitDigestSha256,
    graphTopologyDigestSha256:
      sourceEnvelope.graphTopologyDigestSha256,
    sceneId: sourceEnvelope.sceneId,
    componentId: sourceEnvelope.componentId,
    approvedWorkItemId:
      sourceEnvelope.approvedWorkItemId,
    approvedWorkItemKey:
      sourceEnvelope.approvedWorkItemKey,
    approvedPlannedAssetManifestEntryId:
      sourceEnvelope.approvedPlannedAssetManifestEntryId,
    outputKey: sourceEnvelope.outputKey,
    confirmedOutputFrameExpectationDigestSha256:
      sourceEnvelope
        .confirmedOutputFrameExpectationDigestSha256,
    outputCandidateId:
      sourceEnvelope.outputCandidateId,
    outputContentType: 'image/png',
    outputByteLength: bytes.byteLength,
    outputContentSha256:
      sourceEnvelope.outputContentSha256,
    decodedRgbaSha256:
      sourceEnvelope.decodedRgbaSha256,
    widthPixels:
      sourceEnvelope.widthPixels,
    heightPixels:
      sourceEnvelope.heightPixels,
    outputPng: Buffer.from(bytes),
    callerBytesPathUrlPromptModelCredentialCommandOrEnvironmentAccepted:
      false,
    workerCompletionAuthority: false,
    artifactPersistenceAuthority: false,
    qaApprovalAuthority: false,
    finalCanvasAuthority: false,
    productionReady: false,
  }
}

function createInput(
  sourceEnvelope:
    LivingFrameCharacterControlledPreparationCanonicalV2ResultEnvelope,
  sourcePacket:
    LivingFrameCharacterControlledPreparationPrivateOutputPacket,
) {
  return {
    observationId:
      `lf-character-output.${crypto.randomUUID()}`,
    preparation,
    preparationInput,
    privatePrompt,
    canonicalReconciliation,
    canonicalV2ResultEnvelope:
      sourceEnvelope,
    outputReader:
      createLivingFrameCharacterControlledPreparationPrivateOutputReader(
        sourceEnvelope,
        async () => ({
          ...sourcePacket,
          outputPng:
            Buffer.from(sourcePacket.outputPng),
        }),
      ),
  }
}

async function assertEnvelopeRejects(
  mutate: (
    draft: MutableEnvelope,
  ) => void,
  code: string,
): Promise<void> {
  const draft =
    structuredClone(envelope) as
      MutableEnvelope
  mutate(draft)
  const resigned = resignEnvelope(draft)
  await assertRejectsWith(
    createInput(
      resigned,
      createPacket(resigned, outputPng),
    ),
    code,
  )
}

async function assertPacketRejects(
  mutate: (
    draft: MutablePacket,
  ) => void,
  code: string,
): Promise<void> {
  const draft = {
    ...packet,
    outputPng:
      Buffer.from(packet.outputPng),
  } as MutablePacket
  mutate(draft)
  await assertRejectsWith(
    createInput(
      envelope,
      draft as
        LivingFrameCharacterControlledPreparationPrivateOutputPacket,
    ),
    code,
  )
}

async function assertRejectsWith(
  candidate:
    ReturnType<typeof createInput>,
  code: string,
  before?: (
    input: ReturnType<typeof createInput>,
  ) => Promise<ReturnType<typeof createInput>>,
): Promise<void> {
  const actual =
    before ? await before(candidate) : candidate
  await assert.rejects(
    () =>
      observeLivingFrameCharacterControlledPreparationPrivateOutput(
        actual,
      ),
    (error) => hasIssue(error, code),
  )
}

function hasIssue(
  error: unknown,
  code: string,
): boolean {
  return (
    error instanceof
      LivingFrameCharacterControlledPreparationPrivateOutputError
    && error.issues.some((issue) =>
      issue.code === code)
  )
}

type MutableEnvelope = {
  -readonly [Key in keyof LivingFrameCharacterControlledPreparationCanonicalV2ResultEnvelope]:
    LivingFrameCharacterControlledPreparationCanonicalV2ResultEnvelope[Key]
}

type MutablePacket = {
  -readonly [Key in keyof LivingFrameCharacterControlledPreparationPrivateOutputPacket]:
    LivingFrameCharacterControlledPreparationPrivateOutputPacket[Key]
}

function resignEnvelope(
  draft: MutableEnvelope,
): LivingFrameCharacterControlledPreparationCanonicalV2ResultEnvelope {
  const {
    envelopeDigestSha256: _digest,
    ...body
  } = draft
  void _digest
  return {
    ...body,
    envelopeDigestSha256:
      sha256AuthorityValue(body),
  }
}

function createOpaqueRgbPng(
  width: number,
  height: number,
): Buffer {
  const rows =
    Buffer.alloc((width * 3 + 1) * height)
  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * (width * 3 + 1)
    rows[rowOffset] = 0
    for (let x = 0; x < width; x += 1) {
      const offset = rowOffset + 1 + x * 3
      rows[offset] = 38 + (x % 17)
      rows[offset + 1] = 44 + (y % 19)
      rows[offset + 2] = 56 + ((x + y) % 23)
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0
  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(rows)),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

function pngChunk(
  type: 'IHDR' | 'IDAT' | 'IEND',
  data: Buffer,
): Buffer {
  const typeBytes = Buffer.from(type, 'ascii')
  const chunk = Buffer.alloc(12 + data.byteLength)
  chunk.writeUInt32BE(data.byteLength, 0)
  typeBytes.copy(chunk, 4)
  data.copy(chunk, 8)
  chunk.writeUInt32BE(
    pngCrc32(Buffer.concat([typeBytes, data])),
    8 + data.byteLength,
  )
  return chunk
}

function pngCrc32(bytes: Buffer): number {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) {
      crc =
        (crc >>> 1) ^
        (0xedb88320 & -(crc & 1))
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function sha256Bytes(
  bytes: Uint8Array,
): string {
  return createHash('sha256')
    .update(bytes)
    .digest('hex')
}
