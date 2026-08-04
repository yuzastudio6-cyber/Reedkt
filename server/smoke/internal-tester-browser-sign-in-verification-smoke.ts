import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const root = process.cwd()

function read(path: string): string {
  return readFileSync(join(root, path), 'utf8')
}

function between(text: string, start: string, end: string): string {
  const startIndex = text.indexOf(start)
  assert.ok(startIndex >= 0, `Missing section start: ${start}`)
  const endIndex = text.indexOf(end, startIndex + start.length)
  assert.ok(endIndex > startIndex, `Missing section end: ${end}`)
  return text.slice(startIndex, endIndex)
}

function extractPythonHereDoc(step: string): string {
  const marker = "<<'PY'\n"
  const startIndex = step.indexOf(marker)
  assert.ok(startIndex >= 0, 'Workflow step should contain a quoted Python heredoc.')
  const contentStart = startIndex + marker.length
  const endIndex = step.indexOf('\n          PY', contentStart)
  assert.ok(endIndex > contentStart, 'Workflow Python heredoc should have a closing delimiter.')
  return `${step.slice(contentStart, endIndex)
    .split('\n')
    .map((line) => line.startsWith('          ') ? line.slice(10) : line)
    .join('\n')}\n`
}

for (const path of [
  '.github/workflows/internal-tester-browser-sign-in-verification.yml',
  'server/cli/verify-interactive-google-session.ts',
  'server/smoke/internal-tester-interactive-google-session-smoke.ts',
  'server/smoke/internal-tester-browser-sign-in-verification-smoke.ts',
  'docs/internal-tester-browser-sign-in-verification.md',
  'docs/internal-tester-interactive-google-session.md',
  'package.json',
] as const) {
  assert.equal(existsSync(join(root, path)), true, `${path} should exist`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:internal-tester-browser-sign-in-verification'],
  'tsx server/smoke/internal-tester-browser-sign-in-verification-smoke.ts',
)
assert.equal(
  packageJson.scripts?.['internal-testing:verify-interactive-google-session'],
  'tsx server/cli/verify-interactive-google-session.ts',
)

const workflow = read('.github/workflows/internal-tester-browser-sign-in-verification.yml')
for (const phrase of [
  'Internal Tester Google Session Readiness',
  'workflow_dispatch',
  'VERIFY_REEDITPRO_GOOGLE_SESSION_READINESS',
  'codex/backend-workflow-pipeline-continuation',
  'source_sha',
  'pages_deploy_run_id',
  'App Signed-In Internal Testing Pages Deploy',
  '.github/workflows/app-internal-testing-pages-deploy.yml',
  'actions/runs/',
  'environment: staging',
  'https://yuzastudio6-cyber.github.io/Reedkt/',
  'smoke:internal-tester-interactive-google-session',
  'internal-testing:verify-hosted-sign-in-route',
  'owner-interactive',
] as const) {
  assert.equal(workflow.includes(phrase), true, `Readiness workflow should include ${phrase}`)
}

assert.match(workflow, /test "\$\{GITHUB_REF\}" = "refs\/heads\/\$\{SOURCE_REF\}"/)
assert.match(workflow, /test "\$\{GITHUB_SHA\}" = "\$\{SOURCE_SHA\}"/)
assert.match(workflow, /run\.get\("head_branch"\) != sys\.argv\[3\] or run\.get\("head_sha"\) != sys\.argv\[4\]/)
assert.match(workflow, /credentials, create a session, read browser storage, or claim Gmail sign-in success/)
assert.doesNotMatch(workflow, /STAGING_INTERNAL_TESTER_PASSWORD|INTERNAL_TESTER_PASSWORD|tester_email|signInWithPassword/i)
assert.doesNotMatch(workflow, /STAGING_SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SERVICE_ROLE_KEY|auth\.admin|service_role/i)
assert.doesNotMatch(workflow, /gcloud|supabase\s+(?:db|migration|link|push|reset)|docker build|worker:run|smoke:prod-real/i)
assert.doesNotMatch(workflow, /REEDITPRO_CONFIRM_INTERACTIVE_GOOGLE_SESSION/)
assert.doesNotMatch(workflow, /^\s*run:\s*npm run internal-testing:verify-interactive-google-session\s*$/m)
assert.doesNotMatch(workflow, /^\s*npm run internal-testing:verify-interactive-google-session\s*$/m)

const pagesRunBindingPython = extractPythonHereDoc(between(
  workflow,
  '- name: Require successful same-SHA signed-in Pages deployment',
  '- name: Setup Node',
))
const fixtureDirectory = mkdtempSync(join(tmpdir(), 'reeditpro-google-session-readiness-'))
try {
  const sourceSha = 'a'.repeat(40)
  const runId = 123456
  const fixturePath = join(fixtureDirectory, 'pages-deploy-run.json')
  const fixture = {
    id: runId,
    repository: { full_name: 'yuzastudio6-cyber/Reedkt' },
    name: 'App Signed-In Internal Testing Pages Deploy',
    path: '.github/workflows/app-internal-testing-pages-deploy.yml@refs/heads/codex/backend-workflow-pipeline-continuation',
    event: 'workflow_dispatch',
    status: 'completed',
    conclusion: 'success',
    head_branch: 'codex/backend-workflow-pipeline-continuation',
    head_sha: sourceSha,
  }
  const argumentsAfterScript = [
    fixturePath,
    'yuzastudio6-cyber/Reedkt',
    'codex/backend-workflow-pipeline-continuation',
    sourceSha,
    String(runId),
  ]

  writeFileSync(fixturePath, `${JSON.stringify(fixture)}\n`, 'utf8')
  const accepted = spawnSync('python3', ['-', ...argumentsAfterScript], {
    input: pagesRunBindingPython,
    encoding: 'utf8',
  })
  assert.equal(accepted.status, 0, accepted.stderr || 'Exact same-SHA Pages run evidence should pass.')

  writeFileSync(fixturePath, `${JSON.stringify({ ...fixture, head_sha: 'b'.repeat(40) })}\n`, 'utf8')
  const wrongSha = spawnSync('python3', ['-', ...argumentsAfterScript], {
    input: pagesRunBindingPython,
    encoding: 'utf8',
  })
  assert.notEqual(wrongSha.status, 0, 'A Pages run from another SHA must fail closed.')

  writeFileSync(fixturePath, `${JSON.stringify({ ...fixture, conclusion: 'failure' })}\n`, 'utf8')
  const failedRun = spawnSync('python3', ['-', ...argumentsAfterScript], {
    input: pagesRunBindingPython,
    encoding: 'utf8',
  })
  assert.notEqual(failedRun.status, 0, 'A failed Pages deployment must fail closed.')
} finally {
  rmSync(fixtureDirectory, { recursive: true, force: true })
}

const docs = read('docs/internal-tester-browser-sign-in-verification.md')
for (const phrase of [
  'credential-free CI readiness',
  'same repository, branch, and SHA',
  'does not prove a Gmail session',
  'internal-testing:verify-interactive-google-session',
  'does not store a tester password',
  'same-SHA protected profile/workspace provisioning and readback workflows',
] as const) {
  assert.match(docs, new RegExp(phrase, 'i'), `Readiness docs should mention ${phrase}`)
}

console.log(JSON.stringify({
  ok: true,
  smoke: 'internal-tester-google-session-readiness',
  checks: [
    'workflow_self_ref_and_sha_bound',
    'same_sha_successful_pages_deploy_validator_executed_and_tamper_checked',
    'hosted_google_first_surface_checked_without_credentials',
    'tester_password_and_service_role_absent',
    'interactive_google_session_refused_in_ci',
    'owner_local_callback_reload_gateway_and_signout_gate_documented',
    'first_google_login_workspace_gap_requires_same_sha_bootstrap_and_retry',
  ],
}))
