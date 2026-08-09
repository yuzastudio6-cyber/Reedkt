import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import { assertClosedContractTree } from '../../src/lib/closed-contract-validation'
import {
  VISUAL_INTELLIGENCE_MODEL_ID,
  type VisualIntelligenceEvidenceRef,
} from '../../src/types/visual-intelligence'
import {
  createVisualIntelligenceEvidenceRef,
  visualIntelligenceCanonicalJson,
  visualIntelligenceDigest,
} from './visual-intelligence-contract'

export const VISUAL_INTELLIGENCE_PROVIDER_AUDIT_WINDOW_READER_CONFIGURATION_VERSION =
  'visual-intelligence-provider-audit-window-reader-configuration-v1' as const
export const VISUAL_INTELLIGENCE_PROVIDER_AUDIT_WINDOW_OBSERVATION_VERSION =
  'visual-intelligence-provider-audit-window-observation-v1' as const

export const VISUAL_INTELLIGENCE_PROVIDER_AUDIT_CORRELATION_LABEL_KEYS =
  Object.freeze({
    firstHalf: 'vi_request_ref_sha256_a',
    secondHalf: 'vi_request_ref_sha256_b',
  })

const PROJECT_ID = 'reeditpro' as const
const PROVIDER_SERVICE_ID = 'services/C7E2-9256-1C43' as const
const VERTEX_SERVICE_NAME = 'aiplatform.googleapis.com' as const
const GENERATE_CONTENT_METHOD =
  'google.cloud.aiplatform.v1.PredictionService.GenerateContent' as const
const AUDIT_LOG_NAME =
  'projects/reeditpro/logs/cloudaudit.googleapis.com%2Fdata_access' as const
const MODEL_RESOURCE =
  `projects/${PROJECT_ID}/locations/global/publishers/google/models/${
    VISUAL_INTELLIGENCE_MODEL_ID}` as const
const LOGGING_ENTRIES_URL =
  'https://logging.googleapis.com/v2/entries:list' as const
const LOGGING_READ_SCOPE =
  'https://www.googleapis.com/auth/logging.read' as const
const MAXIMUM_WINDOW_MS = 60 * 60 * 1_000
const MAXIMUM_RESPONSE_BYTES = 2 * 1024 * 1024
const EXPECTED_REQUEST_COUNT = 4
const DETECTION_PAGE_SIZE = EXPECTED_REQUEST_COUNT + 1

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const timestamp = z.string().datetime({ offset: true })
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const serviceAccountEmail = z.string().trim().min(6).max(254)
  .regex(/^[a-z0-9][a-z0-9._-]{0,62}@[a-z0-9-]+\.iam\.gserviceaccount\.com$/u)
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()

const configurationWithoutRefSchema = z.object({
  schemaVersion: z.literal(
    VISUAL_INTELLIGENCE_PROVIDER_AUDIT_WINDOW_READER_CONFIGURATION_VERSION,
  ),
  projectId: z.literal(PROJECT_ID),
  expectedProviderPrincipalEmail: serviceAccountEmail,
  timeoutMs: z.number().int().min(1_000).max(30_000),
}).strict()

const configurationSchema = configurationWithoutRefSchema.extend({
  configurationRef: evidenceRefSchema,
}).strict()

const auditCorrelationLabelsSchema = z.object({
  capability: z.literal('visual-intelligence'),
  operation: z.literal('model-billing-qualification'),
  profile: z.literal('sku-evidence'),
  vi_request_ref_sha256_a: z.string().regex(/^[a-f0-9]{32}$/u),
  vi_request_ref_sha256_b: z.string().regex(/^[a-f0-9]{32}$/u),
}).strict()

const rawAuditEntrySchema = z.object({
  insertId: safeId,
  timestamp,
  logName: z.literal(AUDIT_LOG_NAME),
  resource: z.object({
    type: z.literal('audited_resource'),
    labels: z.object({
      project_id: z.literal(PROJECT_ID),
      service: z.literal(VERTEX_SERVICE_NAME),
      method: z.literal(GENERATE_CONTENT_METHOD),
    }).passthrough(),
  }).passthrough(),
  protoPayload: z.object({
    '@type': z.literal('type.googleapis.com/google.cloud.audit.AuditLog'),
    serviceName: z.literal(VERTEX_SERVICE_NAME),
    methodName: z.literal(GENERATE_CONTENT_METHOD),
    resourceName: z.literal(MODEL_RESOURCE),
    authenticationInfo: z.object({
      principalEmail: serviceAccountEmail,
    }).passthrough(),
    request: z.object({
      model: z.literal(MODEL_RESOURCE),
      labels: auditCorrelationLabelsSchema,
    }).passthrough(),
    response: z.object({
      responseId: safeId,
      modelVersion: z.literal(VISUAL_INTELLIGENCE_MODEL_ID),
    }).passthrough(),
    status: z.object({
      code: z.union([z.literal(0), z.undefined()]).optional(),
    }).passthrough().optional(),
  }).passthrough(),
}).passthrough()

const rawLoggingResponseSchema = z.object({
  entries: z.array(rawAuditEntrySchema).length(EXPECTED_REQUEST_COUNT),
  nextPageToken: z.union([z.literal(''), z.undefined()]).optional(),
}).passthrough()

const observedEntrySchema = z.object({
  insertId: safeId,
  timestamp,
  providerRequestRef: evidenceRefSchema,
  providerRequestRefIdentitySha256: prefixedSha256,
  providerResponseId: safeId,
  providerModelVersion: z.literal(VISUAL_INTELLIGENCE_MODEL_ID),
  providerPrincipalEmailSha256: prefixedSha256,
  exactProjectServiceMethodModelAndCorrelationLabelsVerified: z.literal(true),
  successfulProviderResponseMetadataObserved: z.literal(true),
}).strict()

const observationWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    VISUAL_INTELLIGENCE_PROVIDER_AUDIT_WINDOW_OBSERVATION_VERSION,
  ),
  observationId: safeId,
  observationVersion: z.number().int().positive().safe(),
  evidenceClass: z.literal(
    'exact_project_wide_vertex_generate_content_data_access_audit_window',
  ),
  projectId: z.literal(PROJECT_ID),
  providerServiceId: z.literal(PROVIDER_SERVICE_ID),
  vertexServiceName: z.literal(VERTEX_SERVICE_NAME),
  generateContentMethod: z.literal(GENERATE_CONTENT_METHOD),
  exactModelId: z.literal(VISUAL_INTELLIGENCE_MODEL_ID),
  vertexLocation: z.literal('global'),
  throughputClass: z.literal('standard'),
  qualificationWindowStartedAtIso: timestamp,
  qualificationWindowFinishedAtIso: timestamp,
  exactOrderedProviderRequestRefs: z.array(evidenceRefSchema)
    .length(EXPECTED_REQUEST_COUNT),
  orderedAuditEntries: z.array(observedEntrySchema)
    .length(EXPECTED_REQUEST_COUNT),
  expectedProviderPrincipalEmailSha256: prefixedSha256,
  queryConfigurationRef: evidenceRefSchema,
  queryFilterRef: evidenceRefSchema,
  queryResponseMetadataRef: evidenceRefSchema,
  observedProviderRequestCount: z.literal(EXPECTED_REQUEST_COUNT),
  exactProjectWideServiceMethodWindowQueried: z.literal(true),
  auditFilterDidNotSelectCallerRequestIdentities: z.literal(true),
  allReturnedEntriesConsumed: z.literal(true),
  noUnexpectedProviderRequestObserved: z.literal(true),
  noOtherModelOrSkuTrafficInObservationWindow: z.literal(true),
  dataAccessAuditEntriesPresent: z.literal(true),
  exactRequestCorrelationLabelsVerified: z.literal(true),
  exactProviderPrincipalVerified: z.literal(true),
  callerAuthoredAuditEntriesAccepted: z.literal(false),
  rawAuditRequestOrResponsePayloadReturned: z.literal(false),
  rawPromptOrMediaLocatorReturned: z.literal(false),
  providerCallMadeByAuditReader: z.literal(false),
  providerDispatchAuthorityGranted: z.literal(false),
  customerPricingOrServiceFeeAuthorityGranted: z.literal(false),
  walletOrCreditMutationAuthorityGranted: z.literal(false),
  productionReleaseAuthorityGranted: z.literal(false),
}).strict().superRefine((value, context) => {
  const started = Date.parse(value.qualificationWindowStartedAtIso)
  const finished = Date.parse(value.qualificationWindowFinishedAtIso)
  const expectedRefKeys = value.exactOrderedProviderRequestRefs.map(refKey)
  const observedRefKeys = value.orderedAuditEntries.map((entry) =>
    refKey(entry.providerRequestRef))
  const orderedEntries = [...value.orderedAuditEntries].sort(compareEntries)
  if (
    finished <= started
    || finished - started > MAXIMUM_WINDOW_MS
    || new Set(expectedRefKeys).size !== EXPECTED_REQUEST_COUNT
    || visualIntelligenceCanonicalJson(expectedRefKeys)
      !== visualIntelligenceCanonicalJson(observedRefKeys)
    || visualIntelligenceCanonicalJson(orderedEntries)
      !== visualIntelligenceCanonicalJson(value.orderedAuditEntries)
    || value.orderedAuditEntries.some((entry) =>
      entry.providerRequestRefIdentitySha256
        !== visualIntelligenceDigest(entry.providerRequestRef)
      || entry.providerPrincipalEmailSha256
        !== value.expectedProviderPrincipalEmailSha256)
  ) context.addIssue({
    code: 'custom',
    message: 'Visual Intelligence provider audit observation is not exact.',
  })
})

const observationSchema = observationWithoutDigestSchema.extend({
  observationDigestSha256: prefixedSha256,
}).strict()

export type VisualIntelligenceProviderAuditWindowReaderConfiguration =
  z.infer<typeof configurationSchema>
export type VisualIntelligenceProviderAuditWindowObservation =
  z.infer<typeof observationSchema>

type GoogleAuthRequest = Pick<GoogleAuth, 'request'>

export interface VisualIntelligenceProviderAuditWindowReadPort {
  readExact(input: {
    readonly observationId: string
    readonly observationVersion: number
    readonly qualificationWindowStartedAtIso: string
    readonly qualificationWindowFinishedAtIso: string
    readonly exactOrderedProviderRequestRefs: readonly [
      VisualIntelligenceEvidenceRef,
      VisualIntelligenceEvidenceRef,
      VisualIntelligenceEvidenceRef,
      VisualIntelligenceEvidenceRef,
    ]
  }): Promise<VisualIntelligenceProviderAuditWindowObservation>
}

export function createVisualIntelligenceProviderAuditWindowReaderConfiguration(
  input: z.input<typeof configurationWithoutRefSchema>,
): VisualIntelligenceProviderAuditWindowReaderConfiguration {
  const payload = configurationWithoutRefSchema.parse(input)
  const configurationId =
    'weeditpro-visual-intelligence-provider-audit-window-reader'
  const configurationVersion = 1
  return Object.freeze(configurationSchema.parse({
    ...payload,
    configurationRef: createVisualIntelligenceEvidenceRef(
      configurationId,
      { ...payload, configurationId, configurationVersion },
      configurationVersion,
    ),
  }))
}

export function visualIntelligenceProviderAuditCorrelationLabels(
  providerRequestRef: VisualIntelligenceEvidenceRef,
) {
  const parsed = evidenceRefSchema.parse(providerRequestRef)
  const digest = visualIntelligenceDigest(parsed).slice(7)
  return Object.freeze(auditCorrelationLabelsSchema.parse({
    capability: 'visual-intelligence',
    operation: 'model-billing-qualification',
    profile: 'sku-evidence',
    vi_request_ref_sha256_a: digest.slice(0, 32),
    vi_request_ref_sha256_b: digest.slice(32),
  }))
}

export function createVisualIntelligenceProviderAuditWindowReadPort(input: {
  readonly configuration:
    VisualIntelligenceProviderAuditWindowReaderConfiguration
  readonly auth?: GoogleAuthRequest
  readonly now?: () => Date
}): VisualIntelligenceProviderAuditWindowReadPort {
  const configuration = configurationSchema.parse(input.configuration)
  verifyConfigurationRef(configuration)
  const auth = input.auth ?? new GoogleAuth({ scopes: [LOGGING_READ_SCOPE] })
  const now = input.now ?? (() => new Date())
  if (!auth || typeof auth.request !== 'function') throw new Error(
    'Visual Intelligence provider audit auth is invalid.',
  )
  return Object.freeze({
    async readExact(untrusted: {
      readonly observationId: string
      readonly observationVersion: number
      readonly qualificationWindowStartedAtIso: string
      readonly qualificationWindowFinishedAtIso: string
      readonly exactOrderedProviderRequestRefs: readonly [
        VisualIntelligenceEvidenceRef,
        VisualIntelligenceEvidenceRef,
        VisualIntelligenceEvidenceRef,
        VisualIntelligenceEvidenceRef,
      ]
    }) {
      const scope = parseScope(untrusted, now())
      const filter = exactAuditFilter(scope)
      let rawData: unknown
      try {
        const response = await auth.request({
          method: 'POST',
          url: LOGGING_ENTRIES_URL,
          data: {
            resourceNames: [`projects/${PROJECT_ID}`],
            filter,
            orderBy: 'timestamp asc',
            pageSize: DETECTION_PAGE_SIZE,
          },
          timeout: configuration.timeoutMs,
          retry: false,
          maxRedirects: 0,
          responseType: 'json',
        })
        rawData = response.data
      } catch (error) {
        throw new Error(
          'Visual Intelligence provider audit window query failed.',
          { cause: error },
        )
      }
      assertClosedContractTree(rawData, 'visual intelligence audit response')
      if (Buffer.byteLength(JSON.stringify(rawData), 'utf8')
        > MAXIMUM_RESPONSE_BYTES) throw new Error(
        'Visual Intelligence provider audit response exceeded its bound.',
      )
      const response = rawLoggingResponseSchema.parse(rawData)
      const expectedByDigest = new Map(scope.exactOrderedProviderRequestRefs
        .map((reference) => [visualIntelligenceDigest(reference), reference]))
      const principalDigest = visualIntelligenceDigest(
        configuration.expectedProviderPrincipalEmail,
      )
      const entries = response.entries.map((entry) => {
        const labels = entry.protoPayload.request.labels
        const requestIdentity = `sha256:${
          labels.vi_request_ref_sha256_a}${labels.vi_request_ref_sha256_b}`
        const providerRequestRef = expectedByDigest.get(requestIdentity)
        if (
          !providerRequestRef
          || entry.protoPayload.authenticationInfo.principalEmail
            !== configuration.expectedProviderPrincipalEmail
          || entry.protoPayload.status?.code !== undefined
            && entry.protoPayload.status.code !== 0
        ) throw new Error(
          'Visual Intelligence provider audit entry was not authorized.',
        )
        return observedEntrySchema.parse({
          insertId: entry.insertId,
          timestamp: entry.timestamp,
          providerRequestRef,
          providerRequestRefIdentitySha256: requestIdentity,
          providerResponseId: entry.protoPayload.response.responseId,
          providerModelVersion: entry.protoPayload.response.modelVersion,
          providerPrincipalEmailSha256: principalDigest,
          exactProjectServiceMethodModelAndCorrelationLabelsVerified: true,
          successfulProviderResponseMetadataObserved: true,
        })
      }).sort(compareEntries)
      const responseMetadata = entries.map((entry) => ({
        insertId: entry.insertId,
        timestamp: entry.timestamp,
        providerRequestRefIdentitySha256:
          entry.providerRequestRefIdentitySha256,
        providerResponseId: entry.providerResponseId,
      }))
      const payload = observationWithoutDigestSchema.parse({
        schemaVersion:
          VISUAL_INTELLIGENCE_PROVIDER_AUDIT_WINDOW_OBSERVATION_VERSION,
        observationId: scope.observationId,
        observationVersion: scope.observationVersion,
        evidenceClass:
          'exact_project_wide_vertex_generate_content_data_access_audit_window',
        projectId: PROJECT_ID,
        providerServiceId: PROVIDER_SERVICE_ID,
        vertexServiceName: VERTEX_SERVICE_NAME,
        generateContentMethod: GENERATE_CONTENT_METHOD,
        exactModelId: VISUAL_INTELLIGENCE_MODEL_ID,
        vertexLocation: 'global',
        throughputClass: 'standard',
        qualificationWindowStartedAtIso:
          scope.qualificationWindowStartedAtIso,
        qualificationWindowFinishedAtIso:
          scope.qualificationWindowFinishedAtIso,
        exactOrderedProviderRequestRefs:
          scope.exactOrderedProviderRequestRefs,
        orderedAuditEntries: entries,
        expectedProviderPrincipalEmailSha256: principalDigest,
        queryConfigurationRef: configuration.configurationRef,
        queryFilterRef: createVisualIntelligenceEvidenceRef(
          `${scope.observationId}.query-filter`,
          { filter },
          scope.observationVersion,
        ),
        queryResponseMetadataRef: createVisualIntelligenceEvidenceRef(
          `${scope.observationId}.query-response-metadata`,
          responseMetadata,
          scope.observationVersion,
        ),
        observedProviderRequestCount: EXPECTED_REQUEST_COUNT,
        exactProjectWideServiceMethodWindowQueried: true,
        auditFilterDidNotSelectCallerRequestIdentities: true,
        allReturnedEntriesConsumed: true,
        noUnexpectedProviderRequestObserved: true,
        noOtherModelOrSkuTrafficInObservationWindow: true,
        dataAccessAuditEntriesPresent: true,
        exactRequestCorrelationLabelsVerified: true,
        exactProviderPrincipalVerified: true,
        callerAuthoredAuditEntriesAccepted: false,
        rawAuditRequestOrResponsePayloadReturned: false,
        rawPromptOrMediaLocatorReturned: false,
        providerCallMadeByAuditReader: false,
        providerDispatchAuthorityGranted: false,
        customerPricingOrServiceFeeAuthorityGranted: false,
        walletOrCreditMutationAuthorityGranted: false,
        productionReleaseAuthorityGranted: false,
      })
      return Object.freeze(observationSchema.parse({
        ...payload,
        observationDigestSha256: visualIntelligenceDigest(payload),
      }))
    },
  })
}

export function parseVisualIntelligenceProviderAuditWindowObservation(
  value: unknown,
): VisualIntelligenceProviderAuditWindowObservation {
  assertClosedContractTree(value, 'visual intelligence audit observation')
  const observation = observationSchema.parse(value)
  const payload = { ...observation }
  Reflect.deleteProperty(payload, 'observationDigestSha256')
  if (observation.observationDigestSha256
    !== visualIntelligenceDigest(payload)) throw new Error(
    'Visual Intelligence provider audit observation digest is invalid.',
  )
  return Object.freeze(observation)
}

export function visualIntelligenceProviderAuditWindowObservationRef(
  value: VisualIntelligenceProviderAuditWindowObservation,
): VisualIntelligenceEvidenceRef {
  const observation = parseVisualIntelligenceProviderAuditWindowObservation(
    value,
  )
  return Object.freeze({
    id: observation.observationId,
    version: observation.observationVersion,
    contentHash: observation.observationDigestSha256,
  })
}

function parseScope(
  value: unknown,
  observedNow: Date,
) {
  const parsed = z.object({
    observationId: safeId,
    observationVersion: z.number().int().positive().safe(),
    qualificationWindowStartedAtIso: timestamp,
    qualificationWindowFinishedAtIso: timestamp,
    exactOrderedProviderRequestRefs: z.array(evidenceRefSchema)
      .length(EXPECTED_REQUEST_COUNT),
  }).strict().parse(value)
  const started = Date.parse(parsed.qualificationWindowStartedAtIso)
  const finished = Date.parse(parsed.qualificationWindowFinishedAtIso)
  if (
    !Number.isFinite(observedNow.getTime())
    || finished <= started
    || finished - started > MAXIMUM_WINDOW_MS
    || finished > observedNow.getTime()
    || new Set(parsed.exactOrderedProviderRequestRefs.map(refKey)).size
      !== EXPECTED_REQUEST_COUNT
  ) throw new Error(
    'Visual Intelligence provider audit window is invalid.',
  )
  return parsed
}

function verifyConfigurationRef(
  configuration: VisualIntelligenceProviderAuditWindowReaderConfiguration,
): void {
  const payload = { ...configuration }
  Reflect.deleteProperty(payload, 'configurationRef')
  const expected = createVisualIntelligenceEvidenceRef(
    'weeditpro-visual-intelligence-provider-audit-window-reader',
    {
      ...payload,
      configurationId:
        'weeditpro-visual-intelligence-provider-audit-window-reader',
      configurationVersion: 1,
    },
  )
  if (!sameRef(configuration.configurationRef, expected)) throw new Error(
    'Visual Intelligence provider audit reader configuration changed.',
  )
}

function exactAuditFilter(scope: {
  qualificationWindowStartedAtIso: string
  qualificationWindowFinishedAtIso: string
}): string {
  return [
    `logName="${AUDIT_LOG_NAME}"`,
    'resource.type="audited_resource"',
    `resource.labels.project_id="${PROJECT_ID}"`,
    `protoPayload.serviceName="${VERTEX_SERVICE_NAME}"`,
    `protoPayload.methodName="${GENERATE_CONTENT_METHOD}"`,
    `timestamp>="${scope.qualificationWindowStartedAtIso}"`,
    `timestamp<="${scope.qualificationWindowFinishedAtIso}"`,
  ].join(' AND ')
}

function compareEntries(
  left: z.infer<typeof observedEntrySchema>,
  right: z.infer<typeof observedEntrySchema>,
): number {
  if (left.timestamp !== right.timestamp) {
    return left.timestamp < right.timestamp ? -1 : 1
  }
  return left.insertId < right.insertId ? -1
    : left.insertId > right.insertId ? 1 : 0
}

function sameRef(
  left: VisualIntelligenceEvidenceRef,
  right: VisualIntelligenceEvidenceRef,
): boolean {
  return refKey(left) === refKey(right)
}

function refKey(value: VisualIntelligenceEvidenceRef): string {
  return `${value.id}:${value.version}:${value.contentHash}`
}
