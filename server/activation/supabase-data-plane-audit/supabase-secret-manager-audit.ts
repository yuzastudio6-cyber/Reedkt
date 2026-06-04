import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { supabaseDataPlaneAuditConfig } from './supabase-data-plane-audit-policy'
import type { SupabaseSecretManagerAudit, SupabaseSecretManagerSecretAudit } from './supabase-data-plane-audit-types'

const execFileAsync = promisify(execFile)

const SUPABASE_SECRET_NAMES = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] as const
const APPROVED_SECRET_ACCESS_MEMBERS = [
  'serviceAccount:reeditpro-stg-api-sa@reeditpro.iam.gserviceaccount.com',
  'serviceAccount:reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com',
]

interface SupabaseAuditCredentialResolution {
  configured: boolean
  source: 'backend_env' | 'google_secret_manager' | 'missing'
  supabaseUrl?: string
  serviceRoleKey?: string
  secretValuePrinted: false
  secretValueStored: false
  blockers: string[]
  warnings: string[]
}

export async function inspectSupabaseSecretManagerAudit(input: { attemptMissingIamGrant: boolean }): Promise<SupabaseSecretManagerAudit> {
  const secrets: SupabaseSecretManagerSecretAudit[] = []
  for (const secretName of SUPABASE_SECRET_NAMES) {
    secrets.push(await inspectSupabaseSecret(secretName, input))
  }
  const blockers = secrets.flatMap((secret) => secret.blockers)
  const warnings = secrets.flatMap((secret) => secret.warnings)
  const iamChanges = secrets.flatMap((secret) => secret.iamChanges)
  const credentialPairReady = secrets.every((secret) => secret.exists && secret.enabledVersionPresent)
  const publicAccessDetected = secrets.some((secret) => secret.publicAccessDetected)
  const broadAccessDetected = secrets.some((secret) => secret.broadAccessDetected)
  return {
    status: blockers.length === 0 ? 'completed' : 'blocked',
    projectId: supabaseDataPlaneAuditConfig.projectId,
    secrets,
    credentialPairReady,
    publicAccessDetected,
    broadAccessDetected,
    secretValuesPrinted: false,
    secretValuesStored: false,
    iamChanges,
    blockers,
    warnings,
  }
}

export function buildPlannedSupabaseSecretManagerAudit(): SupabaseSecretManagerAudit {
  return {
    status: 'not_attempted',
    projectId: supabaseDataPlaneAuditConfig.projectId,
    secrets: SUPABASE_SECRET_NAMES.map((secretName) => ({
      secretName,
      projectId: supabaseDataPlaneAuditConfig.projectId,
      exists: false,
      enabledVersionPresent: false,
      approvedServiceAccountsHaveAccess: false,
      approvedServiceAccounts: APPROVED_SECRET_ACCESS_MEMBERS,
      missingServiceAccounts: APPROVED_SECRET_ACCESS_MEMBERS,
      publicAccessDetected: false,
      broadAccessDetected: false,
      valueAccessedForAudit: false,
      secretValuePrinted: false,
      secretValueStored: false,
      iamChanges: [],
      blockers: ['Secret Manager metadata is not inspected in static report mode.'],
      warnings: [],
    })),
    credentialPairReady: false,
    publicAccessDetected: false,
    broadAccessDetected: false,
    secretValuesPrinted: false,
    secretValuesStored: false,
    iamChanges: [],
    blockers: ['Secret Manager metadata is not inspected in static report mode.'],
    warnings: [],
  }
}

export async function resolveSupabaseAuditCredentials(): Promise<SupabaseAuditCredentialResolution> {
  const envUrl = process.env.SUPABASE_URL?.trim()
  const envServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (envUrl && envServiceRole) {
    return {
      configured: true,
      source: 'backend_env',
      supabaseUrl: envUrl,
      serviceRoleKey: envServiceRole,
      secretValuePrinted: false,
      secretValueStored: false,
      blockers: [],
      warnings: ['Supabase audit credentials resolved from backend-only process environment.'],
    }
  }

  try {
    const [supabaseUrl, serviceRoleKey] = await Promise.all([
      accessSecretValue('SUPABASE_URL'),
      accessSecretValue('SUPABASE_SERVICE_ROLE_KEY'),
    ])
    if (!supabaseUrl || !serviceRoleKey) {
      return missingCredentials('Google Secret Manager returned an empty Supabase audit credential value.')
    }
    return {
      configured: true,
      source: 'google_secret_manager',
      supabaseUrl,
      serviceRoleKey,
      secretValuePrinted: false,
      secretValueStored: false,
      blockers: [],
      warnings: ['Supabase audit credentials resolved from Google Secret Manager without printing or storing values.'],
    }
  } catch (error) {
    return missingCredentials(`Unable to access Supabase audit credentials from Google Secret Manager: ${sanitizeGcloudError(errorMessage(error))}`)
  }
}

async function inspectSupabaseSecret(
  secretName: (typeof SUPABASE_SECRET_NAMES)[number],
  input: { attemptMissingIamGrant: boolean },
): Promise<SupabaseSecretManagerSecretAudit> {
  const blockers: string[] = []
  const warnings: string[] = []
  const iamChanges: string[] = []
  let exists = false
  let enabledVersionPresent = false
  let missingServiceAccounts: string[] = []
  let publicAccessDetected = false
  let broadAccessDetected = false

  try {
    await runGcloud(['secrets', 'describe', secretName, `--project=${supabaseDataPlaneAuditConfig.projectId}`, '--format=json'])
    exists = true
  } catch (error) {
    blockers.push(`Secret Manager metadata describe failed for ${secretName}: ${sanitizeGcloudError(errorMessage(error))}`)
  }

  try {
    const versions = await runGcloud(['secrets', 'versions', 'list', secretName, `--project=${supabaseDataPlaneAuditConfig.projectId}`, '--format=json'])
    const parsed = JSON.parse(versions) as Array<{ state?: string }>
    enabledVersionPresent = parsed.some((version) => version.state === 'ENABLED')
    if (!enabledVersionPresent) blockers.push(`No enabled ${secretName} secret version is visible.`)
  } catch (error) {
    blockers.push(`Secret Manager versions list failed for ${secretName}: ${sanitizeGcloudError(errorMessage(error))}`)
  }

  try {
    const policy = await runGcloud(['secrets', 'get-iam-policy', secretName, `--project=${supabaseDataPlaneAuditConfig.projectId}`, '--format=json'])
    const parsed = JSON.parse(policy) as { bindings?: Array<{ role?: string; members?: string[] }> }
    const accessMembers = new Set(
      (parsed.bindings ?? [])
        .filter((binding) => binding.role === 'roles/secretmanager.secretAccessor')
        .flatMap((binding) => binding.members ?? []),
    )
    publicAccessDetected = accessMembers.has('allUsers') || accessMembers.has('allAuthenticatedUsers')
    broadAccessDetected = Array.from(accessMembers).some((member) => member.startsWith('domain:') || member.startsWith('group:'))
    missingServiceAccounts = APPROVED_SECRET_ACCESS_MEMBERS.filter((member) => !accessMembers.has(member))
    if (publicAccessDetected) blockers.push(`${secretName} Secret Manager IAM contains public access principal.`)
    if (broadAccessDetected) blockers.push(`${secretName} Secret Manager IAM contains broad group/domain access.`)
    if (missingServiceAccounts.length && input.attemptMissingIamGrant) {
      for (const member of missingServiceAccounts) {
        try {
          await runGcloud([
            'secrets',
            'add-iam-policy-binding',
            secretName,
            `--project=${supabaseDataPlaneAuditConfig.projectId}`,
            `--member=${member}`,
            '--role=roles/secretmanager.secretAccessor',
          ])
          iamChanges.push(`added roles/secretmanager.secretAccessor on ${secretName} to ${member}`)
        } catch (error) {
          blockers.push(`Unable to add secret accessor for ${secretName} to ${member}: ${sanitizeGcloudError(errorMessage(error))}`)
        }
      }
      if (iamChanges.length === missingServiceAccounts.length) missingServiceAccounts = []
    }
    if (missingServiceAccounts.length) blockers.push(`Approved service accounts missing ${secretName} secret accessor: ${missingServiceAccounts.join(', ')}`)
  } catch (error) {
    blockers.push(`Secret Manager IAM policy inspection failed for ${secretName}: ${sanitizeGcloudError(errorMessage(error))}`)
  }

  if (exists) warnings.push(`${secretName} Secret Manager metadata was inspected without reading the value.`)
  return {
    secretName,
    projectId: supabaseDataPlaneAuditConfig.projectId,
    exists,
    enabledVersionPresent,
    approvedServiceAccountsHaveAccess: missingServiceAccounts.length === 0,
    approvedServiceAccounts: APPROVED_SECRET_ACCESS_MEMBERS,
    missingServiceAccounts,
    publicAccessDetected,
    broadAccessDetected,
    valueAccessedForAudit: false,
    secretValuePrinted: false,
    secretValueStored: false,
    iamChanges,
    blockers,
    warnings,
  }
}

async function accessSecretValue(secretName: (typeof SUPABASE_SECRET_NAMES)[number]): Promise<string> {
  const stdout = await runGcloud([
    'secrets',
    'versions',
    'access',
    'latest',
    `--secret=${secretName}`,
    `--project=${supabaseDataPlaneAuditConfig.projectId}`,
  ])
  return stdout.trim()
}

async function runGcloud(args: string[]): Promise<string> {
  const result = await execFileAsync('gcloud', args, { maxBuffer: 20 * 1024 * 1024 })
  return result.stdout ?? ''
}

function missingCredentials(reason: string): SupabaseAuditCredentialResolution {
  return {
    configured: false,
    source: 'missing',
    secretValuePrinted: false,
    secretValueStored: false,
    blockers: [reason],
    warnings: [],
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function sanitizeGcloudError(message: string): string {
  if (message.includes('Reauthentication failed') || message.includes('cannot prompt during non-interactive execution')) {
    return 'gcloud reauthentication failed during non-interactive execution; run gcloud auth login or select an already authenticated account.'
  }
  return message
    .replace(/\/var\/folders\/[^\s]+/g, '<local-temp-file>')
    .replace(/https?:\/\/[^\s)]+/g, '<redacted-url>')
    .replace(/eyJ[a-zA-Z0-9._-]+/g, '<redacted-token>')
    .slice(0, 500)
}
