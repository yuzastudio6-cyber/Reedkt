import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  StandaloneCanonicalSoundSkillService,
  StructuredRequestSoundContextLoader,
} from '../edit-skills/sound'
import { buildSoundRequest } from './sound-test-fixtures'
import { createCanonicalSoundTestRuntime } from './canonical-sound-test-runtime'

const failures: string[] = []
async function verify(name: string, check: () => void | Promise<void>) {
  try { await check() } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    failures.push(`${name}: ${message.split('Input:')[0].trim()}`)
  }
}

const runtime = await createCanonicalSoundTestRuntime()
const structured = new StructuredRequestSoundContextLoader()
const context = {
  async load(request: Parameters<StructuredRequestSoundContextLoader['load']>[0]) {
    const loaded = await structured.load(request)
    return {
      ...loaded,
      controllerContext: {
        sourceMatches: request.eventAnchors.slice(0, 1).map((event) => ({
          anchorId: event.anchorId,
          artifact: request.sourceAudioRefs[0]!,
          usable: true,
          requiresRepair: false,
        })),
      },
    }
  },
}
const service = new StandaloneCanonicalSoundSkillService({ artifacts: runtime.resolver, context })

try {
  await verify('peer support compiles executable child units', async () => {
    const request = buildSoundRequest({
      callerType: 'living_frame', job: 'support_living_frame_sound', mode: 'private_internal',
      eventFrames: [30, 90], allowProviderGeneration: false,
    })
    const plan = await service.plan(request)
    assert.ok(plan.executionGraph.units.some((unit) => unit.unitKind !== 'planning_only'))
    assert.ok(plan.executionGraph.units.every((unit) => unit.unitKind !== 'planning_only'))
  })

  await verify('full-video parent compiles bounded executable scene units', async () => {
    const request = buildSoundRequest({
      job: 'full_video_sound_pass', mode: 'private_internal', eventFrames: [30, 180],
      audioRanges: [
        { rangeId: 'whole-scene-a', startFrame: 0, endFrameExclusive: 120 },
        { rangeId: 'whole-scene-b', startFrame: 120, endFrameExclusive: 300 },
      ],
    })
    const plan = await service.plan(request)
    assert.ok(plan.executionGraph.units.length >= 2)
    assert.ok(plan.executionGraph.units.every((unit) => unit.unitKind !== 'planning_only'))
  })

  await verify('mixed cue plan resolves more than one exact route', async () => {
    const request = buildSoundRequest({
      job: 'design_scene_sound', mode: 'fixture', eventFrames: [30, 180],
      allowProviderGeneration: true,
    })
    const plan = await service.plan(request)
    assert.ok(new Set(plan.executionGraph.units.map((unit) => unit.route.routeKey)).size > 1)
  })

  const graphSource = await readFile('server/edit-skills/sound/sound-execution-graph.ts', 'utf8')
  const executorSource = await readFile('server/edit-skills/sound/sound-route-executor.ts', 'utf8')
  const handlerSource = await readFile('server/edit-skills/sound/sound-operation-handler-registry.ts', 'utf8')
  const contractSource = await readFile('server/sound/sound-contracts.ts', 'utf8')
  const localSource = await readFile('server/sound/sound-local-audio-processor.ts', 'utf8')
  const serviceSource = await readFile('server/edit-skills/sound/canonical-sound-skill-service.ts', 'utf8')

  await verify('graph carries cross-unit dependency edges and completion policy', () => {
    assert.match(graphSource, /dependencyEdges/)
    assert.match(graphSource, /completionPolicy/)
    assert.doesNotMatch(graphSource, /const baseRoute/)
  })
  await verify('unit dependencies are topologically validated', () => {
    assert.match(graphSource, /cycle/i)
    assert.match(executorSource, /topologicalUnits/)
  })
  await verify('failed prerequisites block dependent units', () => {
    assert.match(executorSource, /blocked_dependency.*dependsOnUnitIds|dependsOnUnitIds.*blocked_dependency/s)
  })
  await verify('handler registration uses exact operation and profile identity', () => {
    assert.match(handlerSource, /operationProfileVersion/)
    assert.match(handlerSource, /operationVersion/)
    assert.doesNotMatch(handlerSource, /handlerByTool/)
  })
  await verify('named step output bundles are required', () => {
    assert.match(contractSource + executorSource, /SoundStepOutputBundle/)
    assert.match(executorSource, /validate.*output.*binding/is)
  })
  await verify('provider attempt step produces a concrete attempt output', () => {
    assert.doesNotMatch(executorSource, /provider_attempt_planned/)
    assert.match(executorSource, /providerAttemptRecord/)
  })
  await verify('route QA step produces a typed per-unit QA report', () => {
    assert.doesNotMatch(executorSource, /sound\.qa\.handler/)
    assert.match(executorSource, /perUnitQa/)
  })
  await verify('caller receipt step produces a typed output', () => {
    assert.match(executorSource, /callerReceiptOutput/)
  })
  await verify('artifact commit and provenance outputs describe real verification or creation', () => {
    assert.match(executorSource, /artifactCommitRecord/)
    assert.match(executorSource, /provenanceRecord/)
  })
  await verify('provider candidates have independent processing receipts and selection record', () => {
    assert.match(contractSource + executorSource, /candidateProcessingReceipts/)
    assert.match(contractSource + executorSource, /candidateSelectionRecord/)
  })
  await verify('localized revision has a real execution method', () => {
    assert.match(serviceSource, /executeRevision/)
    assert.match(contractSource, /replacedUnitIds/)
  })
  await verify('completed handoff requires exact artifact references', () => {
    assert.match(contractSource, /finalSoundArtifactReferences/)
    assert.match(contractSource, /intentionalNoSound/)
    assert.match(contractSource, /authorizedRange/)
  })
  await verify('mix render specification applies advertised bounded profiles', () => {
    assert.match(contractSource + localSource, /CompiledSoundMixRenderSpec/)
    for (const field of ['gainEnvelope', 'eqProfile', 'dynamicsProfile', 'perspectiveProfile', 'roomProfile']) {
      assert.match(contractSource + localSource, new RegExp(field))
    }
  })
  await verify('ducking QA measures protected overlap windows', () => {
    assert.match(contractSource + executorSource, /measuredDuckingDb/)
    assert.match(contractSource + executorSource, /protectedRange/)
  })
  await verify('pan QA verifies channel energy direction', () => {
    assert.match(contractSource + executorSource, /expectedPanDirection/)
    assert.match(contractSource + executorSource, /measuredChannelDeltaDb/)
  })
  await verify('gain-envelope and fade QA use measured windows', () => {
    assert.match(contractSource + executorSource, /gainEnvelopeMeasurements/)
    assert.match(contractSource + executorSource, /fadeMeasurements/)
  })
  await verify('local output identity binds the operation spec', () => {
    assert.match(localSource, /operationSpecHash/)
    assert.match(localSource, /idempotency collision/i)
  })
  await verify('replay checksum is computed from committed bytes', () => {
    assert.match(localSource, /readFile\(committed\.absolutePath\)/)
    assert.doesNotMatch(localSource, /checksumSha256 = createHash\('sha256'\)\.update\(bytes\)/)
  })
  await verify('fallback behavior is executable and evidence-bound', () => {
    assert.match(executorSource, /fallbackDecision/)
    assert.match(contractSource, /fallbackEvidence/)
  })
  await verify('per-mode capability matrix covers composite execution', () => {
    assert.match(contractSource + graphSource, /CompositeSoundExecutionPolicy/)
    assert.match(contractSource + graphSource, /privateInternalExecution/)
  })
} finally {
  await runtime.cleanup()
}

if (failures.length > 0) {
  throw new Error(`Canonical Sound final-closure regressions:\n${failures.join('\n')}`)
}

console.log('Canonical Sound final-closure regression smoke passed.')
