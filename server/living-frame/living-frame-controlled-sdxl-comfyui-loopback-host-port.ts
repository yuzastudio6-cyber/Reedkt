import type {
  LivingFrameControlledSdxlPrivateGpuWireRequest,
} from './living-frame-controlled-sdxl-gpu-runtime-protocol'
import {
  registerLivingFrameControlledSdxlComfyUiHostPort,
  type LivingFrameControlledSdxlComfyUiHostExecutionResult,
  type LivingFrameControlledSdxlComfyUiHostPort,
} from './living-frame-controlled-sdxl-comfyui-host-runtime'

const COMFY_UI_HTTP_ORIGIN = 'http://127.0.0.1:8188'
const COMFY_UI_WS_ORIGIN = 'ws://127.0.0.1:8188'
const EXECUTION_TIMEOUT_MILLISECONDS = 90_000
const MAX_PROMPT_RESPONSE_BYTES = 64 * 1024
const BINARY_HEADER_BYTES = 8
const PREVIEW_IMAGE_EVENT = 1
const PNG_IMAGE_FORMAT = 2

export function createLivingFrameControlledSdxlComfyUiLoopbackHostPort():
  LivingFrameControlledSdxlComfyUiHostPort {
  return registerLivingFrameControlledSdxlComfyUiHostPort({
    hostPortClass: 'private_loopback_comfyui_host_port_v1',
    callerEndpointAccepted: false,
    callerPathUrlCredentialAccepted: false,
    externalNetworkAllowed: false,
    runtimeDownloadsAllowed: false,
    productionQualified: false,
    executeOne: executeOnLoopbackHost,
  })
}

export function createControlledLivingFrameComfyUiHostFixturePort(
  resultFactory: (
    request: LivingFrameControlledSdxlPrivateGpuWireRequest,
  ) => Promise<LivingFrameControlledSdxlComfyUiHostExecutionResult>,
): LivingFrameControlledSdxlComfyUiHostPort {
  let used = false
  return registerLivingFrameControlledSdxlComfyUiHostPort({
    hostPortClass: 'controlled_fixture_comfyui_host_port_v1',
    callerEndpointAccepted: false,
    callerPathUrlCredentialAccepted: false,
    externalNetworkAllowed: false,
    runtimeDownloadsAllowed: false,
    productionQualified: false,
    async executeOne(request) {
      if (used) throw new Error('Controlled host fixture reused.')
      used = true
      return resultFactory(request)
    },
  })
}

async function executeOnLoopbackHost(
  request: LivingFrameControlledSdxlPrivateGpuWireRequest,
): Promise<LivingFrameControlledSdxlComfyUiHostExecutionResult> {
  const startedAt = new Date().toISOString()
  let acceptedPromptId: string | undefined
  let socket: WebSocket | undefined
  let timeout: ReturnType<typeof setTimeout> | undefined

  const result = await new Promise<
    LivingFrameControlledSdxlComfyUiHostExecutionResult
  >((resolve) => {
    let settled = false
    let currentNodeId: string | null = null
    const outputNodeId = Object.entries(request.prompt)
      .find(([, node]) =>
        node.class_type === 'SaveImageWebsocket')?.[0]
    const outputImages: Uint8Array[] = []

    const finish = (
      terminalState: 'completed' | 'failed' | 'outcome_unknown',
      failureCode:
        LivingFrameControlledSdxlComfyUiHostExecutionResult[
          'failureCode'
        ],
    ) => {
      if (settled) return
      settled = true
      if (timeout) clearTimeout(timeout)
      try {
        socket?.close()
      } catch {
        // A terminal receipt must not depend on close success.
      }
      resolve({
        evidenceClass:
          'private_internal_comfyui_host_runtime_observation_unreleased',
        terminalState,
        failureCode,
        promptAccepted: acceptedPromptId !== undefined,
        modelInferenceExecuted:
          acceptedPromptId !== undefined
          && terminalState !== 'outcome_unknown',
        startedAt,
        finishedAt: new Date().toISOString(),
        ...(acceptedPromptId
          ? { privatePromptId: acceptedPromptId }
          : {}),
        ...(terminalState === 'completed'
          ? { outputPngBytes: outputImages[0] }
          : {}),
        outputImageCount:
          terminalState === 'completed'
            ? outputImages.length
            : 0,
        externalNetworkPerformed: false,
        runtimeDownloadPerformed: false,
      })
    }

    try {
      socket = new WebSocket(
        `${COMFY_UI_WS_ORIGIN}/ws?clientId=${request.clientId}`,
      )
      socket.binaryType = 'arraybuffer'
    } catch {
      finish('failed', 'host_connection_failed')
      return
    }

    timeout = setTimeout(() => {
      if (acceptedPromptId) {
        void interruptPrompt(acceptedPromptId)
      }
      finish('outcome_unknown', 'host_timeout')
    }, EXECUTION_TIMEOUT_MILLISECONDS)

    socket.addEventListener('open', () => {
      void queuePrompt(request).then((promptId) => {
        acceptedPromptId = promptId
      }).catch(() => {
        finish('failed', 'host_prompt_rejected')
      })
    }, { once: true })

    socket.addEventListener('message', (event) => {
      if (settled) return
      if (typeof event.data === 'string') {
        const message = parseHostMessage(event.data)
        if (!message) {
          finish('failed', 'host_protocol_invalid')
          return
        }
        if (
          message.promptId
          && acceptedPromptId
          && message.promptId !== acceptedPromptId
        ) return
        if (message.type === 'executing') {
          currentNodeId = message.nodeId
          if (message.nodeId === null) {
            if (outputImages.length !== 1) {
              finish('failed', 'output_count_invalid')
            } else {
              finish('completed', 'none')
            }
          }
          return
        }
        if (message.type === 'execution_error') {
          finish('failed', 'host_execution_failed')
          return
        }
        if (message.type === 'execution_interrupted') {
          finish('failed', 'host_execution_interrupted')
        }
        return
      }

      void binaryData(event.data).then((bytes) => {
        if (settled) return
        const pngBytes = parsePngFrame(bytes)
        if (
          !pngBytes
          || !outputNodeId
          || currentNodeId !== outputNodeId
          || outputImages.length >= 1
        ) {
          finish('failed', 'host_protocol_invalid')
          return
        }
        outputImages.push(pngBytes)
      }).catch(() => {
        finish('failed', 'host_protocol_invalid')
      })
    })

    socket.addEventListener('error', () => {
      finish(
        acceptedPromptId ? 'outcome_unknown' : 'failed',
        acceptedPromptId
          ? 'host_connection_closed'
          : 'host_connection_failed',
      )
    }, { once: true })

    socket.addEventListener('close', () => {
      if (!settled) {
        finish(
          acceptedPromptId ? 'outcome_unknown' : 'failed',
          'host_connection_closed',
        )
      }
    }, { once: true })
  })

  return result
}

async function queuePrompt(
  request: LivingFrameControlledSdxlPrivateGpuWireRequest,
): Promise<string> {
  const response = await fetch(`${COMFY_UI_HTTP_ORIGIN}/prompt`, {
    method: 'POST',
    redirect: 'error',
    headers: {
      'content-type': 'application/json',
      'comfy-usage-source': 'reeditpro-living-frame',
    },
    body: JSON.stringify({
      prompt: request.prompt,
      client_id: request.clientId,
    }),
    signal: AbortSignal.timeout(10_000),
  })
  const responseBody = await response.text()
  if (
    !response.ok
    || Buffer.byteLength(responseBody, 'utf8')
      > MAX_PROMPT_RESPONSE_BYTES
  ) throw new Error('ComfyUI prompt rejected.')
  const parsed: unknown = JSON.parse(responseBody)
  if (
    !isRecord(parsed)
    || typeof parsed.prompt_id !== 'string'
    || parsed.prompt_id.length < 1
    || parsed.prompt_id.length > 128
  ) throw new Error('ComfyUI prompt response invalid.')
  return parsed.prompt_id
}

async function interruptPrompt(promptId: string): Promise<void> {
  try {
    await fetch(`${COMFY_UI_HTTP_ORIGIN}/interrupt`, {
      method: 'POST',
      redirect: 'error',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt_id: promptId }),
      signal: AbortSignal.timeout(2_000),
    })
  } catch {
    // An unknown attempt remains cost-bearing even if interruption fails.
  }
}

function parseHostMessage(value: string): {
  readonly type:
    | 'executing'
    | 'execution_error'
    | 'execution_interrupted'
    | 'other'
  readonly promptId?: string
  readonly nodeId: string | null
} | null {
  if (Buffer.byteLength(value, 'utf8') > 64 * 1024) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch {
    return null
  }
  if (
    !isRecord(parsed)
    || typeof parsed.type !== 'string'
    || !isRecord(parsed.data)
  ) return null
  const promptId = typeof parsed.data.prompt_id === 'string'
    ? parsed.data.prompt_id
    : undefined
  if (parsed.type === 'executing') {
    const node = parsed.data.node
    if (node !== null && typeof node !== 'string') return null
    return {
      type: 'executing',
      ...(promptId ? { promptId } : {}),
      nodeId: node,
    }
  }
  if (
    parsed.type === 'execution_error'
    || parsed.type === 'execution_interrupted'
  ) {
    return {
      type: parsed.type,
      ...(promptId ? { promptId } : {}),
      nodeId: null,
    }
  }
  return {
    type: 'other',
    ...(promptId ? { promptId } : {}),
    nodeId: null,
  }
}

async function binaryData(value: unknown): Promise<Uint8Array> {
  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value)
  }
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(
      value.buffer,
      value.byteOffset,
      value.byteLength,
    )
  }
  if (value instanceof Blob) {
    return new Uint8Array(await value.arrayBuffer())
  }
  throw new Error('Unsupported ComfyUI binary frame.')
}

function parsePngFrame(bytes: Uint8Array): Uint8Array | null {
  if (bytes.byteLength <= BINARY_HEADER_BYTES) return null
  const view = new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength,
  )
  if (
    view.getUint32(0, false) !== PREVIEW_IMAGE_EVENT
    || view.getUint32(4, false) !== PNG_IMAGE_FORMAT
  ) return null
  return Uint8Array.from(bytes.subarray(BINARY_HEADER_BYTES))
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
}
