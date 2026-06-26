#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const packet = 'RP-INTERNAL-BETA-PRIVATE-ARTIFACT-ACCESS-POLICY-LOCAL-RUNTIME-1'
const packetDir = 'docs/internal-beta/rp-internal-beta-private-artifact-access-policy-local-runtime-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/runtime-contract.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/private-artifact-access-policy-local-runtime-record.json`,
  'docs/activation-phase-rp-internal-beta-private-artifact-access-policy-local-runtime-1-results.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'server/services/internal-beta-private-artifact-access-policy-local-runtime.ts',
  'server/smoke/internal-beta-private-artifact-access-policy-local-runtime-smoke.ts',
  'scripts/validation/rp-internal-beta-private-artifact-access-policy-local-runtime-1-diagnostics.mjs',
  'package.json',
]

const allowedChangedFiles = new Set(requiredFiles)

for (const file of [
  'scripts/validation/rp-internal-beta-private-artifact-manifest-local-runtime-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-e2e-negative-gate-tests-1r-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-local-readiness-gate-rollup-1-diagnostics.mjs',
]) {
  allowedChangedFiles.add(file)
}

const requiredText = [
  packet,
  'completed_local_private_artifact_access_policy_runtime_no_storage_read',
  'completed_backend_local_private_artifact_access_policy_validation_no_route_or_signed_url',
  'local_private_artifact_access_policy_validated_no_storage_read',
  'blocked_invalid_private_artifact_access_policy_input',
  'Access granted now: `false`',
  'Storage object creation/read/delete: `false`',
  'Signed URL creation: `false`',
  'Public artifact creation: `false`',
  'Internal beta end-to-end ready: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'PR #577 remains open/draft/blocked and excluded as source-of-truth',
  'RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CONFIRMED-RUN',
]

const forbiddenClaims = [
  /Internal beta end-to-end ready:\s*`?true/i,
  /internal beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /external beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /production unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /Access granted now:\s*`?true/i,
  /Supabase mutation:\s*`?true/i,
  /SQL execution:\s*`?true/i,
  /Storage object (creation|read|delete):\s*`?true/i,
  /Signed URL creation:\s*`?true/i,
  /Public artifact creation:\s*`?true/i,
  /Service-role route execution:\s*`?true/i,
  /Worker execution:\s*`?true/i,
  /Worker dispatch:\s*`?true/i,
  /Route execution:\s*`?true/i,
  /Provider\/model call:\s*`?true/i,
  /Remotion execution:\s*`?true/i,
  /FFmpeg execution:\s*`?true/i,
  /FFprobe execution:\s*`?true/i,
  /Media processing:\s*`?true/i,
  /Package-lock:\s*`?changed/i,
  /Generated artifacts committed:(?!\s*`?none`?)/i,
]

const forbiddenExactFiles = new Set(['package-lock.json', '.dockerignore'])
const forbiddenPrefixes = ['docker/', 'supabase/', 'database/', 'src/', 'server/routes/', 'server/workers/', 'server/providers/', 'public/', 'tests/']
const forbiddenFilePatterns = [/\.(mp4|mov|mkv|webm|srt|png|jpg|jpeg|wav|mp3)$/i, /(^|\/)\.env(\.|$)/, /(^|\/)node_modules\//]

function fail(message) {
  console.error(`${packet} diagnostics failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing required file: ${file}`)
  return fs.readFileSync(file, 'utf8')
}

for (const file of requiredFiles) read(file)

const packetDocs = requiredFiles
  .filter((file) => file.startsWith(packetDir) || file === 'docs/activation-phase-rp-internal-beta-private-artifact-access-policy-local-runtime-1-results.md')
  .map((file) => read(file))
  .join('\n')

const statusDocs = `${read('docs/production-beta-blocker-inventory.md')}\n${read('implementation-status-and-next-phase.md')}`

for (const text of requiredText) {
  if (!packetDocs.includes(text) && !statusDocs.includes(text)) fail(`missing required text: ${text}`)
}
for (const rx of forbiddenClaims) {
  if (rx.test(packetDocs)) fail(`forbidden claim matched ${rx}`)
}

const record = JSON.parse(read(`${packetDir}/private-artifact-access-policy-local-runtime-record.json`))
if (record.decision !== 'completed_local_private_artifact_access_policy_runtime_no_storage_read') fail('record decision mismatch')
if (record.execution !== 'completed_backend_local_private_artifact_access_policy_validation_no_route_or_signed_url') fail('record execution mismatch')
if (record.localAccessPolicyRecorded !== true) fail('local access policy flag missing')
if (record.accessGrantedNow !== false) fail('access must not be granted now')
if (record.storageObjectRead !== false) fail('storage read must be false')
if (record.signedUrlCreation !== false) fail('signed URL creation must be false')
if (record.publicArtifactCreation !== false) fail('public artifact creation must be false')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready local OSS tools must stay 0')

const service = read('server/services/internal-beta-private-artifact-access-policy-local-runtime.ts')
for (const text of [
  'local_private_artifact_access_policy_validated_no_storage_read',
  'blocked_invalid_private_artifact_access_policy_input',
  'accessGrantedNow: false',
  'storageObjectRead: false',
  'signedUrlCreation: false',
  'publicArtifactCreation: false',
  'findForbiddenInputKeys',
]) {
  if (!service.includes(text)) fail(`service missing required guard text: ${text}`)
}

const packageJson = read('package.json')
for (const text of [
  '"smoke:internal-beta-private-artifact-access-policy-local-runtime": "tsx server/smoke/internal-beta-private-artifact-access-policy-local-runtime-smoke.ts"',
  '"rp-internal-beta-private-artifact-access-policy-local-runtime-1:diagnostics": "node scripts/validation/rp-internal-beta-private-artifact-access-policy-local-runtime-1-diagnostics.mjs"',
]) {
  if (!packageJson.includes(text)) fail(`missing package script: ${text}`)
}

assertPackageLockUnchanged()
assertChangedFilesSafe()

console.log(`${packet} diagnostics passed`)

function assertPackageLockUnchanged() {
  try {
    execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv })
    execFileSync('git', ['diff', '--cached', '--quiet', '--', 'package-lock.json'], { env: gitEnv })
  } catch {
    fail('package-lock.json changed')
  }
}

function assertChangedFilesSafe() {
  for (const file of getChangedAndStagedFiles()) {
    if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
    if (forbiddenExactFiles.has(file)) fail(`forbidden changed file: ${file}`)
    if (forbiddenPrefixes.some((prefix) => file.startsWith(prefix))) fail(`forbidden changed file prefix: ${file}`)
    if (forbiddenFilePatterns.some((rx) => rx.test(file))) fail(`forbidden changed file pattern: ${file}`)
  }
}

function getChangedAndStagedFiles() {
  const files = new Set()
  const status = execFileSync('git', ['status', '--porcelain=v1', '-z'], { env: gitEnv })
    .toString('utf8')
    .split('\0')
    .filter(Boolean)

  for (let index = 0; index < status.length; index += 1) {
    const entry = status[index]
    const code = entry.slice(0, 2)
    collectPath(entry.slice(3), files)
    if (code.includes('R') || code.includes('C')) index += 1
  }
  for (const file of execFileSync('git', ['diff', '--name-only'], { env: gitEnv }).toString('utf8').split('\n').filter(Boolean)) {
    collectPath(file, files)
  }
  for (const file of execFileSync('git', ['diff', '--cached', '--name-only'], { env: gitEnv }).toString('utf8').split('\n').filter(Boolean)) {
    collectPath(file, files)
  }

  return [...files].sort()
}

function collectPath(relativePath, files) {
  if (!relativePath || !fs.existsSync(relativePath)) return
  const stat = fs.statSync(relativePath)
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(relativePath)) collectPath(path.join(relativePath, entry), files)
    return
  }
  if (stat.isFile()) files.add(relativePath)
}
