#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const packet = 'RP-INTERNAL-BETA-QA-CLEANUP-OBSERVABILITY-LOCAL-RUNTIME-1'
const packetDir = 'docs/internal-beta/rp-internal-beta-qa-cleanup-observability-local-runtime-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/runtime-contract.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qa-cleanup-observability-local-runtime-record.json`,
  'docs/activation-phase-rp-internal-beta-qa-cleanup-observability-local-runtime-1-results.md',
  'docs/internal-beta/rp-internal-beta-local-readiness-gate-rollup-1/readiness-matrix.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'server/services/internal-beta-qa-cleanup-observability-local-runtime.ts',
  'server/smoke/internal-beta-qa-cleanup-observability-local-runtime-smoke.ts',
  'scripts/validation/rp-internal-beta-qa-cleanup-observability-local-runtime-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-remotion-private-preview-export-confirmed-run-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-remotion-private-preview-export-local-runtime-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-local-readiness-gate-rollup-1-diagnostics.mjs',
  'package.json',
]

const allowedChangedFiles = new Set(requiredFiles)

for (const file of [
  'docs/internal-beta/rp-internal-beta-e2e-negative-gate-tests-1r/source-audit.md',
  'docs/internal-beta/rp-internal-beta-e2e-negative-gate-tests-1r/negative-gate-test-matrix.md',
  'docs/internal-beta/rp-internal-beta-e2e-negative-gate-tests-1r/readiness-gate.md',
  'docs/internal-beta/rp-internal-beta-e2e-negative-gate-tests-1r/gate-safety-boundary.md',
  'docs/internal-beta/rp-internal-beta-e2e-negative-gate-tests-1r/negative-gate-record.json',
  'docs/activation-phase-rp-internal-beta-e2e-negative-gate-tests-1r-results.md',
  'server/smoke/internal-beta-e2e-negative-gate-tests-smoke.ts',
  'scripts/validation/rp-internal-beta-e2e-negative-gate-tests-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-e2e-negative-gate-tests-1r-diagnostics.mjs',
]) {
  allowedChangedFiles.add(file)
}

const requiredText = [
  packet,
  'completed_local_qa_cleanup_observability_runtime_no_remote_execution',
  'completed_backend_local_qa_cleanup_observability_validation_no_remote_sink_or_cleanup_execution',
  'local_qa_cleanup_observability_validated_no_remote_execution',
  'blocked_invalid_qa_cleanup_observability_input',
  'local QA gate',
  'cleanup policy',
  'observability event',
  'rollback gate',
  'QA execution: `false`',
  'QA media inspection: `false`',
  'Cleanup execution: `false`',
  'Rollback execution: `false`',
  'Remote observability sink write: `false`',
  'Internal beta end-to-end ready: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'PR #577 remains open/draft/blocked and excluded as source-of-truth',
  'RP-INTERNAL-BETA-E2E-NEGATIVE-GATE-TESTS-1R',
  'No Supabase mutation, SQL execution, migration apply, RLS policy apply, storage bucket creation, storage object creation, storage object read, storage object delete, Secret Manager payload access, service-role secret payload access, frontend service-role credential exposure, service-role route execution, provider call, model call, worker execution, worker dispatch, worker lease claim, worker heartbeat, route execution, browser capture, signed URL creation, public artifact creation, real credit mutation, job enqueue execution, job event write execution, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, raw prompt execution, QA media inspection, cleanup execution, rollback execution, remote observability sink write, private media processing, user media processing, Remotion execution, FFmpeg execution, FFprobe execution, Docker execution, package installation beyond dependency validation, or broad service-role handler was enabled.',
]

const packageJsonRequiredScripts = [
  '"smoke:internal-beta-qa-cleanup-observability-local-runtime": "tsx server/smoke/internal-beta-qa-cleanup-observability-local-runtime-smoke.ts"',
  '"rp-internal-beta-qa-cleanup-observability-local-runtime-1:diagnostics": "node scripts/validation/rp-internal-beta-qa-cleanup-observability-local-runtime-1-diagnostics.mjs"',
]

const forbiddenClaims = [
  /Internal beta end-to-end ready:\s*`?true/i,
  /Internal beta end-to-end status:\s*`?(ready|enabled|unlocked|passed)/i,
  /internal beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /external beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /production unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /Remote Supabase mutation:\s*`?true/i,
  /SQL execution:\s*`?true/i,
  /Migration apply:\s*`?true/i,
  /Storage object creation:\s*`?true/i,
  /Storage object read:\s*`?true/i,
  /Storage object delete:\s*`?true/i,
  /Service-role route execution:\s*`?true/i,
  /Worker execution:\s*`?true/i,
  /Worker dispatch:\s*`?true/i,
  /Provider\/model call:\s*`?true/i,
  /QA execution:\s*`?true/i,
  /QA media inspection:\s*`?true/i,
  /Cleanup execution:\s*`?true/i,
  /Rollback execution:\s*`?true/i,
  /Remote observability sink write:\s*`?true/i,
  /Signed URL creation:\s*`?true/i,
  /Public artifact creation:\s*`?true/i,
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

for (const file of requiredFiles) {
  read(file)
}

const combinedDocs = requiredFiles
  .filter((file) => file.endsWith('.md') || file.endsWith('.json'))
  .map((file) => read(file))
  .join('\n')
const packetDocs = requiredFiles
  .filter((file) => file.startsWith(packetDir) || file.startsWith('docs/activation-phase-rp-internal-beta-qa-cleanup-observability-local-runtime-1-results.md'))
  .map((file) => read(file))
  .join('\n')

for (const text of requiredText) {
  if (!combinedDocs.includes(text)) fail(`missing required text: ${text}`)
}

const packageJson = read('package.json')
for (const scriptText of packageJsonRequiredScripts) {
  if (!packageJson.includes(scriptText)) fail(`missing package script: ${scriptText}`)
}

const service = read('server/services/internal-beta-qa-cleanup-observability-local-runtime.ts')
for (const text of [
  'local_qa_cleanup_observability_validated_no_remote_execution',
  'blocked_invalid_qa_cleanup_observability_input',
  'remoteObservabilitySinkWrite: false',
  'cleanupExecution: false',
  'rollbackExecution: false',
  'qaMediaInspection: false',
  'internalBetaUnlock: false',
  'findForbiddenInputKeys',
]) {
  if (!service.includes(text)) fail(`service missing required guard text: ${text}`)
}

for (const rx of forbiddenClaims) {
  if (rx.test(packetDocs)) fail(`forbidden claim matched ${rx}`)
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
  const files = getChangedAndStagedFiles()
  for (const file of files) {
    if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
    if (forbiddenExactFiles.has(file)) fail(`forbidden changed file: ${file}`)
    if (forbiddenPrefixes.some((prefix) => file.startsWith(prefix))) fail(`forbidden changed file prefix: ${file}`)
    if (forbiddenFilePatterns.some((rx) => rx.test(file))) fail(`forbidden changed file pattern: ${file}`)
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      const text = fs.readFileSync(file, 'utf8')
      const isNegativeSmokeFixture =
        file === 'server/smoke/internal-beta-qa-cleanup-observability-local-runtime-smoke.ts' ||
        file === 'server/smoke/internal-beta-e2e-negative-gate-tests-smoke.ts'
      if (!isNegativeSmokeFixture && /(["']?(serviceRoleKey|providerApiKey|signedUrl|publicUrl|mediaBytes|fileBuffer|renderedBytes)["']?\s*:)/i.test(text)) {
        fail(`forbidden secret/artifact/media key in changed file: ${file}`)
      }
    }
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
    for (const entry of fs.readdirSync(relativePath)) {
      collectPath(path.join(relativePath, entry), files)
    }
    return
  }
  if (stat.isFile()) files.add(relativePath)
}
