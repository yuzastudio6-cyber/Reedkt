import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { AddressInfo } from 'node:net'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import type {
  EditReferenceApiSuccess,
  EditReferenceDetailData,
  PreferenceApplicationRecord,
  PreferenceApplicationTargetContextSnapshot,
  PreferenceDNAVersionRecord,
} from '../../src/types/edit-reference'
import {
  persistReadyTargetVideoUnderstandingFixture,
  targetUnderstandingRequestFields,
} from './fixtures/ready-target-video-understanding-fixture'

const root = await mkdtemp(join(tmpdir(), 'reeditpro-edit-reference-gate8-adaptation-'))
const workspaceId = 'workspace-edit-reference-gate8-adaptation'
const ownerUserId = 'mock-user-runtime'

try {
  const runtime = await startRuntime(root)
  try {
    let travelReference = await createApprovedReference(runtime.baseUrl, {
      key: 'gate8-travel-reference',
      name: 'Travel story reference',
      evidenceTitle: 'Place-led travel storytelling principles',
      evidenceSummary: 'Use a place-first hook, personal discovery arc, warm natural color, restrained map cards, destination-specific B-roll, readable target-authored captions, and ambient target-cleared music. Never copy exact reference footage, route, sequence, captions, creator identity, destination brand, music, sound effects, or graphic layout.',
    })
    let educationalReference = await createApprovedReference(runtime.baseUrl, {
      key: 'gate8-educational-reference',
      name: 'Educational product reference',
      evidenceTitle: 'Step-led educational explanation principles',
      evidenceSummary: 'Use a question-led hook, ordered explanation, readable target-authored labels, restrained screen callouts, clear proof, measured pacing, and sparse speech-safe sound. Never copy exact reference footage, demonstration sequence, captions, product brand, presenter identity, music, sound effects, UI, or graphic layout.',
    })
    const visualHeavyReference = await createApprovedReference(runtime.baseUrl, {
      key: 'gate8-visual-heavy-reference',
      name: 'Visual-heavy montage reference',
      evidenceTitle: 'Image-led visual rhythm principles',
      evidenceSummary: 'Use strong visual hierarchy, purposeful compositions, movement-led pacing, restrained labels, original transition logic, and target-owned B-roll. Never copy exact footage, shot sequence, timecodes, people, creator identity, brands, graphics, captions, music, sound effects, or layouts.',
    })
    const captionHeavyReference = await createApprovedReference(runtime.baseUrl, {
      key: 'gate8-caption-heavy-reference',
      name: 'Caption-heavy explainer reference',
      evidenceTitle: 'Readable explanatory caption principles',
      evidenceSummary: 'Use speech-aligned explanatory captions, clear hierarchy, readable holds, restrained emphasis, and original target-authored labels. Never copy exact caption wording, timing, typography, layouts, footage, people, brands, music, sound effects, or graphic assets.',
    })
    const audioHeavyReference = await createApprovedReference(runtime.baseUrl, {
      key: 'gate8-audio-heavy-reference',
      name: 'Audio-led story reference',
      evidenceTitle: 'Speech-safe audio storytelling principles',
      evidenceSummary: 'Use narration-led pacing, deliberate silence, speech-safe music ducking, meaning-linked ambience, and sparse target-specific sound cues. Never copy exact voice, performance, music, sound effects, mix automation, timing, footage, people, brands, captions, or graphics.',
    })

    const travelToEducationalProduct = await prepareApplication(runtime.baseUrl, travelReference, 'gate8-travel-to-educational-product', target({
      projectId: 'project-gate8-educational-product',
      editSessionId: 'edit-gate8-educational-product',
      projectName: 'Learning product launch',
      editName: 'Educational product walkthrough',
      sourceMode: 'mixed',
      contentType: 'product_demo',
      sourceSummary: 'A teacher introduces a study product, demonstrates its workflow, and uses original screen recordings and product footage.',
      currentUserInstruction: 'Teach the product workflow in the target demonstration order, keep labels exact, require readable captions, and avoid decorative sound effects.',
      selectedEditLevel: 'premium',
      aspectRatio: '16:9',
      platformTarget: 'youtube_standard',
      storyRole: 'Turn the target product demonstration into a clear educational progression from learner problem to verified product result',
      budgetPreference: 'balanced',
      directives: { captions: 'required', music: 'adapt', sfx: 'avoid', sourceOrder: 'preserve' },
      approvedConstraints: ['Use only target-owned product footage and screen recordings.', 'Keep every factual product label exact.'],
    }))
    travelReference = travelToEducationalProduct.detail

    const travelToTalkingHead = await prepareApplication(runtime.baseUrl, travelReference, 'gate8-travel-to-talking-head', target({
      projectId: 'project-gate8-travel-talking-head',
      editSessionId: 'edit-gate8-travel-talking-head',
      projectName: 'Personal travel journal',
      editName: 'Travel talking-head story',
      sourceMode: 'voice_first',
      contentType: 'talking_head',
      sourceSummary: 'A traveler tells a personal story on camera with original destination footage and a first-person narration.',
      currentUserInstruction: 'Protect the speaker’s personal chronology, require speech-aligned captions, use destination B-roll only when it advances the target story, and keep music under the voice.',
      selectedEditLevel: 'normal',
      aspectRatio: '9:16',
      platformTarget: 'youtube_shorts',
      storyRole: 'Preserve the target traveler’s first-person discovery arc and emotional pauses',
      budgetPreference: 'efficient',
      directives: { captions: 'required', music: 'adapt', sfx: 'adapt', sourceOrder: 'preserve' },
      approvedConstraints: ['Use only the target traveler’s footage.', 'Speech meaning outranks music and decorative motion.'],
    }))
    travelReference = travelToTalkingHead.detail

    const educationalToProductDemo = await prepareApplication(runtime.baseUrl, educationalReference, 'gate8-educational-to-product-demo', target({
      projectId: 'project-gate8-product-demo',
      editSessionId: 'edit-gate8-product-demo',
      projectName: 'Product proof series',
      editName: 'Target product demo',
      sourceMode: 'voice_first',
      contentType: 'product_demo',
      sourceSummary: 'A product specialist narrates an original feature demonstration with target-owned UI capture and proof clips.',
      currentUserInstruction: 'Preserve the demonstrated target steps, require exact target-authored captions and UI labels, avoid music and sound effects, and show proof before the result claim.',
      selectedEditLevel: 'ultra_premium',
      aspectRatio: '4:5',
      platformTarget: 'instagram_feed',
      storyRole: 'Explain the target product’s own workflow and verified result without importing the reference demonstration order',
      budgetPreference: 'cinematic',
      directives: { captions: 'required', music: 'avoid', sfx: 'avoid', sourceOrder: 'preserve' },
      approvedConstraints: ['Use only target-owned UI and product media.', 'Do not imply an unverified product claim.'],
    }))
    educationalReference = educationalToProductDemo.detail

    const visualToSparseTalkingHead = await prepareApplication(runtime.baseUrl, visualHeavyReference, 'gate8-visual-to-sparse-talking-head', target({
      projectId: 'project-gate8-sparse-talking-head',
      editSessionId: 'edit-gate8-sparse-talking-head',
      projectName: 'Founder perspective series',
      editName: 'Sparse founder talking head',
      sourceMode: 'voice_first',
      contentType: 'talking_head',
      sourceSummary: 'A single founder speaks directly to camera with long uninterrupted thoughts and only two target-owned supporting images.',
      currentUserInstruction: 'Protect the speaker’s meaning and natural pauses, use supporting visuals only when evidence requires them, and avoid forcing montage density onto the source.',
      selectedEditLevel: 'normal',
      aspectRatio: '16:9',
      platformTarget: 'youtube_standard',
      storyRole: 'Preserve a calm first-person argument with minimal visual interruption',
      budgetPreference: 'efficient',
      directives: { captions: 'adapt', music: 'avoid', sfx: 'avoid', sourceOrder: 'preserve' },
      approvedConstraints: ['Do not invent missing B-roll.', 'The speaker must remain visually present for meaning-critical claims.'],
    }))

    const captionToSilentVisual = await prepareApplication(runtime.baseUrl, captionHeavyReference, 'gate8-caption-to-silent-visual', target({
      projectId: 'project-gate8-silent-visual',
      editSessionId: 'edit-gate8-silent-visual',
      projectName: 'Silent craft film',
      editName: 'Silent visual process',
      sourceMode: 'silent_visual',
      contentType: 'lifestyle_montage',
      sourceSummary: 'A silent target-owned craft process is shown through clear hand movements and material changes with no dialogue.',
      currentUserInstruction: 'Do not add dialogue captions; use only essential target-authored process labels and let visible action carry the sequence.',
      selectedEditLevel: 'premium',
      aspectRatio: '9:16',
      platformTarget: 'instagram_reel',
      storyRole: 'Show the transformation from raw material to finished object without invented narration',
      budgetPreference: 'balanced',
      directives: { captions: 'avoid', music: 'adapt', sfx: 'adapt', sourceOrder: 'preserve' },
      approvedConstraints: ['No invented speech or quotations.', 'Any label must describe a visible target action.'],
    }))

    const audioToVoiceFirst = await prepareApplication(runtime.baseUrl, audioHeavyReference, 'gate8-audio-to-voice-first', target({
      projectId: 'project-gate8-voice-first',
      editSessionId: 'edit-gate8-voice-first',
      projectName: 'Research interview series',
      editName: 'Voice-first expert account',
      sourceMode: 'voice_first',
      contentType: 'documentary',
      sourceSummary: 'An expert gives a target-recorded account supported by target-owned documents and quiet room tone.',
      currentUserInstruction: 'Keep the expert’s exact target meaning, use restrained target-cleared ambience, and never import the reference voice, score, or sound design.',
      selectedEditLevel: 'ultra_premium',
      aspectRatio: '16:9',
      platformTarget: 'youtube_standard',
      storyRole: 'Build a credible evidence-led account around the target expert’s own testimony',
      budgetPreference: 'cinematic',
      directives: { captions: 'required', music: 'adapt', sfx: 'adapt', sourceOrder: 'preserve' },
      approvedConstraints: ['Speech clarity and factual meaning outrank music.', 'Use only cleared target audio and evidence.'],
    }))

    const missingLayerEvidence = await prepareApplication(
      runtime.baseUrl,
      travelReference,
      'gate8-missing-layer-evidence',
      target({
        projectId: 'project-gate8-missing-layer-evidence',
        editSessionId: 'edit-gate8-missing-layer-evidence',
        projectName: 'Evidence-limited interview',
        editName: 'Interview without supporting assets',
        sourceMode: 'voice_first',
        contentType: 'talking_head',
        sourceSummary: 'A complete target interview was studied, but no target-owned B-roll or graphics evidence was available.',
        currentUserInstruction: 'Preserve the interview and do not invent supporting visuals or graphics.',
        selectedEditLevel: 'normal',
        aspectRatio: '16:9',
        platformTarget: 'youtube_standard',
        storyRole: 'Keep the target interview credible while holding back unsupported visual treatment',
        budgetPreference: 'efficient',
        directives: { captions: 'adapt', music: 'avoid', sfx: 'avoid', sourceOrder: 'preserve' },
        approvedConstraints: ['Do not invent missing B-roll.', 'Do not create graphics without target evidence.'],
      }),
      {
        omitVisualOpportunityCategories: ['broll_pattern'],
        omitGraphicsNeeds: true,
      },
    )

    const cases = [
      proofCase('travel_story_to_educational_product', travelToEducationalProduct.application, approvedDNA(travelToEducationalProduct.detail)),
      proofCase('travel_story_to_travel_talking_head', travelToTalkingHead.application, approvedDNA(travelToTalkingHead.detail)),
      proofCase('educational_reference_to_product_demo', educationalToProductDemo.application, approvedDNA(educationalToProductDemo.detail)),
      proofCase('visual_heavy_reference_to_sparse_talking_head', visualToSparseTalkingHead.application, approvedDNA(visualToSparseTalkingHead.detail)),
      proofCase('caption_heavy_reference_to_silent_visual', captionToSilentVisual.application, approvedDNA(captionToSilentVisual.detail)),
      proofCase('audio_heavy_reference_to_voice_first_target', audioToVoiceFirst.application, approvedDNA(audioToVoiceFirst.detail)),
    ]

    for (const item of cases) {
      assert(item.referenceFindings.length > 0)
      assert(item.transferablePrinciples.length > 0)
      assert(item.nonTransferableElements.length >= 5)
      assert(item.appliedRules.length > 0)
      assert(item.adaptedRules.length > 0)
      assert(item.ignoredRules.length > 0)
      assert(item.blockedRules.length >= 5)
      assert.equal(item.clarifications.length, 0)
      assert.equal(item.doNotCopyResult, 'passed')
      assert.equal(item.copyBoundariesBlocked, true)
      assert.equal(item.productionEffects, false)
      assert(item.adaptedRules.every((rule) => !/copy the reference|reuse the reference footage|match the exact sequence/i.test(rule)))
    }

    assert.notEqual(travelToEducationalProduct.application.targetContextDigest, travelToTalkingHead.application.targetContextDigest)
    assert.notEqual(travelToEducationalProduct.application.contentDigest, travelToTalkingHead.application.contentDigest)
    assert.notDeepEqual(travelToEducationalProduct.application.decisions, travelToTalkingHead.application.decisions)
    assert.notDeepEqual(travelToEducationalProduct.application.decisions, educationalToProductDemo.application.decisions)

    const educationalProductBroll = decisionInstruction(travelToEducationalProduct.application, 'broll_shot_language')
    const talkingHeadBroll = decisionInstruction(travelToTalkingHead.application, 'broll_shot_language')
    assert.match(educationalProductBroll, /learner problem to verified product result/i)
    assert.match(talkingHeadBroll, /first-person discovery arc/i)
    assert.notEqual(educationalProductBroll, talkingHeadBroll)
    assert.match(decisionInstruction(travelToEducationalProduct.application, 'speech_caption_behavior'), /target speech exactly|target-authored captions/i)
    assert.match(decisionInstruction(travelToTalkingHead.application, 'pacing_timing'), /speech meaning and readable pauses/i)
    assert.match(decisionInstruction(educationalToProductDemo.application, 'music_soundsync'), /Do not apply music guidance/i)
    assert.match(decisionInstruction(educationalToProductDemo.application, 'sfx_sound_design'), /Do not apply sound-effect guidance/i)
    assert.match(decisionInstruction(visualToSparseTalkingHead.application, 'broll_shot_language'), /calm first-person argument|minimal visual interruption/i)
    assert.match(decisionInstruction(captionToSilentVisual.application, 'speech_caption_behavior'), /Do not apply caption guidance/i)
    assert.match(decisionInstruction(audioToVoiceFirst.application, 'music_soundsync'), /narration|speech|target-cleared music/i)
    const missingBrollDecision = decisionForLayer(missingLayerEvidence.application, 'broll_shot_language')
    assert(missingBrollDecision)
    assert.equal(missingBrollDecision.decision, 'needs_clarification')
    assert((missingBrollDecision.targetEvidenceIds ?? []).length > 0)
    assert((missingBrollDecision.targetEvidenceIds ?? []).every((evidenceId) => (
      missingLayerEvidence.application.targetUnderstanding?.evidenceIds.includes(evidenceId)
    )))
    assert.equal(missingBrollDecision.targetEvidenceConfidence, 0)
    assert.match(missingBrollDecision.heldBackReason ?? '', /enough layer-specific evidence/i)
    const missingLayerDNA = approvedDNA(missingLayerEvidence.detail)
    const transferableGraphicsRuleIds = new Set(missingLayerDNA.rules
      .filter((rule) => (
        (rule.layerId === 'graphic_design_visualexplain' || rule.layerId === 'ui_document_card_treatment')
        && (rule.kind === 'must_follow' || rule.kind === 'avoid')
      ))
      .map((rule) => rule.id))
    const missingGraphicsDecisions = missingLayerEvidence.application.decisions.filter((decision) => (
      transferableGraphicsRuleIds.has(decision.sourceRuleId)
    ))
    assert(missingGraphicsDecisions.length > 0)
    assert(missingGraphicsDecisions.every((decision) => (
      decision.decision === 'needs_clarification'
      && (decision.targetEvidenceIds ?? []).length > 0
      && decision.targetEvidenceConfidence === 0
      && decision.confidence === 0
    )), JSON.stringify(missingGraphicsDecisions, null, 2))

    const serialized = JSON.stringify(cases)
    assert.doesNotMatch(serialized, /reuse the reference footage|copy the exact captions|copy the exact sequence|copy creator identity/i)
    assert.equal(travelReference.detail.applications.length, 2)
    assert.equal(educationalReference.detail.applications.length, 1)

    console.log(JSON.stringify({
      check: 'edit_reference_adaptation_proof',
      ok: true,
      cases: cases.map((item) => ({
        id: item.id,
        targetUnderstanding: item.targetUnderstanding,
        referenceFindingCount: item.referenceFindings.length,
        transferablePrincipleCount: item.transferablePrinciples.length,
        nonTransferableElementCount: item.nonTransferableElements.length,
        appliedRuleCount: item.appliedRules.length,
        adaptedRuleCount: item.adaptedRules.length,
        ignoredRuleCount: item.ignoredRules.length,
        blockedRuleCount: item.blockedRules.length,
        clarificationCount: item.clarifications.length,
        doNotCopyResult: item.doNotCopyResult,
        copyBoundariesBlocked: item.copyBoundariesBlocked,
        productionEffects: item.productionEffects,
      })),
      missingLayerEvidenceHeldBack: true,
      unrelatedTargetEvidenceFallbackUsed: false,
    }, null, 2))
  } finally {
    await runtime.close()
  }
} finally {
  await rm(root, { recursive: true, force: true })
}

function target(
  value: Omit<PreferenceApplicationTargetContextSnapshot, 'outputFrameConfirmed'>,
): PreferenceApplicationTargetContextSnapshot {
  return { ...value, outputFrameConfirmed: true }
}

function proofCase(id: string, application: PreferenceApplicationRecord, dna: PreferenceDNAVersionRecord) {
  const applied = application.decisions.filter((decision) => decision.decision === 'applied' || decision.decision === 'adapted')
  const adapted = application.decisions.filter((decision) => decision.decision === 'adapted')
  const ignored = application.decisions.filter((decision) => decision.decision === 'ignored')
  const blocked = application.decisions.filter((decision) => decision.decision === 'blocked')
  const clarifications = application.decisions.filter((decision) => decision.decision === 'needs_clarification')
  return {
    id,
    referenceFindings: dna.layers.flatMap((layer) => layer.summary ? [layer.summary] : []),
    transferablePrinciples: dna.rules.filter((rule) => rule.kind === 'must_follow' || rule.kind === 'avoid').map((rule) => rule.statement),
    nonTransferableElements: dna.rules.filter((rule) => rule.kind === 'context_only' || rule.kind === 'do_not_copy').map((rule) => rule.statement),
    targetUnderstanding: {
      contentType: application.targetContext.contentType,
      sourceMode: application.targetContext.sourceMode,
      sourceSummary: application.targetContext.sourceSummary,
      storyRole: application.targetContext.storyRole,
      frame: application.targetContext.aspectRatio,
      platform: application.targetContext.platformTarget,
    },
    appliedRules: applied.map((decision) => decision.targetInstruction),
    adaptedRules: adapted.map((decision) => decision.targetInstruction),
    ignoredRules: ignored.map((decision) => decision.targetInstruction),
    blockedRules: blocked.map((decision) => decision.targetInstruction),
    clarifications: clarifications.map((decision) => decision.targetInstruction),
    doNotCopyResult: application.doNotCopyRules.length >= 5 && blocked.length >= application.doNotCopyRules.length ? 'passed' : 'failed',
    copyBoundariesBlocked: application.doNotCopyRules.every((rule) =>
      blocked.some((decision) => decision.targetInstruction === rule)),
    productionEffects: Object.values({
      targetEditMutationMade: application.targetEditMutationMade,
      approvedPlanMutationMade: application.approvedPlanMutationMade,
      providerCallMade: application.providerCallMade,
      modelCallMade: application.modelCallMade,
      mediaProcessingStarted: application.mediaProcessingStarted,
      workerJobCreated: application.workerJobCreated,
      generationRequestCreated: application.generationRequestCreated,
      renderJobCreated: application.renderJobCreated,
      creditReservedOrSpent: application.creditReservedOrSpent,
    }).some(Boolean),
  }
}

function decisionInstruction(application: PreferenceApplicationRecord, layerId: PreferenceApplicationRecord['decisions'][number]['layerId']): string {
  return application.decisions.find((decision) => decision.layerId === layerId)?.targetInstruction ?? ''
}

function decisionForLayer(
  application: PreferenceApplicationRecord,
  layerId: PreferenceApplicationRecord['decisions'][number]['layerId'],
) {
  return application.decisions.find((decision) => decision.layerId === layerId)
}

function approvedDNA(data: EditReferenceDetailData): PreferenceDNAVersionRecord {
  const dna = data.detail.dnaVersions.find((candidate) => candidate.status === 'approved')
  assert(dna)
  return dna
}

async function prepareApplication(
  baseUrl: string,
  current: EditReferenceDetailData,
  key: string,
  targetContext: PreferenceApplicationTargetContextSnapshot,
  fixtureOptions: {
    readonly omitVisualOpportunityCategories?: readonly ('visual_language' | 'broll_pattern' | 'color_treatment' | 'graphics_motion')[]
    readonly omitGraphicsNeeds?: boolean
  } = {},
): Promise<{ detail: EditReferenceDetailData; application: PreferenceApplicationRecord }> {
  const dna = approvedDNA(current)
  const targetUnderstanding = await persistReadyTargetVideoUnderstandingFixture({
    localStorageRoot: root,
    ownerUserId,
    workspaceId,
    editReferenceId: current.detail.reference.id,
    studySessionId: current.detail.study.id,
    targetContext,
    fixtureKey: key,
    ...fixtureOptions,
  })
  const detail = await mutation<EditReferenceDetailData>(baseUrl, `/v1/edit-reference-studies/${current.detail.study.id}/preference-dna/${dna.id}/applications`, key, {
    workspaceId,
    expectedReferenceRevision: current.detail.reference.revision,
    expectedDNAContentDigest: dna.contentDigest,
    acknowledgeAdaptNotCopy: true,
    targetContext,
    ...targetUnderstandingRequestFields(targetUnderstanding),
  })
  const application = detail.detail.applications.find((candidate) => candidate.editSessionId === targetContext.editSessionId)
  assert(application)
  return { detail, application }
}

async function createApprovedReference(baseUrl: string, input: {
  key: string
  name: string
  evidenceTitle: string
  evidenceSummary: string
}): Promise<EditReferenceDetailData> {
  const created = await mutation<EditReferenceDetailData>(baseUrl, '/v1/edit-references', `${input.key}-create`, {
    workspaceId,
    name: input.name,
    initialGoals: ['visual_language', 'story_and_pacing', 'captions', 'color', 'b_roll', 'audio_and_sfx', 'graphics'],
  })
  const studyId = created.detail.study.id
  const evidence = await mutation<EditReferenceDetailData>(baseUrl, `/v1/edit-reference-studies/${studyId}/evidence`, `${input.key}-evidence`, {
    workspaceId,
    expectedStudyRevision: created.detail.study.revision,
    sourceType: 'manual_user_evidence',
    title: input.evidenceTitle,
    category: 'all_goals',
    summary: input.evidenceSummary,
    intendedUse: 'transferable',
  })
  const contextOnlyEvidence = await mutation<EditReferenceDetailData>(baseUrl, `/v1/edit-reference-studies/${studyId}/evidence`, `${input.key}-context-evidence`, {
    workspaceId,
    expectedStudyRevision: evidence.detail.study.revision,
    sourceType: 'manual_user_evidence',
    title: `${input.name} source-specific context`,
    category: 'visual_language',
    summary: 'Keep the source-specific branded card arrangement only as context; do not reuse its layout, marks, identity, or authored assets.',
    intendedUse: 'non_transferable',
  })
  const studied = await mutation<EditReferenceDetailData>(baseUrl, `/v1/edit-reference-studies/${studyId}/evidence-study`, `${input.key}-study`, {
    workspaceId,
    expectedStudyRevision: contextOnlyEvidence.detail.study.revision,
  })
  const synthesized = await mutation<EditReferenceDetailData>(baseUrl, `/v1/edit-reference-studies/${studyId}/preference-dna`, `${input.key}-dna`, {
    workspaceId,
    expectedStudyRevision: studied.detail.study.revision,
  })
  const dna = synthesized.detail.dnaVersions[0]
  assert(dna)
  const quality = await mutation<EditReferenceDetailData>(baseUrl, `/v1/edit-reference-studies/${studyId}/preference-dna/${dna.id}/qa`, `${input.key}-qa`, {
    workspaceId,
    expectedStudyRevision: synthesized.detail.study.revision,
    expectedDNAContentDigest: dna.contentDigest,
  })
  const qa = quality.detail.dnaQaResults[0]
  assert(qa)
  return mutation<EditReferenceDetailData>(baseUrl, `/v1/edit-reference-studies/${studyId}/preference-dna/${dna.id}/approve`, `${input.key}-approve`, {
    workspaceId,
    expectedStudyRevision: quality.detail.study.revision,
    expectedDNAContentDigest: dna.contentDigest,
    qaResultId: qa.id,
    acknowledgeAdaptNotCopy: true,
    acknowledgeQAReview: qa.status === 'requires_user_review',
  })
}

async function startRuntime(localStorageRoot: string) {
  const env = loadRuntimeEnv({
    NODE_ENV: 'test',
    API_PORT: '8787',
    E2E_RUNTIME_MODE: 'local',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    STORAGE_MODE: 'local',
    LOCAL_STORAGE_ROOT: localStorageRoot,
    PROVIDER_EXECUTION_ENABLED: 'false',
    WORKER_RUNTIME_MODE: 'mock',
  })
  const server = createReeditProApiApp(env).listen(0, '127.0.0.1')
  await new Promise<void>((resolvePromise, reject) => {
    server.once('listening', resolvePromise)
    server.once('error', reject)
  })
  return {
    baseUrl: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    close: () => new Promise<void>((resolvePromise, reject) => server.close((error) => error ? reject(error) : resolvePromise())),
  }
}

async function mutation<T>(baseUrl: string, path: string, key: string, body: unknown): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'idempotency-key': key },
    body: JSON.stringify(body),
  })
  const payload = await response.json() as EditReferenceApiSuccess<T> | { error: { code: string; message: string } }
  assert.equal(response.ok, true, JSON.stringify(payload))
  assert('ok' in payload && payload.ok === true, JSON.stringify(payload))
  return payload.data
}
