import assert from 'node:assert/strict'

import type {
  LivingFrameCharacterMaskedInpaintComfyUiNodeSchemaObservation,
} from '../../src/types/living-frame-character-masked-inpaint-comfyui-node-schema-evidence'
import {
  compileLivingFrameCharacterMaskedInpaintComfyUiNodeSchemaEvidence,
  verifyLivingFrameCharacterMaskedInpaintComfyUiNodeSchemaEvidence,
} from '../living-frame/living-frame-character-masked-inpaint-comfyui-node-schema-evidence'

const observation = buildObservation()
const evidence =
  compileLivingFrameCharacterMaskedInpaintComfyUiNodeSchemaEvidence(
    observation,
  )

assert.equal(
  verifyLivingFrameCharacterMaskedInpaintComfyUiNodeSchemaEvidence(
    evidence,
    observation,
  ),
  true,
)
assert.equal(evidence.loadImageGray8MaskRejected, true)
assert.equal(
  evidence.loadImageMaskRedChannelQualified,
  true,
)
assert.equal(
  evidence.vaeEncodeForInpaintQualified,
  true,
)
assert.equal(
  evidence.correctedMaskLoaderClass,
  'LoadImageMask',
)
assert.equal(
  evidence.correctedMaskLoaderChannel,
  'red',
)
assert.equal(evidence.correctedMaskOutputIndex, 0)
assert.equal(evidence.imageExecuted, false)
assert.equal(evidence.graphExecuted, false)
assert.equal(evidence.runtimeExecuted, false)
assert.equal(evidence.productionReady, false)

let adversarialAssertions = 0
for (const forged of [
  {
    ...observation,
    source: {
      ...observation.source,
      sourceDigestSha256: 'f'.repeat(64),
    },
  },
  {
    ...observation,
    inspection: {
      ...observation.inspection,
      containerStarted: true,
    },
  },
  {
    ...observation,
    nodeSchemas: {
      ...observation.nodeSchemas,
      loadImage: {
        ...observation.nodeSchemas.loadImage,
        suitableForOpaqueGray8Mask: true,
      },
    },
  },
  {
    ...observation,
    nodeSchemas: {
      ...observation.nodeSchemas,
      loadImageMask: {
        ...observation.nodeSchemas.loadImageMask,
        maskOutputIndex: 1,
      },
    },
  },
  {
    ...observation,
    graphDecision: {
      ...observation.graphDecision,
      maskLoaderClass: 'LoadImage',
    },
  },
  {
    ...observation,
    graphDecision: {
      ...observation.graphDecision,
      maskLoaderChannel: 'alpha',
    },
  },
  {
    ...observation,
    graphDecision: {
      ...observation.graphDecision,
      maskOutputIndex: 1,
    },
  },
  {
    ...observation,
    graphDecision: {
      ...observation.graphDecision,
      plainLoadImageMaskOutputAllowed: true,
    },
  },
  {
    ...observation,
    authority: {
      ...observation.authority,
      runtimeAuthority: true,
    },
  },
] as unknown as readonly LivingFrameCharacterMaskedInpaintComfyUiNodeSchemaObservation[]) {
  assert.throws(() =>
    compileLivingFrameCharacterMaskedInpaintComfyUiNodeSchemaEvidence(
      forged,
    ))
  adversarialAssertions += 1
}
assert.equal(adversarialAssertions, 9)

process.stdout.write(`${JSON.stringify({
  smoke:
    'living_frame_character_masked_inpaint_comfyui_node_schema_evidence',
  status: 'passed',
  contractVersion: evidence.contractVersion,
  imageDigestSha256: evidence.imageDigestSha256,
  sourceRevision: evidence.sourceRevision,
  sourceDigestSha256: evidence.sourceDigestSha256,
  loadImageGray8MaskRejected:
    evidence.loadImageGray8MaskRejected,
  loadImageMaskRedChannelQualified:
    evidence.loadImageMaskRedChannelQualified,
  vaeEncodeForInpaintQualified:
    evidence.vaeEncodeForInpaintQualified,
  correctedMaskLoaderClass:
    evidence.correctedMaskLoaderClass,
  correctedMaskLoaderChannel:
    evidence.correctedMaskLoaderChannel,
  correctedMaskOutputIndex:
    evidence.correctedMaskOutputIndex,
  adversarialAssertions,
  imageExecuted: evidence.imageExecuted,
  modelLoaded: evidence.modelLoaded,
  graphExecuted: evidence.graphExecuted,
  operationRegistered: evidence.operationRegistered,
  dispatched: evidence.dispatched,
  runtimeExecuted: evidence.runtimeExecuted,
  productionReady: evidence.productionReady,
})}\n`)

function buildObservation():
LivingFrameCharacterMaskedInpaintComfyUiNodeSchemaObservation {
  return {
    observedAt: '2026-07-31',
    image: {
      digestSha256:
        '51e854b0a83392f031d7bb70247a71f195bba367f70818b6407138f343c8ec0e',
      operatingSystem: 'linux',
      architecture: 'amd64',
      defaultUid: 65_532,
      defaultGid: 65_532,
    },
    source: {
      repository: 'comfyanonymous/ComfyUI',
      revision:
        '093d571b83e7a79833200e199b46b9f5a62217f9',
      treeSha1:
        '15652258f4c49f079158fd492479d379aedbc240',
      archiveDigestSha256:
        'dfc771e822aeef3956a3295834a211b36a72e8dce1a7f2bf6b8327a311af9948',
      sourcePath:
        '/opt/reeditpro/gpu-operations/comfyui/source/nodes.py',
      sourceByteLength: 107_224,
      sourceDigestSha256:
        '860b5aa27a99be08627c4f996b2852c998081473a54e7be4f24c6c421f667a8d',
    },
    inspection: {
      exactImageResolvedByDigest: true,
      containerCreatedForFilesystemCopy: true,
      containerStarted: false,
      sourceCopiedFromImageFilesystem: true,
      sourceMatchedPinnedRevision: true,
      imageExecuted: false,
      modelLoaded: false,
      graphExecuted: false,
      networkUsedByImage: false,
    },
    nodeSchemas: {
      loadImage: {
        classType: 'LoadImage',
        returnTypes: ['IMAGE', 'MASK'],
        maskOutputIndex: 1,
        alphaMaskInverted: true,
        noAlphaProducesZeroMask: true,
        suitableForOpaqueGray8Mask: false,
      },
      loadImageMask: {
        classType: 'LoadImageMask',
        requiredInputs: ['image', 'channel'],
        allowedChannels: [
          'alpha',
          'red',
          'green',
          'blue',
        ],
        returnTypes: ['MASK'],
        maskOutputIndex: 0,
        redChannelIndex: 0,
        redReturnsImageChannelWithoutAlphaInversion:
          true,
        suitableForOpaqueGray8Mask: true,
      },
      vaeEncodeForInpaint: {
        classType: 'VAEEncodeForInpaint',
        requiredInputs: [
          'pixels',
          'vae',
          'mask',
          'grow_mask_by',
        ],
        inputTypes: [
          'IMAGE',
          'VAE',
          'MASK',
          'INT',
        ],
        returnTypes: ['LATENT'],
        growMaskDefault: 6,
        growMaskMinimum: 0,
        growMaskMaximum: 64,
        growMaskStep: 1,
      },
      nodeClassMappingsContainExactClasses: true,
    },
    graphDecision: {
      maskEncodingProfile:
        'gray8_mask_png_v1',
      maskPolarity:
        'white_one_means_inpaint',
      maskLoaderClass: 'LoadImageMask',
      maskLoaderChannel: 'red',
      maskOutputIndex: 0,
      plainLoadImageMaskOutputAllowed: false,
      sourceImageLoaderClass: 'LoadImage',
      vaeEncodeClass: 'VAEEncodeForInpaint',
      growMaskBy: 6,
      samplerDenoise: 0.55,
      emptyLatentAllowed: false,
    },
    authority: {
      canonicalContractMutationAuthority: false,
      operationRegistrationAuthority: false,
      dispatchAuthority: false,
      runtimeAuthority: false,
      modelAuthority: false,
      assetAuthority: false,
      qaApprovalAuthority: false,
      renderAuthority: false,
      billingAuthority: false,
      publicDeliveryAuthority: false,
      productionAuthority: false,
    },
  }
}
