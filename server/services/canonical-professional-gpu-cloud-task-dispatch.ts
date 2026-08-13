import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import {
  canonicalProfessionalGpuFairQueueDurableClaimSchema,
  type CanonicalProfessionalGpuFairQueueDurableClaim,
} from './canonical-professional-gpu-fair-queue-transaction-port'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_BODY_VERSION =
  'canonical-professional-gpu-cloud-task-body-v1' as const
export const CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_SPEC_VERSION =
  'canonical-professional-gpu-cloud-task-spec-v1' as const
export const CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_DISPATCH_RESULT_VERSION =
  'canonical-professional-gpu-cloud-task-dispatch-result-v1' as const
export const CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_QUEUE =
  'weeditpro-professional-gpu-dispatch-v1' as const
export const CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_CONSUMER_PATH =
  '/internal/v1/professional-gpu-queue/claims/consume' as const

const CLOUD_PLATFORM_SCOPE =
  'https://www.googleapis.com/auth/cloud-platform' as const
const CLOUD_TASKS_API_ROOT = 'https://cloudtasks.googleapis.com/v2' as const
const PROJECT_ID = 'reeditpro' as const
const LOCATION = 'us-central1' as const
const API_SERVICE_ACCOUNT =
  'reeditpro-api-sa@reeditpro.iam.gserviceaccount.com' as const
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()

const runtimeConfigSchema = z.object({
  projectId: z.literal(PROJECT_ID),
  location: z.literal(LOCATION),
  queueName: z.literal(CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_QUEUE),
  targetOrigin: z.string().url().max(512).refine((value) => {
    const url = new URL(value)
    return url.protocol === 'https:'
      && url.username === ''
      && url.password === ''
      && url.search === ''
      && url.hash === ''
      && url.pathname === '/'
      && !value.endsWith('/')
      && url.hostname.endsWith('.run.app')
  }),
  oidcServiceAccountEmail: z.literal(API_SERVICE_ACCOUNT),
  oidcAudience: z.string().url().max(512),
  dispatchDeadlineSeconds: z.literal(60),
  callerSelectedQueueTargetServiceAccountOrDeadlineAccepted: z.literal(false),
}).strict().superRefine((config, context) => {
  if (config.oidcAudience !== config.targetOrigin) {
    context.addIssue({
      code: 'custom',
      message: 'GPU Cloud Task OIDC audience must equal the pinned service origin.',
    })
  }
})
export type CanonicalProfessionalGpuCloudTaskRuntimeConfig = z.infer<
  typeof runtimeConfigSchema
>

const bodyWithoutHashSchema = z.object({
  schemaVersion: z.literal(CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_BODY_VERSION),
  source: z.literal('canonical_server_professional_gpu_queue_dispatch'),
  queueId: safeId,
  runtimeRegion: z.literal(LOCATION),
  queueEntryId: safeId,
  claimId: safeId,
  claimHash: sha256,
  executionAttemptRef: evidenceRefSchema,
  databaseRereadRequiredBeforeGpuDispatch: z.literal(true),
  browserOrCallerExecutionMaterialAccepted: z.literal(false),
  automaticNewExecutionAttemptAllowed: z.literal(false),
}).strict()
const bodySchema = bodyWithoutHashSchema.extend({ bodyDigestSha256: sha256 })
  .strict()
export type CanonicalProfessionalGpuCloudTaskBody = z.infer<typeof bodySchema>

const taskSpecWithoutHashSchema = z.object({
  schemaVersion: z.literal(CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_SPEC_VERSION),
  source: z.literal('canonical_server_professional_gpu_queue_dispatch'),
  evidenceClass: z.literal('deterministic_cloud_task_create_request'),
  cloudTaskId: z.string().regex(/^weeditpro-gpu-[a-f0-9]{48}$/u),
  cloudTaskName: z.string().regex(
    /^projects\/reeditpro\/locations\/us-central1\/queues\/weeditpro-professional-gpu-dispatch-v1\/tasks\/weeditpro-gpu-[a-f0-9]{48}$/u,
  ),
  queueResourceName: z.literal(
    'projects/reeditpro/locations/us-central1/queues/weeditpro-professional-gpu-dispatch-v1',
  ),
  targetUrl: z.string().url().max(700),
  oidcServiceAccountEmail: z.literal(API_SERVICE_ACCOUNT),
  oidcAudience: z.string().url().max(512),
  httpMethod: z.literal('POST'),
  contentType: z.literal('application/json'),
  dispatchDeadline: z.literal('60s'),
  body: bodySchema,
  bodyBase64: z.string().min(4).max(16_384),
  claimRef: evidenceRefSchema,
  compiledAt: timestamp,
  deterministicTaskNameAndBody: z.literal(true),
  namedTaskDeduplicationRequired: z.literal(true),
  cloudTasksDeliveryMayRepeatSameAttempt: z.literal(true),
  automaticNewExecutionAttemptAllowed: z.literal(false),
  callerSelectedQueueTargetServiceAccountOrDeadlineAccepted: z.literal(false),
  mediaPromptModelImageCommandPriceOrCredentialPresent: z.literal(false),
  cloudGpuDispatchStarted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict().superRefine((spec, context) => {
  const decoded = Buffer.from(spec.bodyBase64, 'base64').toString('utf8')
  if (decoded !== stableAuthorityStringify(spec.body)
    || spec.targetUrl !==
      `${spec.oidcAudience}${CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_CONSUMER_PATH}`
    || spec.claimRef.id !== spec.body.claimId
    || spec.claimRef.contentHash !== `sha256:${spec.body.claimHash}`) {
    context.addIssue({
      code: 'custom',
      message: 'GPU Cloud Task body, target, or claim lineage changed.',
    })
  }
})
export const canonicalProfessionalGpuCloudTaskSpecSchema =
  taskSpecWithoutHashSchema.extend({ specDigestSha256: sha256 }).strict()
export type CanonicalProfessionalGpuCloudTaskSpec = z.infer<
  typeof canonicalProfessionalGpuCloudTaskSpecSchema
>

const dispatchResultWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_DISPATCH_RESULT_VERSION,
  ),
  source: z.literal('canonical_google_cloud_tasks_dispatch_port'),
  cloudTaskSpecRef: evidenceRefSchema,
  cloudTaskRef: evidenceRefSchema.nullable(),
  disposition: z.enum([
    'task_created',
    'existing_task_exactly_reconciled',
    'task_rejected_before_creation',
    'task_create_outcome_unknown_requires_reconciliation',
  ]),
  providerOutcome: z.enum(['created', 'not_created', 'unknown']),
  exactTaskRereadAfterAlreadyExists: z.boolean(),
  automaticCreateRetryStarted: z.literal(false),
  automaticNewExecutionAttemptAllowed: z.literal(false),
  cloudGpuDispatchStarted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((result, context) => {
  const created = result.providerOutcome === 'created'
  const reconciled = result.disposition ===
    'existing_task_exactly_reconciled'
  if (created !== (result.cloudTaskRef !== null)
    || reconciled !== result.exactTaskRereadAfterAlreadyExists) {
    context.addIssue({
      code: 'custom',
      message: 'GPU Cloud Task result lost provider-outcome lineage.',
    })
  }
})
export const canonicalProfessionalGpuCloudTaskDispatchResultSchema =
  dispatchResultWithoutHashSchema.extend({ resultDigestSha256: sha256 })
    .strict()
export type CanonicalProfessionalGpuCloudTaskDispatchResult = z.infer<
  typeof canonicalProfessionalGpuCloudTaskDispatchResultSchema
>

type GoogleAuthRequest = Pick<GoogleAuth, 'request'>

export interface CanonicalProfessionalGpuCloudTaskDispatchPort {
  readonly schemaVersion:
    'canonical-professional-gpu-cloud-task-dispatch-port-v1'
  readonly deterministicNamedTask: true
  readonly automaticCreateRetryAllowed: false
  readonly exactGetReconciliationAfterAlreadyExistsRequired: true
  readonly browserOrFrontendAllowed: false
  createOne(
    spec: unknown,
  ): Promise<CanonicalProfessionalGpuCloudTaskDispatchResult>
}

export function createCanonicalProfessionalGpuCloudTaskRuntimeConfig(input: {
  readonly targetOrigin: string
}): CanonicalProfessionalGpuCloudTaskRuntimeConfig {
  return Object.freeze(runtimeConfigSchema.parse({
    projectId: PROJECT_ID,
    location: LOCATION,
    queueName: CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_QUEUE,
    targetOrigin: input.targetOrigin,
    oidcServiceAccountEmail: API_SERVICE_ACCOUNT,
    oidcAudience: input.targetOrigin,
    dispatchDeadlineSeconds: 60,
    callerSelectedQueueTargetServiceAccountOrDeadlineAccepted: false,
  }))
}

export function compileCanonicalProfessionalGpuCloudTaskSpec(input: {
  readonly claim: unknown
  readonly runtimeConfig: unknown
  readonly compiledAt: string
}): CanonicalProfessionalGpuCloudTaskSpec {
  const clone = clonePlain(input)
  const claim = assertDurableClaim(clone.claim)
  const runtimeConfig = runtimeConfigSchema.parse(clone.runtimeConfig)
  const compiledAt = timestamp.parse(clone.compiledAt)
  const bodyPayload = bodyWithoutHashSchema.parse({
    schemaVersion: CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_BODY_VERSION,
    source: 'canonical_server_professional_gpu_queue_dispatch',
    queueId: claim.queueId,
    runtimeRegion: claim.runtimeRegion,
    queueEntryId: claim.queueEntry.queueEntryId,
    claimId: claim.claimId,
    claimHash: claim.claimHash,
    executionAttemptRef: claim.queueEntry.executionAttemptRef,
    databaseRereadRequiredBeforeGpuDispatch: true,
    browserOrCallerExecutionMaterialAccepted: false,
    automaticNewExecutionAttemptAllowed: false,
  })
  const body = bodySchema.parse({
    ...bodyPayload,
    bodyDigestSha256: sha256AuthorityValue(bodyPayload),
  })
  const taskSeed = sha256AuthorityValue({
    domain: 'canonical_professional_gpu_cloud_task_name_v1',
    queueId: claim.queueId,
    runtimeRegion: claim.runtimeRegion,
    queueEntryId: claim.queueEntry.queueEntryId,
    claimId: claim.claimId,
    claimHash: claim.claimHash,
    executionAttemptRef: claim.queueEntry.executionAttemptRef,
  })
  const cloudTaskId = `weeditpro-gpu-${taskSeed.slice(0, 48)}`
  const queueResourceName =
    `projects/${runtimeConfig.projectId}/locations/${runtimeConfig.location}`
    + `/queues/${runtimeConfig.queueName}`
  const payload = taskSpecWithoutHashSchema.parse({
    schemaVersion: CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_SPEC_VERSION,
    source: 'canonical_server_professional_gpu_queue_dispatch',
    evidenceClass: 'deterministic_cloud_task_create_request',
    cloudTaskId,
    cloudTaskName: `${queueResourceName}/tasks/${cloudTaskId}`,
    queueResourceName,
    targetUrl:
      `${runtimeConfig.targetOrigin}${CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_CONSUMER_PATH}`,
    oidcServiceAccountEmail: runtimeConfig.oidcServiceAccountEmail,
    oidcAudience: runtimeConfig.oidcAudience,
    httpMethod: 'POST',
    contentType: 'application/json',
    dispatchDeadline: `${runtimeConfig.dispatchDeadlineSeconds}s`,
    body,
    bodyBase64: Buffer.from(stableAuthorityStringify(body), 'utf8')
      .toString('base64'),
    claimRef: ref(claim.claimId, claim.claimHash),
    compiledAt,
    deterministicTaskNameAndBody: true,
    namedTaskDeduplicationRequired: true,
    cloudTasksDeliveryMayRepeatSameAttempt: true,
    automaticNewExecutionAttemptAllowed: false,
    callerSelectedQueueTargetServiceAccountOrDeadlineAccepted: false,
    mediaPromptModelImageCommandPriceOrCredentialPresent: false,
    cloudGpuDispatchStarted: false,
    customerCreditsMutated: false,
    productionAuthorityGranted: false,
  })
  return assertCanonicalProfessionalGpuCloudTaskSpec({
    ...payload,
    specDigestSha256: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalProfessionalGpuCloudTaskSpec(
  value: unknown,
): CanonicalProfessionalGpuCloudTaskSpec {
  const parsed = canonicalProfessionalGpuCloudTaskSpecSchema.parse(
    clonePlain(value),
  )
  const { specDigestSha256, ...payload } = parsed
  if (specDigestSha256 !== sha256AuthorityValue(payload)) {
    throw new TypeError('Professional GPU Cloud Task spec digest changed.')
  }
  const expected = compileExpectedBody(parsed)
  const expectedTaskSeed = sha256AuthorityValue({
    domain: 'canonical_professional_gpu_cloud_task_name_v1',
    queueId: parsed.body.queueId,
    runtimeRegion: parsed.body.runtimeRegion,
    queueEntryId: parsed.body.queueEntryId,
    claimId: parsed.body.claimId,
    claimHash: parsed.body.claimHash,
    executionAttemptRef: parsed.body.executionAttemptRef,
  })
  const expectedTaskId = `weeditpro-gpu-${expectedTaskSeed.slice(0, 48)}`
  if (stableAuthorityStringify(expected) !==
      stableAuthorityStringify(parsed.body)
    || parsed.cloudTaskId !== expectedTaskId
    || parsed.cloudTaskName !==
      `${parsed.queueResourceName}/tasks/${expectedTaskId}`) {
    throw new TypeError('Professional GPU Cloud Task body or name changed.')
  }
  return parsed
}

export function assertCanonicalProfessionalGpuCloudTaskDispatchResult(
  value: unknown,
): CanonicalProfessionalGpuCloudTaskDispatchResult {
  const parsed = canonicalProfessionalGpuCloudTaskDispatchResultSchema.parse(
    clonePlain(value),
  )
  const { resultDigestSha256, ...payload } = parsed
  if (resultDigestSha256 !== sha256AuthorityValue(payload)) {
    throw new TypeError('Professional GPU Cloud Task result digest changed.')
  }
  return parsed
}

export function createGoogleCloudProfessionalGpuCloudTaskDispatchPort(input: {
  readonly runtimeConfig: unknown
  readonly auth?: GoogleAuthRequest
  readonly now?: () => string
}): CanonicalProfessionalGpuCloudTaskDispatchPort {
  const runtimeConfig = runtimeConfigSchema.parse(clonePlain(
    input.runtimeConfig,
  ))
  const auth = input.auth ?? new GoogleAuth({ scopes: [CLOUD_PLATFORM_SCOPE] })
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    schemaVersion:
      'canonical-professional-gpu-cloud-task-dispatch-port-v1' as const,
    deterministicNamedTask: true as const,
    automaticCreateRetryAllowed: false as const,
    exactGetReconciliationAfterAlreadyExistsRequired: true as const,
    browserOrFrontendAllowed: false as const,
    async createOne(untrusted: unknown) {
      const spec = assertCanonicalProfessionalGpuCloudTaskSpec(untrusted)
      if (spec.queueResourceName !==
          `projects/${runtimeConfig.projectId}/locations/${runtimeConfig.location}`
          + `/queues/${runtimeConfig.queueName}`
        || spec.targetUrl !==
          `${runtimeConfig.targetOrigin}${CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_CONSUMER_PATH}`
        || spec.oidcAudience !== runtimeConfig.oidcAudience
        || spec.oidcServiceAccountEmail !==
          runtimeConfig.oidcServiceAccountEmail
        || spec.dispatchDeadline !==
          `${runtimeConfig.dispatchDeadlineSeconds}s`) {
        throw new TypeError(
          'Professional GPU Cloud Task differs from the mounted runtime.',
        )
      }
      const collectionUrl = `${CLOUD_TASKS_API_ROOT}/${spec.queueResourceName}/tasks`
      try {
        const response = await auth.request<unknown>({
          url: collectionUrl,
          method: 'POST',
          timeout: 30_000,
          maxRedirects: 0,
          retry: false,
          params: { responseView: 'FULL' },
          data: { task: toApiTask(spec) },
        })
        assertExactApiTask(response.data, spec)
        return result(spec, 'task_created', 'created', false, now())
      } catch (error) {
        if (statusCode(error) === 409) {
          try {
            const response = await auth.request<unknown>({
              url: `${CLOUD_TASKS_API_ROOT}/${spec.cloudTaskName}`,
              method: 'GET',
              timeout: 30_000,
              maxRedirects: 0,
              retry: false,
              params: { responseView: 'FULL' },
            })
            assertExactApiTask(response.data, spec)
            return result(
              spec,
              'existing_task_exactly_reconciled',
              'created',
              true,
              now(),
            )
          } catch {
            return result(
              spec,
              'task_create_outcome_unknown_requires_reconciliation',
              'unknown',
              false,
              now(),
            )
          }
        }
        const status = statusCode(error)
        if (status !== null && status >= 400 && status < 500) {
          return result(
            spec,
            'task_rejected_before_creation',
            'not_created',
            false,
            now(),
          )
        }
        return result(
          spec,
          'task_create_outcome_unknown_requires_reconciliation',
          'unknown',
          false,
          now(),
        )
      }
    },
  })
}

function assertDurableClaim(
  value: unknown,
): CanonicalProfessionalGpuFairQueueDurableClaim {
  const parsed = canonicalProfessionalGpuFairQueueDurableClaimSchema.parse(
    clonePlain(value),
  )
  const { claimHash, ...payload } = parsed
  if (claimHash !== sha256AuthorityValue(payload)) {
    throw new TypeError('Professional GPU durable claim digest changed.')
  }
  if (parsed.runtimeRegion !== LOCATION) {
    throw new TypeError('Professional GPU Cloud Tasks require us-central1.')
  }
  return parsed
}

function compileExpectedBody(
  spec: CanonicalProfessionalGpuCloudTaskSpec,
): CanonicalProfessionalGpuCloudTaskBody {
  const { bodyDigestSha256, ...payload } = spec.body
  if (bodyDigestSha256 !== sha256AuthorityValue(payload)) {
    throw new TypeError('Professional GPU Cloud Task body digest changed.')
  }
  return spec.body
}

function toApiTask(spec: CanonicalProfessionalGpuCloudTaskSpec) {
  return {
    name: spec.cloudTaskName,
    httpRequest: {
      httpMethod: spec.httpMethod,
      url: spec.targetUrl,
      headers: { 'Content-Type': spec.contentType },
      body: spec.bodyBase64,
      oidcToken: {
        serviceAccountEmail: spec.oidcServiceAccountEmail,
        audience: spec.oidcAudience,
      },
    },
    dispatchDeadline: spec.dispatchDeadline,
  }
}

function assertExactApiTask(
  value: unknown,
  spec: CanonicalProfessionalGpuCloudTaskSpec,
): void {
  const task = z.object({
    name: z.literal(spec.cloudTaskName),
    httpRequest: z.object({
      httpMethod: z.literal(spec.httpMethod),
      url: z.literal(spec.targetUrl),
      headers: z.record(z.string(), z.string()),
      body: z.literal(spec.bodyBase64),
      oidcToken: z.object({
        serviceAccountEmail: z.literal(spec.oidcServiceAccountEmail),
        audience: z.literal(spec.oidcAudience),
      }).passthrough(),
    }).passthrough(),
    dispatchDeadline: z.literal(spec.dispatchDeadline),
  }).passthrough().parse(clonePlain(value))
  const contentType = Object.entries(task.httpRequest.headers).find(([key]) =>
    key.toLowerCase() === 'content-type')?.[1]
  if (contentType !== spec.contentType) {
    throw new TypeError('Professional GPU Cloud Task content type changed.')
  }
}

function result(
  spec: CanonicalProfessionalGpuCloudTaskSpec,
  disposition: CanonicalProfessionalGpuCloudTaskDispatchResult['disposition'],
  providerOutcome: CanonicalProfessionalGpuCloudTaskDispatchResult[
    'providerOutcome'
  ],
  exactTaskRereadAfterAlreadyExists: boolean,
  observedAt: string,
): CanonicalProfessionalGpuCloudTaskDispatchResult {
  const created = providerOutcome === 'created'
  const payload = dispatchResultWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_DISPATCH_RESULT_VERSION,
    source: 'canonical_google_cloud_tasks_dispatch_port',
    cloudTaskSpecRef: ref(spec.cloudTaskName, spec.specDigestSha256),
    cloudTaskRef: created
      ? ref(spec.cloudTaskName, sha256AuthorityValue({
        name: spec.cloudTaskName,
        specDigestSha256: spec.specDigestSha256,
      }))
      : null,
    disposition,
    providerOutcome,
    exactTaskRereadAfterAlreadyExists,
    automaticCreateRetryStarted: false,
    automaticNewExecutionAttemptAllowed: false,
    cloudGpuDispatchStarted: false,
    customerCreditsMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    observedAt: timestamp.parse(observedAt),
  })
  return assertCanonicalProfessionalGpuCloudTaskDispatchResult({
    ...payload,
    resultDigestSha256: sha256AuthorityValue(payload),
  })
}

function ref(id: string, hash: string) {
  return evidenceRefSchema.parse({
    id,
    version: 1,
    contentHash: hash.startsWith('sha256:') ? hash : `sha256:${hash}`,
  })
}

function statusCode(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null
  const response = Reflect.get(error, 'response')
  if (!response || typeof response !== 'object') return null
  const status = Reflect.get(response, 'status')
  return typeof status === 'number' && Number.isInteger(status) ? status : null
}

function clonePlain<T>(value: T, seen = new Set<object>(), depth = 0): T {
  if (depth > 24) throw new TypeError('GPU Cloud Task value is too deep.')
  if (value === null || typeof value === 'boolean'
    || (typeof value === 'number' && Number.isFinite(value))
    || typeof value === 'string') return value
  if (!value || typeof value !== 'object' || seen.has(value)) {
    throw new TypeError('GPU Cloud Task value is not serialized data.')
  }
  seen.add(value)
  try {
    if (Array.isArray(value)) {
      if (Object.getPrototypeOf(value) !== Array.prototype
        || value.length > 10_000) {
        throw new TypeError('GPU Cloud Task array is invalid.')
      }
      return value.map((item) => clonePlain(item, seen, depth + 1)) as T
    }
    if (Object.getPrototypeOf(value) !== Object.prototype) {
      throw new TypeError('GPU Cloud Task object is not plain.')
    }
    const result: Record<string, unknown> = {}
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== 'string') {
        throw new TypeError('GPU Cloud Task symbol keys are forbidden.')
      }
      const descriptor = Object.getOwnPropertyDescriptor(value, key)
      if (!descriptor || !('value' in descriptor)) {
        throw new TypeError('GPU Cloud Task accessors are forbidden.')
      }
      result[key] = clonePlain(descriptor.value, seen, depth + 1)
    }
    return result as T
  } finally {
    seen.delete(value)
  }
}
