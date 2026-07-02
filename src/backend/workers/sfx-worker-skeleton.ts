import type {
  GeneratedAssetRecord,
  SFXGeneratedAssetRecord,
  SFXMixPlanRecord,
  SFXTimingAlignmentRecord,
  SFXTrimPlanRecord,
} from '../../types'
import { unwrapServiceResult } from '../service-result'
import { createMockId, insertMockRecord, nowIso, type MockDatabase } from '../mock/mock-database'
import { analyzeMockSFXWaveform } from '../services/sfx-waveform-analysis-service'
import { detectSFXTransient } from '../services/sfx-transient-detection-service'
import { createSFXTrimPlan } from '../services/sfx-trim-service'
import { createSFXTimingAlignment } from '../services/sfx-hit-alignment-service'
import { createSFXMixPlan } from '../services/sfx-mix-planning-service'
import { runSFXQA } from '../services/sfx-qa-service'
import { processGeneratedSFXForLibraryGrowth } from '../services/sfx-library-service'
import {
  createSFXWorkerBlockedEvent,
  createSFXWorkerCompletedEvent,
  createSFXWorkerFailedEvent,
  createSFXWorkerLibraryMatchEvent,
  createSFXWorkerProgressEvent,
  createSFXWorkerStartedEvent,
} from './sfx-worker-events'
import { createMockSFXWaveformHint } from './sfx-worker-mock-runtime'
import {
  buildSFXProviderRequestFromWorkerInput,
  generateSFXWithProvider,
  type SFXProviderGenerateResponse,
} from '../providers/sfx'
import { routeSFXWorkerProvider } from './sfx-worker-provider-router'
import { validateSFXGenerationGate } from './sfx-worker-validation'
import type {
  MockSFXProviderResponse,
  SFXWorkerContext,
  SFXWorkerFailure,
  SFXWorkerInput,
  SFXWorkerLoadedRecords,
  SFXWorkerMockRecordBundle,
  SFXWorkerOutput,
  SFXWorkerRunResult,
} from './sfx-worker-contracts'

export function prepareSFXWorkerContext(overrides: Partial<SFXWorkerContext> = {}): SFXWorkerContext {
  return {
    runtime: 'mock',
    provider: 'Mirelo SFX V1.5',
    providerKey: 'mirelo_sfx_v1_5',
    modelName: 'mirelo-sfx-v1.5',
    region: 'us-central1',
    secretReferenceName: 'GOOGLE_SECRET_MIRELO_API_KEY_NAME',
    outputBucket: 'mock-reeditpro-sfx-output',
    outputPathPrefix: 'generated-sfx',
    ...overrides,
  }
}

export function loadSFXWorkerMockRecords(
  _input: SFXWorkerInput,
  records: SFXWorkerMockRecordBundle,
): SFXWorkerLoadedRecords | undefined {
  if (
    !records.job ||
    !records.editPlan ||
    !records.creditEstimate ||
    !records.creditApproval ||
    !records.creditReservation ||
    !records.generationRequest ||
    !records.sfxEventPlan ||
    !records.sfxProviderRoute ||
    !records.sfxPromptPlan
  ) {
    return undefined
  }

  return {
    job: records.job,
    editPlan: records.editPlan,
    creditEstimate: records.creditEstimate,
    creditApproval: records.creditApproval,
    creditReservation: records.creditReservation,
    generationRequest: records.generationRequest,
    sfxEventPlan: records.sfxEventPlan,
    sfxProviderRoute: records.sfxProviderRoute,
    sfxPromptPlan: records.sfxPromptPlan,
  }
}

export function createSFXGeneratedAssetFromWorker(input: {
  workerInput: SFXWorkerInput
  providerResponse: MockSFXProviderResponse
  records: SFXWorkerLoadedRecords
  generatedAsset?: GeneratedAssetRecord
}): SFXGeneratedAssetRecord {
  const { providerResponse, records, workerInput } = input

  return {
    id: createMockId('sfx-generated-asset'),
    projectId: workerInput.projectId,
    editPlanId: workerInput.editPlanId,
    sfxEventPlanId: records.sfxEventPlan.id,
    sfxPromptPlanId: records.sfxPromptPlan.id,
    generationRequestId: workerInput.generationRequestId,
    generatedAssetId: input.generatedAsset?.id,
    provider: providerResponse.providerKey,
    modelName: providerResponse.modelName,
    origin: providerResponse.providerKey === 'reeditpro_internal_library' ? 'internal_library' : 'mock_generated',
    storagePath: providerResponse.mockStoragePath,
    fullGeneratedDurationSeconds: providerResponse.durationSeconds,
    recommendedTrimStartSeconds: undefined,
    recommendedTrimEndSeconds: undefined,
    detectedHitTimeSeconds: undefined,
    reuseStatus: providerResponse.providerKey === 'reeditpro_internal_library'
      ? 'approved_internal_library'
      : 'project_generated',
    qaStatus: 'pending',
    licenseScope: providerResponse.providerKey === 'reeditpro_internal_library'
      ? 'approved_internal_library'
      : 'project_only',
    status: 'generated',
    notes: [
      'Created by mock SFX worker skeleton.',
      providerResponse.providerKey === 'reeditpro_internal_library'
        ? 'Approved internal library asset used; provider generation skipped.'
        : 'No real provider call, audio file, upload, or rendering occurred.',
    ],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {
      mockOnly: true,
      noProviderCall: true,
      noAudioProcessing: true,
      provider: providerResponse.provider,
      matchedLibraryAssetId: providerResponse.matchedLibraryAssetId ?? null,
    },
  }
}

export function createSFXGenericGeneratedAssetFromWorker(input: {
  workerInput: SFXWorkerInput
  providerResponse: MockSFXProviderResponse
  records: SFXWorkerLoadedRecords
}): GeneratedAssetRecord {
  const { providerResponse, records, workerInput } = input

  return {
    id: createMockId('generated-asset'),
    workspaceId: workerInput.workspaceId,
    projectId: workerInput.projectId,
    generationRequestId: workerInput.generationRequestId,
    jobId: workerInput.jobId,
    assetType: 'sound_effect',
    assetStatus: 'ready',
    assetFormat: providerResponse.format,
    qualityLevel: 'preview',
    signatureSystem: records.sfxEventPlan.signatureSystem ?? 'none',
    status: 'ready',
    fileName: `${records.sfxEventPlan.id}.${providerResponse.format}`,
    displayName: `Mock SFX ${records.sfxEventPlan.useCase}`,
    storageProvider: 'local_mock',
    storagePath: providerResponse.mockStoragePath,
    publicUrl: providerResponse.mockStoragePath,
    durationSeconds: providerResponse.durationSeconds,
    transparentBackground: false,
    wordLevelTiming: false,
    usableForRender: false,
    qualityNotes: [
      'Mock SFX generated asset metadata only.',
      'Must pass SFX QA before preview/export use.',
    ],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {
      mockOnly: true,
      noProviderCall: true,
      noAudioFileCreated: true,
      provider: providerResponse.provider,
      model: providerResponse.modelName,
    },
  }
}

export function convertSFXProviderResponseToWorkerResponse(input: {
  response: SFXProviderGenerateResponse
  records: SFXWorkerLoadedRecords
}): MockSFXProviderResponse {
  if (input.response.providerKey === 'no_sfx') {
    throw new Error('No-SFX provider responses cannot be converted into generated SFX assets.')
  }

  return {
    provider: input.response.providerName === 'MMAudio V2'
      ? 'MMAudio V2'
      : input.response.providerName === 'ReeditPro Internal Library'
        ? 'ReeditPro Internal Library'
        : 'Mirelo SFX V1.5',
    providerKey: input.response.providerKey,
    modelName: input.response.modelName ?? input.records.sfxPromptPlan.modelName,
    mockAudioBytes: null,
    mockStoragePath: input.response.mockStoragePath ??
      `mock://generated-sfx/${input.records.sfxEventPlan.projectId}/${input.records.sfxEventPlan.id}/${input.response.providerKey}.wav`,
    matchedLibraryAssetId: typeof input.response.rawResponse === 'object' && input.response.rawResponse !== null &&
      'matchedLibraryAssetId' in input.response.rawResponse
      ? String((input.response.rawResponse as { matchedLibraryAssetId?: unknown }).matchedLibraryAssetId)
      : undefined,
    durationSeconds: input.response.durationSeconds ?? input.records.sfxPromptPlan.durationToGenerateSeconds,
    format: input.response.outputFormat === 'mp3' ? 'mp3' : 'wav',
    generatedAt: input.response.generatedAt,
    mockOnly: true,
    waveformHint: [
      ...createMockSFXWaveformHint(input.records.sfxEventPlan),
      ...input.response.textParts,
      input.response.providerKey === 'reeditpro_internal_library'
        ? 'approved library match; provider generation skipped'
        : 'mock provider adapter response; no audio bytes created',
    ],
  }
}

export function createMockSFXGenerationResult(input: {
  workerInput: SFXWorkerInput
  context: SFXWorkerContext
  records: SFXWorkerLoadedRecords
  sourceRecords?: SFXWorkerMockRecordBundle
  matchedLibraryAssetId?: string
}) {
  const providerRequest = buildSFXProviderRequestFromWorkerInput({
    workerInput: input.workerInput,
    records: input.records,
    providerKey: input.context.providerKey,
    speechPresent: input.sourceRecords?.speechPresent,
    musicPresent: input.sourceRecords?.musicPresent,
    ambienceImportant: input.sourceRecords?.ambienceImportant,
    matchedLibraryAssetId: input.matchedLibraryAssetId,
  })
  const providerResult = generateSFXWithProvider(providerRequest, { mode: 'mock' })

  return {
    providerRequest,
    providerResult,
    providerResponse: providerResult.response
      ? convertSFXProviderResponseToWorkerResponse({
          response: providerResult.response,
          records: input.records,
        })
      : undefined,
  }
}

export function createSFXTrimPlanFromWorker(input: {
  db: MockDatabase
  records: SFXWorkerLoadedRecords
  generatedSFXAsset: SFXGeneratedAssetRecord
}) {
  const waveformAnalysis = unwrapServiceResult(analyzeMockSFXWaveform(input.db, {
    sfxEventPlan: input.records.sfxEventPlan,
    sfxPromptPlan: input.records.sfxPromptPlan,
    sfxGeneratedAsset: input.generatedSFXAsset,
  })).waveformAnalysis
  const transientDetection = detectSFXTransient(input.records.sfxEventPlan, waveformAnalysis)
  const trimPlan = unwrapServiceResult(createSFXTrimPlan(input.db, {
    sfxEventPlan: input.records.sfxEventPlan,
    sfxPromptPlan: input.records.sfxPromptPlan,
    sfxGeneratedAsset: input.generatedSFXAsset,
    waveformAnalysis,
    transientDetection,
  })).sfxTrimPlan

  return { waveformAnalysis, transientDetection, trimPlan }
}

export function createSFXTimingAlignmentFromWorker(input: {
  db: MockDatabase
  records: SFXWorkerLoadedRecords
  trimPlan: SFXTrimPlanRecord
}) {
  return unwrapServiceResult(createSFXTimingAlignment(input.db, {
    sfxEventPlan: input.records.sfxEventPlan,
    sfxTrimPlan: input.trimPlan,
  })).sfxTimingAlignment
}

export function createSFXMixPlanFromWorker(input: {
  db: MockDatabase
  records: SFXWorkerLoadedRecords
  generatedSFXAsset: SFXGeneratedAssetRecord
  trimPlan: SFXTrimPlanRecord
  timingAlignment: SFXTimingAlignmentRecord
  sourceRecords: SFXWorkerMockRecordBundle
}): SFXMixPlanRecord {
  return unwrapServiceResult(createSFXMixPlan(input.db, {
    sfxEventPlan: input.records.sfxEventPlan,
    sfxGeneratedAsset: input.generatedSFXAsset,
    sfxTrimPlan: input.trimPlan,
    sfxTimingAlignment: input.timingAlignment,
    speechPresent: input.sourceRecords.speechPresent,
    musicPresent: input.sourceRecords.musicPresent,
    ambienceImportant: input.sourceRecords.ambienceImportant,
    videoTone: input.sourceRecords.videoTone ?? input.records.sfxEventPlan.videoTone,
    editLevel: input.records.sfxEventPlan.editLevel,
    userSFXInstructions: input.sourceRecords.userSFXInstructions,
    avoidSFXInstructions: input.sourceRecords.avoidSFXInstructions,
  })).sfxMixPlan
}

export function createSFXQAFromWorker(input: {
  db: MockDatabase
  records: SFXWorkerLoadedRecords
  generatedSFXAsset: SFXGeneratedAssetRecord
  trimPlan: SFXTrimPlanRecord
  timingAlignment: SFXTimingAlignmentRecord
  mixPlan: SFXMixPlanRecord
  sourceRecords: SFXWorkerMockRecordBundle
}) {
  return unwrapServiceResult(runSFXQA(input.db, {
    sfxEventPlan: input.records.sfxEventPlan,
    sfxProviderRoute: input.records.sfxProviderRoute,
    sfxPromptPlan: input.records.sfxPromptPlan,
    sfxGeneratedAsset: input.generatedSFXAsset,
    sfxTrimPlan: input.trimPlan,
    sfxTimingAlignment: input.timingAlignment,
    sfxMixPlan: input.mixPlan,
    speechPresent: input.sourceRecords.speechPresent,
    musicPresent: input.sourceRecords.musicPresent,
    ambienceImportant: input.sourceRecords.ambienceImportant,
    videoTone: input.sourceRecords.videoTone ?? input.records.sfxEventPlan.videoTone,
    editLevel: input.records.sfxEventPlan.editLevel,
    userSFXInstructions: input.sourceRecords.userSFXInstructions,
    avoidSFXInstructions: input.sourceRecords.avoidSFXInstructions,
    mockOutputSummary: input.sourceRecords.mockOutputSummary,
  }))
}

export function createSFXUsageRecordFromWorker(input: {
  db: MockDatabase
  records: SFXWorkerLoadedRecords
  generatedSFXAsset: SFXGeneratedAssetRecord
  timingAlignment: SFXTimingAlignmentRecord
  mixPlan: SFXMixPlanRecord
}) {
  return processGeneratedSFXForLibraryGrowth(input.db, {
    workspaceId: input.records.job.workspaceId,
    projectId: input.records.sfxEventPlan.projectId,
    sfxEventPlan: input.records.sfxEventPlan,
    sfxProviderRoute: input.records.sfxProviderRoute,
    sfxPromptPlan: input.records.sfxPromptPlan,
    sfxGeneratedAsset: input.generatedSFXAsset,
    sfxTimingAlignment: input.timingAlignment,
    sfxMixPlan: input.mixPlan,
    usageType: 'project_preview',
    userKept: true,
    userRemoved: false,
  })
}

export function evaluateSFXLibraryCandidateFromWorker(input: {
  db: MockDatabase
  records: SFXWorkerLoadedRecords
  generatedSFXAsset: SFXGeneratedAssetRecord
  trimPlan: SFXTrimPlanRecord
  timingAlignment: SFXTimingAlignmentRecord
  mixPlan: SFXMixPlanRecord
  qaReport: SFXWorkerRunResult['qaReport']
  sourceRecords: SFXWorkerMockRecordBundle
}) {
  return unwrapServiceResult(processGeneratedSFXForLibraryGrowth(input.db, {
    workspaceId: input.records.job.workspaceId,
    projectId: input.records.sfxEventPlan.projectId,
    sfxEventPlan: input.records.sfxEventPlan,
    sfxProviderRoute: input.records.sfxProviderRoute,
    sfxPromptPlan: input.records.sfxPromptPlan,
    sfxGeneratedAsset: input.generatedSFXAsset,
    sfxTrimPlan: input.trimPlan,
    sfxTimingAlignment: input.timingAlignment,
    sfxMixPlan: input.mixPlan,
    sfxQAReport: input.qaReport,
    usageType: 'project_preview',
    userKept: true,
    userRemoved: false,
    providerTermsKnown: input.sourceRecords.providerTermsKnown,
    commercialAllowed: input.sourceRecords.commercialAllowed,
    adsAllowed: input.sourceRecords.adsAllowed,
    clientWorkAllowed: input.sourceRecords.clientWorkAllowed,
    reuseAcrossUsersAllowed: input.sourceRecords.reuseAcrossUsersAllowed,
    simulateApprovedLibraryMatch: input.sourceRecords.simulateApprovedLibraryMatch,
    simulateMockApproval: input.sourceRecords.simulateMockApproval,
  }))
}

function blockedOrFailedOutput(input: {
  workerInput: SFXWorkerInput
  status: SFXWorkerOutput['status']
  message: string
  warnings: string[]
}): SFXWorkerOutput {
  return {
    jobId: input.workerInput.jobId,
    generationRequestId: input.workerInput.generationRequestId,
    sfxEventPlanId: input.workerInput.sfxEventPlanId,
    status: input.status,
    message: input.message,
    warnings: input.warnings,
    mockOnly: true,
  }
}

function failureStatus(failure: SFXWorkerFailure): SFXWorkerOutput['status'] {
  if (
    failure.code === 'CREDITS_NOT_RESERVED' ||
    failure.code === 'MISSING_CREDIT_RESERVATION' ||
    failure.code === 'PLAN_NOT_APPROVED' ||
    failure.code === 'PROMPT_VALIDATION_FAILED' ||
    failure.code === 'SFX_DECISION_AVOID' ||
    failure.code === 'SFX_DECISION_NOT_NEEDED'
  ) {
    return 'blocked'
  }

  return 'failed'
}

export function runSFXWorkerSkeleton(input: {
  db: MockDatabase
  workerInput: SFXWorkerInput
  context?: Partial<SFXWorkerContext>
  records: SFXWorkerMockRecordBundle
}): SFXWorkerRunResult {
  const events = [createSFXWorkerStartedEvent(input.workerInput)]
  const gate = validateSFXGenerationGate(input.workerInput, input.records)

  if (!gate.ok) {
    const status = failureStatus(gate.failure)
    const event = status === 'blocked'
      ? createSFXWorkerBlockedEvent(input.workerInput, gate.failure)
      : createSFXWorkerFailedEvent(input.workerInput, gate.failure)

    return {
      output: blockedOrFailedOutput({
        workerInput: input.workerInput,
        status,
        message: gate.failure.message,
        warnings: gate.warnings,
      }),
      events: [...events, event],
      failure: gate.failure,
    }
  }

  const records = loadSFXWorkerMockRecords(input.workerInput, input.records)

  if (!records) {
    const failure: SFXWorkerFailure = {
      code: 'UNKNOWN_ERROR',
      message: 'Generation not allowed: SFX worker mock records could not be loaded.',
    }

    return {
      output: blockedOrFailedOutput({
        workerInput: input.workerInput,
        status: 'failed',
        message: failure.message,
        warnings: gate.warnings,
      }),
      events: [...events, createSFXWorkerFailedEvent(input.workerInput, failure)],
      failure,
    }
  }

  events.push(
    createSFXWorkerProgressEvent(input.workerInput, 'Checking edit plan approval.', 10),
    createSFXWorkerProgressEvent(input.workerInput, 'Checking credit reservation.', 18),
    createSFXWorkerProgressEvent(input.workerInput, 'Loading provider route and prompt plan.', 25),
    createSFXWorkerProgressEvent(input.workerInput, 'Checking internal SFX library.', 32),
  )

  const matchedLibraryAssetId = input.records.approvedLibraryAssetId ??
    (input.records.simulateApprovedLibraryMatch ? `mock-approved-sfx-library-${records.sfxEventPlan.useCase}` : undefined)
  const context = prepareSFXWorkerContext({
    ...routeSFXWorkerProvider({
      providerRoute: records.sfxProviderRoute,
      promptPlan: records.sfxPromptPlan,
      workerInput: input.workerInput,
      hasApprovedLibraryMatch: Boolean(matchedLibraryAssetId),
    }),
    ...input.context,
  })

  if (context.providerKey === 'no_sfx') {
    const failure: SFXWorkerFailure = {
      code: 'PROVIDER_UNAVAILABLE',
      message: 'Generation not allowed: no SFX provider route is available for this worker run.',
      details: { recommendedProvider: records.sfxProviderRoute.recommendedProvider },
    }

    return {
      output: blockedOrFailedOutput({
        workerInput: input.workerInput,
        status: 'blocked',
        message: failure.message,
        warnings: gate.warnings,
      }),
      events: [...events, createSFXWorkerBlockedEvent(input.workerInput, failure)],
      failure,
    }
  }

  const providerRun = createMockSFXGenerationResult({
    workerInput: input.workerInput,
    context,
    records,
    sourceRecords: input.records,
    matchedLibraryAssetId,
  })
  const providerResponse = providerRun.providerResponse

  if (!providerRun.providerResult.ok || !providerResponse) {
    const failure: SFXWorkerFailure = {
      code: 'PROVIDER_UNAVAILABLE',
      message: providerRun.providerResult.error?.message ?? 'SFX provider adapter did not return a usable mock response.',
      details: providerRun.providerResult.error,
    }

    return {
      output: blockedOrFailedOutput({
        workerInput: input.workerInput,
        status: 'failed',
        message: failure.message,
        warnings: [...gate.warnings, ...(providerRun.providerResult.warnings ?? [])],
      }),
      events: [...events, createSFXWorkerFailedEvent(input.workerInput, failure)],
      failure,
    }
  }

  if (providerResponse.providerKey === 'reeditpro_internal_library' && providerResponse.matchedLibraryAssetId) {
    events.push(createSFXWorkerLibraryMatchEvent(input.workerInput, providerResponse.matchedLibraryAssetId))
  } else {
    events.push(createSFXWorkerProgressEvent(
      input.workerInput,
      `Simulating ${providerResponse.provider} generation.`,
      42,
      { modelName: providerResponse.modelName },
    ))
  }

  const generatedAsset = insertMockRecord(input.db, 'generatedAssets', createSFXGenericGeneratedAssetFromWorker({
    workerInput: input.workerInput,
    providerResponse,
    records,
  }))
  const generatedSFXAsset = insertMockRecord(input.db, 'sfxGeneratedAssets', createSFXGeneratedAssetFromWorker({
    workerInput: input.workerInput,
    providerResponse,
    records,
    generatedAsset,
  }))

  events.push(createSFXWorkerProgressEvent(input.workerInput, 'Creating generated SFX asset metadata.', 50))

  const { waveformAnalysis, transientDetection, trimPlan } = createSFXTrimPlanFromWorker({
    db: input.db,
    records,
    generatedSFXAsset,
  })
  const timingAlignment = createSFXTimingAlignmentFromWorker({
    db: input.db,
    records,
    trimPlan,
  })
  const mixPlan = createSFXMixPlanFromWorker({
    db: input.db,
    records,
    generatedSFXAsset,
    trimPlan,
    timingAlignment,
    sourceRecords: input.records,
  })
  if (/impact under dialogue|too loud under dialogue/i.test(input.records.mockOutputSummary ?? '')) {
    mixPlan.volumeProfile = 'impact'
    mixPlan.targetGainDb = -6
    mixPlan.duckUnderVoice = false
    mixPlan.sidechainToVoice = false
    mixPlan.notes.push('Mock worker scenario forces an unsafe impact mix for QA validation.')
  }
  const qa = createSFXQAFromWorker({
    db: input.db,
    records,
    generatedSFXAsset,
    trimPlan,
    timingAlignment,
    mixPlan,
    sourceRecords: input.records,
  })

  events.push(
    createSFXWorkerProgressEvent(input.workerInput, 'Analyzing waveform and trimming best region.', 62),
    createSFXWorkerProgressEvent(input.workerInput, 'Aligning hit point and creating mix plan.', 76),
    createSFXWorkerProgressEvent(input.workerInput, 'Running SFX QA.', 88),
  )

  if (qa.qaReport.status === 'failed' || qa.qaReport.status === 'remove_sfx') {
    const failure: SFXWorkerFailure = {
      code: 'UNKNOWN_ERROR',
      message: 'Mock SFX worker generated metadata, but SFX QA failed before preview use.',
      details: { recommendedAction: qa.qaReport.recommendedAction },
    }

    return {
      output: {
        jobId: input.workerInput.jobId,
        generationRequestId: input.workerInput.generationRequestId,
        sfxEventPlanId: input.workerInput.sfxEventPlanId,
        sfxGeneratedAssetId: generatedSFXAsset.id,
        generatedAssetId: generatedAsset.id,
        sfxTrimPlanId: trimPlan.id,
        sfxTimingAlignmentId: timingAlignment.id,
        sfxMixPlanId: mixPlan.id,
        sfxQAReportId: qa.qaReport.id,
        status: 'failed',
        message: failure.message,
        warnings: [
          ...gate.warnings,
          ...(providerRun.providerResult.warnings ?? []),
          ...qa.warnings,
          qa.qaReport.notes.join(' '),
        ],
        mockOnly: true,
      },
      events: [...events, createSFXWorkerFailedEvent(input.workerInput, failure)],
      providerResponse,
      generatedSFXAsset,
      generatedAsset,
      waveformAnalysis,
      transientDetection,
      trimPlan,
      timingAlignment,
      mixPlan,
      qaReport: qa.qaReport,
      failure,
    }
  }

  const libraryGrowth = evaluateSFXLibraryCandidateFromWorker({
    db: input.db,
    records,
    generatedSFXAsset,
    trimPlan,
    timingAlignment,
    mixPlan,
    qaReport: qa.qaReport,
    sourceRecords: input.records,
  })

  events.push(
    createSFXWorkerProgressEvent(input.workerInput, 'Storing usage record and evaluating library candidate.', 95),
  )

  const status: SFXWorkerOutput['status'] = providerResponse.providerKey === 'reeditpro_internal_library'
    ? 'library_match_used'
    : 'mock_generated'

  return {
    output: {
      jobId: input.workerInput.jobId,
      generationRequestId: input.workerInput.generationRequestId,
      sfxEventPlanId: input.workerInput.sfxEventPlanId,
      sfxGeneratedAssetId: generatedSFXAsset.id,
      generatedAssetId: generatedAsset.id,
      sfxTrimPlanId: trimPlan.id,
      sfxTimingAlignmentId: timingAlignment.id,
      sfxMixPlanId: mixPlan.id,
      sfxQAReportId: qa.qaReport.id,
      sfxUsageRecordId: libraryGrowth.usageRecord?.id,
      sfxLibraryCandidateId: libraryGrowth.libraryCandidate?.id,
      status,
      message: status === 'library_match_used'
        ? 'Mock SFX worker used an approved internal library match and completed timing/mix/QA planning.'
        : 'Mock SFX worker created project SFX metadata and completed timing/mix/QA/library-growth planning.',
      warnings: [
        ...gate.warnings,
        ...(providerRun.providerResult.warnings ?? []),
        ...qa.warnings,
        ...libraryGrowth.warnings,
      ],
      mockOnly: true,
    },
    events: [...events, createSFXWorkerCompletedEvent(input.workerInput)],
    providerResponse,
    generatedSFXAsset,
    generatedAsset,
    waveformAnalysis,
    transientDetection,
    trimPlan,
    timingAlignment,
    mixPlan,
    qaReport: qa.qaReport,
    usageRecord: libraryGrowth.usageRecord,
    libraryCandidate: libraryGrowth.libraryCandidate,
    librarySearchRecord: libraryGrowth.librarySearchRecord,
    provenanceReview: libraryGrowth.provenanceReview,
    usageLearning: libraryGrowth.usageLearning,
    libraryGrowth,
  }
}
