import { existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tsImport } from 'tsx/esm/api'

function check(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function runCommand(command, args) {
  const env = { ...process.env }
  delete env.DEVELOPER_DIR

  try {
    return {
      ok: true,
      output: execFileSync(command, args, {
        cwd: process.cwd(),
        env,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        maxBuffer: 80 * 1024 * 1024,
      }).trim(),
    }
  } catch (error) {
    return {
      ok: false,
      output: `${error.stdout ?? ''}${error.stderr ?? ''}`.trim(),
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function parseJsonObjectFromOutput(output) {
  const jsonStart = output.indexOf('{')
  if (jsonStart < 0) throw new Error('Expected JSON object output.')
  return JSON.parse(output.slice(jsonStart))
}

function splitLines(value) {
  return value ? value.split('\n').filter(Boolean) : []
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort()
}

function rowHasTool(row, toolId) {
  return row.normalizedToolId === toolId || row.productionToolId === toolId || row.aliases.includes(toolId)
}

function hasKeyDeep(value, forbiddenKeys, path = []) {
  if (!value || typeof value !== 'object') return []
  const findings = []
  if (Array.isArray(value)) {
    value.forEach((item, index) => findings.push(...hasKeyDeep(item, forbiddenKeys, [...path, String(index)])))
    return findings
  }

  for (const [key, nested] of Object.entries(value)) {
    if (forbiddenKeys.has(key)) findings.push([...path, key].join('.'))
    findings.push(...hasKeyDeep(nested, forbiddenKeys, [...path, key]))
  }

  return findings
}

function duplicateSystemPaths() {
  const forbiddenPaths = [
    'server/tool-calling/production-tool-registry.ts',
    'server/tool-calling/tool-registry.ts',
    'server/tool-calling/tool-qa-policy.ts',
    'server/tool-calling/tool-fallback-policy.ts',
    'server/tool-calling/production-worker-router.ts',
    'server/tool-calling/adapter-execution-registry.ts',
    'server/tool-calling/safe-command-execution-policy.ts',
    'server/tool-calling/fixture-execution-catalog.ts',
    'server/tool-calling/owner-registry.ts',
    'server/tool-calling/owner-evidence-registry.ts',
    'server/tool-calling/tool-execution-tables.ts',
    'server/tool-calling/worker-job-tables.ts',
  ]

  return forbiddenPaths.filter((filePath) => existsSync(filePath))
}

function changedForbiddenFiles() {
  const changedFiles = uniqueSorted([
    ...splitLines(runCommand('git', ['diff', '--name-only']).output),
    ...splitLines(runCommand('git', ['diff', '--cached', '--name-only']).output),
  ])

  return changedFiles.filter((filePath) => (
    filePath === 'package-lock.json' ||
    filePath.startsWith('supabase/') ||
    filePath.startsWith('database/migration-drafts/') ||
    filePath.startsWith('database/test-sql/') ||
    filePath.endsWith('.sql')
  ))
}

const refreshGateResult = runCommand('node', ['scripts/validation/tool-calling-refresh-gate.mjs'])
check(refreshGateResult.ok, `Refresh gate command failed: ${refreshGateResult.output || refreshGateResult.error}`)
const refreshGate = parseJsonObjectFromOutput(refreshGateResult.output)
check(refreshGate.continueAllowed === true, `Refresh gate blocked continuation: ${(refreshGate.blockingReasons ?? []).join(', ')}`)

const unmergedOwnerResult = runCommand('node', ['scripts/validation/tool-calling-unmerged-owner-evidence-overlay-diagnostics.mjs'])
check(unmergedOwnerResult.ok, `Unmerged owner evidence diagnostic failed: ${unmergedOwnerResult.output || unmergedOwnerResult.error}`)
const unmergedOwnerEvidence = parseJsonObjectFromOutput(unmergedOwnerResult.output)

const toolCalling = await tsImport('../../server/tool-calling/index.ts', import.meta.url)
const registry = await tsImport('../../server/tool-registry/index.ts', import.meta.url)

const {
  DEFAULT_RANKING_WEIGHTS,
  analyzeToolCallingCoverageAgainstAllOwners,
  buildAllOwnerToolReconciliationMatrix,
  listCommandIntentPolicies,
  listExplicitToolStudyCards,
  listRuntimeIdReconciliationResults,
  listSyntheticFixtureDefinitions,
  listToolAdapterContracts,
} = toolCalling

const {
  PRODUCTION_TOOL_IDS,
} = registry

const matrixRows = buildAllOwnerToolReconciliationMatrix()
const analysis = analyzeToolCallingCoverageAgainstAllOwners()
const explicitStudyCards = listExplicitToolStudyCards()
const adapterContracts = listToolAdapterContracts()
const commandIntentPolicies = listCommandIntentPolicies()
const fixtureDefinitions = listSyntheticFixtureDefinitions()
const runtimeIdReconciliationResults = listRuntimeIdReconciliationResults()

const requiredLanes = [
  'track_b_media',
  'track_a_render_export',
  'ai_graphics',
  'sound_music_audio',
  'sfx_soundsync',
  'web_capture',
  'map_geospatial',
  'provider_local_runtime',
  'worker_runtime',
  'tool_calling_overlay',
]
const requiredExamples = [
  'ffmpeg',
  'ffprobe',
  'sharp',
  'sharp_libvips',
  'duckdb',
  'polars',
  'polars_nodejs_polars',
  'opencv',
  'pyav',
  'pyscenedetect',
  'paddleocr',
  'paddlepaddle',
  'mediainfo',
  'exiftool',
  'imagemagick',
  'imagemagick_graphicsmagick',
  'tesseract',
  'opencolorio',
  'openimageio',
  'graphicsmagick',
  'remotion',
  'remotion_render_validation',
  'opentimelineio',
  'opentimelineio_timeline_validation',
  'hyperframe',
  'hyperframe_render_handoff',
  'libass',
  'libass_caption_burnin',
  'gstreamer',
  'bento4_mp4box_packaging_validation',
  'mkvtoolnix_container_validation',
  'vapoursynth',
  'revideo',
  'film',
  'tracka_caption_burnin_policy_e2e',
  'tracka_render_export_private_review_path',
  'tracka_visual_video_private_e2e',
  'd3',
  'echarts',
  'vega',
  'vega_lite',
  'satori',
  'svgdotjs_svg_js',
  'viz_js',
  'lottie',
  'animejs',
  'three_js',
  'pixijs',
  'konva',
  'babylon_js',
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'rembg',
  'transparent_background',
  'real_esrgan',
  'kornia',
  'mediapipe',
  'deepfilternet',
  'signalsmith_stretch',
  'demucs',
  'audioflux',
  'rnnoise',
  'librosa',
  'soundfile_libsndfile',
  'sox',
  'rubber_band',
  'soundtouch',
  'aubio',
  'essentia',
  'mmaudio',
  'sfx_director',
  'soundsync',
  'sound_cue_manifest_tools',
  'music_ducking_loudness_qa_planning',
  'playwright',
  'playwright_chromium',
  'browser_capture_helpers',
  'private_searxng_service',
  'maplibre',
  'turf',
  'gdal_ogr',
  'tippecanoe',
  'pmtiles',
  'deck_gl',
  'cesium_js',
  'qwen_deepseek_provider_apis',
  'lyria_provider_api',
  'mirelo_provider_api',
  'vllm',
  'qwen3_vl',
  'onnxruntime',
]

const lanesRepresented = new Set(analysis.lanesRepresented)
const missingLanes = requiredLanes.filter((lane) => !lanesRepresented.has(lane))
const missingExamples = requiredExamples.filter((toolId) => !matrixRows.some((row) => rowHasTool(row, toolId)))
const missingProductionToolIds = PRODUCTION_TOOL_IDS.filter((toolId) => !matrixRows.some((row) => row.productionToolId === toolId))
const missingStudyCards = explicitStudyCards
  .map((card) => card.toolId ?? card.externalToolId)
  .filter((toolId) => toolId && !matrixRows.some((row) => rowHasTool(row, toolId)))
const selectableNonFirstClassRows = matrixRows
  .filter((row) => row.selectableAsRuntimeTool && !row.productionToolId)
  .map((row) => row.normalizedToolId)
const finalSourceUnmergedRefs = matrixRows
  .filter((row) => row.unmergedOwnerEvidenceRefs.length > 0 && row.currentRepoStatus.includes('first_class_production_tool_id') && !row.productionToolId)
  .map((row) => row.normalizedToolId)
const rankingDimensionKeys = Object.keys(DEFAULT_RANKING_WEIGHTS)
const ownerLabelRankingDimensions = rankingDimensionKeys.filter((key) => /track|owner/i.test(key))
const duplicatePaths = duplicateSystemPaths()
const forbiddenChangedFiles = changedForbiddenFiles()
const packageLockStaged = splitLines(runCommand('git', ['diff', '--cached', '--name-only', '--', 'package-lock.json']).output).length > 0

check(missingLanes.length === 0, `Missing required owner lanes: ${missingLanes.join(', ')}`)
check(missingExamples.length === 0, `Missing required reconciliation examples: ${missingExamples.join(', ')}`)
check(missingProductionToolIds.length === 0, `Missing ProductionToolId rows: ${missingProductionToolIds.join(', ')}`)
check(missingStudyCards.length === 0, `Missing explicit study card rows: ${missingStudyCards.join(', ')}`)
check(selectableNonFirstClassRows.length === 0, `Non-first-class rows are selectable: ${selectableNonFirstClassRows.join(', ')}`)
check(finalSourceUnmergedRefs.length === 0, `Unmerged evidence appears final for rows: ${finalSourceUnmergedRefs.join(', ')}`)
check(ownerLabelRankingDimensions.length === 0, `Ranking dimensions must not use owner labels: ${ownerLabelRankingDimensions.join(', ')}`)
check(analysis.duplicateRiskFindings.length > 0, 'Duplicate risk findings must be explicit.')
check(duplicatePaths.length === 0, `Duplicate system files were introduced: ${duplicatePaths.join(', ')}`)
check(forbiddenChangedFiles.length === 0, `Forbidden files changed or staged: ${forbiddenChangedFiles.join(', ')}`)
check(packageLockStaged === false, 'package-lock.json must not be staged.')

const summary = {
  ok: true,
  refreshGateContinueAllowed: refreshGate.continueAllowed === true,
  refreshGateWarnings: refreshGate.warnings ?? [],
  githubPrScanAvailable: unmergedOwnerEvidence.githubPrScanAvailable === true,
  totalMatrixRows: analysis.totalMatrixRows,
  lanesRepresented: analysis.lanesRepresented,
  firstClassProductionToolCount: analysis.firstClassProductionToolCount,
  explicitStudyCardCount: analysis.explicitStudyCardCount,
  adapterContractCount: analysis.adapterContractCount,
  commandIntentPolicyCount: analysis.commandIntentPolicyCount,
  syntheticFixtureDefinitionCount: fixtureDefinitions.length,
  pendingRuntimeRegistryExpansionCount: analysis.pendingRuntimeRegistryExpansionCount,
  toolsNeedingStudyCardsCount: analysis.toolsNeedingStudyCards.length,
  toolsNeedingRuntimeRegistryExpansionCount: analysis.toolsNeedingRuntimeRegistryExpansion.length,
  toolsNeedingAdapterContractsCount: analysis.toolsNeedingAdapterContracts.length,
  blockedToolCount: analysis.toolsBlockedByOwnerOrLicense.length,
  duplicateRiskCount: analysis.duplicateRiskFindings.length,
  unmergedOwnerEvidenceCount: unmergedOwnerEvidence.openPrEvidenceCount ?? analysis.unmergedOwnerEvidenceCount,
  recommendedNextMilestones: analysis.recommendedNextMilestones,
  runtimeIdReconciliationCount: runtimeIdReconciliationResults.length,
  packageLockStaged,
  executesTools: false,
  mediaProcessingPerformed: false,
  supabaseMutationPerformed: false,
  sqlExecuted: false,
  duplicateSystemsCreated: false,
}

const forbiddenOutputKeys = new Set([
  'rawPrompt',
  'signedUrl',
  'signed_url',
  'serviceRole',
  'service_role',
  'arbitraryArgs',
  'arbitrary_args',
  'command',
  'args',
  'argv',
  'exec',
  'spawn',
  'localPath',
  'local_path',
])
const forbiddenFieldsFound = hasKeyDeep(summary, forbiddenOutputKeys)
check(forbiddenFieldsFound.length === 0, `Forbidden output fields found: ${forbiddenFieldsFound.join(', ')}`)

console.log(JSON.stringify({
  ...summary,
  forbiddenFieldsFound,
}, null, 2))
