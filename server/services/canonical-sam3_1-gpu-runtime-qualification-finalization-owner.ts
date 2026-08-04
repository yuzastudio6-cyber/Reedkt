import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  canonicalSam31GpuRuntimeQualificationCompilationAuthorityRef,
  createCanonicalSam31GpuRuntimeQualificationCompilationOwner,
  type CanonicalSam31GpuRuntimeQualificationCompilationAuthority,
} from './canonical-sam3_1-gpu-runtime-qualification-compilation-authority'
import {
  createCanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository,
} from './canonical-sam3_1-gpu-runtime-qualification-component-evidence-repository'
import {
  canonicalSam31GpuRuntimeQualificationEvidenceOwnerRequestSchema,
  createCanonicalSam31GpuRuntimeQualificationEvidenceOwnerFromObjectPort,
  type CanonicalSam31GpuRuntimeQualificationEvidenceOwner,
} from './canonical-sam3_1-gpu-runtime-qualification-evidence-owner'
import {
  createCanonicalSam31GpuRuntimeQualificationEvidenceRepository,
} from './canonical-sam3_1-gpu-runtime-qualification-evidence-repository'
import {
  canonicalSam31GpuRuntimeQualificationEvidenceRef,
  type CanonicalSam31GpuRuntimeQualificationEvidence,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-qualification-evidence'

export const CANONICAL_SAM3_1_GPU_RUNTIME_QUALIFICATION_FINALIZATION_OWNER_VERSION =
  'canonical-sam3_1-gpu-runtime-qualification-finalization-owner-v1' as const

const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..'))
const requestSchema = z.object({
  authorityId: safeId,
  evidenceRequest:
    canonicalSam31GpuRuntimeQualificationEvidenceOwnerRequestSchema,
}).strict()

type CompilationOwner = Readonly<{
  compileAndPersist(input: unknown): Promise<
    CanonicalSam31GpuRuntimeQualificationCompilationAuthority
  >
}>

export interface CanonicalSam31GpuRuntimeQualificationFinalizationOwner {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_GPU_RUNTIME_QUALIFICATION_FINALIZATION_OWNER_VERSION
  readonly evidenceClass:
    'canonical_evidence_then_compilation_authority_exact_reread'
  finalize(input: unknown): Promise<Readonly<{
    evidence: CanonicalSam31GpuRuntimeQualificationEvidence
    evidenceRef: ReturnType<
      typeof canonicalSam31GpuRuntimeQualificationEvidenceRef
    >
    compilationAuthority:
      CanonicalSam31GpuRuntimeQualificationCompilationAuthority
    compilationAuthorityRef: ReturnType<
      typeof canonicalSam31GpuRuntimeQualificationCompilationAuthorityRef
    >
  }>>
}

export function createCanonicalSam31GpuRuntimeQualificationFinalizationOwner(
  input: {
    readonly evidenceOwner:
      CanonicalSam31GpuRuntimeQualificationEvidenceOwner
    readonly compilationOwner: CompilationOwner
  },
): CanonicalSam31GpuRuntimeQualificationFinalizationOwner {
  if (typeof input.evidenceOwner
    ?.compilePersistAndRereadQualificationEvidence !== 'function'
    || typeof input.compilationOwner?.compileAndPersist !== 'function') {
    throw new Error('SAM 3.1 qualification finalization owner is invalid.')
  }
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_GPU_RUNTIME_QUALIFICATION_FINALIZATION_OWNER_VERSION,
    evidenceClass:
      'canonical_evidence_then_compilation_authority_exact_reread' as const,

    async finalize(untrusted: unknown) {
      assertPlainSerializedData(untrusted, 'sam31_gpu_qualification_finalize')
      const request = requestSchema.parse(untrusted)
      const evidence = await input.evidenceOwner
        .compilePersistAndRereadQualificationEvidence(request.evidenceRequest)
      const evidenceRef =
        canonicalSam31GpuRuntimeQualificationEvidenceRef(evidence)
      const compilationAuthority = await input.compilationOwner
        .compileAndPersist({
          authorityId: request.authorityId,
          qualificationEvidenceRef: evidenceRef,
          componentEvidenceRefs:
            request.evidenceRequest.componentEvidenceRefs,
        })
      const compilationAuthorityRef =
        canonicalSam31GpuRuntimeQualificationCompilationAuthorityRef(
          compilationAuthority,
        )
      return Object.freeze({
        evidence,
        evidenceRef,
        compilationAuthority,
        compilationAuthorityRef,
      })
    },
  })
}

export function createCanonicalSam31GcpGpuRuntimeQualificationFinalizationOwner(
  input: { readonly storage?: Storage; readonly now?: () => string } = {},
): CanonicalSam31GpuRuntimeQualificationFinalizationOwner {
  // Immutable cloud resource IDs retain their established pre-rename names.
  const objectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
    storage: input.storage ?? new Storage({ projectId: 'reeditpro' }),
    bucketName: 'reeditpro-production-reeditpro-control-plane-state',
  })
  const evidenceRepository =
    createCanonicalSam31GpuRuntimeQualificationEvidenceRepository({
      objectPort,
    })
  const componentRepository =
    createCanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository({
      objectPort,
    })
  return createCanonicalSam31GpuRuntimeQualificationFinalizationOwner({
    evidenceOwner:
      createCanonicalSam31GpuRuntimeQualificationEvidenceOwnerFromObjectPort({
        objectPort,
        now: input.now,
      }),
    compilationOwner:
      createCanonicalSam31GpuRuntimeQualificationCompilationOwner({
        readPort: {
          rereadQualificationEvidence({ qualificationEvidenceRef }) {
            return evidenceRepository.rereadQualifiedEvidence({
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
      }),
  })
}
