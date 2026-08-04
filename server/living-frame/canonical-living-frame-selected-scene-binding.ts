import type { CanonicalPlanComponentsInput } from '../validation/edit-planning-authority-schemas'
import type {
  LivingFrameCapabilityRequirement,
  LivingFrameContinuityPackRef,
  LivingFrameProfessionalSkillComponent,
  LivingFrameProfessionalSkillComponentDraft,
  LivingFrameQaCode,
  LivingFrameScenePlan,
} from '../../src/types/living-frame'
import type {
  LivingFrameSelectedSceneAdmission,
  LivingFrameSelectedSceneAuthorityExpectation,
} from '../../src/types/living-frame-selected-scene-admission'
import type {
  LivingFrameSemanticPlanProjection,
} from '../../src/types/living-frame-semantic-plan-projection'
import {
  CANONICAL_LIVING_FRAME_SELECTED_SCENE_BINDING_SOURCE,
  CANONICAL_LIVING_FRAME_SELECTED_SCENE_BINDING_VERSION,
  CANONICAL_LIVING_FRAME_SELECTED_SCENE_TREATMENTS,
  type CanonicalLivingFrameSelectedSceneBinding,
  type CanonicalLivingFrameSelectedSceneBindingAuthorityBoundary,
  type CanonicalLivingFrameSelectedSceneBindingDraft,
  type CanonicalLivingFrameSelectedSceneSelectorDecision,
  type CanonicalLivingFrameSelectedSceneTreatment,
} from '../../src/types/living-frame-selected-scene-binding'
import {
  createLivingFrameProfessionalSkillComponent,
  deriveLivingFrameEstimateInputs,
  livingFrameOutputFrameDigestProjection,
  validateLivingFrameProfessionalSkillComponent,
} from '../../src/lib/living-frame'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  revalidateCanonicalLivingFramePlanningBinding,
} from '../services/canonical-living-frame-planning-binding-service'
import {
  verifyLivingFrameSelectedSceneAdmission,
} from './living-frame-selected-scene-admission'
import {
  verifyLivingFrameSemanticPlanProjection,
} from './living-frame-semantic-plan-projection'

const SHA256 = /^[a-f0-9]{64}$/
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/

const AUTHORITY_BOUNDARY:
  CanonicalLivingFrameSelectedSceneBindingAuthorityBoundary =
  Object.freeze({
    serverDerivedPlanningComponent: true,
    selectedSceneAuthority: true,
    professionalSkillComponentProjectionAuthority: true,
    browserSelectionAuthority: false,
    rawChatAuthority: false,
    masterTimingMutationAuthority: false,
    exactFrameAuthority: false,
    soundSyncAuthority: false,
    estimateAuthority: false,
    customerCommercialAuthority: false,
    approvalAuthority: false,
    snapshotCreationAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    assetManifestAuthority: false,
    providerAuthority: false,
    toolRouteAuthority: false,
    artifactQaAuthority: false,
    rendererAuthority: false,
    remotionExecutionAuthority: false,
    privateReviewAuthority: false,
    runtimeAuthority: false,
    productionAuthority: false,
  })

export interface CompileCanonicalLivingFrameSelectedSceneBindingInput {
  readonly identity: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly handoffId: string
    readonly handoffHash: string
    readonly canonicalPlanComponentsHash: string
  }
  readonly components: CanonicalPlanComponentsInput
  readonly semanticPlanProjection: LivingFrameSemanticPlanProjection
  readonly admission: LivingFrameSelectedSceneAdmission
  readonly decision: CanonicalLivingFrameSelectedSceneSelectorDecision
}

export async function compileCanonicalLivingFrameSelectedSceneBinding(
  input: CompileCanonicalLivingFrameSelectedSceneBindingInput,
): Promise<CanonicalLivingFrameSelectedSceneBinding> {
  assertIdentity(input.identity)
  if (
    input.identity.canonicalPlanComponentsHash !==
      sha256AuthorityValue(input.components)
  ) {
    throw invalid(
      'Canonical Living Frame selected-scene binding has stale plan components.',
    )
  }
  const deferredComponent =
    await revalidateCanonicalLivingFramePlanningBinding({
      components: input.components,
    })
  if (!deferredComponent) {
    throw invalid(
      'Canonical Living Frame selected-scene binding requires the deferred parent component.',
    )
  }
  if (!(await verifyLivingFrameSemanticPlanProjection(
    input.semanticPlanProjection,
  ))) {
    throw invalid(
      'Canonical Living Frame selected-scene semantic projection is invalid.',
    )
  }
  if (!(await verifyLivingFrameSelectedSceneAdmission({
    admission: input.admission,
    semanticPlanProjection: input.semanticPlanProjection,
  }))) {
    throw invalid(
      'Canonical Living Frame selected-scene admission is invalid.',
    )
  }
  assertSourceLineage({
    ...input,
    deferredComponent,
  })

  const normalizedDecision = normalizeDecision({
    admission: input.admission,
    projection: input.semanticPlanProjection,
    decision: input.decision,
  })
  const selectedComponent = await compileSelectedComponent({
    projection: input.semanticPlanProjection,
    decision: normalizedDecision,
  })
  const selectedSceneIds = new Set(
    normalizedDecision.selectedScenes.map((scene) => scene.sceneId),
  )
  const rejectedCandidateSceneIds = input.admission.candidateScenes
    .filter((scene) => !selectedSceneIds.has(scene.sceneId))
    .map((scene) => scene.sceneId)
  const draft: CanonicalLivingFrameSelectedSceneBindingDraft = {
    schemaVersion:
      CANONICAL_LIVING_FRAME_SELECTED_SCENE_BINDING_VERSION,
    source: CANONICAL_LIVING_FRAME_SELECTED_SCENE_BINDING_SOURCE,
    evidenceClass:
      'private_internal_server_derived_selected_scene_binding',
    identity: { ...input.identity },
    sourceBindings: {
      deferredLivingFrameComponentDigestSha256:
        deferredComponent.contractDigestSha256,
      semanticPlanProjectionDigestSha256:
        input.semanticPlanProjection.projectionDigestSha256,
      selectedSceneAdmissionDigestSha256:
        input.admission.admissionDigestSha256,
      semanticProposalBindingDigestSha256:
        input.semanticPlanProjection.sourceBindings
          .semanticProposalBindingDigestSha256,
      semanticRequestDigestSha256:
        input.semanticPlanProjection.sourceBindings
          .semanticRequestDigestSha256,
      semanticResultDigestSha256:
        input.semanticPlanProjection.sourceBindings
          .semanticResultDigestSha256,
      visualContinuityPackDigestSha256:
        input.semanticPlanProjection.sourceBindings
          .visualContinuityPackDigestSha256,
      confirmedOutputFrameDigestSha256:
        input.semanticPlanProjection.projectedComponent.inputBindings
          .outputFrame.expectedDigestSha256,
      currentMasterTimingDigestSha256:
        input.semanticPlanProjection.projectedComponent.inputBindings
          .masterTiming.expectedDigestSha256,
      selectorDecisionDigestSha256:
        sha256AuthorityValue(normalizedDecision),
    },
    decision: normalizedDecision,
    rejectedCandidateSceneIds,
    selectedComponent,
    selectedSceneCount: selectedComponent.scenePlans.length,
    selectedComponentCount: selectedComponent.scenePlans.reduce(
      (total, scene) => total + scene.components.length,
      0,
    ),
    deliberateNonUse:
      normalizedDecision.decision === 'deliberate_non_use',
    authorityBoundary: AUTHORITY_BOUNDARY,
    deferredParentPreserved: true,
    existingCanonicalPlanRemainsAuthority: true,
    existingMasterTimingRemainsAuthority: true,
    existingSoundSyncRemainsAuthority: true,
    existingEstimateApprovalSnapshotPipelineRemainsAuthority: true,
    existingWorkAssetQaReviewPipelineRemainsAuthority: true,
    containsRawChatTranscriptMediaBytesPathsOrUrls: false,
    containsProviderToolWorkQueueCostOrCommercialRoute: false,
    containsExecutableCodeOrCommands: false,
    subjectSpecificRouting: false,
    productionReady: false,
  }
  return {
    ...draft,
    bindingDigestSha256: sha256AuthorityValue(draft),
  }
}

export async function verifyCanonicalLivingFrameSelectedSceneBinding(input: {
  readonly binding: unknown
  readonly components: CanonicalPlanComponentsInput
  readonly semanticPlanProjection: LivingFrameSemanticPlanProjection
  readonly admission: LivingFrameSelectedSceneAdmission
}): Promise<
  | { readonly ok: true; readonly binding: CanonicalLivingFrameSelectedSceneBinding }
  | { readonly ok: false }
> {
  try {
    if (!isRecord(input.binding)) return { ok: false }
    const binding =
      input.binding as unknown as CanonicalLivingFrameSelectedSceneBinding
    if (
      binding.schemaVersion !==
        CANONICAL_LIVING_FRAME_SELECTED_SCENE_BINDING_VERSION
      || binding.source !==
        CANONICAL_LIVING_FRAME_SELECTED_SCENE_BINDING_SOURCE
      || !SHA256.test(String(binding.bindingDigestSha256))
      || !validateAuthorityBoundary(binding.authorityBoundary)
    ) return { ok: false }
    const expected =
      await compileCanonicalLivingFrameSelectedSceneBinding({
        identity: binding.identity,
        components: input.components,
        semanticPlanProjection: input.semanticPlanProjection,
        admission: input.admission,
        decision: binding.decision,
      })
    return stableAuthorityStringify(binding) ===
      stableAuthorityStringify(expected)
      ? { ok: true, binding: expected }
      : { ok: false }
  } catch {
    return { ok: false }
  }
}

function assertSourceLineage(input:
  CompileCanonicalLivingFrameSelectedSceneBindingInput & {
    readonly deferredComponent: LivingFrameProfessionalSkillComponent
  },
): void {
  const { identity, admission, semanticPlanProjection, deferredComponent } =
    input
  if (
    admission.canonicalScope.workspaceId !== identity.workspaceId
    || admission.canonicalScope.projectId !== identity.projectId
    || admission.canonicalScope.editSessionId !== identity.editSessionId
    || admission.canonicalScope.handoffId !== identity.handoffId
    || semanticPlanProjection.sourceBindings
      .deferredLivingFrameComponentDigestSha256 !==
        deferredComponent.contractDigestSha256
    || admission.sourceBindings
      .deferredLivingFrameComponentDigestSha256 !==
        deferredComponent.contractDigestSha256
    || admission.sourceBindings.semanticPlanProjectionDigestSha256 !==
      semanticPlanProjection.projectionDigestSha256
  ) {
    throw invalid(
      'Canonical Living Frame selected-scene scope or deferred-parent lineage is stale.',
    )
  }
  const expectedOutputFrameDigest = sha256AuthorityValue(
    livingFrameOutputFrameDigestProjection(input.components),
  )
  const expectedTimingDigest = sha256AuthorityValue(
    input.components.masterTimingPlan,
  )
  if (
    semanticPlanProjection.projectedComponent.inputBindings.outputFrame
      .expectedDigestSha256 !== expectedOutputFrameDigest
    || semanticPlanProjection.projectedComponent.inputBindings.masterTiming
      .expectedDigestSha256 !== expectedTimingDigest
    || admission.sourceBindings.outputFrameExpectationDigestSha256 !==
      expectedOutputFrameDigest
    || admission.sourceBindings.masterTimingExpectationDigestSha256 !==
      expectedTimingDigest
  ) {
    throw invalid(
      'Canonical Living Frame selected scene is stale for the confirmed frame or MasterTiming plan.',
    )
  }
  const expectations = new Map(
    admission.authorityExpectations.map((expectation) => [
      expectation.authorityKind,
      expectation,
    ]),
  )
  if (
    expectations.size !== admission.authorityExpectations.length
    || [...expectations.values()].some((expectation) =>
      requiredExpectation(expectation, semanticPlanProjection)
      && expectation.expectationState !== 'controlled_current_match')
    || expectations.get('canonical_planning_handoff')
      ?.authorityDigestSha256 !== identity.handoffHash
    || expectations.get('confirmed_output_frame')
      ?.authorityDigestSha256 !== expectedOutputFrameDigest
    || expectations.get('current_master_timing')
      ?.authorityDigestSha256 !== expectedTimingDigest
  ) {
    throw invalid(
      'Canonical Living Frame selected scene requires exact current server authority expectations.',
    )
  }
  if (
    admission.admissionState !==
      'candidate_ready_for_canonical_owner_decision'
    && admission.admissionState !== 'deliberate_non_use_preserved'
  ) {
    throw invalid(
      'Canonical Living Frame selected-scene admission remains blocked.',
    )
  }
}

function requiredExpectation(
  expectation: LivingFrameSelectedSceneAuthorityExpectation,
  projection: LivingFrameSemanticPlanProjection,
): boolean {
  return expectation.authorityKind !== 'visual_continuity_pack'
    || projection.sourceBindings.visualContinuityPackDigestSha256 !== null
}

function normalizeDecision(input: {
  readonly admission: LivingFrameSelectedSceneAdmission
  readonly projection: LivingFrameSemanticPlanProjection
  readonly decision: CanonicalLivingFrameSelectedSceneSelectorDecision
}): CanonicalLivingFrameSelectedSceneSelectorDecision {
  const { admission, decision } = input
  if (!isRecord(decision) || !hasExactKeys(decision, [
    'decision',
    'selectedScenes',
    'reasonCode',
  ])) throw invalid('Canonical Living Frame selector decision is invalid.')
  if (admission.deliberateNonUse) {
    if (
      decision.decision !== 'deliberate_non_use'
      || decision.selectedScenes.length !== 0
    ) {
      throw invalid(
        'Canonical Living Frame deliberate non-use cannot select scenes.',
      )
    }
    return {
      decision: 'deliberate_non_use',
      selectedScenes: [],
      reasonCode: decision.reasonCode,
    }
  }
  if (
    decision.decision !== 'selected_scenes'
    || !Array.isArray(decision.selectedScenes)
    || decision.selectedScenes.length === 0
  ) {
    throw invalid(
      'Canonical Living Frame candidate admission requires at least one selected scene.',
    )
  }
  const candidateOrder = new Map(
    admission.candidateScenes.map((scene, index) => [scene.sceneId, index]),
  )
  const seen = new Set<string>()
  const selectedScenes = decision.selectedScenes.map((choice) => {
    const treatment = isRecord(choice) ? choice.treatment : undefined
    if (
      !isRecord(choice)
      || !hasExactKeys(choice, ['sceneId', 'treatment'])
      || typeof choice.sceneId !== 'string'
      || !candidateOrder.has(choice.sceneId)
      || seen.has(choice.sceneId)
      || !isCanonicalLivingFrameSelectedSceneTreatment(treatment)
    ) {
      throw invalid(
        'Canonical Living Frame selector chose an unknown, duplicate, or invalid scene treatment.',
      )
    }
    seen.add(choice.sceneId)
    return {
      sceneId: choice.sceneId,
      treatment,
    }
  }).sort((left, right) =>
    candidateOrder.get(left.sceneId)! - candidateOrder.get(right.sceneId)!)
  return {
    decision: 'selected_scenes',
    selectedScenes,
    reasonCode: decision.reasonCode,
  }
}

async function compileSelectedComponent(input: {
  readonly projection: LivingFrameSemanticPlanProjection
  readonly decision: CanonicalLivingFrameSelectedSceneSelectorDecision
}): Promise<LivingFrameProfessionalSkillComponent> {
  const projected = input.projection.projectedComponent
  if (input.decision.decision === 'deliberate_non_use') {
    const validated = await validateLivingFrameProfessionalSkillComponent(
      projected,
    )
    if (
      !validated.ok
      || validated.component.decisionSummary.decision !== 'non_use'
      || validated.component.scenePlans.length !== 0
    ) {
      throw invalid(
        'Canonical Living Frame deliberate non-use projection is invalid.',
      )
    }
    return validated.component
  }
  const treatmentByScene = new Map(
    input.decision.selectedScenes.map((scene) => [
      scene.sceneId,
      scene.treatment,
    ]),
  )
  const selectedScenes = projected.scenePlans
    .filter((scene) => treatmentByScene.has(scene.sceneId))
    .map((scene, order): LivingFrameScenePlan => ({
      ...structuredClone(scene),
      order,
      decision: treatmentByScene.get(scene.sceneId)!,
    }))
  if (selectedScenes.length !== treatmentByScene.size) {
    throw invalid('Canonical Living Frame selected scene projection is incomplete.')
  }
  const selectedSceneIds = new Set(selectedScenes.map((scene) => scene.sceneId))
  const continuityRefIds = new Set(
    selectedScenes.flatMap((scene) => scene.continuityRefIds),
  )
  const continuityPackRefs = projected.continuityPackRefs.filter(
    (reference) => continuityRefIds.has(reference.continuityRefId),
  ).map((reference): LivingFrameContinuityPackRef => ({
    ...structuredClone(reference),
  }))
  const capabilityRequirements = projected.capabilityRequirements.flatMap(
    (requirement): LivingFrameCapabilityRequirement[] => {
      const linkedSceneIds = requirement.linkedSceneIds.filter((sceneId) =>
        selectedSceneIds.has(sceneId))
      return linkedSceneIds.length === 0 ? [] : [{
        ...structuredClone(requirement),
        linkedSceneIds,
      }]
    },
  )
  const qaExpectationCodes = uniqueQaCodes(
    selectedScenes.flatMap((scene) => [
      ...scene.qaExpectationCodes,
      ...scene.components.flatMap((component) =>
        component.qaExpectationCodes),
      ...scene.skillActivations.flatMap((activation) =>
        activation.qaExpectationCodes),
    ]),
  )
  const {
    contractDigestSha256: omittedProjectedComponentDigest,
    ...projectedDraft
  } = structuredClone(projected)
  void omittedProjectedComponentDigest
  const draft: LivingFrameProfessionalSkillComponentDraft = {
    ...projectedDraft,
    status: 'planning_only',
    decisionSummary: {
      decision: 'selected',
      reasonCode: input.decision.reasonCode,
      summary:
        `Canonical plan owner selected ${selectedScenes.length} Living Frame scene candidate(s) from current server-revalidated planning evidence.`,
      selectedMode: selectedScenes[0]!.mode,
      rejectedConcepts: structuredClone(
        projected.decisionSummary.rejectedConcepts,
      ),
    },
    scenePlans: selectedScenes,
    continuityPackRefs,
    capabilityRequirements,
    estimateInputs: deriveLivingFrameEstimateInputs({
      scenePlans: selectedScenes,
      continuityReferenceCount: continuityPackRefs.length,
      topLevelQaExpectationCount: qaExpectationCodes.length,
      motionComplexity: projected.estimateInputs.motionComplexity,
      cameraComplexity: projected.estimateInputs.cameraComplexity,
      controlledIllustrationComplexity:
        projected.estimateInputs.controlledIllustrationComplexity,
      generatedVideoExpectation:
        selectedScenes.some((scene) =>
          scene.components.some((component) =>
            component.capabilityKeys.includes(
              'bounded_video_asset_generation',
            )))
          ? projected.estimateInputs.generatedVideoExpectation
          : 'not_required',
    }),
    qaExpectationCodes,
  }
  return createLivingFrameProfessionalSkillComponent(draft)
}

function uniqueQaCodes(values: readonly LivingFrameQaCode[]):
  readonly LivingFrameQaCode[] {
  return [...new Set(values)].sort()
}

function assertIdentity(
  value: CompileCanonicalLivingFrameSelectedSceneBindingInput['identity'],
): void {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'workspaceId',
      'projectId',
      'editSessionId',
      'handoffId',
      'handoffHash',
      'canonicalPlanComponentsHash',
    ])
    || ![value.workspaceId, value.projectId, value.editSessionId, value.handoffId]
      .every((entry) => typeof entry === 'string' && SAFE_ID.test(entry))
    || !SHA256.test(String(value.handoffHash))
    || !SHA256.test(String(value.canonicalPlanComponentsHash))
  ) throw invalid('Canonical Living Frame selected-scene identity is invalid.')
}

function validateAuthorityBoundary(value: unknown): boolean {
  if (!isRecord(value)) return false
  return stableAuthorityStringify(value) ===
    stableAuthorityStringify(AUTHORITY_BOUNDARY)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return Object.keys(value).sort().join('|') === [...keys].sort().join('|')
}

function isCanonicalLivingFrameSelectedSceneTreatment(
  value: unknown,
): value is CanonicalLivingFrameSelectedSceneTreatment {
  return typeof value === 'string'
    && (CANONICAL_LIVING_FRAME_SELECTED_SCENE_TREATMENTS as readonly string[])
      .includes(value)
}

function invalid(message: string): Error {
  return new Error(message)
}
