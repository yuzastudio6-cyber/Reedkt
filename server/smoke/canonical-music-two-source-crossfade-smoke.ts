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
assert.equal(result.soundReceipt.measuredQa.twoSourceEvidence.twoSourcePresencePassed, true)
assert.equal(result.soundReceipt.measuredQa.twoSourceEvidence.curveWithinTolerance, true)
assert.equal(result.soundReceipt.measuredQa.twoSourceEvidence.windows.length, 3)
assert.ok(result.soundReceipt.measuredQa.twoSourceEvidence.maximumCurveShareError <= 0.2)
assert.ok(result.soundReceipt.measuredQa.twoSourceEvidence.minimumReconstructionCorrelation >= 0.85)
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

const sameSourcePlan = createMusicCrossfadePlan({
  request, leftCueId: 'same-left-cue', rightCueId: 'same-right-cue', leftSource: left, rightSource: left,
  leftSourceRange: plan.leftSourceRange, rightSourceRange: plan.rightSourceRange,
  targetOverlapRange: plan.targetOverlapRange, authorizedWriteRange: plan.authorizedWriteRange,
})
await assert.rejects(() => runtime.music.executeTwoSourceCrossfade({
  plan: sameSourcePlan, musicSkillVersion: musicSkillCapabilityManifest.skillVersion,
  musicManifestHash: musicSkillCapabilityManifest.manifestHash,
  approvedSnapshotId: request.approvedSnapshotRef.snapshotId, approvedSnapshotHash: request.approvedSnapshotRef.snapshotHash,
  parentAuthorityRef: request.scopeAuthority.parentAuthorityRef, parentAuthorityHash: request.scopeAuthority.parentAuthorityHash,
  approvedWorkItemId: request.caller.parentWorkItemId, privateOutputScopeId: request.privateOutputScopeId!,
  creditReservationId: request.approvalAndBudget.reservationRef!, idempotencyKey: 'same-source-twice',
}), /independent source/i)

await assert.rejects(() => runtime.music.executeTwoSourceCrossfade({
  plan, musicSkillVersion: musicSkillCapabilityManifest.skillVersion,
  musicManifestHash: testHash('stale-music-manifest'),
  approvedSnapshotId: request.approvedSnapshotRef.snapshotId, approvedSnapshotHash: request.approvedSnapshotRef.snapshotHash,
  parentAuthorityRef: request.scopeAuthority.parentAuthorityRef, parentAuthorityHash: request.scopeAuthority.parentAuthorityHash,
  approvedWorkItemId: request.caller.parentWorkItemId, privateOutputScopeId: request.privateOutputScopeId!,
  creditReservationId: request.approvalAndBudget.reservationRef!, idempotencyKey: 'stale-music-manifest',
}), /stale Music manifest/i)

await assert.rejects(() => runtime.music.executeTwoSourceCrossfade({
  plan, musicSkillVersion: musicSkillCapabilityManifest.skillVersion,
  musicManifestHash: musicSkillCapabilityManifest.manifestHash,
  approvedSnapshotId: '', approvedSnapshotHash: request.approvedSnapshotRef.snapshotHash,
  parentAuthorityRef: request.scopeAuthority.parentAuthorityRef, parentAuthorityHash: request.scopeAuthority.parentAuthorityHash,
  approvedWorkItemId: request.caller.parentWorkItemId, privateOutputScopeId: request.privateOutputScopeId!,
  creditReservationId: request.approvalAndBudget.reservationRef!, idempotencyKey: 'missing-approval',
}), /too_small|approved|snapshot|String must contain/i)

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
  schemaVersion: 'sound.music_two_source_crossfade.v2', requestId: plan.planId,
  callerSkillKey: 'music', callerSkillVersion: musicSkillCapabilityManifest.skillVersion,
  callerManifestHash: musicSkillCapabilityManifest.manifestHash,
  soundSkillVersion: runtime.sound.getCapabilityManifest().skillVersion,
  soundManifestHash: runtime.sound.getCapabilityManifest().manifestHash,
  soundRouteKey: result.soundReceipt.routeKey,
  soundRouteVersion: result.soundReceipt.routeVersion as '2.0.0',
  soundRouteHash: result.soundReceipt.routeHash,
  leftCueId: plan.leftCueId, rightCueId: plan.rightCueId,
  leftSource: {
    artifactId: left.artifactId, artifactType: left.artifactType, version: left.version,
    checksumSha256: left.checksumSha256, storageObjectId: left.storageObjectId, private: true,
    contentType: left.contentType, durationFrames: left.durationFrames, timelineRate: left.timelineRate,
  },
  rightSource: {
    artifactId: right.artifactId, artifactType: right.artifactType, version: right.version,
    checksumSha256: right.checksumSha256, storageObjectId: right.storageObjectId, private: true,
    contentType: right.contentType, durationFrames: right.durationFrames, timelineRate: right.timelineRate,
  }, leftSourceRange: plan.leftSourceRange,
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

const staleSoundRequestCore = {
  ...receiptValidationRequest,
  soundManifestHash: testHash('stale-sound-manifest'),
  extensionHash: undefined,
}
await assert.rejects(() => runtime.sound.executeMusicTwoSourceCrossfade({
  ...staleSoundRequestCore,
  extensionHash: hashSoundMusicTechnicalAutomation(staleSoundRequestCore),
}), /stale Sound manifest/i)

const malformedCurveCore = {
  ...receiptValidationRequest,
  leftGainCurve: [{ frame: 24, linearGain: 0 }, { frame: 48, linearGain: 1 }],
  extensionHash: undefined,
}
await assert.rejects(() => runtime.sound.executeMusicTwoSourceCrossfade({
  ...malformedCurveCore,
  extensionHash: hashSoundMusicTechnicalAutomation(malformedCurveCore),
} as typeof receiptValidationRequest), /curve endpoints|malformed/i)

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

const staleRouteReceipt = structuredClone(result.soundReceipt)
staleRouteReceipt.routeHash = testHash('stale-crossfade-route')
const staleRouteReceiptCore = { ...staleRouteReceipt, receiptHash: undefined }
staleRouteReceipt.receiptHash = hashSoundMusicTechnicalAutomation(staleRouteReceiptCore)
assert.throws(() => validateSoundMusicTwoSourceCrossfadeReceipt({
  request: receiptValidationRequest,
  receipt: staleRouteReceipt,
}), /route_operation_binding|rejected/i)

const incompleteMeasuredEvidence = structuredClone(result.soundReceipt)
incompleteMeasuredEvidence.measuredQa.twoSourceEvidence.windows = []
const incompleteQaCore = { ...incompleteMeasuredEvidence.measuredQa, evidenceHash: undefined }
incompleteMeasuredEvidence.measuredQa.evidenceHash = hashSoundMusicTechnicalAutomation(incompleteQaCore)
const incompleteReceiptCore = { ...incompleteMeasuredEvidence, receiptHash: undefined }
incompleteMeasuredEvidence.receiptHash = hashSoundMusicTechnicalAutomation(incompleteReceiptCore)
assert.throws(() => validateSoundMusicTwoSourceCrossfadeReceipt({
  request: receiptValidationRequest,
  receipt: incompleteMeasuredEvidence,
}), /two_source_presence_and_curve_evidence|rejected/i)

console.log(JSON.stringify({
  status: 'ok', leftChecksum: left.checksumSha256, rightChecksum: right.checksumSha256,
  outputChecksum: result.receipt.outputArtifact.checksumSha256, overlapDurationFrames: 24,
  overlapDurationSamples: 48_000, measurements,
  truePeakDbtp: result.soundReceipt.measuredQa.truePeakDbtp,
  clippingSampleCount: result.soundReceipt.measuredQa.clippingSampleCount,
  route: `${result.soundReceipt.routeKey}@${result.soundReceipt.routeVersion}#${result.soundReceipt.routeHash}`,
}, null, 2))
