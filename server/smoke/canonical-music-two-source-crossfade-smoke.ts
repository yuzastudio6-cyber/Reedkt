import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createMusicCrossfadePlan } from '../music/music-sound-support-port'
import { musicSkillCapabilityManifest } from '../edit-skills/music/music-capability-manifest'
import { hashSoundMusicTechnicalAutomation, validateSoundMusicTwoSourceCrossfadeReceipt } from '../sound'
import { createCanonicalMusicTestRuntime } from './canonical-music-test-runtime'
import { makeCanonicalMusicRequest, testHash } from './canonical-music-test-fixtures'

const execFileAsync = promisify(execFile)

async function frequencyMagnitude(path: string, frequency: number, startSeconds: number, durationSeconds = 0.1) {
  const sampleRate = 8_000
  const decoded = await execFileAsync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-nostdin', '-ss', String(startSeconds), '-t', String(durationSeconds),
    '-i', path, '-vn', '-ac', '1', '-ar', String(sampleRate), '-f', 'f32le', 'pipe:1',
  ], { encoding: 'buffer', maxBuffer: 8 * 1024 * 1024 } as Parameters<typeof execFileAsync>[2])
  const bytes = Buffer.isBuffer(decoded.stdout) ? decoded.stdout : Buffer.from(decoded.stdout)
  const count = Math.floor(bytes.length / 4)
  let real = 0
  let imaginary = 0
  for (let index = 0; index < count; index += 1) {
    const sample = bytes.readFloatLE(index * 4)
    const phase = 2 * Math.PI * frequency * index / sampleRate
    real += sample * Math.cos(phase)
    imaginary -= sample * Math.sin(phase)
  }
  return Math.sqrt(real * real + imaginary * imaginary) / Math.max(1, count)
}

const runtime = await createCanonicalMusicTestRuntime()
const [left, right] = await Promise.all([
  runtime.makeWav({ id: 'crossfade-left-440', durationSeconds: 2, frequency: 440, volume: 0.2 }),
  runtime.makeWav({ id: 'crossfade-right-880', durationSeconds: 2, frequency: 880, volume: 0.2 }),
])
const request = makeCanonicalMusicRequest({
  requestId: 'music-two-source-crossfade', mode: 'fixture', cues: [], allowGeneration: false,
  assets: [left, right], writeRanges: [{ rangeId: 'crossfade-output', startFrame: 0, endFrameExclusive: 72 }],
  inspectRanges: [{ rangeId: 'crossfade-inspect', startFrame: 0, endFrameExclusive: 72 }],
})
const plan = createMusicCrossfadePlan({
  request, leftCueId: 'crossfade-left-cue', rightCueId: 'crossfade-right-cue',
  leftSource: left, rightSource: right,
  leftSourceRange: { rangeId: 'left-source-range', startFrame: 0, endFrameExclusive: 48 },
  rightSourceRange: { rangeId: 'right-source-range', startFrame: 0, endFrameExclusive: 48 },
  targetOverlapRange: { rangeId: 'crossfade-overlap', startFrame: 24, endFrameExclusive: 48 },
  authorizedWriteRange: { rangeId: 'crossfade-output', startFrame: 0, endFrameExclusive: 72 },
  curveType: 'equal_power',
})
const result = await runtime.music.executeTwoSourceCrossfade({
  plan, musicSkillVersion: musicSkillCapabilityManifest.skillVersion,
  musicManifestHash: musicSkillCapabilityManifest.manifestHash,
  approvedSnapshotId: request.approvedSnapshotRef.snapshotId,
  approvedSnapshotHash: request.approvedSnapshotRef.snapshotHash,
  parentAuthorityRef: request.scopeAuthority.parentAuthorityRef,
  parentAuthorityHash: request.scopeAuthority.parentAuthorityHash,
  approvedWorkItemId: request.caller.parentWorkItemId,
  privateOutputScopeId: request.privateOutputScopeId!,
  creditReservationId: request.approvalAndBudget.reservationRef!,
  idempotencyKey: 'music-two-source-crossfade-execution',
})

assert.equal(result.soundReceipt.leftSourceHash, left.checksumSha256)
assert.equal(result.soundReceipt.rightSourceHash, right.checksumSha256)
assert.notEqual(result.soundReceipt.leftSourceHash, result.soundReceipt.rightSourceHash)
assert.equal(result.soundReceipt.crossfadeDurationFrames, 24)
assert.equal(result.soundReceipt.crossfadeDurationSamples, 48_000)
assert.equal(result.soundReceipt.outputArtifact.durationFrames, 72)
assert.equal(result.soundReceipt.measuredQa.clippingSampleCount, 0)
assert.ok((result.soundReceipt.measuredQa.truePeakDbtp ?? 0) <= -0.8)
assert.equal(result.receipt.outputArtifact.checksumSha256, result.soundReceipt.outputArtifact.checksumSha256)

const output = await runtime.resolver.resolve(result.receipt.outputArtifact)
const measurements = {
  start440: await frequencyMagnitude(output.absolutePath, 440, 1.05),
  start880: await frequencyMagnitude(output.absolutePath, 880, 1.05),
  mid440: await frequencyMagnitude(output.absolutePath, 440, 1.45),
  mid880: await frequencyMagnitude(output.absolutePath, 880, 1.45),
  end440: await frequencyMagnitude(output.absolutePath, 440, 1.85),
  end880: await frequencyMagnitude(output.absolutePath, 880, 1.85),
}
assert.ok(measurements.start440 > measurements.start880 * 2)
assert.ok(measurements.end880 > measurements.end440 * 2)
assert.ok(measurements.mid440 > 0.006 && measurements.mid880 > 0.006)

await assert.rejects(() => runtime.music.executeTwoSourceCrossfade({
  plan: { ...plan, rightSource: undefined } as unknown as typeof plan,
  musicSkillVersion: musicSkillCapabilityManifest.skillVersion,
  musicManifestHash: musicSkillCapabilityManifest.manifestHash,
  approvedSnapshotId: request.approvedSnapshotRef.snapshotId, approvedSnapshotHash: request.approvedSnapshotRef.snapshotHash,
  parentAuthorityRef: request.scopeAuthority.parentAuthorityRef, parentAuthorityHash: request.scopeAuthority.parentAuthorityHash,
  approvedWorkItemId: request.caller.parentWorkItemId, privateOutputScopeId: request.privateOutputScopeId!,
  creditReservationId: request.approvalAndBudget.reservationRef!, idempotencyKey: 'missing-right-source',
}))

const staleRight = { ...right, checksumSha256: testHash('stale-right-source') }
const stalePlan = createMusicCrossfadePlan({ ...{
  request, leftCueId: 'crossfade-left-cue', rightCueId: 'crossfade-right-cue', leftSource: left, rightSource: staleRight,
  leftSourceRange: plan.leftSourceRange, rightSourceRange: plan.rightSourceRange,
  targetOverlapRange: plan.targetOverlapRange, authorizedWriteRange: plan.authorizedWriteRange,
}, curveType: 'equal_power' })
await assert.rejects(() => runtime.music.executeTwoSourceCrossfade({
  plan: stalePlan, musicSkillVersion: musicSkillCapabilityManifest.skillVersion,
  musicManifestHash: musicSkillCapabilityManifest.manifestHash,
  approvedSnapshotId: request.approvedSnapshotRef.snapshotId, approvedSnapshotHash: request.approvedSnapshotRef.snapshotHash,
  parentAuthorityRef: request.scopeAuthority.parentAuthorityRef, parentAuthorityHash: request.scopeAuthority.parentAuthorityHash,
  approvedWorkItemId: request.caller.parentWorkItemId, privateOutputScopeId: request.privateOutputScopeId!,
  creditReservationId: request.approvalAndBudget.reservationRef!, idempotencyKey: 'stale-right-source',
}), /cannot be resolved|checksum/i)

const outsidePlan = createMusicCrossfadePlan({
  request, leftCueId: 'crossfade-left-cue', rightCueId: 'crossfade-right-cue', leftSource: left, rightSource: right,
  leftSourceRange: plan.leftSourceRange, rightSourceRange: plan.rightSourceRange,
  targetOverlapRange: { rangeId: 'outside-overlap', startFrame: 60, endFrameExclusive: 84 },
  authorizedWriteRange: plan.authorizedWriteRange,
})
await assert.rejects(() => runtime.music.executeTwoSourceCrossfade({
  plan: outsidePlan, musicSkillVersion: musicSkillCapabilityManifest.skillVersion,
  musicManifestHash: musicSkillCapabilityManifest.manifestHash,
  approvedSnapshotId: request.approvedSnapshotRef.snapshotId, approvedSnapshotHash: request.approvedSnapshotRef.snapshotHash,
  parentAuthorityRef: request.scopeAuthority.parentAuthorityRef, parentAuthorityHash: request.scopeAuthority.parentAuthorityHash,
  approvedWorkItemId: request.caller.parentWorkItemId, privateOutputScopeId: request.privateOutputScopeId!,
  creditReservationId: request.approvalAndBudget.reservationRef!, idempotencyKey: 'outside-overlap',
}), /authorized|target range/i)

const tooLongPlan = createMusicCrossfadePlan({
  request, leftCueId: 'crossfade-left-cue', rightCueId: 'crossfade-right-cue', leftSource: left, rightSource: right,
  leftSourceRange: plan.leftSourceRange, rightSourceRange: plan.rightSourceRange,
  targetOverlapRange: { rangeId: 'too-long-overlap', startFrame: 0, endFrameExclusive: 48 },
  authorizedWriteRange: { rangeId: 'too-long-output', startFrame: 0, endFrameExclusive: 48 },
})
await assert.rejects(() => runtime.music.executeTwoSourceCrossfade({
  plan: tooLongPlan, musicSkillVersion: musicSkillCapabilityManifest.skillVersion,
  musicManifestHash: musicSkillCapabilityManifest.manifestHash,
  approvedSnapshotId: request.approvedSnapshotRef.snapshotId, approvedSnapshotHash: request.approvedSnapshotRef.snapshotHash,
  parentAuthorityRef: request.scopeAuthority.parentAuthorityRef, parentAuthorityHash: request.scopeAuthority.parentAuthorityHash,
  approvedWorkItemId: request.caller.parentWorkItemId, privateOutputScopeId: request.privateOutputScopeId!,
  creditReservationId: request.approvalAndBudget.reservationRef!, idempotencyKey: 'too-long-overlap',
}), /source handles/i)

const receiptValidationRequest = {
  schemaVersion: 'sound.music_two_source_crossfade.v1', requestId: plan.planId,
  callerSkillKey: 'music', callerSkillVersion: musicSkillCapabilityManifest.skillVersion,
  callerManifestHash: musicSkillCapabilityManifest.manifestHash,
  soundSkillVersion: runtime.sound.getCapabilityManifest().skillVersion,
  soundManifestHash: runtime.sound.getCapabilityManifest().manifestHash,
  leftCueId: plan.leftCueId, rightCueId: plan.rightCueId,
  leftSource: { ...left }, rightSource: { ...right }, leftSourceRange: plan.leftSourceRange,
  rightSourceRange: plan.rightSourceRange, targetOverlapRange: plan.targetOverlapRange,
  authorizedWriteRange: plan.authorizedWriteRange, crossfadeDurationFrames: plan.crossfadeDurationFrames,
  crossfadeDurationSamples: plan.crossfadeDurationSamples, sampleRate: plan.sampleRate,
  timelineRate: plan.timelineRate, curveType: plan.curveType,
  leftGainCurve: [{ frame: 24, linearGain: 1 }, { frame: 48, linearGain: 0 }],
  rightGainCurve: [{ frame: 24, linearGain: 0 }, { frame: 48, linearGain: 1 }],
  approvedSnapshotId: request.approvedSnapshotRef.snapshotId,
  approvedSnapshotHash: request.approvedSnapshotRef.snapshotHash,
  parentMusicRequestId: request.requestId, parentAuthorityRef: request.scopeAuthority.parentAuthorityRef,
  parentAuthorityHash: request.scopeAuthority.parentAuthorityHash,
  approvedWorkItemId: request.caller.parentWorkItemId, privateOutputScopeId: request.privateOutputScopeId!,
  creditReservationId: request.approvalAndBudget.reservationRef!, idempotencyKey: 'tampered-receipt',
  requiredOutputs: ['music_crossfade_audio', 'music_crossfade_receipt_v3'],
  requiredMeasuredQa: ['two_source_presence', 'curve_progression', 'duration', 'true_peak', 'clipping'],
  extensionHash: result.soundReceipt.extensionHash,
} satisfies Parameters<typeof validateSoundMusicTwoSourceCrossfadeReceipt>[0]['request']

assert.throws(() => validateSoundMusicTwoSourceCrossfadeReceipt({
  request: receiptValidationRequest,
  receipt: { ...result.soundReceipt, rightSourceHash: testHash('tampered-receipt') },
}), /rejected/i)
assert.throws(() => validateSoundMusicTwoSourceCrossfadeReceipt({
  request: receiptValidationRequest,
  receipt: {
    ...result.soundReceipt,
    appliedParameters: { ...result.soundReceipt.appliedParameters, crossfadeDurationSeconds: 0.25 },
  },
}), /parameter_hash|receipt_hash|rejected/i)
const selfConsistentTamper = structuredClone(result.soundReceipt)
selfConsistentTamper.compiledParameters.crossfadeDurationSeconds = 0.25
selfConsistentTamper.appliedParameters.crossfadeDurationSeconds = 0.25
selfConsistentTamper.compiledParametersHash = hashSoundMusicTechnicalAutomation(selfConsistentTamper.compiledParameters)
selfConsistentTamper.appliedParametersHash = hashSoundMusicTechnicalAutomation(selfConsistentTamper.appliedParameters)
const selfConsistentTamperCore = { ...selfConsistentTamper, receiptHash: undefined }
selfConsistentTamper.receiptHash = hashSoundMusicTechnicalAutomation(selfConsistentTamperCore)
assert.throws(() => validateSoundMusicTwoSourceCrossfadeReceipt({
  request: receiptValidationRequest,
  receipt: selfConsistentTamper,
}), /request_to_compiled_parameter_binding|rejected/i)

console.log(JSON.stringify({
  status: 'ok', leftChecksum: left.checksumSha256, rightChecksum: right.checksumSha256,
  outputChecksum: result.receipt.outputArtifact.checksumSha256, overlapDurationFrames: 24,
  overlapDurationSamples: 48_000, measurements,
  truePeakDbtp: result.soundReceipt.measuredQa.truePeakDbtp,
  clippingSampleCount: result.soundReceipt.measuredQa.clippingSampleCount,
  route: `${result.soundReceipt.routeKey}@${result.soundReceipt.routeVersion}#${result.soundReceipt.routeHash}`,
}, null, 2))
