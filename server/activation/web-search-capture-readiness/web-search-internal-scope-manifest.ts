import { webSearchCaptureReadinessConfig, webSearchCaptureReadinessSafetyFlags } from './web-search-capture-readiness-policy'
import type { WebSearchInternalScopeManifest } from './web-search-capture-readiness-types'

export function buildWebSearchInternalScopeManifest(input: { runId: string; internalTestingReady: boolean; phase49IReadiness: string }): WebSearchInternalScopeManifest {
  return {
    runId: input.runId,
    phase: '49H',
    scope: 'web_search_capture_internal_testing_readiness',
    track: 'web_search_capture',
    serviceName: webSearchCaptureReadinessConfig.serviceName,
    phaseEvidenceRequired: ['49A', '49B', '49C', '49D', '49E', '49F', '49G'],
    includedCapabilities: [
      'private SearXNG service metadata audit',
      'approved Phase 49A-49G evidence chain audit',
      'provider gate reconciliation',
      'artifact privacy verification',
      'fail-closed internal testing readiness decision',
    ],
    excludedCapabilities: [
      'new live search query',
      'public SearXNG instance',
      'paid search provider',
      'arbitrary URL capture',
      'browser capture',
      'Readability extraction',
      'Docker build or push',
      'Cloud Run deploy or update',
      'public artifact access',
      'signed URL source of truth',
      'production, external beta, paid production, or broad media unlock',
    ],
    safetyFlags: webSearchCaptureReadinessSafetyFlags,
    internalTestingReady: input.internalTestingReady,
    phase49IReadiness: input.phase49IReadiness,
  }
}
