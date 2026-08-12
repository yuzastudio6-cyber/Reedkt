import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSam31VertexServingQualificationPreparation,
  createCanonicalSam31VertexServingQualificationPreparationRef,
  createCanonicalSam31VertexServingQualificationPreparationRepository,
  type CanonicalSam31VertexServingQualificationPreparationRepository,
} from './canonical-sam3_1-vertex-serving-qualification-preparation-service'
import {
  assertCanonicalSam31VertexServingQualificationResult,
  createCanonicalSam31VertexServingQualificationInvocationRepository,
  type CanonicalSam31VertexServingQualificationInvocationRepository,
  type CanonicalSam31VertexServingQualificationResult,
} from './canonical-sam3_1-vertex-serving-qualification-invocation-service'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'
import {
  createCanonicalSam31GcsPrivateOutputRereadPort,
  type CanonicalSam31ServingPrivateOutputRereadPort,
} from '../workers/masks/canonical-sam3_1-gcs-private-output-reader'
import {
  assertCanonicalSam31PrivateOutputRereadEvidence,
  createCanonicalSam31GpuRuntimeResultStoreFromObjectPort,
  type CanonicalSam31GpuRuntimeResultStore,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-result-service'
import {
  assertCanonicalSam31GpuRuntimeResponse,
  canonicalSam31GpuWireStringify,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-contract'
import {
  assertCanonicalSam31GpuTaskRecord,
  createCanonicalSam31GpuTaskStoreFromObjectPort,
  type CanonicalSam31GpuTaskStore,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'

export const CANONICAL_SAM3_1_VERTEX_SERVING_QUALIFICATION_OUTPUT_VERSION =
  'canonical-sam3_1-vertex-serving-qualification-output-v1' as const

const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const PRIVATE_GPU_BUCKET = 'reeditpro-production-reeditpro-masks' as const
const TASK_PREFIX =
  'private/canonical-professional-gpu/sam3_1/v1/invocations'
const RECORD_PREFIX =
  'private/canonical-professional-gpu/v1/sam3_1-vertex-serving-qualification-outputs'
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()

const outputWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SERVING_QUALIFICATION_OUTPUT_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_vertex_serving_qualification_output_owner',
  ),
  evidenceClass: z.literal('canonical_private_exact_output_reread'),
  qualificationId: safeId,
  runOrdinal: z.number().int().min(1).max(30).safe(),
  invocationId: safeId,
  qualificationPreparationRef: refSchema,
  qualificationResultRef: refSchema,
  taskRef: refSchema,
  runtimeResponseRef: refSchema,
  privateOutputRuntimeResponseObjectRef: refSchema,
  privateOutputRereadEvidenceRef: refSchema,
  manifestRef: refSchema,
  maskSequenceArtifactRef: refSchema,
  propagatedFrameCount: z.number().int().positive().max(240).safe(),
  maskFileCount: z.number().int().positive().safe(),
  exactCompletedServingResultAndRuntimeResponseReread: z.literal(true),
  exactManifestAndEveryLosslessMaskReread: z.literal(true),
  everyMaskPngDecodedAndDimensionsVerified: z.literal(true),
  completeApprovedFrameIntervalCoverageVerified: z.literal(true),
  pathsUrlsCredentialsOrMediaBytesIncluded: z.literal(false),
  customerInvocationAuthorized: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  assetManifestMutated: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  verifiedAt: timestamp,
}).strict().superRefine((value, context) => {
  const invocationId = value.invocationId
  if (value.qualificationPreparationRef.id !==
      `sam31-qualification-preparation:${invocationId}`
    || value.qualificationResultRef.id !==
      `sam31-vertex-qualification-result:${invocationId}`
    || value.taskRef.id !== `sam31-task:${invocationId}`
    || value.runtimeResponseRef.id !== `sam31-gpu-response:${invocationId}`
    || value.privateOutputRuntimeResponseObjectRef.id !==
      `sam31-runtime-response:${invocationId}`
    || value.runtimeResponseRef.contentHash !==
      value.privateOutputRuntimeResponseObjectRef.contentHash
    || value.privateOutputRereadEvidenceRef.id !==
      `sam31-private-output-reread:${
        value.privateOutputRuntimeResponseObjectRef.id}`
    || value.manifestRef.contentHash !==
      value.maskSequenceArtifactRef.contentHash
    || value.maskFileCount < value.propagatedFrameCount) {
    context.addIssue({
      code: 'custom',
      message: 'Vertex qualification output receipt lost exact lineage.',
    })
  }
})

export const canonicalSam31VertexServingQualificationOutputSchema =
  outputWithoutHashSchema.extend({ outputHash: sha256 }).strict()
export type CanonicalSam31VertexServingQualificationOutput = z.infer<
  typeof canonicalSam31VertexServingQualificationOutputSchema
>

export interface CanonicalSam31VertexServingQualificationOutputRepository {
  persistCreateOnly(input: {
    readonly output: CanonicalSam31VertexServingQualificationOutput
  }): Promise<'created' | 'already_exists'>
  reread(input: { readonly invocationId: string }): Promise<unknown>
}

export function createCanonicalSam31VertexServingQualificationOutputService(
  input: {
    readonly preparationRepository: Pick<
      CanonicalSam31VertexServingQualificationPreparationRepository,
      'reread'
    >
    readonly invocationRepository: Pick<
      CanonicalSam31VertexServingQualificationInvocationRepository,
      'rereadTerminal'
    >
    readonly taskStore: CanonicalSam31GpuTaskStore
    readonly outputRereadPort: CanonicalSam31ServingPrivateOutputRereadPort
    readonly runtimeResultStore: CanonicalSam31GpuRuntimeResultStore
    readonly repository: CanonicalSam31VertexServingQualificationOutputRepository
    readonly now?: () => string
  },
) {
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    async verifyOne(untrusted: unknown) {
      const request = z.object({ invocationId: safeId }).strict()
        .parse(untrusted)
      const existing = await input.repository.reread(request)
      if (existing !== null) {
        const accepted =
          assertCanonicalSam31VertexServingQualificationOutput(existing)
        if (accepted.invocationId !== request.invocationId) {
          throw new Error('Vertex qualification output replay crossed runs.')
        }
        return accepted
      }
      const preparation =
        assertCanonicalSam31VertexServingQualificationPreparation(
          await input.preparationRepository.reread(request),
        )
      const result = assertCompletedServingResult(
        await input.invocationRepository.rereadTerminal(request),
      )
      const task = assertCanonicalSam31GpuTaskRecord(
        await input.taskStore.rereadTask(request.invocationId),
      )
      const response = assertCanonicalSam31GpuRuntimeResponse({
        request: task.runtimeRequest,
        response: await input.taskStore.rereadRuntimeResponse(
          request.invocationId,
        ),
      })
      assertServingLineage({ preparation, result, task })
      const historical = await input.runtimeResultStore
        .rereadPrivateOutputRereadEvidenceForInvocation(request.invocationId)
      const evidence = historical === null
        ? assertCanonicalSam31PrivateOutputRereadEvidence(
          await input.outputRereadPort.rereadExactServingPrivateOutput({
            task,
            response,
            servingResult: result,
          }),
        )
        : assertCanonicalSam31PrivateOutputRereadEvidence(historical)
      assertEvidenceLineage({ task, response, evidence })
      assertRuntimeResponseRefEquivalence({ result, evidence })
      const evidenceRef = ref(
        `sam31-private-output-reread:${evidence.runtimeResponseObjectRef.id}`,
        evidence.evidenceHash,
      )
      if (historical === null) {
        if (await input.runtimeResultStore
          .persistPrivateOutputRereadEvidenceCreateOnly(
            request.invocationId,
            evidence,
          ) !== 'created') {
          throw new Error('Vertex qualification output evidence collided.')
        }
      }
      const exactEvidence = assertCanonicalSam31PrivateOutputRereadEvidence(
        await input.runtimeResultStore.rereadPrivateOutputRereadEvidence(
          request.invocationId,
          evidenceRef,
        ),
      )
      if (exactEvidence.evidenceHash !== evidence.evidenceHash) {
        throw new Error('Vertex qualification output evidence changed.')
      }
      const payload = outputWithoutHashSchema.parse({
        schemaVersion:
          CANONICAL_SAM3_1_VERTEX_SERVING_QUALIFICATION_OUTPUT_VERSION,
        source:
          'canonical_server_sam3_1_vertex_serving_qualification_output_owner',
        evidenceClass: 'canonical_private_exact_output_reread',
        qualificationId: result.qualificationId,
        runOrdinal: result.runOrdinal,
        invocationId: result.invocationId,
        qualificationPreparationRef: result.qualificationPreparationRef,
        qualificationResultRef: ref(
          `sam31-vertex-qualification-result:${result.invocationId}`,
          result.resultHash,
        ),
        taskRef: evidence.taskRef,
        runtimeResponseRef: result.runtimeResponseRef,
        privateOutputRuntimeResponseObjectRef:
          evidence.runtimeResponseObjectRef,
        privateOutputRereadEvidenceRef: evidenceRef,
        manifestRef: evidence.manifestRef,
        maskSequenceArtifactRef: evidence.maskSequenceArtifactRef,
        propagatedFrameCount: evidence.propagatedFrameCount,
        maskFileCount: evidence.maskFileCount,
        exactCompletedServingResultAndRuntimeResponseReread: true,
        exactManifestAndEveryLosslessMaskReread: true,
        everyMaskPngDecodedAndDimensionsVerified: true,
        completeApprovedFrameIntervalCoverageVerified: true,
        pathsUrlsCredentialsOrMediaBytesIncluded: false,
        customerInvocationAuthorized: false,
        customerCreditsMutated: false,
        qaApproved: false,
        assetManifestMutated: false,
        runtimeReleaseGranted: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
        verifiedAt: timestamp.parse(now()),
      })
      const output = assertCanonicalSam31VertexServingQualificationOutput({
        ...payload,
        outputHash: sha256AuthorityValue(payload),
      })
      if (await input.repository.persistCreateOnly({ output }) !== 'created') {
        throw new Error('Vertex qualification output receipt collided.')
      }
      const reread = assertCanonicalSam31VertexServingQualificationOutput(
        await input.repository.reread(request),
      )
      if (reread.outputHash !== output.outputHash) {
        throw new Error('Vertex qualification output receipt changed.')
      }
      return reread
    },
  })
}

export function createCanonicalSam31VertexServingQualificationOutputRepository(
  input: { readonly objectPort: CanonicalCreateOnlyJsonObjectPort;
    readonly prefix?: string },
): CanonicalSam31VertexServingQualificationOutputRepository {
  const prefix = (input.prefix ?? RECORD_PREFIX).replace(/^\/+|\/+$/gu, '')
  if (!prefix || prefix.includes('..') || prefix.includes('\\')) {
    throw new Error('Vertex qualification output prefix changed.')
  }
  return Object.freeze({
    async persistCreateOnly({ output }: {
      output: CanonicalSam31VertexServingQualificationOutput
    }) {
      const accepted = assertCanonicalSam31VertexServingQualificationOutput(
        output,
      )
      const body = Buffer.from(stableAuthorityStringify(accepted), 'utf8')
      return input.objectPort.createOnly({
        objectPath: `${prefix}/${accepted.invocationId}/output.json`,
        body,
        contentSha256: rawSha256(body),
      })
    },
    async reread({ invocationId }: { invocationId: string }) {
      const acceptedInvocationId = safeId.parse(invocationId)
      const body = await input.objectPort.readExact(
        `${prefix}/${acceptedInvocationId}/output.json`,
      )
      if (!body) return null
      const accepted = assertCanonicalSam31VertexServingQualificationOutput(
        JSON.parse(body.toString('utf8')) as unknown,
      )
      if (accepted.invocationId !== acceptedInvocationId
        || stableAuthorityStringify(accepted) !== body.toString('utf8')) {
        throw new Error('Vertex qualification output bytes changed.')
      }
      return structuredClone(accepted)
    },
  })
}

export function createCanonicalGcpSam31VertexServingQualificationOutputService(
  input: { readonly storage?: Storage; readonly now?: () => string } = {},
) {
  const storage = input.storage ?? new Storage({ projectId: PROJECT_ID })
  const control = createCanonicalGcsSourceAnalysisJsonObjectPort({
    storage,
    bucketName: CONTROL_PLANE_BUCKET,
  })
  const privateGpu = createCanonicalGcsSourceAnalysisJsonObjectPort({
    storage,
    bucketName: PRIVATE_GPU_BUCKET,
    acceptedReadContentTypes: ['application/json', 'application/octet-stream'],
  })
  return createCanonicalSam31VertexServingQualificationOutputService({
    preparationRepository:
      createCanonicalSam31VertexServingQualificationPreparationRepository({
        objectPort: control,
      }),
    invocationRepository:
      createCanonicalSam31VertexServingQualificationInvocationRepository({
        objectPort: control,
      }),
    taskStore: createCanonicalSam31GpuTaskStoreFromObjectPort({
      objectPort: privateGpu,
      prefix: TASK_PREFIX,
    }),
    outputRereadPort: createCanonicalSam31GcsPrivateOutputRereadPort({
      storage,
      projectId: PROJECT_ID,
      bucketName: PRIVATE_GPU_BUCKET,
    }),
    runtimeResultStore: createCanonicalSam31GpuRuntimeResultStoreFromObjectPort({
      objectPort: privateGpu,
      prefix: TASK_PREFIX,
    }),
    repository:
      createCanonicalSam31VertexServingQualificationOutputRepository({
        objectPort: control,
      }),
    now: input.now,
  })
}

export function assertCanonicalSam31VertexServingQualificationOutput(
  value: unknown,
): CanonicalSam31VertexServingQualificationOutput {
  assertPlainSerializedData(value, 'sam31_vertex_serving_qualification_output')
  const parsed = canonicalSam31VertexServingQualificationOutputSchema.parse(
    value,
  )
  const { outputHash, ...payload } = parsed
  if (outputHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex qualification output hash changed.')
  }
  return parsed
}

function assertCompletedServingResult(
  value: unknown,
): CanonicalSam31VertexServingQualificationResult {
  const result = assertCanonicalSam31VertexServingQualificationResult(value)
  if (result.disposition !== 'completed'
    || result.runtimeStatus !== 'completed'
    || result.providerOutcome !== 'executed'
    || result.runtimeResponseRef === null
    || !result.exactPrivateRuntimeResponseReread) {
    throw new Error('Vertex serving result is not output-verifiable.')
  }
  return result
}

function assertServingLineage(input: {
  preparation: ReturnType<
    typeof assertCanonicalSam31VertexServingQualificationPreparation
  >
  result: CanonicalSam31VertexServingQualificationResult
  task: ReturnType<typeof assertCanonicalSam31GpuTaskRecord>
}): void {
  if (input.preparation.invocationId !== input.result.invocationId
    || input.task.invocationId !== input.result.invocationId
    || input.preparation.qualificationId !== input.result.qualificationId
    || input.preparation.runOrdinal !== input.result.runOrdinal
    || stableAuthorityStringify(
      createCanonicalSam31VertexServingQualificationPreparationRef(
        input.preparation,
      ),
    ) !== stableAuthorityStringify(input.result.qualificationPreparationRef)
    || input.task.taskRecordHash !==
      input.preparation.taskRecordRef.contentHash.slice(7)
    || stableAuthorityStringify(input.task.runtimeReleaseRef) !==
      stableAuthorityStringify(input.result.qualificationCandidateRef)) {
    throw new Error('Vertex qualification output lineage changed.')
  }
}

function assertEvidenceLineage(input: {
  task: ReturnType<typeof assertCanonicalSam31GpuTaskRecord>
  response: ReturnType<typeof assertCanonicalSam31GpuRuntimeResponse>
  evidence: ReturnType<typeof assertCanonicalSam31PrivateOutputRereadEvidence>
}): void {
  const output = input.response.outputSummary!
  if (stableAuthorityStringify(input.evidence.taskRef) !==
      stableAuthorityStringify(ref(input.task.taskId,
        input.task.taskRecordHash))
    || input.evidence.runtimeResponseBindingSha256 !==
      input.response.responseBindingSha256
    || input.evidence.runtimeResponseObjectRef.id !==
      `sam31-runtime-response:${input.task.invocationId}`
    || input.evidence.runtimeResponseObjectRef.contentHash !==
      `sha256:${rawSha256(Buffer.from(
        canonicalSam31GpuWireStringify(input.response),
        'utf8',
      ))}`
    || stableAuthorityStringify(input.evidence.manifestRef) !==
      stableAuthorityStringify(output.manifestRef)
    || input.evidence.maskFileCount !== output.losslessMaskPngCount
    || input.evidence.propagatedFrameCount !== output.propagatedFrameCount
    || !input.evidence.exactManifestBytesRereadAndParsed
    || !input.evidence.everyMaskPngByteHashReread
    || !input.evidence.everyMaskPngDecodedDimensionsMatchSource
    || !input.evidence.completeApprovedFrameIntervalCoverageVerified
    || !input.evidence.noUnexpectedFilesOrCrossInvocationArtifacts) {
    throw new Error('Vertex qualification output evidence lineage changed.')
  }
}

function assertRuntimeResponseRefEquivalence(input: {
  result: CanonicalSam31VertexServingQualificationResult
  evidence: ReturnType<typeof assertCanonicalSam31PrivateOutputRereadEvidence>
}): void {
  const servingRef = input.result.runtimeResponseRef!
  const outputRef = input.evidence.runtimeResponseObjectRef
  if (servingRef.id !== `sam31-gpu-response:${input.result.invocationId}`
    || outputRef.id !==
      `sam31-runtime-response:${input.result.invocationId}`
    || servingRef.version !== 1
    || outputRef.version !== 1
    || servingRef.contentHash !== outputRef.contentHash) {
    throw new Error('Vertex qualification runtime response refs diverged.')
  }
}

function ref(id: string, hash: string) {
  return refSchema.parse({ id, version: 1, contentHash: `sha256:${hash}` })
}

function rawSha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
