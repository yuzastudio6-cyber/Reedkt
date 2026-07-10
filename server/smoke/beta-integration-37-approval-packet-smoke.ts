import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const packetPath = 'docs/beta-integration-37-remote-supabase-staging-approval.md'
const summaryPath = 'docs/beta-integration-37-approval-summary.json'
const gitEnv = {
  ...process.env,
  DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
}

assert.equal(existsSync(packetPath), true, 'approval packet doc must exist')
assert.equal(existsSync(summaryPath), true, 'approval summary JSON must exist')

const packet = readFileSync(packetPath, 'utf8')
const summary = JSON.parse(readFileSync(summaryPath, 'utf8')) as {
  remoteActionsPerformed: boolean
  supabaseCliRun: boolean
  migrationsApplied: boolean
  stagingDeployRun: boolean
  providerCallsRun: boolean
  qwenCloneMutated: boolean
  sideArtifactsStagedOrDeleted: boolean
  packageLockChanged: boolean
  requiresOwnerApproval: boolean
  knownSideArtifacts: string[]
}

assert.equal(summary.remoteActionsPerformed, false, 'remoteActionsPerformed must be false')
assert.equal(summary.supabaseCliRun, false, 'supabaseCliRun must be false')
assert.equal(summary.migrationsApplied, false, 'migrationsApplied must be false')
assert.equal(summary.stagingDeployRun, false, 'stagingDeployRun must be false')
assert.equal(summary.providerCallsRun, false, 'providerCallsRun must be false')
assert.equal(summary.qwenCloneMutated, false, 'qwenCloneMutated must be false')
assert.equal(summary.sideArtifactsStagedOrDeleted, false, 'sideArtifactsStagedOrDeleted must be false')
assert.equal(summary.packageLockChanged, false, 'packageLockChanged must be false')
assert.equal(summary.requiresOwnerApproval, true, 'requiresOwnerApproval must be true')
assert.deepEqual(summary.knownSideArtifacts, ['supabase/.branches/', 'supabase/.temp/'])

for (const requiredText of [
  'Remote Action Approval Checklist',
  'Staging Deployment Readiness Checklist',
  'Migration Readiness Checklist',
  'Required Secrets And Config Checklist',
  'Rollback Plan',
  'Go/No-Go Decision Block',
  'Risk Register',
  'No remote actions were performed.',
  'No Supabase CLI was run',
  'No migrations were applied.',
  'No staging deploy was run.',
  'must not be staged, deleted, cleaned, or mutated',
  'supabase/.branches/',
  'supabase/.temp/',
]) {
  assert.ok(packet.includes(requiredText), `packet must include: ${requiredText}`)
}

const combined = `${packet}\n${JSON.stringify(summary)}`
const forbiddenSecretMarkers = [
  'sk_test',
  'sk_live',
  'rk_test',
  'rk_live',
  'pk_live',
  'whsec',
  'service_role',
  'serviceRoleKey',
  'api_key',
  'password',
  'private_key',
  'authorization',
  'access_token',
  'refresh_token',
]

for (const marker of forbiddenSecretMarkers) {
  assert.equal(combined.includes(marker), false, `approval packet must not include raw secret marker: ${marker}`)
}

const gitStatus = execFileSync('git', ['status', '--short', '--untracked-files=no'], { encoding: 'utf8', env: gitEnv })
assert.equal(gitStatus.includes('package-lock.json'), false, 'package-lock must remain unchanged')

const addedMigrationFiles = execFileSync('git', ['status', '--short', 'supabase/migrations'], { encoding: 'utf8', env: gitEnv })
  .split('\n')
  .filter((line) => line.startsWith('A '))
assert.deepEqual(addedMigrationFiles, [], 'this milestone must not add migration files')

console.log(JSON.stringify({
  ok: true,
  packetPath,
  summaryPath,
  remoteActionsPerformed: summary.remoteActionsPerformed,
  supabaseCliRun: summary.supabaseCliRun,
  migrationsApplied: summary.migrationsApplied,
  stagingDeployRun: summary.stagingDeployRun,
  providerCallsRun: summary.providerCallsRun,
  qwenCloneMutated: summary.qwenCloneMutated,
  sideArtifactsStagedOrDeleted: summary.sideArtifactsStagedOrDeleted,
  requiresOwnerApproval: summary.requiresOwnerApproval,
}, null, 2))
