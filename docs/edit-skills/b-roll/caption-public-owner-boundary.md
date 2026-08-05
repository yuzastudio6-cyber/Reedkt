# B-roll public owner boundary for Captions

Status: `public_type_contract_frozen_runtime_not_requested`

This document records the B-roll-owned, byte-free public contract that an HQ
mediator and a Caption-owned authenticated read adapter may reference. It does
not grant Caption source-selection, crop, timing, execution, asset-mutation,
QA-approval, billing, public-delivery, or production authority.

Canonical source:

- `server/edit-skills/b-roll/b-roll-caption-public-contract.ts`
- owner: `b_roll@1.0.0`
- owner contract: `b_roll.skill_contract.v1`
- owner manifest hash:
  `40219ecc4319bc5639de87f16695ba9f87119ec7efce60acbd95fc60b1d4dec0`

## Public request and result

| Public type | Version | Contract digest |
| --- | --- | --- |
| `BrollCaptionOwnerReadRequest` | `b_roll_caption_owner_read_request_v1` | `41a8ff19a61ccba5ea99c6c0839939b237388285f7672b1ec2279cd28d835788` |
| `BrollCaptionOwnerReadResult` | `b_roll_caption_owner_read_result_v1` | `5821d74644e3e7284696bc5db4bac4597c49c64de48680cb166c041249443a32` |

Both contracts bind exact owner user, workspace, project, edit session,
approved snapshot, output, output frame, scene, authorized frame range, FPS,
MasterTiming reference, and MasterTiming hash. The result is valid for a
request only when its request reference and complete canonical scope match.

The result supplies only opaque `{ id, version, contentHash }` references for:

| Result field | B-roll source contract | Descriptor digest |
| --- | --- | --- |
| `selectedMediaManifestRef` | `b_roll_candidate_media_manifest_v1` | `3e3056bde5f206762fef63d46cfd3bf361ae3b3469617ecd1d5f3717a3e84998` |
| `layoutOccupancyRef` | `b_roll_remotion_layer_manifest_v1` | `798219ffe1117b4edc4938baf77af3a29bd621b0b1a213eb1ffa068cb06581d5` |
| `cropTimingRef` | `b_roll_caption_crop_timing_projection_v1` | `39d7dd822c3f5fcbc9f92f7ce62397b168b52ac0c4e63814a1bcf6c4c2f1664d` |
| `visibleTextEvidenceRef` | `b_roll_caption_visible_text_evidence_v1` | `c1c5fcf64562131948c5d41402f6a78663ff4af8115c4b72c92b2c70e5ccc7a6` |

The full field lists for each source contract are frozen in the exported
receipt. Caption may retain and compare the references opaquely; it must not
reconstruct, select, crop, time, fetch, mutate, or publicly expose B-roll.

## Receipt

- version: `b_roll_caption_public_contract_receipt_v1`
- digest:
  `255f13e74429107954ea4d1b75d42fbe4002d2f5e7d3b40ab0f5e14ce4287038`
- Caption binding target: `caption-broll-owner-read-binding-v1`
- mediation: `hq_mediated_owner_read`
- runtime binding declared: `false`
- runtime execution authorized: `false`
- authenticated private evidence claimed: `false`

The result type requires authenticated owner evidence and exact private reread
flags before a concrete result can be admitted. This source-only milestone
does not create such a result, implement a peer dispatcher, or alter the
Caption implementation.
