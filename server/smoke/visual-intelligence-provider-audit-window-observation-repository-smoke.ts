import assert from 'node:assert/strict'
import type { Storage } from '@google-cloud/storage'
import type { GoogleAuth } from 'google-auth-library'

import {
  createVisualIntelligenceEvidenceRef,
} from '../visual-intelligence/visual-intelligence-contract'
import {
  createVisualIntelligenceProviderAuditWindowObservationRepository,
  parseVisualIntelligenceProviderAuditWindowObservationPublicationReceipt,
  visualIntelligenceProviderAuditWindowObservationPublicationReceiptRef,
} from '../visual-intelligence/visual-intelligence-provider-audit-window-observation-repository'
import {
  createVisualIntelligenceProviderAuditWindowReadPort,
  createVisualIntelligenceProviderAuditWindowReaderConfiguration,
  visualIntelligenceProviderAuditCorrelationLabels,
  visualIntelligenceProviderAuditWindowObservationRef,
} from '../visual-intelligence/visual-intelligence-provider-audit-window-read-port'

const requestRefs = [
  ref('standard-warmup'),
  ref('standard-measured'),
  ref('long-warmup'),
  ref('long-measured'),
] as const
const storage = memoryStorage()
const repository =
  createVisualIntelligenceProviderAuditWindowObservationRepository({
    projectId: 'reeditpro',
    bucketName: 'reeditpro-control-plane',
    storage: storage.api as unknown as Storage,
  })
const observation = await fixtureObservation()
const receipt = await repository.persistCreateOnly(observation)

assert.deepEqual(
  parseVisualIntelligenceProviderAuditWindowObservationPublicationReceipt(
    receipt,
  ),
  receipt,
)
assert.equal(receipt.disposition, 'created')
assert.equal(receipt.createOnlyPreconditionUsed, true)
assert.equal(receipt.exactGenerationEtagDigestAndCanonicalJsonReread, true)
assert.equal(receipt.rawAuditRequestOrResponsePayloadPersisted, false)
assert.equal(receipt.rawPromptOrMediaLocatorPersisted, false)
assert.equal(receipt.providerCallMadeByRepository, false)
assert.equal(receipt.providerDispatchAuthorityGranted, false)
assert.equal(receipt.customerPricingOrServiceFeeAuthorityGranted, false)
assert.equal(receipt.walletOrCreditMutationAuthorityGranted, false)
assert.equal(receipt.productionReleaseAuthorityGranted, false)
assert.deepEqual(receipt.observationRef,
  visualIntelligenceProviderAuditWindowObservationRef(observation))
assert.deepEqual(await repository.readExact(receipt), observation)
assert.equal(storage.createOnlySaveCount(), 1)

const replay = await repository.persistCreateOnly(observation)
assert.equal(replay.disposition, 'already_exists_exact')
assert.equal(replay.objectName, receipt.objectName)
assert.equal(replay.generation, receipt.generation)
assert.equal(replay.etag, receipt.etag)
assert.equal(replay.contentSha256, receipt.contentSha256)
assert.deepEqual(await repository.readExact(replay), observation)
assert.equal(storage.createOnlySaveCount(), 2)

const receiptRef =
  visualIntelligenceProviderAuditWindowObservationPublicationReceiptRef(
    receipt,
  )
assert.equal(receiptRef.id, `${observation.observationId}.publication-receipt`)
assert.equal(receiptRef.version, observation.observationVersion)
assert.match(receiptRef.contentHash, /^sha256:[a-f0-9]{64}$/u)

const tamperedReceipt = structuredClone(receipt)
tamperedReceipt.byteLength += 1
assert.throws(() =>
  parseVisualIntelligenceProviderAuditWindowObservationPublicationReceipt(
    tamperedReceipt,
  ), /digest/u)

await assert.rejects(() =>
  createVisualIntelligenceProviderAuditWindowObservationRepository({
    projectId: 'reeditpro',
    bucketName: 'different-control-plane',
    storage: storage.api as unknown as Storage,
  }).readExact(receipt), /scope changed/u)

storage.tamper(receipt.objectName, (body) => {
  const parsed = JSON.parse(body.toString('utf8')) as Record<string, unknown>
  parsed.observedProviderRequestCount = 5
  return Buffer.from(JSON.stringify(parsed), 'utf8')
})
await assert.rejects(() => repository.readExact(receipt), /changed/u)

const conflictingStorage = memoryStorage()
const conflictingRepository =
  createVisualIntelligenceProviderAuditWindowObservationRepository({
    projectId: 'reeditpro',
    bucketName: 'reeditpro-control-plane',
    storage: conflictingStorage.api as unknown as Storage,
  })
const conflictingReceipt = await conflictingRepository.persistCreateOnly(
  observation,
)
conflictingStorage.tamper(conflictingReceipt.objectName, () =>
  Buffer.from('{"conflict":true}', 'utf8'))
await assert.rejects(() =>
  conflictingRepository.persistCreateOnly(observation),
  /(?:metadata is invalid|exact reread failed)/u)

assert.throws(() =>
  createVisualIntelligenceProviderAuditWindowObservationRepository({
    projectId: 'reeditpro',
    bucketName: '../unsafe',
  }), /not configured/u)

console.log(JSON.stringify({
  smoke: 'visual-intelligence-provider-audit-window-observation-repository',
  checks: 31,
  status: 'passed',
  createOnlyPersistence: true,
  exactGenerationReread: true,
  rawAuditPayloadPersisted: false,
  providerCallMadeByRepository: false,
  productionReady: false,
}))

async function fixtureObservation() {
  const configuration =
    createVisualIntelligenceProviderAuditWindowReaderConfiguration({
      schemaVersion:
        'visual-intelligence-provider-audit-window-reader-configuration-v1',
      projectId: 'reeditpro',
      expectedProviderPrincipalEmail:
        'visual-intelligence-provider@reeditpro.iam.gserviceaccount.com',
      timeoutMs: 15_000,
    })
  const auth = {
    async request() { return { data: exactAuditResponse() } },
  } as unknown as Pick<GoogleAuth, 'request'>
  return createVisualIntelligenceProviderAuditWindowReadPort({
    configuration,
    auth,
    now: () => new Date('2026-08-08T12:00:00.000Z'),
  }).readExact({
    observationId: 'vi-provider-audit-persistence-observation',
    observationVersion: 1,
    qualificationWindowStartedAtIso: '2026-08-08T10:00:00.000Z',
    qualificationWindowFinishedAtIso: '2026-08-08T10:10:00.000Z',
    exactOrderedProviderRequestRefs: requestRefs,
  })
}

function exactAuditResponse() {
  const principal =
    'visual-intelligence-provider@reeditpro.iam.gserviceaccount.com'
  const modelResource = 'projects/reeditpro/locations/global/publishers/google/'
    + 'models/gemini-3.1-pro-preview'
  return {
    entries: requestRefs.map((requestRef, index) => ({
      insertId: `audit-${index + 1}`,
      timestamp: `2026-08-08T10:0${index + 1}:00.000Z`,
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
        },
        response: {
          responseId: `provider-response-${index + 1}`,
          modelVersion: 'gemini-3.1-pro-preview',
        },
        status: {},
      },
    })),
  }
}

interface StoredObject {
  body: Buffer
  generation: string
  etag: string
  contentType: string
}

function memoryStorage() {
  const objects = new Map<string, StoredObject>()
  let createOnlySaves = 0
  const requireObject = (objectName: string) => {
    const stored = objects.get(objectName)
    if (!stored) throw Object.assign(new Error('Not found.'), { code: 404 })
    return stored
  }
  return {
    api: {
      bucket() {
        return {
          file(objectName: string) {
            return {
              async save(body: Buffer, options: {
                contentType: string
                preconditionOpts: { ifGenerationMatch: number }
              }) {
                createOnlySaves += 1
                if (options.preconditionOpts.ifGenerationMatch !== 0) {
                  throw new Error('Expected create-only persistence.')
                }
                if (objects.has(objectName)) {
                  throw Object.assign(new Error('Exists.'), { code: 412 })
                }
                objects.set(objectName, {
                  body: Buffer.from(body),
                  generation: '1',
                  etag: `etag-${objects.size + 1}`,
                  contentType: options.contentType,
                })
              },
              async getMetadata() {
                const stored = requireObject(objectName)
                return [{
                  generation: stored.generation,
                  etag: stored.etag,
                  contentType: stored.contentType,
                  size: String(stored.body.byteLength),
                }]
              },
              async download() {
                return [Buffer.from(requireObject(objectName).body)]
              },
            }
          },
        }
      },
    },
    createOnlySaveCount: () => createOnlySaves,
    tamper(objectName: string, mutation: (body: Buffer) => Buffer) {
      const stored = requireObject(objectName)
      stored.body = mutation(Buffer.from(stored.body))
    },
  }
}

function ref(id: string) {
  return createVisualIntelligenceEvidenceRef(id, { id })
}
