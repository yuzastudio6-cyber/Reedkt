import {
  LIVING_FRAME_CHARACTER_MASKED_INPAINT_COMFYUI_NODE_SCHEMA_EVIDENCE_CLASS,
  LIVING_FRAME_CHARACTER_MASKED_INPAINT_COMFYUI_NODE_SCHEMA_EVIDENCE_STATUS,
  LIVING_FRAME_CHARACTER_MASKED_INPAINT_COMFYUI_NODE_SCHEMA_EVIDENCE_VERSION,
  LIVING_FRAME_CHARACTER_MASKED_INPAINT_COMFYUI_NODE_SCHEMA_OPEN_GATES,
  type LivingFrameCharacterMaskedInpaintComfyUiNodeSchemaEvidence,
  type LivingFrameCharacterMaskedInpaintComfyUiNodeSchemaObservation,
} from '../../src/types/living-frame-character-masked-inpaint-comfyui-node-schema-evidence'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

export function compileLivingFrameCharacterMaskedInpaintComfyUiNodeSchemaEvidence(
  observation:
    LivingFrameCharacterMaskedInpaintComfyUiNodeSchemaObservation,
): LivingFrameCharacterMaskedInpaintComfyUiNodeSchemaEvidence {
  assertObservation(observation)
  const observationDigestSha256 =
    sha256AuthorityValue(observation)
  const draft = {
    contractVersion:
      LIVING_FRAME_CHARACTER_MASKED_INPAINT_COMFYUI_NODE_SCHEMA_EVIDENCE_VERSION,
    evidenceClass:
      LIVING_FRAME_CHARACTER_MASKED_INPAINT_COMFYUI_NODE_SCHEMA_EVIDENCE_CLASS,
    status:
      LIVING_FRAME_CHARACTER_MASKED_INPAINT_COMFYUI_NODE_SCHEMA_EVIDENCE_STATUS,
    evidenceId:
      `lf-character-masked-inpaint-node-schema.${observationDigestSha256.slice(0, 40)}`,
    observationDigestSha256,
    imageDigestSha256:
      observation.image.digestSha256,
    sourceRevision:
      observation.source.revision,
    sourceDigestSha256:
      observation.source.sourceDigestSha256,
    loadImageGray8MaskRejected: true as const,
    loadImageMaskRedChannelQualified: true as const,
    vaeEncodeForInpaintQualified: true as const,
    nodeClassMappingsVerified: true as const,
    correctedMaskLoaderClass:
      'LoadImageMask' as const,
    correctedMaskLoaderChannel: 'red' as const,
    correctedMaskOutputIndex: 0 as const,
    openGateCodes:
      LIVING_FRAME_CHARACTER_MASKED_INPAINT_COMFYUI_NODE_SCHEMA_OPEN_GATES,
    imageExecuted: false as const,
    modelLoaded: false as const,
    graphExecuted: false as const,
    operationRegistered: false as const,
    dispatched: false as const,
    runtimeExecuted: false as const,
    assetCreated: false as const,
    qaApproved: false as const,
    publicDeliveryReady: false as const,
    productionReady: false as const,
  }
  return Object.freeze({
    ...draft,
    evidenceDigestSha256:
      sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameCharacterMaskedInpaintComfyUiNodeSchemaEvidence(
  evidence:
    LivingFrameCharacterMaskedInpaintComfyUiNodeSchemaEvidence,
  observation:
    LivingFrameCharacterMaskedInpaintComfyUiNodeSchemaObservation,
): boolean {
  try {
    return JSON.stringify(evidence) ===
      JSON.stringify(
        compileLivingFrameCharacterMaskedInpaintComfyUiNodeSchemaEvidence(
          observation,
        ),
      )
  } catch {
    return false
  }
}

function assertObservation(
  observation:
    LivingFrameCharacterMaskedInpaintComfyUiNodeSchemaObservation,
): void {
  const {
    image,
    source,
    inspection,
    nodeSchemas,
    graphDecision,
    authority,
  } = observation
  if (
    observation.observedAt !== '2026-07-31'
    || image.digestSha256 !==
      '51e854b0a83392f031d7bb70247a71f195bba367f70818b6407138f343c8ec0e'
    || image.operatingSystem !== 'linux'
    || image.architecture !== 'amd64'
    || image.defaultUid !== 65_532
    || image.defaultGid !== 65_532
    || source.repository !==
      'comfyanonymous/ComfyUI'
    || source.revision !==
      '093d571b83e7a79833200e199b46b9f5a62217f9'
    || source.treeSha1 !==
      '15652258f4c49f079158fd492479d379aedbc240'
    || source.archiveDigestSha256 !==
      'dfc771e822aeef3956a3295834a211b36a72e8dce1a7f2bf6b8327a311af9948'
    || source.sourcePath !==
      '/opt/reeditpro/gpu-operations/comfyui/source/nodes.py'
    || source.sourceByteLength !== 107_224
    || source.sourceDigestSha256 !==
      '860b5aa27a99be08627c4f996b2852c998081473a54e7be4f24c6c421f667a8d'
    || !inspection.exactImageResolvedByDigest
    || !inspection.containerCreatedForFilesystemCopy
    || inspection.containerStarted
    || !inspection.sourceCopiedFromImageFilesystem
    || !inspection.sourceMatchedPinnedRevision
    || inspection.imageExecuted
    || inspection.modelLoaded
    || inspection.graphExecuted
    || inspection.networkUsedByImage
    || nodeSchemas.loadImage.classType !== 'LoadImage'
    || JSON.stringify(nodeSchemas.loadImage.returnTypes) !==
      JSON.stringify(['IMAGE', 'MASK'])
    || nodeSchemas.loadImage.maskOutputIndex !== 1
    || !nodeSchemas.loadImage.alphaMaskInverted
    || !nodeSchemas.loadImage.noAlphaProducesZeroMask
    || nodeSchemas.loadImage.suitableForOpaqueGray8Mask
    || nodeSchemas.loadImageMask.classType !==
      'LoadImageMask'
    || JSON.stringify(
      nodeSchemas.loadImageMask.requiredInputs,
    ) !== JSON.stringify(['image', 'channel'])
    || JSON.stringify(
      nodeSchemas.loadImageMask.allowedChannels,
    ) !== JSON.stringify([
      'alpha',
      'red',
      'green',
      'blue',
    ])
    || JSON.stringify(
      nodeSchemas.loadImageMask.returnTypes,
    ) !== JSON.stringify(['MASK'])
    || nodeSchemas.loadImageMask.maskOutputIndex !== 0
    || nodeSchemas.loadImageMask.redChannelIndex !== 0
    || !nodeSchemas.loadImageMask
      .redReturnsImageChannelWithoutAlphaInversion
    || !nodeSchemas.loadImageMask
      .suitableForOpaqueGray8Mask
    || nodeSchemas.vaeEncodeForInpaint.classType !==
      'VAEEncodeForInpaint'
    || JSON.stringify(
      nodeSchemas.vaeEncodeForInpaint.requiredInputs,
    ) !== JSON.stringify([
      'pixels',
      'vae',
      'mask',
      'grow_mask_by',
    ])
    || JSON.stringify(
      nodeSchemas.vaeEncodeForInpaint.inputTypes,
    ) !== JSON.stringify([
      'IMAGE',
      'VAE',
      'MASK',
      'INT',
    ])
    || JSON.stringify(
      nodeSchemas.vaeEncodeForInpaint.returnTypes,
    ) !== JSON.stringify(['LATENT'])
    || nodeSchemas.vaeEncodeForInpaint
      .growMaskDefault !== 6
    || nodeSchemas.vaeEncodeForInpaint
      .growMaskMinimum !== 0
    || nodeSchemas.vaeEncodeForInpaint
      .growMaskMaximum !== 64
    || nodeSchemas.vaeEncodeForInpaint
      .growMaskStep !== 1
    || !nodeSchemas.nodeClassMappingsContainExactClasses
    || graphDecision.maskEncodingProfile !==
      'gray8_mask_png_v1'
    || graphDecision.maskPolarity !==
      'white_one_means_inpaint'
    || graphDecision.maskLoaderClass !==
      'LoadImageMask'
    || graphDecision.maskLoaderChannel !== 'red'
    || graphDecision.maskOutputIndex !== 0
    || graphDecision.plainLoadImageMaskOutputAllowed
    || graphDecision.sourceImageLoaderClass !==
      'LoadImage'
    || graphDecision.vaeEncodeClass !==
      'VAEEncodeForInpaint'
    || graphDecision.growMaskBy !== 6
    || graphDecision.samplerDenoise !== 0.55
    || graphDecision.emptyLatentAllowed
    || Object.values(authority).some(Boolean)
  ) throw new Error(
    'Living Frame masked-inpaint ComfyUI node-schema evidence did not match the exact pinned image source and closed-authority decision.',
  )
}
