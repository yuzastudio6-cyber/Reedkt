# Guarded External-Agent Execution Contract

Packet: `RP-EXTERNAL-BETA-TOOL-EXECUTION-READINESS-MATRIX-1`

This contract is the minimum future gate for any external-agent tool execution. It is planning-only in this packet.

## Required Inputs

Every future executable tool job must include:

- approved plan snapshot reference;
- approval record reference;
- credit reservation reference, or an explicit no-spend fixture policy;
- job ID;
- worker lease ID;
- idempotency key;
- private input manifest with file names, byte counts, and SHA-256 checksums;
- allowed command template ID, not a raw command string;
- declared tool version/source evidence;
- expected output manifest schema;
- QA report schema;
- retention and cleanup policy;
- failure category and retry policy.

## Fail-Closed Rules

The tool job must fail closed when any required input is missing, stale, ambiguous, or not tied to the approved snapshot. Workers must execute approved snapshots only, not raw chat text, frontend state, browser state, or ad hoc file paths.

The tool job must reject:

- raw shell commands;
- arbitrary private/user media outside the approved manifest;
- public URLs as source-of-truth;
- signed URLs as source-of-truth;
- broad media directories;
- unapproved model/provider calls;
- unapproved FFmpeg/FFprobe expansion;
- output that is not recorded in the private artifact manifest;
- final delivery/export unless a later final-export gate authorizes it.

## Required Outputs

Every future executable tool job must return:

- structured status;
- private artifact manifest;
- QA report;
- tool command-template IDs used;
- bounded stdout/stderr summary when applicable;
- checksums for generated fixture or private artifacts;
- cleanup result;
- audit log reference;
- explicit safety flags.

## Current Readiness

GStreamer and MKVToolNix are ready to define this contract for guarded external-agent execution. GPAC/MP4Box must first pass its confirmed guarded runtime dispatch gate. All other Track A tools remain blocked, evaluation-only, or handoff-only for this purpose.
