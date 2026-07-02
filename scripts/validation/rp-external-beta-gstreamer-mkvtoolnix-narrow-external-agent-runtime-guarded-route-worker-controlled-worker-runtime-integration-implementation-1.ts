#!/usr/bin/env tsx
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import {
  buildGstreamerMkvtoolnixNarrowRuntimeIntegrationImplementationInput,
  validateGstreamerMkvtoolnixNarrowRuntimeIntegrationImplementationInput,
} from '../../server/services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-implementation-1'
import type { GuardedRuntimeExecutionSummary } from '../../server/services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-execution-packet-1'

const packet =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-RUNTIME-INTEGRATION-IMPLEMENTATION-1'
const blockedDecision = 'blocked_pending_gstreamer_mkvtoolnix_narrow_route_worker_runtime_integration_implementation_confirmation'
const confirmEnv =
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_RUNTIME_INTEGRATION_IMPLEMENTATION'
const outputRoot =
  '/tmp/reeditpro-rp-external-beta-gstreamer-mkvtoolnix-narrow-route-worker-runtime-integration-implementation-1'

function sha256(filePath: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')
}

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

function artifact(filePath: string): { fileName: string; path: string; bytes: number; sha256: string } {
  return {
    fileName: path.basename(filePath),
    path: filePath,
    bytes: fs.statSync(filePath).size,
    sha256: sha256(filePath),
  }
}

function createRunId(): string {
  return `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
}

function finish(summary: unknown, exitCode = 0): never {
  console.log(JSON.stringify(summary, null, 2))
  process.exit(exitCode)
}

if (process.env[confirmEnv] !== 'true') {
  finish(
    {
      ok: false,
      packet,
      decision: blockedDecision,
      execution: 'blocked_confirmation_absent_no_narrow_route_worker_runtime_integration_implementation_metadata',
      requiredGate: `${confirmEnv}=true`,
    },
    2,
  )
}

const guardedRuntime = {
  packet: 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-RUNTIME-EXECUTION-IMPLEMENTATION-1',
  decision: 'completed_gstreamer_mkvtoolnix_guarded_worker_runtime_execution_controlled_generated_fixture',
  execution: 'completed_confirmation_gated_local_render_worker_runtime_execution_generated_fixture_only',
  runId: '2026-07-01T20-56-05-092Z-9330089b',
  outputDir: '/tmp/reeditpro-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-execution-implementation-1/2026-07-01T20-56-05-092Z-9330089b',
  imageTag: 'reeditpro-tracka-native-container-render-tools-build-proof-3:2026-06-22T01-24-10-232Z-4e862aa8',
  commandResults: [
    {
      templateId: 'gst_fakesrc_fakesink_no_media_healthcheck_v1',
      ok: true,
      exitStatus: 0,
      mediaInput: false,
      mediaOutput: false,
    },
    {
      templateId: 'gst_controlled_generated_fixture_pipeline_v1',
      ok: true,
      exitStatus: 0,
      mediaInput: false,
      mediaOutput: false,
    },
    {
      templateId: 'mkvmerge_generated_subtitle_only_package_v1',
      ok: true,
      exitStatus: 0,
      mediaInput: 'generated_srt_fixture_only',
      mediaOutput: 'generated_subtitle_only_mkv_fixture',
    },
    {
      templateId: 'mkvmerge_identify_generated_subtitle_only_v1',
      ok: true,
      exitStatus: 0,
      mediaInput: 'generated_srt_fixture_only',
      mediaOutput: false,
    },
  ],
  runtimeExecution: {
    status: 'completed_controlled_generated_fixture_runtime_execution',
    dockerNetwork: 'none',
    routeExecution: 'not_run_runtime_runner_only',
    workerDispatch: 'not_run_runtime_runner_only',
    workerExecution: 'not_run_runtime_runner_only',
    gstreamerExecution: 'completed_controlled_generated_fixture_only',
    mkvtoolnixExecution: 'completed_controlled_generated_fixture_only',
    mediaProcessing: 'controlled_generated_fixture_only',
    privateMediaProcessing: false,
    userMediaProcessing: false,
  },
  safety: {},
  productReadyEndToEndLocalOssTools: 0,
  packageLock: 'unchanged',
  generatedArtifactsCommitted: 'none',
  validation: 'passed',
} satisfies GuardedRuntimeExecutionSummary

const id = createRunId()
const outputDir = path.join(outputRoot, id)
const input = buildGstreamerMkvtoolnixNarrowRuntimeIntegrationImplementationInput(guardedRuntime)
const validation = validateGstreamerMkvtoolnixNarrowRuntimeIntegrationImplementationInput(input)

const inputPath = path.join(outputDir, 'narrow-runtime-integration-implementation-input.json')
const envelopePath = path.join(outputDir, 'narrow-runtime-integration-implementation-envelope.json')
const qaReportPath = path.join(outputDir, 'narrow-runtime-integration-implementation-qa-report.json')
const reportPath = path.join(outputDir, 'narrow-runtime-integration-implementation-report.json')
const manifestPath = path.join(outputDir, 'narrow-runtime-integration-implementation-manifest.json')

writeJson(inputPath, {
  packet,
  confirmationGate: `${confirmEnv}=true`,
  input,
})
writeJson(envelopePath, validation.sanitizedIntegrationImplementation)
writeJson(qaReportPath, {
  packet,
  runId: id,
  status: validation.ok ? 'passed_runtime_integration_implementation_metadata_only' : validation.status,
  checks: [
    'confirmation_gate_present',
    'runtime_packet_source_validation_passed',
    'runtime_integration_packet_qa_source_present',
    'metadata_only_source_envelope_created',
    'idempotency_key_present',
    'route_registration_deferred',
    'worker_dispatch_deferred',
    'worker_lease_deferred',
    'no_route_worker_tool_or_media_execution',
  ],
  blockers: validation.blockers,
})
writeJson(reportPath, {
  ok: validation.ok,
  packet,
  decision: validation.decision,
  execution: validation.execution,
  status: validation.status,
  runId: id,
  outputDir,
  sourceEnvelope: validation.sanitizedIntegrationImplementation,
  responseShape: validation.responseShape,
  safety: validation.safety,
  productReadyEndToEndLocalOssTools: validation.productReadyEndToEndLocalOssTools,
  packageLock: 'unchanged',
  generatedArtifactsCommitted: 'none',
  nextMilestone: validation.nextMilestone,
})

const artifacts = [inputPath, envelopePath, qaReportPath, reportPath].map((filePath) => artifact(filePath))
writeJson(manifestPath, {
  packet,
  runId: id,
  outputDir,
  artifacts,
})
const finalManifest = {
  packet,
  runId: id,
  outputDir,
  artifacts: [...artifacts, artifact(manifestPath)],
}
writeJson(manifestPath, finalManifest)

finish(
  {
    ok: validation.ok,
    packet,
    decision: validation.decision,
    execution: validation.execution,
    status: validation.status,
    runId: id,
    outputDir,
    input: artifact(inputPath),
    envelope: artifact(envelopePath),
    qaReport: artifact(qaReportPath),
    report: artifact(reportPath),
    manifest: artifact(manifestPath),
    nextMilestone: validation.nextMilestone,
  },
  validation.ok ? 0 : 1,
)
