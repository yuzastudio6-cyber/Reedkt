import { randomUUID } from 'node:crypto'
import { accessSync, constants, existsSync, realpathSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { ApiError } from '../errors/api-error'

const TRUSTED_BUILDX_CANDIDATES = [
  '/Applications/Docker.app/Contents/Resources/cli-plugins/docker-buildx',
  '/usr/libexec/docker/cli-plugins/docker-buildx',
  '/usr/lib/docker/cli-plugins/docker-buildx',
  '/usr/local/libexec/docker/cli-plugins/docker-buildx',
  '/usr/local/lib/docker/cli-plugins/docker-buildx',
  '/opt/homebrew/lib/docker/cli-plugins/docker-buildx',
] as const

export interface PrivateDockerCliInvocation {
  executable: string
  args: string[]
  env: NodeJS.ProcessEnv
  evidence: {
    credentialIsolated: true
    inheritedDockerConfigAccepted: false
    inheritedDockerContextAccepted: false
    inheritedDockerHostAccepted: false
    directTrustedBuildx: boolean
    localImageLoadRequired: boolean
  }
}

let trustedBuildxExecutable: string | undefined

/**
 * Docker Desktop can block indefinitely while its credential helper is
 * unavailable. Private execution does not need registry credentials or a
 * caller-selected remote context, so every invocation receives a fresh,
 * intentionally absent Docker config path. Builds invoke a reviewed local
 * Buildx binary directly and load the resulting image into the local daemon.
 */
export function createPrivateDockerCliInvocation(
  requestedArgs: readonly string[],
): PrivateDockerCliInvocation {
  if (requestedArgs.length === 0 || requestedArgs.some((value) => value.length === 0)) {
    throw notReady('Private Docker invocation arguments are invalid.')
  }

  const dockerConfigPath = uniqueAbsentDockerConfigPath()
  const env: NodeJS.ProcessEnv = {
    PATH: process.env.PATH ?? '/usr/local/bin:/usr/bin:/bin',
    DOCKER_CONFIG: dockerConfigPath,
  }
  const isBuild = requestedArgs[0] === 'build'
  if (!isBuild) {
    return {
      executable: 'docker',
      args: [...requestedArgs],
      env,
      evidence: evidence(false, false),
    }
  }

  const buildArgs = requestedArgs.slice(1)
  if (buildArgs.some((value) =>
    value === '--push' ||
    value === '--load' ||
    value === '--output' ||
    value.startsWith('--output=') ||
    value === '-o' ||
    value === '--builder' ||
    value.startsWith('--builder=') ||
    value === '--secret' ||
    value.startsWith('--secret=') ||
    value === '--ssh' ||
    value.startsWith('--ssh=')
  )) {
    throw notReady('Private Docker image builds contain a forbidden transport option.')
  }

  return {
    executable: resolveTrustedBuildxExecutable(),
    args: ['build', '--load', ...buildArgs],
    env,
    evidence: evidence(true, true),
  }
}

function resolveTrustedBuildxExecutable(): string {
  if (trustedBuildxExecutable) return trustedBuildxExecutable
  for (const candidate of TRUSTED_BUILDX_CANDIDATES) {
    try {
      const resolved = realpathSync(candidate)
      if (!TRUSTED_BUILDX_CANDIDATES.includes(resolved as typeof TRUSTED_BUILDX_CANDIDATES[number])) {
        continue
      }
      const stat = statSync(resolved)
      accessSync(resolved, constants.X_OK)
      if (!stat.isFile() || (stat.mode & 0o002) !== 0) continue
      trustedBuildxExecutable = resolved
      return resolved
    } catch {
      // Continue through the reviewed platform locations and fail closed below.
    }
  }
  throw notReady('A trusted local Docker Buildx executable is unavailable.')
}

function uniqueAbsentDockerConfigPath(): string {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const candidate = join(
      tmpdir(),
      `reeditpro-private-docker-no-credentials-${process.pid}-${randomUUID()}`,
    )
    if (!existsSync(candidate)) return candidate
  }
  throw notReady('A credential-isolated Docker config path could not be allocated.')
}

function evidence(
  directTrustedBuildx: boolean,
  localImageLoadRequired: boolean,
): PrivateDockerCliInvocation['evidence'] {
  return {
    credentialIsolated: true,
    inheritedDockerConfigAccepted: false,
    inheritedDockerContextAccepted: false,
    inheritedDockerHostAccepted: false,
    directTrustedBuildx,
    localImageLoadRequired,
  }
}

function notReady(message: string): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 503)
}
