import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import {
  buildGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput,
  createGstreamerMkvtoolnixNarrowRegisteredNoopSourceResponse,
  validateGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput,
  type GstreamerMkvtoolnixNarrowRegisteredNoopSourceInput,
} from '../services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-implementation-1'

const packet =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-REGISTERED-NOOP-SOURCE-ROUTE-WORKER-EXECUTION-PACKET-1'
const confirmationEnv =
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_ROUTE_WORKER_EXECUTION_PACKET'
const blockedDecision =
  'blocked_pending_gstreamer_mkvtoolnix_narrow_route_worker_registered_noop_source_route_worker_execution_packet_confirmation'
const decision = 'completed_gstreamer_mkvtoolnix_narrow_registered_noop_source_route_worker_execution_packet'
const execution =
  'completed_confirmation_gated_registered_noop_source_route_worker_execution_packet_no_route_worker_tool_or_media_execution'
const sourceQaRollupMergeSha = 'dbb4884f08aa9c77467ec07039633784db6d798b'
const sourceQaDecision = 'qa_passed_gstreamer_mkvtoolnix_narrow_registered_noop_source_route_worker_dry_run_evidence'
const sourceQaReadiness = 'ready_for_guarded_registered_noop_source_route_worker_execution_packet'
const nextMilestone =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-REGISTERED-NOOP-SOURCE-ROUTE-WORKER-EXECUTION-PACKET-QA-ROLLUP-1'

type RouteWorkerExecutionPacketEnvelope = {
  executionPacketMode: 'registered_noop_route_worker_execution_packet_contract_only'
  routeSourceId: string
  routeSourcePath: string
  routeOwner: 'backend_service_role_only'
  routeRegistrationMode: 'source_declared_registered_but_runtime_disabled'
  routeRuntimeMode: 'disabled_registered_noop_source_contract_only'
  workerSourceMode: 'source_declared_not_dispatched'
  sourceIdempotencyKey: string
  acceptedSourceStatus: 'accepted_registered_noop_source_contract'
  routeRegisteredAtRuntime: false
  routeExecution: false
  workerDispatch: false
  workerExecution: false
  workerProcessStart: false
  workerLeaseClaim: false
  persistentQueueWrite: false
  serviceRoleSecretPayloadAccess: false
  frontendCredentialExposure: false
  broadServiceRoleHandler: false
  gstreamerExecution: false
  mkvtoolnixExecution: false
  dockerExecution: false
  ffmpegFfprobeExecution: false
  remotionExecution: false
  mediaProcessing: false
  privateMediaProcessing: false
  userMediaProcessing: false
  supabaseMutation: false
  sqlExecution: false
  signedUrlCreation: false
  publicArtifactCreation: false
  finalRenderExport: false
  broadExternalBetaUnlock: false
  paidProductionUnlock: false
  productionUnlock: false
  rawCommand?: string
  mediaPath?: string
  signedUrl?: string
}

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

function failClosed(blocker: string, details: Record<string, unknown> = {}): never {
  console.error(
    JSON.stringify(
      {
        ok: false,
        packet,
        decision: blockedDecision,
        execution: 'blocked_confirmation_absent_no_registered_noop_source_route_worker_execution_packet',
        blocker,
        requiredGate: `${confirmationEnv}=true`,
        ...details,
      },
      null,
      2,
    ),
  )
  process.exit(2)
}

function buildEnvelope(input: GstreamerMkvtoolnixNarrowRegisteredNoopSourceInput): RouteWorkerExecutionPacketEnvelope {
  const validated = validateGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput(input)
  assert.equal(validated.ok, true, validated.blockers.join(', '))
  const response = createGstreamerMkvtoolnixNarrowRegisteredNoopSourceResponse(input)
  assert.equal(response.status, 'accepted_registered_noop_source_contract')
  assert.equal(response.runtimeEnabled, false)
  assert.equal(response.routeRegisteredAtRuntime, false)
  assert.equal(response.routeExecution, false)
  assert.equal(response.workerDispatch, false)
  assert.equal(response.workerExecution, false)
  assert.equal(response.toolExecution, false)

  return {
    executionPacketMode: 'registered_noop_route_worker_execution_packet_contract_only',
    routeSourceId: validated.sanitizedSource.routeSourceId,
    routeSourcePath: validated.sanitizedSource.routeSourcePath,
    routeOwner: validated.sanitizedSource.routeOwner,
    routeRegistrationMode: validated.sanitizedSource.routeRegistrationMode,
    routeRuntimeMode: validated.sanitizedSource.routeRuntimeMode,
    workerSourceMode: validated.sanitizedSource.workerSourceMode,
    sourceIdempotencyKey: validated.sanitizedSource.sourceIdempotencyKey,
    acceptedSourceStatus: response.status,
    routeRegisteredAtRuntime: false,
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
  }
}

function validateEnvelope(envelope: Record<string, unknown>): string[] {
  const failures: string[] = []
  const requiredStrings = [
    'executionPacketMode',
    'routeSourceId',
    'routeSourcePath',
    'routeOwner',
    'routeRegistrationMode',
    'routeRuntimeMode',
    'workerSourceMode',
    'sourceIdempotencyKey',
    'acceptedSourceStatus',
  ] as const
  for (const key of requiredStrings) {
    if (typeof envelope[key] !== 'string' || String(envelope[key]).trim().length === 0) failures.push(`missing_${key}`)
  }
  if (envelope.executionPacketMode !== 'registered_noop_route_worker_execution_packet_contract_only') {
    failures.push('invalid_execution_packet_mode')
  }
  if (envelope.routeOwner !== 'backend_service_role_only') failures.push('invalid_route_owner')
  if (envelope.routeRegistrationMode !== 'source_declared_registered_but_runtime_disabled') {
    failures.push('invalid_route_registration_mode')
  }
  if (envelope.routeRuntimeMode !== 'disabled_registered_noop_source_contract_only') {
    failures.push('invalid_route_runtime_mode')
  }
  if (envelope.workerSourceMode !== 'source_declared_not_dispatched') failures.push('invalid_worker_source_mode')
  if (envelope.acceptedSourceStatus !== 'accepted_registered_noop_source_contract') failures.push('invalid_source_status')
  for (const flag of [
    'routeRegisteredAtRuntime',
    'routeExecution',
    'workerDispatch',
    'workerExecution',
    'workerProcessStart',
    'workerLeaseClaim',
    'persistentQueueWrite',
    'serviceRoleSecretPayloadAccess',
    'frontendCredentialExposure',
    'broadServiceRoleHandler',
    'gstreamerExecution',
    'mkvtoolnixExecution',
    'dockerExecution',
    'ffmpegFfprobeExecution',
    'remotionExecution',
    'mediaProcessing',
    'privateMediaProcessing',
    'userMediaProcessing',
    'supabaseMutation',
    'sqlExecution',
    'signedUrlCreation',
    'publicArtifactCreation',
    'finalRenderExport',
    'broadExternalBetaUnlock',
    'paidProductionUnlock',
    'productionUnlock',
  ] as const) {
    if (envelope[flag] === true) failures.push(`${flag}_forbidden`)
  }
  if (envelope.rawCommand) failures.push('raw_command_forbidden')
  if (envelope.mediaPath) failures.push('media_path_forbidden')
  if (envelope.signedUrl) failures.push('signed_url_forbidden')
  return failures
}

if (process.env[confirmationEnv] !== 'true') failClosed(blockedDecision)

const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join(
  '/tmp/reeditpro-rp-external-beta-gstreamer-mkvtoolnix-narrow-route-worker-registered-noop-source-route-worker-execution-packet-1',
  runId,
)
const envelopePath = path.join(outputDir, 'registered-noop-source-route-worker-execution-packet-envelope.json')
const reportPath = path.join(outputDir, 'registered-noop-source-route-worker-execution-packet-report.json')
const manifestPath = path.join(outputDir, 'registered-noop-source-route-worker-execution-packet-manifest.json')

const input = buildGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput()
const envelope = buildEnvelope(input)
const positiveFailures = validateEnvelope(envelope as unknown as Record<string, unknown>)
if (positiveFailures.length > 0) failClosed('blocked_registered_noop_source_route_worker_execution_packet_positive_validation_failed', { positiveFailures })

const negativeCases = [
  { name: 'reject_route_registered_at_runtime', patch: { routeRegisteredAtRuntime: true } },
  { name: 'reject_route_execution', patch: { routeExecution: true } },
  { name: 'reject_worker_dispatch', patch: { workerDispatch: true } },
  { name: 'reject_worker_execution', patch: { workerExecution: true } },
  { name: 'reject_worker_process_start', patch: { workerProcessStart: true } },
  { name: 'reject_worker_lease_claim', patch: { workerLeaseClaim: true } },
  { name: 'reject_persistent_queue_write', patch: { persistentQueueWrite: true } },
  { name: 'reject_tool_execution', patch: { gstreamerExecution: true, mkvtoolnixExecution: true } },
  { name: 'reject_supabase_sql', patch: { supabaseMutation: true, sqlExecution: true } },
  { name: 'reject_public_artifact', patch: { publicArtifactCreation: true } },
  { name: 'reject_final_delivery_unlock', patch: { finalRenderExport: true, productionUnlock: true } },
  { name: 'reject_raw_command', patch: { rawCommand: 'forbidden_raw_tool_command_placeholder' } },
  { name: 'reject_media_path', patch: { mediaPath: '/tmp/private-input.mp4' } },
] as const

const negativeResults = negativeCases.map((item) => {
  const failures = validateEnvelope({ ...(envelope as Record<string, unknown>), ...item.patch })
  assert.ok(failures.length > 0, item.name)
  return {
    name: item.name,
    rejected: true,
    failures,
  }
})

const safety = {
  productionRouteFileCreated: false,
  routeRegisteredAtRuntime: false,
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
}

writeJson(envelopePath, {
  packet,
  runId,
  sourceQaRollupMergeSha,
  sourceQaDecision,
  sourceQaReadiness,
  confirmationGate: `${confirmationEnv}=true`,
  envelope,
  positiveEnvelopeValidation: 'passed',
  negativeEnvelopeValidation: negativeResults,
})

writeJson(reportPath, {
  packet,
  runId,
  outputDir,
  decision,
  execution,
  sourceChain: {
    registeredNoopSourceRouteWorkerDryRunQaRollupMergeSha: sourceQaRollupMergeSha,
    registeredNoopSourceRouteWorkerDryRunQaDecision: sourceQaDecision,
    registeredNoopSourceRouteWorkerDryRunQaReadiness: sourceQaReadiness,
  },
  confirmation: {
    gate: confirmationEnv,
    value: 'true',
  },
  commandMatrix: [
    {
      command: 'buildGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput()',
      status: 'passed',
    },
    {
      command: 'validateGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput(input)',
      status: 'passed',
    },
    {
      command: 'createGstreamerMkvtoolnixNarrowRegisteredNoopSourceResponse(input)',
      status: 'passed',
    },
    {
      command: 'local registered no-op route/worker execution packet envelope validation',
      status: 'passed',
    },
    {
      command: 'negative fail-closed route/worker blocker matrix',
      status: 'passed',
    },
  ],
  acceptedEnvelope: {
    executionPacketMode: envelope.executionPacketMode,
    routeSourceId: envelope.routeSourceId,
    routeSourcePath: envelope.routeSourcePath,
    routeOwner: envelope.routeOwner,
    routeRegistrationMode: envelope.routeRegistrationMode,
    routeRuntimeMode: envelope.routeRuntimeMode,
    workerSourceMode: envelope.workerSourceMode,
    acceptedSourceStatus: envelope.acceptedSourceStatus,
  },
  negativeResults,
  safety,
  productReadyEndToEndLocalOssTools: 0,
  packageLock: 'unchanged',
  generatedArtifactsCommitted: 'none',
  nextMilestone,
})

writeJson(manifestPath, {
  packet,
  runId,
  outputDir,
  artifacts: [fileSummary(envelopePath), fileSummary(reportPath)],
})

const result = {
  ok: true,
  packet,
  runId,
  outputDir,
  envelope: fileSummary(envelopePath),
  report: fileSummary(reportPath),
  manifest: fileSummary(manifestPath),
  decision,
  execution,
  nextMilestone,
}

console.log(JSON.stringify(result, null, 2))
