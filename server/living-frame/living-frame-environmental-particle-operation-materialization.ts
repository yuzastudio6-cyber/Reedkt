import {
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_OPERATION_MATERIALIZATION_CLASS,
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_OPERATION_MATERIALIZATION_STATE,
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_OPERATION_MATERIALIZATION_VERSION,
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_OPERATION_OPEN_GATES,
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_OPERATION_REQUEST_VERSION,
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PIXIJS_OPERATION_ID,
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PIXIJS_TOOL_ID,
  type LivingFrameEnvironmentalParticleOperationAuthority,
  type LivingFrameEnvironmentalParticleOperationIssue,
  type LivingFrameEnvironmentalParticleOperationIssueCode,
  type LivingFrameEnvironmentalParticleOperationMaterialization,
  type LivingFrameEnvironmentalParticleOperationMaterializationDraft,
  type LivingFrameEnvironmentalParticleOperationMaterializationResult,
  type LivingFrameEnvironmentalParticlePrivatePixiJsRequest,
  type LivingFrameEnvironmentalParticlePrivateRequestLease,
} from '../../src/types/living-frame-environmental-particle-operation-materialization'
import type {
  LivingFrameEnvironmentalParticleKernelCandidate,
} from '../../src/types/living-frame-environmental-particle-kernel'
import {
  stableAuthorityStringify,
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  verifyLivingFrameEnvironmentalParticleKernel,
  type CompileLivingFrameEnvironmentalParticleKernelInput,
} from './living-frame-environmental-particle-kernel'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const MAX_PRIVATE_REQUEST_BYTES = 16 * 1024 * 1024

const leases =
  new WeakSet<LivingFrameEnvironmentalParticlePrivateRequestLease>()
const consumedLeases =
  new WeakSet<LivingFrameEnvironmentalParticlePrivateRequestLease>()
const privateRequests =
  new WeakMap<
    LivingFrameEnvironmentalParticlePrivateRequestLease,
    LivingFrameEnvironmentalParticlePrivatePixiJsRequest
  >()

const AUTHORITY_BOUNDARY:
  LivingFrameEnvironmentalParticleOperationAuthority =
  deepFreeze({
    privateOperationRequestMaterializationAuthority: true,
    particleKernelAuthority: false,
    selectedSceneAuthority: false,
    environmentalProfileSelectionAuthority: false,
    visualContinuityPackAuthority: false,
    timingAuthority: false,
    motionBudgetAuthority: false,
    geometryAuthority: false,
    toolRegistryAuthority: false,
    operationRegistryAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    dispatchAuthority: false,
    runtimeAuthority: false,
    artifactAuthority: false,
    assetManifestAuthority: false,
    rendererAuthority: false,
    qaApprovalAuthority: false,
    privateReviewAuthority: false,
    costAuthority: false,
    billingAuthority: false,
    productionAuthority: false,
  })

export interface CreateLivingFrameEnvironmentalParticleOperationMaterializationInput {
  readonly materializationCandidateId: string
  readonly kernelCandidate:
    LivingFrameEnvironmentalParticleKernelCandidate
  readonly kernelInput:
    CompileLivingFrameEnvironmentalParticleKernelInput
}

export class LivingFrameEnvironmentalParticleOperationMaterializationError
  extends Error {
  readonly issues:
    readonly LivingFrameEnvironmentalParticleOperationIssue[]

  constructor(
    issues:
      readonly LivingFrameEnvironmentalParticleOperationIssue[],
  ) {
    super(
      'Living Frame environmental-particle operation materialization failed.',
    )
    this.name =
      'LivingFrameEnvironmentalParticleOperationMaterializationError'
    this.issues = issues
  }
}

export async function createLivingFrameEnvironmentalParticleOperationMaterialization(
  input:
    CreateLivingFrameEnvironmentalParticleOperationMaterializationInput,
): Promise<LivingFrameEnvironmentalParticleOperationMaterializationResult> {
  assertInput(input)
  if (
    !await verifyLivingFrameEnvironmentalParticleKernel(
      input.kernelCandidate,
      input.kernelInput,
    )
  ) {
    throw invalid(
      'kernel_candidate_invalid',
      '$.kernelCandidate',
    )
  }
  assertKernelBoundary(input.kernelCandidate)
  const privateRequest = compilePrivateRequest(input)
  assertPrivateRequest(privateRequest)
  const serializedPrivateRequestByteLength =
    Buffer.byteLength(
      stableAuthorityStringify(privateRequest),
      'utf8',
    )
  if (
    serializedPrivateRequestByteLength < 2
    || serializedPrivateRequestByteLength >
      MAX_PRIVATE_REQUEST_BYTES
  ) {
    throw invalid(
      'request_size_invalid',
      '$.privateRequest',
    )
  }
  const privateRequestDigestSha256 =
    sha256AuthorityValue(privateRequest)
  const leaseId =
    `lf-particle-pixijs-lease.${
      sha256AuthorityValue({
        materializationCandidateId:
          input.materializationCandidateId,
        privateRequestDigestSha256,
      }).slice(0, 40)
    }`
  const candidate = input.kernelCandidate
  const draft:
    LivingFrameEnvironmentalParticleOperationMaterializationDraft = {
      contractVersion:
        LIVING_FRAME_ENVIRONMENTAL_PARTICLE_OPERATION_MATERIALIZATION_VERSION,
      resultClass:
        LIVING_FRAME_ENVIRONMENTAL_PARTICLE_OPERATION_MATERIALIZATION_CLASS,
      materializationState:
        LIVING_FRAME_ENVIRONMENTAL_PARTICLE_OPERATION_MATERIALIZATION_STATE,
      materializationCandidateId:
        input.materializationCandidateId,
      sourceBindings: {
        kernelContractVersion:
          candidate.contractVersion,
        kernelCandidateId:
          candidate.kernelCandidateId,
        kernelCandidateDigestSha256:
          candidate.kernelCandidateDigestSha256,
        deterministicStateSequenceDigestSha256:
          candidate.deterministicStateSequence
            .sequenceDigestSha256,
        visualContinuityPackDigestSha256:
          candidate.sourceBindings
            .visualContinuityPackDigestSha256,
        frameBindingDigestSha256:
          candidate.sourceBindings
            .frameBindingDigestSha256,
        confirmedOutputFrameDigestSha256:
          candidate.sourceBindings
            .confirmedOutputFrameDigestSha256,
        masterTimingDigestSha256:
          candidate.sourceBindings
            .masterTimingDigestSha256,
      },
      requestReceipt: {
        leaseId,
        privateRequestDigestSha256,
        serializedPrivateRequestByteLength,
        stateTrackCount:
          candidate.deterministicStateSequence
            .stateTracks.length,
        frameStateCount:
          candidate.deterministicStateSequence
            .frameStateCount,
        rawStateTracksIncludedInReceipt: false,
        rawPromptOrTranscriptIncludedInReceipt: false,
        mediaBytesIncludedInReceipt: false,
        pathUrlCredentialCommandOrEnvironmentIncludedInReceipt:
          false,
        leaseConsumed: false,
      },
      renderEnvelope: {
        widthPixels:
          candidate.exactFrameBinding.widthPixels,
        heightPixels:
          candidate.exactFrameBinding.heightPixels,
        fps: candidate.exactFrameBinding.fps,
        startFrame:
          candidate.exactFrameBinding.startFrame,
        endFrameExclusive:
          candidate.exactFrameBinding.endFrameExclusive,
        durationFrames:
          candidate.exactFrameBinding.durationFrames,
        profileId:
          candidate.typedProfile.profileId,
        effectFamily:
          candidate.typedProfile.effectFamily,
        assetTreatment:
          candidate.visualContinuityBinding
            .assetTreatment,
        depthStyle:
          candidate.visualContinuityBinding.depthStyle,
        motionDensity:
          candidate.visualContinuityBinding
            .motionDensity,
        transparentFrameSequenceRequested: true,
        exactConfirmedOutputFramePreserved: true,
        squareSubstitutionApplied: false,
        finalCanvasClaimed: false,
      },
      operationDisposition: {
        existingToolId:
          LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PIXIJS_TOOL_ID,
        candidateOperationId:
          LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PIXIJS_OPERATION_ID,
        separateToolIdentityRequired: false,
        registryExpansionRequired: false,
        operationRegistered: false,
        dispatchable: false,
        oneLeaseRepresentsOneFuturePixiJsAttempt: true,
        oneLogicalOutputBundlePerAttempt: true,
        remotionRemainsFinalCanvas: true,
      },
      authorityBoundary: AUTHORITY_BOUNDARY,
      openGateCodes:
        LIVING_FRAME_ENVIRONMENTAL_PARTICLE_OPERATION_OPEN_GATES,
      selectedSceneBound: false,
      canonicalTimingBound: false,
      operationRegistered: false,
      dispatched: false,
      runtimeExecuted: false,
      artifactPersisted: false,
      assetManifestMutated: false,
      rendererMutated: false,
      qaApproved: false,
      privateReviewApproved: false,
      actualCostCreated: false,
      customerCharged: false,
      containsExecutableCode: false,
      containsSubjectSpecificSummaries: false,
      subjectSpecificRouting: false,
      productionReady: false,
    }
  assertReceipt(draft)
  const receipt =
    deepFreeze({
      ...draft,
      materializationDigestSha256:
        sha256AuthorityValue(draft),
    })
  const lease =
    Object.freeze({
      leaseClass:
        'process_bound_single_use_environmental_particle_pixijs_request_lease_v1',
      leaseId,
      materializationDigestSha256:
        receipt.materializationDigestSha256,
      materializationCandidateId:
        input.materializationCandidateId,
      privateRequestDigestSha256,
      callerSerializable: false,
      dispatchAuthority: false,
      runtimeAuthority: false,
      artifactAuthority: false,
      finalCanvasAuthority: false,
      costAuthority: false,
      billingAuthority: false,
      productionReady: false,
    } as const)
  leases.add(lease)
  privateRequests.set(lease, privateRequest)
  return Object.freeze({
    receipt,
    privateRequestLease: lease,
  })
}

export function consumeLivingFrameEnvironmentalParticlePrivateRequestLease(
  lease:
    LivingFrameEnvironmentalParticlePrivateRequestLease,
): LivingFrameEnvironmentalParticlePrivatePixiJsRequest {
  if (
    !leases.has(lease)
    || consumedLeases.has(lease)
    || lease.leaseClass !==
      'process_bound_single_use_environmental_particle_pixijs_request_lease_v1'
    || lease.callerSerializable !== false
    || lease.dispatchAuthority !== false
    || lease.runtimeAuthority !== false
    || lease.artifactAuthority !== false
    || lease.finalCanvasAuthority !== false
    || lease.costAuthority !== false
    || lease.billingAuthority !== false
    || lease.productionReady !== false
  ) {
    throw invalid('lease_reused', '$.lease')
  }
  const request = privateRequests.get(lease)
  if (!request) {
    throw invalid('lease_invalid', '$.lease')
  }
  consumedLeases.add(lease)
  privateRequests.delete(lease)
  return request
}

export function verifyLivingFrameEnvironmentalParticleOperationMaterialization(
  value: unknown,
): value is LivingFrameEnvironmentalParticleOperationMaterialization {
  try {
    if (
      !isRecord(value)
      || value.contractVersion !==
        LIVING_FRAME_ENVIRONMENTAL_PARTICLE_OPERATION_MATERIALIZATION_VERSION
      || value.resultClass !==
        LIVING_FRAME_ENVIRONMENTAL_PARTICLE_OPERATION_MATERIALIZATION_CLASS
      || value.materializationState !==
        LIVING_FRAME_ENVIRONMENTAL_PARTICLE_OPERATION_MATERIALIZATION_STATE
      || typeof value.materializationDigestSha256 !==
        'string'
      || !SHA256.test(
        value.materializationDigestSha256,
      )
    ) return false
    const {
      materializationDigestSha256,
      ...draft
    } = value
    assertReceipt(
      draft as unknown as
        LivingFrameEnvironmentalParticleOperationMaterializationDraft,
    )
    return materializationDigestSha256 ===
      sha256AuthorityValue(draft)
  } catch {
    return false
  }
}

function compilePrivateRequest(
  input:
    CreateLivingFrameEnvironmentalParticleOperationMaterializationInput,
): LivingFrameEnvironmentalParticlePrivatePixiJsRequest {
  const candidate = input.kernelCandidate
  return deepFreeze({
    schemaVersion:
      LIVING_FRAME_ENVIRONMENTAL_PARTICLE_OPERATION_REQUEST_VERSION,
    requestClass:
      'server_derived_private_time_sampled_transparent_particle_primitive_request_v1',
    toolId:
      LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PIXIJS_TOOL_ID,
    operationId:
      LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PIXIJS_OPERATION_ID,
    materializationCandidateId:
      input.materializationCandidateId,
    kernelCandidateId: candidate.kernelCandidateId,
    sourceBindings: {
      kernelCandidateDigestSha256:
        candidate.kernelCandidateDigestSha256,
      deterministicStateSequenceDigestSha256:
        candidate.deterministicStateSequence
          .sequenceDigestSha256,
      visualContinuityPackDigestSha256:
        candidate.sourceBindings
          .visualContinuityPackDigestSha256,
      sceneDesignSheetDigestSha256:
        candidate.sourceBindings
          .sceneDesignSheetDigestSha256,
      environmentSheetDigestSha256:
        candidate.sourceBindings
          .environmentSheetDigestSha256,
      frameBindingDigestSha256:
        candidate.sourceBindings
          .frameBindingDigestSha256,
      confirmedOutputFrameDigestSha256:
        candidate.sourceBindings
          .confirmedOutputFrameDigestSha256,
      masterTimingDigestSha256:
        candidate.sourceBindings.masterTimingDigestSha256,
      serverSeedDigestSha256:
        candidate.sourceBindings.serverSeedDigestSha256,
    },
    renderCanvas: {
      widthPixels:
        candidate.exactFrameBinding.widthPixels,
      heightPixels:
        candidate.exactFrameBinding.heightPixels,
      fps: candidate.exactFrameBinding.fps,
      startFrame:
        candidate.exactFrameBinding.startFrame,
      endFrameExclusive:
        candidate.exactFrameBinding.endFrameExclusive,
      durationFrames:
        candidate.exactFrameBinding.durationFrames,
      backgroundMode: 'transparent',
      alphaMode: 'straight_alpha_png',
      exactConfirmedOutputFrameRequired: true,
      finalVideoCanvas: false,
    },
    approvedStyleBinding: {
      assetTreatment:
        candidate.visualContinuityBinding.assetTreatment,
      depthStyle:
        candidate.visualContinuityBinding.depthStyle,
      motionDensity:
        candidate.visualContinuityBinding.motionDensity,
      colorId:
        candidate.typedProfile.appearance.colorId,
      colorHex:
        candidate.typedProfile.appearance.colorHex,
    },
    particleProfile: {
      profileId: candidate.typedProfile.profileId,
      effectFamily:
        candidate.typedProfile.effectFamily,
      particleCount:
        candidate.typedProfile.particleCount,
      physics: candidate.typedProfile.physics,
      appearance: candidate.typedProfile.appearance,
    },
    deterministicStateSequence: {
      sequenceId:
        candidate.deterministicStateSequence.sequenceId,
      algorithm:
        candidate.deterministicStateSequence.algorithm,
      particleCount:
        candidate.deterministicStateSequence
          .particleCount,
      frameStateCount:
        candidate.deterministicStateSequence
          .frameStateCount,
      sequenceDigestSha256:
        candidate.deterministicStateSequence
          .sequenceDigestSha256,
      stateTracks:
        candidate.deterministicStateSequence
          .stateTracks,
    },
    supervisedRendererPolicy: {
      serverOwnedTemplateId:
        'living_frame_environmental_particles_v1',
      packageName: 'pixi.js',
      packageVersion: '8.19.0',
      packageEntrypoint: 'Application.init',
      oneRequestOneAttempt: true,
      networkAllowed: false,
      callerCodeAllowed: false,
      callerShadersAllowed: false,
      callerTexturesOrAssetsAllowed: false,
      callerHtmlCssScriptsAllowed: false,
      arbitrarySaveOrPreviewAllowed: false,
      arbitraryPathsUrlsCredentialsCommandsOrEnvironmentAllowed:
        false,
      emitTransparentFrameForEveryBoundFrame: true,
    },
    outputPolicy: {
      logicalBundleCount: 1,
      bundleClass:
        'private_transparent_rgba_png_frame_sequence_bundle_v1',
      frameImageContentType: 'image/png',
      frameImageCount:
        candidate.exactFrameBinding.durationFrames,
      manifestRequired: true,
      byteOutputMayExistOnlyAfterQualifiedRuntime: true,
      createOnlyArtifactPersistenceRequired: true,
      generatedPrimitiveRemainsInputToRemotion: true,
      remotionOwnsFinalComposition: true,
    },
    operationRegistered: false,
    dispatchAuthority: false,
    runtimeAuthority: false,
    artifactAuthority: false,
    finalCanvasAuthority: false,
    costAuthority: false,
    billingAuthority: false,
    productionReady: false,
  })
}

function assertInput(
  input:
    CreateLivingFrameEnvironmentalParticleOperationMaterializationInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'materializationCandidateId',
      'kernelCandidate',
      'kernelInput',
    ])
    || typeof input.materializationCandidateId !== 'string'
    || !SAFE_ID.test(input.materializationCandidateId)
    || !isRecord(input.kernelCandidate)
    || !isRecord(input.kernelInput)
  ) {
    throw invalid('input_invalid', '$')
  }
}

function assertKernelBoundary(
  candidate:
    LivingFrameEnvironmentalParticleKernelCandidate,
): void {
  if (
    candidate.selectedSceneBound
    || candidate.canonicalTimingBound
    || candidate.operationRegistered
    || candidate.dispatchGranted
    || candidate.runtimeExecuted
    || candidate.artifactPersisted
    || candidate.assetManifestMutated
    || candidate.rendererMutated
    || candidate.qaApproved
    || candidate.privateReviewApproved
    || candidate.actualCostCreated
    || candidate.customerCharged
    || candidate.productionReady
  ) {
    throw invalid(
      'kernel_authority_invalid',
      '$.kernelCandidate',
    )
  }
}

function assertPrivateRequest(
  request:
    LivingFrameEnvironmentalParticlePrivatePixiJsRequest,
): void {
  const duration =
    request.renderCanvas.endFrameExclusive
    - request.renderCanvas.startFrame
  if (
    request.schemaVersion !==
      LIVING_FRAME_ENVIRONMENTAL_PARTICLE_OPERATION_REQUEST_VERSION
    || request.toolId !==
      LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PIXIJS_TOOL_ID
    || request.operationId !==
      LIVING_FRAME_ENVIRONMENTAL_PARTICLE_PIXIJS_OPERATION_ID
    || request.renderCanvas.durationFrames !== duration
    || request.renderCanvas.backgroundMode !==
      'transparent'
    || request.renderCanvas.alphaMode !==
      'straight_alpha_png'
    || !request.renderCanvas
      .exactConfirmedOutputFrameRequired
    || request.renderCanvas.finalVideoCanvas
    || request.particleProfile.particleCount !==
      request.deterministicStateSequence.particleCount
    || request.deterministicStateSequence
      .stateTracks.length !==
      request.deterministicStateSequence.particleCount
    || request.outputPolicy.logicalBundleCount !== 1
    || request.outputPolicy.frameImageCount !== duration
    || !request.outputPolicy.manifestRequired
    || !request.outputPolicy
      .byteOutputMayExistOnlyAfterQualifiedRuntime
    || !request.outputPolicy
      .createOnlyArtifactPersistenceRequired
    || !request.outputPolicy
      .generatedPrimitiveRemainsInputToRemotion
    || !request.outputPolicy.remotionOwnsFinalComposition
    || !request.supervisedRendererPolicy
      .oneRequestOneAttempt
    || request.supervisedRendererPolicy.networkAllowed
    || request.supervisedRendererPolicy
      .callerCodeAllowed
    || request.supervisedRendererPolicy
      .callerShadersAllowed
    || request.supervisedRendererPolicy
      .callerTexturesOrAssetsAllowed
    || request.supervisedRendererPolicy
      .callerHtmlCssScriptsAllowed
    || request.supervisedRendererPolicy
      .arbitrarySaveOrPreviewAllowed
    || request.supervisedRendererPolicy
      .arbitraryPathsUrlsCredentialsCommandsOrEnvironmentAllowed
    || !request.supervisedRendererPolicy
      .emitTransparentFrameForEveryBoundFrame
    || request.operationRegistered
    || request.dispatchAuthority
    || request.runtimeAuthority
    || request.artifactAuthority
    || request.finalCanvasAuthority
    || request.costAuthority
    || request.billingAuthority
    || request.productionReady
  ) {
    throw invalid(
      'private_request_invalid',
      '$.privateRequest',
    )
  }
}

function assertReceipt(
  draft:
    LivingFrameEnvironmentalParticleOperationMaterializationDraft,
): void {
  const {
    privateOperationRequestMaterializationAuthority,
    ...delegatedAuthorities
  } = draft.authorityBoundary
  if (
    privateOperationRequestMaterializationAuthority !== true
    || Object.values(delegatedAuthorities)
      .some((value) => value !== false)
    || stableAuthorityStringify(draft.openGateCodes) !==
      stableAuthorityStringify(
        LIVING_FRAME_ENVIRONMENTAL_PARTICLE_OPERATION_OPEN_GATES,
      )
    || draft.requestReceipt
      .serializedPrivateRequestByteLength < 2
    || draft.requestReceipt
      .serializedPrivateRequestByteLength >
        MAX_PRIVATE_REQUEST_BYTES
    || draft.requestReceipt.rawStateTracksIncludedInReceipt
    || draft.requestReceipt
      .rawPromptOrTranscriptIncludedInReceipt
    || draft.requestReceipt.mediaBytesIncludedInReceipt
    || draft.requestReceipt
      .pathUrlCredentialCommandOrEnvironmentIncludedInReceipt
    || draft.requestReceipt.leaseConsumed
    || !draft.renderEnvelope
      .transparentFrameSequenceRequested
    || !draft.renderEnvelope
      .exactConfirmedOutputFramePreserved
    || draft.renderEnvelope.squareSubstitutionApplied
    || draft.renderEnvelope.finalCanvasClaimed
    || draft.operationDisposition
      .separateToolIdentityRequired
    || draft.operationDisposition
      .registryExpansionRequired
    || draft.operationDisposition.operationRegistered
    || draft.operationDisposition.dispatchable
    || !draft.operationDisposition
      .oneLeaseRepresentsOneFuturePixiJsAttempt
    || !draft.operationDisposition
      .oneLogicalOutputBundlePerAttempt
    || !draft.operationDisposition
      .remotionRemainsFinalCanvas
    || draft.selectedSceneBound
    || draft.canonicalTimingBound
    || draft.operationRegistered
    || draft.dispatched
    || draft.runtimeExecuted
    || draft.artifactPersisted
    || draft.assetManifestMutated
    || draft.rendererMutated
    || draft.qaApproved
    || draft.privateReviewApproved
    || draft.actualCostCreated
    || draft.customerCharged
    || draft.containsExecutableCode
    || draft.containsSubjectSpecificSummaries
    || draft.subjectSpecificRouting
    || draft.productionReady
  ) {
    throw invalid(
      'authority_promotion_forbidden',
      '$.authorityBoundary',
    )
  }
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return Object.keys(value).sort().join('|') ===
    [...keys].sort().join('|')
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
}

function invalid(
  code:
    LivingFrameEnvironmentalParticleOperationIssueCode,
  path: string,
): LivingFrameEnvironmentalParticleOperationMaterializationError {
  return new LivingFrameEnvironmentalParticleOperationMaterializationError([
    { code, path },
  ])
}

function deepFreeze<T>(value: T): T {
  if (
    value
    && typeof value === 'object'
    && !Object.isFrozen(value)
  ) {
    Object.freeze(value)
    for (const nested of Object.values(value)) {
      deepFreeze(nested)
    }
  }
  return value
}
