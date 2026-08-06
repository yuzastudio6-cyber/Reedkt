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
import { MS011B_EXT005_RUN_IDENTITY } from './external-run-identity'

export const MS011B_EXT005_AUTHORIZATION_ID = 'MS-011B-EXT-005' as const
export const MS011B_EXT005_AUTHORIZATION_FILE_SHA256 =
  '79fe900559d8df467d6d8e4529b524a4981e911fb10452c30e973851871adef0' as const
export const MS011B_EXT005_COMPILED_REQUEST_TEMPLATE_DIGEST =
  'a288da02809ea9ea6ca9662a4a1e2634e8cdde02bf3fcaf34bdcacd04e6e7ddb' as const

const priorAuthorizationExt001Schema = z.object({
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

const priorAuthorizationExt002Schema = z.object({
  authorizationId: z.literal('MS-011B-EXT-002'),
  status: z.literal('consumed_terminal_unknown_transport_outcome'),
  finalVerdict: z.literal('MS-011B_BLOCKED_BY_ENVIRONMENT'),
  begunRequests: z.literal(1),
  responseBytes: z.literal(0),
  captureBytes: z.literal(0),
  retries: z.literal(0),
  fallbacks: z.literal(0),
  incurredInternalCostMicros: z.literal(3_000),
  releasedInternalCostMicros: z.literal(247_000),
  preserveImmutable: z.literal(true),
  reuseAllowed: z.literal(false),
}).strict()

const priorAuthorizationExt003Schema = z.object({
  authorizationId: z.literal('MS-011B-EXT-003'),
  status: z.literal('consumed_terminal_local_transport_defect'),
  finalVerdict: z.literal('MS-011B_REWORK_REQUIRED'),
  begunRequests: z.literal(1),
  responseBytes: z.literal(0),
  captureBytes: z.literal(0),
  retries: z.literal(0),
  fallbacks: z.literal(0),
  incurredInternalCostMicros: z.literal(3_000),
  releasedInternalCostMicros: z.literal(247_000),
  safeConnectionFailureCode: z.literal('unclassified_connection_failure'),
  resolvedAddressFamily: z.literal(4),
  preserveImmutable: z.literal(true),
  reuseAllowed: z.literal(false),
}).strict()

const priorAuthorizationExt004Schema = z.object({
  authorizationId: z.literal('MS-011B-EXT-004'),
  status: z.literal('consumed_terminal_source_content_rejected'),
  finalVerdict: z.literal('MS-011B_REWORK_REQUIRED'),
  begunRequests: z.literal(1),
  responseBytes: z.literal(2_224),
  captureBytes: z.literal(2_224),
  retries: z.literal(0),
  fallbacks: z.literal(0),
  incurredInternalCostMicros: z.literal(4_012),
  releasedInternalCostMicros: z.literal(245_988),
  failureCategory: z.literal('source_content_rejected'),
  preserveImmutable: z.literal(true),
  reuseAllowed: z.literal(false),
}).strict()

const reviewedLocalBaselineSchema = z.object({
  sourceDriftAuditPath: z.literal('tasks/motion-studio/MS-011B/POST_EXT_004_SOURCE_CONTENT_DRIFT_AUDIT.md'),
  ext004ImplementationCommit: z.literal('9dd3a7987e1f084614575c5b2ec1664327603700'),
  ext004ImplementationTree: z.literal('16c26369cfaa0d706c2d4e395389acf3e6c56faf'),
  ext004ResultCommit: z.literal('0d9864354d9f9f796b3038455cf955b97850ff84'),
  ext004ResultTree: z.literal('469bb7d4034aae24fe762b4529720eb2ad501978'),
  finalReviewCommit: z.literal('7c0e4d9cb2f322a9dcfa2d0c70566c6f64915ca8'),
  finalReviewTree: z.literal('f20d3c50a1f0dc46736b811ecaab18990c373c06'),
  finalReviewPath: z.literal('tasks/motion-studio/MS-011B/FINAL_INDEPENDENT_REVIEW_EXT_004.md'),
  finalReviewVerdict: z.literal('MS-011B_REWORK_REQUIRED'),
  expectedRequestTemplateDigest: z.literal(MS011B_EXT005_COMPILED_REQUEST_TEMPLATE_DIGEST),
}).strict()

export const MS011B_EXT005_WIKIPEDIA_CLAIM_CONTRACT = Object.freeze({
  contractVersion: 2,
  subjectTitle: 'Apollo 11',
  requiredExtractPattern: 'first landed humans on the Moon',
  normalizedParaphrase: 'Apollo 11 was the American spaceflight that first landed humans on the Moon.',
  claimClassification: 'widely_reported',
  claimStatus: 'needs_review',
  officialCorroborationRequired: true,
  sourceContentExecutable: false,
} as const)

const claimContractSchema = z.object({
  contractVersion: z.literal(MS011B_EXT005_WIKIPEDIA_CLAIM_CONTRACT.contractVersion),
  subjectTitle: z.literal(MS011B_EXT005_WIKIPEDIA_CLAIM_CONTRACT.subjectTitle),
  requiredExtractPattern: z.literal(MS011B_EXT005_WIKIPEDIA_CLAIM_CONTRACT.requiredExtractPattern),
  normalizedParaphrase: z.literal(MS011B_EXT005_WIKIPEDIA_CLAIM_CONTRACT.normalizedParaphrase),
  claimClassification: z.literal(MS011B_EXT005_WIKIPEDIA_CLAIM_CONTRACT.claimClassification),
  claimStatus: z.literal(MS011B_EXT005_WIKIPEDIA_CLAIM_CONTRACT.claimStatus),
  officialCorroborationRequired: z.literal(true),
  sourceContentExecutable: z.literal(false),
}).strict()

const runtimeCompatibilityPolicySchema = z.object({
  minimumNodeMajor: z.literal(22),
  nativePinnedLookupAllModeTestRequired: z.literal(true),
  allModeLookupResultShape: z.literal('single_validated_address_array'),
  maximumLookupResultsReturnedToHttps: z.literal(1),
  loopbackOnlyRegressionTestRequired: z.literal(true),
}).strict()

const durableIdentityPolicySchema = z.object({
  authorizationRecordIdPrefix: z.literal(MS011B_EXT005_RUN_IDENTITY.authorizationRecordIdPrefix),
  runId: z.literal(MS011B_EXT005_RUN_IDENTITY.runId),
  costEstimateId: z.literal(MS011B_EXT005_RUN_IDENTITY.costEstimateId),
  costEstimateItemIdPrefix: z.literal(MS011B_EXT005_RUN_IDENTITY.costEstimateItemIdPrefix),
  workItemKey: z.literal(MS011B_EXT005_RUN_IDENTITY.workItemKey),
  idempotencyKey: z.literal(MS011B_EXT005_RUN_IDENTITY.idempotencyKey),
  runEventIdPrefix: z.literal(MS011B_EXT005_RUN_IDENTITY.runEventIdPrefix),
  attemptIntentIdPrefix: z.literal(MS011B_EXT005_RUN_IDENTITY.attemptIntentIdPrefix),
  attemptIdPrefix: z.literal(MS011B_EXT005_RUN_IDENTITY.attemptIdPrefix),
  captureIdPrefix: z.literal(MS011B_EXT005_RUN_IDENTITY.captureIdPrefix),
  usageIdPrefix: z.literal(MS011B_EXT005_RUN_IDENTITY.usageIdPrefix),
  costOutcomeId: z.literal(MS011B_EXT005_RUN_IDENTITY.costOutcomeId),
  actualCostRecordId: z.literal(MS011B_EXT005_RUN_IDENTITY.actualCostRecordId),
  reconciliationRecordId: z.literal(MS011B_EXT005_RUN_IDENTITY.reconciliationRecordId),
  resultBindingIdPrefix: z.literal(MS011B_EXT005_RUN_IDENTITY.resultBindingIdPrefix),
  privateEvidenceRootChildPrefix: z.literal(MS011B_EXT005_RUN_IDENTITY.privateEvidenceRootChildPrefix),
  newEvidenceRecordsRequired: z.literal(true),
  reusePriorDurableIdsAllowed: z.literal(false),
  mutationOfPriorRecordsAllowed: z.literal(false),
}).strict()

const limitsSchema = z.object({
  maximumHttpRequests: z.literal(3),
  maximumAutomaticRetries: z.literal(0),
  maximumFallbackRequests: z.literal(0),
  maximumAddressConnectionAttemptsPerHttpRequest: z.literal(1),
  maximumBinaryMediaDownloads: z.literal(1),
  maximumCapturedResponseBytes: z.literal(9_961_472),
  requestTimeoutMilliseconds: z.literal(10_000),
  maximumRedirects: z.literal(0),
  maximumInternalCost: z.object({ currency: z.literal('USD'), micros: z.literal(250_000) }).strict(),
}).strict()

const networkPolicySchema = z.object({
  allowedSchemes: z.tuple([z.literal('https')]).readonly(),
  allowedHostnames: z.tuple([
    z.literal('en.wikipedia.org'),
    z.literal('commons.wikimedia.org'),
    z.literal('upload.wikimedia.org'),
  ]).readonly(),
  allowedPorts: z.tuple([z.literal(443)]).readonly(),
  denyPrivateLinkLocalLoopbackReservedAndMetadataAddresses: z.literal(true),
  resolveAndValidateBeforeConnect: z.literal(true),
  rejectAnyAddressFamilyMismatch: z.literal(true),
  addressSelectionPolicy: z.literal('validate_all_then_prefer_ipv4_single_address_else_ipv6'),
  addressFallbackAllowed: z.literal(false),
  lookupAllModeResultShape: z.literal('single_validated_address_array'),
  revalidateEveryConnection: z.literal(true),
  directPinnedHttpsOnly: z.literal(true),
  proxyOrPacExecutionAllowed: z.literal(false),
  allowBrowserAutomation: z.literal(false),
  allowJavaScriptExecution: z.literal(false),
  allowFollowingSourceLinks: z.literal(false),
  allowAuthentication: z.literal(false),
  allowCookies: z.literal(false),
}).strict()

const safeConnectionFailureCodesSchema = z.tuple([
  z.literal('deadline_exceeded'),
  z.literal('network_unreachable'),
  z.literal('host_unreachable'),
  z.literal('connection_refused'),
  z.literal('connection_reset'),
  z.literal('connection_timed_out'),
  z.literal('socket_broken_pipe'),
  z.literal('local_network_permission_denied'),
  z.literal('tls_certificate_rejected'),
  z.literal('tls_handshake_failed'),
  z.literal('socket_closed'),
  z.literal('unclassified_connection_failure'),
]).readonly()

const transportEvidencePolicySchema = z.object({
  contractVersion: z.literal(2),
  persistResolvedAddress: z.literal(false),
  persistResolvedAddressFamily: z.literal(true),
  persistRawErrorMessage: z.literal(false),
  persistStackTrace: z.literal(false),
  safeConnectionFailureCodes: safeConnectionFailureCodesSchema,
  unknownCodeFallback: z.literal('unclassified_connection_failure'),
  includeInAttemptEvidenceDigest: z.literal(true),
  includeInTerminalEvidenceDigest: z.literal(true),
  includeInSanitizedPrivateResult: z.literal(true),
}).strict()

const retryAndFallbackPolicySchema = z.object({
  automaticRetry: z.literal('forbidden'),
  addressFallback: z.literal('forbidden'),
  manualRetry: z.literal('requires_new_authorization'),
  alternateQuery: z.literal('requires_new_authorization'),
  alternateSource: z.literal('requires_new_authorization'),
  alternateProvider: z.literal('requires_new_authorization'),
  purchase: z.literal('forbidden'),
}).strict()

const envelopeSchema = z.object({
  schemaVersion: z.literal('motion-studio.external-action-authorization.v5'),
  authorizationId: z.literal(MS011B_EXT005_AUTHORIZATION_ID),
  milestone: z.literal('MS-011B'),
  status: z.literal('owner_authorization_required_not_executed'),
  singleUse: z.literal(true),
  purpose: z.string().trim().min(1).max(500),
  acceptedParent: z.unknown(),
  priorAuthorizations: z.tuple([
    priorAuthorizationExt001Schema,
    priorAuthorizationExt002Schema,
    priorAuthorizationExt003Schema,
    priorAuthorizationExt004Schema,
  ]).readonly(),
  reviewedLocalBaseline: reviewedLocalBaselineSchema,
  claimContract: claimContractSchema,
  runtimeCompatibilityPolicy: runtimeCompatibilityPolicySchema,
  durableIdentityPolicy: durableIdentityPolicySchema,
  requests: z.unknown(),
  limits: limitsSchema,
  networkPolicy: networkPolicySchema,
  transportEvidencePolicy: transportEvidencePolicySchema,
  candidateEligibilityPolicy: z.unknown(),
  costPolicy: z.unknown(),
  outputPolicy: z.unknown(),
  retryAndFallbackPolicy: retryAndFallbackPolicySchema,
  stopConditions: z.unknown(),
  explicitlyExcluded: z.unknown(),
}).strict()

type Ms011bAuthorizationV5Envelope = z.infer<typeof envelopeSchema>

export type Ms011bAuthorizationV5 = Omit<Ms011bAuthorization,
  'schemaVersion' | 'authorizationId' | 'limits' | 'networkPolicy' | 'retryAndFallbackPolicy'> & {
    schemaVersion: 'motion-studio.external-action-authorization.v5'
    authorizationId: typeof MS011B_EXT005_AUTHORIZATION_ID
    priorAuthorizations: z.infer<typeof envelopeSchema>['priorAuthorizations']
    reviewedLocalBaseline: z.infer<typeof reviewedLocalBaselineSchema>
    claimContract: z.infer<typeof claimContractSchema>
    runtimeCompatibilityPolicy: z.infer<typeof runtimeCompatibilityPolicySchema>
    durableIdentityPolicy: z.infer<typeof durableIdentityPolicySchema>
    limits: z.infer<typeof limitsSchema>
    networkPolicy: z.infer<typeof networkPolicySchema>
    transportEvidencePolicy: z.infer<typeof transportEvidencePolicySchema>
    retryAndFallbackPolicy: z.infer<typeof retryAndFallbackPolicySchema>
  }

export const MS011B_EXT005_COMPILED_REQUEST_TEMPLATE = Object.freeze({
  authorizationId: MS011B_EXT005_AUTHORIZATION_ID,
  singleUse: true,
  claimContract: MS011B_EXT005_WIKIPEDIA_CLAIM_CONTRACT,
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
    maximumAddressConnectionAttemptsPerHttpRequest: 1,
    maximumBinaryMediaDownloads: 1,
    maximumCapturedResponseBytes: 9_961_472,
    requestTimeoutMilliseconds: 10_000,
    maximumRedirects: 0,
    maximumInternalCostMicros: 250_000,
  },
  network: {
    addressSelectionPolicy: 'validate_all_then_prefer_ipv4_single_address_else_ipv6',
    addressFallbackAllowed: false,
    lookupAllModeResultShape: 'single_validated_address_array',
    directPinnedHttpsOnly: true,
    proxyOrPacExecutionAllowed: false,
    rejectAnyAddressFamilyMismatch: true,
  },
  transportEvidence: {
    contractVersion: 2,
    persistResolvedAddress: false,
    persistResolvedAddressFamily: true,
    persistRawErrorMessage: false,
    persistStackTrace: false,
    safeConnectionFailureCodes: [
      'deadline_exceeded', 'network_unreachable', 'host_unreachable',
      'connection_refused', 'connection_reset', 'connection_timed_out',
      'socket_broken_pipe', 'local_network_permission_denied',
      'tls_certificate_rejected', 'tls_handshake_failed', 'socket_closed',
      'unclassified_connection_failure',
    ],
    unknownCodeFallback: 'unclassified_connection_failure',
    includeInAttemptEvidenceDigest: true,
    includeInTerminalEvidenceDigest: true,
    includeInSanitizedPrivateResult: true,
  },
  output: {
    privateLocalCaptureOnly: true,
    finalAssetRegistrationAllowed: false,
    acceptedTimelineMutationAllowed: false,
    renderAllowed: false,
    exportAllowed: false,
  },
})

export async function loadAndVerifyMs011bExt005Authorization(
  repositoryRoot = process.cwd(),
): Promise<Ms011bAuthorizationV5> {
  const authorityPath = resolve(
    repositoryRoot,
    'tasks/motion-studio/MS-011B/authorization-request-ext-005.json',
  )
  const bytes = await readFile(authorityPath)
  const digest = createHash('sha256').update(bytes).digest('hex')
  if (digest !== MS011B_EXT005_AUTHORIZATION_FILE_SHA256) {
    throw new Error('MS-011B EXT-005 authorization file digest differs from the owner-approved authority.')
  }
  const envelope = envelopeSchema.parse(JSON.parse(bytes.toString('utf8')))
  const common = parseCommonAuthority(envelope)
  const parsed: Ms011bAuthorizationV5 = {
    ...common,
    schemaVersion: envelope.schemaVersion,
    authorizationId: envelope.authorizationId,
    priorAuthorizations: envelope.priorAuthorizations,
    reviewedLocalBaseline: envelope.reviewedLocalBaseline,
    claimContract: envelope.claimContract,
    runtimeCompatibilityPolicy: envelope.runtimeCompatibilityPolicy,
    durableIdentityPolicy: envelope.durableIdentityPolicy,
    limits: envelope.limits,
    networkPolicy: envelope.networkPolicy,
    transportEvidencePolicy: envelope.transportEvidencePolicy,
    retryAndFallbackPolicy: envelope.retryAndFallbackPolicy,
  }
  if (sha256CanonicalJson(compileAuthorityTemplate(parsed)) !== MS011B_EXT005_COMPILED_REQUEST_TEMPLATE_DIGEST ||
      sha256CanonicalJson(MS011B_EXT005_COMPILED_REQUEST_TEMPLATE) !== MS011B_EXT005_COMPILED_REQUEST_TEMPLATE_DIGEST) {
    throw new Error('MS-011B EXT-005 compiled request template differs from the owner-approved authority.')
  }
  return parsed
}

function parseCommonAuthority(envelope: Ms011bAuthorizationV5Envelope): Ms011bAuthorization {
  return ms011bAuthorizationSchema.parse({
    schemaVersion: 'motion-studio.external-action-authorization.v1',
    authorizationId: MS011B_AUTHORIZATION_ID,
    milestone: envelope.milestone,
    status: envelope.status,
    singleUse: envelope.singleUse,
    purpose: envelope.purpose,
    acceptedParent: envelope.acceptedParent,
    requests: envelope.requests,
    limits: {
      maximumHttpRequests: envelope.limits.maximumHttpRequests,
      maximumAutomaticRetries: envelope.limits.maximumAutomaticRetries,
      maximumFallbackRequests: envelope.limits.maximumFallbackRequests,
      maximumBinaryMediaDownloads: envelope.limits.maximumBinaryMediaDownloads,
      maximumCapturedResponseBytes: envelope.limits.maximumCapturedResponseBytes,
      requestTimeoutMilliseconds: envelope.limits.requestTimeoutMilliseconds,
      maximumRedirects: envelope.limits.maximumRedirects,
      maximumInternalCost: envelope.limits.maximumInternalCost,
    },
    networkPolicy: {
      allowedSchemes: envelope.networkPolicy.allowedSchemes,
      allowedHostnames: envelope.networkPolicy.allowedHostnames,
      allowedPorts: envelope.networkPolicy.allowedPorts,
      denyPrivateLinkLocalLoopbackReservedAndMetadataAddresses:
        envelope.networkPolicy.denyPrivateLinkLocalLoopbackReservedAndMetadataAddresses,
      resolveAndValidateBeforeConnect: envelope.networkPolicy.resolveAndValidateBeforeConnect,
      revalidateEveryConnection: envelope.networkPolicy.revalidateEveryConnection,
      allowBrowserAutomation: envelope.networkPolicy.allowBrowserAutomation,
      allowJavaScriptExecution: envelope.networkPolicy.allowJavaScriptExecution,
      allowFollowingSourceLinks: envelope.networkPolicy.allowFollowingSourceLinks,
      allowAuthentication: envelope.networkPolicy.allowAuthentication,
      allowCookies: envelope.networkPolicy.allowCookies,
    },
    candidateEligibilityPolicy: envelope.candidateEligibilityPolicy,
    costPolicy: envelope.costPolicy,
    outputPolicy: envelope.outputPolicy,
    retryAndFallbackPolicy: {
      automaticRetry: envelope.retryAndFallbackPolicy.automaticRetry,
      manualRetry: envelope.retryAndFallbackPolicy.manualRetry,
      alternateQuery: envelope.retryAndFallbackPolicy.alternateQuery,
      alternateSource: envelope.retryAndFallbackPolicy.alternateSource,
      alternateProvider: envelope.retryAndFallbackPolicy.alternateProvider,
      purchase: envelope.retryAndFallbackPolicy.purchase,
    },
    stopConditions: envelope.stopConditions,
    explicitlyExcluded: envelope.explicitlyExcluded,
  })
}

function compileAuthorityTemplate(authority: Ms011bAuthorizationV5) {
  const first = authority.requests[0]
  const second = authority.requests[1]
  const third = authority.requests[2]
  return {
    authorizationId: authority.authorizationId,
    singleUse: authority.singleUse,
    claimContract: authority.claimContract,
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
      maximumAddressConnectionAttemptsPerHttpRequest:
        authority.limits.maximumAddressConnectionAttemptsPerHttpRequest,
      maximumBinaryMediaDownloads: authority.limits.maximumBinaryMediaDownloads,
      maximumCapturedResponseBytes: authority.limits.maximumCapturedResponseBytes,
      requestTimeoutMilliseconds: authority.limits.requestTimeoutMilliseconds,
      maximumRedirects: authority.limits.maximumRedirects,
      maximumInternalCostMicros: authority.limits.maximumInternalCost.micros,
    },
    network: {
      addressSelectionPolicy: authority.networkPolicy.addressSelectionPolicy,
      addressFallbackAllowed: authority.networkPolicy.addressFallbackAllowed,
      lookupAllModeResultShape: authority.networkPolicy.lookupAllModeResultShape,
      directPinnedHttpsOnly: authority.networkPolicy.directPinnedHttpsOnly,
      proxyOrPacExecutionAllowed: authority.networkPolicy.proxyOrPacExecutionAllowed,
      rejectAnyAddressFamilyMismatch: authority.networkPolicy.rejectAnyAddressFamilyMismatch,
    },
    transportEvidence: authority.transportEvidencePolicy,
    output: {
      privateLocalCaptureOnly: authority.outputPolicy.privateLocalCaptureOnly,
      finalAssetRegistrationAllowed: authority.outputPolicy.finalAssetRegistrationAllowed,
      acceptedTimelineMutationAllowed: authority.outputPolicy.acceptedTimelineMutationAllowed,
      renderAllowed: authority.outputPolicy.renderAllowed,
      exportAllowed: authority.outputPolicy.exportAllowed,
    },
  }
}
