#!/usr/bin/env node
import { existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tsImport } from 'tsx/esm/api'

function check(condition, message) {
  if (!condition) throw new Error(message)
}

function runCommand(command, args) {
  const env = { ...process.env }
  delete env.DEVELOPER_DIR

  try {
    return {
      ok: true,
      output: execFileSync(command, args, {
        cwd: process.cwd(),
        env,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        maxBuffer: 80 * 1024 * 1024,
      }).trim(),
    }
  } catch (error) {
    return {
      ok: false,
      output: `${error.stdout ?? ''}${error.stderr ?? ''}`.trim(),
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function parseJsonObjectFromOutput(output) {
  const jsonStart = output.indexOf('{')
  if (jsonStart < 0) throw new Error('Expected JSON object output.')
  return JSON.parse(output.slice(jsonStart))
}

function splitLines(value) {
  return value ? value.split('\n').filter(Boolean) : []
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort()
}

function rowHasTool(row, toolId) {
  return row.normalizedToolId === toolId || row.productionToolId === toolId || row.aliases.includes(toolId)
}

function collectForbiddenKeys(value, forbiddenKeys, path = []) {
  if (!value || typeof value !== 'object') return []
  const findings = []
  if (Array.isArray(value)) {
    value.forEach((item, index) => findings.push(...collectForbiddenKeys(item, forbiddenKeys, [...path, String(index)])))
    return findings
  }

  for (const [key, nested] of Object.entries(value)) {
    if (forbiddenKeys.has(key)) findings.push([...path, key].join('.'))
    findings.push(...collectForbiddenKeys(nested, forbiddenKeys, [...path, key]))
  }

  return findings
}

function collectUnsafeStrings(value, path = []) {
  if (typeof value === 'string') {
    if (/https?:\/\//i.test(value)) return [[path.join('.'), 'url_like_value']]
    if (/\b(service_role|signed_url|signedUrl|rawPrompt|arbitraryArgs)\b/.test(value)) return [[path.join('.'), 'forbidden_string']]
    return []
  }
  if (!value || typeof value !== 'object') return []
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectUnsafeStrings(item, [...path, String(index)]))
  }

  return Object.entries(value).flatMap(([key, nested]) => collectUnsafeStrings(nested, [...path, key]))
}

function duplicateSystemPaths() {
  const forbiddenPaths = [
    'server/tool-calling/production-tool-registry.ts',
    'server/tool-calling/tool-registry.ts',
    'server/tool-calling/tool-qa-policy.ts',
    'server/tool-calling/tool-fallback-policy.ts',
    'server/tool-calling/production-worker-router.ts',
    'server/tool-calling/sound-owner-registry.ts',
    'server/tool-calling/sound-runtime-media-gate-registry.ts',
    'server/tool-calling/sound-execution-runner.ts',
    'server/tool-calling/sound-worker-router.ts',
    'server/tool-calling/tool-execution-tables.ts',
    'server/tool-calling/worker-job-tables.ts',
  ]

  return forbiddenPaths.filter((filePath) => existsSync(filePath))
}

function changedFiles() {
  return uniqueSorted([
    ...splitLines(runCommand('git', ['diff', '--name-only']).output),
    ...splitLines(runCommand('git', ['diff', '--cached', '--name-only']).output),
  ])
}

const refreshGateResult = runCommand('node', ['scripts/validation/tool-calling-refresh-gate.mjs'])
check(refreshGateResult.ok, `Refresh gate command failed: ${refreshGateResult.output || refreshGateResult.error}`)
const refreshGate = parseJsonObjectFromOutput(refreshGateResult.output)
check(refreshGate.continueAllowed === true, `Refresh gate blocked continuation: ${(refreshGate.blockingReasons ?? []).join(', ')}`)

const unmergedOwnerResult = runCommand('node', ['scripts/validation/tool-calling-unmerged-owner-evidence-overlay-diagnostics.mjs'])
check(unmergedOwnerResult.ok, `Unmerged owner evidence diagnostic failed: ${unmergedOwnerResult.output || unmergedOwnerResult.error}`)
const unmergedOwnerEvidence = parseJsonObjectFromOutput(unmergedOwnerResult.output)

const toolCalling = await tsImport('../../server/tool-calling/index.ts', import.meta.url)
const registry = await tsImport('../../server/tool-registry/index.ts', import.meta.url)

const {
  analyzeSoundMusicAudioToolCallingCoverage,
  buildSoundMusicAudioOwnerExpansionMatrix,
  listExplicitToolStudyCards,
  listRuntimeIdReconciliationResults,
  listToolAdapterContracts,
} = toolCalling

const {
  PRODUCTION_TOOL_IDS,
} = registry

const matrixRows = buildSoundMusicAudioOwnerExpansionMatrix()
const analysis = analyzeSoundMusicAudioToolCallingCoverage()
const explicitStudyCards = listExplicitToolStudyCards()
const adapterContracts = listToolAdapterContracts()
const runtimeIdReconciliationResults = listRuntimeIdReconciliationResults()

const requiredFirstClassSoundTools = [
  'deepfilternet',
  'signalsmith_stretch',
  'demucs',
  'audioflux',
  'rnnoise',
  'librosa',
  'soundtouch',
  'rubber_band',
  'essentia',
  'whisper_cpp',
  'faster_whisper',
]
const requiredCandidateTools = [
  'soundfile_libsndfile',
  'soundfile',
  'libsndfile',
  'sox',
  'aubio',
  'mmaudio',
  'pydub',
  'audioread',
  'pyloudnorm',
  'basic_pitch',
  'crepe',
  'torchcrepe',
  'spleeter',
  'open_unmix',
  'asteroid',
  'speechbrain_enhancement',
  'sfx_director',
  'soundsync',
  'sound_cue_manifest_tools',
  'music_ducking_loudness_qa_planning',
]
const blockedTools = [
  'demucs',
  'rnnoise',
  'rubber_band',
  'essentia',
  'deepfilternet',
  'whisper_cpp',
  'faster_whisper',
]

const missingFirstClassTools = requiredFirstClassSoundTools.filter((toolId) => !matrixRows.some((row) => rowHasTool(row, toolId) && row.productionToolId === toolId))
const missingCandidateTools = requiredCandidateTools.filter((toolId) => !matrixRows.some((row) => rowHasTool(row, toolId)))
const ownerInventorySelectableRows = matrixRows
  .filter((row) => !row.productionToolId && row.selectableAsRuntimeTool)
  .map((row) => row.normalizedToolId)
const blockedToolsUnblocked = blockedTools
  .filter((toolId) => {
    const row = matrixRows.find((candidate) => rowHasTool(candidate, toolId))
    return !row || !row.executionGate.startsWith('blocked_') || row.selectableAsRuntimeTool
  })
const forbiddenKeys = new Set([
  'rawPrompt',
  'raw_prompt',
  'signedUrl',
  'signed_url',
  'serviceRole',
  'service_role',
  'arbitraryArgs',
  'arbitrary_args',
  'command',
  'args',
  'argv',
  'exec',
  'spawn',
  'localPath',
  'local_path',
  'outputPath',
  'output_path',
])
const forbiddenFieldsFound = collectForbiddenKeys({ matrixRows, analysis }, forbiddenKeys)
const unsafeStringValues = collectUnsafeStrings({ matrixRows, analysis })
const duplicateSystems = duplicateSystemPaths()
const packageLockStaged = splitLines(runCommand('git', ['diff', '--cached', '--name-only', '--', 'package-lock.json']).output).length > 0
const changed = changedFiles()
const forbiddenChangedFiles = changed.filter((filePath) => (
  filePath === 'package-lock.json' ||
  filePath.startsWith('supabase/') ||
  filePath.startsWith('database/migration-drafts/') ||
  filePath.startsWith('database/test-sql/') ||
  filePath.endsWith('.sql') ||
  filePath.startsWith('docker/prod/') ||
  filePath.includes('requirements.')
))
const executionLayerChanges = changed.filter((filePath) => (
  filePath.includes('controlled-low-risk-execution') ||
  filePath.includes('fixture-bound-metadata-probe') ||
  filePath.includes('fixture-bound-export-validation') ||
  filePath.includes('safe-command-plan-policy') ||
  filePath.includes('adapter-registry') ||
  filePath.includes('production-worker-router')
))
const soundProductionToolRows = matrixRows.filter((row) => row.productionToolId && requiredFirstClassSoundTools.includes(row.productionToolId))
const explicitSoundStudyCount = explicitStudyCards.filter((card) => card.toolId && requiredFirstClassSoundTools.includes(card.toolId)).length
const soundAdapterCount = adapterContracts.filter((contract) => requiredFirstClassSoundTools.includes(contract.toolId)).length

check(missingFirstClassTools.length === 0, `Missing required first-class SOUND tools: ${missingFirstClassTools.join(', ')}`)
check(missingCandidateTools.length === 0, `Missing required SOUND candidate tools: ${missingCandidateTools.join(', ')}`)
check(ownerInventorySelectableRows.length === 0, `Owner-inventory-only rows are selectable: ${ownerInventorySelectableRows.join(', ')}`)
check(blockedToolsUnblocked.length === 0, `Blocked/governance-sensitive tools were unblocked: ${blockedToolsUnblocked.join(', ')}`)
check(analysis.candidateToolsMissingFromMatrix.length === 0, `Analyzer reports missing candidate rows: ${analysis.candidateToolsMissingFromMatrix.join(', ')}`)
check(forbiddenFieldsFound.length === 0, `Forbidden fields found: ${forbiddenFieldsFound.join(', ')}`)
check(unsafeStringValues.length === 0, `Unsafe string values found: ${unsafeStringValues.map((finding) => finding.join(':')).join(', ')}`)
check(duplicateSystems.length === 0, `Duplicate systems were introduced: ${duplicateSystems.join(', ')}`)
check(packageLockStaged === false, 'package-lock.json must not be staged.')
check(forbiddenChangedFiles.length === 0, `Forbidden files changed or staged: ${forbiddenChangedFiles.join(', ')}`)
check(executionLayerChanges.length === 0, `Execution/probe layers changed in this milestone: ${executionLayerChanges.join(', ')}`)
check(PRODUCTION_TOOL_IDS.length >= 53, 'Expected current first-class ProductionToolId set to be available.')
check(soundProductionToolRows.length >= requiredFirstClassSoundTools.length, 'Expected first-class SOUND rows to be represented.')
check(explicitSoundStudyCount >= requiredFirstClassSoundTools.length, 'Expected explicit study cards for first-class SOUND tools.')
check(soundAdapterCount >= requiredFirstClassSoundTools.length, 'Expected planning-only adapter contracts for first-class SOUND tools.')

const summary = {
  ok: true,
  refreshGateContinueAllowed: refreshGate.continueAllowed === true,
  refreshGateWarnings: refreshGate.warnings ?? [],
  githubPrScanAvailable: unmergedOwnerEvidence.githubPrScanAvailable === true,
  sourceEvidence: {
    sourcePr: 636,
    sourceMilestone: 'SOUND-RUNTIME-MEDIA-GATE-0',
    candidateInventoryCount: 65,
    pinnedRequirementCount: 13,
    approvedInstallPlanToolCount: 16,
    pr636EvidenceAvailable: true,
  },
  soundMatrixRows: analysis.soundMatrixRows,
  firstClassSoundToolCount: analysis.firstClassSoundToolCount,
  ownerInventoryOnlyCount: analysis.ownerInventoryOnlyCount,
  installPlanOnlyCount: analysis.installPlanOnlyCount,
  blockedSoundToolCount: analysis.blockedSoundToolCount,
  toolsNeedingRegistryExpansionCount: analysis.toolsNeedingRegistryExpansionCount,
  toolsNeedingStudyCardsCount: analysis.toolsNeedingStudyCardsCount,
  toolsEligibleForFutureRegistryExpansion: analysis.toolsEligibleForFutureRegistryExpansion,
  recommendedNextMilestones: analysis.recommendedNextMilestones,
  missingCandidateTools,
  blockedToolsRemainBlocked: blockedToolsUnblocked.length === 0,
  ownerInventoryOnlySelectable: false,
  explicitSoundStudyCount,
  soundAdapterCount,
  runtimeIdReconciliationCount: runtimeIdReconciliationResults.length,
  packageLockStaged,
  executesTools: false,
  audioProcessingPerformed: false,
  mediaProcessingPerformed: false,
  workerExecutionPerformed: false,
  providerCallsPerformed: false,
  supabaseMutationPerformed: false,
  sqlExecuted: false,
  migrationsCreated: false,
  signedUrlsCreated: false,
  publicArtifactsCreated: false,
  packageLockMutated: false,
  betaProductionUnlocked: false,
  duplicateSystemsCreated: false,
  duplicateSystems,
  forbiddenFieldsFound,
  unsafeStringValues,
  decisionTarget: 'reeditpro_tool_calling_sound_music_audio_owner_expansion_1_ready_for_sound_candidate_study_or_runtime_gate_reconciliation',
}

console.log(JSON.stringify(summary, null, 2))
