import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, readFile, readdir, realpath, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join, relative, resolve, sep } from 'node:path'
import { promisify } from 'node:util'
import type { SoundArtifactRef } from '../sound'
import type { CanonicalSoundArtifactResolver, ResolvedPrivateSoundArtifact } from '../edit-skills/sound/sound-route-executor'
import { StandaloneCanonicalSoundSkillService } from '../edit-skills/sound/canonical-sound-skill-service'
import { StandaloneCanonicalMusicSkillService } from '../edit-skills/music/canonical-music-skill-service'
import type { CanonicalMusicArtifactResolver, ResolvedPrivateMusicArtifact } from '../music/music-analysis'
import { CanonicalLyria3ProviderAdapter, DeterministicInjectedLyriaTransport } from '../music/lyria-provider'
import type { MusicArtifactRef } from '../music/music-contracts'
import { CanonicalSoundV4MusicSupportAdapter } from '../music/music-sound-support-port'

const execFileAsync = promisify(execFile)

type SharedArtifactRef = MusicArtifactRef | SoundArtifactRef

async function walkFiles(root: string): Promise<string[]> {
  const files: string[] = []
  const visit = async (directory: string): Promise<void> => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) await visit(path)
      else if (entry.isFile()) files.push(path)
    }
  }
  await visit(root)
  return files
}

async function sha256(path: string): Promise<string> {
  return createHash('sha256').update(await readFile(path)).digest('hex')
}

class TestPrivateArtifactResolver implements CanonicalMusicArtifactResolver, CanonicalSoundArtifactResolver {
  readonly #root: string
  readonly #paths = new Map<string, string>()

  constructor(root: string) { this.#root = root }

  register(artifact: SharedArtifactRef, path: string): void {
    this.#paths.set(artifact.storageObjectId, path)
    this.#paths.set(artifact.artifactId, path)
  }

  async resolve(artifact: MusicArtifactRef): Promise<ResolvedPrivateMusicArtifact>
  async resolve(artifact: SoundArtifactRef): Promise<ResolvedPrivateSoundArtifact>
  async resolve(artifact: SharedArtifactRef): Promise<ResolvedPrivateMusicArtifact | ResolvedPrivateSoundArtifact> {
    let path = this.#paths.get(artifact.storageObjectId) ?? this.#paths.get(artifact.artifactId)
    if (!path) {
      const candidates = await walkFiles(this.#root)
      for (const candidate of candidates) {
        if (await sha256(candidate) === artifact.checksumSha256) { path = candidate; break }
      }
    }
    if (!path) throw new Error(`Private test artifact ${artifact.artifactId} cannot be resolved.`)
    const root = await realpath(this.#root)
    const absolutePath = await realpath(path)
    if (absolutePath !== root && !absolutePath.startsWith(`${root}${sep}`)) throw new Error('Test artifact escaped private root.')
    return { artifact, absolutePath, approvedRoot: root }
  }

  async privateOutputRoot(_privateOutputScopeId: string): Promise<string> {
    return realpath(this.#root)
  }
}

export interface CanonicalMusicTestRuntime {
  root: string
  resolver: TestPrivateArtifactResolver
  music: StandaloneCanonicalMusicSkillService
  sound: StandaloneCanonicalSoundSkillService
  makeWav(input: { id: string; durationSeconds: number; frequency: number; volume?: number }): Promise<MusicArtifactRef>
}

export async function createCanonicalMusicTestRuntime(): Promise<CanonicalMusicTestRuntime> {
  const root = await mkdtemp(join(tmpdir(), 'reeditpro-canonical-music-'))
  await mkdir(join(root, 'inputs'), { recursive: true, mode: 0o700 })
  const resolver = new TestPrivateArtifactResolver(root)
  const makeWav = async (input: { id: string; durationSeconds: number; frequency: number; volume?: number }): Promise<MusicArtifactRef> => {
    const safeName = basename(input.id).replace(/[^A-Za-z0-9._-]/gu, '_')
    const path = resolve(root, 'inputs', `${safeName}.wav`)
    await execFileAsync('ffmpeg', [
      '-hide_banner', '-loglevel', 'error', '-nostdin', '-f', 'lavfi',
      '-i', `sine=frequency=${input.frequency}:sample_rate=48000:duration=${input.durationSeconds}`,
      '-filter:a', `volume=${input.volume ?? 0.15}`, '-ac', '2', '-c:a', 'pcm_s16le', '-y', path,
    ], { timeout: 30_000, maxBuffer: 8 * 1024 * 1024 })
    const bytes = await readFile(path)
    const fileStat = await stat(path)
    const artifact: MusicArtifactRef = {
      artifactId: input.id, artifactType: 'approved_private_music_audio', version: 1,
      checksumSha256: createHash('sha256').update(bytes).digest('hex'),
      storageObjectId: relative(root, path).split(sep).join(':'), private: true,
      contentType: 'audio/wav', byteSize: fileStat.size,
    }
    resolver.register(artifact, path)
    return artifact
  }
  const fixtures = await Promise.all([
    makeWav({ id: 'lyria-fixture-a', durationSeconds: 3, frequency: 180, volume: 0.08 }),
    makeWav({ id: 'lyria-fixture-b', durationSeconds: 4, frequency: 240, volume: 0.12 }),
    makeWav({ id: 'lyria-fixture-c', durationSeconds: 5, frequency: 320, volume: 0.18 }),
  ])
  const fixtureBytes = await Promise.all(fixtures.map(async (artifact) => {
    const resolved = await resolver.resolve(artifact)
    return new Uint8Array(await readFile(resolved.absolutePath))
  }))
  const provider = new CanonicalLyria3ProviderAdapter({
    transport: new DeterministicInjectedLyriaTransport({ fixtures: fixtureBytes, contentType: 'audio/wav' }),
    artifacts: resolver,
  })
  const sound = new StandaloneCanonicalSoundSkillService({ artifacts: resolver })
  const music = new StandaloneCanonicalMusicSkillService({
    artifacts: resolver, provider, sound: new CanonicalSoundV4MusicSupportAdapter(sound),
  })
  return { root, resolver, music, sound, makeWav }
}
