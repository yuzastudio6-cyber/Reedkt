import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  assertCanonicalSam31PrivateArtifactIngestReceipt,
  type CanonicalSam31PrivateArtifactIngestReceipt,
} from '../model-artifacts/canonical-sam3_1-private-artifact-ingest'
import {
  createCanonicalSam31SourceRuntimeCandidate,
} from '../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import {
  assertCanonicalSam31CloudImageSupplyChainRelease,
  type CanonicalSam31CloudImageSupplyChainRelease,
} from '../model-artifacts/canonical-sam3_1-cloud-image-supply-chain-release'
import {
  assertCanonicalSam31QualifiedSourceCheckpointRelease,
  canonicalSam31QualifiedSourceCheckpointAuthorityRef,
  canonicalSam31SourceCheckpointQualificationReferenceSchema,
  createCanonicalSam31QualifiedSourceCheckpointReleaseObjectReadPort,
  projectCanonicalSam31QualifiedSourceCheckpointAuthority,
  type CanonicalSam31QualifiedSourceCheckpointRelease,
  type CanonicalSam31SourceCheckpointQualificationReference,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualified-authority'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  createCanonicalSam31GpuRuntimeQualificationCompilationAuthorityObjectReadPort,
} from './canonical-sam3_1-gpu-runtime-qualification-compilation-authority'
import {
  createCanonicalSam31GcpGpuRuntimeQualificationFinalizationOwner,
  type CanonicalSam31GpuRuntimeQualificationFinalizationOwner,
} from './canonical-sam3_1-gpu-runtime-qualification-finalization-owner'
import {
  createCanonicalSam31GpuRuntimeQualificationEvidenceRepository,
} from './canonical-sam3_1-gpu-runtime-qualification-evidence-repository'
import {
  canonicalSam31GpuRuntimeReleaseRef,
  createCanonicalSam31GpuRuntimeReleaseOwner,
  createCanonicalSam31GpuRuntimeReleaseRegistry,
  type CanonicalSam31GpuRuntimeReleaseOwner,
  type CanonicalSam31GpuRuntimeReleaseRegistryRecord,
} from './canonical-sam3_1-gpu-runtime-release-registry'
import {
  createCanonicalSam31ImageSupplyChainReleaseRepository,
} from './canonical-sam3_1-cloud-image-supply-chain-release-runtime'
import {
  createCanonicalSam31PrivateArtifactIngestRepository,
  type CanonicalSam31PrivateArtifactIngestRepository,
} from './canonical-sam3_1-private-artifact-ingest-repository'
import {
  sha256AuthorityValue,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_GPU_RUNTIME_RELEASE_PUBLICATION_COORDINATOR_VERSION =
  'canonical-sam3_1-gpu-runtime-release-publication-coordinator-v1' as const
export const CANONICAL_SAM3_1_GPU_RUNTIME_RELEASE_PUBLICATION_RECEIPT_VERSION =
  'canonical-sam3_1-gpu-runtime-release-publication-receipt-v1' as const

const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_STATE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const RELEASE_VALIDITY_MILLISECONDS = 30 * 24 * 60 * 60 * 1_000
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const refSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()
const sourceQualificationRefSchema =
  canonicalSam31SourceCheckpointQualificationReferenceSchema
const routeIdSchema = z.enum([
  'a100_80gb_heavy_primary',
  'l4_heavy_fallback',
])
const componentRefsSchema = z.object({
  driverAndCudaRef: refSchema,
  deterministicRunSetRef: refSchema,
  eightMinutePerformanceRef: refSchema,
  independentTemporalQualityRef: refSchema,
}).strict()
const requestSchema = z.object({
  routeId: routeIdSchema,
  sourceCheckpointQualificationRef: sourceQualificationRefSchema,
  imageSupplyChainReleaseRef: refSchema,
  serviceIdentityRef: refSchema,
  scaleToZeroConfigurationRef: refSchema,
  privateNetworkAndArtifactTransportRef: refSchema,
  componentEvidenceRefs: componentRefsSchema,
}).strict()
type PublicationRequest = z.infer<typeof requestSchema>
type EvidenceRef = z.infer<typeof refSchema>

const receiptWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_GPU_RUNTIME_RELEASE_PUBLICATION_RECEIPT_VERSION,
  ),
  coordinatorVersion: z.literal(
    CANONICAL_SAM3_1_GPU_RUNTIME_RELEASE_PUBLICATION_COORDINATOR_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_gpu_runtime_release_publication_coordinator',
  ),
  evidenceClass: z.literal(
    'canonical_upstream_component_finalization_and_release_exact_reread',
  ),
  disposition: z.literal('private_route_runtime_release_published'),
  routeId: routeIdSchema,
  sourceCheckpointQualificationRef: sourceQualificationRefSchema,
  imageSupplyChainReleaseRef: refSchema,
  qualificationEvidenceRef: refSchema,
  qualificationCompilationAuthorityRef: refSchema,
  runtimeReleaseRef: refSchema,
  qualifiedAt: timestamp,
  expiresAt: timestamp,
  exactSourceCheckpointIngestImageAndFourComponentsReread: z.literal(true),
  exactQualificationAndCompilationAuthorityFinalized: z.literal(true),
  exactSpecializedAndGenericRuntimeReleasePairPersisted: z.literal(true),
  callerReleaseIdExpiryRouteShapeOrQualificationBooleansAccepted:
    z.literal(false),
  gpuJobDispatched: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApprovalGranted: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const receiptSchema = receiptWithoutHashSchema.extend({
  receiptHash: sha256,
}).strict()
export type CanonicalSam31GpuRuntimeReleasePublicationReceipt = z.infer<
  typeof receiptSchema
>

export interface CanonicalSam31SourceQualificationReleaseReadPort {
  rereadQualificationRelease(input: {
    readonly sourceCheckpointQualificationRef:
      CanonicalSam31SourceCheckpointQualificationReference
  }): Promise<unknown | null>
}

export interface CanonicalSam31ImageSupplyChainReleaseReadPort {
  rereadQualifiedRelease(input: {
    readonly releaseRef: EvidenceRef
  }): Promise<unknown | null>
}

export interface CanonicalSam31GpuRuntimeReleasePublicationCoordinator {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_GPU_RUNTIME_RELEASE_PUBLICATION_COORDINATOR_VERSION
  readonly evidenceClass:
    'canonical_upstream_component_finalization_and_release_exact_reread'
  publish(input: unknown): Promise<Readonly<{
    receipt: CanonicalSam31GpuRuntimeReleasePublicationReceipt
    record: CanonicalSam31GpuRuntimeReleaseRegistryRecord
  }>>
}

export function createCanonicalSam31GpuRuntimeReleasePublicationCoordinator(
  input: {
    readonly sourceQualificationReadPort:
      CanonicalSam31SourceQualificationReleaseReadPort
    readonly ingestReadPort: Pick<
      CanonicalSam31PrivateArtifactIngestRepository,
      'rereadPrivateArtifactIngest'
    >
    readonly imageSupplyChainReadPort:
      CanonicalSam31ImageSupplyChainReleaseReadPort
    readonly finalizationOwner:
      CanonicalSam31GpuRuntimeQualificationFinalizationOwner
    readonly releaseOwner: CanonicalSam31GpuRuntimeReleaseOwner
    readonly qualificationEvidenceReadPort: Parameters<
      CanonicalSam31GpuRuntimeReleaseOwner['preparePersistAndReread']
    >[0]['qualificationEvidenceReadPort']
    readonly qualificationCompilationAuthorityReadPort: Parameters<
      CanonicalSam31GpuRuntimeReleaseOwner['preparePersistAndReread']
    >[0]['qualificationCompilationAuthorityReadPort']
  },
): CanonicalSam31GpuRuntimeReleasePublicationCoordinator {
  assertDependencies(input)
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_GPU_RUNTIME_RELEASE_PUBLICATION_COORDINATOR_VERSION,
    evidenceClass:
      'canonical_upstream_component_finalization_and_release_exact_reread' as const,

    async publish(untrusted: unknown) {
      assertPlainSerializedData(untrusted, 'sam31_gpu_release_publication')
      const request = requestSchema.parse(untrusted)
      const candidate = createCanonicalSam31SourceRuntimeCandidate()
      const sourceReleaseRaw = await input.sourceQualificationReadPort
        .rereadQualificationRelease({
          sourceCheckpointQualificationRef:
            request.sourceCheckpointQualificationRef,
        })
      if (!sourceReleaseRaw) throw conflict('source_release_missing')
      const sourceRelease =
        assertCanonicalSam31QualifiedSourceCheckpointRelease(
        sourceReleaseRaw,
      )
      assertSourceRelease(request, sourceRelease)
      const sourceQualification =
        projectCanonicalSam31QualifiedSourceCheckpointAuthority(
          sourceRelease.qualification,
        )
      const ingestRef = sourceQualification.ingestReceiptRef
      const [ingestRaw, imageRaw] = await Promise.all([
        input.ingestReadPort.rereadPrivateArtifactIngest({
          ingestReceiptRef: ingestRef,
        }),
        input.imageSupplyChainReadPort.rereadQualifiedRelease({
          releaseRef: request.imageSupplyChainReleaseRef,
        }),
      ])
      if (!ingestRaw || !imageRaw) {
        throw conflict('ingest_or_image_release_missing')
      }
      const ingest = assertCanonicalSam31PrivateArtifactIngestReceipt(
        ingestRaw,
      )
      const image = assertCanonicalSam31CloudImageSupplyChainRelease(imageRaw)
      assertUpstreamLineage({ request, candidate, sourceRelease, ingest, image })
      const authorityId = `sam31-${request.routeId}-qualification-${
        request.imageSupplyChainReleaseRef.contentHash.slice(7, 31)
      }`
      const finalized = await input.finalizationOwner.finalize({
        authorityId,
        evidenceRequest: {
          candidateRef: {
            schemaVersion: candidate.schemaVersion,
            candidateHash: candidate.candidateHash,
          },
          privateArtifactIngestReceiptRef: ingestRef,
          sourceCheckpointCompatibilityQualificationRef:
            request.sourceCheckpointQualificationRef,
          imageSupplyChainReleaseRef: request.imageSupplyChainReleaseRef,
          serviceIdentityRef: request.serviceIdentityRef,
          immutableImageRef: image.immutableImageRef,
          scaleToZeroConfigurationRef: request.scaleToZeroConfigurationRef,
          privateNetworkAndArtifactTransportRef:
            request.privateNetworkAndArtifactTransportRef,
          componentEvidenceRefs: request.componentEvidenceRefs,
        },
      })
      const evidence = finalized.evidence
      if (
        evidence.route.routeId !== request.routeId
        || !sameRef(evidence.imageSupplyChainReleaseRef,
          request.imageSupplyChainReleaseRef)
        || !sameRef(evidence.serviceIdentityRef, request.serviceIdentityRef)
        || !sameRef(evidence.immutableImageRef, image.immutableImageRef)
        || evidence.immutableImageDigest !== image.immutableImageDigest
        || !sameRef(evidence.scaleToZeroConfigurationRef,
          request.scaleToZeroConfigurationRef)
        || !sameRef(evidence.privateNetworkAndArtifactTransportRef,
          request.privateNetworkAndArtifactTransportRef)
      ) throw conflict('finalized_qualification_scope_mismatch')
      const expiresAt = new Date(
        Date.parse(evidence.qualifiedAt) + RELEASE_VALIDITY_MILLISECONDS,
      ).toISOString()
      const record = await input.releaseOwner.preparePersistAndReread({
        candidate,
        ingestReceipt: ingest,
        sourceCheckpointQualification: sourceRelease.qualification,
        imageSupplyChainRelease: image,
        release: {
          evidenceClass: 'canonical_private_reread',
          releaseId: `sam31-${request.routeId}-runtime-${
            evidence.evidenceHash.slice(0, 24)
          }`,
          releaseVersion: 1,
          route: releaseRoute(request.routeId),
          serviceIdentityRef: request.serviceIdentityRef,
          immutableImageRef: image.immutableImageRef,
          immutableImageDigest: image.immutableImageDigest,
          sourceAndDependencyClosureRef:
            image.sourceAndDependencyClosureRef,
          sbomRef: image.sbom.artifactRef,
          imageScanAndSignatureRef: request.imageSupplyChainReleaseRef,
          scaleToZeroConfigurationRef:
            request.scaleToZeroConfigurationRef,
          privateNetworkAndArtifactTransportRef:
            request.privateNetworkAndArtifactTransportRef,
          qualifiedAt: evidence.qualifiedAt,
          expiresAt,
        },
        qualificationEvidenceRef: finalized.evidenceRef,
        qualificationEvidenceReadPort:
          input.qualificationEvidenceReadPort,
        qualificationCompilationAuthorityRef:
          finalized.compilationAuthorityRef,
        qualificationCompilationAuthorityReadPort:
          input.qualificationCompilationAuthorityReadPort,
      })
      if (
        record.runtimeRelease.routeId !== request.routeId
        || record.runtimeRelease.qualifiedAt !== evidence.qualifiedAt
        || record.runtimeRelease.expiresAt !== expiresAt
        || !sameRef(record.runtimeRelease.serviceIdentityRef,
          request.serviceIdentityRef)
        || !sameRef(record.runtimeRelease.imageScanAndSignatureRef,
          request.imageSupplyChainReleaseRef)
      ) throw conflict('published_release_scope_mismatch')
      const receiptPayload = receiptWithoutHashSchema.parse({
        schemaVersion:
          CANONICAL_SAM3_1_GPU_RUNTIME_RELEASE_PUBLICATION_RECEIPT_VERSION,
        coordinatorVersion:
          CANONICAL_SAM3_1_GPU_RUNTIME_RELEASE_PUBLICATION_COORDINATOR_VERSION,
        source:
          'canonical_server_sam3_1_gpu_runtime_release_publication_coordinator',
        evidenceClass:
          'canonical_upstream_component_finalization_and_release_exact_reread',
        disposition: 'private_route_runtime_release_published',
        routeId: request.routeId,
        sourceCheckpointQualificationRef:
          request.sourceCheckpointQualificationRef,
        imageSupplyChainReleaseRef: request.imageSupplyChainReleaseRef,
        qualificationEvidenceRef: finalized.evidenceRef,
        qualificationCompilationAuthorityRef:
          finalized.compilationAuthorityRef,
        runtimeReleaseRef:
          canonicalSam31GpuRuntimeReleaseRef(record.runtimeRelease),
        qualifiedAt: evidence.qualifiedAt,
        expiresAt,
        exactSourceCheckpointIngestImageAndFourComponentsReread: true,
        exactQualificationAndCompilationAuthorityFinalized: true,
        exactSpecializedAndGenericRuntimeReleasePairPersisted: true,
        callerReleaseIdExpiryRouteShapeOrQualificationBooleansAccepted: false,
        gpuJobDispatched: false,
        customerCreditsMutated: false,
        qaApprovalGranted: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
      })
      const receipt = receiptSchema.parse({
        ...receiptPayload,
        receiptHash: sha256AuthorityValue(receiptPayload),
      })
      return Object.freeze({ receipt, record })
    },
  })
}

export function createCanonicalSam31GcpGpuRuntimeReleasePublicationCoordinator(
  input: { readonly storage?: Storage; readonly now?: () => string } = {},
): CanonicalSam31GpuRuntimeReleasePublicationCoordinator {
  const storage = input.storage ?? new Storage({ projectId: PROJECT_ID })
  const objectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
    storage,
    bucketName: CONTROL_PLANE_STATE_BUCKET,
  })
  const qualificationEvidenceReadPort =
    createCanonicalSam31GpuRuntimeQualificationEvidenceRepository({
      objectPort,
    })
  const qualificationCompilationAuthorityReadPort =
    createCanonicalSam31GpuRuntimeQualificationCompilationAuthorityObjectReadPort({
      objectPort,
    })
  return createCanonicalSam31GpuRuntimeReleasePublicationCoordinator({
    sourceQualificationReadPort:
      createCanonicalSam31QualifiedSourceCheckpointReleaseObjectReadPort({
        objectPort,
      }),
    ingestReadPort:
      createCanonicalSam31PrivateArtifactIngestRepository({ objectPort }),
    imageSupplyChainReadPort:
      createCanonicalSam31ImageSupplyChainReleaseRepository({ objectPort }),
    finalizationOwner:
      createCanonicalSam31GcpGpuRuntimeQualificationFinalizationOwner({
        storage,
        now: input.now,
      }),
    releaseOwner: createCanonicalSam31GpuRuntimeReleaseOwner({
      registry: createCanonicalSam31GpuRuntimeReleaseRegistry({ objectPort }),
      now: input.now,
    }),
    qualificationEvidenceReadPort,
    qualificationCompilationAuthorityReadPort,
  })
}

function assertDependencies(input: {
  sourceQualificationReadPort: CanonicalSam31SourceQualificationReleaseReadPort
  ingestReadPort: Pick<CanonicalSam31PrivateArtifactIngestRepository,
    'rereadPrivateArtifactIngest'>
  imageSupplyChainReadPort: CanonicalSam31ImageSupplyChainReleaseReadPort
  finalizationOwner: CanonicalSam31GpuRuntimeQualificationFinalizationOwner
  releaseOwner: CanonicalSam31GpuRuntimeReleaseOwner
  qualificationEvidenceReadPort: unknown
  qualificationCompilationAuthorityReadPort: unknown
}): void {
  const evidenceRead = input.qualificationEvidenceReadPort as {
    rereadExact?: unknown
    rereadQualifiedEvidence?: unknown
  }
  const authorityRead = input.qualificationCompilationAuthorityReadPort as {
    rereadQualificationCompilationAuthority?: unknown
  }
  if (
    typeof input.sourceQualificationReadPort?.rereadQualificationRelease !==
      'function'
    || typeof input.ingestReadPort?.rereadPrivateArtifactIngest !== 'function'
    || typeof input.imageSupplyChainReadPort?.rereadQualifiedRelease !==
      'function'
    || typeof input.finalizationOwner?.finalize !== 'function'
    || typeof input.releaseOwner?.preparePersistAndReread !== 'function'
    || typeof evidenceRead?.rereadExact !== 'function'
    || typeof evidenceRead?.rereadQualifiedEvidence !== 'function'
    || typeof authorityRead?.rereadQualificationCompilationAuthority !==
      'function'
  ) throw conflict('dependency_missing')
}

function assertSourceRelease(
  request: PublicationRequest,
  release: CanonicalSam31QualifiedSourceCheckpointRelease,
): void {
  if (
    release.status !== 'qualified_for_private_image_build'
    || !release.sourceCheckpointQualificationGranted
    || !sameQualificationRef(
      release.sourceCheckpointQualificationRef,
      request.sourceCheckpointQualificationRef,
    )
    || !sameQualificationRef(
      canonicalSam31QualifiedSourceCheckpointAuthorityRef(
        release.qualification,
      ),
      request.sourceCheckpointQualificationRef,
    )
  ) throw conflict('source_release_scope_mismatch')
}

function assertUpstreamLineage(input: {
  request: PublicationRequest
  candidate: ReturnType<typeof createCanonicalSam31SourceRuntimeCandidate>
  sourceRelease: CanonicalSam31QualifiedSourceCheckpointRelease
  ingest: CanonicalSam31PrivateArtifactIngestReceipt
  image: CanonicalSam31CloudImageSupplyChainRelease
}): void {
  const ingestRef = projectCanonicalSam31QualifiedSourceCheckpointAuthority(
    input.sourceRelease.qualification,
  ).ingestReceiptRef
  if (
    input.ingest.candidateRef.schemaVersion !== input.candidate.schemaVersion
    || input.ingest.candidateRef.candidateHash !== input.candidate.candidateHash
    || input.ingest.ingestReceiptId !== ingestRef.id
    || input.ingest.ingestReceiptVersion !== ingestRef.version
    || `sha256:${input.ingest.ingestReceiptHash}` !== ingestRef.contentHash
    || input.image.evidenceClass !== 'canonical_private_reread'
    || input.image.status !== 'image_supply_chain_qualified'
    || !input.image.authority.imageSupplyChainQualified
    || input.image.releaseId !== input.request.imageSupplyChainReleaseRef.id
    || input.image.releaseVersion !==
      input.request.imageSupplyChainReleaseRef.version
    || `sha256:${input.image.releaseHash}` !==
      input.request.imageSupplyChainReleaseRef.contentHash
  ) throw conflict('upstream_lineage_mismatch')
}

function releaseRoute(routeId: z.infer<typeof routeIdSchema>) {
  return routeId === 'a100_80gb_heavy_primary'
    ? {
        routeId,
        gpuProfileId:
          'quality_a100_80gb_user_triggered_heavy_job_v1' as const,
        runtimeRegion: 'us-central1' as const,
        executionTarget: 'google_cloud_vertex_custom_job_a2_ultra' as const,
        machineType: 'a2-ultragpu-1g' as const,
        accelerator: 'nvidia_a100_80gb' as const,
        allocatedVcpuCount: 12 as const,
        allocatedMemoryGiB: 170 as const,
        allocatedLocalScratchGiB: 0 as const,
      }
    : {
        routeId,
        gpuProfileId:
          'quality_l4_user_triggered_heavy_fallback_job_v1' as const,
        runtimeRegion: 'us-central1' as const,
        executionTarget: 'google_cloud_run_l4_job' as const,
        machineType: 'cloud_run_nvidia_l4' as const,
        accelerator: 'nvidia_l4' as const,
        allocatedVcpuCount: 8 as const,
        allocatedMemoryGiB: 32 as const,
        allocatedLocalScratchGiB: 0 as const,
      }
}

function sameQualificationRef(
  left: z.infer<typeof sourceQualificationRefSchema>,
  right: z.infer<typeof sourceQualificationRefSchema>,
): boolean {
  return left.schemaVersion === right.schemaVersion && sameRef(left, right)
}

function sameRef(
  left: { readonly id: string; readonly version: number; readonly contentHash: string },
  right: { readonly id: string; readonly version: number; readonly contentHash: string },
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function conflict(code: string): Error {
  return new Error(
    `SAM 3.1 GPU runtime release publication rejected ${code}.`,
  )
}
