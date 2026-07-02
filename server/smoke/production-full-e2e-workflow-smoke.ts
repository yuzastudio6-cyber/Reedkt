import { buildApprovedWorkflowPayload, ProductionWorkflowArtifactStore, productionWorkflowScenarios, runProductionWorkflowScenario } from '../e2e/production-workflow'
import { buildProductionWorkflowFixture } from '../e2e/production-workflow/production-workflow-fixture-builder'
import type { ProductionWorkflowStage } from '../e2e/production-workflow'

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

const scenarioIds = new Set(productionWorkflowScenarios.map((scenario) => scenario.scenarioId))
for (const expected of [
  'talking-head-clean-edit',
  'podcast-repeated-takes',
  'screen-recording-caption-safe',
  'text-behind-subject',
  'low-quality-enhancement',
  'mixed-color-multiclip',
  'audio-noise-music-overlap',
  'final-render-export',
  'production-blocked-readiness',
]) {
  check(scenarioIds.has(expected), `Missing E2E scenario: ${expected}`)
}
check(productionWorkflowScenarios.every((scenario) => scenario.expectedStages.length > 0), 'Every scenario must declare expected stages.')

const fixture = buildProductionWorkflowFixture(productionWorkflowScenarios[0])
const payload = buildApprovedWorkflowPayload({
  fixture,
  stage: 'media_foundation',
  workerType: 'cpu_analysis_worker',
  requestedToolIds: ['ffprobe', 'ffmpeg'],
  requestedRecipeIds: ['smart_cut_recipe'],
  requiredQualityGateTypes: ['render_asset_integrity'],
})
check(Boolean(payload.approvedSnapshotId && payload.toolExecutionPlanId && payload.idempotencyKey), 'Approved payload builder must include approved snapshot, plan, and idempotency key.')
check(JSON.stringify(payload).includes('approvedSnapshotOnly'), 'Approved payload builder must annotate approved snapshot execution.')

const artifactStore = new ProductionWorkflowArtifactStore()
let rejectedSignedUrl = false
try {
  artifactStore.rejectSignedUrl('https://storage.example/source.mp4?X-Goog-Signature=abc')
} catch {
  rejectedSignedUrl = true
}
check(rejectedSignedUrl, 'Artifact store must reject signed URLs.')
const sourceArtifact = artifactStore.addPlannedArtifact({
  workspaceId: fixture.workspaceId,
  projectId: fixture.projectId,
  mediaAssetId: fixture.mediaAssetId,
  stage: 'media_foundation',
  artifactType: 'source_media',
  fileName: 'source.json',
  storageBucketPurpose: 'source_media',
  sourceOfTruth: true,
})
artifactStore.consumeArtifact(sourceArtifact.id, 'speech_caption_execution')
const storeSummary = artifactStore.buildSummary(['source_media'])
check(storeSummary.sourceImmutable, 'Artifact store must preserve source immutability.')
check(storeSummary.producerConsumerPairs[0]?.consumedByStages.includes('speech_caption_execution'), 'Artifact store must track producer/consumer stages.')

const talkingHead = await runProductionWorkflowScenario({ scenario: scenarioById('talking-head-clean-edit'), mode: 'dry_run' })
check(hasStages(talkingHead, scenarioById('talking-head-clean-edit').expectedStages), 'Talking-head dry-run must complete all expected stages.')
check(talkingHead.artifactSummary.byType.transcript_json !== undefined, 'Talking-head scenario must produce transcript artifacts.')
check(talkingHead.qaSummary.blocksFinalExport.includes('final_delivery'), 'Final delivery must block without final_export artifact.')

const podcast = await runProductionWorkflowScenario({ scenario: scenarioById('podcast-repeated-takes'), mode: 'dry_run' })
check(podcast.warnings.join('\n').includes('Repeated-take planner'), 'Podcast scenario must preserve repeated-take safety.')
check(podcast.qaSummary.blocksFinalExport.includes('cut_smoothness') || podcast.qaSummary.total > 0, 'Podcast scenario must emit cut/transcript QA.')

const screenRecording = await runProductionWorkflowScenario({ scenario: scenarioById('screen-recording-caption-safe'), mode: 'dry_run' })
check(screenRecording.warnings.join('\n').includes('OCR not executed'), 'Screen-recording scenario must emit OCR-safe warning.')
check(!JSON.stringify(screenRecording).toLowerCase().includes('advanced ocr ran'), 'Screen-recording scenario must not claim OCR ran.')

const textBehind = await runProductionWorkflowScenario({ scenario: scenarioById('text-behind-subject'), mode: 'dry_run' })
check(textBehind.warnings.join('\n').includes('Weak mask confidence'), 'Text-behind-subject scenario must downgrade/block weak masks.')
check(textBehind.qaSummary.total > 0, 'Text-behind-subject scenario must emit mask/render QA.')

const enhancement = await runProductionWorkflowScenario({ scenario: scenarioById('low-quality-enhancement'), mode: 'dry_run' })
check(JSON.stringify(enhancement.stageResults).includes('sampleFirst'), 'Enhancement scenario must enforce sample-first policy.')
check(enhancement.qaSummary.blocksFinalExport.includes('final_delivery'), 'Enhancement dry-run must not final-deliver without final export.')

const color = await runProductionWorkflowScenario({ scenario: scenarioById('mixed-color-multiclip'), mode: 'dry_run' })
check(color.qaSummary.total > 0 && JSON.stringify(color.stageResults).includes('shotMatch'), 'Color scenario must emit color QA and shot-match planning.')

const audio = await runProductionWorkflowScenario({ scenario: scenarioById('audio-noise-music-overlap'), mode: 'dry_run' })
check(audio.qaSummary.total > 0, 'Audio scenario must emit audio QA.')
check(JSON.stringify(audio.qaSummary).includes('music_over_voice') || JSON.stringify(audio.stageResults).includes('duck_music_under_voice'), 'Audio scenario must address music over voice.')

const finalRender = await runProductionWorkflowScenario({ scenario: scenarioById('final-render-export'), mode: 'dry_run' })
check(finalRender.stageResults.some((stage) => stage.stage === 'final_render_export_execution' && Number(stage.outputSummary.commandPlans) >= 3), 'Final render scenario must create command plans without tools.')
check(!finalRender.finalDeliveryAllowed, 'final_delivery must not pass without final_export artifact.')
check(finalRender.artifactSummary.byType.render_manifest !== undefined, 'Final render scenario must create render_manifest artifact.')

const localDev = await runProductionWorkflowScenario({ scenario: scenarioById('final-render-export'), mode: 'local_dev_generated_fixture' })
check(localDev.artifactSummary.tempFixtureCleanupRequired.length === 0, 'Local-dev generated fixture mode must not leave temp fixture cleanup debt in dry-run-safe smoke.')

const combined = JSON.stringify([talkingHead, podcast, screenRecording, textBehind, enhancement, color, audio, finalRender, localDev]).toLowerCase()
check(!combined.includes('providerapikey') && !combined.includes('service_role_key') && !combined.includes('allowmodeldownload') && !combined.includes('gcloud '), 'E2E reports must not expose provider/cloud/model-download execution paths.')
check(!combined.includes('evaluation_revideo') && !combined.includes('"revideoUsed":true'.toLowerCase()), 'E2E workflow must not use Revideo.')
check(finalRender.artifactSummary.sourceImmutable, 'Source media immutability must be preserved.')

console.log(JSON.stringify({
  ok: true,
  scenarios: productionWorkflowScenarios.length,
  checks: [
    'scenario_matrix',
    'approved_payload_builder',
    'artifact_store_handoff',
    'talking_head_dry_run',
    'podcast_repeated_take_safety',
    'screen_recording_ocr_safe',
    'text_behind_subject_downgrade',
    'sample_first_enhancement',
    'color_qa',
    'audio_music_over_voice',
    'final_render_command_plans',
    'final_delivery_rules',
    'local_dev_generated_fixture_safe',
    'no_provider_cloud_model_download',
    'no_revideo',
    'source_immutability',
    'workflow_report_shape',
  ],
  talkingHeadStages: talkingHead.stageResults.length,
  finalRenderCommandPlans: finalRender.stageResults.find((stage) => stage.stage === 'final_render_export_execution')?.outputSummary.commandPlans,
  qaResults: finalRender.qaSummary.total,
}, null, 2))

function scenarioById(scenarioId: string) {
  const scenario = productionWorkflowScenarios.find((item) => item.scenarioId === scenarioId)
  if (!scenario) throw new Error(`Missing scenario ${scenarioId}`)
  return scenario
}

function hasStages(report: Awaited<ReturnType<typeof runProductionWorkflowScenario>>, expectedStages: ProductionWorkflowStage[]): boolean {
  const actual = new Set(report.stageResults.map((stage) => stage.stage))
  return expectedStages.every((stage) => actual.has(stage))
}
