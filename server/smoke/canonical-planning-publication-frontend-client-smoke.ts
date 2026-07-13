import assert from 'node:assert/strict'
import { createServer } from 'node:http'

import { buildCanonicalPlanningDraft } from '../../src/lib/canonical-planning-draft'
import { createGuidedMockEditPlan } from '../../src/lib/mock-planner/guided'
import { createMockEditPlan } from '../../src/lib/mock-planner/full'
import type { ProjectPersistenceScope } from '../../src/lib/project-persistence-scope'
import type { EditPlan, PlannerInput } from '../../src/types/reeditpro'
import {
  validateOfflineFfprobePlanningPayload,
} from '../tool-execution/media-binary-execution/offline-media-binary-protocol'
import {
  OFFLINE_LIBASS_CAPTION_OPERATION,
  OFFLINE_LIBASS_CAPTION_PROTOCOL,
  validateOfflineLibassCaptionRequest,
} from '../tool-execution/libass-caption-execution/offline-libass-caption-protocol'
import {
  validateOfflineRemotionFinalCompositionPlanningPayload,
} from '../tool-execution/remotion-render-execution/offline-remotion-render-execution-protocol'
import {
  createCanonicalPlanningHandoffSchema,
  publishCanonicalEditPlanFromHandoffSchema,
} from '../validation/canonical-planning-handoff-schemas'

const identity = {
  workspaceId: 'workspace-canonical-save-smoke',
  projectId: 'project-canonical-save-smoke',
  editSessionId: 'edit-canonical-save-smoke',
}
const sha = (value: string) => value.repeat(64).slice(0, 64)
const baseInput: PlannerInput = {
  projectName: 'Canonical planning publication smoke',
  targetPlatform: 'youtube',
  aspectRatio: '16:9',
  aspectRatioConfirmed: true,
  aspectRatioSource: 'user_selected',
  frameTemplateType: 'youtube_side_panel',
  editingCategory: 'business_brand',
  workflowType: 'product_demo',
  editLevel: 'pro',
  structurePreference: 'preserve_source_order',
  moodStyle: 'clean',
  visualPreference: 'no_extra_visuals',
  referenceUrl: '',
  customInstructions: 'Use the source only with one readable caption.',
  userInstructionHistory: ['Use the source only with one readable caption.'],
  creditPreference: 'balanced',
  clips: [{
    id: 'canonical-save-clip-1',
    uploadedOrder: 1,
    fileName: 'canonical-source.mp4',
    duration: '00:02',
    detectedType: 'Primary source',
    sourceRole: 'main_story',
  }],
  sourceSequenceMode: 'single_complete_video',
  sourceOrderConfirmed: true,
  cleanupPreference: 'preserve_natural',
  cleanupPreferenceConfirmed: true,
  preferenceDefaultsApplied: true,
  preferenceSnapshotId: 'canonical-save-preference-snapshot',
  currentEditPreferenceRevision: 3,
}
const sourceMediaAssets = [{
  mediaAssetId: 'canonical-save-media-1',
  sourceSequenceItemId: 'canonical-save-source-1',
  uploadedClipId: 'canonical-save-clip-1',
  uploadedOrder: 1,
  storageProvider: 'local_private' as const,
  storagePath: 'private/source/path-must-never-cross-browser-request.mp4',
  fileName: 'canonical-source.mp4',
  mimeType: 'video/mp4',
  byteSize: 4_096,
  checksumSha256: sha('a'),
  sourceMetadata: {
    probeStatus: 'probed' as const,
    source: 'local_ffprobe' as const,
    durationSeconds: 2,
    hasVideo: true,
    hasAudio: true,
  },
  privateArtifact: true as const,
  publicUrl: null,
  signedUrl: null,
}]

const sourceOnlyFullPlan = createMockEditPlan(baseInput)
assert.equal(sourceOnlyFullPlan.visualAssetPlan?.length, 0, 'Source-only preference must create no visual assets.')
assert.equal(sourceOnlyFullPlan.mapAnimationPlan?.items.length, 0, 'Source-only preference must create no map work.')
assert.equal(sourceOnlyFullPlan.dataVizPlan?.items.length, 0, 'Source-only preference must create no data-visualization work.')
assert.equal(sourceOnlyFullPlan.providerPromptPlans?.length, 0, 'Source-only preference must create no provider prompts.')

const richPlan = createGuidedMockEditPlan(baseInput)
richPlan.visualAssetPlan = [{ id: 'unrepresented-rich-visual' }] as unknown as NonNullable<EditPlan['visualAssetPlan']>
const richDraft = buildCanonicalPlanningDraft({
  plan: richPlan,
  plannerInput: baseInput,
  sourceMediaAssets,
})
assert.equal(richDraft.ok, true, 'A rich plan should still compile its exact canonical handoff components.')
assert.equal(richDraft.ok && richDraft.draft.publication, undefined, 'A rich plan must not be silently downgraded into the narrow runner.')
assert.ok(richDraft.ok && richDraft.draft.publicationBlockers.length > 0, 'Unrepresented rich work must remain explicitly blocked.')
if (!richDraft.ok) throw new Error('Rich draft unexpectedly failed.')
assert.equal(createCanonicalPlanningHandoffSchema.safeParse({
  workspaceId: identity.workspaceId,
  purpose: 'prepare_canonical_planning_handoff',
  orderedSourceItems: richDraft.draft.orderedSourceItems,
  canonicalPlanComponents: richDraft.draft.components,
}).success, true, 'Rich handoff components must match the backend schema.')

const exactPlan = createExactPrivateReviewPlan()
const exactDraft = buildCanonicalPlanningDraft({
  plan: exactPlan,
  plannerInput: baseInput,
  sourceMediaAssets,
})
assert.equal(exactDraft.ok, true, 'Exact source-and-caption plan should compile.')
if (!exactDraft.ok || !exactDraft.draft.publication) throw new Error('Exact publication candidate was not produced.')
assert.deepEqual(
  exactDraft.draft.publication.canonicalPlan.workItems.map((item) => ({
    key: item.workItemKey,
    type: item.workItemType,
    dependencies: item.dependencyKeys,
    tools: item.approvedToolIds,
  })),
  [
    { key: 'snapshot-validation', type: 'validate_approved_snapshot', dependencies: [], tools: [] },
    { key: 'source-trim-validation', type: 'prepare_source_trim', dependencies: ['snapshot-validation'], tools: [] },
    { key: 'caption-overlay', type: 'custom', dependencies: [], tools: ['libass'] },
    { key: 'final-export', type: 'render_final_export', dependencies: ['source-trim-validation', 'caption-overlay'], tools: ['remotion'] },
    { key: 'final-qa', type: 'run_final_qa', dependencies: ['final-export'], tools: ['ffprobe'] },
  ],
  'Publication candidate must freeze the exact proven five-stage private review graph.',
)
assert.equal(createCanonicalPlanningHandoffSchema.safeParse({
  workspaceId: identity.workspaceId,
  purpose: 'prepare_canonical_planning_handoff',
  orderedSourceItems: exactDraft.draft.orderedSourceItems,
  canonicalPlanComponents: exactDraft.draft.components,
}).success, true)
assert.equal(publishCanonicalEditPlanFromHandoffSchema.safeParse({
  workspaceId: identity.workspaceId,
  planningRequestId: 'canonical-save-plan-request',
  expectedHandoffHash: sha('b'),
  canonicalPlan: exactDraft.draft.publication.canonicalPlan,
}).success, true, 'Exact candidate must match the persisted-handoff publication schema.')

const captionItem = exactDraft.draft.publication.canonicalPlan.workItems.find((item) => item.workItemKey === 'caption-overlay')!
validateOfflineLibassCaptionRequest({
  schemaVersion: OFFLINE_LIBASS_CAPTION_PROTOCOL,
  toolId: 'libass',
  operationId: OFFLINE_LIBASS_CAPTION_OPERATION,
  payload: asRecord(captionItem.executionInput.structuredPayload),
})
const finalItem = exactDraft.draft.publication.canonicalPlan.workItems.find((item) => item.workItemKey === 'final-export')!
validateOfflineRemotionFinalCompositionPlanningPayload(asRecord(finalItem.executionInput.structuredPayload))
const qaItem = exactDraft.draft.publication.canonicalPlan.workItems.find((item) => item.workItemKey === 'final-qa')!
validateOfflineFfprobePlanningPayload(asRecord(qaItem.executionInput.structuredPayload))

const badSourceDraft = buildCanonicalPlanningDraft({
  plan: exactPlan,
  plannerInput: baseInput,
  sourceMediaAssets: [{ ...sourceMediaAssets[0], checksumSha256: 'not-a-checksum' }],
})
assert.equal(badSourceDraft.ok, false, 'Malformed private source authority must fail before any browser request.')
const substitutedSourceDraft = buildCanonicalPlanningDraft({
  plan: exactPlan,
  plannerInput: baseInput,
  sourceMediaAssets: [{ ...sourceMediaAssets[0], uploadedClipId: 'foreign-clip' }],
})
assert.equal(substitutedSourceDraft.ok, false, 'A source record cannot be substituted for a different planned clip.')
const unprobedSourceDraft = buildCanonicalPlanningDraft({
  plan: exactPlan,
  plannerInput: baseInput,
  sourceMediaAssets: [{
    ...sourceMediaAssets[0],
    sourceMetadata: { ...sourceMediaAssets[0].sourceMetadata, probeStatus: 'unavailable' as const },
  }],
})
assert.equal(unprobedSourceDraft.ok, true, 'Unprobed source identity can still persist an exact planning handoff.')
assert.equal(
  unprobedSourceDraft.ok && unprobedSourceDraft.draft.publication,
  undefined,
  'Unprobed source metadata must block the execution candidate.',
)
const missingCleanupDecisionDraft = buildCanonicalPlanningDraft({
  plan: { ...exactPlan, sourceCleanupPlan: { ...exactPlan.sourceCleanupPlan!, decisions: [] } },
  plannerInput: baseInput,
  sourceMediaAssets,
})
assert.equal(missingCleanupDecisionDraft.ok, false, 'The compiler must not invent a missing source cleanup decision.')
const contaminatedPlan = {
  ...exactPlan,
  compiledIntent: { ...exactPlan.compiledIntent!, storagePath: '/private/path-must-not-cross' },
} as EditPlan
const contaminatedDraft = buildCanonicalPlanningDraft({
  plan: contaminatedPlan,
  plannerInput: baseInput,
  sourceMediaAssets,
})
assert.equal(contaminatedDraft.ok, false, 'Private path material in canonical components must fail before any browser request.')

const originalMode = process.env.VITE_REEDITPRO_API_MODE
const originalBaseUrl = process.env.VITE_REEDITPRO_API_BASE_URL
const originalE2E = process.env.VITE_REEDITPRO_E2E
const originalToken = process.env.VITE_REEDITPRO_E2E_AUTH_TOKEN
const requests: Array<{
  authorization?: string
  internalToken?: string
  body: Record<string, unknown>
  method?: string
  url?: string
}> = []
let responseIdentity = { ...identity }

const server = createServer((request, response) => {
  const chunks: Buffer[] = []
  request.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
  request.on('end', () => {
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>
    requests.push({
      authorization: request.headers.authorization,
      internalToken: request.headers['x-reeditpro-internal-token'] as string | undefined,
      body,
      method: request.method,
      url: request.url,
    })
    const serialized = JSON.stringify(body)
    assert.doesNotMatch(serialized, /storagePath|path-must-never-cross|signedUrl|publicUrl|sourceBytes|bytesBase64/)
    response.setHeader('content-type', 'application/json')
    if (request.url?.endsWith('/plan-presentations')) {
      response.statusCode = 201
      response.end(JSON.stringify({
        ok: true,
        data: { canonicalPlanPublicationRequest: publicationFixture(responseIdentity) },
        warnings: [],
      }))
      return
    }
    response.end(JSON.stringify({
      ok: true,
      data: { canonicalPlanningHandoff: handoffFixture(responseIdentity) },
      warnings: [],
    }))
  })
})

await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
const address = server.address()
assert(address && typeof address === 'object')
process.env.VITE_REEDITPRO_API_MODE = 'frontend_safe'
process.env.VITE_REEDITPRO_API_BASE_URL = `http://127.0.0.1:${address.port}`
process.env.VITE_REEDITPRO_E2E = 'true'
process.env.VITE_REEDITPRO_E2E_AUTH_TOKEN = 'canonical-save-smoke-token'

const scope: ProjectPersistenceScope = {
  authMode: 'local_test',
  userId: 'canonical-save-user',
  workspaceId: identity.workspaceId,
}

try {
  const { getApiRouteById } = await import('../../src/backend/api/api-route-registry')
  const { saveCanonicalPlanningForNamedEdit } = await import('../../src/lib/canonical-planning-publication-client')
  for (const routeId of [
    'planning.canonicalHandoff.create',
    'planning.canonicalPublicationRequest.create',
    'planning.canonicalPlanPresentation.create',
  ]) {
    const route = getApiRouteById(routeId)
    assert.equal(route?.runtimeMode, 'frontend_safe')
    assert.equal(route?.status, 'frontend_safe_ready')
    assert.equal(route?.requiresServiceRole, false)
    assert.equal(route?.requiresProviderSecret, false)
    assert.equal(route?.requiresStripeSecret, false)
  }

  const richResult = await saveCanonicalPlanningForNamedEdit({
    scope,
    projectId: identity.projectId,
    editSessionId: identity.editSessionId,
    plan: richPlan,
    plannerInput: baseInput,
    sourceMediaAssets,
  })
  assert.equal(richResult.status, 'handoff_saved_waiting_for_compiler')
  assert.equal(richResult.handoffSaved, true)
  assert.equal(richResult.candidateSaved, false)
  assert.equal(requests.length, 1, 'Unrepresentable rich plan must stop after its exact handoff.')

  const firstExactSave = saveCanonicalPlanningForNamedEdit({
    scope,
    projectId: identity.projectId,
    editSessionId: identity.editSessionId,
    plan: exactPlan,
    plannerInput: baseInput,
    sourceMediaAssets,
  })
  const duplicateExactSave = saveCanonicalPlanningForNamedEdit({
    scope,
    projectId: identity.projectId,
    editSessionId: identity.editSessionId,
    plan: exactPlan,
    plannerInput: baseInput,
    sourceMediaAssets,
  })
  assert.equal(duplicateExactSave, firstExactSave, 'Identical in-flight saves must share one bounded request chain.')
  const exactResult = await firstExactSave
  assert.equal(exactResult.status, 'plan_published_waiting_for_approval')
  assert.equal(exactResult.handoffSaved, true)
  assert.equal(exactResult.candidateSaved, true)
  assert.equal(requests.length, 3, 'Exact save should issue one handoff plus one candidate request.')
  assert.equal(requests.every((request) => request.method === 'POST'), true)
  assert.equal(requests.every((request) => request.authorization === 'Bearer canonical-save-smoke-token'), true)
  assert.match(requests[2]?.url ?? '', /canonical-planning-handoffs\/canonical-save-handoff\/plan-presentations$/)
  assert.equal(requests.some((request) => request.url?.endsWith('/publish')), false, 'The browser must never call the internal publication route.')
  assert.equal(requests.some((request) => Boolean(request.internalToken)), false)

  responseIdentity = { ...identity, workspaceId: 'workspace-foreign' }
  const foreign = await saveCanonicalPlanningForNamedEdit({
    scope,
    projectId: identity.projectId,
    editSessionId: identity.editSessionId,
    plan: exactPlan,
    plannerInput: { ...baseInput, customInstructions: 'Create a distinct save request.' },
    sourceMediaAssets,
  })
  assert.equal(foreign.status, 'invalid_response', 'Foreign workspace identity must fail closed before candidate submission.')
  assert.equal(foreign.handoffSaved, false)
} finally {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  restoreEnv('VITE_REEDITPRO_API_MODE', originalMode)
  restoreEnv('VITE_REEDITPRO_API_BASE_URL', originalBaseUrl)
  restoreEnv('VITE_REEDITPRO_E2E', originalE2E)
  restoreEnv('VITE_REEDITPRO_E2E_AUTH_TOKEN', originalToken)
}

console.log('Canonical planning publication frontend client smoke passed.')

function createExactPrivateReviewPlan(): EditPlan {
  const plan = createGuidedMockEditPlan(baseInput)
  const timing = plan.masterTimingPlan!
  timing.timingBase = {
    ...timing.timingBase,
    fps: 24,
    totalDurationSeconds: 2,
    totalFrames: 48,
    sourceDurationSeconds: 2,
    finalDurationSeconds: 2,
  }
  timing.finalTimelineSegments = [{
    ...timing.finalTimelineSegments[0]!,
    segmentId: 'segment-1',
    finalRange: frameRange(0, 2, 0, 48),
  }]
  timing.captionTimingItems = [{
    ...timing.captionTimingItems[0]!,
    captionText: 'Approved frame accurate caption',
    timeRange: frameRange(0, 2, 0, 48),
  }]
  timing.visualTimingItems = []
  timing.transitionTimingItems = []
  timing.sfxTimingItems = []
  timing.musicDuckingTimingItems = []
  timing.providerClipTimingItems = []
  const cleanup = plan.sourceCleanupPlan!
  const decision = cleanup.decisions[0]! as unknown as Record<string, unknown>
  decision.selectedRange = frameRange(0, 2, 0, 48)
  decision.sourceRange = {
    clipId: baseInput.clips[0]!.id,
    startSeconds: 0,
    endSeconds: 2,
    durationSeconds: 2,
    startFrame: 0,
    endFrame: 48,
    notes: [],
  }
  decision.decision = 'preserve'
  decision.riskLevel = 'low'
  plan.visualAssetPlan = []
  plan.providerPromptPlans = []
  plan.segmentEditPlans = []
  plan.colorPipelinePlan = undefined
  plan.audioPipelinePlan = undefined
  return plan
}

function frameRange(startSeconds: number, endSeconds: number, startFrame: number, endFrame: number) {
  return {
    startSeconds,
    endSeconds,
    durationSeconds: endSeconds - startSeconds,
    startFrame,
    endFrame,
    durationFrames: endFrame - startFrame,
    fps: 24,
  }
}

function handoffFixture(foreignIdentity: typeof identity): Record<string, unknown> {
  return {
    schemaVersion: 'canonical-planning-handoff-response-v1',
    source: 'canonical_planning_handoff_service',
    identity: { ...foreignIdentity },
    canonicalPlanComponentsHash: sha('c'),
    sourceBindingManifestCandidate: {},
    sourceMediaAuthority: {},
    planningInputAuthority: {},
    resolvedPlanningInputAuthority: {},
    readiness: {
      finalizedSourceMediaVerified: true,
      exactEditPreferencesVerified: true,
      preferenceApplicationVerified: true,
      editBriefVerified: true,
      outputFrameAndCleanupVerified: true,
      readyForCanonicalPlanPublication: true,
    },
    handoffHash: sha('b'),
    handoffId: 'canonical-save-handoff',
    persistence: {
      privateLocal: true,
      tenantScoped: true,
      createOnly: true,
      checksumProtected: true,
      contentAddressed: true,
      distributed: false,
      productionAuthority: false,
    },
    noPlanPublished: true,
    noSnapshotCreated: true,
    noCreditReservation: true,
    noToolExecution: true,
    noProviderCall: true,
    noRender: true,
    testOnly: true,
  }
}

function publicationFixture(foreignIdentity: typeof identity): Record<string, unknown> {
  return {
    schemaVersion: 'canonical-plan-publication-request-inspection-v1',
    source: 'canonical_plan_publication_request_service',
    identity: {
      ...foreignIdentity,
      handoffId: 'canonical-save-handoff',
      candidateId: 'canonical-save-candidate',
    },
    candidateHash: sha('d'),
    handoffHash: sha('b'),
    canonicalPlanComponentsHash: sha('c'),
    publicationBodyHash: sha('e'),
    publicationRequestHash: sha('f'),
    persistence: {
      privateLocal: true,
      tenantScoped: true,
      createOnly: true,
      checksumProtected: true,
      contentAddressed: true,
      distributed: false,
      productionAuthority: false,
    },
    permissions: {
      inspectionOnly: true,
      internalPublicationRequired: true,
      planMutation: false,
      snapshotCreation: false,
      creditReservation: false,
      toolExecution: false,
      providerCall: false,
      render: false,
    },
    requestBodyReturned: false,
    pathOrCredentialReturned: false,
    testOnly: true,
    publicationStatus: 'published',
    publication: {
      planId: 'canonical-save-plan',
      planningRequestId: 'canonical-save-planning-request',
      planVersion: 1,
      planStatus: 'presented',
      planHash: sha('9'),
      internalPublicationMayBeAttempted: false,
      fullRevalidationRequired: true,
      exactReplayOnlyAfterPublication: true,
    },
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  assert(value && typeof value === 'object' && !Array.isArray(value))
  return value as Record<string, unknown>
}

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) delete process.env[key]
  else process.env[key] = value
}
