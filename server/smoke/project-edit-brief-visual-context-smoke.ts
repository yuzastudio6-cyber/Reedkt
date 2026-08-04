import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type {
  ProjectEditBriefMarkerRecord,
  ProjectEditBriefVisualContext,
} from '../../src/types'
import {
  PROJECT_EDIT_BRIEF_VISUAL_CONTEXT_SAFETY_FLAGS,
} from '../../src/types/project-edit-brief-visual-context'
import {
  createProjectEditBriefVisualContextSummary,
  isCurrentProjectEditBriefVisualContext,
  isHistoricalProjectEditBriefVisualContext,
  readProjectEditBriefVisualContextFromMarker,
} from '../../src/lib/project-edit-brief-visual-context-ui-adapter'
import { createDefaultMockProjectEditBriefApiClient } from '../../src/lib/project-edit-brief-api-client'

const repoRoot = process.cwd()

function pathFor(relativePath: string): string {
  return join(repoRoot, relativePath)
}

function read(relativePath: string): string {
  const absolutePath = pathFor(relativePath)
  assert.equal(existsSync(absolutePath), true, `${relativePath} should exist.`)
  return readFileSync(absolutePath, 'utf8')
}

for (const retiredPath of [
  'src/lib/project-source-video-frame-sampler.ts',
  'src/components/projects/brief/ProjectEditBriefAnalyzeVisualContextButton.tsx',
  'tests/e2e/project-edit-brief-visual-context.spec.ts',
] as const) {
  assert.equal(existsSync(pathFor(retiredPath)), false, `${retiredPath} must remain retired.`)
}

const client = createDefaultMockProjectEditBriefApiClient({ preserveMockSession: false })
const state = client.getMockState()
const marker = state.markers.find((candidate) => candidate.status !== 'archived') ?? state.markers[0]
assert.ok(marker)

const context: ProjectEditBriefVisualContext = {
  ...PROJECT_EDIT_BRIEF_VISUAL_CONTEXT_SAFETY_FLAGS,
  id: 'vi-marker-context-1',
  projectId: marker.projectId,
  editSessionId: marker.editSessionId,
  briefId: marker.briefId,
  markerId: marker.id,
  visualSummary: 'The speaker demonstrates the ball-handling step.',
  setting: 'Indoor basketball court',
  visibleObjects: ['basketball'],
  visiblePeople: ['speaker'],
  actions: ['demonstrates a dribble'],
  cameraMotion: 'stable handheld follow',
  visibleText: [],
  layoutNotes: ['speaker occupies center frame'],
  brollOpportunities: [],
  visualRisks: [],
  doNotCopyNotes: [],
  confidence: 'high',
  timeRange: { startTimeSeconds: 8, endTimeSeconds: 12, label: '8s-12s' },
  sampledFrameCount: 0,
  runtimeSource: 'visual_intelligence_authenticated_read',
  summaryForOrchestra: 'Authenticated source-edit-planning observation.',
  boundarySummary: 'Authenticated immutable report projection only.',
  createdAt: '2026-08-03T00:00:00.000Z',
  mockOnly: false,
}
const markerWithContext = {
  ...marker,
  metadata: { ...(marker.metadata ?? {}), latestVisualContext: context },
} as ProjectEditBriefMarkerRecord
const reread = readProjectEditBriefVisualContextFromMarker(markerWithContext)
assert.equal(isCurrentProjectEditBriefVisualContext(context), true)
assert.equal(reread, undefined)
assert.match(createProjectEditBriefVisualContextSummary(reread), /Awaiting an authenticated Visual Intelligence report/u)

const historical = {
  ...context,
  runtimeSource: 'qwen25vl_live' as const,
  summaryForOrchestra: undefined,
  summaryForQwen3: 'Historical summary retained for immutable audit.',
}
const historicalReread = readProjectEditBriefVisualContextFromMarker({
  ...marker,
  metadata: { ...(marker.metadata ?? {}), latestVisualContext: historical },
} as ProjectEditBriefMarkerRecord)
assert.equal(isHistoricalProjectEditBriefVisualContext(historicalReread), true)
assert.equal(historicalReread?.summaryForOrchestra, historical.summaryForQwen3)
assert.match(createProjectEditBriefVisualContextSummary(historicalReread), /Historical Qwen/u)

let getterInvoked = false
const hostile = Object.defineProperty({}, 'visualSummary', {
  enumerable: true,
  get() {
    getterInvoked = true
    throw new Error('must not run')
  },
})
assert.equal(readProjectEditBriefVisualContextFromMarker({
  ...marker,
  metadata: { ...(marker.metadata ?? {}), latestVisualContext: hostile },
} as ProjectEditBriefMarkerRecord), undefined)
assert.equal(getterInvoked, false)

const browserClient = read('src/lib/project-edit-brief-api-client.ts')
const browserOptions = read('src/lib/reeditpro-api-client-types.ts')
const visualPanel = read('src/components/projects/brief/ProjectEditBriefVisualContextPanel.tsx')
const markerChatPanel = read('src/components/projects/brief/ProjectEditBriefMarkerChatPanel.tsx')
const combinedActiveSource = [browserClient, browserOptions, visualPanel].join('\n')

for (const retiredPattern of [
  /liveQwen25VLVisualContext/u,
  /qwen25VLVisualContextRuntime/u,
  /loadQwen25VLVisualContextReadiness/u,
  /project-edit-brief\/marker-visual-context/u,
  /qwen25vl-beta\/readiness/u,
  /sampleProjectSourceVideoFramesForMarker/u,
  /ProjectEditBriefAnalyzeVisualContextButton/u,
  /visualContext:\s*\{\s*analyze/su,
]) assert.doesNotMatch(combinedActiveSource, retiredPattern)

assert.match(visualPanel, /Authenticated report/u)
assert.match(visualPanel, /Awaiting Orchestra/u)
assert.match(markerChatPanel, /Authenticated Visual Intelligence evidence/u)
assert.doesNotMatch(markerChatPanel, /summaryForQwen3.*messageText/su)

const migrationCount = readdirSync(pathFor('supabase/migrations')).filter((name) => name.endsWith('.sql')).length
assert.equal(migrationCount, 24, 'Visual-context retirement must not change the migration baseline.')

console.log(JSON.stringify({
  ok: true,
  milestone: 'WEEDITPRO_VISUAL_INTELLIGENCE_BROWSER_QWEN_RETIREMENT_V1',
  browserFrameSamplerPresent: false,
  directBrowserQwenVisualRoutePresent: false,
  browserLocalCurrentAuthorityRejected: true,
  historicalQwenEvidenceReadOnly: true,
  accessorBackedMetadataRejectedWithoutInvocation: true,
  browserMayDispatchVisualIntelligence: false,
  migrationFileCount: migrationCount,
}, null, 2))
