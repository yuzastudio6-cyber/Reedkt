import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { internalTestingScenarios } from '../../src/lib/internal-testing-scenarios'

const root = process.cwd()

function file(path: string): string {
  return join(root, path)
}

function read(path: string): string {
  return readFileSync(file(path), 'utf8')
}

function assertFile(path: string) {
  assert.equal(existsSync(file(path)), true, `${path} should exist`)
}

function assertText(path: string, phrases: string[]) {
  const text = read(path)
  for (const phrase of phrases) {
    assert.match(text, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `${path} should mention ${phrase}`)
  }
}

const requiredFiles = [
  'docs/internal-testing-repeated-local-operator-harness.md',
  'docs/internal-testing-repeated-local-operator-harness.json',
  'server/smoke/internal-testing-repeated-local-operator-harness-smoke.ts',
  'scripts/validation/internal-testing-qa-runner.mjs',
  'src/pages/InternalTestingPage.tsx',
  'src/lib/internal-testing-scenarios.ts',
  'src/styles/internal-testing.css',
]

requiredFiles.forEach(assertFile)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:internal-testing-repeated-local-operator-harness'],
  'tsx server/smoke/internal-testing-repeated-local-operator-harness-smoke.ts',
)

assertText('scripts/validation/internal-testing-qa-runner.mjs', [
  'smoke:internal-testing-approval-credit-gates',
  'smoke:internal-testing-credit-lifecycle-readiness',
  'smoke:internal-testing-repeated-local-operator-harness',
  'REEDITPRO_ENABLE_SUPABASE_WRITES',
  'REEDITPRO_ENABLE_WORKER_DISPATCH',
  'REEDITPRO_ENABLE_CREDIT_SPEND',
])

assertText('src/pages/InternalTestingPage.tsx', [
  'internal-testing-repeated-local-operator-harness',
  'Operator harness',
  'npm run qa:internal-testing',
  'Project home, Edit Chat, Edit Brief',
  'Approval IDs and credit lifecycle',
  'No tool execution',
  'No real billing',
])
assertText('src/styles/internal-testing.css', ['internal-testing-operator-grid'])

assertText('src/lib/internal-testing-scenarios.ts', [
  'repeated-local-operator-harness',
  'Run npm run qa:internal-testing',
  'approval gate',
  'credit lifecycle',
  'product-ready gates stay closed',
])

assertText('docs/internal-testing-repeated-local-operator-harness.md', [
  'internal_testing_repeated_local_operator_harness_passed_ready_for_repeated_local_internal_testing',
  'Run `npm run qa:internal-testing`',
  'approved snapshot',
  'credit lifecycle',
  'Browser-local JSON',
  'No live Supabase',
  'No external beta',
  'product-ready claim',
])

const docJson = JSON.parse(read('docs/internal-testing-repeated-local-operator-harness.json')) as {
  decision?: string
  command?: string
  scenarioId?: string
  operatorSequence?: string[]
  requiredPriorDecisions?: string[]
  blockedScope?: Record<string, boolean>
  validation?: { required?: string[] }
}

assert.equal(docJson.decision, 'internal_testing_repeated_local_operator_harness_passed_ready_for_repeated_local_internal_testing')
assert.equal(docJson.command, 'npm run qa:internal-testing')
assert.equal(docJson.scenarioId, 'repeated-local-operator-harness')
assert.ok(docJson.operatorSequence?.includes('verify_approval_credit_and_lifecycle_gates'))
assert.ok(
  docJson.requiredPriorDecisions?.includes(
    'internal_testing_credit_lifecycle_readiness_passed_ready_for_repeated_local_internal_testing',
  ),
)
assert.equal(docJson.blockedScope?.toolExecution, false)
assert.equal(docJson.blockedScope?.supabaseReadWrite, false)
assert.equal(docJson.blockedScope?.realCreditSpendReleaseRefund, false)
assert.equal(docJson.blockedScope?.productReady, false)
assert.ok(docJson.validation?.required?.includes('smoke:internal-testing-repeated-local-operator-harness'))
assert.ok(docJson.validation?.required?.includes('qa:internal-testing'))

const harnessScenario = internalTestingScenarios.find((scenario) => scenario.id === 'repeated-local-operator-harness')
assert.ok(harnessScenario, 'Repeated local operator harness scenario should exist.')
assert.equal(harnessScenario.route, '/internal-testing')
assert.equal(harnessScenario.status, 'mock_local')
assert.equal(harnessScenario.mockOnly, true)

const forbiddenText = [
  read('docs/internal-testing-repeated-local-operator-harness.md'),
  read('docs/internal-testing-repeated-local-operator-harness.json'),
  read('src/pages/InternalTestingPage.tsx'),
].join('\n')
assert.doesNotMatch(forbiddenText, /SUPABASE_SERVICE_ROLE_KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY|BEGIN PRIVATE KEY/i)
assert.doesNotMatch(forbiddenText, /signedUrl\s*[:=]\s*['"]https?:\/\//i)

console.log(JSON.stringify({
  ok: true,
  smoke: 'internal-testing-repeated-local-operator-harness',
  decision: docJson.decision,
  command: docJson.command,
  scenario: harnessScenario.id,
  blockedScope: docJson.blockedScope,
}, null, 2))
