import { execFile as execFileCallback } from 'node:child_process'
import { promisify } from 'node:util'
import { searchProviderReadinessConfig } from './search-provider-readiness-policy'
import type { SearchProviderSecretAudit } from './search-provider-readiness-types'

const execFile = promisify(execFileCallback)

const approvedServiceAccounts = [
  'serviceAccount:reeditpro-stg-api-sa@reeditpro.iam.gserviceaccount.com',
  'serviceAccount:reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com',
]

export async function auditBraveSearchSecretMetadata(): Promise<SearchProviderSecretAudit> {
  const describe = await safeGcloud(['secrets', 'describe', searchProviderReadinessConfig.braveSecretName, '--project', searchProviderReadinessConfig.projectId, '--format=json'])
  const versions = await safeGcloud(['secrets', 'versions', 'list', searchProviderReadinessConfig.braveSecretName, '--project', searchProviderReadinessConfig.projectId, '--format=json'])
  const policy = await safeGcloud(['secrets', 'get-iam-policy', searchProviderReadinessConfig.braveSecretName, '--project', searchProviderReadinessConfig.projectId, '--format=json'])

  const blockers: string[] = []
  const warnings: string[] = ['Phase 49N inspected Secret Manager metadata only; it did not access any secret version value.']
  if (!describe.ok) blockers.push(`Secret metadata describe failed: ${describe.error}`)
  if (!versions.ok) blockers.push(`Secret versions metadata check failed: ${versions.error}`)
  if (!policy.ok) blockers.push(`Secret IAM policy metadata check failed: ${policy.error}`)

  const enabledVersionPresent = versions.ok ? hasEnabledVersion(versions.stdout) : false
  const members = policy.ok ? secretAccessorMembers(policy.stdout) : []
  const missingApprovedServiceAccounts = approvedServiceAccounts.filter((member) => !members.includes(member))
  const allUsersPresent = members.includes('allUsers')
  const allAuthenticatedUsersPresent = members.includes('allAuthenticatedUsers')
  const broadAccessDetected = allUsersPresent || allAuthenticatedUsersPresent

  if (describe.ok && !enabledVersionPresent) blockers.push('BRAVE_SEARCH_API_KEY has no enabled secret version.')
  if (missingApprovedServiceAccounts.length) blockers.push(`Approved service accounts missing secret accessor binding: ${missingApprovedServiceAccounts.join(', ')}.`)
  if (allUsersPresent) blockers.push('BRAVE_SEARCH_API_KEY grants secret accessor to allUsers.')
  if (allAuthenticatedUsersPresent) blockers.push('BRAVE_SEARCH_API_KEY grants secret accessor to allAuthenticatedUsers.')

  return {
    secretName: 'BRAVE_SEARCH_API_KEY',
    projectId: 'reeditpro',
    checkedWithoutAccessingValue: true,
    secretExists: describe.ok,
    enabledVersionPresent,
    approvedServiceAccounts,
    approvedServiceAccountsHaveAccess: missingApprovedServiceAccounts.length === 0 && policy.ok,
    missingApprovedServiceAccounts,
    allUsersPresent,
    allAuthenticatedUsersPresent,
    broadAccessDetected,
    secretValueAccessed: false,
    secretValuePrinted: false,
    blockers,
    warnings,
  }
}

function hasEnabledVersion(stdout: string): boolean {
  try {
    const versions = JSON.parse(stdout) as Array<{ state?: string }>
    return versions.some((version) => version.state === 'ENABLED')
  } catch {
    return stdout.includes('"state": "ENABLED"')
  }
}

function secretAccessorMembers(stdout: string): string[] {
  try {
    const policy = JSON.parse(stdout) as { bindings?: Array<{ role?: string; members?: string[] }> }
    return (policy.bindings ?? [])
      .filter((binding) => binding.role === 'roles/secretmanager.secretAccessor')
      .flatMap((binding) => binding.members ?? [])
  } catch {
    return []
  }
}

async function safeGcloud(args: string[]): Promise<{ ok: true; stdout: string; stderr: string } | { ok: false; stdout: string; stderr: string; error: string }> {
  try {
    const { stdout, stderr } = await execFile('gcloud', args, { maxBuffer: 20 * 1024 * 1024 })
    return { ok: true, stdout, stderr }
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; message?: string }
    return { ok: false, stdout: err.stdout ?? '', stderr: err.stderr ?? '', error: err.stderr || err.message || String(error) }
  }
}
