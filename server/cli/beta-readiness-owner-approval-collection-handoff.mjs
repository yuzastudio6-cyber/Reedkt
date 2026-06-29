import { readFileSync } from 'node:fs'
import { buildBetaReadinessOwnerApprovalPacket } from './beta-readiness-owner-approval-packet.mjs'
import {
  buildBetaReadinessOwnerApprovalEnvTemplate,
  buildBetaReadinessOwnerApprovalIntakePreflight,
} from './beta-readiness-owner-approval-intake-preflight.mjs'

const OWNER_GAP_PACKET_PATH = 'docs/beta-readiness/deployed-evidence-input-manifest/2026-06-29-17a9-technical-inputs-owner-approval-gap.json'
const SOURCE_FRESHNESS_PACKET_PATH = 'docs/beta-readiness/source-freshness-preflight/2026-06-29-17a9-source-freshness-passed.json'
const HANDOFF_JSON_PATH = 'docs/beta-readiness/owner-approval-collection-handoff/2026-06-29-17a9-owner-approval-collection-handoff.json'
const HANDOFF_MD_PATH = 'docs/beta-readiness/owner-approval-collection-handoff/2026-06-29-17a9-owner-approval-collection-handoff.md'

export function buildBetaReadinessOwnerApprovalCollectionHandoff() {
  const packet = buildBetaReadinessOwnerApprovalPacket()
  const intake = buildBetaReadinessOwnerApprovalIntakePreflight({})
  const ownerGap = readJson(OWNER_GAP_PACKET_PATH)
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
    handoffId: 'beta-readiness-owner-approval-collection-handoff-17a9-2026-06-29',
    createdAt: '2026-06-29T01:05:00Z',
    decision: 'beta_readiness_owner_approval_collection_handoff_passed_ready_for_owner_input_collection',
    sourceTruth: {
      sourceBranch: packet.sourceTruth.sourceBranch,
      sourceSha: packet.sourceTruth.sourceSha,
      apiDeployPacket: packet.sourceTruth.currentSourceApiDeployPacket,
      apiRevision: packet.sourceTruth.normalApiRevision,
      apiDeployRunUrl: packet.sourceTruth.normalApiDeployRunUrl,
      sourceFreshnessPacket: SOURCE_FRESHNESS_PACKET_PATH,
      ownerApprovalPacket: intake.sourceTruth.ownerApprovalPacket,
      ownerGapPacket: OWNER_GAP_PACKET_PATH,
      ownerGapDecision: ownerGap.decision,
      ownerGapPendingInputCount: ownerGap.manifestResult?.pendingRequiredInputCount,
      productReadyLocalOssCount: packet.productReadyLocalOssCount,
    },
    ownerApprovalState: {
      approvalsGrantedByThisHandoff: false,
      readyForDeployedEvidenceInputManifest: false,
      pendingRequiredInputCount: intake.pendingInputs.length,
      requiredInputCount: intake.requiredInputCount,
      valueGapsInTechnicalInputs: ownerGap.manifestResult?.valueGaps?.length ?? 0,
      secretLikeInputPathsInTechnicalInputs: ownerGap.manifestResult?.secretLikeInputPaths?.length ?? 0,
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
      'npm run beta:readiness:source-freshness-preflight',
      'npm run beta:readiness:owner-approval-intake-preflight',
      'npm run beta:readiness:deployed-evidence-input-manifest',
    ],
    scopedBlockerForwardProgressPolicy: ownerGap.scopedBlockerForwardProgressPolicy,
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
    nextSafeAction: 'Owners fill the generated non-secret approval template outside source control, then run source freshness, owner approval intake preflight, and deployed evidence input manifest before any collector.',
    outputPaths: {
      json: HANDOFF_JSON_PATH,
      markdown: HANDOFF_MD_PATH,
    },
  }
}

export function renderBetaReadinessOwnerApprovalCollectionHandoffMarkdown(handoff) {
  const lines = [
    '# Beta Readiness Owner Approval Collection Handoff - 17a9',
    '',
    `Decision: \`${handoff.decision}\``,
    '',
    `Source SHA: \`${handoff.sourceTruth.sourceSha}\``,
    `API revision: \`${handoff.sourceTruth.apiRevision}\``,
    `Owner gap packet: \`${handoff.sourceTruth.ownerGapPacket}\``,
    `Owner gap decision: \`${handoff.sourceTruth.ownerGapDecision}\``,
    '',
    '## Current State',
    '',
    `- Approvals granted by this handoff: \`${handoff.ownerApprovalState.approvalsGrantedByThisHandoff}\``,
    `- Ready for deployed evidence input manifest: \`${handoff.ownerApprovalState.readyForDeployedEvidenceInputManifest}\``,
    `- Pending owner inputs: \`${handoff.ownerApprovalState.pendingRequiredInputCount}\``,
    `- Technical input value gaps: \`${handoff.ownerApprovalState.valueGapsInTechnicalInputs}\``,
    `- Technical secret-like input paths: \`${handoff.ownerApprovalState.secretLikeInputPathsInTechnicalInputs}\``,
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
    '',
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
