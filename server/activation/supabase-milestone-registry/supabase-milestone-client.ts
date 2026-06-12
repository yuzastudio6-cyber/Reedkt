import { execFile as execFileCallback } from 'node:child_process'
import { promisify } from 'node:util'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { supabaseMilestoneRegistryConfig, supabaseMilestoneRegistryTableNames } from './supabase-milestone-registry-policy'
import type { SupabaseRegistrySchemaVerification, SupabaseRegistryTableName } from './supabase-milestone-registry-types'

const execFile = promisify(execFileCallback)

export interface SupabaseMilestoneCredentialResolution {
  configured: boolean
  source: 'backend_env' | 'google_secret_manager' | 'missing'
  supabaseUrl?: string
  serviceRoleKey?: string
  secretValuePrinted: false
  secretValueStored: false
  blockers: string[]
  warnings: string[]
}

export interface SupabaseMilestoneDbUrlResolution {
  configured: boolean
  source: 'backend_env' | 'google_secret_manager' | 'unavailable'
  dbUrl?: string
  secretValuePrinted: false
  secretValueStored: false
  blockers: string[]
  warnings: string[]
}

export async function resolveSupabaseMilestoneCredentials(): Promise<SupabaseMilestoneCredentialResolution> {
  const envUrl = process.env.SUPABASE_URL?.trim()
  const envServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (envUrl && envServiceRole) {
    const normalized = normalizeSupabaseProjectUrl(envUrl)
    return {
      configured: true,
      source: 'backend_env',
      supabaseUrl: normalized.url,
      serviceRoleKey: envServiceRole,
      secretValuePrinted: false,
      secretValueStored: false,
      blockers: [],
      warnings: [
        'Supabase milestone credentials resolved from backend-only process env.',
        ...normalized.warnings,
      ],
    }
  }

  try {
    const [rawSupabaseUrl, serviceRoleKey] = await Promise.all([
      accessSecretValue('SUPABASE_URL'),
      accessSecretValue('SUPABASE_SERVICE_ROLE_KEY'),
    ])
    if (!rawSupabaseUrl || !serviceRoleKey) return missingCredentials('Secret Manager returned an empty SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY value.')
    const normalized = normalizeSupabaseProjectUrl(rawSupabaseUrl)
    return {
      configured: true,
      source: 'google_secret_manager',
      supabaseUrl: normalized.url,
      serviceRoleKey,
      secretValuePrinted: false,
      secretValueStored: false,
      blockers: [],
      warnings: [
        'Supabase milestone credentials resolved from Google Secret Manager without printing or storing values.',
        ...normalized.warnings,
      ],
    }
  } catch (error) {
    return missingCredentials(`Unable to resolve Supabase milestone credentials: ${sanitizeCommandError(errorMessage(error))}`)
  }
}

export async function resolveSupabaseMilestoneDbUrl(): Promise<SupabaseMilestoneDbUrlResolution> {
  const envDbUrl = process.env.SUPABASE_DB_URL?.trim() || process.env.DATABASE_URL?.trim()
  if (envDbUrl) {
    return {
      configured: true,
      source: 'backend_env',
      dbUrl: envDbUrl,
      secretValuePrinted: false,
      secretValueStored: false,
      blockers: [],
      warnings: ['Supabase DB URL resolved from backend-only process env for local psql migration apply.'],
    }
  }

  for (const secretName of ['SUPABASE_DB_URL', 'DATABASE_URL'] as const) {
    try {
      const dbUrl = await accessSecretValue(secretName)
      if (dbUrl) {
        return {
          configured: true,
          source: 'google_secret_manager',
          dbUrl,
          secretValuePrinted: false,
          secretValueStored: false,
          blockers: [],
          warnings: [`Supabase DB URL resolved from ${secretName} in Secret Manager without printing or storing the value.`],
        }
      }
    } catch {
      // Try the next approved secret name.
    }
  }

  return {
    configured: false,
    source: 'unavailable',
    secretValuePrinted: false,
    secretValueStored: false,
    blockers: ['No SUPABASE_DB_URL or DATABASE_URL value resolved from backend env or Secret Manager.'],
    warnings: ['Migration apply and schema creation will remain blocked unless a direct DB URL is supplied.'],
  }
}

export function createSupabaseMilestoneServiceClient(resolution: SupabaseMilestoneCredentialResolution): SupabaseClient {
  if (!resolution.supabaseUrl || !resolution.serviceRoleKey) throw new Error('Supabase milestone service client requires resolved backend-only Supabase URL and service role key.')
  return createClient(resolution.supabaseUrl, resolution.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function inspectSupabaseMilestoneRegistryTables(client?: SupabaseClient): Promise<SupabaseRegistrySchemaVerification> {
  if (!client) {
    return {
      status: 'not_attempted',
      tables: supabaseMilestoneRegistryTableNames.map((tableName) => ({
        tableName,
        exists: false,
        readCountStatus: 'not_attempted',
        count: null,
        blocker: 'Supabase service-role credentials were not resolved.',
      })),
      allTablesPresent: false,
      serviceRoleRestUsed: false,
      ddlUsedThroughRest: false,
      blockers: ['Supabase service-role credentials were not resolved.'],
      warnings: [],
    }
  }

  const tables = []
  for (const tableName of supabaseMilestoneRegistryTableNames) {
    const { count, error } = await client.from(tableName).select('id', { count: 'exact' }).limit(0)
    if (error) {
      tables.push({
        tableName,
        exists: false,
        readCountStatus: 'blocked' as const,
        count: null,
        blocker: sanitizeSupabaseError(error.message),
      })
    } else {
      tables.push({
        tableName,
        exists: true,
        readCountStatus: 'counted' as const,
        count: count ?? 0,
      })
    }
  }
  const blockers = tables.filter((table) => !table.exists).map((table) => `${table.tableName}: ${table.blocker ?? 'table missing or unreadable'}`)
  return {
    status: blockers.length === 0 ? 'completed' : 'blocked',
    tables: tables as SupabaseRegistrySchemaVerification['tables'],
    allTablesPresent: blockers.length === 0,
    serviceRoleRestUsed: true,
    ddlUsedThroughRest: false,
    blockers,
    warnings: blockers.length
      ? ['Schema verification is read-only and uses zero-row probes. Missing tables block registry writes until the migration is safely applied.']
      : ['Schema verification used zero-row probes and did not return row payloads.'],
  }
}

export async function applySupabaseMilestoneMigrationWithPsql(dbUrl: string, migrationFile: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await execFile('psql', ['-v', 'ON_ERROR_STOP=1', '-f', migrationFile], {
      env: buildPsqlEnv(dbUrl),
      maxBuffer: 8 * 1024 * 1024,
    })
    return { ok: true }
  } catch (error) {
    return { ok: false, error: sanitizeCommandError(errorMessage(error)) }
  }
}

export async function psqlAvailable(): Promise<boolean> {
  try {
    await execFile('psql', ['--version'], { maxBuffer: 1024 * 1024 })
    return true
  } catch {
    return false
  }
}

async function accessSecretValue(secretName: string): Promise<string> {
  const { stdout } = await execFile('gcloud', [
    'secrets',
    'versions',
    'access',
    'latest',
    `--secret=${secretName}`,
    `--project=${supabaseMilestoneRegistryConfig.projectId}`,
  ], { maxBuffer: 8 * 1024 * 1024 })
  return stdout.trim()
}

function missingCredentials(message: string): SupabaseMilestoneCredentialResolution {
  return {
    configured: false,
    source: 'missing',
    secretValuePrinted: false,
    secretValueStored: false,
    blockers: [message],
    warnings: ['Registry schema inspection and writes are blocked until backend-only Supabase credentials resolve.'],
  }
}

function sanitizeSupabaseError(message: string): string {
  return message
    .replace(/https?:\/\/[^\s)]+/g, '<redacted-url>')
    .replace(/(service_role|apikey|authorization|password|token)[^,\n]*/gi, '<redacted-secret-field>')
    .slice(0, 400)
}

function sanitizeCommandError(message: string): string {
  return message
    .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, '<redacted-db-url>')
    .replace(/https?:\/\/[^\s)]+/g, '<redacted-url>')
    .replace(/(service_role|apikey|authorization|token)[^,\n]*/gi, '<redacted-secret-field>')
    .replace(/password\s*=\s*[^\s,\n]+/gi, 'password=<redacted>')
    .replace(/password authentication failed for user "[^"]+"/gi, 'password authentication failed for user <redacted-db-user>')
    .slice(0, 700)
}

function errorMessage(error: unknown): string {
  const err = error as { message?: string; stderr?: string; stdout?: string }
  return err.stderr || err.message || String(error)
}

export function isSupabaseRegistryTableName(value: string): value is SupabaseRegistryTableName {
  return (supabaseMilestoneRegistryTableNames as readonly string[]).includes(value)
}

function normalizeSupabaseProjectUrl(rawUrl: string): { url: string; warnings: string[] } {
  try {
    const parsed = new URL(rawUrl)
    const normalized = `${parsed.protocol}//${parsed.host}`
    const warnings: string[] = []
    if (parsed.pathname !== '/' && parsed.pathname !== '') {
      warnings.push('Supabase URL contained a path and was normalized to the project origin before creating the server-only client.')
    }
    return { url: normalized, warnings }
  } catch {
    return { url: rawUrl, warnings: ['Supabase URL could not be parsed for path normalization; the raw backend-only value was passed to the client without printing it.'] }
  }
}

function buildPsqlEnv(dbUrl: string): NodeJS.ProcessEnv {
  const parsed = new URL(dbUrl)
  const env: NodeJS.ProcessEnv = { ...process.env }
  env.PGHOST = parsed.hostname
  if (parsed.port) env.PGPORT = parsed.port
  env.PGDATABASE = decodeURIComponent(parsed.pathname.replace(/^\//, '') || 'postgres')
  if (parsed.username) env.PGUSER = decodeURIComponent(parsed.username)
  if (parsed.password) env.PGPASSWORD = decodeURIComponent(parsed.password)
  const sslMode = parsed.searchParams.get('sslmode')
  env.PGSSLMODE = sslMode || 'require'
  env.PGCONNECT_TIMEOUT = '15'
  delete env.SUPABASE_DB_URL
  delete env.DATABASE_URL
  return env
}
