import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { lstat, mkdir, readFile, realpath, stat, writeFile } from 'node:fs/promises'
import { isAbsolute, relative, resolve } from 'node:path'
import { promisify } from 'node:util'
import {
  EDIT_REFERENCE_CONTROLLED_MEDIA_FIXTURE_DEFINITIONS,
  materializeEditReferenceControlledMediaFixture,
  type EditReferenceControlledMediaCue,
  type EditReferenceControlledMediaFixtureDefinition,
} from './edit-reference-controlled-media-fixtures'

const execFileAsync = promisify(execFile)

export const EDIT_REFERENCE_CONTROLLED_SPOKEN_MEDIA_FIXTURE_VERSION =
  'edit-reference-controlled-spoken-media-fixture-v1' as const

export const EDIT_REFERENCE_CONTROLLED_SPOKEN_MEDIA_FIXTURE_ID =
  'reference_b_educational_voice_first_spoken' as const

export const EDIT_REFERENCE_CONTROLLED_SPOKEN_MEDIA_TEXT =
  'First define the problem. Then inspect one clear example. Finish with the practical takeaway.' as const

export interface EditReferenceControlledSpeechSynthesisReceipt {
  readonly generatorId: 'local_system_speech_synthesizer_test_only'
  readonly voiceLabel: 'system_default_english_test_voice'
  readonly language: 'en-US'
  readonly rightsBasis: 'synthetic_internal_test_only'
  readonly distribution: 'ephemeral_not_committed'
  readonly providerCallMade: false
  readonly modelDownloadMade: false
}

export type EditReferenceControlledSpeechSynthesizer = (input: {
  readonly outputPath: string
  readonly text: typeof EDIT_REFERENCE_CONTROLLED_SPOKEN_MEDIA_TEXT
  readonly language: 'en-US'
}) => Promise<EditReferenceControlledSpeechSynthesisReceipt>

export interface EditReferenceControlledSpokenMediaGroundTruth {
  readonly schemaVersion: typeof EDIT_REFERENCE_CONTROLLED_SPOKEN_MEDIA_FIXTURE_VERSION
  readonly fixtureId: typeof EDIT_REFERENCE_CONTROLLED_SPOKEN_MEDIA_FIXTURE_ID
  readonly sourceFixtureId: 'reference_b_educational_voice_first'
  readonly rightsBasis: 'synthetic_internal_test_only'
  readonly retention: 'ephemeral_not_committed'
  readonly media: {
    readonly width: number
    readonly height: number
    readonly frameRate: number
    readonly durationSeconds: number
    readonly hasAudioStream: true
    readonly actualAudioMode: 'local_synthetic_spoken_audio'
    readonly semanticSpeechPresent: true
    readonly semanticSpeechPresenceBasis: 'controlled_speech_synthesis_input'
    readonly visibleCaptionPixelsPresent: true
    readonly embeddedTimedTextPresent: true
  }
  readonly speech: {
    readonly language: 'en-US'
    readonly text: typeof EDIT_REFERENCE_CONTROLLED_SPOKEN_MEDIA_TEXT
    readonly source: 'fixture_generation_ground_truth_not_transcribed'
    readonly inputAudioDurationSeconds: number
    readonly inputAudioChecksumSha256: string
    readonly segmentTimingStatus: 'not_transcribed_or_aligned'
    readonly wordTimingStatus: 'not_executed'
  }
  readonly synthesis: EditReferenceControlledSpeechSynthesisReceipt
  readonly expectedEvidence: unknown
  readonly runtimeTruth: {
    readonly fixtureSpeechSynthesisExecuted: true
    readonly mediaMuxExecuted: true
    readonly transcriptionRuntimeExecuted: false
    readonly speechPacingSemanticRuntimeExecuted: false
    readonly providerCallMade: false
    readonly modelDownloadMade: false
    readonly productionCostMeasured: false
    readonly customerPriceCalculated: false
    readonly customerCreditsMutated: false
    readonly remoteMutationMade: false
    readonly productionReady: false
  }
}

export interface MaterializedEditReferenceControlledSpokenMediaFixture {
  readonly fixtureId: typeof EDIT_REFERENCE_CONTROLLED_SPOKEN_MEDIA_FIXTURE_ID
  readonly videoPath: string
  readonly speechAudioPath: string
  readonly groundTruthPath: string
  readonly subtitlePath: string
  readonly captionOverlayPaths: readonly string[]
  readonly videoChecksumSha256: string
  readonly speechAudioChecksumSha256: string
  readonly groundTruthChecksumSha256: string
  readonly videoSizeBytes: number
  readonly speechAudioSizeBytes: number
  readonly groundTruth: EditReferenceControlledSpokenMediaGroundTruth
}

interface AudioProbeResult {
  readonly durationSeconds: number
  readonly audioStreamCount: number
}

const MAX_SPEECH_AUDIO_BYTES = 10 * 1024 * 1024
const MAX_SPEECH_AUDIO_DURATION_SECONDS = 30

function assertSafeOutputRoot(outputRoot: string): string {
  if (!isAbsolute(outputRoot)) {
    throw new Error('Controlled spoken media fixture output root must be absolute.')
  }
  return resolve(outputRoot)
}

function resolveInsideRoot(root: string, ...segments: string[]): string {
  const candidate = resolve(root, ...segments)
  const relativePath = relative(root, candidate)
  if (relativePath === '' || (!relativePath.startsWith('..') && !isAbsolute(relativePath))) {
    return candidate
  }
  throw new Error('Controlled spoken media fixture path escaped its output root.')
}

function assertReceipt(receipt: EditReferenceControlledSpeechSynthesisReceipt): void {
  if (
    receipt.generatorId !== 'local_system_speech_synthesizer_test_only'
    || receipt.voiceLabel !== 'system_default_english_test_voice'
    || receipt.language !== 'en-US'
    || receipt.rightsBasis !== 'synthetic_internal_test_only'
    || receipt.distribution !== 'ephemeral_not_committed'
    || receipt.providerCallMade !== false
    || receipt.modelDownloadMade !== false
  ) {
    throw new Error('Controlled spoken media fixture received an unsupported synthesis receipt.')
  }
}

async function checksumFile(path: string): Promise<string> {
  const bytes = await readFile(path)
  return createHash('sha256').update(bytes).digest('hex')
}

async function probeAudio(input: {
  path: string
  ffprobeBin: string
  timeoutMs: number
}): Promise<AudioProbeResult> {
  const { stdout } = await execFileAsync(input.ffprobeBin, [
    '-v',
    'error',
    '-show_streams',
    '-show_format',
    '-of',
    'json',
    input.path,
  ], {
    timeout: input.timeoutMs,
    windowsHide: true,
    maxBuffer: 1024 * 1024,
  })
  const parsed = JSON.parse(stdout) as {
    streams?: Array<{ codec_type?: string }>
    format?: { duration?: string }
  }
  return {
    durationSeconds: Number(parsed.format?.duration),
    audioStreamCount: (parsed.streams ?? []).filter((stream) => stream.codec_type === 'audio').length,
  }
}

function boundedCues(
  durationSeconds: number,
  sourceCues: readonly EditReferenceControlledMediaCue[],
): readonly EditReferenceControlledMediaCue[] {
  const segmentDuration = durationSeconds / sourceCues.length
  return sourceCues.map((cue, index) => ({
    startSeconds: Number(((index * segmentDuration) + (segmentDuration * 0.1)).toFixed(3)),
    endSeconds: Number(((index * segmentDuration) + (segmentDuration * 0.9)).toFixed(3)),
    text: cue.text,
  }))
}

function sourceDefinition(): EditReferenceControlledMediaFixtureDefinition {
  const source = EDIT_REFERENCE_CONTROLLED_MEDIA_FIXTURE_DEFINITIONS.find(
    (definition) => definition.fixtureId === 'reference_b_educational_voice_first',
  )
  if (!source) throw new Error('Controlled spoken media source fixture is missing.')
  return source
}

export async function materializeEditReferenceControlledSpokenMediaFixture(input: {
  readonly outputRoot: string
  readonly synthesizeSpeech: EditReferenceControlledSpeechSynthesizer
  readonly ffmpegBin?: string
  readonly ffprobeBin?: string
  readonly timeoutMs?: number
}): Promise<MaterializedEditReferenceControlledSpokenMediaFixture> {
  const outputRoot = assertSafeOutputRoot(input.outputRoot)
  const fixtureRoot = resolveInsideRoot(outputRoot, EDIT_REFERENCE_CONTROLLED_SPOKEN_MEDIA_FIXTURE_ID)
  const structuralRoot = resolveInsideRoot(fixtureRoot, 'structural-base')
  const speechAudioPath = resolveInsideRoot(fixtureRoot, 'synthetic-speech.aiff')
  const videoPath = resolveInsideRoot(fixtureRoot, 'fixture-spoken.mp4')
  const groundTruthPath = resolveInsideRoot(fixtureRoot, 'spoken-ground-truth.json')
  const timeoutMs = input.timeoutMs ?? 30_000
  const ffmpegBin = input.ffmpegBin ?? process.env.FFMPEG_BIN ?? 'ffmpeg'
  const ffprobeBin = input.ffprobeBin ?? process.env.FFPROBE_BIN ?? 'ffprobe'
  await mkdir(fixtureRoot, { recursive: true })

  try {
    await lstat(speechAudioPath)
    throw new Error('Controlled spoken media fixture speech output already exists.')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }

  const synthesis = await input.synthesizeSpeech({
    outputPath: speechAudioPath,
    text: EDIT_REFERENCE_CONTROLLED_SPOKEN_MEDIA_TEXT,
    language: 'en-US',
  })
  assertReceipt(synthesis)

  const speechLstat = await lstat(speechAudioPath)
  if (!speechLstat.isFile() || speechLstat.isSymbolicLink()) {
    throw new Error('Controlled spoken media fixture speech output must be a regular file, not a link.')
  }
  if (speechLstat.size < 1 || speechLstat.size > MAX_SPEECH_AUDIO_BYTES) {
    throw new Error('Controlled spoken media fixture speech output size is outside the allowed bound.')
  }
  const resolvedSpeechPath = await realpath(speechAudioPath)
  if (resolveInsideRoot(fixtureRoot, relative(fixtureRoot, resolvedSpeechPath)) !== resolvedSpeechPath) {
    throw new Error('Controlled spoken media fixture speech output resolved outside its fixture root.')
  }

  const inputAudioProbe = await probeAudio({ path: speechAudioPath, ffprobeBin, timeoutMs })
  if (
    inputAudioProbe.audioStreamCount !== 1
    || !Number.isFinite(inputAudioProbe.durationSeconds)
    || inputAudioProbe.durationSeconds < 0.5
    || inputAudioProbe.durationSeconds > MAX_SPEECH_AUDIO_DURATION_SECONDS
  ) {
    throw new Error('Controlled spoken media fixture speech output is not one bounded audio stream.')
  }

  const durationSeconds = Number((Math.max(6, inputAudioProbe.durationSeconds + 0.25)).toFixed(3))
  const source = sourceDefinition()
  const structuralDefinition: EditReferenceControlledMediaFixtureDefinition = {
    ...source,
    durationSeconds,
    intendedHasSpeech: true,
    actualAudioMode: 'silent',
    audioFrequencyHz: undefined,
    transcriptCues: [{
      startSeconds: 0,
      endSeconds: Number(Math.min(inputAudioProbe.durationSeconds, durationSeconds).toFixed(3)),
      text: EDIT_REFERENCE_CONTROLLED_SPOKEN_MEDIA_TEXT,
    }],
    captionCues: boundedCues(durationSeconds, source.captionCues),
    visualGroundTruth: [
      ...source.visualGroundTruth,
      'The final spoken fixture replaces the structural base silence with ephemeral local synthetic speech.',
    ],
  }

  const structural = await materializeEditReferenceControlledMediaFixture({
    outputRoot: structuralRoot,
    definition: structuralDefinition,
    ffmpegBin,
    timeoutMs,
  })

  await execFileAsync(ffmpegBin, [
    '-hide_banner',
    '-loglevel',
    'error',
    '-nostdin',
    '-y',
    '-i',
    structural.videoPath,
    '-i',
    speechAudioPath,
    '-map',
    '0:v:0',
    '-map',
    '1:a:0',
    '-map',
    '0:s:0?',
    '-c:v',
    'copy',
    '-c:a',
    'aac',
    '-b:a',
    '96k',
    '-af',
    'apad',
    '-c:s',
    'copy',
    '-t',
    String(durationSeconds),
    '-movflags',
    '+faststart',
    videoPath,
  ], {
    timeout: timeoutMs,
    windowsHide: true,
    maxBuffer: 1024 * 1024,
  })

  const finalProbe = await probeAudio({ path: videoPath, ffprobeBin, timeoutMs })
  if (
    finalProbe.audioStreamCount !== 1
    || !Number.isFinite(finalProbe.durationSeconds)
    || Math.abs(finalProbe.durationSeconds - durationSeconds) > 0.2
  ) {
    throw new Error('Controlled spoken media fixture final media did not preserve one bounded audio stream.')
  }

  const [speechAudioChecksumSha256, videoChecksumSha256] = await Promise.all([
    checksumFile(speechAudioPath),
    checksumFile(videoPath),
  ])
  const groundTruth: EditReferenceControlledSpokenMediaGroundTruth = {
    schemaVersion: EDIT_REFERENCE_CONTROLLED_SPOKEN_MEDIA_FIXTURE_VERSION,
    fixtureId: EDIT_REFERENCE_CONTROLLED_SPOKEN_MEDIA_FIXTURE_ID,
    sourceFixtureId: 'reference_b_educational_voice_first',
    rightsBasis: 'synthetic_internal_test_only',
    retention: 'ephemeral_not_committed',
    media: {
      width: source.width,
      height: source.height,
      frameRate: source.frameRate,
      durationSeconds,
      hasAudioStream: true,
      actualAudioMode: 'local_synthetic_spoken_audio',
      semanticSpeechPresent: true,
      semanticSpeechPresenceBasis: 'controlled_speech_synthesis_input',
      visibleCaptionPixelsPresent: true,
      embeddedTimedTextPresent: true,
    },
    speech: {
      language: 'en-US',
      text: EDIT_REFERENCE_CONTROLLED_SPOKEN_MEDIA_TEXT,
      source: 'fixture_generation_ground_truth_not_transcribed',
      inputAudioDurationSeconds: Number(inputAudioProbe.durationSeconds.toFixed(3)),
      inputAudioChecksumSha256: speechAudioChecksumSha256,
      segmentTimingStatus: 'not_transcribed_or_aligned',
      wordTimingStatus: 'not_executed',
    },
    synthesis,
    expectedEvidence: structural.groundTruth.expectedEvidence,
    runtimeTruth: {
      fixtureSpeechSynthesisExecuted: true,
      mediaMuxExecuted: true,
      transcriptionRuntimeExecuted: false,
      speechPacingSemanticRuntimeExecuted: false,
      providerCallMade: false,
      modelDownloadMade: false,
      productionCostMeasured: false,
      customerPriceCalculated: false,
      customerCreditsMutated: false,
      remoteMutationMade: false,
      productionReady: false,
    },
  }
  await writeFile(groundTruthPath, `${JSON.stringify(groundTruth, null, 2)}\n`, {
    encoding: 'utf8',
    flag: 'wx',
  })

  const [videoStat, speechAudioStat, groundTruthChecksumSha256] = await Promise.all([
    stat(videoPath),
    stat(speechAudioPath),
    checksumFile(groundTruthPath),
  ])

  return {
    fixtureId: EDIT_REFERENCE_CONTROLLED_SPOKEN_MEDIA_FIXTURE_ID,
    videoPath,
    speechAudioPath,
    groundTruthPath,
    subtitlePath: structural.subtitlePath,
    captionOverlayPaths: structural.captionOverlayPaths,
    videoChecksumSha256,
    speechAudioChecksumSha256,
    groundTruthChecksumSha256,
    videoSizeBytes: videoStat.size,
    speechAudioSizeBytes: speechAudioStat.size,
    groundTruth,
  }
}
