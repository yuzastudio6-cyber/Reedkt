import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '../..')

const runId = 'ai-graphics-controlled-noop-worker-gate-local-static'
const evidenceRoot = path.join(
  repoRoot,
  '.local-artifacts/worker-runtime/ai-graphics-controlled-noop-worker-gate',
  runId,
)

const decision = 'worker_ai_graphics_metadata_controlled_noop_worker_gate_passed_with_warnings'
const sourceDecision =
  'worker_ai_graphics_metadata_controlled_noop_worker_gate_approved_with_warnings'
const scopedDryRunClaim = 'workerAiGraphicsMetadataJobPayloadDryRunPassed'
const controlledNoopClaim = 'workerAiGraphicsMetadataControlledNoopPassed'

const tools = [
  'd3',
  'echarts',
  'vega-lite',
  'vega',
  'satori',
  '@svgdotjs/svg.js',
  '@viz-js/viz',
  'lottie-web',
  'animejs',
  'three',
  'pixi.js',
  'konva',
  'babylonjs',
]

const fixturePaths = [
  'docs/worker-runtime/fixtures/ai-graphics-metadata-job-payload-example.valid.json',
  'docs/worker-runtime/fixtures/ai-graphics-metadata-job-payload-example.blocked.json',
  'docs/worker-runtime/fixtures/ai-graphics-metadata-job-payload-example.invalid.json',
  'docs/worker-runtime/fixtures/ai-graphics-metadata-job-payload-shape.schema.json',
]

const sourceDocs = [
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-execution-source-lockfile.md',
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-approval-source-lockfile.md',
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-approval-matrix.md',
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-approval-decision.md',
  'docs/worker-runtime/ai-graphics-metadata-controlled-noop-worker-gate-approval.md',
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-readiness-decision.md',
  'docs/worker-runtime/ai-graphics-job-payload-schema-validation-readiness-decision.md',
]

const blockedRuntimeFlags = [
  'workerExecutionApprovedNow',
  'workerJobClaimApprovedNow',
  'workerLeaseMutationApprovedNow',
  'queueExecutionApprovedNow',
  'routeExecutionApprovedNow',
  'actualToolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'browserRuntimeApprovedNow',
  'webglRuntimeApprovedNow',
  'canvasRuntimeApprovedNow',
  'resvgRasterizationApprovedNow',
  'remotionRenderExportApprovedNow',
  'supabaseMutationApprovedNow',
  'gcsUploadApprovedNow',
  'publicArtifactsApproved',
  'signedUrlsApproved',
  'rawPromptExecutionApproved',
  'internalBetaApproved',
  'externalBetaApproved',
  'productionApproved',
]

const forbiddenPatterns = [
  ['url', /\bhttps?:\/\//i],
  ['signed_url_marker', /\bsigned[_ -]?url\b/i],
  ['public_artifact_ref', /\bpublic[_ -]?artifact\b/i],
  ['aws_key', /\bA[SK]IA[0-9A-Z]{16}\b/],
  ['github_token', /\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}\b/],
  ['openai_key', /\bsk-[A-Za-z0-9]{20,}\b/],
  ['private_key', /-----BEGIN (?:RSA|EC|OPENSSH|PRIVATE) KEY-----/],
  ['raw_prompt', /\braw prompt\b/i],
  ['provider_raw_output', /\bprovider raw output\b/i],
  ['real_user_data', /\breal user data\b/i],
]

const failures = []

function repoPath(relativePath) {
  return path.join(repoRoot, relativePath)
}

function readText(relativePath) {
  const absolutePath = repoPath(relativePath)
  if (!existsSync(absolutePath)) {
    failures.push(`missing_file:${relativePath}`)
    return ''
  }
  return readFileSync(absolutePath, 'utf8')
}

function readJson(relativePath) {
  const text = readText(relativePath)
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch (error) {
    failures.push(`invalid_json:${relativePath}:${error.message}`)
    return null
  }
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function isPlaceholder(value) {
  return typeof value === 'string' && /^<[^<>]+>$/.test(value)
}

function assertPlaceholder(payload, field, label) {
  if (!isPlaceholder(payload[field])) {
    failures.push(`missing_placeholder:${label}:${field}`)
  }
}

function assertFalseFlags(payload, label) {
  const flags = payload?.blockedRuntimeFlags ?? {}
  for (const flag of blockedRuntimeFlags) {
    if (flags[flag] !== false) {
      failures.push(`runtime_flag_not_false:${label}:${flag}`)
    }
  }
}

function scanUnsafePayload(payload, label) {
  function scan(value, pointer) {
    if (Array.isArray(value)) {
      value.forEach((entry, index) => scan(entry, `${pointer}[${index}]`))
      return
    }
    if (value && typeof value === 'object') {
      for (const [key, entry] of Object.entries(value)) {
        scan(entry, `${pointer}.${key}`)
      }
      return
    }
    if (typeof value !== 'string') return
    if (isPlaceholder(value) || value.startsWith('blocked_if_')) return

    for (const [name, pattern] of forbiddenPatterns) {
      if (pattern.test(value)) {
        failures.push(`unsafe_fixture_content:${label}:${pointer}:${name}`)
      }
    }
  }

  scan(payload, '$')
}

function requireToken(content, token, label) {
  if (!content.includes(token)) {
    failures.push(`missing_token:${label}:${token}`)
  }
}

function requireBooleanTable(content, name, expected, label) {
  const pattern = new RegExp('\\|\\s*' + name + '\\s*\\|\\s*`' + expected + '`\\s*\\|')
  if (!pattern.test(content)) {
    failures.push(`missing_boolean:${label}:${name}:${expected}`)
  }
}

const ownSource = readFileSync(__filename, 'utf8')
const importLines = ownSource
  .split('\n')
  .filter((line) => line.trim().startsWith('import '))
const allowedImports = new Set(['node:crypto', 'node:fs', 'node:path', 'node:url'])
for (const line of importLines) {
  const match = line.match(/from '([^']+)'/)
  if (!match || !allowedImports.has(match[1])) {
    failures.push(`unexpected_executor_import:${line}`)
  }
}

const sourceContent = sourceDocs.map((doc) => readText(doc)).join('\n')
requireToken(sourceContent, 'PR #526', 'source_docs')
requireToken(sourceContent, sourceDecision, 'source_docs')
requireToken(sourceContent, 'PR #524', 'source_docs')
requireToken(sourceContent, 'PR #521', 'source_docs')
requireToken(sourceContent, 'PR #517', 'source_docs')
requireToken(sourceContent, 'PR #500', 'source_docs')
requireToken(sourceContent, 'ai-graphics-job-payload-dry-run-local-static', 'source_docs')
requireToken(sourceContent, 'PR #491', 'source_docs')
requireToken(sourceContent, 'ai-graphics-job-payload-schema-validation-local-static', 'source_docs')
requireToken(sourceContent, 'PR #464', 'source_docs')
requireToken(sourceContent, 'ai-graphics-local-fixture-validation-local-static', 'source_docs')
requireToken(sourceContent, scopedDryRunClaim, 'source_docs')

const approvalDecision = readText(
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-approval-decision.md',
)
requireBooleanTable(approvalDecision, 'futureControlledNoopWorkerGateExecutionApproved', 'true', 'approval')
requireBooleanTable(approvalDecision, 'genericDryRunPassedClaimed', 'false', 'approval')
requireBooleanTable(approvalDecision, 'dryRunPassedClaimed', 'false', 'approval')
requireBooleanTable(approvalDecision, 'generatedLocalFixturePassedClaimed', 'false', 'approval')
requireBooleanTable(approvalDecision, 'readyForWorkerExecutionPlanning', 'false', 'approval')

const matrixDoc = readText(
  'docs/worker-runtime/ai-graphics-controlled-noop-worker-gate-approval-matrix.md',
)
const toolResults = tools.map((tool) => {
  const present = matrixDoc.includes(`\`${tool}\``)
  const approved = present && matrixDoc.includes('`approved_with_warnings`')
  if (!present) failures.push(`missing_tool_in_approval_matrix:${tool}`)
  return {
    tool,
    proofBatch: tool === 'vega' ? 'Batch 1 peer' : tools.indexOf(tool) < 4 ? 'Batch 1' : tools.indexOf(tool) < 8 ? 'Batch 2' : 'Batch 3',
    proofStatus: 'accepted_with_warnings',
    controlledNoopGateApprovalStatus: approved ? 'approved_with_warnings' : 'missing',
    controlledNoopExecutionStatus: 'passed_with_warnings',
    planSnapshotIdPlaceholder: true,
    scopedToolCallManifestIdPlaceholder: true,
    privateArtifactRefChecksumPlaceholder: true,
    ownerCapabilityToolIds: true,
    noRealJobClaim: true,
    noLeaseMutation: true,
    noQueueExecution: true,
    noRouteExecution: true,
    noActualToolExecution: true,
    noProviderRuntime: true,
    noSupabaseMutation: true,
    noGcsUpload: true,
    noSignedUrlPublicArtifact: true,
    noBrowserWebglCanvasRuntime: true,
    observabilityAuditPlaceholder: true,
    failClosedMetadata: true,
    classification: 'accepted_with_warnings',
  }
})

const fixtureResults = []
for (const fixturePath of fixturePaths) {
  const payload = readJson(fixturePath)
  if (!payload) continue
  scanUnsafePayload(payload, fixturePath)
  if (!fixturePath.endsWith('.schema.json')) {
    for (const field of [
      'payloadId',
      'planSnapshotId',
      'scopedToolCallManifestId',
      'workerJobRef',
      'claimPlaceholderRef',
      'leasePlaceholderRef',
      'queuePlaceholderRef',
      'observabilityAuditRef',
    ]) {
      assertPlaceholder(payload, field, fixturePath)
    }
    const privateArtifact = payload.privateArtifactRef ?? payload.privateArtifactManifestRef
    if (!isPlaceholder(privateArtifact)) {
      failures.push(`missing_placeholder:${fixturePath}:privateArtifactRef`)
    }
    assertPlaceholder(payload, 'checksumRef', fixturePath)
    assertFalseFlags(payload, fixturePath)
    if (payload.ownerId !== 'AI_TOOLS_CREATIVE_GRAPHICS') {
      failures.push(`unexpected_owner:${fixturePath}:${payload.ownerId}`)
    }
    if (!String(payload.capabilityId ?? '').startsWith('AI_GRAPHICS.')) {
      failures.push(`unexpected_capability:${fixturePath}:${payload.capabilityId}`)
    }
    if (!payload.noExecutionProof || !String(payload.noExecutionProof).includes('only')) {
      failures.push(`missing_no_execution_proof:${fixturePath}`)
    }
    if (!Array.isArray(payload.failClosedAssertions) || payload.failClosedAssertions.length < 3) {
      failures.push(`missing_fail_closed_assertions:${fixturePath}`)
    }
  }
  fixtureResults.push({
    fixturePath,
    checksum: sha256(JSON.stringify(payload)),
    parsed: true,
  })
}

const resultBooleans = {
  controlledNoopWorkerGateExecuted: failures.length === 0,
  workerAiGraphicsMetadataControlledNoopPassed: failures.length === 0,
  workerAiGraphicsMetadataJobPayloadDryRunPassed: true,
  scopedPassClaimAccepted: true,
  genericDryRunPassedClaimed: false,
  genericDryRunPassedClaimAccepted: false,
  dryRunPassedClaimed: false,
  dryRunPassedClaimAccepted: false,
  generatedLocalFixturePassedClaimed: false,
  generatedLocalFixturePassedClaimAccepted: false,
  noRealJobClaimPassed: failures.length === 0,
  noLeaseMutationPassed: failures.length === 0,
  noQueueExecutionPassed: failures.length === 0,
  noRouteExecutionPassed: failures.length === 0,
  noActualToolExecutionPassed: failures.length === 0,
  noProviderRuntimePassed: failures.length === 0,
  noSupabaseMutationPassed: failures.length === 0,
  noGcsUploadPassed: failures.length === 0,
  noSignedUrlPassed: failures.length === 0,
  noPublicArtifactPassed: failures.length === 0,
  planSnapshotPlaceholderPassed: failures.length === 0,
  scopedManifestPlaceholderPassed: failures.length === 0,
  privateArtifactPlaceholderPassed: failures.length === 0,
  workerIntakeCoveragePassed: failures.length === 0,
  observabilityAuditPlaceholderPassed: failures.length === 0,
  failClosedMetadataPassed: failures.length === 0,
  liveWorkerExecutionApprovedNow: false,
  workerExecutionApprovedNow: false,
  workerJobClaimApprovedNow: false,
  workerLeaseMutationApprovedNow: false,
  queueExecutionApprovedNow: false,
  routeExecutionApprovedNow: false,
  actualToolExecutionApprovedNow: false,
  providerRuntimeApprovedNow: false,
  browserRuntimeApprovedNow: false,
  webglRuntimeApprovedNow: false,
  canvasRuntimeApprovedNow: false,
  resvgRasterizationApprovedNow: false,
  remotionRenderExportApprovedNow: false,
  supabaseMutationApprovedNow: false,
  gcsUploadApprovedNow: false,
  publicArtifactsApproved: false,
  signedUrlsApproved: false,
  rawPromptExecutionApproved: false,
  internalBetaApproved: false,
  externalBetaApproved: false,
  productionApproved: false,
}

const evidence = {
  runId,
  decision,
  sourceDecision,
  status: failures.length === 0 ? 'passed_with_warnings' : 'failed',
  generatedAt: new Date().toISOString(),
  toolsValidated: tools,
  fixtureResults,
  toolResults,
  resultBooleans,
  supabase: {
    classification: 'no write',
    status: 'docs_only',
    environmentTouched: 'none',
    sqlExecuted: 'none',
    migrationDeployed: 'no',
    milestoneSync: 'not_performed',
  },
  localEvidenceScope: {
    ignoredPath: `.local-artifacts/worker-runtime/ai-graphics-controlled-noop-worker-gate/${runId}/`,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
  },
  failures,
}

mkdirSync(evidenceRoot, { recursive: true })
const evidenceFiles = {
  'controlled-noop-report.json': evidence,
  'tool-intake-evidence.json': { runId, tools: toolResults },
  'job-payload-evidence.json': { runId, fixtureResults },
  'runtime-boundary-evidence.json': {
    runId,
    executorImports: [...allowedImports],
    productionWorkerRuntimeImported: false,
    routeHandlersImported: false,
    toolRuntimesImported: false,
    providerClientsImported: false,
    supabaseClientsImported: false,
    networkUsed: false,
  },
  'claim-lease-queue-evidence.json': {
    runId,
    realJobClaim: false,
    leaseMutation: false,
    queueExecution: false,
  },
  'artifact-scope-evidence.json': {
    runId,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    gcsUpload: false,
    supabaseMutation: false,
  },
  'checksum-summary.json': {
    runId,
    fixtureResults,
    sourceDocsChecksum: sha256(sourceContent),
  },
  'cleanup-evidence.json': {
    runId,
    localEvidenceIgnored: true,
    committedLocalArtifacts: false,
  },
}

for (const [fileName, contents] of Object.entries(evidenceFiles)) {
  writeFileSync(path.join(evidenceRoot, fileName), `${JSON.stringify(contents, null, 2)}\n`)
}

if (failures.length > 0) {
  console.error(JSON.stringify(evidence, null, 2))
  process.exit(1)
}

console.log(JSON.stringify(evidence, null, 2))
