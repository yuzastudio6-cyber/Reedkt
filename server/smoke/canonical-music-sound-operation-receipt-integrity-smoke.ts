import assert from 'node:assert/strict'
import {
  CanonicalSoundV4MusicSupportAdapter,
  createMusicSoundSupportRequest,
} from '../music/music-sound-support-port'
import { hashMusicValue } from '../music/music-contracts'
import { createCanonicalMusicTestRuntime } from './canonical-music-test-runtime'
import { makeCanonicalMusicRequest, makeMusicCue, makeMusicRights, testHash } from './canonical-music-test-fixtures'

const runtime = await createCanonicalMusicTestRuntime()
const source = await runtime.makeWav({
  id: 'operation-receipt-source', durationSeconds: 8, frequency: 275, volume: 0.18,
})
const range = { rangeId: 'operation-receipt-range', startFrame: 0, endFrameExclusive: 192 }
const protectedSpeechRange = { rangeId: 'operation-receipt-speech', startFrame: 72, endFrameExclusive: 120 }
const cue = makeMusicCue({ cueId: 'operation-receipt-cue', range, acquisitionPreference: 'user_upload',
  protectedSpeechRanges: [protectedSpeechRange] })
const request = makeCanonicalMusicRequest({
  requestId: 'music-sound-operation-receipt-integrity', mode: 'private_internal', cues: [cue], assets: [source],
  rights: [makeMusicRights({ asset: source, source: 'user_upload' })], allowGeneration: false,
})
const supportRequest = createMusicSoundSupportRequest({
  request, cueId: cue.cueId, delegatedRange: range, selectedMusicArtifact: source,
  protectedSpeechRanges: [protectedSpeechRange],
  requiredOperations: [
    'trim', 'cut', 'fade', 'gain', 'normalize', 'loop', 'resample', 'channel_conversion',
    'time_stretch', 'pitch_shift', 'place', 'dialogue_ducking', 'eq', 'dynamics', 'pan',
    'stem_rendering', 'technical_qa',
  ],
  operationParameters: {
    sourceStartFrame: 0, sourceEndFrameExclusive: 192, targetDurationFrames: 192,
    fadeInFrames: 4, fadeOutFrames: 4, gainDb: -18,
    gainEnvelope: [{ frame: 0, gainDb: -18 }, { frame: 192, gainDb: -18 }],
    dialogueDuckingDb: -10, duckAttackFrames: 4, duckReleaseFrames: 4,
    eqProfile: 'speech_safe', dynamicsProfile: 'gentle_compression', pan: 0.35,
    distance: 'distant', roomMatch: 'dry', headroomDb: 8,
    targetLoudnessLufs: -20, maximumTruePeakDbtp: -1,
    sampleRate: 48_000, channelLayout: 'stereo',
    tempoRatio: 1.05, pitchSemitones: 1, loopCrossfadeFrames: 2,
  },
})
const adapter = new CanonicalSoundV4MusicSupportAdapter(runtime.sound)
const supportResult = await adapter.execute(supportRequest)
const accepted = await adapter.qa({ supportRequest, supportResult })
assert.deepEqual(accepted, { accepted: true, errors: [] })

const receipts = supportResult.receipt.appliedOperationReceipts
assert.equal(receipts.length, supportRequest.requiredOperations.length)
for (const receipt of receipts) {
  assert.equal(receipt.receivedParametersHash, receipt.compiledParametersHash)
  assert.equal(receipt.compiledParametersHash, receipt.appliedParametersHash)
  assert.equal(receipt.sourceArtifactIds.includes(source.artifactId), true)
  assert.equal(receipt.sourceArtifactHashes.includes(source.checksumSha256), true)
  assert.equal(receipt.outputArtifactIds.length, receipt.outputArtifactHashes.length)
  assert.ok(receipt.outputArtifactIds.length > 0)
  assert.deepEqual(receipt.exactMutationRange, range)
  assert.match(receipt.receiptHash, /^[a-f0-9]{64}$/u)
  assert.equal(receipt.appliedExecutionEvidenceHash, hashMusicValue(receipt.appliedExecutionEvidence))
  assert.equal(receipt.status, 'completed')
  assert.notEqual(receipt.measuredQaResult, 'failed')
}
const duck = receipts.find((receipt) => receipt.operation === 'dialogue_ducking')
const pan = receipts.find((receipt) => receipt.operation === 'pan')
const normalize = receipts.find((receipt) => receipt.operation === 'normalize')
assert.ok(duck?.measuredQaRefs.some((ref) => ref.includes('measured_duck_envelope')))
assert.ok(pan?.measuredQaRefs.some((ref) => ref.includes('measured_pan')))
assert.ok(normalize?.measuredQaRefs.some((ref) => ref.includes('technical.true_peak')))

const expectedOneSourceOperations = [
  'trim', 'cut', 'fade', 'gain', 'normalize', 'loop', 'resample', 'channel_conversion',
  'time_stretch', 'pitch_shift', 'place', 'dialogue_ducking', 'eq', 'dynamics', 'pan',
  'stem_rendering', 'technical_qa',
]
assert.deepEqual(receipts.map((receipt) => receipt.operation), expectedOneSourceOperations)

async function tamperOperation(
  operationName: string,
  mutate: (operation: (typeof receipts)[number]) => void,
  expectedError: RegExp,
) {
  const tampered = structuredClone(supportResult)
  const operation = tampered.receipt.appliedOperationReceipts.find((item) => item.operation === operationName)
  assert.ok(operation)
  mutate(operation)
  const qa = await adapter.qa({ supportRequest, supportResult: tampered })
  assert.equal(qa.accepted, false)
  assert.ok(qa.errors.some((error) => expectedError.test(error)), JSON.stringify(qa.errors))
}

await tamperOperation('dialogue_ducking', (operation) => {
  operation.appliedParameters.attackFrames = 99
}, /parameter_receipt_invalid/u)
await tamperOperation('pan', (operation) => {
  operation.appliedParameters.pan = -0.9
}, /parameter_receipt_invalid/u)
await tamperOperation('normalize', (operation) => {
  operation.appliedParameters.targetLoudnessLufs = -8
}, /parameter_receipt_invalid/u)
await tamperOperation('gain', (operation) => {
  operation.sourceArtifactHashes[0] = testHash('tampered-source-hash')
}, /source_lineage_invalid|receipt_hash_invalid/u)
await tamperOperation('trim', (operation) => {
  operation.outputArtifactHashes[0] = testHash('tampered-output-hash')
}, /receipt_hash_invalid/u)
await tamperOperation('fade', (operation) => {
  operation.exactMutationRange.endFrameExclusive -= 1
}, /range_invalid/u)
await tamperOperation('technical_qa', (operation) => {
  operation.receiptHash = testHash('tampered-operation-receipt')
}, /receipt_hash_invalid/u)
await tamperOperation('dialogue_ducking', (operation) => {
  operation.appliedExecutionEvidence = { ...operation.appliedExecutionEvidence, measuredRampEvidence: [] }
}, /execution_evidence_hash_mismatch|execution_evidence_incomplete/u)

const routeSubstitution = structuredClone(supportResult)
const substitutedOperation = routeSubstitution.receipt.appliedOperationReceipts.find((operation) =>
  operation.operation === 'trim')!
substitutedOperation.routeHash = testHash('substituted-sound-route')
routeSubstitution.receipt.soundRouteBindings.push(
  `${substitutedOperation.routeKey}@${substitutedOperation.routeVersion}#${substitutedOperation.routeHash}`,
)
const { receiptHash: _substitutedReceiptHash, ...substitutedReceiptCore } = substitutedOperation
assert.ok(_substitutedReceiptHash)
substitutedOperation.receiptHash = hashMusicValue(substitutedReceiptCore)
const routeSubstitutionQa = await adapter.qa({ supportRequest, supportResult: routeSubstitution })
assert.equal(routeSubstitutionQa.accepted, false)
assert.ok(routeSubstitutionQa.errors.includes('sound_operation_route_identity_invalid:trim'))

for (const operationName of expectedOneSourceOperations) {
  await tamperOperation(operationName, (operation) => {
    operation.requestedParameters = { ...operation.requestedParameters, tamperedParameter: operationName }
  }, /parameter_receipt_invalid/u)
}

async function tamperMeasuredEvidence(
  operationName: 'dialogue_ducking' | 'pan' | 'normalize',
  forbiddenEvidence: RegExp,
) {
  const tampered = structuredClone(supportResult)
  const operation = tampered.receipt.appliedOperationReceipts.find((item) => item.operation === operationName)
  assert.ok(operation)
  operation.measuredQaRefs = operation.measuredQaRefs.filter((ref) => !forbiddenEvidence.test(ref))
  const { receiptHash: _receiptHash, ...receiptCore } = operation
  assert.ok(_receiptHash)
  operation.receiptHash = hashMusicValue(receiptCore)
  const qa = await adapter.qa({ supportRequest, supportResult: tampered })
  assert.equal(qa.accepted, false)
  assert.ok(qa.errors.some((error) => /operation_qa_invalid|measured_evidence_invalid/u.test(error)),
    JSON.stringify(qa.errors))
}

await tamperMeasuredEvidence('dialogue_ducking', /measured_duck_envelope/u)
await tamperMeasuredEvidence('pan', /measured_pan/u)
await tamperMeasuredEvidence('normalize', /technical\.(?:integrated_loudness|true_peak)/u)

console.log(JSON.stringify({
  status: 'ok', operationCount: receipts.length,
  operations: receipts.map((receipt) => ({
    operation: receipt.operation,
    receiptHash: receipt.receiptHash,
    sourceHashCount: receipt.sourceArtifactHashes.length,
    outputHashCount: receipt.outputArtifactHashes.length,
    measuredQaResult: receipt.measuredQaResult,
  })),
  tamperCasesRejected: 9 + expectedOneSourceOperations.length + 3,
}, null, 2))
