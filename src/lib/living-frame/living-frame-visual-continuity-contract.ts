import { z } from 'zod'

import {
  LIVING_FRAME_VISUAL_CONTINUITY_ALPHA_MASTER_MODES,
  LIVING_FRAME_VISUAL_CONTINUITY_ALPHA_TEST_BACKGROUNDS,
  LIVING_FRAME_VISUAL_CONTINUITY_ASSET_TREATMENTS,
  LIVING_FRAME_VISUAL_CONTINUITY_CAMERA_CHARACTERS,
  LIVING_FRAME_VISUAL_CONTINUITY_COLOR_ROLES,
  LIVING_FRAME_VISUAL_CONTINUITY_COMPOSITION_STRATEGIES,
  LIVING_FRAME_VISUAL_CONTINUITY_DEPENDENCY_KINDS,
  LIVING_FRAME_VISUAL_CONTINUITY_DEPTH_STYLES,
  LIVING_FRAME_VISUAL_CONTINUITY_DETAIL_DENSITIES,
  LIVING_FRAME_VISUAL_CONTINUITY_EDGE_TREATMENTS,
  LIVING_FRAME_VISUAL_CONTINUITY_ENVIRONMENT_TRUTH_MODES,
  LIVING_FRAME_VISUAL_CONTINUITY_EVIDENCE_CLASS,
  LIVING_FRAME_VISUAL_CONTINUITY_EXPECTATION_EVIDENCE_CLASSES,
  LIVING_FRAME_VISUAL_CONTINUITY_EXPECTATION_KINDS,
  LIVING_FRAME_VISUAL_CONTINUITY_IDENTITY_IMPORTANCE,
  LIVING_FRAME_VISUAL_CONTINUITY_IDENTITY_KINDS,
  LIVING_FRAME_VISUAL_CONTINUITY_IDENTITY_RULE_CODES,
  LIVING_FRAME_VISUAL_CONTINUITY_IDENTITY_SAFETY_STATES,
  LIVING_FRAME_VISUAL_CONTINUITY_LEDGER_REASON_CODES,
  LIVING_FRAME_VISUAL_CONTINUITY_LEDGER_STATES,
  LIVING_FRAME_VISUAL_CONTINUITY_LIGHTING_CHARACTERS,
  LIVING_FRAME_VISUAL_CONTINUITY_LIGHTING_DIRECTIONS,
  LIVING_FRAME_VISUAL_CONTINUITY_LINE_LANGUAGES,
  LIVING_FRAME_VISUAL_CONTINUITY_MOTION_CHARACTERS,
  LIVING_FRAME_VISUAL_CONTINUITY_MOTION_DENSITIES,
  LIVING_FRAME_VISUAL_CONTINUITY_OBJECT_KINDS,
  LIVING_FRAME_VISUAL_CONTINUITY_OBJECT_TRUTH_MODES,
  LIVING_FRAME_VISUAL_CONTINUITY_PACK_SOURCE,
  LIVING_FRAME_VISUAL_CONTINUITY_PACK_STATUS,
  LIVING_FRAME_VISUAL_CONTINUITY_PACK_VERSION,
  LIVING_FRAME_VISUAL_CONTINUITY_PALETTE_MODES,
  LIVING_FRAME_VISUAL_CONTINUITY_REFERENCE_VIEW_KINDS,
  LIVING_FRAME_VISUAL_CONTINUITY_REGION_EXPECTATIONS,
  LIVING_FRAME_VISUAL_CONTINUITY_SCALE_TRUTH_GUARDS,
  LIVING_FRAME_VISUAL_CONTINUITY_SEPARABILITY_CODES,
  LIVING_FRAME_VISUAL_CONTINUITY_SOUND_DENSITIES,
  LIVING_FRAME_VISUAL_CONTINUITY_SOUND_PALETTES,
  LIVING_FRAME_VISUAL_CONTINUITY_STILLNESS_POLICIES,
  LIVING_FRAME_VISUAL_CONTINUITY_STYLE_AVOIDANCE_CODES,
  LIVING_FRAME_VISUAL_CONTINUITY_TEXTURE_TREATMENTS,
  type LivingFrameVisualContinuityPack,
  type LivingFrameVisualContinuityPackDraft,
  type LivingFrameVisualContinuityValidationIssue,
  type LivingFrameVisualContinuityValidationIssueCode,
  type LivingFrameVisualContinuityValidationResult,
} from '../../types/living-frame-visual-continuity'
import {
  LIVING_FRAME_MODES,
  LIVING_FRAME_SOURCE_TRUTH_MODES,
} from '../../types/living-frame'

const SHA256 = /^[a-f0-9]{64}$/u
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/u
const URL_OR_EXECUTABLE_URI =
  /(?:[A-Za-z][A-Za-z0-9+.-]*:\/\/|www\.|data:|javascript:|blob:|mailto:)/iu
const FILESYSTEM_PATH_PREFIX =
  /(?:^|[\s"'`])(?:\/|~\/|\.\.\/|[A-Za-z]:[\\/])/u
const SECRET_LIKE =
  /(?:\bBearer\s+[A-Za-z0-9._~+/-]+=*|\bsk-[A-Za-z0-9_-]{8,}|\bAIza[A-Za-z0-9_-]{8,}|BEGIN [A-Z ]*PRIVATE KEY|(?:api[_-]?key|password|secret|access[_-]?token)\s*[:=])/iu

const FORBIDDEN_KEYS = new Set([
  'rawChat',
  'raw_chat',
  'rawTranscript',
  'raw_transcript',
  'transcript',
  'customInstructions',
  'custom_instructions',
  'prompt',
  'systemPrompt',
  'system_prompt',
  'userPrompt',
  'user_prompt',
  'instructions',
  'mediaBytes',
  'media_bytes',
  'base64',
  'filePath',
  'file_path',
  'localPath',
  'signedUrl',
  'signed_url',
  'url',
  'apiKey',
  'api_key',
  'secret',
  'credentials',
  'command',
  'script',
  'code',
  'providerId',
  'provider_id',
  'modelId',
  'model_id',
  'toolId',
  'tool_id',
  'toolRoute',
  'tool_route',
  'workItem',
  'workItems',
  'jobId',
  'job_id',
  'queueId',
  'queue_id',
  'dispatchId',
  'dispatch_id',
  'approvalId',
  'approval_id',
  'snapshotId',
  'snapshot_id',
  'assetManifest',
  'asset_manifest',
  'price',
  'dollars',
  'credits',
  'serviceFee',
  'service_fee',
  'toolCost',
  'tool_cost',
  'exactFrames',
  'exact_frames',
  'gainDb',
  'gain_db',
  'mixDb',
  'mix_db',
  'productionReady',
  'production_ready',
  'seed',
])

const safeIdSchema = z.string().min(1).max(240)
  .regex(SAFE_ID)
  .refine((value) => !value.includes('..'), 'Unsafe identity sequence.')
const sha256Schema = z.string().regex(SHA256)
const positiveVersionSchema = z.number().int().positive().max(1_000_000)
const orderSchema = z.number().int().nonnegative().max(100_000)
const safeTextSchema = (maximumLength: number) => z.string().trim().min(1)
  .max(maximumLength)
  .refine((value) => !hasControlCharacter(value), 'Control characters are forbidden.')
  .refine(
    (value) =>
      !URL_OR_EXECUTABLE_URI.test(value)
      && !FILESYSTEM_PATH_PREFIX.test(value),
    'URLs and filesystem paths are forbidden.',
  )
  .refine((value) => !SECRET_LIKE.test(value), 'Secret-like content is forbidden.')

const workflowContextSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('ordinary_edit_video'),
    motionProductionContext: z.null(),
  }).strict(),
  z.object({
    kind: z.literal('motion_storytelling_optional_context'),
    motionProductionContext: z.object({
      productionId: safeIdSchema,
      authorityHashSha256: sha256Schema,
      sourceProposalDigestSha256: sha256Schema,
      sourceArtifactApprovalSnapshotId: safeIdSchema,
    }).strict(),
  }).strict(),
])

const authorityBoundarySchema = z.object({
  controlledPlanningOnly: z.literal(true),
  liveEvidenceAuthority: z.literal(false),
  selectedSceneAuthority: z.literal(false),
  exactTimingAuthority: z.literal(false),
  soundSyncAuthority: z.literal(false),
  estimateAuthority: z.literal(false),
  customerPriceAuthority: z.literal(false),
  customerCreditAuthority: z.literal(false),
  approvalAuthority: z.literal(false),
  snapshotAuthority: z.literal(false),
  assetManifestAuthority: z.literal(false),
  qaApprovalAuthority: z.literal(false),
  providerAuthority: z.literal(false),
  toolRouteAuthority: z.literal(false),
  workGraphAuthority: z.literal(false),
  queueAuthority: z.literal(false),
  renderAuthority: z.literal(false),
  runtimeAuthority: z.literal(false),
}).strict()

const canonicalBindingsSchema = z.object({
  workspaceId: safeIdSchema,
  projectId: safeIdSchema,
  editSessionId: safeIdSchema,
  handoffId: safeIdSchema,
  deferredLivingFrameComponentDigestSha256: sha256Schema,
  planningEvidenceBindingDigestSha256: sha256Schema,
  preapprovalReasoningResultBindingDigestSha256: sha256Schema,
  compiledIntentDigestSha256: sha256Schema,
  sourceSequenceDigestSha256: sha256Schema,
  outputFrameDigestSha256: sha256Schema,
  lineageRevision: positiveVersionSchema,
}).strict()

const expectationRefSchema = z.object({
  expectationId: safeIdSchema,
  expectationKind: z.enum(
    LIVING_FRAME_VISUAL_CONTINUITY_EXPECTATION_KINDS,
  ),
  version: positiveVersionSchema,
  expectedDigestSha256: sha256Schema,
  evidenceClass: z.enum(
    LIVING_FRAME_VISUAL_CONTINUITY_EXPECTATION_EVIDENCE_CLASSES,
  ),
  liveAuthorityVerified: z.literal(false),
  currentAuthorityVerified: z.literal(false),
  approvalVerified: z.literal(false),
}).strict()

const colorSchema = z.object({
  colorId: safeIdSchema,
  order: orderSchema,
  role: z.enum(LIVING_FRAME_VISUAL_CONTINUITY_COLOR_ROLES),
  hex: z.string().regex(HEX_COLOR),
}).strict()

const styleBibleSchema = z.object({
  styleBibleId: safeIdSchema,
  version: positiveVersionSchema,
  summary: safeTextSchema(800),
  assetTreatment: z.enum(LIVING_FRAME_VISUAL_CONTINUITY_ASSET_TREATMENTS),
  lineLanguage: z.enum(LIVING_FRAME_VISUAL_CONTINUITY_LINE_LANGUAGES),
  paletteMode: z.enum(LIVING_FRAME_VISUAL_CONTINUITY_PALETTE_MODES),
  palette: z.array(colorSchema).min(1).max(12),
  lightingDirection: z.enum(
    LIVING_FRAME_VISUAL_CONTINUITY_LIGHTING_DIRECTIONS,
  ),
  lightingCharacter: z.enum(
    LIVING_FRAME_VISUAL_CONTINUITY_LIGHTING_CHARACTERS,
  ),
  edgeTreatment: z.enum(
    LIVING_FRAME_VISUAL_CONTINUITY_EDGE_TREATMENTS,
  ),
  textureTreatment: z.enum(
    LIVING_FRAME_VISUAL_CONTINUITY_TEXTURE_TREATMENTS,
  ),
  detailDensity: z.enum(
    LIVING_FRAME_VISUAL_CONTINUITY_DETAIL_DENSITIES,
  ),
  avoidanceCodes: z.array(
    z.enum(LIVING_FRAME_VISUAL_CONTINUITY_STYLE_AVOIDANCE_CODES),
  ).max(16),
  referenceExpectationIds: z.array(safeIdSchema).max(32),
}).strict()

const referenceViewSchema = z.object({
  referenceViewId: safeIdSchema,
  order: orderSchema,
  kind: z.enum(
    LIVING_FRAME_VISUAL_CONTINUITY_REFERENCE_VIEW_KINDS,
  ),
  expectedReferenceDigestSha256: sha256Schema,
  evidenceClass: z.literal(
    'controlled_unverified_reference_expectation',
  ),
  qaApprovedAsset: z.literal(false),
}).strict()

const characterSheetSchema = z.object({
  characterSheetId: safeIdSchema,
  version: positiveVersionSchema,
  displayLabel: safeTextSchema(160),
  identityKind: z.enum(LIVING_FRAME_VISUAL_CONTINUITY_IDENTITY_KINDS),
  importance: z.enum(LIVING_FRAME_VISUAL_CONTINUITY_IDENTITY_IMPORTANCE),
  sourceTruthMode: z.enum(LIVING_FRAME_SOURCE_TRUTH_MODES),
  canonicalAppearanceSummary: safeTextSchema(800),
  outfitSummary: safeTextSchema(600),
  silhouetteSummary: safeTextSchema(600),
  expressionRangeSummary: safeTextSchema(600),
  identitySafetyState: z.enum(
    LIVING_FRAME_VISUAL_CONTINUITY_IDENTITY_SAFETY_STATES,
  ),
  identityRuleCodes: z.array(
    z.enum(LIVING_FRAME_VISUAL_CONTINUITY_IDENTITY_RULE_CODES),
  ).min(1).max(16),
  referenceViews: z.array(referenceViewSchema).max(12),
  styleBibleId: safeIdSchema,
  expectationRefIds: z.array(safeIdSchema).max(32),
  verifiedLikenessClaimed: z.literal(false),
  historicalEvidenceClaimed: z.literal(false),
}).strict()

const objectSheetSchema = z.object({
  objectSheetId: safeIdSchema,
  version: positiveVersionSchema,
  displayLabel: safeTextSchema(160),
  objectKind: z.enum(LIVING_FRAME_VISUAL_CONTINUITY_OBJECT_KINDS),
  truthMode: z.enum(LIVING_FRAME_VISUAL_CONTINUITY_OBJECT_TRUTH_MODES),
  canonicalDesignSummary: safeTextSchema(800),
  materialAndColorSummary: safeTextSchema(600),
  separabilityCodes: z.array(
    z.enum(LIVING_FRAME_VISUAL_CONTINUITY_SEPARABILITY_CODES),
  ).max(12),
  styleBibleId: safeIdSchema,
  expectationRefIds: z.array(safeIdSchema).max(32),
  exactGeometryVerified: z.literal(false),
}).strict()

const environmentSheetSchema = z.object({
  environmentSheetId: safeIdSchema,
  version: positiveVersionSchema,
  displayLabel: safeTextSchema(160),
  truthMode: z.enum(
    LIVING_FRAME_VISUAL_CONTINUITY_ENVIRONMENT_TRUTH_MODES,
  ),
  canonicalEnvironmentSummary: safeTextSchema(800),
  atmosphereSummary: safeTextSchema(600),
  depthStyle: z.enum(LIVING_FRAME_VISUAL_CONTINUITY_DEPTH_STYLES),
  styleBibleId: safeIdSchema,
  expectationRefIds: z.array(safeIdSchema).max(32),
  exactGeographyVerified: z.literal(false),
}).strict()

const sceneDesignSheetSchema = z.object({
  sceneDesignSheetId: safeIdSchema,
  order: orderSchema,
  semanticCandidateDecisionId: safeIdSchema,
  mode: z.enum(LIVING_FRAME_MODES),
  sourceTruthMode: z.enum(LIVING_FRAME_SOURCE_TRUTH_MODES),
  summary: safeTextSchema(800),
  styleBibleId: safeIdSchema,
  characterSheetIds: z.array(safeIdSchema).max(32),
  objectSheetIds: z.array(safeIdSchema).max(64),
  environmentSheetIds: z.array(safeIdSchema).max(32),
  compositionStrategy: z.enum(
    LIVING_FRAME_VISUAL_CONTINUITY_COMPOSITION_STRATEGIES,
  ),
  depthStyle: z.enum(LIVING_FRAME_VISUAL_CONTINUITY_DEPTH_STYLES),
  captionRegionExpectation: z.enum(
    LIVING_FRAME_VISUAL_CONTINUITY_REGION_EXPECTATIONS,
  ),
  faceRegionExpectation: z.enum(
    LIVING_FRAME_VISUAL_CONTINUITY_REGION_EXPECTATIONS,
  ),
  gestureRegionExpectation: z.enum(
    LIVING_FRAME_VISUAL_CONTINUITY_REGION_EXPECTATIONS,
  ),
  scaleTruthGuard: z.enum(
    LIVING_FRAME_VISUAL_CONTINUITY_SCALE_TRUTH_GUARDS,
  ),
  exactFramesProvided: z.literal(false),
  componentSceneGraphProvided: z.literal(false),
  selectedSceneAuthority: z.literal(false),
}).strict()

const motionLanguageSheetSchema = z.object({
  motionLanguageSheetId: safeIdSchema,
  version: positiveVersionSchema,
  summary: safeTextSchema(800),
  motionCharacter: z.enum(
    LIVING_FRAME_VISUAL_CONTINUITY_MOTION_CHARACTERS,
  ),
  motionDensity: z.enum(
    LIVING_FRAME_VISUAL_CONTINUITY_MOTION_DENSITIES,
  ),
  cameraCharacter: z.enum(
    LIVING_FRAME_VISUAL_CONTINUITY_CAMERA_CHARACTERS,
  ),
  stillnessPolicies: z.array(
    z.enum(LIVING_FRAME_VISUAL_CONTINUITY_STILLNESS_POLICIES),
  ).min(1).max(4),
  maximumSimultaneousPrimaryMotions: z.literal(1),
  semanticTimingOnly: z.literal(true),
  exactFramesProvided: z.literal(false),
}).strict()

const soundLanguageSheetSchema = z.object({
  soundLanguageSheetId: safeIdSchema,
  version: positiveVersionSchema,
  summary: safeTextSchema(800),
  palette: z.enum(LIVING_FRAME_VISUAL_CONTINUITY_SOUND_PALETTES),
  density: z.enum(LIVING_FRAME_VISUAL_CONTINUITY_SOUND_DENSITIES),
  narrationProtection: z.literal('strict'),
  automaticWhooshPerElement: z.literal(false),
  exactCuePlacementProvided: z.literal(false),
  exactMixProvided: z.literal(false),
}).strict()

const alphaEdgeRulesSchema = z.object({
  alphaEdgeRulesId: safeIdSchema,
  version: positiveVersionSchema,
  masterMode: z.enum(LIVING_FRAME_VISUAL_CONTINUITY_ALPHA_MASTER_MODES),
  nativeAlphaCapabilityCheckRequired: z.literal(true),
  nativeAlphaClaimIsQaApproval: z.literal(false),
  checkerboardIsTransparency: z.literal(false),
  rectangularBackgroundRejected: z.literal(true),
  testBackgrounds: z.array(
    z.enum(LIVING_FRAME_VISUAL_CONTINUITY_ALPHA_TEST_BACKGROUNDS),
  ).min(5).max(5),
  destinationCompositeQaRequired: z.literal(true),
  temporalMaskBenchmarkRequired: z.boolean(),
  qaApprovedAsset: z.literal(false),
}).strict()

const ledgerEntrySchema = z.object({
  ledgerEntryId: safeIdSchema,
  order: orderSchema,
  assetExpectationId: safeIdSchema,
  expectedAssetDigestSha256: sha256Schema,
  state: z.enum(LIVING_FRAME_VISUAL_CONTINUITY_LEDGER_STATES),
  reasonCode: z.enum(LIVING_FRAME_VISUAL_CONTINUITY_LEDGER_REASON_CODES),
  derivedSummary: safeTextSchema(600),
  linkedCharacterSheetIds: z.array(safeIdSchema).max(32),
  linkedObjectSheetIds: z.array(safeIdSchema).max(64),
  linkedEnvironmentSheetIds: z.array(safeIdSchema).max(32),
  acceptedForPlanningOnly: z.boolean(),
  qaApprovedExecutableAsset: z.literal(false),
  assetManifestAuthority: z.literal(false),
}).strict()

const sheetDependencySchema = z.object({
  fromSheetId: safeIdSchema,
  toSheetId: safeIdSchema,
  kind: z.enum(LIVING_FRAME_VISUAL_CONTINUITY_DEPENDENCY_KINDS),
}).strict()

export const LIVING_FRAME_VISUAL_CONTINUITY_AUTHORITY_BOUNDARY =
  Object.freeze({
    controlledPlanningOnly: true,
    liveEvidenceAuthority: false,
    selectedSceneAuthority: false,
    exactTimingAuthority: false,
    soundSyncAuthority: false,
    estimateAuthority: false,
    customerPriceAuthority: false,
    customerCreditAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    assetManifestAuthority: false,
    qaApprovalAuthority: false,
    providerAuthority: false,
    toolRouteAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    renderAuthority: false,
    runtimeAuthority: false,
  } as const)

export const livingFrameVisualContinuityPackDraftSchema = z.object({
  contractVersion: z.literal(LIVING_FRAME_VISUAL_CONTINUITY_PACK_VERSION),
  contractSource: z.literal(LIVING_FRAME_VISUAL_CONTINUITY_PACK_SOURCE),
  status: z.literal(LIVING_FRAME_VISUAL_CONTINUITY_PACK_STATUS),
  evidenceClass: z.literal(LIVING_FRAME_VISUAL_CONTINUITY_EVIDENCE_CLASS),
  promotionAllowed: z.literal(false),
  semanticDecisionState: z.literal('candidates_proposed'),
  workflowContext: workflowContextSchema,
  canonicalBindings: canonicalBindingsSchema,
  expectationRefs: z.array(expectationRefSchema).max(64),
  styleBible: styleBibleSchema,
  characterSheets: z.array(characterSheetSchema).max(64),
  objectSheets: z.array(objectSheetSchema).max(128),
  environmentSheets: z.array(environmentSheetSchema).max(64),
  sceneDesignSheets: z.array(sceneDesignSheetSchema).min(1).max(256),
  motionLanguageSheet: motionLanguageSheetSchema,
  soundLanguageSheet: soundLanguageSheetSchema,
  alphaEdgeRules: alphaEdgeRulesSchema,
  continuityLedger: z.array(ledgerEntrySchema).max(512),
  sheetDependencies: z.array(sheetDependencySchema).max(1_024),
  authorityBoundary: authorityBoundarySchema,
}).strict()

export const livingFrameVisualContinuityPackSchema =
  livingFrameVisualContinuityPackDraftSchema.extend({
    contractDigestSha256: sha256Schema,
  }).strict()

export class LivingFrameVisualContinuityContractError extends Error {
  readonly issues: readonly LivingFrameVisualContinuityValidationIssue[]

  constructor(issues: readonly LivingFrameVisualContinuityValidationIssue[]) {
    super('Living Frame visual continuity contract validation failed.')
    this.name = 'LivingFrameVisualContinuityContractError'
    this.issues = issues
  }
}

export function normalizeLivingFrameVisualContinuityPackDraft(
  draft: LivingFrameVisualContinuityPackDraft,
): LivingFrameVisualContinuityPackDraft {
  return {
    ...draft,
    workflowContext: structuredClone(draft.workflowContext),
    canonicalBindings: { ...draft.canonicalBindings },
    expectationRefs: [...draft.expectationRefs]
      .sort((left, right) => compareText(left.expectationId, right.expectationId))
      .map((entry) => ({ ...entry })),
    styleBible: {
      ...draft.styleBible,
      palette: [...draft.styleBible.palette]
        .sort(compareOrdered)
        .map((entry) => ({ ...entry, hex: entry.hex.toLowerCase() })),
      avoidanceCodes: sortText(draft.styleBible.avoidanceCodes),
      referenceExpectationIds: sortText(
        draft.styleBible.referenceExpectationIds,
      ),
    },
    characterSheets: [...draft.characterSheets]
      .sort((left, right) => compareText(
        left.characterSheetId,
        right.characterSheetId,
      ))
      .map((sheet) => ({
        ...sheet,
        identityRuleCodes: sortText(sheet.identityRuleCodes),
        referenceViews: [...sheet.referenceViews]
          .sort(compareOrdered)
          .map((entry) => ({ ...entry })),
        expectationRefIds: sortText(sheet.expectationRefIds),
      })),
    objectSheets: [...draft.objectSheets]
      .sort((left, right) => compareText(
        left.objectSheetId,
        right.objectSheetId,
      ))
      .map((sheet) => ({
        ...sheet,
        separabilityCodes: sortText(sheet.separabilityCodes),
        expectationRefIds: sortText(sheet.expectationRefIds),
      })),
    environmentSheets: [...draft.environmentSheets]
      .sort((left, right) => compareText(
        left.environmentSheetId,
        right.environmentSheetId,
      ))
      .map((sheet) => ({
        ...sheet,
        expectationRefIds: sortText(sheet.expectationRefIds),
      })),
    sceneDesignSheets: [...draft.sceneDesignSheets]
      .sort(compareOrdered)
      .map((sheet) => ({
        ...sheet,
        characterSheetIds: sortText(sheet.characterSheetIds),
        objectSheetIds: sortText(sheet.objectSheetIds),
        environmentSheetIds: sortText(sheet.environmentSheetIds),
      })),
    motionLanguageSheet: {
      ...draft.motionLanguageSheet,
      stillnessPolicies: sortText(
        draft.motionLanguageSheet.stillnessPolicies,
      ),
    },
    soundLanguageSheet: { ...draft.soundLanguageSheet },
    alphaEdgeRules: {
      ...draft.alphaEdgeRules,
      testBackgrounds: sortText(draft.alphaEdgeRules.testBackgrounds),
    },
    continuityLedger: [...draft.continuityLedger]
      .sort(compareOrdered)
      .map((entry) => ({
        ...entry,
        linkedCharacterSheetIds: sortText(entry.linkedCharacterSheetIds),
        linkedObjectSheetIds: sortText(entry.linkedObjectSheetIds),
        linkedEnvironmentSheetIds: sortText(entry.linkedEnvironmentSheetIds),
      })),
    sheetDependencies: [...draft.sheetDependencies]
      .sort((left, right) => compareText(
        dependencyIdentity(left),
        dependencyIdentity(right),
      ))
      .map((dependency) => ({ ...dependency })),
    authorityBoundary: { ...draft.authorityBoundary },
  }
}

export async function calculateLivingFrameVisualContinuityPackDigest(
  input: unknown,
): Promise<string> {
  const preflightIssues = inspectJsonInput(input)
  if (preflightIssues.length > 0) {
    throw new LivingFrameVisualContinuityContractError(preflightIssues)
  }
  const parsed = livingFrameVisualContinuityPackDraftSchema.safeParse(input)
  if (!parsed.success) {
    throw new LivingFrameVisualContinuityContractError(
      mapZodIssues(parsed.error.issues),
    )
  }
  const normalized = normalizeLivingFrameVisualContinuityPackDraft(parsed.data)
  const semanticIssues = validateSemanticPack(normalized)
  if (semanticIssues.length > 0) {
    throw new LivingFrameVisualContinuityContractError(semanticIssues)
  }
  if (!globalThis.crypto?.subtle) {
    throw new LivingFrameVisualContinuityContractError([
      issue('crypto_unavailable', '$.contractDigestSha256'),
    ])
  }
  try {
    const digest = await globalThis.crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(canonicalJsonStringify(normalized)),
    )
    return [...new Uint8Array(digest)]
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
  } catch {
    throw new LivingFrameVisualContinuityContractError([
      issue('digest_calculation_failed', '$.contractDigestSha256'),
    ])
  }
}

export async function createLivingFrameVisualContinuityPack(
  input: unknown,
): Promise<LivingFrameVisualContinuityPack> {
  const parsed = parseAndValidateDraft(input)
  return {
    ...parsed,
    contractDigestSha256:
      await calculateLivingFrameVisualContinuityPackDigest(parsed),
  }
}

export async function validateLivingFrameVisualContinuityPack(
  input: unknown,
): Promise<LivingFrameVisualContinuityValidationResult> {
  const preflightIssues = inspectJsonInput(input)
  if (preflightIssues.length > 0) return { ok: false, issues: preflightIssues }
  const parsed = livingFrameVisualContinuityPackSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, issues: mapZodIssues(parsed.error.issues) }
  }
  const { contractDigestSha256, ...draft } = parsed.data
  const normalized = normalizeLivingFrameVisualContinuityPackDraft(draft)
  const semanticIssues = validateSemanticPack(normalized)
  if (semanticIssues.length > 0) {
    return { ok: false, issues: semanticIssues }
  }
  let expectedDigest: string
  try {
    expectedDigest =
      await calculateLivingFrameVisualContinuityPackDigest(normalized)
  } catch (error) {
    return {
      ok: false,
      issues: error instanceof LivingFrameVisualContinuityContractError
        ? error.issues
        : [issue('digest_calculation_failed', '$.contractDigestSha256')],
    }
  }
  if (contractDigestSha256 !== expectedDigest) {
    return {
      ok: false,
      issues: [issue('digest_mismatch', '$.contractDigestSha256')],
    }
  }
  return {
    ok: true,
    pack: { ...normalized, contractDigestSha256: expectedDigest },
  }
}

function parseAndValidateDraft(
  input: unknown,
): LivingFrameVisualContinuityPackDraft {
  const preflightIssues = inspectJsonInput(input)
  if (preflightIssues.length > 0) {
    throw new LivingFrameVisualContinuityContractError(preflightIssues)
  }
  const parsed = livingFrameVisualContinuityPackDraftSchema.safeParse(input)
  if (!parsed.success) {
    throw new LivingFrameVisualContinuityContractError(
      mapZodIssues(parsed.error.issues),
    )
  }
  const normalized = normalizeLivingFrameVisualContinuityPackDraft(parsed.data)
  const semanticIssues = validateSemanticPack(normalized)
  if (semanticIssues.length > 0) {
    throw new LivingFrameVisualContinuityContractError(semanticIssues)
  }
  return normalized
}

function validateSemanticPack(
  draft: LivingFrameVisualContinuityPackDraft,
): readonly LivingFrameVisualContinuityValidationIssue[] {
  const issues: LivingFrameVisualContinuityValidationIssue[] = []
  const add = (
    code: LivingFrameVisualContinuityValidationIssueCode,
    path: string,
  ) => issues.push(issue(code, path))

  if (
    canonicalJsonStringify(draft.authorityBoundary)
    !== canonicalJsonStringify(
      LIVING_FRAME_VISUAL_CONTINUITY_AUTHORITY_BOUNDARY,
    )
  ) add('authority_boundary_invalid', '$.authorityBoundary')

  validateUnique(
    draft.expectationRefs.map((entry) => entry.expectationId),
    '$.expectationRefs',
    add,
  )
  const expectationIds = new Set(
    draft.expectationRefs.map((entry) => entry.expectationId),
  )
  const motionExpectations = draft.expectationRefs.filter(
    (entry) =>
      entry.expectationKind === 'motion_storytelling_style_expectation',
  )
  if (
    draft.workflowContext.kind === 'ordinary_edit_video'
    && motionExpectations.length > 0
  ) add('workflow_context_invalid', '$.expectationRefs')
  if (
    draft.workflowContext.kind === 'motion_storytelling_optional_context'
    && motionExpectations.length !== 1
  ) add('workflow_context_invalid', '$.expectationRefs')

  validateOrdered(draft.styleBible.palette, '$.styleBible.palette', add)
  validateUnique(
    draft.styleBible.palette.map((entry) => entry.colorId),
    '$.styleBible.palette',
    add,
  )
  validateUnique(
    draft.styleBible.palette.map((entry) => entry.role),
    '$.styleBible.palette',
    add,
  )
  validateUnique(
    draft.styleBible.referenceExpectationIds,
    '$.styleBible.referenceExpectationIds',
    add,
  )
  validateReferences(
    draft.styleBible.referenceExpectationIds,
    expectationIds,
    '$.styleBible.referenceExpectationIds',
    add,
  )

  validateUnique(
    draft.characterSheets.map((entry) => entry.characterSheetId),
    '$.characterSheets',
    add,
  )
  validateUnique(
    draft.objectSheets.map((entry) => entry.objectSheetId),
    '$.objectSheets',
    add,
  )
  validateUnique(
    draft.environmentSheets.map((entry) => entry.environmentSheetId),
    '$.environmentSheets',
    add,
  )
  validateOrdered(draft.sceneDesignSheets, '$.sceneDesignSheets', add)
  validateUnique(
    draft.sceneDesignSheets.map((entry) => entry.sceneDesignSheetId),
    '$.sceneDesignSheets',
    add,
  )
  validateUnique(
    draft.sceneDesignSheets.map(
      (entry) => entry.semanticCandidateDecisionId,
    ),
    '$.sceneDesignSheets',
    add,
  )
  validateOrdered(draft.continuityLedger, '$.continuityLedger', add)
  validateUnique(
    draft.continuityLedger.map((entry) => entry.ledgerEntryId),
    '$.continuityLedger',
    add,
  )
  validateUnique(
    draft.continuityLedger.map((entry) => entry.assetExpectationId),
    '$.continuityLedger',
    add,
  )

  const styleId = draft.styleBible.styleBibleId
  const characterIds = new Set(
    draft.characterSheets.map((entry) => entry.characterSheetId),
  )
  const objectIds = new Set(
    draft.objectSheets.map((entry) => entry.objectSheetId),
  )
  const environmentIds = new Set(
    draft.environmentSheets.map((entry) => entry.environmentSheetId),
  )
  const sceneIds = new Set(
    draft.sceneDesignSheets.map((entry) => entry.sceneDesignSheetId),
  )
  const allSheetIds = new Set([
    styleId,
    ...characterIds,
    ...objectIds,
    ...environmentIds,
    ...sceneIds,
    draft.motionLanguageSheet.motionLanguageSheetId,
    draft.soundLanguageSheet.soundLanguageSheetId,
    draft.alphaEdgeRules.alphaEdgeRulesId,
  ])
  if (
    allSheetIds.size
    !== 4
      + draft.characterSheets.length
      + draft.objectSheets.length
      + draft.environmentSheets.length
      + draft.sceneDesignSheets.length
  ) add('duplicate_id', '$')

  for (const [index, sheet] of draft.characterSheets.entries()) {
    const path = `$.characterSheets[${index}]`
    if (sheet.styleBibleId !== styleId) {
      add('dangling_reference', `${path}.styleBibleId`)
    }
    validateUnique(
      sheet.expectationRefIds,
      `${path}.expectationRefIds`,
      add,
    )
    validateReferences(
      sheet.expectationRefIds,
      expectationIds,
      `${path}.expectationRefIds`,
      add,
    )
    validateOrdered(sheet.referenceViews, `${path}.referenceViews`, add)
    validateUnique(
      sheet.referenceViews.map((entry) => entry.referenceViewId),
      `${path}.referenceViews`,
      add,
    )
    validateIdentitySafety(sheet, path, expectationIds, draft, add)
  }

  for (const [index, sheet] of draft.objectSheets.entries()) {
    const path = `$.objectSheets[${index}]`
    if (sheet.styleBibleId !== styleId) {
      add('dangling_reference', `${path}.styleBibleId`)
    }
    validateUnique(
      sheet.expectationRefIds,
      `${path}.expectationRefIds`,
      add,
    )
    validateReferences(
      sheet.expectationRefIds,
      expectationIds,
      `${path}.expectationRefIds`,
      add,
    )
    if (
      sheet.truthMode === 'exact_geography_symbol_required'
      && !hasFactSafetyExpectation(sheet.expectationRefIds, draft)
    ) add('geography_or_data_truth_invalid', `${path}.expectationRefIds`)
  }

  for (const [index, sheet] of draft.environmentSheets.entries()) {
    const path = `$.environmentSheets[${index}]`
    if (sheet.styleBibleId !== styleId) {
      add('dangling_reference', `${path}.styleBibleId`)
    }
    validateUnique(
      sheet.expectationRefIds,
      `${path}.expectationRefIds`,
      add,
    )
    validateReferences(
      sheet.expectationRefIds,
      expectationIds,
      `${path}.expectationRefIds`,
      add,
    )
    if (
      sheet.truthMode === 'exact_geography_required'
      && !hasFactSafetyExpectation(sheet.expectationRefIds, draft)
    ) add('fact_safety_invalid', `${path}.expectationRefIds`)
  }

  for (const [index, scene] of draft.sceneDesignSheets.entries()) {
    const path = `$.sceneDesignSheets[${index}]`
    if (scene.styleBibleId !== styleId) {
      add('dangling_reference', `${path}.styleBibleId`)
    }
    validateUnique(scene.characterSheetIds, `${path}.characterSheetIds`, add)
    validateUnique(scene.objectSheetIds, `${path}.objectSheetIds`, add)
    validateUnique(
      scene.environmentSheetIds,
      `${path}.environmentSheetIds`,
      add,
    )
    validateReferences(
      scene.characterSheetIds,
      characterIds,
      `${path}.characterSheetIds`,
      add,
    )
    validateReferences(
      scene.objectSheetIds,
      objectIds,
      `${path}.objectSheetIds`,
      add,
    )
    validateReferences(
      scene.environmentSheetIds,
      environmentIds,
      `${path}.environmentSheetIds`,
      add,
    )
    if (
      scene.sourceTruthMode === 'exact_geography_verification_required'
      && !['literal_relationship_preserved', 'perspective_only']
        .includes(scene.scaleTruthGuard)
    ) add('geography_or_data_truth_invalid', `${path}.scaleTruthGuard`)
    if (
      scene.sourceTruthMode === 'exact_data_verification_required'
      && scene.scaleTruthGuard !== 'data_proportion_preserved'
    ) add('geography_or_data_truth_invalid', `${path}.scaleTruthGuard`)
  }

  const expectedAlphaBackgrounds = new Set(
    LIVING_FRAME_VISUAL_CONTINUITY_ALPHA_TEST_BACKGROUNDS,
  )
  const actualAlphaBackgrounds = new Set(
    draft.alphaEdgeRules.testBackgrounds,
  )
  if (
    actualAlphaBackgrounds.size !== expectedAlphaBackgrounds.size
    || [...expectedAlphaBackgrounds].some(
      (entry) => !actualAlphaBackgrounds.has(entry),
    )
  ) add('alpha_policy_invalid', '$.alphaEdgeRules.testBackgrounds')
  const livingARollPresent = draft.sceneDesignSheets.some(
    (scene) => scene.mode === 'living_a_roll',
  )
  if (
    livingARollPresent
    && !draft.alphaEdgeRules.temporalMaskBenchmarkRequired
  ) {
    add(
      'alpha_policy_invalid',
      '$.alphaEdgeRules.temporalMaskBenchmarkRequired',
    )
  }

  for (const [index, entry] of draft.continuityLedger.entries()) {
    const path = `$.continuityLedger[${index}]`
    validateUnique(
      entry.linkedCharacterSheetIds,
      `${path}.linkedCharacterSheetIds`,
      add,
    )
    validateUnique(
      entry.linkedObjectSheetIds,
      `${path}.linkedObjectSheetIds`,
      add,
    )
    validateUnique(
      entry.linkedEnvironmentSheetIds,
      `${path}.linkedEnvironmentSheetIds`,
      add,
    )
    validateReferences(
      entry.linkedCharacterSheetIds,
      characterIds,
      `${path}.linkedCharacterSheetIds`,
      add,
    )
    validateReferences(
      entry.linkedObjectSheetIds,
      objectIds,
      `${path}.linkedObjectSheetIds`,
      add,
    )
    validateReferences(
      entry.linkedEnvironmentSheetIds,
      environmentIds,
      `${path}.linkedEnvironmentSheetIds`,
      add,
    )
    const shouldBeAccepted =
      entry.state === 'accepted_for_continuity_planning_only'
    if (entry.acceptedForPlanningOnly !== shouldBeAccepted) {
      add('ledger_promotion_invalid', `${path}.acceptedForPlanningOnly`)
    }
  }

  validateUnique(
    draft.sheetDependencies.map(dependencyIdentity),
    '$.sheetDependencies',
    add,
  )
  const dependencyEdges: Array<readonly [string, string]> = []
  for (const [index, dependency] of draft.sheetDependencies.entries()) {
    const path = `$.sheetDependencies[${index}]`
    if (
      !allSheetIds.has(dependency.fromSheetId)
      || !allSheetIds.has(dependency.toSheetId)
      || dependency.fromSheetId === dependency.toSheetId
    ) add('dangling_reference', path)
    else dependencyEdges.push([
      dependency.fromSheetId,
      dependency.toSheetId,
    ])
  }
  if (hasDirectedCycle(allSheetIds, dependencyEdges)) {
    add('cyclic_dependency', '$.sheetDependencies')
  }

  return dedupeIssues(issues)
}

function validateIdentitySafety(
  sheet: LivingFrameVisualContinuityPackDraft['characterSheets'][number],
  path: string,
  expectationIds: ReadonlySet<string>,
  draft: LivingFrameVisualContinuityPackDraft,
  add: (
    code: LivingFrameVisualContinuityValidationIssueCode,
    path: string,
  ) => void,
): void {
  validateReferences(
    sheet.expectationRefIds,
    expectationIds,
    `${path}.expectationRefIds`,
    add,
  )
  const hasCharacterExpectation = sheet.expectationRefIds.some((id) =>
    draft.expectationRefs.some(
      (entry) =>
        entry.expectationId === id
        && entry.expectationKind ===
          'character_consistency_plan_expectation',
    ),
  )
  const hasFactExpectation =
    hasFactSafetyExpectation(sheet.expectationRefIds, draft)
  if (!hasCharacterExpectation) {
    add('identity_safety_invalid', `${path}.expectationRefIds`)
  }
  if (
    sheet.identityKind === 'canonical_illustrative_interpretation'
    && (
      sheet.sourceTruthMode !== 'canonical_illustrative_interpretation'
      || sheet.identitySafetyState !== 'canonical_interpretation_only'
      || !sheet.identityRuleCodes.includes('do_not_claim_verified_likeness')
    )
  ) add('identity_safety_invalid', path)
  if (
    sheet.identityKind === 'real_person_neutral_reference_only'
    && (
      !hasFactExpectation
      || ![
        'neutral_reference_only',
        'blocked_pending_consent_and_identity_review',
      ].includes(sheet.identitySafetyState)
    )
  ) add('identity_safety_invalid', path)
  if (
    sheet.identityKind === 'source_speaker_no_likeness_generation'
    && sheet.identitySafetyState !== 'source_speaker_no_generation'
  ) add('identity_safety_invalid', path)
}

function hasFactSafetyExpectation(
  expectationRefIds: readonly string[],
  draft: LivingFrameVisualContinuityPackDraft,
): boolean {
  return expectationRefIds.some((id) => draft.expectationRefs.some(
    (entry) =>
      entry.expectationId === id
      && entry.expectationKind ===
        'documentary_fact_safety_plan_expectation',
  ))
}

function validateOrdered(
  values: readonly { readonly order: number }[],
  path: string,
  add: (
    code: LivingFrameVisualContinuityValidationIssueCode,
    path: string,
  ) => void,
): void {
  const orders = values.map((entry) => entry.order)
  if (new Set(orders).size !== orders.length) {
    add('duplicate_order', path)
    return
  }
  for (let index = 0; index < orders.length; index += 1) {
    if (orders[index] !== index) {
      add('semantic_order_invalid', path)
      return
    }
  }
}

function validateUnique(
  values: readonly string[],
  path: string,
  add: (
    code: LivingFrameVisualContinuityValidationIssueCode,
    path: string,
  ) => void,
): void {
  if (new Set(values).size !== values.length) add('duplicate_id', path)
}

function validateReferences(
  values: readonly string[],
  allowed: ReadonlySet<string>,
  path: string,
  add: (
    code: LivingFrameVisualContinuityValidationIssueCode,
    path: string,
  ) => void,
): void {
  if (values.some((value) => !allowed.has(value))) {
    add('dangling_reference', path)
  }
}

function hasDirectedCycle(
  nodes: ReadonlySet<string>,
  edges: readonly (readonly [string, string])[],
): boolean {
  const outgoing = new Map<string, string[]>()
  for (const node of nodes) outgoing.set(node, [])
  for (const [from, to] of edges) outgoing.get(from)?.push(to)
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const visit = (node: string): boolean => {
    if (visiting.has(node)) return true
    if (visited.has(node)) return false
    visiting.add(node)
    for (const next of outgoing.get(node) ?? []) {
      if (visit(next)) return true
    }
    visiting.delete(node)
    visited.add(node)
    return false
  }
  return [...nodes].some(visit)
}

function inspectJsonInput(
  input: unknown,
): readonly LivingFrameVisualContinuityValidationIssue[] {
  const issues: LivingFrameVisualContinuityValidationIssue[] = []
  const seen = new Set<object>()
  const visit = (value: unknown, path: string): void => {
    if (
      value === undefined
      || typeof value === 'bigint'
      || typeof value === 'function'
      || typeof value === 'symbol'
      || typeof value === 'number' && !Number.isFinite(value)
    ) {
      issues.push(issue('non_json_input', path))
      return
    }
    if (value === null || typeof value !== 'object') return
    if (seen.has(value)) {
      issues.push(issue('non_json_input', path))
      return
    }
    seen.add(value)
    if (Array.isArray(value)) {
      value.forEach((entry, index) => visit(entry, `${path}[${index}]`))
      return
    }
    if (Object.getPrototypeOf(value) !== Object.prototype) {
      issues.push(issue('non_json_input', path))
      return
    }
    for (const [key, entry] of Object.entries(value)) {
      const childPath = `${path}.${key}`
      if (FORBIDDEN_KEYS.has(key)) {
        issues.push(issue('forbidden_key', childPath))
      } else visit(entry, childPath)
    }
  }
  visit(input, '$')
  return dedupeIssues(issues)
}

function canonicalJsonStringify(value: unknown): string {
  const stringify = (entry: unknown): string => {
    if (entry === null) return 'null'
    if (typeof entry === 'string' || typeof entry === 'boolean') {
      return JSON.stringify(entry)
    }
    if (typeof entry === 'number') {
      if (!Number.isFinite(entry)) throw new TypeError('Non-JSON number.')
      return JSON.stringify(entry)
    }
    if (Array.isArray(entry)) {
      return `[${entry.map((item) => stringify(item)).join(',')}]`
    }
    if (typeof entry === 'object') {
      const record = entry as Record<string, unknown>
      return `{${Object.keys(record).sort().map(
        (key) => `${JSON.stringify(key)}:${stringify(record[key])}`,
      ).join(',')}}`
    }
    throw new TypeError('Non-JSON value.')
  }
  return stringify(value)
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function compareOrdered(
  left: { readonly order: number },
  right: { readonly order: number },
): number {
  return left.order - right.order
}

function sortText<T extends string>(values: readonly T[]): T[] {
  return [...values].sort(compareText)
}

function dependencyIdentity(
  dependency: {
    readonly fromSheetId: string
    readonly toSheetId: string
    readonly kind: string
  },
): string {
  return [
    dependency.fromSheetId,
    dependency.toSheetId,
    dependency.kind,
  ].join('\u0000')
}

function hasControlCharacter(value: string): boolean {
  return [...value].some((character) => {
    const codePoint = character.codePointAt(0)
    return codePoint !== undefined && (codePoint <= 31 || codePoint === 127)
  })
}

function mapZodIssues(
  zodIssues: readonly z.ZodIssue[],
): readonly LivingFrameVisualContinuityValidationIssue[] {
  const unsafeTextMessages = new Set([
    'Control characters are forbidden.',
    'URLs and filesystem paths are forbidden.',
    'Secret-like content is forbidden.',
  ])
  return dedupeIssues(zodIssues.map((entry) => issue(
    unsafeTextMessages.has(entry.message)
      ? 'unsafe_text'
      : 'schema_rejected',
    entry.path.length === 0 ? '$' : `$.${entry.path.join('.')}`,
  )))
}

function issue(
  code: LivingFrameVisualContinuityValidationIssueCode,
  path: string,
): LivingFrameVisualContinuityValidationIssue {
  return { code, path }
}

function dedupeIssues(
  issues: readonly LivingFrameVisualContinuityValidationIssue[],
): readonly LivingFrameVisualContinuityValidationIssue[] {
  const seen = new Set<string>()
  return issues.filter((entry) => {
    const identity = `${entry.code}\u0000${entry.path}`
    if (seen.has(identity)) return false
    seen.add(identity)
    return true
  })
}
