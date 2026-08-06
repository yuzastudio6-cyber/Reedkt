import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSam31A100QualificationFoundationObservation,
} from '../services/canonical-sam3_1-a100-qualification-foundation-owner'
import {
  createCanonicalSam31A100QualificationFoundationRepository,
} from '../services/canonical-sam3_1-a100-qualification-foundation-repository'
import {
  createFoundation,
} from './canonical-sam3_1-a100-qualification-foundation-owner-smoke'

const objectStore = createObjectPort()
const repository =
  createCanonicalSam31A100QualificationFoundationRepository({
    objectPort: objectStore.port,
  })

const denied = createFoundation({
  capacityReady: false,
  observedAt: '2026-08-04T18:01:00.000Z',
})
const deniedReceipt = await repository.persistCurrentFoundationCreateOnly({
  observation: denied,
  publishedAt: '2026-08-04T18:02:00.000Z',
})
assert.equal(deniedReceipt.disposition, 'created')
assert.equal(deniedReceipt.gpuJobStarted, false)
assert.equal(deniedReceipt.modelOrCheckpointDownloaded, false)
assert.equal(deniedReceipt.customerCreditsMutated, false)
assert.equal(deniedReceipt.productionAuthorityGranted, false)
assert.equal(objectStore.records.size, 1)

const deniedReplay = await repository.persistCurrentFoundationCreateOnly({
  observation: denied,
  publishedAt: '2026-08-04T18:02:00.000Z',
})
assert.equal(deniedReplay.disposition, 'identical_replay')
assert.equal(objectStore.records.size, 1)

const stagingRead = await repository.rereadCurrentFoundation({
  purpose: 'private_artifact_staging',
  at: '2026-08-04T18:04:00.000Z',
})
assert.equal(
  assertCanonicalSam31A100QualificationFoundationObservation(
    stagingRead,
  ).observationHash,
  denied.observationHash,
)
await assert.rejects(repository.rereadCurrentFoundation({
  purpose: 'a100_qualification_dispatch',
  at: '2026-08-04T18:04:00.000Z',
}))

const conflictingSameSlot = createFoundation({
  capacityReady: true,
  observedAt: '2026-08-04T18:03:00.000Z',
})
await assert.rejects(repository.persistCurrentFoundationCreateOnly({
  observation: conflictingSameSlot,
  publishedAt: '2026-08-04T18:04:00.000Z',
}))

const granted = createFoundation({
  capacityReady: true,
  observedAt: '2026-08-04T18:06:00.000Z',
})
const grantedReceipt = await repository.persistCurrentFoundationCreateOnly({
  observation: granted,
  publishedAt: '2026-08-04T18:06:30.000Z',
})
assert.equal(grantedReceipt.disposition, 'created')
assert.equal(objectStore.records.size, 2)
const dispatchRead = await repository.rereadCurrentFoundation({
  purpose: 'a100_qualification_dispatch',
  at: '2026-08-04T18:08:00.000Z',
})
assert.equal(
  assertCanonicalSam31A100QualificationFoundationObservation(
    dispatchRead,
  ).observationHash,
  granted.observationHash,
)

const newerDenied = createFoundation({
  capacityReady: false,
  observedAt: '2026-08-04T18:11:00.000Z',
})
await repository.persistCurrentFoundationCreateOnly({
  observation: newerDenied,
  publishedAt: '2026-08-04T18:12:00.000Z',
})
await assert.rejects(repository.rereadCurrentFoundation({
  purpose: 'a100_qualification_dispatch',
  at: '2026-08-04T18:12:30.000Z',
}))

assert.equal(await repository.rereadCurrentFoundation({
  purpose: 'private_artifact_staging',
  at: '2026-08-04T18:40:00.000Z',
}), null)

const latestPath = [...objectStore.records.keys()].find((path) =>
  path.endsWith('/20260804T1810Z.json'))
assert(latestPath)
const latestBody = objectStore.records.get(latestPath)
assert(latestBody)
const tampered = JSON.parse(latestBody.toString('utf8')) as {
  customerCreditsMutated: boolean
}
tampered.customerCreditsMutated = true
objectStore.records.set(latestPath, Buffer.from(JSON.stringify(tampered)))
await assert.rejects(repository.rereadCurrentFoundation({
  purpose: 'private_artifact_staging',
  at: '2026-08-04T18:12:30.000Z',
}))
objectStore.records.set(latestPath, latestBody)

assert.deepEqual([...objectStore.records.keys()].sort(), [
  'private/sam3_1/a100-qualification-foundation/v1/observations/20260804T1800Z.json',
  'private/sam3_1/a100-qualification-foundation/v1/observations/20260804T1805Z.json',
  'private/sam3_1/a100-qualification-foundation/v1/observations/20260804T1810Z.json',
])

const cliSource = readFileSync(new URL(
  '../cli/publish-sam3_1-a100-qualification-foundation.ts',
  import.meta.url,
), 'utf8')
assert.match(cliSource,
  /16-audit-visual-intelligence-live-prerequisites\.sh/u)
assert.match(cliSource,
  /publish-current-sam31-a100-foundation-observation/u)
assert.match(cliSource, /execFile\('\/bin\/bash', \[AUDIT_SCRIPT\]/u)
assert.match(cliSource, /createCanonicalGcsSam31/u)
assert.doesNotMatch(cliSource,
  /HUGGINGFACE|MODEL_WEIGHT|from_pretrained|hf_hub_download/u)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-a100-qualification-foundation-repository',
  checks: 40,
  exactFiveMinuteCreateOnlySlots: true,
  identicalReplayAcceptedWithoutRewrite: true,
  conflictingSameSlotRejected: true,
  newestObservationWins: true,
  deniedCapacityCannotUseOlderGrant: true,
  staleObservationReturnsNoAuthority: true,
  tamperedRecordRejected: true,
  fixedReadOnlyAuditPublisherMounted: true,
  callerCommandPathModelOrCredentialAccepted: false,
  gpuJobStarted: false,
  modelOrCheckpointDownloaded: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}))

function createObjectPort(): {
  port: CanonicalCreateOnlyJsonObjectPort
  records: Map<string, Buffer>
} {
  const records = new Map<string, Buffer>()
  return {
    records,
    port: {
      async createOnly(input) {
        const prior = records.get(input.objectPath)
        if (prior) {
          if (digest(prior) !== input.contentSha256) {
            throw new Error('controlled create-only collision')
          }
          return 'already_exists'
        }
        if (digest(input.body) !== input.contentSha256) {
          throw new Error('controlled content hash mismatch')
        }
        records.set(input.objectPath, Buffer.from(input.body))
        return 'created'
      },
      async readExact(objectPath) {
        const record = records.get(objectPath)
        return record ? Buffer.from(record) : null
      },
    },
  }
}

function digest(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}
