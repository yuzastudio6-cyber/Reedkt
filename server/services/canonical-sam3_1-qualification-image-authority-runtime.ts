import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  assertCanonicalSam31QualificationImageBuildAuthority,
  assertCanonicalSam31QualificationImageCapsuleManifest,
  createCanonicalSam31QualificationImageCapsuleManifest,
  prepareCanonicalSam31QualificationImageBuildAuthority,
  type CanonicalSam31QualificationImageBuildAuthority,
  type CanonicalSam31QualificationImageCapsuleManifest,
} from '../model-artifacts/canonical-sam3_1-qualification-image-build-authority'
import { createCanonicalSam31SourceRuntimeCandidate } from
  '../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  createCanonicalSam31GcpPrivateArtifactIngestRepository,
} from './canonical-sam3_1-private-artifact-ingest-repository'
import {
  canonicalSam31QualificationCapsuleReproducibilityRef,
} from '../model-artifacts/canonical-sam3_1-qualification-capsule-reproducibility'
import {
  createCanonicalSam31QualificationCapsuleReproducibilityRepository,
  rereadCanonicalSam31QualificationCapsuleBuildEvidence,
} from './canonical-sam3_1-qualification-capsule-reproducibility-runtime'
import {
  createCanonicalSam31GcsQualificationCapsuleReadPort,
} from './canonical-sam3_1-qualification-capsule-runtime'
import {
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_QUALIFICATION_IMAGE_AUTHORITY_RUNTIME_VERSION =
  'canonical-sam3_1-qualification-image-authority-runtime-v1' as const

const CONTROL_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const RECORD_PREFIX = 'private/sam3_1/qualification-image-build/v1' as const
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const refSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()

export interface CanonicalSam31QualificationImageAuthorityRepository {
  persistCapsuleManifestCreateOnly(input: {
    readonly manifest: CanonicalSam31QualificationImageCapsuleManifest
  }): Promise<'created' | 'identical_replay'>
  rereadCapsuleManifest(input: {
    readonly manifestRef: z.infer<typeof refSchema>
  }): Promise<CanonicalSam31QualificationImageCapsuleManifest | null>
  persistBuildAuthorityCreateOnly(input: {
    readonly authority: CanonicalSam31QualificationImageBuildAuthority
  }): Promise<'created' | 'identical_replay'>
  rereadBuildAuthority(input: {
    readonly authorityRef: z.infer<typeof refSchema>
  }): Promise<CanonicalSam31QualificationImageBuildAuthority | null>
}

export function createCanonicalSam31QualificationImageAuthorityRepository(
  input: { readonly objectPort: CanonicalCreateOnlyJsonObjectPort },
): CanonicalSam31QualificationImageAuthorityRepository {
  if (
    !input.objectPort
    || typeof input.objectPort.createOnly !== 'function'
    || typeof input.objectPort.readExact !== 'function'
  ) throw new Error('SAM 3.1 qualification image repository is invalid.')
  return Object.freeze({
    async persistCapsuleManifestCreateOnly({ manifest }: {
      readonly manifest: CanonicalSam31QualificationImageCapsuleManifest
    }) {
      return persistExact(
        input.objectPort,
        recordPath('manifest', manifestRef(manifest)),
        assertCanonicalSam31QualificationImageCapsuleManifest(manifest),
      )
    },
    async rereadCapsuleManifest({ manifestRef: untrustedRef }: {
      readonly manifestRef: z.infer<typeof refSchema>
    }) {
      const ref = refSchema.parse(untrustedRef)
      const manifest = await readExact(
        input.objectPort,
        recordPath('manifest', ref),
        assertCanonicalSam31QualificationImageCapsuleManifest,
      )
      if (manifest && !sameRef(manifestRef(manifest), ref)) {
        throw new Error('SAM 3.1 qualification manifest reference changed.')
      }
      return manifest
    },
    async persistBuildAuthorityCreateOnly({ authority }: {
      readonly authority: CanonicalSam31QualificationImageBuildAuthority
    }) {
      return persistExact(
        input.objectPort,
        recordPath('authority', authorityRef(authority)),
        assertCanonicalSam31QualificationImageBuildAuthority(authority),
      )
    },
    async rereadBuildAuthority({ authorityRef: untrustedRef }: {
      readonly authorityRef: z.infer<typeof refSchema>
    }) {
      const ref = refSchema.parse(untrustedRef)
      const authority = await readExact(
        input.objectPort,
        recordPath('authority', ref),
        assertCanonicalSam31QualificationImageBuildAuthority,
      )
      if (authority && !sameRef(authorityRef(authority), ref)) {
        throw new Error('SAM 3.1 qualification authority reference changed.')
      }
      return authority
    },
  })
}

export async function publishCanonicalSam31QualificationImageBuildAuthority(
  input: {
    readonly manifestId: string
    readonly authorityId: string
    readonly ingestReceiptRef: {
      readonly id: string
      readonly version: 1
      readonly schemaVersion:
        'canonical-sam3_1-private-artifact-ingest-receipt-v3'
      readonly contentHash: `sha256:${string}`
    }
    readonly reproducibilityReceiptRef: {
      readonly id: string
      readonly version: 1
      readonly contentHash: `sha256:${string}`
    }
    readonly storage?: Storage
    readonly repository?: CanonicalSam31QualificationImageAuthorityRepository
  },
) {
  assertPlainSerializedData({
    manifestId: input.manifestId,
    authorityId: input.authorityId,
    ingestReceiptRef: input.ingestReceiptRef,
    reproducibilityReceiptRef: input.reproducibilityReceiptRef,
  }, 'sam31_qualification_image_authority_publish')
  safeId.parse(input.manifestId)
  safeId.parse(input.authorityId)
  const storage = input.storage ?? new Storage({
    projectId: 'reeditpro',
    retryOptions: { autoRetry: false, maxRetries: 0 },
  })
  const objectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
    storage,
    bucketName: CONTROL_BUCKET,
  })
  const ingestRepository = createCanonicalSam31GcpPrivateArtifactIngestRepository({
    storage,
  })
  const ingestReceipt = await ingestRepository.rereadPrivateArtifactIngest({
    ingestReceiptRef: input.ingestReceiptRef,
  })
  const reproducibilityRepository =
    createCanonicalSam31QualificationCapsuleReproducibilityRepository({
      objectPort,
    })
  const reproducibility = await reproducibilityRepository.reread({
    receiptRef: refSchema.parse(input.reproducibilityReceiptRef),
  })
  if (!ingestReceipt || !reproducibility) {
    throw new Error('SAM 3.1 qualification authority inputs are absent.')
  }
  if (!sameRef(
    canonicalSam31QualificationCapsuleReproducibilityRef(reproducibility),
    input.reproducibilityReceiptRef,
  )) throw new Error('SAM 3.1 reproducibility receipt reference changed.')
  const build = await rereadCanonicalSam31QualificationCapsuleBuildEvidence(
    storage,
    reproducibility.primaryBuild.buildId,
  )
  assertReproducibleBuild(build, reproducibility)
  const candidate = createCanonicalSam31SourceRuntimeCandidate()
  const coordinate = {
    projectId: build.coordinate.projectId,
    bucketName: build.coordinate.bucketName,
    objectName: build.coordinate.objectName,
    generation: build.coordinate.generation,
    etag: build.coordinate.etag,
    byteLength: build.coordinate.byteLength,
    sha256: build.coordinate.sha256,
  }
  const manifest = createCanonicalSam31QualificationImageCapsuleManifest({
    evidenceClass: 'canonical_private_reread',
    status: 'private_capsule_verified',
    manifestId: input.manifestId,
    manifestVersion: 1,
    operationId: candidate.operationId,
    candidateRef: {
      schemaVersion: candidate.schemaVersion,
      candidateHash: candidate.candidateHash,
    },
    ingestReceiptRef: {
      id: ingestReceipt.ingestReceiptId,
      version: ingestReceipt.ingestReceiptVersion,
      schemaVersion: ingestReceipt.schemaVersion,
      contentHash: `sha256:${ingestReceipt.ingestReceiptHash}`,
    },
    repositorySource: {
      commitSha: build.builderResult.repositoryCommit,
      treeSha: build.builderResult.repositoryTree,
      sourceBundleRef: buildRef(
        build.builderResult.repositoryCommit,
        build.builderResultFileSha256,
      ),
      sourcePublished: true,
      sourceClean: true,
      dockerfilePath:
        'docker/prod/gpu-worker/sam3_1/Dockerfile.qualification.candidate',
      dockerfileSha256: entryHash(build, 'Dockerfile.qualification.candidate'),
      runnerSha256: entryHash(build, 'qualification_runner.py'),
      entrypointSha256: entryHash(build, 'qualification_entrypoint.sh'),
      sourceProvenanceLockSha256: entryHash(build, 'source-provenance.lock'),
      gpuDecodePatchSha256:
        'daf5dfb59dbe6809eb2731b43e13d91b1679c271f0f4af11962236ffe83eb6ca',
    },
    privateInput: {
      directoryName: 'sam31_private_build_input',
      deterministicSourceArchiveSha256:
        '5138f0e396de40a40ef0168c106e089aacbbf1dc7651be2f81c76f89c2f67f2a',
      deterministicPatchedSourceArchiveSha256:
        'b692268f0e295673d5c5cc2fc14e7813847effc5e371e32cb18c1861b4c8adfb',
      patchApplicationReceiptSha256:
        build.builderResult.patchApplicationReceiptSha256,
      dependencyLockSha256: build.builderResult.dependencyLockSha256,
      dependencyClosureReceiptSha256:
        build.builderResult.dependencyClosureReceiptSha256,
      dependencyWheelManifestSha256:
        build.builderResult.dependencyWheelManifestSha256,
      dependencyWheelCount: build.builderResult.dependencyWheelCount,
      cudaForwardCompatPackageSha256:
        'e980bf55b8d1f6390f07968df46644c971a52f4e4129067d33d1445fac716893',
      cudaForwardCompatIngestReceiptSha256:
        build.builderResult.cudaForwardCompatIngestReceiptSha256,
      sourceCheckpointQualificationReceiptIncluded: false,
      checkpointBytesIncluded: false,
    },
    capsule: {
      coordinate,
      format: 'tar_gzip',
      contentType: 'application/gzip',
      storageContentType: 'application/x-tar',
      capsuleArtifactRef: {
        id: `sam31-qualification-capsule.${build.malwareScan.buildId}`,
        version: 1,
        contentHash: `sha256:${build.coordinate.sha256}`,
      },
      archiveEntries: build.builderResult.archiveEntries,
      archiveEntrySetSha256: build.builderResult.archiveEntrySetSha256,
      archiveEntriesReread: true,
      exactByteLengthAndSha256Reread: true,
      generationAndEtagStableBeforeAndAfterRead: true,
      prohibitedEntryScanPassed: true,
      absoluteParentTraversalSymlinkDeviceAndSocketEntriesAbsent: true,
    },
    securityBoundary: {
      qualificationImageOnly: true,
      checkpointBytesIncluded: false,
      qualificationReceiptIncluded: false,
      repositoryOrProviderTokenIncluded: false,
      privateStorageCoordinateEmbeddedInImage: false,
      callerCommandDockerfileImageTagOrBuildArgsAccepted: false,
      networkDependencyInstallRequired: false,
      buildSecretsRequired: false,
      capsuleCreateOnlyAndPrivate: true,
      reproducibilityRef: canonicalSam31QualificationCapsuleReproducibilityRef(
        reproducibility,
      ),
      securityReviewRef: ingestReceipt.sourceArchive.securityReviewRef,
      malwareScanRef: reproducibility.primaryBuild.malwareScanRef,
    },
    preparedAt: reproducibility.observedAt,
  })
  const repository = input.repository
    ?? createCanonicalSam31QualificationImageAuthorityRepository({ objectPort })
  const authority = await prepareCanonicalSam31QualificationImageBuildAuthority({
    authorityId: input.authorityId,
    candidate,
    ingestReceipt,
    capsuleManifest: manifest,
    privateCapsuleReadPort: createCanonicalSam31GcsQualificationCapsuleReadPort({
      storage,
    }),
    preparedAt: nextTimestamp(reproducibility.observedAt),
  })
  const manifestDisposition = await repository
    .persistCapsuleManifestCreateOnly({ manifest })
  const persistedManifest = await repository.rereadCapsuleManifest({
    manifestRef: manifestRef(manifest),
  })
  if (!persistedManifest || persistedManifest.manifestHash !==
    manifest.manifestHash) {
    throw new Error('SAM 3.1 qualification manifest was not exactly reread.')
  }
  const authorityDisposition = await repository.persistBuildAuthorityCreateOnly({
    authority,
  })
  const persistedAuthority = await repository.rereadBuildAuthority({
    authorityRef: authorityRef(authority),
  })
  if (!persistedAuthority || persistedAuthority.authorityHash !==
    authority.authorityHash) {
    throw new Error('SAM 3.1 qualification authority was not exactly reread.')
  }
  return Object.freeze({
    schemaVersion: CANONICAL_SAM3_1_QUALIFICATION_IMAGE_AUTHORITY_RUNTIME_VERSION,
    manifestDisposition,
    authorityDisposition,
    manifestRef: manifestRef(persistedManifest),
    authorityRef: authorityRef(persistedAuthority),
    imageDestination: persistedAuthority.imageDestination,
    exactCapsuleBodyReread: true as const,
    checkpointIncludedInImage: false as const,
    modelExecuted: false as const,
    developerMachineModelInstallPerformed: false as const,
    imageBuildStarted: false as const,
    gpuJobDispatched: false as const,
    customerCreditsMutated: false as const,
    runtimeReleaseGranted: false as const,
    productionAuthorityGranted: false as const,
  })
}

function assertReproducibleBuild(
  build: Awaited<ReturnType<
    typeof rereadCanonicalSam31QualificationCapsuleBuildEvidence
  >>,
  receipt: {
    readonly repositoryCommit: string
    readonly repositoryTree: string
    readonly primaryBuild: {
      readonly buildId: string
      readonly coordinate: Record<string, unknown>
      readonly builderResultRef: { readonly contentHash: string }
      readonly malwareScanRef: { readonly contentHash: string }
    }
  },
): void {
  if (
    build.builderResult.repositoryCommit !== receipt.repositoryCommit
    || build.builderResult.repositoryTree !== receipt.repositoryTree
    || build.malwareScan.buildId !== receipt.primaryBuild.buildId
    || `sha256:${build.builderResultFileSha256}` !==
      receipt.primaryBuild.builderResultRef.contentHash
    || `sha256:${build.malwareScanFileSha256}` !==
      receipt.primaryBuild.malwareScanRef.contentHash
    || Object.entries(build.coordinate).some(([key, value]) =>
      Reflect.get(receipt.primaryBuild.coordinate, key) !== value)
  ) throw new Error('SAM 3.1 reproducible build evidence changed.')
}

function entryHash(
  build: Awaited<ReturnType<
    typeof rereadCanonicalSam31QualificationCapsuleBuildEvidence
  >>,
  suffix: string,
): string {
  const matches = build.builderResult.archiveEntries.filter((entry) =>
    entry.path.endsWith(`/${suffix}`))
  if (matches.length !== 1) {
    throw new Error(`SAM 3.1 qualification entry ${suffix} is not unique.`)
  }
  return matches[0].sha256
}

function buildRef(commit: string, fileSha256: string) {
  return {
    id: `sam31-qualification-source-bundle.${commit}`,
    version: 1 as const,
    contentHash: `sha256:${fileSha256}` as const,
  }
}

function manifestRef(manifest: CanonicalSam31QualificationImageCapsuleManifest) {
  return {
    id: manifest.manifestId,
    version: manifest.manifestVersion,
    contentHash: `sha256:${manifest.manifestHash}` as const,
  }
}

function authorityRef(authority: CanonicalSam31QualificationImageBuildAuthority) {
  return {
    id: authority.authorityId,
    version: authority.authorityVersion,
    contentHash: `sha256:${authority.authorityHash}` as const,
  }
}

function recordPath(kind: 'manifest' | 'authority', ref: z.infer<typeof refSchema>) {
  const idHash = createHash('sha256').update(ref.id, 'utf8').digest('hex')
  return `${RECORD_PREFIX}/${kind}/${idHash}/${ref.contentHash.slice(7)}.json`
}

async function persistExact(
  port: CanonicalCreateOnlyJsonObjectPort,
  path: string,
  value: unknown,
): Promise<'created' | 'identical_replay'> {
  const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
  const disposition = await port.createOnly({
    objectPath: path,
    body,
    contentSha256: createHash('sha256').update(body).digest('hex'),
  })
  const reread = await port.readExact(path)
  if (!reread || !reread.equals(body)) {
    throw new Error('SAM 3.1 qualification image record reread changed.')
  }
  return disposition === 'created' ? 'created' : 'identical_replay'
}

async function readExact<T>(
  port: CanonicalCreateOnlyJsonObjectPort,
  path: string,
  assertValue: (value: unknown) => T,
): Promise<T | null> {
  const body = await port.readExact(path)
  if (!body) return null
  let value: unknown
  try {
    value = JSON.parse(body.toString('utf8'))
  } catch {
    throw new Error('SAM 3.1 qualification image record is invalid JSON.')
  }
  const parsed = assertValue(value)
  if (stableAuthorityStringify(parsed) !== body.toString('utf8')) {
    throw new Error('SAM 3.1 qualification image record bytes changed.')
  }
  return parsed
}

function sameRef(
  left: { readonly id: string; readonly version: number; readonly contentHash: string },
  right: { readonly id: string; readonly version: number; readonly contentHash: string },
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function nextTimestamp(value: string): string {
  const time = Date.parse(value)
  if (!Number.isFinite(time)) throw new Error('SAM 3.1 timestamp is invalid.')
  return new Date(time + 1).toISOString()
}
