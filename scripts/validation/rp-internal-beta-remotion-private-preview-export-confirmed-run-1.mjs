#!/usr/bin/env node
import { createHash, randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { basename, join, relative } from 'node:path'

const packet = 'RP-INTERNAL-BETA-REMOTION-PRIVATE-PREVIEW-EXPORT-CONFIRMED-RUN-1'
const confirmationVar = 'REEDITPRO_CONFIRM_RP_INTERNAL_BETA_REMOTION_PRIVATE_PREVIEW_EXPORT'
const rootDir = '/tmp/reeditpro-rp-internal-beta-remotion-private-preview-export-confirmed-run-1'

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`)
}

function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

function collectChecksums(path, base = path) {
  if (!existsSync(path)) return []
  const entries = []
  for (const name of readdirSync(path).sort()) {
    const child = join(path, name)
    const stats = statSync(child)
    if (stats.isDirectory()) {
      entries.push(...collectChecksums(child, base))
    } else if (stats.isFile()) {
      entries.push({
        path: relative(base, child),
        bytes: stats.size,
        sha256: sha256File(child),
      })
    }
  }
  return entries
}

function makeRunId() {
  return `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`
}

function failClosed(blocker, message, extra = {}) {
  const runId = makeRunId()
  const runDir = join(rootDir, runId)
  mkdirSync(runDir, { recursive: true })
  const report = {
    packet,
    runId,
    decision: blocker,
    execution: blocker,
    status: 'blocked',
    message,
    runDirectory: runDir,
    confirmationRequired: `${confirmationVar}=true`,
    remotionExecution: false,
    generatedLocalFixtureOnly: true,
    privateMediaProcessing: false,
    userMediaProcessing: false,
    supabaseMutation: false,
    sqlExecution: false,
    workerExecution: false,
    routeExecution: false,
    storageObjectCreation: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    ...extra,
  }
  writeJson(join(runDir, 'blocked-report.json'), report)
  console.log(JSON.stringify(report, null, 2))
  process.exit(2)
}

if (process.env[confirmationVar] !== 'true') {
  failClosed(
    'blocked_pending_remotion_private_preview_export_confirmation',
    'Confirmation environment variable was not set to true.',
  )
}

const runId = makeRunId()
const runDir = join(rootDir, runId)
const sourceDir = join(runDir, 'source')
const bundleDir = join(runDir, 'bundle')
const outputDir = join(runDir, 'output')
mkdirSync(sourceDir, { recursive: true })
mkdirSync(bundleDir, { recursive: true })
mkdirSync(outputDir, { recursive: true })

const entryPoint = join(sourceDir, 'index.jsx')
const outputLocation = join(outputDir, 'reeditpro-internal-beta-generated-local-preview.mp4')

writeFileSync(entryPoint, `import React from 'react';
import { AbsoluteFill, Composition, registerRoot, useCurrentFrame } from 'remotion';

const GeneratedLocalPreview = () => {
  const frame = useCurrentFrame();
  const opacity = Math.min(1, 0.2 + frame / 18);
  return React.createElement(
    AbsoluteFill,
    {
      style: {
        alignItems: 'center',
        backgroundColor: '#f7f5ef',
        color: '#17202a',
        display: 'flex',
        fontFamily: 'Arial, sans-serif',
        justifyContent: 'center',
      },
    },
    React.createElement('div', {
      style: {
        border: '2px solid #17202a',
        borderRadius: 12,
        padding: 24,
        opacity,
        textAlign: 'center',
      },
    },
      React.createElement('div', { style: { fontSize: 28, fontWeight: 700 } }, 'ReEditPro Internal Beta'),
      React.createElement('div', { style: { fontSize: 16, marginTop: 10 } }, 'Generated local private preview fixture'),
      React.createElement('div', { style: { fontSize: 13, marginTop: 14 } }, 'No user media. No storage. No public artifact.')
    )
  );
};

const Root = () => React.createElement(Composition, {
  id: 'ReeditProInternalBetaGeneratedLocalPreview',
  component: GeneratedLocalPreview,
  durationInFrames: 30,
  fps: 30,
  width: 320,
  height: 180,
});

registerRoot(Root);
`)

try {
  const bundlerModule = await import('@remotion/bundler')
  const rendererModule = await import('@remotion/renderer')

  if (typeof bundlerModule.bundle !== 'function') {
    throw new Error('Remotion bundler package import missing bundle')
  }
  if (typeof rendererModule.selectComposition !== 'function') {
    throw new Error('Remotion renderer package import missing selectComposition')
  }
  if (typeof rendererModule.renderMedia !== 'function') {
    throw new Error('Remotion renderer package import missing renderMedia')
  }

  const serveUrl = await bundlerModule.bundle({
    entryPoint,
    outDir: bundleDir,
    rootDir: sourceDir,
    enableCaching: false,
  })

  const composition = await rendererModule.selectComposition({
    serveUrl,
    id: 'ReeditProInternalBetaGeneratedLocalPreview',
    inputProps: {},
    timeoutInMilliseconds: 120000,
    logLevel: 'warn',
  })

  await rendererModule.renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    outputLocation,
    inputProps: {},
    overwrite: true,
    muted: true,
    enforceAudioTrack: false,
    concurrency: 1,
    timeoutInMilliseconds: 120000,
    logLevel: 'warn',
    pixelFormat: 'yuv420p',
    chromiumOptions: {
      disableWebSecurity: true,
      ignoreCertificateErrors: true,
    },
  })

  const checksums = [
    ...collectChecksums(sourceDir, runDir),
    ...collectChecksums(bundleDir, runDir),
    ...collectChecksums(outputDir, runDir),
  ]
  const outputStats = statSync(outputLocation)
  const outputChecksum = sha256File(outputLocation)
  const manifest = {
    packet,
    runId,
    decision: 'completed_generated_local_remotion_private_preview_export_confirmed_run',
    execution: 'completed_confirmation_gated_generated_local_remotion_render',
    status: 'passed',
    runDirectory: runDir,
    sourceDirectory: sourceDir,
    bundleDirectory: bundleDir,
    outputDirectory: outputDir,
    entryPoint,
    serveUrl,
    compositionId: composition.id,
    outputFile: basename(outputLocation),
    outputBytes: outputStats.size,
    outputSha256: outputChecksum,
    checksums,
    generatedLocalFixtureOnly: true,
    privateMediaProcessing: false,
    userMediaProcessing: false,
    storageObjectCreation: false,
    storageObjectRead: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    supabaseMutation: false,
    sqlExecution: false,
    workerExecution: false,
    routeExecution: false,
    providerModelCall: false,
    remotionExecution: true,
    remotionRendererMediaEncoding: true,
    directFfmpegCommandExecutionByRunner: false,
    ffprobeExecution: false,
    internalBetaUnlock: false,
    externalBetaUnlock: false,
    productionUnlock: false,
  }

  const qa = {
    packet,
    runId,
    status: 'passed_generated_local_private_preview_fixture',
    generatedLocalPreviewArtifact: {
      fileName: basename(outputLocation),
      bytes: outputStats.size,
      sha256: outputChecksum,
    },
    safety: {
      noUserMedia: true,
      noPrivateMediaInput: true,
      noSupabaseMutation: true,
      noSqlExecution: true,
      noStorageObjectCreation: true,
      noSignedUrlCreation: true,
      noPublicArtifactCreation: true,
      noWorkerExecution: true,
      noRouteExecution: true,
      noProviderModelCall: true,
      noDirectFfmpegCommandExecutionByRunner: true,
      noFfprobeExecution: true,
      noBetaProductionUnlock: true,
    },
  }

  writeJson(join(runDir, 'manifest.json'), manifest)
  writeJson(join(runDir, 'qa-report.json'), qa)

  console.log(JSON.stringify({
    status: qa.status,
    runId,
    artifactRoot: runDir,
    outputFile: basename(outputLocation),
    outputBytes: outputStats.size,
    outputSha256: outputChecksum,
    manifest: 'manifest.json',
    qaReport: 'qa-report.json',
  }, null, 2))
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  const blocker = /browser|chrome|chromium|executable|spawn/i.test(message)
    ? 'blocked_remotion_browser_runtime_unavailable'
    : 'blocked_remotion_private_preview_export_confirmed_run_failed'
  const blockedReport = {
    packet,
    runId,
    decision: blocker,
    execution: blocker,
    status: 'blocked',
    runDirectory: runDir,
    message,
    generatedLocalFixtureOnly: true,
    privateMediaProcessing: false,
    userMediaProcessing: false,
    storageObjectCreation: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    supabaseMutation: false,
    sqlExecution: false,
    workerExecution: false,
    routeExecution: false,
    providerModelCall: false,
    remotionExecution: false,
    internalBetaUnlock: false,
  }
  writeJson(join(runDir, 'blocked-report.json'), blockedReport)
  console.log(JSON.stringify(blockedReport, null, 2))
  process.exit(1)
}
