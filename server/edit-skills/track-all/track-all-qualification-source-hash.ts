import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { relative, resolve, sep } from 'node:path'

import { hashSkillValue } from '../core/skill-capability-manifest-hash'

const RELEVANT_DIRECTORY_ROOTS = [
  'server/edit-skills/core',
  'server/edit-skills/track-all',
  'server/edit-skills/shared/assignment-authorities',
  'server/edit-skills/shared/track-graph',
] as const

const RELEVANT_EXACT_FILES = [
  'package.json',
  'server/edit-skills/registry.ts',
  'server/edit-skills/internal-fixture-runtime.ts',
  'server/smoke/edit-skill-route-qualification-smoke.ts',
  'server/smoke/edit-skill-runtime-input-fixtures.ts',
  'server/cli/generate-track-all-capability-manifest-doc.ts',
  'server/cli/qualify-track-all-internal.ts',
  'server/cli/validate-track-all-active-route-retirement.ts',
  'docs/edit-skills/manifests/track-all-capability-manifest.generated.json',
  'server/tool-execution/media-binary-execution/offline-media-binary-protocol.ts',
  'server/tool-execution/media-binary-execution/offline-media-binary-runtime.ts',
  'server/tool-execution/python-runner-execution/offline-python-structured-execution-protocol.ts',
  'server/tool-execution/python-runner-execution/offline-python-structured-execution-service.ts',
  'server/tool-execution/remotion-render-execution/offline-remotion-track-all-treatment-protocol.ts',
] as const

const EXCLUDED_SUFFIXES = [
  'track-all-internal-qualification.generated.ts',
] as const

function normalizedRelative(root: string, path: string): string {
  return relative(root, path).split(sep).join('/')
}

function walkFiles(root: string, directory: string, output: Set<string>): void {
  const absoluteDirectory = resolve(root, directory)
  if (!existsSync(absoluteDirectory)) {
    throw new Error(`Track All qualification source root is missing: ${directory}.`)
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

export function listTrackAllQualificationRelevantFiles(
  repositoryRoot = process.cwd(),
): readonly string[] {
  const root = resolve(repositoryRoot)
  const paths = new Set<string>()
  for (const directory of RELEVANT_DIRECTORY_ROOTS) walkFiles(root, directory, paths)
  for (const path of RELEVANT_EXACT_FILES) {
    const absolutePath = resolve(root, path)
    if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
      throw new Error(`Track All qualification source file is missing: ${path}.`)
    }
    paths.add(path)
  }
  for (const entry of readdirSync(resolve(root, 'server/smoke'), { withFileTypes: true })) {
    if (entry.isFile() && entry.name.startsWith('track-all-') && entry.name.endsWith('.ts')) {
      paths.add(`server/smoke/${entry.name}`)
    }
  }
  return [...paths].sort()
}

export function computeTrackAllRelevantSourceTreeHash(
  repositoryRoot = process.cwd(),
): string {
  const root = resolve(repositoryRoot)
  const files = listTrackAllQualificationRelevantFiles(root).map((path) => ({
    path,
    sha256: createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex'),
  }))
  return hashSkillValue({
    schemaVersion: 'track_all_relevant_source_tree_v1',
    files,
  })
}
