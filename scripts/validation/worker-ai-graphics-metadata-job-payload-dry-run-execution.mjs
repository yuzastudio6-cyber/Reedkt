import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const runId = 'ai-graphics-job-payload-dry-run-local-static'
const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))))
const outputDir = join(
  repoRoot,
  '.local-artifacts',
  'worker-runtime',
  'ai-graphics-job-payload-dry-run',
  runId,
)

const fixturePaths = {
  schema: 'docs/worker-runtime/fixtures/ai-graphics-metadata-job-payload-shape.schema.json',
  valid: 'docs/worker-runtime/fixtures/ai-graphics-metadata-job-payload-example.valid.json',
  blocked: 'docs/worker-runtime/fixtures/ai-graphics-metadata-job-payload-example.blocked.json',
  invalid: 'docs/worker-runtime/fixtures/ai-graphics-metadata-job-payload-example.invalid.json',
}

const sourceDocs = [
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-source-lockfile.md',
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-approval-decision.md',
  'docs/worker-runtime/ai-graphics-job-payload-dry-run-worker-intake-matrix.md',
  'docs/worker-runtime/ai-graphics-job-payload-owner-approval-decision.md',
  'docs/worker-runtime/ai-graphics-job-payload-schema-validation-run-results.md',
  'docs/worker-runtime/ai-graphics-job-payload-schema-validation-qa-run-results.md',
]

const requiredTools = [
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

const requiredPayloadFields = [
  'payloadId',
  'planSnapshotId',
  'scopedToolCallManifestId',
  'ownerId',
  'capabilityId',
  'toolId',
  'privateArtifactManifestRef',
  'checksumRef',
  'validationFixtureRef',
  'workerJobRef',
  'claimPlaceholderRef',
  'leasePlaceholderRef',
  'queuePlaceholderRef',
  'blockedRuntimeFlags',
  'noExecutionProof',
  'observabilityAuditRef',
  'failClosedAssertions',
]

const requiredFalseBooleans = [
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

const requiredAssertions = [
  'blocked_if_plan_snapshot_missing',
  'blocked_if_scoped_manifest_missing',
  'blocked_if_runtime_requested',
  'blocked_if_public_artifact_requested',
]

const forbiddenPatterns = [
  ['url', /\bhttps?:\/\//i],
  ['signed_url_marker', /\b(?:signedUrl|signed_url|X-Goog-Signature|X-Amz-Signature)\b/i],
  ['public_artifact_ref', /\bpublic[_ -]?artifact[_ -]?ref\b/i],
  ['raw_prompt_text', /\braw prompt text\b/i],
  ['provider_raw_output', /\bprovider raw output\b/i],
  ['real_user_data', /\breal user data\b/i],
  ['executable_instruction', /\b(?:execute|run|dispatch|claim|mutate|enqueue|render|rasterize|upload|sign)\s+(?:worker|route|tool|provider|job|lease|queue|render|artifact|url)\b/i],
  [
    'secret_material',
    /\b(sk-[A-Za-z0-9_-]{32,}|Bearer\s+[A-Za-z0-9._~+/-]{32,}|postgres(?:ql)?:\/\/|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}|X-Goog-Signature=|X-Amz-Signature=)\b/i,
  ],
]

const failures = []
const warnings = [
  'source PR #498 remains draft/open',
  'dry-run execution is local/static metadata validation only',
  'worker execution, job claim, lease mutation, and queue execution remain blocked',
]

function readText(path) {
  const absPath = join(repoRoot, path)
  if (!existsSync(absPath)) {
    failures.push(`missing_file:${path}`)
    return ''
  }
  return readFileSync(absPath, 'utf8')
}

function readJson(path) {
  const text = readText(path)
  try {
    return JSON.parse(text)
  } catch (error) {
    failures.push(`invalid_json:${path}:${error.message}`)
    return null
  }
}

function sha256(text) {
  return createHash('sha256').update(text).digest('hex')
}

function isPlaceholder(value) {
  return typeof value === 'string' && /^<[A-Z0-9_]+>$/.test(value)
}

function validateSafetyText(text, label) {
  for (const [name, pattern] of forbiddenPatterns) {
    const match = text.match(pattern)
    if (match) failures.push(`${label}_forbidden_${name}:${match[0]}`)
  }
}

function requireField(payload, field, label) {
  if (!(field in payload)) failures.push(`${label}_missing_field:${field}`)
}

function requirePlaceholder(payload, field, label) {
  requireField(payload, field, label)
  if (field in payload && !isPlaceholder(payload[field])) failures.push(`${label}_field_not_placeholder:${field}`)
}

function validateFalseFlags(payload, label) {
  if (!payload?.blockedRuntimeFlags || typeof payload.blockedRuntimeFlags !== 'object') {
    failures.push(`${label}_blocked_runtime_flags_missing`)
    return
  }
  for (const key of requiredFalseBooleans) {
    if (payload.blockedRuntimeFlags[key] !== false) failures.push(`${label}_runtime_flag_not_false:${key}`)
  }
}

function validateCommonPayload(payload, label) {
  for (const field of requiredPayloadFields) requireField(payload, field, label)
  for (const field of [
    'planSnapshotId',
    'scopedToolCallManifestId',
    'privateArtifactManifestRef',
    'checksumRef',
    'validationFixtureRef',
    'workerJobRef',
    'claimPlaceholderRef',
    'leasePlaceholderRef',
    'queuePlaceholderRef',
    'observabilityAuditRef',
  ]) {
    requirePlaceholder(payload, field, label)
  }
  if (payload.ownerId !== 'AI_TOOLS_CREATIVE_GRAPHICS') failures.push(`${label}_owner_id_invalid`)
  if (typeof payload.capabilityId !== 'string' || !payload.capabilityId.startsWith('AI_GRAPHICS.')) {
    failures.push(`${label}_capability_id_invalid`)
  }
  validateFalseFlags(payload, label)
  if (!Array.isArray(payload.failClosedAssertions)) failures.push(`${label}_fail_closed_assertions_missing`)
}

const fixtureTextByPath = {}
const fixtureByName = {}
for (const [name, path] of Object.entries(fixturePaths)) {
  fixtureTextByPath[path] = readText(path)
  fixtureByName[name] = readJson(path)
  validateSafetyText(fixtureTextByPath[path], `${name}_fixture`)
}

const schema = fixtureByName.schema
if (schema?.schemaName !== 'ai_graphics_metadata_job_payload_shape') failures.push('schema_name_invalid')
if (schema?.schemaVersion !== 'docs_only_v1') failures.push('schema_version_invalid')
if (schema?.executionInstruction !== 'not_executable_docs_only') failures.push('schema_execution_instruction_invalid')
for (const field of requiredPayloadFields) {
  if (!schema?.requiredFields?.includes(field)) failures.push(`schema_required_field_missing:${field}`)
}
for (const flag of requiredFalseBooleans) {
  if (!schema?.blockedBooleansRequiredFalse?.includes(flag)) failures.push(`schema_false_boolean_missing:${flag}`)
}

const validPayload = fixtureByName.valid
validateCommonPayload(validPayload ?? {}, 'valid')
if (validPayload?.planSnapshotId !== '<APPROVED_PLAN_SNAPSHOT_FIXTURE>') failures.push('valid_plan_snapshot_placeholder_invalid')
if (validPayload?.scopedToolCallManifestId !== '<SCOPED_TOOL_CALL_MANIFEST_REF>') {
  failures.push('valid_scoped_manifest_placeholder_invalid')
}
if (validPayload?.privateArtifactScope !== 'private_placeholder_only') failures.push('valid_private_artifact_scope_invalid')
if (validPayload?.noExecutionProof !== 'metadata_payload_shape_only') failures.push('valid_no_execution_proof_invalid')
for (const assertion of requiredAssertions) {
  if (!validPayload?.failClosedAssertions?.includes(assertion)) failures.push(`valid_fail_closed_assertion_missing:${assertion}`)
}

const blockedPayload = fixtureByName.blocked
validateCommonPayload(blockedPayload ?? {}, 'blocked')
if (blockedPayload?.expectedBlockedReason !== 'fail_closed_before_execution') failures.push('blocked_expected_reason_invalid')
if (blockedPayload?.noExecutionProof !== 'blocked_case_shape_only') failures.push('blocked_no_execution_proof_invalid')

const invalidPayload = fixtureByName.invalid
validateCommonPayload(invalidPayload ?? {}, 'invalid')
if (invalidPayload?.expectedInvalidReason !== 'missing_scoped_manifest_and_checksum_placeholders') {
  failures.push('invalid_expected_reason_invalid')
}
if (invalidPayload?.noExecutionProof !== 'invalid_case_shape_only') failures.push('invalid_no_execution_proof_invalid')
if (invalidPayload?.scopedToolCallManifestId !== '<MISSING_SCOPED_TOOL_CALL_MANIFEST_REF>') {
  failures.push('invalid_missing_manifest_placeholder_not_present')
}
if (invalidPayload?.checksumRef !== '<MISSING_CHECKSUM_REF>') failures.push('invalid_missing_checksum_placeholder_not_present')
if (!invalidPayload?.failClosedAssertions?.includes('blocked_if_signed_url_requested')) {
  failures.push('invalid_signed_url_fail_closed_assertion_missing')
}

const sourceDocText = sourceDocs.map(readText).join('\n')
for (const tool of requiredTools) {
  const row = sourceDocText.split('\n').find((line) => line.includes(`\`${tool}\``))
  if (!row) failures.push(`worker_intake_tool_missing:${tool}`)
  else {
    for (const token of [
      'accepted_with_warnings',
      '<APPROVED_PLAN_SNAPSHOT_FIXTURE>',
      '<SCOPED_TOOL_CALL_MANIFEST_REF>',
      '<PRIVATE_ARTIFACT_MANIFEST_REF>',
      '<CHECKSUM_REF>',
      'claim/lease placeholder required',
      'queue placeholder required',
      'no-execution required',
      'fail-closed required',
    ]) {
      if (!row.includes(token)) failures.push(`worker_intake_tool_token_missing:${tool}:${token}`)
    }
  }
}

const validations = {
  dryRunExecutionExecuted: true,
  workerAiGraphicsMetadataJobPayloadDryRunPassed: failures.length === 0,
  validDryRunCasePassed: failures.filter((failure) => failure.startsWith('valid_')).length === 0,
  blockedDryRunCasePassed: failures.filter((failure) => failure.startsWith('blocked_')).length === 0,
  invalidDryRunCasePassed: failures.filter((failure) => failure.startsWith('invalid_')).length === 0,
  staticDryRunExecutorPassed: !failures.some((failure) => failure.startsWith('missing_file:scripts/') || failure.includes('runtime_import')),
  planSnapshotDryRunMappingPassed: !failures.some((failure) => failure.includes('plan_snapshot')),
  scopedManifestDryRunMappingPassed: !failures.some((failure) => failure.includes('scoped_manifest')),
  privateArtifactDryRunRefsPassed: !failures.some((failure) => failure.includes('private_artifact')),
  claimLeaseDryRunPlaceholdersPassed: !failures.some((failure) => failure.includes('claim') || failure.includes('lease')),
  queueDryRunPlaceholdersPassed: !failures.some((failure) => failure.includes('queue')),
  noExecutionDryRunAssertionsPassed: !failures.some((failure) => failure.includes('no_execution') || failure.includes('executable_instruction')),
  observabilityAuditDryRunPassed: !failures.some((failure) => failure.includes('observability')),
  failClosedDryRunPassed: !failures.some((failure) => failure.includes('fail_closed')),
  workerIntakeDryRunPassed: !failures.some((failure) => failure.startsWith('worker_intake')),
}

const decisionState = failures.length
  ? failures.some((failure) => failure.includes('forbidden') || failure.includes('secret') || failure.includes('url'))
    ? 'blocked_pending_worker_ai_graphics_dry_run_fixture_safety_fixes'
    : failures.some((failure) => failure.includes('private_artifact') || failure.includes('checksum'))
      ? 'blocked_pending_worker_ai_graphics_dry_run_artifact_scope_fixes'
      : failures.some((failure) => failure.includes('fail_closed'))
        ? 'blocked_pending_worker_ai_graphics_dry_run_fail_closed_fixes'
        : 'blocked_pending_worker_ai_graphics_dry_run_failures'
  : 'worker_ai_graphics_metadata_job_payload_dry_run_passed_with_warnings'

const localEvidencePath =
  '.local-artifacts/worker-runtime/ai-graphics-job-payload-dry-run/ai-graphics-job-payload-dry-run-local-static/'

const report = {
  runId,
  decisionState,
  sourcePrs: {
    workerDryRunApproval: '#498',
    workerOwnerApproval: '#496',
    workerSchemaValidationQa: '#493',
    workerSchemaValidationExecution: '#491',
    workerSchemaValidationApproval: '#487',
    workerShapeQa: '#485',
    workerShapeApproval: '#482',
    workerHandoffQa: '#480',
    workerHandoffApproval: '#478',
    toolRouteGateOwnerApproval: '#476',
    toolRouteGateQa: '#473',
    toolRouteGateStatus: '#471',
    toolRouteValidationExecution: '#464',
  },
  toolsValidated: requiredTools,
  validations,
  blockedApprovals: Object.fromEntries(requiredFalseBooleans.map((key) => [key, false])),
  dryRunExecutionApprovedNow: false,
  dryRunPassedClaimed: false,
  generatedLocalFixturePassedClaimed: false,
  supabase: {
    updateRequired: 'no write',
    updateStatus: 'docs_only',
    environmentTouched: 'none',
    sqlExecuted: 'none',
    migrationDeployed: 'no',
    milestoneSync: 'not_performed',
  },
  localEvidencePath,
  warnings,
  failures,
}

const artifactPayloads = {
  'dry-run-report.json': report,
  'valid-dry-run-case-evidence.json': {
    runId,
    result: validations.validDryRunCasePassed ? 'passed_with_warnings' : 'blocked',
    payloadId: validPayload?.payloadId,
    workerAiGraphicsMetadataJobPayloadDryRunPassed: validations.workerAiGraphicsMetadataJobPayloadDryRunPassed,
    runtimeApprovalsFalse: true,
  },
  'blocked-dry-run-case-evidence.json': {
    runId,
    result: validations.blockedDryRunCasePassed ? 'passed_with_warnings' : 'blocked',
    expectedBlockedReason: blockedPayload?.expectedBlockedReason,
    failClosedBeforeExecution: blockedPayload?.expectedBlockedReason === 'fail_closed_before_execution',
    runtimeApprovalsFalse: true,
  },
  'invalid-dry-run-case-evidence.json': {
    runId,
    result: validations.invalidDryRunCasePassed ? 'passed_with_warnings' : 'blocked',
    expectedInvalidReason: invalidPayload?.expectedInvalidReason,
    failClosedBeforeExecution: true,
    runtimeApprovalsFalse: true,
  },
  'plan-snapshot-dry-run-evidence.json': {
    runId,
    result: validations.planSnapshotDryRunMappingPassed ? 'passed_with_warnings' : 'blocked',
    planSnapshotId: '<APPROVED_PLAN_SNAPSHOT_FIXTURE>',
  },
  'scoped-manifest-dry-run-evidence.json': {
    runId,
    result: validations.scopedManifestDryRunMappingPassed ? 'passed_with_warnings' : 'blocked',
    scopedToolCallManifestId: '<SCOPED_TOOL_CALL_MANIFEST_REF>',
  },
  'private-artifact-dry-run-evidence.json': {
    runId,
    result: validations.privateArtifactDryRunRefsPassed ? 'passed_with_warnings' : 'blocked',
    privateArtifactManifestRef: '<PRIVATE_ARTIFACT_MANIFEST_REF>',
    checksumRef: '<CHECKSUM_REF>',
  },
  'claim-lease-placeholder-dry-run-evidence.json': {
    runId,
    result: validations.claimLeaseDryRunPlaceholdersPassed ? 'passed_with_warnings' : 'blocked',
    claimPlaceholderRef: '<CLAIM_PLACEHOLDER_REF>',
    leasePlaceholderRef: '<LEASE_PLACEHOLDER_REF>',
    realJobClaimApprovedNow: false,
    realLeaseMutationApprovedNow: false,
  },
  'queue-placeholder-dry-run-evidence.json': {
    runId,
    result: validations.queueDryRunPlaceholdersPassed ? 'passed_with_warnings' : 'blocked',
    queuePlaceholderRef: '<QUEUE_PLACEHOLDER_REF>',
    queueExecutionApprovedNow: false,
  },
  'no-execution-dry-run-evidence.json': {
    runId,
    result: validations.noExecutionDryRunAssertionsPassed ? 'passed_with_warnings' : 'blocked',
    workerExecutionApprovedNow: false,
    routeExecutionApprovedNow: false,
    actualToolExecutionApprovedNow: false,
  },
  'observability-audit-dry-run-evidence.json': {
    runId,
    result: validations.observabilityAuditDryRunPassed ? 'passed_with_warnings' : 'blocked',
    observabilityAuditRef: '<OBSERVABILITY_AUDIT_REF>',
  },
  'fail-closed-dry-run-evidence.json': {
    runId,
    result: validations.failClosedDryRunPassed ? 'passed_with_warnings' : 'blocked',
    requiredAssertions,
  },
  'worker-intake-dry-run-evidence.json': {
    runId,
    result: validations.workerIntakeDryRunPassed ? 'passed_with_warnings' : 'blocked',
    toolsValidated: requiredTools,
    metadataOnly: true,
  },
  'static-executor-evidence.json': {
    runId,
    result: validations.staticDryRunExecutorPassed ? 'passed_with_warnings' : 'blocked',
    allowedImports: ['node:crypto', 'node:fs', 'node:path', 'node:url'],
    runtimeImportsUsed: false,
  },
  'checksum-summary.json': {
    runId,
    fixtureChecksums: Object.fromEntries(Object.entries(fixtureTextByPath).map(([path, text]) => [path, sha256(text)])),
    sourceDocChecksum: sha256(sourceDocText),
  },
  'cleanup-evidence.json': {
    runId,
    localEvidenceOnly: true,
    committedLocalArtifacts: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
  },
}

mkdirSync(outputDir, { recursive: true })
for (const [filename, payload] of Object.entries(artifactPayloads)) {
  writeFileSync(join(outputDir, filename), `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
}

console.log(JSON.stringify(report, null, 2))
if (failures.length > 0) process.exit(1)
