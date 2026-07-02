import { getBackendEnvStatus } from './server-env'

export type ServerRuntimeMode =
  | 'mock'
  | 'cloud_run'
  | 'local_node'
  | 'disabled'

export interface ServerRuntimeConfig {
  mode: ServerRuntimeMode
  port: number
  apiBasePath: string
  mockOnly: boolean
  supabaseServiceRoleConfigured: boolean
  providerSecretsConfigured: boolean
  stripeConfigured: boolean
  googleCloudConfigured: boolean
}

const SERVER_RUNTIME_MODES: ServerRuntimeMode[] = ['mock', 'cloud_run', 'local_node', 'disabled']

export function getServerRuntimeConfig(env: NodeJS.ProcessEnv = process.env): ServerRuntimeConfig {
  const mode = parseServerRuntimeMode(env.SERVER_RUNTIME_MODE)
  const envStatus = getBackendEnvStatus(env)
  const port = parsePort(env.PORT)

  return {
    mode,
    port,
    apiBasePath: '/api',
    mockOnly: mode === 'mock' || mode === 'disabled',
    supabaseServiceRoleConfigured: envStatus.supabaseServiceRoleConfigured,
    providerSecretsConfigured: envStatus.providerSecretsConfigured,
    stripeConfigured: envStatus.stripeConfigured,
    googleCloudConfigured: envStatus.googleCloudConfigured,
  }
}

export function getServerRuntimeWarnings(env: NodeJS.ProcessEnv = process.env): string[] {
  const config = getServerRuntimeConfig(env)
  const envStatus = getBackendEnvStatus(env)
  const warnings = [
    ...envStatus.warnings,
  ]

  if (config.mode === 'mock') {
    warnings.push('Server runtime defaults to mock mode; no live provider, render, Stripe, Cloud Run, or Supabase service-role operation will run.')
  }

  if (config.mode === 'disabled') {
    warnings.push('Server runtime is disabled and should return readiness warnings only.')
  }

  if (config.mode === 'cloud_run') {
    warnings.push('Cloud Run mode is scaffolded only; deployment, IAM, Secret Manager, and real handlers are not configured by this task.')
  }

  return warnings
}

export function isServerRuntimeMockOnly(config: ServerRuntimeConfig = getServerRuntimeConfig()): boolean {
  return config.mockOnly
}

function parseServerRuntimeMode(value: string | undefined): ServerRuntimeMode {
  const mode = value?.trim()

  if (mode && SERVER_RUNTIME_MODES.includes(mode as ServerRuntimeMode)) {
    return mode as ServerRuntimeMode
  }

  return 'mock'
}

function parsePort(value: string | undefined): number {
  const parsed = Number(value)

  if (Number.isInteger(parsed) && parsed > 0 && parsed <= 65535) {
    return parsed
  }

  return 8080
}
