import type {
  LivingFrameSourceTruthMode,
} from '../../src/types/living-frame'
import type {
  LivingFrameSemanticSceneProposal,
} from '../../src/types/living-frame-semantic-reasoning-request'
import type {
  LivingFrameVisualContinuityPack,
  LivingFrameVisualContinuitySceneDesignSheet,
} from '../../src/types/living-frame-visual-continuity'
import type {
  LivingFrameControlledImageSelectedSceneContinuityExpectationKind,
  LivingFrameControlledImageSelectedSceneContinuityPackSceneBinding,
  LivingFrameControlledImageSelectedSceneVisualContinuityPackAuthority,
  LivingFrameControlledImageSelectedSceneVisualContinuityPackBinding,
  LivingFrameControlledImageSelectedSceneVisualContinuityPackBindingDraft,
  LivingFrameControlledImageSelectedSceneVisualContinuityPackBindingIssue,
  LivingFrameControlledImageSelectedSceneVisualContinuityPackBindingIssueCode,
} from '../../src/types/living-frame-controlled-image-selected-scene-visual-continuity-pack-binding'
import {
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_VISUAL_CONTINUITY_PACK_BINDING_CLASS,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_VISUAL_CONTINUITY_PACK_BINDING_ISSUE_CODES,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_VISUAL_CONTINUITY_PACK_BINDING_OPEN_GATES,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_VISUAL_CONTINUITY_PACK_BINDING_STATE,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_VISUAL_CONTINUITY_PACK_BINDING_VERSION,
} from '../../src/types/living-frame-controlled-image-selected-scene-visual-continuity-pack-binding'
import type {
  LivingFrameSelectedSceneAdmission,
} from '../../src/types/living-frame-selected-scene-admission'
import type {
  CanonicalLivingFrameSelectedSceneBinding,
} from '../../src/types/living-frame-selected-scene-binding'
import type {
  LivingFrameSemanticPlanProjection,
} from '../../src/types/living-frame-semantic-plan-projection'
import {
  type LivingFrameSemanticSceneProposalBinding,
  validateLivingFrameSemanticSceneProposalBinding,
} from '../../src/lib/living-frame/living-frame-semantic-scene-proposal-contract'
import type {
  CanonicalPlanComponentsInput,
} from '../validation/edit-planning-authority-schemas'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  verifyCanonicalLivingFrameSelectedSceneBinding,
} from './canonical-living-frame-selected-scene-binding'
import {
  LIVING_FRAME_COMFYUI_RUNTIME_CONFINEMENT_REQUIREMENT_DIGEST_SHA256,
} from './living-frame-controlled-sdxl-comfyui-canonical-mount-host-session'
import {
  verifyLivingFrameSelectedSceneAdmission,
} from './living-frame-selected-scene-admission'
import {
  verifyLivingFrameSemanticPlanProjection,
} from './living-frame-semantic-plan-projection'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const URL_OR_PATH_LIKE =
  /(?:https?:\/\/|file:\/\/|data:|javascript:|(?:^|[\s"'`])(?:\/|~\/|\.\.\/|[A-Za-z]:[\\/]))/iu
const SECRET_LIKE =
  /(?:-----BEGIN [A-Z ]+PRIVATE KEY-----|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9_-]{16,})/u

const EXACT_FACT_SAFETY_MODES =
  new Set<LivingFrameSourceTruthMode>([
    'exact_geography_verification_required',
    'exact_data_verification_required',
    'documentary_source_verification_required',
  ])

const AUTHORITY_BOUNDARY:
  LivingFrameControlledImageSelectedSceneVisualContinuityPackAuthority =
  deepFreeze({
    serverDerivedReadOnlyPackBindingCandidateAuthority: true,
    canonicalSelectedSceneMutationAuthority: false,
    visualContinuityPackCreationAuthority: false,
    immutableArtifactAuthority: false,
    referenceArtifactAuthority: false,
    semanticVisualQaAuthority: false,
    documentaryFactAuthority: false,
    sourceTruthAuthority: false,
    operationRegistryAuthority: false,
    providerAuthority: false,
    queueAuthority: false,
    dispatchAuthority: false,
    workerLeaseAuthority: false,
    runtimeAuthority: false,
    gpuAttemptAuthority: false,
    timingAuthority: false,
    soundAuthority: false,
    estimateAuthority: false,
    actualCostAuthority: false,
    customerPriceAuthority: false,
    customerCreditAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    workItemAuthority: false,
    workGraphMutationAuthority: false,
    promptMaterializationAuthority: false,
    artifactPersistenceAuthority: false,
    artifactQaAuthority: false,
    sceneEvidencePackageAuthority: false,
    assetManifestAuthority: false,
    privateReviewAuthority: false,
    renderAuthority: false,
    finalCanvasAuthority: false,
    productionAuthority: false,
  })

export interface CreateLivingFrameControlledImageSelectedSceneVisualContinuityPackBindingInput {
  readonly bindingId: string
  readonly components: CanonicalPlanComponentsInput
  readonly semanticProposalBinding:
    LivingFrameSemanticSceneProposalBinding
  readonly semanticPlanProjection: LivingFrameSemanticPlanProjection
  readonly selectedSceneAdmission: LivingFrameSelectedSceneAdmission
  readonly selectedSceneBinding:
    CanonicalLivingFrameSelectedSceneBinding
}

export class LivingFrameControlledImageSelectedSceneVisualContinuityPackBindingError
  extends Error {
  readonly issues:
    readonly LivingFrameControlledImageSelectedSceneVisualContinuityPackBindingIssue[]

  constructor(
    issues:
      readonly LivingFrameControlledImageSelectedSceneVisualContinuityPackBindingIssue[],
  ) {
    super(
      'Living Frame selected-scene visual continuity-pack binding failed.',
    )
    this.name =
      'LivingFrameControlledImageSelectedSceneVisualContinuityPackBindingError'
    this.issues = issues
  }
}

export async function compileLivingFrameControlledImageSelectedSceneVisualContinuityPackBinding(
  input:
    CreateLivingFrameControlledImageSelectedSceneVisualContinuityPackBindingInput,
): Promise<LivingFrameControlledImageSelectedSceneVisualContinuityPackBinding> {
  const prepared = await prepareInput(input)
  const {
    semanticProposalBinding,
    selectedSceneBinding,
    pack,
  } = prepared
  const selectedSceneContinuityBindings =
    selectedSceneBinding.selectedComponent.scenePlans.map((scene, order) =>
      bindSelectedScene({
        order,
        selectedSceneBinding,
        semanticProposalBinding,
        pack,
        selectedSceneId: scene.sceneId,
      }))
  const controlledReferenceViewExpectationCount =
    pack.characterSheets.reduce(
      (total, sheet) => total + sheet.referenceViews.length,
      0,
    )
  const draft:
    LivingFrameControlledImageSelectedSceneVisualContinuityPackBindingDraft =
    {
      contractVersion:
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_VISUAL_CONTINUITY_PACK_BINDING_VERSION,
      resultClass:
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_VISUAL_CONTINUITY_PACK_BINDING_CLASS,
      bindingState:
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_VISUAL_CONTINUITY_PACK_BINDING_STATE,
      bindingId:
        `living-frame.pack-binding.${
          sha256AuthorityValue({
            bindingId: input.bindingId,
            selectedSceneBindingDigestSha256:
              selectedSceneBinding.bindingDigestSha256,
            visualContinuityPackDigestSha256:
              pack.contractDigestSha256,
          }).slice(0, 24)
        }`,
      canonicalScopeDigestSha256: sha256AuthorityValue({
        workspaceId: selectedSceneBinding.identity.workspaceId,
        projectId: selectedSceneBinding.identity.projectId,
        editSessionId: selectedSceneBinding.identity.editSessionId,
        handoffId: selectedSceneBinding.identity.handoffId,
      }),
      sourceBindings: {
        canonicalPlanComponentsDigestSha256:
          sha256AuthorityValue(input.components),
        deferredLivingFrameComponentDigestSha256:
          selectedSceneBinding.sourceBindings
            .deferredLivingFrameComponentDigestSha256,
        semanticProposalBindingDigestSha256:
          semanticProposalBinding.contractDigestSha256,
        semanticRequestDigestSha256:
          semanticProposalBinding.requestContractDigestSha256,
        semanticResultDigestSha256:
          semanticProposalBinding.proposalResultDigestSha256,
        semanticPlanProjectionDigestSha256:
          input.semanticPlanProjection.projectionDigestSha256,
        selectedSceneAdmissionDigestSha256:
          input.selectedSceneAdmission.admissionDigestSha256,
        selectedSceneBindingDigestSha256:
          selectedSceneBinding.bindingDigestSha256,
        selectorDecisionDigestSha256:
          selectedSceneBinding.sourceBindings
            .selectorDecisionDigestSha256,
        visualContinuityPackDigestSha256:
          pack.contractDigestSha256,
        confirmedOutputFrameDigestSha256:
          selectedSceneBinding.sourceBindings
            .confirmedOutputFrameDigestSha256,
        currentMasterTimingDigestSha256:
          selectedSceneBinding.sourceBindings
            .currentMasterTimingDigestSha256,
      },
      packBinding: {
        visualContinuityPackDigestSha256:
          pack.contractDigestSha256,
        packCanonicalBindingsDigestSha256:
          sha256AuthorityValue(pack.canonicalBindings),
        styleBibleDigestSha256:
          sha256AuthorityValue(pack.styleBible),
        motionLanguageSheetDigestSha256:
          sha256AuthorityValue(pack.motionLanguageSheet),
        soundLanguageSheetDigestSha256:
          sha256AuthorityValue(pack.soundLanguageSheet),
        alphaEdgeRulesDigestSha256:
          sha256AuthorityValue(pack.alphaEdgeRules),
        continuityLedgerDigestSha256:
          sha256AuthorityValue(pack.continuityLedger),
        sheetDependencyGraphDigestSha256:
          sha256AuthorityValue(pack.sheetDependencies),
        expectationRefCount: pack.expectationRefs.length,
        characterSheetCount: pack.characterSheets.length,
        objectSheetCount: pack.objectSheets.length,
        environmentSheetCount: pack.environmentSheets.length,
        sceneDesignSheetCount: pack.sceneDesignSheets.length,
        continuityLedgerEntryCount: pack.continuityLedger.length,
        selectedSceneBindingCount:
          selectedSceneContinuityBindings.length,
        controlledReferenceViewExpectationCount,
        packPayloadFullyRevalidated: true,
        packPayloadEmbeddedInReceipt: false,
        immutablePackArtifactCreated: false,
        controlledReferenceViewExpectationsAreAssetEvidence: false,
        continuityLedgerEntriesAreExecutableAssetEvidence: false,
      },
      selectedSceneContinuityBindings,
      fixedRuntimeAndRegistryPolicy: {
        expectedCanonicalToolId: 'comfyui',
        expectedCanonicalOperationId:
          'tool.comfyui.generate_controlled_image.v1',
        fixedSupervisedProcessEntrypointRequired: true,
        runtimeConfinementRequirementDigestSha256:
          LIVING_FRAME_COMFYUI_RUNTIME_CONFINEMENT_REQUIREMENT_DIGEST_SHA256,
        deniedTopLevelImports: ['sam2'],
        exactModelArtifactCount: 5,
        exactModelArtifactByteLength: 11_700_367_157,
        atomicReadOnlyMountRequiredForOneAttempt: true,
        oneRequestUnitOneImageOneGpuAttemptRequired: true,
        fiveGpuCapabilityRolesCreateOneCostEvent: true,
        auraFaceCpuQaExcludedFromGpuAttempt: true,
        registryExpansionPermittedForReleasedDistinctExecutables:
          true,
        fakeIdentityForWeightAdapterLibraryPreprocessorOrCapabilityAllowed:
          false,
      },
      openGateCodes:
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_VISUAL_CONTINUITY_PACK_BINDING_OPEN_GATES,
      authorityBoundary: AUTHORITY_BOUNDARY,
      semanticProposalBindingRevalidated: true,
      semanticPlanProjectionRevalidated: true,
      selectedSceneAdmissionRevalidated: true,
      selectedSceneBindingRevalidated: true,
      fullVisualContinuityPackPayloadRevalidated: true,
      exactSelectedSceneDecisionAndDesignSheetMappingRevalidated:
        true,
      validatedPackPayloadAvailableForReadOnlyDownstreamBinding: true,
      canonicalSelectedSceneInterfaceMutated: false,
      immutablePackArtifactPersisted: false,
      canonicalReferenceArtifactResolved: false,
      semanticVisualQaExecuted: false,
      documentaryFactSafetyRevalidated: false,
      promptMaterializationChanged: false,
      operationRegistered: false,
      dispatchGranted: false,
      workerLeaseCreated: false,
      runtimeExecuted: false,
      gpuAttemptCreated: false,
      actualCostReceiptCreated: false,
      artifactPersisted: false,
      assetManifestMutated: false,
      privateReviewApproved: false,
      renderAuthorized: false,
      finalCanvasCreatedByComfyUi: false,
      containsRawPackPayloadOrSubjectSpecificSummaries: false,
      containsBytesPathUrlCredentialPromptSeedDimensionModelCommandOrEnvironment:
        false,
      containsPriceCreditServiceFeeReservationWalletOrLedgerData:
        false,
      productionReady: false,
    }
  assertSafe(draft)
  return deepFreeze({
    ...draft,
    bindingDigestSha256: sha256AuthorityValue(draft),
  })
}

export async function verifyLivingFrameControlledImageSelectedSceneVisualContinuityPackBinding(
  value: unknown,
  input:
    CreateLivingFrameControlledImageSelectedSceneVisualContinuityPackBindingInput,
): Promise<boolean> {
  try {
    const expected =
      await compileLivingFrameControlledImageSelectedSceneVisualContinuityPackBinding(
        input,
      )
    return (
      isRecord(value)
      && typeof value.bindingDigestSha256 === 'string'
      && SHA256.test(value.bindingDigestSha256)
      && value.bindingDigestSha256 ===
        sha256AuthorityValue(withoutDigest(value))
      && stableAuthorityStringify(value) ===
        stableAuthorityStringify(expected)
    )
  } catch {
    return false
  }
}

async function prepareInput(
  input:
    CreateLivingFrameControlledImageSelectedSceneVisualContinuityPackBindingInput,
): Promise<{
  readonly semanticProposalBinding:
    LivingFrameSemanticSceneProposalBinding
  readonly selectedSceneBinding:
    CanonicalLivingFrameSelectedSceneBinding
  readonly pack: LivingFrameVisualContinuityPack
}> {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'bindingId',
      'components',
      'semanticProposalBinding',
      'semanticPlanProjection',
      'selectedSceneAdmission',
      'selectedSceneBinding',
    ])
    || !SAFE_ID.test(String(input.bindingId))
  ) {
    throw invalid('input_invalid', '$')
  }
  const semanticValidation =
    await validateLivingFrameSemanticSceneProposalBinding(
      input.semanticProposalBinding,
    )
  if (!semanticValidation.ok) {
    throw invalid(
      'semantic_proposal_binding_invalid',
      '$.semanticProposalBinding',
    )
  }
  const semanticProposalBinding = semanticValidation.binding
  const pack = semanticProposalBinding.continuityPack
  if (!pack) {
    throw invalid(
      'visual_continuity_pack_missing',
      '$.semanticProposalBinding.continuityPack',
    )
  }
  if (
    !await verifyLivingFrameSemanticPlanProjection(
      input.semanticPlanProjection,
    )
  ) {
    throw invalid(
      'semantic_plan_projection_invalid',
      '$.semanticPlanProjection',
    )
  }
  if (
    !await verifyLivingFrameSelectedSceneAdmission({
      admission: input.selectedSceneAdmission,
      semanticPlanProjection: input.semanticPlanProjection,
    })
  ) {
    throw invalid(
      'selected_scene_admission_invalid',
      '$.selectedSceneAdmission',
    )
  }
  const selectedValidation =
    await verifyCanonicalLivingFrameSelectedSceneBinding({
      binding: input.selectedSceneBinding,
      components: input.components,
      semanticPlanProjection: input.semanticPlanProjection,
      admission: input.selectedSceneAdmission,
    })
  if (!selectedValidation.ok) {
    throw invalid(
      'selected_scene_binding_invalid',
      '$.selectedSceneBinding',
    )
  }
  const selectedSceneBinding = selectedValidation.binding
  assertSourceLineage({
    input,
    semanticProposalBinding,
    selectedSceneBinding,
    pack,
  })
  return {
    semanticProposalBinding,
    selectedSceneBinding,
    pack,
  }
}

function assertSourceLineage(input: {
  readonly input:
    CreateLivingFrameControlledImageSelectedSceneVisualContinuityPackBindingInput
  readonly semanticProposalBinding:
    LivingFrameSemanticSceneProposalBinding
  readonly selectedSceneBinding:
    CanonicalLivingFrameSelectedSceneBinding
  readonly pack: LivingFrameVisualContinuityPack
}): void {
  const {
    semanticProposalBinding,
    selectedSceneBinding,
    pack,
  } = input
  const identity = selectedSceneBinding.identity
  const requestBindings = semanticProposalBinding.request.canonicalBindings
  const packBindings = pack.canonicalBindings
  const expectedComponentsDigest =
    sha256AuthorityValue(input.input.components)
  const expectedCompiledIntentDigest =
    sha256AuthorityValue(input.input.components.compiledIntent)
  const expectedSourceSequenceDigest =
    sha256AuthorityValue(input.input.components.sourceSequence)
  const source = selectedSceneBinding.sourceBindings
  if (
    selectedSceneBinding.decision.decision !== 'selected_scenes'
    || selectedSceneBinding.deliberateNonUse
    || selectedSceneBinding.selectedSceneCount === 0
    || selectedSceneBinding.selectedSceneCount !==
      selectedSceneBinding.decision.selectedScenes.length
  ) {
    throw invalid(
      'selected_scene_mismatch',
      '$.selectedSceneBinding.decision',
    )
  }
  if (
    identity.canonicalPlanComponentsHash !== expectedComponentsDigest
    || source.semanticProposalBindingDigestSha256 !==
      semanticProposalBinding.contractDigestSha256
    || source.semanticRequestDigestSha256 !==
      semanticProposalBinding.requestContractDigestSha256
    || source.semanticResultDigestSha256 !==
      semanticProposalBinding.proposalResultDigestSha256
    || source.visualContinuityPackDigestSha256 !==
      pack.contractDigestSha256
    || source.semanticPlanProjectionDigestSha256 !==
      input.input.semanticPlanProjection.projectionDigestSha256
    || source.selectedSceneAdmissionDigestSha256 !==
      input.input.selectedSceneAdmission.admissionDigestSha256
    || source.selectorDecisionDigestSha256 !==
      sha256AuthorityValue(selectedSceneBinding.decision)
  ) {
    throw invalid(
      'source_lineage_mismatch',
      '$.selectedSceneBinding.sourceBindings',
    )
  }
  if (
    input.input.semanticPlanProjection.sourceBindings
      .semanticProposalBindingDigestSha256 !==
      semanticProposalBinding.contractDigestSha256
    || input.input.semanticPlanProjection.sourceBindings
      .visualContinuityPackDigestSha256 !==
      pack.contractDigestSha256
    || input.input.selectedSceneAdmission.sourceBindings
      .semanticPlanProjectionDigestSha256 !==
      input.input.semanticPlanProjection.projectionDigestSha256
    || input.input.selectedSceneAdmission.sourceBindings
      .visualContinuityPackDigestSha256 !==
      pack.contractDigestSha256
  ) {
    throw invalid(
      'source_lineage_mismatch',
      '$.semanticPlanProjection.sourceBindings',
    )
  }
  if (
    requestBindings.workspaceId !== identity.workspaceId
    || requestBindings.projectId !== identity.projectId
    || requestBindings.editSessionId !== identity.editSessionId
    || requestBindings.handoffId !== identity.handoffId
    || packBindings.workspaceId !== identity.workspaceId
    || packBindings.projectId !== identity.projectId
    || packBindings.editSessionId !== identity.editSessionId
    || packBindings.handoffId !== identity.handoffId
    || packBindings.deferredLivingFrameComponentDigestSha256 !==
      source.deferredLivingFrameComponentDigestSha256
    || packBindings.planningEvidenceBindingDigestSha256 !==
      requestBindings.visualEvidenceBindingDigestSha256
    || packBindings.compiledIntentDigestSha256 !==
      expectedCompiledIntentDigest
    || packBindings.sourceSequenceDigestSha256 !==
      expectedSourceSequenceDigest
    || packBindings.outputFrameDigestSha256 !==
      source.confirmedOutputFrameDigestSha256
  ) {
    throw invalid(
      'source_lineage_mismatch',
      '$.semanticProposalBinding.continuityPack.canonicalBindings',
    )
  }
}

function bindSelectedScene(input: {
  readonly order: number
  readonly selectedSceneBinding:
    CanonicalLivingFrameSelectedSceneBinding
  readonly semanticProposalBinding:
    LivingFrameSemanticSceneProposalBinding
  readonly pack: LivingFrameVisualContinuityPack
  readonly selectedSceneId: string
}): LivingFrameControlledImageSelectedSceneContinuityPackSceneBinding {
  const selectedScene =
    input.selectedSceneBinding.selectedComponent.scenePlans.find(
      (scene) => scene.sceneId === input.selectedSceneId,
    )
  const selectedChoice =
    input.selectedSceneBinding.decision.selectedScenes.find(
      (scene) => scene.sceneId === input.selectedSceneId,
    )
  const proposalCandidates =
    input.semanticProposalBinding.normalizedResult.sceneProposals.filter(
      (scene) => scene.sceneProposalKey === input.selectedSceneId,
    )
  if (
    !selectedScene
    || !selectedChoice
    || proposalCandidates.length !== 1
  ) {
    throw invalid(
      'selected_scene_mismatch',
      '$.selectedSceneBinding.selectedComponent.scenePlans',
    )
  }
  const proposal = proposalCandidates[0]!
  if (
    selectedScene.mode !== proposal.mode
    || selectedScene.sourceTruthMode !== proposal.sourceTruthMode
  ) {
    throw invalid(
      'cross_scene_or_pack_substitution',
      '$.semanticProposalBinding.normalizedResult.sceneProposals',
    )
  }
  const decisionMatches =
    input.semanticProposalBinding.normalizedResult.decisions.filter(
      (decision) =>
        decision.semanticDecisionKey === proposal.semanticDecisionKey
        && decision.sceneProposalKeys.includes(proposal.sceneProposalKey),
    )
  if (decisionMatches.length !== 1) {
    throw invalid(
      'semantic_decision_mismatch',
      '$.semanticProposalBinding.normalizedResult.decisions',
    )
  }
  const designSheetMatches = input.pack.sceneDesignSheets.filter(
    (sheet) =>
      sheet.semanticCandidateDecisionId === proposal.semanticDecisionKey
      && sheet.mode === proposal.mode
      && sheet.sourceTruthMode === proposal.sourceTruthMode,
  )
  if (designSheetMatches.length !== 1) {
    throw invalid(
      'scene_design_sheet_mismatch',
      '$.semanticProposalBinding.continuityPack.sceneDesignSheets',
    )
  }
  const designSheet = designSheetMatches[0]!
  const characterSheets = resolveSheets(
    designSheet.characterSheetIds,
    input.pack.characterSheets,
    'characterSheetId',
  )
  const objectSheets = resolveSheets(
    designSheet.objectSheetIds,
    input.pack.objectSheets,
    'objectSheetId',
  )
  const environmentSheets = resolveSheets(
    designSheet.environmentSheetIds,
    input.pack.environmentSheets,
    'environmentSheetId',
  )
  assertContinuityExpectationsResolved({
    proposal,
    designSheet,
    pack: input.pack,
    characterSheetCount: characterSheets.length,
    objectSheetCount: objectSheets.length,
    environmentSheetCount: environmentSheets.length,
  })
  return {
    order: input.order,
    sceneLineageDigestSha256: sha256AuthorityValue({
      selectedSceneId: selectedScene.sceneId,
      selectedTreatment: selectedChoice.treatment,
      selectedSceneComponentDigest:
        sha256AuthorityValue(selectedScene),
    }),
    semanticDecisionLineageDigestSha256:
      sha256AuthorityValue(decisionMatches[0]),
    sceneDesignSheetDigestSha256:
      sha256AuthorityValue(designSheet),
    mode: proposal.mode,
    sourceTruthMode: proposal.sourceTruthMode,
    requiredContinuityExpectationKinds: [
      ...proposal.continuityExpectationKinds,
    ],
    boundContinuityExpectationKinds: [
      ...proposal.continuityExpectationKinds,
    ],
    styleBibleDigestSha256:
      sha256AuthorityValue(input.pack.styleBible),
    characterSheetDigestsSha256:
      characterSheets.map((sheet) => sha256AuthorityValue(sheet)),
    objectSheetDigestsSha256:
      objectSheets.map((sheet) => sha256AuthorityValue(sheet)),
    environmentSheetDigestsSha256:
      environmentSheets.map((sheet) => sha256AuthorityValue(sheet)),
    motionLanguageSheetDigestSha256:
      sha256AuthorityValue(input.pack.motionLanguageSheet),
    soundLanguageSheetDigestSha256:
      sha256AuthorityValue(input.pack.soundLanguageSheet),
    alphaEdgeRulesDigestSha256:
      sha256AuthorityValue(input.pack.alphaEdgeRules),
    continuityLedgerDigestSha256:
      sha256AuthorityValue(input.pack.continuityLedger),
    controlledReferenceViewExpectationCount:
      characterSheets.reduce(
        (total, sheet) => total + sheet.referenceViews.length,
        0,
      ),
    semanticStyleContinuityQaRequired: true,
    exactDocumentaryFactSafetyBindingRequired:
      EXACT_FACT_SAFETY_MODES.has(proposal.sourceTruthMode),
    referenceViewsAreControlledUnverifiedExpectations: true,
    referenceViewsArePersistedReferenceArtifacts: false,
    referenceArtifactRequirementResolvedByThisBinding: false,
    semanticStyleQaExecuted: false,
    documentaryFactSafetyRevalidated: false,
  }
}

function resolveSheets<
  T extends Record<K, string>,
  K extends keyof T,
>(
  ids: readonly string[],
  sheets: readonly T[],
  key: K,
): T[] {
  return ids.map((id) => {
    const matches = sheets.filter((sheet) => sheet[key] === id)
    if (matches.length !== 1) {
      throw invalid(
        'continuity_expectation_unresolved',
        '$.semanticProposalBinding.continuityPack',
      )
    }
    return matches[0]!
  })
}

function assertContinuityExpectationsResolved(input: {
  readonly proposal: LivingFrameSemanticSceneProposal
  readonly designSheet: LivingFrameVisualContinuitySceneDesignSheet
  readonly pack: LivingFrameVisualContinuityPack
  readonly characterSheetCount: number
  readonly objectSheetCount: number
  readonly environmentSheetCount: number
}): void {
  const required =
    new Set<LivingFrameControlledImageSelectedSceneContinuityExpectationKind>(
      input.proposal.continuityExpectationKinds,
    )
  const unresolved =
    !required.has('style_bible')
    || (required.has('character_identity_sheet')
      && input.characterSheetCount === 0)
    || (required.has('object_identity_sheet')
      && input.objectSheetCount === 0)
    || (required.has('environment_identity_sheet')
      && input.environmentSheetCount === 0)
    || (required.has('scene_design_sheet') && !input.designSheet)
    || (required.has('motion_language_sheet')
      && !input.pack.motionLanguageSheet)
    || (required.has('sound_language_sheet')
      && !input.pack.soundLanguageSheet)
    || (required.has('alpha_edge_rules') && !input.pack.alphaEdgeRules)
    || (required.has('continuity_ledger')
      && input.pack.continuityLedger.length === 0)
  if (unresolved) {
    throw invalid(
      'continuity_expectation_unresolved',
      '$.semanticProposalBinding.normalizedResult.sceneProposals.continuityExpectationKinds',
    )
  }
}

function assertSafe(
  draft:
    LivingFrameControlledImageSelectedSceneVisualContinuityPackBindingDraft,
): void {
  const {
    serverDerivedReadOnlyPackBindingCandidateAuthority,
    ...delegatedAuthorities
  } = draft.authorityBoundary
  const serialized = stableAuthorityStringify(draft)
  if (
    !SAFE_ID.test(draft.bindingId)
    || stableAuthorityStringify(draft.openGateCodes) !==
      stableAuthorityStringify(
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_VISUAL_CONTINUITY_PACK_BINDING_OPEN_GATES,
      )
    || serverDerivedReadOnlyPackBindingCandidateAuthority !== true
    || Object.values(delegatedAuthorities).some(
      (value) => value !== false,
    )
    || draft.selectedSceneContinuityBindings.length === 0
    || draft.packBinding.selectedSceneBindingCount !==
      draft.selectedSceneContinuityBindings.length
    || !draft.packBinding.packPayloadFullyRevalidated
    || draft.packBinding.packPayloadEmbeddedInReceipt
    || draft.packBinding.immutablePackArtifactCreated
    || draft.packBinding
      .controlledReferenceViewExpectationsAreAssetEvidence
    || draft.packBinding
      .continuityLedgerEntriesAreExecutableAssetEvidence
    || draft.selectedSceneContinuityBindings.some(
      (binding) =>
        !binding.referenceViewsAreControlledUnverifiedExpectations
        || binding.referenceViewsArePersistedReferenceArtifacts
        || binding.referenceArtifactRequirementResolvedByThisBinding
        || binding.semanticStyleQaExecuted
        || binding.documentaryFactSafetyRevalidated
        || stableAuthorityStringify(
          binding.requiredContinuityExpectationKinds,
        ) !== stableAuthorityStringify(
          binding.boundContinuityExpectationKinds,
        ),
    )
    || draft.fixedRuntimeAndRegistryPolicy.expectedCanonicalToolId !==
      'comfyui'
    || draft.fixedRuntimeAndRegistryPolicy.expectedCanonicalOperationId !==
      'tool.comfyui.generate_controlled_image.v1'
    || !draft.fixedRuntimeAndRegistryPolicy
      .fixedSupervisedProcessEntrypointRequired
    || draft.fixedRuntimeAndRegistryPolicy
      .runtimeConfinementRequirementDigestSha256 !==
      LIVING_FRAME_COMFYUI_RUNTIME_CONFINEMENT_REQUIREMENT_DIGEST_SHA256
    || stableAuthorityStringify(
      draft.fixedRuntimeAndRegistryPolicy.deniedTopLevelImports,
    ) !== stableAuthorityStringify(['sam2'])
    || draft.fixedRuntimeAndRegistryPolicy.exactModelArtifactCount !== 5
    || draft.fixedRuntimeAndRegistryPolicy
      .exactModelArtifactByteLength !== 11_700_367_157
    || !draft.fixedRuntimeAndRegistryPolicy
      .atomicReadOnlyMountRequiredForOneAttempt
    || !draft.fixedRuntimeAndRegistryPolicy
      .oneRequestUnitOneImageOneGpuAttemptRequired
    || !draft.fixedRuntimeAndRegistryPolicy
      .fiveGpuCapabilityRolesCreateOneCostEvent
    || !draft.fixedRuntimeAndRegistryPolicy.auraFaceCpuQaExcludedFromGpuAttempt
    || !draft.fixedRuntimeAndRegistryPolicy
      .registryExpansionPermittedForReleasedDistinctExecutables
    || draft.fixedRuntimeAndRegistryPolicy
      .fakeIdentityForWeightAdapterLibraryPreprocessorOrCapabilityAllowed
    || draft.canonicalSelectedSceneInterfaceMutated
    || draft.immutablePackArtifactPersisted
    || draft.canonicalReferenceArtifactResolved
    || draft.semanticVisualQaExecuted
    || draft.documentaryFactSafetyRevalidated
    || draft.promptMaterializationChanged
    || draft.operationRegistered
    || draft.dispatchGranted
    || draft.workerLeaseCreated
    || draft.runtimeExecuted
    || draft.gpuAttemptCreated
    || draft.actualCostReceiptCreated
    || draft.artifactPersisted
    || draft.assetManifestMutated
    || draft.privateReviewApproved
    || draft.renderAuthorized
    || draft.finalCanvasCreatedByComfyUi
    || draft.containsRawPackPayloadOrSubjectSpecificSummaries
    || draft
      .containsBytesPathUrlCredentialPromptSeedDimensionModelCommandOrEnvironment
    || draft.containsPriceCreditServiceFeeReservationWalletOrLedgerData
    || draft.productionReady
    || !draft.validatedPackPayloadAvailableForReadOnlyDownstreamBinding
    || URL_OR_PATH_LIKE.test(serialized)
    || SECRET_LIKE.test(serialized)
    || serialized.includes('"continuityPack":')
    || serialized.includes('"displayLabel":')
    || serialized.includes('"summary":')
    || serialized.includes('"referenceViewId":')
    || serialized.includes('"assetExpectationId":')
  ) {
    throw invalid('unsafe_payload_forbidden', '$')
  }
  for (const value of collectDigestValues(draft)) {
    if (!SHA256.test(value)) {
      throw invalid('digest_mismatch', '$')
    }
  }
}

function collectDigestValues(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectDigestValues(entry))
  }
  if (!isRecord(value)) return []
  return Object.entries(value).flatMap(([key, entry]) => {
    if (
      key.endsWith('DigestSha256')
      || key.endsWith('DigestsSha256')
    ) {
      if (typeof entry === 'string') return [entry]
      if (Array.isArray(entry)) {
        return entry.filter(
          (candidate): candidate is string =>
            typeof candidate === 'string',
        )
      }
    }
    return collectDigestValues(entry)
  })
}

function withoutDigest(
  value: Record<string, unknown>,
): Record<string, unknown> {
  const {
    bindingDigestSha256: omitted,
    ...draft
  } = value
  void omitted
  return draft
}

function invalid(
  code:
    LivingFrameControlledImageSelectedSceneVisualContinuityPackBindingIssueCode,
  path: string,
): LivingFrameControlledImageSelectedSceneVisualContinuityPackBindingError {
  if (
    !LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_VISUAL_CONTINUITY_PACK_BINDING_ISSUE_CODES.includes(
      code,
    )
  ) {
    throw new Error(`Unknown Living Frame continuity-pack issue: ${code}`)
  }
  return new LivingFrameControlledImageSelectedSceneVisualContinuityPackBindingError([
    { code, path },
  ])
}

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const keys = Object.keys(value).sort()
  return stableAuthorityStringify(keys) ===
    stableAuthorityStringify([...expected].sort())
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
  )
}

function deepFreeze<T>(value: T): T {
  if (
    typeof value !== 'object'
    || value === null
    || Object.isFrozen(value)
  ) return value
  Object.freeze(value)
  for (const nested of Object.values(value)) {
    deepFreeze(nested)
  }
  return value
}
