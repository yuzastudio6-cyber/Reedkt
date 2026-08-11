import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { relative, resolve, sep } from 'node:path'

import { hashSkillValue } from '../core/skill-capability-manifest-hash'

const RELEVANT_DIRECTORY_ROOTS = [
  'server/edit-skills/core',
  'server/edit-skills/b-roll',
  'server/providers/google/gemini-omni-broll',
] as const

const RELEVANT_EXACT_FILES = [
  '.github/workflows/ui-qa.yml',
  'docs/edit-skills/manifests/b-roll-capability-manifest.generated.json',
  'server/cli/gemini-omni-b-roll-canary.ts',
  'server/cli/generate-b-roll-capability-manifest-doc.ts',
  'server/cli/qualify-b-roll-internal.ts',
  'server/cli/validate-b-roll-active-route-retirement.ts',
  'server/edit-skills/registry.ts',
  'server/edit-skills/internal-fixture-runtime.ts',
  'server/smoke/edit-skill-runtime-factory-smoke.ts',
  'server/smoke/ui-qa-media-runtime-workflow-smoke.ts',
  'server/services/canonical-broll-plan-component-service.ts',
] as const

export const BROLL_QUALIFICATION_RELEVANT_PACKAGE_SCRIPT_KEYS = [
  'build',
  'typecheck:server',
  'lint',
  'check:frontend-boundary',
  'validate:skill-capability-manifests',
  'test:edit-skill-capability-kernel',
  'test:edit-skill-runtime-factory',
  'test:ui-qa-media-runtime-workflow',
  'test:b-roll-capability-manifest',
  'test:b-roll-planning',
  'test:b-roll-public-plugin',
  'test:b-roll-caption-public-contract',
  'test:b-roll-active-artifact-contracts',
  'test:b-roll-runtime-bindings',
  'test:b-roll-canonical-private-runtime',
  'test:b-roll-public-canonical-lifecycle',
  'test:b-roll-plan-invariants',
  'test:b-roll-planning-qa',
  'test:b-roll-qualification-evidence',
  'test:b-roll-qualification-source-hash',
  'test:b-roll-canonical-integration',
  'generate:b-roll-capability-manifest',
  'qualify:b-roll:internal',
  'smoke:b-roll-existing-source',
  'smoke:b-roll-provider-authority',
  'smoke:b-roll-provider-lifecycle',
  'smoke:b-roll-candidate-qa',
  'smoke:b-roll-remotion-integration',
  'smoke:b-roll-retirement',
  'smoke:b-roll-end-to-end',
  'canary:gemini-omni-b-roll',
  'smoke:runtime-api-security',
  'smoke:edit-execution-security-boundary',
  'smoke:idempotency-boundary',
] as const

const EXCLUDED_SUFFIXES = [
  'b-roll-internal-qualification.generated.ts',
] as const

function normalizedRelative(root: string, path: string): string {
  return relative(root, path).split(sep).join('/')
}

function walkFiles(root: string, directory: string, output: Set<string>): void {
  const absoluteDirectory = resolve(root, directory)
  if (!existsSync(absoluteDirectory)) {
    throw new Error(`B-roll qualification source root is missing: ${directory}.`)
  }
  for (const entry of readdirSync(absoluteDirectory, { withFileTypes: true })) {
    const absolutePath = resolve(absoluteDirectory, entry.name)
    if (entry.isDirectory()) {
      walkFiles(root, normalizedRelative(root, absolutePath), output)
    } else if (entry.isFile()) {
      const path = normalizedRelative(root, absolutePath)
      if (!EXCLUDED_SUFFIXES.some((suffix) => path.endsWith(suffix))) output.add(path)
    }
  }
}

export function listBrollQualificationRelevantFiles(
  repositoryRoot = process.cwd(),
): readonly string[] {
  const root = resolve(repositoryRoot)
  const paths = new Set<string>()
  for (const directory of RELEVANT_DIRECTORY_ROOTS) walkFiles(root, directory, paths)
  for (const path of RELEVANT_EXACT_FILES) {
    const absolutePath = resolve(root, path)
    if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
      throw new Error(`B-roll qualification source file is missing: ${path}.`)
    }
    paths.add(path)
  }
  for (const entry of readdirSync(resolve(root, 'server/smoke'), { withFileTypes: true })) {
    if (entry.isFile() && entry.name.startsWith('b-roll-') && entry.name.endsWith('.ts')) {
      paths.add(`server/smoke/${entry.name}`)
    }
  }
  return [...paths].sort()
}

export function computeBrollRelevantSourceTreeHash(
  repositoryRoot = process.cwd(),
): string {
  const root = resolve(repositoryRoot)
  const files = listBrollQualificationRelevantFiles(root).map((path) => ({
    path,
    sha256: createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex'),
  }))
  const packageScripts = readBrollQualificationPackageScripts(root)
  return hashSkillValue({
    schemaVersion: 'b_roll_relevant_source_tree_v2',
    files,
    packageScripts,
  })
}

export function readBrollQualificationPackageScripts(
  repositoryRoot = process.cwd(),
): Readonly<Record<string, string>> {
  const root = resolve(repositoryRoot)
  const parsed = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
    scripts?: Record<string, unknown>
  }
  const scripts = parsed.scripts
  if (!scripts || typeof scripts !== 'object' || Array.isArray(scripts)) {
    throw new Error('B-roll qualification requires a package scripts object.')
  }
  return projectBrollQualificationPackageScripts(scripts)
}

export function projectBrollQualificationPackageScripts(
  scripts: Readonly<Record<string, unknown>>,
): Readonly<Record<string, string>> {
  return Object.freeze(Object.fromEntries(
    BROLL_QUALIFICATION_RELEVANT_PACKAGE_SCRIPT_KEYS.map((key) => {
      const command = scripts[key]
      if (typeof command !== 'string' || command.trim().length === 0) {
        throw new Error(
          `B-roll qualification package script is missing or invalid: ${key}.`,
        )
      }
      return [key, command]
    }),
  ))
}
