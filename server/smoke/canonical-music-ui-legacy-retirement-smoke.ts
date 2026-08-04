import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { LegacyMusicPlanningCompatibilityAdapter } from '../edit-skills/music/music-legacy-compatibility-adapter'
import { projectCanonicalMusicResultForUi } from '../edit-skills/music/music-ui-projection'
import { makeCanonicalMusicRequest } from './canonical-music-test-fixtures'
import { createCanonicalMusicTestRuntime } from './canonical-music-test-runtime'

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const root = resolve(process.cwd())
const canonicalFiles = [
  'server/edit-skills/music/canonical-music-skill-service.ts',
  'server/edit-skills/music/music-route-executor.ts',
  'server/edit-skills/music/music-execution-graph.ts',
  'server/music/index.ts',
]
const forbiddenCanonicalImports = [
  'src/backend/providers/lyria',
  'backend/providers/lyria',
  'src/backend/workers/lyria',
  'backend/workers/lyria',
  'sound-route-executor',
  'ffmpeg-audio-adapter',
  'local-audio-processor',
  'SOUND_MUSIC_AUDIO',
]
for (const file of canonicalFiles) {
  const source = await readFile(resolve(root, file), 'utf8')
  for (const forbidden of forbiddenCanonicalImports) {
    check(!source.includes(forbidden), `${file} must not import or name legacy authority ${forbidden}.`)
  }
}

const activeUi = await readFile(resolve(root, 'src/components/editor/music/MusicPlanChatFlow.tsx'), 'utf8')
check(!activeUi.includes('createMusicChatUiData'), 'Active Music UI must not use the Lake Como mock fixture.')
check(!activeUi.includes('setTimeout'), 'Active Music UI must not simulate provider progress.')
check(!activeUi.includes('runMock'), 'Active Music UI must not use mock QA as runtime evidence.')
check(activeUi.includes('CanonicalMusicUiProjection'), 'Active Music UI must consume the canonical read-only projection.')

const legacyWorker = await readFile(resolve(root, 'src/backend/workers/lyria-worker-skeleton.ts'), 'utf8')
check(legacyWorker.includes('usableForRender: false'), 'Legacy metadata-only Music output must not be render-ready.')
check(legacyWorker.includes('Fixture-only Music metadata'), 'Legacy worker must label output as fixture-only.')

const runtime = await createCanonicalMusicTestRuntime()
const request = makeCanonicalMusicRequest({
  requestId: 'music-ui-retirement',
  mode: 'planning',
  cues: [],
  musicEnabled: false,
  allowGeneration: false,
})
const plan = await runtime.music.plan(request)
const compatibility = new LegacyMusicPlanningCompatibilityAdapter(runtime.music)
const receipt = await compatibility.plan(request)
check(receipt.legacyAuthority === 'fixture_only', 'Legacy compatibility must remain fixture-only.')
check(receipt.providerDispatchAllowed === false && receipt.workerDispatchAllowed === false,
  'Legacy compatibility must not dispatch provider or worker work.')
let legacyExecutionBlocked = false
try {
  compatibility.execute()
} catch {
  legacyExecutionBlocked = true
}
check(legacyExecutionBlocked, 'Legacy compatibility execution must fail closed.')

const projection = projectCanonicalMusicResultForUi({
  result: plan.plannedResult,
  plan,
  estimate: plan.estimate,
  qa: await runtime.music.qa({ result: plan.plannedResult }),
})
const serialized = JSON.stringify(projection)
check(projection.readOnlyProjection, 'Music UI projection must be read-only.')
check(projection.musicNeed.generationWasAutomaticBecauseNoUpload === false,
  'No uploaded Music must not force generation in the UI projection.')
for (const forbidden of ['storageObjectId', 'privateOutputScopeId', 'providerPayload', 'apiKey', 'signedUrl']) {
  check(!serialized.includes(forbidden), `Music UI projection leaked ${forbidden}.`)
}

console.log(JSON.stringify({
  canonicalMusicUi: 'read_only_artifact_projection',
  legacyCompatibility: 'planning_only_fixture',
  legacyExecutionBlocked,
  mockProgressRetired: true,
  mockRenderReadyRetired: true,
}, null, 2))
