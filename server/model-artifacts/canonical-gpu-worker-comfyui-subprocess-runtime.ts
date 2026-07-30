import { spawn } from 'node:child_process'

import { ApiError } from '../errors/api-error'
import {
  createCanonicalGpuWorkerOperationRuntimePort,
  hashCanonicalGpuWorkerStderr,
} from './canonical-gpu-worker-operation-router'
import type {
  CanonicalGpuWorkerOperationRuntimePort,
  CanonicalGpuWorkerOperationRuntimePortResult,
} from './canonical-gpu-worker-operation-router-types'

export const CANONICAL_GPU_WORKER_COMFYUI_PYTHON =
  '/opt/reeditpro/gpu-operations/comfyui/venv/bin/python' as const
export const CANONICAL_GPU_WORKER_COMFYUI_RUNNER =
  '/opt/reeditpro/gpu-operations/comfyui/runner.py' as const

const MAXIMUM_REQUEST_BYTES = 1_048_576
const MAXIMUM_CAPTURE_BYTES = 128 * 1_024

export function createCanonicalGpuWorkerComfyUiSubprocessRuntimePort():
CanonicalGpuWorkerOperationRuntimePort {
  return createCanonicalGpuWorkerOperationRuntimePort({
    evidenceClass: 'fixed_gpu_subprocess_unqualified',
    supportedOperationIds: [
      'tool.comfyui.generate_controlled_image.v1',
    ],
    async execute(input) {
      if (
        input.request.operationId
          !== 'tool.comfyui.generate_controlled_image.v1'
        || Buffer.byteLength(input.serializedRequest, 'utf8')
          > MAXIMUM_REQUEST_BYTES
        || input.maximumResponseBytes > MAXIMUM_CAPTURE_BYTES
        || input.timeoutMilliseconds <= 0
        || input.timeoutMilliseconds > 2 * 60 * 60 * 1_000
      ) {
        throw notReady(
          'canonical_gpu_worker_comfyui_subprocess_request_invalid',
        )
      }
      return runFixedSubprocess({
        serializedRequest: input.serializedRequest,
        timeoutMilliseconds: input.timeoutMilliseconds,
        maximumResponseBytes: input.maximumResponseBytes,
      })
    },
  })
}

async function runFixedSubprocess(input: {
  serializedRequest: string
  timeoutMilliseconds: number
  maximumResponseBytes: number
}): Promise<CanonicalGpuWorkerOperationRuntimePortResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      CANONICAL_GPU_WORKER_COMFYUI_PYTHON,
      ['-I', '-B', CANONICAL_GPU_WORKER_COMFYUI_RUNNER],
      {
        cwd: '/tmp',
        env: fixedRuntimeEnvironment(),
        shell: false,
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    )
    const stdout: Buffer[] = []
    const stderr: Buffer[] = []
    let stdoutByteLength = 0
    let stderrByteLength = 0
    let captureExceeded = false
    let timedOut = false
    let settled = false

    const timeout = setTimeout(() => {
      timedOut = true
      child.kill('SIGKILL')
    }, input.timeoutMilliseconds)
    timeout.unref()

    child.stdout.on('data', (chunk: Buffer) => {
      stdoutByteLength += chunk.byteLength
      if (
        stdoutByteLength > input.maximumResponseBytes
        || stdoutByteLength > MAXIMUM_CAPTURE_BYTES
      ) {
        captureExceeded = true
        child.kill('SIGKILL')
        return
      }
      stdout.push(Buffer.from(chunk))
    })
    child.stderr.on('data', (chunk: Buffer) => {
      stderrByteLength += chunk.byteLength
      if (stderrByteLength > MAXIMUM_CAPTURE_BYTES) {
        captureExceeded = true
        child.kill('SIGKILL')
        return
      }
      stderr.push(Buffer.from(chunk))
    })
    child.once('error', () => {
      clearTimeout(timeout)
      if (settled) return
      settled = true
      reject(notReady(
        'canonical_gpu_worker_comfyui_fixed_subprocess_unavailable',
      ))
    })
    child.once('close', (exitCode) => {
      clearTimeout(timeout)
      if (settled) return
      settled = true
      if (captureExceeded) {
        reject(notReady(
          'canonical_gpu_worker_comfyui_subprocess_capture_exceeded',
        ))
        return
      }
      const stdoutBuffer = Buffer.concat(stdout)
      const stderrBuffer = Buffer.concat(stderr)
      resolve({
        wireResponse: parseWireResponse(stdoutBuffer),
        process: {
          exitCode: exitCode ?? -1,
          timedOut,
          oomKilled: false,
          stdoutByteLength,
          stderrByteLength,
          stderrSha256:
            hashCanonicalGpuWorkerStderr(stderrBuffer),
        },
      })
    })
    child.stdin.on('error', () => {
      child.kill('SIGKILL')
    })
    child.stdin.end(`${input.serializedRequest}\n`)
  })
}

function fixedRuntimeEnvironment(): NodeJS.ProcessEnv {
  return {
    PATH:
      '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
    HOME: '/tmp',
    LANG: 'C.UTF-8',
    LC_ALL: 'C.UTF-8',
    PYTHONHASHSEED: '0',
    PYTHONDONTWRITEBYTECODE: '1',
    PYTHONUNBUFFERED: '1',
    HF_HUB_OFFLINE: '1',
    TRANSFORMERS_OFFLINE: '1',
    COMFYUI_MANAGER_DISABLE: '1',
    CUDA_VISIBLE_DEVICES: '0',
    NVIDIA_VISIBLE_DEVICES: '0',
    NO_PROXY: '127.0.0.1,localhost',
    no_proxy: '127.0.0.1,localhost',
    LD_LIBRARY_PATH:
      '/usr/local/nvidia/lib64:/usr/local/cuda/lib64',
  }
}

function parseWireResponse(buffer: Buffer): unknown {
  if (buffer.byteLength < 2) return null
  try {
    return JSON.parse(buffer.toString('utf8')) as unknown
  } catch {
    return null
  }
}

function notReady(code: string): ApiError {
  return new ApiError('TOOL_NOT_READY', code, 409, {
    requiredGate:
      'canonical_gpu_worker_comfyui_fixed_subprocess_runtime',
  })
}
