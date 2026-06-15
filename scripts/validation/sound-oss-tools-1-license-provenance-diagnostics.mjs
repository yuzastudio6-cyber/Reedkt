#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const REQUIRED_FILES = [
  "docs/sound-music-audio-open-source-tool-license-provenance-approval.md",
  "docs/sound-music-audio-open-source-tool-install-eligibility-report.md",
  "docs/sound-music-audio-open-source-tool-license-risk-register.md",
  "docs/sound-music-audio-open-source-tool-approved-install-plan-subset.md",
  "docs/sound-music-audio-open-source-tool-license-blocked-deferred-register.md",
  "docs/sound-oss-tools-1-license-provenance-validation-results.md",
  "docs/implementation-prompts/prompt-sound-oss-tools-2-approved-install-plan.md",
  "docs/sound-music-audio-open-source-tool-candidate-matrix.md",
  "docs/cross-chat-tool-ownership-registry.md",
  "docs/sound-music-audio-cross-chat-duplicate-risk-register.md",
  "package.json"
];

const BLOCKS = {
  approval: {
    file: "docs/sound-music-audio-open-source-tool-license-provenance-approval.md",
    label: "sound-oss-tools-1-license-provenance-approval"
  },
  eligibility: {
    file: "docs/sound-music-audio-open-source-tool-install-eligibility-report.md",
    label: "sound-oss-tools-1-install-eligibility-report"
  },
  risk: {
    file: "docs/sound-music-audio-open-source-tool-license-risk-register.md",
    label: "sound-oss-tools-1-license-risk-register"
  },
  approvedSubset: {
    file: "docs/sound-music-audio-open-source-tool-approved-install-plan-subset.md",
    label: "sound-oss-tools-1-approved-install-plan-subset"
  },
  blockedDeferred: {
    file: "docs/sound-music-audio-open-source-tool-license-blocked-deferred-register.md",
    label: "sound-oss-tools-1-license-blocked-deferred-register"
  },
  validation: {
    file: "docs/sound-oss-tools-1-license-provenance-validation-results.md",
    label: "sound-oss-tools-1-validation-results"
  }
};

const ALLOWED_DECISIONS = new Set([
  "approved_for_install_plan",
  "approved_for_reference_only",
  "approved_for_governance_only",
  "blocked_pending_license_review",
  "blocked_pending_model_weight_review",
  "blocked_pending_legal_review",
  "blocked_pending_owner_handoff",
  "blocked_pending_provider_or_internal_review",
  "rejected_for_reeditpro_stack",
  "deferred"
]);

const EXPECTED_DECISION =
  "sound_oss_tools_1_license_provenance_approval_completed_ready_for_approved_install_plan";

const EXPECTED_RUNTIME_FLAGS = [
  "dependencyMutationAllowed",
  "toolExecutionAllowed",
  "audioProcessingAllowed",
  "mediaProcessingAllowed",
  "providerCallsAllowed",
  "workerExecutionAllowed",
  "routeExecutionAllowed",
  "supabaseMutationAllowed",
  "sqlAllowed",
  "signedUrlCreationAllowed",
  "publicArtifactCreationAllowed",
  "dryRunPassedClaimed",
  "generatedLocalFixturePassedClaimed",
  "installCompletionClaimed",
  "runtimeReadinessClaimed",
  "betaProductionUnlockClaimed"
];

const REQUIRED_BLOCKED = {
  demucs: "blocked_pending_model_weight_review",
  rnnoise: "blocked_pending_owner_handoff",
  essentia: "blocked_pending_legal_review",
  pyrubberband: "blocked_pending_legal_review",
  rubberband_cli: "blocked_pending_legal_review"
};

const UNSAFE_PATTERNS = [
  { name: "dry_run_passed claim", pattern: /\bdry_run_passed\b\s*[:=]\s*(true|"true")/i },
  { name: "dryRunPassedClaimed true", pattern: /\bdryRunPassedClaimed\b\s*[:=]\s*(true|"true")/i },
  {
    name: "generatedLocalFixturePassedClaimed true",
    pattern: /\bgeneratedLocalFixturePassedClaimed\b\s*[:=]\s*(true|"true")/i
  },
  {
    name: "generated_local_fixture_passed claim",
    pattern: /\bgenerated_local_fixture_passed\b\s*[:=]\s*(true|"true")/i
  },
  {
    name: "install completion claim",
    pattern: /\binstallCompletionClaimed\b\s*[:=]\s*(true|"true")/i
  },
  {
    name: "runtime readiness claim",
    pattern: /\bruntimeReadinessClaimed\b\s*[:=]\s*(true|"true")/i
  },
  {
    name: "beta or production unlock claim",
    pattern: /\bbetaProductionUnlockClaimed\b\s*[:=]\s*(true|"true")/i
  },
  {
    name: "Supabase mutation claim",
    pattern: /\bsupabaseMutationAllowed\b\s*[:=]\s*(true|"true")/i
  },
  {
    name: "tool execution claim",
    pattern: /\btoolExecutionAllowed\b\s*[:=]\s*(true|"true")/i
  },
  {
    name: "worker execution claim",
    pattern: /\bworkerExecutionAllowed\b\s*[:=]\s*(true|"true")/i
  },
  {
    name: "route execution claim",
    pattern: /\brouteExecutionAllowed\b\s*[:=]\s*(true|"true")/i
  },
  {
    name: "DB URL",
    pattern: /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i
  },
  {
    name: "Authorization header",
    pattern: /\bAuthorization\s*:\s*Bearer\s+[A-Za-z0-9._-]+/i
  },
  {
    name: "JWT-shaped token",
    pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/
  },
  {
    name: "Supabase project URL",
    pattern: /https:\/\/[a-z0-9]{20}\.supabase\.co/i
  }
];

function readFile(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parseJsonBlock(relativePath, label) {
  const text = readFile(relativePath);
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const blockRegex = new RegExp(
    "```json\\s+" + escapedLabel + "\\n([\\s\\S]*?)\\n```",
    "m"
  );
  const match = text.match(blockRegex);
  assert(match, `Missing JSON block ${label} in ${relativePath}`);
  try {
    return JSON.parse(match[1]);
  } catch (error) {
    throw new Error(`Invalid JSON block ${label} in ${relativePath}: ${error.message}`);
  }
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] ?? "missing";
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function ensureRuntimeFlagsClosed(flags, context) {
  for (const flag of EXPECTED_RUNTIME_FLAGS) {
    assert(flags && flags[flag] === false, `${context} must keep ${flag} false`);
  }
}

function scanUnsafeText() {
  const filesToScan = REQUIRED_FILES.filter((file) => fs.existsSync(path.join(ROOT, file)));
  const findings = [];
  for (const file of filesToScan) {
    const text = readFile(file);
    for (const { name, pattern } of UNSAFE_PATTERNS) {
      if (pattern.test(text)) {
        findings.push(`${name} in ${file}`);
      }
    }
  }
  assert(findings.length === 0, `Unsafe claims or secret-shaped text found: ${findings.join("; ")}`);
}

for (const file of REQUIRED_FILES) {
  assert(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`);
}

const packageJson = JSON.parse(readFile("package.json"));
assert(
  packageJson.scripts?.["sound-oss-tools-1:diagnostics"] ===
    "node scripts/validation/sound-oss-tools-1-license-provenance-diagnostics.mjs",
  "package.json must expose sound-oss-tools-1:diagnostics"
);

const approval = parseJsonBlock(BLOCKS.approval.file, BLOCKS.approval.label);
const eligibility = parseJsonBlock(BLOCKS.eligibility.file, BLOCKS.eligibility.label);
const risk = parseJsonBlock(BLOCKS.risk.file, BLOCKS.risk.label);
const approvedSubset = parseJsonBlock(BLOCKS.approvedSubset.file, BLOCKS.approvedSubset.label);
const blockedDeferred = parseJsonBlock(BLOCKS.blockedDeferred.file, BLOCKS.blockedDeferred.label);
const validation = parseJsonBlock(BLOCKS.validation.file, BLOCKS.validation.label);

assert(approval.decision === EXPECTED_DECISION, "Unexpected SOUND-OSS-TOOLS-1 approval decision");
assert(validation.decision === EXPECTED_DECISION, "Unexpected SOUND-OSS-TOOLS-1 validation decision");
assert(approval.candidateCount === 65, "Approval matrix must classify 65 candidates");
assert(approval.candidatesClassified === 65, "Approval matrix must mark 65 candidates classified");
assert(Array.isArray(approval.candidates), "Approval matrix candidates must be an array");
assert(approval.candidates.length === 65, "Approval matrix must include 65 candidate rows");

const ids = new Set();
for (const candidate of approval.candidates) {
  assert(candidate.toolId, "Every candidate must have a toolId");
  assert(!ids.has(candidate.toolId), `Duplicate candidate id ${candidate.toolId}`);
  ids.add(candidate.toolId);
  assert(
    ALLOWED_DECISIONS.has(candidate.approvalDecision),
    `Unexpected approval decision ${candidate.approvalDecision} for ${candidate.toolId}`
  );
  assert(candidate.licenseProvenanceStatus, `${candidate.toolId} must have a provenance status`);
  assert(candidate.primaryOwner, `${candidate.toolId} must have an owner`);
  assert(candidate.soundRole, `${candidate.toolId} must preserve source role`);
  assert(candidate.nextOwner, `${candidate.toolId} must have nextOwner`);
  assert(candidate.nextPrompt, `${candidate.toolId} must have nextPrompt`);
  assert(
    Array.isArray(candidate.sourceEvidence) && candidate.sourceEvidence.length > 0,
    `${candidate.toolId} must have source evidence`
  );
  assert(
    Array.isArray(candidate.blockedRuntimeGates) &&
      candidate.blockedRuntimeGates.includes("no_execution") &&
      candidate.blockedRuntimeGates.includes("no_runtime_readiness"),
    `${candidate.toolId} must keep runtime gates blocked`
  );
  if (candidate.soundRole === "reference-only" || candidate.soundRole === "handoff-only") {
    assert(
      candidate.approvalDecision === "approved_for_reference_only",
      `${candidate.toolId} must stay reference/handoff-only`
    );
    assert(
      candidate.runtimeOwner !== "SOUND_MUSIC_AUDIO",
      `${candidate.toolId} must not assign runtime ownership to SOUND`
    );
  }
  if (candidate.approvalDecision === "approved_for_install_plan") {
    assert(candidate.soundRole === "own", `${candidate.toolId} install-plan approval must be SOUND-owned`);
    assert(candidate.installPlanEligible === true, `${candidate.toolId} installPlanEligible must be true`);
    assert(
      candidate.modelWeightRequirement === "none",
      `${candidate.toolId} install-plan approval cannot have model-weight dependency`
    );
    assert(
      !String(candidate.licenseProvenanceStatus).startsWith("blocked_") &&
        candidate.licenseProvenanceStatus !== "unknown_needs_review",
      `${candidate.toolId} install-plan approval cannot have blocked or unknown provenance`
    );
  } else {
    assert(candidate.installPlanEligible === false, `${candidate.toolId} must not be install-plan eligible`);
  }
}

assert(ids.size === 65, "Candidate IDs must be unique across all 65 candidates");
const byRole = countBy(approval.candidates, "soundRole");
assert(byRole.own === 39, "Expected 39 SOUND-owned candidates");
assert(byRole["governance-only"] === 12, "Expected 12 governance-only candidates");
assert(byRole["reference-only"] === 8, "Expected 8 reference-only candidates");
assert(byRole["handoff-only"] === 6, "Expected 6 handoff-only candidates");

const byDecision = countBy(approval.candidates, "approvalDecision");
assert(
  byDecision.approved_for_install_plan === approvedSubset.approvedForInstallPlanningCount,
  "Approved subset count must match approval matrix"
);
assert(
  (byDecision.approved_for_reference_only ?? 0) === eligibility.groups.referenceHandoffOnly.length,
  "Reference-only count must match eligibility report"
);
assert(
  (byDecision.approved_for_install_plan ?? 0) +
    (byDecision.approved_for_reference_only ?? 0) +
    (byDecision.approved_for_governance_only ?? 0) +
    blockedDeferred.blockedDeferredRejectedCount ===
    65,
  "Decision count totals must cover all candidates"
);

const candidatesById = Object.fromEntries(approval.candidates.map((candidate) => [candidate.toolId, candidate]));
for (const [toolId, decision] of Object.entries(REQUIRED_BLOCKED)) {
  assert(candidatesById[toolId], `Missing required blocked tool ${toolId}`);
  assert(
    candidatesById[toolId].approvalDecision === decision,
    `${toolId} must remain ${decision}`
  );
}

assert(
  approvedSubset.approvedTools.every((tool) => candidatesById[tool.toolId]?.approvalDecision === "approved_for_install_plan"),
  "Approved subset must contain only approved_for_install_plan tools"
);
assert(
  blockedDeferred.tools.every((tool) => candidatesById[tool.toolId]?.approvalDecision === tool.decision),
  "Blocked/deferred register must mirror approval decisions"
);
assert(
  risk.risks.length > 0,
  "High-risk register must include risk entries"
);
assert(
  risk.risks.every((tool) => candidatesById[tool.toolId]?.approvalDecision === tool.decision),
  "High-risk register count must match high-risk tool list"
);
assert(validation.toolsApprovedForInstallPlanning === byDecision.approved_for_install_plan, "Validation approved count mismatch");
assert(validation.toolsGovernanceOnly === byRole["governance-only"], "Validation governance role count mismatch");
ensureRuntimeFlagsClosed(approval.runtimeFlags, "approval runtimeFlags");
ensureRuntimeFlagsClosed(validation.runtimeFlags, "validation runtimeFlags");

const promptText = readFile("docs/implementation-prompts/prompt-sound-oss-tools-2-approved-install-plan.md");
assert(
  promptText.includes("SOUND-OSS-TOOLS-2") &&
    promptText.includes("Do not install tools") &&
    promptText.includes("mutate dependencies") &&
    promptText.includes("execute tools") &&
    promptText.includes("package-lock.json"),
  "Next prompt must stay install-planning-only and keep execution/dependency gates blocked"
);

scanUnsafeText();

const summary = {
  status: "passed",
  decision: approval.decision,
  candidateCount: approval.candidateCount,
  roleCounts: byRole,
  decisionCounts: byDecision,
  approvedForInstallPlanning: byDecision.approved_for_install_plan ?? 0,
  referenceOnly: byDecision.approved_for_reference_only ?? 0,
  governanceOnlySourceRole: byRole["governance-only"] ?? 0,
  blockedDeferredRejected: blockedDeferred.blockedDeferredRejectedCount,
  highRisk: risk.risks.length,
  requiredBlockedTools: Object.fromEntries(
    Object.keys(REQUIRED_BLOCKED).map((toolId) => [toolId, candidatesById[toolId].approvalDecision])
  ),
  runtimeClaimsClosed: true,
  packageLockStatus: validation.packageLockStatus,
  supabaseUpdateRequired: false,
  nextPrompt: validation.nextPrompt
};

console.log(JSON.stringify(summary, null, 2));
