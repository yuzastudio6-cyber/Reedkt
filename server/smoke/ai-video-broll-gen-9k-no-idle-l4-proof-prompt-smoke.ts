import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { AI_VIDEO_BROLL_GEN_9K_NO_IDLE_L4_PROOF_PROMPT } from '../../src/backend/mock/mock-ai-video-broll-gen-9k-no-idle-l4-proof-prompt'

const ROOT = process.cwd()
const PROMPT_PATH = 'docs/implementation-prompts/prompt-ai-video-broll-gen-9k-no-idle-l4-proof.md'
const SPEC_PATH = 'src/backend/mock/mock-ai-video-broll-gen-9k-no-idle-l4-proof-prompt.ts'
const SMOKE_PATH = 'server/smoke/ai-video-broll-gen-9k-no-idle-l4-proof-prompt-smoke.ts'
const PACKAGE_SCRIPT = 'smoke:ai-video-broll-gen-9k-no-idle-l4-proof-prompt'
const NEXT_PROMPT =
  'AI-VIDEO-BROLL-GEN-9L-NO-IDLE-L4-PROOF-EXECUTE: run bounded no-idle L4 VM lifecycle proof with mandatory cleanup, no model inference'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'broll9kNoIdlePrompt'): string[] {
  const findings: string[] = []

  if (typeof value === 'string') {
    const patterns: Array<[string, RegExp]> = [
      ['concrete public URL', /\bhttps?:\/\/\S+/i],
      ['access token value', /\bya29\.[A-Za-z0-9._-]+/i],
      ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
      ['jwt value', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/i],
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

for (const file of [PROMPT_PATH, SPEC_PATH, SMOKE_PATH, 'package.json']) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/ai-video-broll-gen-9k-no-idle-l4-proof-prompt-smoke.ts',
  'package smoke script mismatch',
)

const prompt = read(PROMPT_PATH)
for (const required of [
  '# AI-VIDEO-BROLL-GEN-9K No-Idle L4 Proof Prompt',
  'AI-VIDEO-BROLL-GEN-9K-NO-IDLE-L4-PROOF-PROMPT',
  'ai_video_broll_gen_9k_no_idle_l4_proof_prompt_ready_no_vm_no_inference',
  'does not create a VM',
  'does not create generated video',
  'docs/ai-video-broll-wan-gpu-global-quota-verify-result.md',
  'docs/ai-video-broll-generation-gcp-private-vm-create-plan-3-result.md',
  'Project: `reeditpro`',
  'Zone: `us-central1-b`',
  'Proof VM name: `reeditpro-ai-broll-wan-l4-proof`',
  'Machine type: `g2-standard-4`',
  'GPU: one `nvidia_l4`',
  'no public IP',
  'delete only the VM created by the future execution prompt',
  'verify cleanup before completion',
  'cleanup failure as proof failure',
  'Forbidden In This Prompt',
  'create, start, stop, or delete Compute Engine resources',
  'run Wan/Wan2.1 inference',
  NEXT_PROMPT,
]) {
  assert.equal(prompt.includes(required), true, `prompt doc missing ${required}`)
}

const spec = AI_VIDEO_BROLL_GEN_9K_NO_IDLE_L4_PROOF_PROMPT
assert.equal(spec.decision, 'ai_video_broll_gen_9k_no_idle_l4_proof_prompt_ready_no_vm_no_inference')
assert.equal(spec.mode, 'broll_no_idle_l4_proof_prompt_only')
assert.equal(spec.toolId, 'ai_video_broll_generation_wan')
assert.equal(spec.selectedModelFamily, 'Wan/Wan2.1')
assert.equal(spec.selectedGpu, 'nvidia_l4')
assert.equal(spec.projectId, 'reeditpro')
assert.equal(spec.targetRegion, 'us-central1')
assert.equal(spec.targetZone, 'us-central1-b')
assert.equal(spec.proofVmName, 'reeditpro-ai-broll-wan-l4-proof')
assert.equal(spec.machineType, 'g2-standard-4')
assert.equal(spec.promptCreatesVm, false)
assert.equal(spec.promptRunsInference, false)
assert.equal(spec.promptCreatesGeneratedAssets, false)
assert.equal(spec.claimsDryRunPassed, false)
assert.equal(spec.claimsGeneratedLocalFixturePassed, false)
assert.equal(spec.quotaRequirements.quotaVerified, true)
assert.equal(spec.quotaRequirements.quotaRequestRequiredNow, false)
assert.equal(spec.noIdleLifecycleGate.noPublicIpRequired, true)
assert.equal(spec.noIdleLifecycleGate.externalIpAllowed, false)
assert.equal(spec.noIdleLifecycleGate.iapOnlyAccessRequired, true)
assert.equal(spec.noIdleLifecycleGate.bootDiskAutoDeleteRequired, true)
assert.equal(spec.noIdleLifecycleGate.preExistingResourceCheckRequired, true)
assert.equal(spec.noIdleLifecycleGate.deleteOnlyResourcesCreatedByPrompt, true)
assert.equal(spec.noIdleLifecycleGate.cleanupVerificationRequired, true)
assert.equal(spec.noIdleLifecycleGate.cleanupFailureBlocksSuccess, true)
assert.equal(spec.noIdleLifecycleGate.idleGpuAllowed, false)
assert.equal(spec.noIdleLifecycleGate.vmCreateAllowedInThisPrompt, false)
assert.equal(spec.noIdleLifecycleGate.modelImportAllowedInThisPrompt, false)
assert.equal(spec.noIdleLifecycleGate.modelInferenceAllowedInThisPrompt, false)
assert.equal(spec.futureExecutionPreflightRequired.length >= 10, true)
assert.equal(spec.forbiddenNow.includes('compute_vm_create'), true)
assert.equal(spec.forbiddenNow.includes('model_inference'), true)
assert.equal(spec.forbiddenNow.includes('generated_video'), true)
assert.equal(spec.forbiddenNow.includes('supabase'), true)
assert.equal(spec.recommendedNextPrompt, NEXT_PROMPT)

for (const [flag, value] of Object.entries(spec.runtimeSideEffects)) {
  assert.equal(value, false, `Runtime side-effect flag must be false: ${flag}`)
}

const forbiddenFindings = scanForbiddenValues({ prompt, spec })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      mode: 'ai_video_broll_gen_9k_no_idle_l4_proof_prompt_smoke',
      decision: spec.decision,
      proofVmName: spec.proofVmName,
      selectedGpu: spec.selectedGpu,
      promptCreatesVm: spec.promptCreatesVm,
      promptRunsInference: spec.promptRunsInference,
      cleanupVerificationRequired: spec.noIdleLifecycleGate.cleanupVerificationRequired,
      recommendedNextPrompt: spec.recommendedNextPrompt,
      generatedLocalFixturePassedClaimed: false,
    },
    null,
    2,
  ),
)
