import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ProjectEditBriefMarkerRecord } from '../../src/types'
import { createDefaultMockProjectEditBriefApiClient } from '../../src/lib/project-edit-brief-api-client'
import {
  createProjectEditBriefVisualContextFallback,
  readProjectEditBriefVisualContextFromMarker,
  saveProjectEditBriefVisualContextToMarker,
} from '../../src/lib/project-edit-brief-visual-context-ui-adapter'
import { createProjectSourceVideoFrameSamplePlan, PROJECT_SOURCE_VIDEO_FRAME_SAMPLER_LIMITS } from '../../src/lib/project-source-video-frame-sampler'

const repoRoot = process.cwd()

function pathFor(relativePath: string): string {
  return join(repoRoot, relativePath)
}

function read(relativePath: string): string {
  const absolutePath = pathFor(relativePath)
  assert.equal(existsSync(absolutePath), true, `${relativePath} should exist.`)
  return readFileSync(absolutePath, 'utf8')
}

const requiredFiles = [
  'src/lib/project-source-video-frame-sampler.ts',
  'src/lib/project-edit-brief-visual-context-ui-adapter.ts',
  'src/components/projects/brief/ProjectEditBriefVisualContextPanel.tsx',
  'src/components/projects/brief/ProjectEditBriefAnalyzeVisualContextButton.tsx',
  'src/components/projects/brief/ProjectEditBriefVisualContextSummaryCard.tsx',
  'src/components/projects/brief/ProjectEditBriefVisualContextBoundaryNotice.tsx',
  'src/components/projects/brief/ProjectEditBriefMarkerDrawer.tsx',
  'src/components/projects/brief/ProjectEditBriefMarkerChatPanel.tsx',
  'src/components/projects/brief/ProjectEditBriefVideoShell.tsx',
  'tests/e2e/project-edit-brief-visual-context.spec.ts',
  'docs/project-edit-brief-visual-context-system.md',
  'docs/project-edit-brief-visual-context-ui.md',
  'docs/qwen25vl-visual-context-boundary.md',
]

for (const relativePath of requiredFiles) read(relativePath)

assert.equal(PROJECT_SOURCE_VIDEO_FRAME_SAMPLER_LIMITS.defaultMaxFrames, 5)
assert.equal(PROJECT_SOURCE_VIDEO_FRAME_SAMPLER_LIMITS.absoluteMaxFrames, 9)
assert.equal(PROJECT_SOURCE_VIDEO_FRAME_SAMPLER_LIMITS.maxTotalBytes, 850_000)

const pointPlan = createProjectSourceVideoFrameSamplePlan({
  marker: { timeMode: 'point', startTimeSeconds: 10 },
  durationSeconds: 30,
})
assert.deepEqual(pointPlan.map((item) => item.role), ['point_before', 'point_marker', 'point_after'])
assert.deepEqual(pointPlan.map((item) => item.sampledAtSeconds), [8, 10, 12])

const rangePlan = createProjectSourceVideoFrameSamplePlan({
  marker: { timeMode: 'range', startTimeSeconds: 5, endTimeSeconds: 11 },
  durationSeconds: 30,
})
assert.deepEqual(rangePlan.map((item) => item.role), ['range_start', 'range_midpoint', 'range_end'])
assert.deepEqual(rangePlan.map((item) => item.sampledAtSeconds), [5, 8, 11])

const client = createDefaultMockProjectEditBriefApiClient({ preserveMockSession: false })
const state = client.getMockState()
const marker = state.markers.find((candidate) => candidate.status !== 'archived') ?? state.markers[0]
assert.ok(marker)

const fallback = createProjectEditBriefVisualContextFallback({
  marker,
  sourceVideoLabel: 'visual-context-smoke.mp4',
  sampledFrameCount: 0,
  reason: 'smoke_missing_config',
})
assert.equal(fallback.sampledFramesPersisted, false)
assert.match(fallback.visualSummary, /no Qwen2\.5-VL call/i)

const updatedMarker = await saveProjectEditBriefVisualContextToMarker({
  marker: marker as ProjectEditBriefMarkerRecord,
  visualContext: fallback,
  client,
})
assert.ok(updatedMarker)
const stored = readProjectEditBriefVisualContextFromMarker(updatedMarker)
assert.equal(stored?.id, fallback.id)
assert.equal(stored?.sampledFramesPersisted, false)
assert.equal(stored?.rawProviderPayloadStored, false)

const visualPanel = read('src/components/projects/brief/ProjectEditBriefVisualContextPanel.tsx')
assert.match(visualPanel, /sampleProjectSourceVideoFramesForMarker/)
assert.match(visualPanel, /Select local source video first/)
assert.doesNotMatch(visualPanel, /ChatNativeEditor/)

const videoShell = read('src/components/projects/brief/ProjectEditBriefVideoShell.tsx')
assert.match(videoShell, /onVideoElementReady/)

const markerChatPanel = read('src/components/projects/brief/ProjectEditBriefMarkerChatPanel.tsx')
assert.match(markerChatPanel, /Visual context unavailable/)
assert.doesNotMatch(markerChatPanel, /summaryForQwen3.*messageText/s)

const newSourceFiles = [
  'src/lib/project-source-video-frame-sampler.ts',
  'src/lib/project-edit-brief-visual-context-ui-adapter.ts',
  'src/components/projects/brief/ProjectEditBriefVisualContextPanel.tsx',
].map(read).join('\n')

for (const unsafePattern of [
  /from ['"]node:fs['"]/,
  /readFile/,
  /ffmpeg/i,
  /ffprobe/i,
  /whisper/i,
  /createClient\(/,
  /supabase\.(from|storage|functions)/i,
  /renderJobCreated:\s*true/,
  /workerJobCreated:\s*true/,
  /creditReservedOrSpent:\s*true/,
  /ChatNativeEditor/,
]) {
  assert.doesNotMatch(newSourceFiles, unsafePattern, `Visual context browser files must not match ${unsafePattern}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(packageJson.scripts?.['smoke:project-edit-brief-visual-context'], 'tsx server/smoke/project-edit-brief-visual-context-smoke.ts')

const migrationCount = readdirSync(pathFor('supabase/migrations')).filter((name) => name.endsWith('.sql')).length
assert.equal(migrationCount, 24, 'RP-QWENVL-BETA-01 must not change the existing 24 migration file baseline.')

console.log(JSON.stringify({
  ok: true,
  milestone: 'RP-QWENVL-BETA-01',
  pointFramePlan: pointPlan.length,
  rangeFramePlan: rangePlan.length,
  visualContextStoredOnMarkerMetadata: true,
  sampledFramesPersisted: false,
  fullVideoUploaded: false,
  backendFileBytesRead: false,
  migrationFileCount: migrationCount,
  supabaseCommandRun: false,
  workerJobCreated: false,
  renderJobCreated: false,
  creditReservedOrSpent: false,
}, null, 2))
