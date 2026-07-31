export const
LIVING_FRAME_CHARACTER_MASKED_INPAINT_COMFYUI_NODE_SCHEMA_EVIDENCE_VERSION =
  'living-frame-character-masked-inpaint-comfyui-node-schema-evidence-v1' as const

export const
LIVING_FRAME_CHARACTER_MASKED_INPAINT_COMFYUI_NODE_SCHEMA_EVIDENCE_CLASS =
  'private_internal_exact_image_source_schema_qualification_receipt' as const

export const
LIVING_FRAME_CHARACTER_MASKED_INPAINT_COMFYUI_NODE_SCHEMA_EVIDENCE_STATUS =
  'gray8_mask_loader_qualified_canonical_v2_and_l4_execution_blocked' as const

export const
LIVING_FRAME_CHARACTER_MASKED_INPAINT_COMFYUI_NODE_SCHEMA_OPEN_GATES = [
  'canonical_comfyui_request_candidate_v2_implementation_required',
  'canonical_private_gray8_mask_staging_and_verification_required',
  'real_l4_masked_inpaint_generation_required',
  'private_output_persistence_qa_and_review_required',
] as const

export interface LivingFrameCharacterMaskedInpaintComfyUiNodeSchemaObservation {
  readonly observedAt: '2026-07-31'
  readonly image: {
    readonly digestSha256:
      '51e854b0a83392f031d7bb70247a71f195bba367f70818b6407138f343c8ec0e'
    readonly operatingSystem: 'linux'
    readonly architecture: 'amd64'
    readonly defaultUid: 65532
    readonly defaultGid: 65532
  }
  readonly source: {
    readonly repository:
      'comfyanonymous/ComfyUI'
    readonly revision:
      '093d571b83e7a79833200e199b46b9f5a62217f9'
    readonly treeSha1:
      '15652258f4c49f079158fd492479d379aedbc240'
    readonly archiveDigestSha256:
      'dfc771e822aeef3956a3295834a211b36a72e8dce1a7f2bf6b8327a311af9948'
    readonly sourcePath:
      '/opt/reeditpro/gpu-operations/comfyui/source/nodes.py'
    readonly sourceByteLength: 107224
    readonly sourceDigestSha256:
      '860b5aa27a99be08627c4f996b2852c998081473a54e7be4f24c6c421f667a8d'
  }
  readonly inspection: {
    readonly exactImageResolvedByDigest: true
    readonly containerCreatedForFilesystemCopy: true
    readonly containerStarted: false
    readonly sourceCopiedFromImageFilesystem: true
    readonly sourceMatchedPinnedRevision: true
    readonly imageExecuted: false
    readonly modelLoaded: false
    readonly graphExecuted: false
    readonly networkUsedByImage: false
  }
  readonly nodeSchemas: {
    readonly loadImage: {
      readonly classType: 'LoadImage'
      readonly returnTypes: readonly ['IMAGE', 'MASK']
      readonly maskOutputIndex: 1
      readonly alphaMaskInverted: true
      readonly noAlphaProducesZeroMask: true
      readonly suitableForOpaqueGray8Mask: false
    }
    readonly loadImageMask: {
      readonly classType: 'LoadImageMask'
      readonly requiredInputs: readonly ['image', 'channel']
      readonly allowedChannels: readonly [
        'alpha',
        'red',
        'green',
        'blue',
      ]
      readonly returnTypes: readonly ['MASK']
      readonly maskOutputIndex: 0
      readonly redChannelIndex: 0
      readonly redReturnsImageChannelWithoutAlphaInversion: true
      readonly suitableForOpaqueGray8Mask: true
    }
    readonly vaeEncodeForInpaint: {
      readonly classType: 'VAEEncodeForInpaint'
      readonly requiredInputs: readonly [
        'pixels',
        'vae',
        'mask',
        'grow_mask_by',
      ]
      readonly inputTypes: readonly [
        'IMAGE',
        'VAE',
        'MASK',
        'INT',
      ]
      readonly returnTypes: readonly ['LATENT']
      readonly growMaskDefault: 6
      readonly growMaskMinimum: 0
      readonly growMaskMaximum: 64
      readonly growMaskStep: 1
    }
    readonly nodeClassMappingsContainExactClasses: true
  }
  readonly graphDecision: {
    readonly maskEncodingProfile:
      'gray8_mask_png_v1'
    readonly maskPolarity:
      'white_one_means_inpaint'
    readonly maskLoaderClass:
      'LoadImageMask'
    readonly maskLoaderChannel: 'red'
    readonly maskOutputIndex: 0
    readonly plainLoadImageMaskOutputAllowed: false
    readonly sourceImageLoaderClass: 'LoadImage'
    readonly vaeEncodeClass:
      'VAEEncodeForInpaint'
    readonly growMaskBy: 6
    readonly samplerDenoise: 0.55
    readonly emptyLatentAllowed: false
  }
  readonly authority: {
    readonly canonicalContractMutationAuthority: false
    readonly operationRegistrationAuthority: false
    readonly dispatchAuthority: false
    readonly runtimeAuthority: false
    readonly modelAuthority: false
    readonly assetAuthority: false
    readonly qaApprovalAuthority: false
    readonly renderAuthority: false
    readonly billingAuthority: false
    readonly publicDeliveryAuthority: false
    readonly productionAuthority: false
  }
}

export interface LivingFrameCharacterMaskedInpaintComfyUiNodeSchemaEvidence {
  readonly contractVersion:
    typeof
      LIVING_FRAME_CHARACTER_MASKED_INPAINT_COMFYUI_NODE_SCHEMA_EVIDENCE_VERSION
  readonly evidenceClass:
    typeof
      LIVING_FRAME_CHARACTER_MASKED_INPAINT_COMFYUI_NODE_SCHEMA_EVIDENCE_CLASS
  readonly status:
    typeof
      LIVING_FRAME_CHARACTER_MASKED_INPAINT_COMFYUI_NODE_SCHEMA_EVIDENCE_STATUS
  readonly evidenceId: string
  readonly observationDigestSha256: string
  readonly evidenceDigestSha256: string
  readonly imageDigestSha256:
    LivingFrameCharacterMaskedInpaintComfyUiNodeSchemaObservation['image']['digestSha256']
  readonly sourceRevision:
    LivingFrameCharacterMaskedInpaintComfyUiNodeSchemaObservation['source']['revision']
  readonly sourceDigestSha256:
    LivingFrameCharacterMaskedInpaintComfyUiNodeSchemaObservation['source']['sourceDigestSha256']
  readonly loadImageGray8MaskRejected: true
  readonly loadImageMaskRedChannelQualified: true
  readonly vaeEncodeForInpaintQualified: true
  readonly nodeClassMappingsVerified: true
  readonly correctedMaskLoaderClass:
    'LoadImageMask'
  readonly correctedMaskLoaderChannel: 'red'
  readonly correctedMaskOutputIndex: 0
  readonly openGateCodes:
    typeof
      LIVING_FRAME_CHARACTER_MASKED_INPAINT_COMFYUI_NODE_SCHEMA_OPEN_GATES
  readonly imageExecuted: false
  readonly modelLoaded: false
  readonly graphExecuted: false
  readonly operationRegistered: false
  readonly dispatched: false
  readonly runtimeExecuted: false
  readonly assetCreated: false
  readonly qaApproved: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}
