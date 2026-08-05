import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { relative, resolve, sep } from 'node:path'

import { hashSkillValue } from '../core/skill-capability-manifest-hash'

const RELEVANT_DIRECTORY_ROOTS = [
  'server/edit-skills/core',
  'server/edit-skills/b-roll',
  'server/edit-skills/shared/assignment-authorities',
  'server/providers/google/gemini-omni-broll',
] as const

const RELEVANT_EXACT_FILES = [
  '.github/workflows/ui-qa.yml',
  'docs/edit-skills/manifests/b-roll-capability-manifest.generated.json',
  'package.json',
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
  return hashSkillValue({
    schemaVersion: 'b_roll_relevant_source_tree_v1',
    files,
  })
}
