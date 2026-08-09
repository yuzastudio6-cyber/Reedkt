import assert from 'node:assert/strict'
import type { Storage } from '@google-cloud/storage'
import type { GoogleAuth } from 'google-auth-library'

import {
  createVisualIntelligenceDetailedBillingExportObservationRepository,
  parseVisualIntelligenceDetailedBillingExportObservationPublicationReceipt,
} from '../visual-intelligence/visual-intelligence-detailed-billing-export-observation-repository'
import {
  createVisualIntelligenceDetailedBillingExportReadPort,
  createVisualIntelligenceDetailedBillingExportReaderConfiguration,
} from '../visual-intelligence/visual-intelligence-detailed-billing-export-read-port'
import {
  WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG,
} from '../visual-intelligence/visual-intelligence-model-billing-sku-qualification'

const observation = await fixtureObservation()
const storage = createMemoryStorage()
const repository =
  createVisualIntelligenceDetailedBillingExportObservationRepository({
    projectId: 'reeditpro',
    bucketName: 'reeditpro-control-plane',
    storage: storage as unknown as Storage,
  })
const first = await repository.persistCreateOnly(observation)
assert.deepEqual(
  parseVisualIntelligenceDetailedBillingExportObservationPublicationReceipt(
    first,
  ),
  first,
)
assert.equal(first.disposition, 'created')
assert.equal(first.generation, '1')
assert.equal(first.contentType, 'application/json')
assert.equal(first.observationRef.contentHash,
  observation.observationDigestSha256)
assert.deepEqual(first.queryConfigurationRef,
  observation.queryConfigurationRef)
assert.equal(first.createOnlyPreconditionUsed, true)
assert.equal(first.exactGenerationEtagDigestAndCanonicalJsonReread, true)
assert.equal(first.billingAccountIdentifierReturned, false)
assert.equal(first.billingExportDatasetOrTableIdentifierReturned, false)
assert.equal(first.providerCallMade, false)
assert.equal(first.providerDispatchAuthorityGranted, false)
assert.equal(first.customerPricingOrServiceFeeAuthorityGranted, false)
assert.equal(first.walletOrCreditMutationAuthorityGranted, false)
assert.equal(first.productionReleaseAuthorityGranted, false)
assert.equal(JSON.stringify(first).includes('billing_export_private'), false)
assert.equal(JSON.stringify(first).includes('billingAccounts/'), false)
assert.deepEqual(await repository.readExact(first), observation)

const replay = await repository.persistCreateOnly(observation)
assert.equal(replay.disposition, 'already_exists_exact')
assert.equal(replay.objectName, first.objectName)
assert.equal(replay.generation, first.generation)
assert.equal(replay.etag, first.etag)

const tamperedReceipt = structuredClone(first)
tamperedReceipt.byteLength += 1
await assert.rejects(() => repository.readExact(tamperedReceipt), /digest/u)

const crossBucketRepository =
  createVisualIntelligenceDetailedBillingExportObservationRepository({
    projectId: 'reeditpro',
    bucketName: 'reeditpro-other-private',
    storage: createMemoryStorage() as unknown as Storage,
  })
await assert.rejects(() => crossBucketRepository.readExact(first),
  /scope changed/u)

storage.tamperBody(first.objectName)
await assert.rejects(() => repository.readExact(first), /exact reread changed/u)
await assert.rejects(() => repository.persistCreateOnly(observation),
  /exact persistence failed/u)

const badMetadataStorage = createMemoryStorage()
const badMetadataRepository =
  createVisualIntelligenceDetailedBillingExportObservationRepository({
    projectId: 'reeditpro',
    bucketName: 'reeditpro-control-plane',
    storage: badMetadataStorage as unknown as Storage,
  })
badMetadataStorage.changeContentTypeAfterSave('text/plain')
await assert.rejects(() =>
  badMetadataRepository.persistCreateOnly(observation), /metadata is invalid/u)

const failedStorage = createMemoryStorage()
failedStorage.failNextSave(500)
await assert.rejects(() =>
  createVisualIntelligenceDetailedBillingExportObservationRepository({
    projectId: 'reeditpro',
    bucketName: 'reeditpro-control-plane',
    storage: failedStorage as unknown as Storage,
  }).persistCreateOnly(observation), /persistence failed/u)

assert.throws(() =>
  createVisualIntelligenceDetailedBillingExportObservationRepository({
    projectId: 'reeditpro',
    bucketName: 'INVALID_BUCKET',
  }))

console.log(JSON.stringify({
  smoke: 'visual-intelligence-detailed-billing-export-observation-repository',
  checks: 28,
  status: 'passed',
  createOnlyPersisted: true,
  exactGenerationReread: true,
  idempotentReplay: true,
  providerCalled: false,
  productionReady: false,
}))

async function fixtureObservation() {
  const configuration =
    createVisualIntelligenceDetailedBillingExportReaderConfiguration({
      schemaVersion:
        'visual-intelligence-detailed-billing-export-reader-configuration-v1',
      queryProjectId: 'reeditpro-billing-query',
      billingExportDatasetId: 'billing_export_private',
      billingExportTableId:
        'gcp_billing_export_resource_v1_012345_ABCDEF_987654',
      billedProjectId: 'reeditpro',
      providerServiceId: 'services/C7E2-9256-1C43',
      maximumBytesBilled: '10000000',
      timeoutMs: 15_000,
    })
  const auth = {
    async request() {
      return { data: exactResponse() }
    },
  } as unknown as Pick<GoogleAuth, 'request'>
  return createVisualIntelligenceDetailedBillingExportReadPort({
    configuration,
    auth,
    now: () => new Date('2026-08-08T12:00:00.000Z'),
  }).readExact({
    observationId: 'vi-billing-observation-repository-fixture',
    observationVersion: 1,
    qualificationWindowStartedAtIso: '2026-08-08T10:00:00.000Z',
    qualificationWindowFinishedAtIso: '2026-08-08T10:10:00.000Z',
  })
}

function exactResponse() {
  const names = [
    'sku_id',
    'sku_description',
    'usage_amount',
    'usage_unit',
    'cost',
    'currency',
    'row_count',
    'max_export_time',
  ]
  return {
    jobComplete: true,
    totalRows: '6',
    schema: { fields: names.map((name) => ({ name })) },
    rows: WEEDITPRO_VISUAL_INTELLIGENCE_GEMINI_RATE_CATALOG.terms.map(
      (term, index) => ({
        f: [
          term.skuId,
          term.expectedDisplayName,
          String(index + 1),
          'count',
          `${index + 1}.00`,
          'USD',
          '1',
          '2026-08-08T11:00:00.000Z',
        ].map((v) => ({ v })),
      }),
    ),
    errors: [],
  }
}

interface StoredObject {
  body: Buffer
  generation: string
  etag: string
  contentType: string
}

function createMemoryStorage() {
  const objects = new Map<string, StoredObject>()
  let nextSaveErrorCode: number | null = null
  let forcedContentType: string | null = null
  const requireObject = (objectName: string): StoredObject => {
    const stored = objects.get(objectName)
    if (!stored) throw Object.assign(new Error('Not found.'), { code: 404 })
    return stored
  }
  return {
    bucket() {
      return {
        file: (objectName: string) => ({
          save: async (body: Buffer, options: {
            contentType: string
            preconditionOpts: { ifGenerationMatch: number }
          }) => {
            if (nextSaveErrorCode !== null) {
              const code = nextSaveErrorCode
              nextSaveErrorCode = null
              throw Object.assign(new Error('Fixture save failed.'), { code })
            }
            if (options.preconditionOpts.ifGenerationMatch !== 0) {
              throw new Error('Expected a create-only precondition.')
            }
            if (objects.has(objectName)) {
              throw Object.assign(new Error('Precondition failed.'), {
                code: 412,
              })
            }
            objects.set(objectName, {
              body: Buffer.from(body),
              generation: '1',
              etag: 'etag-billing-observation-1',
              contentType: forcedContentType ?? options.contentType,
            })
          },
          getMetadata: async () => {
            const stored = requireObject(objectName)
            return [{
              generation: stored.generation,
              etag: stored.etag,
              contentType: stored.contentType,
              size: String(stored.body.byteLength),
            }]
          },
          download: async () => [Buffer.from(requireObject(objectName).body)],
        }),
      }
    },
    tamperBody(objectName: string) {
      const stored = requireObject(objectName)
      const body = Buffer.from(stored.body)
      body[body.byteLength - 2] = body[body.byteLength - 2] === 97 ? 98 : 97
      objects.set(objectName, { ...stored, body })
    },
    changeContentTypeAfterSave(value: string) {
      forcedContentType = value
    },
    failNextSave(code: number) {
      nextSaveErrorCode = code
    },
  }
}
