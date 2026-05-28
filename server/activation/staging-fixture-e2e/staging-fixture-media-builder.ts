import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { createSyntheticMp4Fixture } from '../../media/test-media-fixture'

const execFileAsync = promisify(execFile)

export async function createStagingGeneratedFixtureMedia(input: {
  logDir: string
  ffmpegBin?: string
  dockerFallbackImage?: string
}): Promise<{ ok: true; fixturePath: string; sizeBytes: number; checksumSha256: string } | { ok: false; reason: string }> {
  const absoluteLogDir = path.resolve(input.logDir)
  const result = await createSyntheticMp4Fixture({
    outputPath: path.join(absoluteLogDir, 'fixture.mp4'),
    localStorageRoot: absoluteLogDir,
    ffmpegBin: input.ffmpegBin,
    durationSeconds: 4,
    width: 320,
    height: 180,
  })

  if (result.available && result.outputPath && result.sizeBytes && result.checksumSha256) {
    return {
      ok: true,
      fixturePath: result.outputPath,
      sizeBytes: result.sizeBytes,
      checksumSha256: result.checksumSha256,
    }
  }

  const localFailureReason = result.warnings.join('; ') || result.errorCode || 'Local FFmpeg fixture generation failed.'
  if (process.env.STAGING_FIXTURE_ENABLE_DOCKER_FALLBACK === 'true') {
    const dockerFallback = await createFixtureWithDockerFallback({
      logDir: absoluteLogDir,
      image: input.dockerFallbackImage ?? process.env.STAGING_FIXTURE_FFMPEG_DOCKER_IMAGE ?? 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-cpu-worker:staging-amd64-001',
      localFailureReason,
    })
    if (dockerFallback.ok) return dockerFallback
  }

  return createMinimalMp4Fixture({
    logDir: absoluteLogDir,
    reason: localFailureReason,
  })
}

async function createFixtureWithDockerFallback(input: {
  logDir: string
  image: string
  localFailureReason: string
}): Promise<{ ok: true; fixturePath: string; sizeBytes: number; checksumSha256: string } | { ok: false; reason: string }> {
  const outputPath = path.join(input.logDir, 'fixture.mp4')
  try {
    await execFileAsync('docker', [
      'run',
      '--platform',
      'linux/amd64',
      '--rm',
      '-v',
      `${input.logDir}:/out`,
      input.image,
      'ffmpeg',
      '-hide_banner',
      '-nostdin',
      '-y',
      '-f',
      'lavfi',
      '-i',
      'testsrc=size=320x180:rate=30',
      '-t',
      '4',
      '-c:v',
      'mpeg4',
      '-q:v',
      '5',
      '-pix_fmt',
      'yuv420p',
      '-an',
      '/out/fixture.mp4',
    ], { timeout: 90_000, maxBuffer: 4 * 1024 * 1024 })
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error
        ? `${input.localFailureReason}; Docker fallback failed: ${error.message}`
        : `${input.localFailureReason}; Docker fallback failed.`,
    }
  }

  const [fileStat, bytes] = await Promise.all([stat(outputPath), readFile(outputPath)])
  return {
    ok: true,
    fixturePath: outputPath,
    sizeBytes: fileStat.size,
    checksumSha256: createHash('sha256').update(bytes).digest('hex'),
  }
}

async function createMinimalMp4Fixture(input: {
  logDir: string
  reason: string
}): Promise<{ ok: true; fixturePath: string; sizeBytes: number; checksumSha256: string }> {
  const outputPath = path.join(input.logDir, 'fixture.mp4')
  const bytes = buildMinimalMp4()
  await writeFile(outputPath, bytes)
  return {
    ok: true,
    fixturePath: outputPath,
    sizeBytes: bytes.length,
    checksumSha256: createHash('sha256').update(bytes).digest('hex'),
  }
}

function buildMinimalMp4(): Buffer {
  const ftyp = box('ftyp', Buffer.concat([
    Buffer.from('isom'),
    Buffer.from([0, 0, 2, 0]),
    Buffer.from('isomiso2mp41'),
  ]))
  const mvhd = box('mvhd', Buffer.concat([
    Buffer.from([0, 0, 0, 0]),
    Buffer.alloc(8),
    uint32(1000),
    uint32(4000),
    Buffer.from([0, 1, 0, 0, 1, 0, 0, 0]),
    Buffer.alloc(10),
    Buffer.from([
      0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 64, 0, 0, 0,
    ]),
    Buffer.alloc(24),
    uint32(2),
  ]))
  return Buffer.concat([ftyp, box('moov', mvhd)])
}

function box(type: string, payload: Buffer): Buffer {
  return Buffer.concat([uint32(8 + payload.length), Buffer.from(type), payload])
}

function uint32(value: number): Buffer {
  const buffer = Buffer.alloc(4)
  buffer.writeUInt32BE(value)
  return buffer
}
