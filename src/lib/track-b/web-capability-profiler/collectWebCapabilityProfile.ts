import { normalizeWebCapabilityProfile } from './normalizeWebCapabilityProfile'
import type { RawWebCapabilitySignals, WebCapabilityProfile } from './webCapabilityProfileTypes'

type NavigatorWithOptionalCapabilities = Navigator & {
  deviceMemory?: number
  connection?: { effectiveType?: 'slow-2g' | '2g' | '3g' | '4g'; saveData?: boolean }
  gpu?: unknown
}

export async function collectWebCapabilityProfile(): Promise<WebCapabilityProfile> {
  const nav = typeof navigator === 'undefined' ? undefined : navigator as NavigatorWithOptionalCapabilities
  const storageEstimate = await safeStorageEstimate(nav)
  const raw: RawWebCapabilitySignals = {
    secureContext: typeof window === 'undefined' ? 'unknown' : window.isSecureContext,
    crossOriginIsolated: typeof globalThis.crossOriginIsolated === 'boolean' ? globalThis.crossOriginIsolated : 'unknown',
    workerAvailable: typeof Worker !== 'undefined',
    dedicatedWorkerAvailable: typeof Worker !== 'undefined',
    serviceWorkerAvailable: Boolean(nav && 'serviceWorker' in nav),
    offscreenCanvasAvailable: typeof OffscreenCanvas !== 'undefined',
    platformCoarse: 'unknown',
    hardwareConcurrency: nav?.hardwareConcurrency,
    deviceMemoryGb: nav?.deviceMemory,
    wasmAvailable: typeof WebAssembly !== 'undefined',
    wasmSimdLikely: typeof WebAssembly !== 'undefined' ? 'unknown' : false,
    sharedArrayBufferAvailable: typeof SharedArrayBuffer !== 'undefined',
    highResolutionTimerAllowed: typeof performance !== 'undefined' && typeof performance.now === 'function',
    webglAvailable: detectCanvasContext('webgl'),
    webgl2Available: detectCanvasContext('webgl2'),
    webgpuAvailable: Boolean(nav?.gpu),
    offscreenCanvas2dAvailable: detectOffscreenCanvasContext('2d'),
    offscreenCanvasWebglAvailable: detectOffscreenCanvasContext('webgl'),
    webCodecsAvailable: typeof VideoEncoder !== 'undefined' || typeof VideoDecoder !== 'undefined' || typeof AudioEncoder !== 'undefined' || typeof AudioDecoder !== 'undefined',
    videoEncoderAvailable: typeof VideoEncoder !== 'undefined',
    videoDecoderAvailable: typeof VideoDecoder !== 'undefined',
    audioEncoderAvailable: typeof AudioEncoder !== 'undefined',
    audioDecoderAvailable: typeof AudioDecoder !== 'undefined',
    mediaCapabilitiesAvailable: Boolean(nav?.mediaCapabilities),
    storageEstimateAvailable: storageEstimate.available,
    storageQuotaBytes: storageEstimate.quota,
    storageUsageBytes: storageEstimate.usage,
    persistentStorageAvailable: Boolean(nav?.storage && 'persist' in nav.storage),
    networkInformationAvailable: Boolean(nav?.connection),
    effectiveType: nav?.connection?.effectiveType ?? 'unknown',
    saveData: typeof nav?.connection?.saveData === 'boolean' ? nav.connection.saveData : 'unknown',
  }
  return normalizeWebCapabilityProfile(raw, { collectionMode: 'live_browser_local_only' })
}

async function safeStorageEstimate(nav: NavigatorWithOptionalCapabilities | undefined): Promise<{
  available: boolean
  quota?: number
  usage?: number
}> {
  if (!nav?.storage?.estimate) return { available: false }
  try {
    const estimate = await nav.storage.estimate()
    return {
      available: true,
      quota: estimate.quota,
      usage: estimate.usage,
    }
  } catch {
    return { available: false }
  }
}

function detectCanvasContext(contextId: 'webgl' | 'webgl2'): boolean {
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext(contextId))
  } catch {
    return false
  }
}

function detectOffscreenCanvasContext(contextId: '2d' | 'webgl'): boolean {
  if (typeof OffscreenCanvas === 'undefined') return false
  try {
    const canvas = new OffscreenCanvas(1, 1)
    return Boolean(canvas.getContext(contextId))
  } catch {
    return false
  }
}
