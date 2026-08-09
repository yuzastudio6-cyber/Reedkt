import { createHash } from 'node:crypto'

import { Storage, type FileMetadata } from '@google-cloud/storage'
import { z } from 'zod'

import {
  assertCanonicalSam31VertexImageBuildBinding,
  createCanonicalSam31VertexImageBuildBinding,
} from '../model-artifacts/canonical-sam3_1-vertex-production-build-binding'
import { assertCanonicalSam31PrivateArtifactIngestReceipt } from
  '../model-artifacts/canonical-sam3_1-private-artifact-ingest'
import { createCanonicalGcsSourceAnalysisJsonObjectPort } from
  './canonical-gcs-source-analysis-lifecycle-store'
import { createCanonicalSam31GcpPrivateArtifactIngestRepository } from
  './canonical-sam3_1-private-artifact-ingest-repository'
import { createCanonicalSam31QualificationImageAuthorityRepository } from
  './canonical-sam3_1-qualification-image-authority-runtime'
import {
  CANONICAL_SAM3_1_VERTEX_COMPATIBILITY_QUALIFICATION_VERSION,
  assertCanonicalSam31VertexQualificationRelease,
  canonicalSam31VertexQualificationReleasePath,
  createCanonicalSam31VertexQualificationReleaseObjectReadPort,
  type CanonicalSam31VertexQualificationReleaseObjectReadPort,
} from './canonical-sam3_1-source-checkpoint-qualification-vertex-release-owner'
import { assertPlainSerializedData } from
  './canonical-professional-gpu-job-lifecycle-service'
import { stableAuthorityStringify } from './private-edit-authority-store'

export const CANONICAL_SAM3_1_PRODUCTION_CAPSULE_VERTEX_BUILD_INPUT_VERSION =
  'canonical-sam3_1-production-capsule-build-input-v2' as const

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
  version: positiveInteger,
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
    CANONICAL_SAM3_1_PRODUCTION_CAPSULE_VERTEX_BUILD_INPUT_VERSION,
  ),
  source: z.literal(
    'canonical_sam3_1_production_capsule_vertex_build_input_owner',
  ),
  status: z.literal('ready_for_two_independent_cloud_builds'),
  sourceCheckpointQualificationRef: qualificationRefSchema,
  sourceQualificationCapsuleManifestRef: refSchema.extend({
    version: z.literal(1),
  }).strict(),
  artifactBindingRef: refSchema.extend({ version: z.literal(1) }).strict(),
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
        && !value.includes('\\') && !value.includes('//')),
    generation: z.string().regex(/^[1-9][0-9]{0,30}$/u),
    etag: z.string().trim().min(1).max(512),
    byteLength: positiveInteger.max(8 * 1024 * 1024 * 1024),
    sha256: rawSha256,
    storageContentType: z.enum(['application/gzip', 'application/x-tar']),
    crc32c: z.string().regex(/^[A-Za-z0-9+/]+={0,2}$/u),
    md5Hash: z.string().regex(/^[A-Za-z0-9+/]+={0,2}$/u),
  }).strict(),
  sourceCapsuleManifestRecord: recordCoordinateSchema,
  qualificationReleaseRecord: recordCoordinateSchema,
  artifactBindingRecord: recordCoordinateSchema,
  canonicalVertexReleaseManifestIngestAndBindingReread: z.literal(true),
  legacyBatchRequestResultOrReleaseCastOrRelabelUsed: z.literal(false),
  callerPathUrlCommandImageTagBuildArgumentOrGpuAccepted: z.literal(false),
  cloudBuildStarted: z.literal(false),
  imageBuildStarted: z.literal(false),
  modelExecuted: z.literal(false),
  developerMachineModelInstallPerformed: z.literal(false),
  customerCreditsMutated: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

export type CanonicalSam31ProductionCapsuleVertexBuildInput = z.infer<
  typeof projectionSchema
>

type CapsuleManifest = {
  readonly manifestId: string
  readonly manifestVersion: 1
  readonly manifestHash: string
  readonly candidateRef: { readonly candidateHash: string }
  readonly capsule: { readonly coordinate: unknown }
  readonly securityBoundary: { readonly checkpointBytesIncluded: false }
}

export function createCanonicalSam31ProductionCapsuleVertexBuildInputOwner(
  input: {
    readonly qualificationReleaseReadPort:
      CanonicalSam31VertexQualificationReleaseObjectReadPort
    readonly ingestReadPort: {
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
    readonly sourceCapsuleManifestReadPort: {
      rereadCapsuleManifest(input: {
        readonly manifestRef: z.infer<typeof refSchema>
      }): Promise<CapsuleManifest | null>
    }
    readonly bindingStore: {
      persistAndReread(input: {
        readonly binding: ReturnType<
          typeof createCanonicalSam31VertexImageBuildBinding
        >
      }): Promise<z.infer<typeof refSchema>>
    }
    readonly controlRecordReadPort: {
      rereadRecord(input: {
        readonly objectName: string
        readonly exactValue: unknown
      }): Promise<z.infer<typeof recordCoordinateSchema> | null>
    }
  },
) {
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_PRODUCTION_CAPSULE_VERTEX_BUILD_INPUT_VERSION,
    async prepare(untrusted: unknown): Promise<
      CanonicalSam31ProductionCapsuleVertexBuildInput
    > {
      assertPlainSerializedData(untrusted, 'sam31_vertex_production_input')
      const request = requestSchema.parse(untrusted)
      const releaseRaw = await input.qualificationReleaseReadPort
        .rereadQualificationRelease({
          sourceCheckpointQualificationRef:
            request.sourceCheckpointQualificationRef,
        })
      if (!releaseRaw) throw notReady('vertex_qualification_release_missing')
      const release = assertCanonicalSam31VertexQualificationRelease(
        releaseRaw,
      )
      const ingestRaw = await input.ingestReadPort
        .rereadPrivateArtifactIngest({
          ingestReceiptRef: release.qualification.workerRequest.ingestReceiptRef,
        })
      if (!ingestRaw) throw notReady('private_artifact_ingest_missing')
      const ingest = assertCanonicalSam31PrivateArtifactIngestReceipt(
        ingestRaw,
      )
      if (
        ingest.ingestReceiptHash !==
          release.qualification.ingestReceipt.ingestReceiptHash
        || release.status !== 'qualified_for_private_image_build'
        || !release.sourceCheckpointQualificationGranted
        || !release.privateImageBuildReviewEligible
        || release.imageBuildStarted
        || release.runtimeReleaseGranted
        || release.customerCreditsMutated
        || release.productionReady
      ) throw notReady('vertex_qualification_release_not_admissible')

      const sourceManifestRef = refSchema.parse(
        release.qualification.workerRequest.dependencyClosure.artifactRef,
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
        || manifest.candidateRef.candidateHash !==
          release.qualification.candidate.candidateHash
        || manifest.securityBoundary.checkpointBytesIncluded
      ) throw notReady('source_capsule_crossed_vertex_qualification')

      const binding = createCanonicalSam31VertexImageBuildBinding({ release })
      const artifactBindingRef = await input.bindingStore.persistAndReread({
        binding,
      })
      const releaseObjectName = canonicalSam31VertexQualificationReleasePath(
        release.qualificationId,
      )
      const manifestObjectName = sourceManifestPath(sourceManifestRef)
      const bindingObjectName = bindingPath(artifactBindingRef)
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
      if (!qualificationReleaseRecord || !sourceCapsuleManifestRecord
        || !artifactBindingRecord) {
        throw notReady('canonical_control_record_missing')
      }
      return projectionSchema.parse({
        schemaVersion:
          CANONICAL_SAM3_1_PRODUCTION_CAPSULE_VERTEX_BUILD_INPUT_VERSION,
        source:
          'canonical_sam3_1_production_capsule_vertex_build_input_owner',
        status: 'ready_for_two_independent_cloud_builds',
        sourceCheckpointQualificationRef:
          request.sourceCheckpointQualificationRef,
        sourceQualificationCapsuleManifestRef: sourceManifestRef,
        artifactBindingRef,
        sourceQualificationCapsuleCoordinate: manifest.capsule.coordinate,
        sourceCapsuleManifestRecord,
        qualificationReleaseRecord,
        artifactBindingRecord,
        canonicalVertexReleaseManifestIngestAndBindingReread: true,
        legacyBatchRequestResultOrReleaseCastOrRelabelUsed: false,
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

export function createCanonicalSam31GcpProductionCapsuleVertexBuildInputOwner(
  input: { readonly storage?: Storage } = {},
) {
  const storage = input.storage ?? new Storage({ projectId: PROJECT_ID })
  const objectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
    storage,
    bucketName: CONTROL_BUCKET,
  })
  return createCanonicalSam31ProductionCapsuleVertexBuildInputOwner({
    qualificationReleaseReadPort:
      createCanonicalSam31VertexQualificationReleaseObjectReadPort({
        objectPort,
      }),
    ingestReadPort:
      createCanonicalSam31GcpPrivateArtifactIngestRepository({ storage }),
    sourceCapsuleManifestReadPort:
      createCanonicalSam31QualificationImageAuthorityRepository({
        objectPort,
      }),
    bindingStore: {
      async persistAndReread({ binding }) {
        const parsed = assertCanonicalSam31VertexImageBuildBinding(binding)
        const ref = refSchema.parse({
          id: `sam31-vertex-build-binding-${parsed.bindingHash.slice(0, 24)}`,
          version: 1,
          contentHash: `sha256:${parsed.bindingHash}`,
        })
        const body = Buffer.from(stableAuthorityStringify(parsed), 'utf8')
        await objectPort.createOnly({
          objectPath: bindingPath(ref),
          body,
          contentSha256: createHash('sha256').update(body).digest('hex'),
        })
        const reread = await objectPort.readExact(bindingPath(ref))
        if (!reread || !reread.equals(body)) {
          throw notReady('vertex_artifact_binding_reread_changed')
        }
        assertCanonicalSam31VertexImageBuildBinding(
          JSON.parse(reread.toString('utf8')),
        )
        return ref
      },
    },
    controlRecordReadPort: createExactControlRecordReadPort(storage),
  })
}

function createExactControlRecordReadPort(storage: Storage) {
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

function sourceManifestPath(ref: z.infer<typeof refSchema>) {
  const idHash = createHash('sha256').update(ref.id, 'utf8').digest('hex')
  return 'private/sam3_1/qualification-image-build/v1/manifest/'
    + `${idHash}/${ref.contentHash.slice(7)}.json`
}

function bindingPath(ref: z.infer<typeof refSchema>) {
  return 'private/sam3_1/cloud-image-build/v2/artifact-bindings/'
    + `${ref.contentHash.slice(7)}.json`
}

function sameRef(left: z.infer<typeof refSchema>, right: z.infer<typeof refSchema>) {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function notReady(code: string) {
  return Object.assign(new Error(code), { code: 'SAM31_TOOL_NOT_READY' })
}

function cloudErrorCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined
  const value = Reflect.get(error, 'code')
  if (typeof value === 'number') return value
  return typeof value === 'string' && /^[0-9]{3}$/u.test(value)
    ? Number(value) : undefined
}
