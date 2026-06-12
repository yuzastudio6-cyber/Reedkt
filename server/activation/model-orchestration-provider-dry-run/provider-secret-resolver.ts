import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { MODEL_PROVIDER_DRY_RUN_SECRET_REFS } from './model-provider-dry-run-policy'
import type { ProviderSecretResolution } from './model-provider-dry-run-types'

const execFileAsync = promisify(execFile)

function sanitizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message
    .replace(/projects\/[^/\s]+\/secrets\/[^/\s]+\/versions\/[^/\s]+/g, 'projects/[PROJECT]/secrets/[SECRET]/versions/[VERSION]')
    .replace(/secret=([^\s]+)/g, 'secret=[SECRET]')
    .slice(0, 220)
}

async function resolveSecretPayload(secretName: string, projectId: string): Promise<{ status: 'passed' | 'blocked', value?: string, blocker?: string }> {
  try {
    const { stdout } = await execFileAsync('gcloud', [
      'secrets',
      'versions',
      'access',
      'latest',
      `--secret=${secretName}`,
      `--project=${projectId}`,
    ], {
      maxBuffer: 1024 * 1024,
      timeout: 15000,
    })
    const value = stdout.trim()
    if (!value) return { status: 'blocked', blocker: `secret_payload_empty:${secretName}` }
    return { status: 'passed', value }
  } catch (error) {
    return { status: 'blocked', blocker: `secret_payload_access_failed:${secretName}:${sanitizeError(error)}` }
  }
}

export async function resolveProviderSecretsFromSecretManager(input: {
  execute: boolean
  projectId?: string
}): Promise<ProviderSecretResolution[]> {
  if (!input.execute) {
    return MODEL_PROVIDER_DRY_RUN_SECRET_REFS.map((ref) => ({
      providerId: ref.providerId,
      secretName: ref.secretName,
      status: 'skipped',
      payloadAvailable: false,
      payloadPrinted: false,
      payloadCommitted: false,
      blocker: 'report_only_secret_payload_not_accessed',
    }))
  }

  if (input.projectId !== 'reeditpro') {
    return MODEL_PROVIDER_DRY_RUN_SECRET_REFS.map((ref) => ({
      providerId: ref.providerId,
      secretName: ref.secretName,
      status: 'blocked',
      payloadAvailable: false,
      payloadPrinted: false,
      payloadCommitted: false,
      blocker: 'GCP_PROJECT_ID_must_be_reeditpro',
    }))
  }

  const resolutions: ProviderSecretResolution[] = []
  for (const ref of MODEL_PROVIDER_DRY_RUN_SECRET_REFS) {
    const resolved = await resolveSecretPayload(ref.secretName, input.projectId)
    resolutions.push({
      providerId: ref.providerId,
      secretName: ref.secretName,
      status: resolved.status,
      payloadAvailable: Boolean(resolved.value),
      payloadPrinted: false,
      payloadCommitted: false,
      blocker: resolved.blocker,
      value: resolved.value,
    })
  }
  return resolutions
}

export function buildSafeSecretResolutionReport(resolutions: ProviderSecretResolution[]) {
  return {
    phase: 'MODEL_DRYRUN_1',
    status: resolutions.every((item) => item.status === 'passed' || item.status === 'skipped') ? 'passed' : 'blocked',
    secretSource: 'google_secret_manager_only',
    payloadValuesPrinted: false,
    payloadValuesCommitted: false,
    secrets: resolutions.map((resolution) => ({
      providerId: resolution.providerId,
      secretName: resolution.secretName,
      status: resolution.status,
      payloadAvailable: resolution.payloadAvailable,
      payloadPrinted: resolution.payloadPrinted,
      payloadCommitted: resolution.payloadCommitted,
      blocker: resolution.blocker,
    })),
    blockers: resolutions.flatMap((item) => item.blocker ? [item.blocker] : []),
  }
}
