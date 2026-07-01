import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { AI_VIDEO_BROLL_WAN_FAST_CACHE_READINESS_SPEC } from '../../src/backend/mock/mock-ai-video-broll-wan-fast-cache-readiness'

const ROOT = process.cwd()
const SPEC_PATH = 'src/backend/mock/mock-ai-video-broll-wan-fast-cache-readiness.ts'
const CLI_PATH = 'server/cli/ai-video-broll-wan-fast-cache-readiness-check.ts'
const SMOKE_PATH = 'server/smoke/ai-video-broll-wan-fast-cache-readiness-check-smoke.ts'
const PACKAGE_SCRIPT = 'ai-video-broll-wan-fast-cache-readiness:check'
const SMOKE_SCRIPT = 'smoke:ai-video-broll-wan-fast-cache-readiness-check'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'cacheReadiness'): string[] {
  const findings: string[] = []

  if (typeof value === 'string') {
    const patterns: Array<[string, RegExp]> = [
      ['concrete public URL', /\bhttps?:\/\/(?!127\.0\.0\.1|localhost)\S+/i],
      ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|Signature=|Key-Pair-Id=|Policy=)/i],
      ['public storage URL', /\bstorage\.googleapis\.com\b/i],
      ['service-role value', /\bservice[_-]?role\s*[:=]\s*['"][^'"]+/i],
      ['api key value', /\bapi[_-]?key\s*[:=]\s*['"][^'"]+/i],
      ['provider credential value', /\b(provider[_-]?secret|provider[_-]?key)\s*[:=]\s*['"][^'"]+/i],
      ['raw worker prompt field', /\braw[_-]?worker[_-]?prompt\b/i],
      ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
    ]

    for (const [name, pattern] of patterns) {
      if (pattern.test(value)) findings.push(`${prefix}: ${name}`)
    }

    return findings
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => findings.push(...scanForbiddenValues(item, `${prefix}[${index}]`)))
    return findings
  }

  if (value && typeof value === 'object') {
    for (const [key, nestedValue] of Object.entries(value)) {
      findings.push(...scanForbiddenValues(nestedValue, `${prefix}.${key}`))
    }
  }

  return findings
}

for (const file of [SPEC_PATH, CLI_PATH, SMOKE_PATH, 'package.json']) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/cli/ai-video-broll-wan-fast-cache-readiness-check.ts',
  'package readiness script mismatch',
)
assert.equal(
  packageJson.scripts?.[SMOKE_SCRIPT],
  'tsx server/smoke/ai-video-broll-wan-fast-cache-readiness-check-smoke.ts',
  'package smoke script mismatch',
)

const cliSource = read(CLI_PATH)
for (const forbidden of [
  'node:crypto',
  'createHash',
  'sha256(',
  'gcloud ',
  'supabase ',
  'docker ',
  'psql',
  'createdb',
  'dropdb',
  'from_pretrained',
  'import torch',
  'torch.',
  'diffusers',
  'execFileSync(',
  'spawnSync(',
]) {
  assert.equal(cliSource.includes(forbidden), false, `CLI must not include runtime marker: ${forbidden}`)
}
assert.equal(cliSource.includes('stat-only cache readiness check'), true)

const spec = AI_VIDEO_BROLL_WAN_FAST_CACHE_READINESS_SPEC
assert.equal(spec.decision, 'ai_video_broll_wan_fast_cache_readiness_stat_only_ready_quota_blocked')
assert.equal(spec.mode, 'stat_only_private_cache_readiness_check')
assert.equal(spec.toolId, 'ai_video_broll_generation_wan')
assert.equal(spec.modelRepository, 'Wan-AI/Wan2.1-T2V-1.3B-Diffusers')
assert.equal(spec.sourceCommit, '0fad780a534b6463e45facd96134c9f345acfa5b')
assert.equal(spec.runtimeEssentialFileCount, 19)
assert.equal(spec.aggregateBytes, 28928887859)
assert.equal(spec.expectedModelIndexClassName, 'WanPipeline')
assert.equal(spec.quotaBlocker, 'gpus_all_regions_quota_zero')
assert.equal(spec.selectedGpu, 'nvidia_l4')
assert.equal(spec.statOnly, true)
assert.equal(spec.hashesComputed, false)
assert.equal(spec.modelImportRun, false)
assert.equal(spec.modelInferenceRun, false)
assert.equal(spec.generatedVideoCreated, false)
assert.equal(spec.generatedAssetsCreated, false)
assert.equal(spec.providerCallsMade, false)
assert.equal(spec.workersDispatched, false)
assert.equal(spec.computeVmCreated, false)
assert.equal(spec.dockerRun, false)
assert.equal(spec.gcpMutatingCommandsExecuted, false)
assert.equal(spec.supabaseTouched, false)
assert.equal(spec.sqlExecuted, false)
assert.equal(spec.creditMutationCreated, false)
assert.equal(spec.readyForExternalAgentExecutionNow, false)
assert.equal(spec.readyForBoundedRetryAfterBlockerClears, true)
assert.equal(spec.manifest.length, spec.runtimeEssentialFileCount)
assert.equal(
  spec.manifest.reduce((total, entry) => total + entry.expectedBytes, 0),
  spec.aggregateBytes,
  'Manifest aggregate bytes mismatch',
)

const cliOutput = execFileSync('npx', ['tsx', CLI_PATH], {
  cwd: ROOT,
  encoding: 'utf8',
  maxBuffer: 1024 * 1024,
})
const summary = JSON.parse(cliOutput)
assert.equal(summary.ok, true)
assert.equal(summary.decision, spec.decision)
assert.equal(summary.mode, spec.mode)
assert.equal(summary.statOnly, true)
assert.equal(summary.cachePathExists, true)
assert.equal(summary.expectedFileCount, spec.runtimeEssentialFileCount)
assert.equal(summary.actualFileCount, spec.runtimeEssentialFileCount)
assert.equal(summary.aggregateBytes, spec.aggregateBytes)
assert.equal(summary.aggregateBytesMatches, true)
assert.deepEqual(summary.missingFiles, [])
assert.deepEqual(summary.byteMismatches, [])
assert.deepEqual(summary.unexpectedFiles, [])
assert.deepEqual(summary.partialFiles, [])
assert.deepEqual(summary.appleDoubleSidecars, [])
assert.deepEqual(summary.assetsOrExamples, [])
assert.equal(summary.modelIndexClassName, spec.expectedModelIndexClassName)
assert.equal(summary.modelIndexClassNameMatches, true)
assert.equal(summary.indexRefsLocal, true)
assert.deepEqual(summary.indexReferenceFindings, [])
assert.equal(summary.runtimeGatesAllFalse, true)
assert.equal(summary.readyForExternalAgentExecutionNow, false)
assert.equal(summary.readyForBoundedRetryAfterBlockerClears, true)
assert.equal(summary.nextAction, spec.nextAction)

for (const [flag, value] of Object.entries(summary.runtimeSideEffects as Record<string, boolean>)) {
  assert.equal(value, false, `Runtime side-effect flag must be false: ${flag}`)
}

let refusedRuntimeMode = false
try {
  execFileSync('npx', ['tsx', CLI_PATH, '--run'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
} catch (error) {
  refusedRuntimeMode = true
  const stderr = error instanceof Error && 'stderr' in error ? String(error.stderr) : ''
  assert.equal(stderr.includes('stat-only cache readiness check'), true)
}
assert.equal(refusedRuntimeMode, true, 'runtime mode must fail closed')

const forbiddenFindings = scanForbiddenValues({ spec, summary })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: summary.decision,
      mode: summary.mode,
      statOnly: summary.statOnly,
      cachePathExists: summary.cachePathExists,
      aggregateBytes: summary.aggregateBytes,
      modelIndexClassName: summary.modelIndexClassName,
      runtimeGatesAllFalse: summary.runtimeGatesAllFalse,
      readyForExternalAgentExecutionNow: summary.readyForExternalAgentExecutionNow,
      nextAction: summary.nextAction,
    },
    null,
    2,
  ),
)
