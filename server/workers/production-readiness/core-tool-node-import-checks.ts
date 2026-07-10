import type { ProductionToolId } from '../../tool-registry'

export interface CoreToolNodePackageCheckDefinition {
  toolId: Extract<ProductionToolId, 'sharp' | 'remotion' | 'hyperframe'>
  checkName: string
  packageName: string
  packageJsonPath: string
  sourcePath?: string
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
  {
    toolId: 'hyperframe',
    checkName: 'source_metadata_hyperframe_bridge',
    packageName: 'Hyperframe metadata boundary',
    packageJsonPath: '',
    sourcePath: 'server/workers/timeline/hyperframe-timeline-bridge.ts',
    optional: true,
    metadataOnly: true,
    notes: ['Hyperframe remains a timeline/preview boundary; prove internal bridge source instead of importing browser runtime or a package.'],
  },
]

export function listCoreToolNodePackageChecks(): CoreToolNodePackageCheckDefinition[] {
  return [...CORE_TOOL_NODE_PACKAGE_CHECKS]
}
