import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tsImport } from 'tsx/esm/api'

const REPO = 'yuzastudio6-cyber/Reedkt'
const PR_JSON_FIELDS = 'number,title,state,isDraft,mergeable,headRefName,baseRefName,updatedAt,labels,body'
const PR_VIEW_JSON_FIELDS = 'number,title,state,isDraft,mergeable,headRefName,baseRefName,updatedAt,labels,body,files'

const knownNextMilestones = [
  {
    milestone: 'REEDITPRO-TOOL-CALLING-TRACKB-EXTERNAL-CONTROLLED-PROBES-1',
    ownerLanes: ['track_b_media_oss', 'tool_calling'],
    tools: ['mediainfo', 'exiftool', 'tesseract', 'imagemagick', 'graphicsmagick'],
  },
  {
    milestone: 'SOUND_MUSIC_AUDIO_CAPABILITY_EXPANSION',
    ownerLanes: ['sound_music_audio_sfx_soundsync'],
    tools: ['audioflux', 'demucs', 'rnnoise', 'rubber_band', 'signalsmith_stretch', 'whisper_cpp', 'faster_whisper'],
  },
  {
    milestone: 'AI_GRAPHICS_STATIC_MOTION_EXPANSION',
    ownerLanes: ['ai_graphics_static_motion_chart_model_tools'],
    tools: ['opencv', 'paddleocr', 'birefnet', 'sam2', 'real_esrgan', 'film', 'three_js', 'd3', 'echarts'],
  },
  {
    milestone: 'TRACK_A_NATIVE_CONTAINER_EXPANSION',
    ownerLanes: ['track_a_render_export_native_container', 'worker_runtime'],
    tools: ['ffmpeg', 'ffprobe', 'remotion', 'sharp'],
  },
]

function check(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function runCommand(command, args, options = {}) {
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
        maxBuffer: 60 * 1024 * 1024,
        ...options,
      }).trim(),
      error: null,
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

function readCommittedPackageLockSha256() {
  const env = { ...process.env }
  delete env.DEVELOPER_DIR

  return createHash('sha256')
    .update(execFileSync('git', ['show', 'HEAD:package-lock.json'], {
      cwd: process.cwd(),
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    }))
    .digest('hex')
}

function hashFile(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex')
}

function splitLines(value) {
  return value ? value.split('\n').filter(Boolean) : []
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort()
}

function refreshGateSummary() {
  const result = runCommand('node', ['scripts/validation/tool-calling-refresh-gate.mjs'])
  const parsed = parseJsonObjectFromOutput(result.output)

  return {
    ok: result.ok && parsed.ok === true,
    continueAllowed: parsed.continueAllowed === true,
    blockingReasons: parsed.blockingReasons ?? [],
    warnings: parsed.warnings ?? [],
    fetchSkipped: parsed.fetchSkipped === true,
    githubPrScanAvailable: parsed.githubPrScanAvailable === true,
    githubPrScanError: parsed.githubPrScanError ?? null,
    packageLockStaged: parsed.packageLockStaged === true,
  }
}

function normalizeFiles(files) {
  return (files ?? [])
    .map((file) => file?.path ?? '')
    .filter(Boolean)
}

function prInputFromGh(pr) {
  return {
    number: pr.number,
    title: pr.title,
    state: pr.state,
    isDraft: pr.isDraft,
    mergeable: pr.mergeable ?? null,
    headRefName: pr.headRefName,
    baseRefName: pr.baseRefName,
    updatedAt: pr.updatedAt,
    labels: pr.labels ?? [],
    body: pr.body ?? '',
    files: normalizeFiles(pr.files),
  }
}

function viewPr(number) {
  const result = runCommand('gh', ['pr', 'view', String(number), '--repo', REPO, '--json', PR_VIEW_JSON_FIELDS])
  if (!result.ok) return null

  return JSON.parse(result.output)
}

function scanGithubPrEvidence() {
  const ghVersion = runCommand('gh', ['--version'])
  if (!ghVersion.ok) {
    return {
      githubPrScanAvailable: false,
      githubPrScanError: ghVersion.error,
      openPrs: [],
      mergedRecentPrs: [],
    }
  }

  const openList = runCommand('gh', [
    'pr',
    'list',
    '--repo',
    REPO,
    '--state',
    'open',
    '--limit',
    '80',
    '--json',
    PR_JSON_FIELDS,
  ])
  if (!openList.ok) {
    return {
      githubPrScanAvailable: false,
      githubPrScanError: openList.output || openList.error,
      openPrs: [],
      mergedRecentPrs: [],
    }
  }

  const mergedList = runCommand('gh', [
    'pr',
    'list',
    '--repo',
    REPO,
    '--state',
    'merged',
    '--limit',
    '30',
    '--json',
    PR_JSON_FIELDS,
  ])

  const openPrs = JSON.parse(openList.output)
    .map((pr) => viewPr(pr.number) ?? pr)
    .map(prInputFromGh)
  const mergedRecentPrs = mergedList.ok
    ? JSON.parse(mergedList.output).map((pr) => viewPr(pr.number) ?? pr).map(prInputFromGh)
    : []

  return {
    githubPrScanAvailable: true,
    githubPrScanError: null,
    openPrs,
    mergedRecentPrs,
  }
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
    'server/tool-calling/owner-registry.ts',
    'server/tool-calling/owner-evidence-registry.ts',
    'server/tool-calling/unmerged-owner-registry.ts',
    'server/tool-calling/tool-execution-tables.ts',
    'server/tool-calling/worker-job-tables.ts',
  ]

  return forbiddenPaths.filter((filePath) => existsSync(filePath))
}

function changedOrStagedForbiddenFiles() {
  const changedFiles = splitLines(runCommand('git', ['diff', '--name-only']).output)
  const stagedFiles = splitLines(runCommand('git', ['diff', '--cached', '--name-only']).output)
  const allFiles = uniqueSorted([...changedFiles, ...stagedFiles])

  return allFiles.filter((filePath) => (
    filePath.startsWith('database/') ||
    filePath.startsWith('supabase/') ||
    /(^|\/)(migrations?|sql)(\/|$)/i.test(filePath) ||
    filePath.endsWith('.sql')
  ))
}

function knownMilestoneChecks(evidenceItems, githubPrScanAvailable) {
  return knownNextMilestones.map((target) => {
    const matchingEvidence = evidenceItems.filter((item) => (
      target.ownerLanes.includes(item.ownerLane) ||
      item.affectedTools.some((toolId) => target.tools.includes(toolId))
    ))
    const duplicateRisks = matchingEvidence.filter((item) => item.duplicateRisk !== 'none')

    return {
      milestone: target.milestone,
      scanStatus: githubPrScanAvailable ? 'scanned' : 'github_pr_scan_unavailable',
      matchingEvidenceCount: matchingEvidence.length,
      duplicateRiskCount: duplicateRisks.length,
      waitForMergeCount: duplicateRisks.filter((item) => item.recommendedAction === 'wait_for_merge').length,
      recommendedActions: uniqueSorted(matchingEvidence.map((item) => item.recommendedAction)),
      affectedPrNumbers: matchingEvidence.map((item) => item.prNumber).filter(Boolean),
    }
  })
}

function compactEvidence(items) {
  return items.map((item) => ({
    prNumber: item.prNumber,
    prTitle: item.prTitle,
    prState: item.prState,
    draft: item.draft,
    baseBranch: item.baseBranch,
    headBranch: item.headBranch,
    ownerLane: item.ownerLane,
    affectedTools: item.affectedTools,
    evidenceType: item.evidenceType,
    sourceTruthStatus: item.sourceTruthStatus,
    duplicateRisk: item.duplicateRisk,
    recommendedAction: item.recommendedAction,
    notes: item.notes,
  }))
}

const {
  collectUnmergedOwnerEvidence,
  summarizeUnmergedOwnerEvidence,
} = await tsImport('../../server/tool-calling/index.ts', import.meta.url)

const expectedPackageLockHash = readCommittedPackageLockSha256()
const refreshGate = refreshGateSummary()
check(refreshGate.ok, 'Refresh gate must run successfully.')
check(
  refreshGate.continueAllowed,
  `Refresh gate blocked unmerged owner evidence overlay: ${refreshGate.blockingReasons.join(', ')}`,
)

const githubPrScan = scanGithubPrEvidence()
const evidenceItems = collectUnmergedOwnerEvidence([
  ...githubPrScan.openPrs,
  ...githubPrScan.mergedRecentPrs,
])
const summary = summarizeUnmergedOwnerEvidence(evidenceItems)

const openItems = evidenceItems.filter((item) => item.prState === 'open')
const draftItems = evidenceItems.filter((item) => item.draft)
const mergedItems = evidenceItems.filter((item) => item.prState === 'merged')

check(
  openItems.every((item) => item.sourceTruthStatus === 'open_pr_candidate_evidence'),
  'Open PRs must be candidate evidence only.',
)
check(
  draftItems.every((item) => item.sourceTruthStatus !== 'merged_source_of_truth'),
  'Draft PRs must not be final source of truth.',
)
check(
  mergedItems.every((item) => item.sourceTruthStatus === 'merged_source_of_truth'),
  'Merged PRs must be separated as merged source evidence.',
)
check(
  summary.duplicateRiskFindings.every((finding) => finding.duplicateRisk !== 'none' && finding.reason.length > 0),
  'Duplicate risks must be explicit and include reasons.',
)

const packageLockHash = hashFile('package-lock.json')
check(packageLockHash === expectedPackageLockHash, 'package-lock.json hash changed.')
const stagedFiles = splitLines(runCommand('git', ['diff', '--cached', '--name-only']).output)
const packageLockStaged = stagedFiles.includes('package-lock.json')
check(!packageLockStaged, 'package-lock.json must not be staged.')
const forbiddenChangedFiles = changedOrStagedForbiddenFiles()
check(forbiddenChangedFiles.length === 0, `Supabase, SQL, or migration files must not be changed: ${forbiddenChangedFiles.join(', ')}`)
const duplicateSystems = duplicateSystemPaths()
check(duplicateSystems.length === 0, `Duplicate system files must not be created: ${duplicateSystems.join(', ')}`)

const milestoneRiskChecks = knownMilestoneChecks(evidenceItems, githubPrScan.githubPrScanAvailable)

const output = {
  ok: true,
  refreshGate,
  githubPrScanAvailable: githubPrScan.githubPrScanAvailable,
  githubPrScanError: githubPrScan.githubPrScanError,
  openPrEvidenceCount: summary.openPrEvidenceCount,
  mergedRecentEvidenceCount: summary.mergedRecentEvidenceCount,
  duplicateRiskCount: summary.duplicateRiskCount,
  waitForMergeCount: summary.waitForMergeCount,
  ownerLanesRepresented: summary.ownerLanesRepresented,
  recommendedActions: summary.recommendedActions,
  evidenceItems: compactEvidence(summary.evidenceItems),
  duplicateRiskFindings: summary.duplicateRiskFindings,
  knownNextMilestoneRiskChecks: milestoneRiskChecks,
  candidateEvidenceOnly: true,
  openPrsAreFinalSourceOfTruth: false,
  draftPrsAreFinalSourceOfTruth: false,
  mergedPrsSeparatedFromOpenPrs: true,
  packageLockHash,
  packageLockStaged,
  forbiddenChangedFiles,
  executesTools: false,
  mediaProcessingPerformed: false,
  workerExecutionPerformed: false,
  providerCallsPerformed: false,
  supabaseMutationPerformed: false,
  sqlExecuted: false,
  migrationsCreated: false,
  signedUrlsCreated: false,
  packageLockMutated: false,
  betaProductionUnlocked: false,
  duplicateSystemsCreated: false,
  duplicateSystems,
  decisionTarget: 'reeditpro_tool_calling_unmerged_owner_evidence_overlay_1_ready_for_safe_next_milestone_selection',
}

console.log(JSON.stringify(output, null, 2))
