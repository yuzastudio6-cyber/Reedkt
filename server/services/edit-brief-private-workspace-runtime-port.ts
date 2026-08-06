import { ApiError } from '../errors/api-error'

export const EDIT_BRIEF_PRIVATE_WORKSPACE_RUNTIME_PORT_VERSION =
  'edit-brief-private-workspace-runtime-port-v1' as const

export interface EditBriefPrivateWorkspaceRuntimePort {
  readonly schemaVersion: typeof EDIT_BRIEF_PRIVATE_WORKSPACE_RUNTIME_PORT_VERSION
  readonly authorityClass: 'private_workspace_edit_brief'
  readonly sourceAuthority: 'private_edit_brief_authority_store'
  readonly evidenceClass: 'loopback_single_host_private_test'
  readonly storageAuthority: 'symlink_safe_private_single_host'
  readonly mockUserRequired: true
  readonly bearerCredentialAccepted: false
  readonly remoteMutationAllowed: false
  readonly multiReplicaPersistenceVerified: false
  readonly productionAuthority: false
}

const processBrands = new WeakSet<object>()

export function createEditBriefPrivateWorkspaceRuntimePort():
EditBriefPrivateWorkspaceRuntimePort {
  const port: EditBriefPrivateWorkspaceRuntimePort = Object.freeze({
    schemaVersion: EDIT_BRIEF_PRIVATE_WORKSPACE_RUNTIME_PORT_VERSION,
    authorityClass: 'private_workspace_edit_brief' as const,
    sourceAuthority: 'private_edit_brief_authority_store' as const,
    evidenceClass: 'loopback_single_host_private_test' as const,
    storageAuthority: 'symlink_safe_private_single_host' as const,
    mockUserRequired: true as const,
    bearerCredentialAccepted: false as const,
    remoteMutationAllowed: false as const,
    multiReplicaPersistenceVerified: false as const,
    productionAuthority: false as const,
  })
  processBrands.add(port)
  return port
}

export function assertEditBriefPrivateWorkspaceRuntimePort(
  port: EditBriefPrivateWorkspaceRuntimePort,
): void {
  if (
    !processBrands.has(port)
    || port.schemaVersion !== EDIT_BRIEF_PRIVATE_WORKSPACE_RUNTIME_PORT_VERSION
    || port.authorityClass !== 'private_workspace_edit_brief'
    || port.sourceAuthority !== 'private_edit_brief_authority_store'
    || port.evidenceClass !== 'loopback_single_host_private_test'
    || port.storageAuthority !== 'symlink_safe_private_single_host'
    || port.mockUserRequired !== true
    || port.bearerCredentialAccepted !== false
    || port.remoteMutationAllowed !== false
    || port.multiReplicaPersistenceVerified !== false
    || port.productionAuthority !== false
  ) {
    throw unavailable('private_workspace_edit_brief_runtime_port_invalid')
  }
}

function unavailable(reason: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'The private Edit Brief workspace runtime is unavailable or unsafe.',
    503,
    {
      reason,
      remoteMutationAttempted: false,
      productionReady: false,
    },
  )
}
