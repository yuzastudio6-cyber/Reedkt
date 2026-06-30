import { buildBetaReadinessExternalBetaOperatorLocalEnvPreflight } from './beta-readiness-external-beta-operator-local-env-preflight.mjs'

const READY_DECISION = 'beta_readiness_external_beta_sequence_preflight_passed_ready_for_evidence_collector'
const BLOCKED_DECISION = 'beta_readiness_external_beta_sequence_preflight_blocked_missing_or_unsafe_inputs'

export function buildBetaReadinessExternalBetaSequencePreflight(options = {}) {
  const localEnv = buildBetaReadinessExternalBetaOperatorLocalEnvPreflight({
    env: options.env ?? process.env,
    envFilePath: options.envFilePath,
    envFileContent: options.envFileContent,
    repoRoot: options.repoRoot,
    resolveGit: options.resolveGit,
  })
  const steps = [
    {
      stepId: 'operator_local_env',
      ready: localEnv.operatorInputs.pending === 0 && localEnv.safetyGaps.length === 0,
      blockers: [
        ...localEnv.operatorInputs.pendingInputNames,
        ...localEnv.safetyGaps,
      ],
    },
    {
      stepId: 'source_freshness',
      ready: localEnv.sourceFreshness.readyForDeployedEvidenceInputManifest === true,
      blockers: [
        ...localEnv.sourceFreshness.valueGaps,
        ...localEnv.sourceFreshness.blockingChangedFiles.map((file) => `blocking_source_file:${file}`),
      ],
    },
    {
      stepId: 'owner_approval_intake',
      ready: localEnv.ownerApprovalIntake.readyForDeployedEvidenceInputManifest === true,
      blockers: [
        ...localEnv.ownerApprovalIntake.pendingInputNames,
        ...localEnv.ownerApprovalIntake.invalidBooleanInputs,
        ...localEnv.ownerApprovalIntake.rejectedScopeInputs,
        ...localEnv.ownerApprovalIntake.secretLikeInputPaths,
      ],
    },
    {
      stepId: 'deployed_evidence_manifest',
      ready: localEnv.deployedEvidenceInputManifest.readyToRunExternalBetaEvidenceCollector === true,
      blockers: [
        ...localEnv.deployedEvidenceInputManifest.secretLikeInputPaths,
        ...(localEnv.deployedEvidenceInputManifest.pendingRequiredInputs > 0
          ? [`pending_required_inputs:${localEnv.deployedEvidenceInputManifest.pendingRequiredInputs}`]
          : []),
        ...(localEnv.deployedEvidenceInputManifest.valueGaps > 0
          ? [`value_gaps:${localEnv.deployedEvidenceInputManifest.valueGaps}`]
          : []),
      ],
    },
    {
      stepId: 'external_beta_evidence_collector',
      ready: localEnv.readyForExternalBetaEvidenceCollector === true,
      blockers: localEnv.readyForExternalBetaEvidenceCollector ? [] : ['collector_inputs_or_readiness_not_complete'],
    },
  ]
  const ready = steps.every((step) => step.ready)

  return {
    ok: true,
    decision: ready ? READY_DECISION : BLOCKED_DECISION,
    readyToRunExternalBetaEvidenceCollector: ready,
    envFile: localEnv.envFile,
    counts: {
      requiredOperatorInputs: localEnv.operatorInputs.required,
      pendingOperatorInputs: localEnv.operatorInputs.pending,
      humanActionablePending: localEnv.operatorInputs.humanActionablePending,
      autoFillablePending: localEnv.operatorInputs.autoFillablePending,
      ownerApprovalPending: localEnv.ownerApprovalIntake.counts.pending,
      deployedManifestPending: localEnv.deployedEvidenceInputManifest.pendingRequiredInputs,
      safetyGaps: localEnv.safetyGaps.length,
    },
    pendingGroups: localEnv.operatorInputs.pendingGroups,
    pendingValuePolicies: localEnv.operatorInputs.pendingValuePolicies,
    steps,
    pendingInputNames: localEnv.operatorInputs.pendingInputNames,
    ownerPendingInputNames: localEnv.ownerApprovalIntake.pendingInputNames,
    sourceFreshness: localEnv.sourceFreshness,
    sourceTruth: localEnv.sourceTruth,
    validationCommands: uniqueStrings([
      'npm run beta:readiness:external-beta-sequence-preflight',
      ...localEnv.validationCommands,
    ]),
    nextSafeAction: ready
      ? 'Run npm run beta:readiness:external-beta-evidence-collector from the same approved operator environment, then verify final operator-status readback.'
      : 'Fill the listed missing local operator, owner approval, technical verification, and evidence-note inputs, then rerun this sequence preflight before any deployed evidence collector.',
    blockedScopeConfirmations: localEnv.blockedScopeConfirmations,
    supabaseClassification: localEnv.supabaseClassification,
    warnings: [
      'This sequence preflight is no-network and no-write; it does not call deployed services or record evidence.',
      'It prints names, counts, readiness flags, and safety state only; it never prints bearer tokens, workspace/project values, evidence note values, signed URLs, raw prompts, private media references, or secrets.',
      'It does not grant approvals, run tools, process media, write Supabase/GCS, enable external beta, enable real-user-media beta, or enable paid production.',
    ],
  }
}

export function renderBetaReadinessExternalBetaSequencePreflightMarkdown(report) {
  const lines = [
    '# Beta Readiness External Beta Sequence Preflight',
    '',
    `Decision: \`${report.decision}\``,
    `Ready for external beta evidence collector: \`${report.readyToRunExternalBetaEvidenceCollector}\``,
    '',
    '## Counts',
    '',
    `- Required operator inputs: \`${report.counts.requiredOperatorInputs}\``,
    `- Pending operator inputs: \`${report.counts.pendingOperatorInputs}\``,
    `- Human-actionable pending: \`${report.counts.humanActionablePending}\``,
    `- Auto-fillable pending: \`${report.counts.autoFillablePending}\``,
    `- Owner approval/intake pending: \`${report.counts.ownerApprovalPending}\``,
    `- Deployed manifest pending: \`${report.counts.deployedManifestPending}\``,
    `- Safety gaps: \`${report.counts.safetyGaps}\``,
    '',
    '## Steps',
    '',
    ...report.steps.map((step) => `- \`${step.stepId}\`: ready=\`${step.ready}\`, blockers=\`${step.blockers.length}\``),
    '',
    '## Pending Inputs',
    '',
    ...report.pendingInputNames.map((name) => `- \`${name}\``),
    '',
    '## Boundary',
    '',
    'This report printed no bearer token, workspace/project value, owner evidence text, signed URL, raw prompt, private media reference, or secret value.',
    'It did not grant approval, call deployed services, record evidence, write Supabase, run SQL, write GCS, dispatch workers, call providers, process media, enable external beta, enable real-user-media beta, enable paid production, create public artifacts, or create signed URLs.',
    '',
    'Supabase classification: no write / environment none / SQL none / migration no.',
    '',
    `Next safe action: ${report.nextSafeAction}`,
  ]
  return lines.join('\n')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const markdown = process.argv.includes('--markdown')
  const report = buildBetaReadinessExternalBetaSequencePreflight()
  console.log(markdown ? renderBetaReadinessExternalBetaSequencePreflightMarkdown(report) : JSON.stringify(report, null, 2))
  if (!report.readyToRunExternalBetaEvidenceCollector) process.exitCode = 1
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]
}
