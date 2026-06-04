import { DESKTOP_BENCHMARK_CAPS } from './desktopBenchmarkPolicy'
import { bucketDurationMs } from './desktopBenchmarkBuckets'
import { normalizeDesktopBenchmarkResult } from './normalizeDesktopBenchmarkResult'
import type { DesktopBenchmarkProfile, RawDesktopBenchmarkSignals } from './desktopBenchmarkTypes'

export async function runBoundedDesktopBenchmark(options: {
  confirmed: boolean
  generatedAt?: string
}): Promise<DesktopBenchmarkProfile> {
  if (!options.confirmed) {
    return normalizeDesktopBenchmarkResult({ localBenchmarkConfirmed: false, policyBlocked: true }, {
      collectionMode: 'local_skipped_by_policy',
      generatedAt: options.generatedAt,
    })
  }

  const overheadStart = now()
  const overheadDuration = now() - overheadStart
  const jsonDuration = runTimed(() => {
    const payload = { phase: '44F', values: Array.from({ length: 128 }, (_, index) => ({ index, value: index * 3 })) }
    JSON.parse(JSON.stringify(payload))
  })
  const typedArrayDuration = runTimed(() => {
    const values = new Float64Array(4096)
    for (let index = 0; index < values.length; index += 1) values[index] = Math.sin(index / 16) * Math.cos(index / 32)
  })
  const hashDuration = await runHashFixture()
  const memoryDuration = runTimed(() => {
    const bytes = new Uint8Array(DESKTOP_BENCHMARK_CAPS.memoryDefaultBytes)
    const copy = bytes.slice(0)
    void copy.byteLength
  })

  const singleThreadDuration = Math.max(jsonDuration, typedArrayDuration, hashDuration)
  const raw: RawDesktopBenchmarkSignals = {
    localBenchmarkConfirmed: true,
    benchmarkRunnerOverheadBucket: bucketDurationMs(overheadDuration),
    cpuSingleThreadBucket: bucketDurationMs(singleThreadDuration),
    cpuParallelBucket: 'unavailable',
    workerThreadsAvailable: 'unknown',
    memoryBucket: bucketDurationMs(memoryDuration),
    storageTempBucket: 'unknown',
    nodeAvailable: true,
    pythonAvailable: 'unknown',
    ffmpegAvailable: 'unknown',
    ffprobeAvailable: 'unknown',
  }

  return normalizeDesktopBenchmarkResult(raw, {
    collectionMode: 'local_bounded',
    generatedAt: options.generatedAt,
  })
}

function runTimed(fn: () => void): number {
  const start = now()
  fn()
  return now() - start
}

async function runHashFixture(): Promise<number> {
  const bytes = new Uint8Array(4096)
  for (let index = 0; index < bytes.length; index += 1) bytes[index] = index % 251
  const start = now()
  if (globalThis.crypto?.subtle) {
    await globalThis.crypto.subtle.digest('SHA-256', bytes)
  } else {
    let rolling = 0
    for (const byte of bytes) rolling = (rolling + byte * 2654435761) >>> 0
    void rolling
  }
  return now() - start
}

function now(): number {
  return globalThis.performance?.now?.() ?? Date.now()
}
