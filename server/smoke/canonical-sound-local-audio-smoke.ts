import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import {
  getSoundLocalOperationProfiles,
  runSoundLocalAudioExecution,
  type SoundLocalAudioExecutionPackage,
  type SoundLocalOperation,
} from '../sound/sound-local-audio-processor'
import { soundSkillCapabilityManifest } from '../sound/sound-manifest'
import {
  createReferenceSoundDna,
  createSourceSoundStudy,
  createVisualSoundEventStudy,
} from '../sound/sound-study'
import {
  admitSoundControllerRoute,
} from '../sound/sound-tool-views'
import { getSoundToolRouteManifest } from '../sound/sound-tool-route-manifest'

const execFileAsync = promisify(execFile)
const root = await mkdtemp(join(tmpdir(), 'reeditpro-sound-local-'))
const inputRoot = join(root, 'private-input')
const outputRoot = join(root, 'private-output')
await mkdir(inputRoot, { recursive: true, mode: 0o700 })
await mkdir(outputRoot, { recursive: true, mode: 0o700 })
const sourcePath = join(inputRoot, 'approved-source.wav')

try {
  await execFileAsync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-nostdin', '-y',
    '-f', 'lavfi',
    '-i', 'aevalsrc=if(lt(t\\,0.5)\\,0\\,if(lt(t\\,0.501)\\,0.95\\,0.2*sin(2*PI*440*t))):d=3:s=48000',
    '-ac', '2', '-c:a', 'pcm_s24le', sourcePath,
  ], { timeout: 30_000 })
  const sourceBytes = await readFile(sourcePath)
  const sourceChecksum = createHash('sha256').update(sourceBytes).digest('hex')
  const source = {
    artifact: {
      artifactId: 'approved-source-audio',
      artifactType: 'approved_source_audio',
      version: 1,
      checksumSha256: sourceChecksum,
      storageObjectId: 'private:approved-source-audio:v1',
      private: true as const,
      contentType: 'audio/wav',
      durationFrames: 90,
    },
    absolutePath: sourcePath,
  }
  const binding = {
    soundSkillVersion: soundSkillCapabilityManifest.skillVersion,
    soundManifestHash: soundSkillCapabilityManifest.manifestHash,
    capabilityKey: 'sound.edit_audio',
    approvedPlanSnapshotId: 'approved-snapshot-local-audio',
    approvedPlanSnapshotHash: createHash('sha256').update('snapshot').digest('hex'),
    approvedWorkItemId: 'approved-work-local-audio',
    privateOutputScopeId: 'private-output-local-audio',
    idempotencyKey: 'local-audio-idempotency',
  }
  const profileByOperation: Record<SoundLocalOperation, string> = Object.fromEntries(
    Object.entries(getSoundLocalOperationProfiles()).map(([operation, profile]) => [operation, profile.profileKey]),
  ) as Record<SoundLocalOperation, string>

  function execution(
    operation: SoundLocalOperation,
    suffix: string,
    parameters: SoundLocalAudioExecutionPackage['parameters'] = {},
    sources = [source],
  ): SoundLocalAudioExecutionPackage {
    const outputRequired = operation !== 'analyze' && operation !== 'sync_qa'
    const routeIdentity: Record<SoundLocalOperation, [string, string, string]> = {
      analyze: ['sound.route.study.source_audio.v1', 'sound.study_source_audio', 'study_source_audio'],
      extract: ['sound.route.acquire.project_source.v1', 'sound.extract_project_owned_sound', 'extract_project_owned_sound'],
      trim_fade_gain: ['sound.route.edit.deterministic.v1', 'sound.edit_audio', 'edit_audio'],
      normalize: ['sound.route.edit.deterministic.v1', 'sound.normalize_audio', 'normalize_audio'],
      resample_channels: ['sound.route.edit.deterministic.v1', 'sound.resample_audio', 'resample_audio'],
      loop_crossfade: ['sound.route.edit.deterministic.v1', 'sound.loop_audio', 'loop_audio'],
      stretch_pitch: ['sound.route.retime.pitch_preserved.v1', 'sound.time_stretch_audio', 'time_stretch_audio'],
      mix_stem: ['sound.route.mix.scene.v1', 'sound.mix_sound_layers', 'mix_sound_layers'],
      sync_qa: ['sound.route.sync.visual_event.v1', 'sound.sync_audio_to_visual', 'sync_audio_to_visual'],
      cleanup_gentle: ['sound.route.repair.dialogue_gentle.v1', 'sound.clean_dialogue', 'clean_dialogue'],
    }
    const [routeKey, capabilityKey, jobType] = routeIdentity[operation]
    const route = getSoundToolRouteManifest(routeKey)!
    const routeAdmission = admitSoundControllerRoute({
      routeKey,
      capabilityKey,
      jobType,
      mode: 'planning',
      scope: 'range',
      availableInputKeys: [...route.requiredInputs],
      availableQaKeys: [],
      runtimeStatuses: [],
      budgetApproved: true,
      rateCardSnapshotIds: {},
      licenseEvidenceRefs: {
        ffmpeg: 'sound.license_evidence.private_local_gpl_development_only.v1',
        ffprobe: 'sound.license_evidence.private_local_gpl_development_only.v1',
      },
    })
    assert.equal(routeAdmission.admitted, true, routeAdmission.reasons.join(','))
    return {
      schemaVersion: 'sound-local-audio-execution-v1',
      executionId: `sound-local-${operation}-${suffix}`,
      binding: {
        ...binding,
        idempotencyKey: `local-${operation}-${suffix}`,
        routeBinding: routeAdmission.binding!,
      },
      operation,
      operationProfileKey: profileByOperation[operation],
      sources,
      approvedInputRoot: inputRoot,
      privateOutputRoot: outputRoot,
      outputRelativePath: outputRequired ? `sound/${operation}-${suffix}.wav` : undefined,
      outputArtifactId: outputRequired ? `artifact-${operation}-${suffix}` : undefined,
      outputArtifactType: outputRequired ? 'edited_audio_asset_version' : undefined,
      outputContentType: outputRequired ? 'audio/wav' : undefined,
      parameters,
    }
  }

  const analysis = await runSoundLocalAudioExecution(execution('analyze', 'study'))
  assert.equal(analysis.status, 'completed')
  assert.ok(analysis.studyReport)
  assert.ok(analysis.studyReport!.decodedSampleCount > 0)
  assert.ok(analysis.studyReport!.durationSeconds >= 2.9)
  assert.equal(analysis.studyReport!.sampleRate, 48_000)
  assert.equal(analysis.studyReport!.channels, 2)
  assert.ok(analysis.studyReport!.silenceRangesSeconds.length > 0)
  assert.ok(analysis.studyReport!.transientTimesSeconds.some((time) => Math.abs(time - 0.5) < 0.05))
  assert.equal(Number.isFinite(analysis.studyReport!.integratedLoudnessLufs), true)
  assert.equal(Number.isFinite(analysis.studyReport!.truePeakDbtp), true)
  assert.match(analysis.toolEvidence.ffmpegVersion, /^ffmpeg version/)
  assert.match(analysis.toolEvidence.ffprobeVersion, /^ffprobe version/)
  assert.equal(analysis.toolEvidence.arbitraryArgumentsAccepted, false)
  const sourceStudy = createSourceSoundStudy({
    sourceAudioHash: sourceChecksum,
    technical: analysis.studyReport!,
    speechRanges: [{ rangeId: 'speech', startFrame: 30, endFrameExclusive: 60 }],
  })
  assert.equal(sourceStudy.decodedEvidence.decodedSampleCount > 0, true)
  assert.equal(sourceStudy.importantSilenceRangesSeconds.length > 0, true)
  const referenceDna = createReferenceSoundDna({
    referenceSoundHash: sourceChecksum,
    technical: analysis.studyReport!,
    declaredMaterial: 'wood',
    declaredPerspective: 'medium',
    declaredRoom: 'small',
    emotionalFunction: 'restrained tactile support',
    provenanceApproved: true,
    directCopyRequested: false,
  })
  assert.equal(referenceDna.material, 'wood')
  assert.equal(referenceDna.copyProvenanceRisk, 'low')
  assert.equal(referenceDna.durationSeconds >= 2.9, true)
  const visualStudy = createVisualSoundEventStudy({
    sourceVisualHash: createHash('sha256').update('visual').digest('hex'),
    timingManifestHash: createHash('sha256').update('timing').digest('hex'),
    events: [{
      anchorId: 'contact-1',
      eventType: 'object_contact',
      frame: 15,
      endFrameExclusive: 18,
      material: 'wood',
      perspective: 'medium',
      environment: 'interior',
      importance: 'foreground',
      soundWouldImproveEdit: true,
      contactPoint: true,
      movement: true,
      sizeAndWeight: 'medium',
      velocity: 'fast',
    }],
  })
  assert.equal(visualStudy.events[0]?.contactPoint, true)
  assert.equal(visualStudy.events[0]?.velocity, 'fast')

  const extract = await runSoundLocalAudioExecution(execution('extract', 'extract'))
  assert.ok(extract.outputArtifact)
  assert.equal(extract.outputArtifact!.private, true)
  assert.equal(extract.qaEvidence.outputMediaValidated, true)

  const trim = await runSoundLocalAudioExecution(execution('trim_fade_gain', 'trim', {
    trimStartSeconds: 0.4,
    durationSeconds: 1.2,
    fadeInSeconds: 0.05,
    fadeOutSeconds: 0.08,
    gainDb: -3,
    sampleRate: 48_000,
    channels: 2,
  }))
  assert.ok(trim.outputArtifact)

  const normalize = await runSoundLocalAudioExecution(execution('normalize', 'normalize', {
    targetLoudnessLufs: -18,
    maximumTruePeakDbtp: -1.5,
    sampleRate: 48_000,
    channels: 2,
  }))
  assert.ok(normalize.outputArtifact)

  const resampled = await runSoundLocalAudioExecution(execution('resample_channels', 'mono-44k', {
    sampleRate: 44_100,
    channels: 1,
  }))
  const resampledPath = join(outputRoot, 'sound', 'resample_channels-mono-44k.wav')
  const resampledAnalysis = await runSoundLocalAudioExecution({
    ...execution('analyze', 'resampled-study', {}),
    sources: [{
      artifact: { ...resampled.outputArtifact!, durationFrames: 90 },
      absolutePath: resampledPath,
    }],
    approvedInputRoot: outputRoot,
  })
  assert.equal(resampledAnalysis.studyReport!.sampleRate, 44_100)
  assert.equal(resampledAnalysis.studyReport!.channels, 1)

  const looped = await runSoundLocalAudioExecution(execution('loop_crossfade', 'ambience-loop', {
    durationSeconds: 5,
    loopCrossfadeSeconds: 0.1,
    sampleRate: 48_000,
    channels: 2,
  }))
  const loopedAnalysis = await runSoundLocalAudioExecution({
    ...execution('analyze', 'loop-study'),
    sources: [{ artifact: { ...looped.outputArtifact!, durationFrames: 150 }, absolutePath: join(outputRoot, 'sound', 'loop_crossfade-ambience-loop.wav') }],
    approvedInputRoot: outputRoot,
  })
  assert.ok(loopedAnalysis.studyReport!.durationSeconds >= 4.9)

  const stretched = await runSoundLocalAudioExecution(execution('stretch_pitch', 'stretch-pitch', {
    tempoRatio: 1.1,
    pitchSemitones: 2,
    sampleRate: 48_000,
    channels: 2,
  }))
  assert.ok(stretched.outputArtifact)

  const cleaned = await runSoundLocalAudioExecution(execution('cleanup_gentle', 'cleanup', {
    sampleRate: 48_000,
    channels: 2,
  }))
  assert.ok(cleaned.outputArtifact)

  const mixed = await runSoundLocalAudioExecution(execution('mix_stem', 'private-stem', {
    inputGainDb: [0, -10],
    dialogueInputIndex: 0,
    dialogueDuckingDb: -9,
    sampleRate: 48_000,
    channels: 2,
  }, [source, { ...source, artifact: { ...source.artifact, artifactId: 'approved-sfx-layer' } }]))
  assert.ok(mixed.outputArtifact)
  assert.equal(mixed.outputArtifact!.artifactType, 'edited_audio_asset_version')

  const syncQa = await runSoundLocalAudioExecution(execution('sync_qa', 'transient', {
    expectedHitSeconds: 0.5,
    maximumSyncErrorSeconds: 0.06,
  }))
  assert.ok(syncQa.studyReport!.transientTimesSeconds.length > 0)

  const replay = await runSoundLocalAudioExecution(execution('extract', 'extract'))
  assert.equal(replay.idempotentReplay, true)
  assert.equal(replay.outputArtifact!.checksumSha256, extract.outputArtifact!.checksumSha256)

  assert.equal(createHash('sha256').update(await readFile(sourcePath)).digest('hex'), sourceChecksum)
  assert.equal((await stat(sourcePath)).size, sourceBytes.length)
  const outputStat = await stat(join(outputRoot, 'sound', 'extract-extract.wav'))
  assert.equal(outputStat.mode & 0o777, 0o600)
  assert.equal((await stat(outputRoot)).mode & 0o777, 0o700)
  assert.ok(trim.runtimeEvidence.elapsedMilliseconds >= 0)
  assert.ok(trim.runtimeEvidence.localComputeCostUsd >= 0)

  await assert.rejects(
    runSoundLocalAudioExecution({
      ...execution('extract', 'unsafe-path'),
      outputRelativePath: '../escape.wav',
    }),
    /safe server-owned relative path/,
  )
  await assert.rejects(
    runSoundLocalAudioExecution({
      ...execution('extract', 'bad-checksum'),
      sources: [{
        ...source,
        artifact: { ...source.artifact, checksumSha256: '0'.repeat(64) },
      }],
    }),
    /checksum mismatch/,
  )
  await assert.rejects(
    runSoundLocalAudioExecution({
      ...execution('extract', 'unknown-field'),
      arbitraryArgs: ['-filter_complex', 'evil'],
    } as SoundLocalAudioExecutionPackage),
    /unsupported fields/,
  )
  await assert.rejects(
    runSoundLocalAudioExecution({
      ...execution('normalize', 'unknown-parameter'),
      parameters: { filterGraph: 'volume=99' } as SoundLocalAudioExecutionPackage['parameters'],
    }),
    /unsupported fields/,
  )
  await assert.rejects(
    runSoundLocalAudioExecution({
      ...execution('extract', 'source-overwrite'),
      privateOutputRoot: inputRoot,
      outputRelativePath: 'approved-source.wav',
    }),
    /must not overwrite/,
  )

  process.stdout.write('Canonical Sound real local audio smoke passed.\n')
} finally {
  await rm(root, { recursive: true, force: true })
}
