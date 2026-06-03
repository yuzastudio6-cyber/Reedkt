import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { braveLiveApiConfig } from './brave-live-api-policy'
import type { BraveLiveSecretMetadata, BraveLiveSecretResolution } from './brave-live-api-types'

const execFileAsync = promisify(execFile)
const approvedSecretAccessMembers = [
  'serviceAccount:reeditpro-stg-api-sa@reeditpro.iam.gserviceaccount.com',
  'serviceAccount:reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com',
]

export async function resolveBraveLiveSecret(): Promise<BraveLiveSecretResolution> {
  const envValue = process.env.BRAVE_SEARCH_API_KEY
  if (envValue?.trim()) {
    return {
      configured: true,
      source: 'backend_env',
      secretValue: envValue,
      secretName: braveLiveApiConfig.secretName,
      secretVersion: 'latest',
      secretValuePrinted: false,
      secretValueStored: false,
      frontendExposure: false,
      blockers: [],
      warnings: ['Brave Search secret resolved from backend-only process environment.'],
    }
  }

  try {
    const { stdout } = await execFileAsync('gcloud', [
      'secrets',
      'versions',
      'access',
      'latest',
      `--secret=${braveLiveApiConfig.secretName}`,
      `--project=${braveLiveApiConfig.projectId}`,
    ], { maxBuffer: 1024 * 1024 })
    const value = stdout.trim()
    if (!value) {
      return missingSecret('Google Secret Manager returned an empty Brave Search secret value.')
    }
    return {
      configured: true,
      source: 'google_secret_manager',
      secretValue: value,
      secretName: braveLiveApiConfig.secretName,
      secretVersion: 'latest',
      secretValuePrinted: false,
      secretValueStored: false,
      frontendExposure: false,
      blockers: [],
      warnings: ['Brave Search secret resolved from Google Secret Manager without printing the value.'],
    }
  } catch (error) {
    return missingSecret(`Unable to access Google Secret Manager secret BRAVE_SEARCH_API_KEY: ${errorMessage(error)}`)
  }
}

export function redactBraveLiveSecretResolution(secret: BraveLiveSecretResolution): Omit<BraveLiveSecretResolution, 'secretValue'> {
  return {
    configured: secret.configured,
    source: secret.source,
    secretName: secret.secretName,
    secretVersion: secret.secretVersion,
    secretValuePrinted: secret.secretValuePrinted,
    secretValueStored: secret.secretValueStored,
    frontendExposure: secret.frontendExposure,
    blockers: secret.blockers,
    warnings: secret.warnings,
  }
}

export async function inspectBraveLiveSecretMetadata(input: { attemptMissingIamGrant: boolean }): Promise<BraveLiveSecretMetadata> {
  const blockers: string[] = []
  const warnings: string[] = []
  const iamChanges: string[] = []
  let secretConfigured = false
  let versionEnabled = false
  let missingServiceAccounts: string[] = []
  let publicAccessDetected = false
  let broadAccessDetected = false

  try {
    await runGcloud(['secrets', 'describe', braveLiveApiConfig.secretName, `--project=${braveLiveApiConfig.projectId}`, '--format=json'])
    secretConfigured = true
  } catch (error) {
    blockers.push(`Secret Manager metadata describe failed: ${errorMessage(error)}`)
  }

  try {
    const versions = await runGcloud(['secrets', 'versions', 'list', braveLiveApiConfig.secretName, `--project=${braveLiveApiConfig.projectId}`, '--format=json'])
    const parsed = JSON.parse(versions) as Array<{ name?: string; state?: string }>
    versionEnabled = parsed.some((version) => version.state === 'ENABLED')
    if (!versionEnabled) blockers.push('No enabled BRAVE_SEARCH_API_KEY secret version is visible.')
  } catch (error) {
    blockers.push(`Secret Manager versions list failed: ${errorMessage(error)}`)
  }

  try {
    const policy = await runGcloud(['secrets', 'get-iam-policy', braveLiveApiConfig.secretName, `--project=${braveLiveApiConfig.projectId}`, '--format=json'])
    const parsed = JSON.parse(policy) as { bindings?: Array<{ role?: string; members?: string[] }> }
    const accessMembers = new Set(
      (parsed.bindings ?? [])
        .filter((binding) => binding.role === 'roles/secretmanager.secretAccessor')
        .flatMap((binding) => binding.members ?? []),
    )
    publicAccessDetected = accessMembers.has('allUsers') || accessMembers.has('allAuthenticatedUsers')
    broadAccessDetected = Array.from(accessMembers).some((member) => member.startsWith('domain:') || member.startsWith('group:'))
    missingServiceAccounts = approvedSecretAccessMembers.filter((member) => !accessMembers.has(member))
    if (publicAccessDetected) blockers.push('Secret Manager IAM contains public access principal.')
    if (broadAccessDetected) blockers.push('Secret Manager IAM contains broad group/domain access; Phase 49L requires narrow approved service-account access.')
    if (missingServiceAccounts.length && input.attemptMissingIamGrant) {
      for (const member of missingServiceAccounts) {
        try {
          await runGcloud([
            'secrets',
            'add-iam-policy-binding',
            braveLiveApiConfig.secretName,
            `--project=${braveLiveApiConfig.projectId}`,
            `--member=${member}`,
            '--role=roles/secretmanager.secretAccessor',
          ])
          iamChanges.push(`added roles/secretmanager.secretAccessor on BRAVE_SEARCH_API_KEY to ${member}`)
        } catch (error) {
          blockers.push(`Unable to add secret accessor for ${member}: ${errorMessage(error)}`)
        }
      }
      if (iamChanges.length === missingServiceAccounts.length) missingServiceAccounts = []
    }
    if (missingServiceAccounts.length) blockers.push(`Approved service accounts missing secret accessor: ${missingServiceAccounts.join(', ')}`)
  } catch (error) {
    blockers.push(`Secret Manager IAM policy inspection failed: ${errorMessage(error)}`)
  }

  if (secretConfigured) warnings.push('Secret Manager metadata was inspected without printing the secret value.')
  return {
    secretConfigured,
    secretName: braveLiveApiConfig.secretName,
    projectId: braveLiveApiConfig.projectId,
    secretVersion: 'latest',
    versionEnabled,
    approvedServiceAccountsHaveAccess: missingServiceAccounts.length === 0,
    approvedServiceAccounts: approvedSecretAccessMembers,
    missingServiceAccounts,
    publicAccessDetected,
    broadAccessDetected,
    iamChanges,
    blockers,
    warnings,
  }
}

async function runGcloud(args: string[]): Promise<string> {
  const result = await execFileAsync('gcloud', args, { maxBuffer: 20 * 1024 * 1024 })
  return result.stdout ?? ''
}

function missingSecret(reason: string): BraveLiveSecretResolution {
  return {
    configured: false,
    source: 'missing',
    secretName: braveLiveApiConfig.secretName,
    secretVersion: 'latest',
    secretValuePrinted: false,
    secretValueStored: false,
    frontendExposure: false,
    blockers: [reason],
    warnings: [],
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
