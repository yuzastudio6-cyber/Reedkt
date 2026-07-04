#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_external_beta_blocker_reconciliation_after_agent_cloud_proof_completed_with_warnings_ready_for_phase210_explicit_fixture_path_intake'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_agent_cloud_tool_call_proof_passed_with_warnings_ready_for_external_beta_blocker_reconciliation'
const SOURCE_COMMIT = 'a4623b585dc7dd59a22a82c298c04261190dcbb8'
const PREVIOUS_DECISION =
  'worker_runtime_jobs_sound_cpu_controlled_cloud_run_no_media_execution_readback_passed_with_warnings_ready_for_agent_cloud_tool_call_proof'
const PREVIOUS_COMMIT = '65da0a9d7117fcb6bc05c238795d815a40a14b44'
const PHASE210_DECISION =
  'worker_runtime_jobs_sound_cpu_phase210_blocked_private_fixture_path_input_missing_or_incomplete'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE210-PRIVATE-FIXTURE-PATH-INPUT-AND-BOUNDARY-INTAKE-WITH-EXPLICIT-PATH'
const NEXT_PROMPT_FILE =
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase210-private-fixture-path-input-and-boundary-intake-with-explicit-path.md'

const DOCS = {
  reconciliation: [
    'docs/worker-runtime-jobs-sound-cpu-external-beta-blocker-reconciliation-after-agent-cloud-proof.md',
    'worker-runtime-jobs-sound-cpu-external-beta-blocker-reconciliation-after-agent-cloud-proof',
  ],
  closure: [
    'docs/worker-runtime-jobs-sound-cpu-agent-cloud-blocker-closure-register-after-agent-cloud-proof.md',
    'worker-runtime-jobs-sound-cpu-agent-cloud-blocker-closure-register-after-agent-cloud-proof',
  ],
  betaState: [
    'docs/worker-runtime-jobs-sound-cpu-current-beta-state-register-after-agent-cloud-proof.md',
    'worker-runtime-jobs-sound-cpu-current-beta-state-register-after-agent-cloud-proof',
  ],
  phase210: [
    'docs/worker-runtime-jobs-sound-cpu-phase210-fixture-intake-blocker-register-after-agent-cloud-proof.md',
    'worker-runtime-jobs-sound-cpu-phase210-fixture-intake-blocker-register-after-agent-cloud-proof',
  ],
  sources: [
    'docs/worker-runtime-jobs-sound-cpu-external-beta-reconciliation-source-register-after-agent-cloud-proof.md',
    'worker-runtime-jobs-sound-cpu-external-beta-reconciliation-source-register-after-agent-cloud-proof',
  ],
  claims: [
    'docs/worker-runtime-jobs-sound-cpu-external-beta-reconciliation-claim-policy-after-agent-cloud-proof.md',
    'worker-runtime-jobs-sound-cpu-external-beta-reconciliation-claim-policy-after-agent-cloud-proof',
  ],
}

const FORBIDDEN_TEXT = [
  '"realUserMediaBetaAllowed": true',
  '"externalBetaWithRealUserMediaAllowed": true',
  '"paidProductionAllowed": true',
  '"productionReady": true',
  '"externalBetaStateMutatedToday": true',
  '"internalBetaUnlockToday": true',
  '"externalBetaUnlockToday": true',
  '"productionUnlockToday": true',
  '"newCloudRunExecution": true',
  '"dockerBuild": true',
  '"dockerPush": true',
  '"dockerRun": true',
  '"workerExecution": true',
  '"routeExecution": true',
  '"toolExecution": true',
  '"realUserMediaRead": true',
  '"mediaProcessing": true',
  '"artifactCreation": true',
  '"supabaseMutation": true',
  '"sqlExecution": true',
  '"storageTransfer": true',
  '"signedUrlCreation": true',
  '"publicArtifactCreation": true',
  '"providerModelCall": true',
  '"betaUnlock": true',
  '"productionUnlock": true',
  '"environmentTouched": "yes"',
  '"sqlExecuted": "yes"',
  '"migrationDeployed": "yes"',
  'SUPABASE_SERVICE_ROLE',
  'STRIPE_SECRET',
  'GOOGLE_APPLICATION_CREDENTIALS',
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(path) {
  assert(existsSync(path), `Missing required file: ${path}`)
  return readFileSync(path, 'utf8')
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function parseBlock(path, label) {
  const text = read(path)
  for (const forbidden of FORBIDDEN_TEXT) {
    assert(!text.includes(forbidden), `${path} contains forbidden text: ${forbidden}`)
  }
  const match = text.match(new RegExp('```json\\s+' + escapeRegExp(label) + '\\n([\\s\\S]*?)\\n```'))
  assert(match, `Missing JSON block ${label} in ${path}`)
  return JSON.parse(match[1])
}

function assertSupabaseNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label} Supabase updateRequired widened`)
  assert(value?.environmentTouched === 'no', `${label} Supabase environmentTouched widened`)
  assert(value?.sqlExecuted === 'no', `${label} Supabase sqlExecuted widened`)
  assert(value?.migrationDeployed === 'no', `${label} Supabase migrationDeployed widened`)
  assert(value?.nextAction === 'none', `${label} Supabase nextAction widened`)
}

const parsed = Object.fromEntries(
  Object.entries(DOCS).map(([key, [path, label]]) => [key, parseBlock(path, label)]),
)

for (const [key, doc] of Object.entries(parsed)) {
  assert(doc.owner === 'WORKER_RUNTIME_JOBS', `${key} owner mismatch`)
  assert(doc.decision === DECISION, `${key} decision mismatch`)
}

const reconciliation = parsed.reconciliation
assert(reconciliation.sourceEvidence.sourcePr === 2420, 'source PR mismatch')
assert(reconciliation.sourceEvidence.sourceMergeCommit === SOURCE_COMMIT, 'source merge commit mismatch')
assert(reconciliation.sourceEvidence.sourceDecision === SOURCE_DECISION, 'source decision mismatch')
assert(reconciliation.sourceEvidence.previousCloudReadbackPr === 2419, 'previous readback PR mismatch')
assert(reconciliation.sourceEvidence.previousCloudReadbackMergeCommit === PREVIOUS_COMMIT, 'previous commit mismatch')
assert(reconciliation.reconciliationResult.agentCloudToolCallProofAccepted === true, 'agent cloud proof not accepted')
assert(reconciliation.reconciliationResult.agentCloudToolCallBlockerClosed === true, 'agent blocker not closed')
assert(reconciliation.reconciliationResult.allFifteenToolsInstalledInCloudImage === true, '15-tool install proof missing')
assert(reconciliation.reconciliationResult.allFifteenToolsPassedCloudRunNoMediaProof === true, '15-tool Cloud Run proof missing')
assert(reconciliation.reconciliationResult.syntheticAgentEnvelopeAccepted === true, 'agent envelope not accepted')
assert(reconciliation.reconciliationResult.boundedExternalBetaScorecardPreviouslyEnabled === true, 'bounded scorecard source missing')
assert(reconciliation.reconciliationResult.realUserMediaBetaAllowed === false, 'real-user-media beta widened')
assert(reconciliation.reconciliationResult.externalBetaWithRealUserMediaAllowed === false, 'external real-media beta widened')
assert(reconciliation.reconciliationResult.selectedRemainingBlocker === 'private_fixture_path_input_missing_or_incomplete', 'selected blocker mismatch')
assert(reconciliation.reconciliationResult.smallestNextGate === NEXT_PROMPT, 'next gate mismatch')
assert(reconciliation.reconciliationResult.smallestNextGateFile === NEXT_PROMPT_FILE, 'next gate file mismatch')
for (const [name, value] of Object.entries(reconciliation.runtimeActions)) {
  assert(value === false, `${name} runtime action widened`)
}
assertSupabaseNoop(reconciliation.supabaseClassification, 'reconciliation')

const closure = parsed.closure
assert(closure.closedBlockers.length === 2, 'closed blocker count mismatch')
assert(
  closure.closedBlockers.some(
    (item) =>
      item.blockerId === 'agent_cloud_tool_call_not_yet_proven' &&
      item.status === 'closed' &&
      item.sourcePr === 2420,
  ),
  'agent cloud blocker closure missing',
)
assert(
  closure.notClosedByThisPacket.some(
    (item) => item.blockerId === 'private_fixture_path_input_missing_or_incomplete' && item.status === 'open',
  ),
  'private fixture blocker must remain open',
)

const betaState = parsed.betaState
assert(betaState.betaState.boundedExternalBetaScorecardAllowed === true, 'bounded scorecard flag missing')
assert(betaState.betaState.realUserMediaBetaAllowed === false, 'real-user-media beta widened in beta state')
assert(betaState.agentToolState.toolCountInScope === 15, 'tool count mismatch')
assert(betaState.agentToolState.toolCountPassed === 15, 'tool pass count mismatch')
assert(betaState.agentToolState.toolCountFailed === 0, 'tool fail count mismatch')
assert(betaState.agentToolState.metadataWorkerExecuted === false, 'metadata worker widened')
assert(betaState.agentToolState.realUserMediaRead === false, 'real media read widened')
assert(betaState.packageLock.unchanged === true, 'package lock changed')

const phase210 = parsed.phase210.selectedBlocker
assert(phase210.blockerId === 'private_fixture_path_input_missing_or_incomplete', 'Phase210 blocker mismatch')
assert(phase210.severity === 'hard_stop', 'Phase210 severity mismatch')
assert(phase210.sourceDecision === PHASE210_DECISION, 'Phase210 source decision mismatch')
assert(phase210.fixPrompt === NEXT_PROMPT, 'Phase210 fix prompt mismatch')
assert(phase210.fixPromptFile === NEXT_PROMPT_FILE, 'Phase210 fix file mismatch')
assert(phase210.mustNotSubstituteRandomMedia === true, 'random media guard missing')
assert(phase210.mustNotSearchBroadPrivateFolders === true, 'broad private search guard missing')
assert(phase210.mustNotForceBetaUnlock === true, 'force beta guard missing')

const sources = parsed.sources
for (const [source, decision] of [
  ['PR #2420', SOURCE_DECISION],
  ['PR #2419', PREVIOUS_DECISION],
  ['Phase210 private fixture intake', PHASE210_DECISION],
]) {
  assert(
    sources.sources.some((item) => item.source === source && item.decision === decision && item.accepted === true),
    `missing accepted source: ${source}`,
  )
}
assert(sources.sourceConclusion.agentCloudProofMerged === true, 'agent proof merge source missing')
assert(sources.sourceConclusion.phase210BlockerStillCurrent === true, 'Phase210 current flag missing')
assert(sources.sourceConclusion.externalBetaUnlockEvidencePresent === false, 'external beta unlock evidence widened')
assert(sources.sourceConclusion.realUserMediaReadEvidencePresent === false, 'real media evidence widened')

const claims = parsed.claims
for (const value of Object.values(claims.allowedClaims)) {
  assert(value === true, 'allowed claim should be true')
}
for (const value of Object.values(claims.forbiddenClaims)) {
  assert(value === 'unclaimed', 'forbidden claim widened')
}
for (const value of Object.values(claims.closedScopes)) {
  assert(value === 'no', 'closed scope widened')
}
assert(claims.nextPrompt === NEXT_PROMPT, 'claim next prompt mismatch')
assert(claims.nextPromptFile === NEXT_PROMPT_FILE, 'claim next file mismatch')
assertSupabaseNoop(claims.supabaseClassification, 'claims')

const sourceProof = parseBlock(
  'docs/worker-runtime-jobs-sound-cpu-agent-cloud-tool-call-proof.md',
  'worker-runtime-jobs-sound-cpu-agent-cloud-tool-call-proof',
)
assert(sourceProof.decision === SOURCE_DECISION, 'source proof decision changed')
assert(sourceProof.toolProof.attemptedToolCount === 15, 'source attempted count mismatch')
assert(sourceProof.toolProof.passedToolCount === 15, 'source pass count mismatch')
assert(sourceProof.toolProof.failedToolCount === 0, 'source fail count mismatch')
assert(sourceProof.acceptedForToday.realUserMedia === 'no', 'source real media widened')

const phase210Source = parseBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase210-private-fixture-path-input-and-boundary-intake-result.md',
  'worker-runtime-jobs-sound-cpu-phase210-private-fixture-path-input-and-boundary-intake-result',
)
assert(phase210Source.decision === PHASE210_DECISION, 'Phase210 decision changed')
assert(phase210Source.intakeResult.explicitLocalPathProvided === false, 'Phase210 path unexpectedly present')
assert(phase210Source.intakeResult.blockedBeforeMediaRead === true, 'Phase210 must block before media read')
assert(phase210Source.intakeResult.selectedNextPrompt === NEXT_PROMPT, 'Phase210 selected next prompt mismatch')

const nextPromptText = read(NEXT_PROMPT_FILE)
assert(nextPromptText.includes('explicit'), 'next prompt must request explicit path')
assert(nextPromptText.includes('private fixture'), 'next prompt must mention private fixture')
assert(
  nextPromptText.includes('no-Supabase-write boundary') &&
    nextPromptText.includes('Supabase mutation') &&
    nextPromptText.includes('SQL execution'),
  'next prompt must preserve Supabase/SQL no-op scope',
)

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.[
    'worker-runtime-jobs:sound-cpu-external-beta-blocker-reconciliation-after-agent-cloud-proof:diagnostics'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-external-beta-blocker-reconciliation-after-agent-cloud-proof-diagnostics.mjs',
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: DECISION,
      sourcePr: 2420,
      agentCloudToolCallBlockerClosed: true,
      toolCountPassed: 15,
      realUserMediaBetaAllowed: false,
      selectedRemainingBlocker: 'private_fixture_path_input_missing_or_incomplete',
      nextPrompt: NEXT_PROMPT,
    },
    null,
    2,
  ),
)
