import assert from 'node:assert/strict'
import {
  framesToSamples,
  framesToSeconds,
  samplesToFrames,
} from '../edit-skills/core/timeline-rate'
import { editSkillCapabilityRegistry } from '../edit-skills/registry'
import { StandaloneCanonicalMusicSkillService } from '../edit-skills/music/canonical-music-skill-service'
import { MUSIC_CAPABILITY_MODE_MATRIX } from '../edit-skills/music/music-capability-mode-matrix'
import { musicSkillCapabilityManifest } from '../edit-skills/music/music-capability-manifest'
import { MUSIC_MINI_SKILL_MANIFESTS } from '../edit-skills/music/music-mini-skill-registry'
import { validateCanonicalMusicPublication } from '../edit-skills/music/music-publication-validation'
import { evaluateMusicScopeGuard } from '../music/music-scope-guard'
import { MUSIC_TOOL_ROUTE_MANIFESTS } from '../music/music-tool-routes'
import { makeCanonicalMusicRequest, makeMusicCue, makeMusicRights, testHash } from './canonical-music-test-fixtures'

validateCanonicalMusicPublication()
assert.equal(editSkillCapabilityRegistry.resolveLatest('music').manifestHash, musicSkillCapabilityManifest.manifestHash)
assert.equal(MUSIC_CAPABILITY_MODE_MATRIX.length, musicSkillCapabilityManifest.supportedJobTypes.length)
assert.equal(MUSIC_MINI_SKILL_MANIFESTS.length, 41)
assert.ok(MUSIC_TOOL_ROUTE_MANIFESTS.length >= 25)
assert.equal(new Set(MUSIC_TOOL_ROUTE_MANIFESTS.map((route) => `${route.routeKey}@${route.routeVersion}`)).size,
  MUSIC_TOOL_ROUTE_MANIFESTS.length)

for (const rate of [
  { numerator: 24, denominator: 1 }, { numerator: 25, denominator: 1 },
  { numerator: 30_000, denominator: 1_001 }, { numerator: 30, denominator: 1 },
  { numerator: 50, denominator: 1 }, { numerator: 60_000, denominator: 1_001 },
  { numerator: 60, denominator: 1 },
]) {
  const frames = rate.numerator * 60
  const samples = framesToSamples({ frames, rate, sampleRate: 48_000, rounding: 'nearest_half_up' })
  assert.equal(samplesToFrames({ samples, rate, sampleRate: 48_000, rounding: 'nearest_half_up' }), frames)
  assert.equal(framesToSeconds(frames, rate), 60 * rate.denominator)
}

const cue = makeMusicCue({ cueId: 'foundation-cue', range: { rangeId: 'range-1', startFrame: 0, endFrameExclusive: 240 } })
const planning = makeCanonicalMusicRequest({ requestId: 'music-foundation', mode: 'planning', cues: [cue] })
assert.equal(evaluateMusicScopeGuard(planning).ok, true)
const service = new StandaloneCanonicalMusicSkillService({
  artifacts: { async resolve() { throw new Error('planning only') }, async privateOutputRoot() { throw new Error('planning only') } },
})
const plan = await service.plan(planning)
assert.equal(plan.executionGraph.manifestHash, musicSkillCapabilityManifest.manifestHash)
assert.equal(plan.routeBindings.length, 1)
assert.equal(plan.plannedResult.actualMusicMutationRanges.length, 0)
assert.equal(plan.plannedResult.status, 'ambience_only')
assert.equal(plan.plannedResult.selectedMusicAssetRefs.length, 0)

const peer = service.getPeerCapabilityView({ callerType: 'motion_studio', callerSkillKey: 'motion_studio',
  jobType: 'support_motion_studio_music' })
assert.equal(peer.accepted, true)
assert.equal(peer.peerMayInvokeMusicToolsDirectly, false)
assert.equal(peer.peerMayInvokeSoundToolsDirectly, false)

const stale = structuredClone(planning)
stale.scopeAuthority.timelineRate = { numerator: 25, denominator: 1 }
assert.equal(evaluateMusicScopeGuard(stale).ok, false)

const rightsAsset = {
  artifactId: 'foundation-rights-asset', artifactType: 'approved_private_music_audio', version: 1,
  checksumSha256: testHash('foundation-rights-asset'), storageObjectId: 'inputs:foundation-rights.wav',
  private: true as const, contentType: 'audio/wav',
}
const rightsRequest = makeCanonicalMusicRequest({ requestId: 'music-foundation-rights', mode: 'private_internal',
  cues: [makeMusicCue({ cueId: 'foundation-rights-cue', range: cue.exactRange, acquisitionPreference: 'user_upload' })],
  assets: [rightsAsset], rights: [makeMusicRights({ asset: rightsAsset, source: 'user_upload' })] })
const expired = structuredClone(rightsRequest)
expired.rightsAndProvenanceRefs[0]!.expiresAt = '2020-01-01T00:00:00.000Z'
assert.equal(evaluateMusicScopeGuard(expired).code, 'rights_blocked')
const crossProject = structuredClone(rightsRequest)
crossProject.rightsAndProvenanceRefs[0]!.authorizedProjectIds = ['different-project']
assert.equal(evaluateMusicScopeGuard(crossProject).code, 'rights_blocked')
const locked = structuredClone(rightsRequest)
locked.scopeAuthority.lockedMusicTrackIds = ['music-track-1']
assert.equal(evaluateMusicScopeGuard(locked).code, 'locked_track_violation')
const cycle = structuredClone(rightsRequest)
cycle.caller.ancestorSkillKeys = ['music']
assert.equal(evaluateMusicScopeGuard(cycle).code, 'invalid_contract')

console.log(JSON.stringify({
  status: 'ok', musicVersion: musicSkillCapabilityManifest.skillVersion,
  musicManifestHash: musicSkillCapabilityManifest.manifestHash,
  capabilityCount: MUSIC_CAPABILITY_MODE_MATRIX.length,
  miniSkillCount: MUSIC_MINI_SKILL_MANIFESTS.length,
  routeCount: MUSIC_TOOL_ROUTE_MANIFESTS.length,
}, null, 2))
