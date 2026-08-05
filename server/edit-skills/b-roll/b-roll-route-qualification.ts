import type { SkillJobRuntimeBindingDefinition } from '../core/edit-skill-runtime-binding'
import {
  createSkillRouteQualificationReceipt,
  type SkillRouteQualificationReceipt,
} from '../core/skill-route-qualification'
import { hashSkillValue, skillManifestReference } from '../core/skill-capability-manifest-hash'
import type { BrollGeneratedQualificationArtifact } from './b-roll-qualification-evidence'
import { BROLL_CAPABILITY_MANIFEST } from './b-roll-capability-manifest'

function bindingsFor(
  bindings: readonly SkillJobRuntimeBindingDefinition[],
  routeKey: string,
): SkillJobRuntimeBindingDefinition[] {
  return bindings.filter((binding) => binding.routeKey === routeKey)
}

function qualifiedBindings(bindings: readonly SkillJobRuntimeBindingDefinition[]) {
  return bindings.map((binding) => ({
    jobType: binding.jobType,
    operationId: binding.operationId,
    adapterClass: binding.adapterClass,
    bindingHash: binding.bindingHash,
  }))
}

export function createBrollRouteQualificationReceipts(input: {
  artifact: BrollGeneratedQualificationArtifact
  bindings: readonly SkillJobRuntimeBindingDefinition[]
}): readonly SkillRouteQualificationReceipt[] {
  const manifestRef = skillManifestReference(BROLL_CAPABILITY_MANIFEST)
  const commandById = new Map(input.artifact.commandEvidence.map((entry) => [
    entry.commandId,
    entry.evidenceHash,
  ]))
  const receipt = (
    routeKey: 'b_roll_internal_fixture_route' | 'b_roll_canonical_private_route',
    environmentClass: 'internal_fixture' | 'canonical_private',
    commandId: string,
  ) => {
    const evidenceHash = commandById.get(commandId)
    if (!evidenceHash) throw new Error(`B-Roll route evidence is missing ${commandId}.`)
    const routeBindings = bindingsFor(input.bindings, routeKey)
    if (routeBindings.length === 0) throw new Error(`B-Roll route ${routeKey} has no bindings.`)
    return createSkillRouteQualificationReceipt({
      schemaVersion: 'edit-skill-route-qualification-receipt-v1',
      manifestRef,
      skillQualificationReceiptHash: input.artifact.receipt.receiptHash,
      routeKey,
      environmentClass,
      qualificationStatus: 'internal_execution_qualified',
      qualifiedBindings: qualifiedBindings(routeBindings),
      requiredGateKeys: ['exact_skill_receipt', 'exact_runtime_binding_evidence'],
      gateEvidenceRefs: [
        {
          gateKey: 'exact_skill_receipt',
          disposition: 'passed',
          evidenceHash: input.artifact.receipt.receiptHash,
        },
        {
          gateKey: 'exact_runtime_binding_evidence',
          disposition: 'passed',
          evidenceHash,
        },
      ],
      testedCommitSha: input.artifact.testedCommitSha,
      sourceTreeHash: input.artifact.relevantSourceTreeHash,
      dependencyAuthorityHashes: input.artifact.dependencyAuthorityHashes,
      evidenceClass: environmentClass === 'internal_fixture'
        ? 'actual_fixture_adapter_evidence'
        : 'actual_canonical_private_evidence',
      fixtureEvidenceOnly: environmentClass === 'internal_fixture',
      qualificationCandidateOnly: false,
      providerRequestCount: 0,
      gpuExecutionCount: 0,
      productionWorkerObserved: false,
    })
  }
  return [
    receipt(
      'b_roll_internal_fixture_route',
      'internal_fixture',
      'npm.test:b-roll-runtime-bindings',
    ),
    receipt(
      'b_roll_canonical_private_route',
      'canonical_private',
      'npm.test:b-roll-canonical-private-runtime',
    ),
  ]
}

export function createBrollRouteQualificationCandidateReceipts(input: {
  bindings: readonly SkillJobRuntimeBindingDefinition[]
}): readonly SkillRouteQualificationReceipt[] {
  const manifestRef = skillManifestReference(BROLL_CAPABILITY_MANIFEST)
  const create = (
    routeKey: 'b_roll_internal_fixture_route' | 'b_roll_canonical_private_route',
    environmentClass: 'internal_fixture' | 'canonical_private',
  ) => {
    const routeBindings = bindingsFor(input.bindings, routeKey)
    const candidateHash = hashSkillValue({
      schemaVersion: 'b_roll_route_qualification_candidate_v1',
      manifestRef,
      routeKey,
      environmentClass,
      bindingHashes: routeBindings.map((binding) => binding.bindingHash),
    })
    return createSkillRouteQualificationReceipt({
      schemaVersion: 'edit-skill-route-qualification-receipt-v1',
      manifestRef,
      routeKey,
      environmentClass,
      qualificationStatus: 'internal_execution_qualified',
      qualifiedBindings: qualifiedBindings(routeBindings),
      requiredGateKeys: ['qualification_candidate_execution'],
      gateEvidenceRefs: [{
        gateKey: 'qualification_candidate_execution',
        disposition: 'passed',
        evidenceHash: candidateHash,
      }],
      testedCommitSha: '0000000000000000000000000000000000000000',
      sourceTreeHash: candidateHash,
      dependencyAuthorityHashes: [],
      evidenceClass: 'qualification_candidate_execution',
      fixtureEvidenceOnly: environmentClass === 'internal_fixture',
      qualificationCandidateOnly: true,
      providerRequestCount: 0,
      gpuExecutionCount: 0,
      productionWorkerObserved: false,
    })
  }
  return ([
    ['b_roll_internal_fixture_route', 'internal_fixture'],
    ['b_roll_canonical_private_route', 'canonical_private'],
  ] as const).filter(([routeKey]) =>
    bindingsFor(input.bindings, routeKey).length > 0)
    .map(([routeKey, environmentClass]) => create(routeKey, environmentClass))
}
