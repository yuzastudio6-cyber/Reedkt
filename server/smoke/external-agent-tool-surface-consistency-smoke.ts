import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'

import {
  EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP,
  type ExternalAgentManualBlockerAction,
} from '../../src/backend/mock/mock-external-agent-tool-execution-readiness-rollup'
import { EXTERNAL_AGENT_TOOL_NEXT_COMMAND } from '../../src/backend/mock/mock-external-agent-tool-next-command'

type JsonObject = Record<string, unknown>

const ROOT = process.cwd()
const QWEN_TOOL_ID = 'qwen2_5_vl_7b_instruct'
const BROLL_TOOL_ID = 'ai_video_broll_generation_wan'
const EXPECTED_QWEN_MANUAL_ACTION_IDS: string[] = []
const EXPECTED_BROLL_MANUAL_ACTION_IDS: string[] = []

function runJsonCli(script: string): JsonObject {
  const output = execFileSync('npx', ['tsx', script], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 10,
  })

  return JSON.parse(output) as JsonObject
}

function asRecord(value: unknown, label: string): JsonObject {
  assert.equal(typeof value, 'object', `${label} must be an object`)
  assert.notEqual(value, null, `${label} must not be null`)
  assert.equal(Array.isArray(value), false, `${label} must not be an array`)
  return value as JsonObject
}

function asArray(value: unknown, label: string): unknown[] {
  assert.equal(Array.isArray(value), true, `${label} must be an array`)
  return value as unknown[]
}

function asManualActions(value: unknown, label: string): ExternalAgentManualBlockerAction[] {
  return asArray(value, label).map((action, index) => asManualAction(action, `${label}[${index}]`))
}

function asManualAction(value: unknown, label: string): ExternalAgentManualBlockerAction {
  const record = asRecord(value, label)
  for (const key of [
    'id',
    'label',
    'purpose',
    'afterCompletionCommand',
    'runInsideCodex',
    'mutatesRuntime',
    'runsModel',
    'createsAssets',
    'mutatesCloud',
    'mutatesLocalGcloudAuth',
    'mutatesLocalGcloudConfig',
    'changesQuotaRequest',
  ]) {
    assert.equal(key in record, true, `${label} missing ${key}`)
  }

  return record as ExternalAgentManualBlockerAction
}

function findByTool(rows: unknown, toolId: string, label: string): JsonObject {
  const row = asArray(rows, label).find((candidate) => asRecord(candidate, `${label} row`).toolId === toolId)
  assert.notEqual(row, undefined, `${label} missing row for ${toolId}`)
  return asRecord(row, `${label}.${toolId}`)
}

function manualActionsFromRows(rows: unknown, toolId: string, label: string): ExternalAgentManualBlockerAction[] {
  return asManualActions(findByTool(rows, toolId, label).manualBlockerActions, `${label}.${toolId}.manualBlockerActions`)
}

function normalizeManualActions(actions: ExternalAgentManualBlockerAction[]): ExternalAgentManualBlockerAction[] {
  return actions.map((action) => ({
    id: action.id,
    label: action.label,
    runInsideCodex: action.runInsideCodex,
    mutatesRuntime: action.mutatesRuntime,
    runsModel: action.runsModel,
    createsAssets: action.createsAssets,
    mutatesCloud: action.mutatesCloud,
    mutatesLocalGcloudAuth: action.mutatesLocalGcloudAuth,
    mutatesLocalGcloudConfig: action.mutatesLocalGcloudConfig,
    changesQuotaRequest: action.changesQuotaRequest,
    purpose: action.purpose,
    afterCompletionCommand: action.afterCompletionCommand,
  }))
}

function assertSameManualActions(
  actual: ExternalAgentManualBlockerAction[],
  expected: ExternalAgentManualBlockerAction[],
  label: string,
): void {
  assert.deepEqual(normalizeManualActions(actual), normalizeManualActions(expected), `${label} manual actions drifted`)
}

function assertManualActionSafety(actions: ExternalAgentManualBlockerAction[], label: string): void {
  for (const action of actions) {
    const expectedAfterCompletionCommand =
      action.id === 'request_gpus_all_regions_quota_in_console'
        ? 'npm run ai-video-broll-wan-gpu-global-quota:verify'
        : 'npm run external-agent-tool-blockers:preflight'
    assert.equal(action.runInsideCodex, false, `${label}.${action.id} must remain outside Codex`)
    assert.equal(action.mutatesRuntime, false, `${label}.${action.id} must not mutate runtime`)
    assert.equal(action.runsModel, false, `${label}.${action.id} must not run models`)
    assert.equal(action.createsAssets, false, `${label}.${action.id} must not create assets`)
    assert.equal(
      action.afterCompletionCommand,
      expectedAfterCompletionCommand,
      `${label}.${action.id} must route back through its read-only verification command`,
    )
  }
}

function assertExpectedManualActionIds(
  actions: ExternalAgentManualBlockerAction[],
  expectedIds: string[],
  label: string,
): void {
  assert.deepEqual(
    actions.map((action) => action.id),
    expectedIds,
    `${label} manual action IDs drifted`,
  )
}

function assertQwenManualActions(actions: ExternalAgentManualBlockerAction[], label: string): void {
  assertExpectedManualActionIds(actions, EXPECTED_QWEN_MANUAL_ACTION_IDS, label)
  assertManualActionSafety(actions, label)
}

function assertBrollManualActions(actions: ExternalAgentManualBlockerAction[], label: string): void {
  assertExpectedManualActionIds(actions, EXPECTED_BROLL_MANUAL_ACTION_IDS, label)
  assertManualActionSafety(actions, label)
  for (const action of actions) {
    assert.equal(action.mutatesCloud, true, `${label}.${action.id} must identify cloud-owner work`)
    assert.equal(action.mutatesLocalGcloudAuth, false, `${label}.${action.id} must not touch auth`)
    assert.equal(action.mutatesLocalGcloudConfig, false, `${label}.${action.id} must not touch config`)
    assert.equal(action.changesQuotaRequest, true, `${label}.${action.id} must identify quota request`)
  }
}

function assertAllRuntimeFlagsFalse(value: unknown, label: string): void {
  const flags = asRecord(value, label)
  for (const [key, flagValue] of Object.entries(flags)) {
    assert.equal(flagValue, false, `${label}.${key} must remain false`)
  }
}

function scanForbiddenValues(value: unknown, prefix = 'surfaceConsistency'): string[] {
  const findings: string[] = []

  if (typeof value === 'string') {
    const patterns: Array<[string, RegExp]> = [
      ['concrete public URL', /\bhttps?:\/\/\S+/i],
      ['access token value', /\bya29\.[A-Za-z0-9._-]+/i],
      ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
      ['jwt value', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/i],
      ['service-role value', /\bservice[_-]?role\s*[:=]\s*['"][^'"]+/i],
      ['api key value', /\bapi[_-]?key\s*[:=]\s*['"][^'"]+/i],
      ['raw worker prompt field', /\braw[_-]?worker[_-]?prompt\b/i],
      ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
      ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|Signature=|Key-Pair-Id=|Policy=)/i],
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

const rollup = EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP
const rollupToolsById = new Map(rollup.tools.map((tool) => [tool.toolId, tool]))
const rollupQwenActions = rollupToolsById.get(QWEN_TOOL_ID)?.manualBlockerActions ?? []
const rollupBrollActions = rollupToolsById.get(BROLL_TOOL_ID)?.manualBlockerActions ?? []

assertQwenManualActions(rollupQwenActions, 'rollup.qwen')
assertBrollManualActions(rollupBrollActions, 'rollup.broll')
assertAllRuntimeFlagsFalse(rollup.runtimeSideEffects, 'rollup.runtimeSideEffects')
for (const tool of rollup.tools) {
  if (tool.toolId === QWEN_TOOL_ID || tool.toolId === BROLL_TOOL_ID) {
    assert.equal(tool.readyForExternalAgentExecutionNow, true, `${tool.toolId} must be ready for the explicit gate`)
  } else {
    assert.equal(
      tool.readyForExternalAgentExecutionNow,
      false,
      `${tool.toolId} must not be execution-ready on the Qwen retry-2 branch`,
    )
  }
}

const actionPlan = runJsonCli('server/cli/external-agent-tool-action-plan.ts')
const readiness = runJsonCli('server/cli/external-agent-tool-readiness-check.ts')
const executionGate = runJsonCli('server/cli/external-agent-tool-execution-gate.ts')
const blockerPreflight = runJsonCli('server/cli/external-agent-tool-blocker-preflight.ts')
const brollQuotaVerify = runJsonCli('server/cli/ai-video-broll-wan-gpu-global-quota-verify.ts')
const nextCommand = runJsonCli('server/cli/external-agent-tool-next-command.ts')
const qwenExecutionWrapper = runJsonCli('server/cli/external-agent-tool-execute-qwen.ts')
const brollExecutionWrapper = runJsonCli('server/cli/external-agent-tool-execute-broll-wan.ts')
const soundExecutionWrapper = runJsonCli('server/cli/external-agent-tool-execute-sound.ts')
const supabaseHarnessExecutionWrapper = runJsonCli(
  'server/cli/external-agent-tool-execute-supabase-harness.ts',
)

const qwenSurfaceActions = [
  ['actionPlan.toolActions', manualActionsFromRows(actionPlan.toolActions, QWEN_TOOL_ID, 'actionPlan.toolActions')],
  ['executionGate.toolRows', manualActionsFromRows(executionGate.toolRows, QWEN_TOOL_ID, 'executionGate.toolRows')],
  [
    'blockerPreflight.qwen',
    asManualActions(asRecord(blockerPreflight.qwen, 'blockerPreflight.qwen').manualBlockerActions, 'blockerPreflight.qwen.manualBlockerActions'),
  ],
  [
    'nextCommand.executionGateToolSummaries',
    manualActionsFromRows(
      nextCommand.executionGateToolSummaries,
      QWEN_TOOL_ID,
      'nextCommand.executionGateToolSummaries',
    ),
  ],
] as const

const brollSurfaceActions = [
  ['actionPlan.toolActions', manualActionsFromRows(actionPlan.toolActions, BROLL_TOOL_ID, 'actionPlan.toolActions')],
  ['executionGate.toolRows', manualActionsFromRows(executionGate.toolRows, BROLL_TOOL_ID, 'executionGate.toolRows')],
  [
    'blockerPreflight.broll',
    asManualActions(
      asRecord(blockerPreflight.broll, 'blockerPreflight.broll').manualBlockerActions,
      'blockerPreflight.broll.manualBlockerActions',
    ),
  ],
  [
    'nextCommand.executionGateToolSummaries',
    manualActionsFromRows(
      nextCommand.executionGateToolSummaries,
      BROLL_TOOL_ID,
      'nextCommand.executionGateToolSummaries',
    ),
  ],
] as const

for (const [label, actions] of qwenSurfaceActions) {
  assertSameManualActions(actions, rollupQwenActions, `${label}.qwen`)
  assertQwenManualActions(actions, `${label}.qwen`)
}
assert.equal(
  asArray(actionPlan.manualBlockers, 'actionPlan.manualBlockers').some(
    (row) => asRecord(row, 'actionPlan.manualBlockers row').toolId === QWEN_TOOL_ID,
  ),
  false,
  'actionPlan.manualBlockers must not include explicit-gate-ready Qwen',
)
assert.equal(
  asArray(readiness.blockers, 'readiness.blockers').some(
    (row) => asRecord(row, 'readiness.blockers row').toolId === QWEN_TOOL_ID,
  ),
  false,
  'readiness.blockers must not include explicit-gate-ready Qwen',
)
assert.equal(
  asArray(actionPlan.manualBlockers, 'actionPlan.manualBlockers').some(
    (row) => asRecord(row, 'actionPlan.manualBlockers row').toolId === BROLL_TOOL_ID,
  ),
  false,
  'actionPlan.manualBlockers must not include explicit-gate-ready B-roll',
)
assert.equal(
  asArray(readiness.blockers, 'readiness.blockers').some(
    (row) => asRecord(row, 'readiness.blockers row').toolId === BROLL_TOOL_ID,
  ),
  false,
  'readiness.blockers must not include explicit-gate-ready B-roll',
)

for (const [label, actions] of brollSurfaceActions) {
  assertSameManualActions(actions, rollupBrollActions, `${label}.broll`)
  assertBrollManualActions(actions, `${label}.broll`)
}

assert.equal(actionPlan.readyForAnyExternalAgentExecutionNow, true)
assert.equal(actionPlan.runtimeGatesAllFalse, true)
assertAllRuntimeFlagsFalse(actionPlan.runtimeSideEffects, 'actionPlan.runtimeSideEffects')

assert.equal(readiness.readyForAnyExternalAgentExecutionNow, true)
assert.equal(readiness.runtimeGatesAllFalse, true)
for (const readinessFlag of [
  'cloudRunTouched',
  'computeTouched',
  'dockerRun',
  'providerCallsMade',
  'workersDispatched',
  'supabaseTouched',
  'sqlExecuted',
  'modelInferenceRun',
  'generatedAssetsCreated',
]) {
  assert.equal(readiness[readinessFlag], false, `readiness.${readinessFlag} must remain false`)
}

assert.equal(executionGate.executionAllowedNow, false)
assert.equal(executionGate.readyForAnyExternalAgentExecutionNow, false)
assert.equal(executionGate.runtimeGatesAllFalse, true)
assertAllRuntimeFlagsFalse(executionGate.runtimeSideEffects, 'executionGate.runtimeSideEffects')

assert.equal(blockerPreflight.readyForAnyExternalAgentExecutionNow, false)
assert.equal(blockerPreflight.runtimeGatesAllFalse, true)
assertAllRuntimeFlagsFalse(blockerPreflight.runtimeSideEffects, 'blockerPreflight.runtimeSideEffects')

assert.equal(brollQuotaVerify.readyForExternalAgentExecutionNow, false)
assert.equal(brollQuotaVerify.runtimeGatesAllFalse, true)
assertAllRuntimeFlagsFalse(brollQuotaVerify.runtimeSideEffects, 'brollQuotaVerify.runtimeSideEffects')

assert.equal(
  nextCommand.executionAllowedNow,
  (nextCommand.executionGateAllowsRuntime === true ||
    nextCommand.staticExplicitToolGateReady === true) &&
    nextCommand.qwenLivePreflightPassed === true,
)
assert.equal(nextCommand.readyForAnyExternalAgentExecutionNow, nextCommand.executionAllowedNow)
assert.equal(nextCommand.runtimeGatesAllFalse, true)
assertAllRuntimeFlagsFalse(nextCommand.runtimeSideEffects, 'nextCommand.runtimeSideEffects')

const wrapperCanonicalCommand = asRecord(qwenExecutionWrapper.canonicalCommand, 'qwenExecutionWrapper.canonicalCommand')
assert.equal(qwenExecutionWrapper.mode, 'external_agent_qwen_execution_static_guard')
assert.equal(qwenExecutionWrapper.executeRequired, true)
assert.equal(qwenExecutionWrapper.runtimeRunNow, false)
assert.equal(qwenExecutionWrapper.generatedAssetsCreated, false)
assert.equal(qwenExecutionWrapper.supabaseTouched, false)
assert.equal(qwenExecutionWrapper.sqlExecuted, false)
assert.equal(qwenExecutionWrapper.creditMutationCreated, false)
assert.equal(qwenExecutionWrapper.generatedLocalFixturePassedClaimed, false)
const qwenExecutionCommandKeys = [
  'toolId',
  'command',
  'args',
  'confirmationEnv',
  'confirmationEnvRequiredValue',
  'verifiesLiveNextCommandBeforeDelegating',
  'delegatesToBoundedCommand',
  'boundedApprovedFixtureOnly',
  'createsGeneratedAssets',
  'touchesSupabase',
  'touchesSql',
  'unlocksBetaOrProduction',
] as const
for (const key of qwenExecutionCommandKeys) {
  assert.deepEqual(
    wrapperCanonicalCommand[key],
    EXTERNAL_AGENT_TOOL_NEXT_COMMAND.qwenExternalAgentExecutionCommand[key],
    `Qwen wrapper command drifted from spec at ${key}`,
  )
  if (nextCommand.qwenExternalAgentExecutionCommand) {
    const nextCanonicalCommand = asRecord(
      nextCommand.qwenExternalAgentExecutionCommand,
      'nextCommand.qwenExternalAgentExecutionCommand',
    )
    assert.deepEqual(wrapperCanonicalCommand[key], nextCanonicalCommand[key], `Qwen wrapper command drifted at ${key}`)
  }
}

const brollWrapperCanonicalCommand = asRecord(
  brollExecutionWrapper.canonicalCommand,
  'brollExecutionWrapper.canonicalCommand',
)
assert.equal(brollExecutionWrapper.mode, 'external_agent_broll_wan_execution_static_guard')
assert.equal(brollExecutionWrapper.executeRequired, true)
assert.equal(brollExecutionWrapper.runtimeRunNow, false)
assert.equal(brollExecutionWrapper.computeVmCreated, false)
assert.equal(brollExecutionWrapper.dockerRun, false)
assert.equal(brollExecutionWrapper.modelImportRun, false)
assert.equal(brollExecutionWrapper.modelInferenceRun, false)
assert.equal(brollExecutionWrapper.generatedVideoCreated, false)
assert.equal(brollExecutionWrapper.generatedAssetsCreated, false)
assert.equal(brollExecutionWrapper.supabaseTouched, false)
assert.equal(brollExecutionWrapper.sqlExecuted, false)
assert.equal(brollExecutionWrapper.creditMutationCreated, false)
assert.equal(brollExecutionWrapper.generatedLocalFixturePassedClaimed, false)
const brollExecutionCommandKeys = [
  'toolId',
  'command',
  'args',
  'confirmationEnv',
  'confirmationEnvRequiredValue',
  'verifiesLiveQuotaBeforeAnyVmAction',
  'verifiesPrivateCacheBeforeAnyVmAction',
  'requiresNoIdleLifecycleGate',
  'blocksWhenGpusAllRegionsQuotaInsufficient',
  'createsComputeVm',
  'deletesComputeVmAndVerifiesCleanup',
  'dependencyInstallOnly',
  'runsModel',
  'createsGeneratedAssets',
  'touchesSupabase',
  'touchesSql',
  'unlocksBetaOrProduction',
] as const
for (const key of brollExecutionCommandKeys) {
  assert.deepEqual(
    brollWrapperCanonicalCommand[key],
    EXTERNAL_AGENT_TOOL_NEXT_COMMAND.brollWanExternalAgentProofCommand[key],
    `B-roll wrapper command drifted from spec at ${key}`,
  )
  const nextBrollCommand = asRecord(
    nextCommand.brollWanExternalAgentProofCommand,
    'nextCommand.brollWanExternalAgentProofCommand',
  )
  assert.deepEqual(
    brollWrapperCanonicalCommand[key],
    nextBrollCommand[key],
    `B-roll wrapper command drifted at ${key}`,
  )
}
assert.equal(
  asRecord(nextCommand.brollWanExternalAgentProofCommand, 'nextCommand.brollWanExternalAgentProofCommand')
    .executionAllowedNow,
  false,
)

const soundWrapperCanonicalCommand = asRecord(
  soundExecutionWrapper.canonicalCommand,
  'soundExecutionWrapper.canonicalCommand',
)
assert.equal(soundExecutionWrapper.mode, 'external_agent_sound_execution_static_guard')
assert.equal(soundExecutionWrapper.executeRequired, true)
assert.equal(soundExecutionWrapper.runtimeRunNow, false)
assert.equal(soundExecutionWrapper.providerCallsMade, false)
assert.equal(soundExecutionWrapper.workersDispatched, false)
assert.equal(soundExecutionWrapper.mediaProcessingRun, false)
assert.equal(soundExecutionWrapper.generatedAudioCreated, false)
assert.equal(soundExecutionWrapper.generatedAssetsCreated, false)
assert.equal(soundExecutionWrapper.supabaseTouched, false)
assert.equal(soundExecutionWrapper.sqlExecuted, false)
assert.equal(soundExecutionWrapper.creditMutationCreated, false)
assert.equal(soundExecutionWrapper.generatedLocalFixturePassedClaimed, false)
const soundExecutionCommandKeys = [
  'toolId',
  'command',
  'args',
  'confirmationEnv',
  'confirmationEnvRequiredValue',
  'verifiesSoundOssArchiveDiagnosticsBeforeAnyRuntime',
  'verifiesSoundRuntimeRouteSourceDiagnosticsBeforeAnyRuntime',
  'blocksRealProviderWorkerStorageExport',
  'runsProvider',
  'dispatchesWorker',
  'runsMediaProcessing',
  'createsGeneratedAudio',
  'createsGeneratedAssets',
  'touchesSupabase',
  'touchesSql',
  'unlocksBetaOrProduction',
] as const
for (const key of soundExecutionCommandKeys) {
  assert.deepEqual(
    soundWrapperCanonicalCommand[key],
    EXTERNAL_AGENT_TOOL_NEXT_COMMAND.soundMusicAudioEvidenceCommand[key],
    `Sound wrapper command drifted from spec at ${key}`,
  )
  const nextSoundCommand = asRecord(
    nextCommand.soundMusicAudioEvidenceCommand,
    'nextCommand.soundMusicAudioEvidenceCommand',
  )
  assert.deepEqual(
    soundWrapperCanonicalCommand[key],
    nextSoundCommand[key],
    `Sound wrapper command drifted at ${key}`,
  )
}
assert.equal(
  asRecord(nextCommand.soundMusicAudioEvidenceCommand, 'nextCommand.soundMusicAudioEvidenceCommand')
    .executionAllowedNow,
  false,
)

const supabaseHarnessWrapperCanonicalCommand = asRecord(
  supabaseHarnessExecutionWrapper.canonicalCommand,
  'supabaseHarnessExecutionWrapper.canonicalCommand',
)
assert.equal(supabaseHarnessExecutionWrapper.mode, 'external_agent_supabase_harness_execution_static_guard')
assert.equal(supabaseHarnessExecutionWrapper.executeRequired, true)
assert.equal(supabaseHarnessExecutionWrapper.runtimeRunNow, false)
assert.equal(supabaseHarnessExecutionWrapper.supabaseCliExecuted, false)
assert.equal(supabaseHarnessExecutionWrapper.dockerStarted, false)
assert.equal(supabaseHarnessExecutionWrapper.sqlExecuted, false)
assert.equal(supabaseHarnessExecutionWrapper.databaseCreated, false)
assert.equal(supabaseHarnessExecutionWrapper.migrationDeployed, false)
assert.equal(supabaseHarnessExecutionWrapper.rowsCreated, false)
assert.equal(supabaseHarnessExecutionWrapper.storageObjectsCreated, false)
assert.equal(supabaseHarnessExecutionWrapper.signedUrlsCreated, false)
assert.equal(supabaseHarnessExecutionWrapper.generatedAssetsCreated, false)
assert.equal(supabaseHarnessExecutionWrapper.generatedLocalFixturePassedClaimed, false)
const supabaseHarnessExecutionCommandKeys = [
  'toolId',
  'command',
  'args',
  'confirmationEnv',
  'confirmationEnvRequiredValue',
  'verifiesLocalConfigBeforeAnyRuntime',
  'verifiesLocalHarnessRetryEvidenceBeforeAnyRuntime',
  'blocksLiveSupabaseMutation',
  'runsSupabaseCli',
  'runsDocker',
  'executesSql',
  'createsRows',
  'createsStorageObjects',
  'createsSignedUrls',
  'touchesSupabaseCloud',
  'unlocksBetaOrProduction',
] as const
for (const key of supabaseHarnessExecutionCommandKeys) {
  assert.deepEqual(
    supabaseHarnessWrapperCanonicalCommand[key],
    EXTERNAL_AGENT_TOOL_NEXT_COMMAND.supabaseLocalHarnessEvidenceCommand[key],
    `Supabase harness wrapper command drifted from spec at ${key}`,
  )
  const nextSupabaseHarnessCommand = asRecord(
    nextCommand.supabaseLocalHarnessEvidenceCommand,
    'nextCommand.supabaseLocalHarnessEvidenceCommand',
  )
  assert.deepEqual(
    supabaseHarnessWrapperCanonicalCommand[key],
    nextSupabaseHarnessCommand[key],
    `Supabase harness wrapper command drifted at ${key}`,
  )
}
assert.equal(
  asRecord(nextCommand.supabaseLocalHarnessEvidenceCommand, 'nextCommand.supabaseLocalHarnessEvidenceCommand')
    .executionAllowedNow,
  false,
)

const normalizedSurfaceData = {
  rollupQwenActions: normalizeManualActions(rollupQwenActions),
  rollupBrollActions: normalizeManualActions(rollupBrollActions),
  qwenSurfaceActions: qwenSurfaceActions.map(([label, actions]) => [label, normalizeManualActions(actions)]),
  brollSurfaceActions: brollSurfaceActions.map(([label, actions]) => [label, normalizeManualActions(actions)]),
  runtimeSideEffects: {
    rollup: rollup.runtimeSideEffects,
    actionPlan: actionPlan.runtimeSideEffects,
    executionGate: executionGate.runtimeSideEffects,
    blockerPreflight: blockerPreflight.runtimeSideEffects,
    brollQuotaVerify: brollQuotaVerify.runtimeSideEffects,
    nextCommand: nextCommand.runtimeSideEffects,
  },
  qwenExecutionWrapper: {
    canonicalCommand: qwenExecutionWrapper.canonicalCommand,
    delegatedBoundedCommand: qwenExecutionWrapper.delegatedBoundedCommand,
    runtimeRunNow: qwenExecutionWrapper.runtimeRunNow,
    generatedAssetsCreated: qwenExecutionWrapper.generatedAssetsCreated,
    generatedLocalFixturePassedClaimed: qwenExecutionWrapper.generatedLocalFixturePassedClaimed,
  },
  brollExecutionWrapper: {
    canonicalCommand: brollExecutionWrapper.canonicalCommand,
    runtimeRunNow: brollExecutionWrapper.runtimeRunNow,
    computeVmCreated: brollExecutionWrapper.computeVmCreated,
    modelInferenceRun: brollExecutionWrapper.modelInferenceRun,
    generatedAssetsCreated: brollExecutionWrapper.generatedAssetsCreated,
    generatedLocalFixturePassedClaimed: brollExecutionWrapper.generatedLocalFixturePassedClaimed,
  },
  soundExecutionWrapper: {
    canonicalCommand: soundExecutionWrapper.canonicalCommand,
    runtimeRunNow: soundExecutionWrapper.runtimeRunNow,
    providerCallsMade: soundExecutionWrapper.providerCallsMade,
    workersDispatched: soundExecutionWrapper.workersDispatched,
    mediaProcessingRun: soundExecutionWrapper.mediaProcessingRun,
    generatedAssetsCreated: soundExecutionWrapper.generatedAssetsCreated,
    generatedLocalFixturePassedClaimed: soundExecutionWrapper.generatedLocalFixturePassedClaimed,
  },
  supabaseHarnessExecutionWrapper: {
    canonicalCommand: supabaseHarnessExecutionWrapper.canonicalCommand,
    runtimeRunNow: supabaseHarnessExecutionWrapper.runtimeRunNow,
    supabaseCliExecuted: supabaseHarnessExecutionWrapper.supabaseCliExecuted,
    dockerStarted: supabaseHarnessExecutionWrapper.dockerStarted,
    sqlExecuted: supabaseHarnessExecutionWrapper.sqlExecuted,
    migrationDeployed: supabaseHarnessExecutionWrapper.migrationDeployed,
    generatedAssetsCreated: supabaseHarnessExecutionWrapper.generatedAssetsCreated,
    generatedLocalFixturePassedClaimed: supabaseHarnessExecutionWrapper.generatedLocalFixturePassedClaimed,
  },
}
const forbiddenFindings = scanForbiddenValues(normalizedSurfaceData)
assert.equal(forbiddenFindings.length, 0, `Forbidden values in surface data: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      mode: 'external_agent_tool_surface_consistency_smoke',
      checkedSurfaces: [
        'rollup',
        'external-agent-tool-action-plan',
        'external-agent-tool-readiness:check',
        'external-agent-tool-execution-gate',
        'external-agent-tool-blockers:preflight',
        'ai-video-broll-wan-gpu-global-quota:verify',
        'external-agent-tool-next-command',
        'external-agent-tool-execute-qwen',
        'external-agent-tool-execute-broll-wan',
        'external-agent-tool-execute-sound',
        'external-agent-tool-execute-supabase-harness',
      ],
      qwenManualBlockerActionIds: normalizeManualActions(rollupQwenActions).map((action) => action.id),
      brollManualBlockerActionIds: normalizeManualActions(rollupBrollActions).map((action) => action.id),
      runtimeGatesAllFalse: true,
      staticQwenReadyForExplicitGate: nextCommand.staticExplicitToolGateReady === true,
      liveQwenPreflightPassed: nextCommand.qwenLivePreflightPassed,
      executionAllowedNow: nextCommand.executionAllowedNow,
      readyForAnyExternalAgentExecutionNow: nextCommand.readyForAnyExternalAgentExecutionNow,
    },
    null,
    2,
  ),
)
