import { execFileSync } from 'node:child_process'

import {
  createProductionContainerQualificationImageObservation,
  createProductionContainerQualificationSourceObservation,
  hashBoundedHostObservation,
  PRODUCTION_CONTAINER_CANDIDATE_VERSION_LABEL,
  PRODUCTION_CONTAINER_IMAGE_ROLE_LABEL,
  PRODUCTION_CONTAINER_SOURCE_CLEAN_LABEL,
  PRODUCTION_CONTAINER_SOURCE_COMMIT_LABEL,
  PRODUCTION_CONTAINER_SOURCE_TREE_LABEL,
  type ProductionContainerQualificationHostAdapter,
} from './production-container-qualification-independent-verification'

const DEFAULT_TIMEOUT_MS = 10_000
const DEFAULT_MAX_BUFFER = 2 * 1024 * 1024

export function createLiveProductionContainerQualificationHostAdapter(input: {
  repositoryRoot?: string
  timeoutMs?: number
  maxBuffer?: number
} = {}): ProductionContainerQualificationHostAdapter {
  const repositoryRoot = input.repositoryRoot ?? process.cwd()
  const timeoutMs = boundedInteger(input.timeoutMs, DEFAULT_TIMEOUT_MS, 500, 30_000)
  const maxBuffer = boundedInteger(
    input.maxBuffer,
    DEFAULT_MAX_BUFFER,
    64 * 1024,
    4 * 1024 * 1024,
  )
  const environment = sanitizedHostEnvironment()

  return Object.freeze({
    inspectSource() {
      const sourceCommitSha = runBounded('git', ['rev-parse', 'HEAD'], {
        cwd: repositoryRoot,
        timeoutMs,
        maxBuffer,
        environment,
        failureCode: 'git_commit_inspection_failed',
      }).trim()
      const sourceTreeHash = runBounded('git', ['rev-parse', 'HEAD^{tree}'], {
        cwd: repositoryRoot,
        timeoutMs,
        maxBuffer,
        environment,
        failureCode: 'git_tree_inspection_failed',
      }).trim()
      const status = runBounded('git', [
        'status',
        '--porcelain=v1',
        '--untracked-files=all',
      ], {
        cwd: repositoryRoot,
        timeoutMs,
        maxBuffer,
        environment,
        failureCode: 'git_status_inspection_failed',
      })
      const statusEntryCount = status.split(/\r?\n/u).filter(Boolean).length
      return createProductionContainerQualificationSourceObservation({
        sourceCommitSha,
        sourceTreeHash,
        worktreeClean: statusEntryCount === 0,
        statusEntryCount,
        statusEvidenceHash: hashBoundedHostObservation(status),
      })
    },
    inspectImage({ imageReference }: { imageReference: string }) {
      const endpointOutput = runBounded('docker', [
        'context',
        'inspect',
        '--format',
        '{{json .Endpoints.docker.Host}}',
      ], {
        cwd: repositoryRoot,
        timeoutMs,
        maxBuffer,
        environment,
        failureCode: 'docker_context_inspection_failed',
      }).trim()
      const endpoint = parseJsonString(endpointOutput, 'docker_context_invalid')
      if (!endpoint.startsWith('unix://') && !endpoint.startsWith('npipe://')) {
        throw new Error('container_endpoint_not_local')
      }

      const inspectionOutput = runBounded('docker', ['image', 'inspect', imageReference], {
        cwd: repositoryRoot,
        timeoutMs,
        maxBuffer,
        environment,
        failureCode: 'docker_image_inspection_failed',
      })
      const inspection = parseImageInspection(inspectionOutput)
      const labels = inspection.Config?.Labels ?? {}

      return createProductionContainerQualificationImageObservation({
        inspectedImageReference: imageReference,
        imageIdDigest: requiredString(inspection.Id, 'docker_image_id_missing'),
        repoDigests: requiredStringArray(inspection.RepoDigests, 'docker_repo_digests_missing'),
        labels: {
          sourceCommitSha: requiredLabel(labels, PRODUCTION_CONTAINER_SOURCE_COMMIT_LABEL),
          sourceTreeHash: requiredLabel(labels, PRODUCTION_CONTAINER_SOURCE_TREE_LABEL),
          imageRole: requiredLabel(labels, PRODUCTION_CONTAINER_IMAGE_ROLE_LABEL) as
            'api' | 'cpu_worker' | 'gpu_worker' | 'render_worker' | 'qa_worker' | 'tool_readiness_worker',
          sourceClean: requiredLabel(labels, PRODUCTION_CONTAINER_SOURCE_CLEAN_LABEL) as 'true',
          candidateContractVersion: requiredLabel(
            labels,
            PRODUCTION_CONTAINER_CANDIDATE_VERSION_LABEL,
          ) as 'production-container-qualification-candidate-v1',
        },
        containerEndpointEvidenceHash: hashBoundedHostObservation(endpointOutput),
        inspectionEvidenceHash: hashBoundedHostObservation(inspectionOutput),
      })
    },
  })
}

interface BoundedCommandOptions {
  cwd: string
  timeoutMs: number
  maxBuffer: number
  environment: NodeJS.ProcessEnv
  failureCode: string
}

function runBounded(command: string, args: string[], options: BoundedCommandOptions): string {
  try {
    return execFileSync(command, args, {
      cwd: options.cwd,
      encoding: 'utf8',
      timeout: options.timeoutMs,
      maxBuffer: options.maxBuffer,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: options.environment,
      shell: false,
    })
  } catch {
    throw new Error(options.failureCode)
  }
}

function parseImageInspection(raw: string): {
  Id?: unknown
  RepoDigests?: unknown
  Config?: { Labels?: Record<string, unknown> | null } | null
} {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('docker_image_inspection_invalid')
  }
  if (!Array.isArray(parsed) || parsed.length !== 1 || !isRecord(parsed[0])) {
    throw new Error('docker_image_inspection_invalid')
  }
  return parsed[0]
}

function parseJsonString(raw: string, failureCode: string): string {
  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed === 'string' && parsed.length > 0) return parsed
  } catch {
    // The sanitized failure below is the only projected error.
  }
  throw new Error(failureCode)
}

function requiredString(value: unknown, failureCode: string): string {
  if (typeof value !== 'string' || value.length === 0) throw new Error(failureCode)
  return value
}

function requiredStringArray(value: unknown, failureCode: string): string[] {
  if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== 'string')) {
    throw new Error(failureCode)
  }
  return value as string[]
}

function requiredLabel(labels: Record<string, unknown>, name: string): string {
  const value = labels[name]
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error('docker_required_source_label_missing')
  }
  return value
}

function sanitizedHostEnvironment(): NodeJS.ProcessEnv {
  const allowed = ['PATH', 'HOME', 'LANG', 'LC_ALL', 'TMPDIR']
  return {
    ...Object.fromEntries(allowed.flatMap((name) =>
      process.env[name] === undefined ? [] : [[name, process.env[name]]])),
    GIT_OPTIONAL_LOCKS: '0',
    GIT_TERMINAL_PROMPT: '0',
  }
}

function boundedInteger(
  value: number | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  if (value === undefined) return fallback
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error('host_verification_limit_invalid')
  }
  return value
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
