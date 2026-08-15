import { z } from 'zod'

import type {
  OrchestraEvidenceRef,
  SkillCapabilityManifest,
  SkillQualificationSnapshot,
} from '../../../src/types/orchestra-skill-capability'
import {
  ORCHESTRA_SKILL_QUALIFICATION_SNAPSHOT_VERSION,
} from '../../../src/types/orchestra-skill-capability'
import {
  assertCanonicalProfessionalToolGpuRuntimeRelease,
} from '../../edit-architecture/canonical-professional-tool-gpu-dispatch-admission'
import {
  CANONICAL_SAM3_1_OPERATION_ID,
} from '../../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import type {
  CanonicalSkillQualificationRegistry,
} from '../../orchestra/canonical-skill-qualification-registry'
import {
  createSkillQualificationSnapshot,
  orchestraDigest,
  orchestraEvidenceRef,
  parseSkillCapabilityManifest,
  parseSkillQualificationSnapshot,
} from '../../orchestra/orchestra-skill-capability-contract'
import type {
  CanonicalCurrentGoogleCloudGpuRateAuthorityRepository,
} from '../../services/canonical-current-google-cloud-gpu-rate-authority-repository'
import type {
  CanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityRepository,
} from '../../services/canonical-current-google-cloud-vertex-a100-serving-rate-authority-repository'
import {
  assertPlainSerializedData,
} from '../../services/canonical-professional-gpu-job-lifecycle-service'
import type {
  CanonicalSam31GpuRuntimeReleaseRegistry,
} from '../../services/canonical-sam3_1-gpu-runtime-release-registry'
import {
  assertCanonicalSam31CurrentA100CustomerDispatchAllowed,
  type CanonicalSam31CurrentA100CustomerDispatchReadinessReadPort,
} from '../../services/canonical-sam3_1-current-a100-customer-dispatch-readiness'
import {
  assertCanonicalSam31PrivateInternalDispatchAllowed,
  type CanonicalSam31PrivateInternalDispatchReadinessReadPort,
} from '../../services/canonical-sam3_1-private-internal-dispatch-readiness-owner'
import {
  assertCanonicalSam31GpuRuntimeReleaseRegistryRecord,
  canonicalSam31GpuRuntimeReleaseRef,
} from '../../services/canonical-sam3_1-gpu-runtime-release-registry'
import {
  assertCanonicalTrackAllSam31ArtifactRepositoryRelease,
  canonicalTrackAllSam31ArtifactRepositoryReleaseRef,
  type CanonicalTrackAllSam31ArtifactRepositoryReleaseReadPort,
} from '../../services/canonical-track-all-sam3_1-artifact-repository-release'
import type {
  CanonicalTrackAllSam31L4TaskQaRuntimeReleaseEvidenceRepository,
} from '../../services/canonical-track-all-sam3_1-l4-task-qa-runtime-release-publisher'
import {
  assertCanonicalTrackAllSam31L4TaskQaDeploymentObservation,
  assertCanonicalTrackAllSam31L4TaskQaImageQualification,
  canonicalTrackAllSam31L4TaskQaImageQualificationRef,
} from '../../services/canonical-track-all-sam3_1-l4-task-qa-runtime-release-publisher'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../../services/private-edit-authority-store'
import {
  assertCanonicalCurrentGoogleCloudGpuRateAuthority,
} from '../../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'
import {
  assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2,
} from '../../tool-cost-metering/canonical-current-google-cloud-vertex-a100-serving-rate-authority'
import {
  CANONICAL_TRACK_ALL_SAM3_1_JOB_TYPE,
} from './canonical-track-all-sam3_1-orchestra-binding'
import {
  CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_OPERATION_ID,
} from './canonical-track-all-sam3_1-l4-task-qa-worker-contract'
import {
  createTrackAllSam31OrchestraCapabilityManifestForQualification,
  createTrackAllSam31OrchestraQualificationSnapshot,
  TRACK_ALL_SAM3_1_ORCHESTRA_ROUTE_IDS,
} from './track-all-sam3_1-orchestra-capability-manifest'

export const TRACK_ALL_SAM3_1_ORCHESTRA_QUALIFICATION_PUBLISHER_VERSION =
  'track-all-sam3_1-orchestra-qualification-publisher-v2' as const
export const TRACK_ALL_SAM3_1_ORCHESTRA_QUALIFICATION_PUBLICATION_RECEIPT_VERSION =
  'track-all-sam3_1-orchestra-qualification-publication-receipt-v2' as const
export const TRACK_ALL_SAM3_1_ORCHESTRA_PRIVATE_INTERNAL_QUALIFICATION_PUBLISHER_VERSION =
  'track-all-sam3_1-orchestra-private-internal-qualification-publisher-v1' as const
export const TRACK_ALL_SAM3_1_ORCHESTRA_PRIVATE_INTERNAL_QUALIFICATION_PUBLICATION_RECEIPT_VERSION =
  'track-all-sam3_1-orchestra-private-internal-qualification-publication-receipt-v1' as const

const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..'))
const timestamp = z.string().datetime({ offset: true })
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
const publicationInputSchema = z.object({
  a100RuntimeReleaseRef: refSchema,
  currentA100CustomerDispatchReadinessRef: refSchema,
  l4FallbackRuntimeReleaseRef: refSchema,
  a100RateAuthorityRef: refSchema,
  l4FallbackRateAuthorityRef: refSchema,
  l4TaskQaImageQualificationRef: refSchema,
  l4TaskQaRuntimeReleaseRef: refSchema,
  artifactRepositoryReleaseRef: refSchema,
  observedAt: timestamp,
}).strict()
const privateInternalPublicationInputSchema = z.object({
  a100RuntimeReleaseRef: refSchema,
  l4FallbackRuntimeReleaseRef: refSchema,
  privateInternalDispatchReadinessRef: refSchema,
  a100RateAuthorityRef: refSchema,
  l4FallbackRateAuthorityRef: refSchema,
  l4TaskQaImageQualificationRef: refSchema,
  l4TaskQaRuntimeReleaseRef: refSchema,
  artifactRepositoryReleaseRef: refSchema,
  observedAt: timestamp,
}).strict()

const receiptWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    TRACK_ALL_SAM3_1_ORCHESTRA_QUALIFICATION_PUBLICATION_RECEIPT_VERSION,
  ),
  publisherVersion: z.literal(
    TRACK_ALL_SAM3_1_ORCHESTRA_QUALIFICATION_PUBLISHER_VERSION,
  ),
  source: z.literal(
    'canonical_server_track_all_sam3_1_orchestra_qualification_publisher',
  ),
  evidenceClass: z.literal(
    'canonical_release_rate_endpoint_readiness_repository_exact_reread_create_only',
  ),
  manifestRef: refSchema,
  qualificationSnapshotRef: refSchema,
  observedReleaseRef: refSchema,
  registryRecordRef: refSchema,
  a100RuntimeReleaseRef: refSchema,
  currentA100CustomerDispatchReadinessRef: refSchema,
  l4FallbackRuntimeReleaseRef: refSchema,
  l4TaskQaImageQualificationRef: refSchema,
  l4TaskQaRuntimeReleaseRef: refSchema,
  a100RateAuthorityRef: refSchema,
  l4FallbackRateAuthorityRef: refSchema,
  l4TaskQaRateAuthorityRef: refSchema,
  artifactRepositoryReleaseRef: refSchema,
  disposition: z.enum(['created', 'identical_replay']),
  exactA100AndIndependentL4Sam31ReleaseReread: z.literal(true),
  exactCurrentA100EndpointReadinessAndCapacityReread: z.literal(true),
  exactL4TaskQaImageDeploymentAndScaleZeroReread: z.literal(true),
  exactBillingAccountEffectiveA100AndL4RateReread: z.literal(true),
  exactTrackAllResultAndArtifactRepositoryReleaseReread: z.literal(true),
  exactCanonicalManifestQualificationCreateOnlyReread: z.literal(true),
  callerCanSelfQualify: z.literal(false),
  gpuJobStarted: z.literal(false),
  providerOrModelExecuted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApprovalGranted: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  publishedAt: timestamp,
}).strict()
const receiptSchema = receiptWithoutHashSchema.extend({
  receiptHash: sha256,
}).strict()
const privateInternalReceiptWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    TRACK_ALL_SAM3_1_ORCHESTRA_PRIVATE_INTERNAL_QUALIFICATION_PUBLICATION_RECEIPT_VERSION,
  ),
  publisherVersion: z.literal(
    TRACK_ALL_SAM3_1_ORCHESTRA_PRIVATE_INTERNAL_QUALIFICATION_PUBLISHER_VERSION,
  ),
  source: z.literal(
    'canonical_server_track_all_sam3_1_orchestra_private_internal_qualification_publisher',
  ),
  evidenceClass: z.literal(
    'canonical_private_internal_release_rate_readiness_repository_exact_reread_create_only',
  ),
  manifestRef: refSchema,
  qualificationSnapshotRef: refSchema,
  observedReleaseRef: refSchema,
  registryRecordRef: refSchema,
  a100RuntimeReleaseRef: refSchema,
  l4FallbackRuntimeReleaseRef: refSchema,
  privateInternalDispatchReadinessRef: refSchema,
  l4TaskQaImageQualificationRef: refSchema,
  l4TaskQaRuntimeReleaseRef: refSchema,
  a100RateAuthorityRef: refSchema,
  l4FallbackRateAuthorityRef: refSchema,
  l4TaskQaRateAuthorityRef: refSchema,
  artifactRepositoryReleaseRef: refSchema,
  disposition: z.enum(['created', 'identical_replay']),
  exactA100AndIndependentL4Sam31ReleaseReread: z.literal(true),
  exactPrivateInternalSequentialDispatchReadinessReread: z.literal(true),
  exactL4TaskQaImageDeploymentAndScaleZeroReread: z.literal(true),
  exactBillingAccountEffectiveA100AndL4RateReread: z.literal(true),
  exactTrackAllResultAndArtifactRepositoryReleaseReread: z.literal(true),
  exactCanonicalManifestQualificationCreateOnlyReread: z.literal(true),
  maximumSimultaneousPrivateA100Attempts: z.literal(1),
  maximumSimultaneousPrivateL4Attempts: z.literal(1),
  qualificationAttemptsMustRunSequentially: z.literal(true),
  minimumIdleGpuInstances: z.literal(0),
  userTriggeredScaleFromZeroRequired: z.literal(true),
  publicConcurrencyCapacityRequired: z.literal(false),
  publicConcurrencyA100Target: z.literal(16),
  publicConcurrencyL4Target: z.literal(16),
  productionConcurrencyIsSeparateFutureReleaseGate: z.literal(true),
  customerOrPublicDispatchAuthorized: z.literal(false),
  callerCanSelfQualify: z.literal(false),
  gpuJobStarted: z.literal(false),
  providerOrModelExecuted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApprovalGranted: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  publishedAt: timestamp,
}).strict()
const privateInternalReceiptSchema = privateInternalReceiptWithoutHashSchema
  .extend({ receiptHash: sha256 }).strict()

export type TrackAllSam31OrchestraQualificationPublicationReceipt = z.infer<
  typeof receiptSchema
>
export type TrackAllSam31OrchestraPrivateInternalQualificationPublicationReceipt =
  z.infer<typeof privateInternalReceiptSchema>

type RuntimeReleaseReadPort = Pick<
  CanonicalSam31GpuRuntimeReleaseRegistry,
  'schemaVersion' | 'evidenceClass' | 'rereadReleasePair'
>
type L4TaskQaReleaseReadPort = Pick<
  CanonicalTrackAllSam31L4TaskQaRuntimeReleaseEvidenceRepository,
  'schemaVersion' | 'rereadImageQualification' |
    'rereadDeploymentObservation'
>
type RateAuthorityReadPort = Pick<
  CanonicalCurrentGoogleCloudGpuRateAuthorityRepository,
  'schemaVersion' | 'evidenceClass' | 'rereadApprovedCurrentRate'
>
type A100ServingRateAuthorityReadPort = Pick<
  CanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityRepository,
  'reread'
>
type CurrentA100ReadinessReadPort = Pick<
  CanonicalSam31CurrentA100CustomerDispatchReadinessReadPort,
  'rereadCurrent'
> & {
  rereadExact(input: {
    readonly readinessRef: z.infer<typeof refSchema>
    readonly at: string
  }): Promise<unknown | null>
}
type PrivateInternalDispatchReadinessReadPort = Pick<
  CanonicalSam31PrivateInternalDispatchReadinessReadPort,
  'schemaVersion' | 'privateInternalOnly' |
    'customerOrPublicDispatchAuthorized' | 'rereadCurrent'
>

export interface TrackAllSam31OrchestraQualificationPublisherDependencies {
  readonly runtimeReleaseRegistry: RuntimeReleaseReadPort
  readonly l4TaskQaReleaseRepository: L4TaskQaReleaseReadPort
  readonly rateAuthorityRepository: RateAuthorityReadPort
  readonly a100ServingRateAuthorityRepository:
    A100ServingRateAuthorityReadPort
  readonly currentA100ReadinessRepository: CurrentA100ReadinessReadPort
  readonly artifactRepositoryReleaseReadPort:
    CanonicalTrackAllSam31ArtifactRepositoryReleaseReadPort
  readonly qualificationRegistry: CanonicalSkillQualificationRegistry
}

export interface TrackAllSam31OrchestraPrivateInternalQualificationPublisherDependencies
  extends Omit<TrackAllSam31OrchestraQualificationPublisherDependencies,
    'currentA100ReadinessRepository'> {
  readonly privateInternalDispatchReadinessReadPort:
    PrivateInternalDispatchReadinessReadPort
}

export async function publishTrackAllSam31OrchestraQualification(
  untrusted: unknown,
  dependencies: TrackAllSam31OrchestraQualificationPublisherDependencies,
): Promise<TrackAllSam31OrchestraQualificationPublicationReceipt> {
  assertDependencies(dependencies)
  assertPlainSerializedData(untrusted, 'track_all_qualification_publication')
  const request = publicationInputSchema.parse(untrusted)

  const a100Record = assertCanonicalSam31GpuRuntimeReleaseRegistryRecord(
    await dependencies.runtimeReleaseRegistry.rereadReleasePair({
      runtimeReleaseRef: request.a100RuntimeReleaseRef,
    }),
  )
  const l4Record = assertCanonicalSam31GpuRuntimeReleaseRegistryRecord(
    await dependencies.runtimeReleaseRegistry.rereadReleasePair({
      runtimeReleaseRef: request.l4FallbackRuntimeReleaseRef,
    }),
  )
  const a100 = assertCanonicalProfessionalToolGpuRuntimeRelease(
    a100Record.runtimeRelease,
    request.observedAt,
  )
  const l4 = assertCanonicalProfessionalToolGpuRuntimeRelease(
    l4Record.runtimeRelease,
    request.observedAt,
  )
  assertExactSam31RuntimePair({
    a100,
    a100Record,
    a100Ref: request.a100RuntimeReleaseRef,
    l4,
    l4Record,
    l4Ref: request.l4FallbackRuntimeReleaseRef,
  })

  const l4TaskQaImage =
    assertCanonicalTrackAllSam31L4TaskQaImageQualification(
      await dependencies.l4TaskQaReleaseRepository
        .rereadImageQualification({
          imageQualificationRef: request.l4TaskQaImageQualificationRef,
        }),
    )
  const l4TaskQaDeployment =
    assertCanonicalTrackAllSam31L4TaskQaDeploymentObservation(
      await dependencies.l4TaskQaReleaseRepository
        .rereadDeploymentObservation({
          runtimeReleaseRef: request.l4TaskQaRuntimeReleaseRef,
        }),
    )
  assertExactL4TaskQaRelease({
    image: l4TaskQaImage,
    imageRef: request.l4TaskQaImageQualificationRef,
    deployment: l4TaskQaDeployment,
    runtimeRef: request.l4TaskQaRuntimeReleaseRef,
    at: request.observedAt,
  })

  const a100Rate =
    assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2(
      await dependencies.a100ServingRateAuthorityRepository.reread({
      rateAuthorityRef: request.a100RateAuthorityRef,
      at: request.observedAt,
      }),
      request.observedAt,
    )
  const currentA100Readiness =
    assertCanonicalSam31CurrentA100CustomerDispatchAllowed({
      readiness: await dependencies.currentA100ReadinessRepository
        .rereadExact({
          readinessRef: request.currentA100CustomerDispatchReadinessRef,
          at: request.observedAt,
        }),
      runtimeReleaseRef: request.a100RuntimeReleaseRef,
      rateAuthorityRef: request.a100RateAuthorityRef,
      immutableImageDigest: a100.immutableImageDigest,
      at: request.observedAt,
    })
  assertExactCurrentA100ServingQualification({
    rate: a100Rate,
    rateRef: request.a100RateAuthorityRef,
    readiness: currentA100Readiness,
    readinessRef: request.currentA100CustomerDispatchReadinessRef,
  })
  const l4FallbackRate = assertCanonicalCurrentGoogleCloudGpuRateAuthority(
    await dependencies.rateAuthorityRepository.rereadApprovedCurrentRate({
      rateAuthorityRef: request.l4FallbackRateAuthorityRef,
      routeId: 'l4_heavy_fallback',
      at: request.observedAt,
    }),
    request.observedAt,
  )
  const l4TaskQaRateRef = refSchema.parse(
    l4TaskQaImage.accountEffectiveL4RateCompatibilityRef,
  )
  const l4TaskQaRate = assertCanonicalCurrentGoogleCloudGpuRateAuthority(
    await dependencies.rateAuthorityRepository.rereadApprovedCurrentRate({
      rateAuthorityRef: l4TaskQaRateRef,
      routeId: 'l4_standard_primary',
      at: request.observedAt,
    }),
    request.observedAt,
  )
  assertExactL4Rates({
    l4FallbackRate,
    l4FallbackRef: request.l4FallbackRateAuthorityRef,
    l4TaskQaRate,
    l4TaskQaRef: l4TaskQaRateRef,
  })

  const artifactRepositoryRelease =
    assertCanonicalTrackAllSam31ArtifactRepositoryRelease(
      await dependencies.artifactRepositoryReleaseReadPort.readExact({
        releaseRef: request.artifactRepositoryReleaseRef,
      }),
      request.observedAt,
    )
  if (!sameRef(
    canonicalTrackAllSam31ArtifactRepositoryReleaseRef(
      artifactRepositoryRelease,
    ),
    request.artifactRepositoryReleaseRef,
  )) throw new Error('Track All artifact repository release ref changed.')

  const qualificationEvidenceRefs = sortRefs([
    request.a100RuntimeReleaseRef,
    request.currentA100CustomerDispatchReadinessRef,
    request.l4FallbackRuntimeReleaseRef,
    request.l4TaskQaImageQualificationRef,
    request.l4TaskQaRuntimeReleaseRef,
    request.a100RateAuthorityRef,
    request.l4FallbackRateAuthorityRef,
    l4TaskQaRateRef,
    request.artifactRepositoryReleaseRef,
  ])
  const observedReleaseRef = orchestraEvidenceRef(
    'track-all-sam3_1-qualified-release-set-v2',
    orchestraDigest({
      qualificationEvidenceRefs,
      exactA100AndIndependentL4Sam31ReleaseReread: true,
      exactCurrentA100EndpointReadinessAndCapacityReread: true,
      exactBillingAccountEffectiveA100AndL4RateReread: true,
      exactL4TaskQaImageDeploymentAndScaleZeroReread: true,
      exactTrackAllResultAndArtifactRepositoryReleaseReread: true,
      releaseSetVersion: 'track-all-sam3_1-qualified-release-set-v2',
    }),
  )
  const qualificationSnapshot = buildQualifiedSnapshot({
    observedAt: request.observedAt,
    observedReleaseRef,
    qualificationEvidenceRefs,
  })
  const manifest = createTrackAllSam31OrchestraCapabilityManifestForQualification(
    qualificationSnapshot,
  )
  const persisted = await dependencies.qualificationRegistry.persistCreateOnly({
    manifest,
    qualificationSnapshot,
  })
  const reread = await dependencies.qualificationRegistry.readExact({
    manifestRef: persisted.manifestRef,
    qualificationSnapshotRef: persisted.qualificationSnapshotRef,
  })
  if (!reread
    || stableAuthorityStringify(reread.manifest)
      !== stableAuthorityStringify(manifest)
    || stableAuthorityStringify(reread.qualificationSnapshot)
      !== stableAuthorityStringify(qualificationSnapshot)) {
    throw new Error('Track All canonical qualification reread failed.')
  }

  return createReceipt({
    request,
    persisted,
    l4TaskQaRateRef,
  })
}

export async function publishTrackAllSam31OrchestraPrivateInternalQualification(
  untrusted: unknown,
  dependencies:
    TrackAllSam31OrchestraPrivateInternalQualificationPublisherDependencies,
): Promise<TrackAllSam31OrchestraPrivateInternalQualificationPublicationReceipt> {
  assertPrivateInternalDependencies(dependencies)
  assertPlainSerializedData(untrusted,
    'track_all_private_internal_qualification_publication')
  const request = privateInternalPublicationInputSchema.parse(untrusted)
  const a100Record = assertCanonicalSam31GpuRuntimeReleaseRegistryRecord(
    await dependencies.runtimeReleaseRegistry.rereadReleasePair({
      runtimeReleaseRef: request.a100RuntimeReleaseRef,
    }),
  )
  const l4Record = assertCanonicalSam31GpuRuntimeReleaseRegistryRecord(
    await dependencies.runtimeReleaseRegistry.rereadReleasePair({
      runtimeReleaseRef: request.l4FallbackRuntimeReleaseRef,
    }),
  )
  const a100 = assertCanonicalProfessionalToolGpuRuntimeRelease(
    a100Record.runtimeRelease, request.observedAt,
  )
  const l4 = assertCanonicalProfessionalToolGpuRuntimeRelease(
    l4Record.runtimeRelease, request.observedAt,
  )
  assertExactSam31RuntimePair({ a100, a100Record,
    a100Ref: request.a100RuntimeReleaseRef, l4, l4Record,
    l4Ref: request.l4FallbackRuntimeReleaseRef })

  const a100Rate =
    assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2(
      await dependencies.a100ServingRateAuthorityRepository.reread({
        rateAuthorityRef: request.a100RateAuthorityRef,
        at: request.observedAt,
      }), request.observedAt,
    )
  assertExactPrivateInternalA100Rate({
    rate: a100Rate, rateRef: request.a100RateAuthorityRef,
  })
  const l4FallbackRate = assertCanonicalCurrentGoogleCloudGpuRateAuthority(
    await dependencies.rateAuthorityRepository.rereadApprovedCurrentRate({
      rateAuthorityRef: request.l4FallbackRateAuthorityRef,
      routeId: 'l4_heavy_fallback', at: request.observedAt,
    }), request.observedAt,
  )
  const a100PrivateReadiness =
    assertCanonicalSam31PrivateInternalDispatchAllowed({
      readiness: await dependencies.privateInternalDispatchReadinessReadPort
        .rereadCurrent({
          runtimeReleaseRef: request.a100RuntimeReleaseRef,
          rateAuthorityRef: request.a100RateAuthorityRef,
          at: request.observedAt,
        }),
      routeId: 'a100_80gb_heavy_primary',
      runtimeReleaseRef: request.a100RuntimeReleaseRef,
      rateAuthorityRef: request.a100RateAuthorityRef,
      immutableImageDigest: a100.immutableImageDigest,
      at: request.observedAt,
    })
  const l4PrivateReadiness =
    assertCanonicalSam31PrivateInternalDispatchAllowed({
      readiness: await dependencies.privateInternalDispatchReadinessReadPort
        .rereadCurrent({
          runtimeReleaseRef: request.l4FallbackRuntimeReleaseRef,
          rateAuthorityRef: request.l4FallbackRateAuthorityRef,
          at: request.observedAt,
        }),
      routeId: 'l4_heavy_fallback',
      runtimeReleaseRef: request.l4FallbackRuntimeReleaseRef,
      rateAuthorityRef: request.l4FallbackRateAuthorityRef,
      immutableImageDigest: l4.immutableImageDigest,
      at: request.observedAt,
    })
  assertExactPrivateInternalReadiness({
    a100Readiness: a100PrivateReadiness,
    l4Readiness: l4PrivateReadiness,
    readinessRef: request.privateInternalDispatchReadinessRef,
  })

  const l4TaskQaImage =
    assertCanonicalTrackAllSam31L4TaskQaImageQualification(
      await dependencies.l4TaskQaReleaseRepository.rereadImageQualification({
        imageQualificationRef: request.l4TaskQaImageQualificationRef,
      }),
    )
  const l4TaskQaDeployment =
    assertCanonicalTrackAllSam31L4TaskQaDeploymentObservation(
      await dependencies.l4TaskQaReleaseRepository
        .rereadDeploymentObservation({
          runtimeReleaseRef: request.l4TaskQaRuntimeReleaseRef,
        }),
    )
  assertExactL4TaskQaRelease({ image: l4TaskQaImage,
    imageRef: request.l4TaskQaImageQualificationRef,
    deployment: l4TaskQaDeployment,
    runtimeRef: request.l4TaskQaRuntimeReleaseRef, at: request.observedAt })
  const l4TaskQaRateRef = refSchema.parse(
    l4TaskQaImage.accountEffectiveL4RateCompatibilityRef,
  )
  const l4TaskQaRate = assertCanonicalCurrentGoogleCloudGpuRateAuthority(
    await dependencies.rateAuthorityRepository.rereadApprovedCurrentRate({
      rateAuthorityRef: l4TaskQaRateRef,
      routeId: 'l4_standard_primary', at: request.observedAt,
    }), request.observedAt,
  )
  assertExactL4Rates({ l4FallbackRate,
    l4FallbackRef: request.l4FallbackRateAuthorityRef,
    l4TaskQaRate, l4TaskQaRef: l4TaskQaRateRef })
  const artifactRepositoryRelease =
    assertCanonicalTrackAllSam31ArtifactRepositoryRelease(
      await dependencies.artifactRepositoryReleaseReadPort.readExact({
        releaseRef: request.artifactRepositoryReleaseRef,
      }), request.observedAt,
    )
  if (!sameRef(canonicalTrackAllSam31ArtifactRepositoryReleaseRef(
    artifactRepositoryRelease), request.artifactRepositoryReleaseRef)) {
    throw new Error('Track All artifact repository release ref changed.')
  }
  const qualificationEvidenceRefs = sortRefs([
    request.a100RuntimeReleaseRef, request.l4FallbackRuntimeReleaseRef,
    request.privateInternalDispatchReadinessRef,
    request.l4TaskQaImageQualificationRef,
    request.l4TaskQaRuntimeReleaseRef, request.a100RateAuthorityRef,
    request.l4FallbackRateAuthorityRef, l4TaskQaRateRef,
    request.artifactRepositoryReleaseRef,
  ])
  const observedReleaseRef = orchestraEvidenceRef(
    'track-all-sam3_1-private-internal-qualified-release-set-v1',
    orchestraDigest({
      qualificationEvidenceRefs,
      exactA100AndIndependentL4Sam31ReleaseReread: true,
      exactPrivateInternalSequentialDispatchReadinessReread: true,
      exactBillingAccountEffectiveA100AndL4RateReread: true,
      exactL4TaskQaImageDeploymentAndScaleZeroReread: true,
      exactTrackAllResultAndArtifactRepositoryReleaseReread: true,
      maximumSimultaneousPrivateA100Attempts: 1,
      maximumSimultaneousPrivateL4Attempts: 1,
      publicConcurrencyCapacityRequired: false,
      productionConcurrencyIsSeparateFutureReleaseGate: true,
      releaseSetVersion:
        'track-all-sam3_1-private-internal-qualified-release-set-v1',
    }),
  )
  const qualificationSnapshot = buildQualifiedSnapshot({
    observedAt: request.observedAt, observedReleaseRef,
    qualificationEvidenceRefs,
  })
  const manifest = createTrackAllSam31OrchestraCapabilityManifestForQualification(
    qualificationSnapshot,
  )
  const persisted = await dependencies.qualificationRegistry.persistCreateOnly({
    manifest, qualificationSnapshot,
  })
  const reread = await dependencies.qualificationRegistry.readExact({
    manifestRef: persisted.manifestRef,
    qualificationSnapshotRef: persisted.qualificationSnapshotRef,
  })
  if (!reread || stableAuthorityStringify(reread.manifest)
      !== stableAuthorityStringify(manifest)
    || stableAuthorityStringify(reread.qualificationSnapshot)
      !== stableAuthorityStringify(qualificationSnapshot)) {
    throw new Error('Track All private qualification reread failed.')
  }
  return createPrivateInternalReceipt({ request, persisted, l4TaskQaRateRef })
}

export function assertTrackAllSam31OrchestraQualificationPublicationReceipt(
  value: unknown,
): TrackAllSam31OrchestraQualificationPublicationReceipt {
  assertPlainSerializedData(value, 'track_all_qualification_receipt')
  const receipt = receiptSchema.parse(value)
  const { receiptHash, ...payload } = receipt
  if (receiptHash !== sha256AuthorityValue(payload)) {
    throw new Error('Track All qualification receipt hash is invalid.')
  }
  return structuredClone(receipt)
}

export function assertTrackAllSam31OrchestraPrivateInternalQualificationPublicationReceipt(
  value: unknown,
): TrackAllSam31OrchestraPrivateInternalQualificationPublicationReceipt {
  assertPlainSerializedData(value,
    'track_all_private_internal_qualification_receipt')
  const receipt = privateInternalReceiptSchema.parse(value)
  const { receiptHash, ...payload } = receipt
  if (receiptHash !== sha256AuthorityValue(payload)) {
    throw new Error('Track All private qualification receipt hash is invalid.')
  }
  return structuredClone(receipt)
}

function buildQualifiedSnapshot(input: {
  observedAt: string
  observedReleaseRef: OrchestraEvidenceRef
  qualificationEvidenceRefs: OrchestraEvidenceRef[]
}): SkillQualificationSnapshot {
  const candidate = createTrackAllSam31OrchestraQualificationSnapshot()
  return createSkillQualificationSnapshot({
    schemaVersion: ORCHESTRA_SKILL_QUALIFICATION_SNAPSHOT_VERSION,
    snapshotId: candidate.snapshotId,
    skillKey: candidate.skillKey,
    skillVersion: candidate.skillVersion,
    contractVersion: candidate.contractVersion,
    capabilityDefinitionDigestSha256:
      candidate.capabilityDefinitionDigestSha256,
    observedReleaseRef: input.observedReleaseRef,
    observedAt: input.observedAt,
    overall: 'qualified',
    jobQualifications: [{
      jobType: CANONICAL_TRACK_ALL_SAM3_1_JOB_TYPE,
      status: 'qualified',
      blockerCodes: [],
      qualifiedRouteIds: Object.values(
        TRACK_ALL_SAM3_1_ORCHESTRA_ROUTE_IDS,
      ).sort(compareUtf16),
      qualificationEvidenceRefs: input.qualificationEvidenceRefs,
    }],
    callerCanSelfQualify: false,
    qualificationOwner: 'canonical_skill_qualification_registry',
    dispatchAuthorityGranted: false,
    providerAuthorityGranted: false,
    billingAuthorityGranted: false,
    publicDeliveryAuthorityGranted: false,
    productionAuthorityGranted: false,
  })
}

function createReceipt(input: {
  request: z.infer<typeof publicationInputSchema>
  l4TaskQaRateRef: z.infer<typeof refSchema>
  persisted: Awaited<ReturnType<
    CanonicalSkillQualificationRegistry['persistCreateOnly']
  >>
}): TrackAllSam31OrchestraQualificationPublicationReceipt {
  const payload = receiptWithoutHashSchema.parse({
    schemaVersion:
      TRACK_ALL_SAM3_1_ORCHESTRA_QUALIFICATION_PUBLICATION_RECEIPT_VERSION,
    publisherVersion:
      TRACK_ALL_SAM3_1_ORCHESTRA_QUALIFICATION_PUBLISHER_VERSION,
    source:
      'canonical_server_track_all_sam3_1_orchestra_qualification_publisher',
    evidenceClass:
      'canonical_release_rate_endpoint_readiness_repository_exact_reread_create_only',
    manifestRef: input.persisted.manifestRef,
    qualificationSnapshotRef: input.persisted.qualificationSnapshotRef,
    observedReleaseRef: input.persisted.observedReleaseRef,
    registryRecordRef: input.persisted.registryRecordRef,
    a100RuntimeReleaseRef: input.request.a100RuntimeReleaseRef,
    currentA100CustomerDispatchReadinessRef:
      input.request.currentA100CustomerDispatchReadinessRef,
    l4FallbackRuntimeReleaseRef: input.request.l4FallbackRuntimeReleaseRef,
    l4TaskQaImageQualificationRef:
      input.request.l4TaskQaImageQualificationRef,
    l4TaskQaRuntimeReleaseRef: input.request.l4TaskQaRuntimeReleaseRef,
    a100RateAuthorityRef: input.request.a100RateAuthorityRef,
    l4FallbackRateAuthorityRef: input.request.l4FallbackRateAuthorityRef,
    l4TaskQaRateAuthorityRef: input.l4TaskQaRateRef,
    artifactRepositoryReleaseRef:
      input.request.artifactRepositoryReleaseRef,
    disposition: input.persisted.disposition,
    exactA100AndIndependentL4Sam31ReleaseReread: true,
    exactCurrentA100EndpointReadinessAndCapacityReread: true,
    exactL4TaskQaImageDeploymentAndScaleZeroReread: true,
    exactBillingAccountEffectiveA100AndL4RateReread: true,
    exactTrackAllResultAndArtifactRepositoryReleaseReread: true,
    exactCanonicalManifestQualificationCreateOnlyReread: true,
    callerCanSelfQualify: false,
    gpuJobStarted: false,
    providerOrModelExecuted: false,
    customerCreditsMutated: false,
    qaApprovalGranted: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    publishedAt: input.request.observedAt,
  })
  return receiptSchema.parse({
    ...payload,
    receiptHash: sha256AuthorityValue(payload),
  })
}

function createPrivateInternalReceipt(input: {
  request: z.infer<typeof privateInternalPublicationInputSchema>
  l4TaskQaRateRef: z.infer<typeof refSchema>
  persisted: Awaited<ReturnType<
    CanonicalSkillQualificationRegistry['persistCreateOnly']
  >>
}): TrackAllSam31OrchestraPrivateInternalQualificationPublicationReceipt {
  const payload = privateInternalReceiptWithoutHashSchema.parse({
    schemaVersion:
      TRACK_ALL_SAM3_1_ORCHESTRA_PRIVATE_INTERNAL_QUALIFICATION_PUBLICATION_RECEIPT_VERSION,
    publisherVersion:
      TRACK_ALL_SAM3_1_ORCHESTRA_PRIVATE_INTERNAL_QUALIFICATION_PUBLISHER_VERSION,
    source:
      'canonical_server_track_all_sam3_1_orchestra_private_internal_qualification_publisher',
    evidenceClass:
      'canonical_private_internal_release_rate_readiness_repository_exact_reread_create_only',
    manifestRef: input.persisted.manifestRef,
    qualificationSnapshotRef: input.persisted.qualificationSnapshotRef,
    observedReleaseRef: input.persisted.observedReleaseRef,
    registryRecordRef: input.persisted.registryRecordRef,
    a100RuntimeReleaseRef: input.request.a100RuntimeReleaseRef,
    l4FallbackRuntimeReleaseRef: input.request.l4FallbackRuntimeReleaseRef,
    privateInternalDispatchReadinessRef:
      input.request.privateInternalDispatchReadinessRef,
    l4TaskQaImageQualificationRef:
      input.request.l4TaskQaImageQualificationRef,
    l4TaskQaRuntimeReleaseRef: input.request.l4TaskQaRuntimeReleaseRef,
    a100RateAuthorityRef: input.request.a100RateAuthorityRef,
    l4FallbackRateAuthorityRef: input.request.l4FallbackRateAuthorityRef,
    l4TaskQaRateAuthorityRef: input.l4TaskQaRateRef,
    artifactRepositoryReleaseRef: input.request.artifactRepositoryReleaseRef,
    disposition: input.persisted.disposition,
    exactA100AndIndependentL4Sam31ReleaseReread: true,
    exactPrivateInternalSequentialDispatchReadinessReread: true,
    exactL4TaskQaImageDeploymentAndScaleZeroReread: true,
    exactBillingAccountEffectiveA100AndL4RateReread: true,
    exactTrackAllResultAndArtifactRepositoryReleaseReread: true,
    exactCanonicalManifestQualificationCreateOnlyReread: true,
    maximumSimultaneousPrivateA100Attempts: 1,
    maximumSimultaneousPrivateL4Attempts: 1,
    qualificationAttemptsMustRunSequentially: true,
    minimumIdleGpuInstances: 0,
    userTriggeredScaleFromZeroRequired: true,
    publicConcurrencyCapacityRequired: false,
    publicConcurrencyA100Target: 16,
    publicConcurrencyL4Target: 16,
    productionConcurrencyIsSeparateFutureReleaseGate: true,
    customerOrPublicDispatchAuthorized: false,
    callerCanSelfQualify: false,
    gpuJobStarted: false,
    providerOrModelExecuted: false,
    customerCreditsMutated: false,
    qaApprovalGranted: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    publishedAt: input.request.observedAt,
  })
  return privateInternalReceiptSchema.parse({
    ...payload, receiptHash: sha256AuthorityValue(payload),
  })
}

function assertExactSam31RuntimePair(input: {
  a100: ReturnType<typeof assertCanonicalProfessionalToolGpuRuntimeRelease>
  l4: ReturnType<typeof assertCanonicalProfessionalToolGpuRuntimeRelease>
  a100Record: ReturnType<
    typeof assertCanonicalSam31GpuRuntimeReleaseRegistryRecord
  >
  l4Record: ReturnType<
    typeof assertCanonicalSam31GpuRuntimeReleaseRegistryRecord
  >
  a100Ref: z.infer<typeof refSchema>
  l4Ref: z.infer<typeof refSchema>
}): void {
  if (
    input.a100.toolId !== 'sam3_1'
    || input.l4.toolId !== 'sam3_1'
    || input.a100.operationId !== CANONICAL_SAM3_1_OPERATION_ID
    || input.l4.operationId !== CANONICAL_SAM3_1_OPERATION_ID
    || input.a100.routeId !== 'a100_80gb_heavy_primary'
    || input.a100.accelerator !== 'nvidia_a100_80gb'
    || input.l4.routeId !== 'l4_heavy_fallback'
    || input.l4.accelerator !== 'nvidia_l4'
    || !sameRef(
      canonicalSam31GpuRuntimeReleaseRef(input.a100), input.a100Ref,
    )
    || !sameRef(
      canonicalSam31GpuRuntimeReleaseRef(input.l4), input.l4Ref,
    )
    || sameRef(input.a100Ref, input.l4Ref)
    || !sameRef(
      input.a100.toolOrModelArtifactReleaseRef,
      input.l4.toolOrModelArtifactReleaseRef,
    )
    || input.a100Record.specializedRelease.checkpoint.repositoryRevision
      !== input.l4Record.specializedRelease.checkpoint.repositoryRevision
    || input.a100Record.specializedRelease.checkpoint.sha256
      !== input.l4Record.specializedRelease.checkpoint.sha256
    || input.a100.minimumIdleInstances !== 0
    || input.l4.minimumIdleInstances !== 0
    || input.a100.cpuOnlySubstantiveExecutionObserved
    || input.l4.cpuOnlySubstantiveExecutionObserved
    || !input.l4Record.specializedRelease.qualification
      .qualityEqualToOrBetterThanApprovedA100Baseline
  ) throw new Error('Track All A100/L4 SAM 3.1 release pair is not exact.')
}

function assertExactL4TaskQaRelease(input: {
  image: ReturnType<
    typeof assertCanonicalTrackAllSam31L4TaskQaImageQualification
  >
  deployment: ReturnType<
    typeof assertCanonicalTrackAllSam31L4TaskQaDeploymentObservation
  >
  imageRef: z.infer<typeof refSchema>
  runtimeRef: z.infer<typeof refSchema>
  at: string
}): void {
  if (
    !sameRef(
      canonicalTrackAllSam31L4TaskQaImageQualificationRef(input.image),
      input.imageRef,
    )
    || !sameRef(input.deployment.imageQualificationRef, input.imageRef)
    || !sameRef(input.deployment.release.releaseRef, input.runtimeRef)
    || input.image.operationId !==
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_OPERATION_ID
    || input.deployment.release.operationId !==
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_OPERATION_ID
    || input.deployment.release.routeId !== 'l4_standard_primary'
    || input.deployment.release.accelerator !== 'nvidia_l4'
    || input.deployment.release.minimumIdleInstances !== 0
    || input.deployment.release.configuredMinimumInstances !== 0
    || input.image.cpuOnlySubstantiveMaskQaAllowed
    || Date.parse(input.at) < Date.parse(input.image.qualifiedAt)
    || Date.parse(input.at) < Date.parse(input.deployment.observedAt)
    || Date.parse(input.at) >= Date.parse(input.image.expiresAt)
  ) throw new Error('Track All L4 task-QA release is not exact or current.')
}

function assertExactCurrentA100ServingQualification(input: {
  rate: ReturnType<
    typeof assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2
  >
  rateRef: z.infer<typeof refSchema>
  readiness: ReturnType<
    typeof assertCanonicalSam31CurrentA100CustomerDispatchAllowed
  >
  readinessRef: z.infer<typeof refSchema>
}): void {
  const readinessRef = {
    id: input.readiness.readinessId,
    version: 1,
    contentHash: `sha256:${input.readiness.readinessHash}` as const,
  }
  if (
    input.rate.executionTarget !==
      'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra'
    || input.rate.maximumReplicaCount !== 16
    || input.rate.maximumConcurrentInvocations !== 16
    || input.rate.minimumReplicaCount !== 0
    || !input.rate.exactCurrentEndpointCapacityReread
    || !input.rate.perReplicaPricingNotMultipliedByConfiguredMaximum
    || !sameRateRef(input.rate, input.rateRef)
    || !sameRef(readinessRef, input.readinessRef)
    || !sameRef(
      input.rate.endpointCapacityObservationRef,
      input.readiness.endpointCapacityObservationRef,
    )
    || input.readiness.maximumReplicaCount !== 16
    || input.readiness.maximumConcurrentInvocations !== 16
    || input.rate.customerPricingOrServiceFeeAuthorityGranted
    || input.rate.walletOrCreditMutationAuthorityGranted
  ) throw new Error(
    'Track All current A100 endpoint readiness or serving rate is invalid.',
  )
}

function assertExactPrivateInternalA100Rate(input: {
  rate: ReturnType<
    typeof assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2
  >
  rateRef: z.infer<typeof refSchema>
}): void {
  if (input.rate.executionTarget !==
      'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra'
    || input.rate.minimumReplicaCount !== 0
    || !input.rate.perReplicaPricingNotMultipliedByConfiguredMaximum
    || !sameRateRef(input.rate, input.rateRef)
    || input.rate.customerPricingOrServiceFeeAuthorityGranted
    || input.rate.walletOrCreditMutationAuthorityGranted) {
    throw new Error('Track All private-internal A100 serving rate is invalid.')
  }
}

function assertExactPrivateInternalReadiness(input: {
  a100Readiness: ReturnType<
    typeof assertCanonicalSam31PrivateInternalDispatchAllowed
  >
  l4Readiness: ReturnType<
    typeof assertCanonicalSam31PrivateInternalDispatchAllowed
  >
  readinessRef: z.infer<typeof refSchema>
}): void {
  const exactRef = {
    id: input.a100Readiness.readinessId,
    version: 1,
    contentHash: `sha256:${input.a100Readiness.readinessHash}` as const,
  }
  if (input.a100Readiness.readinessHash !== input.l4Readiness.readinessHash
    || !sameRef(exactRef, input.readinessRef)
    || input.a100Readiness.maximumSimultaneousPrivateA100Attempts !== 1
    || input.a100Readiness.maximumSimultaneousPrivateL4Attempts !== 1
    || !input.a100Readiness.qualificationAttemptsMustRunSequentially
    || input.a100Readiness.minimumIdleGpuInstances !== 0
    || !input.a100Readiness.userTriggeredScaleFromZeroRequired
    || input.a100Readiness.publicConcurrencyCapacityRequired
    || !input.a100Readiness.productionConcurrencyIsSeparateFutureReleaseGate
    || input.a100Readiness.customerOrPublicDispatchAuthorized
    || input.l4Readiness.customerOrPublicDispatchAuthorized) {
    throw new Error('Track All private-internal dispatch readiness is not exact.')
  }
}

function assertExactL4Rates(input: {
  l4FallbackRate: ReturnType<
    typeof assertCanonicalCurrentGoogleCloudGpuRateAuthority
  >
  l4TaskQaRate: ReturnType<
    typeof assertCanonicalCurrentGoogleCloudGpuRateAuthority
  >
  l4FallbackRef: z.infer<typeof refSchema>
  l4TaskQaRef: z.infer<typeof refSchema>
}): void {
  if (
    input.l4FallbackRate.routeId !== 'l4_heavy_fallback'
    || input.l4TaskQaRate.routeId !== 'l4_standard_primary'
    || !sameRateRef(input.l4FallbackRate, input.l4FallbackRef)
    || !sameRateRef(input.l4TaskQaRate, input.l4TaskQaRef)
    || input.l4FallbackRate.customerPricingOrServiceFeeAuthorityGranted
    || input.l4TaskQaRate.customerPricingOrServiceFeeAuthorityGranted
    || input.l4FallbackRate.walletOrCreditMutationAuthorityGranted
    || input.l4TaskQaRate.walletOrCreditMutationAuthorityGranted
  ) throw new Error('Track All account-effective GPU rate set is invalid.')
}

function sameRateRef(
  authority: {
    readonly rateAuthorityId: string
    readonly rateAuthorityVersion: number
    readonly rateAuthorityHash: string
  },
  ref: z.infer<typeof refSchema>,
): boolean {
  return sameRef({
    id: authority.rateAuthorityId,
    version: authority.rateAuthorityVersion,
    contentHash: `sha256:${authority.rateAuthorityHash}`,
  }, ref)
}

function sortRefs(refs: z.infer<typeof refSchema>[]): OrchestraEvidenceRef[] {
  return refs.map((ref) => structuredClone(ref)).sort((left, right) =>
    compareUtf16(stableAuthorityStringify(left), stableAuthorityStringify(right)))
}

function sameRef(
  left: Pick<OrchestraEvidenceRef, 'id' | 'version' | 'contentHash'>,
  right: Pick<OrchestraEvidenceRef, 'id' | 'version' | 'contentHash'>,
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function compareUtf16(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function assertDependencies(
  dependencies: TrackAllSam31OrchestraQualificationPublisherDependencies,
): void {
  if (
    dependencies.runtimeReleaseRegistry?.schemaVersion !==
      'canonical-sam3_1-gpu-runtime-release-registry-v1'
    || dependencies.runtimeReleaseRegistry.evidenceClass !==
      'private_gcs_create_only_exact_reread'
    || typeof dependencies.runtimeReleaseRegistry.rereadReleasePair !==
      'function'
    || dependencies.l4TaskQaReleaseRepository?.schemaVersion !==
      'canonical-track-all-sam3_1-l4-task-qa-runtime-release-evidence-repository-v1'
    || typeof dependencies.l4TaskQaReleaseRepository
      .rereadImageQualification !== 'function'
    || typeof dependencies.l4TaskQaReleaseRepository
      .rereadDeploymentObservation !== 'function'
    || dependencies.rateAuthorityRepository?.schemaVersion !==
      'canonical-current-google-cloud-gpu-rate-authority-repository-v1'
    || dependencies.rateAuthorityRepository.evidenceClass !==
      'gcs_create_only_exact_reread_account_effective_gpu_rates'
    || typeof dependencies.rateAuthorityRepository
      .rereadApprovedCurrentRate !== 'function'
    || typeof dependencies.a100ServingRateAuthorityRepository?.reread !==
      'function'
    || typeof dependencies.currentA100ReadinessRepository?.rereadExact !==
      'function'
    || typeof dependencies.currentA100ReadinessRepository.rereadCurrent !==
      'function'
    || dependencies.artifactRepositoryReleaseReadPort?.schemaVersion !==
      'canonical-track-all-sam3_1-artifact-repository-release-repository-v1'
    || dependencies.artifactRepositoryReleaseReadPort.evidenceClass !==
      'private_create_only_exact_reread'
    || typeof dependencies.artifactRepositoryReleaseReadPort.readExact !==
      'function'
    || dependencies.qualificationRegistry?.schemaVersion !==
      'canonical-skill-qualification-registry-v1'
    || dependencies.qualificationRegistry.evidenceClass !==
      'private_create_only_exact_reread'
    || typeof dependencies.qualificationRegistry.persistCreateOnly !==
      'function'
    || typeof dependencies.qualificationRegistry.readExact !== 'function'
  ) throw new Error('Track All qualification publisher dependency is invalid.')
}

function assertPrivateInternalDependencies(
  dependencies:
    TrackAllSam31OrchestraPrivateInternalQualificationPublisherDependencies,
): void {
  assertDependencies({
    ...dependencies,
    currentA100ReadinessRepository: {
      async rereadCurrent() { return null },
      async rereadExact() { return null },
    },
  })
  if (dependencies.privateInternalDispatchReadinessReadPort?.schemaVersion !==
      'canonical-sam3_1-private-internal-dispatch-readiness-read-port-v1'
    || !dependencies.privateInternalDispatchReadinessReadPort.privateInternalOnly
    || dependencies.privateInternalDispatchReadinessReadPort
      .customerOrPublicDispatchAuthorized
    || typeof dependencies.privateInternalDispatchReadinessReadPort
      .rereadCurrent !== 'function') {
    throw new Error('Track All private-internal qualification dependency is invalid.')
  }
}

export function parsePublishedTrackAllSam31Qualification(input: {
  readonly manifest: unknown
  readonly qualificationSnapshot: unknown
}): Readonly<{
  manifest: SkillCapabilityManifest
  qualificationSnapshot: SkillQualificationSnapshot
}> {
  const qualificationSnapshot = parseSkillQualificationSnapshot(
    input.qualificationSnapshot,
  )
  const manifest = parseSkillCapabilityManifest({
    value: input.manifest,
    qualificationSnapshot,
  })
  if (manifest.skillKey !== 'track_all'
    || qualificationSnapshot.skillKey !== 'track_all'
    || qualificationSnapshot.overall !== 'qualified') {
    throw new Error('Published Track All qualification is not qualified.')
  }
  return Object.freeze({ manifest, qualificationSnapshot })
}
