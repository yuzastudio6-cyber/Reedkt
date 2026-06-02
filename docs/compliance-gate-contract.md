# Compliance Gate Contract

Future tool/provider/worker/render/runtime milestones must pass these gates before execution.

| Gate | Purpose | Pass condition | Fail status |
| --- | --- | --- | --- |
| AuthGate | Confirm authenticated caller. | Valid auth context. | `auth_required` |
| WorkspaceGate | Scope review to workspace. | Workspace/member access exists. | `workspace_access_denied` |
| ProjectAccessGate | Scope project review. | Project membership passes. | `project_access_denied` |
| ToolReadinessGate | Check static tool readiness. | Tool is registered and allowed for the requested planning/readiness mode. | `blocked` |
| ToolLicenseReviewGate | Require human tool license review. | Non-expired approved review record. | `backend_required` |
| ToolSecurityReviewGate | Require tool security review. | Non-expired approved review record. | `backend_required` |
| ToolRuntimeIsolationGate | Require worker/runtime isolation evidence. | Approved worker/runtime profile. | `backend_required` |
| DependencyReviewGate | Check dependency evidence. | Reviewed package and transitive dependency record. | `backend_required` |
| PackageLockReviewGate | Ensure lockfile review. | Review references exact lockfile version. | `backend_required` |
| VulnerabilityReviewGate | Review audit output. | Vulnerabilities are accepted, fixed in a scoped prompt, or blocked. | `backend_required` |
| ProviderTermsReviewGate | Check provider terms. | Human provider terms review exists. | `backend_required` |
| ProviderSecretBoundaryGate | Keep secrets backend-only. | Secret references only; no secret value exposure. | `blocked` |
| ModelProvenanceGate | Verify model/source provenance. | Approved model/provenance record. | `backend_required` |
| ModelLicenseGate | Verify model/checkpoint license. | Human approval and evidence. | `backend_required` |
| BuildConfigGate | Review build flags. | Approved flags and dependency variants. | `backend_required` |
| CodecPatentReviewGate | Review codec/patent risk. | Human review and allowed scope. | `backend_required` |
| WorkerImageReviewGate | Review worker image. | Built image has evidence, SBOM, and approval. | `backend_required` |
| DataPrivacyGate | Protect user/private data. | Privacy and retention controls approved. | `backend_required` |
| AuditLoggingGate | Require append-only audit. | Sanitized audit event path exists. | `backend_required` |
| AbusePreventionGate | Control unsafe use. | Abuse limits and review exist. | `backend_required` |
| CostControlGate | Prevent uncontrolled spend. | Credit/cost controls exist. | `backend_required` |
| ProductionUnlockGate | Stop launch without approvals. | All gates pass with human approval. | `blocked` |
| ExpirationRevalidationGate | Revalidate expired approvals. | Approval is not expired. | `blocked` |

User-facing messages should be concise blocker summaries and must not imply legal approval or production readiness.
