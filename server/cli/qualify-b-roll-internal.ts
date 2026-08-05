import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { BROLL_CAPABILITY_MANIFEST } from '../edit-skills/b-roll/b-roll-capability-manifest'
import {
  issueBrollGeneratedQualificationArtifact,
  type BrollGeneratedQualificationArtifact,
} from '../edit-skills/b-roll/b-roll-qualification-evidence'
import { computeBrollRelevantSourceTreeHash } from '../edit-skills/b-roll/b-roll-qualification-source-hash'
import { computeBrollQualificationDependencyAuthorityHashes } from '../edit-skills/b-roll/b-roll-qualification-dependency-authorities'
import {
  BROLL_INTERNAL_EXECUTION_QUALIFICATION_FIXTURE_KEYS,
  BROLL_PLANNING_QUALIFICATION_FIXTURE_KEYS,
} from '../edit-skills/b-roll/b-roll-qualification'
import { hashSkillValue } from '../edit-skills/core/skill-capability-manifest-hash'
import {
  createSkillQualificationFixtureEvidence,
  type SkillQualificationDependencyAuthorityHash,
  type SkillQualificationFixtureEvidence,
} from '../edit-skills/core/skill-qualification-evidence'

const repositoryRoot = process.cwd()
const generatedPath = resolve(
  repositoryRoot,
  'server/edit-skills/b-roll/generated/b-roll-internal-qualification.generated.ts',
)
const gitExecutable = process.env.REEDITPRO_GIT_BIN?.trim() || 'git'

const PHASE_A_SCRIPTS = [
  'test:edit-skill-shared-assignment-authorities',
  'test:b-roll-planning',
  'test:b-roll-planning-qa',
  'test:b-roll-qualification-evidence',
  'test:b-roll-plan-invariants',
  'test:b-roll-public-plugin',
  'test:b-roll-active-artifact-contracts',
  'test:b-roll-runtime-bindings',
  'test:edit-skill-runtime-factory',
  'test:ui-qa-media-runtime-workflow',
  'test:b-roll-capability-manifest',
  'validate:skill-capability-manifests',
  'test:edit-skill-capability-kernel',
  'build',
  'typecheck:server',
  'lint',
  'check:frontend-boundary',
] as const

const PHASE_B_SCRIPTS = [
  'smoke:b-roll-provider-authority',
  'smoke:b-roll-retirement',
  'smoke:b-roll-end-to-end',
  'test:b-roll-canonical-private-runtime',
  'test:b-roll-public-canonical-lifecycle',
  'smoke:b-roll-candidate-qa',
  'smoke:b-roll-existing-source',
  'smoke:b-roll-provider-lifecycle',
  'test:b-roll-canonical-integration',
  'smoke:b-roll-remotion-integration',
  'smoke:runtime-api-security',
  'smoke:edit-execution-security-boundary',
  'smoke:idempotency-boundary',
] as const

const INTERNAL_FIXTURE_COMMAND = {
  provider_unknown_outcome: 'npm.smoke:b-roll-provider-authority',
  stale_rate_authority_block: 'npm.smoke:b-roll-provider-authority',
  retired_provider_route_rejected: 'npm.smoke:b-roll-retirement',
  idempotent_provider_replay: 'npm.smoke:b-roll-provider-authority',
  one_failed_candidate_refinement: 'npm.smoke:b-roll-end-to-end',
  refinement_limit_enforced: 'npm.smoke:b-roll-candidate-qa',
  historical_provider_v1_v4_hash_preservation: 'npm.smoke:b-roll-provider-authority',
  cross_workspace_artifact_substitution: 'npm.smoke:b-roll-provider-authority',
  source_checksum_substitution: 'npm.smoke:b-roll-existing-source',
  provider_route_substitution: 'npm.smoke:b-roll-provider-authority',
  model_alias_substitution: 'npm.smoke:b-roll-provider-authority',
  attempt_replay_modified_request: 'npm.smoke:b-roll-provider-authority',
  forged_qa_pass: 'npm.smoke:b-roll-candidate-qa',
  forged_qualification_receipt: 'npm.smoke:b-roll-end-to-end',
  stale_manifest_hash: 'npm.test:b-roll-canonical-integration',
  stale_assignment_range: 'npm.test:b-roll-canonical-integration',
  raw_credential_input: 'npm.smoke:b-roll-provider-authority',
  raw_provider_url_persistence: 'npm.smoke:b-roll-provider-lifecycle',
  work_item_outside_range: 'npm.test:b-roll-canonical-integration',
  caller_selected_executable: 'npm.smoke:b-roll-provider-authority',
  second_provider_submission_inside_attempt: 'npm.smoke:b-roll-provider-authority',
} as const satisfies Record<
  (typeof BROLL_INTERNAL_EXECUTION_QUALIFICATION_FIXTURE_KEYS)[number],
  string
>

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

function safeQualificationEnvironment(): NodeJS.ProcessEnv {
  const environment: NodeJS.ProcessEnv = {
    ...process.env,
    REEDITPRO_BROLL_QUALIFICATION_GENERATING: '1',
    REEDITPRO_TRACK_ALL_QUALIFICATION_GENERATING: '1',
  }
  for (const key of [
    'GOOGLE_API_KEY',
    'GEMINI_API_KEY',
    'REEDITPRO_CONFIRM_GEMINI_OMNI_BROLL_EXECUTE',
    'REEDITPRO_GEMINI_OMNI_BROLL_SAFE_FIXTURE_ID',
    'REEDITPRO_GEMINI_OMNI_BROLL_MAX_COST_MICROS',
  ]) delete environment[key]
  return environment
}

function runScript(input: {
  script: string
  testedCommitSha: string
  relevantSourceTreeHash: string
  dependencyAuthorityHashes: readonly SkillQualificationDependencyAuthorityHash[]
}): SkillQualificationFixtureEvidence {
  const commandId = `npm.${input.script}`
  const startedAt = new Date().toISOString()
  const result = spawnSync('npm', ['run', input.script], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    env: safeQualificationEnvironment(),
    maxBuffer: 16 * 1024 * 1024,
  })
  const completedAt = new Date().toISOString()
  const stdout = result.stdout ?? ''
  const stderr = `${result.stderr ?? ''}${result.error ? `\n${result.error.message}` : ''}`
  const exitStatus = result.status ?? 255
  const stdoutDigest = sha256(stdout)
  const stderrDigest = sha256(stderr)
  const commandArtifactHash = hashSkillValue({
    schemaVersion: 'b_roll_qualification_command_run_v1',
    commandId,
    startedAt,
    completedAt,
    exitStatus,
    stdoutDigest,
    stderrDigest,
  })
  const evidence = createSkillQualificationFixtureEvidence({
    schemaVersion: 'skill-qualification-fixture-evidence-v1',
    skillKey: BROLL_CAPABILITY_MANIFEST.skillKey,
    skillVersion: BROLL_CAPABILITY_MANIFEST.skillVersion,
    contractVersion: BROLL_CAPABILITY_MANIFEST.contractVersion,
    manifestHash: BROLL_CAPABILITY_MANIFEST.manifestHash,
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
    const diagnostic = `${stdout}\n${stderr}`.slice(-8_000)
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

function writeGenerated(artifact: BrollGeneratedQualificationArtifact | undefined): void {
  const header = [
    '// Generated by `npm run qualify:b-roll:internal`. Do not edit by hand.',
    artifact
      ? '// Content-addressed qualification evidence; relevant source changes invalidate it.'
      : '// Fail-closed placeholder: no internal qualification receipt is installed.',
  ].join('\n')
  const value = artifact === undefined ? 'undefined' : `${JSON.stringify(artifact, null, 2)} as const`
  writeFileSync(
    generatedPath,
    `${header}\nexport const GENERATED_BROLL_INTERNAL_QUALIFICATION_ARTIFACT: unknown = ${value}\n`,
    'utf8',
  )
}

function commandById(
  evidence: readonly SkillQualificationFixtureEvidence[],
): ReadonlyMap<string, SkillQualificationFixtureEvidence> {
  return new Map(evidence.map((entry) => [entry.commandId, entry]))
}

function requiredCommand(
  commands: ReadonlyMap<string, SkillQualificationFixtureEvidence>,
  commandId: string,
): SkillQualificationFixtureEvidence {
  const evidence = commands.get(commandId)
  if (!evidence) throw new Error(`Missing actual command evidence for ${commandId}.`)
  return evidence
}

function main(): void {
  const dirty = gitOutput(['status', '--porcelain', '--untracked-files=all'])
  if (dirty) throw new Error('Qualification must start from a clean Git working tree.')
  const testedCommitSha = gitOutput(['rev-parse', 'HEAD'])
  if (!/^[a-f0-9]{40}$/u.test(testedCommitSha)) throw new Error('Unable to resolve an exact tested commit SHA.')
  const relevantSourceTreeHash = computeBrollRelevantSourceTreeHash(repositoryRoot)
  const dependencyAuthorityHashes =
    computeBrollQualificationDependencyAuthorityHashes(repositoryRoot)
  const phaseA = PHASE_A_SCRIPTS.map((script) => runScript({
    script,
    testedCommitSha,
    relevantSourceTreeHash,
    dependencyAuthorityHashes,
  }))
  const phaseAById = commandById(phaseA)
  const planningFixtures = BROLL_PLANNING_QUALIFICATION_FIXTURE_KEYS.map((fixtureKey) =>
    fixtureEvidence({
      fixtureKey,
      command: requiredCommand(phaseAById, 'npm.test:b-roll-planning'),
    }))
  const planningArtifact = issueBrollGeneratedQualificationArtifact({
    manifest: BROLL_CAPABILITY_MANIFEST,
    qualificationStatus: 'planning_qualified',
    testedCommitSha,
    relevantSourceTreeHash,
    dependencyAuthorityHashes,
    fixtureEvidence: planningFixtures,
    commandEvidence: phaseA,
  })
  writeGenerated(planningArtifact)

  const phaseB = PHASE_B_SCRIPTS.map((script) => runScript({
    script,
    testedCommitSha,
    relevantSourceTreeHash,
    dependencyAuthorityHashes,
  }))
  const allCommands = [...phaseA, ...phaseB]
  const allById = commandById(allCommands)
  const internalFixtures = BROLL_INTERNAL_EXECUTION_QUALIFICATION_FIXTURE_KEYS.map((fixtureKey) =>
    fixtureEvidence({
      fixtureKey,
      command: requiredCommand(allById, INTERNAL_FIXTURE_COMMAND[fixtureKey]),
    }))
  const artifact = issueBrollGeneratedQualificationArtifact({
    manifest: BROLL_CAPABILITY_MANIFEST,
    qualificationStatus: 'internal_execution_qualified',
    testedCommitSha,
    relevantSourceTreeHash,
    dependencyAuthorityHashes,
    fixtureEvidence: [...planningFixtures, ...internalFixtures],
    commandEvidence: allCommands,
  })
  writeGenerated(artifact)
  console.log(JSON.stringify({
    status: artifact.receipt.qualificationStatus,
    testedCommitSha,
    relevantSourceTreeHash,
    dependencyAuthoritySetHash: hashSkillValue(dependencyAuthorityHashes),
    dependencyAuthorityCount: dependencyAuthorityHashes.length,
    manifestHash: artifact.manifestRef.manifestHash,
    fixtureEvidenceCount: artifact.fixtureEvidence.length,
    commandEvidenceCount: artifact.commandEvidence.length,
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
