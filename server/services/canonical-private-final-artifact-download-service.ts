import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import {
  canonicalPrivateFinalArtifactDownloadQuerySchema,
  type CanonicalPrivateFinalArtifactDownloadQuery,
} from '../validation/canonical-private-final-artifact-download-schemas'
import { verifyCanonicalPrivateFinalCompositionArtifact } from './canonical-private-final-artifact-verifier'
import { createPrivateArtifactQaAuthorityService } from './private-artifact-qa-authority-service'
import { sha256AuthorityValue } from './private-edit-authority-store'
import { getRequiredAuthUserId } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'

export function createCanonicalPrivateFinalArtifactDownloadService(context: ServiceContext) {
  return {
    async read(input: CanonicalPrivateFinalArtifactDownloadQuery & { artifactId: string }) {
      assertPrivateDownloadRuntime(context)
      const { artifactId, ...query } = input
      const parsed = canonicalPrivateFinalArtifactDownloadQuerySchema.safeParse(query)
      if (!parsed.success) {
        throw new ApiError('VALIDATION_FAILED', 'Private final download identity is invalid.', 400, parsed.error.flatten())
      }
      if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(artifactId) || artifactId.includes('..')) {
        throw new ApiError('VALIDATION_FAILED', 'Private final artifact identity is invalid.', 400)
      }
      const actor = getRequiredAuthUserId(context)
      const access = await authorizeWorkspaceAccess(context, parsed.data.workspaceId, 'read')
      if (actor !== access.userId) throw new ApiError('AUTH_REQUIRED', 'Private final download is outside this workspace.', 403)
      const authority = await createPrivateArtifactQaAuthorityService(context).readArtifactAuthority({
        workspaceId: access.workspaceId,
        projectId: parsed.data.projectId,
        editSessionId: parsed.data.editSessionId,
        snapshotId: parsed.data.snapshotId,
        jobId: parsed.data.jobId,
        expectedAssetId: parsed.data.expectedAssetId,
        artifactId,
        purpose: 'read_private_artifact_qa_authority',
      })
      const gateIds = new Set(authority.qaEvaluation?.gateResults.map((gate) => gate.gateId) ?? [])
      if (
        authority.qaEvaluation?.outcome !== 'passed' ||
        !gateIds.has('asset_received_gate') || !gateIds.has('asset_quality_gate') ||
        !gateIds.has('render_preflight_gate') || !gateIds.has('final_qa_gate') ||
        authority.reconciliation?.decision !== 'test_merged_not_live_authorized' ||
        !authority.reconciliation.privateTestDependencySatisfied ||
        authority.reconciliation.liveRuntimeDependencySatisfied !== false ||
        authority.liveRuntimeEligible !== false
      ) throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Private final artifact has not passed exact final delivery QA.', 409)
      const verified = await verifyCanonicalPrivateFinalCompositionArtifact({
        localStorageRoot: context.env.localStorageRoot,
        artifact: authority.artifact,
      })
      const fileName = `reeditpro-private-final-${authority.artifact.artifactId}.mp4`
      return {
        schemaVersion: 'canonical-private-final-artifact-download-v1' as const,
        source: 'canonical_private_final_artifact_download_service' as const,
        artifactId: authority.artifact.artifactId,
        expectedAssetId: authority.artifact.identity.expectedAssetId,
        mimeType: 'video/mp4' as const,
        fileName,
        byteSize: verified.byteLength,
        sha256: verified.sha256,
        bytes: verified.bytes,
        downloadEvidenceHash: sha256AuthorityValue({
          workspaceId: access.workspaceId,
          projectId: parsed.data.projectId,
          snapshotId: parsed.data.snapshotId,
          jobId: parsed.data.jobId,
          artifactId: authority.artifact.artifactId,
          qaEvaluationId: authority.qaEvaluation.qaEvaluationId,
          reconciliationId: authority.reconciliation.reconciliationId,
          semanticReportHash: verified.semanticReportHash,
        }),
        privateInternalOnly: true as const,
        publicUrlCreated: false as const,
        signedUrlCreated: false as const,
        billingMutationPerformed: false as const,
        settlementPerformed: false as const,
        testOnly: true as const,
      }
    },
  }
}

function assertPrivateDownloadRuntime(context: ServiceContext): void {
  if (
    context.env.nodeEnv === 'production' ||
    (context.env.mode !== 'local' && context.env.mode !== 'mock') ||
    (!context.env.mockOnly && !context.env.allowInternalTestExecutionWithSupabase)
  ) throw new ApiError('TOOL_NOT_READY', 'Canonical final download is private-internal testing only.', 503)
}
