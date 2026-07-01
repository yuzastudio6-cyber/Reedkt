import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_NOOP_SOURCE_DRY_RUN_CONFIRM_ENV,
  buildGstreamerMkvtoolnixNarrowNoopSourceInput,
  createGstreamerMkvtoolnixNarrowNoopSourceResponse,
  validateGstreamerMkvtoolnixNarrowNoopSourceInput,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-noop-source-implementation-1'
import { buildGstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput } from '../services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-1'

const packet =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-NOOP-SOURCE-DRY-RUN-1'
const decision = 'completed_gstreamer_mkvtoolnix_narrow_route_worker_noop_source_dry_run'
const execution =
  'completed_confirmation_gated_noop_source_contract_dry_run_no_route_worker_tool_or_media_execution'
const nextMilestone =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-NOOP-SOURCE-DRY-RUN-QA-ROLLUP-1'

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

if (process.env[RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_NOOP_SOURCE_DRY_RUN_CONFIRM_ENV] !== 'true') {
  console.error(
    JSON.stringify(
      {
        ok: false,
        packet,
        blocker: 'blocked_pending_gstreamer_mkvtoolnix_narrow_route_worker_noop_source_dry_run_confirmation',
        requiredGate: `${RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_NOOP_SOURCE_DRY_RUN_CONFIRM_ENV}=true`,
      },
      null,
      2,
    ),
  )
  process.exit(1)
}

const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join(
  '/tmp/reeditpro-rp-external-beta-gstreamer-mkvtoolnix-narrow-route-worker-noop-source-dry-run-1',
  runId,
)
const reportPath = path.join(outputDir, 'noop-source-dry-run-report.json')
const manifestPath = path.join(outputDir, 'noop-source-dry-run-manifest.json')

const validInput = buildGstreamerMkvtoolnixNarrowNoopSourceInput()
const valid = validateGstreamerMkvtoolnixNarrowNoopSourceInput(validInput)
assert.equal(valid.ok, true, valid.blockers.join(', '))
assert.equal(valid.sanitizedSource.routeExecution, false)
assert.equal(valid.sanitizedSource.workerDispatch, false)
assert.equal(valid.sanitizedSource.workerExecution, false)
assert.equal(valid.sanitizedSource.gstreamerExecution, false)
assert.equal(valid.sanitizedSource.mkvtoolnixExecution, false)
assert.equal(valid.safety.supabaseMutation, false)
assert.equal(valid.safety.sqlExecution, false)

const response = createGstreamerMkvtoolnixNarrowNoopSourceResponse(validInput)
assert.equal(response.status, 'accepted_noop_source_contract')
assert.equal(response.runtimeEnabled, false)
assert.equal(response.routeExecution, false)
assert.equal(response.workerDispatch, false)
assert.equal(response.workerExecution, false)
assert.equal(response.toolExecution, false)

const negativeChecks = [
  {
    name: 'missing_source_reference_blocks',
    input: buildGstreamerMkvtoolnixNarrowNoopSourceInput({ sourceImplementationId: '' }),
    blocker: 'blocked_missing_narrow_route_worker_noop_source_reference',
  },
  {
    name: 'invalid_upstream_boundary_blocks',
    input: buildGstreamerMkvtoolnixNarrowNoopSourceInput({
      boundaryInput: buildGstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput({ routeExecution: true }),
    }),
    blocker: 'blocked_narrow_route_worker_boundary_validation_failed',
  },
  {
    name: 'enabled_runtime_blocks',
    input: buildGstreamerMkvtoolnixNarrowNoopSourceInput({ routeRuntimeMode: 'enabled_route_runtime' }),
    blocker: 'blocked_invalid_narrow_route_worker_noop_source_state',
  },
  {
    name: 'route_execution_blocks',
    input: buildGstreamerMkvtoolnixNarrowNoopSourceInput({ routeExecution: true }),
    blocker: 'blocked_route_worker_queue_or_runtime_execution_not_enabled',
  },
  {
    name: 'worker_dispatch_blocks',
    input: buildGstreamerMkvtoolnixNarrowNoopSourceInput({ workerDispatch: true }),
    blocker: 'blocked_route_worker_queue_or_runtime_execution_not_enabled',
  },
  {
    name: 'gstreamer_execution_blocks',
    input: buildGstreamerMkvtoolnixNarrowNoopSourceInput({ gstreamerExecution: true }),
    blocker: 'blocked_route_worker_queue_or_runtime_execution_not_enabled',
  },
  {
    name: 'mkvtoolnix_execution_blocks',
    input: buildGstreamerMkvtoolnixNarrowNoopSourceInput({ mkvtoolnixExecution: true }),
    blocker: 'blocked_route_worker_queue_or_runtime_execution_not_enabled',
  },
  {
    name: 'supabase_sql_blocks',
    input: buildGstreamerMkvtoolnixNarrowNoopSourceInput({ supabaseMutation: true, sqlExecution: true }),
    blocker: 'blocked_route_worker_queue_or_runtime_execution_not_enabled',
  },
  {
    name: 'public_artifact_blocks',
    input: buildGstreamerMkvtoolnixNarrowNoopSourceInput({ publicArtifactCreation: true }),
    blocker: 'blocked_public_or_signed_artifact_attempt',
  },
  {
    name: 'final_export_blocks',
    input: buildGstreamerMkvtoolnixNarrowNoopSourceInput({ finalRenderExport: true }),
    blocker: 'blocked_delivery_or_unlock_attempt',
  },
] as const

const negativeResults = negativeChecks.map((check) => {
  const result = validateGstreamerMkvtoolnixNarrowNoopSourceInput(check.input)
  assert.equal(result.ok, false, check.name)
  assert.ok(result.blockers.includes(check.blocker), check.name)
  return {
    name: check.name,
    expectedBlocker: check.blocker,
    passed: true,
  }
})

const report = {
  packet,
  runId,
  decision,
  execution,
  sourceChain: {
    noopSourceQaRollupMergeSha: '27d558b1868b24a14f076e9aa381bc8e3cae7e22',
    noopSourceQaDecision: 'qa_passed_gstreamer_mkvtoolnix_narrow_route_worker_noop_source_implementation_evidence',
    noopSourceQaReadiness: 'ready_for_guarded_narrow_route_worker_noop_source_dry_run',
  },
  confirmation: {
    gate: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_NOOP_SOURCE_DRY_RUN_CONFIRM_ENV,
    value: 'true',
  },
  commandMatrix: [
    {
      command: 'validateGstreamerMkvtoolnixNarrowNoopSourceInput(buildGstreamerMkvtoolnixNarrowNoopSourceInput())',
      status: 'passed',
    },
    {
      command: 'createGstreamerMkvtoolnixNarrowNoopSourceResponse(validInput)',
      status: 'passed',
    },
    {
      command: 'negative fail-closed blocker matrix',
      status: 'passed',
    },
  ],
  responseShape: response,
  negativeResults,
  safety: {
    productionRouteFileCreated: false,
    routeRegistered: false,
    routeEnabled: false,
    routeExecution: false,
    workerDispatch: false,
    workerExecution: false,
    workerProcessStart: false,
    workerLeaseClaim: false,
    persistentQueueWrite: false,
    serviceRoleSecretPayloadAccess: false,
    frontendCredentialExposure: false,
    broadServiceRoleHandler: false,
    gstreamerExecution: false,
    mkvtoolnixExecution: false,
    dockerExecution: false,
    ffmpegFfprobeExecution: false,
    remotionExecution: false,
    mediaProcessing: false,
    privateMediaProcessing: false,
    userMediaProcessing: false,
    supabaseMutation: false,
    sqlExecution: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    finalRenderExport: false,
    broadExternalBetaUnlock: false,
    paidProductionUnlock: false,
    productionUnlock: false,
  },
  productReadyEndToEndLocalOssTools: 0,
  nextMilestone,
}

writeJson(reportPath, report)
writeJson(manifestPath, {
  packet,
  runId,
  outputDir,
  artifacts: [fileSummary(reportPath)],
})

const result = {
  ok: true,
  packet,
  runId,
  outputDir,
  report: fileSummary(reportPath),
  manifest: fileSummary(manifestPath),
  decision,
  execution,
  nextMilestone,
}

console.log(JSON.stringify(result, null, 2))
