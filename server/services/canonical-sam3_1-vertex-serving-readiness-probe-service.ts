import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_VERTEX_SERVING_READINESS_PROBE_VERSION =
  'canonical-sam3_1-vertex-serving-readiness-probe-v1' as const

const API_ORIGIN = 'https://us-central1-aiplatform.googleapis.com'
const ENDPOINT =
  'projects/reeditpro/locations/us-central1/endpoints/weeditpro-sam31-a100-scale-zero-v1' as const
const PREDICT_URL = `${API_ORIGIN}/v1/${ENDPOINT}:predict` as const
const CLOUD_PLATFORM_SCOPE =
  'https://www.googleapis.com/auth/cloud-platform' as const
const MAXIMUM_SAFE_429_RESPONSES = 96
const DEFAULT_DELAY_MILLISECONDS = 5_000
const DEFAULT_DEADLINE_MILLISECONDS = 300_000
const PROJECT_ID = 'reeditpro' as const
const STATE_BUCKET = 'reeditpro-production-reeditpro-control-plane-state'
const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/v1/sam3_1-vertex-readiness-probes'

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
type Ref = z.infer<typeof refSchema>

const probeWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SERVING_READINESS_PROBE_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_vertex_scale_zero_readiness_owner',
  ),
  readinessProbeId: safeId,
  readinessTriggerRef: refSchema,
  endpointDeploymentRef: refSchema,
  runtimeReleaseRef: refSchema,
  immutableImageDigest: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
  endpointResourceName: z.literal(ENDPOINT),
  requestBodyDigestSha256: sha256,
  predictUrlDigestSha256: sha256,
  disposition: z.literal('ready_for_private_customer_invocation'),
  safeDropped429ResponseCount: z.number().int().nonnegative()
    .max(MAXIMUM_SAFE_429_RESPONSES),
  totalProbeRequestCount: z.number().int().positive()
    .max(MAXIMUM_SAFE_429_RESPONSES + 1),
  serverVersion: z.literal(
    'canonical-sam3_1-vertex-prediction-server-v1',
  ),
  accelerator: z.literal('nvidia_a100_80gb'),
  nvidiaDeviceNodesPresent: z.literal(true),
  checkpointByteLength: z.literal(3_502_755_717),
  checkpointSha256: z.literal(
    '0567debeec80ba4ac6369540c6c248025283cb3ff2b92827509e57e2b3541cb6',
  ),
  exactCheckpointBytesRereadAndHashed: z.literal(true),
  privateCheckpointDownloadPerformedAtReplicaStartup: z.boolean(),
  exactNonCustomerReadinessResponseAccepted: z.literal(true),
  first429ClassifiedDroppedBeforeInferenceOnly: z.literal(true),
  customerInvocationStarted: z.literal(false),
  modelInferenceExecuted: z.literal(false),
  storageReadPerformedAtReplicaStartup: z.boolean(),
  storageWritePerformed: z.literal(false),
  readinessRetryUsedCustomerSpendAuthority: z.literal(false),
  walletOrCreditMutationAuthorityGranted: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  startedAt: timestamp,
  readyObservedAt: timestamp,
}).strict().superRefine((probe, context) => {
  if (
    probe.totalProbeRequestCount !==
      probe.safeDropped429ResponseCount + 1
    || Date.parse(probe.readyObservedAt) < Date.parse(probe.startedAt)
    || probe.privateCheckpointDownloadPerformedAtReplicaStartup !==
      probe.storageReadPerformedAtReplicaStartup
  ) context.addIssue({
    code: 'custom',
    message: 'Vertex readiness-probe sequence changed.',
  })
})
export const canonicalSam31VertexServingReadinessProbeSchema =
  probeWithoutHashSchema.extend({ probeHash: sha256 }).strict()
export type CanonicalSam31VertexServingReadinessProbe = z.infer<
  typeof canonicalSam31VertexServingReadinessProbeSchema
>

export interface CanonicalSam31VertexServingReadinessProbeRepository {
  persistCreateOnly(input: {
    readonly probe: CanonicalSam31VertexServingReadinessProbe
  }): Promise<'created' | 'already_exists'>
  reread(input: {
    readonly readinessProbeId: string
  }): Promise<unknown>
}

export function createCanonicalSam31VertexServingReadinessProbeService(
  input: {
    readonly auth?: Pick<GoogleAuth, 'request'>
    readonly now?: () => string
    readonly clockMilliseconds?: () => number
    readonly wait?: (milliseconds: number) => Promise<void>
    readonly requestTimeoutMilliseconds?: number
    readonly deadlineMilliseconds?: number
    readonly repository: CanonicalSam31VertexServingReadinessProbeRepository
  },
) {
  const auth = input.auth ?? new GoogleAuth({
    scopes: [CLOUD_PLATFORM_SCOPE],
  })
  const now = input.now ?? (() => new Date().toISOString())
  const clock = input.clockMilliseconds ?? (() => Date.now())
  const wait = input.wait ?? ((milliseconds) => new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  }))
  const requestTimeout = input.requestTimeoutMilliseconds ?? 30_000
  const deadline = input.deadlineMilliseconds ?? DEFAULT_DEADLINE_MILLISECONDS
  if (
    !Number.isInteger(requestTimeout)
    || requestTimeout < 1_000
    || requestTimeout > 60_000
    || !Number.isInteger(deadline)
    || deadline < 30_000
    || deadline > DEFAULT_DEADLINE_MILLISECONDS
  ) throw new Error('Vertex readiness-probe timing policy changed.')
  return Object.freeze({
    async warmAndObserve(untrusted: {
      readonly endpointDeploymentRef: Ref
      readonly readinessTriggerRef: Ref
      readonly runtimeReleaseRef: Ref
      readonly immutableImageDigest: string
    }): Promise<CanonicalSam31VertexServingReadinessProbe> {
      assertPlainSerializedData(untrusted, 'sam31_vertex_readiness_probe')
      const request = z.object({
        endpointDeploymentRef: refSchema,
        readinessTriggerRef: refSchema,
        runtimeReleaseRef: refSchema,
        immutableImageDigest: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
      }).strict().parse(untrusted)
      const readinessProbeId = safeId.parse(
        `sam31-a100-readiness-${
          request.readinessTriggerRef.contentHash.slice(7, 39)}`,
      )
      const existing = await input.repository.reread({ readinessProbeId })
      if (existing !== null) {
        const accepted = assertCanonicalSam31VertexServingReadinessProbe(
          existing,
        )
        if (
          accepted.readinessTriggerRef.contentHash !==
            request.readinessTriggerRef.contentHash
          || accepted.endpointDeploymentRef.contentHash !==
            request.endpointDeploymentRef.contentHash
          || accepted.runtimeReleaseRef.contentHash !==
            request.runtimeReleaseRef.contentHash
          || accepted.immutableImageDigest !== request.immutableImageDigest
        ) throw new Error('Vertex readiness-probe replay lineage changed.')
        return accepted
      }
      const body = {
        instances: [{
          readinessProbeId,
          nonCustomerReadinessTrigger: true,
        }],
        parameters: {
          schemaVersion: 'canonical-sam3_1-vertex-readiness-request-v1',
          byteFree: true,
        },
      }
      const startedAt = timestamp.parse(now())
      const deadlineAt = clock() + deadline
      let dropped429Count = 0
      while (clock() <= deadlineAt) {
        try {
          const response = await auth.request({
            url: PREDICT_URL,
            method: 'POST',
            data: body,
            timeout: requestTimeout,
            retry: false,
            maxRedirects: 0,
            responseType: 'json',
            maxContentLength: 64 * 1024,
          })
          const result = parseReadinessResponse(
            response.data,
            readinessProbeId,
          )
          const probe = buildProbe({
            request,
            body,
            result,
            dropped429Count,
            startedAt,
            readyObservedAt: timestamp.parse(now()),
          })
          const persisted = await input.repository.persistCreateOnly({ probe })
          const reread = assertCanonicalSam31VertexServingReadinessProbe(
            await input.repository.reread({ readinessProbeId }),
          )
          if (
            reread.probeHash !== probe.probeHash
            || (persisted === 'already_exists'
              && reread.readinessTriggerRef.contentHash !==
                request.readinessTriggerRef.contentHash)
          ) throw new Error('Vertex readiness-probe exact reread changed.')
          return reread
        } catch (error) {
          if (!isExactSafe429(error)) {
            throw new Error(
              'Vertex readiness outcome is unknown; automatic retry is blocked.',
              { cause: error },
            )
          }
          dropped429Count += 1
          if (
            dropped429Count > MAXIMUM_SAFE_429_RESPONSES
            || clock() + DEFAULT_DELAY_MILLISECONDS > deadlineAt
          ) break
          await wait(DEFAULT_DELAY_MILLISECONDS)
        }
      }
      throw new Error('Vertex endpoint did not become ready within its deadline.')
    },
  })
}

export function createCanonicalSam31VertexServingReadinessProbeRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalSam31VertexServingReadinessProbeRepository {
  const prefix = (input.prefix ?? DEFAULT_PREFIX).replace(/^\/+|\/+$/gu, '')
  if (!prefix || prefix.includes('..') || prefix.includes('\\')) {
    throw new Error('Vertex readiness-probe repository prefix is invalid.')
  }
  return Object.freeze({
    async persistCreateOnly({ probe }: {
      readonly probe: CanonicalSam31VertexServingReadinessProbe
    }) {
      const accepted = assertCanonicalSam31VertexServingReadinessProbe(probe)
      const body = Buffer.from(stableAuthorityStringify(accepted), 'utf8')
      return input.objectPort.createOnly({
        objectPath: probePath(prefix, accepted.readinessProbeId),
        body,
        contentSha256: createHash('sha256').update(body).digest('hex'),
      })
    },
    async reread({ readinessProbeId }: {
      readonly readinessProbeId: string
    }) {
      const body = await input.objectPort.readExact(
        probePath(prefix, safeId.parse(readinessProbeId)),
      )
      if (!body) return null
      let decoded: unknown
      try { decoded = JSON.parse(body.toString('utf8')) } catch {
        throw new Error('Vertex readiness-probe repository JSON is invalid.')
      }
      const accepted = assertCanonicalSam31VertexServingReadinessProbe(decoded)
      if (stableAuthorityStringify(accepted) !== body.toString('utf8')) {
        throw new Error('Vertex readiness-probe repository bytes changed.')
      }
      return structuredClone(accepted)
    },
  })
}

export function createCanonicalGcsSam31VertexServingReadinessProbeRepository(
  input: {
    readonly storage?: Storage
    readonly projectId?: string
    readonly bucketName?: string
    readonly prefix?: string
  } = {},
): CanonicalSam31VertexServingReadinessProbeRepository {
  const projectId = input.projectId ?? PROJECT_ID
  if (projectId !== PROJECT_ID) {
    throw new Error('Vertex readiness-probe repository project changed.')
  }
  return createCanonicalSam31VertexServingReadinessProbeRepository({
    objectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage: input.storage ?? new Storage({ projectId }),
      bucketName: input.bucketName ?? STATE_BUCKET,
    }),
    prefix: input.prefix,
  })
}

export function assertCanonicalSam31VertexServingReadinessProbe(
  value: unknown,
): CanonicalSam31VertexServingReadinessProbe {
  assertPlainSerializedData(value, 'sam31_vertex_serving_readiness_probe')
  const parsed = canonicalSam31VertexServingReadinessProbeSchema.parse(value)
  const { probeHash, ...payload } = parsed
  if (probeHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex readiness-probe digest changed.')
  }
  return parsed
}

function parseReadinessResponse(value: unknown, readinessProbeId: string) {
  return z.object({
    predictions: z.array(z.object({
      schemaVersion: z.literal(
        'canonical-sam3_1-vertex-readiness-result-v1',
      ),
      readinessProbeId: z.literal(readinessProbeId),
      serverVersion: z.literal(
        'canonical-sam3_1-vertex-prediction-server-v1',
      ),
      acceleratorClass: z.literal('nvidia_a100_80gb'),
      nvidiaDeviceNodesPresent: z.literal(true),
      checkpointByteLength: z.literal(3_502_755_717),
      checkpointSha256: z.literal(
        '0567debeec80ba4ac6369540c6c248025283cb3ff2b92827509e57e2b3541cb6',
      ),
      exactCheckpointBytesRereadAndHashed: z.literal(true),
      privateCheckpointDownloadPerformedAtReplicaStartup: z.boolean(),
      readyForCustomerInvocation: z.literal(true),
      customerInvocationStarted: z.literal(false),
      modelInferenceExecuted: z.literal(false),
      storageReadPerformedAtReplicaStartup: z.boolean(),
      storageWritePerformed: z.literal(false),
      customerCreditsMutated: z.literal(false),
      qaApproved: z.literal(false),
      productionAuthorityGranted: z.literal(false),
    }).strict()).length(1),
  }).strict().parse(value).predictions[0]!
}

function buildProbe(input: {
  request: { endpointDeploymentRef: Ref; runtimeReleaseRef: Ref;
    readinessTriggerRef: Ref; immutableImageDigest: string }
  body: unknown
  result: ReturnType<typeof parseReadinessResponse>
  dropped429Count: number
  startedAt: string
  readyObservedAt: string
}): CanonicalSam31VertexServingReadinessProbe {
  const payload = probeWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_VERTEX_SERVING_READINESS_PROBE_VERSION,
    source: 'canonical_server_sam3_1_vertex_scale_zero_readiness_owner',
    readinessProbeId: input.result.readinessProbeId,
    readinessTriggerRef: input.request.readinessTriggerRef,
    endpointDeploymentRef: input.request.endpointDeploymentRef,
    runtimeReleaseRef: input.request.runtimeReleaseRef,
    immutableImageDigest: input.request.immutableImageDigest,
    endpointResourceName: ENDPOINT,
    requestBodyDigestSha256: sha256AuthorityValue(input.body),
    predictUrlDigestSha256: sha256AuthorityValue({ url: PREDICT_URL }),
    disposition: 'ready_for_private_customer_invocation',
    safeDropped429ResponseCount: input.dropped429Count,
    totalProbeRequestCount: input.dropped429Count + 1,
    serverVersion: input.result.serverVersion,
    accelerator: input.result.acceleratorClass,
    nvidiaDeviceNodesPresent: input.result.nvidiaDeviceNodesPresent,
    checkpointByteLength: input.result.checkpointByteLength,
    checkpointSha256: input.result.checkpointSha256,
    exactCheckpointBytesRereadAndHashed:
      input.result.exactCheckpointBytesRereadAndHashed,
    privateCheckpointDownloadPerformedAtReplicaStartup:
      input.result.privateCheckpointDownloadPerformedAtReplicaStartup,
    exactNonCustomerReadinessResponseAccepted: true,
    first429ClassifiedDroppedBeforeInferenceOnly: true,
    customerInvocationStarted: input.result.customerInvocationStarted,
    modelInferenceExecuted: input.result.modelInferenceExecuted,
    storageReadPerformedAtReplicaStartup:
      input.result.storageReadPerformedAtReplicaStartup,
    storageWritePerformed: input.result.storageWritePerformed,
    readinessRetryUsedCustomerSpendAuthority: false,
    walletOrCreditMutationAuthorityGranted: false,
    qaApproved: input.result.qaApproved,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: input.result.productionAuthorityGranted,
    startedAt: input.startedAt,
    readyObservedAt: input.readyObservedAt,
  })
  return canonicalSam31VertexServingReadinessProbeSchema.parse({
    ...payload,
    probeHash: sha256AuthorityValue(payload),
  })
}

function probePath(prefix: string, readinessProbeId: string): string {
  return `${prefix}/${safeId.parse(readinessProbeId)}/probe.json`
}

function isExactSafe429(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false
  const response = (error as { readonly response?: unknown }).response
  if (typeof response !== 'object' || response === null) return false
  const exact = z.object({
    status: z.literal(429),
    data: z.object({
      error: z.object({
        code: z.literal(429),
        status: z.literal('RESOURCE_EXHAUSTED'),
        message: z.string().min(1).max(2_048).refine((message) =>
          /(?:model|endpoint).*(?:not ready|scal(?:e|ing)|unavailable)/iu
            .test(message)),
      }).passthrough(),
    }).passthrough(),
  }).passthrough().safeParse(response)
  return exact.success
}
