import { ApiError } from '../errors/api-error'

export const EDIT_REFERENCE_SIGNED_IN_PRIVATE_MEDIA_RUNTIME_PORT_VERSION =
  'edit-reference-signed-in-private-media-runtime-port-v1' as const

export interface EditReferenceSignedInPrivateMediaRuntimePort {
  readonly schemaVersion:
    typeof EDIT_REFERENCE_SIGNED_IN_PRIVATE_MEDIA_RUNTIME_PORT_VERSION
  readonly authorityClass: 'signed_in_private_edit_reference_media'
  readonly sourceAuthority: 'restart_safe_private_upload_media_authority'
  readonly evidenceClass: 'isolated_local_signed_in_private_media_unreleased'
  readonly endpointOrigin: 'http://127.0.0.1:57431'
  readonly authenticatedUserJwtRequired: true
  readonly workspaceAuthorizationSource: 'authenticated_user_rls'
  readonly storageAuthority: 'private_local_storage_adapter'
  readonly finalizationAuthority: 'private_local_single_host'
  readonly rawCredentialPersistedOrProjected: false
  readonly createsSecondUploadStoreOrTargetAuthority: false
  readonly resumableMultiReplicaTransferVerified: false
  readonly distributedFinalizationVerified: false
  readonly remoteMutationAllowed: false
  readonly productionAuthority: false
}

const processBrands = new WeakSet<object>()

export function createEditReferenceSignedInPrivateMediaRuntimePort(input: {
  readonly endpointOrigin: string
}): EditReferenceSignedInPrivateMediaRuntimePort {
  if (input.endpointOrigin !== 'http://127.0.0.1:57431') {
    throw unavailable('signed_in_private_media_origin_not_canonical_loopback')
  }
  const port: EditReferenceSignedInPrivateMediaRuntimePort = Object.freeze({
    schemaVersion: EDIT_REFERENCE_SIGNED_IN_PRIVATE_MEDIA_RUNTIME_PORT_VERSION,
    authorityClass: 'signed_in_private_edit_reference_media' as const,
    sourceAuthority: 'restart_safe_private_upload_media_authority' as const,
    evidenceClass: 'isolated_local_signed_in_private_media_unreleased' as const,
    endpointOrigin: 'http://127.0.0.1:57431' as const,
    authenticatedUserJwtRequired: true as const,
    workspaceAuthorizationSource: 'authenticated_user_rls' as const,
    storageAuthority: 'private_local_storage_adapter' as const,
    finalizationAuthority: 'private_local_single_host' as const,
    rawCredentialPersistedOrProjected: false as const,
    createsSecondUploadStoreOrTargetAuthority: false as const,
    resumableMultiReplicaTransferVerified: false as const,
    distributedFinalizationVerified: false as const,
    remoteMutationAllowed: false as const,
    productionAuthority: false as const,
  })
  processBrands.add(port)
  return port
}

export function assertEditReferenceSignedInPrivateMediaRuntimePort(
  port: EditReferenceSignedInPrivateMediaRuntimePort,
): void {
  if (
    !processBrands.has(port)
    || port.schemaVersion !== EDIT_REFERENCE_SIGNED_IN_PRIVATE_MEDIA_RUNTIME_PORT_VERSION
    || port.authorityClass !== 'signed_in_private_edit_reference_media'
    || port.sourceAuthority !== 'restart_safe_private_upload_media_authority'
    || port.evidenceClass !== 'isolated_local_signed_in_private_media_unreleased'
    || port.endpointOrigin !== 'http://127.0.0.1:57431'
    || port.authenticatedUserJwtRequired !== true
    || port.workspaceAuthorizationSource !== 'authenticated_user_rls'
    || port.storageAuthority !== 'private_local_storage_adapter'
    || port.finalizationAuthority !== 'private_local_single_host'
    || port.rawCredentialPersistedOrProjected !== false
    || port.createsSecondUploadStoreOrTargetAuthority !== false
    || port.resumableMultiReplicaTransferVerified !== false
    || port.distributedFinalizationVerified !== false
    || port.remoteMutationAllowed !== false
    || port.productionAuthority !== false
  ) {
    throw unavailable('signed_in_private_media_runtime_port_invalid')
  }
}

function unavailable(reason: string): ApiError {
  return new ApiError(
    'EDIT_REFERENCE_PERSISTENCE_BLOCKED',
    'The signed-in private Edit Reference media runtime is unavailable or unsafe.',
    503,
    {
      reason,
      requiredGate: 'signed_in_private_edit_reference_media',
      remoteMutationAttempted: false,
      productionReady: false,
    },
  )
}
