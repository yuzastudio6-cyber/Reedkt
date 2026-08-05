import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { TRACK_ALL_CAPABILITY_MANIFEST } from '../edit-skills/track-all/track-all-capability-manifest'
import {
  TRACK_ALL_FIXTURE_COMMAND,
  TRACK_ALL_QUALIFICATION_SCRIPTS,
  TRACK_ALL_ROUTE_COMMANDS,
} from '../edit-skills/track-all/track-all-qualification-command-catalog'
import {
  createTrackAllRouteQualificationEvidence,
  issueTrackAllGeneratedQualificationArtifact,
  tryLoadTrackAllGeneratedQualificationArtifact,
  type TrackAllGeneratedQualificationArtifact,
  type TrackAllRouteQualificationEvidence,
} from '../edit-skills/track-all/track-all-qualification-evidence'
import { TRACK_ALL_QUALIFICATION_FIXTURE_KEYS } from '../edit-skills/track-all/track-all-qualification'
import { computeTrackAllQualificationDependencyAuthorityHashes } from '../edit-skills/track-all/track-all-qualification-dependency-authorities'
import { computeTrackAllRelevantSourceTreeHash } from '../edit-skills/track-all/track-all-qualification-source-hash'
import { hashSkillValue } from '../edit-skills/core/skill-capability-manifest-hash'
import {
  createSkillQualificationFixtureEvidence,
  type SkillQualificationDependencyAuthorityHash,
  type SkillQualificationFixtureEvidence,
} from '../edit-skills/core/skill-qualification-evidence'

const repositoryRoot = process.cwd()
const generatedPath = resolve(
  repositoryRoot,
  'server/edit-skills/track-all/generated/track-all-internal-qualification.generated.ts',
)
const gitExecutable = process.env.REEDITPRO_GIT_BIN?.trim() || 'git'

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function gitOutput(args: readonly string[]): string {
  const result = spawnSync(gitExecutable, [...args], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024,
  })
  if (result.status !== 0) {
    throw new Error(`Git command failed: ${result.stderr || result.error?.message || args.join(' ')}`)
  }
  return result.stdout.trim()
}

function safeQualificationEnvironment(
  brollConsumerEvidenceClass: 'bootstrap_prior_actual_acceptance' |
    'actual_current_source_acceptance',
): NodeJS.ProcessEnv {
  const environment: NodeJS.ProcessEnv = {
    ...process.env,
    NODE_OPTIONS: process.env.NODE_OPTIONS?.trim() || '--max-old-space-size=8192',
    REEDITPRO_BROLL_QUALIFICATION_GENERATING: '1',
    REEDITPRO_TRACK_ALL_QUALIFICATION_GENERATING: '1',
    REEDITPRO_TRACK_ALL_BROLL_ACCEPTANCE_MODE: brollConsumerEvidenceClass,
  }
  for (const key of [
    'GOOGLE_API_KEY',
    'GEMINI_API_KEY',
    'HF_TOKEN',
    'HUGGING_FACE_HUB_TOKEN',
    'REEDITPRO_CONFIRM_GEMINI_OMNI_BROLL_EXECUTE',
    'REEDITPRO_CONFIRM_SAM3_1_EXECUTE',
    'REEDITPRO_SAM3_1_CHECKPOINT_PATH',
    'REEDITPRO_SAM3_1_GPU_ROUTE',
  ]) delete environment[key]
  return environment
}

function runScript(input: {
  script: string
  testedCommitSha: string
  relevantSourceTreeHash: string
  dependencyAuthorityHashes: readonly SkillQualificationDependencyAuthorityHash[]
  brollConsumerEvidenceClass: 'bootstrap_prior_actual_acceptance' |
    'actual_current_source_acceptance'
}): SkillQualificationFixtureEvidence {
  const commandId = `npm.${input.script}`
  const startedAt = new Date().toISOString()
  const result = spawnSync('npm', ['run', input.script], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    env: safeQualificationEnvironment(input.brollConsumerEvidenceClass),
    maxBuffer: 24 * 1024 * 1024,
  })
  const completedAt = new Date().toISOString()
  const stdout = result.stdout ?? ''
  const stderr = `${result.stderr ?? ''}${result.error ? `\n${result.error.message}` : ''}`
  const exitStatus = result.status ?? 255
  const stdoutDigest = sha256(stdout)
  const stderrDigest = sha256(stderr)
  const commandArtifactHash = hashSkillValue({
    schemaVersion: 'track_all_qualification_command_run_v1',
    commandId,
    startedAt,
    completedAt,
    exitStatus,
    stdoutDigest,
    stderrDigest,
  })
  const evidence = createSkillQualificationFixtureEvidence({
    schemaVersion: 'skill-qualification-fixture-evidence-v1',
    skillKey: 'track_all',
    skillVersion: TRACK_ALL_CAPABILITY_MANIFEST.skillVersion,
    contractVersion: TRACK_ALL_CAPABILITY_MANIFEST.contractVersion,
    manifestHash: TRACK_ALL_CAPABILITY_MANIFEST.manifestHash,
    fixtureKey: `command.${input.script}`,
    commandId,
    testedCommitSha: input.testedCommitSha,
    relevantSourceTreeHash: input.relevantSourceTreeHash,
    dependencyAuthorityHashes: [...input.dependencyAuthorityHashes],
    startedAt,
    completedAt,
    exitStatus,
    passed: exitStatus === 0,
    evidenceArtifactHashes: [commandArtifactHash],
    stdoutDigest,
    stderrDigest,
    environmentClass: 'local_internal_qualification',
    providerRequestCount: 0,
    publicArtifactCount: 0,
    productionMutationCount: 0,
  })
  console.log(`${exitStatus === 0 ? 'PASS' : 'FAIL'} ${commandId} ${evidence.evidenceHash}`)
  if (exitStatus !== 0) {
    const diagnostic = `${stdout}\n${stderr}`.slice(-10_000)
    throw new Error(`${commandId} failed with exit ${exitStatus}.\n${diagnostic}`)
  }
  return evidence
}

function fixtureEvidence(input: {
  fixtureKey: string
  command: SkillQualificationFixtureEvidence
}): SkillQualificationFixtureEvidence {
  return createSkillQualificationFixtureEvidence({
    schemaVersion: 'skill-qualification-fixture-evidence-v1',
    skillKey: input.command.skillKey,
    skillVersion: input.command.skillVersion,
    contractVersion: input.command.contractVersion,
    manifestHash: input.command.manifestHash,
    fixtureKey: input.fixtureKey,
    commandId: input.command.commandId,
    testedCommitSha: input.command.testedCommitSha,
    relevantSourceTreeHash: input.command.relevantSourceTreeHash,
    dependencyAuthorityHashes: input.command.dependencyAuthorityHashes,
    startedAt: input.command.startedAt,
    completedAt: input.command.completedAt,
    exitStatus: input.command.exitStatus,
    passed: input.command.passed,
    evidenceArtifactHashes: [input.command.evidenceHash],
    stdoutDigest: input.command.stdoutDigest,
    stderrDigest: input.command.stderrDigest,
    environmentClass: input.command.environmentClass,
    providerRequestCount: input.command.providerRequestCount,
    publicArtifactCount: input.command.publicArtifactCount,
    productionMutationCount: input.command.productionMutationCount,
  })
}

function writeGenerated(artifact: TrackAllGeneratedQualificationArtifact): void {
  const header = [
    '// Generated by `npm run qualify:track-all:internal`. Do not edit by hand.',
    '// Content-addressed V3 qualification; route status is derived from exact recorded evidence.',
  ].join('\n')
  writeFileSync(
    generatedPath,
    `${header}\nexport const GENERATED_TRACK_ALL_INTERNAL_QUALIFICATION_ARTIFACT: unknown = ${JSON.stringify(artifact, null, 2)} as const\n`,
    'utf8',
  )
}

function requiredCommand(
  commands: ReadonlyMap<string, SkillQualificationFixtureEvidence>,
  commandId: string,
): SkillQualificationFixtureEvidence {
  const evidence = commands.get(commandId)
  if (!evidence) throw new Error(`Missing actual Track All command evidence for ${commandId}.`)
  return evidence
}

function routeEvidence(
  routeKey: keyof typeof TRACK_ALL_ROUTE_COMMANDS,
  commands: ReadonlyMap<string, SkillQualificationFixtureEvidence>,
): TrackAllRouteQualificationEvidence {
  const commandEvidenceHashes = TRACK_ALL_ROUTE_COMMANDS[routeKey].map((commandId) =>
    requiredCommand(commands, commandId).evidenceHash)
  if (routeKey === 'sam3_1_masklet_route') {
    return createTrackAllRouteQualificationEvidence({
      routeKey,
      qualificationStatus: 'blocked',
      evidenceClass: 'missing_external_sam_evidence',
      commandEvidenceHashes,
      actualSamInferenceObserved: false,
      productionWorkerObserved: false,
      publicArtifactCount: 0,
      productionMutationCount: 0,
      summary: 'Contracts and injected lifecycle passed; gated checkpoint, strict load, private GPU inference, quality, and cost evidence are absent.',
    })
  }
  if (routeKey === 'production_worker_route') {
    return createTrackAllRouteQualificationEvidence({
      routeKey,
      qualificationStatus: 'blocked',
      evidenceClass: 'missing_production_evidence',
      commandEvidenceHashes,
      actualSamInferenceObserved: false,
      productionWorkerObserved: false,
      publicArtifactCount: 0,
      productionMutationCount: 0,
      summary: 'Production worker, durable private store, release, monitoring, and security evidence are intentionally absent.',
    })
  }
  const planning = routeKey === 'planning_core_route'
  return createTrackAllRouteQualificationEvidence({
    routeKey,
    qualificationStatus: planning ? 'planning_qualified' : 'internal_execution_qualified',
    evidenceClass: planning
      ? 'actual_planning_command_evidence'
      : routeKey === 'public_plugin_lifecycle_route'
        ? 'actual_injected_private_lifecycle_evidence'
        : 'actual_deterministic_private_fixture_evidence',
    commandEvidenceHashes,
    actualSamInferenceObserved: false,
    productionWorkerObserved: false,
    publicArtifactCount: 0,
    productionMutationCount: 0,
    summary: planning
      ? 'Planning contracts, authorities, estimators, and independent QA passed actual commands.'
      : 'The bounded deterministic or injected-private route passed its actual fixture command; this is not real SAM or production evidence.',
  })
}

function runQualificationPass(input: {
  testedCommitSha: string
  relevantSourceTreeHash: string
  dependencyAuthorityHashes: readonly SkillQualificationDependencyAuthorityHash[]
  brollConsumerEvidenceClass: 'bootstrap_prior_actual_acceptance' |
    'actual_current_source_acceptance'
}): TrackAllGeneratedQualificationArtifact {
  const commandEvidence = TRACK_ALL_QUALIFICATION_SCRIPTS.map((script) => runScript({
    script,
    testedCommitSha: input.testedCommitSha,
    relevantSourceTreeHash: input.relevantSourceTreeHash,
    dependencyAuthorityHashes: input.dependencyAuthorityHashes,
    brollConsumerEvidenceClass: input.brollConsumerEvidenceClass,
  }))
  const commands = new Map(commandEvidence.map((entry) => [entry.commandId, entry]))
  const fixtureEvidenceItems = TRACK_ALL_QUALIFICATION_FIXTURE_KEYS.map((fixtureKey) =>
    fixtureEvidence({
      fixtureKey,
      command: requiredCommand(commands, TRACK_ALL_FIXTURE_COMMAND[fixtureKey]),
    }))
  const routeQualifications = Object.keys(TRACK_ALL_ROUTE_COMMANDS).map((routeKey) =>
    routeEvidence(routeKey as keyof typeof TRACK_ALL_ROUTE_COMMANDS, commands))
  const artifact = issueTrackAllGeneratedQualificationArtifact({
    manifest: TRACK_ALL_CAPABILITY_MANIFEST,
    testedCommitSha: input.testedCommitSha,
    relevantSourceTreeHash: input.relevantSourceTreeHash,
    dependencyAuthorityHashes: input.dependencyAuthorityHashes,
    fixtureEvidence: fixtureEvidenceItems,
    commandEvidence,
    routeQualifications,
    brollConsumerEvidenceClass: input.brollConsumerEvidenceClass,
  })
  return artifact
}

function main(): void {
  const dirty = gitOutput(['status', '--porcelain', '--untracked-files=all'])
  if (dirty) throw new Error('Track All qualification must start from a clean Git working tree.')
  const testedCommitSha = gitOutput(['rev-parse', 'HEAD'])
  if (!/^[a-f0-9]{40}$/u.test(testedCommitSha)) {
    throw new Error('Unable to resolve an exact Track All tested commit SHA.')
  }
  const relevantSourceTreeHash = computeTrackAllRelevantSourceTreeHash(repositoryRoot)
  const dependencyAuthorityHashes =
    computeTrackAllQualificationDependencyAuthorityHashes(repositoryRoot)
  const currentFinalArtifact = (() => {
    try {
      const current = tryLoadTrackAllGeneratedQualificationArtifact({
        manifest: TRACK_ALL_CAPABILITY_MANIFEST,
        expectedRelevantSourceTreeHash: relevantSourceTreeHash,
        expectedDependencyAuthorityHashes: dependencyAuthorityHashes,
      })
      return current?.finalAuthorityBinding.brollConsumerEvidenceClass ===
        'actual_current_source_acceptance'
    } catch {
      return false
    }
  })()
  if (!currentFinalArtifact) {
    const bootstrap = runQualificationPass({
      testedCommitSha,
      relevantSourceTreeHash,
      dependencyAuthorityHashes,
      brollConsumerEvidenceClass: 'bootstrap_prior_actual_acceptance',
    })
    writeGenerated(bootstrap)
    console.log('Track All qualification bootstrap receipt written; rerunning against actual current-source B-Roll acceptance.')
  }
  const artifact = runQualificationPass({
    testedCommitSha,
    relevantSourceTreeHash,
    dependencyAuthorityHashes,
    brollConsumerEvidenceClass: 'actual_current_source_acceptance',
  })
  writeGenerated(artifact)
  console.log(JSON.stringify({
    status: artifact.receipt.qualificationStatus,
    testedCommitSha,
    relevantSourceTreeHash,
    sharedAuthoritySetHash: hashSkillValue(dependencyAuthorityHashes),
    dependencyAuthorityCount: dependencyAuthorityHashes.length,
    manifestHash: artifact.manifestRef.manifestHash,
    fixtureEvidenceCount: artifact.fixtureEvidence.length,
    commandEvidenceCount: artifact.commandEvidence.length,
    routeQualificationCount: artifact.routeQualifications.length,
    protocolWiringComplete: artifact.protocolWiringComplete,
    realSamExecutionObserved: artifact.realSamExecutionObserved,
    samActivationRequiresNoFurtherCodeChange:
      artifact.samActivationRequiresNoFurtherCodeChange,
    samRouteQualification: artifact.samRouteQualification,
    actualSamRequestCount: artifact.actualSamRequestCount,
    actualGpuExecutionCount: artifact.actualGpuExecutionCount,
    productionQualified: artifact.productionQualified,
    receiptHash: artifact.receipt.receiptHash,
    artifactHash: artifact.artifactHash,
  }, null, 2))
}

const priorGeneratedArtifact = readFileSync(generatedPath, 'utf8')
try {
  main()
} catch (error) {
  writeFileSync(generatedPath, priorGeneratedArtifact, 'utf8')
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
