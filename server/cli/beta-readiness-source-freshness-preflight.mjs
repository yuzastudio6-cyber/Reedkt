import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const DEFAULT_API_DEPLOY_PACKET_PATH = 'docs/beta-readiness/api-staging-deploy-current-source/2026-06-29-769f-api-staging-deploy.json'
const DEFAULT_API_DEPLOYMENT_PREFLIGHT_PACKET_PATH = 'docs/beta-readiness/api-deployment-preflight/2026-06-29-769f-api-deployment-preflight-passed.json'
const DEFAULT_DEPLOYED_EVIDENCE_MANIFEST_PATH = 'docs/beta-readiness/deployed-evidence-input-manifest/2026-06-29-769f-deployed-evidence-input-manifest.json'

const PASS_DECISION = 'beta_readiness_source_freshness_preflight_passed_current_source_matches_deploy_evidence'
const BLOCKED_DECISION = 'beta_readiness_source_freshness_preflight_blocked_deploy_evidence_source_stale'
const ALLOWED_PACKAGE_JSON_SCRIPT_DRIFT = [
  'beta:readiness:deployed-evidence-input-manifest',
  'beta:readiness:api-deployment-preflight',
  'beta:readiness:blocker-ledger',
  'beta:readiness:external-beta-evidence-collector',
  'beta:readiness:launch-approval-evidence',
  'beta:readiness:launch-approval-evidence-preflight',
  'beta:readiness:operator-status-api',
  'beta:readiness:operator-status',
  'beta:readiness:owner-command-handoff',
  'beta:readiness:paid-production-evidence-collector',
  'beta:readiness:scope-approval-evidence',
  'beta:readiness:scope-approval-evidence-preflight',
  'beta:readiness:scope-approval-sequence',
  'beta:platform:staging-evidence-preflight',
  'beta:platform:staging-evidence-probe',
  'beta:tools:core-real-check-evidence',
  'beta:tools:core-real-check-evidence-preflight',
  'beta:tools:core-real-check-preview',
  'beta:tools:libass-container-proof-preflight',
  'beta:tools:libass-synthetic-burnin-qa-evidence',
  'beta:tools:libass-synthetic-burnin-qa-evidence-preflight',
  'beta:tools:libass-synthetic-burnin-qa-preflight',
  'prod:beta:summary',
  'prod:readiness:command-plan',
  'prod:readiness:summary',
  'smoke:beta-readiness-deployed-evidence-input-manifest',
  'smoke:beta-readiness',
  'smoke:beta-readiness-api-deployment-preflight',
  'smoke:beta-readiness-api-staging-deploy-workflow',
  'smoke:beta-readiness-api-staging-input-discovery-blocker',
  'smoke:beta-readiness-blocker-ledger',
  'smoke:beta-readiness-external-beta-evidence-collector',
  'smoke:beta-readiness-launch-approval-evidence-cli',
  'smoke:beta-readiness-launch-approval-evidence-preflight',
  'smoke:beta-readiness-operator-status-api',
  'smoke:beta-readiness-operator-status',
  'smoke:beta-readiness-owner-command-handoff',
  'smoke:beta-readiness-paid-production-evidence-collector',
  'smoke:beta-readiness-scope-approval-evidence-cli',
  'smoke:beta-readiness-scope-approval-evidence-preflight',
  'smoke:beta-readiness-scope-approval-sequence',
  'smoke:beta-platform-staging-evidence-collector-cli',
  'smoke:beta-platform-staging-evidence-preflight',
  'smoke:beta-platform-deployed-evidence-probes',
  'smoke:beta-platform-deployed-evidence-verifier',
  'smoke:beta-platform-evidence-manifest',
  'smoke:beta-platform-monitoring-catalog',
  'smoke:beta-platform-rls-readback:sql',
  'smoke:beta-platform-stripe-boundary',
  'smoke:beta-platform-supabase-deployed-evidence-transport',
  'smoke:beta-tools-core-real-check-evidence-cli',
  'smoke:beta-tools-core-real-check-evidence-preflight',
  'smoke:beta-tools-core-real-check-preview',
  'smoke:beta-tools-libass-container-proof-preflight',
  'smoke:beta-tools-libass-synthetic-burnin-qa-evidence-cli',
  'smoke:beta-tools-libass-synthetic-burnin-qa-evidence-preflight',
  'smoke:beta-tools-libass-synthetic-burnin-qa-preflight',
  'smoke:prod-container-readiness',
  'smoke:prod-core-tool-install',
  'smoke:prod-readiness-validation',
  'smoke:prod-tool-registry',
  'smoke:tool-beta-execution-readiness',
]

export function buildBetaReadinessSourceFreshnessPreflight(env = process.env, options = {}) {
  const apiDeployPacketPath = clean(options.apiDeployPacketPath) ??
    clean(env.REEDITPRO_BETA_SOURCE_FRESHNESS_API_DEPLOY_PACKET_PATH) ??
    DEFAULT_API_DEPLOY_PACKET_PATH
  const apiDeploymentPreflightPacketPath = clean(options.apiDeploymentPreflightPacketPath) ??
    clean(env.REEDITPRO_BETA_SOURCE_FRESHNESS_API_DEPLOYMENT_PREFLIGHT_PACKET_PATH) ??
    DEFAULT_API_DEPLOYMENT_PREFLIGHT_PACKET_PATH
  const deployedEvidenceManifestPath = clean(options.deployedEvidenceManifestPath) ??
    clean(env.REEDITPRO_BETA_SOURCE_FRESHNESS_DEPLOYED_EVIDENCE_MANIFEST_PATH) ??
    DEFAULT_DEPLOYED_EVIDENCE_MANIFEST_PATH

  const apiDeployPacket = readJson(apiDeployPacketPath)
  const apiDeploymentPreflightPacket = readJson(apiDeploymentPreflightPacketPath)
  const deployedEvidenceManifest = readJson(deployedEvidenceManifestPath)

  const currentSourceSha = clean(options.currentSourceSha) ??
    clean(env.REEDITPRO_BETA_SOURCE_FRESHNESS_CURRENT_SOURCE_SHA) ??
    clean(env.REEDITPRO_BETA_CURRENT_SOURCE_SHA) ??
    resolveGitSha(options)
  const deployedSourceSha = clean(options.deployedSourceSha) ??
    clean(env.REEDITPRO_BETA_SOURCE_FRESHNESS_DEPLOYED_SOURCE_SHA) ??
    clean(env.REEDITPRO_BETA_DEPLOYED_EVIDENCE_SOURCE_SHA) ??
    clean(apiDeployPacket?.sourceTruth?.sourceSha) ??
    clean(apiDeployPacket?.deployInputs?.sourceSha) ??
    clean(apiDeploymentPreflightPacket?.sourceSha)
  const apiDeploySourceSha = clean(apiDeployPacket?.sourceTruth?.sourceSha) ?? clean(apiDeployPacket?.deployInputs?.sourceSha)
  const apiDeploymentPreflightSourceSha = clean(apiDeploymentPreflightPacket?.sourceSha)
  const manifestRecordedDeployedSourceSha =
    clean(deployedEvidenceManifest?.currentApiDeployReadback?.sourceSha) ??
    clean(deployedEvidenceManifest?.current769ApiDeployReadback?.sourceSha) ??
    clean(deployedEvidenceManifest?.current17a9ApiDeployReadback?.sourceSha) ??
    clean(deployedEvidenceManifest?.currentD997ApiDeployReadback?.sourceSha)
  const sourceShaMismatch = Boolean(currentSourceSha && deployedSourceSha && currentSourceSha !== deployedSourceSha)
  const changedFiles = sourceShaMismatch ? resolveChangedFiles(deployedSourceSha, currentSourceSha, options) : []
  const metadataOnlySourceDriftAllowed = sourceShaMismatch &&
    changedFiles.length > 0 &&
    changedFiles.every((path) => isAllowedMetadataOnlyDriftPath(path, {
      deployedSourceSha,
      currentSourceSha,
      options,
    }))
  const sourceDriftGap = sourceShaMismatch && !metadataOnlySourceDriftAllowed
    ? [`Current source SHA ${currentSourceSha} does not match deployed evidence source SHA ${deployedSourceSha}.`]
    : []

  const valueGaps = [
    ...(validSha(currentSourceSha) ? [] : ['Current source SHA is required and must be a 40-character lowercase git SHA.']),
    ...(validSha(deployedSourceSha) ? [] : ['Deployed evidence source SHA is required and must be a 40-character lowercase git SHA.']),
    ...sourceDriftGap,
    ...(apiDeploySourceSha && deployedSourceSha && apiDeploySourceSha !== deployedSourceSha
      ? [`API deploy packet source SHA ${apiDeploySourceSha} does not match deployed evidence source SHA ${deployedSourceSha}.`]
      : []),
    ...(apiDeploymentPreflightSourceSha && deployedSourceSha && apiDeploymentPreflightSourceSha !== deployedSourceSha
      ? [`API deployment preflight source SHA ${apiDeploymentPreflightSourceSha} does not match deployed evidence source SHA ${deployedSourceSha}.`]
      : []),
    ...(manifestRecordedDeployedSourceSha && deployedSourceSha && manifestRecordedDeployedSourceSha !== deployedSourceSha
      ? [`Deployed evidence manifest readback source SHA ${manifestRecordedDeployedSourceSha} does not match deployed evidence source SHA ${deployedSourceSha}.`]
      : []),
  ]
  const readyForOwnerApprovalIntake = valueGaps.length === 0
  const readyForDeployedEvidenceInputManifest = readyForOwnerApprovalIntake
  const decision = readyForDeployedEvidenceInputManifest
    ? (metadataOnlySourceDriftAllowed
        ? 'beta_readiness_source_freshness_preflight_passed_metadata_only_source_drift'
        : PASS_DECISION)
    : BLOCKED_DECISION

  return {
    ok: true,
    preflightId: 'beta-readiness-source-freshness-preflight-2026-06-29',
    decision,
    readyForOwnerApprovalIntake,
    readyForDeployedEvidenceInputManifest,
    currentSourceSha,
    deployedSourceSha,
    sourceDriftClassification: {
      sourceShaMismatch,
      metadataOnlySourceDriftAllowed,
      changedFiles,
      allowedMetadataOnlyPathPolicy: [
        'docs/**',
        'server/smoke/**',
        'server/cli/beta-readiness-source-freshness-preflight.mjs',
        'server/cli/beta-readiness-owner-approval-packet.mjs',
        'server/cli/beta-readiness-owner-approval-intake-preflight.mjs',
        'server/cli/beta-readiness-owner-approval-collection-handoff.mjs',
        'server/cli/beta-readiness-deployed-evidence-input-manifest.ts',
        'server/cli/beta-readiness-deployed-evidence-input-manifest.mjs',
        'server/cli/beta-readiness-node-ts-register.mjs',
        'server/cli/beta-readiness-operator-status-api.ts',
        'server/cli/beta-readiness-operator-status-api.mjs',
        'server/cli/beta-readiness-operator-status.ts',
        'server/beta-readiness/platform-evidence-manifest.ts',
        `package.json scripts only: ${ALLOWED_PACKAGE_JSON_SCRIPT_DRIFT.join(', ')}`,
      ],
      blockingChangedFiles: changedFiles.filter((path) => !isAllowedMetadataOnlyDriftPath(path, {
        deployedSourceSha,
        currentSourceSha,
        options,
      })),
    },
    sourceTruth: {
      sourceBranch: 'codex/sound-music-audio-1abc-checkpoint',
      apiDeployPacketPath,
      apiDeploySourceSha,
      apiDeploymentPreflightPacketPath,
      apiDeploymentPreflightSourceSha,
      deployedEvidenceManifestPath,
      manifestRecordedDeployedSourceSha,
      deployedEvidenceManifestSourceShaPolicy: clean(deployedEvidenceManifest?.sourceShaPolicy),
    },
    valueGaps,
    recommendedCommands: readyForDeployedEvidenceInputManifest ? [
      'npm run beta:readiness:owner-approval-env-template',
      'npm run beta:readiness:owner-approval-intake-preflight',
      'npm run beta:readiness:deployed-evidence-input-manifest',
      'npm run beta:readiness:external-beta-evidence-collector',
      'npm run beta:readiness:operator-status-api',
    ] : [
      'gh workflow run beta-readiness-api-staging-deploy.yml --repo yuzastudio6-cyber/Reedkt --ref codex/reeditpro-web-ui-shell --field confirm_staging_api_deploy=DEPLOY_STAGING_BETA_READINESS_API --field source_sha=$REEDITPRO_BETA_SOURCE_FRESHNESS_CURRENT_SOURCE_SHA --field image_tag=<immutable-current-source-image-tag> --field artifact_region=us-central1 --field artifact_repository=reeditpro-staging-workers --field deployer_service_account=<owner-approved-deployer-service-account> --field runtime_service_account=reeditpro-api-staging@reeditpro.iam.gserviceaccount.com --field service_name=reeditpro-api-staging',
      'npm run beta:readiness:api-deployment-preflight',
      'npm run beta:readiness:source-freshness-preflight',
      'npm run beta:readiness:owner-approval-env-template',
      'npm run beta:readiness:owner-approval-intake-preflight',
    ],
    blockedScopes: readyForDeployedEvidenceInputManifest ? [
      'external_beta_evidence_collector_until_source_freshness_owner_intake_manifest_and_operator_readback_pass',
      'real_user_media_beta_until_separate_scope_approval_evidence_passes',
      'paid_production_until_separate_paid_production_evidence_collector_passes',
    ] : [
      'deployed_evidence_input_manifest_until_current_source_matches_deploy_evidence',
      'external_beta_evidence_collector_until_source_freshness_owner_intake_manifest_and_operator_readback_pass',
      'real_user_media_beta_until_separate_scope_approval_evidence_passes',
      'paid_production_until_separate_paid_production_evidence_collector_passes',
    ],
    warnings: [
      'This preflight does not deploy, call gcloud, call the deployed backend, record evidence, run tools, process media, write Supabase/GCS, enable beta, or enable production.',
      'Owner approval notes may still be drafted, but deployment-owner acceptance and deployed evidence manifests must be rerun after source-fresh deploy evidence exists.',
      'This guard blocks runtime-affecting stale source evidence; metadata-only drift is allowed so evidence documentation does not create an intentional blanket blocker.',
    ],
  }
}

function resolveGitSha(options) {
  if (options.resolveGit === false) return undefined
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return undefined
  }
}

function resolveChangedFiles(deployedSourceSha, currentSourceSha, options) {
  if (Array.isArray(options.changedFiles)) return options.changedFiles
  if (options.resolveGit === false) return []
  if (!validSha(deployedSourceSha) || !validSha(currentSourceSha)) return []
  try {
    const output = execFileSync('git', ['diff', '--name-only', deployedSourceSha, currentSourceSha], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    return output.split('\n').map((line) => line.trim()).filter(Boolean)
  } catch {
    return []
  }
}

function isAllowedMetadataOnlyDriftPath(path, context = {}) {
  return path.startsWith('docs/') ||
    path.startsWith('server/smoke/') ||
    path === 'server/cli/beta-readiness-source-freshness-preflight.mjs' ||
    path === 'server/cli/beta-readiness-owner-approval-packet.mjs' ||
    path === 'server/cli/beta-readiness-owner-approval-intake-preflight.mjs' ||
    path === 'server/cli/beta-readiness-owner-approval-collection-handoff.mjs' ||
    path === 'server/cli/beta-readiness-deployed-evidence-input-manifest.ts' ||
    path === 'server/cli/beta-readiness-deployed-evidence-input-manifest.mjs' ||
    path === 'server/cli/beta-readiness-node-ts-register.mjs' ||
    path === 'server/cli/beta-readiness-operator-status-api.ts' ||
    path === 'server/cli/beta-readiness-operator-status-api.mjs' ||
    path === 'server/cli/beta-readiness-operator-status.ts' ||
    path === 'server/beta-readiness/platform-evidence-manifest.ts' ||
    (path === 'package.json' && isAllowedPackageJsonScriptOnlyDrift(context))
}

function isAllowedPackageJsonScriptOnlyDrift({ deployedSourceSha, currentSourceSha, options = {} }) {
  if (Array.isArray(options.packageJsonChangedScriptNames)) {
    return options.packageJsonChangedScriptNames.length > 0 &&
      options.packageJsonChangedScriptNames.every((name) => ALLOWED_PACKAGE_JSON_SCRIPT_DRIFT.includes(name))
  }
  if (options.resolveGit === false) return false
  if (!validSha(deployedSourceSha) || !validSha(currentSourceSha)) return false
  try {
    const output = execFileSync('git', ['diff', '--unified=0', '--no-ext-diff', deployedSourceSha, currentSourceSha, '--', 'package.json'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    const changedLines = output
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => (line.startsWith('+') || line.startsWith('-')) && !line.startsWith('+++') && !line.startsWith('---'))
    return changedLines.length > 0 &&
      changedLines.every((line) => ALLOWED_PACKAGE_JSON_SCRIPT_DRIFT.some((scriptName) => line.includes(`"${scriptName}"`)))
  } catch {
    return false
  }
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    return { readError: String(error?.message ?? error) }
  }
}

function validSha(value) {
  return /^[0-9a-f]{40}$/.test(value ?? '')
}

function clean(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = buildBetaReadinessSourceFreshnessPreflight(process.env)
  console.log(JSON.stringify(report, null, 2))
  if (!report.readyForDeployedEvidenceInputManifest) {
    process.exitCode = 1
  }
}
