import { createHash, randomUUID } from 'node:crypto'

import {
  LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_OUTPUT_CLASS,
  LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_OUTPUT_EVIDENCE_CLASSES,
  LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_OUTPUT_ISSUE_CODES,
  LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_OUTPUT_OPEN_GATES,
  LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_OUTPUT_STATE,
  LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_OUTPUT_VERSION,
  type LivingFrameCharacterControlledPreparationCanonicalV2ResultEnvelope,
  type LivingFrameCharacterControlledPreparationPrivateOutput,
  type LivingFrameCharacterControlledPreparationPrivateOutputAuthority,
  type LivingFrameCharacterControlledPreparationPrivateOutputDraft,
  type LivingFrameCharacterControlledPreparationPrivateOutputIssue,
  type LivingFrameCharacterControlledPreparationPrivateOutputIssueCode,
  type LivingFrameCharacterControlledPreparationPrivateOutputLease,
} from '../../src/types/living-frame-character-controlled-preparation-private-output'
import type {
  LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliation,
} from '../../src/types/living-frame-character-controlled-preparation-canonical-comfyui-reconciliation'
import type {
  LivingFrameCharacterControlledPreparationPrivatePrompt,
} from '../../src/types/living-frame-character-controlled-preparation-private-prompt'
import type {
  LivingFrameCharacterControlledPreparation,
} from '../../src/types/living-frame-character-controlled-preparation'
import {
  LIVING_FRAME_ALPHA_FINDING_CODES,
} from '../../src/types/living-frame-alpha-measurement'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  measureLivingFrameAlphaArtifact,
  verifyLivingFrameAlphaMeasurementReportDigest,
} from './living-frame-alpha-measurement'
import {
  verifyLivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliation,
} from './living-frame-character-controlled-preparation-canonical-comfyui-reconciliation'
import {
  verifyLivingFrameCharacterControlledPreparationPrivatePrompt,
} from './living-frame-character-controlled-preparation-private-prompt'
import {
  type CreateLivingFrameCharacterControlledPreparationInput,
  verifyLivingFrameCharacterControlledPreparation,
} from './living-frame-character-controlled-preparation'
import {
  LivingFramePrivateOpaqueRgbPngVerificationError,
  verifyLivingFramePrivateOpaqueRgbPng,
} from './living-frame-private-opaque-rgb-png-verifier'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const MAXIMUM_OUTPUT_BYTES = 64 * 1_024 * 1_024
const MAXIMUM_DIMENSION = 4_096
const MAXIMUM_PIXEL_COUNT = 8_294_400
const EXACT_MODEL_ROLES = [
  'base_checkpoint',
  'controlnet_checkpoint',
  'lora_adapter',
  'generic_ipadapter_checkpoint',
  'clip_vision_checkpoint',
] as const
const URL_LIKE = /(?:https?:\/\/|file:\/\/|data:|javascript:)/iu
const SECRET_LIKE =
  /(?:-----BEGIN [A-Z ]+PRIVATE KEY-----|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9_-]{16,})/u

const AUTHORITY_BOUNDARY:
  LivingFrameCharacterControlledPreparationPrivateOutputAuthority =
  deepFreeze({
    privateCharacterOutputObservationAuthority: true,
    canonicalRuntimeCompilerAuthority: false,
    canonicalWorkerCompletionAuthority: false,
    operationRegistryAuthority: false,
    dispatchAuthority: false,
    gpuAttemptAuthority: false,
    actualCostAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    timingAuthority: false,
    workGraphMutationAuthority: false,
    artifactPersistenceAuthority: false,
    assetManifestAuthority: false,
    segmentationOrMattingAuthority: false,
    alphaQaAuthority: false,
    continuityQaAuthority: false,
    documentaryFactAuthority: false,
    characterRouteAuthority: false,
    privateReviewAuthority: false,
    renderAuthority: false,
    finalCanvasAuthority: false,
    billingAuthority: false,
    publicDeliveryAuthority: false,
    productionAuthority: false,
  })

export interface LivingFrameCharacterControlledPreparationPrivateOutputPacket {
  readonly packetClass:
    'server_owned_character_preparation_canonical_v2_opaque_png_packet'
  readonly envelopeDigestSha256: string
  readonly preparationUnitId: string
  readonly preparationUnitDigestSha256: string
  readonly promptUnitId: string
  readonly promptUnitDigestSha256: string
  readonly graphTopologyDigestSha256: string
  readonly sceneId: string
  readonly componentId: string
  readonly approvedWorkItemId: string
  readonly approvedWorkItemKey: string
  readonly approvedPlannedAssetManifestEntryId: string
  readonly outputKey: string
  readonly confirmedOutputFrameExpectationDigestSha256: string
  readonly outputCandidateId: string
  readonly outputContentType: 'image/png'
  readonly outputByteLength: number
  readonly outputContentSha256: string
  readonly decodedRgbaSha256: string
  readonly widthPixels: number
  readonly heightPixels: number
  readonly outputPng: Buffer
  readonly callerBytesPathUrlPromptModelCredentialCommandOrEnvironmentAccepted:
    false
  readonly workerCompletionAuthority: false
  readonly artifactPersistenceAuthority: false
  readonly qaApprovalAuthority: false
  readonly finalCanvasAuthority: false
  readonly productionReady: false
}

export interface LivingFrameCharacterControlledPreparationPrivateOutputReader {
  readonly readerClass:
    'process_bound_single_use_character_preparation_canonical_v2_output_reader'
  readonly binding: {
    readonly envelopeDigestSha256: string
    readonly preparationUnitId: string
    readonly outputCandidateId: string
    readonly outputContentSha256: string
    readonly readerBindingDigestSha256: string
  }
  read(): Promise<
    LivingFrameCharacterControlledPreparationPrivateOutputPacket
  >
}

export interface ObserveLivingFrameCharacterControlledPreparationPrivateOutputInput {
  readonly observationId: string
  readonly preparation:
    LivingFrameCharacterControlledPreparation
  readonly preparationInput:
    CreateLivingFrameCharacterControlledPreparationInput
  readonly privatePrompt:
    LivingFrameCharacterControlledPreparationPrivatePrompt
  readonly canonicalReconciliation:
    LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliation
  readonly canonicalV2ResultEnvelope:
    LivingFrameCharacterControlledPreparationCanonicalV2ResultEnvelope
  readonly outputReader:
    LivingFrameCharacterControlledPreparationPrivateOutputReader
}

export interface LivingFrameCharacterControlledPreparationVerifiedPrivateOutput {
  readonly outputPng: Buffer
  readonly decodedRgba: Buffer
  readonly selector: {
    readonly observationId: string
    readonly preparationUnitId: string
    readonly outputCandidateId: string
    readonly outputContentSha256: string
    readonly decodedRgbaSha256: string
    readonly approvedWorkItemId: string
    readonly approvedPlannedAssetManifestEntryId: string
    readonly outputKey: string
    readonly widthPixels: number
    readonly heightPixels: number
    readonly disposition:
      'opaque_masked_plate_requires_hidden_plate_continuity_fact_and_destination_qa'
  }
}

export interface LivingFrameCharacterControlledPreparationPrivateOutputResult {
  readonly receipt:
    LivingFrameCharacterControlledPreparationPrivateOutput
  readonly outputLease:
    LivingFrameCharacterControlledPreparationPrivateOutputLease
}

const readers = new WeakSet<object>()
const consumedReaders = new WeakSet<object>()
const leases = new WeakSet<object>()
const consumedLeases = new WeakSet<object>()
const privateOutputs = new WeakMap<
  object,
  LivingFrameCharacterControlledPreparationVerifiedPrivateOutput
>()

export class LivingFrameCharacterControlledPreparationPrivateOutputError
  extends Error {
  readonly issues:
    readonly LivingFrameCharacterControlledPreparationPrivateOutputIssue[]

  constructor(
    issues:
      readonly LivingFrameCharacterControlledPreparationPrivateOutputIssue[],
  ) {
    super(
      'Living Frame character controlled-preparation private output observation failed.',
    )
    this.name =
      'LivingFrameCharacterControlledPreparationPrivateOutputError'
    this.issues = issues
  }
}

export function createLivingFrameCharacterControlledPreparationPrivateOutputReader(
  envelope:
    LivingFrameCharacterControlledPreparationCanonicalV2ResultEnvelope,
  loader: () => Promise<
    LivingFrameCharacterControlledPreparationPrivateOutputPacket
  >,
): LivingFrameCharacterControlledPreparationPrivateOutputReader {
  if (
    !verifyCanonicalV2ResultEnvelope(envelope)
    || typeof loader !== 'function'
  ) throw invalid('reader_invalid', '$.reader')
  const bindingDraft = {
    envelopeDigestSha256:
      envelope.envelopeDigestSha256,
    preparationUnitId:
      envelope.preparationUnitId,
    outputCandidateId:
      envelope.outputCandidateId,
    outputContentSha256:
      envelope.outputContentSha256,
  }
  const reader:
    LivingFrameCharacterControlledPreparationPrivateOutputReader =
    Object.freeze({
      readerClass:
        'process_bound_single_use_character_preparation_canonical_v2_output_reader',
      binding: Object.freeze({
        ...bindingDraft,
        readerBindingDigestSha256:
          sha256AuthorityValue(bindingDraft),
      }),
      read: loader,
    })
  readers.add(reader)
  return reader
}

export async function observeLivingFrameCharacterControlledPreparationPrivateOutput(
  input:
    ObserveLivingFrameCharacterControlledPreparationPrivateOutputInput,
): Promise<
  LivingFrameCharacterControlledPreparationPrivateOutputResult
> {
  assertInput(input)
  if (
    !await verifyLivingFrameCharacterControlledPreparation(
      input.preparation,
      input.preparationInput,
    )
  ) throw invalid(
    'preparation_invalid',
    '$.preparation',
  )
  if (
    !verifyLivingFrameCharacterControlledPreparationPrivatePrompt(
      input.privatePrompt,
    )
  ) throw invalid(
    'private_prompt_invalid',
    '$.privatePrompt',
  )
  if (
    !verifyLivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliation(
      input.canonicalReconciliation,
    )
  ) throw invalid(
    'canonical_reconciliation_invalid',
    '$.canonicalReconciliation',
  )
  if (
    !verifyCanonicalV2ResultEnvelope(
      input.canonicalV2ResultEnvelope,
    )
  ) throw invalid(
    'result_envelope_invalid',
    '$.canonicalV2ResultEnvelope',
  )
  const bindings = assertSourceLineage(input)
  const reader = requireReader(
    input.outputReader,
    input.canonicalV2ResultEnvelope,
  )
  consumedReaders.add(reader)
  let packet:
    LivingFrameCharacterControlledPreparationPrivateOutputPacket
  try {
    packet = await reader.read()
  } catch {
    throw invalid('reader_failed', '$.outputReader')
  }
  assertOutputPacket(
    packet,
    input.canonicalV2ResultEnvelope,
  )
  const outputBytes = Buffer.from(packet.outputPng)
  if (
    outputBytes.byteLength !== packet.outputByteLength
    || digestBytes(outputBytes) !== packet.outputContentSha256
  ) throw invalid(
    'output_digest_mismatch',
    '$.outputReader.outputPng',
  )
  const decoded = decodeOutput(
    outputBytes,
    packet.widthPixels,
    packet.heightPixels,
  )
  const decodedRgbaSha256 =
    digestBytes(decoded.decodedRgba)
  if (
    decodedRgbaSha256 !== packet.decodedRgbaSha256
    || decodedRgbaSha256 !==
      input.canonicalV2ResultEnvelope.decodedRgbaSha256
  ) throw invalid(
    'output_digest_mismatch',
    '$.outputReader.decodedRgba',
  )
  const alpha =
    measureLivingFrameAlphaArtifact({
      artifactId: packet.outputCandidateId,
      artifactDigestSha256:
        packet.outputContentSha256,
      width: packet.widthPixels,
      height: packet.heightPixels,
      rgbaBytes: decoded.decodedRgba,
      alphaMode: 'straight_alpha',
      alphaExpectation: 'opaque_plate_expected',
    })
  assertAlpha(alpha, packet.widthPixels, packet.heightPixels)

  const draft:
    LivingFrameCharacterControlledPreparationPrivateOutputDraft = {
      contractVersion:
        LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_OUTPUT_VERSION,
      resultClass:
        LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_OUTPUT_CLASS,
      observationState:
        LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_OUTPUT_STATE,
      observationId: input.observationId,
      canonicalScope: {
        workspaceId:
          input.preparation.canonicalScope.workspaceId,
        projectId:
          input.preparation.canonicalScope.projectId,
        editSessionId:
          input.preparation.canonicalScope.editSessionId,
        sceneId: bindings.unit.sceneId,
        componentId: bindings.unit.componentId,
      },
      exactOutputLineage: {
        preparationUnitId:
          bindings.unit.preparationUnitId,
        preparationUnitDigestSha256:
          bindings.unit.preparationUnitDigestSha256,
        purpose: bindings.unit.purpose,
        promptUnitId:
          bindings.promptUnit.promptUnitId,
        promptUnitDigestSha256:
          bindings.promptUnit.promptUnitDigestSha256,
        graphTopologyDigestSha256:
          bindings.promptUnit.graphProfile
            .graphTopologyDigestSha256,
        approvedWorkItemId:
          bindings.unit.approvedWorkItemId,
        approvedWorkItemKey:
          bindings.unit.approvedWorkItemKey,
        approvedPlannedAssetManifestEntryId:
          bindings.unit
            .approvedPlannedAssetManifestEntryId,
        outputKey: bindings.unit.outputKey,
      },
      sourceBindings: {
        preparationDigestSha256:
          input.preparation.preparationDigestSha256,
        privatePromptMaterializationDigestSha256:
          input.privatePrompt
            .materializationDigestSha256,
        canonicalComfyUiReconciliationDigestSha256:
          input.canonicalReconciliation
            .reconciliationDigestSha256,
        canonicalV2RequestCandidateDigestSha256:
          input.canonicalV2ResultEnvelope
            .requestCandidateDigestSha256,
        canonicalV2ResultCandidateDigestSha256:
          input.canonicalV2ResultEnvelope
            .resultCandidateDigestSha256,
        canonicalWorkerCompletionReceiptDigestSha256:
          input.canonicalV2ResultEnvelope
            .workerCompletionReceiptDigestSha256,
        approvedSnapshotId:
          input.preparation.sourceBindings
            .approvedSnapshotId,
        approvedSnapshotHashSha256:
          input.preparation.sourceBindings
            .approvedSnapshotHashSha256,
        approvedWorkGraphDigestSha256:
          input.preparation.sourceBindings
            .approvedWorkGraphDigestSha256,
        currentMasterTimingDigestSha256:
          input.preparation.sourceBindings
            .currentMasterTimingDigestSha256,
        confirmedOutputFrameExpectationDigestSha256:
          input.preparation.sourceBindings
            .confirmedOutputFrameExpectationDigestSha256,
        runtimeIdentityDigestSha256:
          input.canonicalV2ResultEnvelope
            .runtimeIdentityDigestSha256,
        runtimeConfinementRequirementDigestSha256:
          input.canonicalV2ResultEnvelope
            .runtimeConfinementRequirementDigestSha256,
        modelMountRereadDigestSha256:
          input.canonicalV2ResultEnvelope
            .modelMountRereadDigestSha256,
        resourceCostEvidenceDigestSha256:
          input.canonicalV2ResultEnvelope
            .resourceCostEvidenceDigestSha256,
        envelopeDigestSha256:
          input.canonicalV2ResultEnvelope
            .envelopeDigestSha256,
        readerBindingDigestSha256:
          reader.binding.readerBindingDigestSha256,
      },
      canonicalV2Boundary: {
        requestCandidateVersion:
          'canonical-comfyui-gpu-runtime-request-candidate-v2',
        resultCandidateVersion:
          'canonical-comfyui-gpu-runtime-result-candidate-v2',
        sameCanonicalToolAndOperation: true,
        exactMaskEncodingProfile:
          'gray8_mask_png_v1',
        exactMaskLoader: 'LoadImageMask',
        exactMaskChannel: 'red',
        exactMaskOutputIndex: 0,
        maskPolarity:
          'white_one_means_inpaint',
        plainLoadImageMaskOutputAllowed: false,
        exactInpaintEncoder:
          'VAEEncodeForInpaint',
        exactGrowMaskBy: 6,
        exactSamplerDenoise: 0.55,
        emptyLatentSubstitutionAllowed: false,
        arbitraryNodeOrSlotExpansionAllowed: false,
      },
      verifiedOutput: {
        outputCandidateId:
          packet.outputCandidateId,
        contentType: 'image/png',
        byteLength: outputBytes.byteLength,
        contentSha256:
          packet.outputContentSha256,
        decodedRgbaSha256,
        widthPixels: packet.widthPixels,
        heightPixels: packet.heightPixels,
        decodedChannelCount: 4,
        sourcePngHadAlphaChannel: false,
        transparentPixelCount: 0,
        semiTransparentPixelCount: 0,
        opaquePixelCount:
          packet.widthPixels * packet.heightPixels,
        alphaMeasurementReportDigestSha256:
          alpha.reportDigestSha256,
        alphaFindingCodes:
          alpha.findingCodes,
        canvasClass:
          input.canonicalV2ResultEnvelope.canvasClass,
        sourceDisposition:
          'opaque_masked_plate_requires_hidden_plate_continuity_fact_and_destination_qa',
      },
      downstreamRequirements: {
        outputRemainsIntermediate: true,
        existingSelectedScenePrivateOutputObservationV2AdapterRequired:
          true,
        createOnlyPersistenceAndExactRereadRequired:
          true,
        canonicalAssetManifestReconciliationRequired:
          true,
        routeRecompileAfterQaRequired: true,
        independentPerFrameGenerationAllowed:
          false,
        remotionOwnsFinalCanvas: true,
      },
      runtimePolicy: {
        canonicalToolId: 'comfyui',
        canonicalOperationId:
          'tool.comfyui.generate_controlled_image.v1',
        exactModelArtifactCount: 5,
        exactModelRoles: EXACT_MODEL_ROLES,
        exactModelArtifactByteLength:
          11_700_367_157,
        processEntrypointKind:
          'fixed_supervised_python_process',
        fixedSupervisedProcessRequired: true,
        atomicFiveModelReadOnlyMountLifetimeRequired:
          true,
        allFiveModelRolesVerifiedBeforeAndAfterInferenceRequired:
          true,
        deniedTopLevelImports: ['sam2'],
        externalNetworkAllowed: false,
        runtimeDownloadsAllowed: false,
        oneRequestOneProcessOneImageOneAttempt:
          true,
        oneGpuAttemptAndCostEventForAllInProcessCapabilities:
          true,
        finalCanvasCreatedByComfyUi: false,
      },
      evidenceClass:
        input.canonicalV2ResultEnvelope.evidenceClass,
      openGateCodes:
        LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_OUTPUT_OPEN_GATES,
      authorityBoundary: AUTHORITY_BOUNDARY,
      exactPrivateOutputBytesRereadAndDecoded:
        true,
      alphaMeasurementRecomputedFromDecodedBytes:
        true,
      canonicalWorkerCompletionInferred: false,
      gpuAttemptCreated: false,
      actualAttemptCostEvidenceVerified: false,
      artifactPersisted: false,
      assetManifestMutated: false,
      qaApproved: false,
      characterRouteRecompiled: false,
      privateReviewApproved: false,
      renderAuthorized: false,
      containsOutputBytesPathUrlPromptModelCredentialCommandOrEnvironment:
        false,
      containsPriceCreditServiceFeeReservationWalletOrLedgerData:
        false,
      publicDeliveryReady: false,
      productionReady: false,
    }
  assertReceipt(draft)
  const receipt = deepFreeze({
    ...draft,
    observationDigestSha256:
      sha256AuthorityValue(draft),
  })
  const leaseDraft = {
    leaseClass:
      'process_bound_single_use_verified_character_preparation_output_lease' as const,
    leaseId:
      `lf-character-output.${randomUUID()}`,
    observationId:
      receipt.observationId,
    preparationUnitId:
      receipt.exactOutputLineage.preparationUnitId,
    outputCandidateId:
      receipt.verifiedOutput.outputCandidateId,
    outputContentSha256:
      receipt.verifiedOutput.contentSha256,
  }
  const outputLease:
    LivingFrameCharacterControlledPreparationPrivateOutputLease =
    Object.freeze({
      ...leaseDraft,
      leaseBindingDigestSha256:
        sha256AuthorityValue(leaseDraft),
    })
  leases.add(outputLease)
  privateOutputs.set(outputLease, {
    outputPng: Buffer.from(outputBytes),
    decodedRgba:
      Buffer.from(decoded.decodedRgba),
    selector: {
      observationId: receipt.observationId,
      preparationUnitId:
        receipt.exactOutputLineage.preparationUnitId,
      outputCandidateId:
        receipt.verifiedOutput.outputCandidateId,
      outputContentSha256:
        receipt.verifiedOutput.contentSha256,
      decodedRgbaSha256:
        receipt.verifiedOutput.decodedRgbaSha256,
      approvedWorkItemId:
        receipt.exactOutputLineage.approvedWorkItemId,
      approvedPlannedAssetManifestEntryId:
        receipt.exactOutputLineage
          .approvedPlannedAssetManifestEntryId,
      outputKey:
        receipt.exactOutputLineage.outputKey,
      widthPixels:
        receipt.verifiedOutput.widthPixels,
      heightPixels:
        receipt.verifiedOutput.heightPixels,
      disposition:
        receipt.verifiedOutput.sourceDisposition,
    },
  })
  return Object.freeze({
    receipt,
    outputLease,
  })
}

export function consumeLivingFrameCharacterControlledPreparationPrivateOutputLease(
  lease:
    LivingFrameCharacterControlledPreparationPrivateOutputLease,
): LivingFrameCharacterControlledPreparationVerifiedPrivateOutput {
  if (!leases.has(lease)) throw invalid(
    'lease_invalid',
    '$.outputLease',
  )
  if (consumedLeases.has(lease)) throw invalid(
    'lease_reused',
    '$.outputLease',
  )
  const output = privateOutputs.get(lease)
  if (
    !output
    || lease.leaseBindingDigestSha256 !==
      sha256AuthorityValue({
        leaseClass: lease.leaseClass,
        leaseId: lease.leaseId,
        observationId: lease.observationId,
        preparationUnitId:
          lease.preparationUnitId,
        outputCandidateId:
          lease.outputCandidateId,
        outputContentSha256:
          lease.outputContentSha256,
      })
  ) throw invalid('lease_invalid', '$.outputLease')
  consumedLeases.add(lease)
  privateOutputs.delete(lease)
  return {
    outputPng: Buffer.from(output.outputPng),
    decodedRgba: Buffer.from(output.decodedRgba),
    selector: output.selector,
  }
}

export function verifyLivingFrameCharacterControlledPreparationPrivateOutput(
  value: unknown,
): value is LivingFrameCharacterControlledPreparationPrivateOutput {
  try {
    if (
      !isRecord(value)
      || value.contractVersion !==
        LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_OUTPUT_VERSION
      || value.resultClass !==
        LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_OUTPUT_CLASS
      || value.observationState !==
        LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_OUTPUT_STATE
      || typeof value.observationDigestSha256 !== 'string'
      || !SHA256.test(value.observationDigestSha256)
    ) return false
    const {
      observationDigestSha256,
      ...draft
    } = value
    assertReceipt(
      draft as unknown as
        LivingFrameCharacterControlledPreparationPrivateOutputDraft,
    )
    return observationDigestSha256 ===
      sha256AuthorityValue(draft)
  } catch {
    return false
  }
}

export function verifyCanonicalV2ResultEnvelope(
  value: unknown,
): value is
  LivingFrameCharacterControlledPreparationCanonicalV2ResultEnvelope {
  try {
    if (
      !isRecord(value)
      || value.envelopeClass !==
        'canonical_comfyui_v2_character_preparation_result_envelope_candidate'
      || !(
        LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_OUTPUT_EVIDENCE_CLASSES as
          readonly string[]
      ).includes(value.evidenceClass as string)
      || value.requestCandidateVersion !==
        'canonical-comfyui-gpu-runtime-request-candidate-v2'
      || value.resultCandidateVersion !==
        'canonical-comfyui-gpu-runtime-result-candidate-v2'
      || value.canonicalToolId !== 'comfyui'
      || value.canonicalOperationId !==
        'tool.comfyui.generate_controlled_image.v1'
      || !exactEnvelopeShape(value)
    ) return false
    const {
      envelopeDigestSha256,
      ...draft
    } = value
    return typeof envelopeDigestSha256 === 'string'
      && SHA256.test(envelopeDigestSha256)
      && envelopeDigestSha256 ===
        sha256AuthorityValue(draft)
      && !containsUnsafeReceiptKey(value)
  } catch {
    return false
  }
}

function assertSourceLineage(
  input:
    ObserveLivingFrameCharacterControlledPreparationPrivateOutputInput,
) {
  const envelope = input.canonicalV2ResultEnvelope
  const preparation = input.preparation
  const prompt = input.privatePrompt
  const reconciliation =
    input.canonicalReconciliation
  if (
    prompt.sourceBindings.preparationDigestSha256 !==
      preparation.preparationDigestSha256
    || reconciliation.sourceBindings
      .preparationDigestSha256 !==
      preparation.preparationDigestSha256
    || reconciliation.sourceBindings
      .privatePromptMaterializationDigestSha256 !==
      prompt.materializationDigestSha256
    || envelope.approvedSnapshotId !==
      preparation.sourceBindings.approvedSnapshotId
    || envelope.approvedSnapshotHashSha256 !==
      preparation.sourceBindings.approvedSnapshotHashSha256
    || envelope.approvedWorkGraphDigestSha256 !==
      preparation.sourceBindings.approvedWorkGraphDigestSha256
    || envelope.currentMasterTimingDigestSha256 !==
      preparation.sourceBindings.currentMasterTimingDigestSha256
    || envelope.confirmedOutputFrameExpectationDigestSha256 !==
      preparation.sourceBindings
        .confirmedOutputFrameExpectationDigestSha256
    || envelope.sceneId !==
      preparation.canonicalScope.sceneId
  ) throw invalid(
    'source_lineage_mismatch',
    '$.sourceBindings',
  )
  const unit =
    preparation.preparationUnits.find((candidate) =>
      candidate.preparationUnitId ===
        envelope.preparationUnitId)
  const promptUnit =
    prompt.promptUnits.find((candidate) =>
      candidate.preparationUnitId ===
        envelope.preparationUnitId)
  const reconciliationUnit =
    reconciliation.reconciliationUnits.find((candidate) =>
      candidate.preparationUnitId ===
        envelope.preparationUnitId)
  if (!unit || !promptUnit || !reconciliationUnit) {
    throw invalid(
      'preparation_unit_missing',
      '$.canonicalV2ResultEnvelope.preparationUnitId',
    )
  }
  if (
    unit.purpose !==
      'reconstruct_exposed_source_plate'
    || unit.graphProfile.graphFamily !==
      'controlled_sdxl_masked_inpaint_v1'
    || unit.generationCanvas.canvasClass !==
      'confirmed_full_frame_ratio'
    || promptUnit.graphProfile
      .maskedInpaintUsesVaeEncodeForInpaint !== true
    || promptUnit.graphProfile
      .genericEmptyLatentSubstitutionAllowed !== false
    || reconciliationUnit
      .maskedInpaintExtensionRequirement.required !== true
    || reconciliationUnit
      .maskedInpaintExtensionRequirement
      .requestedTargetContractVersion !==
        'canonical-comfyui-gpu-runtime-request-candidate-v2'
  ) throw invalid(
    'masked_plate_contract_invalid',
    '$.canonicalV2ResultEnvelope',
  )
  if (
    envelope.sceneId !== unit.sceneId
    || envelope.componentId !== unit.componentId
    || envelope.preparationUnitDigestSha256 !==
      unit.preparationUnitDigestSha256
    || envelope.promptUnitId !==
      promptUnit.promptUnitId
    || envelope.promptUnitDigestSha256 !==
      promptUnit.promptUnitDigestSha256
    || envelope.graphTopologyDigestSha256 !==
      promptUnit.graphProfile.graphTopologyDigestSha256
    || envelope.approvedWorkItemId !==
      unit.approvedWorkItemId
    || envelope.approvedWorkItemKey !==
      unit.approvedWorkItemKey
    || envelope.approvedPlannedAssetManifestEntryId !==
      unit.approvedPlannedAssetManifestEntryId
    || envelope.outputKey !== unit.outputKey
    || envelope.canvasClass !==
      unit.generationCanvas.canvasClass
    || envelope.widthPixels !==
      unit.generationCanvas.widthPixels
    || envelope.heightPixels !==
      unit.generationCanvas.heightPixels
    || envelope.confirmedOutputFrameExpectationDigestSha256 !==
      unit.generationCanvas
        .confirmedOutputFrameExpectationDigestSha256
    || envelope.outputContentType !== 'image/png'
  ) throw invalid(
    'result_lineage_invalid',
    '$.canonicalV2ResultEnvelope',
  )
  return {
    unit,
    promptUnit,
    reconciliationUnit,
  }
}

function requireReader(
  reader:
    LivingFrameCharacterControlledPreparationPrivateOutputReader,
  envelope:
    LivingFrameCharacterControlledPreparationCanonicalV2ResultEnvelope,
): LivingFrameCharacterControlledPreparationPrivateOutputReader {
  if (
    reader
    && readers.has(reader)
    && consumedReaders.has(reader)
  ) throw invalid('reader_reused', '$.outputReader')
  const bindingDraft = {
    envelopeDigestSha256:
      envelope.envelopeDigestSha256,
    preparationUnitId:
      envelope.preparationUnitId,
    outputCandidateId:
      envelope.outputCandidateId,
    outputContentSha256:
      envelope.outputContentSha256,
  }
  if (
    !reader
    || !readers.has(reader)
    || consumedReaders.has(reader)
    || reader.readerClass !==
      'process_bound_single_use_character_preparation_canonical_v2_output_reader'
    || reader.binding.envelopeDigestSha256 !==
      bindingDraft.envelopeDigestSha256
    || reader.binding.preparationUnitId !==
      bindingDraft.preparationUnitId
    || reader.binding.outputCandidateId !==
      bindingDraft.outputCandidateId
    || reader.binding.outputContentSha256 !==
      bindingDraft.outputContentSha256
    || reader.binding.readerBindingDigestSha256 !==
      sha256AuthorityValue(bindingDraft)
  ) throw invalid('reader_invalid', '$.outputReader')
  return reader
}

function assertOutputPacket(
  packet: unknown,
  envelope:
    LivingFrameCharacterControlledPreparationCanonicalV2ResultEnvelope,
): asserts packet is
  LivingFrameCharacterControlledPreparationPrivateOutputPacket {
  if (
    !isRecord(packet)
    || !hasExactKeys(packet, [
      'packetClass',
      'envelopeDigestSha256',
      'preparationUnitId',
      'preparationUnitDigestSha256',
      'promptUnitId',
      'promptUnitDigestSha256',
      'graphTopologyDigestSha256',
      'sceneId',
      'componentId',
      'approvedWorkItemId',
      'approvedWorkItemKey',
      'approvedPlannedAssetManifestEntryId',
      'outputKey',
      'confirmedOutputFrameExpectationDigestSha256',
      'outputCandidateId',
      'outputContentType',
      'outputByteLength',
      'outputContentSha256',
      'decodedRgbaSha256',
      'widthPixels',
      'heightPixels',
      'outputPng',
      'callerBytesPathUrlPromptModelCredentialCommandOrEnvironmentAccepted',
      'workerCompletionAuthority',
      'artifactPersistenceAuthority',
      'qaApprovalAuthority',
      'finalCanvasAuthority',
      'productionReady',
    ])
    || packet.packetClass !==
      'server_owned_character_preparation_canonical_v2_opaque_png_packet'
    || !Buffer.isBuffer(packet.outputPng)
    || packet.outputPng.buffer instanceof
      SharedArrayBuffer
    || packet.outputContentType !== 'image/png'
    || packet
      .callerBytesPathUrlPromptModelCredentialCommandOrEnvironmentAccepted !==
      false
    || packet.workerCompletionAuthority !== false
    || packet.artifactPersistenceAuthority !== false
    || packet.qaApprovalAuthority !== false
    || packet.finalCanvasAuthority !== false
    || packet.productionReady !== false
  ) throw invalid(
    'output_packet_invalid',
    '$.outputReader.packet',
  )
  const compared = {
    envelopeDigestSha256:
      envelope.envelopeDigestSha256,
    preparationUnitId:
      envelope.preparationUnitId,
    preparationUnitDigestSha256:
      envelope.preparationUnitDigestSha256,
    promptUnitId: envelope.promptUnitId,
    promptUnitDigestSha256:
      envelope.promptUnitDigestSha256,
    graphTopologyDigestSha256:
      envelope.graphTopologyDigestSha256,
    sceneId: envelope.sceneId,
    componentId: envelope.componentId,
    approvedWorkItemId:
      envelope.approvedWorkItemId,
    approvedWorkItemKey:
      envelope.approvedWorkItemKey,
    approvedPlannedAssetManifestEntryId:
      envelope.approvedPlannedAssetManifestEntryId,
    outputKey: envelope.outputKey,
    confirmedOutputFrameExpectationDigestSha256:
      envelope.confirmedOutputFrameExpectationDigestSha256,
    outputCandidateId:
      envelope.outputCandidateId,
    outputContentType:
      envelope.outputContentType,
    outputByteLength:
      envelope.outputByteLength,
    outputContentSha256:
      envelope.outputContentSha256,
    decodedRgbaSha256:
      envelope.decodedRgbaSha256,
    widthPixels: envelope.widthPixels,
    heightPixels: envelope.heightPixels,
  }
  for (const [key, value] of Object.entries(compared)) {
    if (packet[key] !== value) throw invalid(
      'result_lineage_invalid',
      `$.outputReader.packet.${key}`,
    )
  }
}

function decodeOutput(
  bytes: Buffer,
  widthPixels: number,
  heightPixels: number,
) {
  try {
    return verifyLivingFramePrivateOpaqueRgbPng(bytes, {
      widthPixels,
      heightPixels,
      maximumOutputBytes:
        MAXIMUM_OUTPUT_BYTES,
      maximumDimension: MAXIMUM_DIMENSION,
      maximumPixelCount: MAXIMUM_PIXEL_COUNT,
    })
  } catch (error) {
    if (
      error instanceof
      LivingFramePrivateOpaqueRgbPngVerificationError
    ) {
      const code = {
        format_invalid: 'output_format_invalid',
        dimension_invalid:
          'output_dimension_invalid',
        alpha_policy_invalid:
          'output_alpha_policy_invalid',
        decode_failed: 'output_decode_failed',
      }[error.code] as
        LivingFrameCharacterControlledPreparationPrivateOutputIssueCode
      throw invalid(code, '$.outputReader.outputPng')
    }
    throw invalid(
      'output_decode_failed',
      '$.outputReader.outputPng',
    )
  }
}

function assertAlpha(
  report: ReturnType<
    typeof measureLivingFrameAlphaArtifact
  >,
  width: number,
  height: number,
): void {
  if (
    !verifyLivingFrameAlphaMeasurementReportDigest(report)
    || report.raster.width !== width
    || report.raster.height !== height
    || report.raster.alphaExpectation !==
      'opaque_plate_expected'
    || report.distribution.pixelCount !==
      width * height
    || report.distribution.transparentPixelCount !== 0
    || report.distribution.semiTransparentPixelCount !== 0
    || report.distribution.opaquePixelCount !==
      width * height
    || !report.findingCodes.includes(
      'alpha_channel_fully_opaque',
    )
  ) throw invalid(
    'alpha_measurement_invalid',
    '$.verifiedOutput',
  )
}

function exactEnvelopeShape(
  value: Record<string, unknown>,
): boolean {
  if (
    !hasExactKeys(value, [
      'envelopeClass',
      'evidenceClass',
      'requestCandidateVersion',
      'resultCandidateVersion',
      'canonicalToolId',
      'canonicalOperationId',
      'requestCandidateDigestSha256',
      'resultCandidateDigestSha256',
      'workerCompletionReceiptDigestSha256',
      'runtimeIdentityDigestSha256',
      'runtimeConfinementRequirementDigestSha256',
      'modelMountRereadDigestSha256',
      'resourceCostEvidenceDigestSha256',
      'approvedSnapshotId',
      'approvedSnapshotHashSha256',
      'approvedWorkGraphDigestSha256',
      'currentMasterTimingDigestSha256',
      'confirmedOutputFrameExpectationDigestSha256',
      'preparationUnitId',
      'preparationUnitDigestSha256',
      'promptUnitId',
      'promptUnitDigestSha256',
      'graphTopologyDigestSha256',
      'sceneId',
      'componentId',
      'approvedWorkItemId',
      'approvedWorkItemKey',
      'approvedPlannedAssetManifestEntryId',
      'outputKey',
      'canvasClass',
      'widthPixels',
      'heightPixels',
      'outputCandidateId',
      'outputContentType',
      'outputByteLength',
      'outputContentSha256',
      'decodedRgbaSha256',
      'exactModelArtifactCount',
      'exactModelRoles',
      'exactModelArtifactByteLength',
      'processEntrypointKind',
      'fixedSupervisedProcessRequired',
      'atomicFiveModelReadOnlyMountLifetimeRequired',
      'allFiveModelRolesVerifiedBeforeAndAfterInferenceRequired',
      'deniedTopLevelImports',
      'externalNetworkAllowed',
      'runtimeDownloadsAllowed',
      'oneRequestOneProcessOneImageOneAttempt',
      'outputBytesIncluded',
      'promptModelPathUrlCredentialCommandOrEnvironmentIncluded',
      'canonicalWorkerCompletionAuthority',
      'artifactCommitAuthority',
      'qaPassAuthority',
      'customerCostAuthority',
      'finalCanvasAuthority',
      'productionReady',
      'envelopeDigestSha256',
    ])
    || !SAFE_ID.test(String(value.approvedSnapshotId))
    || !SAFE_ID.test(String(value.preparationUnitId))
    || !SAFE_ID.test(String(value.promptUnitId))
    || !SAFE_ID.test(String(value.sceneId))
    || !SAFE_ID.test(String(value.componentId))
    || !SAFE_ID.test(String(value.approvedWorkItemId))
    || !SAFE_ID.test(String(value.approvedWorkItemKey))
    || !SAFE_ID.test(String(
      value.approvedPlannedAssetManifestEntryId,
    ))
    || !SAFE_ID.test(String(value.outputKey))
    || !SAFE_ID.test(String(value.outputCandidateId))
  ) return false
  const digests = [
    value.requestCandidateDigestSha256,
    value.resultCandidateDigestSha256,
    value.workerCompletionReceiptDigestSha256,
    value.runtimeIdentityDigestSha256,
    value.runtimeConfinementRequirementDigestSha256,
    value.modelMountRereadDigestSha256,
    value.resourceCostEvidenceDigestSha256,
    value.approvedSnapshotHashSha256,
    value.approvedWorkGraphDigestSha256,
    value.currentMasterTimingDigestSha256,
    value.confirmedOutputFrameExpectationDigestSha256,
    value.preparationUnitDigestSha256,
    value.promptUnitDigestSha256,
    value.graphTopologyDigestSha256,
    value.outputContentSha256,
    value.decodedRgbaSha256,
  ]
  return (
    digests.every((digest) =>
      typeof digest === 'string'
      && SHA256.test(digest))
    && (
      value.canvasClass ===
        'confirmed_full_frame_ratio'
      || value.canvasClass ===
        'isolated_component_square_1024'
    )
    && Number.isSafeInteger(value.widthPixels)
    && Number(value.widthPixels) >= 256
    && Number(value.widthPixels) <=
      MAXIMUM_DIMENSION
    && Number.isSafeInteger(value.heightPixels)
    && Number(value.heightPixels) >= 256
    && Number(value.heightPixels) <=
      MAXIMUM_DIMENSION
    && Number(value.widthPixels) *
      Number(value.heightPixels) <=
        MAXIMUM_PIXEL_COUNT
    && Number.isSafeInteger(value.outputByteLength)
    && Number(value.outputByteLength) > 0
    && Number(value.outputByteLength) <=
      MAXIMUM_OUTPUT_BYTES
    && value.outputContentType === 'image/png'
    && value.exactModelArtifactCount === 5
    && stableAuthorityStringify(
      value.exactModelRoles,
    ) === stableAuthorityStringify(
      EXACT_MODEL_ROLES,
    )
    && value.exactModelArtifactByteLength ===
      11_700_367_157
    && value.processEntrypointKind ===
      'fixed_supervised_python_process'
    && value.fixedSupervisedProcessRequired === true
    && value
      .atomicFiveModelReadOnlyMountLifetimeRequired ===
        true
    && value
      .allFiveModelRolesVerifiedBeforeAndAfterInferenceRequired ===
        true
    && stableAuthorityStringify(
      value.deniedTopLevelImports,
    ) === stableAuthorityStringify(['sam2'])
    && value.externalNetworkAllowed === false
    && value.runtimeDownloadsAllowed === false
    && value.oneRequestOneProcessOneImageOneAttempt === true
    && value.outputBytesIncluded === false
    && value
      .promptModelPathUrlCredentialCommandOrEnvironmentIncluded ===
      false
    && value.canonicalWorkerCompletionAuthority === false
    && value.artifactCommitAuthority === false
    && value.qaPassAuthority === false
    && value.customerCostAuthority === false
    && value.finalCanvasAuthority === false
    && value.productionReady === false
  )
}

function assertReceipt(
  draft:
    LivingFrameCharacterControlledPreparationPrivateOutputDraft,
): void {
  if (
    !isRecord(draft)
    || !hasExactKeys(draft, [
      'contractVersion',
      'resultClass',
      'observationState',
      'observationId',
      'canonicalScope',
      'exactOutputLineage',
      'sourceBindings',
      'canonicalV2Boundary',
      'verifiedOutput',
      'downstreamRequirements',
      'runtimePolicy',
      'evidenceClass',
      'openGateCodes',
      'authorityBoundary',
      'exactPrivateOutputBytesRereadAndDecoded',
      'alphaMeasurementRecomputedFromDecodedBytes',
      'canonicalWorkerCompletionInferred',
      'gpuAttemptCreated',
      'actualAttemptCostEvidenceVerified',
      'artifactPersisted',
      'assetManifestMutated',
      'qaApproved',
      'characterRouteRecompiled',
      'privateReviewApproved',
      'renderAuthorized',
      'containsOutputBytesPathUrlPromptModelCredentialCommandOrEnvironment',
      'containsPriceCreditServiceFeeReservationWalletOrLedgerData',
      'publicDeliveryReady',
      'productionReady',
    ])
    || draft.contractVersion !==
      LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_OUTPUT_VERSION
    || draft.resultClass !==
      LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_OUTPUT_CLASS
    || draft.observationState !==
      LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_OUTPUT_STATE
    || !SAFE_ID.test(draft.observationId)
    || !isRecord(draft.canonicalScope)
    || !hasExactKeys(draft.canonicalScope, [
      'workspaceId',
      'projectId',
      'editSessionId',
      'sceneId',
      'componentId',
    ])
    || !Object.values(draft.canonicalScope).every(
      (value) =>
        typeof value === 'string'
        && SAFE_ID.test(value),
    )
    || !isRecord(draft.exactOutputLineage)
    || !hasExactKeys(draft.exactOutputLineage, [
      'preparationUnitId',
      'preparationUnitDigestSha256',
      'purpose',
      'promptUnitId',
      'promptUnitDigestSha256',
      'graphTopologyDigestSha256',
      'approvedWorkItemId',
      'approvedWorkItemKey',
      'approvedPlannedAssetManifestEntryId',
      'outputKey',
    ])
    || draft.exactOutputLineage.purpose !==
      'reconstruct_exposed_source_plate'
    || ![
      draft.exactOutputLineage.preparationUnitId,
      draft.exactOutputLineage.promptUnitId,
      draft.exactOutputLineage.approvedWorkItemId,
      draft.exactOutputLineage.approvedWorkItemKey,
      draft.exactOutputLineage
        .approvedPlannedAssetManifestEntryId,
      draft.exactOutputLineage.outputKey,
    ].every((value) => SAFE_ID.test(value))
    || ![
      draft.exactOutputLineage
        .preparationUnitDigestSha256,
      draft.exactOutputLineage
        .promptUnitDigestSha256,
      draft.exactOutputLineage
        .graphTopologyDigestSha256,
    ].every((value) => SHA256.test(value))
    || !isRecord(draft.sourceBindings)
    || !hasExactKeys(draft.sourceBindings, [
      'preparationDigestSha256',
      'privatePromptMaterializationDigestSha256',
      'canonicalComfyUiReconciliationDigestSha256',
      'canonicalV2RequestCandidateDigestSha256',
      'canonicalV2ResultCandidateDigestSha256',
      'canonicalWorkerCompletionReceiptDigestSha256',
      'approvedSnapshotId',
      'approvedSnapshotHashSha256',
      'approvedWorkGraphDigestSha256',
      'currentMasterTimingDigestSha256',
      'confirmedOutputFrameExpectationDigestSha256',
      'runtimeIdentityDigestSha256',
      'runtimeConfinementRequirementDigestSha256',
      'modelMountRereadDigestSha256',
      'resourceCostEvidenceDigestSha256',
      'envelopeDigestSha256',
      'readerBindingDigestSha256',
    ])
    || !SAFE_ID.test(
      draft.sourceBindings.approvedSnapshotId,
    )
    || !Object.entries(draft.sourceBindings).every(
      ([key, value]) =>
        key === 'approvedSnapshotId'
        || (
          typeof value === 'string'
          && SHA256.test(value)
        ),
    )
    || !isRecord(draft.canonicalV2Boundary)
    || !hasExactKeys(draft.canonicalV2Boundary, [
      'requestCandidateVersion',
      'resultCandidateVersion',
      'sameCanonicalToolAndOperation',
      'exactMaskEncodingProfile',
      'exactMaskLoader',
      'exactMaskChannel',
      'exactMaskOutputIndex',
      'maskPolarity',
      'plainLoadImageMaskOutputAllowed',
      'exactInpaintEncoder',
      'exactGrowMaskBy',
      'exactSamplerDenoise',
      'emptyLatentSubstitutionAllowed',
      'arbitraryNodeOrSlotExpansionAllowed',
    ])
    || draft.canonicalV2Boundary
      .requestCandidateVersion !==
        'canonical-comfyui-gpu-runtime-request-candidate-v2'
    || draft.canonicalV2Boundary
      .resultCandidateVersion !==
        'canonical-comfyui-gpu-runtime-result-candidate-v2'
    || draft.canonicalV2Boundary
      .sameCanonicalToolAndOperation !== true
    || draft.canonicalV2Boundary
      .exactMaskEncodingProfile !==
        'gray8_mask_png_v1'
    || draft.canonicalV2Boundary
      .exactMaskLoader !== 'LoadImageMask'
    || draft.canonicalV2Boundary
      .exactMaskChannel !== 'red'
    || draft.canonicalV2Boundary
      .exactMaskOutputIndex !== 0
    || draft.canonicalV2Boundary.maskPolarity !==
      'white_one_means_inpaint'
    || draft.canonicalV2Boundary
      .plainLoadImageMaskOutputAllowed !== false
    || draft.canonicalV2Boundary
      .exactInpaintEncoder !==
        'VAEEncodeForInpaint'
    || draft.canonicalV2Boundary
      .exactGrowMaskBy !== 6
    || draft.canonicalV2Boundary
      .exactSamplerDenoise !== 0.55
    || draft.canonicalV2Boundary
      .emptyLatentSubstitutionAllowed !== false
    || draft.canonicalV2Boundary
      .arbitraryNodeOrSlotExpansionAllowed !== false
    || !isRecord(draft.verifiedOutput)
    || !hasExactKeys(draft.verifiedOutput, [
      'outputCandidateId',
      'contentType',
      'byteLength',
      'contentSha256',
      'decodedRgbaSha256',
      'widthPixels',
      'heightPixels',
      'decodedChannelCount',
      'sourcePngHadAlphaChannel',
      'transparentPixelCount',
      'semiTransparentPixelCount',
      'opaquePixelCount',
      'alphaMeasurementReportDigestSha256',
      'alphaFindingCodes',
      'canvasClass',
      'sourceDisposition',
    ])
    || !SAFE_ID.test(
      draft.verifiedOutput.outputCandidateId,
    )
    || draft.verifiedOutput.contentType !==
      'image/png'
    || !Number.isSafeInteger(
      draft.verifiedOutput.byteLength,
    )
    || draft.verifiedOutput.byteLength <= 0
    || draft.verifiedOutput.byteLength >
      MAXIMUM_OUTPUT_BYTES
    || !SHA256.test(
      draft.verifiedOutput.contentSha256,
    )
    || !SHA256.test(
      draft.verifiedOutput.decodedRgbaSha256,
    )
    || !SHA256.test(
      draft.verifiedOutput
        .alphaMeasurementReportDigestSha256,
    )
    || !Number.isSafeInteger(
      draft.verifiedOutput.widthPixels,
    )
    || draft.verifiedOutput.widthPixels < 256
    || draft.verifiedOutput.widthPixels >
      MAXIMUM_DIMENSION
    || !Number.isSafeInteger(
      draft.verifiedOutput.heightPixels,
    )
    || draft.verifiedOutput.heightPixels < 256
    || draft.verifiedOutput.heightPixels >
      MAXIMUM_DIMENSION
    || draft.verifiedOutput.widthPixels *
      draft.verifiedOutput.heightPixels >
        MAXIMUM_PIXEL_COUNT
    || draft.verifiedOutput.decodedChannelCount !== 4
    || draft.verifiedOutput.sourcePngHadAlphaChannel !==
      false
    || draft.verifiedOutput.transparentPixelCount !== 0
    || draft.verifiedOutput.semiTransparentPixelCount !==
      0
    || !Array.isArray(
      draft.verifiedOutput.alphaFindingCodes,
    )
    || draft.verifiedOutput.alphaFindingCodes.length < 1
    || draft.verifiedOutput.alphaFindingCodes.some(
      (code) =>
        !(
          LIVING_FRAME_ALPHA_FINDING_CODES as
            readonly string[]
        ).includes(code),
    )
    || draft.verifiedOutput.canvasClass !==
      'confirmed_full_frame_ratio'
    || draft.verifiedOutput.sourceDisposition !==
      'opaque_masked_plate_requires_hidden_plate_continuity_fact_and_destination_qa'
    || draft.verifiedOutput.opaquePixelCount !==
      draft.verifiedOutput.widthPixels *
        draft.verifiedOutput.heightPixels
    || !draft.verifiedOutput.alphaFindingCodes.includes(
      'alpha_channel_fully_opaque',
    )
    || !isRecord(draft.downstreamRequirements)
    || !hasExactKeys(draft.downstreamRequirements, [
      'outputRemainsIntermediate',
      'existingSelectedScenePrivateOutputObservationV2AdapterRequired',
      'createOnlyPersistenceAndExactRereadRequired',
      'canonicalAssetManifestReconciliationRequired',
      'routeRecompileAfterQaRequired',
      'independentPerFrameGenerationAllowed',
      'remotionOwnsFinalCanvas',
    ])
    || draft.downstreamRequirements
      .outputRemainsIntermediate !== true
    || draft.downstreamRequirements
      .existingSelectedScenePrivateOutputObservationV2AdapterRequired !==
        true
    || draft.downstreamRequirements
      .createOnlyPersistenceAndExactRereadRequired !==
        true
    || draft.downstreamRequirements
      .canonicalAssetManifestReconciliationRequired !==
        true
    || draft.downstreamRequirements
      .routeRecompileAfterQaRequired !== true
    || draft.downstreamRequirements
      .independentPerFrameGenerationAllowed !== false
    || draft.downstreamRequirements
      .remotionOwnsFinalCanvas !== true
    || !isRecord(draft.runtimePolicy)
    || !hasExactKeys(draft.runtimePolicy, [
      'canonicalToolId',
      'canonicalOperationId',
      'exactModelArtifactCount',
      'exactModelRoles',
      'exactModelArtifactByteLength',
      'processEntrypointKind',
      'fixedSupervisedProcessRequired',
      'atomicFiveModelReadOnlyMountLifetimeRequired',
      'allFiveModelRolesVerifiedBeforeAndAfterInferenceRequired',
      'deniedTopLevelImports',
      'externalNetworkAllowed',
      'runtimeDownloadsAllowed',
      'oneRequestOneProcessOneImageOneAttempt',
      'oneGpuAttemptAndCostEventForAllInProcessCapabilities',
      'finalCanvasCreatedByComfyUi',
    ])
    || draft.runtimePolicy.canonicalToolId !==
      'comfyui'
    || draft.runtimePolicy.canonicalOperationId !==
      'tool.comfyui.generate_controlled_image.v1'
    || draft.runtimePolicy.exactModelArtifactCount !== 5
    || stableAuthorityStringify(
      draft.runtimePolicy.exactModelRoles,
    ) !== stableAuthorityStringify(
      EXACT_MODEL_ROLES,
    )
    || draft.runtimePolicy
      .exactModelArtifactByteLength !==
        11_700_367_157
    || draft.runtimePolicy.processEntrypointKind !==
      'fixed_supervised_python_process'
    || draft.runtimePolicy
      .fixedSupervisedProcessRequired !== true
    || draft.runtimePolicy
      .atomicFiveModelReadOnlyMountLifetimeRequired !==
        true
    || draft.runtimePolicy
      .allFiveModelRolesVerifiedBeforeAndAfterInferenceRequired !==
        true
    || stableAuthorityStringify(
      draft.runtimePolicy.deniedTopLevelImports,
    ) !== stableAuthorityStringify(['sam2'])
    || draft.runtimePolicy.externalNetworkAllowed !==
      false
    || draft.runtimePolicy.runtimeDownloadsAllowed !==
      false
    || draft.runtimePolicy
      .oneRequestOneProcessOneImageOneAttempt !== true
    || draft.runtimePolicy
      .oneGpuAttemptAndCostEventForAllInProcessCapabilities !==
        true
    || draft.runtimePolicy
      .finalCanvasCreatedByComfyUi !== false
    || !(
      LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_OUTPUT_EVIDENCE_CLASSES as
        readonly string[]
    ).includes(draft.evidenceClass)
    || stableAuthorityStringify(
      draft.openGateCodes,
    ) !== stableAuthorityStringify(
      LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_OUTPUT_OPEN_GATES,
    )
    || stableAuthorityStringify(
      draft.authorityBoundary,
    ) !== stableAuthorityStringify(
      AUTHORITY_BOUNDARY,
    )
    || draft.exactPrivateOutputBytesRereadAndDecoded !==
      true
    || draft.alphaMeasurementRecomputedFromDecodedBytes !==
      true
    || draft.canonicalWorkerCompletionInferred !== false
    || draft.gpuAttemptCreated !== false
    || draft.actualAttemptCostEvidenceVerified !== false
    || draft.artifactPersisted !== false
    || draft.assetManifestMutated !== false
    || draft.qaApproved !== false
    || draft.characterRouteRecompiled !== false
    || draft.privateReviewApproved !== false
    || draft.renderAuthorized !== false
    || draft
      .containsOutputBytesPathUrlPromptModelCredentialCommandOrEnvironment !==
        false
    || draft
      .containsPriceCreditServiceFeeReservationWalletOrLedgerData !==
        false
    || draft.publicDeliveryReady !== false
    || draft.productionReady !== false
    || containsUnsafeReceiptKey(draft)
  ) throw invalid(
    'authority_promotion_forbidden',
    '$',
  )
}

function assertInput(
  input:
    ObserveLivingFrameCharacterControlledPreparationPrivateOutputInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'observationId',
      'preparation',
      'preparationInput',
      'privatePrompt',
      'canonicalReconciliation',
      'canonicalV2ResultEnvelope',
      'outputReader',
    ])
    || !SAFE_ID.test(String(input.observationId))
  ) throw invalid('input_invalid', '$')
}

function containsUnsafeReceiptKey(
  value: unknown,
): boolean {
  const denied = new Set([
    'outputPng',
    'decodedRgba',
    'bytes',
    'path',
    'url',
    'prompt',
    'conditioningText',
    'modelAlias',
    'seed',
    'credential',
    'secret',
    'command',
    'environment',
    'actualCostMicros',
    'price',
    'credits',
    'serviceFee',
    'reservation',
    'wallet',
    'ledger',
  ])
  let unsafe = false
  walkEntries(value, (key, child) => {
    if (denied.has(key)) unsafe = true
    if (
      typeof child === 'string'
      && (
        URL_LIKE.test(child)
        || SECRET_LIKE.test(child)
      )
    ) unsafe = true
  })
  return unsafe
}

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  return stableAuthorityStringify(
    Object.keys(value).sort(),
  ) === stableAuthorityStringify(
    [...expected].sort(),
  )
}

function walkEntries(
  value: unknown,
  visitor: (key: string, child: unknown) => void,
): void {
  if (Array.isArray(value)) {
    value.forEach((child) =>
      walkEntries(child, visitor))
    return
  }
  if (!isRecord(value)) return
  Object.entries(value).forEach(([key, child]) => {
    visitor(key, child)
    walkEntries(child, visitor)
  })
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
}

function digestBytes(
  bytes: Uint8Array,
): string {
  return createHash('sha256')
    .update(bytes)
    .digest('hex')
}

function deepFreeze<T>(value: T): T {
  if (
    value !== null
    && typeof value === 'object'
    && !Object.isFrozen(value)
    && !Buffer.isBuffer(value)
  ) {
    Object.freeze(value)
    Object.values(value).forEach((child) =>
      deepFreeze(child))
  }
  return value
}

function invalid(
  code:
    LivingFrameCharacterControlledPreparationPrivateOutputIssueCode,
  path: string,
): LivingFrameCharacterControlledPreparationPrivateOutputError {
  if (
    !(
      LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_OUTPUT_ISSUE_CODES as
        readonly string[]
    ).includes(code)
  ) throw new Error(
    'Unknown Living Frame character controlled-preparation private output issue code.',
  )
  return new LivingFrameCharacterControlledPreparationPrivateOutputError([
    { code, path },
  ])
}
