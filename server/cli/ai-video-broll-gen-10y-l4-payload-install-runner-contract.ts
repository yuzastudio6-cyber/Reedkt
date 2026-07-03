export type AiVideoBrollGen10yGcloudCommandSpec = {
  id: string
  command: 'gcloud'
  args: string[]
  futureOnly: true
  executedByThisPrompt: false
  parsesRawStdoutBeforeSummary: boolean
  machineStateDecisionInput: 'rawStdout' | 'exitCodeOnly'
  stdoutSummaryLogOnly: true
  purpose: string
}

export type AiVideoBrollGen10yCleanupTriggerState = {
  computeVmCreateAttempted: boolean
  computeVmCreated: boolean
  createCommandExitCode: number | null
}

export type AiVideoBrollGen10yRunnerContract = {
  mode: 'ai_video_broll_gen_10y_l4_payload_install_runner_contract_only'
  workstream: 'AI_VIDEO_BROLL_GENERATION'
  toolId: 'ai_video_broll_generation_wan'
  proofVmName: 'reeditpro-ai-broll-wan-l4-proof'
  projectId: 'reeditpro'
  targetRegion: 'northamerica-northeast2'
  targetZone: 'northamerica-northeast2-a'
  machineType: 'g2-standard-4'
  selectedGpu: 'nvidia_l4'
  runnerFix: {
    rawStdoutIsOnlyJsonParseInput: true
    stdoutSummaryIsLogOnly: true
    stderrSummaryIsLogOnly: true
    parseBeforeSanitizeOrTruncate: true
    machineStateFromSanitizedSummaryAllowed: false
    compactDescribeShapeRequired: true
    exactNameCleanupAfterAnyCreateAttempt: true
    cleanupIndependentOfDescribeParse: true
    exactAbsenceChecksRequired: true
    durableSummaryRequired: true
    shellFormatQuotingBugAvoidedByArgArrays: true
  }
  postCreateProbeCommands: AiVideoBrollGen10yGcloudCommandSpec[]
  cleanupCommands: AiVideoBrollGen10yGcloudCommandSpec[]
  runtimeSideEffects: {
    gcpReadOnlyCommandsExecuted: false
    gcpMutatingCommandsExecuted: false
    computeVmCreated: false
    computeVmDeleted: false
    sshSessionOpened: false
    payloadTransferred: false
    dependencyInstallRun: false
    modelImportRun: false
    modelInferenceRun: false
    generatedVideoCreated: false
    generatedAssetsCreated: false
    dockerRun: false
    providerCallsMade: false
    workersDispatched: false
    supabaseTouched: false
    sqlExecuted: false
    creditMutationCreated: false
    betaUnlocked: false
    productionUnlocked: false
    dryRunPassedClaimed: false
    generatedLocalFixturePassedClaimed: false
  }
}

const PROJECT_ID = 'reeditpro'
const PROOF_VM_NAME = 'reeditpro-ai-broll-wan-l4-proof'
const TARGET_REGION = 'northamerica-northeast2'
const TARGET_ZONE = 'northamerica-northeast2-a'

export const AI_VIDEO_BROLL_GEN_10Y_L4_PAYLOAD_INSTALL_RUNNER_CONTRACT = {
  mode: 'ai_video_broll_gen_10y_l4_payload_install_runner_contract_only',
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'ai_video_broll_generation_wan',
  proofVmName: PROOF_VM_NAME,
  projectId: PROJECT_ID,
  targetRegion: TARGET_REGION,
  targetZone: TARGET_ZONE,
  machineType: 'g2-standard-4',
  selectedGpu: 'nvidia_l4',
  runnerFix: {
    rawStdoutIsOnlyJsonParseInput: true,
    stdoutSummaryIsLogOnly: true,
    stderrSummaryIsLogOnly: true,
    parseBeforeSanitizeOrTruncate: true,
    machineStateFromSanitizedSummaryAllowed: false,
    compactDescribeShapeRequired: true,
    exactNameCleanupAfterAnyCreateAttempt: true,
    cleanupIndependentOfDescribeParse: true,
    exactAbsenceChecksRequired: true,
    durableSummaryRequired: true,
    shellFormatQuotingBugAvoidedByArgArrays: true,
  },
  postCreateProbeCommands: [
    {
      id: 'describe_prompt_vm_compact_raw_json',
      command: 'gcloud',
      args: [
        'compute',
        'instances',
        'describe',
        PROOF_VM_NAME,
        '--project',
        PROJECT_ID,
        '--zone',
        TARGET_ZONE,
        '--format=json(status,networkInterfaces,disks)',
      ],
      futureOnly: true,
      executedByThisPrompt: false,
      parsesRawStdoutBeforeSummary: true,
      machineStateDecisionInput: 'rawStdout',
      stdoutSummaryLogOnly: true,
      purpose:
        'Future 10Z runner must parse this raw compact JSON before creating sanitized summaries for logs.',
    },
    {
      id: 'describe_prompt_vm_status_value',
      command: 'gcloud',
      args: [
        'compute',
        'instances',
        'describe',
        PROOF_VM_NAME,
        '--project',
        PROJECT_ID,
        '--zone',
        TARGET_ZONE,
        '--format=value(name,status)',
      ],
      futureOnly: true,
      executedByThisPrompt: false,
      parsesRawStdoutBeforeSummary: false,
      machineStateDecisionInput: 'rawStdout',
      stdoutSummaryLogOnly: true,
      purpose:
        'Future status probe is represented as argv so zsh cannot split or glob the format expression.',
    },
  ],
  cleanupCommands: [
    {
      id: 'delete_prompt_scoped_vm_exact_name',
      command: 'gcloud',
      args: [
        'compute',
        'instances',
        'delete',
        PROOF_VM_NAME,
        '--project',
        PROJECT_ID,
        '--zone',
        TARGET_ZONE,
        '--quiet',
      ],
      futureOnly: true,
      executedByThisPrompt: false,
      parsesRawStdoutBeforeSummary: false,
      machineStateDecisionInput: 'exitCodeOnly',
      stdoutSummaryLogOnly: true,
      purpose:
        'Future cleanup must attempt exact-name deletion after any create attempt or successful create result.',
    },
    {
      id: 'verify_prompt_vm_absent_exact_name',
      command: 'gcloud',
      args: [
        'compute',
        'instances',
        'describe',
        PROOF_VM_NAME,
        '--project',
        PROJECT_ID,
        '--zone',
        TARGET_ZONE,
        '--format=value(name,status)',
      ],
      futureOnly: true,
      executedByThisPrompt: false,
      parsesRawStdoutBeforeSummary: false,
      machineStateDecisionInput: 'exitCodeOnly',
      stdoutSummaryLogOnly: true,
      purpose: 'Future cleanup verification must prove exact-name instance absence.',
    },
    {
      id: 'verify_prompt_disk_absent_exact_name',
      command: 'gcloud',
      args: [
        'compute',
        'disks',
        'describe',
        PROOF_VM_NAME,
        '--project',
        PROJECT_ID,
        '--zone',
        TARGET_ZONE,
        '--format=value(name,status)',
      ],
      futureOnly: true,
      executedByThisPrompt: false,
      parsesRawStdoutBeforeSummary: false,
      machineStateDecisionInput: 'exitCodeOnly',
      stdoutSummaryLogOnly: true,
      purpose: 'Future cleanup verification must prove exact-name boot disk absence.',
    },
    {
      id: 'verify_prompt_address_absent_exact_name',
      command: 'gcloud',
      args: [
        'compute',
        'addresses',
        'describe',
        PROOF_VM_NAME,
        '--project',
        PROJECT_ID,
        '--region',
        TARGET_REGION,
        '--format=value(name,status)',
      ],
      futureOnly: true,
      executedByThisPrompt: false,
      parsesRawStdoutBeforeSummary: false,
      machineStateDecisionInput: 'exitCodeOnly',
      stdoutSummaryLogOnly: true,
      purpose: 'Future cleanup verification must prove exact-name static address absence.',
    },
    {
      id: 'verify_prompt_reservation_absent_exact_name',
      command: 'gcloud',
      args: [
        'compute',
        'reservations',
        'describe',
        PROOF_VM_NAME,
        '--project',
        PROJECT_ID,
        '--zone',
        TARGET_ZONE,
        '--format=value(name,status)',
      ],
      futureOnly: true,
      executedByThisPrompt: false,
      parsesRawStdoutBeforeSummary: false,
      machineStateDecisionInput: 'exitCodeOnly',
      stdoutSummaryLogOnly: true,
      purpose: 'Future cleanup verification must prove exact-name reservation absence.',
    },
  ],
  runtimeSideEffects: {
    gcpReadOnlyCommandsExecuted: false,
    gcpMutatingCommandsExecuted: false,
    computeVmCreated: false,
    computeVmDeleted: false,
    sshSessionOpened: false,
    payloadTransferred: false,
    dependencyInstallRun: false,
    modelImportRun: false,
    modelInferenceRun: false,
    generatedVideoCreated: false,
    generatedAssetsCreated: false,
    dockerRun: false,
    providerCallsMade: false,
    workersDispatched: false,
    supabaseTouched: false,
    sqlExecuted: false,
    creditMutationCreated: false,
    betaUnlocked: false,
    productionUnlocked: false,
    dryRunPassedClaimed: false,
    generatedLocalFixturePassedClaimed: false,
  },
} as const satisfies AiVideoBrollGen10yRunnerContract

export function parseRawGcloudJson<T>(rawStdout: string): T {
  const trimmed = rawStdout.trim()
  if (!trimmed) {
    throw new Error('raw_gcloud_stdout_empty')
  }

  return JSON.parse(trimmed) as T
}

export function sanitizeGcloudOutputForSummary(value: string): string | undefined {
  const sanitized = value
    .replace(/\bhttps?:\/\/\S+/gi, 'redacted_url')
    .replace(/\bya29\.[A-Za-z0-9._-]+/g, 'redacted_access_token')
    .replace(/\bBearer\s+\S+/gi, 'Bearer redacted')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, 'redacted_email')
    .replace(/\bssh-(rsa|ed25519)\s+[A-Za-z0-9+/=]{40,}/gi, 'redacted_ssh_public_key')
    .trim()

  return sanitized ? sanitized.slice(0, 1200) : undefined
}

export function shouldAttemptExactNameCleanup(
  state: AiVideoBrollGen10yCleanupTriggerState,
): boolean {
  return state.computeVmCreateAttempted || state.computeVmCreated || state.createCommandExitCode === 0
}

export function buildNoExecutionRunnerContractSummary() {
  return {
    ok: true,
    mode: AI_VIDEO_BROLL_GEN_10Y_L4_PAYLOAD_INSTALL_RUNNER_CONTRACT.mode,
    proofVmName: AI_VIDEO_BROLL_GEN_10Y_L4_PAYLOAD_INSTALL_RUNNER_CONTRACT.proofVmName,
    rawStdoutIsOnlyJsonParseInput:
      AI_VIDEO_BROLL_GEN_10Y_L4_PAYLOAD_INSTALL_RUNNER_CONTRACT.runnerFix
        .rawStdoutIsOnlyJsonParseInput,
    machineStateFromSanitizedSummaryAllowed:
      AI_VIDEO_BROLL_GEN_10Y_L4_PAYLOAD_INSTALL_RUNNER_CONTRACT.runnerFix
        .machineStateFromSanitizedSummaryAllowed,
    cleanupIndependentOfDescribeParse:
      AI_VIDEO_BROLL_GEN_10Y_L4_PAYLOAD_INSTALL_RUNNER_CONTRACT.runnerFix
        .cleanupIndependentOfDescribeParse,
    exactAbsenceCheckCount:
      AI_VIDEO_BROLL_GEN_10Y_L4_PAYLOAD_INSTALL_RUNNER_CONTRACT.cleanupCommands.filter(
        (command) => command.id.startsWith('verify_'),
      ).length,
    runtimeSideEffects:
      AI_VIDEO_BROLL_GEN_10Y_L4_PAYLOAD_INSTALL_RUNNER_CONTRACT.runtimeSideEffects,
  }
}

if (process.argv[1]?.endsWith('ai-video-broll-gen-10y-l4-payload-install-runner-contract.ts')) {
  console.log(JSON.stringify(buildNoExecutionRunnerContractSummary(), null, 2))
}
