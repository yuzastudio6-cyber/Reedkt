import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { z } from 'zod'

import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  MS011B_AUTHORIZATION_ID,
  MS011B_COMMONS_METADATA_URL,
  MS011B_WIKIPEDIA_URL,
  ms011bAuthorizationSchema,
  type Ms011bAuthorization,
} from './external-authority'
import { MS011B_EXT002_RUN_IDENTITY } from './external-run-identity'

export const MS011B_EXT002_AUTHORIZATION_ID = 'MS-011B-EXT-002' as const
export const MS011B_EXT002_AUTHORIZATION_FILE_SHA256 =
  '0b5731dc10bc234608768d9387d1f528ca1234195d6076f8623b8cb4f8c51987' as const
export const MS011B_EXT002_COMPILED_REQUEST_TEMPLATE_DIGEST =
  'a9eb612b865f6e1b43de14cc87de986acae0a6bfae1e7189ed173b1e048070fb' as const

const priorAuthorizationSchema = z.object({
  authorizationId: z.literal('MS-011B-EXT-001'),
  status: z.literal('consumed_terminal_unknown_transport_outcome'),
  begunRequests: z.literal(1),
  responseBytes: z.literal(0),
  captureBytes: z.literal(0),
  retries: z.literal(0),
  fallbacks: z.literal(0),
  preserveImmutable: z.literal(true),
  reuseAllowed: z.literal(false),
}).strict()

const reviewedLocalBaselineSchema = z.object({
  implementationCommit: z.literal('7f2b28be861b0a246dbd531dcb1bf9838d1ca000'),
  implementationTree: z.literal('37330705963908e9ea496e7660d5bc6091914852'),
  reviewCandidateCommit: z.literal('63c3f261548b1dfc794ce5080b3f739ef1083d52'),
  reviewCandidateTree: z.literal('254d9d084ded521d88ca66d8c2c34ec0439eacf4'),
  reviewVerdict: z.literal('MS-011B_BLOCKED_BY_ENVIRONMENT'),
  expectedRequestTemplateDigest: z.literal(MS011B_EXT002_COMPILED_REQUEST_TEMPLATE_DIGEST),
}).strict()

const durableIdentityPolicySchema = z.object({
  authorizationRecordIdPrefix: z.literal(MS011B_EXT002_RUN_IDENTITY.authorizationRecordIdPrefix),
  runId: z.literal(MS011B_EXT002_RUN_IDENTITY.runId),
  costEstimateId: z.literal(MS011B_EXT002_RUN_IDENTITY.costEstimateId),
  costEstimateItemIdPrefix: z.literal(MS011B_EXT002_RUN_IDENTITY.costEstimateItemIdPrefix),
  workItemKey: z.literal(MS011B_EXT002_RUN_IDENTITY.workItemKey),
  idempotencyKey: z.literal(MS011B_EXT002_RUN_IDENTITY.idempotencyKey),
  runEventIdPrefix: z.literal(MS011B_EXT002_RUN_IDENTITY.runEventIdPrefix),
  attemptIntentIdPrefix: z.literal(MS011B_EXT002_RUN_IDENTITY.attemptIntentIdPrefix),
  attemptIdPrefix: z.literal(MS011B_EXT002_RUN_IDENTITY.attemptIdPrefix),
  captureIdPrefix: z.literal(MS011B_EXT002_RUN_IDENTITY.captureIdPrefix),
  usageIdPrefix: z.literal(MS011B_EXT002_RUN_IDENTITY.usageIdPrefix),
  costOutcomeId: z.literal(MS011B_EXT002_RUN_IDENTITY.costOutcomeId),
  actualCostRecordId: z.literal(MS011B_EXT002_RUN_IDENTITY.actualCostRecordId),
  reconciliationRecordId: z.literal(MS011B_EXT002_RUN_IDENTITY.reconciliationRecordId),
  resultBindingIdPrefix: z.literal(MS011B_EXT002_RUN_IDENTITY.resultBindingIdPrefix),
  privateEvidenceRootChildPrefix: z.literal(MS011B_EXT002_RUN_IDENTITY.privateEvidenceRootChildPrefix),
  newEvidenceRecordsRequired: z.literal(true),
  reusePriorDurableIdsAllowed: z.literal(false),
  mutationOfPriorRecordsAllowed: z.literal(false),
}).strict()

const envelopeSchema = z.object({
  schemaVersion: z.literal('motion-studio.external-action-authorization.v2'),
  authorizationId: z.literal(MS011B_EXT002_AUTHORIZATION_ID),
  milestone: z.literal('MS-011B'),
  status: z.literal('owner_authorization_required_not_executed'),
  singleUse: z.literal(true),
  purpose: z.string().trim().min(1).max(500),
  acceptedParent: z.unknown(),
  priorAuthorization: priorAuthorizationSchema,
  reviewedLocalBaseline: reviewedLocalBaselineSchema,
  durableIdentityPolicy: durableIdentityPolicySchema,
  requests: z.unknown(),
  limits: z.unknown(),
  networkPolicy: z.unknown(),
  candidateEligibilityPolicy: z.unknown(),
  costPolicy: z.unknown(),
  outputPolicy: z.unknown(),
  retryAndFallbackPolicy: z.unknown(),
  stopConditions: z.unknown(),
  explicitlyExcluded: z.unknown(),
}).strict()

type Ms011bAuthorizationV2Envelope = z.infer<typeof envelopeSchema>

export type Ms011bAuthorizationV2 = Omit<Ms011bAuthorization, 'schemaVersion' | 'authorizationId'> & {
  schemaVersion: 'motion-studio.external-action-authorization.v2'
  authorizationId: typeof MS011B_EXT002_AUTHORIZATION_ID
  priorAuthorization: z.infer<typeof priorAuthorizationSchema>
  reviewedLocalBaseline: z.infer<typeof reviewedLocalBaselineSchema>
  durableIdentityPolicy: z.infer<typeof durableIdentityPolicySchema>
}

export const MS011B_EXT002_COMPILED_REQUEST_TEMPLATE = Object.freeze({
  authorizationId: MS011B_EXT002_AUTHORIZATION_ID,
  singleUse: true,
  exactRequests: [
    { ordinal: 1, method: 'GET', url: MS011B_WIKIPEDIA_URL, maximumResponseBytes: 524_288, allowedContentTypes: ['application/json'] },
    { ordinal: 2, method: 'GET', url: MS011B_COMMONS_METADATA_URL, maximumResponseBytes: 1_048_576, allowedContentTypes: ['application/json'] },
  ],
  derivedRequest: {
    ordinal: 3,
    method: 'GET',
    sourceRequestOrdinal: 2,
    jsonField: 'query.pages[].imageinfo[0].thumburl',
    hostname: 'upload.wikimedia.org',
    maximumResponseBytes: 8_388_608,
    allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
    optional: true,
  },
  limits: {
    maximumHttpRequests: 3,
    maximumAutomaticRetries: 0,
    maximumFallbackRequests: 0,
    maximumBinaryMediaDownloads: 1,
    maximumCapturedResponseBytes: 9_961_472,
    requestTimeoutMilliseconds: 10_000,
    maximumRedirects: 0,
    maximumInternalCostMicros: 250_000,
  },
  output: {
    privateLocalCaptureOnly: true,
    finalAssetRegistrationAllowed: false,
    acceptedTimelineMutationAllowed: false,
    renderAllowed: false,
    exportAllowed: false,
  },
})

export async function loadAndVerifyMs011bExt002Authorization(
  repositoryRoot = process.cwd(),
): Promise<Ms011bAuthorizationV2> {
  const authorityPath = resolve(
    repositoryRoot,
    'tasks/motion-studio/MS-011B/authorization-request-ext-002.json',
  )
  const bytes = await readFile(authorityPath)
  const digest = createHash('sha256').update(bytes).digest('hex')
  if (digest !== MS011B_EXT002_AUTHORIZATION_FILE_SHA256) {
    throw new Error('MS-011B EXT-002 authorization file digest differs from the owner-approved authority.')
  }
  const envelope = envelopeSchema.parse(JSON.parse(bytes.toString('utf8')))
  const common = parseCommonAuthority(envelope)
  const parsed: Ms011bAuthorizationV2 = {
    ...common,
    schemaVersion: envelope.schemaVersion,
    authorizationId: envelope.authorizationId,
    priorAuthorization: envelope.priorAuthorization,
    reviewedLocalBaseline: envelope.reviewedLocalBaseline,
    durableIdentityPolicy: envelope.durableIdentityPolicy,
  }
  if (sha256CanonicalJson(compileAuthorityTemplate(parsed)) !== MS011B_EXT002_COMPILED_REQUEST_TEMPLATE_DIGEST ||
      sha256CanonicalJson(MS011B_EXT002_COMPILED_REQUEST_TEMPLATE) !== MS011B_EXT002_COMPILED_REQUEST_TEMPLATE_DIGEST) {
    throw new Error('MS-011B EXT-002 compiled request template differs from the owner-approved authority.')
  }
  return parsed
}

function parseCommonAuthority(envelope: Ms011bAuthorizationV2Envelope): Ms011bAuthorization {
  return ms011bAuthorizationSchema.parse({
    schemaVersion: 'motion-studio.external-action-authorization.v1',
    authorizationId: MS011B_AUTHORIZATION_ID,
    milestone: envelope.milestone,
    status: envelope.status,
    singleUse: envelope.singleUse,
    purpose: envelope.purpose,
    acceptedParent: envelope.acceptedParent,
    requests: envelope.requests,
    limits: envelope.limits,
    networkPolicy: envelope.networkPolicy,
    candidateEligibilityPolicy: envelope.candidateEligibilityPolicy,
    costPolicy: envelope.costPolicy,
    outputPolicy: envelope.outputPolicy,
    retryAndFallbackPolicy: envelope.retryAndFallbackPolicy,
    stopConditions: envelope.stopConditions,
    explicitlyExcluded: envelope.explicitlyExcluded,
  })
}

function compileAuthorityTemplate(authority: Ms011bAuthorizationV2) {
  const first = authority.requests[0]
  const second = authority.requests[1]
  const third = authority.requests[2]
  return {
    authorizationId: authority.authorizationId,
    singleUse: authority.singleUse,
    exactRequests: [
      { ordinal: first.ordinal, method: first.method, url: first.url, maximumResponseBytes: first.maximumResponseBytes, allowedContentTypes: [...first.allowedContentTypes] },
      { ordinal: second.ordinal, method: second.method, url: second.url, maximumResponseBytes: second.maximumResponseBytes, allowedContentTypes: [...second.allowedContentTypes] },
    ],
    derivedRequest: {
      ordinal: third.ordinal,
      method: third.method,
      sourceRequestOrdinal: third.urlAuthority.sourceRequestOrdinal,
      jsonField: third.urlAuthority.jsonField,
      hostname: third.urlAuthority.hostname,
      maximumResponseBytes: third.maximumResponseBytes,
      allowedContentTypes: [...third.allowedContentTypes],
      optional: third.optionalWhenNoCandidatePasses,
    },
    limits: {
      maximumHttpRequests: authority.limits.maximumHttpRequests,
      maximumAutomaticRetries: authority.limits.maximumAutomaticRetries,
      maximumFallbackRequests: authority.limits.maximumFallbackRequests,
      maximumBinaryMediaDownloads: authority.limits.maximumBinaryMediaDownloads,
      maximumCapturedResponseBytes: authority.limits.maximumCapturedResponseBytes,
      requestTimeoutMilliseconds: authority.limits.requestTimeoutMilliseconds,
      maximumRedirects: authority.limits.maximumRedirects,
      maximumInternalCostMicros: authority.limits.maximumInternalCost.micros,
    },
    output: {
      privateLocalCaptureOnly: authority.outputPolicy.privateLocalCaptureOnly,
      finalAssetRegistrationAllowed: authority.outputPolicy.finalAssetRegistrationAllowed,
      acceptedTimelineMutationAllowed: authority.outputPolicy.acceptedTimelineMutationAllowed,
      renderAllowed: authority.outputPolicy.renderAllowed,
      exportAllowed: authority.outputPolicy.exportAllowed,
    },
  }
}
