import { z } from 'zod'

import {
  CANONICAL_CLOUD_TASK_BODY_LIMIT_BYTES,
  canonicalCloudWorkerDispatchAttemptTaskBodySchema,
} from '../edit-architecture/canonical-cloud-worker-dispatch-handoff-authority'
import { ApiError } from '../errors/api-error'
import type { CanonicalLiveGoogleServiceIdentityVerifier } from
  '../security/canonical-service-identity-verifier'
import {
  createCanonicalPrivateCloudDispatchReceiverService,
} from './canonical-private-cloud-dispatch-receiver-service'
import {
  sha256AuthorityValue,
} from './private-edit-authority-store'
import {
  canonicalCloudDispatchWorkerCompletionEvidenceSchema,
  canonicalCloudDispatchWorkerFailureEvidenceSchema,
  canonicalCloudDispatchWorkerInvocationSchema,
} from '../validation/canonical-cloud-dispatch-outbox-schemas'

export const CANONICAL_CLOUD_DISPATCH_HTTP_ACKNOWLEDGEMENT_VERSION =
  'canonical-cloud-dispatch-http-acknowledgement-v1' as const

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const operation = z.enum([
  'controller_acceptance',
  'worker_acceptance',
  'worker_attempt_start',
  'worker_completion',
  'worker_failure',
  'worker_timeout',
])
const outboxState = z.enum([
  'pending_controller_delivery',
  'controller_identity_accepted',
  'worker_identity_accepted',
  'worker_completion_reconciled',
  'worker_failure_reconciled',
  'worker_timeout_reconciled',
])

const dispatchIntentRequestSchema = z.object({
  dispatchIntentId: identity,
}).strict()

const workerCompletionRequestSchema = z.object({
  dispatchIntentId: identity,
  completionEvidence: canonicalCloudDispatchWorkerCompletionEvidenceSchema,
}).strict()

const workerFailureRequestSchema = z.object({
  dispatchIntentId: identity,
  failureEvidence: canonicalCloudDispatchWorkerFailureEvidenceSchema,
}).strict()

export const canonicalCloudDispatchHttpAcknowledgementSchema = z.object({
  schemaVersion: z.literal(CANONICAL_CLOUD_DISPATCH_HTTP_ACKNOWLEDGEMENT_VERSION),
  operation,
  disposition: identity,
  dispatchIntentId: identity,
  authorityReceiptHash: sha256,
  outboxState: outboxState.nullable(),
  boundaries: z.object({
    exactStrictRequestSchemaRequired: z.literal(true),
    processBoundReceiverResolutionRequired: z.literal(true),
    cryptographicallyVerifiedServiceIdentityRequired: z.literal(true),
    rawAuthorizationHeaderPersisted: z.literal(false),
    rawBearerTokenReturned: z.literal(false),
    rawMediaPromptPathSignedUrlOrCredentialReturned: z.literal(false),
    cloudTaskOrCloudRunCallPerformed: z.literal(false),
    toolOrMediaExecutionStarted: z.literal(false),
    customerCommercialAuthorityIncluded: z.literal(false),
    productionAuthority: z.literal(false),
  }).strict(),
  acknowledgementHash: sha256,
}).strict()

export type CanonicalCloudDispatchHttpAcknowledgement = z.infer<
  typeof canonicalCloudDispatchHttpAcknowledgementSchema
>

type CanonicalPrivateCloudDispatchReceiverService = Pick<
  ReturnType<typeof createCanonicalPrivateCloudDispatchReceiverService>,
  | 'receiveController'
  | 'receiveWorker'
  | 'beginWorkerExecutionAttempt'
  | 'reconcileWorkerCompletion'
  | 'reconcileWorkerFailure'
  | 'reconcileWorkerTimeout'
>

export interface CanonicalCloudDispatchHttpReceiverAuthority {
  receiver: CanonicalPrivateCloudDispatchReceiverService
  controllerIdentityVerifier: CanonicalLiveGoogleServiceIdentityVerifier
  workerIdentityVerifier: CanonicalLiveGoogleServiceIdentityVerifier
}

export interface CanonicalCloudDispatchHttpReceiverResolver {
  resolve(dispatchIntentId: string): Promise<CanonicalCloudDispatchHttpReceiverAuthority>
}

type CanonicalCloudDispatchHttpRequest = {
  authorizationHeader: unknown
  body: unknown
}

export interface CanonicalCloudDispatchHttpReceiverPort {
  receiveController(
    input: CanonicalCloudDispatchHttpRequest,
  ): Promise<CanonicalCloudDispatchHttpAcknowledgement>
  receiveWorker(
    input: CanonicalCloudDispatchHttpRequest,
  ): Promise<CanonicalCloudDispatchHttpAcknowledgement>
  beginWorkerAttempt(
    input: CanonicalCloudDispatchHttpRequest,
  ): Promise<CanonicalCloudDispatchHttpAcknowledgement>
  completeWorkerAttempt(
    input: CanonicalCloudDispatchHttpRequest,
  ): Promise<CanonicalCloudDispatchHttpAcknowledgement>
  failWorkerAttempt(
    input: CanonicalCloudDispatchHttpRequest,
  ): Promise<CanonicalCloudDispatchHttpAcknowledgement>
  timeoutWorkerAttempt(
    input: CanonicalCloudDispatchHttpRequest,
  ): Promise<CanonicalCloudDispatchHttpAcknowledgement>
}

const receiverPortBrands = new WeakSet<object>()

export function createCanonicalCloudDispatchHttpReceiverPort(input: {
  resolver: CanonicalCloudDispatchHttpReceiverResolver
}): CanonicalCloudDispatchHttpReceiverPort {
  if (!input.resolver || typeof input.resolver.resolve !== 'function') {
    throw new ApiError(
      'TOOL_NOT_READY',
      'Canonical cloud dispatch HTTP receiver resolution is unavailable.',
      503,
    )
  }

  const port: CanonicalCloudDispatchHttpReceiverPort = Object.freeze({
    async receiveController(request: CanonicalCloudDispatchHttpRequest) {
      const taskBody = parseBoundedBody(
        canonicalCloudWorkerDispatchAttemptTaskBodySchema,
        request.body,
        CANONICAL_CLOUD_TASK_BODY_LIMIT_BYTES,
      )
      const authority = await resolveAuthority(
        input.resolver,
        taskBody.dispatchIntentId,
      )
      const verifiedIdentity =
        await authority.controllerIdentityVerifier.verifyAuthorizationHeader(
          request.authorizationHeader,
        )
      const result = await authority.receiver.receiveController({
        taskBody,
        verifiedIdentity,
      })
      return acknowledgement({
        operation: 'controller_acceptance',
        disposition: result.disposition,
        dispatchIntentId: taskBody.dispatchIntentId,
        authorityReceiptHash: result.receipt.receiptHash,
        outboxState: result.outboxState,
      })
    },

    async receiveWorker(request: CanonicalCloudDispatchHttpRequest) {
      const invocation = parseBoundedBody(
        canonicalCloudDispatchWorkerInvocationSchema,
        request.body,
      )
      const authority = await resolveAuthority(
        input.resolver,
        invocation.dispatchIntentId,
      )
      const verifiedIdentity =
        await authority.workerIdentityVerifier.verifyAuthorizationHeader(
          request.authorizationHeader,
        )
      const result = await authority.receiver.receiveWorker({
        invocation,
        verifiedIdentity,
      })
      return acknowledgement({
        operation: 'worker_acceptance',
        disposition: result.disposition,
        dispatchIntentId: invocation.dispatchIntentId,
        authorityReceiptHash: result.receipt.receiptHash,
        outboxState: result.outboxState,
      })
    },

    async beginWorkerAttempt(request: CanonicalCloudDispatchHttpRequest) {
      const body = parseBoundedBody(dispatchIntentRequestSchema, request.body)
      const authority = await resolveAuthority(
        input.resolver,
        body.dispatchIntentId,
      )
      const verifiedIdentity =
        await authority.workerIdentityVerifier.verifyAuthorizationHeader(
          request.authorizationHeader,
        )
      const result = await authority.receiver.beginWorkerExecutionAttempt({
        dispatchIntentId: body.dispatchIntentId,
        verifiedIdentity,
      })
      return acknowledgement({
        operation: 'worker_attempt_start',
        disposition: result.disposition,
        dispatchIntentId: body.dispatchIntentId,
        authorityReceiptHash: result.attemptStart.evidenceHash,
        outboxState: null,
      })
    },

    async completeWorkerAttempt(request: CanonicalCloudDispatchHttpRequest) {
      const body = parseBoundedBody(workerCompletionRequestSchema, request.body)
      const authority = await resolveAuthority(
        input.resolver,
        body.dispatchIntentId,
      )
      const verifiedIdentity =
        await authority.workerIdentityVerifier.verifyAuthorizationHeader(
          request.authorizationHeader,
        )
      const result = await authority.receiver.reconcileWorkerCompletion({
        dispatchIntentId: body.dispatchIntentId,
        completionEvidence: body.completionEvidence,
        verifiedIdentity,
      })
      return acknowledgement({
        operation: 'worker_completion',
        disposition: result.disposition,
        dispatchIntentId: body.dispatchIntentId,
        authorityReceiptHash: result.receipt.receiptHash,
        outboxState: result.outboxState,
      })
    },

    async failWorkerAttempt(request: CanonicalCloudDispatchHttpRequest) {
      const body = parseBoundedBody(workerFailureRequestSchema, request.body)
      const authority = await resolveAuthority(
        input.resolver,
        body.dispatchIntentId,
      )
      const verifiedIdentity =
        await authority.workerIdentityVerifier.verifyAuthorizationHeader(
          request.authorizationHeader,
        )
      const result = await authority.receiver.reconcileWorkerFailure({
        dispatchIntentId: body.dispatchIntentId,
        failureEvidence: body.failureEvidence,
        verifiedIdentity,
      })
      return acknowledgement({
        operation: 'worker_failure',
        disposition: result.disposition,
        dispatchIntentId: body.dispatchIntentId,
        authorityReceiptHash: result.receipt.receiptHash,
        outboxState: result.outboxState,
      })
    },

    async timeoutWorkerAttempt(request: CanonicalCloudDispatchHttpRequest) {
      const body = parseBoundedBody(dispatchIntentRequestSchema, request.body)
      const authority = await resolveAuthority(
        input.resolver,
        body.dispatchIntentId,
      )
      const verifiedIdentity =
        await authority.controllerIdentityVerifier.verifyAuthorizationHeader(
          request.authorizationHeader,
        )
      const result = await authority.receiver.reconcileWorkerTimeout({
        dispatchIntentId: body.dispatchIntentId,
        verifiedIdentity,
      })
      return acknowledgement({
        operation: 'worker_timeout',
        disposition: result.disposition,
        dispatchIntentId: body.dispatchIntentId,
        authorityReceiptHash: result.receipt.receiptHash,
        outboxState: result.outboxState,
      })
    },
  })
  receiverPortBrands.add(port)
  return port
}

export function assertCanonicalCloudDispatchHttpReceiverPort(
  value: unknown,
): CanonicalCloudDispatchHttpReceiverPort {
  if (
    !value ||
    typeof value !== 'object' ||
    !receiverPortBrands.has(value as object)
  ) {
    throw new ApiError(
      'TOOL_NOT_READY',
      'Canonical cloud dispatch HTTP receiver capability is unavailable.',
      503,
    )
  }
  return value as CanonicalCloudDispatchHttpReceiverPort
}

async function resolveAuthority(
  resolver: CanonicalCloudDispatchHttpReceiverResolver,
  dispatchIntentId: string,
): Promise<CanonicalCloudDispatchHttpReceiverAuthority> {
  try {
    const resolved = await resolver.resolve(dispatchIntentId)
    if (
      !resolved ||
      typeof resolved !== 'object' ||
      !resolved.receiver ||
      typeof resolved.controllerIdentityVerifier?.verifyAuthorizationHeader !==
        'function' ||
      typeof resolved.workerIdentityVerifier?.verifyAuthorizationHeader !==
        'function'
    ) {
      throw new Error('Receiver authority is incomplete.')
    }
    return resolved
  } catch {
    throw new ApiError(
      'INTERNAL_SERVICE_AUTH_INVALID',
      'Canonical cloud dispatch receiver authority could not be resolved.',
      403,
    )
  }
}

function parseBoundedBody<T>(
  schema: z.ZodType<T>,
  value: unknown,
  maxBytes = 16 * 1_024,
): T {
  try {
    const serialized = JSON.stringify(value)
    if (
      typeof serialized !== 'string' ||
      Buffer.byteLength(serialized, 'utf8') > maxBytes
    ) {
      throw new Error('Request body exceeds its bounded envelope.')
    }
    const parsed = schema.safeParse(value)
    if (!parsed.success) throw new Error('Request body schema is invalid.')
    return parsed.data
  } catch {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Canonical cloud dispatch request body validation failed.',
      400,
    )
  }
}

function acknowledgement(input: {
  operation: z.infer<typeof operation>
  disposition: string
  dispatchIntentId: string
  authorityReceiptHash: string
  outboxState: z.infer<typeof outboxState> | null
}): CanonicalCloudDispatchHttpAcknowledgement {
  const payload = {
    schemaVersion: CANONICAL_CLOUD_DISPATCH_HTTP_ACKNOWLEDGEMENT_VERSION,
    ...input,
    boundaries: {
      exactStrictRequestSchemaRequired: true as const,
      processBoundReceiverResolutionRequired: true as const,
      cryptographicallyVerifiedServiceIdentityRequired: true as const,
      rawAuthorizationHeaderPersisted: false as const,
      rawBearerTokenReturned: false as const,
      rawMediaPromptPathSignedUrlOrCredentialReturned: false as const,
      cloudTaskOrCloudRunCallPerformed: false as const,
      toolOrMediaExecutionStarted: false as const,
      customerCommercialAuthorityIncluded: false as const,
      productionAuthority: false as const,
    },
  }
  return canonicalCloudDispatchHttpAcknowledgementSchema.parse({
    ...payload,
    acknowledgementHash: sha256AuthorityValue(payload),
  })
}
