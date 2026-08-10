import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  assertCanonicalSam31GpuRuntimeQualificationComponentEvidence,
  canonicalSam31GpuRuntimeQualificationComponentEvidenceReferenceSchema,
  canonicalSam31GpuRuntimeQualificationComponentRef,
  createCanonicalSam31GpuRuntimeQualificationCompilationOwner,
  type CanonicalSam31GpuRuntimeQualificationComponentEvidence,
} from './canonical-sam3_1-gpu-runtime-qualification-compilation-authority'
import {
  createCanonicalSam31GpuRuntimeQualificationEvidenceRepository,
} from './canonical-sam3_1-gpu-runtime-qualification-evidence-repository'
import {
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const
CANONICAL_SAM3_1_GPU_RUNTIME_QUALIFICATION_COMPONENT_REPOSITORY_VERSION =
  'canonical-sam3_1-gpu-runtime-qualification-component-repository-v1' as const

// These immutable resource IDs intentionally retain their established cloud
// identity after the WeEditPro product rename.
const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_STATE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const DEFAULT_PREFIX =
  'private/sam3_1/gpu-runtime-qualification/v2/component-evidence'
const MAXIMUM_RECORD_BYTES = 4 * 1024 * 1024
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) =>
    !value.includes('..')
    && !value.includes('//')
    && !value.endsWith('/'))

type ComponentEvidenceRef = z.infer<
  typeof canonicalSam31GpuRuntimeQualificationComponentEvidenceReferenceSchema
>

export interface CanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_GPU_RUNTIME_QUALIFICATION_COMPONENT_REPOSITORY_VERSION
  readonly evidenceClass: 'private_gcs_create_only_exact_reread'
  persistComponentEvidenceCreateOnly(input: {
    readonly componentEvidence:
      CanonicalSam31GpuRuntimeQualificationComponentEvidence
  }): Promise<ComponentEvidenceRef>
  rereadComponentEvidence(input: {
    readonly componentEvidenceRef: ComponentEvidenceRef
  }): Promise<CanonicalSam31GpuRuntimeQualificationComponentEvidence | null>
}

export function createCanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository {
  assertObjectPort(input.objectPort)
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  const repository:
    CanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository = {
    schemaVersion:
      CANONICAL_SAM3_1_GPU_RUNTIME_QUALIFICATION_COMPONENT_REPOSITORY_VERSION,
    evidenceClass: 'private_gcs_create_only_exact_reread' as const,

    async persistComponentEvidenceCreateOnly(untrusted) {
      assertPlainSerializedData(
        untrusted,
        'sam31_gpu_qualification_component_persist',
      )
      const request = z.object({
        componentEvidence: z.unknown(),
      }).strict().parse(untrusted)
      const component =
        assertCanonicalSam31GpuRuntimeQualificationComponentEvidence(
          request.componentEvidence,
        )
      const ref = canonicalSam31GpuRuntimeQualificationComponentRef(component)
      await persistExact(
        input.objectPort,
        componentPath(prefix, component.componentKind, ref),
        component,
      )
      return ref
    },

    async rereadComponentEvidence(untrusted) {
      assertPlainSerializedData(
        untrusted,
        'sam31_gpu_qualification_component_read',
      )
      const request = z.object({
        componentEvidenceRef:
          canonicalSam31GpuRuntimeQualificationComponentEvidenceReferenceSchema,
      }).strict().parse(untrusted)
      const matches = await Promise.all(COMPONENT_KINDS.map(async (kind) => {
        const body = await input.objectPort.readExact(componentPath(
          prefix,
          kind,
          request.componentEvidenceRef,
        ))
        if (!body) return null
        const component = readComponentBody(body)
        if (
          component.componentKind !== kind
          || !sameRef(
            canonicalSam31GpuRuntimeQualificationComponentRef(component),
            request.componentEvidenceRef,
          )
        ) throw conflict('component_reference_mismatch')
        return component
      }))
      const present = matches.filter((value): value is
        CanonicalSam31GpuRuntimeQualificationComponentEvidence =>
        value !== null)
      if (present.length > 1) throw conflict('component_reference_ambiguous')
      return present[0] ?? null
    },
  }
  return Object.freeze(repository)
}

export function createCanonicalSam31GcpGpuRuntimeQualificationComponentEvidenceRepository(
  input: { readonly storage?: Storage } = {},
): CanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository {
  return createCanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository({
    objectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage: input.storage ?? new Storage({ projectId: PROJECT_ID }),
      bucketName: CONTROL_PLANE_STATE_BUCKET,
    }),
  })
}

export function createCanonicalSam31GcpGpuRuntimeQualificationCompilationOwner(
  input: { readonly storage?: Storage } = {},
) {
  const objectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
    storage: input.storage ?? new Storage({ projectId: PROJECT_ID }),
    bucketName: CONTROL_PLANE_STATE_BUCKET,
  })
  const qualificationRepository =
    createCanonicalSam31GpuRuntimeQualificationEvidenceRepository({
      objectPort,
    })
  const componentRepository =
    createCanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository({
      objectPort,
    })
  return createCanonicalSam31GpuRuntimeQualificationCompilationOwner({
    readPort: {
      rereadQualificationEvidence({ qualificationEvidenceRef }) {
        return qualificationRepository.rereadQualifiedEvidence({
          qualificationEvidenceRef,
        })
      },
      rereadComponentEvidence({ componentEvidenceRef }) {
        return componentRepository.rereadComponentEvidence({
          componentEvidenceRef,
        })
      },
    },
    authorityObjectPort: objectPort,
  })
}

const COMPONENT_KINDS = [
  'driver_and_cuda',
  'deterministic_run_set',
  'eight_minute_performance',
  'independent_temporal_quality',
] as const

function componentPath(
  prefix: string,
  kind: CanonicalSam31GpuRuntimeQualificationComponentEvidence[
    'componentKind'
  ],
  ref: ComponentEvidenceRef,
): string {
  const parsed =
    canonicalSam31GpuRuntimeQualificationComponentEvidenceReferenceSchema
      .parse(ref)
  const idHash = createHash('sha256').update(parsed.id, 'utf8').digest('hex')
  return `${prefix}/${kind}/${idHash}/${parsed.contentHash.slice(7)}.json`
}

async function persistExact(
  port: CanonicalCreateOnlyJsonObjectPort,
  path: string,
  value: CanonicalSam31GpuRuntimeQualificationComponentEvidence,
): Promise<void> {
  const body = recordBody(value)
  const result = await port.createOnly({
    objectPath: path,
    body,
    contentSha256: createHash('sha256').update(body).digest('hex'),
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

function readComponentBody(
  body: Buffer,
): CanonicalSam31GpuRuntimeQualificationComponentEvidence {
  if (!Buffer.isBuffer(body)
    || body.byteLength < 2
    || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw conflict('record_size_invalid')
  }
  let untrusted: unknown
  try {
    untrusted = JSON.parse(body.toString('utf8'))
  } catch {
    throw conflict('record_json_invalid')
  }
  const component =
    assertCanonicalSam31GpuRuntimeQualificationComponentEvidence(untrusted)
  if (!recordBody(component).equals(body)) {
    throw conflict('record_not_canonical')
  }
  return component
}

function recordBody(value: unknown): Buffer {
  const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw conflict('record_size_invalid')
  }
  return body
}

function sameRef(left: ComponentEvidenceRef, right: ComponentEvidenceRef) {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (!port
    || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function') {
    throw conflict('object_port_invalid')
  }
}

function conflict(gate: string): Error {
  return new Error(
    `SAM 3.1 GPU qualification component repository rejected ${gate}.`,
  )
}
