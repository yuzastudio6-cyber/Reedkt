import assert from 'node:assert/strict'
import type { GoogleAuth } from 'google-auth-library'

import {
  createVisualIntelligenceEvidenceRef,
  visualIntelligenceDigest,
} from '../visual-intelligence/visual-intelligence-contract'
import {
  createVisualIntelligenceProviderAuditWindowReadPort,
  createVisualIntelligenceProviderAuditWindowReaderConfiguration,
  parseVisualIntelligenceProviderAuditWindowObservation,
  visualIntelligenceProviderAuditCorrelationLabels,
  visualIntelligenceProviderAuditWindowObservationRef,
} from '../visual-intelligence/visual-intelligence-provider-audit-window-read-port'

const startedAtIso = '2026-08-08T10:00:00.000Z'
const finishedAtIso = '2026-08-08T10:10:00.000Z'
const principal =
  'visual-intelligence-provider@reeditpro.iam.gserviceaccount.com'
const requestRefs = [
  ref('standard-warmup'),
  ref('standard-measured'),
  ref('long-warmup'),
  ref('long-measured'),
] as const
const configuration =
  createVisualIntelligenceProviderAuditWindowReaderConfiguration({
    schemaVersion:
      'visual-intelligence-provider-audit-window-reader-configuration-v1',
    projectId: 'reeditpro',
    expectedProviderPrincipalEmail: principal,
    timeoutMs: 15_000,
  })
const calls: Array<Record<string, unknown>> = []
const auth = fixtureAuth(() => exactResponse(), calls)
const reader = createVisualIntelligenceProviderAuditWindowReadPort({
  configuration,
  auth,
  now: () => new Date('2026-08-08T12:00:00.000Z'),
})
const observation = await reader.readExact(readInput())

assert.deepEqual(
  parseVisualIntelligenceProviderAuditWindowObservation(observation),
  observation,
)
assert.equal(observation.observedProviderRequestCount, 4)
assert.equal(observation.orderedAuditEntries.length, 4)
assert.deepEqual(
  observation.orderedAuditEntries.map((entry) => entry.providerRequestRef),
  requestRefs,
)
assert.deepEqual(
  observation.orderedAuditEntries.map((entry) => entry.providerResponseId),
  ['provider-response-1', 'provider-response-2', 'provider-response-3',
    'provider-response-4'],
)
assert.equal(observation.exactProjectWideServiceMethodWindowQueried, true)
assert.equal(observation.auditFilterDidNotSelectCallerRequestIdentities, true)
assert.equal(observation.allReturnedEntriesConsumed, true)
assert.equal(observation.noUnexpectedProviderRequestObserved, true)
assert.equal(observation.noOtherModelOrSkuTrafficInObservationWindow, true)
assert.equal(observation.dataAccessAuditEntriesPresent, true)
assert.equal(observation.rawAuditRequestOrResponsePayloadReturned, false)
assert.equal(observation.rawPromptOrMediaLocatorReturned, false)
assert.equal(observation.providerCallMadeByAuditReader, false)
assert.equal(observation.providerDispatchAuthorityGranted, false)
assert.equal(observation.customerPricingOrServiceFeeAuthorityGranted, false)
assert.equal(observation.walletOrCreditMutationAuthorityGranted, false)
assert.equal(observation.productionReleaseAuthorityGranted, false)
assert.deepEqual(
  visualIntelligenceProviderAuditWindowObservationRef(observation),
  {
    id: observation.observationId,
    version: observation.observationVersion,
    contentHash: observation.observationDigestSha256,
  },
)
assert.equal(calls.length, 1)
const call = calls[0]!
assert.equal(call.method, 'POST')
assert.equal(call.url, 'https://logging.googleapis.com/v2/entries:list')
assert.equal(call.timeout, 15_000)
assert.equal(call.retry, false)
assert.equal(call.maxRedirects, 0)
assert.equal(call.responseType, 'json')
const requestData = call.data as Record<string, unknown>
assert.deepEqual(requestData.resourceNames, ['projects/reeditpro'])
assert.equal(requestData.orderBy, 'timestamp asc')
assert.equal(requestData.pageSize, 5)
const filter = String(requestData.filter)
assert.equal(filter.includes(startedAtIso), true)
assert.equal(filter.includes(finishedAtIso), true)
assert.equal(filter.includes('vi_request_ref_sha256'), false)
assert.equal(filter.includes(principal), false)
assert.equal(filter.includes('PredictionService.GenerateContent'), true)
assert.equal(JSON.stringify(observation).includes(principal), false)
assert.equal(JSON.stringify(observation).includes('contents'), false)

const firstLabels = visualIntelligenceProviderAuditCorrelationLabels(
  requestRefs[0],
)
assert.equal(firstLabels.vi_request_ref_sha256_a.length, 32)
assert.equal(firstLabels.vi_request_ref_sha256_b.length, 32)
assert.equal(
  `sha256:${firstLabels.vi_request_ref_sha256_a}${
    firstLabels.vi_request_ref_sha256_b}`,
  visualIntelligenceDigest(requestRefs[0]),
)

const tampered = structuredClone(observation)
tampered.orderedAuditEntries[0].providerResponseId = 'changed-response'
assert.throws(() =>
  parseVisualIntelligenceProviderAuditWindowObservation(tampered), /digest/u)

assert.throws(() =>
  parseVisualIntelligenceProviderAuditWindowObservation({
    ...observation,
    browserLocalCompletion: true,
  }))

const tamperedConfiguration = structuredClone(configuration)
tamperedConfiguration.timeoutMs = 20_000
assert.throws(() => createVisualIntelligenceProviderAuditWindowReadPort({
  configuration: tamperedConfiguration,
  auth,
}), /configuration changed/u)

await rejectsResponse((response) => {
  response.entries.pop()
})

await rejectsResponse((response) => {
  response.entries.push(auditEntry(5, ref('unexpected-request')))
}, /Too big/u)

await rejectsResponse((response) => {
  Object.assign(response, { nextPageToken: 'more-results' })
})

await rejectsResponse((response) => {
  response.entries[0]!.protoPayload.request.labels =
    visualIntelligenceProviderAuditCorrelationLabels(ref('unknown-request'))
}, /not authorized/u)

await rejectsResponse((response) => {
  response.entries[0]!.protoPayload.authenticationInfo.principalEmail =
    'other-provider@reeditpro.iam.gserviceaccount.com'
}, /not authorized/u)

await rejectsResponse((response) => {
  response.entries[0]!.protoPayload.status = { code: 7 }
})

await rejectsResponse((response) => {
  response.entries[0]!.protoPayload.resourceName =
    'projects/reeditpro/locations/global/publishers/google/models/other'
})

await rejectsResponse((response) => {
  const first = response.entries[0]!.protoPayload.request.labels
  response.entries[0]!.protoPayload.request.labels =
    response.entries[1]!.protoPayload.request.labels
  response.entries[1]!.protoPayload.request.labels = first
}, /not exact/u)

const accessorResponse = exactResponse()
Object.defineProperty(accessorResponse.entries[0]!, 'timestamp', {
  enumerable: true,
  get: () => '2026-08-08T10:01:00.000Z',
})
await assert.rejects(() => createReader(fixtureAuth(
  () => accessorResponse,
)).readExact(readInput()), /not closed serialized data/u)

await assert.rejects(() => reader.readExact({
  ...readInput(),
  qualificationWindowStartedAtIso: '2026-08-08T09:00:00.000Z',
  qualificationWindowFinishedAtIso: '2026-08-08T10:00:00.001Z',
}), /window is invalid/u)

await assert.rejects(() => reader.readExact({
  ...readInput(),
  qualificationWindowStartedAtIso: '2026-08-08T12:00:00.000Z',
  qualificationWindowFinishedAtIso: '2026-08-08T12:00:01.000Z',
}), /window is invalid/u)

const failedAuth = fixtureAuth(() => {
  throw new Error('credential and endpoint details must not escape')
})
await assert.rejects(() => createReader(failedAuth).readExact(readInput()),
  /query failed/u)

console.log(JSON.stringify({
  smoke: 'visual-intelligence-provider-audit-window-read-port',
  checks: 42,
  status: 'passed',
  exactProjectWideRequestCount: 4,
  callerSelectedRequestFilter: false,
  rawProviderPayloadReturned: false,
  providerCallMadeByReader: false,
  productionReady: false,
}))

function readInput() {
  return {
    observationId: 'vi-provider-audit-window-20260808',
    observationVersion: 1,
    qualificationWindowStartedAtIso: startedAtIso,
    qualificationWindowFinishedAtIso: finishedAtIso,
    exactOrderedProviderRequestRefs: requestRefs,
  }
}

function exactResponse() {
  return {
    entries: requestRefs.map((requestRef, index) =>
      auditEntry(index + 1, requestRef)),
  }
}

function auditEntry(index: number, requestRef: ReturnType<typeof ref>) {
  const twoDigits = String(index).padStart(2, '0')
  const modelResource = 'projects/reeditpro/locations/global/publishers/google/'
    + 'models/gemini-3.1-pro-preview'
  return {
    insertId: `audit-insert-${twoDigits}`,
    timestamp: `2026-08-08T10:0${index}:00.000Z`,
    logName:
      'projects/reeditpro/logs/cloudaudit.googleapis.com%2Fdata_access',
    resource: {
      type: 'audited_resource',
      labels: {
        project_id: 'reeditpro',
        service: 'aiplatform.googleapis.com',
        method:
          'google.cloud.aiplatform.v1.PredictionService.GenerateContent',
      },
    },
    protoPayload: {
      '@type': 'type.googleapis.com/google.cloud.audit.AuditLog',
      serviceName: 'aiplatform.googleapis.com',
      methodName:
        'google.cloud.aiplatform.v1.PredictionService.GenerateContent',
      resourceName: modelResource,
      authenticationInfo: { principalEmail: principal },
      request: {
        model: modelResource,
        labels: visualIntelligenceProviderAuditCorrelationLabels(requestRef),
        contents: [{ role: 'user', parts: [{ text: 'not returned' }] }],
      },
      response: {
        responseId: `provider-response-${index}`,
        modelVersion: 'gemini-3.1-pro-preview',
        candidates: [{ content: 'not returned' }],
      },
      status: {},
    },
  }
}

async function rejectsResponse(
  mutate: (response: ReturnType<typeof exactResponse>) => void,
  pattern?: RegExp,
) {
  const response = exactResponse()
  mutate(response)
  const operation = () => createReader(fixtureAuth(
    () => response,
  )).readExact(readInput())
  if (pattern) await assert.rejects(operation, pattern)
  else await assert.rejects(operation)
}

function createReader(auth: Pick<GoogleAuth, 'request'>) {
  return createVisualIntelligenceProviderAuditWindowReadPort({
    configuration,
    auth,
    now: () => new Date('2026-08-08T12:00:00.000Z'),
  })
}

function fixtureAuth(
  value: () => unknown,
  calls: Array<Record<string, unknown>> = [],
) {
  return {
    async request(input: Record<string, unknown>) {
      calls.push(input)
      return { data: value() }
    },
  } as unknown as Pick<GoogleAuth, 'request'>
}

function ref(id: string) {
  return createVisualIntelligenceEvidenceRef(id, { id })
}
