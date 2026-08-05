import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  CanonicalLyria3ProviderAdapter,
  LYRIA_3_PROVIDER_PROFILE,
  PrivateFileMusicProviderAttemptStore,
  createMusicCompositionBrief,
  type LyriaTransport,
  type LyriaTransportResult,
} from '../music/lyria-provider'
import { getMusicToolRouteManifest } from '../music/music-tool-routes'
import { createCanonicalMusicTestRuntime } from './canonical-music-test-runtime'
import { makeCanonicalMusicRequest, makeMusicCue } from './canonical-music-test-fixtures'

const runtime = await createCanonicalMusicTestRuntime()
const fixture = await runtime.makeWav({ id: 'reconciled-fixture', durationSeconds: 4, frequency: 275, volume: 0.1 })
const fixtureBytes = new Uint8Array(await readFile((await runtime.resolver.resolve(fixture)).absolutePath))

class ReconciledTransport implements LyriaTransport {
  executeCalls = 0
  reconcileCalls = 0
  async execute(): Promise<LyriaTransportResult> {
    this.executeCalls += 1
    return { status: 'unknown_outcome', providerRequestId: 'lyria-unknown-1', candidates: [], actualCostUsd: 0.08 }
  }
  async reconcile(providerRequestId: string): Promise<LyriaTransportResult> {
    assert.equal(providerRequestId, 'lyria-unknown-1')
    this.reconcileCalls += 1
    return { status: 'succeeded', providerRequestId, candidates: [{
      bytes: fixtureBytes, contentType: 'audio/wav', providerOutputId: 'reconciled-output-1',
    }], actualCostUsd: 0.08 }
  }
}

const transport = new ReconciledTransport()
const attemptStore = new PrivateFileMusicProviderAttemptStore(runtime.root)
const provider = new CanonicalLyria3ProviderAdapter({ transport, attempts: attemptStore, artifacts: runtime.resolver })
const range = { rangeId: 'reconcile-range', startFrame: 0, endFrameExclusive: 96 }
const cue = makeMusicCue({ cueId: 'reconcile-cue', range, acquisitionPreference: 'generate_original' })
const request = makeCanonicalMusicRequest({ requestId: 'music-provider-reconcile', mode: 'fixture', cues: [cue], allowGeneration: true })
const route = getMusicToolRouteManifest('music.route.generate.original.lyria.v3')!
const brief = createMusicCompositionBrief({
  briefId: 'brief-reconcile', briefVersion: '2.0.0', cueId: cue.cueId, exactRange: range,
  timelineRate: request.timelineBinding.rationalTimelineRate, narrativeFunction: cue.narrativeFunction,
  viewerEmotionTarget: cue.targetStoryState, cueRole: cue.cueRole, motifRole: cue.motifRole,
  durationFrames: 96, tempoRange: cue.tempoRangeBpm, harmonicDirection: cue.harmonicDirection,
  energyArc: cue.energyArc, instrumentation: cue.instrumentation, arrangementDensity: cue.arrangementDensity,
  rhythmProfile: cue.rhythmProfile, performanceFeel: 'restrained', vocalPolicy: cue.vocalPolicy,
  lyricPolicy: cue.lyricPolicy, languagePolicy: cue.languagePolicy, speechSafety: 'voice first',
  introBehavior: 'bounded', developmentBehavior: 'bounded', transitionBehavior: 'bounded',
  endingBehavior: 'clean', loopPolicy: 'measured only', ambienceRelationship: 'protect',
  sfxRelationship: 'avoid collision', styleConstraints: [], doNotCopyConstraints: ['no_artist_imitation'],
  qualityRequirements: ['clean'], sourceEvidenceRefs: [], approvalRef: request.approvedSnapshotRef.snapshotId,
})
const call = () => provider.execute({ request, cueId: cue.cueId, route, brief, candidateCount: 1, mode: 'fixture' })
const unknown = await call()
assert.equal(unknown.status, 'unknown_outcome')
assert.equal(unknown.reconciliationState, 'required')
assert.equal(transport.executeCalls, 1)
const reconciled = await call()
assert.equal(reconciled.status, 'succeeded')
assert.equal(reconciled.reconciliationState, 'resolved')
assert.equal(reconciled.candidateArtifacts.length, 1)
assert.equal(transport.executeCalls, 1)
assert.equal(transport.reconcileCalls, 1)
assert.equal(reconciled.providerProfileKey, LYRIA_3_PROVIDER_PROFILE.profileKey)
const reconstructedTransport = new ReconciledTransport()
const reconstructedProvider = new CanonicalLyria3ProviderAdapter({ transport: reconstructedTransport,
  attempts: new PrivateFileMusicProviderAttemptStore(runtime.root), artifacts: runtime.resolver })
const durableReplay = await reconstructedProvider.execute({ request, cueId: cue.cueId, route, brief,
  candidateCount: 1, mode: 'fixture' })
assert.equal(durableReplay.status, 'succeeded')
assert.equal(reconstructedTransport.executeCalls, 0)
const { briefHash: _previousBriefHash, ...briefInput } = brief
void _previousBriefHash
const changedBrief = createMusicCompositionBrief({ ...briefInput, energyArc: `${brief.energyArc}-material-change` })
await assert.rejects(() => provider.execute({ request, cueId: cue.cueId, route, brief: changedBrief,
  candidateCount: 1, mode: 'fixture' }), /idempotency collision/i)

const failedRequest = makeCanonicalMusicRequest({
  requestId: 'music-provider-failed', mode: 'fixture', cues: [cue], allowGeneration: true,
})
const failedProvider = new CanonicalLyria3ProviderAdapter({
  transport: {
    async execute(): Promise<LyriaTransportResult> {
      return { status: 'failed', candidates: [], actualCostUsd: 0, failureCode: 'http_403' }
    },
  },
  artifacts: runtime.resolver,
})
const failed = await failedProvider.execute({
  request: failedRequest, cueId: cue.cueId, route, brief, candidateCount: 1, mode: 'fixture',
})
assert.equal(failed.status, 'failed')
assert.equal(failed.attempts[0]?.failureCode, 'http_403')

console.log(JSON.stringify({ status: 'ok', attemptStatus: reconciled.status,
  executeCalls: transport.executeCalls, reconcileCalls: transport.reconcileCalls,
  candidateCount: reconciled.candidateArtifacts.length, safeFailureCodePreserved: true }, null, 2))
