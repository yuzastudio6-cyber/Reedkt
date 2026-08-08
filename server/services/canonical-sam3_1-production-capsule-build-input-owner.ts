import { createHash } from 'node:crypto'

import { Storage, type FileMetadata } from '@google-cloud/storage'
import { z } from 'zod'

import {
  createCanonicalSam31ImageBuildArtifactBinding,
} from '../model-artifacts/canonical-sam3_1-cloud-image-build-authority'
import {
  assertCanonicalSam31PrivateArtifactIngestReceipt,
} from '../model-artifacts/canonical-sam3_1-private-artifact-ingest'
import {
  assertCanonicalSam31SourceRuntimeCandidate,
  createCanonicalSam31SourceRuntimeCandidate,
} from '../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalSam31CloudImageBuildRepository,
  type CanonicalSam31CloudImageBuildRepository,
} from './canonical-sam3_1-cloud-image-build-runtime'
import {
  createCanonicalSam31GcpPrivateArtifactIngestRepository,
} from './canonical-sam3_1-private-artifact-ingest-repository'
import {
  createCanonicalSam31QualificationImageAuthorityRepository,
} from './canonical-sam3_1-qualification-image-authority-runtime'
import {
  assertCanonicalSam31QualificationRelease,
  createCanonicalSam31QualificationReleaseObjectReadPort,
  type CanonicalSam31QualificationReleaseObjectReadPort,
} from './canonical-sam3_1-source-checkpoint-qualification-release-owner'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_PRODUCTION_CAPSULE_BUILD_INPUT_VERSION =
  'canonical-sam3_1-production-capsule-build-input-v1' as const

const PROJECT_ID = 'reeditpro' as const
const CONTROL_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const MAXIMUM_RECORD_BYTES = 16 * 1024 * 1024

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const positiveInteger = z.number().int().positive().safe()
const refSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()
const qualificationRefSchema = refSchema.extend({
  schemaVersion: z.literal(
    'canonical-sam3_1-source-checkpoint-compatibility-qualification-v1',
  ),
}).strict()
const requestSchema = z.object({
  sourceCheckpointQualificationRef: qualificationRefSchema,
}).strict()
const recordCoordinateSchema = z.object({
  bucketName: z.literal(CONTROL_BUCKET),
  objectName: z.string().min(1).max(1_024)
    .refine((value) => !value.startsWith('/'))
    .refine((value) => !value.includes('..') && !value.includes('\\')),
  generation: z.string().regex(/^[1-9][0-9]{0,30}$/u),
  etag: z.string().trim().min(1).max(512),
  byteLength: positiveInteger.max(MAXIMUM_RECORD_BYTES),
  sha256: rawSha256,
}).strict()
const projectionSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_PRODUCTION_CAPSULE_BUILD_INPUT_VERSION,
  ),
  source: z.literal('canonical_sam3_1_production_capsule_build_input_owner'),
  status: z.literal('ready_for_two_independent_cloud_builds'),
  sourceCheckpointQualificationRef: qualificationRefSchema,
  sourceQualificationCapsuleManifestRef: refSchema,
  artifactBindingRef: refSchema,
  sourceQualificationCapsuleCoordinate: z.object({
    projectId: z.literal(PROJECT_ID),
    bucketName: z.literal(
      'reeditpro-production-reeditpro-image-build-inputs',
    ),
    objectName: z.string().min(1).max(1_024)
      .refine((value) => value.startsWith(
        'private/image-build-inputs/sam3_1/qualification/reproducibility/',
      ))
      .refine((value) => value.endsWith('.tar.gz'))
      .refine((value) => !value.includes('..')
        && !value.includes('\\')
        && !value.includes('//')),
    generation: z.string().regex(/^[1-9][0-9]{0,30}$/u),
    etag: z.string().trim().min(1).max(512),
    byteLength: positiveInteger.max(8 * 1024 * 1024 * 1024),
    sha256: rawSha256,
    storageContentType: z.literal('application/x-tar'),
    crc32c: z.string().regex(/^[A-Za-z0-9+/]+={0,2}$/u),
    md5Hash: z.string().regex(/^[A-Za-z0-9+/]+={0,2}$/u),
  }).strict(),
  sourceCapsuleManifestRecord: recordCoordinateSchema,
  qualificationReleaseRecord: recordCoordinateSchema,
  artifactBindingRecord: recordCoordinateSchema,
  canonicalReleaseManifestIngestAndBindingReread: z.literal(true),
  callerPathUrlCommandImageTagBuildArgumentOrGpuAccepted: z.literal(false),
  cloudBuildStarted: z.literal(false),
  imageBuildStarted: z.literal(false),
  modelExecuted: z.literal(false),
  developerMachineModelInstallPerformed: z.literal(false),
  customerCreditsMutated: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

export type CanonicalSam31ProductionCapsuleBuildInput = z.infer<
  typeof projectionSchema
>

type SourceCapsuleManifestProjection = {
  readonly manifestId: string
  readonly manifestVersion: 1
  readonly manifestHash: string
  readonly candidateRef: { readonly candidateHash: string }
  readonly capsule: { readonly coordinate: unknown }
  readonly securityBoundary: { readonly checkpointBytesIncluded: false }
}

export interface CanonicalSam31ProductionCapsuleManifestReadPort {
  rereadCapsuleManifest(input: {
    readonly manifestRef: z.infer<typeof refSchema>
  }): Promise<SourceCapsuleManifestProjection | null>
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

export interface CanonicalSam31ExactControlRecordReadPort {
  rereadRecord(input: {
    readonly objectName: string
    readonly exactValue: unknown
  }): Promise<z.infer<typeof recordCoordinateSchema> | null>
}

export function createCanonicalSam31ProductionCapsuleBuildInputOwner(input: {
  readonly qualificationReleaseReadPort:
    CanonicalSam31QualificationReleaseObjectReadPort
  readonly ingestReadPort: CanonicalSam31ProductionCapsuleIngestReadPort
  readonly sourceCapsuleManifestReadPort:
    CanonicalSam31ProductionCapsuleManifestReadPort
  readonly imageBuildRepository: CanonicalSam31CloudImageBuildRepository
  readonly controlRecordReadPort: CanonicalSam31ExactControlRecordReadPort
}) {
  assertDependencies(input)
  return Object.freeze({
    schemaVersion: CANONICAL_SAM3_1_PRODUCTION_CAPSULE_BUILD_INPUT_VERSION,
    async prepare(untrusted: unknown): Promise<
      CanonicalSam31ProductionCapsuleBuildInput
    > {
      assertPlainSerializedData(untrusted, 'sam31_production_build_input')
      const request = requestSchema.parse(untrusted)
      const releaseRaw = await input.qualificationReleaseReadPort
        .rereadQualificationRelease({
          sourceCheckpointQualificationRef:
            request.sourceCheckpointQualificationRef,
        })
      if (!releaseRaw) throw notReady('qualification_release_missing')
      const release = assertCanonicalSam31QualificationRelease(releaseRaw)
      if (
        release.status !== 'qualified_for_private_image_build'
        || !release.sourceCheckpointQualificationGranted
        || !release.privateImageBuildReviewEligible
        || release.imageBuildStarted
        || release.runtimeReleaseGranted
        || release.productionReady
      ) throw notReady('qualification_release_not_admissible')

      const ingestRaw = await input.ingestReadPort.rereadPrivateArtifactIngest({
        ingestReceiptRef: release.qualification.ingestReceiptRef,
      })
      if (!ingestRaw) throw notReady('private_artifact_ingest_missing')
      const ingest = assertCanonicalSam31PrivateArtifactIngestReceipt(ingestRaw)
      const candidate = assertCanonicalSam31SourceRuntimeCandidate(
        createCanonicalSam31SourceRuntimeCandidate(),
      )
      const sourceManifestRef = refSchema.parse(
        release.qualification.controlledObservation.dependencyClosureRef,
      )
      const manifest = await input.sourceCapsuleManifestReadPort
        .rereadCapsuleManifest({ manifestRef: sourceManifestRef })
      if (!manifest) throw notReady('source_capsule_manifest_missing')
      const observedManifestRef = refSchema.parse({
        id: manifest.manifestId,
        version: manifest.manifestVersion,
        contentHash: `sha256:${manifest.manifestHash}`,
      })
      if (
        !sameRef(sourceManifestRef, observedManifestRef)
        || manifest.candidateRef.candidateHash !== candidate.candidateHash
        || manifest.securityBoundary.checkpointBytesIncluded
      ) throw notReady('source_capsule_manifest_crossed_qualification')

      const binding = createCanonicalSam31ImageBuildArtifactBinding({
        candidate,
        ingestReceipt: ingest,
        sourceCheckpointQualification: release.qualification,
      })
      const artifactBindingRef =
        await input.imageBuildRepository.persistArtifactBindingCreateOnly({
          binding,
        })
      const bindingReread = await input.imageBuildRepository
        .rereadArtifactBinding({ bindingRef: artifactBindingRef })
      if (!bindingReread || bindingReread.bindingHash !== binding.bindingHash) {
        throw notReady('artifact_binding_reread_changed')
      }

      const releaseObjectName = qualificationReleasePath(
        request.sourceCheckpointQualificationRef.id,
      )
      const manifestObjectName = sourceManifestPath(sourceManifestRef)
      const bindingObjectName = artifactBindingPath(artifactBindingRef)
      const [qualificationReleaseRecord, sourceCapsuleManifestRecord,
        artifactBindingRecord] = await Promise.all([
        input.controlRecordReadPort.rereadRecord({
          objectName: releaseObjectName,
          exactValue: release,
        }),
        input.controlRecordReadPort.rereadRecord({
          objectName: manifestObjectName,
          exactValue: manifest,
        }),
        input.controlRecordReadPort.rereadRecord({
          objectName: bindingObjectName,
          exactValue: binding,
        }),
      ])
      if (
        !qualificationReleaseRecord
        || !sourceCapsuleManifestRecord
        || !artifactBindingRecord
      ) throw notReady('canonical_control_record_missing')

      return projectionSchema.parse({
        schemaVersion: CANONICAL_SAM3_1_PRODUCTION_CAPSULE_BUILD_INPUT_VERSION,
        source: 'canonical_sam3_1_production_capsule_build_input_owner',
        status: 'ready_for_two_independent_cloud_builds',
        sourceCheckpointQualificationRef:
          request.sourceCheckpointQualificationRef,
        sourceQualificationCapsuleManifestRef: sourceManifestRef,
        artifactBindingRef,
        sourceQualificationCapsuleCoordinate: manifest.capsule.coordinate,
        sourceCapsuleManifestRecord,
        qualificationReleaseRecord,
        artifactBindingRecord,
        canonicalReleaseManifestIngestAndBindingReread: true,
        callerPathUrlCommandImageTagBuildArgumentOrGpuAccepted: false,
        cloudBuildStarted: false,
        imageBuildStarted: false,
        modelExecuted: false,
        developerMachineModelInstallPerformed: false,
        customerCreditsMutated: false,
        runtimeReleaseGranted: false,
        productionAuthorityGranted: false,
      })
    },
  })
}

export function createCanonicalSam31GcpProductionCapsuleBuildInputOwner(
  input: { readonly storage?: Storage } = {},
) {
  const storage = input.storage ?? new Storage({ projectId: PROJECT_ID })
  const objectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
    storage,
    bucketName: CONTROL_BUCKET,
  })
  const qualificationRepository =
    createCanonicalSam31QualificationImageAuthorityRepository({ objectPort })
  return createCanonicalSam31ProductionCapsuleBuildInputOwner({
    qualificationReleaseReadPort:
      createCanonicalSam31QualificationReleaseObjectReadPort({ objectPort }),
    ingestReadPort:
      createCanonicalSam31GcpPrivateArtifactIngestRepository({ storage }),
    sourceCapsuleManifestReadPort: qualificationRepository,
    imageBuildRepository: createCanonicalSam31CloudImageBuildRepository({
      objectPort,
    }),
    controlRecordReadPort: createExactControlRecordReadPort(storage),
  })
}

function createExactControlRecordReadPort(
  storage: Storage,
): CanonicalSam31ExactControlRecordReadPort {
  return Object.freeze({
    async rereadRecord(input: {
      readonly objectName: string
      readonly exactValue: unknown
    }) {
      const objectName = z.string().min(1).max(1_024)
        .refine((value) => !value.startsWith('/'))
        .refine((value) => !value.includes('..') && !value.includes('\\'))
        .parse(input.objectName)
      const expected = Buffer.from(stableAuthorityStringify(input.exactValue))
      if (expected.byteLength < 2 || expected.byteLength > MAXIMUM_RECORD_BYTES) {
        throw notReady('canonical_control_record_size_invalid')
      }
      const file = storage.bucket(CONTROL_BUCKET).file(objectName)
      let before: FileMetadata
      let body: Buffer
      try {
        ;[before] = await file.getMetadata()
        ;[body] = await file.download({ validation: 'crc32c' })
      } catch (error) {
        if (cloudErrorCode(error) === 404) return null
        throw error
      }
      const [after] = await file.getMetadata()
      if (
        String(before.generation ?? '') !== String(after.generation ?? '')
        || String(before.etag ?? '') !== String(after.etag ?? '')
        || String(before.generation ?? '').length === 0
        || String(before.etag ?? '').length === 0
        || String(before.contentType ?? '') !== 'application/json'
        || Number(before.size ?? -1) !== body.byteLength
        || !body.equals(expected)
      ) throw notReady('canonical_control_record_reread_changed')
      return recordCoordinateSchema.parse({
        bucketName: CONTROL_BUCKET,
        objectName,
        generation: String(before.generation),
        etag: String(before.etag),
        byteLength: body.byteLength,
        sha256: createHash('sha256').update(body).digest('hex'),
      })
    },
  })
}

function qualificationReleasePath(qualificationId: string): string {
  return 'private/sam3_1/source-checkpoint-qualification/v1/releases/'
    + `${sha256AuthorityValue(safeId.parse(qualificationId))}.json`
}

function sourceManifestPath(ref: z.infer<typeof refSchema>): string {
  const idHash = createHash('sha256').update(ref.id, 'utf8').digest('hex')
  return 'private/sam3_1/qualification-image-build/v1/manifest/'
    + `${idHash}/${ref.contentHash.slice(7)}.json`
}

function artifactBindingPath(ref: z.infer<typeof refSchema>): string {
  return 'private/sam3_1/cloud-image-build/v1/artifact-bindings/'
    + `${ref.contentHash.slice(7)}.json`
}

function sameRef(
  left: z.infer<typeof refSchema>,
  right: z.infer<typeof refSchema>,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function assertDependencies(input: {
  qualificationReleaseReadPort: CanonicalSam31QualificationReleaseObjectReadPort
  ingestReadPort: CanonicalSam31ProductionCapsuleIngestReadPort
  sourceCapsuleManifestReadPort:
    CanonicalSam31ProductionCapsuleManifestReadPort
  imageBuildRepository: CanonicalSam31CloudImageBuildRepository
  controlRecordReadPort: CanonicalSam31ExactControlRecordReadPort
}): void {
  if (
    typeof input.qualificationReleaseReadPort?.rereadQualificationRelease
      !== 'function'
    || typeof input.ingestReadPort?.rereadPrivateArtifactIngest !== 'function'
    || typeof input.sourceCapsuleManifestReadPort?.rereadCapsuleManifest
      !== 'function'
    || typeof input.imageBuildRepository?.persistArtifactBindingCreateOnly
      !== 'function'
    || typeof input.imageBuildRepository?.rereadArtifactBinding !== 'function'
    || typeof input.controlRecordReadPort?.rereadRecord !== 'function'
  ) throw new Error('SAM 3.1 production build input dependencies are invalid.')
}

function notReady(code: string): Error {
  return Object.assign(new Error(code), { code: 'SAM31_TOOL_NOT_READY' })
}

function cloudErrorCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined
  const value = Reflect.get(error, 'code')
  if (typeof value === 'number') return value
  return typeof value === 'string' && /^[0-9]{3}$/u.test(value)
    ? Number(value)
    : undefined
}
