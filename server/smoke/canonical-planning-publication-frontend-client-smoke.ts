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
const multiSourceInput: PlannerInput = {
  ...baseInput,
  clips: [{
    ...baseInput.clips[0]!,
    id: 'canonical-save-clip-1',
    fileName: 'canonical-source-1.mp4',
    duration: '00:01',
    uploadedOrder: 1,
  }, {
    ...baseInput.clips[0]!,
    id: 'canonical-save-clip-2',
    fileName: 'canonical-source-2.mp4',
    duration: '00:01',
    uploadedOrder: 2,
    sourceRole: 'context',
  }],
  sourceSequenceMode: 'multi_clip_story_order',
}
const multiSourceMediaAssets = [{
  ...sourceMediaAssets[0]!,
  mediaAssetId: 'canonical-save-media-1',
  sourceSequenceItemId: 'canonical-save-source-1',
  uploadedClipId: 'canonical-save-clip-1',
  uploadedOrder: 1,
  fileName: 'canonical-source-1.mp4',
  checksumSha256: sha('1'),
  sourceMetadata: { ...sourceMediaAssets[0]!.sourceMetadata, durationSeconds: 1 },
}, {
  ...sourceMediaAssets[0]!,
  mediaAssetId: 'canonical-save-media-2',
  sourceSequenceItemId: 'canonical-save-source-2',
  uploadedClipId: 'canonical-save-clip-2',
  uploadedOrder: 2,
  fileName: 'canonical-source-2.mp4',
  storagePath: 'private/second/source/path-must-never-cross-browser-request.mp4',
  checksumSha256: sha('2'),
  sourceMetadata: { ...sourceMediaAssets[0]!.sourceMetadata, durationSeconds: 1 },
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

const realisticRichMultiSourcePlan = createMockEditPlan(multiSourceInput)
const realisticRichMultiSourceDraft = buildCanonicalPlanningDraft({
  plan: realisticRichMultiSourcePlan,
  plannerInput: multiSourceInput,
  sourceMediaAssets: multiSourceMediaAssets,
})
assert.equal(realisticRichMultiSourceDraft.ok, true, 'A normal rich multi-source plan should preserve its handoff context.')
assert.equal(
  realisticRichMultiSourceDraft.ok && realisticRichMultiSourceDraft.draft.publication,
  undefined,
  'A rich multi-source editor plan must not be silently flattened into the bounded sequence composition.',
)
assert.match(
  realisticRichMultiSourceDraft.ok
    ? realisticRichMultiSourceDraft.draft.publicationBlockers.join(' ')
    : '',
  /contiguous|one-to-one|caption|transition|audio|operation/i,
  'Rich timing and edit work must remain visible as an explicit publication blocker.',
)

const exactPlan = createExactPrivateReviewPlan()
const exactDraft = buildCanonicalPlanningDraft({
  plan: exactPlan,
  plannerInput: baseInput,
  sourceMediaAssets,
})
assert.equal(exactDraft.ok, true, 'Exact source-and-caption plan should compile.')
if (!exactDraft.ok || !exactDraft.draft.publication) throw new Error('Exact publication candidate was not produced.')
const canonicalEstimate = exactDraft.draft.publication.canonicalPlan.estimate
assert.equal(
  canonicalEstimate.lineItems.reduce((sum, item) => sum + item.estimatedCredits, 0) + canonicalEstimate.fallbackAllowanceCredits,
  Math.round(exactPlan.creditEstimate.total),
  'The canonical approved maximum must equal the exact total shown to the user.',
)
assert.equal(
  canonicalEstimate.lineItems.some((item) => /fallback allowance$/i.test(item.label)),
  false,
  'Fallback allowance must be represented once in its dedicated authority field, not counted again as a line item.',
)
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

const multiSourcePlan = createExactMultiSourcePrivateReviewPlan()
const multiSourceDraft = buildCanonicalPlanningDraft({
  plan: multiSourcePlan,
  plannerInput: multiSourceInput,
  sourceMediaAssets: multiSourceMediaAssets,
})
assert.equal(multiSourceDraft.ok, true, 'Exact ordered multi-source plan should compile.')
if (!multiSourceDraft.ok || !multiSourceDraft.draft.publication) {
  throw new Error('Exact ordered multi-source publication candidate was not produced.')
}
const multiSourceTrimItem = multiSourceDraft.draft.publication.canonicalPlan.workItems.find((item) =>
  item.workItemKey === 'source-trim-validation')!
assert.deepEqual(
  multiSourceTrimItem.sourceSequenceItemIds,
  ['canonical-save-source-1', 'canonical-save-source-2'],
  'Trim validation must preserve the exact approved source order.',
)
assert.equal(multiSourceTrimItem.sourceCleanupDecisionIds.length, 2)
const multiSourceFinalItem = multiSourceDraft.draft.publication.canonicalPlan.workItems.find((item) =>
  item.workItemKey === 'final-export')!
const multiSourceFinalPayload = validateOfflineRemotionFinalCompositionPlanningPayload(
  asRecord(multiSourceFinalItem.executionInput.structuredPayload),
)
assert.equal(multiSourceFinalPayload.compositionProfileId, 'approved_source_sequence_caption_final_v1')
if (multiSourceFinalPayload.compositionProfileId !== 'approved_source_sequence_caption_final_v1') {
  throw new Error('Exact ordered multi-source plan compiled to the wrong Remotion profile.')
}
assert.deepEqual(multiSourceFinalPayload.sourceSegments, [{
  sourceSequenceItemId: 'canonical-save-source-1',
  sourceStartFrame: 0,
  sourceEndFrameExclusive: 24,
  timelineStartFrame: 0,
  timelineEndFrameExclusive: 24,
}, {
  sourceSequenceItemId: 'canonical-save-source-2',
  sourceStartFrame: 0,
  sourceEndFrameExclusive: 24,
  timelineStartFrame: 24,
  timelineEndFrameExclusive: 48,
}])
assert.equal(
  multiSourceFinalItem.expectedOutputs[0]?.artifactType,
  'private_source_sequence_caption_final_video_export',
)

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
const mismatchedCreditPlan = {
  ...exactPlan,
  creditEstimate: {
    ...exactPlan.creditEstimate,
    fallbackAllowanceCredits: (exactPlan.creditEstimate.fallbackAllowanceCredits ?? 0) + 1,
  },
}
const mismatchedCreditDraft = buildCanonicalPlanningDraft({
  plan: mismatchedCreditPlan,
  plannerInput: baseInput,
  sourceMediaAssets,
})
assert.equal(mismatchedCreditDraft.ok, true, 'A stale estimate remains preservable as planning context.')
assert.equal(
  mismatchedCreditDraft.ok && mismatchedCreditDraft.draft.publication,
  undefined,
  'A mismatched visible total and fallback allowance must fail closed before canonical publication.',
)
assert.match(
  mismatchedCreditDraft.ok ? mismatchedCreditDraft.draft.publicationBlockers.join(' ') : '',
  /credit total and fallback allowance do not reconcile/i,
)

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
let exactPreferenceAuthority = exactPreferenceFixture({
  ...exactPreferenceValues(baseInput),
  workflowType: 'custom_let_ai_decide',
  targetPlatform: 'custom',
}, 4, 2)

const server = createServer((request, response) => {
  const chunks: Buffer[] = []
  request.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
  request.on('end', () => {
    const bodyText = Buffer.concat(chunks).toString('utf8')
    const body = bodyText ? JSON.parse(bodyText) as Record<string, unknown> : {}
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
    if (request.url?.includes('/edit-preferences')) {
      if (request.method === 'GET') {
        response.end(JSON.stringify({
          ok: true,
          data: { preferenceRecord: exactPreferenceAuthority },
          warnings: [],
        }))
        return
      }
      assert.equal(request.method, 'PATCH')
      assert.equal(body.workspaceId, identity.workspaceId)
      assert.equal(body.expectedRevision, exactPreferenceAuthority.recordRevision)
      const patch = body.patch as Record<string, unknown>
      assert.deepEqual(patch, {
        workflowType: baseInput.workflowType,
        targetPlatform: baseInput.targetPlatform,
      })
      exactPreferenceAuthority = exactPreferenceFixture(
        { ...exactPreferenceAuthority.values, ...patch } as ReturnType<typeof exactPreferenceValues>,
        exactPreferenceAuthority.recordRevision + 1,
        exactPreferenceAuthority.preferenceRevision + 1,
      )
      response.end(JSON.stringify({
        ok: true,
        data: {
          preferenceRecord: exactPreferenceAuthority,
          changedFields: Object.keys(patch),
          invalidation: {
            cause: 'preference_change',
            changedInputs: Object.keys(patch),
            draftPlanCleared: true,
            draftEstimateCleared: true,
            sourcePreparationReset: false,
            frameConfirmationReset: true,
            invalidatedAt: '2026-07-13T12:00:00.000Z',
          },
          replayed: false,
        },
        warnings: [],
      }))
      return
    }
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
    'planning.exactEditPreferences.get',
    'planning.exactEditPreferences.update',
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
  assert.equal(requests.length, 3, 'The first save must synchronize exact preferences, then stop after the rich-plan handoff.')
  assert.deepEqual(requests.slice(0, 3).map((request) => request.method), ['GET', 'PATCH', 'POST'])

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
  assert.deepEqual(exactResult.presentedPlan, {
    planId: 'canonical-save-plan',
    planVersion: 1,
    planHash: sha('9'),
  })
  assert.equal(requests.length, 6, 'Exact save should read exact preferences, then issue one handoff and one presentation request.')
  assert.equal(requests.every((request) => request.authorization === 'Bearer canonical-save-smoke-token'), true)
  assert.match(requests[5]?.url ?? '', /canonical-planning-handoffs\/canonical-save-handoff\/plan-presentations$/)
  const exactHandoffBody = requests[4]?.body as {
    canonicalPlanComponents?: { confirmedSettings?: { preferenceSnapshotId?: string; preferenceRevision?: number } }
  }
  assert.deepEqual(exactHandoffBody.canonicalPlanComponents?.confirmedSettings, {
    aspectRatio: '16:9',
    outputFrame: { width: 720, height: 405, fps: 24 },
    outputFrameConfirmed: true,
    sourceOrderConfirmed: true,
    sourceCleanupConfirmed: true,
    editLevel: 'pro',
    targetPlatform: 'youtube',
    preferenceSnapshotId: 'server-authority-preference-snapshot',
    preferenceRevision: 3,
  }, 'Canonical components must use the exact server-owned baseline and preference revision.')
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

function exactPreferenceValues(input: PlannerInput) {
  assert.ok(input.cleanupPreference)
  return {
    editLevel: input.editLevel,
    workflowType: input.workflowType,
    cleanupPreference: input.cleanupPreference,
    visualPreference: input.visualPreference,
    moodStyle: input.moodStyle,
    creditPreference: input.creditPreference,
    targetPlatform: input.targetPlatform,
  }
}

function exactPreferenceFixture(
  values: ReturnType<typeof exactPreferenceValues>,
  recordRevision: number,
  preferenceRevision: number,
) {
  const baselineValues = exactPreferenceValues(baseInput)
  return {
    schemaVersion: 'private-exact-edit-preferences-v1',
    workspaceId: identity.workspaceId,
    projectId: identity.projectId,
    editSessionId: identity.editSessionId,
    baseline: {
      values: baselineValues,
      preferenceSnapshotId: 'server-authority-preference-snapshot',
      capturedAt: '2026-07-13T12:00:00.000Z',
      persistenceSource: 'authenticated_private_internal_backend',
      provenance: 'saved_edit_preferences',
    },
    values,
    overrideKeys: Object.keys(values).filter((key) =>
      values[key as keyof typeof values] !== baselineValues[key as keyof typeof baselineValues]),
    recordRevision,
    preferenceRevision,
    preferenceUpdatedAt: '2026-07-13T12:00:00.000Z',
    planning: {
      planningInputRevision: preferenceRevision,
      preferenceFingerprintSha256: sha('7'),
      replanRequired: true,
      reestimateRequired: true,
      sourcePreparation: { status: 'not_started', updatedAt: '2026-07-13T12:00:00.000Z' },
      frameConfirmation: { status: 'unconfirmed', updatedAt: '2026-07-13T12:00:00.000Z' },
    },
    lifecycle: { phase: 'planning', locked: false },
    auditSummary: { eventCount: recordRevision + 1, latestEventAt: '2026-07-13T12:00:00.000Z' },
    createdAt: '2026-07-13T12:00:00.000Z',
    updatedAt: '2026-07-13T12:00:00.000Z',
    privateInternalOnly: true,
  }
}

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

function createExactMultiSourcePrivateReviewPlan(): EditPlan {
  const plan = createGuidedMockEditPlan(multiSourceInput)
  const timing = plan.masterTimingPlan!
  timing.timingBase = {
    ...timing.timingBase,
    fps: 24,
    totalDurationSeconds: 2,
    totalFrames: 48,
    sourceDurationSeconds: 2,
    finalDurationSeconds: 2,
  }
  const segmentTemplate = timing.finalTimelineSegments[0]!
  timing.finalTimelineSegments = [{
    ...segmentTemplate,
    id: 'timeline-segment-1',
    segmentId: 'segment-1',
    label: 'First approved source',
    finalRange: frameRange(0, 1, 0, 24),
  }, {
    ...segmentTemplate,
    id: 'timeline-segment-2',
    segmentId: 'segment-2',
    label: 'Second approved source',
    finalRange: frameRange(1, 2, 24, 48),
  }]
  timing.captionTimingItems = [{
    ...timing.captionTimingItems[0]!,
    captionText: 'Approved ordered source sequence',
    timeRange: frameRange(0, 2, 0, 48),
  }]
  timing.visualTimingItems = []
  timing.transitionTimingItems = []
  timing.sfxTimingItems = []
  timing.musicDuckingTimingItems = []
  timing.providerClipTimingItems = []
  const cleanup = plan.sourceCleanupPlan!
  const decisionTemplate = cleanup.decisions[0]!
  cleanup.decisions = multiSourceInput.clips.map((clip, index) => ({
    ...decisionTemplate,
    id: `multi-source-cleanup-${index + 1}`,
    clipId: clip.id,
    decision: 'preserve',
    reason: `Preserve approved source ${index + 1} in confirmed upload order.`,
    sourceRange: {
      ...frameRange(0, 1, 0, 24),
      clipId: clip.id,
      notes: [],
    },
    selectedRange: frameRange(0, 1, 0, 24),
    riskLevel: 'low',
    userReviewRequired: false,
  }))
  cleanup.preservedRanges = [...cleanup.decisions]
  cleanup.cutRanges = []
  cleanup.userReviewItems = []
  cleanup.finalDurationImpactSeconds = 0
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
