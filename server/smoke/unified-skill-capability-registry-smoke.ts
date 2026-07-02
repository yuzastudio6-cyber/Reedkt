import assert from 'node:assert/strict'
import {
  TRACK_B_MEDIA_OSS_TOOL_IDS,
  assertUnifiedSkillCapabilityRegistryValid,
  buildUnifiedSkillCapabilitySummary,
  getUnifiedSkillToolAvailability,
  getUnifiedSkillCapabilityRecordsByLegacyCapability,
  listUnifiedSkillCapabilityRecords,
  type UnifiedSkillLaneStatus,
  type UnifiedToolId,
} from '../skill-capability-registry'

const allowedStatuses = new Set<UnifiedSkillLaneStatus>([
  'ready_for_backend_execution',
  'dry_run_only',
  'blocked_by_provider_lane',
  'blocked_by_storage_billing',
  'blocked_by_owner_approval',
])

assert.doesNotThrow(assertUnifiedSkillCapabilityRegistryValid, 'unified registry should pass structural validation')

const records = listUnifiedSkillCapabilityRecords()
const summary = buildUnifiedSkillCapabilitySummary()

assert.equal(summary.totalSkills, records.length, 'summary should count every skill record')
assert.ok(summary.totalSkills >= 15, 'registry should cover the current skill/capability surface')
assert.equal(summary.trackBMediaOssToolCount, 16, 'Track B media OSS handoff should remain the 16-tool set')
assert.deepEqual(summary.trackBMediaOssToolIds, [...TRACK_B_MEDIA_OSS_TOOL_IDS], 'summary should expose the Track B tool set')
assert.equal(summary.productReadyLocalOssCount, 0, 'unified registry must not claim product-ready local OSS')
assert.ok(summary.notes.some((note) => note.includes('not external beta')), 'summary must distinguish candidate execution from external beta')

for (const record of records) {
  assert.ok(allowedStatuses.has(record.laneStatus), `${record.skillId} should use an allowed lane status`)
  assert.ok(record.skillId.includes('.'), `${record.skillId} should use a namespaced skill ID`)
  assert.ok(record.capabilityId.length > 0, `${record.skillId} should have a capability ID`)
  assert.ok(record.toolIds.length > 0, `${record.skillId} should map to at least one tool`)
  assert.ok(record.plannerQuestionAliases.length > 0, `${record.skillId} should expose planner aliases`)
  assert.ok(record.plannerAnswer.length > 20, `${record.skillId} should provide a useful planner answer`)
  assert.ok(record.executionGuardrails.includes('requires_approved_plan_snapshot'), `${record.skillId} should require approved snapshots`)
  assert.ok(record.executionGuardrails.includes('requires_credit_reservation'), `${record.skillId} should require credit reservations`)
  assert.ok(record.executionGuardrails.includes('requires_idempotent_job_or_event'), `${record.skillId} should require idempotency`)
  assert.ok(record.executionGuardrails.includes('requires_no_raw_prompts_or_secrets'), `${record.skillId} should reject raw prompts/secrets`)
}

const trackBToolsSeen = new Set<UnifiedToolId>()
for (const record of records) {
  for (const toolId of record.toolIds) {
    if ((TRACK_B_MEDIA_OSS_TOOL_IDS as readonly UnifiedToolId[]).includes(toolId)) {
      trackBToolsSeen.add(toolId)
    }
  }
}

for (const toolId of TRACK_B_MEDIA_OSS_TOOL_IDS) {
  assert.ok(trackBToolsSeen.has(toolId), `Track B tool should appear in at least one skill mapping: ${toolId}`)
}

const ocr = getUnifiedSkillToolAvailability('ocr')
assert.deepEqual(ocr.matchedCapabilityIds, ['ocr'], 'OCR query should resolve the OCR capability')
assert.ok(ocr.readyToolIds.includes('opencv'), 'OCR should expose OpenCV as the conservative ready backend candidate')
assert.ok(ocr.blockedToolIds.includes('paddleocr'), 'OCR should preserve the PaddleOCR owner/model gate')
assert.equal(ocr.externalBetaOrProductionAllowed, false, 'OCR availability must not unlock external beta or production')

const audio = getUnifiedSkillToolAvailability('audio')
assert.ok(audio.readyToolIds.includes('audioflux'), 'Audio query should expose AudioFlux')
assert.ok(audio.readyToolIds.includes('signalsmith_stretch'), 'Audio query should expose Signalsmith Stretch')
assert.ok(audio.dryRunOnlyToolIds.includes('sound_cpu_lane'), 'Audio query should keep SOUND lane visible but dry-run gated')

const color = getUnifiedSkillToolAvailability('color')
for (const toolId of ['opencolorio', 'openimageio', 'opencv', 'sharp', 'ffmpeg'] as UnifiedToolId[]) {
  assert.ok(color.readyToolIds.includes(toolId), `Color query should expose ${toolId}`)
}

const render = getUnifiedSkillToolAvailability('render')
for (const toolId of ['remotion', 'libass', 'ffmpeg'] as UnifiedToolId[]) {
  assert.ok(render.readyToolIds.includes(toolId), `Render query should expose ${toolId}`)
}
assert.ok(render.blockedToolIds.includes('tool_cost_metering'), 'Render query should preserve billing/storage blocker visibility')
assert.ok(render.blockedToolIds.includes('credit_wallet_ledger'), 'Render query should preserve wallet blocker visibility')

const transcript = getUnifiedSkillToolAvailability('transcript')
assert.equal(transcript.backendExecutionCandidate, false, 'Transcript query should not be backend-ready before owner/model approval')
assert.ok(transcript.blockedToolIds.includes('faster_whisper'), 'Transcript should preserve faster-whisper model/owner gate')
assert.ok(transcript.answer.includes('blocked'), 'Transcript answer should clearly explain it is blocked')

const qwen = getUnifiedSkillToolAvailability('qwen')
assert.ok(qwen.blockedToolIds.includes('qwen_provider_gateway'), 'Qwen query should surface provider blocker')
assert.equal(qwen.backendExecutionCandidate, false, 'Qwen provider lane should not be execution-ready')

const storage = getUnifiedSkillToolAvailability('storage')
assert.ok(storage.blockedToolIds.includes('supabase_storage'), 'Storage query should include Supabase storage gate')
assert.ok(storage.blockedToolIds.includes('gcs_storage'), 'Storage query should include GCS storage gate')
assert.equal(storage.externalBetaOrProductionAllowed, false, 'Storage query must not unlock beta/production')

assert.ok(
  getUnifiedSkillCapabilityRecordsByLegacyCapability('audio_soundsync').some((record) => record.skillId === 'media.audio_soundsync'),
  'legacy audio_soundsync capability should map to unified audio skill',
)
assert.ok(
  getUnifiedSkillCapabilityRecordsByLegacyCapability('render_worker').some((record) => record.skillId === 'media.render_composition'),
  'legacy render_worker capability should map to unified render skill',
)
assert.ok(
  getUnifiedSkillCapabilityRecordsByLegacyCapability('qwen_3_reasoning').some((record) => record.skillId === 'planning.qwen_reasoning'),
  'legacy Qwen reasoning capability should remain visible and gated',
)

assert.ok(
  records.some((record) => record.lanes.some((lane) => lane.lane === 'track_a_native_container' && lane.status !== 'ready_for_backend_execution')),
  'Track A lane should remain visible but gated',
)
assert.ok(
  records.some((record) => record.lanes.some((lane) => lane.lane === 'sound_cpu' && lane.status === 'dry_run_only')),
  'SOUND lane should remain visible and dry-run gated',
)
assert.ok(
  records.some((record) => record.lanes.some((lane) => lane.lane === 'qwen_provider' && lane.status === 'blocked_by_provider_lane')),
  'Qwen lane should remain provider-blocked',
)

const unknown = getUnifiedSkillToolAvailability('not-a-capability')
assert.deepEqual(unknown.matchedSkillIds, [], 'unknown query should not fabricate matches')
assert.equal(unknown.backendExecutionCandidate, false, 'unknown query should not be executable')

console.log(JSON.stringify({
  ok: true,
  totalSkills: summary.totalSkills,
  totalCapabilities: summary.totalCapabilities,
  trackBMediaOssToolCount: summary.trackBMediaOssToolCount,
  productReadyLocalOssCount: summary.productReadyLocalOssCount,
  ocrReadyTools: ocr.readyToolIds,
  audioReadyTools: audio.readyToolIds,
  colorReadyTools: color.readyToolIds,
  renderReadyTools: render.readyToolIds,
  transcriptBlockedTools: transcript.blockedToolIds,
}, null, 2))
