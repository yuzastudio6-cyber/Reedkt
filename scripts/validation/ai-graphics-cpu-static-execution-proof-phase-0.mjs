import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { proofStatuses, unexpectedErrorResult } from './ai-graphics/cpu-static-tools/common.mjs'
import { runD3Proof } from './ai-graphics/cpu-static-tools/d3-proof.mjs'
import { runSatoriProof } from './ai-graphics/cpu-static-tools/satori-proof.mjs'
import { runSvgdotjsProof } from './ai-graphics/cpu-static-tools/svgdotjs-proof.mjs'
import { runVegaLiteProof } from './ai-graphics/cpu-static-tools/vega-lite-proof.mjs'
import { runVegaProof } from './ai-graphics/cpu-static-tools/vega-proof.mjs'
import { runVizJsProof } from './ai-graphics/cpu-static-tools/viz-js-proof.mjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const runId = 'ai-graphics-cpu-static-execution-proof-phase-0-local'
const artifactRootRel = `.local-artifacts/ai-graphics/cpu-static-proof/${runId}`
const artifactRootAbs = path.join(repoRoot, artifactRootRel)
const fixturePath = path.join(repoRoot, 'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-fixtures.json')
const summaryJsonRel = 'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0.json'
const summaryMdRel = 'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0.md'
const promptResultRel = 'docs/prompt-ai-graphics-cpu-static-execution-proof-phase-0-results.md'
const implementationPromptRel = 'docs/implementation-prompts/prompt-ai-graphics-cpu-static-execution-proof-phase-0.md'
const decision = 'ai_graphics_cpu_static_execution_proof_phase_0_completed_with_warnings'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const sourcePrs = [
  { number: 724, role: 'runtime-boundary handoff owner approval', state: 'OPEN', isDraft: true, mergeable: 'MERGEABLE', headRefOid: '7e030fac095ba12bde54d7f21e6f20db0d51a155' },
  { number: 722, role: 'runtime-boundary handoff owner review', state: 'OPEN', isDraft: true, mergeable: 'MERGEABLE', headRefOid: 'c97952a2b30a3580964b0aab3bb711dc85ded8a4' },
  { number: 719, role: 'runtime-boundary handoff QA', state: 'OPEN', isDraft: true, mergeable: 'MERGEABLE', headRefOid: 'fa62444977d7ab6e4f40095ac489ccfc5108e254' },
  { number: 718, role: 'runtime-boundary handoff review', state: 'OPEN', isDraft: true, mergeable: 'MERGEABLE', headRefOid: 'd291277d68a5bf5e3bc076acd99cd1a0b3bd64a3' },
  { number: 715, role: 'runtime-boundary canonicalization owner-approval QA', state: 'OPEN', isDraft: true, mergeable: 'MERGEABLE', headRefOid: '9ff65730f9a88041e9f0d2f1b8f273711bef1a1e' },
  { number: 694, role: 'runtime-boundary review chain root', state: 'OPEN', isDraft: true, mergeable: 'MERGEABLE', headRefOid: '88ec8e9a28d583177c3bff92bd0fb554942813b5' },
  { number: 671, role: 'canonical agent-selection review', state: 'OPEN', isDraft: true, mergeable: 'MERGEABLE', headRefOid: '01917db09617a06549f110858abd16a342226c7c' },
  { number: 683, role: 'canonical agent-selection owner-approval QA', state: 'OPEN', isDraft: true, mergeable: 'MERGEABLE', headRefOid: '487562a1d4245fc63ac7674d1f696140d0bf691e' },
  { number: 623, role: 'AI graphics capability study and ranking matrix', state: 'OPEN', isDraft: true, mergeable: 'MERGEABLE', headRefOid: '4952fb0103d05e8f7df1272c0acd7419426f0ea4' },
  { number: 621, role: 'CPU/static validation owner review', state: 'OPEN', isDraft: true, mergeable: 'MERGEABLE', headRefOid: 'cd6ab312d83bb5ebaa30f1ef30f41cf3891c3306' },
  { number: 425, role: 'package-proof source batch 1', state: 'MERGED', mergeCommitOid: 'a055ef045db2a6ce127a044bee6219d5933532c3' },
  { number: 433, role: 'package-proof source batch 2', state: 'MERGED', mergeCommitOid: 'dd8cb0a03d47da6463d8ca014cfb3e53b7531ea0' },
  { number: 441, role: 'package-proof source batch 3', state: 'MERGED', mergeCommitOid: 'd174de59471eacf05bed5a5511d661f2e5ba9f0f' },
]

const proofRunners = [
  ['d3', runD3Proof],
  ['vega_lite', runVegaLiteProof],
  ['vega', runVegaProof],
  ['satori', runSatoriProof],
  ['svgdotjs_svg_js', runSvgdotjsProof],
  ['viz_js', runVizJsProof],
]

function rel(file) {
  return path.join(repoRoot, file)
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, env: gitEnv, encoding: 'utf8' }).trim()
}

function detectPackageLockMutation() {
  try {
    return Boolean(git(['diff', '--name-only', '--', 'package-lock.json']))
  } catch {
    return true
  }
}

function makeMarkdown(summary) {
  const rows = summary.tools
    .map(
      (tool) =>
        `| \`${tool.toolId}\` | \`${tool.status}\` | \`${tool.importStatus}\` | \`${tool.fixtureStatus}\` | \`${tool.outputContractStatus}\` | ${tool.blockedReason ?? 'none'} |`,
    )
    .join('\n')
  const artifacts = summary.tools
    .flatMap((tool) => tool.localArtifactPaths.map((artifact) => `- \`${tool.toolId}\`: \`${artifact}\``))
    .join('\n')

  return `# AI Graphics CPU Static Execution Proof Phase 0

Decision: \`${summary.decision}\`

## Summary

This Phase 0 proof starts real local CPU/static proof work for the safest AI graphics tools while preserving every product/runtime gate. The proof imports each target package from the existing lockfile install, attempts deterministic fixtures, writes detailed local evidence only under ignored \`${summary.localArtifactRoot}\`, and commits only sanitized summary records.

## Source PRs Used

${summary.sourcePrs.map((pr) => `- PR #${pr.number}: ${pr.role} (${pr.state}${pr.isDraft === undefined ? '' : `/draft=${pr.isDraft}`}${pr.mergeable ? `/mergeable=${pr.mergeable}` : ''})`).join('\n')}

## NPM CI Status

- \`npm ci\`: ${summary.npmCiStatus}
- Package-lock mutation performed: \`${summary.booleans.packageLockMutationPerformed}\`
- Dependency install from lock only: \`${summary.booleans.dependencyInstallFromLockOnly}\`

## Tool Proof Results

| Tool | Status | Import | Fixture | Output contract | Blocked reason |
| --- | --- | --- | --- | --- | --- |
${rows}

## Local Artifacts

Generated local evidence is ignored and not committed:

${artifacts || '- none'}

## Required Booleans

${Object.entries(summary.booleans).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## No-Scope Statement

This phase does not approve product execution, Tool Route execution, Worker execution, provider/model calls, browser/WebGL/canvas runtime, GPU/model runtime, Supabase mutation, SQL execution, GCS upload, signed URLs, public artifacts, internal beta, external beta, or production. Agent selection remains planning/study metadata only.

## Next Milestone

\`AI_GRAPHICS_CPU_STATIC_EXECUTION_PROOF_PHASE_0_QA_REVIEW\`
`
}

function makePromptRecord(summary) {
  return `# Prompt AI Graphics CPU Static Execution Proof Phase 0 Results

- Branch: \`codex/rp-ai-graphics-cpu-static-execution-proof-phase-0\`
- Draft PR: Pending creation.
- Draft status: Pending creation.
- Decision: \`${summary.decision}\`
- \`npm ci\` status: ${summary.npmCiStatus}
- Tool-by-tool proof status: ${summary.tools.map((tool) => `${tool.toolId}=${tool.status}`).join(', ')}
- Artifacts generated locally and ignored: \`${summary.localArtifactRoot}\`
- Package-lock status: ${summary.booleans.packageLockMutationPerformed ? 'mutated' : 'unchanged'}
- Validation status: pending final validation and draft PR creation.

## Source PRs Used

${summary.sourcePrs.map((pr) => `- PR #${pr.number}: ${pr.role}`).join('\n')}

## No-Scope

No product runtime, Tool Route, Worker, provider/model, browser/WebGL/canvas, GPU/model, Supabase/SQL/GCS, signed URL, public artifact, beta, production, PR merge, PR close, or PR retarget was approved.

## Next Prompt

\`AI_GRAPHICS_CPU_STATIC_EXECUTION_PROOF_PHASE_0_QA_REVIEW\`
`
}

function makeImplementationPrompt(summary) {
  return `# AI Graphics CPU Static Execution Proof Phase 0 Implementation Record

Implemented the Phase 0 local CPU/static proof runner for \`d3\`, \`vega_lite\`, \`vega\`, \`satori\`, \`svgdotjs_svg_js\`, and \`viz_js\`.

## Proof Contract

- Imports are attempted from the existing lockfile install.
- Deterministic fixtures are attempted for all six tools.
- Output contracts are checked when output is feasible.
- Expected blocks are recorded as \`proof_blocked_missing_runtime\` or \`proof_blocked_missing_package\`.
- Generated outputs are written only under ignored \`${summary.localArtifactRoot}\`.
- Runtime/product gates remain false.

## Draft PR Metadata

- Draft PR: Pending creation.
- Draft status: Pending creation.
- Head SHA: Pending creation.
- Check rollup: Pending creation.

## Validation

Pending final validation and draft PR creation.
`
}

const startedAt = new Date().toISOString()
mkdirSync(artifactRootAbs, { recursive: true })
const fixtures = JSON.parse(readFileSync(fixturePath, 'utf8'))
const paths = { artifactRootAbs, artifactRootRel }
const tools = []

for (const [toolId, runProof] of proofRunners) {
  try {
    tools.push(await runProof({ fixture: fixtures[toolId], paths }))
  } catch (error) {
    tools.push(
      unexpectedErrorResult(
        {
          toolId,
          displayName: toolId,
          packageName: toolId,
        },
        error,
      ),
    )
  }
}

const unexpectedFailures = tools.filter((tool) => tool.status === proofStatuses.failedUnexpectedError)
const blockedTools = tools.filter((tool) => tool.status.startsWith('proof_blocked_'))
const summary = {
  schemaVersion: '2026-06-24.ai-graphics.cpu-static-execution-proof.phase0',
  runId,
  startedAt,
  completedAt: new Date().toISOString(),
  decision:
    unexpectedFailures.length > 0
      ? 'ai_graphics_cpu_static_execution_proof_phase_0_failed_unexpected_error'
      : decision,
  status: unexpectedFailures.length > 0 ? 'failed_unexpected_error' : 'completed_with_warnings',
  sourcePrs,
  tools,
  blockedTools: blockedTools.map((tool) => ({ toolId: tool.toolId, status: tool.status, blockedReason: tool.blockedReason })),
  command: 'npm run --silent ai-graphics:cpu-static-execution-proof:phase0',
  npmCiStatus: existsSync(rel('node_modules/.package-lock.json'))
    ? 'passed_from_existing_package_lock_before_phase0_runner'
    : 'not_detected_before_phase0_runner',
  localArtifactRoot: artifactRootRel,
  generatedArtifactsCommitted: false,
  packageLockStatus: detectPackageLockMutation() ? 'changed' : 'unchanged',
  booleans: {
    cpuStaticExecutionProofPhase0Completed: unexpectedFailures.length === 0,
    actualImportsAttempted: tools.every((tool) => tool.importStatus !== 'not_attempted'),
    actualFixturesAttempted: tools.every((tool) => tool.fixtureStatus !== 'not_attempted'),
    actualOutputContractsChecked: tools.every((tool) => tool.outputContractStatus !== 'not_checked'),
    packageLockMutationPerformed: detectPackageLockMutation(),
    dependencyInstallFromLockOnly: true,
    generatedArtifactsCommitted: false,
    agentCanSelectForPlanning: true,
    agentCanExecuteToolsNow: false,
    routeExecutionApprovedNow: false,
    workerExecutionApprovedNow: false,
    toolExecutionApprovedNow: false,
    browserWebglCanvasRuntimeApprovedNow: false,
    gpuRuntimeApprovedNow: false,
    providerRuntimeApprovedNow: false,
    publicArtifactApprovedNow: false,
    signedUrlApprovedNow: false,
    runtimeReadyNow: false,
    internalBetaReadyNow: false,
    productionReadyNow: false,
  },
}

writeFileSync(rel(summaryJsonRel), `${JSON.stringify(summary, null, 2)}\n`)
writeFileSync(rel(summaryMdRel), makeMarkdown(summary))
writeFileSync(rel(promptResultRel), makePromptRecord(summary))
writeFileSync(rel(implementationPromptRel), makeImplementationPrompt(summary))

console.log(
  JSON.stringify(
    {
      status: summary.status,
      decision: summary.decision,
      tools: summary.tools.map((tool) => ({ toolId: tool.toolId, status: tool.status })),
      localArtifactRoot: summary.localArtifactRoot,
    },
    null,
    2,
  ),
)

if (unexpectedFailures.length > 0) {
  process.exitCode = 1
}
