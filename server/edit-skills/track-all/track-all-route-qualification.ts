import type { SkillJobRuntimeBindingDefinition } from '../core/edit-skill-runtime-binding'
import {
  createSkillRouteQualificationReceipt,
  type SkillRouteQualificationReceipt,
} from '../core/skill-route-qualification'
import { hashSkillValue, skillManifestReference } from '../core/skill-capability-manifest-hash'
import { TRACK_ALL_CAPABILITY_MANIFEST } from './track-all-capability-manifest'
import type { TrackAllGeneratedQualificationArtifact } from './track-all-qualification-evidence'

function qualifiedBindings(bindings: readonly SkillJobRuntimeBindingDefinition[]) {
  return bindings.map((binding) => ({
    jobType: binding.jobType,
    operationId: binding.operationId,
    adapterClass: binding.adapterClass,
    bindingHash: binding.bindingHash,
  }))
}

export function createTrackAllRouteQualificationReceipts(input: {
  artifact: TrackAllGeneratedQualificationArtifact
  bindings: readonly SkillJobRuntimeBindingDefinition[]
}): readonly SkillRouteQualificationReceipt[] {
  const manifestRef = skillManifestReference(TRACK_ALL_CAPABILITY_MANIFEST)
  const receipts: SkillRouteQualificationReceipt[] = []
  const internalRoutes = new Set(input.bindings.filter((binding) =>
    binding.environmentClass === 'internal_fixture').map((binding) => binding.routeKey))
  for (const routeKey of internalRoutes) {
    const bindings = input.bindings.filter((binding) =>
      binding.environmentClass === 'internal_fixture' && binding.routeKey === routeKey)
    const evidence = input.artifact.routeQualifications.find((route) =>
      route.routeKey === routeKey)
    if (!evidence) throw new Error(`Track All internal route evidence is missing: ${routeKey}.`)
    const blocked = evidence.qualificationStatus === 'blocked'
    receipts.push(createSkillRouteQualificationReceipt({
      schemaVersion: 'edit-skill-route-qualification-receipt-v1',
      manifestRef,
      skillQualificationReceiptHash: input.artifact.receipt.receiptHash,
      routeKey,
      environmentClass: 'internal_fixture',
      qualificationStatus: evidence.qualificationStatus,
      qualifiedBindings: qualifiedBindings(bindings),
      requiredGateKeys: ['exact_skill_receipt', 'exact_route_evidence'],
      gateEvidenceRefs: [
        {
          gateKey: 'exact_skill_receipt',
          disposition: 'passed',
          evidenceHash: input.artifact.receipt.receiptHash,
        },
        {
          gateKey: 'exact_route_evidence',
          disposition: blocked ? 'blocked' : 'passed',
          evidenceHash: evidence.routeEvidenceHash,
        },
      ],
      testedCommitSha: input.artifact.testedCommitSha,
      sourceTreeHash: input.artifact.relevantSourceTreeHash,
      dependencyAuthorityHashes: input.artifact.dependencyAuthorityHashes,
      evidenceClass: blocked
        ? 'blocked_external_evidence'
        : evidence.qualificationStatus === 'planning_qualified'
          ? 'actual_planning_evidence'
          : 'actual_fixture_adapter_evidence',
      fixtureEvidenceOnly: true,
      qualificationCandidateOnly: false,
      providerRequestCount: 0,
      gpuExecutionCount: 0,
      productionWorkerObserved: false,
    }))
  }
  const canonicalRoutes = new Set(input.bindings.filter((binding) =>
    binding.environmentClass === 'canonical_private').map((binding) => binding.routeKey))
  for (const routeKey of canonicalRoutes) {
    const bindings = input.bindings.filter((binding) =>
      binding.environmentClass === 'canonical_private' && binding.routeKey === routeKey)
    const evidence = input.artifact.routeQualifications.find((route) =>
      route.routeKey === routeKey)
    const blockedEvidenceHash = evidence?.routeEvidenceHash ?? hashSkillValue({
      routeKey,
      blocked: 'canonical_private_lifecycle_not_yet_qualified',
    })
    receipts.push(createSkillRouteQualificationReceipt({
      schemaVersion: 'edit-skill-route-qualification-receipt-v1',
      manifestRef,
      skillQualificationReceiptHash: input.artifact.receipt.receiptHash,
      routeKey,
      environmentClass: 'canonical_private',
      qualificationStatus: 'blocked',
      qualifiedBindings: qualifiedBindings(bindings),
      requiredGateKeys: ['canonical_private_public_lifecycle'],
      gateEvidenceRefs: [{
        gateKey: 'canonical_private_public_lifecycle',
        disposition: 'blocked',
        evidenceHash: blockedEvidenceHash,
      }],
      testedCommitSha: input.artifact.testedCommitSha,
      sourceTreeHash: input.artifact.relevantSourceTreeHash,
      dependencyAuthorityHashes: input.artifact.dependencyAuthorityHashes,
      evidenceClass: routeKey === 'sam3_1_masklet_route'
        ? 'blocked_external_evidence'
        : 'blocked_missing_canonical_private_evidence',
      fixtureEvidenceOnly: false,
      qualificationCandidateOnly: false,
      providerRequestCount: 0,
      gpuExecutionCount: 0,
      productionWorkerObserved: false,
    }))
  }
  return receipts
}

export function createTrackAllInternalRouteQualificationCandidateReceipts(input: {
  bindings: readonly SkillJobRuntimeBindingDefinition[]
}): readonly SkillRouteQualificationReceipt[] {
  const manifestRef = skillManifestReference(TRACK_ALL_CAPABILITY_MANIFEST)
  const routes = new Set(input.bindings.filter((binding) =>
    binding.environmentClass === 'internal_fixture').map((binding) => binding.routeKey))
  return [...routes].map((routeKey) => {
    const bindings = input.bindings.filter((binding) =>
      binding.environmentClass === 'internal_fixture' && binding.routeKey === routeKey)
    const candidateHash = hashSkillValue({
      schemaVersion: 'track_all_internal_route_qualification_candidate_v1',
      manifestRef,
      routeKey,
      bindingHashes: bindings.map((binding) => binding.bindingHash),
    })
    const blocked = routeKey === 'sam3_1_masklet_route'
    return createSkillRouteQualificationReceipt({
      schemaVersion: 'edit-skill-route-qualification-receipt-v1',
      manifestRef,
      routeKey,
      environmentClass: 'internal_fixture',
      qualificationStatus: blocked ? 'blocked' :
        routeKey === 'planning_core_route' ? 'planning_qualified' :
          'internal_execution_qualified',
      qualifiedBindings: qualifiedBindings(bindings),
      requiredGateKeys: ['qualification_candidate_execution'],
      gateEvidenceRefs: [{
        gateKey: 'qualification_candidate_execution',
        disposition: blocked ? 'blocked' : 'passed',
        evidenceHash: candidateHash,
      }],
      testedCommitSha: '0000000000000000000000000000000000000000',
      sourceTreeHash: candidateHash,
      dependencyAuthorityHashes: [],
      evidenceClass: 'qualification_candidate_execution',
      fixtureEvidenceOnly: true,
      qualificationCandidateOnly: true,
      providerRequestCount: 0,
      gpuExecutionCount: 0,
      productionWorkerObserved: false,
    })
  })
}

export function createTrackAllCanonicalRouteQualificationCandidateReceipts(input: {
  bindings: readonly SkillJobRuntimeBindingDefinition[]
}): readonly SkillRouteQualificationReceipt[] {
  const manifestRef = skillManifestReference(TRACK_ALL_CAPABILITY_MANIFEST)
  const routes = new Set(input.bindings.filter((binding) =>
    binding.environmentClass === 'canonical_private').map((binding) => binding.routeKey))
  return [...routes].map((routeKey) => {
    const bindings = input.bindings.filter((binding) =>
      binding.environmentClass === 'canonical_private' && binding.routeKey === routeKey)
    const candidateHash = hashSkillValue({
      schemaVersion: 'track_all_canonical_route_qualification_candidate_v1',
      manifestRef,
      routeKey,
      bindingHashes: bindings.map((binding) => binding.bindingHash),
      canonicalPrivateExecutionRequired: true,
    })
    const blocked = routeKey === 'sam3_1_masklet_route'
    return createSkillRouteQualificationReceipt({
      schemaVersion: 'edit-skill-route-qualification-receipt-v1',
      manifestRef,
      routeKey,
      environmentClass: 'canonical_private',
      qualificationStatus: blocked
        ? 'blocked'
        : routeKey === 'planning_core_route'
          ? 'planning_qualified'
          : 'internal_execution_qualified',
      qualifiedBindings: qualifiedBindings(bindings),
      requiredGateKeys: ['qualification_candidate_execution'],
      gateEvidenceRefs: [{
        gateKey: 'qualification_candidate_execution',
        disposition: blocked ? 'blocked' : 'passed',
        evidenceHash: candidateHash,
      }],
      testedCommitSha: '0000000000000000000000000000000000000000',
      sourceTreeHash: candidateHash,
      dependencyAuthorityHashes: [],
      evidenceClass: 'qualification_candidate_execution',
      fixtureEvidenceOnly: false,
      qualificationCandidateOnly: true,
      providerRequestCount: 0,
      gpuExecutionCount: 0,
      productionWorkerObserved: false,
    })
  })
}
