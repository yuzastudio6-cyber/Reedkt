import { z } from 'zod'

import {
  VISUAL_INTELLIGENCE_AUTHENTICATED_READ_REQUEST_VERSION,
  VISUAL_INTELLIGENCE_AUTHENTICATED_READ_RESULT_VERSION,
  type VisualIntelligenceAuthenticatedReadRequest,
  type VisualIntelligenceAuthenticatedReadResult,
  type VisualIntelligenceEvidenceRef,
  type VisualIntelligenceRequest,
} from '../../src/types/visual-intelligence'
import { ApiError } from '../errors/api-error'
import type {
  VisualIntelligenceReportRepository,
} from './visual-intelligence-lifecycle-service'
import {
  parseVisualIntelligenceReport,
  visualIntelligenceCanonicalJson,
  visualIntelligenceDigest,
} from './visual-intelligence-contract'

export const VISUAL_INTELLIGENCE_AUTHENTICATED_READ_SERVICE_VERSION =
  'visual-intelligence-authenticated-read-service-v1' as const

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^sha256:[a-f0-9]{64}$/u

const safeIdSchema = z.string().regex(SAFE_ID)
const sha256Schema = z.string().regex(SHA256)
const evidenceRefSchema = z.object({
  id: safeIdSchema,
  version: z.number().int().positive().max(1_000_000),
  contentHash: sha256Schema,
}).strict()
const scopeSchema = z.object({
  ownerUserId: safeIdSchema,
  workspaceId: safeIdSchema,
  projectId: safeIdSchema,
  editSessionId: safeIdSchema,
  approvedSnapshotId: safeIdSchema.nullable(),
}).strict()
const authorityBoundarySchema = z.object({
  operationDispatchAuthority: z.literal(false),
  providerRuntimeAuthority: z.literal(false),
  qaApprovalAuthority: z.literal(false),
  repairExecutionAuthority: z.literal(false),
  timelineMutationAuthority: z.literal(false),
  assetMutationAuthority: z.literal(false),
  creditOrBillingMutationAuthority: z.literal(false),
  exportAuthority: z.literal(false),
  publicDeliveryAuthority: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()

const readRequestSchema = z.object({
  schemaVersion: z.literal(
    VISUAL_INTELLIGENCE_AUTHENTICATED_READ_REQUEST_VERSION,
  ),
  requestId: safeIdSchema,
  requestDigestSha256: sha256Schema,
  scope: scopeSchema,
  reportRef: evidenceRefSchema,
  byteFreeRequest: z.literal(true),
  browserLocalCompletionAccepted: z.literal(false),
}).strict()

const readResultEnvelopeSchema = z.object({
  schemaVersion: z.literal(
    VISUAL_INTELLIGENCE_AUTHENTICATED_READ_RESULT_VERSION,
  ),
  resultDigestSha256: sha256Schema,
  disposition: z.enum(['not_found', 'completed']),
  requestRef: evidenceRefSchema,
  scope: scopeSchema,
  requestedReportRef: evidenceRefSchema,
  report: z.unknown().nullable(),
  authenticatedPrincipalVerified: z.literal(true),
  exactCanonicalScopeReread: z.literal(true),
  immutableReportReread: z.boolean(),
  browserLocalStateUsed: z.literal(false),
  rawProviderPayloadIncluded: z.literal(false),
  mediaBytesIncluded: z.literal(false),
  pathsOrUrlsIncluded: z.literal(false),
  authorityBoundary: authorityBoundarySchema,
}).strict()

export interface VisualIntelligenceAuthenticatedReadService {
  read(input: {
    readonly authenticatedOwnerUserId: string
    readonly request: unknown
  }): Promise<VisualIntelligenceAuthenticatedReadResult>
}

export function createVisualIntelligenceAuthenticatedReadRequest(
  input: Omit<VisualIntelligenceAuthenticatedReadRequest,
    'schemaVersion' | 'requestDigestSha256' | 'byteFreeRequest' |
    'browserLocalCompletionAccepted'>,
): VisualIntelligenceAuthenticatedReadRequest {
  const withoutDigest = {
    schemaVersion:
      VISUAL_INTELLIGENCE_AUTHENTICATED_READ_REQUEST_VERSION,
    requestId: input.requestId,
    scope: input.scope,
    reportRef: input.reportRef,
    byteFreeRequest: true as const,
    browserLocalCompletionAccepted: false as const,
  }
  return parseVisualIntelligenceAuthenticatedReadRequest({
    ...withoutDigest,
    requestDigestSha256: visualIntelligenceDigest(withoutDigest),
  })
}

export function parseVisualIntelligenceAuthenticatedReadRequest(
  value: unknown,
): VisualIntelligenceAuthenticatedReadRequest {
  const request = parse(readRequestSchema, value,
    'visual_intelligence_authenticated_read_request_invalid') as
      VisualIntelligenceAuthenticatedReadRequest
  if (request.requestDigestSha256 !== digestReadRequest(request)) {
    throw invalid('visual_intelligence_authenticated_read_request_digest_mismatch')
  }
  return deepClone(request)
}

export function parseVisualIntelligenceAuthenticatedReadResult(
  value: unknown,
): VisualIntelligenceAuthenticatedReadResult {
  const envelope = parse(readResultEnvelopeSchema, value,
    'visual_intelligence_authenticated_read_result_invalid')
  const report = envelope.report === null
    ? null
    : parseVisualIntelligenceReport(envelope.report)
  const result = {
    ...envelope,
    report,
  } as VisualIntelligenceAuthenticatedReadResult
  const completed = result.disposition === 'completed'
  if (
    completed !== (result.report !== null)
    || completed !== result.immutableReportReread
    || result.resultDigestSha256 !== digestReadResult(result)
    || (result.report && (
      refKey(result.requestedReportRef) !== reportRefKey(result.report)
      || !sameScope(result.scope, result.report.scope)
    ))
  ) throw invalid('visual_intelligence_authenticated_read_result_mismatch')
  return deepClone(result)
}

export function createVisualIntelligenceAuthenticatedReadService(input: {
  readonly reportRepository: Pick<VisualIntelligenceReportRepository,
    'readAcceptedByRef'>
}): VisualIntelligenceAuthenticatedReadService {
  if (!input.reportRepository
    || typeof input.reportRepository.readAcceptedByRef !== 'function') {
    throw notReady('visual_intelligence_report_repository_missing')
  }
  return Object.freeze({
    async read(
      value: Parameters<VisualIntelligenceAuthenticatedReadService['read']>[0],
    ) {
      const request = parseVisualIntelligenceAuthenticatedReadRequest(
        value.request,
      )
      if (value.authenticatedOwnerUserId !== request.scope.ownerUserId) {
        throw new ApiError(
          'WORKSPACE_ACCESS_DENIED',
          'Visual Intelligence report scope does not match the authenticated owner.',
          403,
        )
      }
      const reportValue = await input.reportRepository.readAcceptedByRef(
        request.reportRef,
      )
      const report = reportValue === null
        ? null
        : parseVisualIntelligenceReport(reportValue)
      if (report && (
        refKey(request.reportRef) !== reportRefKey(report)
        || !sameScope(request.scope, report.scope)
      )) throw conflict('visual_intelligence_report_scope_or_ref_mismatch')
      return createReadResult(request, report)
    },
  })
}

function createReadResult(
  request: VisualIntelligenceAuthenticatedReadRequest,
  report: ReturnType<typeof parseVisualIntelligenceReport> | null,
): VisualIntelligenceAuthenticatedReadResult {
  const withoutDigest = {
    schemaVersion: VISUAL_INTELLIGENCE_AUTHENTICATED_READ_RESULT_VERSION,
    disposition: report ? 'completed' as const : 'not_found' as const,
    requestRef: {
      id: `vi-read-${request.requestDigestSha256.slice(7, 39)}`,
      version: 1,
      contentHash: request.requestDigestSha256,
    },
    scope: request.scope,
    requestedReportRef: request.reportRef,
    report,
    authenticatedPrincipalVerified: true as const,
    exactCanonicalScopeReread: true as const,
    immutableReportReread: report !== null,
    browserLocalStateUsed: false as const,
    rawProviderPayloadIncluded: false as const,
    mediaBytesIncluded: false as const,
    pathsOrUrlsIncluded: false as const,
    authorityBoundary: closedAuthorityBoundary(),
  }
  return parseVisualIntelligenceAuthenticatedReadResult({
    ...withoutDigest,
    resultDigestSha256: visualIntelligenceDigest(withoutDigest),
  })
}

function closedAuthorityBoundary() {
  return Object.freeze({
    operationDispatchAuthority: false as const,
    providerRuntimeAuthority: false as const,
    qaApprovalAuthority: false as const,
    repairExecutionAuthority: false as const,
    timelineMutationAuthority: false as const,
    assetMutationAuthority: false as const,
    creditOrBillingMutationAuthority: false as const,
    exportAuthority: false as const,
    publicDeliveryAuthority: false as const,
    productionAuthority: false as const,
  })
}

function digestReadRequest(
  request: VisualIntelligenceAuthenticatedReadRequest,
): string {
  const withoutDigest: Record<string, unknown> = { ...request }
  delete withoutDigest.requestDigestSha256
  return visualIntelligenceDigest(withoutDigest)
}

function digestReadResult(
  result: VisualIntelligenceAuthenticatedReadResult,
): string {
  const withoutDigest: Record<string, unknown> = { ...result }
  delete withoutDigest.resultDigestSha256
  return visualIntelligenceDigest(withoutDigest)
}

function sameScope(
  left: VisualIntelligenceRequest['scope'],
  right: VisualIntelligenceRequest['scope'],
): boolean {
  return left.ownerUserId === right.ownerUserId
    && left.workspaceId === right.workspaceId
    && left.projectId === right.projectId
    && left.editSessionId === right.editSessionId
    && left.approvedSnapshotId === right.approvedSnapshotId
}

function refKey(value: VisualIntelligenceEvidenceRef): string {
  return `${value.id}:${value.version}:${value.contentHash}`
}

function reportRefKey(
  report: ReturnType<typeof parseVisualIntelligenceReport>,
): string {
  return `${report.reportId}:1:${report.reportDigestSha256}`
}

function parse<T>(schema: z.ZodType<T>, value: unknown, gate: string): T {
  try {
    return schema.parse(value)
  } catch (error) {
    throw invalid(gate, error)
  }
}

function deepClone<T>(value: T): T {
  return JSON.parse(visualIntelligenceCanonicalJson(value)) as T
}

function invalid(requiredGate: string, cause?: unknown): ApiError {
  return new ApiError(
    'VALIDATION_FAILED',
    'The Visual Intelligence authenticated reread contract is invalid.',
    400,
    { requiredGate },
    cause === undefined ? {} : { cause },
  )
}

function conflict(requiredGate: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'The immutable Visual Intelligence report did not match the requested scope.',
    409,
    { requiredGate },
  )
}

function notReady(requiredGate: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'The Visual Intelligence authenticated reread service is not ready.',
    503,
    { requiredGate },
  )
}
