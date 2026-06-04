import {
  DESKTOP_CAPABILITY_PROFILE_SCHEMA_VERSION,
  DESKTOP_CAPABILITY_ROUTE_MANIFEST_VERSION,
  bucketDesktopArch,
  bucketDesktopFreeDisk,
  bucketDesktopFreeMemory,
  bucketDesktopParallelism,
  bucketDesktopPlatform,
  bucketDesktopTotalMemory,
  inferCpuModelClass,
  nodeVersionBucket,
} from './desktopCapabilityBuckets'
import type { DesktopCapabilityProfile, RawDesktopCapabilitySignals } from './desktopCapabilityProfileTypes'

const SOURCE_POLICY_REFS = [
  'phase_44e_desktop_capability_privacy_policy',
  'phase_44e_desktop_capability_bucket_policy',
  'phase_44i_track_b_tool_route_manifest',
]

export function normalizeDesktopCapabilityProfile(
  raw: RawDesktopCapabilitySignals,
  options: { collectionMode?: DesktopCapabilityProfile['collectionMode']; generatedAt?: string } = {},
): DesktopCapabilityProfile {
  const osPlatformBucket = bucketDesktopPlatform(raw.osPlatform)
  const osArchBucket = raw.cpuArchitecture ?? bucketDesktopArch(raw.osArch)
  const availableParallelismBucket = bucketDesktopParallelism(raw.availableParallelism)
  const totalMemoryBucket = bucketDesktopTotalMemory(raw.totalMemoryBytes)
  const freeMemoryBucket = bucketDesktopFreeMemory(raw.freeMemoryBytes)
  const estimatedFreeDiskBucket = bucketDesktopFreeDisk(raw.estimatedFreeDiskBytes)
  const runtimeKind = raw.runtimeKind ?? 'unknown'
  const ffmpegAvailable = raw.ffmpegAvailable ?? 'unknown'
  const ffprobeAvailable = raw.ffprobeAvailable ?? 'unknown'
  const tempDirWritable = raw.tempDirWritable ?? 'unknown'
  const cpuModelClass = inferCpuModelClass({
    platformBucket: osPlatformBucket,
    archBucket: osArchBucket,
    explicit: raw.cpuModelClass,
  })

  const blockedReasons = buildBlockedReasons({
    runtimeKind,
    osPlatformBucket,
    osArchBucket,
    availableParallelismBucket,
    totalMemoryBucket,
    tempDirWritable,
  })
  const warnings = buildWarnings({
    runtimeKind,
    availableParallelismBucket,
    totalMemoryBucket,
    freeMemoryBucket,
    estimatedFreeDiskBucket,
    ffmpegAvailable,
    ffprobeAvailable,
    sandboxedRenderer: raw.sandboxedRenderer ?? 'unknown',
    contextIsolation: raw.contextIsolation ?? 'unknown',
  })
  const routePlanningHints = buildRouteHints({
    runtimeKind,
    availableParallelismBucket,
    totalMemoryBucket,
    ffmpegAvailable,
    ffprobeAvailable,
    sandboxedRenderer: raw.sandboxedRenderer ?? 'unknown',
    blockedReasons,
  })

  return {
    schemaVersion: DESKTOP_CAPABILITY_PROFILE_SCHEMA_VERSION,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    collectionMode: options.collectionMode ?? 'local_profile_session_only',
    privacyMode: ['coarse', 'redacted', 'no_persistence', 'no_identifiers'],
    capabilityBuckets: {
      environment: {
        runtimeKind,
        osPlatformBucket,
        osArchBucket,
        packagedAppStatus: raw.packagedAppStatus ?? 'unknown',
        sandboxedRenderer: raw.sandboxedRenderer ?? 'unknown',
        contextIsolation: raw.contextIsolation ?? 'unknown',
      },
      compute: {
        availableParallelismBucket,
        totalMemoryBucket,
        freeMemoryBucket,
        cpuArchitecture: osArchBucket,
        cpuModelClass,
        processCpuUsageAvailable: raw.processCpuUsageAvailable ?? 'unknown',
      },
      graphics: {
        gpuInfoAvailable: raw.gpuInfoAvailable ?? false,
        gpuClass: raw.gpuClass ?? 'unavailable',
        webgpuDesktopAvailable: raw.webgpuDesktopAvailable ?? 'unknown',
        exactGpuIdentityPersisted: false,
      },
      mediaRuntime: {
        ffmpegAvailable,
        ffprobeAvailable,
        sharpAvailable: raw.sharpAvailable ?? 'unknown',
        pythonAvailable: raw.pythonAvailable ?? 'unknown',
        nodeVersionBucket: nodeVersionBucket(raw.nodeVersionMajor),
        electronVersionBucket: nodeVersionBucket(raw.electronVersionMajor),
        desktopRuntimeVersionRedacted: true,
      },
      storage: {
        tempDirWritable,
        estimatedFreeDiskBucket,
        directoryScanning: false,
        pathListCollection: false,
      },
      policy: {
        privacyRiskLevel: warnings.length > 2 ? 'medium' : 'low',
        fingerprintingRiskLevel: 'low',
        allowedForRoutePlanning: blockedReasons.length === 0,
        allowedForWorkerExecution: false,
        allowedForCostEstimator: false,
        routeManifestVersion: DESKTOP_CAPABILITY_ROUTE_MANIFEST_VERSION,
        profileSchemaVersion: DESKTOP_CAPABILITY_PROFILE_SCHEMA_VERSION,
        liveProfileUploadAllowed: false,
      },
    },
    routePlanningHints,
    blockedReasons,
    warnings,
    sourcePolicyRefs: SOURCE_POLICY_REFS,
  }
}

function buildBlockedReasons(input: {
  runtimeKind: string
  osPlatformBucket: string
  osArchBucket: string
  availableParallelismBucket: string
  totalMemoryBucket: string
  tempDirWritable: boolean | 'unknown'
}): string[] {
  const blockers: string[] = []
  if (input.runtimeKind === 'unknown') blockers.push('unknown_desktop_runtime')
  if (input.osPlatformBucket === 'unknown') blockers.push('unknown_os_platform')
  if (input.osArchBucket === 'unknown') blockers.push('unknown_os_architecture')
  if (input.availableParallelismBucket === 'unknown') blockers.push('unknown_parallelism')
  if (input.totalMemoryBucket === 'unknown') blockers.push('unknown_memory')
  if (input.tempDirWritable === false) blockers.push('temp_dir_not_writable')
  return blockers
}

function buildWarnings(input: {
  runtimeKind: string
  availableParallelismBucket: string
  totalMemoryBucket: string
  freeMemoryBucket: string
  estimatedFreeDiskBucket: string
  ffmpegAvailable: boolean | 'unknown'
  ffprobeAvailable: boolean | 'unknown'
  sandboxedRenderer: boolean | 'unknown'
  contextIsolation: boolean | 'unknown'
}): string[] {
  const warnings: string[] = []
  if (input.availableParallelismBucket === '1_2') warnings.push('low_parallelism_capacity')
  if (input.totalMemoryBucket === 'lt_4gb' || input.totalMemoryBucket === '4_8gb') warnings.push('low_memory_capacity')
  if (input.freeMemoryBucket === 'lt_1gb') warnings.push('low_free_memory')
  if (input.estimatedFreeDiskBucket === 'lt_1gb') warnings.push('low_temp_storage')
  if (input.ffmpegAvailable === false || input.ffprobeAvailable === false) warnings.push('media_extraction_tools_unavailable')
  if (input.runtimeKind === 'electron_renderer' && input.sandboxedRenderer === true) warnings.push('renderer_sandbox_requires_main_process_bridge')
  if (input.runtimeKind === 'electron_renderer' && input.contextIsolation !== true) warnings.push('electron_context_isolation_unknown_or_disabled')
  return warnings.sort()
}

function buildRouteHints(input: {
  runtimeKind: string
  availableParallelismBucket: string
  totalMemoryBucket: string
  ffmpegAvailable: boolean | 'unknown'
  ffprobeAvailable: boolean | 'unknown'
  sandboxedRenderer: boolean | 'unknown'
  blockedReasons: string[]
}): string[] {
  const hints = new Set<string>()
  if (input.blockedReasons.length > 0) hints.add('unknown_capability_fail_closed')
  if (input.ffmpegAvailable === false || input.ffprobeAvailable === false) hints.add('media_extraction_blocked_ffmpeg_unavailable')
  if (input.runtimeKind === 'electron_renderer' && input.sandboxedRenderer === true) hints.add('renderer_sandbox_requires_main_process_bridge')
  if (input.availableParallelismBucket === '1_2' || input.totalMemoryBucket === 'lt_4gb' || input.totalMemoryBucket === '4_8gb') {
    hints.add('low_resource_avoid_local_heavy_processing')
    hints.add('server_worker_preferred')
  }
  if (
    input.blockedReasons.length === 0
    && (input.availableParallelismBucket === '9_16' || input.availableParallelismBucket === '17_plus')
    && (input.totalMemoryBucket === '16_32gb' || input.totalMemoryBucket === '32gb_plus')
  ) {
    hints.add('local_processing_candidate_but_execution_blocked')
    hints.add('desktop_route_possible_future')
  }
  if (hints.size === 0) hints.add('server_worker_preferred')
  return [...hints].sort()
}
