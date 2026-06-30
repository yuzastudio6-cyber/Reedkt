#!/usr/bin/env node
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-RUNTIME-EXECUTION-IMPLEMENTATION-1'
const confirmEnv = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GUARDED_WORKER_RUNTIME_EXECUTION'
const integrationBase = '620c003b92ae6d219652206260c441bbdd264bb9'
const imageTag = 'reeditpro-tracka-native-container-render-tools-build-proof-3:2026-06-22T01-24-10-232Z-4e862aa8'
const outputRoot = '/tmp/reeditpro-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-execution-implementation-1'
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join(outputRoot, runId)
const fixtureDir = path.join(outputDir, 'fixture')
const runtimeOutputDir = path.join(outputDir, 'runtime-output')

const allowedTemplates = [
  'gst_fakesrc_fakesink_no_media_healthcheck_v1',
  'gst_controlled_generated_fixture_pipeline_v1',
  'mkvmerge_generated_subtitle_only_package_v1',
  'mkvmerge_identify_generated_subtitle_only_v1',
]

const noScopeSafety = {
  routeExecution: false,
  workerDispatch: false,
  workerExecution: false,
  ffmpegFfprobeExecution: false,
  remotionExecution: false,
  privateMediaProcessing: false,
  userMediaProcessing: false,
  supabaseMutation: false,
  sqlExecution: false,
  secretPayloadAccess: false,
  serviceRoleSecretPayloadAccess: false,
  providerCall: false,
  modelCall: false,
  signedUrlCreation: false,
  publicArtifactCreation: false,
  creditMutation: false,
  stripePaymentProcessing: false,
  deployment: false,
  dockerPush: false,
  dockerDeployment: false,
  externalBetaExpansion: false,
  paidProductionUnlock: false,
  productionUnlock: false,
  finalRenderExport: false,
  dependencyMutation: false,
  packageLockMutation: false,
  dockerfileInstallSourceChange: false,
  requirementsInstallSourceChange: false,
  broadServiceRoleHandler: false,
}

const executionSafety = {
  dockerExecution: 'completed_local_image_only_network_disabled_no_push_no_deploy',
  gstreamerExecution: 'completed_controlled_generated_fixture_only',
  mkvtoolnixExecution: 'completed_controlled_generated_fixture_only',
  mediaProcessing: 'controlled_generated_fixture_only',
}

fs.mkdirSync(fixtureDir, { recursive: true })
fs.mkdirSync(runtimeOutputDir, { recursive: true })

function sha256Bytes(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
}

function artifact(file) {
  return {
    fileName: path.basename(file),
    relativePath: path.relative(outputDir, file),
    bytes: fs.statSync(file).size,
    sha256: sha256File(file),
  }
}

function bounded(value) {
  return String(value ?? '').slice(0, 2000)
}

function runDockerTemplate(templateId, dockerArgs, timeoutMs = 45000) {
  if (!allowedTemplates.includes(templateId)) {
    return {
      templateId,
      ok: false,
      blocker: 'blocked_unapproved_command_template',
      exitStatus: null,
      stdoutSnippet: '',
      stderrSnippet: 'unapproved command template',
    }
  }

  const result = spawnSync('docker', dockerArgs, {
    encoding: 'utf8',
    timeout: timeoutMs,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  return {
    templateId,
    ok: result.status === 0,
    blocker: result.status === 0 ? null : 'blocked_guarded_runtime_command_failed',
    exitStatus: result.status,
    signal: result.signal ?? null,
    stdoutSnippet: bounded(result.stdout),
    stderrSnippet: bounded(result.stderr),
    timedOut: result.error?.code === 'ETIMEDOUT',
    mediaInput: templateId.startsWith('mkvmerge_') ? 'generated_srt_fixture_only' : false,
    mediaOutput: templateId === 'mkvmerge_generated_subtitle_only_package_v1'
      ? 'generated_subtitle_only_mkv_fixture'
      : false,
  }
}

function baseReport(overrides) {
  return {
    packet,
    integrationBase,
    runId,
    outputDir,
    imageTag,
    confirmationGate: {
      env: `${confirmEnv}=true`,
      observed: process.env[confirmEnv] === 'true' ? 'present_true' : 'absent_or_not_true',
    },
    sourceChain: {
      guardedRuntimeDryRunMerge: integrationBase,
      guardedRuntimeDryRunDecision:
        'completed_gstreamer_mkvtoolnix_guarded_worker_runtime_dry_run_envelope_validation',
      guardedRuntimeExecutionPlanMerge: '3e85e9296de45d4ac0283b3981a03db8178ff625',
      guardedWorkerSkeletonMerge: '3bc87ce85f44867662fc9fab1b936843480c255c',
      guardedWorkerEnqueueMerge: '5bf9f05c3719503f20d66638d9650f87f96fa0bd',
      guardedWorkerRouteMerge: 'd5903b517f56ad117774c48488b932bd368f0941',
      excludedRemotionPr: '#577 open_draft_blocked_excluded',
    },
    safety: {
      ...noScopeSafety,
      ...executionSafety,
    },
    productReadyEndToEndLocalOssTools: 0,
    packageLock: 'unchanged',
    generatedArtifactsCommitted: 'none',
    ...overrides,
  }
}

function finish(report, exitCode) {
  const reportPath = path.join(outputDir, 'gstreamer-mkvtoolnix-guarded-worker-runtime-execution-implementation-1-report.json')
  writeJson(reportPath, report)

  const manifestPath = path.join(outputDir, 'gstreamer-mkvtoolnix-guarded-worker-runtime-execution-implementation-1-manifest.json')
  const files = [
    reportPath,
    report.privateInputManifestPath,
    report.outputManifestPath,
    report.qaReportPath,
    report.fixturePath,
    report.generatedMkvPath,
  ].filter(Boolean)
  const manifest = {
    packet,
    runId,
    outputDir,
    decision: report.decision,
    execution: report.execution,
    artifacts: files.map((file) => artifact(file)),
  }
  writeJson(manifestPath, manifest)
  manifest.artifacts.push(artifact(manifestPath))
  writeJson(manifestPath, manifest)

  const summary = {
    packet,
    decision: report.decision,
    execution: report.execution,
    runId,
    outputDir,
    report: reportPath,
    manifest: manifestPath,
    artifacts: manifest.artifacts,
  }
  console.log(JSON.stringify(summary, null, 2))
  process.exit(exitCode)
}

if (process.env[confirmEnv] !== 'true') {
  finish(
    baseReport({
      decision: 'blocked_missing_runtime_execution_confirmation_gate',
      execution: 'blocked_missing_confirmation_gate_no_docker_or_tool_execution',
      blocker: 'blocked_missing_runtime_execution_confirmation_gate',
      runtimeExecution: {
        status: 'not_run_confirmation_gate_absent',
        dockerExecution: 'not_run_confirmation_gate_absent',
        gstreamerExecution: 'not_run_confirmation_gate_absent',
        mkvtoolnixExecution: 'not_run_confirmation_gate_absent',
      },
      nextMilestone: packet,
    }),
    2,
  )
}

const imageInspect = spawnSync('docker', ['image', 'inspect', imageTag], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
})
if (imageInspect.status !== 0) {
  finish(
    baseReport({
      decision: 'blocked_render_worker_image_unavailable',
      execution: 'blocked_before_guarded_runtime_execution_no_tool_execution',
      blocker: 'blocked_render_worker_image_unavailable',
      dockerImageInspect: {
        exitStatus: imageInspect.status,
        stdoutSnippet: bounded(imageInspect.stdout),
        stderrSnippet: bounded(imageInspect.stderr),
      },
      nextMilestone: packet,
    }),
    1,
  )
}

const fixturePath = path.join(fixtureDir, 'synthetic.srt')
fs.writeFileSync(
  fixturePath,
  [
    '1',
    '00:00:00,000 --> 00:00:01,000',
    'ReEditPro generated guarded runtime fixture.',
    '',
    '2',
    '00:00:01,000 --> 00:00:02,000',
    'GStreamer and MKVToolNix execution stays bounded.',
    '',
  ].join('\n'),
)

const generatedMkvPath = path.join(runtimeOutputDir, 'synthetic-subtitle-only.mkv')
const volumeArg = `${outputDir}:/work`
const dockerBase = ['run', '--rm', '--network', 'none', '-v', volumeArg, imageTag]

const commandResults = [
  runDockerTemplate('gst_fakesrc_fakesink_no_media_healthcheck_v1', [
    ...dockerBase,
    'gst-launch-1.0',
    '-q',
    'fakesrc',
    'num-buffers=3',
    '!',
    'fakesink',
  ]),
  runDockerTemplate('gst_controlled_generated_fixture_pipeline_v1', [
    ...dockerBase,
    'gst-launch-1.0',
    '-q',
    'videotestsrc',
    'num-buffers=3',
    '!',
    'fakesink',
  ]),
  runDockerTemplate('mkvmerge_generated_subtitle_only_package_v1', [
    ...dockerBase,
    'mkvmerge',
    '-o',
    '/work/runtime-output/synthetic-subtitle-only.mkv',
    '/work/fixture/synthetic.srt',
  ]),
]

const identifyResult = runDockerTemplate('mkvmerge_identify_generated_subtitle_only_v1', [
  ...dockerBase,
  'mkvmerge',
  '--identify',
  '/work/runtime-output/synthetic-subtitle-only.mkv',
])
commandResults.push(identifyResult)

const blockers = commandResults.filter((result) => !result.ok).map((result) => result.blocker)
if (!fs.existsSync(generatedMkvPath)) blockers.push('blocked_output_manifest_missing')

const privateInputManifest = {
  manifestId: 'private-input-manifest-gstreamer-mkvtoolnix-guarded-runtime-execution-implementation-1',
  sourceClass: 'controlled_generated_fixture_only',
  items: [
    {
      fileName: path.basename(fixturePath),
      relativePath: path.relative(outputDir, fixturePath),
      bytes: fs.statSync(fixturePath).size,
      sha256: sha256File(fixturePath),
      mediaInput: 'generated_srt_fixture_only',
    },
  ],
  rawCommandStringsAllowed: false,
  publicUrlSourceOfTruth: false,
  signedUrlSourceOfTruth: false,
  arbitraryPrivateMedia: false,
  generatedAt: new Date().toISOString(),
}
privateInputManifest.sha256 = sha256Bytes(JSON.stringify(privateInputManifest))
const privateInputManifestPath = path.join(outputDir, 'private-input-manifest.json')
writeJson(privateInputManifestPath, privateInputManifest)

const outputManifest = {
  manifestId: 'output-manifest-gstreamer-mkvtoolnix-guarded-runtime-execution-implementation-1',
  status: blockers.length === 0 ? 'completed_controlled_generated_fixture_output_manifest' : 'blocked_output_manifest',
  items: fs.existsSync(generatedMkvPath)
    ? [
      {
        fileName: path.basename(generatedMkvPath),
        relativePath: path.relative(outputDir, generatedMkvPath),
        bytes: fs.statSync(generatedMkvPath).size,
        sha256: sha256File(generatedMkvPath),
        source: 'generated_srt_fixture_only',
        publicArtifact: false,
        signedUrl: false,
      },
    ]
    : [],
  publicArtifacts: false,
  signedUrls: false,
  finalRenderExport: false,
  generatedAt: new Date().toISOString(),
}
outputManifest.sha256 = sha256Bytes(JSON.stringify(outputManifest))
const outputManifestPath = path.join(outputDir, 'output-manifest.json')
writeJson(outputManifestPath, outputManifest)

const qaReport = {
  reportId: 'qa-report-gstreamer-mkvtoolnix-guarded-runtime-execution-implementation-1',
  status: blockers.length === 0 ? 'passed_controlled_generated_fixture_runtime_execution' : 'blocked_runtime_execution',
  checks: [
    'confirmation_gate_present',
    'local_repo_owned_image_present',
    'docker_network_disabled',
    'allowed_command_templates_only',
    'generated_srt_fixture_only',
    'gstreamer_fakesrc_fakesink_passed',
    'gstreamer_videotestsrc_fakesink_passed',
    'mkvmerge_generated_subtitle_only_package_passed',
    'mkvmerge_identify_generated_subtitle_only_passed',
    'no_private_or_user_media',
    'no_public_or_signed_artifacts',
    'no_ffmpeg_ffprobe',
    'no_supabase_sql',
  ],
  blockers,
  generatedAt: new Date().toISOString(),
}
qaReport.sha256 = sha256Bytes(JSON.stringify(qaReport))
const qaReportPath = path.join(outputDir, 'qa-report.json')
writeJson(qaReportPath, qaReport)

if (blockers.length > 0) {
  finish(
    baseReport({
      decision: 'blocked_guarded_worker_runtime_execution_failed',
      execution: 'blocked_guarded_runtime_execution_controlled_generated_fixture',
      blocker: blockers[0],
      commandResults,
      fixturePath,
      generatedMkvPath: fs.existsSync(generatedMkvPath) ? generatedMkvPath : undefined,
      privateInputManifestPath,
      outputManifestPath,
      qaReportPath,
      nextMilestone: packet,
    }),
    1,
  )
}

finish(
  baseReport({
    decision: 'completed_gstreamer_mkvtoolnix_guarded_worker_runtime_execution_controlled_generated_fixture',
    execution: 'completed_confirmation_gated_local_render_worker_runtime_execution_generated_fixture_only',
    commandResults,
    fixturePath,
    generatedMkvPath,
    privateInputManifestPath,
    outputManifestPath,
    qaReportPath,
    runtimeExecution: {
      status: 'completed_controlled_generated_fixture_runtime_execution',
      dockerImage: imageTag,
      dockerNetwork: 'none',
      routeExecution: 'not_run_runtime_runner_only',
      workerDispatch: 'not_run_runtime_runner_only',
      workerExecution: 'not_run_runtime_runner_only',
      gstreamerExecution: 'completed_controlled_generated_fixture_only',
      mkvtoolnixExecution: 'completed_controlled_generated_fixture_only',
      mediaProcessing: 'controlled_generated_fixture_only',
      privateMediaProcessing: false,
      userMediaProcessing: false,
    },
    readiness: {
      gstreamer: 'ready_for_external_agent_guarded_tool_execution_bridge',
      mkvtoolnix: 'ready_for_external_agent_guarded_tool_execution_bridge',
    },
    nextMilestone: 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-EXECUTION-BRIDGE-1',
  }),
  0,
)
