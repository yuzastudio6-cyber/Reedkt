import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'

import {
  createEditLevelMarkerContextPolicyModel,
  createEditLevelSourceContextLayerListModel,
  createEditLevelSourceUnderstandingFallbackNoticeModel,
  createEditLevelSourceUnderstandingSummaryModel,
  loadEditLevelSourceUnderstandingForUI,
} from '../../src/lib/edit-level-source-understanding-ui-adapter'
import {
  createEditLevelMarkerContextPolicy,
  createEditLevelQwenContextPolicy,
  createEditLevelSourceUnderstandingPolicyPackage,
  createEditLevelSourceUnderstandingSideEffectFlags,
  listEditLevelSourceUnderstandingLayerDefinitions,
} from '../../src/lib/edit-level-source-understanding-rules'
import {
  createEditLevelSourceUnderstandingTechnicalSummary,
  createEditLevelSourceUnderstandingUserSummary,
  findEditLevelSourceLayerRoute,
} from '../../src/lib/edit-level-source-understanding-summaries'
import {
  createMockEditLevelSourceUnderstandingPackage,
  listEditLevelSourceUnderstandingLayers,
  listMockEditLevelSourceUnderstandingScenarios,
  runMockEditLevelSourceUnderstandingFlow,
  runMockMarkerContextPolicyFlow,
  runMockQwenContextPolicyFlow,
  runMockSourceUnderstandingReadinessFlow,
  runMockSourceUnderstandingValidationFlow,
  validateEditLevelSourceUnderstandingPackage,
} from '../../src/backend'
import type {
  EditLevelSourceUnderstandingLayerId,
  EditLevelSourceUnderstandingPolicyPackage,
  EditLevelSourceUnderstandingSideEffectFlags,
} from '../../src/types'

const requiredFiles = [
  'src/types/edit-level-source-understanding.ts',
  'src/lib/edit-level-source-understanding-rules.ts',
  'src/lib/edit-level-source-understanding-ui-adapter.ts',
  'src/lib/edit-level-source-understanding-summaries.ts',
  'src/backend/edit-level-source-understanding/edit-level-source-understanding-layer-registry.ts',
  'src/backend/edit-level-source-understanding/edit-level-source-understanding-routing-service.ts',
  'src/backend/edit-level-source-understanding/edit-level-marker-context-policy-service.ts',
  'src/backend/edit-level-source-understanding/edit-level-qwen-context-policy-service.ts',
  'src/backend/edit-level-source-understanding/edit-level-source-understanding-fallback-service.ts',
  'src/backend/edit-level-source-understanding/edit-level-source-understanding-validation-service.ts',
  'src/backend/edit-level-source-understanding/edit-level-source-understanding-summary-service.ts',
  'src/backend/edit-level-source-understanding/mock-edit-level-source-understanding-scenarios.ts',
  'src/backend/orchestrators/mock-edit-level-source-understanding-orchestrator.ts',
  'src/backend/contracts/edit-level-source-understanding-contracts.ts',
  'src/components/edit-level/EditLevelSourceUnderstandingSummary.tsx',
  'src/components/edit-level/EditLevelSourceContextLayerList.tsx',
  'src/components/edit-level/EditLevelMarkerContextPolicyCard.tsx',
  'src/components/edit-level/EditLevelSourceUnderstandingFallbackNotice.tsx',
  'server/smoke/edit-level-source-understanding-smoke.ts',
  'tests/e2e/edit-level-source-understanding.spec.ts',
  'docs/edit-level-source-understanding-router.md',
  'docs/edit-level-source-understanding-layers.md',
  'docs/edit-level-marker-context-policy.md',
  'docs/edit-level-qwen-context-policy.md',
  'docs/edit-level-source-understanding-by-level.md',
  'docs/edit-level-source-understanding-ui.md',
  'docs/edit-level-source-understanding-boundary.md',
  'docs/edit-level-source-understanding-next-qwen-profile.md',
]

const expectedLayerIds: EditLevelSourceUnderstandingLayerId[] = [
  'source_metadata',
  'browser_local_playback',
  'media_extraction_metadata',
  'keyframe_sampling_plan',
  'speech_transcript',
  'qwen25vl_visual_segments',
  'qwen25vl_marker_windows',
  'audio_soundsync_segments',
  'graphic_text_segments',
  'preference_dna_context',
  'edit_brief_marker_context',
  'marker_context_package',
  'source_video_understanding_package',
  'qwen3_reasoning_context',
]

const falseFlagKeys: Array<Exclude<keyof EditLevelSourceUnderstandingSideEffectFlags, 'mockOnly'>> = [
  'providerCallMade',
  'qwen3CallMade',
  'qwen25vlCallMade',
  'deepSeekCallMade',
  'mediaProcessingStarted',
  'transcriptStarted',
  'workerJobCreated',
  'renderJobCreated',
  'progressStarted',
  'creditReservedOrSpent',
  'supabaseReadMade',
  'supabaseWriteMade',
  'fileBytesRead',
  'externalUrlFetched',
  'sourceUnderstandingToolExecuted',
]

function repoPath(filePath: string) {
  return new URL(`../../${filePath}`, import.meta.url)
}

function readRepoFile(filePath: string) {
  return readFileSync(repoPath(filePath), 'utf8')
}

function assertNoSideEffects(flags: EditLevelSourceUnderstandingSideEffectFlags) {
  assert.equal(flags.mockOnly, true)

  for (const flagKey of falseFlagKeys) {
    assert.equal(flags[flagKey], false, `${flagKey} must remain false`)
  }
}

function assertPackageNoSideEffects(routingPackage: EditLevelSourceUnderstandingPolicyPackage) {
  assertNoSideEffects(routingPackage)
  assertNoSideEffects(routingPackage.sideEffectFlags)

  for (const layer of routingPackage.layers) {
    assertNoSideEffects(layer)
    assertNoSideEffects(layer.sideEffectFlags)
  }
}

for (const filePath of requiredFiles) {
  assert.equal(existsSync(repoPath(filePath)), true, `Missing RP-EDITLEVEL-06 file: ${filePath}`)
}

const packageJson = JSON.parse(readRepoFile('package.json')) as { scripts?: Record<string, string> }
assert.equal(packageJson.scripts?.['smoke:edit-level-source-understanding'], 'tsx server/smoke/edit-level-source-understanding-smoke.ts')

const definitions = listEditLevelSourceUnderstandingLayerDefinitions()
assert.equal(definitions.length, 14)
assert.deepEqual(definitions.map((definition) => definition.layerId), expectedLayerIds)
assert.equal(listEditLevelSourceUnderstandingLayers().layerCount, 14)

const normal = createEditLevelSourceUnderstandingPolicyPackage('normal')
const premium = createEditLevelSourceUnderstandingPolicyPackage('premium')
const ultra = createEditLevelSourceUnderstandingPolicyPackage('ultra_premium')

assert.equal(normal.sourceUnderstandingDepth, 'metadata_and_targeted_context')
assert.equal(premium.sourceUnderstandingDepth, 'key_moments_and_marker_windows')
assert.equal(ultra.sourceUnderstandingDepth, 'scene_level_deep_context')

for (const routingPackage of [normal, premium, ultra]) {
  assert.equal(routingPackage.layers.length, 14)
  assert.equal(validateEditLevelSourceUnderstandingPackage({ routingPackage }).ok, true)
  assertPackageNoSideEffects(routingPackage)
}

assert.equal(findEditLevelSourceLayerRoute(normal, 'source_metadata').requiredness, 'required')
assert.equal(findEditLevelSourceLayerRoute(normal, 'qwen25vl_visual_segments').requiredness, 'targeted')
assert.equal(findEditLevelSourceLayerRoute(normal, 'speech_transcript').requiredness, 'targeted')
assert.equal(findEditLevelSourceLayerRoute(normal, 'source_video_understanding_package').requiredness, 'future_only')
assert.equal(findEditLevelSourceLayerRoute(premium, 'source_video_understanding_package').requiredness, 'recommended')
assert.equal(findEditLevelSourceLayerRoute(premium, 'qwen25vl_marker_windows').requiredness, 'recommended')
assert.equal(findEditLevelSourceLayerRoute(premium, 'speech_transcript').requiredness, 'recommended')
assert.equal(findEditLevelSourceLayerRoute(ultra, 'qwen25vl_visual_segments').requiredness, 'required')
assert.equal(findEditLevelSourceLayerRoute(ultra, 'speech_transcript').requiredness, 'required')
assert.equal(findEditLevelSourceLayerRoute(ultra, 'source_video_understanding_package').userFacingSummary.includes('strongly recommended'), true)

assert.equal(createEditLevelMarkerContextPolicy('normal').windowBeforeSeconds, 5)
assert.equal(createEditLevelMarkerContextPolicy('normal').windowAfterSeconds, 5)
assert.equal(createEditLevelMarkerContextPolicy('premium').windowBeforeSeconds, 10)
assert.equal(createEditLevelMarkerContextPolicy('premium').windowAfterSeconds, 10)
assert.equal(createEditLevelMarkerContextPolicy('ultra_premium').windowBeforeSeconds, 15)
assert.equal(createEditLevelMarkerContextPolicy('ultra_premium').windowAfterSeconds, 15)
assert.equal(createEditLevelMarkerContextPolicy('ultra_premium').includePlanHintHistory, true)

assert.equal(createEditLevelQwenContextPolicy('normal').qwenContextDepth, 'compact')
assert.equal(createEditLevelQwenContextPolicy('premium').qwenContextDepth, 'enhanced')
assert.equal(createEditLevelQwenContextPolicy('ultra_premium').qwenContextDepth, 'studio')
assert.equal(createEditLevelQwenContextPolicy('ultra_premium').includePlanHistory, true)

const unsafeProvider = {
  ...premium,
  providerCallMade: true,
  sideEffectFlags: {
    ...premium.sideEffectFlags,
    providerCallMade: true,
  },
} as never
const unsafeMedia = {
  ...premium,
  mediaProcessingStarted: true,
  sideEffectFlags: {
    ...premium.sideEffectFlags,
    mediaProcessingStarted: true,
  },
} as never
const unsafeWorker = {
  ...premium,
  workerJobCreated: true,
  sideEffectFlags: {
    ...premium.sideEffectFlags,
    workerJobCreated: true,
  },
} as never
const unsafeRender = {
  ...premium,
  renderJobCreated: true,
  sideEffectFlags: {
    ...premium.sideEffectFlags,
    renderJobCreated: true,
  },
} as never
const unsafeCredit = {
  ...premium,
  creditReservedOrSpent: true,
  sideEffectFlags: {
    ...premium.sideEffectFlags,
    creditReservedOrSpent: true,
  },
} as never
const unsafeFileBytes = {
  ...premium,
  fileBytesRead: true,
  sideEffectFlags: {
    ...premium.sideEffectFlags,
    fileBytesRead: true,
  },
} as never
const unsafeExternalFetch = {
  ...premium,
  externalUrlFetched: true,
  sideEffectFlags: {
    ...premium.sideEffectFlags,
    externalUrlFetched: true,
  },
} as never

assert.equal(validateEditLevelSourceUnderstandingPackage({ routingPackage: unsafeProvider }).blocked, true)
assert.equal(validateEditLevelSourceUnderstandingPackage({ routingPackage: unsafeMedia }).blocked, true)
assert.equal(validateEditLevelSourceUnderstandingPackage({ routingPackage: unsafeWorker }).blocked, true)
assert.equal(validateEditLevelSourceUnderstandingPackage({ routingPackage: unsafeRender }).blocked, true)
assert.equal(validateEditLevelSourceUnderstandingPackage({ routingPackage: unsafeCredit }).blocked, true)
assert.equal(validateEditLevelSourceUnderstandingPackage({ routingPackage: unsafeFileBytes }).blocked, true)
assert.equal(validateEditLevelSourceUnderstandingPackage({ routingPackage: unsafeExternalFetch }).blocked, true)

assert.equal(loadEditLevelSourceUnderstandingForUI('premium').level, 'premium')
assert.equal(createEditLevelSourceUnderstandingSummaryModel('normal').depthLabel, 'metadata + targeted context')
assert.equal(createEditLevelSourceUnderstandingSummaryModel('premium').depthLabel, 'key moments + marker windows')
assert.equal(createEditLevelSourceUnderstandingSummaryModel('ultra_premium').depthLabel, 'scene-level context')
assert.equal(createEditLevelSourceContextLayerListModel('ultra_premium').futureGated.length > 0, true)
assert.equal(createEditLevelMarkerContextPolicyModel('premium').windowLabel.includes('10s'), true)
assert.equal(createEditLevelSourceUnderstandingFallbackNoticeModel('normal').notices.length > 0, true)

assert.equal(createMockEditLevelSourceUnderstandingPackage({ level: 'normal' }).sourceUnderstandingDepth, 'metadata_and_targeted_context')
assert.equal(runMockEditLevelSourceUnderstandingFlow('ultra_premium').nextStep, 'RP-EDITLEVEL-07 - Level-Aware Qwen Planning Profile')
assert.equal(runMockEditLevelSourceUnderstandingFlow('ultra_premium').selectedPackage.sourceUnderstandingDepth, 'scene_level_deep_context')
assert.equal(runMockMarkerContextPolicyFlow().length, 3)
assert.equal(runMockQwenContextPolicyFlow().length, 3)
assert.equal(runMockSourceUnderstandingValidationFlow().every((result) => result.ok), true)
assert.equal(runMockSourceUnderstandingReadinessFlow().allSideEffectsFalse, true)
assert.equal(listMockEditLevelSourceUnderstandingScenarios().length >= 72, true)
assert.equal(createEditLevelSourceUnderstandingUserSummary('premium').includes('key visual moments'), true)
assert.equal(createEditLevelSourceUnderstandingTechnicalSummary('premium').includes('all side-effect flags remain false'), true)
assertNoSideEffects(createEditLevelSourceUnderstandingSideEffectFlags())

for (const filePath of [
  'src/components/edit-level/EditLevelSourceUnderstandingSummary.tsx',
  'src/components/edit-level/EditLevelSourceContextLayerList.tsx',
  'src/components/edit-level/EditLevelMarkerContextPolicyCard.tsx',
  'src/components/edit-level/EditLevelSourceUnderstandingFallbackNotice.tsx',
  'src/pages/CreateProjectPage.tsx',
  'src/components/editor/InlineEditLevelCard.tsx',
  'src/components/editor/InlinePlanningContextCard.tsx',
  'src/components/editor/InlineCompiledIntentCard.tsx',
]) {
  const source = readRepoFile(filePath)
  assert.equal(source.includes('../backend'), false, `${filePath} must not import backend modules`)
  assert.equal(source.includes('MockDatabase'), false, `${filePath} must not reference MockDatabase`)
}

const docsText = requiredFiles
  .filter((filePath) => filePath.startsWith('docs/'))
  .map(readRepoFile)
  .join('\n')

for (const term of [
  'source understanding routing only',
  'no tools execute',
  'Qwen 3.7',
  'Qwen2.5-VL',
  'no media processing',
  'render',
  'credits',
  'RP-EDITLEVEL-07',
]) {
  assert.ok(docsText.includes(term), `RP-EDITLEVEL-06 docs must include: ${term}`)
}

const migrationCount = readdirSync(new URL('../../supabase/migrations', import.meta.url), { withFileTypes: true })
  .filter((entry) => entry.isFile())
  .length
assert.equal(migrationCount, 24, 'RP-EDITLEVEL-06 must not create or modify migration files.')

console.log('edit-level-source-understanding-smoke passed')
