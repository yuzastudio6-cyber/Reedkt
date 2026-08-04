import type { ID, ISODateString } from '../shared'
import type {
  MotionStudioOwnership,
  MotionStudioTimingAuthority,
  MotionStudioVersionReference,
} from './shared'
import type { ProductionMode } from './production'
import type { StorytellingStoryContinuityGrammar } from './story-continuity'

export interface MotionLanguageReference {
  motionLanguageId: ID
  motionLanguageVersion: string
  motionLanguageDigest: string
}

export interface NarrativeFunctionReference {
  narrativeFunctionId: ID
  narrativeFunctionVersion: string
  narrativeFunctionDigest: string
}

export interface MotionLanguageDefinition {
  id: ID
  version: string
  contentDigest: string
  name: string
  scope: 'system' | 'workspace_private'
  workspaceId?: ID
  visualGrammar: {
    visualFamilies: string[]
    shapeLanguage: string[]
    depthLanguage: string[]
  }
  typographyGrammar: {
    hierarchyRules: string[]
    typeTokenIds: string[]
    textMotionRules: string[]
  }
  colorSemantics: {
    paletteTokenIds: string[]
    accentRules: string[]
    contrastRules: string[]
  }
  textureMaterialGrammar: {
    materials: string[]
    textures: string[]
    grainRules: string[]
  }
  compositionGrammar: {
    hierarchyRules: string[]
    safeZoneRules: string[]
    densityRules: string[]
  }
  cameraGrammar: {
    allowedMoves: string[]
    lensLanguage: string[]
    focusRules: string[]
  }
  motionGrammar: {
    entrances: string[]
    exits: string[]
    emphasis: string[]
    easingTokenIds: string[]
  }
  transitionGrammar: {
    families: string[]
    continuityRules: string[]
  }
  atmosphereGrammar: {
    lightingRules: string[]
    environmentalRules: string[]
    emotionalQualities: string[]
  }
  pacingCharacter: string[]
  soundDesignInfluence: string[]
  prohibitedCharacteristics: string[]
  immutable: true
}

export interface NarrativeFunctionDefinition {
  id: ID
  version: string
  contentDigest: string
  name: string
  category: 'orientation' | 'introduction' | 'temporal' | 'explanation' | 'comparison' | 'evidence' | 'emotional' | 'transition' | 'resolution'
  semanticPurpose: string
  inputEvidenceRequirements: string[]
  intendedViewerUnderstanding: string[]
  intendedEmotionalOutcome: string[]
  requiredEvidenceLevel: 'none' | 'contextual' | 'source_backed' | 'source_exact'
  supportedStoryBeatForms: string[]
  continuityExpectations: string[]
  completionCriteria: string[]
  truthAccuracyRequirements: string[]
  allowedVisualTreatmentFamilies: string[]
  pacingGuidance: string[]
  transitionGuidance: string[]
  textDataPrecision: 'representative' | 'precise' | 'source_exact'
  disclosureRequirements: string[]
  failureRules: string[]
  fallbackRules: string[]
  providerRoutingAllowed: false
  toolExecutionAllowed: false
  immutable: true
}

export interface ProductionBrief extends MotionStudioOwnership {
  id: ID
  productionId: ID
  title: string
  objective: string
  audience: string
  platform: string
  targetDurationSeconds?: number
  language: string
  tone: string[]
  prohibitedElements: string[]
  openQuestions: string[]
}

export interface StoryBible extends MotionStudioOwnership {
  id: ID
  productionId: ID
  premise: string
  narrativeAngle: string
  narratorPerspective: string
  chapters: string[]
  people: string[]
  locations: string[]
  events: string[]
  emotionalArc: string[]
  approvedDecisionIds: ID[]
}

export interface PreparedScriptChapter {
  id: ID
  order: number
  title: string
  sceneIds: ID[]
}

export interface PreparedScriptNarrationSegment {
  id: ID
  order: number
  chapterId: ID
  sceneId: ID
  startTimingAnchorId: ID
  endTimingAnchorId: ID
  startFrame: number
  endFrame: number
  text: string
  meaning: string
  visualCue: string
  preservationPolicy: 'preserve_exact'
  claimIds: ID[]
  sourceReferenceIds: ID[]
}

/** Exact user-prepared narration text tied to confirmed frame authority. */
export interface PreparedScript extends MotionStudioOwnership {
  id: ID
  productionId: ID
  scriptMode: 'prepared'
  title: string
  language: string
  timingAuthority: MotionStudioTimingAuthority
  chapters: PreparedScriptChapter[]
  narrationSegments: PreparedScriptNarrationSegment[]
  userLockedText: true
}

export interface ResearchSourceReference {
  sourceId: ID
  title: string
  sourceType: 'user_upload' | 'web_source' | 'archive' | 'interview' | 'dataset' | 'other'
  trustStatus: 'untrusted_input' | 'reviewed' | 'authoritative' | 'disputed'
  rightsStatus: 'unknown' | 'user_authorized' | 'licensed' | 'public_domain' | 'restricted'
  retrievedAt?: ISODateString
}

export interface ResearchPack extends MotionStudioOwnership {
  id: ID
  productionId: ID
  researchQuestion: string
  sources: ResearchSourceReference[]
  findings: string[]
  contradictions: string[]
  unresolvedQuestions: string[]
  instructionsFromSourcesExecutable: false
}

export type ClaimClassification =
  | 'verified_fact'
  | 'widely_reported'
  | 'reported_allegation'
  | 'disputed_claim'
  | 'director_inference'
  | 'creative_reconstruction'
  | 'speculation'
  | 'fiction'

export interface ClaimLedgerEntry {
  id: ID
  claim: string
  classification: ClaimClassification
  sourceIds: ID[]
  confidence: 'low' | 'medium' | 'high'
  alternativeInterpretations: string[]
  scriptArtifactVersionIds: ID[]
  sceneIds: ID[]
  disclosureRequired: boolean
}

export interface ClaimLedger extends MotionStudioOwnership {
  id: ID
  productionId: ID
  entries: ClaimLedgerEntry[]
  reviewedAt?: ISODateString
}

export type VisualNeedKind =
  | 'location'
  | 'person'
  | 'chronology'
  | 'process'
  | 'comparison'
  | 'evidence'
  | 'data'
  | 'quote'
  | 'transition'
  | 'atmosphere'

export interface VisualNeed {
  id: ID
  narrativePurpose: string
  kind: VisualNeedKind
  linkedClaimIds: ID[]
  preferredTreatment: string
  requiredAccuracy: 'representative' | 'precise' | 'source_exact'
  assetIds: ID[]
  missing: boolean
}

export interface VisualCoveragePlan extends MotionStudioOwnership {
  id: ID
  productionId: ID
  needs: VisualNeed[]
  coverageStatus: 'incomplete' | 'review_needed' | 'complete'
}

export type ReferenceRole =
  | 'style'
  | 'composition'
  | 'character'
  | 'location'
  | 'object'
  | 'motion'
  | 'camera'
  | 'first_frame'
  | 'last_frame'
  | 'do_not_copy'

export interface ReferenceContract extends MotionStudioOwnership {
  id: ID
  productionId: ID
  assetId: ID
  roles: ReferenceRole[]
  extract: string[]
  preserve: string[]
  avoidCopying: string[]
  contentTrust: 'untrusted_input'
  executableInstructionsAllowed: false
}

export interface MotionDNA extends MotionStudioOwnership {
  id: ID
  productionId: ID
  visualIdentity: {
    paletteTokenIds: string[]
    typographyTokenIds: string[]
    materialDescriptors: string[]
    textureDescriptors: string[]
  }
  compositionGrammar: {
    hierarchyRules: string[]
    depthRules: string[]
    safeZoneRuleIds: string[]
  }
  motionGrammar: {
    entranceFamilies: string[]
    exitFamilies: string[]
    emphasisFamilies: string[]
    easingTokenIds: string[]
  }
  cameraGrammar: {
    allowedMoves: string[]
    prohibitedMoves: string[]
    parallaxPolicy: string
  }
  audioGrammar: {
    speechPriority: true
    cueFamilies: string[]
    prohibitedAudioCharacteristics: string[]
  }
  continuityRules: string[]
  storyContinuityGrammar?: StorytellingStoryContinuityGrammar
  prohibitedCharacteristics: string[]
  referenceContractIds: ID[]
}

export interface MotionStrategy extends MotionStudioOwnership {
  id: ID
  productionId: ID
  defaultMode: ProductionMode
  sceneModeOverrides: Record<ID, ProductionMode>
  routeRationale: string[]
  calibrationRequired: boolean
  approvedMotionLanguages: MotionLanguageReference[]
}

export interface VoiceBible extends MotionStudioOwnership {
  id: ID
  productionId: ID
  providerCapability: 'speech_generation' | 'uploaded_narration'
  voiceProfileReference?: string
  performanceDirection: string[]
  pronunciationDictionary: Record<string, string>
  sceneTakeVersionIds: ID[]
  alignmentArtifactVersionId?: ID
  aiVoiceDisclosureRequired: boolean
  cloningEnabled: false
  dubbingEnabled: false
  consentEvidenceId?: ID
  uploadedNarration?: UploadedNarrationAuthority
}

export interface UploadedNarrationAuthority {
  authorityStatus: 'verified_private_upload'
  uploadIntentId: ID
  mediaAssetId: ID
  storageObjectRecordId: ID
  authorityRevision: number
  authorityChecksumSha256: string
  storageIdentityHash: string
  bindingHash: string
  mimeType: 'audio/wav' | 'audio/mpeg' | 'audio/mp3'
  byteLength: number
  checksumSha256: string
  audioCodec: string
  sampleRateHertz: number
  channelCount: number
  durationMilliseconds: number
}

export interface MusicBible extends MotionStudioOwnership {
  id: ID
  productionId: ID
  scoreMode: 'generated_score' | 'uploaded_music' | 'uploaded_stems' | 'hybrid'
  mood: string[]
  instrumentation: string[]
  vocalPolicy: 'instrumental_only' | 'vocals_allowed_outside_speech'
  speechSafetyRules: string[]
  rightsEvidenceIds: ID[]
  sourceAssetVersionIds: ID[]
}

export interface CueSheetItem {
  id: ID
  role: 'music' | 'foley' | 'ambience' | 'exact_sfx' | 'transition' | 'ducking'
  startTimingAnchorId: ID
  endTimingAnchorId: ID
  sourceAssetId?: ID
  generationCapability?: string
  reason: string
}

export interface CueSheet extends MotionStudioOwnership {
  id: ID
  productionId: ID
  musicBibleVersion: MotionStudioVersionReference
  items: CueSheetItem[]
}
