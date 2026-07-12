import { spawnSync } from 'node:child_process'
import { existsSync, realpathSync } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const EXPECTED_ROOT = '/Users/macuser/Developer/REeditpro-edit-reference-pr'
const EXPECTED_BRANCH = 'codex/edit-reference-end-to-end'
const STARTING_COMMIT = 'e405e69e1a43fd2609854d8acaa7a4ef959b7e94'
const REQUIRED_FILES = [
  'docs/edit-reference-goal.md',
  'docs/edit-reference-goal-status.md',
  'docs/edit-reference-goal-status.json',
  'docs/edit-reference-definition-of-done.md',
  'docs/edit-reference-ui-contract.md',
  'docs/edit-reference-skill-registry.md',
  'docs/edit-reference-test-fixture-plan.md',
  'docs/edit-reference-persistence-contract.md',
  'docs/edit-reference-gate-verification-log.md',
  'docs/edit-reference-gate-1-study-session-foundation.md',
  'docs/edit-reference-gate-2-evidence-study-orchestration.md',
  'docs/edit-reference-gate-3-versioned-dna-synthesis.md',
  'docs/edit-reference-gate-4-dna-qa-approval.md',
  'docs/edit-reference-gate-5-target-application.md',
  'docs/edit-reference-gate-6-downstream-integration.md',
  'docs/edit-reference-gate-7-lifecycle-closure.md',
  'docs/edit-reference-gate-8-beta-readiness.md',
  'docs/edit-reference-gate-8-1-application-entrypoints.md',
  'docs/edit-reference-live-study-closure.md',
  'docs/edit-reference-selector-chat-state-consistency.md',
  'docs/edit-reference-gate-8-1-browser-report.md',
  'docs/edit-reference-gate-8-1-known-limitations.md',
  'docs/edit-reference-final-acceptance-matrix.md',
  'docs/edit-reference-adaptation-proof.md',
  'docs/edit-reference-skill-provenance-report.md',
  'docs/edit-reference-persistence-readback-report.md',
  'docs/edit-reference-security-privacy-report.md',
  'docs/edit-reference-browser-e2e-report.md',
  'docs/edit-reference-known-limitations.md',
  'docs/edit-reference-pr-file-inventory.md',
  'docs/edit-reference-rollback-plan.md',
  'docs/edit-reference-draft-pr-readiness.md',
  'docs/edit-reference-draft-pr-commit-map.md',
  'docs/edit-reference-draft-pr-file-inventory.md',
  'docs/edit-reference-draft-pr-base-reconciliation.md',
  'scripts/validation/edit-reference-goal-preflight.mjs',
  'scripts/validation/edit-reference-goal-postgate.mjs',
  'server/smoke/edit-reference-goal-control-plane-smoke.ts',
  'server/smoke/edit-reference-gate-8-readiness-smoke.ts',
  'server/smoke/edit-reference-gate-8-1-closure-smoke.ts',
]

function runGit(args, { allowFailure = false } = {}) {
  const result = spawnSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  })
  if (!allowFailure && result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${(result.stderr || result.stdout).trim()}`)
  }
  return { status: result.status ?? 1, stdout: result.stdout.trim(), stderr: result.stderr.trim() }
}

async function countMigrations(root) {
  const entries = await readdir(path.join(root, 'supabase/migrations'), { withFileTypes: true })
  return entries.filter((entry) => entry.isFile() && entry.name.endsWith('.sql') && !entry.name.startsWith('._')).length
}

function collectChangedPaths() {
  const values = [
    runGit(['diff', '--name-only']).stdout,
    runGit(['diff', '--cached', '--name-only']).stdout,
    runGit(['diff', '--name-only', `${STARTING_COMMIT}..HEAD`]).stdout,
    runGit(['ls-files', '--others', '--exclude-standard']).stdout,
  ]
  return [...new Set(values.flatMap((value) => value.split('\n').map((item) => item.trim()).filter(Boolean)))].sort()
}

function isTextPath(filePath) {
  return /\.(?:cjs|css|html|js|jsx|json|md|mjs|sh|sql|ts|tsx|txt|yaml|yml)$/i.test(filePath)
}

const failures = []
const root = realpathSync(process.cwd())
const branch = runGit(['branch', '--show-current']).stdout
const head = runGit(['rev-parse', 'HEAD']).stdout
const ancestor = runGit(['merge-base', '--is-ancestor', STARTING_COMMIT, head], { allowFailure: true }).status === 0
const unmerged = runGit(['ls-files', '--unmerged']).stdout
const diffCheck = runGit(['diff', '--check'], { allowFailure: true })
const cachedDiffCheck = runGit(['diff', '--cached', '--check'], { allowFailure: true })
const migrationCount = await countMigrations(root)
const changedPaths = collectChangedPaths()

if (root !== EXPECTED_ROOT) failures.push(`Canonical worktree must be ${EXPECTED_ROOT}; received ${root}.`)
if (branch !== EXPECTED_BRANCH) failures.push(`Branch must be ${EXPECTED_BRANCH}; received ${branch || '<detached>'}.`)
if (!ancestor) failures.push(`HEAD ${head} is not a descendant of ${STARTING_COMMIT}.`)
if (unmerged) failures.push('Unmerged Git entries are present.')
if (diffCheck.status !== 0) failures.push(`git diff --check failed: ${diffCheck.stdout || diffCheck.stderr}`)
if (cachedDiffCheck.status !== 0) failures.push(`git diff --cached --check failed: ${cachedDiffCheck.stdout || cachedDiffCheck.stderr}`)
if (changedPaths.some((filePath) => filePath.startsWith('supabase/migrations/'))) {
  failures.push('Edit Reference gates changed Supabase migrations while the canonical baseline is blocked.')
}

for (const relativePath of REQUIRED_FILES) {
  if (!existsSync(path.join(root, relativePath))) failures.push(`Required control-plane file is missing: ${relativePath}.`)
}

let status
try {
  status = JSON.parse(await readFile(path.join(root, 'docs/edit-reference-goal-status.json'), 'utf8'))
} catch (error) {
  failures.push(`Goal status JSON could not be parsed: ${error instanceof Error ? error.message : String(error)}.`)
}

const requiredStatusFields = [
  'goal',
  'status',
  'currentGate',
  'completedGates',
  'blockedGates',
  'latestCommit',
  'migrationBaseline',
  'migrationCurrent',
  'browserQa',
  'runtimeQa',
  'persistenceQa',
  'productionReady',
]

if (status) {
  for (const field of requiredStatusFields) {
    if (!(field in status)) failures.push(`Goal status is missing ${field}.`)
  }
  if (status.goal !== 'edit_reference_end_to_end') failures.push('Goal status has the wrong goal ID.')
  if (!Array.isArray(status.completedGates) || !Array.isArray(status.blockedGates)) failures.push('Gate status arrays are invalid.')
  if (status.migrationBaseline !== 24 || status.migrationCurrent !== migrationCount) {
    failures.push(`Goal status migration counts do not match baseline/current ${migrationCount}.`)
  }
  if (status.productionReady !== false && status.remoteMutationAllowed !== true) {
    failures.push('productionReady cannot be true while remote evidence remains unauthorized.')
  }
  if (status.latestCommit !== null && !/^[a-f0-9]{40}$/.test(status.latestCommit)) {
    failures.push('latestCommit must be null or a full lowercase commit SHA.')
  }
  if (typeof status.latestCommit === 'string') {
    const latestIsAncestor = runGit(['merge-base', '--is-ancestor', status.latestCommit, head], { allowFailure: true }).status === 0
    if (!latestIsAncestor) failures.push('latestCommit is not present in the canonical branch history.')
  }
}

const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'))
for (const scriptName of [
  'check:edit-reference-goal-preflight',
  'check:edit-reference-goal-postgate',
  'smoke:edit-reference-goal-control-plane',
  'smoke:edit-reference-gate-8-readiness',
  'smoke:edit-reference-gate-8-1-closure',
]) {
  if (typeof packageJson.scripts?.[scriptName] !== 'string') failures.push(`package.json is missing ${scriptName}.`)
}

for (const relativePath of changedPaths.filter(isTextPath)) {
  const absolutePath = path.join(root, relativePath)
  if (!existsSync(absolutePath)) continue
  const source = await readFile(absolutePath, 'utf8')
  if (/^(?:<{7}|>{7})(?:\s|$)/m.test(source) || /^={7}$/m.test(source)) {
    failures.push(`Conflict marker found in ${relativePath}.`)
  }
}

const report = {
  check: 'edit_reference_goal_postgate',
  ok: failures.length === 0,
  root,
  branch,
  head,
  migrationCount,
  changedPathCount: changedPaths.length,
  changedPaths,
  worktreeDirty: Boolean(runGit(['status', '--short']).stdout),
  stagedPathsPresent: Boolean(runGit(['diff', '--cached', '--name-only']).stdout),
  unmergedPathsPresent: Boolean(unmerged),
  productionReady: status?.productionReady ?? false,
  failures,
}

console.log(JSON.stringify(report, null, 2))
if (failures.length > 0) process.exit(1)
