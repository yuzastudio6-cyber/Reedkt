import { readFileSync } from 'node:fs'

const DEFAULT_SNAPSHOT_PATH = 'docs/beta-readiness/local-accepted-evidence-bundle/2026-06-29-current-source-16-tool-local-accepted-evidence-bundle.json'
const DEFAULT_DEPLOYED_EVIDENCE_MANIFEST_PATH = 'docs/beta-readiness/deployed-evidence-input-manifest/2026-06-29-184f-deployed-evidence-input-manifest.json'
const DEFAULT_SOURCE_ID = 'beta-tools-current-source-16-tool-local-accepted-evidence-bundle'
const CURRENT_TRACKB_TOOL_TOTALS = {
  owned: 16,
  boundedAcceptedProven: 16,
  blockedNotInstalledProven: 0,
  productReady: 0,
}

const SECRET_KEY_PATTERNS = [
  /api[_-]?key/i,
  /secret/i,
  /service[_-]?role/i,
  /credential/i,
  /(^|[_-])token($|[_-])/i,
  /authorization/i,
  /signed[_-]?url/i,
  /signedUrl/,
  /raw[_-]?prompt/i,
]

const SECRET_VALUE_PATTERNS = [
  /x-goog-signature=/i,
  /x-amz-signature=/i,
  /^bearer\s+/i,
  /^sk-[a-z0-9_-]+/i,
  /service_role_key/i,
]

export function buildBetaReadinessDeployedEvidenceInputManifest(
  env = process.env,
  options = {},
) {
  const snapshotPath = options.snapshotPath ?? DEFAULT_SNAPSHOT_PATH
  const snapshot = loadSnapshot(snapshotPath)
  const deployedEvidenceManifestPath = options.deployedEvidenceManifestPath ?? DEFAULT_DEPLOYED_EVIDENCE_MANIFEST_PATH
  const deployedEvidenceManifest = loadOptionalJson(deployedEvidenceManifestPath)
  const deployedReadback = deployedEvidenceManifest?.currentApiDeployReadback ?? {}
  const defaultCurrentSourceSha = clean(deployedReadback.sourceSha)
  const defaultExternalApiBaseUrl = clean(deployedReadback.normalApiServiceUrl) ??
    clean(deployedReadback.serviceUrl)
  const currentSourceSha = clean(options.currentSourceSha) ??
    clean(env.REEDITPRO_BETA_DEPLOYED_EVIDENCE_SOURCE_SHA) ??
    defaultCurrentSourceSha
  const effectiveEnv = {
    ...env,
    ...(defaultExternalApiBaseUrl && !clean(env.REEDITPRO_BETA_EXTERNAL_API_BASE_URL)
      ? { REEDITPRO_BETA_EXTERNAL_API_BASE_URL: defaultExternalApiBaseUrl }
      : {}),
    ...(currentSourceSha && !clean(env.REEDITPRO_BETA_DEPLOYED_EVIDENCE_SOURCE_SHA)
      ? { REEDITPRO_BETA_DEPLOYED_EVIDENCE_SOURCE_SHA: currentSourceSha }
      : {}),
    ...(currentSourceSha && !clean(env.REEDITPRO_BETA_EXTERNAL_SOURCE_SHA)
      ? { REEDITPRO_BETA_EXTERNAL_SOURCE_SHA: currentSourceSha }
      : {}),
  }
  const localAcceptedEvidenceSourceSha = required(snapshot.sourceSha, 'snapshot.sourceSha')
  const locallyAcceptedToolIds = requiredArray(snapshot.locallyAcceptedToolIds, 'snapshot.locallyAcceptedToolIds')
  const coreToolIds = requiredArray(snapshot.coreAcceptedToolIds, 'snapshot.coreAcceptedToolIds')
  const libassToolIds = requiredArray(snapshot.libassAcceptedToolIds, 'snapshot.libassAcceptedToolIds')
  const libassContainerImage = required(snapshot.libassEvidence?.containerImage, 'snapshot.libassEvidence.containerImage')
  const requiredProductReadyLocalOssCount = requiredNumber(snapshot.locallyAcceptedToolCount, 'snapshot.locallyAcceptedToolCount')

  const requiredInputs = buildRequiredInputs(effectiveEnv, {
    currentSourceSha,
    localAcceptedEvidenceSourceSha,
    coreToolIdsCsv: coreToolIds.join(','),
    libassContainerImage,
    requiredBoundedAcceptedToolCount: String(CURRENT_TRACKB_TOOL_TOTALS.boundedAcceptedProven),
    requiredProductReadyLocalOssCount: String(CURRENT_TRACKB_TOOL_TOTALS.productReady),
  })
  const pendingRequiredInputs = requiredInputs
    .filter((input) => !input.present)
    .map((input) => input.name)
  const valueGaps = buildValueGaps(effectiveEnv, {
    currentSourceSha,
    localAcceptedEvidenceSourceSha,
    coreToolIds,
    libassContainerImage,
    requiredBoundedAcceptedToolCount: CURRENT_TRACKB_TOOL_TOTALS.boundedAcceptedProven,
    requiredProductReadyLocalOssCount: CURRENT_TRACKB_TOOL_TOTALS.productReady,
  })
  const secretLikeInputPaths = collectSecretLikePaths({
    sourceId: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_ID,
    toolNotes: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_NOTES,
    platformRlsEvidence: env.REEDITPRO_BETA_PLATFORM_RLS_READBACK_EVIDENCE,
    platformStripeEvidence: env.REEDITPRO_BETA_PLATFORM_STRIPE_BOUNDARY_EVIDENCE,
    platformMonitoringEvidence: env.REEDITPRO_BETA_PLATFORM_MONITORING_EVIDENCE,
    platformBillingEvidence: env.REEDITPRO_BETA_PLATFORM_BILLING_QA_EVIDENCE,
    launchModelLicenseEvidence: env.REEDITPRO_BETA_LAUNCH_MODEL_LICENSE_EVIDENCE,
    launchDeploymentEvidence: env.REEDITPRO_BETA_LAUNCH_DEPLOYMENT_EVIDENCE,
    launchSecurityEvidence: env.REEDITPRO_BETA_LAUNCH_SECURITY_EVIDENCE,
    launchStorageEvidence: env.REEDITPRO_BETA_LAUNCH_STORAGE_EVIDENCE,
    launchLegalEvidence: env.REEDITPRO_BETA_LAUNCH_LEGAL_EVIDENCE,
    launchMonitoringEvidence: env.REEDITPRO_BETA_LAUNCH_MONITORING_EVIDENCE,
    launchSupportEvidence: env.REEDITPRO_BETA_LAUNCH_SUPPORT_EVIDENCE,
  }, 'betaReadinessDeployedEvidenceInputManifest')
  const snapshotGaps = [
    ...(snapshot.readyToRecordDeployedEvidence === true ? [] : ['Local accepted evidence snapshot is not ready to record deployed evidence.']),
    ...(snapshot.libassEvidence?.network === 'none' ? [] : ['Local libass evidence must be network-disabled.']),
    ...(snapshot.libassEvidence?.syntheticBurninQa?.syntheticOnly === true ? [] : ['Local libass evidence must be synthetic-only.']),
    ...(snapshot.libassEvidence?.syntheticBurninQa?.noPrivateOrUserMedia === true ? [] : ['Local libass evidence must confirm no private/user media.']),
    ...(snapshot.libassEvidence?.syntheticBurninQa?.noNetwork === true ? [] : ['Local libass evidence must confirm no network.']),
    ...(snapshot.libassEvidence?.syntheticBurninQa?.tempRootRemoved === true ? [] : ['Local libass evidence must confirm temp-root cleanup.']),
  ]
  const allValueGaps = [...snapshotGaps, ...valueGaps]
  const readyToRunExternalBetaEvidenceCollector = pendingRequiredInputs.length === 0 &&
    allValueGaps.length === 0 &&
    secretLikeInputPaths.length === 0

  return {
    ok: true,
    readyToRunExternalBetaEvidenceCollector,
    decision: readyToRunExternalBetaEvidenceCollector
      ? 'beta_deployed_evidence_input_manifest_passed_ready_to_run_external_beta_evidence_collector'
      : 'beta_deployed_evidence_input_manifest_passed_ready_for_operator_staging_inputs',
    manifestId: 'beta-deployed-evidence-input-manifest-after-local-accepted-tools-2026-06-29-16-tool',
    sourceTruth: {
      localAcceptedEvidenceSnapshotPath: snapshotPath,
      deployedEvidenceManifestPath,
      localAcceptedEvidenceSourceSha,
      currentSourceSha,
      currentSourceDerivedFromSnapshot: Boolean(currentSourceSha && currentSourceSha !== localAcceptedEvidenceSourceSha),
      defaultedInputs: {
        externalApiBaseUrlFromDeployReadback: Boolean(defaultExternalApiBaseUrl && !clean(env.REEDITPRO_BETA_EXTERNAL_API_BASE_URL)),
        deployedEvidenceSourceShaFromDeployReadback: Boolean(currentSourceSha && !clean(env.REEDITPRO_BETA_DEPLOYED_EVIDENCE_SOURCE_SHA)),
        externalSourceShaFromDeployReadback: Boolean(currentSourceSha && !clean(env.REEDITPRO_BETA_EXTERNAL_SOURCE_SHA)),
      },
      locallyAcceptedToolCount: requiredProductReadyLocalOssCount,
      locallyAcceptedToolIds,
      coreToolIds,
      libassToolIds,
      trackBToolTotals: CURRENT_TRACKB_TOOL_TOTALS,
    },
    fixedInputs: {
      coreToolIdsCsv: coreToolIds.join(','),
      libassMode: 'docker',
      libassContainerImage,
      requiredBoundedAcceptedToolCount: CURRENT_TRACKB_TOOL_TOTALS.boundedAcceptedProven,
      requiredProductReadyLocalOssCount: CURRENT_TRACKB_TOOL_TOTALS.productReady,
      platformEnvironment: 'staging',
      externalBetaReadyRequired: true,
      deployedEvidenceSourceShaRequired: true,
    },
    requiredInputs,
    pendingRequiredInputs,
    valueGaps: allValueGaps,
    secretLikeInputPaths,
    recommendedCommands: [
      'npm run beta:readiness:owner-approval-packet',
      'npm run beta:readiness:owner-approval-env-template',
      'npm run beta:readiness:external-beta-operator-input-template -- --status',
      'npm run beta:readiness:external-beta-operator-autofill-env',
      'npm run beta:readiness:external-beta-operator-human-input-checklist',
      'npm run beta:readiness:external-beta-operator-local-env-preflight',
      'npm run beta:readiness:external-beta-operator-input-template',
      'npm run beta:readiness:source-freshness-preflight',
      'npm run beta:readiness:owner-approval-intake-status',
      'npm run beta:readiness:owner-approval-intake-preflight',
      'npm run beta:readiness:deployed-evidence-input-manifest',
      'npm run beta:readiness:external-beta-evidence-collector',
      'npm run beta:readiness:operator-status-api',
      'npm run beta:readiness:scope-approval-evidence-preflight',
      'npm run beta:readiness:paid-production-evidence-collector',
    ],
    remainingBlockedScopes: [
      'external_beta_until_deployed_evidence_collector_and_operator_readback_pass',
      'real_user_media_beta_until_separate_scope_approval_evidence_passes',
      'paid_production_until_separate_paid_production_evidence_collector_passes',
      'public_launch_claims_until_final_operator_status_readback_passes',
    ],
    warnings: [
      'This manifest does not call the deployed backend, record evidence, run tools, process media, write Supabase/GCS, enable beta, or enable production.',
      'Secret inputs are represented by presence only; bearer tokens must stay in authorization headers and must not appear in evidence notes.',
      'The local accepted evidence snapshot is a prerequisite, not a substitute for deployed staging evidence recording and operator readback.',
    ],
  }
}

function buildRequiredInputs(env, fixed) {
  return [
    input(env, 'REEDITPRO_BETA_EXTERNAL_API_BASE_URL', 'shared', true, 'external_beta_evidence_sequence'),
    input(env, 'REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN', 'shared', true, 'external_beta_evidence_sequence'),
    input(env, 'REEDITPRO_BETA_EXTERNAL_WORKSPACE_ID', 'shared', false, 'external_beta_evidence_sequence'),
    input(env, 'REEDITPRO_BETA_EXTERNAL_PROJECT_ID', 'shared', false, 'external_beta_evidence_sequence'),
    input(env, 'REEDITPRO_BETA_DEPLOYED_EVIDENCE_SOURCE_SHA', 'shared', false, 'external_beta_evidence_sequence'),
    input(env, 'REEDITPRO_BETA_EXTERNAL_SOURCE_SHA', 'shared', false, 'external_beta_evidence_sequence', fixed.currentSourceSha),
    input(env, 'REEDITPRO_BETA_EXTERNAL_CONFIRM_EVIDENCE_SEQUENCE', 'shared', false, 'external_beta_evidence_sequence', 'true'),
    input(env, 'REEDITPRO_BETA_EXTERNAL_REQUIRE_EXTERNAL_BETA_READY', 'shared', false, 'external_beta_evidence_sequence', 'true'),
    input(env, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_IDEMPOTENCY_KEY', 'tool_evidence', false, 'external_beta_evidence_sequence'),
    input(env, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_IDEMPOTENCY_KEY', 'tool_evidence', false, 'external_beta_evidence_sequence'),
    input(env, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_ID', 'tool_evidence', false, 'external_beta_evidence_sequence', DEFAULT_SOURCE_ID),
    input(env, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_SHA', 'tool_evidence', false, 'external_beta_evidence_sequence', fixed.localAcceptedEvidenceSourceSha),
    input(env, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_TOOL_IDS', 'tool_evidence', false, 'external_beta_evidence_sequence', fixed.coreToolIdsCsv),
    input(env, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_ACCEPT_BOUNDED_ACCEPTED_EVIDENCE', 'tool_evidence', false, 'external_beta_evidence_sequence', 'true'),
    input(env, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CONFIRM_BOUNDED_ACCEPTED_EVIDENCE_ACCEPTANCE', 'tool_evidence', false, 'external_beta_evidence_sequence', 'true'),
    input(env, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_CORE_ACCEPTED_EVIDENCE', 'tool_evidence', false, 'external_beta_evidence_sequence', 'true'),
    input(env, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_LIBASS_ACCEPTED_EVIDENCE', 'tool_evidence', false, 'external_beta_evidence_sequence', 'true'),
    input(env, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_OPERATOR_READBACK', 'tool_evidence', false, 'external_beta_evidence_sequence', 'true'),
    input(env, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRED_BOUNDED_ACCEPTED_TOOL_COUNT', 'tool_evidence', false, 'external_beta_evidence_sequence', fixed.requiredBoundedAcceptedToolCount),
    input(env, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRED_PRODUCT_READY_LOCAL_OSS_COUNT', 'tool_evidence', false, 'external_beta_evidence_sequence', fixed.requiredProductReadyLocalOssCount),
    input(env, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_MODE', 'tool_evidence', false, 'external_beta_evidence_sequence', 'docker'),
    input(env, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_CONTAINER_IMAGE', 'tool_evidence', false, 'external_beta_evidence_sequence', fixed.libassContainerImage),
    input(env, 'REEDITPRO_BETA_PLATFORM_IDEMPOTENCY_KEY', 'platform_evidence', false, 'platform_packet'),
    input(env, 'REEDITPRO_BETA_PLATFORM_ENVIRONMENT', 'platform_evidence', false, 'platform_packet', 'staging'),
    input(env, 'REEDITPRO_BETA_PLATFORM_ALLOW_PERSISTENT_PROBE_WRITES', 'platform_evidence', false, 'platform_packet', 'true'),
    input(env, 'REEDITPRO_BETA_PLATFORM_WALLET_SETTLEMENT_EVENT_ID', 'platform_evidence', false, 'platform_packet'),
    input(env, 'REEDITPRO_BETA_PLATFORM_RECORD_EVIDENCE', 'platform_evidence', false, 'platform_packet', 'true'),
    input(env, 'REEDITPRO_BETA_PLATFORM_CONFIRM_RECORD_EVIDENCE', 'platform_evidence', false, 'platform_packet', 'true'),
    input(env, 'REEDITPRO_BETA_PLATFORM_REQUIRE_READY', 'platform_evidence', false, 'platform_packet', 'true'),
    input(env, 'REEDITPRO_BETA_PLATFORM_APPROVE_BILLING_STRIPE_BOUNDARY', 'platform_evidence', false, 'platform_packet', 'true'),
    input(env, 'REEDITPRO_BETA_PLATFORM_APPROVE_DEPLOYMENT', 'platform_evidence', false, 'platform_packet', 'true'),
    input(env, 'REEDITPRO_BETA_PLATFORM_APPROVE_SECURITY', 'platform_evidence', false, 'platform_packet', 'true'),
    input(env, 'REEDITPRO_BETA_PLATFORM_APPROVE_STORAGE', 'platform_evidence', false, 'platform_packet', 'true'),
    input(env, 'REEDITPRO_BETA_PLATFORM_APPROVE_LEGAL', 'platform_evidence', false, 'platform_packet', 'true'),
    input(env, 'REEDITPRO_BETA_PLATFORM_APPROVE_MONITORING', 'platform_evidence', false, 'platform_packet', 'true'),
    input(env, 'REEDITPRO_BETA_PLATFORM_APPROVE_SUPPORT', 'platform_evidence', false, 'platform_packet', 'true'),
    input(env, 'REEDITPRO_BETA_PLATFORM_RLS_READBACK_VERIFIED', 'platform_evidence', false, 'platform_packet', 'true'),
    input(env, 'REEDITPRO_BETA_PLATFORM_RLS_READBACK_EVIDENCE', 'platform_evidence', false, 'platform_packet'),
    input(env, 'REEDITPRO_BETA_PLATFORM_STRIPE_BOUNDARY_VERIFIED', 'platform_evidence', false, 'platform_packet', 'true'),
    input(env, 'REEDITPRO_BETA_PLATFORM_STRIPE_BOUNDARY_EVIDENCE', 'platform_evidence', false, 'platform_packet'),
    input(env, 'REEDITPRO_BETA_PLATFORM_MONITORING_VERIFIED', 'platform_evidence', false, 'platform_packet', 'true'),
    input(env, 'REEDITPRO_BETA_PLATFORM_MONITORING_EVIDENCE', 'platform_evidence', false, 'platform_packet'),
    input(env, 'REEDITPRO_BETA_PLATFORM_BILLING_QA_VERIFIED', 'platform_evidence', false, 'platform_packet', 'true'),
    input(env, 'REEDITPRO_BETA_PLATFORM_BILLING_QA_EVIDENCE', 'platform_evidence', false, 'platform_packet'),
    input(env, 'REEDITPRO_BETA_LAUNCH_IDEMPOTENCY_KEY', 'launch_approval', false, 'launch_packet'),
    input(env, 'REEDITPRO_BETA_LAUNCH_CONFIRM_EXTERNAL_BETA_APPROVAL', 'launch_approval', false, 'launch_packet', 'true'),
    input(env, 'REEDITPRO_BETA_LAUNCH_APPROVE_DEPLOYMENT', 'launch_approval', false, 'launch_packet', 'true'),
    input(env, 'REEDITPRO_BETA_LAUNCH_APPROVE_SECURITY', 'launch_approval', false, 'launch_packet', 'true'),
    input(env, 'REEDITPRO_BETA_LAUNCH_APPROVE_STORAGE', 'launch_approval', false, 'launch_packet', 'true'),
    input(env, 'REEDITPRO_BETA_LAUNCH_APPROVE_MODEL_LICENSES', 'launch_approval', false, 'launch_packet', 'true'),
    input(env, 'REEDITPRO_BETA_LAUNCH_APPROVE_LEGAL', 'launch_approval', false, 'launch_packet', 'true'),
    input(env, 'REEDITPRO_BETA_LAUNCH_APPROVE_MONITORING', 'launch_approval', false, 'launch_packet', 'true'),
    input(env, 'REEDITPRO_BETA_LAUNCH_APPROVE_SUPPORT', 'launch_approval', false, 'launch_packet', 'true'),
    input(env, 'REEDITPRO_BETA_LAUNCH_MODEL_LICENSE_EVIDENCE', 'launch_approval', false, 'launch_packet'),
    input(env, 'REEDITPRO_BETA_LAUNCH_DEPLOYMENT_EVIDENCE', 'launch_approval', false, 'launch_packet'),
    input(env, 'REEDITPRO_BETA_LAUNCH_SECURITY_EVIDENCE', 'launch_approval', false, 'launch_packet'),
    input(env, 'REEDITPRO_BETA_LAUNCH_STORAGE_EVIDENCE', 'launch_approval', false, 'launch_packet'),
    input(env, 'REEDITPRO_BETA_LAUNCH_LEGAL_EVIDENCE', 'launch_approval', false, 'launch_packet'),
    input(env, 'REEDITPRO_BETA_LAUNCH_MONITORING_EVIDENCE', 'launch_approval', false, 'launch_packet'),
    input(env, 'REEDITPRO_BETA_LAUNCH_SUPPORT_EVIDENCE', 'launch_approval', false, 'launch_packet'),
  ]
}

function buildValueGaps(env, fixed) {
  const gaps = []
  if (fixed.currentSourceSha) {
    requireEqualIfPresent(env, gaps, 'REEDITPRO_BETA_EXTERNAL_SOURCE_SHA', fixed.currentSourceSha)
    requireEqualIfPresent(env, gaps, 'REEDITPRO_BETA_PLATFORM_SOURCE_SHA', fixed.currentSourceSha)
    requireEqualIfPresent(env, gaps, 'REEDITPRO_BETA_LAUNCH_SOURCE_SHA', fixed.currentSourceSha)
    requireEqualIfPresent(env, gaps, 'REEDITPRO_BETA_STATUS_SOURCE_SHA', fixed.currentSourceSha)
  }
  requireEqualIfPresent(env, gaps, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_SHA', fixed.localAcceptedEvidenceSourceSha)
  requireEqualIfPresent(env, gaps, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_MODE', 'docker')
  requireEqualIfPresent(env, gaps, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_CONTAINER_IMAGE', fixed.libassContainerImage)
  requireEqualIfPresent(env, gaps, 'REEDITPRO_BETA_PLATFORM_ENVIRONMENT', 'staging')
  requireEqualIfPresent(env, gaps, 'REEDITPRO_BETA_EXTERNAL_CONFIRM_EVIDENCE_SEQUENCE', 'true')
  requireEqualIfPresent(env, gaps, 'REEDITPRO_BETA_EXTERNAL_REQUIRE_EXTERNAL_BETA_READY', 'true')
  for (const name of [
    'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_ACCEPT_BOUNDED_ACCEPTED_EVIDENCE',
    'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CONFIRM_BOUNDED_ACCEPTED_EVIDENCE_ACCEPTANCE',
    'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_CORE_ACCEPTED_EVIDENCE',
    'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_LIBASS_ACCEPTED_EVIDENCE',
    'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_OPERATOR_READBACK',
    'REEDITPRO_BETA_PLATFORM_ALLOW_PERSISTENT_PROBE_WRITES',
    'REEDITPRO_BETA_PLATFORM_RECORD_EVIDENCE',
    'REEDITPRO_BETA_PLATFORM_CONFIRM_RECORD_EVIDENCE',
    'REEDITPRO_BETA_PLATFORM_REQUIRE_READY',
    'REEDITPRO_BETA_PLATFORM_APPROVE_BILLING_STRIPE_BOUNDARY',
    'REEDITPRO_BETA_PLATFORM_APPROVE_DEPLOYMENT',
    'REEDITPRO_BETA_PLATFORM_APPROVE_SECURITY',
    'REEDITPRO_BETA_PLATFORM_APPROVE_STORAGE',
    'REEDITPRO_BETA_PLATFORM_APPROVE_LEGAL',
    'REEDITPRO_BETA_PLATFORM_APPROVE_MONITORING',
    'REEDITPRO_BETA_PLATFORM_APPROVE_SUPPORT',
    'REEDITPRO_BETA_PLATFORM_RLS_READBACK_VERIFIED',
    'REEDITPRO_BETA_PLATFORM_STRIPE_BOUNDARY_VERIFIED',
    'REEDITPRO_BETA_PLATFORM_MONITORING_VERIFIED',
    'REEDITPRO_BETA_PLATFORM_BILLING_QA_VERIFIED',
    'REEDITPRO_BETA_LAUNCH_CONFIRM_EXTERNAL_BETA_APPROVAL',
    'REEDITPRO_BETA_LAUNCH_APPROVE_DEPLOYMENT',
    'REEDITPRO_BETA_LAUNCH_APPROVE_SECURITY',
    'REEDITPRO_BETA_LAUNCH_APPROVE_STORAGE',
    'REEDITPRO_BETA_LAUNCH_APPROVE_MODEL_LICENSES',
    'REEDITPRO_BETA_LAUNCH_APPROVE_LEGAL',
    'REEDITPRO_BETA_LAUNCH_APPROVE_MONITORING',
    'REEDITPRO_BETA_LAUNCH_APPROVE_SUPPORT',
  ]) {
    requireEqualIfPresent(env, gaps, name, 'true')
  }
  requireNotTrueIfPresent(env, gaps, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_ACCEPT_PRODUCTION_READINESS')
  requireNotTrueIfPresent(env, gaps, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE')
  requireNotTrueIfPresent(env, gaps, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_ACCEPT_PRODUCT_READY_LOCAL_OSS')
  requireNotTrueIfPresent(env, gaps, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE')
  requireNotTrueIfPresent(env, gaps, 'REEDITPRO_BETA_LAUNCH_APPROVE_REAL_USER_MEDIA_BETA')
  requireNotTrueIfPresent(env, gaps, 'REEDITPRO_BETA_LAUNCH_APPROVE_PAID_PRODUCTION')

  const requiredBoundedCount = clean(env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRED_BOUNDED_ACCEPTED_TOOL_COUNT)
  if (requiredBoundedCount) {
    const parsed = Number.parseInt(requiredBoundedCount, 10)
    if (!Number.isFinite(parsed) || parsed !== fixed.requiredBoundedAcceptedToolCount) {
      gaps.push(`REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRED_BOUNDED_ACCEPTED_TOOL_COUNT must be exactly ${fixed.requiredBoundedAcceptedToolCount}.`)
    }
  }

  const requiredCount = clean(env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRED_PRODUCT_READY_LOCAL_OSS_COUNT)
  if (requiredCount) {
    const parsed = Number.parseInt(requiredCount, 10)
    if (!Number.isFinite(parsed) || parsed !== fixed.requiredProductReadyLocalOssCount) {
      gaps.push(`REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRED_PRODUCT_READY_LOCAL_OSS_COUNT must be exactly ${fixed.requiredProductReadyLocalOssCount}.`)
    }
  }

  const coreIds = parseCsv(env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_TOOL_IDS)
  if (coreIds.length > 0) {
    const expected = [...fixed.coreToolIds].sort()
    const actual = [...coreIds].sort()
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      gaps.push(`REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_TOOL_IDS must exactly match ${expected.join(',')}.`)
    }
  }

  return gaps
}

function input(env, name, group, secret, requiredFor, expectedValue) {
  return {
    name,
    group,
    secret,
    requiredFor,
    present: Boolean(clean(env[name])),
    expectedValue: secret ? undefined : expectedValue,
  }
}

function requireEqualIfPresent(env, gaps, name, expected) {
  const value = clean(env[name])
  if (value && value !== expected) {
    gaps.push(`${name} must be ${expected}.`)
  }
}

function requireNotTrueIfPresent(env, gaps, name) {
  const value = clean(env[name])
  if (value === 'true' || value === '1') {
    gaps.push(`${name} must not be true in the external-beta deployed evidence lane.`)
  }
}

function loadSnapshot(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function loadOptionalJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return undefined
  }
}

function required(value, label) {
  const cleaned = clean(value)
  if (!cleaned) throw new Error(`${label} is required.`)
  return cleaned
}

function requiredNumber(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 1) {
    throw new Error(`${label} must be a positive number.`)
  }
  return value
}

function requiredArray(value, label) {
  if (!Array.isArray(value) || value.length === 0 || value.some((item) => !clean(item))) {
    throw new Error(`${label} must be a non-empty string array.`)
  }
  return value
}

function parseCsv(value) {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function clean(value) {
  const trimmed = value?.trim()
  return trimmed || undefined
}

function collectSecretLikePaths(value, rootPath = 'payload') {
  const matches = []
  visitSecretPaths(value, rootPath, matches)
  return matches
}

function visitSecretPaths(value, path, matches) {
  if (typeof value === 'string') {
    if (SECRET_VALUE_PATTERNS.some((pattern) => pattern.test(value))) matches.push(path)
    return
  }

  if (!value || typeof value !== 'object') return

  if (Array.isArray(value)) {
    value.forEach((item, index) => visitSecretPaths(item, `${path}[${index}]`, matches))
    return
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    const nestedPath = `${path}.${key}`
    if (SECRET_KEY_PATTERNS.some((pattern) => pattern.test(key))) {
      matches.push(nestedPath)
      continue
    }
    visitSecretPaths(nestedValue, nestedPath, matches)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const manifest = buildBetaReadinessDeployedEvidenceInputManifest(process.env)
  console.log(JSON.stringify(manifest, null, 2))
  if (!manifest.readyToRunExternalBetaEvidenceCollector) {
    process.exitCode = 1
  }
}
