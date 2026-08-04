import { spawn } from 'node:child_process'
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'

import {
  MOTION_STUDIO_GEMINI_OMNI_MODEL_ID,
  MOTION_STUDIO_GPT_IMAGE_MODEL_SNAPSHOT,
  MOTION_STUDIO_PROTOCOL_SIMULATOR_ADAPTER_ID,
  type MotionStudioGenerationProviderRoute,
  type MotionStudioGenerationShotSpecV1,
} from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  compileGptImage2GenerationPayload,
  compileVideoCapabilityEnvelope,
  parseGptImage2SimulatorResponse,
  type GptImage2GenerationPayload,
  type MotionStudioVideoCapabilityEnvelopeV1,
} from './provider-adapters'

const MAXIMUM_JSON_BYTES = 2 * 1024 * 1024
const MAXIMUM_MEDIA_BYTES = 100 * 1024 * 1024
const REQUEST_TIMEOUT_MS = 30_000
const MAXIMUM_EVENT_AGE_MS = 5 * 60 * 1000
const MAXIMUM_EVENT_FUTURE_SKEW_MS = 60 * 1000

export type MotionStudioProtocolSimulatorBehavior =
  | 'success'
  | 'failed'
  | 'cancelled'
  | 'outcome_unknown'
  | 'qa_rejected'
  | 'execution_error'

export interface MotionStudioProtocolSignal {
  eventKeyHash: string
  eventSource: 'webhook' | 'poll' | 'synchronous'
  eventType: 'submitted' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'outcome_unknown'
  normalizedStatus: 'submitted' | 'processing' | 'reconciliation_required' | 'completed' | 'failed' | 'cancelled'
  verificationKind: 'hmac_sha256' | 'server_poll' | 'synchronous_response'
  signatureVerified: boolean
  eventDigest: string
  occurredAt: string
}

export interface MotionStudioProtocolExecutionResult {
  providerRoute: MotionStudioGenerationProviderRoute
  providerModelVersion: string
  requestDigest: string
  externalOperationIdHash: string
  operationId: string
  signals: readonly MotionStudioProtocolSignal[]
  bytes?: Buffer
  mimeType?: 'image/png' | 'video/mp4'
  providerCostIncurred: false
  outputIsProviderGenerated: false
}

export interface MotionStudioProtocolSession {
  providerRoute: MotionStudioGenerationProviderRoute
  providerModelVersion: string
  requestDigest: string
  externalOperationIdHash: string
  operationId: string
  endpoint: string
  execute(): Promise<MotionStudioProtocolExecutionResult>
  close(): Promise<void>
}

export async function openMotionStudioProtocolSimulator(input: {
  shotSpec: MotionStudioGenerationShotSpecV1
  providerRoute: MotionStudioGenerationProviderRoute
  ffmpegBin: string
  behavior?: MotionStudioProtocolSimulatorBehavior
}): Promise<MotionStudioProtocolSession> {
  if (!input.shotSpec.simulatorPolicy.allowed || input.shotSpec.simulatorPolicy.outputIsProviderGenerated) {
    throw blocked('ShotSpec does not authorize the local protocol simulator.')
  }
  if (input.shotSpec.mediaKind === 'still_image' && input.providerRoute !== 'gpt_image_2') {
    throw blocked('Still protocol simulation requires the registered GPT Image 2 route shape.')
  }
  if (input.shotSpec.mediaKind === 'video_clip' && !['gemini_omni_flash', 'wan', 'hailuo', 'veo'].includes(input.providerRoute)) {
    throw blocked('Video protocol simulation requires one registered video route shape.')
  }

  const operationId = `sim-${randomUUID()}`
  const secret = randomBytes(32)
  const behavior = input.behavior ?? 'success'
  const payload = input.shotSpec.mediaKind === 'still_image'
    ? compileGptImage2GenerationPayload(input.shotSpec)
    : compileVideoCapabilityEnvelope(input.shotSpec, input.providerRoute as 'gemini_omni_flash' | 'wan' | 'hailuo' | 'veo')
  const requestDigest = sha256CanonicalJson(payload)
  const providerModelVersion = input.providerRoute === 'gpt_image_2'
    ? MOTION_STUDIO_GPT_IMAGE_MODEL_SNAPSHOT
    : input.providerRoute === 'gemini_omni_flash'
      ? MOTION_STUDIO_GEMINI_OMNI_MODEL_ID
    : `${input.providerRoute}-protocol-shape-v1`
  const externalOperationIdHash = sha256CanonicalJson({
    adapterId: MOTION_STUDIO_PROTOCOL_SIMULATOR_ADAPTER_ID,
    operationId,
  })
  const state: SimulatorState = {
    operationId,
    secret,
    behavior,
    shotSpec: input.shotSpec,
    expectedPayload: payload,
    media: undefined,
    eventRead: false,
  }
  const server = createServer((request, response) => {
    void handleSimulatorRequest(request, response, state, input.ffmpegBin)
  })
  await listenLoopback(server)
  const address = server.address() as AddressInfo
  const endpoint = `http://127.0.0.1:${address.port}`
  assertLoopbackProtocolEndpoint(endpoint)

  let closed = false
  return {
    providerRoute: input.providerRoute,
    providerModelVersion,
    requestDigest,
    externalOperationIdHash,
    operationId,
    endpoint,
    async execute() {
      if (closed) throw blocked('Protocol simulator session is closed.')
      if (behavior === 'execution_error') {
        throw new ApiError(
          'JOB_DEPENDENCY_NOT_READY',
          'The protocol simulator intentionally failed before sending a provider request.',
          409,
          { providerRequestSubmitted: false },
        )
      }
      return input.shotSpec.mediaKind === 'still_image'
        ? executeStill(endpoint, state, input.providerRoute, providerModelVersion, requestDigest, externalOperationIdHash)
        : executeVideo(endpoint, state, input.providerRoute, providerModelVersion, requestDigest, externalOperationIdHash)
    },
    async close() {
      if (closed) return
      closed = true
      await closeServer(server)
      secret.fill(0)
    },
  }
}

export function assertLoopbackProtocolEndpoint(value: string): URL {
  let url: URL
  try { url = new URL(value) } catch { throw blocked('Protocol endpoint is invalid.') }
  if (
    url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || !url.port ||
    url.username || url.password || url.hash || url.search
  ) throw blocked('Only an internally created 127.0.0.1 protocol endpoint is permitted.')
  return url
}

export function verifyMotionStudioSimulatorEvent(input: {
  rawBody: Buffer
  signature: string | null
  secret: Buffer
  expectedOperationId: string
  nowEpochMs?: number
}): {
  operationId: string
  eventId: string
  type: 'processing'
  occurredAt: string
} {
  if (!input.signature?.startsWith('sha256=') || input.rawBody.byteLength > MAXIMUM_JSON_BYTES) {
    throw blocked('Simulator event signature is missing or malformed.')
  }
  const suppliedHex = input.signature.slice(7)
  if (!/^[a-f0-9]{64}$/.test(suppliedHex)) throw blocked('Simulator event signature is malformed.')
  const expected = createHmac('sha256', input.secret).update(input.rawBody).digest()
  const supplied = Buffer.from(suppliedHex, 'hex')
  if (supplied.byteLength !== expected.byteLength || !timingSafeEqual(supplied, expected)) {
    throw blocked('Simulator event signature verification failed.')
  }
  let value: unknown
  try { value = JSON.parse(input.rawBody.toString('utf8')) } catch { throw blocked('Verified simulator event JSON is malformed.') }
  if (!isRecord(value) || value.operationId !== input.expectedOperationId ||
    typeof value.eventId !== 'string' || !/^evt-[a-f0-9-]{36}$/.test(value.eventId) ||
    value.type !== 'processing' || typeof value.occurredAt !== 'string' || !Number.isFinite(Date.parse(value.occurredAt))) {
    throw blocked('Verified simulator event payload is outside the registered schema.')
  }
  const occurredAtEpochMs = Date.parse(value.occurredAt)
  const nowEpochMs = input.nowEpochMs ?? Date.now()
  if (
    occurredAtEpochMs < nowEpochMs - MAXIMUM_EVENT_AGE_MS ||
    occurredAtEpochMs > nowEpochMs + MAXIMUM_EVENT_FUTURE_SKEW_MS
  ) throw blocked('Verified simulator event is stale or outside the allowed clock skew.')
  return {
    operationId: value.operationId,
    eventId: value.eventId,
    type: value.type,
    occurredAt: value.occurredAt,
  }
}

interface SimulatorState {
  operationId: string
  secret: Buffer
  behavior: MotionStudioProtocolSimulatorBehavior
  shotSpec: MotionStudioGenerationShotSpecV1
  expectedPayload: GptImage2GenerationPayload | MotionStudioVideoCapabilityEnvelopeV1
  media?: Buffer
  eventRead: boolean
}

async function handleSimulatorRequest(
  request: IncomingMessage,
  response: ServerResponse,
  state: SimulatorState,
  ffmpegBin: string,
): Promise<void> {
  try {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1')
    if (request.headers.host && !/^127\.0\.0\.1:\d+$/.test(request.headers.host)) {
      sendJson(response, 421, { error: 'loopback_host_required' })
      return
    }
    if (request.method === 'POST' && url.pathname === '/v1/images/generations') {
      const body = await readJsonRequest(request)
      if (sha256CanonicalJson(body) !== sha256CanonicalJson(state.expectedPayload) || state.shotSpec.mediaKind !== 'still_image') {
        sendJson(response, 400, { error: 'request_authority_mismatch' })
        return
      }
      if (['failed', 'cancelled', 'outcome_unknown'].includes(state.behavior)) {
        sendJson(response, 200, { operationId: state.operationId, status: state.behavior })
        return
      }
      state.media ??= await generatePngFixture(
        ffmpegBin,
        state.behavior === 'qa_rejected' ? qaRejectedShotSpec(state.shotSpec) : state.shotSpec,
      )
      sendJson(response, 200, { data: [{ b64_json: state.media.toString('base64') }] })
      return
    }
    if (request.method === 'POST' && url.pathname === '/v1/videos') {
      const body = await readJsonRequest(request)
      if (sha256CanonicalJson(body) !== sha256CanonicalJson(state.expectedPayload) || state.shotSpec.mediaKind !== 'video_clip') {
        sendJson(response, 400, { error: 'request_authority_mismatch' })
        return
      }
      state.media ??= await generateMp4Fixture(
        ffmpegBin,
        state.behavior === 'qa_rejected' ? qaRejectedShotSpec(state.shotSpec) : state.shotSpec,
      )
      sendJson(response, 202, { operationId: state.operationId, status: 'submitted' })
      return
    }
    if (request.method === 'GET' && url.pathname === `/v1/videos/${state.operationId}/event`) {
      state.eventRead = true
      const body = Buffer.from(JSON.stringify({
        operationId: state.operationId,
        eventId: `evt-${randomUUID()}`,
        type: 'processing',
        occurredAt: new Date().toISOString(),
      }))
      response.statusCode = 200
      response.setHeader('content-type', 'application/json')
      response.setHeader('content-length', String(body.byteLength))
      response.setHeader('x-motion-studio-signature', `sha256=${createHmac('sha256', state.secret).update(body).digest('hex')}`)
      response.end(body)
      return
    }
    if (request.method === 'GET' && url.pathname === `/v1/videos/${state.operationId}`) {
      const terminal = state.behavior === 'success' || state.behavior === 'qa_rejected'
        ? 'completed'
        : state.behavior === 'outcome_unknown' ? 'outcome_unknown' : state.behavior
      sendJson(response, 200, { operationId: state.operationId, status: state.eventRead ? terminal : 'processing' })
      return
    }
    if (request.method === 'GET' && url.pathname === `/v1/videos/${state.operationId}/content`) {
      if (!['success', 'qa_rejected'].includes(state.behavior) || !state.media) {
        sendJson(response, 409, { error: 'media_not_ready' })
        return
      }
      response.statusCode = 200
      response.setHeader('content-type', 'video/mp4')
      response.setHeader('content-length', String(state.media.byteLength))
      response.end(state.media)
      return
    }
    sendJson(response, 404, { error: 'not_found' })
  } catch (error) {
    sendJson(response, 500, { error: error instanceof Error ? error.message : 'simulator_failure' })
  }
}

async function executeStill(
  endpoint: string,
  state: SimulatorState,
  providerRoute: MotionStudioGenerationProviderRoute,
  providerModelVersion: string,
  requestDigest: string,
  externalOperationIdHash: string,
): Promise<MotionStudioProtocolExecutionResult> {
  const response = await safeFetch(`${endpoint}/v1/images/generations`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(state.expectedPayload),
  })
  if (!response.ok) throw blocked(`Protocol still simulator failed with status ${response.status}.`)
  const responseValue = await readBoundedJson(response)
  const occurredAt = new Date().toISOString()
  if (isRecord(responseValue) && responseValue.operationId === state.operationId &&
    ['failed', 'cancelled', 'outcome_unknown'].includes(String(responseValue.status))) {
    const status = String(responseValue.status)
    const normalizedStatus = status === 'outcome_unknown' ? 'reconciliation_required' : status as 'failed' | 'cancelled'
    return {
      providerRoute, providerModelVersion, requestDigest, externalOperationIdHash,
      operationId: state.operationId,
      signals: [signal(
        'synchronous',
        status as 'failed' | 'cancelled' | 'outcome_unknown',
        normalizedStatus,
        'synchronous_response',
        false,
        occurredAt,
        state.operationId,
      )],
      providerCostIncurred: false,
      outputIsProviderGenerated: false,
    }
  }
  const parsed = parseGptImage2SimulatorResponse(responseValue)
  return {
    providerRoute, providerModelVersion, requestDigest, externalOperationIdHash,
    operationId: state.operationId,
    signals: [signal('synchronous', 'completed', 'completed', 'synchronous_response', false, occurredAt, state.operationId)],
    bytes: parsed.bytes,
    mimeType: 'image/png',
    providerCostIncurred: false,
    outputIsProviderGenerated: false,
  }
}

async function executeVideo(
  endpoint: string,
  state: SimulatorState,
  providerRoute: MotionStudioGenerationProviderRoute,
  providerModelVersion: string,
  requestDigest: string,
  externalOperationIdHash: string,
): Promise<MotionStudioProtocolExecutionResult> {
  const submitted = await safeFetch(`${endpoint}/v1/videos`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(state.expectedPayload),
  })
  if (submitted.status !== 202) throw blocked(`Protocol video submit failed with status ${submitted.status}.`)
  const submitBody = await readBoundedJson(submitted)
  if (!isRecord(submitBody) || submitBody.operationId !== state.operationId || submitBody.status !== 'submitted') {
    throw blocked('Protocol video submit response is invalid.')
  }
  const submittedAt = new Date().toISOString()
  const signals: MotionStudioProtocolSignal[] = [
    signal('synchronous', 'submitted', 'submitted', 'synchronous_response', false, submittedAt, state.operationId),
  ]

  const eventResponse = await safeFetch(`${endpoint}/v1/videos/${encodeURIComponent(state.operationId)}/event`)
  if (!eventResponse.ok) throw blocked('Protocol simulator event channel failed.')
  const rawEvent = Buffer.from(await eventResponse.arrayBuffer())
  const verified = verifyMotionStudioSimulatorEvent({
    rawBody: rawEvent,
    signature: eventResponse.headers.get('x-motion-studio-signature'),
    secret: state.secret,
    expectedOperationId: state.operationId,
  })
  signals.push(signal('webhook', 'processing', 'processing', 'hmac_sha256', true, verified.occurredAt, verified.eventId))

  let terminal: string | undefined
  for (let poll = 0; poll < 3; poll += 1) {
    const pollResponse = await safeFetch(`${endpoint}/v1/videos/${encodeURIComponent(state.operationId)}`)
    if (!pollResponse.ok) throw blocked('Protocol simulator poll failed.')
    const pollBody = await readBoundedJson(pollResponse)
    if (!isRecord(pollBody) || pollBody.operationId !== state.operationId || typeof pollBody.status !== 'string') {
      throw blocked('Protocol simulator poll response is invalid.')
    }
    terminal = pollBody.status
    if (terminal !== 'processing') break
  }
  const occurredAt = new Date().toISOString()
  if (terminal === 'outcome_unknown') {
    signals.push(signal('poll', 'outcome_unknown', 'reconciliation_required', 'server_poll', false, occurredAt, state.operationId))
    return { providerRoute, providerModelVersion, requestDigest, externalOperationIdHash, operationId: state.operationId, signals, providerCostIncurred: false, outputIsProviderGenerated: false }
  }
  if (!['completed', 'failed', 'cancelled'].includes(terminal ?? '')) {
    throw blocked('Protocol simulator exceeded its bounded polling policy.')
  }
  signals.push(signal('poll', terminal as 'completed' | 'failed' | 'cancelled', terminal as 'completed' | 'failed' | 'cancelled', 'server_poll', false, occurredAt, state.operationId))
  if (terminal !== 'completed') {
    return { providerRoute, providerModelVersion, requestDigest, externalOperationIdHash, operationId: state.operationId, signals, providerCostIncurred: false, outputIsProviderGenerated: false }
  }
  const mediaResponse = await safeFetch(`${endpoint}/v1/videos/${encodeURIComponent(state.operationId)}/content`)
  if (!mediaResponse.ok || mediaResponse.headers.get('content-type')?.split(';')[0] !== 'video/mp4') {
    throw blocked('Protocol simulator completed without exact MP4 media.')
  }
  const bytes = Buffer.from(await mediaResponse.arrayBuffer())
  if (bytes.byteLength > MAXIMUM_MEDIA_BYTES || bytes.subarray(4, 8).toString('ascii') !== 'ftyp') {
    throw blocked('Protocol simulator MP4 response is invalid or oversized.')
  }
  return { providerRoute, providerModelVersion, requestDigest, externalOperationIdHash, operationId: state.operationId, signals, bytes, mimeType: 'video/mp4', providerCostIncurred: false, outputIsProviderGenerated: false }
}

function signal(
  eventSource: MotionStudioProtocolSignal['eventSource'],
  eventType: MotionStudioProtocolSignal['eventType'],
  normalizedStatus: MotionStudioProtocolSignal['normalizedStatus'],
  verificationKind: MotionStudioProtocolSignal['verificationKind'],
  signatureVerified: boolean,
  occurredAt: string,
  evidenceIdentity: string,
): MotionStudioProtocolSignal {
  const eventDigest = sha256CanonicalJson({ eventSource, eventType, normalizedStatus, verificationKind, signatureVerified, occurredAt, evidenceIdentity })
  return {
    eventKeyHash: sha256CanonicalJson({ adapter: MOTION_STUDIO_PROTOCOL_SIMULATOR_ADAPTER_ID, evidenceIdentity, eventType }),
    eventSource, eventType, normalizedStatus, verificationKind, signatureVerified, eventDigest, occurredAt,
  }
}

async function generatePngFixture(ffmpegBin: string, shotSpec: MotionStudioGenerationShotSpecV1): Promise<Buffer> {
  return runMediaCommand(ffmpegBin, [
    '-hide_banner', '-loglevel', 'error', '-f', 'lavfi',
    '-i', `color=c=0x17233C:s=${shotSpec.timingAuthority.width}x${shotSpec.timingAuthority.height}:d=0.1`,
    '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', 'pipe:1',
  ])
}

async function generateMp4Fixture(ffmpegBin: string, shotSpec: MotionStudioGenerationShotSpecV1): Promise<Buffer> {
  const width = shotSpec.timingAuthority.width
  const height = shotSpec.timingAuthority.height
  const frames = shotSpec.sceneRange.endFrame - shotSpec.sceneRange.startFrame
  const fps = shotSpec.timingAuthority.frameRate
  if (width % 2 || height % 2 || frames < 1 || frames > 1800 || ![24, 30, 60].includes(fps)) {
    throw blocked('Protocol simulator video facts are outside the bounded MP4 fixture profile.')
  }
  return runMediaCommand(ffmpegBin, [
    '-hide_banner', '-loglevel', 'error', '-f', 'lavfi',
    '-i', `color=c=0x17233C:s=${width}x${height}:r=${fps}`,
    '-frames:v', String(frames), '-an', '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
    '-movflags', 'frag_keyframe+empty_moov', '-f', 'mp4', 'pipe:1',
  ])
}

function qaRejectedShotSpec(shotSpec: MotionStudioGenerationShotSpecV1): MotionStudioGenerationShotSpecV1 {
  if (shotSpec.mediaKind === 'still_image') {
    return {
      ...shotSpec,
      timingAuthority: {
        ...shotSpec.timingAuthority,
        width: Math.max(16, shotSpec.timingAuthority.width - 16),
      },
    }
  }
  return {
    ...shotSpec,
    sceneRange: {
      ...shotSpec.sceneRange,
      endFrame: Math.max(shotSpec.sceneRange.startFrame + 1, shotSpec.sceneRange.endFrame - 1),
    },
  }
}

async function runMediaCommand(binary: string, args: readonly string[]): Promise<Buffer> {
  if (!binary || binary.includes('\0')) throw blocked('Configured FFmpeg binary is invalid.')
  return new Promise((resolve, reject) => {
    const child = spawn(binary, [...args], { stdio: ['ignore', 'pipe', 'pipe'], shell: false })
    const output: Buffer[] = []
    const errors: Buffer[] = []
    let outputBytes = 0
    let settled = false
    const fail = (error: Error) => {
      if (settled) return
      settled = true
      child.kill('SIGKILL')
      reject(error)
    }
    const timeout = setTimeout(() => fail(blocked('Protocol fixture media command timed out.')), REQUEST_TIMEOUT_MS)
    child.stdout.on('data', (chunk: Buffer) => {
      outputBytes += chunk.byteLength
      if (outputBytes > MAXIMUM_MEDIA_BYTES) fail(blocked('Protocol fixture media exceeded its byte ceiling.'))
      else output.push(Buffer.from(chunk))
    })
    child.stderr.on('data', (chunk: Buffer) => {
      if (errors.reduce((total, item) => total + item.byteLength, 0) < 64_000) errors.push(Buffer.from(chunk))
    })
    child.on('error', fail)
    child.on('close', (code) => {
      clearTimeout(timeout)
      if (settled) return
      settled = true
      if (code !== 0) reject(blocked(`Protocol fixture media command failed (${code}): ${Buffer.concat(errors).toString('utf8').slice(0, 500)}`))
      else resolve(Buffer.concat(output))
    })
  })
}

async function safeFetch(value: string, init: RequestInit = {}): Promise<Response> {
  const url = assertLoopbackProtocolEndpoint(new URL(value).origin)
  const target = new URL(value)
  if (target.origin !== url.origin) throw blocked('Protocol request origin changed unexpectedly.')
  return fetch(target, { ...init, redirect: 'error', signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
}

async function readBoundedJson(response: Response): Promise<unknown> {
  const length = Number(response.headers.get('content-length') ?? '0')
  if (length > MAXIMUM_JSON_BYTES) throw blocked('Protocol JSON response exceeds its byte ceiling.')
  const bytes = Buffer.from(await response.arrayBuffer())
  if (bytes.byteLength > MAXIMUM_JSON_BYTES) throw blocked('Protocol JSON response exceeds its byte ceiling.')
  try { return JSON.parse(bytes.toString('utf8')) } catch { throw blocked('Protocol JSON response is malformed.') }
}

async function readJsonRequest(request: IncomingMessage): Promise<unknown> {
  if (request.headers['content-type']?.split(';')[0] !== 'application/json') throw blocked('Protocol request must be JSON.')
  const chunks: Buffer[] = []
  let length = 0
  for await (const chunk of request) {
    const bytes = Buffer.from(chunk)
    length += bytes.byteLength
    if (length > MAXIMUM_JSON_BYTES) throw blocked('Protocol request exceeds its byte ceiling.')
    chunks.push(bytes)
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) } catch { throw blocked('Protocol request JSON is malformed.') }
}

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  if (response.headersSent) return
  const bytes = Buffer.from(JSON.stringify(body))
  response.statusCode = status
  response.setHeader('content-type', 'application/json')
  response.setHeader('content-length', String(bytes.byteLength))
  response.setHeader('cache-control', 'no-store')
  response.end(bytes)
}

async function listenLoopback(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject)
      resolve()
    })
  })
  const address = server.address()
  if (!address || typeof address === 'string' || address.address !== '127.0.0.1') {
    await closeServer(server)
    throw blocked('Protocol simulator did not bind to the exact loopback interface.')
  }
}

async function closeServer(server: Server): Promise<void> {
  if (!server.listening) return
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
function blocked(message: string): ApiError {
  return new ApiError('REAL_PROVIDER_CALLS_DISABLED', message, 503, {
    allowedTransport: 'loopback_protocol_simulator',
    realProviderExecutionAuthorized: false,
  })
}
