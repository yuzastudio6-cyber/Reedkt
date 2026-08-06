import { z } from 'zod'

import {
  assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority,
  type CanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority,
} from './canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-authority'
import {
  assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildTerminal,
  canonicalTrackAllSam31L4TaskQaCloudImageBuildTerminalRef,
  type CanonicalTrackAllSam31L4TaskQaCloudImageBuildTerminal,
} from './canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-observation'
import {
  assertCanonicalTrackAllSam31L4TaskQaPrivateQualificationReceipt,
  canonicalTrackAllSam31L4TaskQaPrivateQualificationRef,
  type CanonicalTrackAllSam31L4TaskQaPrivateQualificationReceipt,
} from './canonical-track-all-sam3_1-l4-task-qa-private-qualification'
import {
  assertCanonicalTrackAllSam31L4TaskQaImageQualification,
  canonicalTrackAllSam31L4TaskQaImageQualificationRef,
  createCanonicalTrackAllSam31L4TaskQaImageQualification,
  type CanonicalTrackAllSam31L4TaskQaRuntimeReleaseEvidenceRepository,
} from './canonical-track-all-sam3_1-l4-task-qa-runtime-release-publisher'
import {
  assertCanonicalSam31ImageSecurityReview,
  canonicalImageSecurityReviewRef,
  type CanonicalSam31ImageSecurityReview,
} from './canonical-sam3_1-cloud-image-supply-chain-evidence-read-service'
import {
  assertCanonicalCurrentGoogleCloudGpuRateAuthority,
  type CanonicalCurrentGoogleCloudGpuRateAuthority,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_IMAGE_QUALIFICATION_OWNER_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-image-qualification-owner-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_IMAGE_QUALIFICATION_OWNER_RECEIPT_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-image-qualification-owner-receipt-v1' as const

const OPERATION_ID = 'tool.kornia.refine_mask.v1' as const
const ROUTE_ID = 'l4_standard_primary' as const
const IMAGE_DIGEST =
  'sha256:5ccb7b8be3fae729a07cb38663265fe78419f1e273310f57bed092b09b36dd71' as const
const IMAGE_URI =
  `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-track-all-l4-task-qa@${IMAGE_DIGEST}` as const
const BASE_IMAGE_DIGEST =
  'sha256:b85566342b86d13a67712e9315d40cdc2dad7f8d86df1aff3831f80835edbcca' as const
const QUALIFICATION_VALIDITY_MILLISECONDS = 30 * 24 * 60 * 60 * 1_000
const MAXIMUM_SUPPORTING_QUALIFICATION_AGE_MILLISECONDS =
  30 * 24 * 60 * 60 * 1_000

const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('://'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()

const evidenceRefsSchema = z.object({
  imageBuildAuthorityRef: evidenceRefSchema,
  imageBuildTerminalRef: evidenceRefSchema,
  securityReviewRef: evidenceRefSchema,
  privateQualificationRef: evidenceRefSchema,
  accountEffectiveL4RateAuthorityRef: evidenceRefSchema,
}).strict()

const ownerReceiptWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_IMAGE_QUALIFICATION_OWNER_RECEIPT_VERSION,
  ),
  ownerVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_IMAGE_QUALIFICATION_OWNER_VERSION,
  ),
  source: z.literal(
    'canonical_server_track_all_sam3_1_l4_task_qa_image_qualification_owner',
  ),
  evidenceClass: z.literal(
    'exact_build_supply_chain_l4_execution_and_current_rate_reread',
  ),
  evidenceRefs: evidenceRefsSchema,
  imageQualificationRef: evidenceRefSchema,
  disposition: z.enum(['created', 'identical_replay']),
  exactBuildAuthorityTerminalSecurityAndPrivateL4QualificationReread:
    z.literal(true),
  exactCurrentBillingAccountEffectiveL4RateReread: z.literal(true),
  accountEffectiveRateUsedForCompatibilityOnly: z.literal(true),
  actualAttemptCostStillRequiresTerminalUsageAndBillingReread:
    z.literal(true),
  gpuJobStarted: z.literal(false),
  providerOrModelExecuted: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApprovalGranted: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  qualifiedAt: timestamp,
}).strict()

const ownerReceiptSchema = ownerReceiptWithoutHashSchema.extend({
  receiptHash: rawSha256,
}).strict()

export type CanonicalTrackAllSam31L4TaskQaImageQualificationOwnerReceipt =
  z.infer<typeof ownerReceiptSchema>

export interface CanonicalTrackAllSam31L4TaskQaImageQualificationEvidenceReadPort {
  rereadBuildAuthority(input: {
    readonly authorityRef: z.infer<typeof evidenceRefSchema>
  }): Promise<unknown | null>
  rereadBuildTerminal(input: {
    readonly terminalRef: z.infer<typeof evidenceRefSchema>
  }): Promise<unknown | null>
  rereadSecurityReview(input: {
    readonly securityReviewRef: z.infer<typeof evidenceRefSchema>
  }): Promise<unknown | null>
  rereadPrivateQualification(input: {
    readonly privateQualificationRef: z.infer<typeof evidenceRefSchema>
  }): Promise<unknown | null>
  rereadApprovedCurrentRate(input: {
    readonly rateAuthorityRef: z.infer<typeof evidenceRefSchema>
    readonly routeId: typeof ROUTE_ID
    readonly at: string
  }): Promise<unknown | null>
}

/**
 * Joins already-persisted, independently owned evidence into the exact image
 * qualification required by the L4 release publisher. This owner cannot build
 * an image, start a GPU, call a model, settle credits, approve QA, or release
 * a runtime. The fresh account-effective rate is compatibility evidence only;
 * every real attempt still requires terminal usage and billing rereads.
 */
export async function qualifyCanonicalTrackAllSam31L4TaskQaImage(input: {
  readonly evidenceRefs: z.input<typeof evidenceRefsSchema>
  readonly evidenceReadPort:
    CanonicalTrackAllSam31L4TaskQaImageQualificationEvidenceReadPort
  readonly evidenceRepository:
    CanonicalTrackAllSam31L4TaskQaRuntimeReleaseEvidenceRepository
  readonly now?: () => string
}): Promise<CanonicalTrackAllSam31L4TaskQaImageQualificationOwnerReceipt> {
  assertPlainSerializedData(input.evidenceRefs, 'track_all_l4_image_evidence_refs')
  assertReadPort(input.evidenceReadPort)
  const evidenceRefs = evidenceRefsSchema.parse(input.evidenceRefs)
  const qualifiedAt = timestamp.parse(
    (input.now ?? (() => new Date().toISOString()))(),
  )
  const [buildAuthorityValue, buildTerminalValue, securityReviewValue,
    privateQualificationValue, rateAuthorityValue] = await Promise.all([
    input.evidenceReadPort.rereadBuildAuthority({
      authorityRef: evidenceRefs.imageBuildAuthorityRef,
    }),
    input.evidenceReadPort.rereadBuildTerminal({
      terminalRef: evidenceRefs.imageBuildTerminalRef,
    }),
    input.evidenceReadPort.rereadSecurityReview({
      securityReviewRef: evidenceRefs.securityReviewRef,
    }),
    input.evidenceReadPort.rereadPrivateQualification({
      privateQualificationRef: evidenceRefs.privateQualificationRef,
    }),
    input.evidenceReadPort.rereadApprovedCurrentRate({
      rateAuthorityRef: evidenceRefs.accountEffectiveL4RateAuthorityRef,
      routeId: ROUTE_ID,
      at: qualifiedAt,
    }),
  ])
  const buildAuthority = requireBuildAuthority(buildAuthorityValue)
  const buildTerminal = requireBuildTerminal(buildTerminalValue)
  const securityReview = requireSecurityReview(securityReviewValue)
  const privateQualification = requirePrivateQualification(
    privateQualificationValue,
  )
  const rateAuthority = requireCurrentRate(rateAuthorityValue, qualifiedAt)

  assertExactEvidenceLineage({
    evidenceRefs,
    buildAuthority,
    buildTerminal,
    securityReview,
    privateQualification,
    rateAuthority,
    qualifiedAt,
  })

  const privateQualificationRef =
    canonicalTrackAllSam31L4TaskQaPrivateQualificationRef(
      privateQualification,
    )
  const qualificationId = `track-all-l4-task-qa-image-qualification-${
    sha256AuthorityValue({
      imageBuildAuthorityRef: evidenceRefs.imageBuildAuthorityRef,
      imageBuildTerminalRef: evidenceRefs.imageBuildTerminalRef,
      securityReviewRef: evidenceRefs.securityReviewRef,
      privateQualificationRef,
      accountEffectiveL4RateAuthorityRef:
        evidenceRefs.accountEffectiveL4RateAuthorityRef,
    }).slice(0, 32)
  }`
  const imageQualification =
    createCanonicalTrackAllSam31L4TaskQaImageQualification({
      schemaVersion:
        'canonical-track-all-sam3_1-l4-task-qa-image-qualification-v1',
      source:
        'canonical_server_track_all_sam3_1_l4_task_qa_image_qualification_owner',
      evidenceClass: 'canonical_private_reread',
      qualificationId,
      qualificationVersion: 1,
      operationId: OPERATION_ID,
      routeId: ROUTE_ID,
      runtimeCandidateRef: evidenceRefs.imageBuildAuthorityRef,
      sourceRevision: buildAuthority.sourceCommitSha,
      sourceTreeHash: buildAuthority.sourceTreeSha,
      sourceWorktreeClean: true,
      immutableImageRef: ref(
        'weeditpro-track-all-l4-task-qa-immutable-image',
        IMAGE_DIGEST,
      ),
      immutableImageUri: IMAGE_URI,
      immutableImageDigest: IMAGE_DIGEST,
      baseImageRef: ref(
        'pytorch-pytorch-track-all-l4-task-qa-base-image',
        BASE_IMAGE_DIGEST,
      ),
      privateBuildCapsuleManifestRef: ref(
        'track-all-l4-task-qa-private-build-capsule-manifest',
        `sha256:${buildAuthority.buildClosure.privateCapsuleManifestSha256}`,
      ),
      requirementsLockRef: ref(
        'track-all-l4-task-qa-requirements-lock',
        `sha256:${buildAuthority.buildClosure.requirementsLockSha256}`,
      ),
      opencvCudaBuildReceiptRef: ref(
        'track-all-l4-task-qa-opencv-cuda-build-receipt',
        `sha256:${buildAuthority.buildClosure.opencvCudaReceiptSha256}`,
      ),
      cudaForwardCompatibilityReceiptRef: ref(
        'track-all-l4-task-qa-cuda-forward-compatibility-receipt',
        `sha256:${buildAuthority.buildClosure.cudaForwardCompatReceiptSha256}`,
      ),
      sbomRef: privateQualification.supplyChainEvidence.sbomRef,
      vulnerabilityScanRef:
        privateQualification.supplyChainEvidence.vulnerabilityScanRef,
      signatureVerificationRef:
        privateQualification.supplyChainEvidence.signatureVerificationRef,
      slsaProvenanceRef:
        privateQualification.supplyChainEvidence.slsaProvenanceRef,
      l4DriverCudaKorniaAndOpenCvQualificationRef: privateQualificationRef,
      completeFrameAndSubjectQualityQualificationRef:
        privateQualificationRef,
      scaleFromZeroAndTerminalStopQualificationRef: privateQualificationRef,
      accountEffectiveL4RateCompatibilityRef:
        evidenceRefs.accountEffectiveL4RateAuthorityRef,
      observedTorchVersion:
        privateQualification.workerResponse.gpuEvidence!.observedTorchVersion,
      observedCudaRuntimeVersion:
        privateQualification.workerResponse.gpuEvidence!
          .observedCudaRuntimeVersion,
      observedKorniaVersion:
        privateQualification.workerResponse.gpuEvidence!.observedKorniaVersion,
      observedOpenCvCudaBuild: true,
      criticalVulnerabilityCount:
        securityReview.severityCounts.criticalCount,
      highVulnerabilityCount: securityReview.severityCounts.highCount,
      unknownSeverityVulnerabilityCount:
        securityReview.severityCounts.unknownSeverityCount,
      exactImmutableImageSbomScanSignatureAndProvenanceReread: true,
      exactL4CudaRuntimeAndCompleteQualityEvidenceReread: true,
      runtimeDownloadAllowed: false,
      samCheckpointOrModelWeightsIncluded: false,
      cpuOnlySubstantiveMaskQaAllowed: false,
      gpuJobStartedByQualificationOwner: false,
      customerCreditsMutated: false,
      qaApprovalGranted: false,
      publicDeliveryAuthorized: false,
      productionAuthorityGranted: false,
      qualifiedAt,
      expiresAt: new Date(
        Date.parse(qualifiedAt) + QUALIFICATION_VALIDITY_MILLISECONDS,
      ).toISOString(),
    })
  const disposition = await input.evidenceRepository
    .persistImageQualificationCreateOnly({ qualification: imageQualification })
  const imageQualificationRef =
    canonicalTrackAllSam31L4TaskQaImageQualificationRef(imageQualification)
  const reread = assertCanonicalTrackAllSam31L4TaskQaImageQualification(
    await input.evidenceRepository.rereadImageQualification({
      imageQualificationRef,
    }),
  )
  if (!sameRef(
    canonicalTrackAllSam31L4TaskQaImageQualificationRef(reread),
    imageQualificationRef,
  )) throw new Error('Track All L4 image qualification exact reread changed.')

  const payload = ownerReceiptWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_IMAGE_QUALIFICATION_OWNER_RECEIPT_VERSION,
    ownerVersion:
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_IMAGE_QUALIFICATION_OWNER_VERSION,
    source:
      'canonical_server_track_all_sam3_1_l4_task_qa_image_qualification_owner',
    evidenceClass:
      'exact_build_supply_chain_l4_execution_and_current_rate_reread',
    evidenceRefs,
    imageQualificationRef,
    disposition,
    exactBuildAuthorityTerminalSecurityAndPrivateL4QualificationReread: true,
    exactCurrentBillingAccountEffectiveL4RateReread: true,
    accountEffectiveRateUsedForCompatibilityOnly: true,
    actualAttemptCostStillRequiresTerminalUsageAndBillingReread: true,
    gpuJobStarted: false,
    providerOrModelExecuted: false,
    runtimeReleaseGranted: false,
    customerCreditsMutated: false,
    qaApprovalGranted: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    qualifiedAt,
  })
  return Object.freeze(ownerReceiptSchema.parse({
    ...payload,
    receiptHash: sha256AuthorityValue(payload),
  }))
}

export function assertCanonicalTrackAllSam31L4TaskQaImageQualificationOwnerReceipt(
  value: unknown,
): CanonicalTrackAllSam31L4TaskQaImageQualificationOwnerReceipt {
  assertPlainSerializedData(value, 'track_all_l4_image_qualification_receipt')
  const receipt = ownerReceiptSchema.parse(value)
  const { receiptHash, ...payload } = receipt
  if (receiptHash !== sha256AuthorityValue(payload)) {
    throw new Error('Track All L4 image qualification receipt hash invalid.')
  }
  return structuredClone(receipt)
}

function assertExactEvidenceLineage(input: {
  evidenceRefs: z.infer<typeof evidenceRefsSchema>
  buildAuthority: CanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority
  buildTerminal: CanonicalTrackAllSam31L4TaskQaCloudImageBuildTerminal
  securityReview: CanonicalSam31ImageSecurityReview
  privateQualification:
    CanonicalTrackAllSam31L4TaskQaPrivateQualificationReceipt
  rateAuthority: CanonicalCurrentGoogleCloudGpuRateAuthority
  qualifiedAt: string
}): void {
  const authorityRef = ref(
    input.buildAuthority.authorityId,
    `sha256:${input.buildAuthority.authorityHash}`,
  )
  const terminalRef =
    canonicalTrackAllSam31L4TaskQaCloudImageBuildTerminalRef(
      input.buildTerminal,
    )
  const reviewRef = canonicalImageSecurityReviewRef(input.securityReview)
  const privateRef = canonicalTrackAllSam31L4TaskQaPrivateQualificationRef(
    input.privateQualification,
  )
  const rateRef = ref(
    input.rateAuthority.rateAuthorityId,
    `sha256:${input.rateAuthority.rateAuthorityHash}`,
    input.rateAuthority.rateAuthorityVersion,
  )
  const supply = input.privateQualification.supplyChainEvidence
  const gpu = input.privateQualification.workerResponse.gpuEvidence
  const evidenceTimes = [
    input.buildAuthority.preparedAt,
    input.buildTerminal.observedAt,
    input.securityReview.reviewedAt,
    input.privateQualification.qualifiedAt,
    input.rateAuthority.observedAt,
  ]
  const qualifiedAtMs = Date.parse(input.qualifiedAt)
  const terminalObservedAtMs = Date.parse(input.buildTerminal.observedAt)
  const securityReviewedAtMs = Date.parse(input.securityReview.reviewedAt)
  const privateQualifiedAtMs = Date.parse(
    input.privateQualification.qualifiedAt,
  )
  const exact =
    sameRef(authorityRef, input.evidenceRefs.imageBuildAuthorityRef)
    && sameRef(terminalRef, input.evidenceRefs.imageBuildTerminalRef)
    && sameRef(reviewRef, input.evidenceRefs.securityReviewRef)
    && sameRef(privateRef, input.evidenceRefs.privateQualificationRef)
    && sameRef(
      rateRef,
      input.evidenceRefs.accountEffectiveL4RateAuthorityRef,
    )
    && sameRef(input.buildTerminal.authorityRef, authorityRef)
    && sameRef(supply.imageBuildAuthorityRef, authorityRef)
    && sameRef(supply.imageBuildTerminalRef, terminalRef)
    && sameRef(supply.securityReviewRef, reviewRef)
    && sameRef(
      supply.vulnerabilityScanRef,
      input.securityReview.vulnerabilityScanRef,
    )
    && input.buildAuthority.evidenceClass === 'canonical_private_reread'
    && input.buildAuthority.status === 'authorized_for_private_cloud_build'
    && input.buildAuthority.authority.cloudImageBuildAuthorized
    && input.buildTerminal.disposition ===
      'image_built_pending_supply_chain_release'
    && input.buildTerminal.imageBuiltAndPushed
    && input.buildTerminal.immutableImageDigest === IMAGE_DIGEST
    && input.buildTerminal.immutableImageUri === IMAGE_URI
    && input.securityReview.immutableImageDigest === IMAGE_DIGEST
    && input.privateQualification.deployment.immutableImageDigest ===
      IMAGE_DIGEST
    && input.privateQualification.operationId === OPERATION_ID
    && input.privateQualification.routeId === ROUTE_ID
    && input.privateQualification.disposition ===
      'l4_task_qa_qualified_rate_blocked'
    && input.privateQualification.execution.scaleFromZeroObserved
    && input.privateQualification.execution
      .terminalWorkerStoppedAndScaleBackToZeroVerified
    && input.privateQualification.execution.activeExecutionCountBeforeStart === 0
    && input.privateQualification.execution.activeExecutionCountAfterTerminal === 0
    && input.privateQualification.actualL4GpuExecutionObserved
    && input.privateQualification.actualKorniaCudaKernelExecutionObserved
    && input.privateQualification.actualOpenCvCudaCrosscheckExecutionObserved
    && input.privateQualification.everyFixtureMaskRereadAndMeasured
    && input.privateQualification.supplyChainEvidence
      .exactSupplyChainRereadBeforeQualification
    && gpu !== null
    && gpu !== undefined
    && gpu.exactL4DeviceObserved
    && gpu.korniaCudaTensorExecutionObserved
    && gpu.opencvCudaEveryMaskCrosschecked
    && input.rateAuthority.routeId === ROUTE_ID
    && input.rateAuthority.routeRole === 'standard_primary'
    && input.rateAuthority.executionTarget === 'google_cloud_run_l4_job'
    && input.rateAuthority.accelerator === 'nvidia_l4'
    && input.rateAuthority.region === 'us-central1'
    && input.rateAuthority.currency === 'USD'
    && input.rateAuthority.actualAttemptCostStillRequiresPlatformUsageAndBillingReread
    && Date.parse(input.buildAuthority.preparedAt) <= terminalObservedAtMs
    && terminalObservedAtMs <= securityReviewedAtMs
    && securityReviewedAtMs <= privateQualifiedAtMs
    && qualifiedAtMs - securityReviewedAtMs <=
      MAXIMUM_SUPPORTING_QUALIFICATION_AGE_MILLISECONDS
    && qualifiedAtMs - privateQualifiedAtMs <=
      MAXIMUM_SUPPORTING_QUALIFICATION_AGE_MILLISECONDS
    && evidenceTimes.every((value) =>
      Date.parse(value) <= qualifiedAtMs)
  if (!exact) {
    throw new Error('Track All L4 image qualification evidence lineage changed.')
  }
}

function requireBuildAuthority(value: unknown) {
  if (value === null) throw new Error('Track All L4 build authority missing.')
  return assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority(value)
}

function requireBuildTerminal(value: unknown) {
  if (value === null) throw new Error('Track All L4 build terminal missing.')
  return assertCanonicalTrackAllSam31L4TaskQaCloudImageBuildTerminal(value)
}

function requireSecurityReview(value: unknown) {
  if (value === null) throw new Error('Track All L4 security review missing.')
  return assertCanonicalSam31ImageSecurityReview(value)
}

function requirePrivateQualification(value: unknown) {
  if (value === null) throw new Error('Track All L4 private qualification missing.')
  return assertCanonicalTrackAllSam31L4TaskQaPrivateQualificationReceipt(value)
}

function requireCurrentRate(value: unknown, at: string) {
  if (value === null) throw new Error('Track All L4 current rate missing.')
  return assertCanonicalCurrentGoogleCloudGpuRateAuthority(value, at)
}

function ref(id: string, contentHash: string, version = 1) {
  return evidenceRefSchema.parse({ id, version, contentHash })
}

function sameRef(left: unknown, right: unknown): boolean {
  try {
    return stableAuthorityStringify(evidenceRefSchema.parse(left)) ===
      stableAuthorityStringify(evidenceRefSchema.parse(right))
  } catch {
    return false
  }
}

function assertReadPort(
  port: CanonicalTrackAllSam31L4TaskQaImageQualificationEvidenceReadPort,
): void {
  if (!port || [
    port.rereadBuildAuthority,
    port.rereadBuildTerminal,
    port.rereadSecurityReview,
    port.rereadPrivateQualification,
    port.rereadApprovedCurrentRate,
  ].some((method) => typeof method !== 'function')) {
    throw new Error('Track All L4 image qualification read port missing.')
  }
}
