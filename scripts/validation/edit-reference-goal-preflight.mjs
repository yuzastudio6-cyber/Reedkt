import { spawnSync } from 'node:child_process'
import { existsSync, realpathSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const EXPECTED_ROOT = '/Users/macuser/Developer/REeditpro-edit-reference-pr'
const EXPECTED_BRANCH = 'codex/edit-reference-end-to-end'
const STARTING_COMMIT = 'e405e69e1a43fd2609854d8acaa7a4ef959b7e94'
const REFERENCE_ROOTS = [
  '/Volumes/backup/REeditpro-beta-integration-4',
  '/Volumes/backup/REeditpro',
  '/Users/macuser/Developer/REeditpro',
]

function runGit(args, { allowFailure = false } = {}) {
  const result = spawnSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
    },
  })
  if (!allowFailure && result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${(result.stderr || result.stdout).trim()}`)
  }
  return {
    status: result.status ?? 1,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  }
}

async function countMigrations(root) {
  const entries = await readdir(path.join(root, 'supabase/migrations'), { withFileTypes: true })
  return entries.filter((entry) => entry.isFile() && entry.name.endsWith('.sql') && !entry.name.startsWith('._')).length
}

function failIf(condition, message, failures) {
  if (condition) failures.push(message)
}

const root = realpathSync(process.cwd())
const failures = []
const branch = runGit(['branch', '--show-current']).stdout
const head = runGit(['rev-parse', 'HEAD']).stdout
const shortStatus = runGit(['status', '--short']).stdout
const staged = runGit(['diff', '--cached', '--name-only']).stdout
const unmerged = runGit(['ls-files', '--unmerged']).stdout
const ancestor = runGit(['merge-base', '--is-ancestor', STARTING_COMMIT, head], { allowFailure: true }).status === 0
const migrationCount = await countMigrations(root)

failIf(root !== EXPECTED_ROOT, `Selected PR worktree must be ${EXPECTED_ROOT}; received ${root}.`, failures)
failIf(branch !== EXPECTED_BRANCH, `PR branch must be ${EXPECTED_BRANCH}; received ${branch || '<detached>'}.`, failures)
failIf(!ancestor, `HEAD ${head} must be a clean descendant of ${STARTING_COMMIT}.`, failures)
failIf(Boolean(unmerged), 'Unmerged Git entries are present.', failures)
failIf(migrationCount !== 24, `Migration count changed from the selected remote-base baseline: ${migrationCount}.`, failures)
failIf(!existsSync(path.join(root, 'package.json')), 'package.json is missing.', failures)
failIf(!existsSync(path.join(root, 'package-lock.json')), 'package-lock.json is missing.', failures)

for (const referenceRoot of REFERENCE_ROOTS) {
  failIf(!existsSync(referenceRoot), `Read-only reference repository is missing: ${referenceRoot}.`, failures)
  if (existsSync(referenceRoot)) {
    failIf(realpathSync(referenceRoot) === root, `Reference repository aliases the canonical worktree: ${referenceRoot}.`, failures)
  }
}

if (process.env.EDIT_REFERENCE_REQUIRE_CLEAN === '1') {
  failIf(Boolean(shortStatus), 'Strict preflight requires a clean worktree.', failures)
  failIf(Boolean(staged), 'Strict preflight requires no staged paths.', failures)
}

const report = {
  check: 'edit_reference_goal_preflight',
  ok: failures.length === 0,
  root,
  branch,
  head,
  startingCommit: STARTING_COMMIT,
  startingCommitIsAncestor: ancestor,
  worktreeDirty: Boolean(shortStatus),
  stagedPathsPresent: Boolean(staged),
  unmergedPathsPresent: Boolean(unmerged),
  migrationCount,
  referenceRoots: REFERENCE_ROOTS.map((referenceRoot) => ({
    path: referenceRoot,
    exists: existsSync(referenceRoot),
    readOnlyByGoal: true,
  })),
  failures,
}

console.log(JSON.stringify(report, null, 2))
if (failures.length > 0) process.exit(1)
