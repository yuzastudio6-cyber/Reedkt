import { execFile } from 'node:child_process'
import { Buffer } from 'node:buffer'

import {
  createGoogleApiGatewayReadinessProbePlan,
  evaluateGoogleApiGatewayReadiness,
  REEDITPRO_GOOGLE_API_GATEWAY_STAGING_TARGET,
  type GoogleApiGatewayReadinessProbePlanItem,
  type GoogleApiGatewayReadinessProbeResult,
} from '../config/google-api-gateway-readiness'

const PROBE_TIMEOUT_MS = 30_000
const PROBE_MAX_BUFFER_BYTES = 2 * 1024 * 1024

async function runProbe(
  probe: GoogleApiGatewayReadinessProbePlanItem,
): Promise<GoogleApiGatewayReadinessProbeResult> {
  return new Promise((resolve) => {
    execFile(probe.command, probe.args, {
      encoding: 'utf8',
      env: {
        ...process.env,
        CLOUDSDK_CORE_DISABLE_PROMPTS: '1',
        CLOUDSDK_CORE_PROJECT: REEDITPRO_GOOGLE_API_GATEWAY_STAGING_TARGET.projectId,
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

function classifyProbeFailure(
  message: string,
  killed: boolean,
): GoogleApiGatewayReadinessProbeResult['classification'] {
  if (killed || /timed?\s*out|timeout/i.test(message)) return 'timeout'
  if (
    /service[_ ]disabled|api .* (?:is not enabled|has not been used)|enable it by visiting|accessnotconfigured/i
      .test(message)
  ) return 'service_disabled'
  if (/permission[_ ]denied|permission denied|forbidden|does not have permission|not authorized/i.test(message)) {
    return 'permission_denied'
  }
  if (/not found|does not exist|could not be found/i.test(message)) return 'not_found'
  if (/unavailable|connection reset|connection refused|network is unreachable|temporary failure/i.test(message)) {
    return 'unavailable'
  }
  return 'failed'
}

const probePlan = createGoogleApiGatewayReadinessProbePlan(
  REEDITPRO_GOOGLE_API_GATEWAY_STAGING_TARGET,
)
const probeResults = await Promise.all(probePlan.map(runProbe))
const report = evaluateGoogleApiGatewayReadiness(
  REEDITPRO_GOOGLE_API_GATEWAY_STAGING_TARGET,
  probeResults,
)

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)

if (process.env.REEDITPRO_REQUIRE_GATEWAY_READY === 'true' && !report.ok) {
  process.exitCode = 1
}
