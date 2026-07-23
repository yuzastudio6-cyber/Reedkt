import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { z } from 'zod'

import { sha256CanonicalJson } from '../commands/canonical-json'

export const MS011B_AUTHORIZATION_ID = 'MS-011B-EXT-001' as const
export const MS011B_AUTHORIZATION_FILE_SHA256 =
  '65aaa89b808b41f23b884d7505c51a4fb52f8be65340c142eaf69ac497195feb' as const

export const MS011B_WIKIPEDIA_URL =
  'https://en.wikipedia.org/api/rest_v1/page/summary/Apollo_11' as const
export const MS011B_COMMONS_METADATA_URL =
  'https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2&generator=search&gsrnamespace=6&gsrsearch=Apollo%2011%20launch&gsrlimit=3&prop=imageinfo&iiprop=url%7Cmime%7Csize%7Csha1%7Cextmetadata&iiurlwidth=1280' as const

const exactRequestSchema = z.object({
  ordinal: z.union([z.literal(1), z.literal(2)]),
  method: z.literal('GET'),
  url: z.string().url(),
  purpose: z.string().trim().min(1).max(500),
  maximumResponseBytes: z.number().int().positive().max(8_388_608),
  allowedContentTypes: z.array(z.string().trim().min(1)).min(1).max(4).readonly(),
}).strict()

const derivedRequestSchema = z.object({
  ordinal: z.literal(3),
  method: z.literal('GET'),
  urlAuthority: z.object({
    sourceRequestOrdinal: z.literal(2),
    jsonField: z.literal('query.pages[].imageinfo[0].thumburl'),
    selection: z.string().trim().min(1).max(500),
    scheme: z.literal('https'),
    hostname: z.literal('upload.wikimedia.org'),
    allowQuery: z.literal(false),
    allowFragment: z.literal(false),
    allowUserInfo: z.literal(false),
    allowRedirect: z.literal(false),
  }).strict(),
  purpose: z.string().trim().min(1).max(500),
  maximumResponseBytes: z.literal(8_388_608),
  allowedContentTypes: z.tuple([
    z.literal('image/jpeg'),
    z.literal('image/png'),
    z.literal('image/webp'),
  ]).readonly(),
  optionalWhenNoCandidatePasses: z.literal(true),
}).strict()

export const ms011bAuthorizationSchema = z.object({
  schemaVersion: z.literal('motion-studio.external-action-authorization.v1'),
  authorizationId: z.literal(MS011B_AUTHORIZATION_ID),
  milestone: z.literal('MS-011B'),
  status: z.literal('owner_authorization_required_not_executed'),
  singleUse: z.literal(true),
  purpose: z.string().trim().min(1).max(500),
  acceptedParent: z.object({
    milestone: z.literal('MS-011A'),
    implementationCommit: z.literal('63f4e0af657809129dd08f8139c3f8dfab1b5128'),
    implementationTree: z.literal('686c8f0e4210c05fc89930279927bf5597fb58eb'),
    acceptanceCommit: z.literal('418f2c4edbf5811f199291436d1c0f6976eabf22'),
  }).strict(),
  requests: z.tuple([exactRequestSchema, exactRequestSchema, derivedRequestSchema]).readonly(),
  limits: z.object({
    maximumHttpRequests: z.literal(3),
    maximumAutomaticRetries: z.literal(0),
    maximumFallbackRequests: z.literal(0),
    maximumBinaryMediaDownloads: z.literal(1),
    maximumCapturedResponseBytes: z.literal(9_961_472),
    requestTimeoutMilliseconds: z.literal(10_000),
    maximumRedirects: z.literal(0),
    maximumInternalCost: z.object({ currency: z.literal('USD'), micros: z.literal(250_000) }).strict(),
  }).strict(),
  networkPolicy: z.object({
    allowedSchemes: z.tuple([z.literal('https')]).readonly(),
    allowedHostnames: z.tuple([
      z.literal('en.wikipedia.org'),
      z.literal('commons.wikimedia.org'),
      z.literal('upload.wikimedia.org'),
    ]).readonly(),
    allowedPorts: z.tuple([z.literal(443)]).readonly(),
    denyPrivateLinkLocalLoopbackReservedAndMetadataAddresses: z.literal(true),
    resolveAndValidateBeforeConnect: z.literal(true),
    revalidateEveryConnection: z.literal(true),
    allowBrowserAutomation: z.literal(false),
    allowJavaScriptExecution: z.literal(false),
    allowFollowingSourceLinks: z.literal(false),
    allowAuthentication: z.literal(false),
    allowCookies: z.literal(false),
  }).strict(),
  candidateEligibilityPolicy: z.object({
    maximumNormalizedCandidates: z.literal(3),
    allowedMimeTypes: z.tuple([
      z.literal('image/jpeg'), z.literal('image/png'), z.literal('image/webp'),
    ]).readonly(),
    allowedLicenseShortNamePatterns: z.tuple([
      z.literal('^Public domain$'),
      z.literal('^CC0(?: 1\\.0)?$'),
      z.literal('^CC BY (?:2\\.0|2\\.5|3\\.0|4\\.0)$'),
      z.literal('^CC BY-SA (?:2\\.0|2\\.5|3\\.0|4\\.0)$'),
    ]).readonly(),
    disallowedRestrictionTokens: z.tuple([
      z.literal('noncommercial'), z.literal('no derivatives'),
      z.literal('permission required'), z.literal('fair use'), z.literal('copyrighted'),
    ]).readonly(),
    requireLicenseUrlForAttributionLicense: z.literal(true),
    requireArtistOrCreditForAttributionLicense: z.literal(true),
    requireNonEmptySourceMetadata: z.literal(true),
    minimumSourceWidthPixels: z.literal(1024),
    minimumSourceHeightPixels: z.literal(576),
    automaticRightsApprovalAllowed: z.literal(false),
    automaticAuthenticityApprovalAllowed: z.literal(false),
    humanReviewRequiredBeforeSelection: z.literal(true),
    finalUseAllowed: z.literal(false),
  }).strict(),
  costPolicy: z.object({
    paidProviderAllowed: z.literal(false),
    providerFeeExpectedMicros: z.literal(0),
    meterLocalCpu: z.literal(true),
    meterCapturedBytes: z.literal(true),
    meterPrivateStorage: z.literal(true),
    meterFailures: z.literal(true),
    customerPricingAllowed: z.literal(false),
    customerCreditsAllowed: z.literal(false),
    billingAllowed: z.literal(false),
  }).strict(),
  outputPolicy: z.object({
    privateLocalCaptureOnly: z.literal(true),
    remoteUploadAllowed: z.literal(false),
    rawPayloadBrowserExposureAllowed: z.literal(false),
    publicOrSignedUrlBrowserExposureAllowed: z.literal(false),
    finalAssetRegistrationAllowed: z.literal(false),
    acceptedTimelineMutationAllowed: z.literal(false),
    renderAllowed: z.literal(false),
    exportAllowed: z.literal(false),
    publicDeliveryAllowed: z.literal(false),
    humanReviewRequired: z.literal(true),
  }).strict(),
  retryAndFallbackPolicy: z.object({
    automaticRetry: z.literal('forbidden'),
    manualRetry: z.literal('requires_new_authorization'),
    alternateQuery: z.literal('requires_new_authorization'),
    alternateSource: z.literal('requires_new_authorization'),
    alternateProvider: z.literal('requires_new_authorization'),
    purchase: z.literal('forbidden'),
  }).strict(),
  stopConditions: z.array(z.string().trim().min(1).max(500)).min(1).max(64).readonly(),
  explicitlyExcluded: z.array(z.string().trim().min(1).max(500)).min(1).max(64).readonly(),
}).strict().superRefine((value, context) => {
  if (value.requests[0].ordinal !== 1 || value.requests[0].url !== MS011B_WIKIPEDIA_URL ||
      value.requests[0].maximumResponseBytes !== 524_288 ||
      value.requests[0].allowedContentTypes.join(',') !== 'application/json') {
    context.addIssue({ code: 'custom', path: ['requests', 0], message: 'Request 1 differs from the exact Wikipedia authority.' })
  }
  if (value.requests[1].ordinal !== 2 || value.requests[1].url !== MS011B_COMMONS_METADATA_URL ||
      value.requests[1].maximumResponseBytes !== 1_048_576 ||
      value.requests[1].allowedContentTypes.join(',') !== 'application/json') {
    context.addIssue({ code: 'custom', path: ['requests', 1], message: 'Request 2 differs from the exact Commons authority.' })
  }
})

export type Ms011bAuthorization = z.infer<typeof ms011bAuthorizationSchema>

export const MS011B_COMPILED_REQUEST_TEMPLATE = Object.freeze({
  authorizationId: MS011B_AUTHORIZATION_ID,
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

export const MS011B_COMPILED_REQUEST_TEMPLATE_DIGEST =
  sha256CanonicalJson(MS011B_COMPILED_REQUEST_TEMPLATE)

export async function loadAndVerifyMs011bAuthorization(
  repositoryRoot = process.cwd(),
): Promise<Ms011bAuthorization> {
  const authorityPath = resolve(
    repositoryRoot,
    'tasks/motion-studio/MS-011B/authorization-request.json',
  )
  const bytes = await readFile(authorityPath)
  const digest = createHash('sha256').update(bytes).digest('hex')
  if (digest !== MS011B_AUTHORIZATION_FILE_SHA256) {
    throw new Error('MS-011B authorization file digest differs from the owner-approved authority.')
  }
  const parsed = ms011bAuthorizationSchema.parse(JSON.parse(bytes.toString('utf8')))
  if (sha256CanonicalJson(compileAuthorityTemplate(parsed)) !== MS011B_COMPILED_REQUEST_TEMPLATE_DIGEST) {
    throw new Error('MS-011B compiled request template differs from the owner-approved authority.')
  }
  return parsed
}

function compileAuthorityTemplate(authority: Ms011bAuthorization) {
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
