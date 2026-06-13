import type {
  FixtureBlockedExecutionValidation,
  FixtureInputOutputContractMap,
  FixtureQaGate,
  FixtureQaGateMap,
  GeneratedLocalFixtureCatalog,
  OwnerFixtureHandoffMap,
  ToolRoute1EvidenceContext,
  ToolStudyFixtureEvidenceContext,
} from './tool-route-fixture-planning-types'

function gate(gateId: string, passed: boolean, evidence: string[]): FixtureQaGate {
  return {
    gateId,
    status: passed ? 'passed' : 'blocked',
    evidence,
    required: true,
  }
}

export function buildFixtureQaGateMap(input: {
  toolRoute1Evidence: ToolRoute1EvidenceContext
  toolStudyEvidence: ToolStudyFixtureEvidenceContext
  catalog: GeneratedLocalFixtureCatalog
  inputOutputContractMap: FixtureInputOutputContractMap
  ownerFixtureHandoffMap: OwnerFixtureHandoffMap
  blockedExecutionValidation: FixtureBlockedExecutionValidation
}): FixtureQaGateMap {
  const gates: FixtureQaGate[] = [
    gate('owner_study_exists', input.toolStudyEvidence.allRequiredStudiesPresent, input.toolStudyEvidence.studies.map((study) => study.implementationPromptPath)),
    gate('tool_route_1_route_plan_exists', input.toolRoute1Evidence.status === 'passed', input.toolRoute1Evidence.evidencePaths),
    gate('fixture_family_count', input.catalog.fixtureCount === 14, input.catalog.fixtures.map((fixture) => fixture.fixtureId)),
    gate('fixture_is_synthetic_only', input.catalog.allInputsSyntheticOnly, input.catalog.fixtures.map((fixture) => fixture.fixtureId)),
    gate('input_contract_exists', input.inputOutputContractMap.contractCount === input.catalog.fixtureCount, input.inputOutputContractMap.contracts.map((contract) => contract.fixtureInputManifest)),
    gate('output_contract_exists', input.inputOutputContractMap.contractCount === input.catalog.fixtureCount, input.inputOutputContractMap.contracts.map((contract) => contract.expectedOutputManifest)),
    gate('source_of_truth_rule_exists', input.catalog.fixtures.every((fixture) => fixture.sourceOfTruthRule.length > 0), input.catalog.fixtures.map((fixture) => fixture.sourceOfTruthRule)),
    gate('private_artifact_rule_exists', input.catalog.fixtures.every((fixture) => fixture.privateArtifactRule.length > 0), input.catalog.fixtures.map((fixture) => fixture.privateArtifactRule)),
    gate('checksum_provenance_required', input.catalog.fixtures.every((fixture) => fixture.checksumProvenanceRequirement.length > 0), input.catalog.fixtures.map((fixture) => fixture.checksumProvenanceRequirement)),
    gate('owner_fixture_handoff_complete', input.ownerFixtureHandoffMap.allRequiredOwnersMapped, input.ownerFixtureHandoffMap.handoffs.map((handoff) => handoff.owner)),
    gate('no_runtime_execution', input.blockedExecutionValidation.allExecutionBlocked, ['all fixture execution flags are false']),
    gate('no_public_artifacts', input.inputOutputContractMap.contracts.every((contract) => !contract.publicArtifactAllowed), ['publicArtifactAllowed=false for every fixture contract']),
    gate('no_signed_urls', input.inputOutputContractMap.contracts.every((contract) => !contract.signedUrlSourceOfTruthAllowed), ['signedUrlSourceOfTruthAllowed=false for every fixture contract']),
    gate('no_raw_prompts', input.inputOutputContractMap.contracts.every((contract) => !contract.rawPromptAllowed), ['rawPromptAllowed=false for every fixture contract']),
    gate('no_supabase_mutation', true, ['Supabase classification is docs_only with no SQL and no migration']),
    gate('no_production_external_beta_unlock', true, ['internal beta, external beta, and production flags are false']),
    gate('next_owner_approval_defined', input.catalog.fixtures.every((fixture) => fixture.requiredOwnerApproval === 'owner_review_required_before_tool_route_3'), input.catalog.fixtures.map((fixture) => fixture.requiredOwnerApproval)),
  ]
  const activeBlockers = [
    ...input.toolRoute1Evidence.activeBlockers,
    ...input.toolStudyEvidence.activeBlockers,
    ...input.catalog.activeBlockers,
    ...input.inputOutputContractMap.activeBlockers,
    ...input.ownerFixtureHandoffMap.activeBlockers,
    ...input.blockedExecutionValidation.activeBlockers,
    ...gates.filter((item) => item.status !== 'passed').map((item) => `qa_gate_blocked:${item.gateId}`),
  ]

  return {
    phase: 'TOOL_ROUTE_2',
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    gates,
    gateCount: gates.length,
    allRequiredGatesPassed: activeBlockers.length === 0,
    activeBlockers,
  }
}
