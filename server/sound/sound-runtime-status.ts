import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { ToolRuntimeStatus } from '../tool-registry'
import { SOUND_TOOL_CAPABILITY_MANIFESTS } from './sound-tool-capability-manifests'

const execFileAsync = promisify(execFile)

async function fixedBinaryStatus(input: {
  toolKey: 'ffmpeg' | 'ffprobe'
  toolVersion: string
  observedAt: string
}): Promise<ToolRuntimeStatus> {
  try {
    const result = await execFileAsync(input.toolKey, ['-version'], {
      timeout: 10_000,
      maxBuffer: 1024 * 1024,
    })
    const runtimeVersion = String(result.stdout).split(/\r?\n/)[0]?.trim() || 'unknown'
    return {
      toolKey: input.toolKey,
      toolVersion: input.toolVersion,
      observedAt: input.observedAt,
      availabilityStatus: 'available',
      runtimeVersion,
      credentialsConfigured: false,
      healthProbePassed: true,
      currentQueueDepth: 0,
      availableConcurrency: 1,
      providerQuotaAvailable: null,
      blockingReasons: [],
    }
  } catch {
    return {
      toolKey: input.toolKey,
      toolVersion: input.toolVersion,
      observedAt: input.observedAt,
      availabilityStatus: 'unavailable',
      credentialsConfigured: false,
      healthProbePassed: false,
      currentQueueDepth: 0,
      availableConcurrency: 0,
      providerQuotaAvailable: null,
      blockingReasons: ['fixed_binary_probe_failed'],
    }
  }
}

export async function probeCanonicalSoundRuntimeStatuses(input: {
  observedAt?: string
  mireloCredentialConfigured?: boolean
  mireloHealthProbePassed?: boolean
  mireloQuotaAvailable?: boolean
  mireloCanaryEvidenceRef?: string
  mireloRateCardSnapshotId?: string
} = {}): Promise<ToolRuntimeStatus[]> {
  const observedAt = input.observedAt ?? new Date().toISOString()
  const versions = new Map(SOUND_TOOL_CAPABILITY_MANIFESTS.map((manifest) => [manifest.toolKey, manifest.toolVersion]))
  const [ffmpeg, ffprobe] = await Promise.all([
    fixedBinaryStatus({ toolKey: 'ffmpeg', toolVersion: versions.get('ffmpeg')!, observedAt }),
    fixedBinaryStatus({ toolKey: 'ffprobe', toolVersion: versions.get('ffprobe')!, observedAt }),
  ])
  const mireloConfigured = input.mireloCredentialConfigured === true
  const mireloHealth = input.mireloHealthProbePassed === true
  const mireloCanary = Boolean(input.mireloCanaryEvidenceRef)
  const mirelo: ToolRuntimeStatus = {
    toolKey: 'mirelo_sfx',
    toolVersion: versions.get('mirelo_sfx')!,
    observedAt,
    availabilityStatus: !mireloConfigured
      ? 'not_configured'
      : mireloHealth && mireloCanary
        ? 'available'
        : 'blocked',
    credentialsConfigured: mireloConfigured,
    healthProbePassed: mireloHealth,
    currentQueueDepth: 0,
    availableConcurrency: mireloHealth && mireloCanary ? 1 : 0,
    providerQuotaAvailable: input.mireloQuotaAvailable ?? null,
    ...(input.mireloRateCardSnapshotId
      ? { currentRateCardSnapshotId: input.mireloRateCardSnapshotId }
      : {}),
    ...(input.mireloCanaryEvidenceRef
      ? { lastSuccessfulCanaryEvidenceRef: input.mireloCanaryEvidenceRef }
      : {}),
    blockingReasons: !mireloConfigured
      ? ['provider_credentials_not_configured']
      : !mireloCanary
        ? ['live_canary_evidence_missing']
        : !mireloHealth
          ? ['provider_health_probe_failed']
          : [],
  }
  const internalAvailable = new Set([
    'sound_private_artifact_store', 'sound_sync_service', 'sound_qa_service',
    'sound_no_sound_decision',
  ])
  const statuses = SOUND_TOOL_CAPABILITY_MANIFESTS
    .filter((manifest) => !['ffmpeg', 'ffprobe', 'mirelo_sfx'].includes(manifest.toolKey))
    .map<ToolRuntimeStatus>((manifest) => {
      const available = internalAvailable.has(manifest.toolKey)
      return {
        toolKey: manifest.toolKey,
        toolVersion: manifest.toolVersion,
        observedAt,
        availabilityStatus: available ? 'available' : 'unknown',
        credentialsConfigured: false,
        healthProbePassed: available,
        currentQueueDepth: 0,
        availableConcurrency: available ? 1 : 0,
        providerQuotaAvailable: null,
        blockingReasons: available ? [] : ['runtime_probe_not_run'],
      }
    })
  return [ffmpeg, ffprobe, mirelo, ...statuses]
}

export function mireloCredentialConfiguredFromEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): boolean {
  return typeof environment.MIRELO_API_KEY === 'string' && environment.MIRELO_API_KEY.length > 0
}
