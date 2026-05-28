import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildConservativePhase29SmartCutPlan, buildRealVideoSmartCutTimeline } from '../activation/real-video-smart-cut'
import { buildPhase29QaSummary } from '../activation/real-video-smart-cut'
import { realVideoSmartCutConfig, validateRealVideoSmartCutEnv } from '../activation/real-video-smart-cut'
import type { RealVideoSmartCutNormalizedInput } from '../activation/real-video-smart-cut'

const normalized = buildMockNormalizedInput()
const plan = buildConservativePhase29SmartCutPlan(normalized)
assert.equal(realVideoSmartCutConfig.phase28RunId, 'phase28-20260528T01552')
assert.equal(validateRealVideoSmartCutEnv({ projectId: 'reeditpro', region: 'us-central1', env: 'staging', confirmation: 'true' }).length, 0)
assert.ok(validateRealVideoSmartCutEnv({ projectId: 'wrong', region: 'us-central1', env: 'staging', confirmation: 'true' }).length > 0)
assert.deepEqual(plan.intent, ['talking_head_clean_cut', 'remove_dead_space', 'preserve_story'])
assert.equal(plan.aggressiveness, 'gentle')
assert.ok(plan.keepSegments.length > 0)
assert.equal(plan.keepSegments.some((segment) => segment.startSeconds < 0), false)
assert.equal(plan.removeSegments.some((segment) => segment.startSeconds < 0 || segment.endSeconds <= segment.startSeconds), false)
for (const removal of plan.removeSegments) {
  for (const word of normalized.wordTimestamps) {
    assert.equal(removal.startSeconds > word.startSeconds && removal.startSeconds < word.endSeconds, false)
    assert.equal(removal.endSeconds > word.startSeconds && removal.endSeconds < word.endSeconds, false)
  }
}

const build = await buildRealVideoSmartCutTimeline(normalized)
assert.ok(build.executionPlan)
assert.equal(build.executionPlan.finalExportAllowed, false)
assert.ok(build.timelineManifest.captionLayers.length > 0)
assert.ok(build.otioManifest.OTIO_SCHEMA)
assert.ok(build.hyperframeBridge.bridgeType)
assert.ok(build.remotionManifest.manifestType)
const qa = buildPhase29QaSummary({
  normalized,
  qaResults: build.qaResults,
  previewSkippedReason: 'smoke preview skipped',
})
assert.notEqual(qa.status, 'blocked')
assert.ok(qa.gates.some((gate) => gate.gateType === 'caption_timing'))
assert.ok(qa.gates.some((gate) => gate.gateType === 'caption_safe_zone'))
const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(Boolean(packageJson.scripts['activation:real-video:smart-cut']), true)
assert.equal(Boolean(packageJson.scripts['activation:real-video:smart-cut:report']), true)
assert.equal(Boolean(packageJson.scripts['smoke:activation-real-video-smart-cut']), true)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'phase28_scope_locked',
    'env_guard',
    'conservative_plan',
    'no_mid_word_cuts',
    'timeline_caption_refs',
    'metadata_manifests',
    'qa_nonblocking',
    'scripts_present',
    'final_export_blocked',
  ],
  keepSegments: plan.keepSegments.length,
  removeSegments: plan.removeSegments.length,
  qaStatus: qa.status,
}, null, 2))

function buildMockNormalizedInput(): RealVideoSmartCutNormalizedInput {
  const words = [
    { word: 'hello', startSeconds: 0.4, endSeconds: 0.8, segmentId: 'seg-1', confidence: 0.9 },
    { word: 'there', startSeconds: 0.85, endSeconds: 1.1, segmentId: 'seg-1', confidence: 0.9 },
    { word: 'today', startSeconds: 2.4, endSeconds: 2.8, segmentId: 'seg-2', confidence: 0.9 },
  ]
  return {
    sourceGcsUri: realVideoSmartCutConfig.sourceGcsUri,
    sourceDurationSeconds: 4,
    width: 3840,
    height: 2160,
    transcriptSegments: [
      { segmentId: 'seg-1', startSeconds: 0.35, endSeconds: 1.15, text: 'hello there', words: words.slice(0, 2), confidence: 0.9 },
      { segmentId: 'seg-2', startSeconds: 2.35, endSeconds: 2.85, text: 'today', words: words.slice(2), confidence: 0.9 },
    ],
    wordTimestamps: words,
    captionSegments: [
      {
        captionId: 'caption-1',
        startSeconds: 0.35,
        endSeconds: 1.15,
        text: 'hello there',
        lines: ['hello there'],
        words: [],
        styleHints: { presetId: 'clean_subtitle', placement: 'bottom_safe', emphasisWords: [] },
      },
      {
        captionId: 'caption-2',
        startSeconds: 2.35,
        endSeconds: 2.85,
        text: 'today',
        lines: ['today'],
        words: [],
        styleHints: { presetId: 'clean_subtitle', placement: 'bottom_safe', emphasisWords: [] },
      },
    ],
    captionArtifactIds: ['caption-json', 'caption-srt'],
    transcriptArtifactIds: ['transcript-json', 'words-json'],
  }
}
