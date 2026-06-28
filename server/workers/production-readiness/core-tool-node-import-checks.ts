import type { ProductionToolId } from '../../tool-registry'
import type { ProductionReadinessStatus } from './production-tool-readiness-types'

export interface CoreToolNodePackageCheckDefinition {
  toolId: Extract<ProductionToolId, 'sharp' | 'remotion' | 'hyperframe'>
  checkName: string
  packageName: string
  packageJsonPath: string
  optional: boolean
  metadataOnly: boolean
  internalBoundary?: boolean
  boundaryStatus?: ProductionReadinessStatus
  boundaryMessage?: string
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
  {
    toolId: 'hyperframe',
    checkName: 'node_package_metadata_hyperframe',
    packageName: 'hyperframe',
    packageJsonPath: 'hyperframe/package.json',
    optional: true,
    metadataOnly: true,
    internalBoundary: true,
    boundaryStatus: 'warning',
    boundaryMessage: 'Hyperframe is an internal timeline/preview boundary; no literal npm package metadata is required until a package or implementation is approved.',
    notes: ['Hyperframe remains a timeline/preview boundary; do not import browser runtime or install guessed package names.'],
  },
]

export function listCoreToolNodePackageChecks(): CoreToolNodePackageCheckDefinition[] {
  return [...CORE_TOOL_NODE_PACKAGE_CHECKS]
}
