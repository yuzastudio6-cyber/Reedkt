import { webSearchInternalBetaSafetyFlags } from './web-search-internal-beta-policy'
import type { WebSearchInternalBetaScopeManifest } from './web-search-internal-beta-types'

export function buildWebSearchInternalBetaScopeManifest(input: {
  runId: string
  ready: boolean
}): WebSearchInternalBetaScopeManifest {
  return {
    runId: input.runId,
    phase: '49P',
    scope: 'controlled_internal_beta_candidate_only',
    allowedCapabilities: [
      'private_authenticated_searxng_controlled_internal_queries',
      'optional_budget_secret_storage_gated_brave_confidence_boosting',
      'hybrid_consensus_from_approved_provider_modes',
      'allowlisted_capture_only_after_approved_plan_snapshot',
      'sharp_processing_only_for_phase_created_screenshots',
      'readability_extraction_only_for_allowlisted_captured_pages',
      'internal_authenticated_web_search_api_gates',
      'chat_native_developer_gate_status_display',
      'private_gcs_artifact_storage',
    ],
    blockedCapabilities: [
      'production',
      'external_beta',
      'paid_production',
      'broad_real_media',
      'public_searxng_instances',
      'broad_crawling',
      'arbitrary_url_capture',
      'public_artifacts',
      'signed_urls_as_source_of_truth',
      'raw_brave_response_storage',
      'brave_snippet_storage',
      'other_paid_providers',
      'captcha_login_paywall_bypass',
      'unrestricted_provider_execution',
      'final_delivery',
    ],
    defaultProvider: 'searxng',
    optionalProvider: 'brave_search',
    providerPolicy: {
      privateSearxngRequired: true,
      publicSearxngAllowed: false,
      braveEnabledByDefault: false,
      braveRequiresSecretBudgetAndStoragePolicy: true,
      otherPaidProvidersAllowed: false,
    },
    capturePolicy: {
      allowlistedCaptureOnly: true,
      arbitraryUrlCaptureAllowed: false,
      broadCrawlingAllowed: false,
      captchaLoginPaywallBypassAllowed: false,
    },
    artifactPolicy: {
      privateGcsOnly: true,
      publicArtifactsAllowed: false,
      signedUrlSourceOfTruthAllowed: false,
      rawBraveResponseStorageAllowed: false,
      braveSnippetStorageAllowed: false,
    },
    uiApiPolicy: {
      internalRoutesOnly: true,
      mockOnlyControlledRunInPhase49I: true,
      frontendSecretsAllowed: false,
      frontendHeavyCaptureAllowed: false,
    },
    safetyFlags: webSearchInternalBetaSafetyFlags,
    webSearchInternalBetaCandidateReady: input.ready,
    phase50AReadiness: input.ready ? 'ready_for_map_geospatial_stack_approval_and_architecture' : 'blocked_until_phase49p_passes',
  }
}
