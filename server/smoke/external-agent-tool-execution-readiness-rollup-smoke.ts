import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP } from '../../src/backend/mock/mock-external-agent-tool-execution-readiness-rollup'

const ROOT = process.cwd()
const DOC_PATH = 'docs/external-agent-tool-execution-readiness-rollup.md'
const SPEC_PATH = 'src/backend/mock/mock-external-agent-tool-execution-readiness-rollup.ts'
const SMOKE_PATH = 'server/smoke/external-agent-tool-execution-readiness-rollup-smoke.ts'
const PACKAGE_SCRIPT = 'smoke:external-agent-tool-execution-readiness-rollup'
const QWEN_NEXT_PROMPT =
  'EXTERNAL-AGENT-TOOL-EXECUTION-READY-QWEN: Qwen controlled approved-fixture private inference is ready for the explicit external-agent gate; keep beta/production blocked'
const BROLL_NEXT_PROMPT =
  'AI-VIDEO-BROLL-GEN-9K-NO-IDLE-L4-PROOF-PROMPT: prepare bounded no-idle L4 proof execution with mandatory cleanup, no VM/no inference in the planning prompt'
const BROLL_STOCKOUT_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-9L-STOCKOUT-FIX: choose approved alternate no-idle L4 proof zone or retry plan, no VM/no inference'
const BROLL_9M_NEXT_PROMPT =
  'AI-VIDEO-BROLL-GEN-9M-NO-IDLE-L4-PROOF-EXECUTE-US-CENTRAL1-A: run bounded no-idle L4 VM lifecycle proof in us-central1-a with mandatory cleanup, no model inference'
const BROLL_9N_NEXT_PROMPT =
  'AI-VIDEO-BROLL-GEN-9N-NO-IDLE-L4-PROOF-EXECUTE-US-CENTRAL1-C: run bounded no-idle L4 VM lifecycle proof in us-central1-c with mandatory cleanup, no model inference'
const BROLL_9O_NEXT_PROMPT =
  'AI-VIDEO-BROLL-GEN-9O-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation and mandatory cleanup, no model inference'
const BROLL_9O_RETRY_NEXT_PROMPT =
  'AI-VIDEO-BROLL-GEN-9O-RETRY-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF: retry bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-central1-c and mandatory cleanup, no model inference'
const BROLL_9P_STOCKOUT_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-9P-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose approved alternate no-idle L4 transfer proof zone or capacity strategy, no VM/no inference'
const BROLL_9Q_US_WEST1_A_TRANSFER_PROMPT =
  'AI-VIDEO-BROLL-GEN-9Q-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-WEST1-A: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-west1-a and mandatory cleanup, no model inference'
const BROLL_9R_STOCKOUT_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-9R-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof target or capacity strategy after us-west1-a stockout, no VM/no inference'
const BROLL_9S_US_WEST1_B_TRANSFER_PROMPT =
  'AI-VIDEO-BROLL-GEN-9S-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-WEST1-B: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-west1-b and mandatory cleanup, no model inference'
const BROLL_9T_STOCKOUT_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-9T-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof target or capacity strategy after us-west1-b stockout, no VM/no inference'
const BROLL_9U_US_WEST1_C_TRANSFER_PROMPT =
  'AI-VIDEO-BROLL-GEN-9U-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-WEST1-C: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-west1-c and mandatory cleanup, no model inference'
const BROLL_9V_STOCKOUT_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-9V-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof capacity strategy after us-west1-c stockout, no VM/no inference'
const BROLL_9W_US_EAST4_A_TRANSFER_PROMPT =
  'AI-VIDEO-BROLL-GEN-9W-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-EAST4-A: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-east4-a and mandatory cleanup, no model inference'
const BROLL_9X_STOCKOUT_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-9X-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof capacity strategy after us-east4-a stockout, no VM/no inference'
const BROLL_9Z_STOCKOUT_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-9Z-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof capacity strategy after us-east4-c stockout, no VM/no inference'
const BROLL_10A_US_EAST1_B_TRANSFER_PROMPT =
  'AI-VIDEO-BROLL-GEN-10A-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-EAST1-B: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-east1-b and mandatory cleanup, no model inference'
const BROLL_10B_STOCKOUT_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-10B-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof capacity strategy after us-east1-b stockout, no VM/no inference'
const BROLL_10C_US_EAST1_C_TRANSFER_PROMPT =
  'AI-VIDEO-BROLL-GEN-10C-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-EAST1-C: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-east1-c and mandatory cleanup, no model inference'
const BROLL_10D_STOCKOUT_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-10D-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof capacity strategy after us-east1-c stockout, no VM/no inference'
const BROLL_10E_US_EAST1_D_TRANSFER_PROMPT =
  'AI-VIDEO-BROLL-GEN-10E-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-EAST1-D: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-east1-d and mandatory cleanup, no model inference'
const BROLL_10F_STOCKOUT_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-10F-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof capacity strategy after us-east1-d stockout, no VM/no inference'
const BROLL_10G_US_WEST4_A_TRANSFER_PROMPT =
  'AI-VIDEO-BROLL-GEN-10G-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-WEST4-A: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-west4-a and mandatory cleanup, no model inference'
const BROLL_10H_STOCKOUT_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-10H-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof capacity strategy after us-west4-a stockout, no VM/no inference'
const BROLL_10J_US_WEST4_C_PAYLOAD_INSTALL_PROMPT =
  'AI-VIDEO-BROLL-GEN-10J-NO-IDLE-L4-IAP-WHEELHOUSE-PAYLOAD-INSTALL-PROOF-US-WEST4-C: run bounded no-idle L4 VM lifecycle with private wheelhouse payload transfer and offline dependency install readiness validation in us-west4-c with mandatory cleanup, no model import/no inference'
const BROLL_10K_PAYLOAD_INSTALL_STOCKOUT_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-10K-PAYLOAD-INSTALL-STOCKOUT-FIX: choose next approved no-idle L4 payload/install-readiness proof capacity strategy after us-west4-c stockout, no VM/no inference'
const BROLL_10L_NORTHAMERICA_NORTHEAST1_B_PAYLOAD_INSTALL_PROMPT =
  'AI-VIDEO-BROLL-GEN-10L-NO-IDLE-L4-IAP-WHEELHOUSE-PAYLOAD-INSTALL-PROOF-NORTHAMERICA-NORTHEAST1-B: run bounded no-idle L4 VM lifecycle with private wheelhouse payload transfer and offline dependency install readiness validation in northamerica-northeast1-b with mandatory cleanup, no model import/no inference'
const BROLL_10M_PAYLOAD_INSTALL_CONFIG_AVAILABILITY_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-10M-PAYLOAD-INSTALL-CONFIG-AVAILABILITY-FIX: choose next approved no-idle L4 payload/install-readiness proof strategy after northamerica-northeast1-b configuration availability failure, no VM/no inference'
const BROLL_10N_NORTHAMERICA_NORTHEAST1_C_PAYLOAD_INSTALL_PROMPT =
  'AI-VIDEO-BROLL-GEN-10N-NO-IDLE-L4-IAP-WHEELHOUSE-PAYLOAD-INSTALL-PROOF-NORTHAMERICA-NORTHEAST1-C: run bounded no-idle L4 VM lifecycle with private wheelhouse payload transfer and offline dependency install readiness validation in northamerica-northeast1-c with mandatory cleanup, no model import/no inference'
const BROLL_10O_PAYLOAD_INSTALL_RESOURCE_AVAILABILITY_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-10O-PAYLOAD-INSTALL-RESOURCE-AVAILABILITY-FIX: choose next approved no-idle payload/install-readiness strategy after northamerica-northeast1-c resource availability failure, no VM/no inference'
const BROLL_10P_NORTHAMERICA_NORTHEAST2_A_PAYLOAD_INSTALL_PROMPT =
  'AI-VIDEO-BROLL-GEN-10P-NO-IDLE-L4-IAP-WHEELHOUSE-PAYLOAD-INSTALL-PROOF-NORTHAMERICA-NORTHEAST2-A: run bounded no-idle L4 VM lifecycle with private wheelhouse payload transfer and offline dependency install readiness validation in northamerica-northeast2-a with mandatory cleanup, no model import/no inference'
const BROLL_10Q_IAP_OSLOGIN_ACCESS_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-10Q-IAP-OSLOGIN-ACCESS-FIX: diagnose and plan no-public-IP IAP/OS Login access after northeast2-a VM create success and publickey failure, no GPU VM/no inference'
const BROLL_10R_NO_GPU_IAP_SSH_CANARY_PROMPT =
  'AI-VIDEO-BROLL-GEN-10R-NO-GPU-IAP-SSH-CANARY: run bounded no-public-IP non-GPU IAP SSH canary with the same image, target tag, proof service account, and mandatory cleanup; no GPU/no model/no inference'
const BROLL_10R_FIX_IAP_SSH_CANARY_BOUNDED_RUNNER_PROMPT =
  'AI-VIDEO-BROLL-GEN-10R-FIX-IAP-SSH-CANARY-BOUNDED-RUNNER: fix bounded no-GPU IAP SSH canary runner timeout and durable cleanup-summary capture, no GPU/no model/no inference'
const BROLL_10S_NO_GPU_IAP_SSH_CANARY_BOUNDED_RUNNER_EXECUTE_PROMPT =
  'AI-VIDEO-BROLL-GEN-10S-NO-GPU-IAP-SSH-CANARY-BOUNDED-RUNNER-EXECUTE: run the fixed bounded no-GPU IAP SSH canary with hard timeouts, durable summaries, and mandatory cleanup; no GPU/no model/no inference'
const BROLL_10T_IAP_SSH_FLAG_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-10T-IAP-SSH-FLAG-FIX: remove mutually exclusive IAP SSH flags from the bounded no-GPU canary runner, no VM/no model/no inference'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'rollup'): string[] {
  const findings: string[] = []

  if (typeof value === 'string') {
    const patterns: Array<[string, RegExp]> = [
      ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
      ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|Signature=|Key-Pair-Id=|Policy=)/i],
      ['service-role value', /\bservice[_-]?role\s*[:=]\s*['"][^'"]+/i],
      ['api key value', /\bapi[_-]?key\s*[:=]\s*['"][^'"]+/i],
      ['raw worker prompt field', /\braw[_-]?worker[_-]?prompt\b/i],
      ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
      ['public storage URL', /\bstorage\.googleapis\.com\b/i],
      ['Supabase project URL', /https:\/\/[a-z0-9]{20}\.supabase\.co/i],
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

for (const file of [DOC_PATH, SPEC_PATH, SMOKE_PATH]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/external-agent-tool-execution-readiness-rollup-smoke.ts',
  'package.json script mismatch',
)

const doc = read(DOC_PATH)
for (const required of [
  'external_agent_tool_execution_readiness_qwen_ready_for_explicit_gate_broll_10t_iap_ssh_flag_fix_required',
  '`qwen2_5_vl_7b_instruct`',
  '`ai_video_broll_generation_wan`',
  '`sound_music_audio`',
  '`supabase_local_fixture_harness`',
  'ready for explicit external-agent gate',
  '9N lifecycle proof created one no-public-IP L4 VM',
  'bounded 9O IAP wheelhouse transfer validation',
  '9P stockout-fix selecting `us-west1-a`',
  '9Q `us-west1-a` transfer proof blocked by resource pool exhaustion before VM creation',
  '9R stockout-fix selecting `us-west1-b`',
  '9S `us-west1-b` transfer proof blocked by resource pool exhaustion before VM creation',
  '9T stockout-fix selecting `us-west1-c`',
  '9U `us-west1-c` transfer proof blocked by resource pool exhaustion before VM creation',
  '9V no-VM strategy selecting `us-east4-a`',
  '9W `us-east4-a` transfer proof blocked by resource pool exhaustion before VM creation',
  '9Y `us-east4-c` transfer proof blocked by resource pool exhaustion before VM creation',
  '9Z no-VM strategy selecting `us-east1-b`',
  '10A `us-east1-b` transfer proof blocked by resource pool exhaustion before VM creation',
  '10B no-VM strategy selecting `us-east1-c`',
  '10D no-VM strategy selecting `us-east1-d`',
  '10E `us-east1-d` transfer proof blocked by resource pool exhaustion before VM creation',
  '10F no-VM strategy selecting `us-west4-a`',
  '10G `us-west4-a` transfer proof blocked by resource pool exhaustion before VM creation',
  'Qwen selected GPU: `nvidia_l4`',
  'Qwen Cloud Run minimum instances: `0`',
  'B-roll selected proof GPU: `nvidia_l4`',
  'B-roll no-idle GPU lifecycle is required',
  'B-roll structured no-idle lifecycle gate',
  'proof VM `reeditpro-ai-broll-wan-l4-proof`',
  'machine `g2-standard-4`',
  'minimum `GPUS_ALL_REGIONS` quota `1`',
  '## Safe Agent Commands',
  '58DW bounded retry result remains recorded as schema-invalid runtime evidence',
  '58DW-FIX strict structured-output source fix is recorded and locally validated',
  '58DW-RETRY-2 bounded private fixture retry passed with fail-closed restoration',
  '58DX private inference result review accepts the sanitized metadata result',
  '58DY wrapper result records a successful canonical external-agent wrapper run',
  '58DZ wrapper rerun result records the latest successful canonical wrapper run',
  'External agents should start with `npm run external-agent-tool-action-plan`',
  '`npm run external-agent-tool-execution-gate` as a fail-closed static gate',
  'a static gate is not runtime permission',
  'The preferred next safe command is `npm run external-agent-tool-next-command`',
  'combines the static gate and live read-only blocker probes',
  '`npm run external-agent-tool-next-command` emits `qwenExternalAgentExecutionCommand`',
  '`npm run external-agent-tool-execute-qwen -- --execute --json`',
  'the wrapper repeats the live next-command check immediately before delegating',
  'The shared rollup, readiness check, execution gate, live blocker preflight, live next-command selector, and static action plan include `manualBlockerActions`',
  '`npm run smoke:external-agent-tool-surface-consistency` compares those surfaces',
  '`runInsideCodex=false`',
  '`mutatesRuntime=false`',
  'historical B-roll `GPUS_ALL_REGIONS` quota request is now superseded',
  'distinguishes `staticExplicitToolGatePrepared` from `staticExecutionGateAllowed`',
  'prepared static evidence can be true while runtime execution remains false',
  'includes `executionGateToolSummaries`',
  'B-roll no-idle lifecycle gate',
  'When `staticGatePlanningOnly=true` or `staticGateDoesNotAuthorizeRuntime=true`',
  '`chosenNextCommandAlreadyExecutedInThisRun=true`',
  '`codexRunnableNextCommandNow`',
  '`nextCodexCommandAfterManualAction`',
  '`npm run external-agent-tool-execution-gate` provides a fail-closed static go/no-go report',
  '`npm run external-agent-tool-next-command` provides a read-only live next-command decision',
  'docs/external-agent-tool-live-next-command-result.md',
  '`npm run external-agent-tool-execute-qwen` is the canonical guarded Qwen wrapper',
  '`REEDITPRO_CONFIRM_EXTERNAL_AGENT_QWEN_EXECUTION=true`',
  'docs/qwen2-5-vl-7b-58dy-external-agent-wrapper-execution-result.md',
  'docs/qwen2-5-vl-7b-58ea-external-agent-wrapper-execution-result.md',
  'docs/qwen2-5-vl-7b-58dz-external-agent-wrapper-rerun-result.md',
  'parsed delegated npm output',
  '`npm run external-agent-tool-blockers:preflight` provides a read-only live blocker preflight',
  '`npm run external-agent-gcloud-session:diagnostic`',
  'read-only local gcloud session/config diagnostic',
  '`npm run ai-video-broll-wan-fast-cache-readiness:check` provides a stat-only Wan private cache preflight',
  '`npm run ai-video-broll-wan-gpu-global-quota:verify` provides the B-roll-specific read-only quota verifier',
  '`npm run external-agent-tool-execute-broll-wan`',
  '`REEDITPRO_CONFIRM_EXTERNAL_AGENT_BROLL_WAN_PROOF=true`',
  '`broll_10t_iap_ssh_flag_fix_required`',
  'docs/ai-video-broll-gen-10s-no-gpu-iap-ssh-canary-bounded-runner-result.md',
  'server/smoke/ai-video-broll-gen-10s-no-gpu-iap-ssh-canary-bounded-runner-result-smoke.ts',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10t-iap-ssh-flag-fix.md',
  'docs/ai-video-broll-wan-external-agent-wrapper-blocked-result.md',
  '`npm run external-agent-tool-execute-sound`',
  '`REEDITPRO_CONFIRM_EXTERNAL_AGENT_SOUND_EVIDENCE_REVIEW=true`',
  '`sound_metadata_only_runtime_execution_not_accepted`',
  'docs/sound-music-audio-external-agent-wrapper-blocked-result.md',
  '`npm run external-agent-tool-execute-supabase-harness`',
  '`REEDITPRO_CONFIRM_EXTERNAL_AGENT_SUPABASE_HARNESS_EVIDENCE_REVIEW=true`',
  '`supabase_local_harness_supporting_evidence_only`',
  'docs/supabase-local-harness-external-agent-wrapper-blocked-result.md',
  'B-roll external-agent execution must not leave an idle GPU running',
  QWEN_NEXT_PROMPT,
  BROLL_NEXT_PROMPT,
  BROLL_STOCKOUT_FIX_PROMPT,
  BROLL_9M_NEXT_PROMPT,
  BROLL_9N_NEXT_PROMPT,
  BROLL_9O_NEXT_PROMPT,
  BROLL_9O_RETRY_NEXT_PROMPT,
  BROLL_9P_STOCKOUT_FIX_PROMPT,
  BROLL_9Q_US_WEST1_A_TRANSFER_PROMPT,
  BROLL_9R_STOCKOUT_FIX_PROMPT,
  BROLL_9S_US_WEST1_B_TRANSFER_PROMPT,
  BROLL_9T_STOCKOUT_FIX_PROMPT,
  BROLL_9U_US_WEST1_C_TRANSFER_PROMPT,
  BROLL_9V_STOCKOUT_FIX_PROMPT,
  BROLL_9W_US_EAST4_A_TRANSFER_PROMPT,
  BROLL_9X_STOCKOUT_FIX_PROMPT,
  BROLL_9Z_STOCKOUT_FIX_PROMPT,
  BROLL_10A_US_EAST1_B_TRANSFER_PROMPT,
  BROLL_10B_STOCKOUT_FIX_PROMPT,
  BROLL_10C_US_EAST1_C_TRANSFER_PROMPT,
  BROLL_10D_STOCKOUT_FIX_PROMPT,
  BROLL_10E_US_EAST1_D_TRANSFER_PROMPT,
  BROLL_10F_STOCKOUT_FIX_PROMPT,
  BROLL_10G_US_WEST4_A_TRANSFER_PROMPT,
  BROLL_10H_STOCKOUT_FIX_PROMPT,
  BROLL_10J_US_WEST4_C_PAYLOAD_INSTALL_PROMPT,
  BROLL_10K_PAYLOAD_INSTALL_STOCKOUT_FIX_PROMPT,
  BROLL_10L_NORTHAMERICA_NORTHEAST1_B_PAYLOAD_INSTALL_PROMPT,
  BROLL_10M_PAYLOAD_INSTALL_CONFIG_AVAILABILITY_FIX_PROMPT,
  BROLL_10N_NORTHAMERICA_NORTHEAST1_C_PAYLOAD_INSTALL_PROMPT,
  BROLL_10O_PAYLOAD_INSTALL_RESOURCE_AVAILABILITY_FIX_PROMPT,
  BROLL_10P_NORTHAMERICA_NORTHEAST2_A_PAYLOAD_INSTALL_PROMPT,
  BROLL_10Q_IAP_OSLOGIN_ACCESS_FIX_PROMPT,
  BROLL_10R_NO_GPU_IAP_SSH_CANARY_PROMPT,
  BROLL_10R_FIX_IAP_SSH_CANARY_BOUNDED_RUNNER_PROMPT,
  BROLL_10S_NO_GPU_IAP_SSH_CANARY_BOUNDED_RUNNER_EXECUTE_PROMPT,
  'docs/ai-video-broll-gen-10r-fix-iap-ssh-canary-bounded-runner-result.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10s-no-gpu-iap-ssh-canary-bounded-runner-execute.md',
  'server/cli/ai-video-broll-gen-10r-iap-ssh-canary-bounded-runner.ts',
  'server/smoke/ai-video-broll-gen-10r-fix-iap-ssh-canary-bounded-runner-smoke.ts',
  'docs/ai-video-broll-gen-10k-payload-install-stockout-fix-result.md',
  'docs/ai-video-broll-gen-10l-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast1-b-result.md',
  'docs/ai-video-broll-gen-10m-payload-install-config-availability-fix-result.md',
  'docs/ai-video-broll-gen-10n-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast1-c-result.md',
  'docs/ai-video-broll-gen-10o-payload-install-resource-availability-fix-result.md',
  'docs/ai-video-broll-gen-10j-no-idle-l4-iap-wheelhouse-payload-install-proof-us-west4-c-result.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10k-payload-install-stockout-fix.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10l-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast1-b.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10m-payload-install-config-availability-fix.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10n-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast1-c.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10o-payload-install-resource-availability-fix.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10p-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast2-a.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10q-iap-oslogin-access-fix.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10r-no-gpu-iap-ssh-canary.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10r-fix-iap-ssh-canary-bounded-runner.md',
  'docs/ai-video-broll-gen-10q-iap-oslogin-access-fix-result.md',
  'src/backend/mock/mock-ai-video-broll-gen-10k-payload-install-stockout-fix-result.ts',
  'src/backend/mock/mock-ai-video-broll-gen-10l-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast1-b-result.ts',
  'src/backend/mock/mock-ai-video-broll-gen-10m-payload-install-config-availability-fix-result.ts',
  'src/backend/mock/mock-ai-video-broll-gen-10n-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast1-c-result.ts',
  'src/backend/mock/mock-ai-video-broll-gen-10o-payload-install-resource-availability-fix-result.ts',
  'src/backend/mock/mock-ai-video-broll-gen-10j-no-idle-l4-iap-wheelhouse-payload-install-proof-us-west4-c-result.ts',
  'server/smoke/ai-video-broll-gen-10k-payload-install-stockout-fix-result-smoke.ts',
  'server/smoke/ai-video-broll-gen-10l-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast1-b-result-smoke.ts',
  'server/smoke/ai-video-broll-gen-10m-payload-install-config-availability-fix-result-smoke.ts',
  'server/smoke/ai-video-broll-gen-10n-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast1-c-result-smoke.ts',
  'server/smoke/ai-video-broll-gen-10o-payload-install-resource-availability-fix-result-smoke.ts',
  'server/smoke/ai-video-broll-gen-10j-no-idle-l4-iap-wheelhouse-payload-install-proof-us-west4-c-result-smoke.ts',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-9k-no-idle-l4-proof.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-9m-no-idle-l4-proof-execute-us-central1-a.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-9n-no-idle-l4-proof-execute-us-central1-c.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-9o-no-idle-l4-iap-wheelhouse-transfer-proof.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-9o-retry-no-idle-l4-iap-wheelhouse-transfer-proof.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-9p-iap-wheelhouse-transfer-stockout-fix.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-9q-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-a.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-9r-iap-wheelhouse-transfer-stockout-fix.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-9s-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-b.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-9t-iap-wheelhouse-transfer-stockout-fix.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-9u-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-c.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-9v-iap-wheelhouse-transfer-stockout-fix.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-9w-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-a.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-9x-iap-wheelhouse-transfer-stockout-fix.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-9y-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-c.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-9z-iap-wheelhouse-transfer-stockout-fix.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10a-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-b.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10b-iap-wheelhouse-transfer-stockout-fix.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10c-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-c.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10d-iap-wheelhouse-transfer-stockout-fix.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10e-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-d.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10f-iap-wheelhouse-transfer-stockout-fix.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10g-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-a.md',
  'docs/implementation-prompts/prompt-ai-video-broll-gen-10h-iap-wheelhouse-transfer-stockout-fix.md',
  'src/backend/mock/mock-ai-video-broll-gen-9k-no-idle-l4-proof-prompt.ts',
  'docs/ai-video-broll-gen-9n-no-idle-l4-lifecycle-proof-result.md',
  'docs/ai-video-broll-gen-9q-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-a-result.md',
  'docs/ai-video-broll-gen-9r-iap-wheelhouse-transfer-stockout-fix-result.md',
  'docs/ai-video-broll-gen-9s-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-b-result.md',
  'docs/ai-video-broll-gen-9t-iap-wheelhouse-transfer-stockout-fix-result.md',
  'docs/ai-video-broll-gen-9u-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-c-result.md',
  'docs/ai-video-broll-gen-9v-iap-wheelhouse-transfer-stockout-fix-result.md',
  'docs/ai-video-broll-gen-9w-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-a-result.md',
  'docs/ai-video-broll-gen-9x-iap-wheelhouse-transfer-stockout-fix-result.md',
  'docs/ai-video-broll-gen-10a-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-b-result.md',
  'docs/ai-video-broll-gen-10b-iap-wheelhouse-transfer-stockout-fix-result.md',
  'docs/ai-video-broll-gen-10c-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-c-result.md',
  'docs/ai-video-broll-gen-10d-iap-wheelhouse-transfer-stockout-fix-result.md',
  'docs/ai-video-broll-gen-10e-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-d-result.md',
  'docs/ai-video-broll-gen-10f-iap-wheelhouse-transfer-stockout-fix-result.md',
  'docs/ai-video-broll-gen-10g-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-a-result.md',
  'docs/ai-video-broll-gen-10h-iap-wheelhouse-transfer-stockout-fix-result.md',
  'docs/ai-video-broll-gen-9y-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-c-result.md',
  'docs/ai-video-broll-gen-9p-iap-wheelhouse-transfer-stockout-fix-result.md',
  'docs/ai-video-broll-gen-9o-no-idle-l4-iap-wheelhouse-transfer-proof-result.md',
  'docs/ai-video-broll-gen-9o-retry-no-idle-l4-iap-wheelhouse-transfer-proof-result.md',
  'docs/ai-video-broll-gen-9m-no-idle-l4-lifecycle-proof-result.md',
  'docs/ai-video-broll-gen-9l-stockout-fix-result.md',
  'docs/ai-video-broll-gen-9l-no-idle-l4-lifecycle-proof-result.md',
  'src/backend/mock/mock-ai-video-broll-gen-9n-no-idle-l4-lifecycle-proof-result.ts',
  'src/backend/mock/mock-ai-video-broll-gen-9q-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-a-result.ts',
  'src/backend/mock/mock-ai-video-broll-gen-9r-iap-wheelhouse-transfer-stockout-fix-result.ts',
  'src/backend/mock/mock-ai-video-broll-gen-9s-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-b-result.ts',
  'src/backend/mock/mock-ai-video-broll-gen-9t-iap-wheelhouse-transfer-stockout-fix-result.ts',
  'src/backend/mock/mock-ai-video-broll-gen-9u-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-c-result.ts',
  'src/backend/mock/mock-ai-video-broll-gen-9v-iap-wheelhouse-transfer-stockout-fix-result.ts',
  'src/backend/mock/mock-ai-video-broll-gen-9w-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-a-result.ts',
  'src/backend/mock/mock-ai-video-broll-gen-9x-iap-wheelhouse-transfer-stockout-fix-result.ts',
  'src/backend/mock/mock-ai-video-broll-gen-9y-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-c-result.ts',
  'src/backend/mock/mock-ai-video-broll-gen-10b-iap-wheelhouse-transfer-stockout-fix-result.ts',
  'src/backend/mock/mock-ai-video-broll-gen-10a-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-b-result.ts',
  'src/backend/mock/mock-ai-video-broll-gen-10c-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-c-result.ts',
  'src/backend/mock/mock-ai-video-broll-gen-10d-iap-wheelhouse-transfer-stockout-fix-result.ts',
  'src/backend/mock/mock-ai-video-broll-gen-10e-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-d-result.ts',
  'src/backend/mock/mock-ai-video-broll-gen-10f-iap-wheelhouse-transfer-stockout-fix-result.ts',
  'src/backend/mock/mock-ai-video-broll-gen-10g-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-a-result.ts',
  'src/backend/mock/mock-ai-video-broll-gen-10h-iap-wheelhouse-transfer-stockout-fix-result.ts',
  'src/backend/mock/mock-ai-video-broll-gen-9p-iap-wheelhouse-transfer-stockout-fix-result.ts',
  'src/backend/mock/mock-ai-video-broll-gen-9o-no-idle-l4-iap-wheelhouse-transfer-proof-result.ts',
  'src/backend/mock/mock-ai-video-broll-gen-9o-retry-no-idle-l4-iap-wheelhouse-transfer-proof-result.ts',
  'src/backend/mock/mock-ai-video-broll-gen-9m-no-idle-l4-lifecycle-proof-result.ts',
  'src/backend/mock/mock-ai-video-broll-gen-9l-stockout-fix-result.ts',
  'src/backend/mock/mock-ai-video-broll-gen-9l-no-idle-l4-lifecycle-proof-result.ts',
  'server/smoke/ai-video-broll-gen-9o-no-idle-l4-iap-wheelhouse-transfer-proof-result-smoke.ts',
  'server/smoke/ai-video-broll-gen-9q-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-a-result-smoke.ts',
  'server/smoke/ai-video-broll-gen-9r-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts',
  'server/smoke/ai-video-broll-gen-9s-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-b-result-smoke.ts',
  'server/smoke/ai-video-broll-gen-9t-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts',
  'server/smoke/ai-video-broll-gen-9u-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-c-result-smoke.ts',
  'server/smoke/ai-video-broll-gen-9w-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-a-result-smoke.ts',
  'server/smoke/ai-video-broll-gen-9x-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts',
  'server/smoke/ai-video-broll-gen-9y-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-c-result-smoke.ts',
  'server/smoke/ai-video-broll-gen-9z-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts',
  'server/smoke/ai-video-broll-gen-10a-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-b-result-smoke.ts',
  'server/smoke/ai-video-broll-gen-10b-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts',
  'server/smoke/ai-video-broll-gen-10c-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-c-result-smoke.ts',
  'server/smoke/ai-video-broll-gen-10d-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts',
  'server/smoke/ai-video-broll-gen-10e-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-d-result-smoke.ts',
  'server/smoke/ai-video-broll-gen-10f-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts',
  'server/smoke/ai-video-broll-gen-10g-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-a-result-smoke.ts',
  'server/smoke/ai-video-broll-gen-10h-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts',
  'server/smoke/ai-video-broll-gen-10q-iap-oslogin-access-fix-result-smoke.ts',
  'server/smoke/ai-video-broll-gen-9p-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts',
  'server/smoke/ai-video-broll-gen-9o-retry-no-idle-l4-iap-wheelhouse-transfer-proof-result-smoke.ts',
]) {
  assert.equal(doc.includes(required), true, `Rollup doc missing ${required}`)
}

const rollup = EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP
assert.equal(
  rollup.decision,
  'external_agent_tool_execution_readiness_qwen_ready_for_explicit_gate_broll_10t_iap_ssh_flag_fix_required',
)
assert.equal(rollup.mode, 'external_agent_tool_execution_readiness_rollup_only')
assert.equal(rollup.paidProductionInScope, false)
assert.equal(rollup.dryRunPassedClaimed, false)
assert.equal(rollup.generatedLocalFixturePassedClaimed, false)
assert.equal(rollup.sourceRules.approvedSnapshotRequired, true)
assert.equal(rollup.sourceRules.rawChatExecutionAllowed, false)
assert.equal(rollup.sourceRules.aiVideoOwnsFinalCanvas, false)
assert.equal(rollup.sourceRules.remotionOwnsFinalComposition, true)
assert.equal(rollup.recommendedNextPrompt, BROLL_10T_IAP_SSH_FLAG_FIX_PROMPT)
assert.equal(rollup.safeNextCommands.length, 12)
assert.equal(
  rollup.safeNextCommands.some((command) => command.command === 'npm run external-agent-tool-action-plan'),
  true,
)
assert.equal(
  rollup.safeNextCommands.some((command) => command.command === 'npm run external-agent-tool-readiness:check'),
  true,
)
assert.equal(
  rollup.safeNextCommands.some((command) => command.command === 'npm run smoke:external-agent-tool-surface-consistency'),
  true,
)
assert.equal(
  rollup.safeNextCommands.some((command) => command.command === 'npm run external-agent-tool-execution-gate'),
  true,
)
assert.equal(
  rollup.safeNextCommands.some((command) => command.command === 'npm run external-agent-tool-next-command'),
  true,
)
assert.equal(
  rollup.safeNextCommands.some((command) => command.command === 'npm run external-agent-tool-blockers:preflight'),
  true,
)
assert.equal(
  rollup.safeNextCommands.some((command) => command.command === 'npm run external-agent-gcloud-session:diagnostic'),
  true,
)
assert.equal(
  rollup.safeNextCommands.some(
    (command) => command.command === 'npm run ai-video-broll-wan-fast-cache-readiness:check',
  ),
  true,
)
assert.equal(
  rollup.safeNextCommands.some(
    (command) => command.command === 'npm run ai-video-broll-wan-gpu-global-quota:verify',
  ),
  true,
)
assert.equal(
  rollup.safeNextCommands.some((command) => command.command === 'npm run external-agent-tool-execute-broll-wan'),
  true,
)
assert.equal(
  rollup.safeNextCommands.some((command) => command.command === 'npm run external-agent-tool-execute-sound'),
  true,
)
assert.equal(
  rollup.safeNextCommands.some(
    (command) => command.command === 'npm run external-agent-tool-execute-supabase-harness',
  ),
  true,
)
for (const command of rollup.safeNextCommands) {
  assert.equal(command.mutatesRuntime, false, `${command.id} must not mutate runtime`)
  assert.equal(command.runsModel, false, `${command.id} must not run models`)
  assert.equal(command.createsAssets, false, `${command.id} must not create assets`)
}

for (const [flag, value] of Object.entries(rollup.runtimeSideEffects)) {
  assert.equal(value, false, `Runtime side-effect flag must be false: ${flag}`)
}

const toolsById = new Map(rollup.tools.map((tool) => [tool.toolId, tool]))
for (const requiredTool of [
  'qwen2_5_vl_7b_instruct',
  'ai_video_broll_generation_wan',
  'sound_music_audio',
  'supabase_local_fixture_harness',
]) {
  assert.equal(toolsById.has(requiredTool), true, `Missing tool readiness row: ${requiredTool}`)
}

const qwen = toolsById.get('qwen2_5_vl_7b_instruct')
assert.equal(qwen?.status, 'ready_for_explicit_tool_gate')
assert.equal(qwen?.selectedGpu, 'nvidia_l4')
assert.equal(qwen?.scaleToZeroRequired, true)
assert.equal(qwen?.readyForExternalAgentExecutionNow, true)
assert.equal(qwen?.readyForBoundedRetryAfterBlockerClears, true)
assert.equal(qwen?.primaryBlocker, 'none_explicit_gate_ready_live_preflight_required')
assert.equal(qwen?.nextAction, QWEN_NEXT_PROMPT)
assert.equal(qwen?.manualBlockerActions?.length, 0)
assert.equal(qwen?.evidence.includes('docs/qwen2-5-vl-7b-58dx-private-inference-result-review.md'), true)
assert.equal(
  qwen?.evidence.includes('docs/qwen2-5-vl-7b-58ea-external-agent-wrapper-execution-result.md'),
  true,
)
assert.equal(
  qwen?.evidence.includes('docs/qwen2-5-vl-7b-58dz-external-agent-wrapper-rerun-result.md'),
  true,
)
assert.equal(qwen?.evidence.includes('docs/external-agent-tool-live-next-command-result.md'), true)
assert.equal(
  qwen?.evidence.includes('docs/qwen2-5-vl-7b-58dy-external-agent-wrapper-execution-result.md'),
  true,
)
assert.equal(
  qwen?.evidence.includes('src/backend/mock/mock-qwen2-5-vl-58dx-private-inference-result-review.ts'),
  true,
)
assert.equal(
  qwen?.evidence.includes('src/backend/mock/mock-qwen2-5-vl-58ea-external-agent-wrapper-execution-result.ts'),
  true,
)
assert.equal(
  qwen?.evidence.includes('src/backend/mock/mock-qwen2-5-vl-58dz-external-agent-wrapper-rerun-result.ts'),
  true,
)
assert.equal(qwen?.evidence.includes('src/backend/mock/mock-external-agent-tool-live-next-command-result.ts'), true)
assert.equal(
  qwen?.evidence.includes('src/backend/mock/mock-qwen2-5-vl-58dy-external-agent-wrapper-execution-result.ts'),
  true,
)
assert.equal(
  qwen?.evidence.includes('server/smoke/qwen2-5-vl-58dy-external-agent-wrapper-execution-result-smoke.ts'),
  true,
)
assert.equal(
  qwen?.evidence.includes('server/smoke/qwen2-5-vl-58ea-external-agent-wrapper-execution-result-smoke.ts'),
  true,
)
assert.equal(
  qwen?.evidence.includes('server/smoke/qwen2-5-vl-58dz-external-agent-wrapper-rerun-result-smoke.ts'),
  true,
)
assert.equal(qwen?.evidence.includes('server/smoke/external-agent-tool-live-next-command-result-smoke.ts'), true)
assert.equal(
  qwen?.evidence.includes('server/smoke/qwen2-5-vl-58dx-private-inference-result-review-smoke.ts'),
  true,
)
assert.equal(qwen?.evidence.includes('docs/qwen2-5-vl-7b-58dw-retry-2-result.md'), true)
assert.equal(qwen?.evidence.includes('src/backend/mock/mock-qwen2-5-vl-58dw-retry-2-result.ts'), true)
assert.equal(qwen?.evidence.includes('server/smoke/qwen2-5-vl-58dw-retry-2-result-smoke.ts'), true)
assert.equal(qwen?.evidence.includes('docs/qwen2-5-vl-7b-58dw-structured-output-fix.md'), true)
assert.equal(
  qwen?.evidence.includes('src/backend/mock/mock-qwen2-5-vl-58dw-structured-output-fix.ts'),
  true,
)
assert.equal(qwen?.evidence.includes('server/smoke/qwen2-5-vl-58dw-structured-output-fix-smoke.ts'), true)
assert.equal(
  qwen?.evidence.includes(
    'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-bounded-retry-prompt-result.md',
  ),
  true,
)
assert.equal(
  qwen?.evidence.includes(
    'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-gate-alignment.md',
  ),
  true,
)
assert.equal(
  qwen?.evidence.includes(
    'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-attempt-result.md',
  ),
  true,
)
assert.equal(
  qwen?.evidence.includes(
    'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-bounded-retry-prompt-result.ts',
  ),
  true,
)
assert.equal(
  qwen?.evidence.includes(
    'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-gate-alignment.ts',
  ),
  true,
)
assert.equal(
  qwen?.evidence.includes(
    'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-attempt-approval.md',
  ),
  true,
)
assert.equal(
  qwen?.evidence.includes(
    'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-gate.md',
  ),
  true,
)
assert.equal(
  qwen?.evidence.includes(
    'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-plan.md',
  ),
  true,
)
assert.equal(
  qwen?.evidence.includes(
    'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-gate.ts',
  ),
  true,
)
assert.equal(
  qwen?.evidence.includes(
    'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-attempt-result.ts',
  ),
  true,
)
assert.equal(
  qwen?.evidence.includes(
    'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-attempt-approval.ts',
  ),
  true,
)
assert.equal(
  qwen?.evidence.includes(
    'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-plan.ts',
  ),
  true,
)
assert.equal(
  qwen?.evidence.includes(
    'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-bounded-retry-prompt-result-smoke.ts',
  ),
  true,
)
assert.equal(
  qwen?.evidence.includes(
    'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-gate-alignment-smoke.ts',
  ),
  true,
)
assert.equal(
  qwen?.evidence.includes(
    'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-gate-smoke.ts',
  ),
  true,
)
assert.equal(
  qwen?.evidence.includes(
    'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-attempt-result-smoke.ts',
  ),
  true,
)
assert.equal(
  qwen?.evidence.includes(
    'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-attempt-approval-smoke.ts',
  ),
  true,
)
assert.equal(
  qwen?.evidence.includes(
    'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-plan-smoke.ts',
  ),
  true,
)
assert.equal(qwen?.evidence.includes('server/cli/external-agent-tool-blocker-preflight.ts'), true)
assert.equal(qwen?.evidence.includes('server/smoke/external-agent-tool-blocker-preflight-smoke.ts'), true)
assert.equal(qwen?.evidence.includes('server/cli/external-agent-gcloud-session-diagnostic.ts'), true)
assert.equal(qwen?.evidence.includes('server/smoke/external-agent-gcloud-session-diagnostic-smoke.ts'), true)

const broll = toolsById.get('ai_video_broll_generation_wan')
assert.equal(broll?.status, 'auth_verified_runtime_blocked')
assert.equal(broll?.selectedGpu, 'nvidia_l4')
assert.equal(broll?.scaleToZeroRequired, true)
assert.equal(broll?.readyForExternalAgentExecutionNow, false)
assert.equal(broll?.readyForBoundedRetryAfterBlockerClears, false)
assert.equal(
  broll?.primaryBlocker,
  'broll_10t_iap_ssh_flag_fix_required',
)
assert.equal(
  broll?.evidence.includes('docs/ai-video-broll-gen-9q-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-a-result.md'),
  true,
)
assert.equal(
  broll?.evidence.includes('docs/ai-video-broll-gen-9r-iap-wheelhouse-transfer-stockout-fix-result.md'),
  true,
)
assert.equal(
  broll?.evidence.includes('docs/ai-video-broll-gen-9s-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-b-result.md'),
  true,
)
assert.equal(
  broll?.evidence.includes('docs/ai-video-broll-gen-9t-iap-wheelhouse-transfer-stockout-fix-result.md'),
  true,
)
assert.equal(
  broll?.evidence.includes('docs/ai-video-broll-gen-9u-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-c-result.md'),
  true,
)
assert.equal(
  broll?.evidence.includes('docs/ai-video-broll-gen-9w-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-a-result.md'),
  true,
)
assert.equal(
  broll?.evidence.includes('docs/ai-video-broll-gen-9x-iap-wheelhouse-transfer-stockout-fix-result.md'),
  true,
)
assert.equal(
  broll?.evidence.includes('docs/ai-video-broll-gen-9p-iap-wheelhouse-transfer-stockout-fix-result.md'),
  true,
)
assert.equal(
  broll?.evidence.includes('docs/ai-video-broll-gen-9o-retry-no-idle-l4-iap-wheelhouse-transfer-proof-result.md'),
  true,
)
assert.equal(
  broll?.evidence.includes('docs/ai-video-broll-gen-9o-no-idle-l4-iap-wheelhouse-transfer-proof-result.md'),
  true,
)
assert.equal(
  broll?.evidence.includes('docs/ai-video-broll-gen-9n-no-idle-l4-lifecycle-proof-result.md'),
  true,
)
assert.equal(
  broll?.evidence.includes('docs/ai-video-broll-gen-9m-no-idle-l4-lifecycle-proof-result.md'),
  true,
)
assert.equal(
  broll?.evidence.includes('docs/ai-video-broll-gen-9l-stockout-fix-result.md'),
  true,
)
assert.equal(
  broll?.evidence.includes('docs/ai-video-broll-gen-9l-no-idle-l4-lifecycle-proof-result.md'),
  true,
)
assert.equal(
  broll?.evidence.includes(
    'docs/implementation-prompts/prompt-ai-video-broll-gen-9n-no-idle-l4-proof-execute-us-central1-c.md',
  ),
  true,
)
assert.equal(
  broll?.evidence.includes(
    'docs/implementation-prompts/prompt-ai-video-broll-gen-9o-no-idle-l4-iap-wheelhouse-transfer-proof.md',
  ),
  true,
)
assert.equal(
  broll?.evidence.includes(
    'docs/implementation-prompts/prompt-ai-video-broll-gen-9o-retry-no-idle-l4-iap-wheelhouse-transfer-proof.md',
  ),
  true,
)
assert.equal(
  broll?.evidence.includes(
    'docs/implementation-prompts/prompt-ai-video-broll-gen-9p-iap-wheelhouse-transfer-stockout-fix.md',
  ),
  true,
)
assert.equal(
  broll?.evidence.includes(
    'docs/implementation-prompts/prompt-ai-video-broll-gen-9q-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-a.md',
  ),
  true,
)
assert.equal(
  broll?.evidence.includes('docs/implementation-prompts/prompt-ai-video-broll-gen-9r-iap-wheelhouse-transfer-stockout-fix.md'),
  true,
)
assert.equal(
  broll?.evidence.includes('docs/implementation-prompts/prompt-ai-video-broll-gen-9t-iap-wheelhouse-transfer-stockout-fix.md'),
  true,
)
assert.equal(
  broll?.evidence.includes(
    'docs/implementation-prompts/prompt-ai-video-broll-gen-9u-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-c.md',
  ),
  true,
)
assert.equal(
  broll?.evidence.includes('docs/implementation-prompts/prompt-ai-video-broll-gen-9v-iap-wheelhouse-transfer-stockout-fix.md'),
  true,
)
assert.equal(
  broll?.evidence.includes(
    'docs/implementation-prompts/prompt-ai-video-broll-gen-9w-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-a.md',
  ),
  true,
)
assert.equal(
  broll?.evidence.includes('docs/implementation-prompts/prompt-ai-video-broll-gen-9x-iap-wheelhouse-transfer-stockout-fix.md'),
  true,
)
assert.equal(
  broll?.evidence.includes(
    'docs/implementation-prompts/prompt-ai-video-broll-gen-9y-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-c.md',
  ),
  true,
)
assert.equal(
  broll?.evidence.includes('docs/implementation-prompts/prompt-ai-video-broll-gen-9z-iap-wheelhouse-transfer-stockout-fix.md'),
  true,
)
assert.equal(
  broll?.evidence.includes(
    'docs/implementation-prompts/prompt-ai-video-broll-gen-9s-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-b.md',
  ),
  true,
)
assert.equal(
  broll?.evidence.includes(
    'docs/implementation-prompts/prompt-ai-video-broll-gen-9m-no-idle-l4-proof-execute-us-central1-a.md',
  ),
  true,
)
assert.equal(
  broll?.evidence.includes('docs/ai-video-broll-wan-gpu-global-quota-verify-result.md'),
  true,
)
assert.equal(
  broll?.evidence.includes('docs/ai-video-broll-wan-external-agent-wrapper-blocked-result.md'),
  true,
)
assert.equal(
  broll?.evidence.includes('docs/ai-video-broll-generation-runtime-gpu-architecture-plan.md'),
  true,
)
assert.equal(
  broll?.evidence.includes('docs/ai-video-broll-generation-gcp-private-vm-create-plan-3-result.md'),
  true,
)
assert.equal(
  broll?.evidence.includes('src/backend/mock/mock-ai-video-broll-wan-external-agent-wrapper-blocked-result.ts'),
  true,
)
assert.equal(
  broll?.evidence.includes('server/cli/ai-video-broll-wan-fast-cache-readiness-check.ts'),
  true,
)
assert.equal(
  broll?.evidence.includes('src/backend/mock/mock-ai-video-broll-wan-gpu-global-quota-verify.ts'),
  true,
)
assert.equal(
  broll?.evidence.includes('src/backend/mock/mock-ai-video-broll-wan-gpu-global-quota-verify-result.ts'),
  true,
)
assert.equal(
  broll?.evidence.includes('src/backend/mock/mock-ai-video-broll-gen-9k-no-idle-l4-proof-prompt.ts'),
  true,
)
assert.equal(
  broll?.evidence.includes('src/backend/mock/mock-ai-video-broll-gen-9n-no-idle-l4-lifecycle-proof-result.ts'),
  true,
)
assert.equal(
  broll?.evidence.includes(
    'src/backend/mock/mock-ai-video-broll-gen-9q-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-a-result.ts',
  ),
  true,
)
assert.equal(
  broll?.evidence.includes('src/backend/mock/mock-ai-video-broll-gen-9r-iap-wheelhouse-transfer-stockout-fix-result.ts'),
  true,
)
assert.equal(
  broll?.evidence.includes(
    'src/backend/mock/mock-ai-video-broll-gen-9s-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-b-result.ts',
  ),
  true,
)
assert.equal(
  broll?.evidence.includes('src/backend/mock/mock-ai-video-broll-gen-9t-iap-wheelhouse-transfer-stockout-fix-result.ts'),
  true,
)
assert.equal(
  broll?.evidence.includes(
    'src/backend/mock/mock-ai-video-broll-gen-9u-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-c-result.ts',
  ),
  true,
)
assert.equal(
  broll?.evidence.includes(
    'src/backend/mock/mock-ai-video-broll-gen-9w-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-a-result.ts',
  ),
  true,
)
assert.equal(
  broll?.evidence.includes('src/backend/mock/mock-ai-video-broll-gen-9x-iap-wheelhouse-transfer-stockout-fix-result.ts'),
  true,
)
assert.equal(
  broll?.evidence.includes(
    'src/backend/mock/mock-ai-video-broll-gen-9y-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-c-result.ts',
  ),
  true,
)
assert.equal(
  broll?.evidence.includes(
    'src/backend/mock/mock-ai-video-broll-gen-9o-no-idle-l4-iap-wheelhouse-transfer-proof-result.ts',
  ),
  true,
)
assert.equal(
  broll?.evidence.includes('src/backend/mock/mock-ai-video-broll-gen-9p-iap-wheelhouse-transfer-stockout-fix-result.ts'),
  true,
)
assert.equal(
  broll?.evidence.includes(
    'src/backend/mock/mock-ai-video-broll-gen-9o-retry-no-idle-l4-iap-wheelhouse-transfer-proof-result.ts',
  ),
  true,
)
assert.equal(
  broll?.evidence.includes('src/backend/mock/mock-ai-video-broll-gen-9m-no-idle-l4-lifecycle-proof-result.ts'),
  true,
)
assert.equal(
  broll?.evidence.includes('src/backend/mock/mock-ai-video-broll-gen-9l-stockout-fix-result.ts'),
  true,
)
assert.equal(
  broll?.evidence.includes('src/backend/mock/mock-ai-video-broll-gen-9l-no-idle-l4-lifecycle-proof-result.ts'),
  true,
)
assert.equal(
  broll?.evidence.includes('server/cli/ai-video-broll-wan-gpu-global-quota-verify.ts'),
  true,
)
assert.equal(
  broll?.evidence.includes('server/smoke/ai-video-broll-wan-external-agent-wrapper-blocked-result-smoke.ts'),
  true,
)
assert.equal(
  broll?.evidence.includes('server/smoke/ai-video-broll-wan-fast-cache-readiness-check-smoke.ts'),
  true,
)
assert.equal(
  broll?.evidence.includes('server/smoke/ai-video-broll-wan-gpu-global-quota-verify-smoke.ts'),
  true,
)
assert.equal(
  broll?.evidence.includes('server/smoke/ai-video-broll-gen-9k-no-idle-l4-proof-prompt-smoke.ts'),
  true,
)
assert.equal(
  broll?.evidence.includes('server/smoke/ai-video-broll-gen-9n-no-idle-l4-lifecycle-proof-result-smoke.ts'),
  true,
)
assert.equal(
  broll?.evidence.includes(
    'server/smoke/ai-video-broll-gen-9q-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-a-result-smoke.ts',
  ),
  true,
)
assert.equal(
  broll?.evidence.includes('server/smoke/ai-video-broll-gen-9r-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts'),
  true,
)
assert.equal(
  broll?.evidence.includes(
    'server/smoke/ai-video-broll-gen-9s-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-b-result-smoke.ts',
  ),
  true,
)
assert.equal(
  broll?.evidence.includes('server/smoke/ai-video-broll-gen-9t-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts'),
  true,
)
assert.equal(
  broll?.evidence.includes(
    'server/smoke/ai-video-broll-gen-9u-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-c-result-smoke.ts',
  ),
  true,
)
assert.equal(
  broll?.evidence.includes(
    'server/smoke/ai-video-broll-gen-9w-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-a-result-smoke.ts',
  ),
  true,
)
assert.equal(
  broll?.evidence.includes('server/smoke/ai-video-broll-gen-9x-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts'),
  true,
)
assert.equal(
  broll?.evidence.includes(
    'server/smoke/ai-video-broll-gen-9y-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-c-result-smoke.ts',
  ),
  true,
)
assert.equal(
  broll?.evidence.includes('server/smoke/ai-video-broll-gen-9v-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts'),
  true,
)
assert.equal(
  broll?.evidence.includes(
    'server/smoke/ai-video-broll-gen-9o-no-idle-l4-iap-wheelhouse-transfer-proof-result-smoke.ts',
  ),
  true,
)
assert.equal(
  broll?.evidence.includes('server/smoke/ai-video-broll-gen-9p-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts'),
  true,
)
assert.equal(
  broll?.evidence.includes(
    'server/smoke/ai-video-broll-gen-9o-retry-no-idle-l4-iap-wheelhouse-transfer-proof-result-smoke.ts',
  ),
  true,
)
assert.equal(
  broll?.evidence.includes('server/smoke/ai-video-broll-gen-9m-no-idle-l4-lifecycle-proof-result-smoke.ts'),
  true,
)
assert.equal(
  broll?.evidence.includes('server/smoke/ai-video-broll-gen-9l-stockout-fix-result-smoke.ts'),
  true,
)
assert.equal(
  broll?.evidence.includes('server/smoke/ai-video-broll-gen-9l-no-idle-l4-lifecycle-proof-result-smoke.ts'),
  true,
)
assert.equal(
  broll?.evidence.includes('docs/implementation-prompts/prompt-ai-video-broll-gen-9k-no-idle-l4-proof.md'),
  true,
)
assert.equal(broll?.evidence.includes('docs/ai-video-broll-gen-10o-payload-install-resource-availability-fix-result.md'), true)
assert.equal(
  broll?.evidence.includes(
    'docs/implementation-prompts/prompt-ai-video-broll-gen-10p-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast2-a.md',
  ),
  true,
)
assert.equal(
  broll?.evidence.includes('docs/implementation-prompts/prompt-ai-video-broll-gen-10q-iap-oslogin-access-fix.md'),
  true,
)
assert.equal(
  broll?.evidence.includes('docs/implementation-prompts/prompt-ai-video-broll-gen-10r-no-gpu-iap-ssh-canary.md'),
  true,
)
assert.equal(
  broll?.evidence.includes(
    'docs/implementation-prompts/prompt-ai-video-broll-gen-10r-fix-iap-ssh-canary-bounded-runner.md',
  ),
  true,
)
assert.equal(broll?.evidence.includes('docs/ai-video-broll-gen-10q-iap-oslogin-access-fix-result.md'), true)
assert.equal(broll?.evidence.includes('docs/ai-video-broll-gen-10r-no-gpu-iap-ssh-canary-result.md'), true)
assert.equal(
  broll?.evidence.includes(
    'docs/ai-video-broll-gen-10p-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast2-a-result.md',
  ),
  true,
)
assert.equal(
  broll?.evidence.includes('src/backend/mock/mock-ai-video-broll-gen-10o-payload-install-resource-availability-fix-result.ts'),
  true,
)
assert.equal(
  broll?.evidence.includes(
    'src/backend/mock/mock-ai-video-broll-gen-10p-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast2-a-result.ts',
  ),
  true,
)
assert.equal(
  broll?.evidence.includes('src/backend/mock/mock-ai-video-broll-gen-10q-iap-oslogin-access-fix-result.ts'),
  true,
)
assert.equal(
  broll?.evidence.includes('src/backend/mock/mock-ai-video-broll-gen-10r-no-gpu-iap-ssh-canary-result.ts'),
  true,
)
assert.equal(
  broll?.evidence.includes('server/smoke/ai-video-broll-gen-10o-payload-install-resource-availability-fix-result-smoke.ts'),
  true,
)
assert.equal(
  broll?.evidence.includes(
    'server/smoke/ai-video-broll-gen-10p-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast2-a-result-smoke.ts',
  ),
  true,
)
assert.equal(broll?.evidence.includes('server/smoke/ai-video-broll-gen-10q-iap-oslogin-access-fix-result-smoke.ts'), true)
assert.equal(broll?.evidence.includes('server/smoke/ai-video-broll-gen-10r-no-gpu-iap-ssh-canary-result-smoke.ts'), true)
assert.equal(broll?.evidence.includes('docs/ai-video-broll-gen-10r-fix-iap-ssh-canary-bounded-runner-result.md'), true)
assert.equal(
  broll?.evidence.includes(
    'docs/implementation-prompts/prompt-ai-video-broll-gen-10s-no-gpu-iap-ssh-canary-bounded-runner-execute.md',
  ),
  true,
)
assert.equal(
  broll?.evidence.includes('docs/ai-video-broll-gen-10s-no-gpu-iap-ssh-canary-bounded-runner-result.md'),
  true,
)
assert.equal(
  broll?.evidence.includes(
    'src/backend/mock/mock-ai-video-broll-gen-10s-no-gpu-iap-ssh-canary-bounded-runner-result.ts',
  ),
  true,
)
assert.equal(
  broll?.evidence.includes(
    'server/smoke/ai-video-broll-gen-10s-no-gpu-iap-ssh-canary-bounded-runner-result-smoke.ts',
  ),
  true,
)
assert.equal(
  broll?.evidence.includes('docs/implementation-prompts/prompt-ai-video-broll-gen-10t-iap-ssh-flag-fix.md'),
  true,
)
assert.equal(broll?.evidence.includes('server/cli/ai-video-broll-gen-10r-iap-ssh-canary-bounded-runner.ts'), true)
assert.equal(
  broll?.evidence.includes('server/smoke/ai-video-broll-gen-10r-fix-iap-ssh-canary-bounded-runner-smoke.ts'),
  true,
)
assert.equal(broll?.nextAction, BROLL_10T_IAP_SSH_FLAG_FIX_PROMPT)
assert.equal(broll?.evidence.includes('server/cli/external-agent-tool-blocker-preflight.ts'), true)
assert.equal(broll?.evidence.includes('server/smoke/external-agent-tool-blocker-preflight-smoke.ts'), true)
assert.equal(broll?.manualBlockerActions?.length, 0)
assert.equal(broll?.noIdleLifecycleGate?.proofVmName, 'reeditpro-ai-broll-wan-l4-proof')
assert.equal(broll?.noIdleLifecycleGate?.selectedGpu, 'nvidia_l4')
assert.equal(broll?.noIdleLifecycleGate?.machineType, 'g2-standard-4')
assert.equal(broll?.noIdleLifecycleGate?.targetRegion, 'northamerica-northeast2')
assert.equal(broll?.noIdleLifecycleGate?.targetZone, 'northamerica-northeast2-a')
assert.equal(broll?.noIdleLifecycleGate?.minimumGlobalGpusAllRegionsQuota, 1)
assert.equal(broll?.noIdleLifecycleGate?.minimumRegionalL4Quota, 1)
assert.equal(broll?.noIdleLifecycleGate?.noPublicIpRequired, true)
assert.equal(broll?.noIdleLifecycleGate?.externalIpAllowed, false)
assert.equal(broll?.noIdleLifecycleGate?.bootDiskAutoDeleteRequired, true)
assert.equal(broll?.noIdleLifecycleGate?.preExistingResourceCheckRequired, true)
assert.equal(broll?.noIdleLifecycleGate?.deleteOnlyResourcesCreatedByPrompt, true)
assert.equal(broll?.noIdleLifecycleGate?.cleanupVerificationRequired, true)
assert.equal(broll?.noIdleLifecycleGate?.idleGpuAllowed, false)
assert.equal(broll?.noIdleLifecycleGate?.vmCreateAllowedNow, false)
assert.equal(broll?.noIdleLifecycleGate?.modelInferenceAllowedNow, false)
assert.equal(broll?.noIdleLifecycleGate?.runtimePromptRequiredBeforeVmCreate, true)
assert.equal(
  broll?.noIdleLifecycleGate?.cacheReadinessCommand,
  'npm run ai-video-broll-wan-fast-cache-readiness:check',
)
assert.equal(
  broll?.noIdleLifecycleGate?.quotaVerificationCommand,
  'npm run ai-video-broll-wan-gpu-global-quota:verify',
)
assert.equal(
  broll?.noIdleLifecycleGate?.nextActionAfterQuotaClears,
  BROLL_10T_IAP_SSH_FLAG_FIX_PROMPT,
)

const sound = toolsById.get('sound_music_audio')
assert.equal(sound?.status, 'metadata_only')
assert.equal(
  sound?.currentStage,
  'mock_dry_run_local_fixture_handoff_evidence_external_agent_wrapper_blocked_result_recorded',
)
assert.equal(sound?.readyForExternalAgentExecutionNow, false)
assert.equal(sound?.readyForBoundedRetryAfterBlockerClears, false)
assert.equal(sound?.primaryBlocker, 'real_provider_worker_storage_track_qa_billing_export_handoffs_required')
assert.equal(sound?.evidence.includes('docs/sound-music-audio-open-source-tool-final-cross-chat-handoff-summary.md'), true)
assert.equal(sound?.evidence.includes('docs/sound-music-audio-open-source-tool-final-archive-handoff-summary.md'), true)
assert.equal(sound?.evidence.includes('docs/sound-oss-tools-15-post-archive-handoff-review.md'), true)
assert.equal(
  sound?.evidence.includes('docs/sound-runtime-media-gate-2f-controlled-synthetic-route-source-validation-result.md'),
  true,
)
assert.equal(sound?.evidence.includes('docs/sound-music-audio-external-agent-wrapper-blocked-result.md'), true)
assert.equal(
  sound?.evidence.includes('src/backend/mock/mock-sound-music-audio-external-agent-wrapper-blocked-result.ts'),
  true,
)
assert.equal(
  sound?.evidence.includes('server/smoke/sound-music-audio-external-agent-wrapper-blocked-result-smoke.ts'),
  true,
)
assert.equal(sound?.evidence.includes('server/cli/external-agent-tool-execute-sound.ts'), true)
assert.equal(sound?.evidence.includes('server/smoke/external-agent-tool-execute-sound-smoke.ts'), true)

const supabaseHarness = toolsById.get('supabase_local_fixture_harness')
assert.equal(supabaseHarness?.status, 'supporting_evidence_only')
assert.equal(
  supabaseHarness?.currentStage,
  'supporting_local_fixture_harness_evidence_external_agent_wrapper_blocked_result_recorded',
)
assert.equal(supabaseHarness?.readyForExternalAgentExecutionNow, false)
assert.equal(supabaseHarness?.readyForBoundedRetryAfterBlockerClears, false)
assert.equal(supabaseHarness?.primaryBlocker, 'not_a_model_or_media_execution_lane_on_this_branch')
assert.equal(supabaseHarness?.evidence.includes('supabase/config.toml'), true)
assert.equal(
  supabaseHarness?.evidence.includes(
    'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-config-verify-report.md',
  ),
  true,
)
assert.equal(
  supabaseHarness?.evidence.includes(
    'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-15-result.md',
  ),
  true,
)
assert.equal(
  supabaseHarness?.evidence.includes('docs/supabase-local-harness-external-agent-wrapper-blocked-result.md'),
  true,
)
assert.equal(
  supabaseHarness?.evidence.includes(
    'src/backend/mock/mock-supabase-local-harness-external-agent-wrapper-blocked-result.ts',
  ),
  true,
)
assert.equal(
  supabaseHarness?.evidence.includes(
    'server/smoke/supabase-local-harness-external-agent-wrapper-blocked-result-smoke.ts',
  ),
  true,
)
assert.equal(
  supabaseHarness?.evidence.includes('server/cli/external-agent-tool-execute-supabase-harness.ts'),
  true,
)
assert.equal(
  supabaseHarness?.evidence.includes('server/smoke/external-agent-tool-execute-supabase-harness-smoke.ts'),
  true,
)

for (const tool of rollup.tools) {
  if (tool.toolId === 'qwen2_5_vl_7b_instruct') {
    assert.equal(tool.readyForExternalAgentExecutionNow, true, `${tool.toolId} must be ready for the explicit gate`)
  } else {
    assert.equal(
      tool.readyForExternalAgentExecutionNow,
      false,
      `${tool.toolId} must not be execution-ready on the Qwen retry-2 branch`,
    )
  }
  assert.equal(tool.evidence.length > 0, true, `${tool.toolId} needs evidence references`)
}

const forbiddenFindings = scanForbiddenValues(rollup)
assert.equal(forbiddenFindings.length, 0, `Forbidden values in rollup data: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: rollup.decision,
      toolCount: rollup.tools.length,
      qwenBlocker: qwen?.primaryBlocker,
      brollBlocker: broll?.primaryBlocker,
      paidProductionInScope: rollup.paidProductionInScope,
      generatedLocalFixturePassedClaimed: rollup.generatedLocalFixturePassedClaimed,
      runtimeSideEffectsAllFalse: Object.values(rollup.runtimeSideEffects).every((value) => value === false),
      recommendedNextPrompt: rollup.recommendedNextPrompt,
    },
    null,
    2,
  ),
)
