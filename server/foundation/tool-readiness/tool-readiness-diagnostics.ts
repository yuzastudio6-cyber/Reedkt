import {
  HEAVY_TOOL_FAMILIES,
  REQUIRED_TOOL_IDS,
  TOOL_READINESS_POLICY,
} from "./tool-readiness-policy.js";
import {
  getMissingRequiredToolIds,
  listToolReadinessEntries,
} from "./tool-readiness-registry.js";
import {
  isToolReadinessState,
  type ToolReadinessDiagnosticCheck,
  type ToolReadinessDiagnosticsSummary,
  type ToolRuntimeRequirement,
} from "./tool-readiness-types.js";

function pass(id: string, message: string, details?: Record<string, unknown>): ToolReadinessDiagnosticCheck {
  return { id, status: "passed", message, details };
}

function fail(id: string, message: string, details?: Record<string, unknown>): ToolReadinessDiagnosticCheck {
  return { id, status: "failed", message, details };
}

function warning(
  id: string,
  message: string,
  details?: Record<string, unknown>,
): ToolReadinessDiagnosticCheck {
  return { id, status: "warning", message, details };
}

function hasBlockedState(tool: ToolRuntimeRequirement): boolean {
  return (
    tool.readinessState === "not_configured" ||
    tool.readinessState === "disabled" ||
    tool.readinessState === "blocked_missing_runtime" ||
    tool.readinessState === "blocked_missing_approval" ||
    tool.readinessState === "blocked_missing_secret" ||
    tool.readinessState === "blocked_by_policy" ||
    tool.readinessState === "never_public"
  );
}

export function runToolReadinessDiagnostics(
  entries: ToolRuntimeRequirement[] = listToolReadinessEntries(),
): ToolReadinessDiagnosticsSummary {
  const checks: ToolReadinessDiagnosticCheck[] = [];
  const toolIds = new Set(entries.map((entry) => entry.toolId));
  const missingRequiredToolIds = getMissingRequiredToolIds();

  checks.push(
    entries.length > 0
      ? pass("tool_registry_loads", "Tool readiness registry loads.", { registrySize: entries.length })
      : fail("tool_registry_loads", "Tool readiness registry is empty."),
  );

  checks.push(
    missingRequiredToolIds.length === 0
      ? pass("known_tools_present", "Required Prompt 13 tool ids are present.")
      : fail("known_tools_present", "Required Prompt 13 tool ids are missing.", {
          missingRequiredToolIds,
        }),
  );

  const invalidStateTools = entries.filter((entry) => !isToolReadinessState(entry.readinessState));
  checks.push(
    invalidStateTools.length === 0
      ? pass("readiness_states_explicit", "Every tool has an explicit valid readiness state.")
      : fail("readiness_states_explicit", "Some tools have invalid readiness states.", {
          invalidToolIds: invalidStateTools.map((tool) => tool.toolId),
        }),
  );

  const blockedWithoutReason = entries.filter(
    (entry) => hasBlockedState(entry) && !entry.blockedReason?.trim(),
  );
  checks.push(
    blockedWithoutReason.length === 0
      ? pass("blocked_tools_have_reasons", "Every blocked tool includes a blocked reason.")
      : fail("blocked_tools_have_reasons", "Some blocked tools do not include a blocked reason.", {
          toolIds: blockedWithoutReason.map((tool) => tool.toolId),
        }),
  );

  const productionEnabled = entries.filter((entry) => entry.productionAllowed);
  const externalBetaEnabled = entries.filter((entry) => entry.externalBetaAllowed);
  const broadRealMediaEnabled = entries.filter((entry) => entry.broadRealMediaAllowed);
  checks.push(
    productionEnabled.length === 0
      ? pass("production_disabled", "No tool is production-enabled.")
      : fail("production_disabled", "Some tools are production-enabled.", {
          toolIds: productionEnabled.map((tool) => tool.toolId),
        }),
  );
  checks.push(
    externalBetaEnabled.length === 0
      ? pass("external_beta_disabled", "No tool is external-beta-enabled.")
      : fail("external_beta_disabled", "Some tools are external-beta-enabled.", {
          toolIds: externalBetaEnabled.map((tool) => tool.toolId),
        }),
  );
  checks.push(
    broadRealMediaEnabled.length === 0
      ? pass("broad_real_media_disabled", "No tool is broad-real-media-enabled.")
      : fail("broad_real_media_disabled", "Some tools are broad-real-media-enabled.", {
          toolIds: broadRealMediaEnabled.map((tool) => tool.toolId),
        }),
  );

  const signedUrlTools = entries.filter((entry) => entry.requiresSignedUrl);
  checks.push(
    signedUrlTools.length === 0
      ? pass("signed_url_source_of_truth_disabled", "No tool requires signed URLs as source of truth.")
      : fail("signed_url_source_of_truth_disabled", "Some tools require signed URLs.", {
          toolIds: signedUrlTools.map((tool) => tool.toolId),
        }),
  );

  const frontendHeavyTools = entries.filter(
    (entry) =>
      entry.requiresFrontendExecution &&
      HEAVY_TOOL_FAMILIES.includes(entry.family as (typeof HEAVY_TOOL_FAMILIES)[number]),
  );
  checks.push(
    frontendHeavyTools.length === 0
      ? pass("heavy_tools_not_frontend_executed", "No heavy tool requires frontend execution.")
      : fail("heavy_tools_not_frontend_executed", "Heavy tools are marked for frontend execution.", {
          toolIds: frontendHeavyTools.map((tool) => tool.toolId),
        }),
  );

  const providerEnabled = entries.filter(
    (entry) => entry.requiresProvider && entry.allowedInRuntime && entry.readinessState !== "disabled",
  );
  checks.push(
    providerEnabled.length === 0 && !TOOL_READINESS_POLICY.providerExecutionAllowed
      ? pass("provider_tools_disabled", "Provider execution is disabled.")
      : fail("provider_tools_disabled", "Provider execution is enabled or provider tools can run.", {
          toolIds: providerEnabled.map((tool) => tool.toolId),
        }),
  );

  const planningOnlyRuntimeTools = entries.filter(
    (entry) => entry.readinessState === "planning_only" && entry.allowedInRuntime,
  );
  checks.push(
    planningOnlyRuntimeTools.length === 0
      ? pass("planning_only_cannot_execute", "Planning-only tools cannot execute.")
      : fail("planning_only_cannot_execute", "Planning-only tools are runtime-enabled.", {
          toolIds: planningOnlyRuntimeTools.map((tool) => tool.toolId),
        }),
  );

  const runtimeAllowedTools = entries.filter((entry) => entry.allowedInRuntime);
  checks.push(
    runtimeAllowedTools.length === 0 && !TOOL_READINESS_POLICY.runtimeExecutionAllowed
      ? pass("runtime_execution_disabled", "Prompt 13 does not enable tool runtime execution.")
      : fail("runtime_execution_disabled", "One or more tools are runtime-enabled.", {
          toolIds: runtimeAllowedTools.map((tool) => tool.toolId),
        }),
  );

  const qwenVl = entries.find((entry) => entry.toolId === "qwen-vl");
  const vllm = entries.find((entry) => entry.toolId === "vllm");
  const vlmBlocked =
    qwenVl?.readinessState === "blocked_by_policy" &&
    vllm?.readinessState === "blocked_by_policy" &&
    !qwenVl.allowedInRuntime &&
    !vllm.allowedInRuntime;
  checks.push(
    vlmBlocked
      ? pass("vlm_excluded_or_blocked", "VLM tooling is blocked from runtime activation.")
      : fail("vlm_excluded_or_blocked", "VLM tooling is not explicitly blocked.", {
          qwenVlState: qwenVl?.readinessState,
          vllmState: vllm?.readinessState,
        }),
  );

  const demucs = entries.find((entry) => entry.toolId === "demucs");
  checks.push(
    demucs?.readinessState === "blocked_missing_approval" && !demucs.allowedInRuntime
      ? pass("demucs_runtime_blocked", "Demucs runtime is blocked until model provenance is approved.")
      : fail("demucs_runtime_blocked", "Demucs runtime is not safely blocked.", {
          demucsState: demucs?.readinessState,
        }),
  );

  const duplicateToolIds = entries
    .map((entry) => entry.toolId)
    .filter((toolId, index, allToolIds) => allToolIds.indexOf(toolId) !== index);
  checks.push(
    duplicateToolIds.length === 0
      ? pass("tool_ids_unique", "Tool ids are unique.")
      : fail("tool_ids_unique", "Duplicate tool ids exist.", { duplicateToolIds }),
  );

  const workerBoundaryWarnings = REQUIRED_TOOL_IDS.filter((toolId) => !toolIds.has(toolId));
  checks.push(
    workerBoundaryWarnings.length === 0
      ? pass("worker_boundary_registry_complete", "Worker boundary coverage includes required tools.")
      : warning("worker_boundary_registry_complete", "Some required tools are not in worker boundary coverage.", {
          toolIds: workerBoundaryWarnings,
        }),
  );

  const failedCheckIds = checks.filter((check) => check.status === "failed").map((check) => check.id);
  const warningCheckIds = checks.filter((check) => check.status === "warning").map((check) => check.id);

  return {
    status: failedCheckIds.length === 0 ? "passed" : "failed",
    checks,
    failedCheckIds,
    warningCheckIds,
    registrySize: entries.length,
  };
}
