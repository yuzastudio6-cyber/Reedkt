import http, { type IncomingMessage, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import { createReeditProApiApp } from '../../server/app'
import { loadRuntimeEnv } from '../../server/config/env'
import { SOUND_CPU_WORKER_ROUTE_DISABLED_FLAGS } from '../../server/validation/sound-cpu-worker-route-schemas'

type JsonResponse = {
  status: number
  body: Record<string, unknown>
}

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

const postBody = {
  approvedPlanSnapshotId: 'sound-cpu-disabled-route-proof-plan-001',
  workspaceId: 'sound-cpu-disabled-route-proof-workspace-001',
  projectId: 'sound-cpu-disabled-route-proof-project-001',
  jobId: 'sound-cpu-disabled-route-proof-job-001',
  idempotencyKey: 'sound-cpu-disabled-route-proof-idempotency-001',
  workerName: 'sound-cpu-analysis-worker',
  imageName: 'reeditpro/sound-cpu-analysis-worker',
  jobType: 'sound.package_import_smoke',
  privateMediaManifestId: 'sound-cpu-disabled-route-proof-manifest-001',
  attemptMetadata: {
    attemptNumber: 1,
    maxAttempts: 1,
    requestedAtIso: '2026-07-02T00:00:00.000Z',
  },
  staticOnlyRuntimeFlags: SOUND_CPU_WORKER_ROUTE_DISABLED_FLAGS,
} as const

const app = createReeditProApiApp(env)
const server = app.listen(0, '127.0.0.1')
let proofResult: Record<string, unknown> | undefined
let serverClosed: boolean | undefined

try {
  await waitForListening(server)
  const address = server.address() as AddressInfo | null
  assert(address?.port, 'server did not bind local port')

  const post = await requestJson({
    port: address.port,
    method: 'POST',
    path: '/v1/sound-cpu/jobs',
    body: postBody,
    headers: {
      'idempotency-key': postBody.idempotencyKey,
    },
  })

  const get = await requestJson({
    port: address.port,
    method: 'GET',
    path: `/v1/sound-cpu/jobs/${postBody.jobId}`,
  })

  const postRoute = readSoundCpuRoute(post)
  const getRoute = readSoundCpuRoute(get)

  assert(post.status === 409, 'POST did not return disabled status 409')
  assert(get.status === 409, 'GET did not return disabled status 409')
  assert(postRoute.accepted === false, 'POST accepted route unexpectedly')
  assert(getRoute.accepted === false, 'GET accepted route unexpectedly')
  assert(postRoute.routeRegisteredInApp === true, 'POST route registration metadata mismatch')
  assert(getRoute.routeRegisteredInApp === true, 'GET route registration metadata mismatch')
  assert(postRoute.workerDispatchStarted === false, 'POST started worker dispatch')
  assert(getRoute.workerDispatchStarted === false, 'GET started worker dispatch')
  assert(postRoute.mediaProcessingStarted === false, 'POST started media processing')
  assert(getRoute.mediaProcessingStarted === false, 'GET started media processing')
  assert(postRoute.supabaseMutationStarted === false, 'POST started Supabase mutation')
  assert(getRoute.supabaseMutationStarted === false, 'GET started Supabase mutation')
  assert(postRoute.sqlExecutionStarted === false, 'POST started SQL execution')
  assert(getRoute.sqlExecutionStarted === false, 'GET started SQL execution')
  assert(postRoute.artifactCreated === false, 'POST created artifact')
  assert(getRoute.artifactCreated === false, 'GET created artifact')

  proofResult = {
    ok: true,
    localLoopbackOnly: true,
    requestCounts: {
      post: 1,
      get: 1,
    },
    post: summarize(post),
    get: summarize(get),
    routeExecutionEnabled: false,
    workerDispatchExecutionEnabled: false,
    supabaseMutationEnabled: false,
    sqlExecutionEnabled: false,
    mediaProcessingEnabled: false,
    artifactCreationEnabled: false,
  }
} finally {
  await closeServer(server)
  serverClosed = true
}

assert(proofResult, 'proof result was not recorded')
console.log(JSON.stringify({ ...proofResult, serverClosed }, null, 2))

function requestJson(options: {
  port: number
  method: 'GET' | 'POST'
  path: string
  body?: unknown
  headers?: Record<string, string>
}): Promise<JsonResponse> {
  return new Promise((resolve, reject) => {
    const payload = options.body ? JSON.stringify(options.body) : undefined
    const request = http.request(
      {
        host: '127.0.0.1',
        port: options.port,
        method: options.method,
        path: options.path,
        headers: {
          ...(payload ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload).toString() } : {}),
          ...(options.headers ?? {}),
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
    if (payload) request.write(payload)
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

function summarize(response: JsonResponse): Record<string, unknown> {
  const route = readSoundCpuRoute(response)
  return {
    status: response.status,
    ok: response.body.ok,
    errorCode: isRecord(response.body.error) ? response.body.error.code : undefined,
    accepted: route.accepted,
    reason: route.reason,
    operation: route.operation,
    routeRegisteredInApp: route.routeRegisteredInApp,
    workerDispatchStarted: route.workerDispatchStarted,
    mediaProcessingStarted: route.mediaProcessingStarted,
    supabaseMutationStarted: route.supabaseMutationStarted,
    sqlExecutionStarted: route.sqlExecutionStarted,
    artifactCreated: route.artifactCreated,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function closeServer(serverToClose: http.Server<typeof IncomingMessage, typeof ServerResponse>): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!serverToClose.listening) {
      resolve()
      return
    }
    serverToClose.close((error) => {
      if (error) reject(error)
      else resolve()
    })
  })
}

function waitForListening(serverToWaitFor: http.Server<typeof IncomingMessage, typeof ServerResponse>): Promise<void> {
  return new Promise((resolve, reject) => {
    if (serverToWaitFor.listening) {
      resolve()
      return
    }
    serverToWaitFor.once('listening', () => resolve())
    serverToWaitFor.once('error', reject)
  })
}
