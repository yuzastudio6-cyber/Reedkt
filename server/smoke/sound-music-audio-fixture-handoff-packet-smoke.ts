import { readFileSync } from 'node:fs'
import {
  SOUND_MUSIC_AUDIO_GENERATED_LOCAL_FIXTURE_SPEC,
  type SoundMusicAudioGeneratedLocalFixtureOwner,
} from '../../src/backend/mock/mock-sound-music-audio-generated-local-fixture-spec'
import {
  SoundMusicAudioFixtureSpecHandoffPanel,
  buildSoundMusicAudioFixtureSpecHandoff,
  createMockSoundMusicAudioChatCardProps,
  type SoundMusicAudioFixtureSpecHandoffDisplay,
} from '../../src/components/editor/sound'

const packetPath = 'docs/sound-music-audio-generated-local-fixture-handoff-packet.md'
const scriptName = 'smoke:sound-music-audio-fixture-handoff-packet'
const scriptCommand = 'tsx server/smoke/sound-music-audio-fixture-handoff-packet-smoke.ts'

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

function requireText(source: string, text: string, message = `Packet must include: ${text}`): void {
  check(source.includes(text), message)
}

function assertNoConcreteForbiddenText(source: string, path = 'packet'): void {
  const lower = source.toLowerCase()
  check(!/^https?:\/\//im.test(source), `${path} must not contain concrete public URLs.`)
  check(!lower.includes('x-goog-signature'), `${path} must not contain signed URL signatures.`)
  check(!lower.includes('x-amz-signature'), `${path} must not contain signed URL signatures.`)
  check(!lower.includes('signature='), `${path} must not contain signed URL signature query values.`)
  check(!lower.includes('token='), `${path} must not contain tokenized URL values.`)
  check(!lower.includes('storage.googleapis.com'), `${path} must not contain storage public URLs.`)
  check(!lower.includes('gs://'), `${path} must not contain concrete storage URIs.`)
  check(!lower.includes('gcs://'), `${path} must not contain concrete storage URIs.`)
  check(!lower.includes('api_key'), `${path} must not contain API key values.`)
  check(!lower.includes('apikey'), `${path} must not contain API key values.`)
  check(!lower.includes('provider_secret'), `${path} must not contain provider secret values.`)
  check(!lower.includes('secret='), `${path} must not contain secret values.`)
  check(!lower.includes('rawworkerprompt'), `${path} must not contain raw worker prompt fields.`)
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
    check(!normalizedKey.includes('rawworkerprompt'), `${path}.${key} must not expose raw worker prompt fields.`)
    check(!normalizedKey.includes('apikey'), `${path}.${key} must not expose API key fields.`)
    check(!normalizedKey.includes('api_key'), `${path}.${key} must not expose API key fields.`)
    check(normalizedKey !== 'servicerolekey', `${path}.${key} must not expose service-role key fields.`)
    check(normalizedKey !== 'service_role_key', `${path}.${key} must not expose service-role key fields.`)

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
      check(!normalizedValue.includes('service_role'), `${path}.${key} must not contain service-role values.`)
      check(!normalizedValue.includes('service-role'), `${path}.${key} must not contain service-role values.`)
      check(!normalizedValue.includes('provider_secret'), `${path}.${key} must not contain provider secret values.`)
      check(!normalizedValue.includes('secret='), `${path}.${key} must not contain secret values.`)
      check(!/akia[0-9a-z]{12,}/i.test(nested), `${path}.${key} must not contain access key shapes.`)
      check(!/sk-[a-z0-9_-]{12,}/i.test(nested), `${path}.${key} must not contain provider credential shapes.`)
    }

    assertNoForbiddenValues(nested, `${path}.${key}`)
  }
}

function requireOwner(
  handoff: SoundMusicAudioFixtureSpecHandoffDisplay,
  owner: SoundMusicAudioGeneratedLocalFixtureOwner,
): void {
  const ownerEntry = handoff.ownerAcceptanceMap.find((candidate) => candidate.owner === owner)
  check(Boolean(ownerEntry), `Fixture handoff display must include ${owner}.`)
  check(ownerEntry?.requiredBeforeFixtureExecution === true, `${owner} must be required before fixture execution.`)
  check(ownerEntry?.mayExecute === false, `${owner} must not execute from this display.`)
}

function assertFixtureDisplay(handoff: SoundMusicAudioFixtureSpecHandoffDisplay): void {
  check(handoff.workstream === 'SOUND_MUSIC_AUDIO', 'Fixture handoff display must report SOUND_MUSIC_AUDIO.')
  check(handoff.mode === 'generated_local_fixture_spec_only', 'Fixture handoff mode must match spec mode.')
  check(handoff.currentUnlockStage === 'dry_run_passed', 'Current stage must be dry_run_passed.')
  check(handoff.targetFutureUnlockStage === 'generated_local_fixture_passed', 'Target future stage must be generated_local_fixture_passed.')
  check(handoff.claimsGeneratedLocalFixturePassed === false, 'Generated/local fixture passed must not be claimed.')
  check(handoff.handoffOnly === true, 'Fixture display must be handoff-only.')
  check(handoff.expectedChecksumAlgorithm === 'sha256', 'Fixture handoff must surface sha256 checksum expectation.')
  check(handoff.expectedChecksumValue.includes('placeholder-mock-only-sha256'), 'Checksum must remain placeholder/mock-only.')
  check(handoff.expectedPrivatePath.startsWith('placeholder-private-path-only/'), 'Private path must remain placeholder/private-path-only.')
  check(handoff.sourceOfTruthPath.requiresSupabaseRow === true, 'Supabase row requirement must be shown.')
  check(handoff.sourceOfTruthPath.requiresPrivateGcsPath === true, 'Private GCS path requirement must be shown.')
  check(handoff.sourceOfTruthPath.requiresManifest === true, 'Manifest requirement must be shown.')
  check(handoff.sourceOfTruthPath.requiresChecksum === true, 'Checksum requirement must be shown.')
  check(handoff.sourceOfTruthPath.requiresApprovedPlanSnapshot === true, 'Approved snapshot requirement must be shown.')
  check(handoff.sourceOfTruthPath.signedUrlsAreSourceOfTruth === false, 'Signed URLs must not be source of truth.')
  check(handoff.sourceOfTruthPath.publicUrlsAllowed === false, 'Public URLs must be blocked.')

  for (const gate of handoff.noExecutionGates) {
    check(gate.value === false, `No-execution gate ${gate.label} must be false.`)
  }

  check(handoff.lyriaBoundary.musicOnly === true, 'Lyria must remain music-only.')
  check(handoff.lyriaBoundary.allowedFamilies.includes('music_cue'), 'Lyria must include music cue planning.')
  check(handoff.lyriaBoundary.allowedFamilies.includes('soundtrack_layer'), 'Lyria must include soundtrack planning.')
  check(handoff.lyriaBoundary.allowedFamilies.includes('audio_mood_design'), 'Lyria must include mood planning.')
  check(!handoff.lyriaBoundary.allowedFamilies.includes('action_foley_sfx'), 'Lyria must not be SFX.')
  check(!handoff.lyriaBoundary.allowedFamilies.includes('ambient_everyday_soundscape'), 'Lyria must not be ambience.')
  check(handoff.lyriaBoundary.sfxAllowed === false, 'Lyria SFX use must be blocked.')
  check(handoff.lyriaBoundary.foleyAllowed === false, 'Lyria foley use must be blocked.')
  check(handoff.lyriaBoundary.ambienceAllowed === false, 'Lyria ambience use must be blocked.')
  check(handoff.lyriaBoundary.generationAllowed === false, 'Lyria generation must be blocked.')
  check(handoff.lyriaBoundary.providerGatewayOwnerRequired === true, 'Provider Gateway must be required for Lyria.')

  for (const [providerId, mayCall] of Object.entries(handoff.providerCallAllowedByProvider)) {
    check(mayCall === false, `${providerId} provider call must be blocked.`)
  }

  for (const owner of [
    'SOUND_MUSIC_AUDIO',
    'SUPABASE_RLS_STORAGE_DATABASE',
    'WORKER_RUNTIME_JOBS',
    'PROVIDER_GATEWAY_MODELS',
    'OBSERVABILITY_AUDIT_COST',
    'BILLING_STRIPE_CREDITS',
    'TRACK_A_RENDER_EXPORT',
    'TRACK_B_MEDIA_PROCESSING',
  ] satisfies SoundMusicAudioGeneratedLocalFixtureOwner[]) {
    requireOwner(handoff, owner)
  }

  for (const blockedUse of [
    'provider_gateway_handoff_required',
    'worker_runtime_handoff_required',
    'supabase_mutation_blocked',
    'storage_object_not_allowed',
    'signed_url_blocked',
    'public_artifact_blocked',
    'generated_asset_not_allowed',
    'credit_approval_required',
    'final_render_export_not_owned',
  ]) {
    check(handoff.blockedUses.includes(blockedUse), `Blocked use ${blockedUse} must be shown.`)
  }

  assertNoForbiddenValues(handoff, 'fixtureSpecHandoff')
}

const packet = readFileSync(packetPath, 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>
}
const cardSource = readFileSync('src/components/editor/sound/SoundMusicAudioPlanCard.tsx', 'utf8')
const panelSource = readFileSync('src/components/editor/sound/SoundMusicAudioFixtureSpecHandoffPanel.tsx', 'utf8')
const fixtureSource = readFileSync('src/components/editor/sound/soundMusicAudioChatUiData.ts', 'utf8')

requireText(packet, '# SOUND_MUSIC_AUDIO Generated/Local Fixture Handoff Packet')
requireText(packet, 'Current unlock stage: dry_run_passed.')
requireText(packet, 'Target future stage: generated_local_fixture_passed.')
requireText(packet, 'This packet is handoff-only.')
requireText(packet, 'This packet does not claim generated_local_fixture_passed.')
requireText(packet, 'Supabase row\n+ private GCS path\n+ manifest\n+ checksum\n+ approved plan snapshot')
requireText(packet, 'user/chat request\n→ structured agent findings\n→ edit intents\n→ approved plan snapshot\n→ worker execution')
requireText(packet, 'Raw prompt execution is blocked.')
requireText(packet, 'deterministic fixture spec exists')
requireText(packet, 'it does not create fixture audio')
requireText(packet, 'Lyria boundary is preserved for music, song, and soundtrack planning only')
requireText(packet, 'provider calls are blocked')
requireText(packet, 'worker dispatch is blocked')
requireText(packet, 'Supabase mutation is blocked')
requireText(packet, 'SQL is blocked')
requireText(packet, 'GCP, Docker, Cloud Run, and FFmpeg are blocked')
requireText(packet, 'generated assets are blocked')
requireText(packet, 'public artifacts and signed URLs are blocked')
requireText(packet, 'credits, approvals, reservations, spend, refund, and release are blocked')
requireText(packet, 'Track A final export is blocked')
requireText(packet, 'Track B execution is not accepted')
requireText(packet, '## Fixture Execution Blockers')
requireText(packet, '## Exit Criteria Before generated_local_fixture_passed Can Ever Be Claimed')
requireText(packet, '`SOUND-3D: fixture handoff packet UI surfacing / owner checklist smoke, no artifact creation`')

for (const owner of [
  'SOUND_MUSIC_AUDIO',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'WORKER_RUNTIME_JOBS',
  'PROVIDER_GATEWAY_MODELS',
  'OBSERVABILITY_AUDIT_COST',
  'BILLING_STRIPE_CREDITS',
  'TRACK_A_RENDER_EXPORT',
  'TRACK_B_MEDIA_PROCESSING',
]) {
  requireText(packet, `### ${owner}`, `Packet must include ${owner} owner section.`)
}

for (const blocker of [
  'no real approved snapshot rows',
  'no storage bucket or object records',
  'no generated asset rows',
  'no jobs or job events',
  'no worker runtime configs',
  'no credit rows',
  'RLS, security, and performance review pending',
]) {
  requireText(packet, blocker, `Packet must include fixture blocker: ${blocker}.`)
}

assertNoConcreteForbiddenText(packet)
check(packageJson.scripts?.[scriptName] === scriptCommand, `${scriptName} package script must point at the packet smoke.`)

check(SOUND_MUSIC_AUDIO_GENERATED_LOCAL_FIXTURE_SPEC.claimsGeneratedLocalFixturePassed === false, 'Canonical spec must not claim generated/local fixture passed.')
const canonicalHandoff = buildSoundMusicAudioFixtureSpecHandoff(SOUND_MUSIC_AUDIO_GENERATED_LOCAL_FIXTURE_SPEC)
assertFixtureDisplay(canonicalHandoff)

const props = createMockSoundMusicAudioChatCardProps()
check(Boolean(props.fixtureSpecHandoff), 'Mock chat props must include fixture spec handoff display.')
if (!props.fixtureSpecHandoff) throw new Error('Missing mock fixture spec handoff display.')
assertFixtureDisplay(props.fixtureSpecHandoff)

check(typeof SoundMusicAudioFixtureSpecHandoffPanel === 'function', 'Fixture spec handoff panel must be exported.')
check(cardSource.includes('SoundMusicAudioFixtureSpecHandoffPanel'), 'Sound card must render fixture spec handoff panel.')
check(cardSource.includes('props.fixtureSpecHandoff'), 'Sound card must gate fixture handoff on optional mock props.')
check(fixtureSource.includes('buildSoundMusicAudioFixtureSpecHandoff'), 'Mock chat data must build fixture handoff display data.')
check(!fixtureSource.includes('sound-agent-planner-service'), 'Frontend fixture data must not import backend planner services.')
check(!fixtureSource.includes('mock-sound-music-audio-dry-run-contract'), 'Frontend fixture data must not import dry-run backend helper.')

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
  check(!panelSource.includes(`>${forbiddenLabel}<`), `Fixture handoff panel must not expose ${forbiddenLabel} action labels.`)
}

console.log(JSON.stringify({
  ok: true,
  workstream: 'SOUND_MUSIC_AUDIO',
  smoke: 'sound-music-audio-fixture-handoff-packet',
  currentUnlockStage: canonicalHandoff.currentUnlockStage,
  targetFutureUnlockStage: canonicalHandoff.targetFutureUnlockStage,
  claimsGeneratedLocalFixturePassed: canonicalHandoff.claimsGeneratedLocalFixturePassed,
  handoffOnly: canonicalHandoff.handoffOnly,
  artifactCreated: false,
  mayCallProvider: false,
  mayDispatchWorker: false,
  mayCreateGeneratedAsset: false,
  publicArtifactAllowed: false,
  supabaseMutationAllowed: false,
  gcpMutationAllowed: false,
  trackAFinalExportReady: false,
}, null, 2))
