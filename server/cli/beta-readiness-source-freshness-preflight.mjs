import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const DEFAULT_API_DEPLOY_PACKET_PATH = 'docs/beta-readiness/api-staging-deploy-current-source/2026-06-29-17a9-api-staging-deploy.json'
const DEFAULT_API_DEPLOYMENT_PREFLIGHT_PACKET_PATH = 'docs/beta-readiness/api-deployment-preflight/2026-06-29-17a9-api-deployment-preflight-passed.json'
const DEFAULT_DEPLOYED_EVIDENCE_MANIFEST_PATH = 'docs/beta-readiness/deployed-evidence-input-manifest/2026-06-28-deployed-evidence-input-manifest.json'

const PASS_DECISION = 'beta_readiness_source_freshness_preflight_passed_current_source_matches_deploy_evidence'
const BLOCKED_DECISION = 'beta_readiness_source_freshness_preflight_blocked_deploy_evidence_source_stale'

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
    clean(deployedEvidenceManifest?.current17a9ApiDeployReadback?.sourceSha) ??
    clean(deployedEvidenceManifest?.currentD997ApiDeployReadback?.sourceSha)

  const valueGaps = [
    ...(validSha(currentSourceSha) ? [] : ['Current source SHA is required and must be a 40-character lowercase git SHA.']),
    ...(validSha(deployedSourceSha) ? [] : ['Deployed evidence source SHA is required and must be a 40-character lowercase git SHA.']),
    ...(currentSourceSha && deployedSourceSha && currentSourceSha !== deployedSourceSha
      ? [`Current source SHA ${currentSourceSha} does not match deployed evidence source SHA ${deployedSourceSha}.`]
      : []),
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

  return {
    ok: true,
    preflightId: 'beta-readiness-source-freshness-preflight-2026-06-29',
    decision: readyForDeployedEvidenceInputManifest ? PASS_DECISION : BLOCKED_DECISION,
    readyForOwnerApprovalIntake,
    readyForDeployedEvidenceInputManifest,
    currentSourceSha,
    deployedSourceSha,
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
    blockedScopes: [
      'deployed_evidence_input_manifest_until_current_source_matches_deploy_evidence',
      'external_beta_evidence_collector_until_source_freshness_owner_intake_manifest_and_operator_readback_pass',
      'real_user_media_beta_until_separate_scope_approval_evidence_passes',
      'paid_production_until_separate_paid_production_evidence_collector_passes',
    ],
    warnings: [
      'This preflight does not deploy, call gcloud, call the deployed backend, record evidence, run tools, process media, write Supabase/GCS, enable beta, or enable production.',
      'Owner approval notes may still be drafted, but deployment-owner acceptance and deployed evidence manifests must be rerun after source-fresh deploy evidence exists.',
      'This guard blocks only stale source evidence; it passes as soon as current source and deployed evidence source SHA match.',
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
