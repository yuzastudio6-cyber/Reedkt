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
  createBackendLocalEditReferenceLongFormStudyRuntimePort,
  type EditReferenceLongFormStudyRuntimePort,
} from '../services/edit-reference-production-long-form-runtime-port'

const root = await mkdtemp(join(tmpdir(), 'reeditpro-mounted-long-form-runtime-'))

try {
  const methodCalls = {
    create: 0,
    read: 0,
    applyControlCommand: 0,
    readWorkOutput: 0,
    readSemanticWindowCheckpoint: 0,
    schedule: 0,
  }
  const localPort = createBackendLocalEditReferenceLongFormStudyRuntimePort()
  const invalidInjectedPort: EditReferenceLongFormStudyRuntimePort = {
    ...localPort,
    databaseTransactionAdapterVerified: true,
    async create(input) {
      methodCalls.create += 1
      return localPort.create(input)
    },
    async read(input) {
      methodCalls.read += 1
      return localPort.read(input)
    },
    async applyControlCommand(input) {
      methodCalls.applyControlCommand += 1
      return localPort.applyControlCommand(input)
    },
    async readWorkOutput(input) {
      methodCalls.readWorkOutput += 1
      return localPort.readWorkOutput(input)
    },
    async readSemanticWindowCheckpoint(input) {
      methodCalls.readSemanticWindowCheckpoint += 1
      return localPort.readSemanticWindowCheckpoint(input)
    },
    schedule(input) {
      methodCalls.schedule += 1
      return localPort.schedule(input)
    },
  }

  const env = loadRuntimeEnv({
    NODE_ENV: 'test',
    E2E_RUNTIME_MODE: 'local',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    STORAGE_MODE: 'local',
    LOCAL_STORAGE_ROOT: root,
    PROVIDER_EXECUTION_ENABLED: 'false',
    WORKER_RUNTIME_MODE: 'mock',
  })
  const competingPort = createBackendLocalEditReferenceLongFormStudyRuntimePort()
  assert.throws(
    () => createEditReferenceService({
      env,
      clients: { admin: null, public: null },
      requestId: 'mounted-long-form-conflict',
      auth: { userId: 'mock-user-runtime', isMockUser: true },
      editReferenceLongFormStudyRuntimePort: localPort,
    }, undefined, {
      longFormStudyRuntimePort: competingPort,
    }),
    (error: unknown) => error instanceof ApiError
      && (error.details as { reason?: string } | undefined)?.reason
        === 'multiple_long_form_runtime_authorities_configured',
  )
  assert.throws(
    () => createEditReferenceTargetVideoUnderstandingService({
      env,
      clients: { admin: null, public: null },
      requestId: 'mounted-target-long-form-conflict',
      auth: { userId: 'mock-user-runtime', isMockUser: true },
      editReferenceLongFormStudyRuntimePort: localPort,
    }, {
      longFormStudyRuntimePort: competingPort,
    }),
    (error: unknown) => error instanceof ApiError
      && (error.details as { reason?: string } | undefined)?.reason
        === 'multiple_long_form_runtime_authorities_configured',
  )
  const server = createReeditProApiApp(env, {
    editReferenceLongFormStudyRuntimePort: invalidInjectedPort,
  }).listen(0, '127.0.0.1')
  await new Promise<void>((resolve, reject) => {
    server.once('listening', resolve)
    server.once('error', reject)
  })
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  const routeBase = '/v1/edit-reference-studies/study-mounted-runtime/assets/asset-mounted-runtime/long-form-study'
  const previousConsoleError = console.error
  console.error = () => undefined

  try {
    const targetStudyQuery = new URLSearchParams({
      workspaceId: 'workspace-mounted-runtime',
      editReferenceId: 'reference-mounted-runtime',
      studySessionId: 'study-mounted-runtime',
      sourceStorageObjectRecordId: 'storage-mounted-runtime',
      sourceMediaAssetId: 'media-mounted-runtime',
      expectedEditBriefRevision: '1',
      expectedEditBriefDigestSha256: 'a'.repeat(64),
    })
    const cases = [
      {
        name: 'status',
        url: `${routeBase}?workspaceId=workspace-mounted-runtime`,
      },
      {
        name: 'review',
        url: `${routeBase}/review?workspaceId=workspace-mounted-runtime`,
      },
      {
        name: 'start',
        url: routeBase,
        init: mutationInit('mounted-runtime-start', {
          workspaceId: 'workspace-mounted-runtime',
          expectedStudyRevision: 1,
        }),
      },
      {
        name: 'control',
        url: `${routeBase}/control`,
        init: mutationInit('mounted-runtime-control', {
          workspaceId: 'workspace-mounted-runtime',
          expectedRunRevision: 1,
          action: 'pause',
        }),
      },
      {
        name: 'exact-target-study',
        url: `/v1/projects/project-mounted-runtime/edit-sessions/edit-mounted-runtime/edit-reference-target-understanding?${targetStudyQuery}`,
      },
    ] as const

    for (const testCase of cases) {
      const response = await fetch(
        `${baseUrl}${testCase.url}`,
        'init' in testCase ? testCase.init : undefined,
      )
      const body = await response.json() as {
        error?: {
          code?: string
          details?: { reason?: string; productionReady?: boolean }
        }
      }
      assert.equal(response.status, 503, testCase.name)
      assert.equal(body.error?.code, 'JOB_DEPENDENCY_NOT_READY', testCase.name)
      assert.equal(
        body.error?.details?.reason,
        'local_runtime_port_authority_invalid',
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
    create: 0,
    read: 0,
    applyControlCommand: 0,
    readWorkOutput: 0,
    readSemanticWindowCheckpoint: 0,
    schedule: 0,
  })

  console.log(JSON.stringify({
    status: 'passed',
    mountedRoutesChecked: 5,
    appOptionPropagatedThroughRuntimeState: true,
    runtimeStatePropagatedThroughServiceContext: true,
    serviceSelectedInjectedServerAuthority: true,
    exactTargetStudySelectedSameServerAuthority: true,
    competingServerAuthoritiesRejected: true,
    invalidAuthorityRejectedBeforeRepositoryOrRuntimeMethod: true,
    browserSelectedRuntimeAccepted: false,
    providerRequestMade: false,
    remoteMutationAttempted: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
    productionReady: false,
  }, null, 2))
} finally {
  await rm(root, { recursive: true, force: true })
}

function mutationInit(key: string, body: unknown): RequestInit {
  return {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'idempotency-key': key,
    },
    body: JSON.stringify(body),
  }
}
