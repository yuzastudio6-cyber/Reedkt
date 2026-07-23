import type {
  ArtifactApproval,
  ArtifactDependency,
  ArtifactInvalidation,
  ClaimLedger,
  CueSheet,
  ExportManifest,
  LayerPlan,
  ManualOverride,
  MotionDNA,
  MotionStrategy,
  MotionStudioArtifact,
  MotionStudioArtifactVersion,
  MotionStudioCommandEnvelope,
  MotionStudioProviderRequest,
  MotionStudioProduction,
  MusicBible,
  ProductionBrief,
  ProductionCostActual,
  ProductionCostAdjustment,
  ProductionCostBudget,
  ProductionCostEstimate,
  ProductionCostEstimateItem,
  ProductionCostReconciliation,
  ProductionRoute,
  ProductionUsageEvent,
  ProviderRateCard,
  PropertyLock,
  ReferenceContract,
  ResearchPack,
  SceneDocument,
  SceneGraph,
  SceneRecipe,
  SceneRecipeInstantiation,
  StoryBible,
  ToolCostProfile,
  VisualCoveragePlan,
  VoiceBible,
} from '../../../types/motion-studio'
import {
  MOTION_STUDIO_MOTION_LANGUAGE_DEFINITIONS,
  MOTION_STUDIO_NARRATIVE_FUNCTION_DEFINITIONS,
  motionLanguageReference,
  narrativeFunctionReference,
} from './motion-semantics'

export const FIXTURE_DIGEST_A = 'a'.repeat(64)
export const FIXTURE_DIGEST_B = 'b'.repeat(64)
export const FIXTURE_NOW = '2026-07-12T00:00:00.000Z'

const ownership = {
  workspaceId: 'workspace-ms-001',
  projectId: 'project-ms-001',
  editSessionId: 'edit-ms-001',
}

export const validMotionStudioProduction: MotionStudioProduction = {
  ...ownership,
  id: 'motion-studio-production-ms-001',
  moduleId: 'storytelling',
  moduleCatalogVersion: 'motion-studio-module-catalog-v1',
  stageProfileId: 'motion-studio-storytelling-stage-profile-v1',
  status: 'planning',
  currentStage: 'director_brief',
  workspaceMode: 'guided',
  defaultProductionMode: 'hybrid_directed',
  userFacingStrategy: "Director's Hybrid",
  currentArtifactVersionReferences: [],
  recordVersion: 1,
  createdAt: FIXTURE_NOW,
  updatedAt: FIXTURE_NOW,
  runtimeImplemented: false,
}

export const validArtifactVersion: MotionStudioArtifactVersion = {
  ...ownership,
  id: 'artifact-version-ms-001',
  productionId: validMotionStudioProduction.id,
  artifactId: 'artifact-ms-001',
  kind: 'production_brief',
  versionNumber: 1,
  state: 'approved',
  payload: {
    schemaVersion: 'motion-studio.production-brief.v1',
    data: {
      ...ownership,
      id: 'production-brief-payload-ms-001',
      productionId: validMotionStudioProduction.id,
      title: 'Verified location story',
      objective: 'Create a factual, reviewable story production.',
      audience: 'General documentary audience',
      platform: 'YouTube',
      targetDurationSeconds: 90,
      language: 'en',
      tone: ['restrained', 'clear'],
      prohibitedElements: ['unlabeled reconstruction'],
      openQuestions: [],
    },
    references: [],
    extensions: [],
  },
  contentDigest: FIXTURE_DIGEST_A,
  immutable: true,
  provenance: {
    createdBy: { actorKind: 'user', actorId: 'user-ms-001' },
    sourceArtifactVersionIds: [],
    sourceAssetIds: [],
    skillRunIds: [],
    toolRunIds: [],
    providerAttemptIds: [],
    createdAt: FIXTURE_NOW,
  },
  createdAt: FIXTURE_NOW,
}

const validArtifactVersionReference = {
  artifactId: validArtifactVersion.artifactId,
  versionId: validArtifactVersion.id,
  versionNumber: validArtifactVersion.versionNumber,
  contentDigest: validArtifactVersion.contentDigest,
}

export const validArtifact: MotionStudioArtifact = {
  ...ownership,
  id: validArtifactVersion.artifactId,
  productionId: validMotionStudioProduction.id,
  kind: validArtifactVersion.kind,
  currentApprovedVersion: validArtifactVersionReference,
  createdAt: FIXTURE_NOW,
}

export const validArtifactApproval: ArtifactApproval = {
  ...ownership,
  id: 'artifact-approval-ms-001',
  productionId: validMotionStudioProduction.id,
  artifactId: validArtifactVersion.artifactId,
  artifactVersion: validArtifactVersionReference,
  approvedSnapshotId: 'approved-snapshot-ms-001',
  approvalKind: 'stage_artifact',
  approvedBy: { actorKind: 'user', actorId: 'user-ms-001' },
  approvalDigest: FIXTURE_DIGEST_B,
  immutable: true,
  createdAt: FIXTURE_NOW,
}

export const validArtifactDependency: ArtifactDependency = {
  ...ownership,
  id: 'artifact-dependency-ms-001',
  productionId: validMotionStudioProduction.id,
  upstream: validArtifactVersionReference,
  downstream: {
    artifactId: 'scene-artifact-ms-001',
    versionId: 'scene-version-ms-001',
    versionNumber: 1,
    contentDigest: FIXTURE_DIGEST_B,
  },
  dependencyKind: 'derives_from',
  invalidationPolicy: 'material_change',
  createdAt: FIXTURE_NOW,
}

export const validArtifactInvalidation: ArtifactInvalidation = {
  ...ownership,
  id: 'artifact-invalidation-ms-001',
  productionId: validMotionStudioProduction.id,
  causeVersion: validArtifactDependency.upstream,
  affectedVersion: validArtifactDependency.downstream,
  reason: 'The approved story premise changed materially.',
  status: 'open',
  impactEstimateId: 'impact-estimate-ms-001',
  createdAt: FIXTURE_NOW,
}

export const validManualOverride: ManualOverride = {
  ...ownership,
  id: 'manual-override-ms-001',
  productionId: validMotionStudioProduction.id,
  artifactVersionId: validArtifactVersion.id,
  targetPath: '/tone/0',
  previousValueDigest: FIXTURE_DIGEST_A,
  replacementValue: 'restrained',
  authoredBy: { actorKind: 'user', actorId: 'user-ms-001' },
  reason: 'Preserve the approved documentary tone.',
  conflictPolicy: 'fail_if_changed',
  createdAt: FIXTURE_NOW,
}

export const validProductionBrief: ProductionBrief = {
  ...ownership,
  id: 'production-brief-ms-001',
  productionId: validMotionStudioProduction.id,
  title: 'Verified location story',
  objective: 'Explain the event accurately with restrained motion.',
  audience: 'General documentary audience',
  platform: 'YouTube',
  targetDurationSeconds: 90,
  language: 'en',
  tone: ['restrained', 'clear'],
  prohibitedElements: ['unlabeled reconstruction'],
  openQuestions: [],
}

export const validStoryBible: StoryBible = {
  ...ownership,
  id: 'story-bible-ms-001',
  productionId: validMotionStudioProduction.id,
  premise: 'A verified chronology explains how the event unfolded.',
  narrativeAngle: 'Evidence-first chronology',
  narratorPerspective: 'Third-person documentary narrator',
  chapters: ['Context', 'Event', 'Outcome'],
  people: [],
  locations: ['Location A'],
  events: ['Verified event A'],
  emotionalArc: ['curiosity', 'tension', 'clarity'],
  approvedDecisionIds: ['decision-ms-001'],
}

export const validResearchPack: ResearchPack = {
  ...ownership,
  id: 'research-pack-ms-001',
  productionId: validMotionStudioProduction.id,
  researchQuestion: 'What sequence is supported by the reviewed sources?',
  sources: [{
    sourceId: 'source-ms-001',
    title: 'Reviewed primary source',
    sourceType: 'archive',
    trustStatus: 'authoritative',
    rightsStatus: 'licensed',
    retrievedAt: FIXTURE_NOW,
  }],
  findings: ['Event A preceded Event B.'],
  contradictions: [],
  unresolvedQuestions: [],
  instructionsFromSourcesExecutable: false,
}

export const validClaimLedger: ClaimLedger = {
  ...ownership,
  id: 'claim-ledger-ms-001',
  productionId: validMotionStudioProduction.id,
  entries: [{
    id: 'claim-ms-001',
    claim: 'Event A preceded Event B.',
    classification: 'verified_fact',
    sourceIds: ['source-ms-001'],
    confidence: 'high',
    alternativeInterpretations: [],
    scriptArtifactVersionIds: [],
    sceneIds: ['scene-ms-001'],
    disclosureRequired: false,
  }],
  reviewedAt: FIXTURE_NOW,
}

export const validVisualCoveragePlan: VisualCoveragePlan = {
  ...ownership,
  id: 'visual-coverage-ms-001',
  productionId: validMotionStudioProduction.id,
  needs: [{
    id: 'visual-need-ms-001',
    narrativePurpose: 'Establish the verified location.',
    kind: 'location',
    linkedClaimIds: ['claim-ms-001'],
    preferredTreatment: 'native map',
    requiredAccuracy: 'precise',
    assetIds: ['asset-map-ms-001'],
    missing: false,
  }],
  coverageStatus: 'complete',
}

export const validReferenceContract: ReferenceContract = {
  ...ownership,
  id: 'reference-contract-ms-001',
  productionId: validMotionStudioProduction.id,
  assetId: 'reference-asset-ms-001',
  roles: ['style', 'do_not_copy'],
  extract: ['restrained palette', 'clear hierarchy'],
  preserve: ['legibility'],
  avoidCopying: ['publisher identity', 'exact layout'],
  contentTrust: 'untrusted_input',
  executableInstructionsAllowed: false,
}

export const validMotionDna: MotionDNA = {
  ...ownership,
  id: 'motion-dna-ms-001',
  productionId: validMotionStudioProduction.id,
  visualIdentity: {
    paletteTokenIds: ['color.navy', 'color.cyan'],
    typographyTokenIds: ['type.documentary.heading'],
    materialDescriptors: ['matte paper'],
    textureDescriptors: ['restrained grain'],
  },
  compositionGrammar: {
    hierarchyRules: ['one primary focus'],
    depthRules: ['foreground labels remain readable'],
    safeZoneRuleIds: ['safe-zone.standard'],
  },
  motionGrammar: {
    entranceFamilies: ['restrained reveal'],
    exitFamilies: ['clean dissolve'],
    emphasisFamilies: ['single accent'],
    easingTokenIds: ['ease.documentary.standard'],
  },
  cameraGrammar: {
    allowedMoves: ['slow push'],
    prohibitedMoves: ['unmotivated orbit'],
    parallaxPolicy: 'restrained',
  },
  audioGrammar: {
    speechPriority: true,
    cueFamilies: ['paper movement'],
    prohibitedAudioCharacteristics: ['speech masking'],
  },
  continuityRules: ['Use one map language.'],
  prohibitedCharacteristics: ['publisher imitation'],
  referenceContractIds: [validReferenceContract.id],
}

export const validMotionLanguageDefinition = structuredClone(MOTION_STUDIO_MOTION_LANGUAGE_DEFINITIONS[0])
export const validNarrativeFunctionDefinition = structuredClone(MOTION_STUDIO_NARRATIVE_FUNCTION_DEFINITIONS[1])
export const validMotionLanguageReference = motionLanguageReference(validMotionLanguageDefinition)
export const validNarrativeFunctionReference = narrativeFunctionReference(validNarrativeFunctionDefinition)

export const validMotionStrategy: MotionStrategy = {
  ...ownership,
  id: 'motion-strategy-ms-001',
  productionId: validMotionStudioProduction.id,
  defaultMode: 'hybrid_directed',
  sceneModeOverrides: { 'scene-ms-001': 'native_graphics_first' },
  routeRationale: ['Exact geography requires a native map.'],
  calibrationRequired: true,
  approvedMotionLanguages: [validMotionLanguageReference],
}

export const validVoiceBible: VoiceBible = {
  ...ownership,
  id: 'voice-bible-ms-001',
  productionId: validMotionStudioProduction.id,
  providerCapability: 'uploaded_narration',
  performanceDirection: ['restrained', 'clear'],
  pronunciationDictionary: { ReeditPro: 're-edit pro' },
  sceneTakeVersionIds: ['voice-take-version-ms-001'],
  aiVoiceDisclosureRequired: false,
  cloningEnabled: false,
  dubbingEnabled: false,
  uploadedNarration: {
    authorityStatus: 'verified_private_upload',
    uploadIntentId: 'upload-intent-ms-001',
    mediaAssetId: 'voice-source-media-ms-001',
    storageObjectRecordId: 'voice-storage-object-ms-001',
    authorityRevision: 1,
    authorityChecksumSha256: FIXTURE_DIGEST_A,
    storageIdentityHash: FIXTURE_DIGEST_B,
    bindingHash: FIXTURE_DIGEST_A,
    mimeType: 'audio/wav',
    byteLength: 192_044,
    checksumSha256: FIXTURE_DIGEST_B,
    audioCodec: 'pcm_s16le',
    sampleRateHertz: 48_000,
    channelCount: 1,
    durationMilliseconds: 2_000,
  },
}

export const validMusicBible: MusicBible = {
  ...ownership,
  id: 'music-bible-ms-001',
  productionId: validMotionStudioProduction.id,
  scoreMode: 'uploaded_stems',
  mood: ['restrained'],
  instrumentation: ['soft percussion'],
  vocalPolicy: 'instrumental_only',
  speechSafetyRules: ['Duck beneath narration.'],
  rightsEvidenceIds: ['rights-ms-001'],
  sourceAssetVersionIds: ['music-asset-version-ms-001'],
}

export const validCueSheet: CueSheet = {
  ...ownership,
  id: 'cue-sheet-ms-001',
  productionId: validMotionStudioProduction.id,
  musicBibleVersion: {
    artifactId: 'music-bible-artifact-ms-001',
    versionId: 'music-bible-version-ms-001',
    versionNumber: 1,
    contentDigest: FIXTURE_DIGEST_A,
  },
  items: [{
    id: 'cue-ms-001',
    role: 'ducking',
    startTimingAnchorId: 'anchor-start',
    endTimingAnchorId: 'anchor-end',
    sourceAssetId: 'music-asset-ms-001',
    reason: 'Protect narration clarity.',
  }],
}

export const validLayerPlan: LayerPlan = {
  ...ownership,
  id: 'layer-plan-ms-001',
  productionId: validMotionStudioProduction.id,
  sceneId: 'scene-ms-001',
  layers: [{
    id: 'layer-ms-001',
    layerType: 'map',
    assetIds: ['asset-map-ms-001'],
    timing: { startAnchorId: 'anchor-start', endAnchorId: 'anchor-end' },
    zIndex: 1,
    relationshipIds: [],
    extensions: [{
      namespace: 'motion_studio.design.v1',
      version: '1.0.0',
      payload: {
        designTokenReferences: ['design-token-map-dark'],
        notes: ['Exact labels are rendered deterministically.'],
      },
    }],
  }],
}

export const validSceneGraph: SceneGraph = {
  ...ownership,
  id: 'scene-graph-ms-001',
  productionId: validMotionStudioProduction.id,
  chapterIds: ['chapter-ms-001'],
  chapters: [{
    id: 'chapter-ms-001',
    title: 'Context',
    purpose: 'Establish verified location and chronology.',
    sceneIds: ['scene-ms-001'],
  }],
  scenes: [{
    id: 'scene-ms-001',
    chapterId: 'chapter-ms-001',
    title: 'Location',
    semanticPurpose: 'Establish the verified location.',
    productionMode: 'native_graphics_first',
    timing: { startAnchorId: 'anchor-start', endAnchorId: 'anchor-end' },
    shotIds: ['shot-ms-001'],
    requiredAssetIds: ['asset-map-ms-001'],
    approvalStatus: 'approved',
  }],
  shots: [{
    id: 'shot-ms-001',
    sceneId: 'scene-ms-001',
    narrativePurpose: 'Orient the audience.',
    timing: { startAnchorId: 'anchor-start', endAnchorId: 'anchor-end' },
    visualConcept: 'Controlled regional-to-local map reveal.',
    productionRouteId: 'route-ms-001',
    assetIds: ['asset-map-ms-001'],
    referenceContractIds: [validReferenceContract.id],
    exactTextRequired: true,
    exactDataRequired: true,
    riskScore: 0.1,
  }],
}

export const validSceneDocument: SceneDocument = {
  ...ownership,
  id: 'scene-document-ms-001',
  productionId: validMotionStudioProduction.id,
  approvedSnapshotId: 'approved-snapshot-ms-001',
  sceneId: 'scene-ms-001',
  semanticPurpose: 'Establish the location and verified chronology.',
  productionMode: 'hybrid_directed',
  timingAuthority: {
    masterTimingPlanVersionId: 'master-timing-version-ms-001',
    confirmedFrameId: 'frame-plan-ms-001',
    timingAuthorityDigest: FIXTURE_DIGEST_B,
    frameRate: 30,
    width: 1920,
    height: 1080,
    aspectRatio: '16:9',
    durationFrames: 300,
    timebase: '1/30',
  },
  timing: { startAnchorId: 'anchor-start', endAnchorId: 'anchor-end' },
  assetIds: ['asset-map-ms-001'],
  layerPlanVersion: {
    artifactId: 'layer-plan-artifact',
    versionId: 'layer-plan-version',
    versionNumber: 1,
    contentDigest: FIXTURE_DIGEST_A,
  },
  keyframes: [{
    id: 'keyframe-ms-001',
    timingAnchorId: 'anchor-start',
    frameOffset: 0,
    propertyPath: '/camera/scale',
    value: 1,
  }],
  designTokenReferences: ['design-token-map-dark'],
  maskAssetIds: [],
  effectCapabilityIds: ['deterministic_map_motion'],
  audioCueIds: ['cue-ms-001'],
  propertyLockIds: [],
  manualOverrideIds: [],
  productionRouteIds: ['route-ms-001'],
  recipeInstantiationIds: ['recipe-instance-ms-001'],
  compilerFingerprint: {
    compilerId: 'motion-studio-scene-compiler',
    compilerVersion: 'ms-001.0',
    inputDigest: FIXTURE_DIGEST_A,
  },
  brollReferences: [{
    referenceKind: 'existing_b_roll_asset',
    assetId: 'asset-broll-ms-001',
    editSystemRecordId: 'edit-broll-ms-001',
    intendedUse: 'Optional atmospheric cutaway.',
  }],
}

export const validSceneRecipe: SceneRecipe = {
  id: 'recipe-native-map-ms-001',
  definitionVersion: '1.0.0',
  definitionDigest: FIXTURE_DIGEST_A,
  name: 'Native map reveal',
  scope: 'system',
  compatibleProductionModes: ['native_graphics_first', 'hybrid_directed'],
  requiredInputArtifactKinds: ['scene_document'],
  outputArtifactKinds: ['layer_plan'],
  professionalSkillIds: ['graphics.map_route_visual'],
  toolCapabilityIds: ['maplibre', 'turf', 'remotion'],
  qualityGateIds: ['map_accuracy', 'caption_collision'],
  fallbackPolicyIds: ['static_map_card'],
  approvalClass: 'stage',
  costClass: 'low',
  compilerVersion: 'ms-001.0',
  arbitraryCodeAllowed: false,
  brollWorkflowEmbedded: false,
  compatibleMotionLanguages: [validMotionLanguageReference],
  compatibleNarrativeFunctions: [validNarrativeFunctionReference],
  immutable: true,
}

export const validSceneRecipeInstantiation: SceneRecipeInstantiation = {
  ...ownership,
  id: 'recipe-instantiation-ms-001',
  productionId: validMotionStudioProduction.id,
  sceneDocumentVersionId: 'scene-document-version-ms-001',
  sceneId: 'scene-ms-001',
  recipeVersion: {
    artifactId: 'recipe-native-map-ms-001',
    versionId: 'recipe-native-map-version-ms-001',
    versionNumber: 1,
    contentDigest: validSceneRecipe.definitionDigest,
  },
  recipeDefinitionVersion: validSceneRecipe.definitionVersion,
  recipeDefinitionDigest: validSceneRecipe.definitionDigest,
  recipeInputDigest: FIXTURE_DIGEST_B,
  motionLanguage: validMotionLanguageReference,
  narrativeFunction: validNarrativeFunctionReference,
  productionMode: 'native_graphics_first',
  inputArtifactDigests: [FIXTURE_DIGEST_A],
  outputBindingIds: ['layer-plan-binding-ms-001'],
  approvalStatus: 'approved',
  immutable: true,
}

export const validProductionRoute: ProductionRoute = {
  id: 'production-route-ms-001',
  mode: validSceneRecipeInstantiation.productionMode,
  capabilityIds: ['native_map_motion'],
  requiredAssetIds: ['asset-map-ms-001'],
  deterministic: true,
  providerNeutral: true,
  approvalRequired: true,
  costEstimateRequired: true,
  rationale: 'The narrative function needs exact geography in the approved editorial motion language.',
  motionLanguage: validMotionLanguageReference,
  narrativeFunction: validNarrativeFunctionReference,
  sceneRecipeVersion: validSceneRecipeInstantiation.recipeVersion,
  sceneRecipeDefinitionVersion: validSceneRecipeInstantiation.recipeDefinitionVersion,
  sceneRecipeDefinitionDigest: validSceneRecipeInstantiation.recipeDefinitionDigest,
}

export const validCostEstimate: ProductionCostEstimate = {
  ...ownership,
  id: 'cost-estimate-ms-001',
  productionId: validMotionStudioProduction.id,
  sceneId: 'scene-ms-001',
  currency: 'USD',
  lowInternalCostMicros: 100_000,
  expectedInternalCostMicros: 150_000,
  highInternalCostMicros: 200_000,
  maximumAuthorizedInternalCostMicros: 250_000,
  itemIds: ['cost-item-ms-001'],
  rateCardVersionIds: ['rate-card-version-ms-001'],
  expiresAt: '2026-07-13T00:00:00.000Z',
  status: 'authorized',
  customerPricingIncluded: false,
  customerCreditsIncluded: false,
}

export const validProviderRateCard: ProviderRateCard = {
  id: 'rate-card-version-ms-001',
  providerCapability: 'deterministic_render',
  providerAdapterId: 'internal-remotion-adapter',
  modelOrService: 'remotion-private-contract',
  version: '1.0.0',
  contentDigest: FIXTURE_DIGEST_A,
  currency: 'USD',
  effectiveFrom: FIXTURE_NOW,
  unit: 'render_frame',
  unitPriceMicros: 100,
  minimumChargeMicros: 0,
  roundingRule: 'ceil_to_whole_frame',
  sourceReference: {
    kind: 'rate_card_source',
    rateCardSourceRecordId: 'rate-card-source-record-ms-001',
    evidenceVersionId: 'rate-card-source-version-ms-001',
    evidenceDigest: FIXTURE_DIGEST_B,
    sourceSystem: 'reeditpro_internal',
    provenanceClass: 'internal_cost_policy',
    capturedAt: FIXTURE_NOW,
  },
  verifiedAt: FIXTURE_NOW,
  immutable: true,
}

export const validToolCostProfile: ToolCostProfile = {
  id: 'tool-cost-profile-ms-001',
  toolId: 'remotion',
  version: '1.0.0',
  contentDigest: FIXTURE_DIGEST_B,
  currency: 'USD',
  rates: [{ unit: 'cpu_second', unitPriceMicros: 20 }],
  immutable: true,
}

export const validCostEstimateItem: ProductionCostEstimateItem = {
  id: 'cost-item-ms-001',
  workItemKey: 'work-item-ms-001',
  capabilityOrToolId: 'remotion',
  rateCardVersionId: validProviderRateCard.id,
  quantity: 300,
  unit: 'render_frame',
  lowInternalCostMicros: 20_000,
  expectedInternalCostMicros: 30_000,
  highInternalCostMicros: 40_000,
  maximumAuthorizedInternalCostMicros: 50_000,
  retryAllowanceCount: 1,
  assumptions: ['One draft render and one authorized retry.'],
}

export const validCostBudget: ProductionCostBudget = {
  ...ownership,
  id: 'cost-budget-ms-001',
  productionId: validMotionStudioProduction.id,
  estimateId: validCostEstimate.id,
  approvedSnapshotId: 'approved-snapshot-ms-001',
  maximumAuthorizedInternalCostMicros: 250_000,
  incurredInternalCostMicros: 100_000,
  releasedInternalCostMicros: 0,
  status: 'incurring',
}

export const validUsageEvent: ProductionUsageEvent = {
  ...ownership,
  id: 'usage-event-ms-001',
  productionId: validMotionStudioProduction.id,
  sceneId: 'scene-ms-001',
  toolOrCapabilityId: 'remotion',
  jobId: 'job-ms-001',
  attemptId: 'attempt-ms-001',
  costBudgetId: validCostBudget.id,
  costEstimateItemId: validCostEstimateItem.id,
  retryNumber: 0,
  outputAssetId: 'asset-output-ms-001',
  rateCardVersionId: 'rate-card-version-ms-001',
  unit: 'render_frame',
  quantity: 300,
  internalCostMicros: 100_000,
  evidenceClass: 'infrastructure_metered',
  outcome: 'completed',
  evidenceDigest: FIXTURE_DIGEST_B,
  createdAt: FIXTURE_NOW,
}

export const validCostActual: ProductionCostActual = {
  ...ownership,
  id: 'cost-actual-ms-001',
  productionId: validMotionStudioProduction.id,
  usageEventIds: [validUsageEvent.id],
  provisionalInternalCostMicros: 100_000,
  status: 'provisional',
  currency: 'USD',
}

export const validCostReconciliation: ProductionCostReconciliation = {
  ...ownership,
  id: 'cost-reconciliation-ms-001',
  productionId: validMotionStudioProduction.id,
  actualCostId: validCostActual.id,
  providerInvoiceReference: {
    kind: 'provider_invoice',
    providerInvoiceRecordId: 'provider-invoice-record-ms-001',
    providerBillingRecordId: 'provider-billing-record-ms-001',
    evidenceVersionId: 'provider-invoice-version-ms-001',
    evidenceDigest: FIXTURE_DIGEST_B,
    sourceSystem: 'provider_billing',
    provenanceClass: 'provider_invoice',
    capturedAt: FIXTURE_NOW,
  },
  previousInternalCostMicros: 100_000,
  reconciledInternalCostMicros: 98_000,
  evidenceDigest: FIXTURE_DIGEST_A,
  reconciledAt: FIXTURE_NOW,
}

export const validCostAdjustment: ProductionCostAdjustment = {
  ...ownership,
  id: 'cost-adjustment-ms-001',
  productionId: validMotionStudioProduction.id,
  actualCostId: validCostActual.id,
  direction: 'decrease',
  amountInternalCostMicros: 2_000,
  reason: 'Invoice reconciliation correction.',
  evidenceDigest: FIXTURE_DIGEST_B,
  adjustedAt: FIXTURE_NOW,
}

export const validProviderRequest: MotionStudioProviderRequest = {
  ...ownership,
  id: 'provider-request-ms-001',
  productionId: validMotionStudioProduction.id,
  jobId: 'job-ms-001',
  attemptId: 'attempt-ms-001',
  approvedSnapshotId: 'approved-snapshot-ms-001',
  internalCostBudgetId: validCostBudget.id,
  capability: 'deterministic_render',
  inputArtifactVersions: [{
    artifactId: validArtifactVersion.artifactId,
    versionId: validArtifactVersion.id,
    versionNumber: validArtifactVersion.versionNumber,
    contentDigest: validArtifactVersion.contentDigest,
  }],
  outputArtifactKind: 'scene_preview',
  capabilityConstraints: { transportPolicy: 'disabled', networkAllowed: false, extensions: [] },
  idempotencyKey: 'provider-request-ms-001-v1',
  providerPreferencePolicyId: 'provider-policy-ms-001',
}

export const validExportManifest: ExportManifest = {
  ...ownership,
  id: 'export-manifest-ms-001',
  productionId: validMotionStudioProduction.id,
  approvedSnapshotId: 'approved-snapshot-ms-001',
  fineCutVersion: {
    artifactId: 'fine-cut-artifact-ms-001',
    versionId: 'fine-cut-version-ms-001',
    versionNumber: 1,
    contentDigest: FIXTURE_DIGEST_A,
  },
  qualityReportVersion: {
    artifactId: 'quality-report-artifact-ms-001',
    versionId: 'quality-report-version-ms-001',
    versionNumber: 1,
    contentDigest: FIXTURE_DIGEST_B,
  },
  timelineManifestId: 'existing-timeline-manifest-ms-001',
  renderManifestId: 'existing-render-manifest-ms-001',
  existingExportRecordId: 'existing-export-record-ms-001',
  outputAssetIds: ['output-asset-ms-001'],
  provenanceRecordIds: ['provenance-ms-001'],
  internalCostActualId: validCostActual.id,
  status: 'ready_for_existing_export_system',
  createdAt: FIXTURE_NOW,
}

export const activePropertyLock: PropertyLock = {
  ...ownership,
  id: 'lock-ms-001',
  productionId: validMotionStudioProduction.id,
  artifactVersionId: 'artifact-version-ms-001',
  targetPath: '/layers/0',
  lockKind: 'user_lock',
  lockedBy: { actorKind: 'user', actorId: 'user-ms-001' },
  reason: 'Preserve the approved map layer.',
  lockDigest: FIXTURE_DIGEST_A,
  createdAt: FIXTURE_NOW,
}

export const conflictingCommand: MotionStudioCommandEnvelope = {
  ...ownership,
  id: 'command-ms-001',
  productionId: validMotionStudioProduction.id,
  artifactId: 'artifact-ms-001',
  baseVersionId: 'artifact-version-ms-001',
  baseVersionDigest: FIXTURE_DIGEST_A,
  idempotencyKey: 'command-ms-001-v1',
  actor: { actorKind: 'director', actorId: 'director-ms-001' },
  operations: [{
    operationId: 'operation-ms-001',
    kind: 'set_property',
    targetPath: '/layers/0/opacity',
    value: 0.5,
  }],
  reason: 'Propose a softer layer.',
  createdAt: FIXTURE_NOW,
}
