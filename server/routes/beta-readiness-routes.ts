import { Router } from 'express'
import { ApiError } from '../errors/api-error'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { buildBetaReadinessReport } from '../beta-readiness'
import { createBetaReadinessEvidenceService } from '../beta-readiness/beta-readiness-evidence-service'
import { buildCoreRealCheckEvidencePacket } from '../beta-readiness/core-real-check-evidence'
import { buildBetaPlatformEvidencePreflight } from '../beta-readiness/platform-evidence-preflight'
import {
  runBetaPlatformDeployedEvidenceVerifier,
  type BetaPlatformDeployedEvidenceProbeRunners,
  type BetaPlatformDeployedProbeResult,
} from '../beta-readiness/platform-deployed-evidence-verifier'
import {
  createBetaPlatformDeployedEvidenceProbeRunners,
  type BetaPlatformDeployedEvidenceObservation,
} from '../beta-readiness/platform-deployed-evidence-probes'
import {
  createBetaPlatformSupabaseDeployedEvidenceProbeTransport,
  type BetaPlatformSupabaseAttestedProbeId,
} from '../beta-readiness/platform-supabase-deployed-evidence-transport'
import { runBetaPlatformBillingQa } from '../beta-readiness/platform-billing-qa'
import { collectSecretLikePaths } from '../tool-cost-metering/secret-safety'
import {
  betaReadinessCoreRealCheckEvidenceSchema,
  betaReadinessEvidenceEvaluationSchema,
  betaReadinessEvidencePacketSchema,
  betaReadinessPlatformBillingQaSchema,
  betaReadinessPlatformDeployedEvidenceSchema,
  betaReadinessPlatformSupabaseDeployedProbeSchema,
  type BetaReadinessPlatformDeployedEvidenceBody,
  type BetaReadinessPlatformSupabaseDeployedProbeBody,
} from '../validation/beta-readiness-schemas'
import { validateBody } from '../validation/common-schemas'
import { asyncRoute, getIdempotencyKey, getServiceContext, sendOk } from './route-helpers'

export function createBetaReadinessRoutes(): Router {
  const router = Router()

  router.get('/v1/beta-readiness', requireAuth, asyncRoute(async (request, response) => {
    const workspaceId = stringQueryValue(request.query.workspaceId)
    if (!workspaceId) {
      sendOk(response, { report: buildBetaReadinessReport(), evidencePacketCount: 0 }, [
        'No workspaceId query supplied; returned default source-of-truth readiness report without stored evidence.',
      ])
      return
    }
    const result = await createBetaReadinessEvidenceService(getServiceContext(request)).getReport(workspaceId)
    sendOk(response, { report: result.report, evidencePacketCount: result.evidencePacketCount }, result.warnings)
  }))

  router.post('/v1/beta-readiness/evaluate', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(betaReadinessEvidenceEvaluationSchema, request.body)
    assertNoSecretLikeBetaReadinessEvidence(body)

    try {
      sendOk(response, {
        report: buildBetaReadinessReport({
          ...(body.baseline ?? {}),
          ...(body.approvals ?? {}),
          checklistEvidence: body.checklistEvidence,
          acceptedToolEvidence: body.acceptedToolEvidence,
          platformEvidence: body.platformEvidence,
        }),
      })
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiError('VALIDATION_FAILED', error.message, 400)
      }
      throw error
    }
  }))

  router.get('/v1/beta-readiness/evidence', requireAuth, asyncRoute(async (request, response) => {
    const workspaceId = stringQueryValue(request.query.workspaceId)
    if (!workspaceId) {
      throw new ApiError('VALIDATION_FAILED', 'workspaceId query parameter is required for beta readiness evidence readback.', 400)
    }
    const result = await createBetaReadinessEvidenceService(getServiceContext(request)).listEvidence(workspaceId)
    sendOk(response, {
      packets: result.packets,
      mergedEvidence: result.mergedEvidence,
      report: result.report,
    }, result.warnings)
  }))

  router.get('/v1/beta-readiness/platform-preflight', requireAuth, asyncRoute(async (request, response) => {
    const report = buildBetaPlatformEvidencePreflight(getServiceContext(request))
    sendOk(response, { report }, [
      'Read-only local platform evidence preflight; no evidence was recorded and no beta/production gate was opened.',
      ...report.missingEvidence.map((item) => `Missing platform evidence: ${item}`),
    ])
  }))

  router.post('/v1/beta-readiness/platform-billing-qa', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(betaReadinessPlatformBillingQaSchema, request.body)
    assertNoSecretLikeBetaReadinessEvidence(body)
    const report = await runBetaPlatformBillingQa(getServiceContext(request), body, getIdempotencyKey(request))
    sendOk(response, { report }, [
      'Platform billing QA ran only the tool-cost event/summary path; no media, provider, Stripe, wallet settlement, beta, or production action ran.',
      ...report.missingPlatformEvidence.map((item) => `Missing platform evidence: ${item}`),
    ])
  }))

  router.post('/v1/beta-readiness/platform-deployed-evidence/verify', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(betaReadinessPlatformDeployedEvidenceSchema, request.body)
    assertNoSecretLikeBetaReadinessEvidence(body)
    const context = getServiceContext(request)
    const report = await runBetaPlatformDeployedEvidenceVerifier(body, bodyToProbeRunners(body))

    if (body.recordEvidence === true) {
      if (body.confirmRecordEvidence !== true) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'confirmRecordEvidence=true is required before recording deployed platform evidence.',
          400,
        )
      }
      if (!report.evidencePacket) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'Deployed platform evidence cannot be recorded until every probe and owner approval passes.',
          400,
          {
            missingEvidence: report.missingEvidence,
            ownerApprovalGaps: report.ownerApprovalGaps,
          },
        )
      }

      const result = await createBetaReadinessEvidenceService(context).recordEvidence(
        report.evidencePacket,
        getIdempotencyKey(request),
      )
      sendOk(response, {
        report,
        packet: result.packet,
        replayed: result.replayed,
        storedReadinessReport: result.report,
      }, [
        ...report.warnings,
        ...result.warnings,
        'Deployed platform evidence was recorded only after every probe and owner approval passed.',
      ], result.replayed ? 200 : 201)
      return
    }

    sendOk(response, { report }, [
      ...report.warnings,
      'Verifier ran in report-only mode; no beta readiness evidence was recorded.',
    ])
  }))

  router.post('/v1/beta-readiness/platform-deployed-evidence/probe', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(betaReadinessPlatformSupabaseDeployedProbeSchema, request.body)
    assertNoSecretLikeBetaReadinessEvidence(body)
    const context = getServiceContext(request)
    const transport = createBetaPlatformSupabaseDeployedEvidenceProbeTransport({
      admin: context.clients.admin,
      workspaceId: body.workspaceId,
      projectId: body.projectId,
      sourceId: body.sourceId,
      sourceSha: body.sourceSha,
      idempotencyKey: getIdempotencyKey(request),
      allowPersistentProbeWrites: body.allowPersistentProbeWrites === true,
      walletSettlementProbeToolCostEventId: body.walletSettlementProbeToolCostEventId,
      attestations: bodyToAttestations(body),
    })
    const report = await runBetaPlatformDeployedEvidenceVerifier(
      body,
      createBetaPlatformDeployedEvidenceProbeRunners(transport),
    )

    if (body.recordEvidence === true) {
      if (body.confirmRecordEvidence !== true) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'confirmRecordEvidence=true is required before recording probed deployed platform evidence.',
          400,
        )
      }
      if (!report.evidencePacket) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'Probed deployed platform evidence cannot be recorded until every transport probe and owner approval passes.',
          400,
          {
            missingEvidence: report.missingEvidence,
            ownerApprovalGaps: report.ownerApprovalGaps,
          },
        )
      }

      const result = await createBetaReadinessEvidenceService(context).recordEvidence(
        report.evidencePacket,
        getIdempotencyKey(request),
      )
      sendOk(response, {
        report,
        packet: result.packet,
        replayed: result.replayed,
        storedReadinessReport: result.report,
      }, [
        ...report.warnings,
        ...result.warnings,
        'Supabase deployed probe transport recorded platform evidence only after every probe and owner approval passed.',
      ], result.replayed ? 200 : 201)
      return
    }

    sendOk(response, { report }, [
      ...report.warnings,
      'Supabase deployed probe transport ran in report-only mode; no beta readiness evidence was recorded.',
    ])
  }))

  router.post('/v1/beta-readiness/evidence', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(betaReadinessEvidencePacketSchema, request.body)
    assertNoSecretLikeBetaReadinessEvidence(body)
    const result = await createBetaReadinessEvidenceService(getServiceContext(request)).recordEvidence(body, getIdempotencyKey(request))
    sendOk(response, {
      packet: result.packet,
      replayed: result.replayed,
      report: result.report,
    }, result.warnings, result.replayed ? 200 : 201)
  }))

  router.post('/v1/beta-readiness/evidence/core-real-check', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(betaReadinessCoreRealCheckEvidenceSchema, request.body)
    assertNoSecretLikeBetaReadinessEvidence(body)
    const evidence = buildCoreRealCheckEvidencePacket(body)
    const result = await createBetaReadinessEvidenceService(getServiceContext(request)).recordEvidence(
      evidence.evidencePacket,
      getIdempotencyKey(request),
    )
    sendOk(response, {
      packet: result.packet,
      replayed: result.replayed,
      acceptedToolEvidence: evidence.acceptedToolEvidence,
      skippedToolResults: evidence.skippedToolResults,
      readinessSummary: evidence.readinessResult.summary,
      report: result.report,
    }, [
      ...result.warnings,
      'Core real-check evidence ran bounded command/import/package metadata checks only; no media processing, provider calls, Docker, render/export, beta activation, or production enablement occurred.',
    ], result.replayed ? 200 : 201)
  }))

  return router
}

function stringQueryValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function assertNoSecretLikeBetaReadinessEvidence(value: unknown): void {
  const secretPaths = collectSecretLikePaths(value, 'betaReadinessEvidence')
    .filter((path) => path !== 'betaReadinessEvidence.platformEvidence.serviceRoleWritePathVerified')
    .filter((path) => path !== 'betaReadinessEvidence.ownerApprovals.billingOwnerStripeBoundaryApproved')
  if (secretPaths.length > 0) {
    throw new ApiError('VALIDATION_FAILED', `Beta readiness evidence contains secret-like fields: ${secretPaths.join(', ')}`, 400)
  }
}

function bodyToProbeRunners(
  body: BetaReadinessPlatformDeployedEvidenceBody,
): BetaPlatformDeployedEvidenceProbeRunners {
  const probes = new Map<string, BetaPlatformDeployedProbeResult>()
  for (const probe of body.probes) {
    if (probes.has(probe.id)) {
      throw new ApiError('VALIDATION_FAILED', `Duplicate deployed platform evidence probe: ${probe.id}.`, 400)
    }
    probes.set(probe.id, probe)
  }
  return Object.fromEntries([...probes].map(([id, result]) => [id, () => result]))
}

function bodyToAttestations(
  body: BetaReadinessPlatformSupabaseDeployedProbeBody,
): Partial<Record<BetaPlatformSupabaseAttestedProbeId, BetaPlatformDeployedEvidenceObservation>> {
  const attestations = new Map<BetaPlatformSupabaseAttestedProbeId, BetaPlatformDeployedEvidenceObservation>()
  for (const probe of body.attestedProbes ?? []) {
    if (attestations.has(probe.id)) {
      throw new ApiError('VALIDATION_FAILED', `Duplicate attested deployed platform probe: ${probe.id}.`, 400)
    }
    attestations.set(probe.id, {
      ok: probe.status === 'passed',
      evidence: probe.evidence,
      nextAction: probe.nextAction,
    })
  }
  return Object.fromEntries(attestations)
}
