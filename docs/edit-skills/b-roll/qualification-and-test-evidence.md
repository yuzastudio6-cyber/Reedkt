# B-roll qualification and test evidence

Status: `internal_execution_qualified`

Manifest hash: `c916e4d29dc91b71e2c16ac8f64fe55fa416e3dd10784e620d9d49d9ef254d6c`

Qualification receipt hash:
`9b10ed12a838f70f0ff7c97c76695838acc219565634b34bdf8f2825200ec3bf`

## Qualification scope

The receipt contains 36 passed results: all 15 planning fixtures and all 21
internal-execution fixtures declared by the capability manifest. Each result
has a deterministic evidence hash and named proof owner. The receipt includes
separate build, test, security, and provider evidence hashes and is bound to the
exact manifest reference.

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
| Planning/range/work graph | `test:b-roll-planning`, `test:b-roll-canonical-integration`, `smoke:canonical-source-led-plan-compiler`, `smoke:approved-snapshot` |
| Source/artifact | `smoke:b-roll-existing-source`, `smoke:private-artifact-qa-authority`, `smoke:private-local-persistence` |
| Provider | `smoke:b-roll-provider-authority`, `smoke:b-roll-provider-lifecycle`, `smoke:canonical-private-provider-work-lifecycle`, `smoke:canonical-provider-attempt-runtime-record` |
| Candidate QA | `smoke:b-roll-candidate-qa`, `smoke:offline-media-binary-execution` |
| Remotion/integration | `smoke:b-roll-remotion-integration`, `smoke:offline-remotion-render-execution` |
| Retirement | `smoke:b-roll-retirement` |
| Aggregate E2E | `smoke:b-roll-end-to-end` |
| Security/boundary | `smoke:runtime-api-security`, `smoke:edit-execution-security-boundary`, `smoke:idempotency-boundary`, `check:frontend-boundary` |
| Repository quality | `build`, `typecheck:server`, `lint`, `git diff --check` |
| External canary | `canary:gemini-omni-b-roll` — pass only when external gates exist; otherwise safely blocked with zero requests |

The milestone progress ledger records actual command results and any unrelated
pre-existing failures. A passing internal matrix does not prove the live
Supabase project, GCS/IAM, GitHub security settings, billing settlement, public
delivery, or final export.
