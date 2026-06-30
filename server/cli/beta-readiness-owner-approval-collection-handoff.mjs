import { readFileSync } from 'node:fs'
import { buildBetaReadinessOwnerApprovalPacket } from './beta-readiness-owner-approval-packet.mjs'
import {
  buildBetaReadinessOwnerApprovalEnvTemplate,
  buildBetaReadinessOwnerApprovalIntakePreflight,
} from './beta-readiness-owner-approval-intake-preflight.mjs'

const DETAILED_OWNER_GAP_PACKET_PATH = 'docs/beta-readiness/deployed-evidence-input-manifest/2026-06-30-ee177-deployed-evidence-input-manifest.json'
const CURRENT_DEPLOYED_EVIDENCE_MANIFEST_PATH = 'docs/beta-readiness/deployed-evidence-input-manifest/2026-06-30-ee177-deployed-evidence-input-manifest.json'
const SOURCE_FRESHNESS_PACKET_PATH = 'docs/beta-readiness/source-freshness-preflight/2026-06-30-ee177-source-freshness-passed.json'
const HANDOFF_JSON_PATH = 'docs/beta-readiness/owner-approval-collection-handoff/2026-06-30-ee177-owner-approval-collection-handoff.json'
const HANDOFF_MD_PATH = 'docs/beta-readiness/owner-approval-collection-handoff/2026-06-30-ee177-owner-approval-collection-handoff.md'

export function buildBetaReadinessOwnerApprovalCollectionHandoff() {
  const packet = buildBetaReadinessOwnerApprovalPacket()
  const intake = buildBetaReadinessOwnerApprovalIntakePreflight({})
  const detailedOwnerGap = readJson(DETAILED_OWNER_GAP_PACKET_PATH)
  const currentManifest = readJson(CURRENT_DEPLOYED_EVIDENCE_MANIFEST_PATH)
  const template = buildBetaReadinessOwnerApprovalEnvTemplate()
  const templateLines = template.split('\n').filter((line) => line.trim().length > 0)
  const requiredInputs = intake.requiredInputs.map((input) => ({
    name: input.name,
    group: inputGroup(input.name),
    requiredValue: input.explicitTrue !== undefined ? 'true' : '<non-secret owner evidence summary>',
    evidenceNote: input.evidenceNote,
    collectionMode: 'owner_supplied_outside_source_control',
  }))
  const groups = groupCounts(requiredInputs)

  return {
    ok: true,
    handoffId: 'beta-readiness-owner-approval-collection-handoff-ee177-2026-06-30',
    createdAt: '2026-06-30T04:13:50Z',
    decision: 'beta_readiness_owner_approval_collection_handoff_passed_ready_for_owner_input_collection',
    sourceTruth: {
      sourceBranch: packet.sourceTruth.sourceBranch,
      sourceSha: packet.sourceTruth.sourceSha,
      deployedEvidenceSourceSha: packet.sourceTruth.deployedEvidenceSourceSha,
      apiDeployPacket: packet.sourceTruth.currentSourceApiDeployPacket,
      apiRevision: packet.sourceTruth.normalApiRevision,
      apiDeployRunUrl: packet.sourceTruth.normalApiDeployRunUrl,
      sourceFreshnessPacket: SOURCE_FRESHNESS_PACKET_PATH,
      sourceFreshnessDecision: packet.sourceTruth.sourceFreshnessDecision,
      ownerApprovalPacket: intake.sourceTruth.ownerApprovalPacket,
      currentDeployedEvidenceManifest: CURRENT_DEPLOYED_EVIDENCE_MANIFEST_PATH,
      currentDeployedEvidenceManifestDecision: currentManifest.decision,
      detailedOwnerGapPacket: DETAILED_OWNER_GAP_PACKET_PATH,
      detailedOwnerGapDecision: detailedOwnerGap.decision,
      detailedOwnerGapPendingInputCount: detailedOwnerGap.manifestResult?.pendingRequiredInputCount,
      productReadyLocalOssCount: packet.productReadyLocalOssCount,
      trackBToolTotals: packet.sourceTruth.trackBToolTotals,
    },
    ownerApprovalState: {
      approvalsGrantedByThisHandoff: false,
      readyForDeployedEvidenceInputManifest: false,
      pendingRequiredInputCount: intake.pendingInputs.length,
      requiredInputCount: intake.requiredInputCount,
      valueGapsInTechnicalInputs: detailedOwnerGap.manifestResult?.valueGaps?.length ?? 0,
      secretLikeInputPathsInTechnicalInputs: detailedOwnerGap.manifestResult?.secretLikeInputPaths?.length ?? 0,
    },
    requiredInputGroups: groups,
    requiredInputs,
    redactedTemplate: {
      command: 'npm run beta:readiness:owner-approval-env-template',
      lineCount: templateLines.length,
      storesCompletedValuesInSourceControl: false,
      rejectedScopeFlagsKeptFalse: [
        'REEDITPRO_BETA_LAUNCH_APPROVE_REAL_USER_MEDIA_BETA=false',
        'REEDITPRO_BETA_LAUNCH_APPROVE_PAID_PRODUCTION=false',
        'REEDITPRO_BETA_SCOPE_APPROVE_REAL_USER_MEDIA_BETA=false',
        'REEDITPRO_BETA_SCOPE_APPROVE_PAID_PRODUCTION=false',
        'REEDITPRO_BETA_PAID_PRODUCTION_APPROVE_LAUNCH=false',
      ],
    },
    commands: [
      'npm run beta:readiness:owner-approval-env-template',
      'npm run beta:readiness:external-beta-operator-input-template -- --status',
      'npm run beta:readiness:external-beta-operator-local-env-bootstrap',
      'REEDITPRO_BETA_OPERATOR_ENV_FILE=.env.reeditpro-beta-operator.local npm run beta:readiness:external-beta-operator-value-progress -- --markdown',
      'npm run beta:readiness:external-beta-operator-autofill-env',
      'npm run beta:readiness:external-beta-operator-human-input-checklist',
      'REEDITPRO_BETA_OPERATOR_ENV_FILE=.env.reeditpro-beta-operator.local npm run beta:readiness:external-beta-operator-local-env-preflight',
      'npm run beta:readiness:external-beta-operator-input-template',
      'npm run beta:readiness:source-freshness-preflight',
      'npm run beta:readiness:owner-approval-intake-status',
      'REEDITPRO_BETA_OWNER_APPROVAL_ENV_FILE=.env.reeditpro-beta-operator.local npm run beta:readiness:owner-approval-intake-preflight',
      'npm run beta:readiness:deployed-evidence-input-manifest -- --status',
      'npm run beta:readiness:deployed-evidence-input-manifest',
      'npm run beta:tools:trackb-product-ready-deployed-evidence-collector',
    ],
    scopedBlockerForwardProgressPolicy: currentManifest.currentApiDeployReadback?.scopedBlockerForwardProgressPolicy ??
      detailedOwnerGap.scopedBlockerForwardProgressPolicy ??
      {
        intentionalBlanketBlocksAllowed: false,
        blockerScope: 'named_unsafe_action_only',
        safeBlockerReductionAllowed: true,
        blockedActionScope: [
          'external_beta_launch',
          'real_user_media_beta',
          'paid_production_launch',
          'provider_call_execution',
          'worker_dispatch',
          'supabase_write',
          'gcs_write',
          'public_artifact_delivery',
          'signed_url_delivery',
        ],
        allowedForwardProgressScopes: [
          'owner_approval_packet_collection',
          'deployed_evidence_preflight',
          'diagnostics_and_qa_packets',
          'rollback_monitoring_support_planning',
        ],
      },
    blockedScopeConfirmations: {
      approvalsForgedOrGranted: false,
      deployedBackendCalled: false,
      backendEvidenceRecorded: false,
      supabaseWritesRan: false,
      sqlRan: false,
      gcsWritesRan: false,
      providerCallsRan: false,
      workerDispatchRan: false,
      userMediaProcessed: false,
      externalBetaEnabled: false,
      realUserMediaBetaEnabled: false,
      paidProductionEnabled: false,
      publicArtifactsCreated: false,
      signedUrlsCreated: false,
    },
    supabaseClassification: packet.supabaseClassification,
    nextSafeAction: 'Owners fill the generated non-secret approval template outside source control, operators export the auto-fillable non-secret constants/idempotency keys and review the human input checklist, then run source freshness, owner approval intake status, owner approval intake preflight, and deployed evidence input manifest before any collector.',
    outputPaths: {
      json: HANDOFF_JSON_PATH,
      markdown: HANDOFF_MD_PATH,
    },
  }
}

export function renderBetaReadinessOwnerApprovalCollectionHandoffMarkdown(handoff) {
  const lines = [
    '# Beta Readiness Owner Approval Collection Handoff - ee177',
    '',
    `Decision: \`${handoff.decision}\``,
    '',
    `Source SHA: \`${handoff.sourceTruth.sourceSha}\``,
    `Deployed evidence source SHA: \`${handoff.sourceTruth.deployedEvidenceSourceSha}\``,
    `API revision: \`${handoff.sourceTruth.apiRevision}\``,
    `Current deployed evidence manifest: \`${handoff.sourceTruth.currentDeployedEvidenceManifest}\``,
    `Current deployed evidence manifest decision: \`${handoff.sourceTruth.currentDeployedEvidenceManifestDecision}\``,
    `Detailed owner gap packet: \`${handoff.sourceTruth.detailedOwnerGapPacket}\``,
    `Detailed owner gap decision: \`${handoff.sourceTruth.detailedOwnerGapDecision}\``,
    `Source freshness decision: \`${handoff.sourceTruth.sourceFreshnessDecision}\``,
    '',
    '## Current State',
    '',
    `- Approvals granted by this handoff: \`${handoff.ownerApprovalState.approvalsGrantedByThisHandoff}\``,
    `- Ready for deployed evidence input manifest: \`${handoff.ownerApprovalState.readyForDeployedEvidenceInputManifest}\``,
    `- Pending owner inputs: \`${handoff.ownerApprovalState.pendingRequiredInputCount}\``,
    `- Technical input value gaps: \`${handoff.ownerApprovalState.valueGapsInTechnicalInputs}\``,
    `- Technical secret-like input paths: \`${handoff.ownerApprovalState.secretLikeInputPathsInTechnicalInputs}\``,
    `- Track B tool totals: \`${handoff.sourceTruth.trackBToolTotals.owned} owned / ${handoff.sourceTruth.trackBToolTotals.boundedAcceptedProven} bounded accepted-proven / ${handoff.sourceTruth.trackBToolTotals.blockedNotInstalledProven} blocked-not-installed-proven / ${handoff.sourceTruth.trackBToolTotals.productReady} product-ready\``,
    '',
    '## Required Input Groups',
    '',
    `- Platform approval booleans: \`${handoff.requiredInputGroups.platformApprovalBooleans}\``,
    `- Platform attestations and evidence notes: \`${handoff.requiredInputGroups.platformAttestationsAndEvidenceNotes}\``,
    `- Launch approval booleans: \`${handoff.requiredInputGroups.launchApprovalBooleans}\``,
    `- Launch evidence notes: \`${handoff.requiredInputGroups.launchEvidenceNotes}\``,
    '',
    '## Collection Commands',
    '',
    ...handoff.commands.map((command) => `- \`${command}\``),
    '',
    'The generated template is redacted by design. Owners must fill it outside source control with non-secret approval summaries only. Completed values must not be committed.',
    '',
    '## Scoped Blocker Policy',
    '',
    `- Intentional blanket blockers allowed: \`${handoff.scopedBlockerForwardProgressPolicy.intentionalBlanketBlocksAllowed}\``,
    `- Blocker scope: \`${handoff.scopedBlockerForwardProgressPolicy.blockerScope}\``,
    `- Safe blocker reduction allowed: \`${handoff.scopedBlockerForwardProgressPolicy.safeBlockerReductionAllowed}\``,
    `- Blocked action scope: \`${handoff.scopedBlockerForwardProgressPolicy.blockedActionScope.join(', ')}\``,
    `- Allowed forward-progress scopes: \`${handoff.scopedBlockerForwardProgressPolicy.allowedForwardProgressScopes.join(', ')}\``,
    '',
    '## Boundary',
    '',
    'This handoff did not grant approvals, call the deployed backend, record evidence, write Supabase, run SQL, write GCS, dispatch workers, call providers, process media, enable external beta, enable real-user-media beta, enable paid production, create public artifacts, or create signed URLs.',
    '',
    'Supabase classification: no write / environment none / SQL none / migration no.',
    '',
    `Next safe action: ${handoff.nextSafeAction}`,
  ]
  return lines.join('\n')
}

function inputGroup(name) {
  if (name.startsWith('REEDITPRO_BETA_PLATFORM_APPROVE_')) return 'platform_approval_boolean'
  if (name.startsWith('REEDITPRO_BETA_PLATFORM_')) return 'platform_attestation_or_evidence_note'
  if (name.startsWith('REEDITPRO_BETA_LAUNCH_APPROVE_')) return 'launch_approval_boolean'
  if (name.startsWith('REEDITPRO_BETA_LAUNCH_')) return 'launch_evidence_note'
  return 'other'
}

function groupCounts(requiredInputs) {
  return {
    platformApprovalBooleans: requiredInputs.filter((input) => input.group === 'platform_approval_boolean').length,
    platformAttestationsAndEvidenceNotes: requiredInputs.filter((input) => input.group === 'platform_attestation_or_evidence_note').length,
    launchApprovalBooleans: requiredInputs.filter((input) => input.group === 'launch_approval_boolean').length,
    launchEvidenceNotes: requiredInputs.filter((input) => input.group === 'launch_evidence_note').length,
  }
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const handoff = buildBetaReadinessOwnerApprovalCollectionHandoff()
  if (process.argv.includes('--markdown')) {
    console.log(renderBetaReadinessOwnerApprovalCollectionHandoffMarkdown(handoff))
  } else {
    console.log(JSON.stringify(handoff, null, 2))
  }
}
