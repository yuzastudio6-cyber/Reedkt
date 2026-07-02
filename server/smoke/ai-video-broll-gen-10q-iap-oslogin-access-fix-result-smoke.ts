import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import {
  AI_VIDEO_BROLL_GEN_10Q_IAP_OSLOGIN_ACCESS_FIX_RESULT,
  AI_VIDEO_BROLL_GEN_10R_NO_GPU_IAP_SSH_CANARY_PROMPT,
} from '../../src/backend/mock/mock-ai-video-broll-gen-10q-iap-oslogin-access-fix-result'

const ROOT = process.cwd()
const DOC_PATH = 'docs/ai-video-broll-gen-10q-iap-oslogin-access-fix-result.md'
const NEXT_PROMPT_PATH = 'docs/implementation-prompts/prompt-ai-video-broll-gen-10r-no-gpu-iap-ssh-canary.md'
const SPEC_PATH = 'src/backend/mock/mock-ai-video-broll-gen-10q-iap-oslogin-access-fix-result.ts'
const SMOKE_PATH = 'server/smoke/ai-video-broll-gen-10q-iap-oslogin-access-fix-result-smoke.ts'
const PACKAGE_SCRIPT = 'smoke:ai-video-broll-gen-10q-iap-oslogin-access-fix-result'
const DECISION =
  'ai_video_broll_gen_10q_iap_oslogin_access_fix_read_only_inconclusive_non_gpu_canary_required'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'broll10qResult'): string[] {
  const findings: string[] = []

  if (typeof value === 'string') {
    const patterns: Array<[string, RegExp]> = [
      ['concrete public URL', /\bhttps?:\/\/(?!127\.0\.0\.1|localhost)\S+/i],
      ['run.app URL', /\brun\.app\b/i],
      ['access token value', /\bya29\.[A-Za-z0-9._-]+/i],
      ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
      ['jwt value', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/i],
      ['service account email', /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.gserviceaccount\.com/i],
      ['plain email value', /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i],
      ['service-role value', /\bservice[_-]?role\s*[:=]\s*['"][^'"]+/i],
      ['api key value', /\bapi[_-]?key\s*[:=]\s*['"][^'"]+/i],
      ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
      ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|Signature=|Key-Pair-Id=|Policy=)/i],
      ['public storage URL', /\bstorage\.googleapis\.com\b/i],
      ['raw worker prompt field', /\braw[_-]?worker[_-]?prompt\b/i],
      ['private key value', /\bprivate[_-]?key\s*[:=]\s*['"][^'"]+/i],
      ['ssh public key material', /\bssh-(rsa|ed25519)\s+[A-Za-z0-9+/=]{40,}/i],
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

for (const file of [
  DOC_PATH,
  NEXT_PROMPT_PATH,
  SPEC_PATH,
  SMOKE_PATH,
  'docs/ai-video-broll-gen-10p-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast2-a-result.md',
  'docs/ai-video-broll-gen-10i-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-c-result.md',
  'docs/ai-video-broll-generation-gcp-proof-identity-setup-result.md',
  'package.json',
]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/ai-video-broll-gen-10q-iap-oslogin-access-fix-result-smoke.ts',
  'package smoke script mismatch',
)

const doc = read(DOC_PATH)
const prompt = read(NEXT_PROMPT_PATH)
for (const required of [
  DECISION,
  'read-only diagnosis',
  'Project OS Login | not enabled in project metadata',
  'Project metadata contains local `gcloud` SSH public key | `false`',
  'Policy Troubleshooter: `compute.projects.setCommonInstanceMetadata` | granted',
  'Policy Troubleshooter: `compute.instances.setMetadata` | granted',
  'Policy Troubleshooter: proof service account act-as | granted',
  'Root cause confirmed: `false`',
  'non-GPU IAP SSH canary',
  'computeVmCreated=false',
  'gpuVmCreated=false',
  'nonGpuCanaryCreated=false',
  'modelInferenceRun=false',
  'generatedLocalFixturePassedClaimed=false',
  AI_VIDEO_BROLL_GEN_10R_NO_GPU_IAP_SSH_CANARY_PROMPT,
]) {
  assert.equal(doc.includes(required), true, `10Q result doc missing ${required}`)
}

for (const required of [
  AI_VIDEO_BROLL_GEN_10R_NO_GPU_IAP_SSH_CANARY_PROMPT,
  'at most one prompt-scoped non-GPU VM',
  'no public IP',
  'same proof service account',
  'same IAP target tag',
  'same image family used by 10P',
  'Do not create GPU VMs.',
  'Do not add OS Login keys unless a later explicit prompt approves it.',
  'generatedLocalFixturePassedClaimed=false',
]) {
  assert.equal(prompt.includes(required), true, `10R prompt missing ${required}`)
}

const result = AI_VIDEO_BROLL_GEN_10Q_IAP_OSLOGIN_ACCESS_FIX_RESULT
assert.equal(result.decision, DECISION)
assert.equal(result.mode, 'ai_video_broll_gen_10q_iap_oslogin_access_fix_result')
assert.equal(result.workstream, 'AI_VIDEO_BROLL_GENERATION')
assert.equal(result.toolId, 'ai_video_broll_generation_wan')
assert.equal(result.checkedAtUtc, '2026-07-02T22:00:33Z')
assert.equal(result.claimsDryRunPassed, false)
assert.equal(result.claimsGeneratedLocalFixturePassed, false)
assert.equal(result.readOnlyDiagnosis.projectMatches, true)
assert.equal(result.readOnlyDiagnosis.accessTokenRefreshPassed, true)
assert.equal(result.readOnlyDiagnosis.activeAccountValueStored, false)
assert.equal(result.readOnlyDiagnosis.proofServiceAccountReadable, true)
assert.equal(result.readOnlyDiagnosis.proofServiceAccountDisabled, false)
assert.equal(result.readOnlyDiagnosis.proofServiceAccountValueStored, false)
assert.equal(result.readOnlyDiagnosis.iapFirewallRulePresent, true)
assert.equal(result.readOnlyDiagnosis.iapFirewallSourceRange, '35.235.240.0/20')
assert.equal(result.readOnlyDiagnosis.iapFirewallTargetTagPresent, true)
assert.equal(result.readOnlyDiagnosis.iapFirewallTcp22Allowed, true)
assert.equal(result.readOnlyDiagnosis.projectOsLoginEnabled, false)
assert.equal(result.readOnlyDiagnosis.projectBlockProjectSshKeysEnabled, false)
assert.deepEqual(result.readOnlyDiagnosis.projectMetadataKeys, ['ssh-keys'])
assert.equal(result.readOnlyDiagnosis.projectSshKeyLineCount, 1)
assert.equal(result.readOnlyDiagnosis.localGcloudSshPublicKeyExists, true)
assert.equal(result.readOnlyDiagnosis.localGcloudSshPublicKeyStored, false)
assert.equal(result.readOnlyDiagnosis.projectMetadataContainsLocalGcloudPublicKey, false)
assert.equal(result.readOnlyDiagnosis.osLoginProfileRead, true)
assert.equal(result.readOnlyDiagnosis.osLoginProfileHasPosixAccount, true)
assert.equal(result.readOnlyDiagnosis.osLoginSshKeysListed, true)
assert.equal(result.readOnlyDiagnosis.osLoginSshKeyCount, 1)
assert.equal(
  result.readOnlyDiagnosis.policyTroubleshooter.computeProjectsSetCommonInstanceMetadata,
  'ALLOW_ACCESS_STATE_GRANTED',
)
assert.equal(result.readOnlyDiagnosis.policyTroubleshooter.computeInstancesSetMetadata, 'ALLOW_ACCESS_STATE_GRANTED')
assert.equal(result.readOnlyDiagnosis.policyTroubleshooter.computeInstancesCreate, 'ALLOW_ACCESS_STATE_GRANTED')
assert.equal(
  result.readOnlyDiagnosis.policyTroubleshooter.iamServiceAccountsActAsOnProofServiceAccount,
  'ALLOW_ACCESS_STATE_GRANTED',
)
assert.equal(result.comparison.tenI.iapSshOpened, true)
assert.equal(result.comparison.tenP.iapSshOpened, false)
assert.equal(result.comparison.tenP.iapSshBlocker, 'permission_denied_publickey')
assert.equal(result.comparison.tenQ.computeVmCreated, false)
assert.equal(result.comparison.tenQ.rootCauseConfirmed, false)
assert.equal(result.comparison.tenQ.nonGpuCanaryRequired, true)
assert.equal(result.failureAnalysis.capacityAndNoPublicIpCreatePathPassedIn10P, true)
assert.equal(result.failureAnalysis.iapTransportLikelyNotPrimaryBlocker, true)
assert.equal(result.failureAnalysis.sshIdentityPathStillUnproven, true)
assert.equal(result.failureAnalysis.rootCauseConfirmed, false)
assert.equal(
  result.failureAnalysis.preventionBeforeNextGpuCreate.includes(
    'run_non_gpu_no_public_ip_iap_ssh_canary_with_same_image_tag_and_service_account',
  ),
  true,
)
assert.equal(result.nextPrompt, AI_VIDEO_BROLL_GEN_10R_NO_GPU_IAP_SSH_CANARY_PROMPT)

for (const [flag, value] of Object.entries(result.runtimeSideEffects)) {
  if (
    [
      'gcpReadOnlyCommandsExecuted',
      'policyTroubleshooterReadOnlyChecksExecuted',
      'osLoginProfileRead',
      'osLoginKeysListed',
    ].includes(flag)
  ) {
    assert.equal(value, true, `${flag} should record the read-only diagnostic`)
  } else {
    assert.equal(value, false, `${flag} must remain false`)
  }
}

const forbiddenFindings = scanForbiddenValues({ doc, prompt, result })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: result.decision,
      projectOsLoginEnabled: result.readOnlyDiagnosis.projectOsLoginEnabled,
      projectMetadataContainsLocalGcloudPublicKey:
        result.readOnlyDiagnosis.projectMetadataContainsLocalGcloudPublicKey,
      rootCauseConfirmed: result.failureAnalysis.rootCauseConfirmed,
      nonGpuCanaryRequired: result.comparison.tenQ.nonGpuCanaryRequired,
      computeVmCreated: result.runtimeSideEffects.computeVmCreated,
      gpuVmCreated: result.runtimeSideEffects.gpuVmCreated,
      modelInferenceRun: result.runtimeSideEffects.modelInferenceRun,
      generatedAssetsCreated: result.runtimeSideEffects.generatedAssetsCreated,
      generatedLocalFixturePassedClaimed: result.runtimeSideEffects.generatedLocalFixturePassedClaimed,
      nextPrompt: result.nextPrompt,
    },
    null,
    2,
  ),
)
