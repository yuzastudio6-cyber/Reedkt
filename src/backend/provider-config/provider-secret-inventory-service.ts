import type {
  ProviderSecretInventoryItem,
  ProviderSecretInventoryReport,
  ProviderSecretInventoryStatus,
  ProviderSecretName,
  ReeditProProviderId,
} from '../../types'
import { listProviderSecretDefinitions } from './provider-secret-registry'

export interface GCloudSecretInventoryGateInput {
  inspectGate?: boolean
  confirmedProject?: string
  projectId?: string
  gcloudAvailable?: boolean
}

export interface ManualSecretInventoryMetadataInput {
  projectId?: string
  projectVerified?: boolean
  secrets: Array<{
    name: string
    labels?: Record<string, string>
    createdAt?: string
    updatedAt?: string
  }>
}

function nowIso() {
  return new Date().toISOString()
}

function expectedSecretNames(): ProviderSecretName[] {
  return listProviderSecretDefinitions().map((definition) => definition.name)
}

function providerForSecret(name: string): ReeditProProviderId | undefined {
  return listProviderSecretDefinitions().find((definition) => definition.name === name)?.providerId
}

function emptyReport(
  status: ProviderSecretInventoryStatus,
  warnings: string[],
  projectId?: string,
): ProviderSecretInventoryReport {
  return {
    status,
    projectId,
    projectVerified: false,
    inspectedAt: nowIso(),
    expectedSecrets: expectedSecretNames(),
    foundSecrets: [],
    missingSecrets: expectedSecretNames(),
    warnings,
    secretValuesPrinted: false,
  }
}

export function createExpectedProviderSecretInventory(): ProviderSecretInventoryItem[] {
  return expectedSecretNames().map((name) => ({
    name,
    providerId: providerForSecret(name),
    exists: false,
    metadataOnly: true,
    notes: ['Expected secret name only; no value is known or inspected.'],
  }))
}

export function createBlockedProviderSecretInventoryReport(
  input: GCloudSecretInventoryGateInput = {},
): ProviderSecretInventoryReport {
  if (!input.inspectGate) {
    return emptyReport('blocked_missing_gate', [
      'INSPECT_REEDITPRO_GCLOUD_SECRETS is not true.',
      'No Google Cloud Secret Manager command was run.',
      'No secret metadata or values were inspected.',
    ], input.projectId)
  }

  if (input.confirmedProject !== 'reeditpro') {
    return emptyReport('blocked_wrong_project', [
      'CONFIRM_REEDITPRO_GCLOUD_PROJECT is not reeditpro.',
      'Secret inventory stops before project inspection.',
    ], input.projectId)
  }

  if (input.gcloudAvailable === false) {
    return emptyReport('gcloud_unavailable', [
      'gcloud is unavailable in this environment.',
      'No secret metadata or values were inspected.',
    ], input.projectId)
  }

  return emptyReport('project_unverified', [
    'Project identity was not verified by RP-MODEL-02.',
    'No secret metadata or values were inspected.',
  ], input.projectId)
}

export function normalizeGCloudSecretInventoryMetadata(
  input: ManualSecretInventoryMetadataInput,
): ProviderSecretInventoryItem[] {
  return input.secrets.map((secret) => ({
    name: secret.name,
    providerId: providerForSecret(secret.name),
    exists: true,
    metadataOnly: true,
    labels: secret.labels,
    createdAt: secret.createdAt,
    updatedAt: secret.updatedAt,
    notes: ['Metadata-only inventory item. Secret versions/payloads are not included.'],
  }))
}

export function compareExpectedSecretsToInventory(
  foundSecrets: ProviderSecretInventoryItem[],
): Pick<ProviderSecretInventoryReport, 'foundSecrets' | 'missingSecrets'> {
  const foundNames = new Set(foundSecrets.map((item) => item.name))
  return {
    foundSecrets,
    missingSecrets: expectedSecretNames().filter((name) => !foundNames.has(name)),
  }
}

export function createManualProviderSecretInventoryReport(
  input: ManualSecretInventoryMetadataInput,
): ProviderSecretInventoryReport {
  const foundSecrets = normalizeGCloudSecretInventoryMetadata(input)
  const comparison = compareExpectedSecretsToInventory(foundSecrets)
  return {
    status: input.projectVerified ? 'metadata_listed' : 'project_unverified',
    projectId: input.projectId,
    projectVerified: Boolean(input.projectVerified),
    inspectedAt: nowIso(),
    expectedSecrets: expectedSecretNames(),
    foundSecrets: comparison.foundSecrets,
    missingSecrets: comparison.missingSecrets,
    warnings: [
      'Manual metadata-only inventory. Secret values and versions are not present.',
      ...(!input.projectVerified ? ['Project identity is not verified.'] : []),
    ],
    secretValuesPrinted: false,
  }
}

export function createProviderSecretInventorySummary(report: ProviderSecretInventoryReport): string {
  return [
    `Secret inventory status: ${report.status}.`,
    `Project verified: ${report.projectVerified}.`,
    `Found metadata for ${report.foundSecrets.length} expected/known secret name(s).`,
    `Missing ${report.missingSecrets.length} expected secret name(s).`,
    'Secret values printed: false.',
  ].join(' ')
}
