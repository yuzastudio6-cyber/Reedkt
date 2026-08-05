import assert from 'node:assert/strict'
import { StandaloneCanonicalMusicSkillService } from '../edit-skills/music/canonical-music-skill-service'
import { MUSIC_MINI_SKILL_MANIFESTS } from '../edit-skills/music/music-mini-skill-registry'
import { MUSIC_TOOL_ROUTE_MANIFESTS, getMusicToolRouteManifest,
  publishMusicToolRouteManifest } from '../music/music-tool-routes'
import { hashMusicValue, type MusicCandidateAnalysis, type MusicEvidenceRef } from '../music/music-contracts'
import type { MusicContextArtifactResolver, ResolvedMusicContextEvidence } from '../music/music-context'
import { analyzePrivateMusicArtifact } from '../music/music-analysis'
import { selectProfessionalMusicAsset } from '../music/music-asset-matcher'
import { compileMusicSync } from '../music/music-sync'
import { createCanonicalMusicTestRuntime } from './canonical-music-test-runtime'
import { makeCanonicalMusicRequest, makeMusicCue, makeMusicRights } from './canonical-music-test-fixtures'

const failures: string[] = []
async function check(name: string, run: () => void | Promise<void>): Promise<void> {
  try { await run() } catch (error) {
    failures.push(`${name}:${error instanceof Error ? error.message : String(error)}`)
  }
}

class SegmentedContextResolver implements MusicContextArtifactResolver {
  async resolve(reference: MusicEvidenceRef): Promise<ResolvedMusicContextEvidence> {
    const payload = {
      storyPurpose: 'Move from testimony through a visual montage into a quiet resolution.',
      audience: 'approved audience', platform: 'platform-test',
      scenes: [
        { sceneId: 'scene-testimony', exactRange: { rangeId: 'scene-testimony-range', startFrame: 0, endFrameExclusive: 120 },
          storyFunction: 'testimony' as const, currentStoryState: 'testimony', targetStoryState: 'earned movement',
          importantSpeech: true, speechDensity: 0.9, naturalAmbienceValue: 'high' as const,
          visualPacing: 'measured' as const, visualRhythmAnchors: [0, 48, 96],
          emotionalPauseRanges: [{ rangeId: 'pause', startFrame: 96, endFrameExclusive: 120 }],
          transitionBoundaryIds: ['boundary-120'] },
        { sceneId: 'scene-montage', exactRange: { rangeId: 'scene-montage-range', startFrame: 120, endFrameExclusive: 300 },
          storyFunction: 'montage' as const, currentStoryState: 'movement', targetStoryState: 'arrival',
          importantSpeech: false, speechDensity: 0, naturalAmbienceValue: 'neutral' as const,
          visualPacing: 'rapid' as const, visualRhythmAnchors: [120, 168, 216, 264],
          emotionalPauseRanges: [], transitionBoundaryIds: ['boundary-120', 'boundary-300'] },
        { sceneId: 'scene-ending', exactRange: { rangeId: 'scene-ending-range', startFrame: 300, endFrameExclusive: 420 },
          storyFunction: 'ending' as const, currentStoryState: 'arrival', targetStoryState: 'resolution',
          importantSpeech: false, speechDensity: 0, naturalAmbienceValue: 'critical' as const,
          visualPacing: 'slow' as const, visualRhythmAnchors: [300, 360],
          emotionalPauseRanges: [{ rangeId: 'ending-pause', startFrame: 380, endFrameExclusive: 420 }],
          transitionBoundaryIds: ['boundary-300'] },
      ],
      protectedSpeechRanges: [{ rangeId: 'speech', startFrame: 0, endFrameExclusive: 96 }],
      sourceMusicArtifactIds: [], existingSoundPlanArtifactIds: [],
      declaredMusicDirection: ['Use restraint and preserve testimony and the final natural ambience.'],
    }
    return { reference: structuredClone(reference), payload, payloadHash: hashMusicValue(payload),
      resolverEvidence: ['v3_segmented_context_fixture'] }
  }
}

const runtime = await createCanonicalMusicTestRuntime()
const broad = { rangeId: 'broad', startFrame: 0, endFrameExclusive: 420 }
const autonomous = makeCanonicalMusicRequest({ requestId: 'music-v3-segmentation', mode: 'planning', cues: [],
  writeRanges: [broad], inspectRanges: [broad], allowGeneration: true, jobType: 'full_video_music_pass' })
const service = new StandaloneCanonicalMusicSkillService({ artifacts: runtime.resolver, context: new SegmentedContextResolver() })
const plan = await service.plan(autonomous)

await check('broad_range_segments', () => {
  const segmentation = (plan as unknown as { segmentationPlan?: { segments: Array<{ exactRange: typeof broad }> } }).segmentationPlan
  assert.ok(segmentation)
  assert.ok(segmentation.segments.length >= 3)
  assert.equal(segmentation.segments[0]?.exactRange.startFrame, broad.startFrame)
  assert.equal(segmentation.segments.at(-1)?.exactRange.endFrameExclusive, broad.endFrameExclusive)
})

await check('unlocked_constraints_resolve_once', async () => {
  const unlocked = makeMusicCue({ cueId: 'unlocked-preference', range: { rangeId: 'unlocked-range', startFrame: 120, endFrameExclusive: 240 } })
  const request = structuredClone(autonomous)
  request.requestId = 'music-v3-unlocked-constraint'
  request.idempotencyKey = 'music-v3-unlocked-constraint-key'
  request.cueConstraints.requestedCues = [unlocked]
  request.cueConstraints.lockedCueIds = []
  request.cueConstraints.allowMusicToCombineUnlockedCues = true
  const value = await service.plan(request)
  const resolutions = (value as unknown as { cueConstraintResolutions?: Array<{ constraintId: string }> }).cueConstraintResolutions ?? []
  assert.equal(resolutions.filter((item) => item.constraintId === unlocked.cueId).length, 1)
  const covering = value.cueSheet.payload.cues.filter((cue) => cue.exactRange.startFrame < unlocked.exactRange.endFrameExclusive &&
    cue.exactRange.endFrameExclusive > unlocked.exactRange.startFrame)
  for (let index = 1; index < covering.length; index += 1) {
    assert.ok(covering[index - 1]!.exactRange.endFrameExclusive <= covering[index]!.exactRange.startFrame)
  }
})

await check('mini_skill_implementation_evidence', () => {
  for (const descriptor of MUSIC_MINI_SKILL_MANIFESTS as unknown as Array<Record<string, unknown>>) {
    assert.ok(descriptor.implementationStatus)
    const evidence = descriptor.implementationEvidence as unknown[] | undefined
    assert.ok(evidence && evidence.length > 0)
  }
})

await check('route_named_outputs', () => {
  for (const route of MUSIC_TOOL_ROUTE_MANIFESTS as unknown as Array<Record<string, unknown>>) {
    assert.ok(Array.isArray(route.outputBindings))
    assert.ok((route.outputBindings as unknown[]).length > 0)
  }
})

await check('sound_parameters_applied', async () => {
  const asset = await runtime.makeWav({ id: 'v3-sound-source', durationSeconds: 8, frequency: 225, volume: 0.08 })
  const range = { rangeId: 'sound-range', startFrame: 48, endFrameExclusive: 192 }
  const cue = makeMusicCue({ cueId: 'sound-cue', range, acquisitionPreference: 'user_upload',
    protectedSpeechRanges: [{ rangeId: 'speech-inside', startFrame: 72, endFrameExclusive: 120 }] })
  const result = await runtime.music.execute(makeCanonicalMusicRequest({ requestId: 'music-v3-sound', mode: 'private_internal',
    cues: [cue], assets: [asset], rights: [makeMusicRights({ asset, source: 'user_upload' })] }))
  const receipt = result.soundSupportReceipts[0] as unknown as Record<string, unknown>
  assert.equal(typeof receipt.receivedTechnicalAutomationHash, 'string')
  assert.equal(receipt.receivedTechnicalAutomationHash, receipt.appliedTechnicalAutomationHash)
  assert.ok(Array.isArray(receipt.appliedOperationReceipts) && receipt.appliedOperationReceipts.length >= cue.soundProcessingIntent.length)
  for (const unit of result.unitReceipts.filter((item) => item.status === 'completed')) {
    const route = getMusicToolRouteManifest(unit.routeKey, unit.routeVersion)
    assert.ok(route)
    assert.ok(unit.outputBindings.length > 0, `${unit.unitId} has named outputs`)
    assert.equal(unit.stepReceipts.length, route.steps.length)
    for (const binding of unit.outputBindings) {
      const published: (typeof route.outputBindings)[number] | undefined = route.outputBindings
        .find((candidate) => candidate.bindingKey === binding.bindingKey)
      assert.ok(published)
      assert.equal(binding.producerStepKey, published.producerStepKey)
      assert.equal(binding.artifactType, published.artifactType)
      assert.ok(binding.artifactId && binding.artifactHash && binding.schemaVersion)
    }
    for (const required of route.outputBindings.filter((binding) => binding.required)) {
      assert.ok(unit.outputBindings.some((binding) => binding.bindingKey === required.bindingKey))
    }
  }
})

await check('route_publication_rejects_false_outputs', () => {
  const template = MUSIC_TOOL_ROUTE_MANIFESTS.find((route) => route.routeKey === 'music.route.select.candidate.v3')!
  const publish = publishMusicToolRouteManifest as unknown as (value: Record<string, unknown>) => unknown
  const { routeHash: _hash, qualificationStatus: _status, qualificationByMode: _modes,
    outputBindings: _bindings, ...seed } = structuredClone(template)
  assert.throws(() => publish({ ...seed, routeKey: 'music.route.fixture.false-output.v3',
    producedArtifactTypes: ['music_output_that_no_step_produces_v3'] }), /unreachable|undeclared/i)
  const step = structuredClone(template.steps[0]!)
  step.outputBindings = ['music_output_not_declared_by_operation_v3']
  assert.throws(() => publish({ ...seed, routeKey: 'music.route.fixture.undeclared-handler-output.v3',
    producedArtifactTypes: ['music_output_not_declared_by_operation_v3'], steps: [step] }), /undeclared operation output/i)
})

await check('peer_music_producing_acceptance', async () => {
  const asset = await runtime.makeWav({ id: 'v3-peer-track', durationSeconds: 8, frequency: 260, volume: 0.07 })
  for (const [jobType, callerType] of [
    ['support_motion_studio_music', 'motion_studio'], ['support_living_frame_music', 'living_frame'],
    ['support_3d_music', 'three_d'], ['support_transition_music', 'transitions'],
    ['support_graphic_design_music', 'graphic_design'],
  ] as const) {
    const range = { rangeId: `peer-${callerType}`, startFrame: 0, endFrameExclusive: 96 }
    const cue = makeMusicCue({ cueId: `peer-cue-${callerType}`, range, acquisitionPreference: 'user_upload' })
    const request = makeCanonicalMusicRequest({ requestId: `music-v3-peer-${callerType}`, mode: 'private_internal', jobType,
      assignmentMode: 'range', cues: [cue], assets: [asset], rights: [makeMusicRights({ asset, source: 'user_upload' })],
      caller: { callerType, callerSkillKey: callerType, callerSkillVersion: '1.0.0',
        callerManifestHash: hashMusicValue(`${callerType}-manifest`), parentWorkItemId: `${callerType}-work`,
        authorityRef: `authority-music-v3-peer-${callerType}`, ancestorSkillKeys: [], callerOwnedRanges: [range] } })
    const result = await runtime.music.execute(request)
    assert.equal(result.status, 'completed')
    assert.ok(result.selectedMusicAssetRefs.length > 0)
  }
})

await check('exact_acceptance_receipts', () => {
  const receipts = (plan as unknown as { acceptanceReceipts?: Array<{ jobType: string; capabilityKey: string; evidenceRefs: string[] }> })
    .acceptanceReceipts ?? []
  assert.ok(receipts.some((receipt) => receipt.jobType === autonomous.jobType &&
    receipt.capabilityKey === `music.${autonomous.jobType}` && receipt.evidenceRefs.length > 0))
})

await check('professional_source_and_library_matcher', async () => {
  const assets = await Promise.all([
    runtime.makeWav({ id: 'matcher-a', durationSeconds: 8, frequency: 175, volume: 0.06 }),
    runtime.makeWav({ id: 'matcher-b', durationSeconds: 8, frequency: 225, volume: 0.08 }),
    runtime.makeWav({ id: 'matcher-c-invalid-rights', durationSeconds: 8, frequency: 275, volume: 0.07 }),
  ])
  const rate = { numerator: 24, denominator: 1 }
  const analyses = await Promise.all(assets.map(async (asset) => analyzePrivateMusicArtifact({
    resolved: await runtime.resolver.resolve(asset), timelineRate: rate,
  })))
  const cue = makeMusicCue({ cueId: 'matcher-cue', range: { rangeId: 'matcher-range', startFrame: 0, endFrameExclusive: 96 },
    acquisitionPreference: 'user_upload', protectedSpeechRanges: [{ rangeId: 'matcher-speech', startFrame: 0, endFrameExclusive: 48 }] })
  cue.narrativeFunction = 'support_reflection'
  cue.tempoRangeBpm = { minimum: 60, maximum: 160 }
  const descriptors = assets.map((asset, index) => ({
    assetId: asset.artifactId, assetVersion: asset.version, assetHash: asset.checksumSha256,
    sourceType: 'user_upload' as const, availability: 'available' as const,
    descriptiveEvidenceLevel: 'structured' as const,
    narrativeFunctions: index === 0 ? ['create_motion' as const] : ['support_reflection' as const],
    energyProfile: index === 1 ? 'low' as const : 'high' as const,
    structuralTags: ['phrase_entries' as const, 'clean_ending' as const],
    declaredVocalPolicy: index === 1 ? 'instrumental' as const : 'uncertain' as const,
    continuityFamily: index === 1 ? 'reflective-family' : 'other-family', estimatedCredits: index + 1,
    evidenceRefs: [],
  }))
  for (const source of ['user_upload', 'project_library', 'workspace_library', 'internal_library'] as const) {
    const rights = assets.map((asset) => makeMusicRights({ asset, source }))
    rights[2] = { ...rights[2]!, commercialUse: 'not_allowed' }
    const sourceDescriptors = descriptors.map((descriptor) => ({ ...descriptor, sourceType: source }))
    const select = (ordered: readonly MusicCandidateAnalysis[]) => selectProfessionalMusicAsset({
      cue, analyses: ordered, rightsBindings: rights, descriptors: sourceDescriptors, timelineRate: rate,
      projectId: 'project-test', workspaceId: 'workspace-test', platformIds: ['platform-test'],
      continuityFamily: 'reflective-family', maximumCredits: 20, nowEpochMs: 1_700_000_000_000,
    })
    const forward = select(analyses)
    const reverse = select([...analyses].reverse())
    assert.equal(forward.selectedCandidateId, assets[1]!.artifactId, `${source} selected professional fit`)
    assert.equal(reverse.selectedCandidateId, forward.selectedCandidateId, `${source} independent of input order`)
    assert.ok(forward.evaluatedCandidates.find((candidate) => candidate.candidateArtifactId === assets[2]!.artifactId)!
      .blockingFailures.includes('commercial_use_not_allowed'))
    assert.ok(forward.evaluatedCandidates.some((candidate) =>
      candidate.reviewRequiredFindings.includes('vocal_presence_uncertain_under_protected_speech')))
  }
  const denied = assets.map((asset) => ({ ...makeMusicRights({ asset, source: 'user_upload' }),
    commercialUse: 'not_allowed' as const }))
  const noMatch = selectProfessionalMusicAsset({ cue, analyses, rightsBindings: denied, descriptors,
    timelineRate: rate, projectId: 'project-test', workspaceId: 'workspace-test', platformIds: ['platform-test'],
    nowEpochMs: 1_700_000_000_000 })
  assert.equal(noMatch.selectedCandidateId, null)
  assert.equal(noMatch.fallbackDecision, 'blocked_rights_or_fit')
})

await check('anchor_driven_music_sync', async () => {
  const source = await runtime.makeWav({ id: 'anchor-sync', durationSeconds: 8, frequency: 240, volume: 0.07 })
  const measured = await analyzePrivateMusicArtifact({ resolved: await runtime.resolver.resolve(source),
    timelineRate: { numerator: 24, denominator: 1 } })
  const analysis: MusicCandidateAnalysis = { ...measured, beatFrames: [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165],
    phraseBoundaryFrames: [0, 30, 75, 130], sectionBoundaryFrames: [0, 75, 130],
    loopQuality: { score: 0.8, reviewRequired: false }, endingQuality: { score: 0.8, reviewRequired: false } }
  const baseCue = makeMusicCue({ cueId: 'anchor-cue', range: { rangeId: 'anchor-range', startFrame: 0, endFrameExclusive: 96 } })
  baseCue.entryHandleFrames = 0
  baseCue.syncAnchorFrames = [45]
  const first = compileMusicSync({ cue: baseCue, analysis, timelineHash: hashMusicValue('anchor-timeline'),
    timelineRate: { numerator: 24, denominator: 1 }, intent: 'phrase_aligned' })
  const changedCue = structuredClone(baseCue)
  changedCue.syncAnchorFrames = [60]
  const changed = compileMusicSync({ cue: changedCue, analysis, timelineHash: hashMusicValue('anchor-timeline'),
    timelineRate: { numerator: 24, denominator: 1 }, intent: 'phrase_aligned' })
  assert.notEqual(first.alignmentDecision.selectedSourceStartSample, changed.alignmentDecision.selectedSourceStartSample)
  assert.equal(first.alignmentDecision.selectedTargetStartFrame, 0)
  const flexibleCue = structuredClone(baseCue)
  flexibleCue.entryHandleFrames = 10
  flexibleCue.syncAnchorFrames = [40]
  const flexible = compileMusicSync({ cue: flexibleCue, analysis, timelineHash: hashMusicValue('anchor-timeline'),
    timelineRate: { numerator: 24, denominator: 1 }, intent: 'phrase_aligned' })
  assert.ok(flexible.alignmentDecision.selectedTargetStartFrame >= 0 &&
    flexible.alignmentDecision.selectedTargetStartFrame <= 10)
  const offBeat = compileMusicSync({ cue: flexibleCue, analysis, timelineHash: hashMusicValue('anchor-timeline'),
    timelineRate: { numerator: 24, denominator: 1 }, intent: 'intentionally_off_beat' })
  assert.equal(offBeat.alignmentDecision.entryDecision, 'intentional_no_snap')
  assert.equal(offBeat.placement.residualAlignmentFrames, 0)
  const unsafe = compileMusicSync({ cue: baseCue, analysis: { ...analysis, durationSeconds: 1,
    loopQuality: { score: 0.1, reviewRequired: false } }, timelineHash: hashMusicValue('anchor-timeline'),
    timelineRate: { numerator: 24, denominator: 1 }, intent: 'phrase_aligned' })
  assert.equal(unsafe.editorial.requiresDifferentCue, true)
})

assert.deepEqual(failures, [], `Canonical Music v3 integrity regressions failed:\n${failures.join('\n')}`)
console.log(JSON.stringify({ status: 'ok', atomicSegmentCount: (plan as any).segmentationPlan.segments.length,
  peerMusicProducingScenarios: 5, routeCount: MUSIC_TOOL_ROUTE_MANIFESTS.length,
  miniSkillCount: MUSIC_MINI_SKILL_MANIFESTS.length }, null, 2))
