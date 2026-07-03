import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import {
  TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_DECISION,
  TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_EXECUTION,
  TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_PACKET,
  TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_CONFIRM_ENV,
  buildThreeToolExternalAgentPersistedJobRouteInvocationInput,
  runThreeToolExternalAgentPersistedJobRouteInvocation,
} from '../services/tracka-three-tool-external-agent-persisted-job-route-invocation-1'

const approvedSnapshotConfirmEnv = 'REEDITPRO_CONFIRM_TRACKA_THREE_TOOL_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION'
const runId = new Date().toISOString().replace(/[:.]/g, '-') + '-' + crypto.randomBytes(4).toString('hex')
const outputDir = path.join(
  '/tmp/reeditpro-tracka-three-tool-external-agent-persisted-job-route-invocation-1',
  runId,
)
const reportPath = path.join(outputDir, 'three-tool-external-agent-persisted-job-route-invocation-1-report.json')
const manifestPath = path.join(outputDir, 'three-tool-external-agent-persisted-job-route-invocation-1-manifest.json')

function sha256(filePath: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')
}

function artifact(filePath: string): { fileName: string; bytes: number; sha256: string } {
  return {
    fileName: path.basename(filePath),
    bytes: fs.statSync(filePath).size,
    sha256: sha256(filePath),
  }
}

fs.mkdirSync(outputDir, { recursive: true })

const input = buildThreeToolExternalAgentPersistedJobRouteInvocationInput()
const result = await runThreeToolExternalAgentPersistedJobRouteInvocation(input, {
  env: {
    ...process.env,
    [TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_CONFIRM_ENV]: 'true',
    [approvedSnapshotConfirmEnv]: 'true',
  },
})

const report = {
  packet: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_PACKET,
  decision: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_DECISION,
  execution: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_EXECUTION,
  runId,
  outputDir,
  result,
  sourceDelegate: result.runtimeDelegateResult
    ? {
        runId: result.runtimeDelegateResult.runId,
        outputDir: result.runtimeDelegateResult.outputDir,
        report: result.runtimeDelegateResult.report,
        manifest: result.runtimeDelegateResult.manifest,
        artifacts: result.runtimeDelegateResult.artifacts,
      }
    : null,
  safety: result.safety,
  productReadyEndToEndLocalOssTools: result.productReadyEndToEndLocalOssTools,
  nextMilestone: result.nextMilestone,
}

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
const manifest = {
  packet: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_PACKET,
  runId,
  outputDir,
  report: reportPath,
  artifacts: [artifact(reportPath)],
  generatedArtifactsCommitted: 'none',
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
manifest.artifacts.push(artifact(manifestPath))
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))

const summary = {
  ok: result.ok,
  packet: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_PACKET,
  decision: result.decision,
  execution: result.execution,
  status: result.status,
  blockers: result.blockers,
  runId,
  outputDir,
  report: reportPath,
  manifest: manifestPath,
  artifacts: manifest.artifacts,
  runtimeDelegateRunId: result.runtimeDelegateResult?.runId ?? null,
  runtimeDelegateOutputDir: result.runtimeDelegateResult?.outputDir ?? null,
  runtimeDelegateArtifacts: result.runtimeDelegateResult?.artifacts ?? [],
  readiness: {
    gstreamer_render_pipeline_support: result.ok
      ? 'external_agent_persisted_job_route_invocation_passed'
      : result.status,
    mkvtoolnix_container_validation: result.ok
      ? 'external_agent_persisted_job_route_invocation_passed'
      : result.status,
    gpac_mp4box_packaging_validation: result.ok
      ? 'external_agent_persisted_job_route_invocation_passed'
      : result.status,
  },
  safety: result.safety,
  productReadyEndToEndLocalOssTools: 0,
  nextMilestone: result.nextMilestone,
}

console.log(JSON.stringify(summary, null, 2))
if (!result.ok) process.exit(1)
