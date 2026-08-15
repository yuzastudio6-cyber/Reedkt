import { createHash } from 'node:crypto'

import { Storage, type FileMetadata } from '@google-cloud/storage'
import { z } from 'zod'

import {
  assertCanonicalSam31VertexImageBuildBinding,
  createCanonicalSam31VertexImageBuildBinding,
  type CanonicalSam31VertexImageBuildBinding,
} from '../model-artifacts/canonical-sam3_1-vertex-production-build-binding'
import {
  createCanonicalSam31PrivateImageBuildCapsuleManifest,
  verifyCanonicalSam31PrivateBuildCapsuleBytes,
  type CanonicalSam31PrivateBuildCapsuleReadPort,
} from '../model-artifacts/canonical-sam3_1-cloud-image-build-authority'
import {
  assertCanonicalSam31PrivateArtifactIngestReceipt,
} from '../model-artifacts/canonical-sam3_1-private-artifact-ingest'
import {
  assertCanonicalSam31ProductionCapsuleBuilderResult,
  assertCanonicalSam31ProductionCapsuleCoordinate,
  assertCanonicalSam31ProductionCapsuleReproducibility,
  assertCanonicalSam31ProductionCapsuleSecurityReview,
  canonicalSam31ProductionCapsuleReproducibilityRef,
  canonicalSam31ProductionCapsuleStringify,
  createCanonicalSam31ProductionCapsuleReproducibility,
  type CanonicalSam31ProductionCapsuleBuilderResult,
  type CanonicalSam31ProductionCapsuleCoordinate,
  type CanonicalSam31ProductionCapsuleReproducibility,
  type CanonicalSam31ProductionCapsuleSecurityReview,
} from '../model-artifacts/canonical-sam3_1-production-capsule-build-evidence'
import {
  createCanonicalSam31SourceRuntimeCandidate,
} from '../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalSam31CloudImageBuildRepository,
  type CanonicalSam31CloudImageBuildRepository,
} from './canonical-sam3_1-cloud-image-build-runtime'
import {
  createCanonicalSam31GcpPrivateArtifactIngestRepository,
} from './canonical-sam3_1-private-artifact-ingest-repository'
import {
  createCanonicalSam31GcsProductionCapsuleReadPort,
} from './canonical-sam3_1-production-capsule-runtime'
import {
  CANONICAL_SAM3_1_VERTEX_COMPATIBILITY_QUALIFICATION_VERSION,
  assertCanonicalSam31VertexQualificationRelease,
  createCanonicalSam31VertexQualificationReleaseObjectReadPort,
  type CanonicalSam31VertexQualificationReleaseObjectReadPort,
} from './canonical-sam3_1-source-checkpoint-qualification-vertex-release-owner'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'

export const CANONICAL_SAM3_1_PRODUCTION_CAPSULE_PUBLISHER_VERSION =
  'canonical-sam3_1-production-capsule-publisher-v2' as const
export const CANONICAL_SAM3_1_PRODUCTION_CAPSULE_BUILD_READ_PORT_VERSION =
  'canonical-sam3_1-production-capsule-build-read-port-v2' as const
export const CANONICAL_SAM3_1_PRODUCTION_CAPSULE_REPOSITORY_VERSION =
  'canonical-sam3_1-production-capsule-repository-v2' as const

const PROJECT_ID = 'reeditpro' as const
const INPUT_BUCKET =
  'reeditpro-production-reeditpro-image-build-inputs' as const
const CONTROL_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const INPUT_PREFIX =
  'private/image-build-inputs/sam3_1/production/reproducibility' as const
const RECORD_PREFIX =
  'private/sam3_1/production-capsule-reproducibility/v2' as const
const MAXIMUM_JSON_BYTES = 16 * 1024 * 1024

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const buildIdSchema = z.string().uuid()
const refSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()
const qualificationRefSchema = refSchema.extend({
  version: z.literal(2),
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_COMPATIBILITY_QUALIFICATION_VERSION,
  ),
}).strict()
const requestSchema = z.object({
  sourceCheckpointQualificationRef: qualificationRefSchema,
  primaryBuildId: buildIdSchema,
  confirmationBuildId: buildIdSchema,
}).strict().superRefine((value, context) => {
  if (value.primaryBuildId === value.confirmationBuildId) context.addIssue({
    code: 'custom',
    message: 'Production capsule requires two independent builds.',
  })
})

type ProductionCapsuleBuildEvidence = {
  readonly builderResult: CanonicalSam31ProductionCapsuleBuilderResult
  readonly securityReview: CanonicalSam31ProductionCapsuleSecurityReview
  readonly coordinate: CanonicalSam31ProductionCapsuleCoordinate
}

export interface CanonicalSam31ProductionCapsuleBuildReadPort {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_PRODUCTION_CAPSULE_BUILD_READ_PORT_VERSION
  rereadBuild(input: {
    readonly buildId: string
  }): Promise<ProductionCapsuleBuildEvidence | null>
}

export interface CanonicalSam31ProductionCapsuleReproducibilityRepository {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_PRODUCTION_CAPSULE_REPOSITORY_VERSION
  readonly evidenceClass: 'private_create_only_exact_reread'
  persistCreateOnly(input: {
    readonly receipt: CanonicalSam31ProductionCapsuleReproducibility
  }): Promise<{
    readonly disposition: 'created' | 'identical_replay'
    readonly receiptRef: z.infer<typeof refSchema>
  }>
  reread(input: {
    readonly receiptRef: z.infer<typeof refSchema>
  }): Promise<CanonicalSam31ProductionCapsuleReproducibility | null>
}

export interface CanonicalSam31ProductionCapsuleIngestReadPort {
  rereadPrivateArtifactIngest(input: {
    readonly ingestReceiptRef: {
      readonly id: string
      readonly version: 1
      readonly schemaVersion:
        'canonical-sam3_1-private-artifact-ingest-receipt-v3'
      readonly contentHash: string
    }
  }): Promise<unknown | null>
}

export interface CanonicalSam31VertexImageBuildBindingReadPort {
  rereadArtifactBinding(input: {
    readonly bindingRef: z.infer<typeof refSchema>
  }): Promise<CanonicalSam31VertexImageBuildBinding | null>
}

export function createCanonicalSam31ProductionCapsuleReproducibilityRepository(
  input: { readonly objectPort: CanonicalCreateOnlyJsonObjectPort },
): CanonicalSam31ProductionCapsuleReproducibilityRepository {
  if (
    !input.objectPort
    || typeof input.objectPort.createOnly !== 'function'
    || typeof input.objectPort.readExact !== 'function'
  ) throw new Error('Production capsule repository is invalid.')
  return Object.freeze({
    schemaVersion: CANONICAL_SAM3_1_PRODUCTION_CAPSULE_REPOSITORY_VERSION,
    evidenceClass: 'private_create_only_exact_reread',
    async persistCreateOnly({ receipt }: {
      readonly receipt: CanonicalSam31ProductionCapsuleReproducibility
    }) {
      const parsed = assertCanonicalSam31ProductionCapsuleReproducibility(
        receipt,
      )
      const receiptRef = canonicalSam31ProductionCapsuleReproducibilityRef(
        parsed,
      )
      const body = Buffer.from(
        canonicalSam31ProductionCapsuleStringify(parsed),
        'utf8',
      )
      const disposition = await input.objectPort.createOnly({
        objectPath: recordPath(receiptRef),
        body,
        contentSha256: sha256(body),
      })
      const reread = await readReceipt(input.objectPort, receiptRef)
      if (!reread || reread.receiptHash !== parsed.receiptHash) {
        throw new Error('Production capsule receipt reread changed.')
      }
      return Object.freeze({
        disposition: disposition === 'created'
          ? 'created' as const
          : 'identical_replay' as const,
        receiptRef,
      })
    },
    async reread({ receiptRef }: {
      readonly receiptRef: z.infer<typeof refSchema>
    }) {
      const ref = refSchema.parse(receiptRef)
      return readReceipt(input.objectPort, ref)
    },
  })
}

/**
 * Promotes only two exact, independent, scan-clean capsule builds into one
 * create-only manifest. It cannot start Cloud Build or a GPU/model runtime.
 */
export function createCanonicalSam31ProductionCapsulePublisher(input: {
  readonly qualificationReleaseReadPort:
    CanonicalSam31VertexQualificationReleaseObjectReadPort
  readonly ingestReadPort: CanonicalSam31ProductionCapsuleIngestReadPort
  readonly artifactBindingReadPort:
    CanonicalSam31VertexImageBuildBindingReadPort
  readonly buildReadPort: CanonicalSam31ProductionCapsuleBuildReadPort
  readonly reproducibilityRepository:
    CanonicalSam31ProductionCapsuleReproducibilityRepository
  readonly imageBuildRepository: CanonicalSam31CloudImageBuildRepository
  readonly privateCapsuleReadPort: CanonicalSam31PrivateBuildCapsuleReadPort
  readonly verifyCapsule?: typeof verifyCanonicalSam31PrivateBuildCapsuleBytes
}) {
  assertPublisherDependencies(input)
  const verifyCapsule = input.verifyCapsule
    ?? verifyCanonicalSam31PrivateBuildCapsuleBytes
  return Object.freeze({
    schemaVersion: CANONICAL_SAM3_1_PRODUCTION_CAPSULE_PUBLISHER_VERSION,
    async publish(untrusted: unknown) {
      assertPlainSerializedData(untrusted, 'sam31_production_capsule_request')
      const request = requestSchema.parse(untrusted)
      const [releaseRaw, primary, confirmation] = await Promise.all([
        input.qualificationReleaseReadPort.rereadQualificationRelease({
          sourceCheckpointQualificationRef:
            request.sourceCheckpointQualificationRef,
        }),
        input.buildReadPort.rereadBuild({
          buildId: request.primaryBuildId,
        }),
        input.buildReadPort.rereadBuild({
          buildId: request.confirmationBuildId,
        }),
      ])
      if (!releaseRaw || !primary || !confirmation) {
        throw new Error('Production capsule evidence is absent.')
      }
      const release = assertCanonicalSam31VertexQualificationRelease(
        releaseRaw,
      )
      assertSameQualificationRef(
        release.sourceCheckpointQualificationRef,
        request.sourceCheckpointQualificationRef,
      )
      if (
        release.status !== 'qualified_for_private_image_build'
        || !release.sourceCheckpointQualificationGranted
        || !release.privateImageBuildReviewEligible
        || release.imageBuildStarted
        || release.runtimeReleaseGranted
        || release.customerCreditsMutated
        || release.productionReady
      ) throw new Error('Final SAM 3.1 qualification is not admissible.')
      const ingestRaw = await input.ingestReadPort
        .rereadPrivateArtifactIngest({
          ingestReceiptRef:
            release.qualification.workerRequest.ingestReceiptRef,
        })
      if (!ingestRaw) throw new Error('Production capsule ingest is absent.')
      const ingest = assertCanonicalSam31PrivateArtifactIngestReceipt(
        ingestRaw,
      )
      if (ingest.ingestReceiptHash !==
        release.qualification.ingestReceipt.ingestReceiptHash) {
        throw new Error('Production capsule ingest crossed qualification.')
      }
      const candidate = createCanonicalSam31SourceRuntimeCandidate()
      const expectedBinding = createCanonicalSam31VertexImageBuildBinding({
        release,
      })
      const bindingRef = refSchema.parse({
        id:
          `sam31-vertex-build-binding-${expectedBinding.bindingHash.slice(0, 24)}`,
        version: 1,
        contentHash: `sha256:${expectedBinding.bindingHash}`,
      })
      const bindingRaw = await input.artifactBindingReadPort
        .rereadArtifactBinding({ bindingRef })
      if (!bindingRaw) {
        throw new Error('Production capsule Vertex binding is absent.')
      }
      const binding = assertCanonicalSam31VertexImageBuildBinding(bindingRaw)
      if (canonicalSam31ProductionCapsuleStringify(binding) !==
        canonicalSam31ProductionCapsuleStringify(expectedBinding)) {
        throw new Error('Production capsule Vertex binding changed.')
      }
      for (const evidence of [primary, confirmation]) {
        assertBuildMatchesQualification({
          evidence,
          qualificationRef: request.sourceCheckpointQualificationRef,
          sourceQualificationCapsuleRef:
            refSchema.parse(
              release.qualification.workerRequest.dependencyClosure
                .artifactRef,
            ),
          bindingRef,
        })
      }
      const reproducibility =
        createCanonicalSam31ProductionCapsuleReproducibility({
          primary,
          confirmation,
          observedAt: latestTimestamp(
            primary.securityReview.reviewedAt,
            confirmation.securityReview.reviewedAt,
          ),
        })
      const persistedReceipt = await input.reproducibilityRepository
        .persistCreateOnly({ receipt: reproducibility })
      const rereadReceipt = await input.reproducibilityRepository.reread({
        receiptRef: persistedReceipt.receiptRef,
      })
      if (!rereadReceipt
        || rereadReceipt.receiptHash !== reproducibility.receiptHash) {
        throw new Error('Production capsule reproducibility reread changed.')
      }
      const [primaryInspection, confirmationInspection] = await Promise.all([
        verifyCapsule(
          withoutStorageContentType(primary.coordinate),
          input.privateCapsuleReadPort,
        ),
        verifyCapsule(
          withoutStorageContentType(confirmation.coordinate),
          input.privateCapsuleReadPort,
        ),
      ])
      if (
        primaryInspection.archiveEntrySetSha256 !==
          primary.builderResult.archiveEntrySetSha256
        || canonicalSam31ProductionCapsuleStringify(
          primaryInspection.archiveEntries,
        ) !== canonicalSam31ProductionCapsuleStringify(
          primary.builderResult.archiveEntries,
        )
        || confirmationInspection.archiveEntrySetSha256 !==
          confirmation.builderResult.archiveEntrySetSha256
        || canonicalSam31ProductionCapsuleStringify(
          confirmationInspection.archiveEntries,
        ) !== canonicalSam31ProductionCapsuleStringify(
          confirmation.builderResult.archiveEntries,
        )
      ) throw new Error('Production capsule body changed after publication.')
      const receiptRef = canonicalSam31ProductionCapsuleReproducibilityRef(
        rereadReceipt,
      )
      const manifest = createManifest({
        candidate,
        bindingRef,
        primary,
        receiptRef,
        preparedAt: rereadReceipt.observedAt,
      })
      const manifestRef = await input.imageBuildRepository
        .persistCapsuleManifestCreateOnly({ manifest })
      const manifestReread = await input.imageBuildRepository
        .rereadCapsuleManifest({ manifestRef })
      if (!manifestReread
        || manifestReread.manifestHash !== manifest.manifestHash) {
        throw new Error('Production capsule manifest reread changed.')
      }
      return Object.freeze({
        schemaVersion: CANONICAL_SAM3_1_PRODUCTION_CAPSULE_PUBLISHER_VERSION,
        disposition: 'capsule_ready_for_image_authority_publication' as const,
        sourceCheckpointQualificationRef:
          structuredClone(request.sourceCheckpointQualificationRef),
        artifactBindingRef: structuredClone(bindingRef),
        reproducibilityRef: structuredClone(receiptRef),
        capsuleManifestRef: structuredClone(manifestRef),
        independentBuildCount: 2 as const,
        exactCapsuleBodyAndEntrySetReread: true as const,
        checkpointIncluded: false as const,
        developerMachineModelInstallPerformed: false as const,
        imageBuildStarted: false as const,
        gpuJobDispatched: false as const,
        customerCreditsMutated: false as const,
        runtimeReleaseGranted: false as const,
        productionReady: false as const,
      })
    },
  })
}

export function createCanonicalSam31GcsProductionCapsuleBuildReadPort(
  input: { readonly storage?: Storage } = {},
): CanonicalSam31ProductionCapsuleBuildReadPort {
  const storage = input.storage ?? new Storage({
    projectId: PROJECT_ID,
    retryOptions: { autoRetry: false, maxRetries: 0 },
  })
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_PRODUCTION_CAPSULE_BUILD_READ_PORT_VERSION,
    async rereadBuild({ buildId }: { readonly buildId: string }) {
      const id = buildIdSchema.parse(buildId)
      const prefix = `${INPUT_PREFIX}/${id}`
      const securityRaw = await readExactJson(
        storage,
        `${prefix}/capsule-security-review.json`,
      )
      if (!securityRaw) return null
      const security = assertCanonicalSam31ProductionCapsuleSecurityReview(
        securityRaw,
      )
      if (security.buildId !== id) {
        throw new Error('Production capsule security build ID changed.')
      }
      const builderRaw = await readExactJson(
        storage,
        `${prefix}/${security.capsuleSha256}.capsule.json`,
      )
      if (!builderRaw) return null
      const builder = assertCanonicalSam31ProductionCapsuleBuilderResult(
        builderRaw,
      )
      const capsuleObjectName =
        `${prefix}/${security.capsuleSha256}.tar.gz`
      let metadata: FileMetadata
      try {
        ;[metadata] = await storage.bucket(INPUT_BUCKET)
          .file(capsuleObjectName).getMetadata()
      } catch (error) {
        if (cloudErrorCode(error) === 404) return null
        throw error
      }
      const coordinate = productionCoordinate(metadata, capsuleObjectName)
      return Object.freeze({
        builderResult: structuredClone(builder),
        securityReview: structuredClone(security),
        coordinate,
      })
    },
  })
}

export function createCanonicalSam31GcpProductionCapsulePublisher(
  input: { readonly storage?: Storage } = {},
) {
  const storage = input.storage ?? new Storage({
    projectId: PROJECT_ID,
    retryOptions: { autoRetry: false, maxRetries: 0 },
  })
  const objectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
    storage,
    bucketName: CONTROL_BUCKET,
  })
  const imageBuildRepository = createCanonicalSam31CloudImageBuildRepository({
    objectPort,
    prefix: 'private/sam3_1/cloud-image-build/v2',
  })
  return createCanonicalSam31ProductionCapsulePublisher({
    qualificationReleaseReadPort:
      createCanonicalSam31VertexQualificationReleaseObjectReadPort({
        objectPort,
      }),
    ingestReadPort:
      createCanonicalSam31GcpPrivateArtifactIngestRepository({ storage }),
    artifactBindingReadPort:
      createCanonicalSam31VertexImageBuildBindingReadPort({ objectPort }),
    buildReadPort:
      createCanonicalSam31GcsProductionCapsuleBuildReadPort({ storage }),
    reproducibilityRepository:
      createCanonicalSam31ProductionCapsuleReproducibilityRepository({
        objectPort,
      }),
    imageBuildRepository,
    privateCapsuleReadPort:
      createCanonicalSam31GcsProductionCapsuleReadPort({ storage }),
  })
}

export function createCanonicalSam31VertexImageBuildBindingReadPort(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
}): CanonicalSam31VertexImageBuildBindingReadPort {
  if (typeof input.objectPort?.readExact !== 'function') {
    throw new Error('Vertex production build binding read port is invalid.')
  }
  return Object.freeze({
    async rereadArtifactBinding({ bindingRef }: {
      readonly bindingRef: z.infer<typeof refSchema>
    }) {
      const ref = refSchema.parse(bindingRef)
      const body = await input.objectPort.readExact(
        'private/sam3_1/cloud-image-build/v2/artifact-bindings/'
          + `${ref.contentHash.slice(7)}.json`,
      )
      if (!body) return null
      let raw: unknown
      try {
        raw = JSON.parse(body.toString('utf8'))
      } catch {
        throw new Error('Vertex production build binding JSON is invalid.')
      }
      const binding = assertCanonicalSam31VertexImageBuildBinding(raw)
      if (
        ref.id !==
          `sam31-vertex-build-binding-${binding.bindingHash.slice(0, 24)}`
        || ref.contentHash !== `sha256:${binding.bindingHash}`
        || body.toString('utf8') !==
          canonicalSam31ProductionCapsuleStringify(binding)
      ) throw new Error('Vertex production build binding reread changed.')
      return binding
    },
  })
}

function createManifest(input: {
  readonly candidate: ReturnType<typeof createCanonicalSam31SourceRuntimeCandidate>
  readonly bindingRef: z.infer<typeof refSchema>
  readonly primary: ProductionCapsuleBuildEvidence
  readonly receiptRef: z.infer<typeof refSchema>
  readonly preparedAt: string
}) {
  const builder = input.primary.builderResult
  if (!builder.forwardPropagationFrameCountPatchSha256) {
    throw new Error(
      'Production capsule omitted the SAM 3.1 frame-count propagation patch.',
    )
  }
  return createCanonicalSam31PrivateImageBuildCapsuleManifest({
    evidenceClass: 'canonical_private_reread',
    status: 'private_capsule_verified',
    manifestId:
      `sam31-production-capsule-${builder.capsuleSha256.slice(0, 24)}`,
    manifestVersion: 1,
    operationId: input.candidate.operationId,
    candidateRef: {
      schemaVersion: input.candidate.schemaVersion,
      candidateHash: input.candidate.candidateHash,
    },
    artifactBindingRef: input.bindingRef,
    repositorySource: {
      commitSha: builder.repositoryCommit,
      treeSha: builder.repositoryTree,
      sourceBundleRef: builder.sourceBundleRef,
      sourcePublished: builder.sourcePublished,
      sourceClean: builder.sourceClean,
      dockerfilePath:
        'docker/prod/gpu-worker/sam3_1/Dockerfile.candidate',
      dockerfileSha256: builder.dockerfileSha256,
      runnerSha256: builder.runnerSha256,
      vertexPredictionServerSha256:
        builder.vertexPredictionServerSha256,
      entrypointSha256: builder.entrypointSha256,
      sourceProvenanceLockSha256: builder.sourceProvenanceLockSha256,
      gpuDecodePatchSha256: builder.gpuDecodePatchSha256,
      ...(builder.multiplexSessionGpuForwardingPatchSha256
        ? {
            multiplexSessionGpuForwardingPatchSha256:
              builder.multiplexSessionGpuForwardingPatchSha256,
          }
        : {}),
      forwardPropagationFrameCountPatchSha256:
        builder.forwardPropagationFrameCountPatchSha256,
    },
    privateInput: {
      directoryName: 'sam31_private_build_input',
      deterministicSourceArchiveSha256:
        '5138f0e396de40a40ef0168c106e089aacbbf1dc7651be2f81c76f89c2f67f2a',
      deterministicPatchedSourceArchiveSha256:
        'b692268f0e295673d5c5cc2fc14e7813847effc5e371e32cb18c1861b4c8adfb',
      patchApplicationReceiptSha256:
        builder.patchApplicationReceiptSha256,
      dependencyLockSha256: builder.dependencyLockSha256,
      dependencyClosureReceiptSha256:
        builder.dependencyClosureReceiptSha256,
      dependencyWheelManifestSha256:
        builder.dependencyWheelManifestSha256,
      dependencyWheelCount: builder.dependencyWheelCount,
      cudaForwardCompatPackageSha256:
        'e980bf55b8d1f6390f07968df46644c971a52f4e4129067d33d1445fac716893',
      cudaForwardCompatIngestReceiptSha256:
        builder.cudaForwardCompatIngestReceiptSha256,
      artifactBuildBindingRecordHash:
        builder.artifactBuildBindingRecordHash,
      artifactBuildBindingFileSha256:
        builder.artifactBuildBindingFileSha256,
      sourceCheckpointQualificationRecordHash:
        builder.sourceCheckpointQualificationRecordHash,
      sourceCheckpointCompatibilityReceiptSha256:
        builder.sourceCheckpointCompatibilityReceiptSha256,
    },
    capsule: {
      coordinate: withoutStorageContentType(input.primary.coordinate),
      format: 'tar_gzip',
      contentType: 'application/gzip',
      capsuleArtifactRef: {
        id: `sam31-production-capsule.${builder.capsuleSha256.slice(0, 24)}`,
        version: 1,
        contentHash: `sha256:${builder.capsuleSha256}`,
      },
      archiveEntries: builder.archiveEntries,
      archiveEntrySetSha256: builder.archiveEntrySetSha256,
      archiveEntriesReread: true,
      exactByteLengthAndSha256Reread: true,
      generationAndEtagStableBeforeAndAfterRead: true,
      prohibitedEntryScanPassed: true,
      absoluteParentTraversalSymlinkDeviceAndSocketEntriesAbsent: true,
    },
    securityBoundary: {
      checkpointBytesIncluded: false,
      repositoryOrProviderTokenIncluded: false,
      privateStorageCoordinateEmbeddedInImageInputReceipts: false,
      callerCommandDockerfileImageTagOrBuildArgsAccepted: false,
      networkDependencyInstallRequired: false,
      buildSecretsRequired: false,
      capsuleCreateOnlyAndPrivate: true,
      securityReviewRef: input.receiptRef,
      malwareScanRef: input.receiptRef,
    },
    preparedAt: input.preparedAt,
  })
}

function assertBuildMatchesQualification(input: {
  readonly evidence: ProductionCapsuleBuildEvidence
  readonly qualificationRef: z.infer<typeof qualificationRefSchema>
  readonly sourceQualificationCapsuleRef: z.infer<typeof refSchema>
  readonly bindingRef: z.infer<typeof refSchema>
}): void {
  const builder = assertCanonicalSam31ProductionCapsuleBuilderResult(
    input.evidence.builderResult,
  )
  const security = assertCanonicalSam31ProductionCapsuleSecurityReview(
    input.evidence.securityReview,
  )
  if (
    canonicalSam31ProductionCapsuleStringify(
      builder.sourceCheckpointQualificationRef,
    ) !== canonicalSam31ProductionCapsuleStringify(input.qualificationRef)
    || canonicalSam31ProductionCapsuleStringify(
      builder.sourceQualificationCapsuleRef,
    ) !== canonicalSam31ProductionCapsuleStringify(
      input.sourceQualificationCapsuleRef,
    )
    || canonicalSam31ProductionCapsuleStringify(builder.artifactBindingRef)
      !== canonicalSam31ProductionCapsuleStringify(input.bindingRef)
    || security.buildId !== builder.buildId
    || security.capsuleSha256 !== builder.capsuleSha256
    || security.capsuleByteLength !== builder.capsuleByteLength
    || security.archiveEntrySetSha256 !== builder.archiveEntrySetSha256
    || !builder.sourceQualificationCapsuleExactlyReread
    || !builder.sourcePublished
    || !builder.sourceClean
  ) throw new Error('Production capsule crossed final qualification.')
}

function assertSameQualificationRef(
  left: z.infer<typeof qualificationRefSchema>,
  right: z.infer<typeof qualificationRefSchema>,
): void {
  if (
    canonicalSam31ProductionCapsuleStringify(left)
      !== canonicalSam31ProductionCapsuleStringify(right)
  ) throw new Error('Production capsule qualification reference changed.')
}

function withoutStorageContentType(
  coordinate: CanonicalSam31ProductionCapsuleCoordinate,
) {
  return {
    projectId: coordinate.projectId,
    bucketName: coordinate.bucketName,
    objectName: coordinate.objectName,
    generation: coordinate.generation,
    etag: coordinate.etag,
    byteLength: coordinate.byteLength,
    sha256: coordinate.sha256,
  }
}

async function readExactJson(
  storage: Storage,
  objectName: string,
): Promise<unknown | null> {
  const live = storage.bucket(INPUT_BUCKET).file(objectName)
  let before: FileMetadata
  try {
    ;[before] = await live.getMetadata()
  } catch (error) {
    if (cloudErrorCode(error) === 404) return null
    throw error
  }
  const generation = String(before.generation ?? '')
  const etag = String(before.etag ?? '')
  const size = Number(before.size ?? -1)
  if (
    !/^[1-9][0-9]{0,30}$/u.test(generation)
    || !etag
    || !Number.isSafeInteger(size)
    || size < 2
    || size > MAXIMUM_JSON_BYTES
    || before.contentType !== 'application/json'
  ) throw new Error('Production capsule evidence metadata is invalid.')
  const file = storage.bucket(INPUT_BUCKET).file(objectName, { generation })
  const [body] = await file.download({ validation: 'crc32c' })
  const [after] = await file.getMetadata()
  if (
    body.byteLength !== size
    || String(after.generation ?? '') !== generation
    || String(after.etag ?? '') !== etag
  ) throw new Error('Production capsule evidence identity changed.')
  let value: unknown
  try {
    value = JSON.parse(body.toString('utf8'))
  } catch {
    throw new Error('Production capsule evidence JSON is invalid.')
  }
  assertPlainSerializedData(value, 'sam31_production_capsule_evidence_json')
  const canonicalWire =
    `${canonicalSam31ProductionCapsuleStringify(value)}\n`
  if (canonicalWire !== body.toString('utf8')) {
    throw new Error('Production capsule evidence JSON is not canonical.')
  }
  return value
}

function productionCoordinate(
  metadata: FileMetadata,
  objectName: string,
): CanonicalSam31ProductionCapsuleCoordinate {
  const generation = String(metadata.generation ?? '')
  const etag = String(metadata.etag ?? '')
  const byteLength = Number(metadata.size ?? -1)
  const crc32c = String(metadata.crc32c ?? '')
  const md5Hash = String(metadata.md5Hash ?? '')
  const shaMatch = objectName.match(/\/([a-f0-9]{64})\.tar\.gz$/u)
  return assertCanonicalSam31ProductionCapsuleCoordinate({
    projectId: PROJECT_ID,
    bucketName: INPUT_BUCKET,
    objectName,
    generation,
    etag,
    byteLength,
    sha256: shaMatch?.[1] ?? '',
    storageContentType: metadata.contentType,
    crc32c,
    md5Hash,
  })
}

function recordPath(ref: z.infer<typeof refSchema>): string {
  const idHash = createHash('sha256').update(ref.id, 'utf8').digest('hex')
  return `${RECORD_PREFIX}/${idHash}/${ref.contentHash.slice(7)}.json`
}

async function readReceipt(
  objectPort: CanonicalCreateOnlyJsonObjectPort,
  ref: z.infer<typeof refSchema>,
) {
  const body = await objectPort.readExact(recordPath(ref))
  if (!body) return null
  let value: unknown
  try {
    value = JSON.parse(body.toString('utf8'))
  } catch {
    throw new Error('Production capsule receipt JSON is invalid.')
  }
  const receipt = assertCanonicalSam31ProductionCapsuleReproducibility(value)
  if (
    receipt.receiptHash !== ref.contentHash.slice('sha256:'.length)
    || canonicalSam31ProductionCapsuleStringify(receipt)
      !== body.toString('utf8')
  ) throw new Error('Production capsule receipt reference changed.')
  return receipt
}

function assertPublisherDependencies(input: {
  readonly qualificationReleaseReadPort:
    CanonicalSam31VertexQualificationReleaseObjectReadPort
  readonly ingestReadPort: CanonicalSam31ProductionCapsuleIngestReadPort
  readonly artifactBindingReadPort:
    CanonicalSam31VertexImageBuildBindingReadPort
  readonly buildReadPort: CanonicalSam31ProductionCapsuleBuildReadPort
  readonly reproducibilityRepository:
    CanonicalSam31ProductionCapsuleReproducibilityRepository
  readonly imageBuildRepository: CanonicalSam31CloudImageBuildRepository
  readonly privateCapsuleReadPort: CanonicalSam31PrivateBuildCapsuleReadPort
}): void {
  if (
    typeof input.qualificationReleaseReadPort?.rereadQualificationRelease
      !== 'function'
    || typeof input.ingestReadPort?.rereadPrivateArtifactIngest !== 'function'
    || typeof input.artifactBindingReadPort?.rereadArtifactBinding !==
      'function'
    || typeof input.buildReadPort?.rereadBuild !== 'function'
    || typeof input.reproducibilityRepository?.persistCreateOnly !== 'function'
    || typeof input.reproducibilityRepository?.reread !== 'function'
    || typeof input.imageBuildRepository?.persistCapsuleManifestCreateOnly
      !== 'function'
    || typeof input.privateCapsuleReadPort?.readExact !== 'function'
  ) throw new Error('Production capsule publisher dependency is invalid.')
}

function latestTimestamp(left: string, right: string): string {
  const leftMs = Date.parse(left)
  const rightMs = Date.parse(right)
  if (!Number.isFinite(leftMs) || !Number.isFinite(rightMs)) {
    throw new Error('Production capsule timestamps are invalid.')
  }
  return new Date(Math.max(leftMs, rightMs)).toISOString()
}

function cloudErrorCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined
  const value = Reflect.get(error, 'code')
  if (typeof value === 'number') return value
  return typeof value === 'string' && /^[0-9]{3}$/u.test(value)
    ? Number(value)
    : undefined
}

function sha256(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}
