import { execFile } from 'node:child_process'
import { Buffer } from 'node:buffer'

import {
  createSignedInPrivateMediaStorageProbePlan,
  evaluateSignedInPrivateMediaStorageReadiness,
  REEDITPRO_SIGNED_IN_PRIVATE_MEDIA_STORAGE_TARGET,
  type SignedInPrivateMediaStorageProbePlanItem,
  type SignedInPrivateMediaStorageProbeResult,
} from '../config/signed-in-private-media-storage-readiness'

const PROBE_TIMEOUT_MS = 30_000
const PROBE_MAX_BUFFER_BYTES = 2 * 1024 * 1024
const PROBE_CONCURRENCY = 4

async function runProbe(
  probe: SignedInPrivateMediaStorageProbePlanItem,
): Promise<SignedInPrivateMediaStorageProbeResult> {
  return new Promise((resolve) => {
    execFile(probe.command, probe.args, {
      encoding: 'utf8',
      env: {
        ...process.env,
        CLOUDSDK_CORE_DISABLE_PROMPTS: '1',
        CLOUDSDK_CORE_PROJECT: REEDITPRO_SIGNED_IN_PRIVATE_MEDIA_STORAGE_TARGET.projectId,
      },
      maxBuffer: PROBE_MAX_BUFFER_BYTES,
      timeout: PROBE_TIMEOUT_MS,
      windowsHide: true,
    }, (error, stdout, stderr) => {
      const exitCode = typeof error?.code === 'number' ? error.code : error ? null : 0
      const combinedError = `${error?.message ?? ''}\n${stderr}`
      const classification = error
        ? classifyProbeFailure(combinedError, error.killed === true)
        : 'passed'
      resolve({
        id: probe.id,
        ok: !error,
        exitCode,
        classification,
        stdout: typeof stdout === 'string' ? stdout : '',
        outputByteCount: Buffer.byteLength(
          `${typeof stdout === 'string' ? stdout : ''}${typeof stderr === 'string' ? stderr : ''}`,
          'utf8',
        ),
      })
    })
  })
}

async function runProbePlan(
  plan: SignedInPrivateMediaStorageProbePlanItem[],
): Promise<SignedInPrivateMediaStorageProbeResult[]> {
  const results = new Array<SignedInPrivateMediaStorageProbeResult>(plan.length)
  let nextIndex = 0
  const workerCount = Math.min(PROBE_CONCURRENCY, plan.length)
  await Promise.all(Array.from({ length: workerCount }, async () => {
    while (nextIndex < plan.length) {
      const index = nextIndex
      nextIndex += 1
      results[index] = await runProbe(plan[index]!)
    }
  }))
  return results
}

function classifyProbeFailure(
  message: string,
  killed: boolean,
): SignedInPrivateMediaStorageProbeResult['classification'] {
  if (killed || /timed?\s*out|timeout/i.test(message)) return 'timeout'
  if (/service[_ ]disabled|api .* (?:is not enabled|has not been used)|accessnotconfigured/i.test(message)) {
    return 'service_disabled'
  }
  if (/permission[_ ]denied|permission denied|forbidden|does not have permission|not authorized/i.test(message)) {
    return 'permission_denied'
  }
  if (/not found|does not exist|could not be found/i.test(message)) return 'not_found'
  if (/unavailable|connection reset|connection refused|network is unreachable|temporary failure/i.test(message)) {
    return 'unavailable'
  }
  return 'failed'
}

const target = REEDITPRO_SIGNED_IN_PRIVATE_MEDIA_STORAGE_TARGET
const plan = createSignedInPrivateMediaStorageProbePlan(target)
const results = await runProbePlan(plan)
const report = evaluateSignedInPrivateMediaStorageReadiness(target, results)

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)

if (process.env.REEDITPRO_REQUIRE_PRIVATE_MEDIA_STORAGE_READY === 'true' && !report.ok) {
  process.exitCode = 1
}
