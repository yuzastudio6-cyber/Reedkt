import http, { type IncomingMessage } from 'node:http'
import type { AddressInfo } from 'node:net'
import { createReeditProApiApp } from '../../server/app'
import { loadRuntimeEnv } from '../../server/config/env'
import { SOUND_CPU_WORKER_ROUTE_DISABLED_FLAGS } from '../../server/validation/sound-cpu-worker-route-schemas'

type JsonResponse = Readonly<{
  status: number
  body: Record<string, unknown>
}>

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'mock',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  API_PORT: '8787',
  STORAGE_MODE: 'local',
  WORKER_RUNTIME_MODE: 'disabled',
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
})

const plannedPhase199Route = '/api/workers/sound-cpu/jobs'
const sourceRegisteredRoute = '/v1/sound-cpu/jobs'

const body = {
  approvedPlanSnapshotId: 'sound-cpu-phase201-disabled-route-preflight-plan-001',
  workspaceId: 'sound-cpu-phase201-disabled-route-preflight-workspace-001',
  projectId: 'sound-cpu-phase201-disabled-route-preflight-project-001',
  jobId: 'sound-cpu-phase201-disabled-route-preflight-job-001',
  idempotencyKey: 'sound-cpu-phase201-disabled-route-preflight-idempotency-001',
  workerName: 'sound-cpu-analysis-worker',
  imageName: 'reeditpro/sound-cpu-analysis-worker',
  jobType: 'sound.package_import_smoke',
  privateMediaManifestId: 'sound-cpu-phase201-disabled-route-preflight-manifest-001',
  attemptMetadata: {
    attemptNumber: 1,
    maxAttempts: 1,
    requestedAtIso: '2026-07-03T00:00:00.000Z',
  },
  staticOnlyRuntimeFlags: SOUND_CPU_WORKER_ROUTE_DISABLED_FLAGS,
} as const

const app = createReeditProApiApp(env)
const server = app.listen(0, '127.0.0.1')
let result: Record<string, unknown> | undefined
let serverClosed: boolean | undefined

try {
  await waitForListening(server)
  const address = server.address() as AddressInfo | null
  assert(address?.port, 'server did not bind local loopback port')

  const response = await requestJson({
    port: address.port,
    method: 'POST',
    path: sourceRegisteredRoute,
    body,
    headers: {
      'idempotency-key': body.idempotencyKey,
    },
  })

  const route = readSoundCpuRoute(response)

  assert(response.status === 409, 'POST did not return disabled status 409')
  assert(response.body.ok === false, 'response ok flag widened')
  assert(isRecord(response.body.error), 'response error missing')
  assert(response.body.error.code === 'ROUTE_EXECUTION_NOT_ENABLED', 'response error code mismatch')
  assert(route.accepted === false, 'route accepted request unexpectedly')
  assert(route.operation === 'createSoundCpuWorkerJobRoute', 'route operation mismatch')
  assert(route.routeRegisteredInApp === true, 'route registration metadata mismatch')
  assert(route.workerDispatchStarted === false, 'worker dispatch started')
  assert(route.mediaProcessingStarted === false, 'media processing started')
  assert(route.supabaseMutationStarted === false, 'Supabase mutation started')
  assert(route.sqlExecutionStarted === false, 'SQL execution started')
  assert(route.artifactCreated === false, 'artifact was created')

  result = {
    ok: true,
    decision: 'sound_cpu_phase201_controlled_disabled_route_preflight_execution_proof_observed_fail_closed',
    localLoopbackOnly: true,
    plannedPhase199Route,
    sourceRegisteredRoute,
    routePathReconciledToSource: true,
    routePathWarning:
      'Phase199 planned /api/workers/sound-cpu/jobs, but merged source registers /v1/sound-cpu/jobs; proof used the source-registered route.',
    serverStarted: true,
    httpRouteRequestExecuted: true,
    requestCount: 1,
    method: 'POST',
    path: sourceRegisteredRoute,
    syntheticPayloadOnly: true,
    status: response.status,
    okFlag: response.body.ok,
    errorCode: response.body.error.code,
    accepted: route.accepted,
    reason: route.reason,
    operation: route.operation,
    routeRegisteredInApp: route.routeRegisteredInApp,
    failClosedRouteHandlerObserved: true,
    workerDispatchStarted: route.workerDispatchStarted,
    mediaProcessingStarted: route.mediaProcessingStarted,
    supabaseMutationStarted: route.supabaseMutationStarted,
    sqlExecutionStarted: route.sqlExecutionStarted,
    artifactCreated: route.artifactCreated,
    workerDispatchExecutionEnabled: false,
    routeExecutionBeyondFailClosedPreflightEnabled: false,
    supabaseMutationEnabled: false,
    sqlExecutionEnabled: false,
    mediaProcessingEnabled: false,
    artifactCreationEnabled: false,
    externalAgentExecutionReady: false,
  }
} finally {
  await closeServer(server)
  serverClosed = true
}

assert(result, 'proof result was not recorded')
console.log(JSON.stringify({ ...result, serverClosed }, null, 2))

function requestJson(options: {
  port: number
  method: 'POST'
  path: string
  body: unknown
  headers: Record<string, string>
}): Promise<JsonResponse> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(options.body)
    const request = http.request(
      {
        host: '127.0.0.1',
        port: options.port,
        method: options.method,
        path: options.path,
        headers: {
          'content-type': 'application/json',
          'content-length': Buffer.byteLength(payload).toString(),
          ...options.headers,
        },
      },
      (response: IncomingMessage) => {
        const chunks: Buffer[] = []
        response.on('data', (chunk: Buffer) => chunks.push(chunk))
        response.on('end', () => {
          try {
            const text = Buffer.concat(chunks).toString('utf8')
            resolve({ status: response.statusCode ?? 0, body: JSON.parse(text) as Record<string, unknown> })
          } catch (error) {
            reject(error)
          }
        })
      },
    )
    request.on('error', reject)
    request.write(payload)
    request.end()
  })
}

function readSoundCpuRoute(response: JsonResponse): Record<string, unknown> {
  const data = response.body.data
  assert(isRecord(data), 'response data missing')
  const route = data.soundCpuWorkerRoute
  assert(isRecord(route), 'sound CPU route data missing')
  return route
}

function waitForListening(server: ReturnType<typeof app.listen>): Promise<void> {
  return new Promise((resolve, reject) => {
    if (server.listening) {
      resolve()
      return
    }
    server.once('listening', resolve)
    server.once('error', reject)
  })
}

function closeServer(server: ReturnType<typeof app.listen>): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!server.listening) {
      resolve()
      return
    }
    server.close((error) => {
      if (error) reject(error)
      else resolve()
    })
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}
