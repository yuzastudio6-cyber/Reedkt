import { normalizeDesktopCapabilityProfile } from './normalizeDesktopCapabilityProfile'
import type { DesktopCapabilityProfile, RawDesktopCapabilitySignals } from './desktopCapabilityProfileTypes'

type CoarseProcessLike = {
  platform?: string
  arch?: string
  type?: string
  sandboxed?: boolean
  versions?: {
    node?: string
    electron?: string
  }
  cpuUsage?: unknown
}

export function collectDesktopCapabilityProfile(rawSignals: RawDesktopCapabilitySignals = {}): DesktopCapabilityProfile {
  const processLike = (globalThis as { process?: CoarseProcessLike }).process
  const nodeVersionMajor = majorVersion(processLike?.versions?.node)
  const electronVersionMajor = majorVersion(processLike?.versions?.electron)
  const runtimeKind = rawSignals.runtimeKind ?? inferRuntimeKind(processLike)

  return normalizeDesktopCapabilityProfile({
    runtimeKind,
    osPlatform: rawSignals.osPlatform ?? processLike?.platform,
    osArch: rawSignals.osArch ?? processLike?.arch,
    packagedAppStatus: rawSignals.packagedAppStatus ?? 'unknown',
    sandboxedRenderer: rawSignals.sandboxedRenderer ?? (typeof processLike?.sandboxed === 'boolean' ? processLike.sandboxed : 'unknown'),
    contextIsolation: rawSignals.contextIsolation ?? 'unknown',
    processCpuUsageAvailable: rawSignals.processCpuUsageAvailable ?? (typeof processLike?.cpuUsage === 'function'),
    nodeVersionMajor: rawSignals.nodeVersionMajor ?? nodeVersionMajor,
    electronVersionMajor: rawSignals.electronVersionMajor ?? electronVersionMajor,
    ...rawSignals,
  })
}

function inferRuntimeKind(processLike: CoarseProcessLike | undefined): RawDesktopCapabilitySignals['runtimeKind'] {
  if (!processLike) return 'unknown'
  if (processLike.versions?.electron && processLike.type === 'browser') return 'electron_main'
  if (processLike.versions?.electron && processLike.type === 'renderer') return 'electron_renderer'
  if (processLike.versions?.node) return 'node_only'
  return 'unknown'
}

function majorVersion(value: string | undefined): number | undefined {
  const major = Number.parseInt(value?.split('.')[0] ?? '', 10)
  return Number.isFinite(major) ? major : undefined
}
