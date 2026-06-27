import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'

import {
  createEditLevelToolCapabilityListModel,
  createEditLevelToolCapabilitySummaryModel,
  createEditLevelToolFallbackNoticeModel,
  loadEditLevelToolRoutingForUI,
} from '../../src/lib/edit-level-tool-router-ui-adapter'
import {
  createEditLevelToolRouterSideEffectFlags,
  createEditLevelToolRoutingPackage,
  listEditLevelToolCapabilityDefinitions,
} from '../../src/lib/edit-level-tool-router-rules'
import { createEditLevelToolRouterTechnicalSummary } from '../../src/lib/edit-level-tool-router-summaries'
import {
  listEditLevelToolCapabilities,
  runMockEditLevelToolRouterFlow,
  runMockToolRouterValidationFlow,
  validateEditLevelToolRoutingPackage,
  listMockEditLevelToolRouterScenarios,
} from '../../src/backend'
import type {
  EditLevelToolCapabilityId,
  EditLevelToolRouterSideEffectFlags,
  EditLevelToolRoute,
  EditLevelToolRoutingPackage,
} from '../../src/types'

const requiredFiles = [
  'src/types/edit-level-tool-router.ts',
  'src/lib/edit-level-tool-router-rules.ts',
  'src/lib/edit-level-tool-router-ui-adapter.ts',
  'src/lib/edit-level-tool-router-summaries.ts',
  'src/backend/edit-level-tool-router/edit-level-tool-capability-registry.ts',
  'src/backend/edit-level-tool-router/edit-level-tool-routing-service.ts',
  'src/backend/edit-level-tool-router/edit-level-tool-readiness-service.ts',
  'src/backend/edit-level-tool-router/edit-level-tool-fallback-service.ts',
  'src/backend/edit-level-tool-router/edit-level-tool-router-validation-service.ts',
  'src/backend/edit-level-tool-router/edit-level-tool-router-summary-service.ts',
  'src/backend/edit-level-tool-router/mock-edit-level-tool-router-scenarios.ts',
  'src/backend/orchestrators/mock-edit-level-tool-router-orchestrator.ts',
  'src/backend/contracts/edit-level-tool-router-contracts.ts',
  'src/components/edit-level/EditLevelToolCapabilitySummary.tsx',
  'src/components/edit-level/EditLevelToolCapabilityList.tsx',
  'src/components/edit-level/EditLevelToolCapabilityBadge.tsx',
  'src/components/edit-level/EditLevelToolFallbackNotice.tsx',
  'server/smoke/edit-level-tool-router-smoke.ts',
  'tests/e2e/edit-level-tool-router.spec.ts',
  'docs/edit-level-tool-capability-router.md',
  'docs/edit-level-tool-capability-registry.md',
  'docs/edit-level-tool-routing-by-level.md',
  'docs/edit-level-tool-fallback-policy.md',
  'docs/edit-level-tool-router-ui.md',
  'docs/edit-level-tool-router-boundary.md',
  'docs/edit-level-tool-router-next-source-understanding.md',
]

const falseFlagKeys: Array<Exclude<keyof EditLevelToolRouterSideEffectFlags, 'mockOnly'>> = [
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
  'toolExecutionStarted',
]

function repoPath(filePath: string) {
  return new URL(`../../${filePath}`, import.meta.url)
}

function readRepoFile(filePath: string) {
  return readFileSync(repoPath(filePath), 'utf8')
}

function route(
  routingPackage: EditLevelToolRoutingPackage,
  capabilityId: EditLevelToolCapabilityId,
): EditLevelToolRoute {
  const result = routingPackage.routes.find((item) => item.capabilityId === capabilityId)
  assert.ok(result, `Missing route ${capabilityId} for ${routingPackage.level}`)
  return result
}

function assertNoSideEffects(flags: EditLevelToolRouterSideEffectFlags) {
  assert.equal(flags.mockOnly, true)
  for (const key of falseFlagKeys) {
    assert.equal(flags[key], false, `Expected ${key} to remain false`)
  }
}

function assertPackageNoSideEffects(routingPackage: EditLevelToolRoutingPackage) {
  assertNoSideEffects(routingPackage.sideEffectFlags)
  assertNoSideEffects(routingPackage)
  for (const routeItem of routingPackage.routes) {
    assertNoSideEffects(routeItem.sideEffectFlags)
    assertNoSideEffects(routeItem)
  }
}

for (const filePath of requiredFiles) {
  assert.equal(existsSync(repoPath(filePath)), true, `Missing RP-EDITLEVEL-05 file: ${filePath}`)
}

const definitions = listEditLevelToolCapabilityDefinitions()
assert.equal(definitions.length, 18, 'Router must register the 18 requested capabilities.')

for (const capabilityId of [
  'qwen_3_reasoning',
  'qwen25vl_visual_understanding',
  'speech_transcript',
  'media_extraction',
  'audio_soundsync',
  'graphic_design_understanding',
  'preference_dna',
  'edit_brief',
  'edit_brief_marker_chat',
  'edit_brief_marker_qa',
  'edit_brief_plan_hints',
  'source_video_playback',
  'source_video_understanding_package',
  'media_asset_repository',
  'storage_runtime',
  'deepseek_tool_code',
  'render_worker',
  'credit_gate',
] satisfies EditLevelToolCapabilityId[]) {
  assert.equal(definitions.some((definition) => definition.capabilityId === capabilityId), true, `Missing ${capabilityId}`)
}

const normal = createEditLevelToolRoutingPackage('normal')
const premium = createEditLevelToolRoutingPackage('premium')
const ultra = createEditLevelToolRoutingPackage('ultra_premium')

for (const routingPackage of [normal, premium, ultra]) {
  assert.equal(routingPackage.routes.length, 18)
  assert.equal(routingPackage.mockOnly, true)
  assertPackageNoSideEffects(routingPackage)
  assert.equal(validateEditLevelToolRoutingPackage({ routingPackage }).ok, true)
}

assert.equal(route(normal, 'qwen_3_reasoning').reason.includes('standard'), true)
assert.equal(route(premium, 'qwen_3_reasoning').reason.includes('deeper'), true)
assert.equal(route(ultra, 'qwen_3_reasoning').reason.includes('multi-pass'), true)
assert.equal(route(normal, 'qwen25vl_visual_understanding').requiredness, 'optional')
assert.equal(route(premium, 'qwen25vl_visual_understanding').requiredness, 'recommended')
assert.equal(route(ultra, 'qwen25vl_visual_understanding').requiredness, 'required')
assert.equal(route(normal, 'speech_transcript').requiredness, 'optional')
assert.equal(route(premium, 'speech_transcript').requiredness, 'recommended')
assert.equal(route(ultra, 'speech_transcript').requiredness, 'required')
assert.equal(route(normal, 'audio_soundsync').userFacingSummary.includes('Basic'), true)
assert.equal(route(premium, 'audio_soundsync').userFacingSummary.includes('Music'), true)
assert.equal(route(ultra, 'audio_soundsync').userFacingSummary.includes('Sound design'), true)
assert.equal(route(normal, 'graphic_design_understanding').requiredness, 'optional')
assert.equal(route(premium, 'graphic_design_understanding').requiredness, 'recommended')
assert.equal(route(ultra, 'graphic_design_understanding').requiredness, 'recommended')
assert.equal(route(normal, 'edit_brief').requiredness, 'optional')
assert.equal(route(premium, 'edit_brief').requiredness, 'recommended')
assert.equal(route(ultra, 'edit_brief').userFacingSummary.includes('strongly recommended'), true)
assert.equal(route(ultra, 'deepseek_tool_code').userFacingSummary.includes('tool-code'), true)
assert.equal(route(ultra, 'deepseek_tool_code').userFacingSummary.includes('user reasoning'), true)
assert.equal(route(premium, 'render_worker').status, 'future_gated')
assert.equal(route(premium, 'credit_gate').status, 'future_gated')
assert.equal(route(premium, 'credit_gate').userFacingSummary.includes('estimate only'), true)

const unsafeProvider = {
  ...premium,
  providerCallMade: true,
  sideEffectFlags: {
    ...premium.sideEffectFlags,
    providerCallMade: true,
  },
}
assert.equal(validateEditLevelToolRoutingPackage({ routingPackage: unsafeProvider }).blocked, true)

const unsafeMedia = {
  ...premium,
  mediaProcessingStarted: true,
  sideEffectFlags: {
    ...premium.sideEffectFlags,
    mediaProcessingStarted: true,
  },
}
assert.equal(validateEditLevelToolRoutingPackage({ routingPackage: unsafeMedia }).blocked, true)

const unsafeWorker = {
  ...premium,
  workerJobCreated: true,
  sideEffectFlags: {
    ...premium.sideEffectFlags,
    workerJobCreated: true,
  },
}
assert.equal(validateEditLevelToolRoutingPackage({ routingPackage: unsafeWorker }).blocked, true)

const unsafeRender = {
  ...premium,
  renderJobCreated: true,
  sideEffectFlags: {
    ...premium.sideEffectFlags,
    renderJobCreated: true,
  },
}
assert.equal(validateEditLevelToolRoutingPackage({ routingPackage: unsafeRender }).blocked, true)

const unsafeCredit = {
  ...premium,
  creditReservedOrSpent: true,
  sideEffectFlags: {
    ...premium.sideEffectFlags,
    creditReservedOrSpent: true,
  },
}
assert.equal(validateEditLevelToolRoutingPackage({ routingPackage: unsafeCredit }).blocked, true)

assert.equal(loadEditLevelToolRoutingForUI('premium').level, 'premium')
assert.equal(createEditLevelToolCapabilitySummaryModel('premium').highlights.join('\n').includes('Qwen'), true)
assert.ok(createEditLevelToolCapabilityListModel('ultra_premium').futureGated.length > 0)
assert.ok(createEditLevelToolFallbackNoticeModel('normal').notices.length > 0)

assert.equal(listEditLevelToolCapabilities().capabilityCount, 18)
assert.equal(runMockToolRouterValidationFlow().every((result) => result.ok), true)
assert.equal(runMockEditLevelToolRouterFlow('ultra_premium').nextStep, 'RP-EDITLEVEL-06 - Level-Aware Source Video Understanding Routing')
assert.equal(listMockEditLevelToolRouterScenarios().length >= 72, true)
assert.ok(createEditLevelToolRouterTechnicalSummary('premium').includes('all side-effect flags remain false'))
assertNoSideEffects(createEditLevelToolRouterSideEffectFlags())

const componentFiles = [
  'src/components/edit-level/EditLevelToolCapabilitySummary.tsx',
  'src/components/edit-level/EditLevelToolCapabilityList.tsx',
  'src/components/edit-level/EditLevelToolCapabilityBadge.tsx',
  'src/components/edit-level/EditLevelToolFallbackNotice.tsx',
]

for (const filePath of componentFiles) {
  const source = readRepoFile(filePath)
  assert.equal(source.includes('../../backend'), false, `${filePath} must not import backend modules`)
  assert.equal(source.includes('../backend'), false, `${filePath} must not import backend modules`)
  assert.equal(source.includes('MockDatabase'), false, `${filePath} must not reference MockDatabase`)
}

const docsText = requiredFiles
  .filter((filePath) => filePath.startsWith('docs/'))
  .map(readRepoFile)
  .join('\n')

for (const term of [
  'router resolves capability plans only',
  'does not execute',
  'Qwen 3.7',
  'Qwen2.5-VL',
  'DeepSeek',
  'no media processing',
  'no render',
  'no credits',
  'RP-EDITLEVEL-06',
]) {
  assert.ok(docsText.includes(term), `RP-EDITLEVEL-05 docs must include: ${term}`)
}

const migrationCount = readdirSync(new URL('../../supabase/migrations', import.meta.url), { withFileTypes: true })
  .filter((entry) => entry.isFile())
  .length
assert.equal(migrationCount, 25, 'RP-EDITLEVEL-05 must not create or modify migration files.')

const packageJson = JSON.parse(readRepoFile('package.json')) as { scripts?: Record<string, string> }
assert.equal(packageJson.scripts?.['smoke:edit-level-tool-router'], 'tsx server/smoke/edit-level-tool-router-smoke.ts')

console.log('edit-level-tool-router-smoke passed')
