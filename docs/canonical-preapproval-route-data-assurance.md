# Canonical Pre-Approval Route Data Assurance

## Purpose

`canonical-preapproval-route-data-assurance-v1` is the workflow-neutral,
server-owned policy boundary that evaluates whether ReeditPro's canonical
pre-approval reasoning route may proceed to a separately authorized provider
envelope.

The exact route is:

1. Kimi K3 primary;
2. Qwen 3.7 fallback; and
3. DeepSeek V4 Pro fallback.

This record does not choose a route, create a provider request, read a
credential, call a model, or authorize a reasoning run. Qwen2.5-VL remains a
separate visual-understanding specialist and cannot be substituted into this
reasoning route.

## Bound inputs

Each immutable binding covers:

- exact workspace, project, edit session, and bounded request digest;
- the shared canonical route-contract version and ordered provider/model
  identities;
- organization and project policy evidence, including verification and
  expiry;
- allowed providers and processing regions;
- text-only source-evidence projection;
- sensitivity, retention, and training-use requirements;
- confidential-source handling;
- human-likeness consent and minor guardian-consent state;
- rights-safety and documentary fact-safety state; and
- one independently evidenced assurance record for every route.

Raw media, transcript text, browser captures, provider envelopes, paths, URLs,
credentials, commands, work items, and runtime data are not accepted by the
contract.

## Evaluation

Every route receives one of three decisions:

- `allowed`: the current evidence satisfies every bound requirement;
- `unresolved`: required evidence is missing, expired, conflicting, or needs
  review; or
- `disallowed`: an explicit policy, consent, rights, fact-safety, retention,
  training, region, provider, modality, or sensitivity rule blocks the route.

The binding can be `ready_for_provider_envelope` only when all three canonical
routes are allowed. This status still grants no provider-envelope or transport
authority. A separate provider-envelope boundary must bind the exact request,
selected route, and current assurance before any transport can run.

## Private source and persistence boundary

The persistence service accepts only an opaque server-owned locator through a
process-bound reader capability. It reads the current source twice, validates
the exact scope and request digest, rejects stale or racing evidence, builds
the binding on the server, writes an immutable content-addressed version, and
re-reads it.

The backend-local repository:

- scopes data by owner and workspace;
- uses checksummed version envelopes and a checksummed latest pointer;
- preserves monotonic evidence revisions;
- rejects rollback and same-revision substitution;
- uses confined no-follow atomic persistence; and
- revalidates the complete binding on every read.

This repository is an internal contract and test boundary. It does not prove
that a live policy system, cloud database, provider account, regional
deployment, or production retention setting has been configured.

## Authority boundary

All of the following remain false:

- raw-media, raw-transcript, and browser-capture authority;
- provider-envelope, transport, credential, and provider-call authority;
- reasoning-run and reasoning-result authority;
- planning, selected-scene, timing, and SoundSync authority;
- estimate, customer price, credit, approval, and snapshot authority;
- work-graph, queue, tool-route, render, and runtime authority; and
- production readiness.

Living Frame and other planning systems may later consume a current
namespaced projection of this record. They must not duplicate its policy
logic, accept caller-authored assurances, or treat the route name itself as
privacy evidence.

## Verification

Run:

```bash
npm run smoke:canonical-preapproval-route-data-assurance
```

The smoke covers the allowed three-route record, missing evidence, region and
provider substitution, retention/training constraints, sensitivity,
confidential sources, likeness and minors, rights and fact safety, route
reordering, Qwen2.5-VL substitution, forged reader and authority records,
double-read races, cross-owner reads, historical rollback, and pointer
tampering.
