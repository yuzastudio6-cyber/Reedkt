import {
  bucketDeviceMemory,
  bucketHardwareConcurrency,
  bucketStorageQuota,
  bucketStorageUsage,
  WEB_CAPABILITY_PROFILE_SCHEMA_VERSION,
  WEB_CAPABILITY_ROUTE_MANIFEST_VERSION,
  webGpuAdapterClass,
} from './webCapabilityBuckets'
import type { RawWebCapabilitySignals, WebCapabilityProfile } from './webCapabilityProfileTypes'

const SOURCE_POLICY_REFS = [
  'phase_44d_web_capability_privacy_policy',
  'phase_44d_web_capability_bucket_policy',
  'phase_44i_track_b_tool_route_manifest',
]

export function normalizeWebCapabilityProfile(
  raw: RawWebCapabilitySignals,
  options: { collectionMode?: WebCapabilityProfile['collectionMode']; generatedAt?: string } = {},
): WebCapabilityProfile {
  const secureContext = raw.secureContext ?? 'unknown'
  const crossOriginIsolated = raw.crossOriginIsolated ?? 'unknown'
  const webgpuAvailable = raw.webgpuAvailable ?? 'unknown'
  const webCodecsAvailable = raw.webCodecsAvailable
    ?? Boolean(raw.videoEncoderAvailable || raw.videoDecoderAvailable || raw.audioEncoderAvailable || raw.audioDecoderAvailable)
  const storageQuotaBucket = bucketStorageQuota(raw.storageQuotaBytes)
  const hardwareConcurrencyBucket = bucketHardwareConcurrency(raw.hardwareConcurrency)
  const wasmAvailable = raw.wasmAvailable ?? 'unknown'
  const sharedArrayBufferAvailable = raw.sharedArrayBufferAvailable ?? 'unknown'
  const wasmThreadsLikely = crossOriginIsolated === true && sharedArrayBufferAvailable === true && wasmAvailable === true

  const blockedReasons = buildBlockedReasons({ secureContext })
  const warnings = buildWarnings({
    crossOriginIsolated,
    storageQuotaBucket,
    hardwareConcurrencyBucket,
    webgpuAvailable,
    webCodecsAvailable,
  })
  const routePlanningHints = buildRouteHints({
    secureContext,
    crossOriginIsolated,
    webgpuAvailable,
    webCodecsAvailable,
    storageQuotaBucket,
    hardwareConcurrencyBucket,
  })

  const unsupportedApis = buildUnsupportedApis(raw)

  return {
    schemaVersion: WEB_CAPABILITY_PROFILE_SCHEMA_VERSION,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    collectionMode: options.collectionMode ?? 'live_browser_local_only',
    privacyMode: ['coarse', 'no_persistence', 'no_identifiers'],
    capabilityBuckets: {
      environment: {
        secureContext,
        crossOriginIsolated,
        workerAvailable: raw.workerAvailable ?? 'unknown',
        dedicatedWorkerAvailable: raw.dedicatedWorkerAvailable ?? raw.workerAvailable ?? 'unknown',
        serviceWorkerAvailable: raw.serviceWorkerAvailable ?? 'unknown',
        offscreenCanvasAvailable: raw.offscreenCanvasAvailable ?? 'unknown',
        platformCoarse: raw.platformCoarse ?? 'unknown',
      },
      compute: {
        hardwareConcurrencyBucket,
        deviceMemoryBucket: bucketDeviceMemory(raw.deviceMemoryGb),
        wasmAvailable,
        wasmSimdLikely: raw.wasmSimdLikely ?? 'unknown',
        sharedArrayBufferAvailable,
        wasmThreadsLikely,
        highResolutionTimerAllowed: raw.highResolutionTimerAllowed ?? 'unknown',
      },
      graphics: {
        webglAvailable: raw.webglAvailable ?? 'unknown',
        webgl2Available: raw.webgl2Available ?? 'unknown',
        webgpuAvailable,
        webgpuSecureContextRequired: true,
        webgpuAdapterClass: secureContext === false ? 'blocked_by_policy' : webGpuAdapterClass(webgpuAvailable),
        offscreenCanvas2dAvailable: raw.offscreenCanvas2dAvailable ?? 'unknown',
        offscreenCanvasWebglAvailable: raw.offscreenCanvasWebglAvailable ?? 'unknown',
      },
      media: {
        webCodecsAvailable,
        videoEncoderAvailable: raw.videoEncoderAvailable ?? 'unknown',
        videoDecoderAvailable: raw.videoDecoderAvailable ?? 'unknown',
        audioEncoderAvailable: raw.audioEncoderAvailable ?? 'unknown',
        audioDecoderAvailable: raw.audioDecoderAvailable ?? 'unknown',
        mediaCapabilitiesAvailable: raw.mediaCapabilitiesAvailable ?? 'unknown',
        codecSupportProbePolicy: webCodecsAvailable === true ? 'disabled_by_default' : 'unavailable',
      },
      storage: {
        storageEstimateAvailable: raw.storageEstimateAvailable ?? 'unknown',
        storageQuotaBucket,
        storageUsageBucket: bucketStorageUsage(raw.storageUsageBytes),
        persistentStorageAvailable: raw.persistentStorageAvailable ?? 'unknown',
      },
      network: {
        networkInformationAvailable: raw.networkInformationAvailable ?? 'unknown',
        effectiveType: raw.effectiveType ?? 'unknown',
        saveData: raw.saveData ?? 'unknown',
        noSpeedTest: true,
        noEndpointPing: true,
      },
      policy: {
        privacyRiskLevel: warnings.length > 0 ? 'medium' : 'low',
        fingerprintingRiskLevel: 'low',
        allowedForRoutePlanning: blockedReasons.length === 0,
        allowedForWorkerExecution: false,
        allowedForCostEstimator: false,
        routeManifestVersion: WEB_CAPABILITY_ROUTE_MANIFEST_VERSION,
        profileSchemaVersion: WEB_CAPABILITY_PROFILE_SCHEMA_VERSION,
      },
    },
    routePlanningHints,
    blockedReasons,
    warnings,
    unsupportedApis,
    sourcePolicyRefs: SOURCE_POLICY_REFS,
  }
}

function buildBlockedReasons(input: { secureContext: RawWebCapabilitySignals['secureContext'] }): string[] {
  if (input.secureContext === false) return ['insecure_context']
  return []
}

function buildWarnings(input: {
  crossOriginIsolated: RawWebCapabilitySignals['crossOriginIsolated']
  storageQuotaBucket: string
  hardwareConcurrencyBucket: string
  webgpuAvailable: RawWebCapabilitySignals['webgpuAvailable']
  webCodecsAvailable: RawWebCapabilitySignals['webCodecsAvailable']
}): string[] {
  const warnings: string[] = []
  if (input.crossOriginIsolated === false) warnings.push('shared_memory_unavailable_cross_origin_isolation')
  if (input.storageQuotaBucket === 'lt_1gb') warnings.push('low_storage_capacity')
  if (input.hardwareConcurrencyBucket === '1_2') warnings.push('low_compute_capacity')
  if (input.webgpuAvailable === true) warnings.push('webgpu_present_but_unapproved_for_execution')
  if (input.webCodecsAvailable === true) warnings.push('webcodecs_present_but_media_processing_blocked')
  return warnings
}

function buildRouteHints(input: {
  secureContext: RawWebCapabilitySignals['secureContext']
  crossOriginIsolated: RawWebCapabilitySignals['crossOriginIsolated']
  webgpuAvailable: RawWebCapabilitySignals['webgpuAvailable']
  webCodecsAvailable: RawWebCapabilitySignals['webCodecsAvailable']
  storageQuotaBucket: string
  hardwareConcurrencyBucket: string
}): string[] {
  const hints = new Set<string>()
  if (input.secureContext === false) hints.add('unknown_capability_fail_closed')
  if (input.crossOriginIsolated === false) hints.add('cross_origin_isolation_required_for_threads')
  if (input.webgpuAvailable === true) hints.add('webgpu_present_but_unapproved')
  if (input.webgpuAvailable === false) hints.add('gpu_compute_unavailable')
  if (input.webCodecsAvailable === true) {
    hints.add('webcodecs_present_but_media_processing_blocked')
    hints.add('web_media_preview_possible')
    hints.add('browser_preview_metadata_possible')
  }
  if (input.webgpuAvailable === true && input.webCodecsAvailable === true && input.crossOriginIsolated === true) {
    hints.add('browser_can_assist_preview_metadata')
  }
  if (input.storageQuotaBucket === 'lt_1gb') hints.add('low_storage_avoid_browser_processing')
  if (input.hardwareConcurrencyBucket === '1_2' || input.storageQuotaBucket === 'lt_1gb') {
    hints.add('server_worker_preferred')
    hints.add('avoid_browser_heavy_processing')
  }
  if (hints.size === 0) hints.add('prefer_server_worker')
  return [...hints].sort()
}

function buildUnsupportedApis(raw: RawWebCapabilitySignals): string[] {
  const unsupported: string[] = []
  if (raw.webgpuAvailable === false) unsupported.push('webgpu')
  if (raw.webCodecsAvailable === false) unsupported.push('webcodecs')
  if (raw.storageEstimateAvailable === false) unsupported.push('storage_estimate')
  if (raw.networkInformationAvailable === false) unsupported.push('network_information')
  if (raw.offscreenCanvasAvailable === false) unsupported.push('offscreen_canvas')
  return unsupported.sort()
}
