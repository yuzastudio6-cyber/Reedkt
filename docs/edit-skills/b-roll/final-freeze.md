# B-roll final freeze

Status: `frozen_with_caption_public_owner_boundary`

## Skill identity

- Skill key: `b_roll`
- Skill version: `1.0.0`
- Contract version: `b_roll.skill_contract.v1`
- Capability manifest schema: `skill-capability-manifest-v2`
- Public plugin: `BrollEditSkillPlugin` implementing the generic
  `EditSkillPlugin` contract and registered as `b_roll@1.0.0`
- Final branch: `codex/reeditpro-b-roll-skill-end-to-end`
- Selected integration branch:
  `codex/backend-workflow-pipeline-continuation`
- Selected integration SHA:
  `6423f12c1e62a252fc860ce5184888770411c62d`
- Normal reconciliation merge:
  `d9e220f048ec6127e6a1927c8276bc660fe4d2fd`
- Frozen qualified implementation/evidence head:
  `04f750cd93db21b1d0d9c50e560768aa9db4d256`
- Post-freeze Caption public-boundary source commit:
  `86b624a5a61cd45dfefaf4ae680be455859cc0e6`

The M35 freeze-record commit is documentation-only and descends from the
qualified head above. The exact implementation/evidence commit from which
Track All should branch is:

`04f750cd93db21b1d0d9c50e560768aa9db4d256`

This avoids treating later PR-description or freeze-record prose as a runtime
authority change. Track All may read this record from PR #2498 while using the
exact qualified commit as its Git branch point.

## Frozen evidence

- Manifest hash:
  `40219ecc4319bc5639de87f16695ba9f87119ec7efce60acbd95fc60b1d4dec0`
- Tested source commit:
  `86b624a5a61cd45dfefaf4ae680be455859cc0e6`
- Relevant source-tree hash:
  `20f360801162bd44d864d2b8276f21f2980eded565ed04e4205563afd1b64c84`
- Shared dependency-authority set hash:
  `15e8803248c2aa5db6715918bcb39f820bc9f312999d4021bb1578b5c69bd87a`
- Qualification receipt hash:
  `e74360d571d6442dceb44fb061e730b16c5961dd1d9ca3cc38e3eec324b862f5`
- Generated qualification artifact hash:
  `412724597d105726ba8a9e5f58e26b953c36988d20414db9e4aa155001c82cee`
- Actual qualification: `internal_execution_qualified`
- Production qualification: `false`
- Actual command evidence: `30`
- Actual fixture evidence: `36`
- Real provider requests: `0`
- Public artifacts: `0`
- Production mutations: `0`

Runtime registration accepted the committed receipt from the final qualified
head and continues to reject stale, forged, missing, reordered, or changed
manifest, source-tree, fixture, command, or dependency-authority evidence.

## Public contract and artifacts

The future orchestra boundary is limited to the public plugin lifecycle:

1. `manifest`
2. `planAssignment(...)`
3. `compileApprovedWorkGraph(...)`
4. `acceptDependencyArtifact(...)`
5. `validateWorkItemResult(...)`
6. `finalizeSkillResult(...)`

The public lifecycle must not import B-roll mini-skills, provider request
builders, candidate-QA internals, Remotion internals, or private persistence
helpers.

Frozen produced artifact types:

- `b_roll_assignment_v1`
- `b_roll_candidate_manifest_v1`
- `b_roll_candidate_media_manifest_v1`
- `b_roll_candidate_version_v1`
- `b_roll_plan_v1`
- `b_roll_private_preview_media_manifest_v1`
- `b_roll_qa_report_v1`
- `b_roll_remotion_layer_manifest_v1`
- `b_roll_result_receipt_v1`
- `source_media_artifact_v1`

Raw media remains private binary/object data. Public results carry strict,
content-addressed media manifests rather than bytes, provider URLs, signed
URLs, or public delivery references.

The post-freeze Caption owner boundary adds no runtime job or dispatcher. It
exports `BrollCaptionOwnerReadRequest`, `BrollCaptionOwnerReadResult`, and the
content-addressed `b_roll_caption_public_contract_receipt_v1`. Caption may
reference the four result artifacts only as opaque `{ id, version,
contentHash }` values through HQ mediation. The receipt digest is
`255f13e74429107954ea4d1b75d42fbe4002d2f5e7d3b40ab0f5e14ce4287038`.
Authenticated private owner evidence is not claimed by the type-only receipt.

## External dependency contracts

Track All remains external and model-neutral:

- Dependency skill: `track_all`
- Accepted artifact: `track_graph_v1`
- Missing behavior: `needs_other_skill`
- Required phase: `layer_preparation`
- Model-specific dependency allowed: `false`
- Direct SAM2/SAM 3.1 import: prohibited

Visual Intelligence remains external and model/provider-neutral:

- Dependency skill: `visual_intelligence`
- Accepted artifact: `visual_intelligence_candidate_qa_v1`
- Required phase: `skill_output_qa`
- Required for generated or provider-edited candidates
- Whole-video evidence: read-only
- Injected observations: test-only and rejected for production acceptance

B-roll consumes these artifacts. It does not implement, route, or select the
producer model for either skill.

## Provider and execution status

- Sole active generated-video operation:
  `provider.google.generate_b_roll_candidate.v1`
- Sole active generated-video route: `gemini_omni_flash`
- Automatic retries: `0`
- Alternate-provider fallbacks: `0`
- Initial candidate ceiling: `1`
- Refinement ceiling: `1`
- Historical provider V1-V4 hashes: exact and verified
- Wan, Hailuo, Veo, Kling, and unqualified stock routes: retired/fail-closed
- Internal injected Gemini lifecycle: qualified
- Live paid Gemini canary: not executed; external gates absent
- Provider production status: not production-qualified

Real internal qualification includes bounded FFprobe, FFmpeg, technical QA,
and private Remotion preview execution. It does not authorize a public render,
customer export, production worker, billing mutation, wallet mutation, or
provider spend.

## Production-only blockers

Production qualification remains false until actual evidence exists for all
five production fixtures:

- real Gemini Omni private canary;
- live credential boundary;
- account-effective rate authority;
- live private output ingest; and
- live security/privacy release review.

A durable production artifact-store adapter, production worker adapter,
public delivery, final customer export, billing/settlement, and future
orchestra integration also remain separately gated. These limitations do not
invalidate internal execution qualification.

## Freeze invalidation

This freeze is invalidated by any change to:

- the capability manifest, manifest schema, skill version, or contract version;
- B-roll assignment, plan, work graph, runtime binding, artifact, planning QA,
  candidate QA, source, Remotion, result, or dependency contracts;
- canonical planning publication or approved execution-package authority;
- FFprobe, FFmpeg, media execution, Remotion execution, or Remotion composition
  authority;
- Gemini Omni V5 profile, operation, lifecycle, credential, rate, or provider
  authority;
- Visual Intelligence or track-graph consumer lineage requirements;
- qualification fixtures, commands, evidence schemas, dependency-authority
  definitions, or generated receipt; or
- a security correction that changes any frozen execution boundary.

An invalidating change requires a normal forward-only contract update when
appropriate, the affected regression matrix, a clean-source complete
qualification run, a newly generated receipt, and an updated freeze record.

## Change policy

During Track All development, B-roll is reopened only for:

- a confirmed B-roll bug;
- a required shared-contract migration;
- provider production qualification backed by actual evidence;
- a security correction; or
- an explicit product-version change.

Speculative enhancements, alternate providers, direct tracking models,
production worker registration, and cross-skill orchestration do not belong in
the frozen B-roll skill.

The head orchestra was not implemented by the final reconciliation. Track All
was not implemented. Visual Intelligence was not implemented. No production
worker was falsely added.

**B-roll is frozen and ready for Track All implementation.**
