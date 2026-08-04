import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSam31QualificationInternalCostReceipt,
  assertCanonicalSam31QualificationLogEvidence,
  assertCanonicalSam31QualificationTerminalEvidence,
  CANONICAL_SAM3_1_QUALIFICATION_TERMINAL_PLATFORM_PORT_VERSION,
  createCanonicalSam31QualificationGoogleCloudTerminalPort,
  createCanonicalSam31QualificationTerminalEvidenceOwner,
  type CanonicalSam31QualificationTerminalPlatformObservation,
  type CanonicalSam31QualificationTerminalPlatformReadPort,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-terminal-evidence-owner'
import {
  admission,
  attemptId,
  mount,
  rate,
  submission,
  succeeded,
} from './canonical-sam3_1-source-checkpoint-qualification-a100-phase-smoke'
import { evidence as resultEvidence } from
  './canonical-sam3_1-source-checkpoint-qualification-result-owner-smoke'

const taskName = `${submission.batchJobResource}/taskGroups/group0/tasks/0`
const requests: Array<Record<string, unknown>> = []
let activeInstancePresent = false
const actualPort = createCanonicalSam31QualificationGoogleCloudTerminalPort({
  auth: {
    request: (async (request: Record<string, unknown>) => {
      requests.push(structuredClone(request))
      if (request.url ===
        `https://batch.googleapis.com/v1/${submission.batchJobResource}`) {
        return { data: {
          name: submission.batchJobResource,
          uid: submission.batchJobUid,
          status: { state: 'SUCCEEDED', runDuration: '600s' },
        } }
      }
      if (request.url ===
        `https://batch.googleapis.com/v1/${submission.batchJobResource}/taskGroups/group0/tasks`) {
        return { data: { tasks: [{
          name: taskName,
          status: { state: 'SUCCEEDED' },
        }] } }
      }
      if (request.url ===
        'https://compute.googleapis.com/compute/v1/projects/reeditpro/aggregated/instances') {
        return { data: {
          kind: 'compute#instanceAggregatedList',
          items: activeInstancePresent ? {
            'zones/us-central1-a': {
              instances: [{
                name: 'batch-active-a100-instance',
                status: 'RUNNING',
                labels: { 'batch-job-uid': submission.batchJobUid },
              }],
            },
          } : {},
        } }
      }
      if (request.url ===
        'https://logging.googleapis.com/v2/entries:list') {
        return { data: { entries: [
          logEntry('log-entry-2', '2026-08-04T18:09:30.000Z', 'NOTICE'),
          logEntry('log-entry-1', '2026-08-04T18:01:00.000Z', 'INFO'),
        ] } }
      }
      throw new Error('unexpected terminal API request')
    }) as never,
  },
})

const platform = await actualPort.rereadExactTerminal({
  batchJobResource: submission.batchJobResource,
  batchJobUid: submission.batchJobUid as string,
}) as CanonicalSam31QualificationTerminalPlatformObservation
assert.equal(requests.length, 4)
assert.equal(requests[0]?.method, 'GET')
assert.equal(requests[1]?.method, 'GET')
assert.equal(requests[2]?.method, 'GET')
assert.equal((requests[2]?.params as Record<string, unknown>).filter,
  `labels.batch-job-uid = ${submission.batchJobUid}`)
assert.equal(requests[3]?.method, 'POST')
assert.deepEqual((requests[3]?.data as Record<string, unknown>)
  .resourceNames, ['projects/reeditpro'])
assert.equal((requests[3]?.data as Record<string, unknown>).filter,
  `logName="projects/reeditpro/logs/batch_task_logs" AND labels.job_uid="${submission.batchJobUid}"`)
assert.equal((requests[3]?.data as Record<string, unknown>).orderBy,
  'timestamp asc')
assert.equal(platform.logEntries[0]?.insertId, 'log-entry-1')
assert.equal(platform.logEntries[1]?.insertId, 'log-entry-2')
assert.equal(platform.activeGpuResourceCountAfterTerminalReread, 0)
activeInstancePresent = true
await assert.rejects(actualPort.rereadExactTerminal({
  batchJobResource: submission.batchJobResource,
  batchJobUid: submission.batchJobUid as string,
}))
activeInstancePresent = false

const store = createObjectPort()
const owner = createCanonicalSam31QualificationTerminalEvidenceOwner({
  platformReadPort: fixedPlatformPort(platform),
  rateReadPort: { async rereadExactApprovedRate() {
    return structuredClone(rate)
  } },
  evidenceObjectPort: store.port,
  now: () => '2026-08-04T18:20:00.000Z',
})
const terminalEvidence = await owner.rereadAndPersist({
  attemptId,
  mountObservation: mount,
  admission,
  submission,
  terminalJobObservation: succeeded,
  resultEvidence,
})
assertCanonicalSam31QualificationTerminalEvidence(terminalEvidence)
assert.equal(terminalEvidence.terminalWorkerStoppedVerified, true)
assert.equal(terminalEvidence.activeGpuResourcesAfterTerminalObservation, 0)
assert.equal(
  terminalEvidence.platformInternalRunDurationCostEstimateRecorded,
  true,
)
assert.equal(terminalEvidence.sourceCheckpointQualificationGranted, false)
assert.equal(terminalEvidence.runtimeReleaseGranted, false)
assert.equal(terminalEvidence.customerCreditsMutated, false)
assert.equal(terminalEvidence.customerBillingAuthorityGranted, false)
assert.equal(terminalEvidence.productionReady, false)
assert.equal(store.records.size, 3)

const values = [...store.records.values()].map((body) =>
  JSON.parse(body.toString('utf8')))
const logEvidence = values.find((value) => value.schemaVersion ===
  'canonical-sam3_1-source-checkpoint-qualification-log-evidence-v1')
const costReceipt = values.find((value) => value.schemaVersion ===
  'canonical-sam3_1-source-checkpoint-qualification-internal-cost-receipt-v1')
assertCanonicalSam31QualificationLogEvidence(logEvidence)
assertCanonicalSam31QualificationInternalCostReceipt(costReceipt)
assert.equal(costReceipt.billingClassification,
  'platform_internal_qualification')
assert.equal(costReceipt.customerEligibleCostUsdNanos, 0)
assert.equal(costReceipt.customerCreditsSpent, 0)
assert.equal(costReceipt.canonicalCloudBillingInvoiceActualObserved, false)
assert(costReceipt.accountEffectiveRunDurationComputeEstimateUsdNanos > 0)

const replay = await owner.rereadAndPersist({
  attemptId,
  mountObservation: mount,
  admission,
  submission,
  terminalJobObservation: succeeded,
  resultEvidence,
})
assert.deepEqual(replay, terminalEvidence)
assert.equal(store.records.size, 3)

await refuses({ ...platform, batchJobUid: 'crossed-job-uid' })
await refuses({ ...platform, taskState: 'FAILED' as never })
await refuses({ ...platform, logEntries: [] })
await refuses({
  ...platform,
  logEntries: [...platform.logEntries].reverse(),
})
await refuses({
  ...platform,
  logEntries: platform.logEntries.map((entry, index) => index === 0
    ? { ...entry, severity: 'ERROR' as never } : entry),
})
await refuses({ ...platform, activeGpuResourceCountAfterTerminalReread: 1 as never })
await refuses({ ...platform, runDuration: '2s' })
await refuses({
  ...platform,
  logEntries: platform.logEntries.map((entry, index) => index === 0
    ? { ...entry, timestamp: '2026-08-04T18:21:00.000Z' } : entry),
})

const wrongRate = structuredClone(rate)
wrongRate.routeId = 'l4_heavy_fallback' as never
await assert.rejects(createCanonicalSam31QualificationTerminalEvidenceOwner({
  platformReadPort: fixedPlatformPort(platform),
  rateReadPort: { async rereadExactApprovedRate() { return wrongRate } },
  evidenceObjectPort: createObjectPort().port,
  now: () => '2026-08-04T18:20:00.000Z',
}).rereadAndPersist({
  attemptId,
  mountObservation: mount,
  admission,
  submission,
  terminalJobObservation: succeeded,
  resultEvidence,
}))

const tamperedTerminal = structuredClone(terminalEvidence)
tamperedTerminal.customerCreditsMutated = true as never
assert.throws(() =>
  assertCanonicalSam31QualificationTerminalEvidence(tamperedTerminal))
const tamperedCost = structuredClone(costReceipt)
tamperedCost.customerCreditsSpent = 1 as never
assert.throws(() =>
  assertCanonicalSam31QualificationInternalCostReceipt(tamperedCost))

const sourceText = readFileSync(new URL(
  '../services/canonical-sam3_1-source-checkpoint-qualification-terminal-evidence-owner.ts',
  import.meta.url,
), 'utf8')
assert.match(sourceText, /https:\/\/logging\.googleapis\.com\/v2\/entries:list/u)
assert.match(sourceText, /batch_task_logs/u)
assert.match(sourceText, /labels\.job_uid/u)
assert.match(sourceText, /labels\.batch-job-uid/u)
assert.match(sourceText, /compute\.googleapis\.com\/compute\/v1/u)
assert.match(sourceText, /pageSize: 1_000/u)
assert.match(sourceText, /retry: false/u)
assert.match(sourceText, /maxRedirects: 0/u)
assert.match(sourceText, /customerEligibleCostUsdNanos: z\.literal\(0\)/u)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-source-checkpoint-qualification-terminal-evidence-owner',
  checks: 45,
  exactBatchJobTaskAndLogReread: true,
  runDurationNanoseconds: costReceipt.runDurationNanoseconds,
  accountEffectiveRunDurationComputeEstimateUsdNanos:
    costReceipt.accountEffectiveRunDurationComputeEstimateUsdNanos,
  platformInternalQualification: true,
  activeGpuResourcesAfterTerminalObservation: 0,
  sourceCheckpointQualificationGranted: false,
  customerCreditsMutated: false,
  canonicalCloudBillingInvoiceActualObserved: false,
  productionReady: false,
}))

async function refuses(
  observation: CanonicalSam31QualificationTerminalPlatformObservation,
) {
  await assert.rejects(
    createCanonicalSam31QualificationTerminalEvidenceOwner({
      platformReadPort: fixedPlatformPort(observation),
      rateReadPort: { async rereadExactApprovedRate() {
        return structuredClone(rate)
      } },
      evidenceObjectPort: createObjectPort().port,
      now: () => '2026-08-04T18:20:00.000Z',
    }).rereadAndPersist({
      attemptId,
      mountObservation: mount,
      admission,
      submission,
      terminalJobObservation: succeeded,
      resultEvidence,
    }),
  )
}

function fixedPlatformPort(
  observation: CanonicalSam31QualificationTerminalPlatformObservation,
): CanonicalSam31QualificationTerminalPlatformReadPort {
  return {
    schemaVersion:
      CANONICAL_SAM3_1_QUALIFICATION_TERMINAL_PLATFORM_PORT_VERSION,
    async rereadExactTerminal() {
      return structuredClone(observation)
    },
  }
}

function logEntry(insertId: string, at: string, severity: string) {
  return {
    insertId,
    timestamp: at,
    severity,
    logName: 'projects/reeditpro/logs/batch_task_logs',
    labels: { job_uid: submission.batchJobUid },
    resource: { labels: { task_name: taskName } },
    textPayload: `controlled ${insertId}`,
  }
}

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
            throw new Error('controlled terminal evidence collision')
          }
          return 'already_exists'
        }
        records.set(input.objectPath, Buffer.from(input.body))
        return 'created'
      },
      async readExact(path) {
        const value = records.get(path)
        return value ? Buffer.from(value) : null
      },
    },
  }
}

function digest(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}
