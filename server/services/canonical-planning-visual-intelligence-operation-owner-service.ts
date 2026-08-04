import { createHash } from 'node:crypto'

import type {
  VisualIntelligenceEvidence,
  VisualIntelligenceEvidenceRef,
  VisualIntelligencePlanningEvidenceAdmission,
  VisualIntelligencePlanningOperationInput,
  VisualIntelligenceRequest,
  VisualIntelligenceSamplingPolicy,
  VisualIntelligenceToolExecutionEvidence,
} from '../../src/types/visual-intelligence'
import { ApiError } from '../errors/api-error'
import type {
  VisualIntelligenceAdmissionVerificationPort,
  VisualIntelligenceEvidencePreparationPort,
  VisualIntelligencePreparedEvidence,
} from '../visual-intelligence/visual-intelligence-lifecycle-service'
import type {
  VisualIntelligenceAccountEffectiveCostOwner,
} from '../visual-intelligence/visual-intelligence-account-effective-cost-owner'
import {
  assertAdmittedVisualIntelligenceRuntimeRelease,
  visualIntelligenceRuntimeReleaseRef,
  type VisualIntelligenceRuntimeRelease,
} from '../visual-intelligence/visual-intelligence-runtime-release'
import {
  createProfessionalHighVisualIntelligenceQualityPolicy,
  createVisualIntelligenceEvidenceRef,
  createVisualIntelligenceRequest,
  parseVisualIntelligencePlanningOperationInput,
  parseVisualIntelligenceRequest,
  visualIntelligenceCanonicalJson,
  visualIntelligenceDigest,
} from '../visual-intelligence/visual-intelligence-contract'
import {
  getVisualIntelligenceProfileDefinition,
} from '../visual-intelligence/visual-intelligence-profile-registry'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'

export const CANONICAL_PLANNING_VISUAL_INTELLIGENCE_OPERATION_OWNER_VERSION =
  'canonical-planning-visual-intelligence-operation-owner-v1' as const

const DEFAULT_PREFIX =
  'private/visual-intelligence/v1/planning-operation-owner-inputs'
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u

export interface VisualIntelligencePlanningOperationRequestOwner {
  preparePlanningOperationRequest(
    input: VisualIntelligencePlanningOperationInput,
  ): Promise<VisualIntelligenceRequest>
}

export interface CanonicalPlanningVisualIntelligenceOperationOwner {
  readonly runtimeReleaseRef: VisualIntelligenceEvidenceRef
  readonly requestOwner: VisualIntelligencePlanningOperationRequestOwner
  readonly admissionVerificationPort:
    VisualIntelligenceAdmissionVerificationPort
  readonly evidencePreparationPort:
    VisualIntelligenceEvidencePreparationPort
}

interface VerifiedParent {
  readonly request: VisualIntelligenceRequest
  readonly admissionRef: VisualIntelligenceEvidenceRef
  readonly prepared: VisualIntelligencePreparedEvidence
}

interface PlanningOperationOwnerRecord {
  readonly schemaVersion:
    'canonical-planning-visual-intelligence-operation-owner-record-v1'
  readonly ownerVersion:
    typeof CANONICAL_PLANNING_VISUAL_INTELLIGENCE_OPERATION_OWNER_VERSION
  readonly input: VisualIntelligencePlanningOperationInput
  readonly upstreamRequestRefs: readonly VisualIntelligenceEvidenceRef[]
  readonly request: VisualIntelligenceRequest
  readonly prepared: VisualIntelligencePreparedEvidence
  readonly exactUpstreamAdmissionsRereadVerified: true
  readonly exactUpstreamArtifactAuthoritiesRereadVerified: true
  readonly accountEffectiveCostPreflightVerified: true
  readonly providerCredentialPersisted: false
  readonly publicMediaUrlPersisted: false
  readonly mediaBytesPersisted: false
  readonly callerPromptPersisted: false
  readonly callerAdmissionAccepted: false
  readonly directTimelineMutationAllowed: false
  readonly recordDigestSha256: string
}

export function createCanonicalPlanningVisualIntelligenceOperationOwner(
  input: {
    readonly upstreamAdmissionVerificationPort:
      VisualIntelligenceAdmissionVerificationPort
    readonly upstreamEvidencePreparationPort:
      VisualIntelligenceEvidencePreparationPort
    readonly costOwner: VisualIntelligenceAccountEffectiveCostOwner
    readonly runtimeRelease: VisualIntelligenceRuntimeRelease
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalPlanningVisualIntelligenceOperationOwner {
  validateDependencies(input)
  const release = assertAdmittedVisualIntelligenceRuntimeRelease(
    input.runtimeRelease,
  )
  const releaseRef = visualIntelligenceRuntimeReleaseRef(release)
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)

  const requestOwner: VisualIntelligencePlanningOperationRequestOwner =
    Object.freeze({
      async preparePlanningOperationRequest(
        untrusted: VisualIntelligencePlanningOperationInput,
      ) {
        const operationInput =
          parseVisualIntelligencePlanningOperationInput(untrusted)
        const path = recordPath(prefix, operationInput.requestId)
        const existing = await readRecord(input.objectPort, path)
        if (existing) {
          const record = parseRecord(existing)
          if (!same(record.input, operationInput)) throw conflict(
            'visual_intelligence_planning_operation_idempotency_conflict',
          )
          return record.request
        }

        const parents = await verifyParents({
          requests: [
            ...operationInput.sourceEvidenceRequests,
            ...operationInput.comparisonEvidenceRequests,
          ],
          admissionPort: input.upstreamAdmissionVerificationPort,
          evidencePort: input.upstreamEvidencePreparationPort,
          releaseRef,
        })
        const sourceParentCount = operationInput.sourceEvidenceRequests.length
        const sourceParents = parents.slice(0, sourceParentCount)
        const comparisonParents = parents.slice(sourceParentCount)
        const sourceArtifacts = sourceParents.flatMap(
          (parent) => parent.request.sourceArtifacts,
        )
        const comparisonArtifacts = comparisonParents.flatMap(
          (parent) => parent.request.sourceArtifacts,
        )
        const prepared = createPreparedEvidence({
          input: operationInput,
          sourceParents,
          comparisonParents,
        })
        validatePreparedForProfile(operationInput, parents, prepared)

        const estimatedInputTokenCount = estimateInputTokens(
          operationInput,
          sourceArtifacts.length + comparisonArtifacts.length,
        )
        const costPreflight = await input.costOwner.createPreflight({
          requestId: operationInput.requestId,
          maximumInputTokenCount: 1_048_576,
          maximumOutputAndThinkingTokenCount: 65_536,
          estimatedInputTokenCount,
          estimatedOutputAndThinkingTokenCount: 16_384,
        })
        if (
          refKey(costPreflight.accountEffectiveRateAuthorityRef)
            !== refKey(release.accountEffectivePricingAuthorityRef)
          || costPreflight.publicListPriceUsedAsSettlementAuthority
        ) throw notReady(
          'visual_intelligence_planning_operation_rate_authority_mismatch',
        )

        const upstreamRequestRefs = parents.map((parent) => ({
          id: parent.request.requestId,
          version: 1,
          contentHash: parent.request.requestDigestSha256,
        }))
        const admission = createAdmission({
          operationInput,
          parents,
          sourceArtifacts,
          comparisonArtifacts,
          costPreflight,
          releaseRef,
          upstreamRequestRefs,
        })
        const requiredEvidenceRefs = uniqueRefs(parents.flatMap(
          (parent) => parent.request.requiredEvidenceRefs,
        ))
        if (requiredEvidenceRefs.length > 512) throw notReady(
          'visual_intelligence_planning_operation_evidence_limit_exceeded',
        )
        const request = createVisualIntelligenceRequest({
          requestId: operationInput.requestId,
          idempotencyKey: operationInput.idempotencyKey,
          scope: operationInput.scope,
          operation: operationInput.operation,
          profile: operationInput.profile,
          sourceArtifacts,
          comparisonArtifacts,
          requestedRanges: operationInput.requestedRanges,
          requiredEvidenceRefs,
          expectedOutcomeRefs: operationInput.expectedOutcomeRefs,
          outputFrame: operationInput.outputFrame,
          protectedZones: operationInput.protectedZones,
          qualityPolicy:
            createProfessionalHighVisualIntelligenceQualityPolicy(),
          admission,
          callerQuestion: operationInput.callerQuestion,
          byteFreeRequest: true,
          callerPromptAccepted: false,
          providerCredentialIncluded: false,
          publicMediaUrlIncluded: false,
          signedUrlIsSourceTruth: false,
          shellCommandIncluded: false,
          providerToolDefinitionIncluded: false,
        })
        validatePreparedAgainstRequest(request, prepared)
        const withoutDigest = {
          schemaVersion:
            'canonical-planning-visual-intelligence-operation-owner-record-v1' as const,
          ownerVersion:
            CANONICAL_PLANNING_VISUAL_INTELLIGENCE_OPERATION_OWNER_VERSION,
          input: operationInput,
          upstreamRequestRefs,
          request,
          prepared,
          exactUpstreamAdmissionsRereadVerified: true as const,
          exactUpstreamArtifactAuthoritiesRereadVerified: true as const,
          accountEffectiveCostPreflightVerified: true as const,
          providerCredentialPersisted: false as const,
          publicMediaUrlPersisted: false as const,
          mediaBytesPersisted: false as const,
          callerPromptPersisted: false as const,
          callerAdmissionAccepted: false as const,
          directTimelineMutationAllowed: false as const,
        }
        const record: PlanningOperationOwnerRecord = {
          ...withoutDigest,
          recordDigestSha256: visualIntelligenceDigest(withoutDigest),
        }
        await persistRecord(input.objectPort, path, record)
        const reread = parseRecord(requireRecord(
          await readRecord(input.objectPort, path),
        ))
        if (!same(record, reread)) throw conflict(
          'visual_intelligence_planning_operation_reread_mismatch',
        )
        return reread.request
      },
    })

  const admissionVerificationPort:
  VisualIntelligenceAdmissionVerificationPort = Object.freeze({
    async verifyAndRereadExact(
      untrustedRequest: VisualIntelligenceRequest,
    ) {
      const request = parseVisualIntelligenceRequest(untrustedRequest)
      if (
        request.admission.mode !== 'planning_evidence'
        || request.operation === 'inspect_edit'
        || request.profile === 'source_edit_planning'
        || request.profile === 'reference_preference_dna'
      ) return {
        status: 'blocked' as const,
        blockerCode:
          'visual_intelligence_planning_operation_profile_invalid',
      }
      const raw = await readRecord(
        input.objectPort,
        recordPath(prefix, request.requestId),
      )
      if (!raw) return {
        status: 'blocked' as const,
        blockerCode:
          'visual_intelligence_planning_operation_owner_record_missing',
      }
      const record = parseRecord(raw)
      if (
        !same(record.request, request)
        || refKey(request.admission.providerReleaseRef)
          !== refKey(releaseRef)
      ) return {
        status: 'blocked' as const,
        blockerCode:
          'visual_intelligence_planning_operation_request_mismatch',
      }
      return {
        status: 'admitted' as const,
        admissionRef: admissionRef(record),
        providerReleaseRef: releaseRef,
        exactScopeRereadVerified: true as const,
        exactArtifactAuthorityRereadVerified: true as const,
        exactCostPreflightRereadVerified: true as const,
        killSwitchesVerifiedClosed: true as const,
        retentionPrivacyVerified: true as const,
      }
    },
  })

  const evidencePreparationPort:
  VisualIntelligenceEvidencePreparationPort = Object.freeze({
    async prepare(value: {
      readonly request: VisualIntelligenceRequest
      readonly admissionRef: VisualIntelligenceEvidenceRef
    }) {
      const request = parseVisualIntelligenceRequest(value.request)
      const record = parseRecord(requireRecord(await readRecord(
        input.objectPort,
        recordPath(prefix, request.requestId),
      )))
      if (
        !same(record.request, request)
        || refKey(value.admissionRef) !== refKey(admissionRef(record))
      ) throw notReady(
        'visual_intelligence_planning_operation_prepared_mismatch',
      )
      validatePreparedAgainstRequest(request, record.prepared)
      return deepClone(record.prepared)
    },
  })

  return Object.freeze({
    runtimeReleaseRef: releaseRef,
    requestOwner,
    admissionVerificationPort,
    evidencePreparationPort,
  })
}

async function verifyParents(input: {
  requests: readonly VisualIntelligenceRequest[]
  admissionPort: VisualIntelligenceAdmissionVerificationPort
  evidencePort: VisualIntelligenceEvidencePreparationPort
  releaseRef: VisualIntelligenceEvidenceRef
}): Promise<VerifiedParent[]> {
  const results: VerifiedParent[] = []
  for (const untrusted of input.requests) {
    const request = parseVisualIntelligenceRequest(untrusted)
    const admission = await input.admissionPort.verifyAndRereadExact(request)
    if (
      admission.status !== 'admitted'
      || !admission.admissionRef
      || !admission.providerReleaseRef
      || refKey(admission.providerReleaseRef) !== refKey(input.releaseRef)
      || admission.exactScopeRereadVerified !== true
      || admission.exactArtifactAuthorityRereadVerified !== true
      || admission.exactCostPreflightRereadVerified !== true
      || admission.killSwitchesVerifiedClosed !== true
      || admission.retentionPrivacyVerified !== true
    ) throw notReady(admission.blockerCode
      ?? 'visual_intelligence_planning_operation_parent_not_admitted')
    const prepared = await input.evidencePort.prepare({
      request,
      admissionRef: admission.admissionRef,
    })
    validateParentPrepared(request, prepared)
    results.push(Object.freeze({
      request,
      admissionRef: admission.admissionRef,
      prepared,
    }))
  }
  return results
}

function createAdmission(input: {
  operationInput: VisualIntelligencePlanningOperationInput
  parents: readonly VerifiedParent[]
  sourceArtifacts: VisualIntelligenceRequest['sourceArtifacts']
  comparisonArtifacts: VisualIntelligenceRequest['sourceArtifacts']
  costPreflight: VisualIntelligencePlanningEvidenceAdmission['costPreflight']
  releaseRef: VisualIntelligenceEvidenceRef
  upstreamRequestRefs: readonly VisualIntelligenceEvidenceRef[]
}): VisualIntelligencePlanningEvidenceAdmission {
  const binding = {
    requestId: input.operationInput.requestId,
    scope: input.operationInput.scope,
    operation: input.operationInput.operation,
    profile: input.operationInput.profile,
    upstreamRequestRefs: input.upstreamRequestRefs,
  }
  return {
    mode: 'planning_evidence',
    authenticatedPrincipalRef: createVisualIntelligenceEvidenceRef(
      `vi-derived-principal-${digestSuffix(binding)}`,
      {
        binding,
        parentRefs: input.parents.map((parent) =>
          parent.request.admission.authenticatedPrincipalRef),
      },
    ),
    workspaceAuthorizationRef: createVisualIntelligenceEvidenceRef(
      `vi-derived-workspace-${digestSuffix(binding)}`,
      {
        binding,
        parentRefs: input.parents.map((parent) =>
          parent.request.admission.workspaceAuthorizationRef),
      },
    ),
    finalizedSourceAuthorityRefs: [
      ...input.sourceArtifacts,
      ...input.comparisonArtifacts,
    ].map((artifact) => artifact.finalizedMediaAuthorityRef),
    sourceChecksumSetRef: createVisualIntelligenceEvidenceRef(
      `vi-derived-checksums-${digestSuffix(binding)}`,
      [...input.sourceArtifacts, ...input.comparisonArtifacts].map(
        (artifact) => ({
          artifactId: artifact.artifactId,
          checksumSha256: artifact.checksumSha256,
        }),
      ),
    ),
    analysisAllowanceRef: createVisualIntelligenceEvidenceRef(
      `vi-derived-allowance-${digestSuffix(binding)}`,
      {
        binding,
        parentRefs: input.parents.map((parent) =>
          planningAdmission(parent.request).analysisAllowanceRef),
      },
    ),
    costPreflight: input.costPreflight,
    retentionPolicyRef: createVisualIntelligenceEvidenceRef(
      `vi-derived-retention-${digestSuffix(binding)}`,
      {
        binding,
        parentRefs: input.parents.map((parent) =>
          parent.request.admission.retentionPolicyRef),
      },
    ),
    privacyPolicyRef: createVisualIntelligenceEvidenceRef(
      `vi-derived-privacy-${digestSuffix(binding)}`,
      {
        binding,
        parentRefs: input.parents.map((parent) =>
          parent.request.admission.privacyPolicyRef),
      },
    ),
    providerReleaseRef: input.releaseRef,
    globalKillSwitchOpen: false,
    providerKillSwitchOpen: false,
    reportPersistenceAllowed: true,
    timelineMutationAllowed: false,
    editingWorkerExecutionAllowed: false,
    generationAllowed: false,
    renderAllowed: false,
    exportAllowed: false,
    deliveryAllowed: false,
  }
}

function planningAdmission(
  request: VisualIntelligenceRequest,
): VisualIntelligencePlanningEvidenceAdmission {
  if (request.admission.mode !== 'planning_evidence') throw notReady(
    'visual_intelligence_planning_operation_parent_admission_invalid',
  )
  return request.admission
}

function createPreparedEvidence(input: {
  input: VisualIntelligencePlanningOperationInput
  sourceParents: readonly VerifiedParent[]
  comparisonParents: readonly VerifiedParent[]
}): VisualIntelligencePreparedEvidence {
  const parents = [...input.sourceParents, ...input.comparisonParents]
  const artifacts = parents.flatMap((parent) =>
    parent.request.sourceArtifacts)
  const privateMediaInputs = artifacts.map((artifact) => {
    const matches = parents.flatMap((parent) =>
      parent.prepared.privateMediaInputs).filter(
      (media) => media.artifactId === artifact.artifactId
        && media.contentType === artifact.contentType
        && media.checksumSha256 === artifact.checksumSha256,
    )
    if (matches.length !== 1) throw notReady(
      'visual_intelligence_planning_operation_media_lineage_invalid',
    )
    return matches[0]!
  })
  const deterministicEvidence = uniqueEvidence(parents.flatMap(
    (parent) => parent.prepared.deterministicEvidence,
  ))
  const toolExecutionEvidence = uniqueToolExecutions(parents.flatMap(
    (parent) => [...parent.prepared.toolExecutionEvidence],
  ))
  const conditionalToolDecisions = uniqueConditionalToolDecisions(
    parents.flatMap(
      (parent) => [...parent.prepared.conditionalToolDecisions],
    ),
  )
  const coveragePlan = createCoveragePlan(input.input, parents)
  const transcriptVersion = combinedVersion(
    'transcript',
    parents.map((parent) => parent.prepared.transcriptVersion),
  )
  const ocrVersion = combinedVersion(
    'ocr',
    parents.map((parent) => parent.prepared.ocrVersion),
  )
  const preparedBinding = {
    inputDigestSha256: input.input.inputDigestSha256,
    parentPreparedEvidenceRefs: parents.map(
      (parent) => parent.prepared.preparedEvidenceRef,
    ),
    artifacts: artifacts.map((artifact) => ({
      artifactId: artifact.artifactId,
      checksumSha256: artifact.checksumSha256,
    })),
    coveragePlan,
    transcriptVersion,
    ocrVersion,
    conditionalToolDecisions,
  }
  return deepClone({
    deterministicEvidence,
    coveragePlan,
    privateMediaInputs,
    transcriptVersion,
    ocrVersion,
    conditionalToolDecisions,
    toolExecutionEvidence,
    preparedEvidenceRef: createVisualIntelligenceEvidenceRef(
      `vi-derived-prepared-${digestSuffix(preparedBinding)}`,
      preparedBinding,
    ),
  })
}

function createCoveragePlan(
  operationInput: VisualIntelligencePlanningOperationInput,
  parents: readonly VerifiedParent[],
): VisualIntelligencePreparedEvidence['coveragePlan'] {
  const profile = getVisualIntelligenceProfileDefinition(
    operationInput.operation,
    operationInput.profile,
  )
  const sceneAware = profile.toolPolicies.some(
    (policy) => policy.tool === 'pyscenedetect'
      && policy.requirement === 'required',
  )
  const highDetail = profile.ocrPolicy === 'required_for_exact_visible_text'
    || operationInput.profile === 'inspect_transition_window'
    || operationInput.profile === 'inspect_visual_defect'
  const rate = samplingRate(operationInput.profile)
  const mode = samplingMode(operationInput.profile, sceneAware)
  const samplingPolicies: VisualIntelligenceSamplingPolicy[] =
    operationInput.requestedRanges.map((range, index) => {
      const binding = {
        inputDigestSha256: operationInput.inputDigestSha256,
        index,
        range,
        mode,
        rate,
        sceneAware,
        highDetail,
      }
      return {
        policyId:
          `vi-derived-sampling-${digestSuffix(binding)}`,
        policyVersion: 'visual-intelligence-derived-sampling-v1',
        mode,
        targetFramesPerSecondNumerator: rate.numerator,
        targetFramesPerSecondDenominator: rate.denominator,
        sceneAware,
        highDetail,
        requestedRange: range,
        analyzedRange: range,
        samplingPolicyRef: createVisualIntelligenceEvidenceRef(
          `vi-derived-sampling-ref-${digestSuffix(binding)}`,
          binding,
        ),
      }
    })
  return {
    requestedRanges: [...operationInput.requestedRanges],
    analyzedRanges: [...operationInput.requestedRanges],
    incompleteRanges: [],
    sceneBoundaryRefs: uniqueRefs(parents.flatMap(
      (parent) => parent.prepared.coveragePlan.sceneBoundaryRefs,
    )),
    samplingPolicies,
    targetedFollowupRanges: [],
    completeRequestedRangeCoverage: true,
    everyTimelineFrameInspected: false,
    completeTimePixelInspectionClaimAllowed: false,
  }
}

function validateParentPrepared(
  request: VisualIntelligenceRequest,
  prepared: VisualIntelligencePreparedEvidence,
): void {
  const artifact = request.sourceArtifacts[0]
  const media = prepared.privateMediaInputs[0]
  if (
    request.operation !== 'analyze_media'
    || request.admission.mode !== 'planning_evidence'
    || request.sourceArtifacts.length !== 1
    || request.comparisonArtifacts.length !== 0
    || !artifact
    || prepared.privateMediaInputs.length !== 1
    || !media
    || media.artifactId !== artifact.artifactId
    || media.contentType !== artifact.contentType
    || media.checksumSha256 !== artifact.checksumSha256
    || media.exactGenerationRereadVerified !== true
    || prepared.deterministicEvidence.length === 0
    || prepared.toolExecutionEvidence.some(
      (execution) => execution.substantiveCpuExecutionUsed !== false
        || execution.sourceArtifactChecksumBound !== true,
    )
  ) throw notReady(
    'visual_intelligence_planning_operation_parent_evidence_invalid',
  )
}

function validatePreparedForProfile(
  operationInput: VisualIntelligencePlanningOperationInput,
  parents: readonly VerifiedParent[],
  prepared: VisualIntelligencePreparedEvidence,
): void {
  const profile = getVisualIntelligenceProfileDefinition(
    operationInput.operation,
    operationInput.profile,
  )
  const requiredTools = profile.toolPolicies.filter(
    (policy) => policy.requirement === 'required',
  )
  if (parents.some((parent) => requiredTools.some((policy) =>
    !parent.prepared.toolExecutionEvidence.some((execution) =>
      execution.tool === policy.tool
        && execution.executionClass === policy.executionClass
        && execution.substantiveCpuExecutionUsed === false
        && execution.sourceArtifactChecksumBound === true)))) {
    throw notReady(
      'visual_intelligence_planning_operation_required_gpu_evidence_missing',
    )
  }
  if (
    (profile.transcriptPolicy === 'required_when_speech_bears_meaning'
      && prepared.transcriptVersion === null)
    || (profile.ocrPolicy === 'required_for_exact_visible_text'
      && prepared.ocrVersion === null)
  ) throw notReady(
    'visual_intelligence_planning_operation_semantic_evidence_missing',
  )
}

function validatePreparedAgainstRequest(
  request: VisualIntelligenceRequest,
  prepared: VisualIntelligencePreparedEvidence,
): void {
  const artifacts = [
    ...request.sourceArtifacts,
    ...request.comparisonArtifacts,
  ]
  if (
    prepared.privateMediaInputs.length !== artifacts.length
    || artifacts.some((artifact, index) => {
      const media = prepared.privateMediaInputs[index]
      return !media
        || media.artifactId !== artifact.artifactId
        || media.contentType !== artifact.contentType
        || media.checksumSha256 !== artifact.checksumSha256
        || media.exactGenerationRereadVerified !== true
    })
    || !same(prepared.coveragePlan.requestedRanges, request.requestedRanges)
    || !same(prepared.coveragePlan.analyzedRanges, request.requestedRanges)
    || prepared.coveragePlan.incompleteRanges.length !== 0
    || !prepared.coveragePlan.completeRequestedRangeCoverage
    || prepared.coveragePlan.everyTimelineFrameInspected
    || prepared.coveragePlan.completeTimePixelInspectionClaimAllowed
    || request.requiredEvidenceRefs.some((required) =>
      !prepared.deterministicEvidence.some((actual) =>
        refKey(actual.evidenceRef) === refKey(required)))
  ) throw notReady(
    'visual_intelligence_planning_operation_prepared_request_mismatch',
  )
}

function samplingMode(
  profile: VisualIntelligencePlanningOperationInput['profile'],
  sceneAware: boolean,
): VisualIntelligenceSamplingPolicy['mode'] {
  if (profile === 'inspect_visual_defect') return 'high_frequency_defect'
  if (profile === 'inspect_transition_window') return 'transition_detail'
  if (profile === 'explain_visible_action') return 'fast_motion'
  if (profile === 'source_vs_preview'
    || profile === 'preview_vs_revised_preview'
    || profile === 'expected_vs_rendered_motion'
    || profile === 'before_vs_after_composite'
    || profile === 'before_vs_after_color'
    || profile === 'aspect_ratio_source_vs_adaptation'
    || profile === 'reference_principles_vs_target_adaptation') {
    return 'moderate_visual_change'
  }
  return sceneAware
    ? 'scene_aware_complete_coverage'
    : 'general_overview'
}

function samplingRate(
  profile: VisualIntelligencePlanningOperationInput['profile'],
): { numerator: number; denominator: number } {
  if (profile === 'inspect_visual_defect') return { numerator: 24, denominator: 1 }
  if (profile === 'inspect_transition_window') return { numerator: 12, denominator: 1 }
  if (profile === 'explain_visible_action') return { numerator: 8, denominator: 1 }
  if (profile === 'verify_screen_text') return { numerator: 4, denominator: 1 }
  return { numerator: 2, denominator: 1 }
}

function combinedVersion(
  kind: 'transcript' | 'ocr',
  values: readonly (string | null)[],
): string | null {
  const present = values.filter((value): value is string => value !== null)
  if (present.length === 0) return null
  if (present.length === values.length && new Set(present).size === 1) {
    return present[0]!
  }
  return `derived-${kind}-${visualIntelligenceDigest(values).slice(7, 39)}`
}

function uniqueEvidence(
  values: readonly VisualIntelligenceEvidence[],
): VisualIntelligenceEvidence[] {
  const byRef = new Map<string, VisualIntelligenceEvidence>()
  for (const value of values) {
    const key = refKey(value.evidenceRef)
    const existing = byRef.get(key)
    if (existing && !same(existing, value)) throw conflict(
      'visual_intelligence_planning_operation_evidence_ref_collision',
    )
    byRef.set(key, value)
  }
  return [...byRef.values()]
}

function uniqueToolExecutions(
  values: readonly VisualIntelligenceToolExecutionEvidence[],
): VisualIntelligenceToolExecutionEvidence[] {
  const byRef = new Map<string, VisualIntelligenceToolExecutionEvidence>()
  for (const value of values) {
    const key = refKey(value.executionRef)
    const existing = byRef.get(key)
    if (existing && !same(existing, value)) throw conflict(
      'visual_intelligence_planning_operation_tool_ref_collision',
    )
    byRef.set(key, value)
  }
  return [...byRef.values()]
}

function uniqueConditionalToolDecisions(
  values: VisualIntelligencePreparedEvidence['conditionalToolDecisions'],
): VisualIntelligencePreparedEvidence['conditionalToolDecisions'] {
  const byScope = new Map<string, typeof values[number]>()
  for (const value of values) {
    const key = `${value.artifactId}:${value.tool}`
    const existing = byScope.get(key)
    if (existing && !same(existing, value)) throw conflict(
      'visual_intelligence_planning_operation_conditional_decision_collision',
    )
    byScope.set(key, value)
  }
  return [...byScope.values()]
}

function uniqueRefs(
  values: readonly VisualIntelligenceEvidenceRef[],
): VisualIntelligenceEvidenceRef[] {
  return [...new Map(values.map((value) => [refKey(value), value])).values()]
}

function estimateInputTokens(
  input: VisualIntelligencePlanningOperationInput,
  artifactCount: number,
): number {
  const frameSeconds = input.requestedRanges.reduce(
    (sum, range) => sum + Math.ceil(
      (range.endFrameExclusive - range.startFrame)
        * range.frameRate.denominator / range.frameRate.numerator,
    ),
    0,
  )
  return Math.min(
    1_048_576,
    Math.max(1, frameSeconds * Math.max(1, artifactCount) * 320 + 5_000),
  )
}

function admissionRef(
  record: PlanningOperationOwnerRecord,
): VisualIntelligenceEvidenceRef {
  return createVisualIntelligenceEvidenceRef(
    `vi-derived-admission-${digestSuffix(record.request.requestId)}`,
    {
      ownerVersion: record.ownerVersion,
      inputDigestSha256: record.input.inputDigestSha256,
      upstreamRequestRefs: record.upstreamRequestRefs,
      requestDigestSha256: record.request.requestDigestSha256,
      preparedEvidenceRef: record.prepared.preparedEvidenceRef,
    },
  )
}

function parseRecord(value: unknown): PlanningOperationOwnerRecord {
  if (!isPlainRecord(value)) throw conflict(
    'visual_intelligence_planning_operation_record_invalid',
  )
  const keys = [
    'schemaVersion', 'ownerVersion', 'input', 'upstreamRequestRefs',
    'request', 'prepared', 'exactUpstreamAdmissionsRereadVerified',
    'exactUpstreamArtifactAuthoritiesRereadVerified',
    'accountEffectiveCostPreflightVerified', 'providerCredentialPersisted',
    'publicMediaUrlPersisted', 'mediaBytesPersisted',
    'callerPromptPersisted', 'callerAdmissionAccepted',
    'directTimelineMutationAllowed', 'recordDigestSha256',
  ]
  if (
    Reflect.ownKeys(value).length !== keys.length
    || keys.some((key) => !Object.hasOwn(value, key))
    || value.schemaVersion !==
      'canonical-planning-visual-intelligence-operation-owner-record-v1'
    || value.ownerVersion !==
      CANONICAL_PLANNING_VISUAL_INTELLIGENCE_OPERATION_OWNER_VERSION
    || value.exactUpstreamAdmissionsRereadVerified !== true
    || value.exactUpstreamArtifactAuthoritiesRereadVerified !== true
    || value.accountEffectiveCostPreflightVerified !== true
    || value.providerCredentialPersisted !== false
    || value.publicMediaUrlPersisted !== false
    || value.mediaBytesPersisted !== false
    || value.callerPromptPersisted !== false
    || value.callerAdmissionAccepted !== false
    || value.directTimelineMutationAllowed !== false
    || typeof value.recordDigestSha256 !== 'string'
    || value.recordDigestSha256 !== visualIntelligenceDigest(
      omitRecordDigest(value),
    )
  ) throw conflict(
    'visual_intelligence_planning_operation_record_invalid',
  )
  parseVisualIntelligencePlanningOperationInput(value.input)
  parseVisualIntelligenceRequest(value.request)
  return value as unknown as PlanningOperationOwnerRecord
}

async function persistRecord(
  port: CanonicalCreateOnlyJsonObjectPort,
  objectPath: string,
  value: unknown,
): Promise<void> {
  const body = Buffer.from(visualIntelligenceCanonicalJson(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > 16 * 1024 * 1024) {
    throw conflict('visual_intelligence_planning_operation_record_size_invalid')
  }
  await port.createOnly({
    objectPath,
    body,
    contentSha256: createHash('sha256').update(body).digest('hex'),
  })
}

async function readRecord(
  port: CanonicalCreateOnlyJsonObjectPort,
  objectPath: string,
): Promise<unknown | null> {
  const body = await port.readExact(objectPath)
  if (!body) return null
  if (body.byteLength < 2 || body.byteLength > 16 * 1024 * 1024) {
    throw conflict('visual_intelligence_planning_operation_record_size_invalid')
  }
  try {
    return JSON.parse(body.toString('utf8')) as unknown
  } catch {
    throw conflict('visual_intelligence_planning_operation_record_json_invalid')
  }
}

function validateDependencies(input: {
  upstreamAdmissionVerificationPort: VisualIntelligenceAdmissionVerificationPort
  upstreamEvidencePreparationPort: VisualIntelligenceEvidencePreparationPort
  costOwner: VisualIntelligenceAccountEffectiveCostOwner
  objectPort: CanonicalCreateOnlyJsonObjectPort
}): void {
  if (
    !input.upstreamAdmissionVerificationPort
    || typeof input.upstreamAdmissionVerificationPort.verifyAndRereadExact
      !== 'function'
    || !input.upstreamEvidencePreparationPort
    || typeof input.upstreamEvidencePreparationPort.prepare !== 'function'
    || !input.costOwner
    || typeof input.costOwner.createPreflight !== 'function'
    || !input.objectPort
    || typeof input.objectPort.createOnly !== 'function'
    || typeof input.objectPort.readExact !== 'function'
  ) throw notReady(
    'visual_intelligence_planning_operation_dependencies_invalid',
  )
}

function normalizePrefix(value: string): string {
  const normalized = value.trim().replace(/^\/+|\/+$/gu, '')
  if (
    !normalized
    || normalized.length > 400
    || normalized.includes('..')
    || normalized.includes('\\')
    || normalized.split('/').some((part) => !SAFE_ID.test(part))
  ) throw notReady('visual_intelligence_planning_operation_prefix_invalid')
  return normalized
}

function recordPath(prefix: string, requestId: string): string {
  return `${prefix}/${visualIntelligenceDigest(requestId).slice(7)}.json`
}

function omitRecordDigest(value: Record<string, unknown>): unknown {
  const result = { ...value }
  Reflect.deleteProperty(result, 'recordDigestSha256')
  return result
}

function requireRecord(value: unknown): Record<string, unknown> {
  if (!isPlainRecord(value)) throw conflict(
    'visual_intelligence_planning_operation_record_missing',
  )
  return value
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function deepClone<T>(value: T): T {
  return JSON.parse(visualIntelligenceCanonicalJson(value)) as T
}

function same(left: unknown, right: unknown): boolean {
  return visualIntelligenceCanonicalJson(left)
    === visualIntelligenceCanonicalJson(right)
}

function refKey(ref: VisualIntelligenceEvidenceRef): string {
  return `${ref.id}:${ref.version}:${ref.contentHash}`
}

function digestSuffix(value: unknown): string {
  return visualIntelligenceDigest(value).slice(7, 39)
}

function notReady(requiredGate: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'The canonical planning Visual Intelligence operation owner is not ready.',
    503,
    { requiredGate },
  )
}

function conflict(requiredGate: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'The canonical planning Visual Intelligence operation owner rejected conflicting evidence.',
    409,
    { requiredGate },
  )
}
