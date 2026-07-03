import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import {
  TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_WORKER_LEASE_NOOP_PACKET,
  runGstreamerMkvtoolnixExternalAgentApprovedSnapshotWorkerLeaseNoop,
} from '../services/tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-worker-lease-noop-1'

const reportRoot = '/tmp/reeditpro-tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-worker-lease-noop-1'
const reportFileName = 'gstreamer-mkvtoolnix-external-agent-approved-snapshot-worker-lease-noop-report.json'
const manifestFileName = 'gstreamer-mkvtoolnix-external-agent-approved-snapshot-worker-lease-noop-manifest.json'

function buildRunId(): string {
  return `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
}

function writeJson(filePath: string, value: unknown): void {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

function artifact(filePath: string): { fileName: string; bytes: number; sha256: string } {
  const bytes = fs.statSync(filePath).size
  const sha256 = crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')
  return { fileName: path.basename(filePath), bytes, sha256 }
}

async function main(): Promise<void> {
  const runId = buildRunId()
  const outputDir = path.join(reportRoot, runId)
  fs.mkdirSync(outputDir, { recursive: true })

  const reportPath = path.join(outputDir, reportFileName)
  const manifestPath = path.join(outputDir, manifestFileName)
  const result = runGstreamerMkvtoolnixExternalAgentApprovedSnapshotWorkerLeaseNoop()

  const report = {
    ...result,
    runId,
    outputDir,
    reportPath,
    manifestPath,
  }
  writeJson(reportPath, report)

  const reportArtifact = artifact(reportPath)
  const manifest = {
    packet: TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_WORKER_LEASE_NOOP_PACKET,
    runId,
    outputDir,
    artifacts: [reportArtifact],
    generatedArtifactsCommitted: 'none',
    safety: result.safety,
  }
  writeJson(manifestPath, manifest)
  const manifestArtifact = artifact(manifestPath)

  console.log(JSON.stringify({
    ok: result.ok,
    packet: result.packet,
    decision: result.decision,
    execution: result.execution,
    status: result.status,
    blockers: result.blockers,
    runId,
    outputDir,
    report: reportPath,
    manifest: manifestPath,
    workerLane: result.workerLeaseNoop.workerLane,
    leaseNoopId: result.workerLeaseNoop.leaseNoopId,
    leaseNoopTokenHash: result.workerLeaseNoop.leaseNoopTokenHash,
    approvedSnapshotId: result.workerLeaseNoop.approvedSnapshotId,
    jobId: result.workerLeaseNoop.jobId,
    artifacts: [reportArtifact, manifestArtifact],
    nextMilestone: result.nextMilestone,
  }, null, 2))

  if (!result.ok) process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
