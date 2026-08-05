# B-roll qualification and test evidence

Status: `internal_execution_qualified`

Manifest schema: `skill-capability-manifest-v2`

Manifest hash: `40219ecc4319bc5639de87f16695ba9f87119ec7efce60acbd95fc60b1d4dec0`

Qualification receipt hash:
`e74360d571d6442dceb44fb061e730b16c5961dd1d9ca3cc38e3eec324b862f5`

Tested commit: `86b624a5a61cd45dfefaf4ae680be455859cc0e6`

Relevant source-tree hash:
`20f360801162bd44d864d2b8276f21f2980eded565ed04e4205563afd1b64c84`

Shared dependency-authority set hash:
`15e8803248c2aa5db6715918bcb39f820bc9f312999d4021bb1578b5c69bd87a`

Generated qualification artifact hash:
`412724597d105726ba8a9e5f58e26b953c36988d20414db9e4aa155001c82cee`

## Qualification scope

The receipt was generated from 30 actual passed commands and contains 36
validated fixture evidence artifacts: all 15 planning fixtures and all 21
internal-execution fixtures declared by the capability manifest. Each command
captures its real exit status, timestamps, sanitized stdout/stderr digest, and
content-addressed evidence; each fixture has a deterministic evidence hash and
named proof owner. The receipt includes separate build, test, security, and
provider evidence hashes and is bound to the exact commit, relevant
source-tree hash, and manifest reference. Provider requests, public artifacts,
and production mutations were all zero.

The thirtieth command is `test:b-roll-caption-public-contract`. It validates
the byte-free HQ-mediated request/result contracts, all four opaque reference
roles, exact scope/snapshot/output-frame/MasterTiming lineage, stale-digest
and cross-workspace rejection, and the absence of Caption imports, peer
dispatch, runtime binding, authenticated-evidence claims, or delegated
authority.

## Shared dependency authorities

Receipt-v2 qualification evidence also binds 18 ordered
`dependencyAuthorityHashes`. Runtime startup recomputes the same set and
rejects a missing, duplicate, unknown, reordered, forged, or changed authority
before registering the receipt. Each authority hash covers a forward-only
profile ID plus the minimal exact source files for:

- the canonical approved execution package, B-roll plan component, and
  planning publication/service contract;
- the approved FFprobe and FFmpeg profiles plus the media-binary protocol;
- the approved Remotion composition profile, execution protocol, and
  composition contract;
- Gemini Omni V5 provider authority and lifecycle policy;
- candidate QA, planning QA, public plugin, artifact registry, and runtime
  binding contracts; and
- the model-neutral Visual Intelligence and `track_graph_v1` dependency
  contracts.

The receipt carries separate actual build, test, security, internal-provider,
media, and Remotion command-evidence hashes. Planning-only receipts leave
provider/media/Remotion evidence empty; an `internal_execution_qualified`
receipt cannot parse or issue unless all three execution evidence categories
are non-empty.

The five production fixtures are intentionally absent:

- real Gemini Omni private canary;
- live credential boundary;
- account-effective rate authority;
- live private output ingest; and
- live security/privacy release review.

Therefore neither the receipt nor the manifest claims
`production_qualified`.

## Generated-route E2E acceptance

`smoke:b-roll-end-to-end` proves one exact internal route:

1. create the manifest-bound assignment and deterministic generated plan;
2. compile the atomic work graph and persist the content-addressed component;
3. propagate the exact component ref through plan, snapshot, and execution
   package authority;
4. build and authorize the Gemini Omni V5 request;
5. inject a private candidate with zero real provider requests;
6. run real pinned technical QA and reject version 1 for a semantic camera
   mismatch;
7. execute the one authorized refinement and accept normalized version 2;
8. reopen the exact private FFV1/NUT artifact;
9. render the real private 72-frame Remotion preview;
10. pass all eleven integration QA checks and preserve final-owner handoffs;
11. replay the immutable result without new work; and
12. persist a hashed private E2E acceptance artifact.

Observed acceptance evidence:

- initial verdict: `needs_refinement`;
- final verdict: `accepted_after_normalization`;
- candidate versions: `2`;
- private preview: 640x360, 24fps, 72 frames;
- integration QA checks: `11` passed;
- actual provider requests: `0`;
- outside authorized range modified: `false`;
- total internal cost: `329500` micros;
- automatic candidate selection: `false`;
- production qualified: `false`.

## Required validation matrix

| Evidence area | Commands |
| --- | --- |
| Manifest/kernel | `validate:skill-capability-manifests`, `test:edit-skill-capability-kernel`, `test:b-roll-capability-manifest` |
| Public boundary/runtime | `test:b-roll-public-plugin`, `test:b-roll-active-artifact-contracts`, `test:b-roll-runtime-bindings`, `test:edit-skill-runtime-factory` |
| Planning/range/work graph | `test:b-roll-planning`, `test:b-roll-plan-invariants`, `test:b-roll-canonical-integration`, `smoke:canonical-source-led-plan-compiler`, `smoke:approved-snapshot` |
| Planning QA/qualification | `test:b-roll-planning-qa`, `test:b-roll-qualification-evidence`, `qualify:b-roll:internal` |
| Source/artifact | `smoke:b-roll-existing-source`, `smoke:private-artifact-qa-authority`, `smoke:private-local-persistence` |
| Provider | `smoke:b-roll-provider-authority`, `smoke:b-roll-provider-lifecycle`, `smoke:canonical-private-provider-work-lifecycle`, `smoke:canonical-provider-attempt-runtime-record` |
| Candidate QA | `smoke:b-roll-candidate-qa`, `smoke:offline-media-binary-execution` |
| Remotion/integration | `smoke:b-roll-remotion-integration`, `smoke:offline-remotion-render-execution` |
| Retirement | `smoke:b-roll-retirement` |
| Aggregate E2E | `smoke:b-roll-end-to-end` |
| Security/boundary | `smoke:runtime-api-security`, `smoke:edit-execution-security-boundary`, `smoke:idempotency-boundary`, `check:frontend-boundary` |
| Repository quality | `build`, `typecheck:server`, `lint`, `git diff --check` |
| CI media runtime | `test:ui-qa-media-runtime-workflow`, `ffmpeg -version`, `ffprobe -version`, main Playwright suite |
| External canary | `canary:gemini-omni-b-roll` — pass only when external gates exist; otherwise safely blocked with zero requests |

The milestone progress ledger records actual command results and any unrelated
pre-existing failures. A passing internal matrix does not prove the live
Supabase project, GCS/IAM, GitHub security settings, billing settlement, public
delivery, or final export.
