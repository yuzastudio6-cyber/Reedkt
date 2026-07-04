import {
  AI_VIDEO_BROLL_GEN_11G_BOUNDED_INFERENCE_PROOF_RUNNER,
  AI_VIDEO_BROLL_GEN_11H_INFERENCE_PROOF_EXECUTE_PROMPT,
} from '../../src/backend/mock/mock-ai-video-broll-gen-11g-bounded-inference-proof-runner'

type RunnerStatus = 'planned' | 'blocked'

type RunnerSummary = {
  ok: boolean
  mode: string
  status: RunnerStatus
  decision: string
  runnerScript: string
  confirmationEnv: string
  confirmationEnvRequiredValue: 'true'
  executionRequiresSeparatePrompt: true
  blockers: string[]
  selectedGpu: 'nvidia_l4'
  machineType: 'g2-standard-4'
  targetRegion: 'northamerica-northeast2'
  targetZone: 'northamerica-northeast2-a'
  proofVmName: 'reeditpro-ai-broll-wan-l4-proof'
  approvedFixturePromptId: string
  rawChatPromptAllowed: false
  generatedVideoCreated: false
  generatedAssetsCreated: false
  generatedLocalFixturePassedClaimed: false
  runtimeSideEffects: typeof AI_VIDEO_BROLL_GEN_11G_BOUNDED_INFERENCE_PROOF_RUNNER.runtimeSideEffectsWhenStatic
  nextPrompt: typeof AI_VIDEO_BROLL_GEN_11H_INFERENCE_PROOF_EXECUTE_PROMPT
}

const SPEC = AI_VIDEO_BROLL_GEN_11G_BOUNDED_INFERENCE_PROOF_RUNNER
const CONFIRM_ENV = 'REEDITPRO_CONFIRM_BROLL_11G_INFERENCE_PROOF'

function main() {
  const execute = process.argv.includes('--execute')

  if (!execute) {
    print(baseSummary('ai_video_broll_gen_11g_bounded_inference_proof_runner_static_guard', 'planned'))
    return
  }

  const summary = baseSummary(
    'ai_video_broll_gen_11g_bounded_inference_proof_runner_execution_prompt_required',
    'blocked',
  )
  summary.blockers = [
    `separate_execution_prompt_required:${AI_VIDEO_BROLL_GEN_11H_INFERENCE_PROOF_EXECUTE_PROMPT}`,
    `confirmation_env_reserved_for_future_prompt:${SPEC.confirmationEnv}=true`,
  ]
  print(summary)
}

function baseSummary(mode: string, status: RunnerStatus): RunnerSummary {
  return {
    ok: false,
    mode,
    status,
    decision: SPEC.decision,
    runnerScript: SPEC.runnerScript,
    confirmationEnv: CONFIRM_ENV,
    confirmationEnvRequiredValue: SPEC.confirmationEnvRequiredValue,
    executionRequiresSeparatePrompt: true,
    blockers: [],
    selectedGpu: SPEC.selectedGpu,
    machineType: SPEC.machineType,
    targetRegion: SPEC.targetRegion,
    targetZone: SPEC.targetZone,
    proofVmName: SPEC.proofVmName,
    approvedFixturePromptId: SPEC.approvedFixture.fixturePromptId,
    rawChatPromptAllowed: false,
    generatedVideoCreated: false,
    generatedAssetsCreated: false,
    generatedLocalFixturePassedClaimed: false,
    runtimeSideEffects: SPEC.runtimeSideEffectsWhenStatic,
    nextPrompt: AI_VIDEO_BROLL_GEN_11H_INFERENCE_PROOF_EXECUTE_PROMPT,
  }
}

function print(value: unknown) {
  console.log(JSON.stringify(value, null, 2))
}

main()
