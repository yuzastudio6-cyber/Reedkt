import { readFileSync } from 'node:fs'

const planPath = 'docs/sound-music-audio-generated-local-fixture-plan.md'
const smokePath = 'server/smoke/sound-music-audio-generated-local-fixture-plan-smoke.ts'
const scriptName = 'smoke:sound-music-audio-generated-local-fixture-plan'
const scriptCommand = 'tsx server/smoke/sound-music-audio-generated-local-fixture-plan-smoke.ts'
const nextPrompt = 'SUPABASE-SOUND-0: Supabase/RLS/Storage local fixture acceptance audit'

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

function requireText(source: string, text: string, message = `Plan must include: ${text}`): void {
  check(source.includes(text), message)
}

function requireAnyText(source: string, texts: string[], message: string): void {
  check(texts.some((text) => source.includes(text)), message)
}

function requireNoText(source: string, text: string, message = `Plan must not include: ${text}`): void {
  check(!source.includes(text), message)
}

const plan = readFileSync(planPath, 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>
}
const smokeSource = readFileSync(smokePath, 'utf8')
const smokeImports = smokeSource
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line.startsWith('import '))

requireText(plan, '# SOUND_MUSIC_AUDIO Generated/Local Fixture Plan')
requireText(plan, 'Current unlock stage: dry_run_passed.')
requireText(plan, 'Target future stage: generated_local_fixture_passed.')
requireText(plan, 'planning-only')
requireText(plan, 'does not create a fixture artifact')
requireText(plan, 'does not claim generated_local_fixture_passed')
requireText(plan, 'SOUND-3A writes no audio file and creates no artifact record.')

requireText(plan, 'Supabase row + private GCS path + manifest + checksum + approved plan snapshot')
requireText(plan, 'user/chat request -> structured agent findings -> edit intents -> approved plan snapshot -> worker execution')
requireText(plan, 'Raw chat must never become direct worker execution.')
requireText(plan, 'Signed URLs must not be source-of-truth evidence.')
requireText(plan, 'no signed URLs as source of truth')
requireText(plan, 'no public artifact')
requireText(plan, 'no generated assets')
requireText(plan, 'no provider call occurs')
requireText(plan, 'no worker dispatch occurs')
requireText(plan, 'no Supabase live mutation occurs')
requireText(plan, 'no GCP, Docker, Cloud Run, Secret Manager, or model download occurs')
requireText(plan, 'no FFmpeg or media processing occurs')
requireText(plan, 'no approval record or credit record is created')

requireText(plan, 'Google Lyria belongs to SOUND_MUSIC_AUDIO only for music, song, and soundtrack planning metadata.')
requireText(plan, 'Lyria must not be used for SFX, foley, transition sounds, whooshes, hits, risers, ambience, everyday soundscape, room tone, or field recording replacement.')
requireText(plan, 'Lyria generation remains disabled.')
requireText(plan, 'Provider Gateway handoff is required before any future real transport.')
requireText(plan, 'Dasheng remains candidate planning metadata only')
requireText(plan, 'Stable Audio remains license-gated candidate planning metadata only')
requireText(plan, 'OpenMOSS remains pending verification')
requireText(plan, 'Meta AudioGen, Woosh, TangoFlux, and public/noncommercial MMAudio remain blocked')
requireText(plan, 'Mirelo and MMAudio real transports remain fail-closed')
requireText(plan, 'AudioFlux and Signalsmith Stretch are analysis/processing-only candidates')
requireText(plan, 'DeepFilterNet, RNNoise, and Demucs remain model-weight/readiness-review gated')

requireText(plan, 'Supabase/RLS/Storage owner acceptance is the next hard blocker before any generated/local fixture execution.')
requireText(plan, 'Worker Runtime owns:')
requireText(plan, 'Track A final composition handoff remains blocked.')
requireText(plan, 'Track B processing execution remains not accepted.')
requireText(plan, 'OBSERVABILITY_AUDIT_COST owns audit/cost evidence acceptance.')
requireText(plan, 'BILLING_STRIPE_CREDITS owns credit and Stripe acceptance.')
requireText(plan, 'Owner Acceptance Map')
requireText(plan, 'Readiness Checklist')
requireText(plan, 'Exit Criteria For The Future Generated/Local Fixture Gate')
requireText(plan, nextPrompt)

requireAnyText(
  plan,
  ['`expectedChecksumAlgorithm` | `sha256`', 'checksum algorithm is declared'],
  'Plan must define checksum expectations.',
)
requireAnyText(
  plan,
  ['private path expectation', 'private storage path expectation is declared'],
  'Plan must define private path expectations.',
)
requireAnyText(
  plan,
  ['source-of-truth row, private path, storage scope, manifest, checksum, and RLS/storage acceptance'],
  'Plan must define Supabase source-of-truth acceptance needs.',
)

for (const owner of [
  'SOUND_MUSIC_AUDIO',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'PROVIDER_GATEWAY_MODELS',
  'WORKER_RUNTIME_JOBS',
  'OBSERVABILITY_AUDIT_COST',
  'BILLING_STRIPE_CREDITS',
  'TRACK_A_RENDER_EXPORT',
  'TRACK_B_MEDIA_PROCESSING',
]) {
  requireText(plan, owner, `Plan must include ${owner} owner mapping.`)
}

for (const forbidden of [
  'generated_local_fixture_passed: passed',
  'generated_local_fixture_passed = true',
  'mayCallProvider=true',
  'mayDispatchWorker=true',
  'mayCreateGeneratedAsset=true',
  'publicArtifactAllowed=true',
  'supabaseMutationAllowed=true',
  'gcpMutationAllowed=true',
  'trackAFinalExportReady=true',
  'trackBExecutionAccepted=true',
]) {
  requireNoText(plan, forbidden)
}

check(packageJson.scripts?.[scriptName] === scriptCommand, `${scriptName} package script must point at the text-only smoke.`)
check(smokeImports.length === 1, 'Plan smoke must only import from node:fs.')
check(smokeImports[0] === "import { readFileSync } from 'node:fs'", 'Plan smoke must not import runtime/provider/worker modules.')

console.log(JSON.stringify({
  ok: true,
  smoke: 'sound-music-audio-generated-local-fixture-plan',
  workstream: 'SOUND_MUSIC_AUDIO',
  planPath,
  currentUnlockStage: 'dry_run_passed',
  targetFutureStage: 'generated_local_fixture_passed',
  planningOnly: true,
  providerCallsAllowed: false,
  workerDispatchAllowed: false,
  supabaseMutationAllowed: false,
  gcpMutationAllowed: false,
  generatedAssetsCreated: false,
  publicArtifactAllowed: false,
  signedUrlsCreated: false,
  creditApprovalRecordsCreated: false,
  trackAFinalExportReady: false,
  trackBExecutionAccepted: false,
  nextPrompt,
}, null, 2))
