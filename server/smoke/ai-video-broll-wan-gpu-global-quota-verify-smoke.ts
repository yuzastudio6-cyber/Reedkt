import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { AI_VIDEO_BROLL_WAN_GPU_GLOBAL_QUOTA_VERIFY } from '../../src/backend/mock/mock-ai-video-broll-wan-gpu-global-quota-verify'
import { AI_VIDEO_BROLL_WAN_GPU_GLOBAL_QUOTA_VERIFY_RESULT } from '../../src/backend/mock/mock-ai-video-broll-wan-gpu-global-quota-verify-result'

const ROOT = process.cwd()
const DOC_PATH = 'docs/ai-video-broll-wan-gpu-global-quota-verify-result.md'
const SPEC_PATH = 'src/backend/mock/mock-ai-video-broll-wan-gpu-global-quota-verify.ts'
const RESULT_SPEC_PATH = 'src/backend/mock/mock-ai-video-broll-wan-gpu-global-quota-verify-result.ts'
const CLI_PATH = 'server/cli/ai-video-broll-wan-gpu-global-quota-verify.ts'
const SMOKE_PATH = 'server/smoke/ai-video-broll-wan-gpu-global-quota-verify-smoke.ts'
const PACKAGE_SCRIPT = 'ai-video-broll-wan-gpu-global-quota:verify'
const SMOKE_SCRIPT = 'smoke:ai-video-broll-wan-gpu-global-quota-verify'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'brollQuotaVerify'): string[] {
  const findings: string[] = []

  if (typeof value === 'string') {
    const patterns: Array<[string, RegExp]> = [
      ['concrete public URL', /\bhttps?:\/\/\S+/i],
      ['access token value', /\bya29\.[A-Za-z0-9._-]+/i],
      ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
      ['jwt value', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/i],
      ['email value', /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i],
      ['service-role value', /\bservice[_-]?role\s*[:=]\s*['"][^'"]+/i],
      ['api key value', /\bapi[_-]?key\s*[:=]\s*['"][^'"]+/i],
      ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
      ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|Signature=|Key-Pair-Id=|Policy=)/i],
      ['raw worker prompt field', /\braw[_-]?worker[_-]?prompt\b/i],
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

for (const file of [DOC_PATH, SPEC_PATH, RESULT_SPEC_PATH, CLI_PATH, SMOKE_PATH, 'package.json']) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const doc = read(DOC_PATH)
for (const required of [
  '# AI Video B-roll Wan GPU Global Quota Verify Result',
  'Decision: `ai_video_broll_wan_gpu_global_quota_verified_no_idle_prompt_ready`',
  'Recorded at: `2026-07-02T13:09:27Z`',
  'This packet records a read-only B-roll quota verification result',
  'Project: `reeditpro`',
  '`GPUS_ALL_REGIONS` limit',
  '`NVIDIA_L4_GPUS` limit in `northamerica-northeast1`',
  'Quota is sufficient for one L4 VM',
  '9W create attempt in `us-east4-a` stocked out',
  'this result is not execution permission',
  'quota request created: false',
  'Compute Engine VM created: false',
  'model import/inference: false',
  'Supabase/SQL/storage/signed URLs: false',
  'beta/production unlock: false',
  '9Y create attempt in `us-east4-c` also stocked out',
  '9Z no-VM stockout-fix result selected `us-east1-b`',
  '10A no-idle transfer proof then stocked out in `us-east1-b`',
  '10B no-VM stockout-fix result selected `us-east1-c`',
  '10C no-idle transfer proof then stocked out in `us-east1-c`',
  '10D no-VM stockout-fix result selected `us-east1-d`',
  '10E no-idle transfer proof then stocked out in `us-east1-d`',
  '10G no-idle transfer proof then stocked out in `us-west4-a`',
  '10H no-VM stockout-fix result selected `us-west4-c`',
  '10J bounded payload/install-readiness proof then stocked out',
  'AI-VIDEO-BROLL-GEN-10L-NO-IDLE-L4-IAP-WHEELHOUSE-PAYLOAD-INSTALL-PROOF-NORTHAMERICA-NORTHEAST1-B',
]) {
  assert.equal(doc.includes(required), true, `quota verify result doc missing ${required}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/cli/ai-video-broll-wan-gpu-global-quota-verify.ts',
  'package quota verify script mismatch',
)
assert.equal(
  packageJson.scripts?.[SMOKE_SCRIPT],
  'tsx server/smoke/ai-video-broll-wan-gpu-global-quota-verify-smoke.ts',
  'package quota verify smoke script mismatch',
)

const spec = AI_VIDEO_BROLL_WAN_GPU_GLOBAL_QUOTA_VERIFY
const resultSpec = AI_VIDEO_BROLL_WAN_GPU_GLOBAL_QUOTA_VERIFY_RESULT
assert.equal(spec.decision, 'ai_video_broll_wan_gpu_global_quota_verify_read_only_probe_defined')
assert.equal(spec.mode, 'read_only_broll_wan_gpu_global_quota_verify')
assert.equal(spec.toolId, 'ai_video_broll_generation_wan')
assert.equal(spec.projectId, 'reeditpro')
assert.equal(spec.targetRegion, 'northamerica-northeast1')
assert.equal(spec.targetZone, 'northamerica-northeast1-b')
assert.equal(spec.selectedGpu, 'nvidia_l4')
assert.equal(spec.machineType, 'g2-standard-4')
assert.equal(spec.minimumGlobalGpusAllRegionsQuota, 1)
assert.equal(spec.minimumRegionalL4Quota, 1)
assert.equal(spec.globalQuotaMetric, 'GPUS_ALL_REGIONS')
assert.equal(spec.regionalQuotaMetric, 'NVIDIA_L4_GPUS')
assert.equal(spec.nextActionIfQuotaBlocked.includes('GPU-GLOBAL-QUOTA-USER'), true)
assert.equal(
  spec.nextActionIfQuotaCleared.includes(
    '10L-NO-IDLE-L4-IAP-WHEELHOUSE-PAYLOAD-INSTALL-PROOF-NORTHAMERICA-NORTHEAST1-B',
  ),
  true,
)
assert.equal(spec.allowedReadOnlyCommands.length, 7)
assert.equal(resultSpec.decision, 'ai_video_broll_wan_gpu_global_quota_verified_no_idle_prompt_ready')
assert.equal(resultSpec.mode, 'read_only_broll_wan_gpu_global_quota_verify_result')
assert.equal(resultSpec.recordedAt, '2026-07-02T13:09:27Z')
assert.equal(resultSpec.toolId, spec.toolId)
assert.equal(resultSpec.projectId, spec.projectId)
assert.equal(resultSpec.targetRegion, spec.targetRegion)
assert.equal(resultSpec.targetZone, spec.targetZone)
assert.equal(resultSpec.selectedGpu, spec.selectedGpu)
assert.equal(resultSpec.machineType, spec.machineType)
assert.equal(resultSpec.verificationCommand, `npm run ${PACKAGE_SCRIPT}`)
assert.equal(resultSpec.quota.globalQuotaMetric, spec.globalQuotaMetric)
assert.equal(resultSpec.quota.globalGpusAllRegionsQuotaLimit, 1)
assert.equal(resultSpec.quota.globalGpusAllRegionsQuotaUsage, 0)
assert.equal(resultSpec.quota.regionalQuotaMetric, spec.regionalQuotaMetric)
assert.equal(resultSpec.quota.regionalL4GpuQuotaLimit, 1)
assert.equal(resultSpec.quota.regionalL4GpuQuotaUsage, 0)
assert.equal(resultSpec.quota.quotaSufficientForOneL4Vm, true)
assert.equal(resultSpec.noIdleLifecycleGate.readyForBrollNoIdleProofPrompt, true)
assert.equal(resultSpec.noIdleLifecycleGate.vmCreateAllowedNow, false)
assert.equal(resultSpec.noIdleLifecycleGate.modelInferenceAllowedNow, false)
assert.equal(resultSpec.readyForExternalAgentExecutionNow, false)
assert.equal(resultSpec.readyForBrollNoIdleProofPrompt, true)
assert.equal(resultSpec.dryRunPassedClaimed, false)
assert.equal(resultSpec.generatedLocalFixturePassedClaimed, false)
assert.equal(resultSpec.recommendedNextPrompt, spec.nextActionIfQuotaCleared)

for (const command of spec.allowedReadOnlyCommands) {
  assert.equal(command.capturesTokenValue, false, `${command.id} must not capture token values`)
  assert.equal(command.mutatesCloud, false, `${command.id} must not mutate cloud state`)
  assert.equal(command.createsComputeVm, false, `${command.id} must not create a VM`)
  assert.equal(command.requestsQuota, false, `${command.id} must not request quota`)
  assert.equal(command.runsInference, false, `${command.id} must not run inference`)
}

const renderedCommands = spec.allowedReadOnlyCommands.map((command) => [command.command, ...command.args].join(' '))
assert.equal(renderedCommands.includes('gcloud compute project-info describe --project reeditpro --format=json'), true)
assert.equal(
  renderedCommands.includes(
    'gcloud compute regions describe northamerica-northeast1 --project reeditpro --format=json',
  ),
  true,
)
for (const forbiddenPattern of [
  /\bgcloud\s+compute\s+instances\s+(create|delete|start|stop)\b/i,
  /\bgcloud\s+compute\s+disks\s+(create|delete)\b/i,
  /\bgcloud\s+services\s+enable\b/i,
  /\bgcloud\s+compute\s+firewall-rules\s+(create|delete|update)\b/i,
  /\bgcloud\s+storage\s+(cp|mv|rm)\b/i,
  /\bgcloud\s+run\s+(deploy|jobs\s+execute)\b/i,
  /\bgcloud\s+auth\s+login\b/i,
  /\bdocker\s+/i,
  /\bpsql\b/i,
  /\bfrom_pretrained\b/i,
  /\btorch\./i,
]) {
  assert.equal(
    renderedCommands.some((command) => forbiddenPattern.test(command)),
    false,
    `Allowed command list contains forbidden runtime command: ${forbiddenPattern}`,
  )
}

const cliSource = read(CLI_PATH)
assert.equal(cliSource.includes('spawnSync'), true)
for (const forbiddenSource of [
  'execSync',
  'execFileSync',
  'instances create',
  'services enable',
  'firewall-rules create',
  'storage cp',
  'auth login',
  'from_pretrained',
  'modelInferenceRun: true',
]) {
  assert.equal(cliSource.includes(forbiddenSource), false, `CLI source contains forbidden marker: ${forbiddenSource}`)
}

const planOutput = execFileSync('npx', ['tsx', CLI_PATH, '--plan'], {
  cwd: ROOT,
  encoding: 'utf8',
  maxBuffer: 1024 * 1024,
})
const plan = JSON.parse(planOutput)
assert.equal(plan.ok, true)
assert.equal(plan.liveReadOnlyChecksRun, false)
assert.equal(plan.allowedReadOnlyCommands.length, spec.allowedReadOnlyCommands.length)

const liveOutput = execFileSync('npx', ['tsx', CLI_PATH], {
  cwd: ROOT,
  encoding: 'utf8',
  maxBuffer: 1024 * 1024 * 5,
})
const live = JSON.parse(liveOutput)
assert.equal(live.ok, true)
assert.equal(live.decision, spec.decision)
assert.equal(live.mode, spec.mode)
assert.equal(live.liveReadOnlyChecksRun, true)
assert.equal(live.readyForExternalAgentExecutionNow, false)
assert.equal(live.targetRegion, spec.targetRegion)
assert.equal(live.targetZone, spec.targetZone)
assert.equal(live.selectedGpu, spec.selectedGpu)
assert.equal(live.machineType, spec.machineType)
assert.equal(typeof live.gcloud.available, 'boolean')
assert.equal(typeof live.gcloud.accessTokenRefreshPassed, 'boolean')
assert.equal(Array.isArray(live.gcloud.pathCandidates), true)
assert.equal(typeof live.quotaProbeSkipped, 'boolean')
assert.equal(typeof live.projectQuotaReadPassed, 'boolean')
assert.equal(typeof live.regionQuotaReadPassed, 'boolean')
assert.equal(live.globalQuotaMetric, spec.globalQuotaMetric)
assert.equal(live.regionalQuotaMetric, spec.regionalQuotaMetric)
assert.equal(typeof live.quotaSufficientForOneL4Vm, 'boolean')
assert.equal(live.readyForBrollNoIdleProofPrompt, live.quotaSufficientForOneL4Vm)
assert.equal(typeof live.recommendedNextPrompt, 'string')
assert.equal(Array.isArray(live.commandSummaries), true)
assert.equal(Array.isArray(live.skippedCommandSummaries), true)
assert.equal(live.runtimeGatesAllFalse, true)
assert.deepEqual(live.noIdleLifecycleGate, spec.noIdleLifecycleGate)

if (live.quotaSufficientForOneL4Vm) {
  assert.equal(live.blocker, 'cleared')
  assert.equal(live.recommendedNextPrompt, spec.nextActionIfQuotaCleared)
} else if (live.quotaProbeSkipped) {
  assert.equal(live.blocker, spec.blockerIfAuthUnavailable)
  assert.equal(live.recommendedNextPrompt, spec.nextActionIfAuthBlocked)
} else {
  assert.equal(
    [spec.blockerIfQuotaInsufficient, spec.blockerIfRegionalL4Insufficient].includes(live.blocker),
    true,
    'quota blocker must be a known B-roll quota blocker',
  )
  assert.equal(live.recommendedNextPrompt, spec.nextActionIfQuotaBlocked)
}

for (const [flag, value] of Object.entries(live.runtimeSideEffects as Record<string, boolean>)) {
  assert.equal(value, false, `Runtime side-effect flag must be false: ${flag}`)
}
for (const [flag, value] of Object.entries(resultSpec.runtimeSideEffects as Record<string, boolean>)) {
  assert.equal(value, false, `Result runtime side-effect flag must be false: ${flag}`)
}

const forbiddenFindings = scanForbiddenValues({ doc, spec, resultSpec, plan, live })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: live.decision,
      mode: live.mode,
      quotaProbeSkipped: live.quotaProbeSkipped,
      quotaSufficientForOneL4Vm: live.quotaSufficientForOneL4Vm,
      blocker: live.blocker,
      readyForBrollNoIdleProofPrompt: live.readyForBrollNoIdleProofPrompt,
      runtimeGatesAllFalse: live.runtimeGatesAllFalse,
      recommendedNextPrompt: live.recommendedNextPrompt,
    },
    null,
    2,
  ),
)
