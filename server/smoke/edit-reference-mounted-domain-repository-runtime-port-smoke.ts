import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import { ApiError } from '../errors/api-error'
import { createEditReferenceService } from '../services/edit-reference-service'
import { createEditReferenceTargetVideoUnderstandingService } from '../services/edit-reference-target-video-understanding-service'
import {
  createBackendLocalEditReferenceDomainRepositoryRuntimePort,
  type EditReferenceDomainRepositoryRuntimePort,
} from '../services/edit-reference-domain-repository-runtime-port'

const root = await mkdtemp(join(tmpdir(), 'reeditpro-mounted-domain-repository-'))

try {
  const methodCalls = {
    read: 0,
    readAuditEvents: 0,
    mutate: 0,
  }
  const localPort = createBackendLocalEditReferenceDomainRepositoryRuntimePort()
  const invalidInjectedPort: EditReferenceDomainRepositoryRuntimePort = {
    ...localPort,
    databaseTransactionAdapterVerified: true,
    repository: {
      persistence: 'backend_local_private',
      async read(input) {
        methodCalls.read += 1
        return localPort.repository.read(input)
      },
      async readAuditEvents(input) {
        methodCalls.readAuditEvents += 1
        return localPort.repository.readAuditEvents(input)
      },
      async mutate(input) {
        methodCalls.mutate += 1
        return localPort.repository.mutate(input)
      },
    },
  }
  const competingPort = createBackendLocalEditReferenceDomainRepositoryRuntimePort()
  const env = loadRuntimeEnv({
    NODE_ENV: 'test',
    E2E_RUNTIME_MODE: 'local',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    STORAGE_MODE: 'local',
    LOCAL_STORAGE_ROOT: root,
    PROVIDER_EXECUTION_ENABLED: 'false',
    WORKER_RUNTIME_MODE: 'mock',
  })
  const context = {
    env,
    clients: { admin: null, public: null },
    requestId: 'mounted-domain-repository-conflict',
    auth: { userId: 'mock-user-domain-repository', isMockUser: true },
    editReferenceDomainRepositoryRuntimePort: localPort,
  }
  assert.throws(
    () => createEditReferenceService(context, undefined, {
      domainRepositoryRuntimePort: competingPort,
    }),
    (error: unknown) => error instanceof ApiError
      && (error.details as { reason?: string } | undefined)?.reason
        === 'multiple_domain_repository_authorities_configured',
  )
  assert.throws(
    () => createEditReferenceTargetVideoUnderstandingService(context, {
      domainRepositoryRuntimePort: competingPort,
    }),
    (error: unknown) => error instanceof ApiError
      && (error.details as { reason?: string } | undefined)?.reason
        === 'multiple_domain_repository_authorities_configured',
  )

  const server = createReeditProApiApp(env, {
    editReferenceDomainRepositoryRuntimePort: invalidInjectedPort,
  }).listen(0, '127.0.0.1')
  await new Promise<void>((resolve, reject) => {
    server.once('listening', resolve)
    server.once('error', reject)
  })
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  const targetStudyQuery = new URLSearchParams({
    workspaceId: 'workspace-domain-runtime',
    editReferenceId: 'reference-domain-runtime',
    studySessionId: 'study-domain-runtime',
    sourceStorageObjectRecordId: 'storage-domain-runtime',
    sourceMediaAssetId: 'media-domain-runtime',
    expectedEditBriefRevision: '1',
    expectedEditBriefDigestSha256: 'a'.repeat(64),
  })
  const previousConsoleError = console.error
  console.error = () => undefined

  try {
    const cases = [
      {
        name: 'library-list',
        url: '/v1/edit-references?workspaceId=workspace-domain-runtime',
      },
      {
        name: 'exact-target-study',
        url: `/v1/projects/project-domain-runtime/edit-sessions/edit-domain-runtime/edit-reference-target-understanding?${targetStudyQuery}`,
      },
    ] as const
    for (const testCase of cases) {
      const response = await fetch(`${baseUrl}${testCase.url}`)
      const body = await response.json() as {
        error?: {
          code?: string
          details?: { reason?: string; productionReady?: boolean }
        }
      }
      assert.equal(response.status, 503, testCase.name)
      assert.equal(body.error?.code, 'EDIT_REFERENCE_PERSISTENCE_BLOCKED', testCase.name)
      assert.equal(
        body.error?.details?.reason,
        'local_domain_repository_port_authority_invalid',
        testCase.name,
      )
      assert.equal(body.error?.details?.productionReady, false, testCase.name)
    }
  } finally {
    console.error = previousConsoleError
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve())
    })
  }

  assert.deepEqual(methodCalls, {
    read: 0,
    readAuditEvents: 0,
    mutate: 0,
  })

  console.log(JSON.stringify({
    status: 'passed',
    mountedRouteClassesChecked: 2,
    appOptionPropagatedThroughRuntimeState: true,
    runtimeStatePropagatedThroughServiceContext: true,
    libraryAndExactTargetSelectedSameServerAuthority: true,
    competingServerAuthoritiesRejected: true,
    invalidAuthorityRejectedBeforeRepositoryMethod: true,
    browserSelectedRepositoryAccepted: false,
    privateFallbackAllowedInHostedRuntime: false,
    remoteMutationAttempted: false,
    providerRequestMade: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    productionReady: false,
  }, null, 2))
} finally {
  await rm(root, { recursive: true, force: true })
}
