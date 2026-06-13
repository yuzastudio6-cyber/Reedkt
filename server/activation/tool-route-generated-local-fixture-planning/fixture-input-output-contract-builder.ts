import type {
  FixtureInputOutputContract,
  FixtureInputOutputContractMap,
  GeneratedLocalFixtureCatalog,
} from './tool-route-fixture-planning-types'

function buildContract(fixture: GeneratedLocalFixtureCatalog['fixtures'][number]): FixtureInputOutputContract {
  return {
    fixtureId: fixture.fixtureId,
    routeFamilyId: fixture.routeFamilyId,
    owner: fixture.ownerWorkstream,
    fixtureInputManifest: `${fixture.fixtureId}_input_manifest`,
    expectedOutputManifest: fixture.expectedOutputManifest,
    expectedOutputArtifactContract: fixture.expectedOutputArtifactContract,
    sourceOfTruthRule: fixture.sourceOfTruthRule,
    downstreamConsumer: 'TOOL_ROUTE_3_generated_local_fixture_contract_tests',
    checksumProvenanceRequirement: fixture.checksumProvenanceRequirement,
    privateArtifactRule: fixture.privateArtifactRule,
    publicArtifactAllowed: false,
    signedUrlSourceOfTruthAllowed: false,
    rawPromptAllowed: false,
    cleanupRollbackRequirement:
      'Fixture contract tests must remove local generated test data and leave no public artifact, signed URL, Supabase row, GCS object, or runtime side effect.',
    qaGateList: fixture.qaGates,
  }
}

export function buildFixtureInputOutputContractMap(
  catalog: GeneratedLocalFixtureCatalog,
): FixtureInputOutputContractMap {
  const contracts = catalog.fixtures.map(buildContract)
  const activeBlockers = [
    ...catalog.activeBlockers,
    ...catalog.fixtures
      .filter((fixture) => !contracts.some((contract) => contract.fixtureId === fixture.fixtureId))
      .map((fixture) => `missing_fixture_io_contract:${fixture.fixtureId}`),
    ...(contracts.every((contract) =>
      !contract.publicArtifactAllowed &&
      !contract.signedUrlSourceOfTruthAllowed &&
      !contract.rawPromptAllowed,
    )
      ? []
      : ['unsafe_fixture_io_contract_flag_detected']),
  ]

  return {
    phase: 'TOOL_ROUTE_2',
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    contracts,
    contractCount: contracts.length,
    allContractsPrivateSyntheticOnly: activeBlockers.length === 0,
    activeBlockers,
  }
}
