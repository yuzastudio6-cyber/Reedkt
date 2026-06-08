import { readFileSync } from 'node:fs'
import {
  SOUND_MUSIC_AUDIO_OWNER_ACCEPTANCE_CHECKLIST,
  type SoundMusicAudioOwnerAcceptanceOwner,
} from '../../src/backend/mock/mock-sound-music-audio-owner-acceptance-checklist'
import {
  SoundMusicAudioOwnerAcceptanceChecklistPanel,
  buildSoundMusicAudioOwnerAcceptanceChecklist,
  createMockSoundMusicAudioChatCardProps,
  type SoundMusicAudioOwnerAcceptanceChecklistDisplay,
} from '../../src/components/editor/sound'

const checklistDocPath = 'docs/sound-music-audio-owner-acceptance-checklist.md'
const scriptName = 'smoke:sound-music-audio-owner-acceptance-checklist'
const scriptCommand = 'tsx server/smoke/sound-music-audio-owner-acceptance-checklist-smoke.ts'
const immediateNextPrompt = 'SUPABASE-SOUND-1: Supabase mutation plan for local fixture records, no execution'

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

function requireText(source: string, text: string, message = `Checklist doc must include: ${text}`): void {
  check(source.includes(text), message)
}

function assertNoConcreteForbiddenText(source: string, path = 'text'): void {
  const lower = source.toLowerCase()
  check(!/^https?:\/\//im.test(source), `${path} must not contain concrete public URLs.`)
  check(!lower.includes('x-goog-signature'), `${path} must not contain signed URL signatures.`)
  check(!lower.includes('x-amz-signature'), `${path} must not contain signed URL signatures.`)
  check(!lower.includes('signature='), `${path} must not contain signed URL query values.`)
  check(!lower.includes('token='), `${path} must not contain tokenized URL values.`)
  check(!lower.includes('storage.googleapis.com'), `${path} must not contain storage public URLs.`)
  check(!lower.includes('gs://'), `${path} must not contain concrete storage URIs.`)
  check(!lower.includes('gcs://'), `${path} must not contain concrete storage URIs.`)
  check(!lower.includes('api_key'), `${path} must not contain API key values.`)
  check(!lower.includes('apikey'), `${path} must not contain API key values.`)
  check(!lower.includes('provider_secret'), `${path} must not contain provider secret values.`)
  check(!lower.includes('secret='), `${path} must not contain secret values.`)
  check(!/akia[0-9a-z]{12,}/i.test(source), `${path} must not contain access key shapes.`)
  check(!/sk-[a-z0-9_-]{12,}/i.test(source), `${path} must not contain provider credential shapes.`)
}

function assertNoForbiddenValues(value: unknown, path = 'value'): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenValues(item, `${path}.${index}`))
    return
  }

  if (!value || typeof value !== 'object') return

  for (const [key, nested] of Object.entries(value)) {
    const normalizedKey = key.toLowerCase()
    check(normalizedKey !== 'rawworkerprompt', `${path}.${key} must not expose raw worker prompt fields.`)
    check(normalizedKey !== 'raw_worker_prompt', `${path}.${key} must not expose raw worker prompt fields.`)
    check(normalizedKey !== 'apikey', `${path}.${key} must not expose API key fields.`)
    check(normalizedKey !== 'api_key', `${path}.${key} must not expose API key fields.`)
    check(normalizedKey !== 'servicerolekey', `${path}.${key} must not expose privileged key fields.`)
    check(normalizedKey !== 'service_role_key', `${path}.${key} must not expose privileged key fields.`)

    if (typeof nested === 'string') {
      const normalizedValue = nested.toLowerCase()
      check(!/^https?:\/\//i.test(nested), `${path}.${key} must not contain a public URL.`)
      check(!normalizedValue.startsWith('gs://'), `${path}.${key} must not contain a storage URI.`)
      check(!normalizedValue.startsWith('gcs://'), `${path}.${key} must not contain a storage URI.`)
      check(!normalizedValue.includes('storage.googleapis.com'), `${path}.${key} must not contain a storage URL.`)
      check(!normalizedValue.includes('x-goog-signature'), `${path}.${key} must not contain a signed URL signature.`)
      check(!normalizedValue.includes('x-amz-signature'), `${path}.${key} must not contain a signed URL signature.`)
      check(!normalizedValue.includes('signature='), `${path}.${key} must not contain signed URL query values.`)
      check(!normalizedValue.includes('token='), `${path}.${key} must not contain tokenized URL values.`)
      check(!normalizedValue.includes('api_key'), `${path}.${key} must not contain API key values.`)
      check(!normalizedValue.includes('apikey'), `${path}.${key} must not contain API key values.`)
      check(!normalizedValue.includes('service_role'), `${path}.${key} must not contain privileged key values.`)
      check(!normalizedValue.includes('provider_secret'), `${path}.${key} must not contain provider secret values.`)
      check(!normalizedValue.includes('secret='), `${path}.${key} must not contain secret values.`)
      check(!/akia[0-9a-z]{12,}/i.test(nested), `${path}.${key} must not contain access key shapes.`)
      check(!/sk-[a-z0-9_-]{12,}/i.test(nested), `${path}.${key} must not contain provider credential shapes.`)
    }

    assertNoForbiddenValues(nested, `${path}.${key}`)
  }
}

const requiredOwners = [
  'SOUND_MUSIC_AUDIO',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'WORKER_RUNTIME_JOBS',
  'PROVIDER_GATEWAY_MODELS',
  'OBSERVABILITY_AUDIT_COST',
  'BILLING_STRIPE_CREDITS',
  'TRACK_A_RENDER_EXPORT',
  'TRACK_B_MEDIA_PROCESSING',
] satisfies SoundMusicAudioOwnerAcceptanceOwner[]

function requireOwner(display: SoundMusicAudioOwnerAcceptanceChecklistDisplay, owner: SoundMusicAudioOwnerAcceptanceOwner): void {
  const ownerEntry = display.owners.find((candidate) => candidate.owner === owner)
  check(Boolean(ownerEntry), `Owner checklist must include ${owner}.`)
  check(ownerEntry?.acceptanceStatus === 'not_accepted_for_execution', `${owner} must remain not accepted for execution.`)
  check(Boolean(ownerEntry?.soundPrepared.length), `${owner} must include SOUND-prepared evidence.`)
  check(Boolean(ownerEntry?.ownerMustAccept.length), `${owner} must include owner acceptance requirements.`)
  check(Boolean(ownerEntry?.evidenceRequired.length), `${owner} must include required evidence.`)
  check(Boolean(ownerEntry?.forbiddenBypasses.length), `${owner} must include forbidden bypasses.`)
  check(Boolean(ownerEntry?.nextRecommendedPrompt), `${owner} must include a next recommended prompt.`)
}

function assertChecklistDisplay(display: SoundMusicAudioOwnerAcceptanceChecklistDisplay): void {
  check(display.workstream === 'SOUND_MUSIC_AUDIO', 'Checklist must report SOUND_MUSIC_AUDIO.')
  check(display.mode === 'owner_acceptance_checklist_only', 'Checklist mode must be owner_acceptance_checklist_only.')
  check(display.currentUnlockStage === 'dry_run_passed', 'Current stage must be dry_run_passed.')
  check(display.targetFutureUnlockStage === 'generated_local_fixture_passed', 'Target future stage must be generated_local_fixture_passed.')
  check(display.claimsGeneratedLocalFixturePassed === false, 'Checklist must not claim generated_local_fixture_passed.')
  check(display.handoffOnly === true, 'Checklist must be handoff-only.')
  check(display.sourceOfTruthPath.requiresSupabaseRow === true, 'Supabase row must be required.')
  check(display.sourceOfTruthPath.requiresPrivateGcsPath === true, 'Private GCS path must be required.')
  check(display.sourceOfTruthPath.requiresManifest === true, 'Manifest must be required.')
  check(display.sourceOfTruthPath.requiresChecksum === true, 'Checksum must be required.')
  check(display.sourceOfTruthPath.requiresApprovedPlanSnapshot === true, 'Approved plan snapshot must be required.')
  check(display.sourceOfTruthPath.signedUrlsAreSourceOfTruth === false, 'Signed URLs must not be source of truth.')
  check(display.sourceOfTruthPath.publicUrlsAllowed === false, 'Public URLs must be blocked.')
  check(display.executionPath.requiresUserChatRequest === true, 'User/chat request must be represented.')
  check(display.executionPath.requiresStructuredAgentFindings === true, 'Structured findings must be required.')
  check(display.executionPath.requiresEditIntents === true, 'Edit intents must be required.')
  check(display.executionPath.requiresApprovedPlanSnapshot === true, 'Approved snapshot must be required in execution path.')
  check(display.executionPath.workerExecutionOnlyAfterAcceptance === true, 'Worker execution must wait for owner acceptance.')
  check(display.executionPath.rawPromptDirectWorkerExecutionAllowed === false, 'Raw prompt direct worker execution must be blocked.')

  for (const gate of display.noExecutionGates) {
    check(gate.value === false, `No-execution gate ${gate.label} must be false.`)
  }

  for (const owner of requiredOwners) requireOwner(display, owner)

  for (const blockedUse of [
    'generated_local_fixture_passed_not_claimed',
    'approved_snapshot_rows_not_created',
    'supabase_mutation_blocked',
    'sql_blocked',
    'storage_object_not_allowed',
    'signed_url_blocked',
    'public_artifact_blocked',
    'provider_gateway_handoff_required',
    'worker_runtime_handoff_required',
    'generated_asset_not_allowed',
    'credit_approval_required',
    'track_a_final_export_blocked',
    'track_b_execution_not_accepted',
  ]) {
    check(display.blockedUses.includes(blockedUse), `Blocked use ${blockedUse} must be shown.`)
  }

  check(display.recommendedImmediateNextPrompt === immediateNextPrompt, 'Recommended immediate next prompt must be SUPABASE-SOUND-1.')
  assertNoForbiddenValues(display, 'ownerAcceptanceChecklist')
}

const checklistDoc = readFileSync(checklistDocPath, 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>
}
const cardSource = readFileSync('src/components/editor/sound/SoundMusicAudioPlanCard.tsx', 'utf8')
const panelSource = readFileSync('src/components/editor/sound/SoundMusicAudioOwnerAcceptanceChecklistPanel.tsx', 'utf8')
const fixtureSource = readFileSync('src/components/editor/sound/soundMusicAudioChatUiData.ts', 'utf8')
const indexSource = readFileSync('src/components/editor/sound/index.ts', 'utf8')

requireText(checklistDoc, '# SOUND_MUSIC_AUDIO Owner Acceptance Checklist')
requireText(checklistDoc, 'Current unlock stage: dry_run_passed.')
requireText(checklistDoc, 'Target future stage: generated_local_fixture_passed.')
requireText(checklistDoc, 'This checklist is handoff-only.')
requireText(checklistDoc, 'This checklist does not claim generated_local_fixture_passed.')
requireText(checklistDoc, 'Supabase row\n+ private GCS path\n+ manifest\n+ checksum\n+ approved plan snapshot')
requireText(checklistDoc, 'user/chat request\n→ structured agent findings\n→ edit intents\n→ approved plan snapshot\n→ worker execution')
requireText(checklistDoc, 'Raw prompt execution is blocked.')
requireText(checklistDoc, 'not_accepted_for_execution')
requireText(checklistDoc, immediateNextPrompt)
requireText(checklistDoc, 'Google Lyria remains music, song, and soundtrack planning metadata only.')
requireText(checklistDoc, 'Lyria must not be used for SFX')
requireText(checklistDoc, 'Provider Gateway owner must accept provider transport')
requireText(checklistDoc, 'Worker Runtime owner must accept future payload shape')
requireText(checklistDoc, 'Supabase owner must accept the approved plan snapshot row strategy')
requireText(checklistDoc, 'Track A final export is blocked')
requireText(checklistDoc, 'Track B execution is not accepted')
requireText(checklistDoc, '## Exit Criteria Before generated_local_fixture_passed Can Ever Be Claimed')

for (const owner of requiredOwners) {
  requireText(checklistDoc, `## ${owner}`, `Checklist doc must include ${owner} owner section.`)
  requireText(checklistDoc, 'Acceptance status: not_accepted_for_execution.')
}

assertNoConcreteForbiddenText(checklistDoc, 'owner checklist doc')
check(packageJson.scripts?.[scriptName] === scriptCommand, `${scriptName} package script must point at the owner checklist smoke.`)

check(SOUND_MUSIC_AUDIO_OWNER_ACCEPTANCE_CHECKLIST.workstream === 'SOUND_MUSIC_AUDIO', 'Canonical checklist must be SOUND-owned.')
check(SOUND_MUSIC_AUDIO_OWNER_ACCEPTANCE_CHECKLIST.mode === 'owner_acceptance_checklist_only', 'Canonical checklist mode must match.')
check(SOUND_MUSIC_AUDIO_OWNER_ACCEPTANCE_CHECKLIST.claimsGeneratedLocalFixturePassed === false, 'Canonical checklist must not claim generated/local fixture passed.')
check(SOUND_MUSIC_AUDIO_OWNER_ACCEPTANCE_CHECKLIST.handoffOnly === true, 'Canonical checklist must be handoff-only.')
check(SOUND_MUSIC_AUDIO_OWNER_ACCEPTANCE_CHECKLIST.recommendedImmediateNextPrompt === immediateNextPrompt, 'Canonical next prompt must be SUPABASE-SOUND-1.')

const canonicalChecklist = buildSoundMusicAudioOwnerAcceptanceChecklist(SOUND_MUSIC_AUDIO_OWNER_ACCEPTANCE_CHECKLIST)
assertChecklistDisplay(canonicalChecklist)

const props = createMockSoundMusicAudioChatCardProps()
check(Boolean(props.ownerAcceptanceChecklist), 'Mock chat props must include owner acceptance checklist display.')
if (!props.ownerAcceptanceChecklist) throw new Error('Missing mock owner acceptance checklist display.')
assertChecklistDisplay(props.ownerAcceptanceChecklist)

check(typeof SoundMusicAudioOwnerAcceptanceChecklistPanel === 'function', 'Owner acceptance checklist panel must be exported.')
check(cardSource.includes('SoundMusicAudioOwnerAcceptanceChecklistPanel'), 'Sound card must render owner acceptance checklist panel.')
check(cardSource.includes('props.ownerAcceptanceChecklist'), 'Sound card must gate owner checklist on optional mock props.')
check(fixtureSource.includes('buildSoundMusicAudioOwnerAcceptanceChecklist'), 'Mock chat data must build owner checklist display data.')
check(fixtureSource.includes('SOUND_MUSIC_AUDIO_OWNER_ACCEPTANCE_CHECKLIST'), 'Mock chat data must use canonical owner checklist constants.')
check(indexSource.includes('SoundMusicAudioOwnerAcceptanceChecklistPanel'), 'Sound index must export owner checklist panel.')
check(indexSource.includes('buildSoundMusicAudioOwnerAcceptanceChecklist'), 'Sound index must export owner checklist builder.')
check(!fixtureSource.includes('sound-agent-planner-service'), 'Frontend owner checklist data must not import backend planner services.')
check(!fixtureSource.includes('mock-sound-music-audio-dry-run-contract'), 'Frontend owner checklist data must not import dry-run backend helper.')

for (const forbiddenLabel of [
  'Generate',
  'Render',
  'Export',
  'Spend credits',
  'Reserve credits',
  'Start worker',
  'Call provider',
  'Upload',
  'Publish',
  'Create signed URL',
  'Send to Cloud Run',
  'Run fixture',
]) {
  check(!panelSource.includes(`>${forbiddenLabel}<`), `Owner checklist panel must not expose ${forbiddenLabel} action labels.`)
}

console.log(JSON.stringify({
  ok: true,
  workstream: 'SOUND_MUSIC_AUDIO',
  smoke: 'sound-music-audio-owner-acceptance-checklist',
  currentUnlockStage: canonicalChecklist.currentUnlockStage,
  targetFutureUnlockStage: canonicalChecklist.targetFutureUnlockStage,
  claimsGeneratedLocalFixturePassed: canonicalChecklist.claimsGeneratedLocalFixturePassed,
  handoffOnly: canonicalChecklist.handoffOnly,
  ownerCount: canonicalChecklist.owners.length,
  artifactCreated: SOUND_MUSIC_AUDIO_OWNER_ACCEPTANCE_CHECKLIST.execution.artifactCreated,
  mayCallProvider: SOUND_MUSIC_AUDIO_OWNER_ACCEPTANCE_CHECKLIST.execution.providerCallAllowed,
  mayDispatchWorker: SOUND_MUSIC_AUDIO_OWNER_ACCEPTANCE_CHECKLIST.execution.workerDispatchAllowed,
  mayCreateGeneratedAsset: SOUND_MUSIC_AUDIO_OWNER_ACCEPTANCE_CHECKLIST.execution.generatedAssetCreated,
  publicArtifactAllowed: SOUND_MUSIC_AUDIO_OWNER_ACCEPTANCE_CHECKLIST.execution.publicArtifactAllowed,
  supabaseMutationAllowed: SOUND_MUSIC_AUDIO_OWNER_ACCEPTANCE_CHECKLIST.execution.supabaseMutationAllowed,
  gcpMutationAllowed: SOUND_MUSIC_AUDIO_OWNER_ACCEPTANCE_CHECKLIST.execution.gcpMutationAllowed,
  trackAFinalExportReady: SOUND_MUSIC_AUDIO_OWNER_ACCEPTANCE_CHECKLIST.execution.trackAFinalExportReady,
  trackBExecutionAccepted: SOUND_MUSIC_AUDIO_OWNER_ACCEPTANCE_CHECKLIST.execution.trackBExecutionAccepted,
  recommendedImmediateNextPrompt: canonicalChecklist.recommendedImmediateNextPrompt,
}, null, 2))
