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
    if (/^\/(?:Users|Volumes|private|var|tmp)\//.test(value)) return [[path.join('.'), 'absolute_or_local_path']]
    if (['&&', '|', ';', '`', '$(', '>', '<'].some((token) => value.includes(token))) {
      return [[path.join('.'), 'shell_like_value']]
    }
    if (/\b(service_role|signed_url|signedUrl|rawPrompt|arbitraryArgs|provider_secret)\b/.test(value)) {
      return [[path.join('.'), 'forbidden_string']]
    }

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
    'server/tool-calling/adapter-execution-registry.ts',
    'server/tool-calling/safe-command-execution-policy.ts',
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

const soundOwnerResult = runCommand('node', ['scripts/validation/tool-calling-sound-music-audio-owner-expansion-diagnostics.mjs'])
check(soundOwnerResult.ok, `Sound owner expansion diagnostic failed: ${soundOwnerResult.output || soundOwnerResult.error}`)
const soundOwnerExpansion = parseJsonObjectFromOutput(soundOwnerResult.output)

const toolCalling = await tsImport('../../server/tool-calling/index.ts', import.meta.url)
const registry = await tsImport('../../server/tool-registry/index.ts', import.meta.url)

const {
  analyzeSoundCandidateStudyCards,
  loadSoundCandidateStudyCards,
  loadSoundCandidateStudyCardsIndex,
} = toolCalling
const {
  PRODUCTION_TOOL_IDS,
  listProductionToolProfiles,
} = registry

const index = loadSoundCandidateStudyCardsIndex()
const cards = loadSoundCandidateStudyCards()
const analysis = analyzeSoundCandidateStudyCards()
const productionToolIds = new Set(PRODUCTION_TOOL_IDS)
const productionProfiles = listProductionToolProfiles()
const cardExternalToolIds = cards.map((card) => card.externalToolId)
const cardsUsingFirstClassToolIds = cardExternalToolIds.filter((externalToolId) => productionToolIds.has(externalToolId))
const cardsWithToolIdField = cards.filter((card) => Object.prototype.hasOwnProperty.call(card, 'toolId')).map((card) => card.externalToolId)
const selectableCards = cards.filter((card) => card.selectableAsRuntimeTool).map((card) => card.externalToolId)
const unsafeCards = cards.filter((card) => (
  card.adapterContractAllowedNow ||
  card.commandIntentAllowedNow ||
  card.fixturePlanAllowedNow ||
  card.controlledProbeAllowedNow ||
  card.toolExecutionAllowedNow ||
  card.mediaProcessingAllowedNow ||
  card.workerExecutionAllowedNow ||
  card.supabaseMutationAllowedNow ||
  card.betaProductionAllowedNow
)).map((card) => card.externalToolId)
const cardsMissingSourceEvidence = cards.filter((card) => card.sourceEvidence.length === 0).map((card) => card.externalToolId)
const duplicateSystems = duplicateSystemPaths()
const packageLockStaged = splitLines(runCommand('git', ['diff', '--cached', '--name-only', '--', 'package-lock.json']).output).length > 0
const packageLockChanged = splitLines(runCommand('git', ['diff', '--name-only', '--', 'package-lock.json']).output).length > 0
const changed = changedFiles()
const forbiddenChangedFiles = changed.filter((filePath) => (
  filePath === 'package-lock.json' ||
  filePath.startsWith('supabase/') ||
  filePath.startsWith('database/migrations/') ||
  filePath.endsWith('.sql')
))
const forbiddenKeys = new Set([
  'rawPrompt',
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
const forbiddenFieldsFound = uniqueSorted([
  ...collectForbiddenKeys(cards, forbiddenKeys),
  ...collectForbiddenKeys(analysis, forbiddenKeys),
])
const unsafeStringValues = [
  ...collectUnsafeStrings(cards),
  ...collectUnsafeStrings(analysis),
]
const expectedCandidateCount = 18

check(cards.length === expectedCandidateCount, `Expected ${expectedCandidateCount} sound candidate study cards; found ${cards.length}.`)
check(index.candidateStudyCardCount === cards.length, 'Sound candidate study card index count does not match loaded cards.')
check(index.cardPaths.length === cards.length, 'Sound candidate study card index cardPaths count does not match loaded cards.')
check(index.candidateExternalToolIds.length === cards.length, 'Sound candidate study card index candidateExternalToolIds count does not match loaded cards.')
check(cardsUsingFirstClassToolIds.length === 0, `Candidate cards used first-class ProductionToolId values: ${cardsUsingFirstClassToolIds.join(', ')}`)
check(cardsWithToolIdField.length === 0, `Candidate cards must not include toolId: ${cardsWithToolIdField.join(', ')}`)
check(selectableCards.length === 0, `Candidate cards became selectable: ${selectableCards.join(', ')}`)
check(unsafeCards.length === 0, `Candidate cards enabled prohibited now-flags: ${unsafeCards.join(', ')}`)
check(cardsMissingSourceEvidence.length === 0, `Candidate cards missing source evidence: ${cardsMissingSourceEvidence.join(', ')}`)
check(analysis.evidenceNotFoundCount === 0, `Candidate cards missing PR #641/#636 evidence: ${analysis.evidenceNotFound.join(', ')}`)
check(analysis.adapterContractsAdded === 0, 'Candidate cards must not add adapter contracts.')
check(analysis.commandIntentsAdded === 0, 'Candidate cards must not add command intents.')
check(analysis.controlledProbesAdded === 0, 'Candidate cards must not add controlled probes.')
check(analysis.selectableCandidateCount === 0, 'Candidate cards must remain non-selectable.')
check(analysis.productionToolIdCount === productionProfiles.length, 'Production registry profile count and ID count diverged.')
check(packageLockStaged === false, 'package-lock.json must not be staged.')
check(packageLockChanged === false, 'package-lock.json must not be changed.')
check(forbiddenChangedFiles.length === 0, `Forbidden changed files: ${forbiddenChangedFiles.join(', ')}`)
check(duplicateSystems.length === 0, `Duplicate system files found: ${duplicateSystems.join(', ')}`)
check(forbiddenFieldsFound.length === 0, `Forbidden fields found: ${forbiddenFieldsFound.join(', ')}`)
check(unsafeStringValues.length === 0, `Unsafe string values found: ${JSON.stringify(unsafeStringValues)}`)

const summary = {
  ok: true,
  refreshGateContinueAllowed: refreshGate.continueAllowed,
  refreshGateWarnings: refreshGate.warnings ?? [],
  githubPrScanAvailable: unmergedOwnerEvidence.githubPrScanAvailable === true,
  soundOwnerExpansionSourceEvidence: soundOwnerExpansion.sourceEvidence,
  candidateStudyCardCount: analysis.candidateStudyCardCount,
  evidenceNotFoundCount: analysis.evidenceNotFoundCount,
  evidenceNotFound: analysis.evidenceNotFound,
  blockedCandidateCount: analysis.blockedCandidateCount,
  installPlanOnlyCount: analysis.installPlanOnlyCount,
  ownerInventoryOnlyCount: analysis.ownerInventoryOnlyCount,
  futureRegistryEligibleCount: analysis.futureRegistryEligibleCount,
  futureRegistryEligibleExternalToolIds: analysis.futureRegistryEligibleExternalToolIds,
  selectableCandidateCount: analysis.selectableCandidateCount,
  adapterContractsAdded: analysis.adapterContractsAdded,
  commandIntentsAdded: analysis.commandIntentsAdded,
  controlledProbesAdded: analysis.controlledProbesAdded,
  productionToolIdCount: analysis.productionToolIdCount,
  productionToolIdCountChanged: analysis.productionToolIdCountChanged,
  cardsUsingFirstClassToolIds,
  recommendedNextMilestones: analysis.recommendedNextMilestones,
  packageLockStaged,
  packageLockChanged,
  duplicateSystemsCreated: false,
  duplicateSystems,
  forbiddenFieldsFound,
  unsafeStringValues,
  executesTools: false,
  audioProcessingPerformed: false,
  mediaProcessingPerformed: false,
  workerExecutionPerformed: false,
  providerCallsPerformed: false,
  supabaseMutationPerformed: false,
  sqlExecuted: false,
  migrationsCreated: false,
  signedUrlsCreated: false,
  packageLockMutated: false,
  betaProductionUnlocked: false,
  decisionTarget: 'reeditpro_tool_calling_sound_candidate_study_cards_1_ready_for_sound_runtime_gate_1_reconciliation',
}

console.log(JSON.stringify(summary, null, 2))
