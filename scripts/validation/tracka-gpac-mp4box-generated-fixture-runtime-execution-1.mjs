#!/usr/bin/env node
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const packet = 'TRACKA-GPAC-MP4BOX-GENERATED-FIXTURE-RUNTIME-EXECUTION-1'
const confirmEnv = 'REEDITPRO_CONFIRM_TRACKA_GPAC_MP4BOX_GENERATED_FIXTURE_RUNTIME_EXECUTION'
const imageTag = 'reeditpro-tracka-gpac-mp4box-controlled-synthetic-media-command-proof-1:20260625T1158Z-1f33b4a'
const outputRoot = '/tmp/reeditpro-tracka-gpac-mp4box-generated-fixture-runtime-execution-1'
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join(outputRoot, runId)
const fixtureDir = path.join(outputDir, 'fixture')
const runtimeOutputDir = path.join(outputDir, 'runtime-output')
const generatedMp4Path = path.join(runtimeOutputDir, 'generated-subtitle-only.mp4')
const allowedTemplates = [
  'mp4box_add_generated_subtitle_only_v1',
  'mp4box_info_generated_subtitle_only_v1',
]

const blockedSafety = {
  routeExecution: false,
  realWorkerDispatch: false,
  workerProcessStarted: false,
  workerExecution: false,
  workerLeaseClaim: false,
  persistentJobQueueWrite: false,
  privateMediaProcessing: false,
  userMediaProcessing: false,
  ffmpegFfprobeExecution: false,
  dockerPushDeploy: false,
  remotionExecution: false,
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

function sha256Text(value) {
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

function baseReport(overrides = {}) {
  return {
    packet,
    runId,
    outputDir,
    imageTag,
    confirmationGate: {
      env: `${confirmEnv}=true`,
      observed: process.env[confirmEnv] === 'true' ? 'present_true' : 'absent_or_not_true',
    },
    sourceChain: {
      officialAptInstallSourceQa:
        'tracka_gpac_mp4box_official_apt_install_source_qa_passed_ready_for_controlled_runtime_proof',
      controlledRuntimeProof:
        'tracka_gpac_mp4box_controlled_runtime_proof_passed_ready_for_controlled_synthetic_media_command_proof',
      controlledSyntheticMediaCommandProof:
        'tracka_gpac_mp4box_controlled_synthetic_media_command_proof_passed_ready_for_qa_review',
      controlledSyntheticMediaCommandQa:
        'tracka_gpac_mp4box_controlled_synthetic_media_command_qa_passed_ready_for_worker_contract_review',
      routeSourceHttpProofMerge: '58696897c13109a504bcdd8269c14c04a8cbd1d4',
      excludedRemotionPr: '#577 open_draft_blocked_excluded',
    },
    safety: {
      ...blockedSafety,
      dockerExecution: false,
      gpacMp4boxExecution: false,
      mediaProcessing: false,
    },
    productReadyEndToEndLocalOssTools: 0,
    packageLock: 'unchanged',
    generatedArtifactsCommitted: 'none',
    ...overrides,
  }
}

function finish(report, exitCode) {
  const reportPath = path.join(outputDir, 'gpac-mp4box-generated-fixture-runtime-execution-1-report.json')
  writeJson(reportPath, report)

  const files = [
    reportPath,
    report.privateInputManifestPath,
    report.outputManifestPath,
    report.qaReportPath,
    report.fixturePath,
    report.generatedMp4Path,
  ].filter(Boolean)
  const manifestPath = path.join(outputDir, 'gpac-mp4box-generated-fixture-runtime-execution-1-manifest.json')
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

  console.log(JSON.stringify({
    packet,
    decision: report.decision,
    execution: report.execution,
    runId,
    outputDir,
    report: reportPath,
    manifest: manifestPath,
    artifacts: manifest.artifacts,
  }, null, 2))
  process.exit(exitCode)
}

function runDockerTemplate(templateId, dockerArgs, timeoutMs = 45000) {
  if (!allowedTemplates.includes(templateId)) {
    return {
      templateId,
      ok: false,
      blocker: 'blocked_unapproved_gpac_mp4box_command_template',
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
    blocker: result.status === 0 ? null : 'blocked_gpac_mp4box_generated_fixture_command_failed',
    exitStatus: result.status,
    signal: result.signal ?? null,
    stdoutSnippet: bounded(result.stdout),
    stderrSnippet: bounded(result.stderr),
    timedOut: result.error?.code === 'ETIMEDOUT',
    mediaInput: 'generated_srt_fixture_only',
    mediaOutput: templateId === 'mp4box_add_generated_subtitle_only_v1'
      ? 'generated_subtitle_only_mp4_fixture'
      : false,
  }
}

fs.mkdirSync(fixtureDir, { recursive: true })
fs.mkdirSync(runtimeOutputDir, { recursive: true })

if (process.env[confirmEnv] !== 'true') {
  finish(
    baseReport({
      decision: 'blocked_missing_gpac_mp4box_generated_fixture_runtime_execution_confirmation',
      execution: 'blocked_confirmation_absent_no_docker_or_tool_execution',
      blocker: 'blocked_missing_gpac_mp4box_generated_fixture_runtime_execution_confirmation',
      runtimeExecution: {
        status: 'not_run_confirmation_gate_absent',
        dockerExecution: 'not_run_confirmation_gate_absent',
        gpacMp4boxExecution: 'not_run_confirmation_gate_absent',
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
      decision: 'blocked_gpac_mp4box_runtime_image_unavailable',
      execution: 'blocked_before_gpac_mp4box_generated_fixture_runtime_execution_no_tool_execution',
      blocker: 'blocked_gpac_mp4box_runtime_image_unavailable',
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

const fixturePath = path.join(fixtureDir, 'generated-synthetic-subtitles.srt')
fs.writeFileSync(
  fixturePath,
  [
    '1',
    '00:00:00,000 --> 00:00:01,000',
    'ReEditPro generated GPAC MP4Box runtime fixture.',
    '',
    '2',
    '00:00:01,000 --> 00:00:02,000',
    'External-agent execution stays bounded to generated evidence.',
    '',
  ].join('\n'),
)

const volumeArg = `${outputDir}:/work`
const dockerBase = ['run', '--rm', '--network', 'none', '-v', volumeArg, imageTag]
const commandResults = [
  runDockerTemplate('mp4box_add_generated_subtitle_only_v1', [
    ...dockerBase,
    'MP4Box',
    '-add',
    '/work/fixture/generated-synthetic-subtitles.srt:hdlr=sbtl',
    '-new',
    '/work/runtime-output/generated-subtitle-only.mp4',
  ]),
]
commandResults.push(
  runDockerTemplate('mp4box_info_generated_subtitle_only_v1', [
    ...dockerBase,
    'MP4Box',
    '-info',
    '/work/runtime-output/generated-subtitle-only.mp4',
  ]),
)

const blockers = commandResults.filter((result) => !result.ok).map((result) => result.blocker)
if (!fs.existsSync(generatedMp4Path)) blockers.push('blocked_gpac_mp4box_output_manifest_missing')

const privateInputManifest = {
  manifestId: 'private-input-manifest-gpac-mp4box-generated-fixture-runtime-execution-1',
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
privateInputManifest.sha256 = sha256Text(JSON.stringify(privateInputManifest))
const privateInputManifestPath = path.join(outputDir, 'private-input-manifest.json')
writeJson(privateInputManifestPath, privateInputManifest)

const outputManifest = {
  manifestId: 'output-manifest-gpac-mp4box-generated-fixture-runtime-execution-1',
  status: blockers.length === 0 ? 'completed_controlled_generated_fixture_output_manifest' : 'blocked_output_manifest',
  items: fs.existsSync(generatedMp4Path)
    ? [
      {
        fileName: path.basename(generatedMp4Path),
        relativePath: path.relative(outputDir, generatedMp4Path),
        bytes: fs.statSync(generatedMp4Path).size,
        sha256: sha256File(generatedMp4Path),
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
outputManifest.sha256 = sha256Text(JSON.stringify(outputManifest))
const outputManifestPath = path.join(outputDir, 'output-manifest.json')
writeJson(outputManifestPath, outputManifest)

const qaReport = {
  reportId: 'qa-report-gpac-mp4box-generated-fixture-runtime-execution-1',
  status: blockers.length === 0 ? 'passed_controlled_generated_fixture_runtime_execution' : 'blocked_runtime_execution',
  checks: [
    'confirmation_gate_present',
    'local_repo_owned_image_present',
    'docker_network_disabled',
    'allowed_command_templates_only',
    'generated_srt_fixture_only',
    'mp4box_add_generated_subtitle_only_passed',
    'mp4box_info_generated_subtitle_only_passed',
    'no_private_or_user_media',
    'no_public_or_signed_artifacts',
    'no_ffmpeg_ffprobe',
    'no_supabase_sql',
  ],
  blockers,
  generatedAt: new Date().toISOString(),
}
qaReport.sha256 = sha256Text(JSON.stringify(qaReport))
const qaReportPath = path.join(outputDir, 'qa-report.json')
writeJson(qaReportPath, qaReport)

if (blockers.length > 0) {
  finish(
    baseReport({
      decision: 'blocked_gpac_mp4box_generated_fixture_runtime_execution_failed',
      execution: 'blocked_gpac_mp4box_generated_fixture_runtime_execution',
      blocker: blockers[0],
      commandResults,
      fixturePath,
      generatedMp4Path: fs.existsSync(generatedMp4Path) ? generatedMp4Path : undefined,
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
    decision: 'completed_gpac_mp4box_generated_fixture_runtime_execution',
    execution: 'completed_confirmation_gated_local_render_worker_runtime_execution_generated_fixture_only',
    commandResults,
    fixturePath,
    generatedMp4Path,
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
      gpacMp4boxExecution: 'completed_controlled_generated_fixture_only',
      mediaProcessing: 'controlled_generated_fixture_only',
      privateMediaProcessing: false,
      userMediaProcessing: false,
    },
    safety: {
      ...blockedSafety,
      dockerExecution: 'completed_local_image_only_network_disabled_no_push_no_deploy',
      gpacMp4boxExecution: 'completed_controlled_generated_fixture_only',
      mediaProcessing: 'controlled_generated_fixture_only',
    },
    readiness: {
      gpacMp4box: 'ready_for_external_agent_guarded_tool_execution_bridge',
    },
    nextMilestone: 'TRACKA-GPAC-MP4BOX-EXECUTION-READY-ROUTE-WORKER-BRIDGE-QA-ROLLUP-1',
  }),
  0,
)
