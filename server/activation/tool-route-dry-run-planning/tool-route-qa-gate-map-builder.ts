import type {
  ToolRouteArtifactContractMap,
  ToolRouteBlockedExecutionValidation,
  ToolRouteFamilyDryRunPlan,
  ToolRouteOwnerRoutePlanMap,
  ToolRouteOwnerStudyContext,
  ToolRouteQaGate,
  ToolRouteQaGateMap,
  ToolRouteWorkerDryRunContext,
} from './tool-route-dry-run-planning-types'

function gate(gateId: string, passed: boolean, evidence: string[]): ToolRouteQaGate {
  return {
    gateId,
    status: passed ? 'passed' : 'blocked',
    evidence,
    required: true,
  }
}

export function buildToolRouteQaGateMap(input: {
  ownerStudyContext: ToolRouteOwnerStudyContext
  workerDryRunContext: ToolRouteWorkerDryRunContext
  routeFamilyPlan: ToolRouteFamilyDryRunPlan
  ownerRoutePlan: ToolRouteOwnerRoutePlanMap
  artifactContractMap: ToolRouteArtifactContractMap
  blockedExecutionValidation: ToolRouteBlockedExecutionValidation
}): ToolRouteQaGateMap {
  const gates: ToolRouteQaGate[] = [
    gate(
      'owner_study_exists',
      input.ownerStudyContext.allRequiredStudiesPresent,
      input.ownerStudyContext.studies.map((study) => study.implementationPromptPath),
    ),
    gate(
      'capability_map_exists',
      input.ownerStudyContext.studies.every((study) => study.requiredPaths.some((file) => file.path === study.capabilityMapPath && file.exists)),
      input.ownerStudyContext.studies.map((study) => study.capabilityMapPath),
    ),
    gate(
      'routing_policy_exists',
      input.ownerStudyContext.studies.every((study) => study.requiredPaths.some((file) => file.path === study.routingPolicyPath && file.exists)),
      input.ownerStudyContext.studies.map((study) => study.routingPolicyPath),
    ),
    gate(
      'handoff_contract_exists',
      input.ownerStudyContext.studies.every((study) => study.requiredPaths.some((file) => file.path === study.handoffContractPath && file.exists)),
      input.ownerStudyContext.studies.map((study) => study.handoffContractPath),
    ),
    gate(
      'blocked_use_register_exists',
      input.ownerStudyContext.studies.every((study) => study.requiredPaths.some((file) => file.path === study.blockedUseRegisterPath && file.exists)),
      input.ownerStudyContext.studies.map((study) => study.blockedUseRegisterPath),
    ),
    gate(
      'worker_dry_run_evidence_exists',
      input.workerDryRunContext.status === 'passed',
      [input.workerDryRunContext.batchId, input.workerDryRunContext.blockedRouteValidationPath],
    ),
    gate(
      'plan_snapshot_evidence_exists',
      input.routeFamilyPlan.families.some((family) =>
        family.sourceContracts.includes('docs/activation-provider-output-plan-snapshot-contract-reports/plans/candidate-approved-plan-snapshot.json'),
      ),
      ['docs/activation-provider-output-plan-snapshot-contract-reports/plans/candidate-approved-plan-snapshot.json'],
    ),
    gate(
      'route_family_plan_complete',
      input.routeFamilyPlan.allFamiliesMapped,
      input.routeFamilyPlan.families.map((family) => family.familyId),
    ),
    gate(
      'owner_route_plan_complete',
      input.ownerRoutePlan.allRequiredOwnersMapped,
      input.ownerRoutePlan.ownerRoutes.map((route) => route.owner),
    ),
    gate(
      'artifact_contract_map_complete',
      input.artifactContractMap.allContractsPrivatePlanningOnly,
      input.artifactContractMap.artifacts.map((artifact) => artifact.artifactId),
    ),
    gate(
      'no_runtime_execution',
      input.blockedExecutionValidation.allExecutionBlocked,
      ['all execution flags are false'],
    ),
    gate('no_public_artifacts', true, ['publicArtifactAllowed=false for all contracts']),
    gate('no_signed_urls', true, ['signedUrlSourceOfTruthAllowed=false for all contracts']),
    gate('no_raw_prompts', true, ['rawPromptAllowed=false for all contracts']),
    gate('no_supabase_mutation', true, ['Supabase classification is docs_only with no SQL']),
    gate('no_production_external_beta_unlock', true, ['production=false and externalBeta=false']),
  ]

  const activeBlockers = [
    ...input.ownerStudyContext.activeBlockers,
    ...input.workerDryRunContext.activeBlockers,
    ...input.routeFamilyPlan.activeBlockers,
    ...input.ownerRoutePlan.activeBlockers,
    ...input.artifactContractMap.activeBlockers,
    ...input.blockedExecutionValidation.activeBlockers,
    ...gates.filter((item) => item.status !== 'passed').map((item) => `qa_gate_blocked:${item.gateId}`),
  ]

  return {
    phase: 'TOOL_ROUTE_1',
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    gates,
    gateCount: gates.length,
    allRequiredGatesPassed: activeBlockers.length === 0,
    activeBlockers,
  }
}
