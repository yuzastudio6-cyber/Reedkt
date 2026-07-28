import type { ProductionToolId } from '../../tool-registry'

export interface CoreToolNodePackageCheckDefinition {
  toolId: Extract<ProductionToolId, 'sharp' | 'remotion'>
  checkName: string
  packageName: string
  packageJsonPath: string
  optional: boolean
  metadataOnly: boolean
  notes: string[]
}

export const CORE_TOOL_NODE_PACKAGE_CHECKS: CoreToolNodePackageCheckDefinition[] = [
  {
    toolId: 'sharp',
    checkName: 'node_package_metadata_sharp',
    packageName: 'sharp',
    packageJsonPath: 'sharp/package.json',
    optional: false,
    metadataOnly: true,
    notes: ['Check package metadata only; do not process images in readiness.'],
  },
  {
    toolId: 'remotion',
    checkName: 'node_package_metadata_remotion',
    packageName: 'remotion',
    packageJsonPath: 'remotion/package.json',
    optional: false,
    metadataOnly: true,
    notes: ['Check package metadata only; do not render compositions in readiness.'],
  },
]

export function listCoreToolNodePackageChecks(): CoreToolNodePackageCheckDefinition[] {
  return [...CORE_TOOL_NODE_PACKAGE_CHECKS]
}
