import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const REQUIRED_DOCS = [
  'docs/tool-route-execution/tool-route-1-dry-run-fixture-plan.md',
  'docs/tool-route-execution/tool-route-1-synthetic-plan-snapshot-fixtures.md',
  'docs/tool-route-execution/tool-route-1-scoped-tool-call-manifest-contract.md',
  'docs/tool-route-execution/tool-route-1-capability-to-route-map.md',
  'docs/tool-route-execution/tool-route-1-contract-test-plan.md',
  'docs/tool-route-execution/tool-route-1-dry-run-readiness-matrix.md',
  'docs/tool-route-execution/tool-route-2-allowed-blocked-scope.md',
  'docs/prompt-tool-route-1-validation-results.md',
  'docs/implementation-prompts/prompt-tool-route-1-dry-run-fixture-plan-contract-tests.md',
]

const EXPECTED_FIXTURES = [
  {
    file: 'ai-tools-creative-graphics.scoped-tool-call.fixture.json',
    targetOwner: 'AI_TOOLS_CREATIVE_GRAPHICS',
    capability: 'AI_TOOLS_CREATIVE_GRAPHICS',
  },
  {
    file: 'track-a-render-export.scoped-tool-call.fixture.json',
    targetOwner: 'TRACK_A_RENDER_EXPORT',
    capability: 'TRACK_A_RENDER_EXPORT',
  },
  {
    file: 'track-b-media-processing.scoped-tool-call.fixture.json',
    targetOwner: 'TRACK_B_MEDIA_PROCESSING',
    capability: 'TRACK_B_MEDIA_PROCESSING',
  },
  {
    file: 'sound-music-audio.scoped-tool-call.fixture.json',
    targetOwner: 'SOUND_MUSIC_AUDIO',
    capability: 'SOUND_MUSIC_AUDIO',
  },
  {
    file: 'web-search-capture.scoped-tool-call.fixture.json',
    targetOwner: 'WEB_SEARCH_CAPTURE',
    capability: 'WEB_SEARCH_CAPTURE',
  },
  {
    file: 'map-geospatial.scoped-tool-call.fixture.json',
    targetOwner: 'MAP_GEOSPATIAL',
    capability: 'MAP_GEOSPATIAL',
  },
  {
    file: 'multi-tool-plan.scoped-tool-call.fixture.json',
    targetOwner: 'TOOL_ROUTE_EXECUTION',
    capability: 'TOOL_ROUTE_EXECUTION',
  },
]

const REQUIRED_FIELDS = [
  'manifestId',
  'fixtureId',
  'planSnapshotId',
  'ownerWorkstream',
  'targetOwnerWorkstream',
  'sourceOwnerStudyRefs',
  'capabilityRefs',
  'requestedCapabilities',
  'selectedToolRefs',
  'selectedToolMix',
  'editIntentRefs',
  'routeRefs',
  'workerJobRef',
  'inputArtifactRefs',
  'outputArtifactScopes',
  'privateArtifactManifestRefs',
  'checksumRequirements',
  'QARequirements',
  'observabilityRequirements',
  'blockedUses',
  'approvalState',
  'noRawPromptExecution',
  'noSignedUrlSourceOfTruth',
  'noPublicArtifact',
  'noSupabaseMutation',
]

const REQUIRED_FALSE_FLAGS = [
  'routeExecutionApprovedNow',
  'toolExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'supabaseMutationApprovedNow',
  'publicArtifactsApproved',
  'signedUrlsApproved',
  'rawPromptExecutionApproved',
  'internalBetaApproved',
  'externalBetaApproved',
  'productionApproved',
]

const REQUIRED_BLOCKED_USES = [
  'raw_prompt_execution',
  'route_execution',
  'tool_execution',
  'worker_execution',
  'provider_model_runtime',
  'signed_url_as_source_of_truth',
  'public_artifact',
  'supabase_mutation',
  'storage_transfer',
  'internal_beta_unlock',
  'external_beta_unlock',
  'production_unlock',
]

const REQUIRED_DOC_TERMS = [
  'ready_with_warnings_for_tool_route_2',
  'TOOL_ROUTE_EXECUTION',
  'AI_TOOLS_CREATIVE_GRAPHICS',
  'TRACK_A_RENDER_EXPORT',
  'TRACK_B_MEDIA_PROCESSING',
  'SOUND_MUSIC_AUDIO',
  'WEB_SEARCH_CAPTURE',
  'MAP_GEOSPATIAL',
  'Supabase row + private GCS path + manifest + checksum + approved plan snapshot',
  'Signed URLs are not source of truth',
  'Production capability enabled: `none; tool-route dry-run fixture plan and contract tests only`',
  'Supabase update required: `docs/status only`',
  'Supabase update status: `docs_only`',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'No Supabase mutation, SQL execution',
]

const FIXTURE_FORBIDDEN_PATTERNS = [
  [/https?:\/\//i, 'real URL'],
  [/gs:\/\//i, 'real GCS path'],
  [/supabase\.co/i, 'Supabase URL'],
  [/x-goog-signature|x-amz-signature|x-amz-credential|expires=/i, 'signed URL marker'],
  [/service[_-]?role/i, 'service role marker'],
  [/postgres(?:ql)?:\/\//i, 'database URL'],
  [/BEGIN PRIVATE KEY/i, 'private key'],
  [/\b(sk-[A-Za-z0-9]{20,}|AIza[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16})\b/, 'secret-like token'],
]

const DOC_FORBIDDEN_PATTERNS = [
  [/routeExecutionApproved(?:Now)?`?:\s*`?true/i, 'route execution approval'],
  [/toolExecutionApproved(?:Now)?`?:\s*`?true/i, 'tool execution approval'],
  [/workerExecutionApproved(?:Now)?`?:\s*`?true/i, 'worker execution approval'],
  [/provider(?:ModelRuntime|Runtime)Approved(?:Now)?`?:\s*`?true/i, 'provider/model approval'],
  [/supabaseMutationApproved(?:Now)?`?:\s*`?true/i, 'Supabase mutation approval'],
  [/publicArtifactsApproved`?:\s*`?true/i, 'public artifacts approval'],
  [/signedUrlsApproved`?:\s*`?true/i, 'signed URLs approval'],
  [/rawPromptExecutionApproved`?:\s*`?true/i, 'raw prompt execution approval'],
  [/internalBetaApproved`?:\s*`?true/i, 'internal beta approval'],
  [/externalBetaApproved`?:\s*`?true/i, 'external beta approval'],
  [/productionApproved`?:\s*`?true/i, 'production approval'],
  [/SQL executed:\s*`?(yes|true|executed|applied)/i, 'SQL execution claim'],
  [/Migration deployed:\s*`?(yes|true|deployed|applied)/i, 'migration deployed claim'],
  [/Supabase environment touched:\s*`?(staging|production|remote|local)/i, 'Supabase environment touch claim'],
  [/signed URL creation:\s*`?(yes|true|approved)/i, 'signed URL creation claim'],
  [/public artifact creation:\s*`?(yes|true|approved)/i, 'public artifact creation claim'],
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(filePath) {
  assert(existsSync(filePath), `Missing required file: ${filePath}`)
  return readFileSync(filePath, 'utf8')
}

function readJson(filePath) {
  return JSON.parse(read(filePath))
}

function assertArray(value, field, filePath) {
  assert(Array.isArray(value), `${field} must be an array in ${filePath}`)
  assert(value.length > 0, `${field} must not be empty in ${filePath}`)
}

const packageJson = readJson('package.json')
assert(
  packageJson.scripts?.['tool-route:dry-run-fixtures:diagnostics'] ===
    'node scripts/validation/tool-route-dry-run-fixtures-diagnostics.mjs',
  'Missing package script tool-route:dry-run-fixtures:diagnostics.',
)

const combinedDocs = REQUIRED_DOCS.map((filePath) => `${filePath}\n${read(filePath)}`).join('\n\n')

for (const term of REQUIRED_DOC_TERMS) {
  assert(combinedDocs.includes(term), `Missing required doc term: ${term}`)
}

for (const [pattern, label] of DOC_FORBIDDEN_PATTERNS) {
  assert(!pattern.test(combinedDocs), `Forbidden ${label} found in TOOL-ROUTE-1 docs.`)
}

for (const expected of EXPECTED_FIXTURES) {
  const filePath = path.join('docs/tool-route-execution/fixtures', expected.file)
  const text = read(filePath)
  const fixture = JSON.parse(text)

  for (const [pattern, label] of FIXTURE_FORBIDDEN_PATTERNS) {
    assert(!pattern.test(text), `Forbidden ${label} found in ${filePath}`)
  }

  for (const field of REQUIRED_FIELDS) {
    assert(Object.hasOwn(fixture, field), `Missing field ${field} in ${filePath}`)
  }

  assert(fixture.ownerWorkstream === 'TOOL_ROUTE_EXECUTION', `Unexpected ownerWorkstream in ${filePath}`)
  assert(fixture.targetOwnerWorkstream === expected.targetOwner, `Unexpected targetOwnerWorkstream in ${filePath}`)
  assert(fixture.planSnapshotId.startsWith('<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER_'), `planSnapshotId must be a placeholder in ${filePath}`)
  assert(fixture.workerJobRef.startsWith('<WORKER_JOB_REF_PLACEHOLDER_'), `workerJobRef must be a placeholder in ${filePath}`)
  assert(fixture.approvalState === 'dry_run_fixture_plan_only', `Unexpected approvalState in ${filePath}`)

  assertArray(fixture.sourceOwnerStudyRefs, 'sourceOwnerStudyRefs', filePath)
  assertArray(fixture.capabilityRefs, 'capabilityRefs', filePath)
  assertArray(fixture.selectedToolRefs, 'selectedToolRefs', filePath)
  assertArray(fixture.routeRefs, 'routeRefs', filePath)
  assertArray(fixture.inputArtifactRefs, 'inputArtifactRefs', filePath)
  assertArray(fixture.outputArtifactScopes, 'outputArtifactScopes', filePath)
  assertArray(fixture.privateArtifactManifestRefs, 'privateArtifactManifestRefs', filePath)
  assertArray(fixture.checksumRequirements, 'checksumRequirements', filePath)
  assertArray(fixture.QARequirements, 'QARequirements', filePath)
  assertArray(fixture.observabilityRequirements, 'observabilityRequirements', filePath)
  assertArray(fixture.blockedUses, 'blockedUses', filePath)

  assert(
    fixture.capabilityRefs.some((capabilityRef) => capabilityRef.includes(expected.capability)),
    `Missing expected capability ref ${expected.capability} in ${filePath}`,
  )

  for (const blockedUse of REQUIRED_BLOCKED_USES) {
    assert(fixture.blockedUses.includes(blockedUse), `Missing blocked use ${blockedUse} in ${filePath}`)
  }

  assert(fixture.noRawPromptExecution === true, `noRawPromptExecution must be true in ${filePath}`)
  assert(fixture.noSignedUrlSourceOfTruth === true, `noSignedUrlSourceOfTruth must be true in ${filePath}`)
  assert(fixture.noPublicArtifact === true, `noPublicArtifact must be true in ${filePath}`)
  assert(fixture.noSupabaseMutation === true, `noSupabaseMutation must be true in ${filePath}`)

  for (const flag of REQUIRED_FALSE_FLAGS) {
    assert(fixture[flag] === false, `${flag} must be false in ${filePath}`)
  }

  assert(fixture.supabaseUpdateRequired === 'docs/status only', `Supabase update required mismatch in ${filePath}`)
  assert(fixture.supabaseUpdateStatus === 'docs_only', `Supabase update status mismatch in ${filePath}`)
  assert(fixture.supabaseEnvironmentTouched === 'none', `Supabase environment mismatch in ${filePath}`)
  assert(fixture.sqlExecuted === 'none', `SQL execution mismatch in ${filePath}`)
  assert(fixture.migrationDeployed === 'no', `Migration deployed mismatch in ${filePath}`)
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'TOOL-ROUTE-1',
  toolRouteDryRunReadinessState: 'ready_with_warnings_for_tool_route_2',
  docsChecked: REQUIRED_DOCS.length,
  fixturesChecked: EXPECTED_FIXTURES.length,
  routeExecutionApprovedNow: false,
  toolExecutionApprovedNow: false,
  workerExecutionApprovedNow: false,
  providerRuntimeApprovedNow: false,
  supabaseMutationApprovedNow: false,
  publicArtifactsApproved: false,
  signedUrlsApproved: false,
  rawPromptExecutionApproved: false,
  internalBetaApproved: false,
  externalBetaApproved: false,
  productionApproved: false,
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  productionCapabilityEnabled: 'none; tool-route dry-run fixture plan and contract tests only',
  nextRecommendedPrompt: 'TOOL-ROUTE-2 - Offline Tool Route Contract Test Execution',
}, null, 2))
