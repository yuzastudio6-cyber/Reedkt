import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

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

const requiredFiles = [
  'scripts/validation/internal-testing-qa-runner.mjs',
  'docs/internal-testing-qa-wrapper.md',
  'docs/internal-testing-qa-wrapper.json',
  'server/smoke/internal-testing-qa-wrapper-smoke.ts',
  'server/smoke/internal-testing-approval-credit-gates-smoke.ts',
  'server/smoke/internal-testing-credit-lifecycle-readiness-smoke.ts',
  'server/smoke/internal-testing-repeated-local-operator-harness-smoke.ts',
  'server/smoke/internal-testing-auth-project-access-readiness-smoke.ts',
  'server/smoke/internal-testing-auth-project-session-membership-policy-smoke.ts',
  'server/smoke/internal-testing-durable-auth-project-session-backend-persistence-plan-smoke.ts',
  'docs/internal-testing-approval-credit-gates.md',
  'docs/internal-testing-approval-credit-gates.json',
  'docs/internal-testing-credit-lifecycle-readiness.md',
  'docs/internal-testing-credit-lifecycle-readiness.json',
  'docs/internal-testing-repeated-local-operator-harness.md',
  'docs/internal-testing-repeated-local-operator-harness.json',
  'docs/internal-testing-auth-project-access-readiness.md',
  'docs/internal-testing-auth-project-access-readiness.json',
  'docs/internal-testing-auth-project-session-membership-policy.md',
  'docs/internal-testing-auth-project-session-membership-policy.json',
  'docs/internal-testing-durable-auth-project-session-backend-persistence-plan.md',
  'docs/internal-testing-durable-auth-project-session-backend-persistence-plan.json',
  'tests/e2e/project-edit-brief-internal-testing-entrypoint.spec.ts',
  'tests/e2e/edit-preferences-route-entrypoint.spec.ts',
]

requiredFiles.forEach(assertFile)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(packageJson.scripts?.['qa:internal-testing'], 'node scripts/validation/internal-testing-qa-runner.mjs')
assert.equal(packageJson.scripts?.['smoke:internal-testing-qa-wrapper'], 'tsx server/smoke/internal-testing-qa-wrapper-smoke.ts')

const runner = read('scripts/validation/internal-testing-qa-runner.mjs')
for (const phrase of [
  'smoke:preference-video-mock-limits-internal-testing-closeout',
  'smoke:edit-preferences-route-entrypoint',
  'smoke:project-edit-brief-internal-testing-entrypoint',
  'smoke:project-edit-brief-e2e',
  'smoke:project-edit-brief-internal-testing-completion-audit',
  'smoke:internal-testing-approval-credit-gates',
  'smoke:internal-testing-credit-lifecycle-readiness',
  'smoke:internal-testing-repeated-local-operator-harness',
  'smoke:internal-testing-auth-project-access-readiness',
  'smoke:internal-testing-auth-project-session-membership-policy',
  'smoke:internal-testing-durable-auth-project-session-backend-persistence-plan',
  'smoke:beta-readiness',
  'tests/e2e/project-edit-brief-internal-testing-entrypoint.spec.ts',
  'tests/e2e/edit-preferences-route-entrypoint.spec.ts',
  'REEDITPRO_ENABLE_PROVIDER_CALLS',
  'REEDITPRO_ENABLE_SUPABASE_WRITES',
  'REEDITPRO_ENABLE_WORKER_DISPATCH',
]) {
  assert.match(runner, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
}
assert.doesNotMatch(runner, /SUPABASE_SERVICE_ROLE_KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY|service_role/i)

const docs = read('docs/internal-testing-qa-wrapper.md')
for (const phrase of [
  'npm run qa:internal-testing',
  'approval and credit',
  'credit lifecycle',
  'operator harness',
  'Auth',
  'Membership policy',
  'Backend persistence plan',
  'No upload',
  'No Supabase Data API',
  'fails fast',
  'external beta',
  'product-ready claim',
]) {
  assert.match(docs, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))
}

const docJson = JSON.parse(read('docs/internal-testing-qa-wrapper.json')) as {
  decision?: string
  command?: string
  smokes?: string[]
  playwrightSpecs?: string[]
  blockedScope?: Record<string, boolean>
}
assert.equal(docJson.decision, 'internal_testing_qa_wrapper_passed_ready_for_repeated_local_internal_testing')
assert.equal(docJson.command, 'npm run qa:internal-testing')
assert.ok(docJson.smokes?.includes('smoke:internal-testing-approval-credit-gates'))
assert.ok(docJson.smokes?.includes('smoke:internal-testing-credit-lifecycle-readiness'))
assert.ok(docJson.smokes?.includes('smoke:internal-testing-repeated-local-operator-harness'))
assert.ok(docJson.smokes?.includes('smoke:internal-testing-auth-project-access-readiness'))
assert.ok(docJson.smokes?.includes('smoke:internal-testing-auth-project-session-membership-policy'))
assert.ok(docJson.smokes?.includes('smoke:internal-testing-durable-auth-project-session-backend-persistence-plan'))
assert.ok(docJson.smokes?.includes('smoke:project-edit-brief-e2e'))
assert.ok(docJson.playwrightSpecs?.includes('tests/e2e/edit-preferences-route-entrypoint.spec.ts'))
assert.equal(docJson.blockedScope?.productReady, false)
assert.equal(docJson.blockedScope?.supabaseReadWrite, false)
assert.equal(docJson.blockedScope?.workerDispatch, false)

console.log(JSON.stringify({
  ok: true,
  smoke: 'internal-testing-qa-wrapper',
  command: docJson.command,
  smokes: docJson.smokes?.length,
  playwrightSpecs: docJson.playwrightSpecs?.length,
  productReady: false,
}, null, 2))
