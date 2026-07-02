import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  MOCK_QWEN_RUNTIME_BOUNDARY_SCENARIOS,
  assertQwenProviderCallBlocked,
  assertQwenProviderClientCreationBlocked,
  createQwenProviderReadiness,
  createQwenProviderReadinessSummary,
  createQwenRuntimeBoundaryContext,
  createQwenRuntimeBoundarySummary,
  createQwenRuntimeGateSummary,
  createQwenSecretBoundarySummary,
  createQwenSecretReferenceSummary,
  createQwenSecretRedactionSummary,
  createQwenSecretResolverBoundarySummary,
  listQwenRequiredSecretReferences,
  redactQwenSecretLikeValue,
  resolveQwenSecretValueDisabled,
  runMockQwenRuntimeBoundaryFlow,
  validateNoQwenFrontendSecretAccess,
  validateNoQwenMarkerChatRuntimeChange,
  validateNoQwenProviderCall,
  validateNoQwenSecretValueAccess,
  validateQwenRuntimeReadiness,
  validateQwenSecretReferences,
} from '../../src/backend'

const repoRoot = process.cwd()
const requiredDocs = [
  'docs/qwen-secret-manager-runtime-boundary.md',
  'docs/qwen-provider-runtime-gates.md',
  'docs/qwen-secret-redaction-policy.md',
  'docs/qwen-server-only-runtime-contract.md',
  'docs/qwen-runtime-boundary-validation.md',
  'docs/qwen-runtime-boundary-next-adapter.md',
]

const requiredPhrases = [
  /Qwen 3\.7/i,
  /symbolic secret/i,
  /disabled resolver/i,
  /backend-only/i,
  /no gcloud/i,
  /no secret value/i,
  /no provider call/i,
  /no Qwen call/i,
  /Marker Chat runtime/i,
  /fake transport first/i,
]

const context = createQwenRuntimeBoundaryContext()
assert.equal(context.gateStatus, 'blocked_owner_approval', 'Qwen runtime should default to owner approval block.')
assert.equal(context.mockOnly, true, 'Qwen runtime context should be mock-only.')
assert.match(createQwenRuntimeGateSummary(context), /No provider call was made/i)

const references = listQwenRequiredSecretReferences()
assert.equal(references.length, 3, 'Expected three symbolic Qwen secret references.')
assert.ok(references.every((reference) => reference.referenceStatus === 'symbolic_reference_only'), 'Secret references must be symbolic.')
assert.ok(references.every((reference) => reference.valueAccessed === false), 'Secret values must not be accessed.')
assert.ok(references.every((reference) => reference.valuePrinted === false), 'Secret values must not be printed.')
assert.ok(references.every((reference) => reference.frontendVisible === false), 'Secret references must not be frontend-visible.')
assert.match(createQwenSecretReferenceSummary(references), /Values accessed: false/i)
assert.match(createQwenSecretBoundarySummary(references), /frontendVisible false/i)

const resolver = resolveQwenSecretValueDisabled(references[0].symbolicName)
assert.equal(resolver.ok, false, 'Disabled resolver should return a blocked result.')
assert.equal(resolver.valueAccessed, false, 'Disabled resolver must not access values.')
assert.equal(resolver.valuePrinted, false, 'Disabled resolver must not print values.')
assert.equal(resolver.gcloudCommandRun, false, 'Disabled resolver must not run gcloud.')
assert.equal(resolver.secretMetadataInspected, false, 'Disabled resolver must not inspect Secret Manager metadata.')
assert.match(createQwenSecretResolverBoundarySummary(resolver), /gcloudCommandRun false/i)

const redactionInput = ['Bearer', 'qwen-smoke', 'x'.repeat(32)].join(' ')
const redaction = redactQwenSecretLikeValue(redactionInput)
assert.equal(redaction.inputContainedSecretLikeValue, true, 'Redaction should detect secret-like text.')
assert.match(redaction.redactedText, /REDACTED_QWEN_SECRET_BOUNDARY/)
assert.equal(redaction.secretValuePrinted, false, 'Redaction must not print secret values.')
assert.match(createQwenSecretRedactionSummary(redaction), /secret values printed: false/i)

const providerReadiness = createQwenProviderReadiness(context)
assert.equal(providerReadiness.canCreateProviderClient, false, 'Provider client creation must be blocked.')
assert.equal(providerReadiness.canCallProvider, false, 'Provider call must be blocked.')
assert.equal(providerReadiness.qwenCallMade, false, 'Qwen call must be false.')
assert.equal(providerReadiness.deepSeekCallMade, false, 'DeepSeek call must be false.')
assert.equal(providerReadiness.providerCallMade, false, 'Provider call must be false.')
assert.match(createQwenProviderReadinessSummary(providerReadiness), /providerCallMade false/i)

const providerClientBlocked = assertQwenProviderClientCreationBlocked()
assert.ok(providerClientBlocked.ok, providerClientBlocked.ok ? 'unexpected' : providerClientBlocked.error.message)
assert.equal(providerClientBlocked.data.providerClientCreated, false)
const providerCallBlocked = assertQwenProviderCallBlocked()
assert.ok(providerCallBlocked.ok, providerCallBlocked.ok ? 'unexpected' : providerCallBlocked.error.message)
assert.equal(providerCallBlocked.data.providerCallMade, false)

const readinessFlow = runMockQwenRuntimeBoundaryFlow()
assert.equal(readinessFlow.readiness.canCallProvider, false, 'Readiness flow must block provider calls.')
assert.equal(readinessFlow.readiness.canResolveSecretValue, false, 'Readiness flow must block secret resolution.')
assert.equal(readinessFlow.readiness.canWireMarkerChat, false, 'Readiness flow must block Marker Chat runtime wiring.')
assert.match(createQwenRuntimeBoundarySummary(readinessFlow.readiness), /No Qwen call/i)

const safeValidation = validateQwenRuntimeReadiness(readinessFlow.readiness)
assert.equal(safeValidation.ok, true, 'Safe readiness validation should pass.')
assert.equal(validateQwenSecretReferences(references).ok, true, 'Symbolic references should validate.')
assert.equal(validateNoQwenSecretValueAccess({}).ok, true, 'No secret access should validate.')
assert.equal(validateNoQwenProviderCall({}).ok, true, 'No provider call should validate.')
assert.equal(validateNoQwenMarkerChatRuntimeChange({}).ok, true, 'No Marker Chat runtime change should validate.')
assert.equal(validateNoQwenFrontendSecretAccess({ fileReferences: [] }).ok, true, 'No frontend Qwen refs should validate.')

assert.equal(validateNoQwenSecretValueAccess({ secretValueAccessed: true }).blocked, true, 'Unsafe secret access flag should block.')
assert.equal(validateNoQwenSecretValueAccess({ secretValuePrinted: true }).blocked, true, 'Unsafe secret print flag should block.')
assert.equal(validateNoQwenSecretValueAccess({ gcloudCommandRun: true }).blocked, true, 'Unsafe gcloud flag should block.')
assert.equal(validateNoQwenProviderCall({ providerCallMade: true }).blocked, true, 'Unsafe provider call flag should block.')
assert.equal(validateNoQwenFrontendSecretAccess({
  fileReferences: [{ filePath: 'src/components/Unsafe.tsx', sourceText: 'import x from "../../backend/qwen-runtime/qwen-runtime-gate-service"' }],
}).blocked, true, 'Frontend Qwen runtime import should block.')

assert.ok(MOCK_QWEN_RUNTIME_BOUNDARY_SCENARIOS.length >= 42, 'Expected at least 42 Qwen runtime boundary scenarios.')
assert.ok(MOCK_QWEN_RUNTIME_BOUNDARY_SCENARIOS.every((scenario) => scenario.mockOnly), 'Scenarios must be mock-only.')
assert.ok(MOCK_QWEN_RUNTIME_BOUNDARY_SCENARIOS.every((scenario) => scenario.expectedSecretValueAccessed === false), 'Scenarios must keep secret value access false.')
assert.ok(MOCK_QWEN_RUNTIME_BOUNDARY_SCENARIOS.every((scenario) => scenario.expectedProviderCallMade === false), 'Scenarios must keep provider call false.')

for (const doc of requiredDocs) {
  const path = join(repoRoot, doc)
  assert.ok(existsSync(path), `${doc} should exist.`)
  const text = readFileSync(path, 'utf8')
  for (const phrase of requiredPhrases) {
    assert.match(text, phrase, `${doc} should include ${phrase}.`)
  }
}

const packageJson = readFileSync(join(repoRoot, 'package.json'), 'utf8')
assert.match(packageJson, /"smoke:qwen-runtime-boundary": "tsx server\/smoke\/qwen-runtime-boundary-smoke\.ts"/)
assert.match(packageJson, /"check:qwen-runtime-boundary": "node scripts\/check-qwen-runtime-boundary\.mjs"/)

const migrationCount = readdirSync(join(repoRoot, 'supabase/migrations')).filter((file) => file.endsWith('.sql')).length
assert.equal(migrationCount, 24, 'Supabase migration count must remain at the approved PR 637 reconciled baseline.')

console.log(JSON.stringify({
  smoke: 'qwen-runtime-boundary',
  status: 'passed',
  scenarios: MOCK_QWEN_RUNTIME_BOUNDARY_SCENARIOS.length,
  secretReferences: references.length,
  migrationCount,
  qwenCallMade: false,
  deepSeekCallMade: false,
  providerCallMade: false,
  gcloudCommandRun: false,
  supabaseCommandRun: false,
  secretValueAccessed: false,
  secretValuePrinted: false,
  markerChatRuntimeChanged: false,
  providerClientCreated: false,
}, null, 2))
