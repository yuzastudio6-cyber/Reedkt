import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  assertCanonicalSam31GpuRuntimeQualificationEvidence,
  canonicalSam31GpuRuntimeQualificationEvidenceReadRequestSchema,
  canonicalSam31GpuRuntimeQualificationEvidenceRef,
  canonicalSam31GpuRuntimeQualificationEvidenceReferenceSchema,
  type CanonicalSam31GpuRuntimeQualificationEvidence,
  type CanonicalSam31GpuRuntimeQualificationEvidenceReadPort,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-qualification-evidence'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_GPU_RUNTIME_QUALIFICATION_REPOSITORY_VERSION =
  'canonical-sam3_1-gpu-runtime-qualification-repository-v1' as const

// These immutable cloud resource IDs intentionally retain their established
// pre-WeEditPro rename identity. Changing them would address different GCP
// resources instead of rebranding the product.
const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_STATE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const DEFAULT_PREFIX = 'private/sam3_1/gpu-runtime-qualification/v1'
const MAXIMUM_RECORD_BYTES = 4 * 1024 * 1024
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) =>
    !value.includes('..')
    && !value.includes('//')
    && !value.endsWith('/'))

type QualificationEvidenceRef = z.infer<
  typeof canonicalSam31GpuRuntimeQualificationEvidenceReferenceSchema
>
type QualificationReadRequest = z.infer<
  typeof canonicalSam31GpuRuntimeQualificationEvidenceReadRequestSchema
>

export interface CanonicalSam31GpuRuntimeQualificationEvidenceRepository
  extends CanonicalSam31GpuRuntimeQualificationEvidenceReadPort {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_GPU_RUNTIME_QUALIFICATION_REPOSITORY_VERSION
  readonly evidenceClass: 'private_gcs_create_only_exact_reread'
  persistQualifiedEvidenceCreateOnly(input: {
    readonly evidence: CanonicalSam31GpuRuntimeQualificationEvidence
  }): Promise<QualificationEvidenceRef>
  rereadQualifiedEvidence(input: {
    readonly qualificationEvidenceRef: QualificationEvidenceRef
  }): Promise<CanonicalSam31GpuRuntimeQualificationEvidence | null>
  rereadEvidenceRefExact(input: {
    readonly qualificationEvidenceRef: QualificationEvidenceRef
  }): Promise<CanonicalSam31GpuRuntimeQualificationEvidence | null>
  rereadExact(input: QualificationReadRequest): Promise<
    CanonicalSam31GpuRuntimeQualificationEvidence | null
  >
}

export function createCanonicalSam31GpuRuntimeQualificationEvidenceRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalSam31GpuRuntimeQualificationEvidenceRepository {
  assertObjectPort(input.objectPort)
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  const repository:
  CanonicalSam31GpuRuntimeQualificationEvidenceRepository = {
    schemaVersion:
      CANONICAL_SAM3_1_GPU_RUNTIME_QUALIFICATION_REPOSITORY_VERSION,
    evidenceClass: 'private_gcs_create_only_exact_reread',

    async persistQualifiedEvidenceCreateOnly({ evidence }) {
      const parsed = assertQualifiedEvidence(evidence)
      const ref = canonicalSam31GpuRuntimeQualificationEvidenceRef(parsed)
      await persistExact(
        input.objectPort,
        qualificationPath(prefix, ref),
        parsed,
      )
      return ref
    },

    async rereadQualifiedEvidence(untrusted) {
      assertPlainSerializedData(
        untrusted,
        'sam3_1_gpu_runtime_qualification_reference',
      )
      const request = z.object({
        qualificationEvidenceRef:
          canonicalSam31GpuRuntimeQualificationEvidenceReferenceSchema,
      }).strict().parse(untrusted)
      const evidence = await readEvidence(
        input.objectPort,
        qualificationPath(prefix, request.qualificationEvidenceRef),
      )
      if (!evidence) return null
      if (!sameRef(
        request.qualificationEvidenceRef,
        canonicalSam31GpuRuntimeQualificationEvidenceRef(evidence),
      )) throw conflict('qualification_reference_mismatch')
      return evidence
    },

    async rereadEvidenceRefExact(untrusted) {
      assertPlainSerializedData(
        untrusted,
        'sam3_1_gpu_runtime_qualification_reference',
      )
      const request = z.object({
        qualificationEvidenceRef:
          canonicalSam31GpuRuntimeQualificationEvidenceReferenceSchema,
      }).strict().parse(untrusted)
      const evidence = await readEvidence(
        input.objectPort,
        qualificationPath(prefix, request.qualificationEvidenceRef),
      )
      if (!evidence) return null
      if (!sameRef(
        request.qualificationEvidenceRef,
        canonicalSam31GpuRuntimeQualificationEvidenceRef(evidence),
      )) throw conflict('qualification_reference_mismatch')
      return evidence
    },

    async rereadExact(untrusted) {
      assertPlainSerializedData(
        untrusted,
        'sam3_1_gpu_runtime_qualification_read_request',
      )
      const request =
        canonicalSam31GpuRuntimeQualificationEvidenceReadRequestSchema
          .parse(untrusted)
      const evidence = await readEvidence(
        input.objectPort,
        qualificationPath(prefix, request.qualificationEvidenceRef),
      )
      if (!evidence) return null
      assertExactLineage(evidence, request)
      return evidence
    },
  }
  return Object.freeze(repository)
}

export function createCanonicalSam31GcpGpuRuntimeQualificationEvidenceRepository(
  input: { readonly storage?: Storage } = {},
): CanonicalSam31GpuRuntimeQualificationEvidenceRepository {
  return createCanonicalSam31GpuRuntimeQualificationEvidenceRepository({
    objectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage: input.storage ?? new Storage({ projectId: PROJECT_ID }),
      bucketName: CONTROL_PLANE_STATE_BUCKET,
    }),
  })
}

function assertQualifiedEvidence(
  value: unknown,
): CanonicalSam31GpuRuntimeQualificationEvidence {
  const evidence = assertCanonicalSam31GpuRuntimeQualificationEvidence(value)
  if (
    evidence.evidenceClass !== 'canonical_private_reread'
    || evidence.status !== 'private_runtime_qualification_evidence_ready'
    || !evidence.authority.privateRuntimeQualificationEvidenceReady
    || evidence.authority.gpuJobDispatchAuthorized
    || evidence.authority.customerCreditsMutated
    || evidence.authority.qaApprovalGranted
    || evidence.authority.publicDeliveryAuthorized
    || evidence.authority.productionAuthorityGranted
  ) throw conflict('evidence_not_qualified')
  return evidence
}

function assertExactLineage(
  evidence: CanonicalSam31GpuRuntimeQualificationEvidence,
  request: QualificationReadRequest,
): void {
  if (
    !sameRef(
      canonicalSam31GpuRuntimeQualificationEvidenceRef(evidence),
      request.qualificationEvidenceRef,
    )
    || evidence.candidateRef.schemaVersion !==
      request.candidateRef.schemaVersion
    || evidence.candidateRef.candidateHash !== request.candidateRef.candidateHash
    || !sameRef(
      evidence.privateArtifactIngestReceiptRef,
      request.privateArtifactIngestReceiptRef,
    )
    || !sameRef(
      evidence.sourceCheckpointCompatibilityQualificationRef,
      request.sourceCheckpointCompatibilityQualificationRef,
    )
    || !sameRef(
      evidence.imageSupplyChainReleaseRef,
      request.imageSupplyChainReleaseRef,
    )
    || !sameRef(evidence.serviceIdentityRef, request.serviceIdentityRef)
    || !sameRef(evidence.immutableImageRef, request.immutableImageRef)
    || evidence.immutableImageDigest !== request.immutableImageDigest
    || !sameRef(
      evidence.scaleToZeroConfigurationRef,
      request.scaleToZeroConfigurationRef,
    )
    || !sameRef(
      evidence.privateNetworkAndArtifactTransportRef,
      request.privateNetworkAndArtifactTransportRef,
    )
    || !sameRoute(evidence.route, request.route)
  ) throw conflict('exact_lineage_mismatch')
}

function qualificationPath(
  prefix: string,
  ref: QualificationEvidenceRef,
): string {
  const parsed =
    canonicalSam31GpuRuntimeQualificationEvidenceReferenceSchema.parse(ref)
  const idHash = createHash('sha256').update(parsed.id, 'utf8').digest('hex')
  return `${prefix}/qualified-evidence/${idHash}/`
    + `${parsed.contentHash.slice(7)}.json`
}

async function persistExact(
  port: CanonicalCreateOnlyJsonObjectPort,
  path: string,
  value: CanonicalSam31GpuRuntimeQualificationEvidence,
): Promise<void> {
  const body = recordBody(value)
  const result = await port.createOnly({
    objectPath: path,
    body,
    contentSha256: sha256(body),
  })
  if (result === 'already_exists') {
    const existing = await port.readExact(path)
    if (!existing || !existing.equals(body)) {
      throw conflict('create_only_collision')
    }
  }
  const reread = await port.readExact(path)
  if (!reread || !reread.equals(body)) {
    throw conflict('exact_reread_mismatch')
  }
}

async function readEvidence(
  port: CanonicalCreateOnlyJsonObjectPort,
  path: string,
): Promise<CanonicalSam31GpuRuntimeQualificationEvidence | null> {
  const body = await port.readExact(path)
  if (!body) return null
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw conflict('record_size_invalid')
  }
  let untrusted: unknown
  try {
    untrusted = JSON.parse(body.toString('utf8'))
  } catch {
    throw conflict('record_json_invalid')
  }
  const evidence = assertQualifiedEvidence(untrusted)
  if (!recordBody(evidence).equals(body)) {
    throw conflict('record_not_canonical')
  }
  return evidence
}

function recordBody(value: unknown): Buffer {
  const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw conflict('record_size_invalid')
  }
  return body
}

function sameRef(
  left: QualificationEvidenceRef,
  right: QualificationEvidenceRef,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function sameRoute(
  left: QualificationReadRequest['route'],
  right: QualificationReadRequest['route'],
): boolean {
  return left.routeId === right.routeId
    && left.gpuProfileId === right.gpuProfileId
    && left.runtimeRegion === right.runtimeRegion
    && left.executionTarget === right.executionTarget
    && left.machineType === right.machineType
    && left.accelerator === right.accelerator
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (
    !port
    || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function'
  ) throw conflict('object_port_invalid')
}

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function conflict(gate: string): Error {
  return new Error(
    `SAM 3.1 GPU runtime qualification repository rejected ${gate}.`,
  )
}
