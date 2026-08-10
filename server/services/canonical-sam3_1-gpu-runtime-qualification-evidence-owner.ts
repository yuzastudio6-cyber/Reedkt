import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  assertCanonicalSam31CloudImageSupplyChainRelease,
  type CanonicalSam31CloudImageSupplyChainRelease,
} from '../model-artifacts/canonical-sam3_1-cloud-image-supply-chain-release'
import {
  assertCanonicalSam31GpuRuntimeQualificationEvidence,
  canonicalSam31GpuRuntimeDeterministicRunSchema,
  canonicalSam31GpuRuntimeDriverEvidenceSchema,
  canonicalSam31GpuRuntimePerformanceEvidenceSchema,
  canonicalSam31GpuRuntimeQualityEvidenceSchema,
  canonicalSam31GpuRuntimeQualificationEvidenceDigest,
  canonicalSam31GpuRuntimeQualificationEvidenceRef,
  type CanonicalSam31GpuRuntimeQualificationEvidence,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-qualification-evidence'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  createCanonicalSam31ImageSupplyChainReleaseRepository,
} from './canonical-sam3_1-cloud-image-supply-chain-release-runtime'
import {
  assertCanonicalSam31GpuRuntimeQualificationComponentEvidence,
  canonicalSam31GpuRuntimeQualificationComponentRef,
  type CanonicalSam31GpuRuntimeQualificationComponentEvidence,
} from './canonical-sam3_1-gpu-runtime-qualification-compilation-authority'
import {
  createCanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository,
} from './canonical-sam3_1-gpu-runtime-qualification-component-evidence-repository'
import {
  createCanonicalSam31GpuRuntimeQualificationEvidenceRepository,
  type CanonicalSam31GpuRuntimeQualificationEvidenceRepository,
} from './canonical-sam3_1-gpu-runtime-qualification-evidence-repository'
import {
  assertCanonicalSam31QualifiedSourceCheckpointRelease,
  canonicalSam31SourceCheckpointQualificationReferenceSchema,
  createCanonicalSam31QualifiedSourceCheckpointReleaseObjectReadPort,
  projectCanonicalSam31QualifiedSourceCheckpointAuthority,
  type CanonicalSam31QualifiedSourceCheckpointRelease,
  type CanonicalSam31SourceCheckpointQualificationReference,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualified-authority'
import {
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_GPU_RUNTIME_QUALIFICATION_EVIDENCE_OWNER_VERSION =
  'canonical-sam3_1-gpu-runtime-qualification-evidence-owner-v1' as const

const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()
const sourceQualificationRefSchema =
  canonicalSam31SourceCheckpointQualificationReferenceSchema
export const canonicalSam31GpuRuntimeQualificationEvidenceOwnerRequestSchema =
z.object({
  candidateRef: z.object({
    schemaVersion: z.literal('canonical-sam3_1-source-runtime-candidate-v4'),
    candidateHash: sha256,
  }).strict(),
  privateArtifactIngestReceiptRef: refSchema,
  sourceCheckpointCompatibilityQualificationRef:
    sourceQualificationRefSchema,
  imageSupplyChainReleaseRef: refSchema,
  serviceIdentityRef: refSchema,
  immutableImageRef: refSchema,
  scaleToZeroConfigurationRef: refSchema,
  privateNetworkAndArtifactTransportRef: refSchema,
  componentEvidenceRefs: z.object({
    driverAndCudaRef: refSchema,
    deterministicRunSetRef: refSchema,
    eightMinutePerformanceRef: refSchema,
    independentTemporalQualityRef: refSchema,
  }).strict(),
}).strict()
const requestSchema =
  canonicalSam31GpuRuntimeQualificationEvidenceOwnerRequestSchema
type EvidenceRef = z.infer<typeof refSchema>
type OwnerRequest = z.infer<typeof requestSchema>

export interface CanonicalSam31GpuRuntimeQualificationEvidenceOwnerReadPort {
  rereadSourceCheckpointQualificationRelease(input: {
    readonly sourceCheckpointQualificationRef:
      CanonicalSam31SourceCheckpointQualificationReference
  }): Promise<unknown | null>
  rereadImageSupplyChainRelease(input: {
    readonly imageSupplyChainReleaseRef: EvidenceRef
  }): Promise<unknown | null>
  rereadComponentEvidence(input: {
    readonly componentEvidenceRef: EvidenceRef
  }): Promise<unknown | null>
}

export interface CanonicalSam31GpuRuntimeQualificationEvidenceOwner {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_GPU_RUNTIME_QUALIFICATION_EVIDENCE_OWNER_VERSION
  readonly evidenceClass:
    'canonical_upstream_and_four_component_exact_reread'
  compilePersistAndRereadQualificationEvidence(input: unknown): Promise<
    CanonicalSam31GpuRuntimeQualificationEvidence
  >
}

export function createCanonicalSam31GpuRuntimeQualificationEvidenceOwner(
  input: {
    readonly readPort:
      CanonicalSam31GpuRuntimeQualificationEvidenceOwnerReadPort
    readonly evidenceRepository:
      CanonicalSam31GpuRuntimeQualificationEvidenceRepository
    readonly now?: () => string
  },
): CanonicalSam31GpuRuntimeQualificationEvidenceOwner {
  assertDependencies(input)
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_GPU_RUNTIME_QUALIFICATION_EVIDENCE_OWNER_VERSION,
    evidenceClass:
      'canonical_upstream_and_four_component_exact_reread' as const,

    async compilePersistAndRereadQualificationEvidence(untrusted: unknown) {
      assertPlainSerializedData(untrusted, 'sam31_gpu_qualification_compile')
      const request = requestSchema.parse(untrusted)
      const [sourceValue, imageValue, driver, deterministic, performance,
        quality] = await Promise.all([
        input.readPort.rereadSourceCheckpointQualificationRelease({
          sourceCheckpointQualificationRef:
            request.sourceCheckpointCompatibilityQualificationRef,
        }),
        input.readPort.rereadImageSupplyChainRelease({
          imageSupplyChainReleaseRef: request.imageSupplyChainReleaseRef,
        }),
        rereadComponent(input.readPort, request.componentEvidenceRefs
          .driverAndCudaRef, 'driver_and_cuda'),
        rereadComponent(input.readPort, request.componentEvidenceRefs
          .deterministicRunSetRef, 'deterministic_run_set'),
        rereadComponent(input.readPort, request.componentEvidenceRefs
          .eightMinutePerformanceRef, 'eight_minute_performance'),
        rereadComponent(input.readPort, request.componentEvidenceRefs
          .independentTemporalQualityRef, 'independent_temporal_quality'),
      ])
      if (!sourceValue || !imageValue) {
        throw conflict('canonical_upstream_record_missing')
      }
      const sourceRelease =
        assertCanonicalSam31QualifiedSourceCheckpointRelease(
        sourceValue,
      )
      const imageRelease = assertCanonicalSam31CloudImageSupplyChainRelease(
        imageValue,
      )
      assertUpstreamLineage({ request, sourceRelease, imageRelease })
      const components = { driver, deterministic, performance, quality }
      const { qualificationId, route, immutableImageDigest } =
        assertComponentLineage(components)
      const qualifiedAt = z.string().datetime({ offset: true }).parse(now())
      for (const component of Object.values(components)) {
        if (Date.parse(component.recordedAt) > Date.parse(qualifiedAt)) {
          throw conflict('component_recorded_after_qualification')
        }
      }
      if (immutableImageDigest !== imageRelease.immutableImageDigest
        || !sameRef(request.immutableImageRef, imageRelease.immutableImageRef)) {
        throw conflict('qualified_image_lineage_mismatch')
      }
      const payload = {
        schemaVersion:
          'canonical-sam3_1-gpu-runtime-qualification-evidence-v1' as const,
        source:
          'canonical_server_sam3_1_gpu_runtime_qualification_owner' as const,
        evidenceClass: 'canonical_private_reread' as const,
        status: 'private_runtime_qualification_evidence_ready' as const,
        qualificationId,
        qualificationVersion: 1 as const,
        candidateRef: request.candidateRef,
        privateArtifactIngestReceiptRef:
          request.privateArtifactIngestReceiptRef,
        sourceCheckpointCompatibilityQualificationRef:
          request.sourceCheckpointCompatibilityQualificationRef,
        imageSupplyChainReleaseRef: request.imageSupplyChainReleaseRef,
        serviceIdentityRef: request.serviceIdentityRef,
        immutableImageRef: request.immutableImageRef,
        immutableImageDigest,
        scaleToZeroConfigurationRef: request.scaleToZeroConfigurationRef,
        privateNetworkAndArtifactTransportRef:
          request.privateNetworkAndArtifactTransportRef,
        route,
        driverEvidence: canonicalSam31GpuRuntimeDriverEvidenceSchema.parse(
          driver.payload,
        ),
        deterministicRuns: z.array(
          canonicalSam31GpuRuntimeDeterministicRunSchema,
        ).length(30).parse(deterministic.payload),
        performanceEvidence:
          canonicalSam31GpuRuntimePerformanceEvidenceSchema.parse(
            performance.payload,
          ),
        qualityEvidence: canonicalSam31GpuRuntimeQualityEvidenceSchema.parse(
          quality.payload,
        ),
        qualifiedAt,
        authority: {
          exactThirtyRunSetReread: true as const,
          exactEightMinutePerformanceSetReread: true as const,
          exactDriverAndCudaEvidenceReread: true as const,
          independentTemporalMaskQaReread: true as const,
          directCompleteIntervalReviewReread: true as const,
          privateRuntimeQualificationEvidenceReady: true as const,
          gpuJobDispatchAuthorized: false as const,
          customerCreditsMutated: false as const,
          qaApprovalGranted: false as const,
          publicDeliveryAuthorized: false as const,
          productionAuthorityGranted: false as const,
        },
      }
      const evidence =
        assertCanonicalSam31GpuRuntimeQualificationEvidence({
          ...payload,
          evidenceHash:
            canonicalSam31GpuRuntimeQualificationEvidenceDigest(payload),
        })
      const persistedRef = await input.evidenceRepository
        .persistQualifiedEvidenceCreateOnly({ evidence })
      const expectedRef =
        canonicalSam31GpuRuntimeQualificationEvidenceRef(evidence)
      if (!sameRef(persistedRef, expectedRef)) {
        throw conflict('qualification_persistence_reference_mismatch')
      }
      const reread = await input.evidenceRepository.rereadExact({
        qualificationEvidenceRef: expectedRef,
        candidateRef: request.candidateRef,
        privateArtifactIngestReceiptRef:
          request.privateArtifactIngestReceiptRef,
        sourceCheckpointCompatibilityQualificationRef:
          request.sourceCheckpointCompatibilityQualificationRef,
        imageSupplyChainReleaseRef: request.imageSupplyChainReleaseRef,
        serviceIdentityRef: request.serviceIdentityRef,
        immutableImageRef: request.immutableImageRef,
        immutableImageDigest,
        scaleToZeroConfigurationRef: request.scaleToZeroConfigurationRef,
        privateNetworkAndArtifactTransportRef:
          request.privateNetworkAndArtifactTransportRef,
        route,
      })
      if (!reread || !sameRef(
        canonicalSam31GpuRuntimeQualificationEvidenceRef(reread),
        expectedRef,
      )) throw conflict('qualification_exact_reread_failed')
      return reread
    },
  })
}

export function createCanonicalSam31GpuRuntimeQualificationEvidenceOwnerFromObjectPort(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly now?: () => string
  },
): CanonicalSam31GpuRuntimeQualificationEvidenceOwner {
  const sourceReleaseReadPort =
    createCanonicalSam31QualifiedSourceCheckpointReleaseObjectReadPort({
      objectPort: input.objectPort,
    })
  const imageRepository =
    createCanonicalSam31ImageSupplyChainReleaseRepository({
      objectPort: input.objectPort,
    })
  const componentRepository =
    createCanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository({
      objectPort: input.objectPort,
    })
  return createCanonicalSam31GpuRuntimeQualificationEvidenceOwner({
    readPort: {
      rereadSourceCheckpointQualificationRelease({
        sourceCheckpointQualificationRef,
      }) {
        return sourceReleaseReadPort.rereadQualificationRelease({
          sourceCheckpointQualificationRef,
        })
      },
      rereadImageSupplyChainRelease({ imageSupplyChainReleaseRef }) {
        return imageRepository.rereadQualifiedRelease({
          releaseRef: imageSupplyChainReleaseRef,
        })
      },
      rereadComponentEvidence({ componentEvidenceRef }) {
        return componentRepository.rereadComponentEvidence({
          componentEvidenceRef,
        })
      },
    },
    evidenceRepository:
      createCanonicalSam31GpuRuntimeQualificationEvidenceRepository({
        objectPort: input.objectPort,
      }),
    now: input.now,
  })
}

export function createCanonicalSam31GcpGpuRuntimeQualificationEvidenceOwner(
  input: { readonly storage?: Storage; readonly now?: () => string } = {},
): CanonicalSam31GpuRuntimeQualificationEvidenceOwner {
  // Immutable cloud resource IDs retain their established pre-rename names.
  return createCanonicalSam31GpuRuntimeQualificationEvidenceOwnerFromObjectPort({
    objectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage: input.storage ?? new Storage({ projectId: 'reeditpro' }),
      bucketName: 'reeditpro-production-reeditpro-control-plane-state',
    }),
    now: input.now,
  })
}

async function rereadComponent(
  port: CanonicalSam31GpuRuntimeQualificationEvidenceOwnerReadPort,
  ref: EvidenceRef,
  expectedKind: CanonicalSam31GpuRuntimeQualificationComponentEvidence[
    'componentKind'
  ],
): Promise<CanonicalSam31GpuRuntimeQualificationComponentEvidence> {
  const value = await port.rereadComponentEvidence({
    componentEvidenceRef: ref,
  })
  if (!value) throw conflict(`component_${expectedKind}_missing`)
  const component =
    assertCanonicalSam31GpuRuntimeQualificationComponentEvidence(value)
  if (component.componentKind !== expectedKind
    || !sameRef(canonicalSam31GpuRuntimeQualificationComponentRef(component),
      ref)) throw conflict(`component_${expectedKind}_ref_mismatch`)
  return component
}

function assertUpstreamLineage(input: {
  request: OwnerRequest
  sourceRelease: CanonicalSam31QualifiedSourceCheckpointRelease
  imageRelease: CanonicalSam31CloudImageSupplyChainRelease
}): void {
  const release = input.sourceRelease
  const image = input.imageRelease
  const source = projectCanonicalSam31QualifiedSourceCheckpointAuthority(
    release.qualification,
  )
  if (
    !sameRef(
      release.sourceCheckpointQualificationRef,
      input.request.sourceCheckpointCompatibilityQualificationRef,
    )
    || source.candidateRef.schemaVersion !==
      input.request.candidateRef.schemaVersion
    || source.candidateRef.candidateHash !==
      input.request.candidateRef.candidateHash
    || !sameRef(
      source.ingestReceiptRef,
      input.request.privateArtifactIngestReceiptRef,
    )
    || release.status !== 'qualified_for_private_image_build'
    || !release.sourceCheckpointQualificationGranted
    || image.evidenceClass !== 'canonical_private_reread'
    || image.status !== 'image_supply_chain_qualified'
    || !image.authority.imageSupplyChainQualified
    || image.releaseId !== input.request.imageSupplyChainReleaseRef.id
    || image.releaseVersion !== input.request.imageSupplyChainReleaseRef.version
    || input.request.imageSupplyChainReleaseRef.contentHash !==
      `sha256:${image.releaseHash}`
  ) throw conflict('canonical_upstream_lineage_mismatch')
}

function assertComponentLineage(components: {
  driver: CanonicalSam31GpuRuntimeQualificationComponentEvidence
  deterministic: CanonicalSam31GpuRuntimeQualificationComponentEvidence
  performance: CanonicalSam31GpuRuntimeQualificationComponentEvidence
  quality: CanonicalSam31GpuRuntimeQualificationComponentEvidence
}) {
  const values = Object.values(components)
  const first = values[0]
  for (const component of values.slice(1)) {
    if (component.qualificationId !== first.qualificationId
      || component.immutableImageDigest !== first.immutableImageDigest
      || stableAuthorityStringify(component.route) !==
        stableAuthorityStringify(first.route)) {
      throw conflict('qualification_component_lineage_mismatch')
    }
  }
  return {
    qualificationId: first.qualificationId,
    route: first.route,
    immutableImageDigest: first.immutableImageDigest,
  }
}

function assertDependencies(input: {
  readPort: CanonicalSam31GpuRuntimeQualificationEvidenceOwnerReadPort
  evidenceRepository: CanonicalSam31GpuRuntimeQualificationEvidenceRepository
}): void {
  if (
    typeof input.readPort?.rereadSourceCheckpointQualificationRelease !==
      'function'
    || typeof input.readPort?.rereadImageSupplyChainRelease !== 'function'
    || typeof input.readPort?.rereadComponentEvidence !== 'function'
    || typeof input.evidenceRepository?.persistQualifiedEvidenceCreateOnly !==
      'function'
    || typeof input.evidenceRepository?.rereadExact !== 'function'
  ) throw new Error('SAM 3.1 qualification evidence owner is invalid.')
}

function sameRef(
  left: { id: string; version: number; contentHash: string },
  right: { id: string; version: number; contentHash: string },
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function conflict(code: string): Error {
  return new Error(`SAM 3.1 qualification evidence conflict: ${code}`)
}
