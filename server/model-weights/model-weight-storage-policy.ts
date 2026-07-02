import type { ProductionModelWeightManifestTemplate } from './model-weight-manifest-types'

const expectedRoot = '/opt/reeditpro/model-weights/'

export function assertModelWeightPathIsPlaceholderSafe(expectedPath: string): void {
  if (!expectedPath.startsWith(expectedRoot)) {
    throw new Error(`Model weight path must stay under ${expectedRoot}.`)
  }

  if (expectedPath.includes('..') || /^https?:\/\//i.test(expectedPath)) {
    throw new Error('Model weight paths must be local placeholder paths, not traversal paths or URLs.')
  }
}

export function assertModelWeightTemplateStoragePolicy(template: ProductionModelWeightManifestTemplate): void {
  assertModelWeightPathIsPlaceholderSafe(template.expectedPath)

  if (template.checksum) {
    throw new Error('Milestone 11 templates must not claim real checksum coverage before weights exist.')
  }
}

export function getExpectedModelWeightRoot(): string {
  return expectedRoot
}
