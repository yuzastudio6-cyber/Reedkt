import { z } from 'zod'

import type {
  VisualIntelligenceEvidenceRef,
} from '../../src/types/visual-intelligence'
import { ApiError } from '../errors/api-error'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  assertCanonicalSourceAnalysisL4VisualEvidenceAdmission,
  assertCanonicalSourceAnalysisL4VisualEvidenceRelease,
  type CanonicalSourceAnalysisL4VisualEvidenceWorkerEnvelopeReadPort,
} from './canonical-source-analysis-l4-visual-evidence-attempt-owner'
import {
  canonicalSourceLedSourceFrameAuthoritySchema,
} from './canonical-source-led-content-analysis-evidence'
import type {
  CanonicalSourceAnalysisL4VisualEvidenceAuthorityRepository,
} from './canonical-source-analysis-l4-visual-evidence-authority-repository'
import {
  CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TOOLCHAIN_QUALIFICATION_READ_PORT_VERSION,
  assertCanonicalSourceAnalysisL4VisualEvidenceToolchainQualification,
  type CanonicalSourceAnalysisL4VisualEvidenceToolchainQualificationReadPort,
} from './canonical-source-analysis-l4-visual-evidence-toolchain-qualification-owner'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const
CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_WORKER_BOOTSTRAP_OWNER_VERSION =
  'canonical-source-analysis-l4-visual-evidence-worker-bootstrap-owner-v3' as const
export const
CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_WORKER_BOOTSTRAP_VERSION =
  'canonical-source-analysis-l4-visual-evidence-worker-bootstrap-v3' as const

const OPERATION_ID =
  'internal.visual_intelligence.prepare_source_visual_evidence.v1' as const
const ROUTE_PROFILE_ID =
  'quality_l4_user_triggered_standard_media_job_v1' as const
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const positiveInteger = z.number().int().positive().safe()
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()

export type CanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrapResult =
  | Readonly<{
      status: 'not_ready'
      blockerCode:
        | 'canonical_source_visual_evidence_worker_envelope_not_ready'
        | 'canonical_source_visual_evidence_worker_admission_not_ready'
        | 'canonical_source_visual_evidence_worker_release_not_ready'
        | 'canonical_source_visual_evidence_worker_toolchain_not_ready'
        | 'canonical_source_visual_evidence_worker_operation_not_ready'
      substantiveWorkStarted: false
      customerCreditMutated: false
    }>
  | Readonly<{
      status: 'ready'
      bootstrap: CanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrap
      substantiveWorkStarted: false
      customerCreditMutated: false
      publicDeliveryGranted: false
      productionAuthorityGranted: false
    }>

const bootstrapWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_WORKER_BOOTSTRAP_VERSION,
  ),
  source: z.literal(
    'canonical_l4_source_visual_evidence_private_worker_bootstrap_owner',
  ),
  invocationId: safeId,
  envelopeRef: evidenceRefSchema,
  consumptionRef: evidenceRefSchema,
  triggerRef: evidenceRefSchema,
  admissionRef: evidenceRefSchema,
  releaseRef: evidenceRefSchema,
  toolchainQualificationRef: evidenceRefSchema,
  cloudRunOperationRef: evidenceRefSchema,
  currentAccountRateAuthorityRef: evidenceRefSchema,
  sourceObject: z.object({
    storageProvider: z.literal('google_cloud_storage'),
    storageBucket: z.string().min(3).max(222)
      .regex(/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/u),
    storagePath: z.string().min(1).max(1_024)
      .regex(/^[A-Za-z0-9][A-Za-z0-9._/:-]*$/u)
      .refine((value) => !value.includes('..')
        && !value.includes('//') && !value.endsWith('/')),
    storageGeneration: z.string().regex(/^[1-9][0-9]{0,30}$/u),
    storageEtag: z.string().trim().min(1).max(1_024)
      .refine((value) => !/[\0\r\n]/u.test(value)),
    contentType: z.literal('video/mp4'),
    width: positiveInteger.max(16_384),
    height: positiveInteger.max(16_384),
    checksumSha256: rawSha256,
    byteLength: positiveInteger,
    finalizedMediaAuthorityRef: evidenceRefSchema,
    finalizedStorageObjectAuthorityRef: evidenceRefSchema,
    exactGenerationEtagChecksumAndLengthRereadRequired: z.literal(true),
  }).strict(),
  sourceTimeline: z.object({
    sourceSequenceItemId: safeId,
    mediaAssetId: safeId,
    uploadedOrder: positiveInteger.max(64),
    durationFrames: positiveInteger,
    sourceFrameAuthority: canonicalSourceLedSourceFrameAuthoritySchema,
    sourceProbeAuthorityRef: evidenceRefSchema,
  }).strict(),
  scopeDigestSha256: rawSha256,
  operationId: z.literal(OPERATION_ID),
  routeProfileId: z.literal(ROUTE_PROFILE_ID),
  routeId: z.literal('l4_standard_primary'),
  acceleratorClass: z.literal('nvidia_l4'),
  cloudRunJobResource: z.string().regex(
    /^projects\/reeditpro\/locations\/(us-central1|europe-west4)\/jobs\/reeditpro-professional-l4$/u,
  ),
  operationResource: z.string().regex(
    /^projects\/reeditpro\/locations\/(us-central1|europe-west4)\/operations\/[A-Za-z0-9._-]+$/u,
  ),
  immutableImageRef: evidenceRefSchema,
  toolReleaseRefs: z.array(z.object({
    role: z.enum([
      'media_probe', 'private_media_transform', 'scene_detection',
      'pixel_measurement', 'exact_visible_text', 'sampling_policy',
    ]),
    operationId: safeId,
    runtimeReleaseRef: evidenceRefSchema,
  }).strict()).length(6),
  maximumExecutionSeconds: z.literal(900),
  maximumAttempts: z.literal(1),
  minimumIdleInstances: z.literal(0),
  cloudRunEnvironmentContainedOnlyInvocationId: z.literal(true),
  exactCreateOnlyEnvelopeConsumptionAdmissionReleaseAndOperationReread:
    z.literal(true),
  substantiveCpuMediaProcessingAllowed: z.literal(false),
  runtimeNetworkDownloadAllowed: z.literal(false),
  callerPathUrlBytesCommandOrEnvironmentAccepted: z.literal(false),
  sourceBytesRead: z.literal(false),
  toolExecutionStarted: z.literal(false),
  customerCreditMutationAllowed: z.literal(false),
  publicDeliveryAllowed: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const bootstrapSchema = bootstrapWithoutDigestSchema.extend({
  bootstrapDigestSha256: rawSha256,
}).strict()
export type CanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrap = z.infer<
  typeof bootstrapSchema
>

export interface CanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrapOwner {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_WORKER_BOOTSTRAP_OWNER_VERSION
  readonly operationId: typeof OPERATION_ID
  readonly acceleratorClass: 'nvidia_l4'
  readonly cloudRunEnvironmentMayContainOnlyInvocationId: true
  readonly substantiveCpuMediaProcessingAllowed: false
  readonly runtimeNetworkDownloadAllowed: false
  bootstrap(
    invocationId: string,
  ): Promise<CanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrapResult>
}

export function createCanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrapOwner(
  input: Readonly<{
    envelopeReadPort:
      CanonicalSourceAnalysisL4VisualEvidenceWorkerEnvelopeReadPort
    authorityRepository:
      CanonicalSourceAnalysisL4VisualEvidenceAuthorityRepository
    toolchainQualificationReadPort:
      CanonicalSourceAnalysisL4VisualEvidenceToolchainQualificationReadPort
  }>,
): CanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrapOwner {
  validateDependencies(input)
  return Object.freeze({
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_WORKER_BOOTSTRAP_OWNER_VERSION,
    operationId: OPERATION_ID,
    acceleratorClass: 'nvidia_l4' as const,
    cloudRunEnvironmentMayContainOnlyInvocationId: true as const,
    substantiveCpuMediaProcessingAllowed: false as const,
    runtimeNetworkDownloadAllowed: false as const,
    async bootstrap(untrustedInvocationId: string) {
      const invocationId = safeId.parse(untrustedInvocationId)
      const consumed = await input.envelopeReadPort
        .readExactConsumedEnvelope(invocationId)
      if (!consumed) return notReady(
        'canonical_source_visual_evidence_worker_envelope_not_ready',
      )
      const envelope = consumed.envelope
      const admissionRaw = await input.authorityRepository.readExactAdmission({
        triggerRef: envelope.triggerRef,
        admissionRef: envelope.admissionRef,
      })
      if (!admissionRaw) return notReady(
        'canonical_source_visual_evidence_worker_admission_not_ready',
      )
      const admission = assertCanonicalSourceAnalysisL4VisualEvidenceAdmission(
        admissionRaw,
      )
      const releaseRaw = await input.authorityRepository.readExactRelease(
        envelope.releaseRef,
      )
      if (!releaseRaw) return notReady(
        'canonical_source_visual_evidence_worker_release_not_ready',
      )
      const release = assertCanonicalSourceAnalysisL4VisualEvidenceRelease(
        releaseRaw,
      )
      const qualificationRaw = await input.toolchainQualificationReadPort
        .readExact(release.toolchainQualificationRef)
      if (!qualificationRaw) return notReady(
        'canonical_source_visual_evidence_worker_toolchain_not_ready',
      )
      const qualification =
        assertCanonicalSourceAnalysisL4VisualEvidenceToolchainQualification(
          qualificationRaw,
        )
      const operation = await input.authorityRepository
        .cloudRunOperationAuthorityPort.readExactAcceptedOperation({
          invocationId,
          releaseRef: release.releaseRef,
        })
      if (!operation) return notReady(
        'canonical_source_visual_evidence_worker_operation_not_ready',
      )
      assertBindings({
        consumed,
        admission,
        release,
        qualification,
        operation,
      })
      const payload = bootstrapWithoutDigestSchema.parse({
        schemaVersion:
          CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_WORKER_BOOTSTRAP_VERSION,
        source:
          'canonical_l4_source_visual_evidence_private_worker_bootstrap_owner',
        invocationId,
        envelopeRef: consumed.envelopeRef,
        consumptionRef: consumed.consumptionRef,
        triggerRef: envelope.triggerRef,
        admissionRef: envelope.admissionRef,
        releaseRef: envelope.releaseRef,
        toolchainQualificationRef: release.toolchainQualificationRef,
        cloudRunOperationRef: operation.cloudRunOperationRef,
        currentAccountRateAuthorityRef:
          admission.currentAccountRateAuthorityRef,
        sourceObject: envelope.sourceObject,
        sourceTimeline: {
          sourceSequenceItemId: envelope.scope.sourceSequenceItemId,
          mediaAssetId: envelope.scope.mediaAssetId,
          uploadedOrder: envelope.scope.uploadedOrder,
          durationFrames: envelope.scope.durationFrames,
          sourceFrameAuthority: envelope.scope.sourceFrameAuthority,
          sourceProbeAuthorityRef: envelope.scope.sourceProbeAuthorityRef,
        },
        scopeDigestSha256: admission.scopeDigestSha256,
        operationId: OPERATION_ID,
        routeProfileId: ROUTE_PROFILE_ID,
        routeId: 'l4_standard_primary',
        acceleratorClass: 'nvidia_l4',
        cloudRunJobResource: release.cloudRunJobResource,
        operationResource: operation.operationResource,
        immutableImageRef: release.immutableImageRef,
        toolReleaseRefs: release.toolReleases,
        maximumExecutionSeconds: 900,
        maximumAttempts: 1,
        minimumIdleInstances: 0,
        cloudRunEnvironmentContainedOnlyInvocationId: true,
        exactCreateOnlyEnvelopeConsumptionAdmissionReleaseAndOperationReread:
          true,
        substantiveCpuMediaProcessingAllowed: false,
        runtimeNetworkDownloadAllowed: false,
        callerPathUrlBytesCommandOrEnvironmentAccepted: false,
        sourceBytesRead: false,
        toolExecutionStarted: false,
        customerCreditMutationAllowed: false,
        publicDeliveryAllowed: false,
        productionAuthorityGranted: false,
      })
      const bootstrap = Object.freeze(bootstrapSchema.parse({
        ...payload,
        bootstrapDigestSha256: sha256AuthorityValue(payload),
      }))
      return Object.freeze({
        status: 'ready' as const,
        bootstrap,
        substantiveWorkStarted: false as const,
        customerCreditMutated: false as const,
        publicDeliveryGranted: false as const,
        productionAuthorityGranted: false as const,
      })
    },
  })
}

export function assertCanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrap(
  value: unknown,
): CanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrap {
  assertPlainSerializedData(value, 'source_visual_evidence_worker_bootstrap')
  const bootstrap = bootstrapSchema.parse(value)
  const { bootstrapDigestSha256, ...payload } = bootstrap
  if (bootstrapDigestSha256 !== sha256AuthorityValue(payload)) {
    throw conflict('source_visual_evidence_worker_bootstrap_digest_invalid')
  }
  return Object.freeze(bootstrap)
}

function assertBindings(input: Readonly<{
  consumed: Awaited<ReturnType<
    CanonicalSourceAnalysisL4VisualEvidenceWorkerEnvelopeReadPort[
      'readExactConsumedEnvelope'
    ]
  >> & {}
  admission: ReturnType<
    typeof assertCanonicalSourceAnalysisL4VisualEvidenceAdmission
  >
  release: ReturnType<
    typeof assertCanonicalSourceAnalysisL4VisualEvidenceRelease
  >
  qualification: ReturnType<
    typeof assertCanonicalSourceAnalysisL4VisualEvidenceToolchainQualification
  >
  operation: NonNullable<Awaited<ReturnType<
    CanonicalSourceAnalysisL4VisualEvidenceAuthorityRepository[
      'cloudRunOperationAuthorityPort'
    ]['readExactAcceptedOperation']
  >>>
}>): void {
  const { envelope, consumption } = input.consumed
  const source = envelope.sourceObject
  const scope = envelope.scope
  if (
    envelope.operationId !== OPERATION_ID
    || envelope.routeProfileId !== ROUTE_PROFILE_ID
    || envelope.invocationId !== input.operation.invocationId
    || !sameRef(envelope.admissionRef, admissionRef(input.admission))
    || !sameRef(envelope.releaseRef, input.release.releaseRef)
    || !sameRef(consumption.admissionRef, envelope.admissionRef)
    || input.admission.scopeDigestSha256 !== sha256AuthorityValue(scope)
    || !sameRef(input.admission.finalizedMediaAuthorityRef,
      source.finalizedMediaAuthorityRef)
    || !sameRef(input.admission.finalizedStorageObjectAuthorityRef,
      source.finalizedStorageObjectAuthorityRef)
    || !sameRef(input.admission.sourceProbeAuthorityRef,
      scope.sourceProbeAuthorityRef)
    || !sameRef(input.admission.runtimeReleaseRef, input.release.releaseRef)
    || input.release.operationId !== OPERATION_ID
    || input.release.routeProfileId !== ROUTE_PROFILE_ID
    || input.release.routeId !== 'l4_standard_primary'
    || input.release.acceleratorClass !== 'nvidia_l4'
    || input.release.cloudRunJobName !== 'reeditpro-professional-l4'
    || input.release.maximumExecutionSeconds !== 900
    || input.release.maximumAttempts !== 1
    || input.release.minimumIdleInstances !== 0
    || input.release.runtimeDownloadAllowed
    || input.release.substantiveCpuMediaProcessingAllowed
    || input.release.callerCommandImageModelPathUrlOrEnvironmentAccepted
    || input.release.productionAuthorityGranted
    || !sameRef(
      input.release.toolchainQualificationRef,
      qualificationRef(input.qualification),
    )
    || !sameRef(
      input.release.immutableImageRef,
      input.qualification.immutableImageRef,
    )
    || input.release.immutableImageDigest !==
      input.qualification.immutableImageDigest
    || input.operation.cloudRunJobResource !==
      input.release.cloudRunJobResource
    || !sameRef(input.operation.releaseRef, input.release.releaseRef)
    || Date.parse(input.operation.observedAt) <
      Date.parse(consumption.consumedAt)
  ) throw conflict('source_visual_evidence_worker_bootstrap_binding_invalid')
}

function admissionRef(
  admission: ReturnType<
    typeof assertCanonicalSourceAnalysisL4VisualEvidenceAdmission
  >,
): VisualIntelligenceEvidenceRef {
  return Object.freeze({
    id: admission.admissionId,
    version: 1,
    contentHash: `sha256:${admission.admissionHash}`,
  })
}

function qualificationRef(
  qualification: ReturnType<
    typeof assertCanonicalSourceAnalysisL4VisualEvidenceToolchainQualification
  >,
): VisualIntelligenceEvidenceRef {
  return Object.freeze({
    id: qualification.qualificationId,
    version: 1,
    contentHash: `sha256:${qualification.qualificationDigestSha256}`,
  })
}

function sameRef(
  left: VisualIntelligenceEvidenceRef,
  right: VisualIntelligenceEvidenceRef,
): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}

function notReady(
  blockerCode: Extract<
    CanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrapResult,
    { status: 'not_ready' }
  >['blockerCode'],
): Extract<
  CanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrapResult,
  { status: 'not_ready' }
> {
  return Object.freeze({
    status: 'not_ready' as const,
    blockerCode,
    substantiveWorkStarted: false as const,
    customerCreditMutated: false as const,
  })
}

function validateDependencies(input: Readonly<{
  envelopeReadPort:
    CanonicalSourceAnalysisL4VisualEvidenceWorkerEnvelopeReadPort
  authorityRepository:
    CanonicalSourceAnalysisL4VisualEvidenceAuthorityRepository
  toolchainQualificationReadPort:
    CanonicalSourceAnalysisL4VisualEvidenceToolchainQualificationReadPort
}>): void {
  if (
    input.envelopeReadPort?.schemaVersion !==
      'canonical-source-analysis-l4-visual-evidence-worker-envelope-read-port-v1'
    || typeof input.envelopeReadPort.readExactConsumedEnvelope !== 'function'
    || input.authorityRepository?.repositoryVersion !==
      'canonical-source-analysis-l4-visual-evidence-authority-repository-v1'
    || typeof input.authorityRepository.readExactAdmission !== 'function'
    || typeof input.authorityRepository.readExactRelease !== 'function'
    || typeof input.authorityRepository.cloudRunOperationAuthorityPort
      ?.readExactAcceptedOperation !== 'function'
    || input.toolchainQualificationReadPort?.schemaVersion !==
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TOOLCHAIN_QUALIFICATION_READ_PORT_VERSION
    || typeof input.toolchainQualificationReadPort.readExact !== 'function'
  ) throw new TypeError(
    'L4 visual evidence worker bootstrap dependencies are invalid.',
  )
}

function conflict(requiredGate: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'The L4 visual evidence worker bootstrap conflicts with canonical authority.',
    409,
    { requiredGate },
  )
}
