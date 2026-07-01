import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { createMockDatabase } from '../../src/backend/mock/mock-database'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_QUEUE_CONFIRM_ENV,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_QUEUE_DECISION,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_QUEUE_EXECUTION,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_QUEUE_NEXT_MILESTONE,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_QUEUE_PACKET,
  buildGstreamerMkvtoolnixNarrowControlledWorkerQueueInput,
  queueGstreamerMkvtoolnixNarrowControlledWorkerQueueMetadataMock,
  validateGstreamerMkvtoolnixNarrowControlledWorkerQueueInput,
} from '../../server/services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-queue-integration-1'

const packet = RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_QUEUE_PACKET
const outputRoot =
  '/tmp/reeditpro-rp-external-beta-gstreamer-mkvtoolnix-narrow-route-worker-controlled-worker-queue-integration-1'
const blocker = 'blocked_pending_gstreamer_mkvtoolnix_narrow_route_worker_controlled_worker_queue_confirmation'

function sha256(filePath: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')
}

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

function fileSummary(filePath: string) {
  return {
    fileName: path.basename(filePath),
    path: filePath,
    bytes: fs.statSync(filePath).size,
    sha256: sha256(filePath),
  }
}

function failClosed(details: Record<string, unknown> = {}): never {
  console.error(JSON.stringify({
    ok: false,
    packet,
    decision: blocker,
    execution: 'blocked_confirmation_absent_no_narrow_controlled_worker_queue_metadata',
    requiredGate: `${RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_QUEUE_CONFIRM_ENV}=true`,
    ...details,
  }, null, 2))
  process.exit(2)
}

if (process.env[RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_QUEUE_CONFIRM_ENV] !== 'true') {
  failClosed()
}

const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join(outputRoot, runId)
const inputPath = path.join(outputDir, 'narrow-controlled-worker-queue-input.json')
const reportPath = path.join(outputDir, 'narrow-controlled-worker-queue-report.json')
const manifestPath = path.join(outputDir, 'narrow-controlled-worker-queue-manifest.json')

const input = buildGstreamerMkvtoolnixNarrowControlledWorkerQueueInput()
const validation = validateGstreamerMkvtoolnixNarrowControlledWorkerQueueInput(input)
if (!validation.ok) failClosed({ blocker: validation.status, blockers: validation.blockers })

const queued = queueGstreamerMkvtoolnixNarrowControlledWorkerQueueMetadataMock(createMockDatabase(), input)
if (!queued.ok || !queued.queueItem || queued.queueItem.queueStatus !== 'queued') {
  failClosed({ blocker: queued.status, blockers: queued.blockers })
}

writeJson(inputPath, {
  packet,
  queueMode: input.queueMode,
  queueId: input.queueId,
  queueIdempotencyKey: input.queueIdempotencyKey,
  routeExecutionRequestedNow: false,
  workerDispatchRequestedNow: false,
  workerExecutionRequestedNow: false,
  gstreamerExecutionRequestedNow: false,
  mkvtoolnixExecutionRequestedNow: false,
  mediaProcessingRequestedNow: false,
  persistentQueueWriteRequestedNow: false,
})

const report = {
  ok: true,
  packet,
  decision: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_QUEUE_DECISION,
  execution: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_QUEUE_EXECUTION,
  runId,
  outputDir,
  confirmationGate: `${RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_QUEUE_CONFIRM_ENV}=true`,
  status: queued.status,
  queueItem: {
    id: queued.queueItem.id,
    jobId: queued.queueItem.jobId,
    queueStatus: queued.queueItem.queueStatus,
    workerKind: queued.queueItem.workerKind,
    mockOnly: queued.queueItem.mockOnly,
    payloadMockOnly: queued.queueItem.payload.mockOnly,
  },
  sanitizedQueue: queued.sanitizedQueue,
  safety: queued.safety,
  productReadyEndToEndLocalOssTools: queued.productReadyEndToEndLocalOssTools,
  nextMilestone: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_QUEUE_NEXT_MILESTONE,
}
writeJson(reportPath, report)

const manifest = {
  packet,
  runId,
  generatedAt: new Date().toISOString(),
  outputDir,
  artifacts: [fileSummary(inputPath), fileSummary(reportPath)],
}
writeJson(manifestPath, manifest)
const finalManifest = {
  ...manifest,
  artifacts: [...manifest.artifacts, fileSummary(manifestPath)],
}
writeJson(manifestPath, finalManifest)

console.log(JSON.stringify({
  ok: true,
  packet,
  decision: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_QUEUE_DECISION,
  execution: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_QUEUE_EXECUTION,
  runId,
  outputDir,
  input: fileSummary(inputPath),
  report: fileSummary(reportPath),
  manifest: fileSummary(manifestPath),
  nextMilestone: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_QUEUE_NEXT_MILESTONE,
}, null, 2))
