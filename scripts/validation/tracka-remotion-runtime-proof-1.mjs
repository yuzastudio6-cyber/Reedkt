import { createHash, randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { basename, join, relative } from 'node:path'

const confirmationVar = 'REEDITPRO_CONFIRM_TRACKA_REMOTION_RUNTIME_PROOF'
const rootDir = '/tmp/reeditpro-tracka-remotion-runtime-proof-1'

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

if (process.env[confirmationVar] !== 'true') {
  console.log(JSON.stringify({
    decision: 'blocked_pending_remotion_runtime_proof_confirmation',
    execution: 'blocked_pending_remotion_runtime_proof_confirmation',
    runtimeExecutionPerformed: false,
    generatedFixture: 'not_run_confirmation_absent',
    artifacts: [],
    checksums: [],
    requiredConfirmation: `${confirmationVar}=true`,
  }, null, 2))
  process.exit(2)
}

const runId = `${Date.now()}-${randomUUID()}`
const runDir = join(rootDir, runId)
const sourceDir = join(runDir, 'source')
const bundleDir = join(runDir, 'bundle')

mkdirSync(sourceDir, { recursive: true })
mkdirSync(bundleDir, { recursive: true })

const entryPoint = join(sourceDir, 'index.jsx')
writeFileSync(entryPoint, `import React from 'react';
import { AbsoluteFill, Composition, registerRoot } from 'remotion';

const TrackARemotionRuntimeProof = () => React.createElement(
  AbsoluteFill,
  {
    style: {
      alignItems: 'center',
      backgroundColor: '#ffffff',
      color: '#111111',
      display: 'flex',
      fontFamily: 'Arial, sans-serif',
      fontSize: 24,
      justifyContent: 'center',
    },
  },
  React.createElement('div', null, 'Track A Remotion runtime proof')
);

const Root = () => React.createElement(Composition, {
  id: 'TrackARemotionRuntimeProof',
  component: TrackARemotionRuntimeProof,
  durationInFrames: 1,
  fps: 30,
  width: 320,
  height: 180,
});

registerRoot(Root);
`)

const remotionModule = await import('remotion')
const bundlerModule = await import('@remotion/bundler')
const rendererModule = await import('@remotion/renderer')

if (typeof remotionModule.registerRoot !== 'function') {
  throw new Error('Remotion package import missing registerRoot')
}

if (typeof bundlerModule.bundle !== 'function') {
  throw new Error('Remotion bundler package import missing bundle')
}

if (typeof rendererModule !== 'object' || rendererModule === null) {
  throw new Error('Remotion renderer package import failed')
}

const bundleOutput = await bundlerModule.bundle({
  entryPoint,
  outDir: bundleDir,
  rootDir: sourceDir,
  enableCaching: false,
})

const checksums = [
  ...collectChecksums(sourceDir, runDir),
  ...collectChecksums(bundleDir, runDir),
]

const manifest = {
  runId,
  decision: 'completed_bounded_package_import_and_bundle_proof_local_tmp_only',
  runDirectory: runDir,
  entryPoint,
  bundleOutput,
  runtimeExecutionPerformed: true,
  videoRenderingPerformed: false,
  browserCapturePerformed: false,
  mediaProcessingPerformed: false,
  checksums,
}

const qa = {
  runId,
  status: 'passed_bounded_package_import_and_bundle_only',
  packageImports: {
    remotion: true,
    remotionBundler: true,
    remotionRenderer: true,
  },
  boundedOperations: ['local_source_generation', 'package_import', 'bundle'],
  forbiddenOperations: {
    videoRendering: false,
    stillRendering: false,
    browserCapture: false,
    mediaProcessing: false,
    workerExecution: false,
    routeExecution: false,
    providerCall: false,
    supabaseMutation: false,
    sqlExecution: false,
    publicArtifactCreation: false,
    signedUrlCreation: false,
  },
}

writeJson(join(runDir, 'manifest.json'), manifest)
writeJson(join(runDir, 'qa-report.json'), qa)

console.log(JSON.stringify({
  status: qa.status,
  runId,
  artifactRoot: runDir,
  generatedFiles: checksums.map((entry) => entry.path),
  manifest: basename(join(runDir, 'manifest.json')),
  qaReport: basename(join(runDir, 'qa-report.json')),
}, null, 2))
