#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const packet = 'RP-INTERNAL-BETA-E2E-NEGATIVE-GATE-TESTS-1R'
const packetDir = 'docs/internal-beta/rp-internal-beta-e2e-negative-gate-tests-1r'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/negative-gate-test-matrix.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/gate-safety-boundary.md`,
  `${packetDir}/negative-gate-record.json`,
  'docs/activation-phase-rp-internal-beta-e2e-negative-gate-tests-1r-results.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'server/smoke/internal-beta-e2e-negative-gate-tests-smoke.ts',
  'scripts/validation/rp-internal-beta-e2e-negative-gate-tests-1r-diagnostics.mjs',
  'package.json',
]

const allowedChangedFiles = new Set(requiredFiles)

for (const file of [
  'scripts/validation/rp-internal-beta-e2e-negative-gate-tests-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-qa-cleanup-observability-local-runtime-1-diagnostics.mjs',
  'docs/internal-beta/rp-internal-beta-private-artifact-access-policy-local-runtime-1/source-audit.md',
  'docs/internal-beta/rp-internal-beta-private-artifact-access-policy-local-runtime-1/runtime-contract.md',
  'docs/internal-beta/rp-internal-beta-private-artifact-access-policy-local-runtime-1/validation-results.md',
  'docs/internal-beta/rp-internal-beta-private-artifact-access-policy-local-runtime-1/readiness-gate.md',
  'docs/internal-beta/rp-internal-beta-private-artifact-access-policy-local-runtime-1/safety-boundary.md',
  'docs/internal-beta/rp-internal-beta-private-artifact-access-policy-local-runtime-1/private-artifact-access-policy-local-runtime-record.json',
  'docs/activation-phase-rp-internal-beta-private-artifact-access-policy-local-runtime-1-results.md',
  'server/services/internal-beta-private-artifact-access-policy-local-runtime.ts',
  'server/smoke/internal-beta-private-artifact-access-policy-local-runtime-smoke.ts',
  'scripts/validation/rp-internal-beta-private-artifact-access-policy-local-runtime-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-private-artifact-manifest-local-runtime-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-local-readiness-gate-rollup-1-diagnostics.mjs',
]) {
  allowedChangedFiles.add(file)
}

const requiredText = [
  packet,
  'completed_internal_beta_negative_gate_tests_1r_after_qa_cleanup_observability',
  'completed_tests_only_no_runtime_unlock',
  'RP-INTERNAL-BETA-QA-CLEANUP-OBSERVABILITY-LOCAL-RUNTIME-1',
  'no QA cleanup observability acceptance of signed URL metadata',
  'no QA cleanup observability acceptance of path-like cleanup file names',
  'QA cleanup unsafe input rejected: `true`',
  'Path-like cleanup file name rejected: `true`',
  'Signed URL metadata rejected: `true`',
  'Cleanup execution: `false`',
  'Rollback execution: `false`',
  'Remote observability sink write: `false`',
  'Signed URL creation: `false`',
  'Public artifact creation: `false`',
  'Internal beta end-to-end status: `not_ready`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'PR #577 remains open/draft/blocked and excluded as source-of-truth',
  'RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CONFIRMED-RUN',
]

const forbiddenClaims = [
  /Internal beta end-to-end status:\s*`?(ready|enabled|unlocked|passed)/i,
  /internal beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /external beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /production unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /Cleanup execution:\s*`?true/i,
  /Rollback execution:\s*`?true/i,
  /Remote observability sink write:\s*`?true/i,
  /Signed URL creation:\s*`?true/i,
  /Public artifact creation:\s*`?true/i,
  /Worker execution:\s*`?true/i,
  /Provider\/model call:\s*`?true/i,
  /Remotion execution:\s*`?true/i,
  /FFmpeg execution:\s*`?true/i,
  /FFprobe execution:\s*`?true/i,
  /SQL execution:\s*`?true/i,
  /Package-lock:\s*`?changed/i,
  /Generated artifacts committed:(?!\s*`?none`?)/i,
]

const forbiddenExactFiles = new Set(['package-lock.json', '.dockerignore'])
const forbiddenPrefixes = ['docker/', 'supabase/', 'database/', 'src/', 'server/routes/', 'server/workers/', 'server/providers/', 'public/']
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
  .filter((file) => file.startsWith(packetDir) || file === 'docs/activation-phase-rp-internal-beta-e2e-negative-gate-tests-1r-results.md')
  .map((file) => read(file))
  .join('\n')

for (const text of requiredText) {
  if (!packetDocs.includes(text) && !read('docs/production-beta-blocker-inventory.md').includes(text) && !read('implementation-status-and-next-phase.md').includes(text)) {
    fail(`missing required text: ${text}`)
  }
}

for (const rx of forbiddenClaims) {
  if (rx.test(packetDocs)) fail(`forbidden claim matched ${rx}`)
}

const record = JSON.parse(read(`${packetDir}/negative-gate-record.json`))
if (record.decision !== 'completed_internal_beta_negative_gate_tests_1r_after_qa_cleanup_observability') fail('record decision mismatch')
if (record.execution !== 'completed_tests_only_no_runtime_unlock') fail('record execution mismatch')
if (record.qaCleanupUnsafeInputRejected !== true) fail('QA cleanup unsafe input rejection missing')
if (record.cleanupExecution !== false) fail('cleanup execution must be false')
if (record.rollbackExecution !== false) fail('rollback execution must be false')
if (record.remoteObservabilitySinkWrite !== false) fail('remote observability sink write must be false')
if (record.internalBetaEndToEndStatus !== 'not_ready') fail('internal beta must stay not_ready')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready local OSS tools must stay 0')

const smoke = read('server/smoke/internal-beta-e2e-negative-gate-tests-smoke.ts')
for (const text of [
  'createInternalBetaQaCleanupObservabilityLocalRuntime',
  'QA cleanup unsafe input must fail closed',
  'blocked_invalid_qa_cleanup_observability_input',
  'remoteObservabilitySinkWrite',
  'signedUrlCreation',
  'internalBetaUnlock',
]) {
  if (!smoke.includes(text)) fail(`smoke missing 1R text: ${text}`)
}
for (const pattern of [/\.from\(/, /\.insert\(/, /\.update\(/, /\.delete\(/, /\.rpc\(/, /createClient\(/, /fetch\(/, /exec(File)?Sync\(/, /spawn\(/, /renderMedia\(/]) {
  if (pattern.test(smoke)) fail(`smoke contains forbidden runtime signal ${pattern}`)
}

const packageJson = read('package.json')
if (!packageJson.includes('"rp-internal-beta-e2e-negative-gate-tests-1r:diagnostics": "node scripts/validation/rp-internal-beta-e2e-negative-gate-tests-1r-diagnostics.mjs"')) {
  fail('missing 1R diagnostics package script')
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
