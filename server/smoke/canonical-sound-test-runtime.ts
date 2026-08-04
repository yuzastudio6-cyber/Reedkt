import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'
import type { CanonicalSoundRequest, SoundArtifactRef } from '../sound/sound-contracts'
import type {
  CanonicalSoundArtifactResolver,
  ResolvedPrivateSoundArtifact,
} from '../edit-skills/sound/sound-route-executor'
import {
  InMemoryMireloAttemptStore,
  MireloSfxProviderAdapter,
  type MireloCarrierAudioExtractor,
  type MireloTransport,
  type MireloTransportRequest,
  type MireloTransportResponse,
} from '../sound/mirelo-sfx-provider'
import { PrivateMireloOutputIngestor } from '../sound/mirelo-private-artifacts'
import { buildSoundRequest } from './sound-test-fixtures'
import type { SoundSupportedJobType } from '../edit-skills/sound/sound-capability-manifest'
import type { TimelineRate } from '../edit-skills/core/timeline-rate'

const execFileAsync = promisify(execFile)

export interface CanonicalSoundTestRuntime {
  root: string
  inputRoot: string
  outputRoot: string
  audioPath: string
  secondAudioPath: string
  videoPath: string
  audioArtifact: SoundArtifactRef
  secondAudioArtifact: SoundArtifactRef
  videoArtifact: SoundArtifactRef
  resolver: TestSoundArtifactResolver
  cleanup(): Promise<void>
}

export class TestSoundArtifactResolver implements CanonicalSoundArtifactResolver {
  readonly #paths = new Map<string, { path: string; root: string }>()
  readonly #outputRoots = new Map<string, string>()

  register(artifact: SoundArtifactRef, absolutePath: string, approvedRoot: string): void {
    this.#paths.set(`${artifact.artifactId}:${artifact.version}`, { path: absolutePath, root: approvedRoot })
  }

  registerOutputScope(scopeId: string, root: string): void {
    this.#outputRoots.set(scopeId, root)
  }

  async resolve(artifact: SoundArtifactRef): Promise<ResolvedPrivateSoundArtifact> {
    const explicit = this.#paths.get(`${artifact.artifactId}:${artifact.version}`)
    if (explicit) return { artifact, absolutePath: explicit.path, approvedRoot: explicit.root }
    for (const outputRoot of this.#outputRoots.values()) {
      const relativePath = artifact.storageObjectId.replaceAll(':', '/')
      const candidate = resolve(outputRoot, relativePath)
      if (candidate.startsWith(`${resolve(outputRoot)}/`)) {
        try {
          await readFile(candidate)
          return { artifact, absolutePath: candidate, approvedRoot: outputRoot }
        } catch {
          // Continue through registered roots.
        }
      }
    }
    throw new Error(`Test resolver cannot locate ${artifact.artifactId}@${artifact.version}.`)
  }

  async privateOutputRoot(privateOutputScopeId: string): Promise<string> {
    const root = this.#outputRoots.get(privateOutputScopeId)
    if (!root) throw new Error(`Unknown private Sound output scope ${privateOutputScopeId}.`)
    return root
  }
}

export async function createCanonicalSoundTestRuntime(
  rate: TimelineRate = { numerator: 30, denominator: 1 },
): Promise<CanonicalSoundTestRuntime> {
  const root = await mkdtemp(join(tmpdir(), 'reeditpro-canonical-sound-'))
  const inputRoot = join(root, 'private-input')
  const outputRoot = join(root, 'private-output')
  await Promise.all([
    mkdir(inputRoot, { recursive: true, mode: 0o700 }),
    mkdir(outputRoot, { recursive: true, mode: 0o700 }),
  ])
  const audioPath = join(inputRoot, 'source.wav')
  const secondAudioPath = join(inputRoot, 'second.wav')
  const videoPath = join(inputRoot, 'source.mp4')
  await execFileAsync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-nostdin', '-y',
    '-f', 'lavfi', '-i', 'aevalsrc=if(between(t\\,0.095\\,0.11)\\,0.9\\,0.02*sin(2*PI*660*t)):s=48000:d=3',
    '-ac', '2', '-c:a', 'pcm_s24le', audioPath,
  ], { timeout: 30_000 })
  await execFileAsync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-nostdin', '-y',
    '-f', 'lavfi', '-i', 'sine=frequency=330:duration=3:sample_rate=48000',
    '-af', 'volume=0.3', '-ac', '2', '-c:a', 'pcm_s24le', secondAudioPath,
  ], { timeout: 30_000 })
  const rateText = `${rate.numerator}/${rate.denominator}`
  await execFileAsync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-nostdin', '-y',
    '-f', 'lavfi', '-i', `testsrc2=s=320x180:r=${rateText}:d=3`,
    '-f', 'lavfi', '-i', 'sine=frequency=220:duration=3:sample_rate=48000',
    '-shortest', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', videoPath,
  ], { timeout: 30_000 })
  const audioArtifact = await artifactFor('approved-audio', 'approved_source_audio', audioPath, 'audio/wav', rate)
  const secondAudioArtifact = await artifactFor('approved-audio-2', 'approved_source_audio', secondAudioPath, 'audio/wav', rate)
  const videoArtifact = await artifactFor('approved-video', 'approved_source_video', videoPath, 'video/mp4', rate)
  const resolver = new TestSoundArtifactResolver()
  resolver.register(audioArtifact, audioPath, inputRoot)
  resolver.register(secondAudioArtifact, secondAudioPath, inputRoot)
  resolver.register(videoArtifact, videoPath, inputRoot)
  resolver.registerOutputScope('private-sound-output-1', outputRoot)
  return {
    root, inputRoot, outputRoot, audioPath, secondAudioPath, videoPath,
    audioArtifact, secondAudioArtifact, videoArtifact, resolver,
    cleanup: () => rm(root, { recursive: true, force: true }),
  }
}

export function buildExecutableSoundRequest(input: {
  runtime: CanonicalSoundTestRuntime
  job: SoundSupportedJobType
  mode?: CanonicalSoundRequest['requiredQualificationMode']
  audioArtifacts?: SoundArtifactRef[]
  rate?: TimelineRate
}): CanonicalSoundRequest {
  const rate = input.rate ?? input.runtime.audioArtifact.timelineRate!
  const request = buildSoundRequest({
    job: input.job,
    mode: input.mode ?? 'private_internal',
    allowProviderGeneration: input.job.startsWith('generate_'),
    eventFrames: [60],
  })
  request.timelineRate = rate
  request.timelineManifestRate = rate
  request.timelineFps = rate.numerator / rate.denominator
  request.timelineManifestRef.timelineRate = rate
  request.sourceMediaRefs = [input.runtime.videoArtifact]
  request.sourceAudioRefs = input.audioArtifacts ?? [input.runtime.audioArtifact]
  request.visualDependencies = [{
    artifact: input.runtime.videoArtifact,
    visualVersion: input.runtime.videoArtifact.version,
    visualHash: input.runtime.videoArtifact.checksumSha256,
    timingManifestHash: request.timelineManifestHash,
    originalApprovedVisual: true,
  }]
  const bound = [
    ...request.sourceMediaRefs, ...request.sourceAudioRefs,
    ...request.visualDependencies.map((value) => value.artifact),
    request.timelineManifestRef,
    ...(request.transcriptSpeechEvidenceRef ? [request.transcriptSpeechEvidenceRef] : []),
    ...request.referenceSoundInputs,
  ]
  request.assignmentScope.sourceArtifactVersions = [...new Map(bound.map((artifact) => [
    artifact.artifactId,
    { artifactId: artifact.artifactId, version: artifact.version, checksumSha256: artifact.checksumSha256 },
  ])).values()]
  request.latencyPolicy.allowAsyncProviderJob = false
  return request
}

export function createInjectedMireloAdapter(input: {
  runtime: CanonicalSoundTestRuntime
  carrier?: boolean
}): { adapter: MireloSfxProviderAdapter; transport: DeterministicMireloTransport } {
  const transport = new DeterministicMireloTransport(input.runtime.audioPath, input.carrier ? input.runtime.videoPath : undefined)
  const ingestor = new PrivateMireloOutputIngestor(input.runtime.outputRoot, 'private-sound-output-1')
  const unusedCarrierExtractor: MireloCarrierAudioExtractor = {
    async extractAudio() { throw new Error('Carrier extraction was not configured for this fixture.') },
  }
  return {
    adapter: new MireloSfxProviderAdapter(
      transport, async () => 'sk-fixture-never-persisted',
      new InMemoryMireloAttemptStore(), ingestor, unusedCarrierExtractor,
    ),
    transport,
  }
}

export class DeterministicMireloTransport implements MireloTransport {
  readonly calls: MireloTransportRequest[] = []
  readonly #audioPath: string
  readonly #carrierPath?: string

  constructor(audioPath: string, carrierPath?: string) {
    this.#audioPath = audioPath
    this.#carrierPath = carrierPath
  }

  async send(request: MireloTransportRequest): Promise<MireloTransportResponse> {
    this.calls.push(structuredClone(request))
    if (request.url.includes('/preflight')) {
      return { status: 200, headers: { 'content-type': 'application/json' }, jsonBody: { credits: 2, estimated_ms: 25 } }
    }
    if (request.url.endsWith('/v2/assets') && request.method === 'POST') {
      return { status: 200, headers: {}, jsonBody: { asset_id: 'fixture-asset', upload_url: 'https://uploads.mirelo.ai/fixture-asset' } }
    }
    if (request.url === 'https://uploads.mirelo.ai/fixture-asset' && request.method === 'PUT') {
      return { status: 200, headers: {} }
    }
    if ((request.url.endsWith('/v2/text-to-sfx/v1.6/sync') ||
      request.url.endsWith('/v2/video-to-sfx/v1.6/sync')) && request.method === 'POST') {
      return { status: 200, headers: { 'content-type': 'application/json' }, jsonBody: {
        result_urls: [this.#carrierPath ? 'https://cdn.mirelo.ai/fixture-carrier.mp4' : 'https://cdn.mirelo.ai/fixture.wav'],
      } }
    }
    if (request.url === 'https://cdn.mirelo.ai/fixture.wav') {
      return { status: 200, headers: { 'content-type': 'audio/wav' }, byteBody: new Uint8Array(await readFile(this.#audioPath)) }
    }
    if (request.url === 'https://cdn.mirelo.ai/fixture-carrier.mp4' && this.#carrierPath) {
      return { status: 200, headers: { 'content-type': 'video/mp4' }, byteBody: new Uint8Array(await readFile(this.#carrierPath)) }
    }
    throw new Error(`Unexpected deterministic Mirelo request: ${request.method} ${request.url}`)
  }
}

async function artifactFor(
  artifactId: string,
  artifactType: string,
  path: string,
  contentType: string,
  timelineRate: TimelineRate,
): Promise<SoundArtifactRef> {
  const bytes = await readFile(path)
  return {
    artifactId, artifactType, version: 1,
    checksumSha256: createHash('sha256').update(bytes).digest('hex'),
    storageObjectId: `test:${artifactId}:1`, private: true, contentType,
    timelineRate, durationFrames: Math.round(3 * timelineRate.numerator / timelineRate.denominator),
  }
}
