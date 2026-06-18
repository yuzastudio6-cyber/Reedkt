# SOUND OSS Final Scoped Evidence Index

This index records the merged source chain for the final scoped SOUND OSS metadata and synthetic-fixture lane.

```json sound-oss-tools-13-final-scoped-evidence-index
{
  "phase": "SOUND-OSS-TOOLS-13",
  "decision": "sound_oss_tools_13_final_scoped_evidence_rollup_completed_with_warnings_ready_for_archive_review",
  "sourceHead": "922614fb9cda33010ac6365cbdec11bab0fdc5d7",
  "entries": [
    {
      "pr": 418,
      "title": "[sound] Cross-chat tool ownership registry",
      "decision": "cross_chat_tool_ownership_registry_merged",
      "mergeCommit": "7d186a73f85a04783c906853ea445c611a6ebe23",
      "acceptedEvidence": "SOUND_MUSIC_AUDIO ownership and duplicate-risk registry source.",
      "warnings": ["metadata registry only"],
      "blockedScope": ["runtime execution", "media processing", "provider/model calls"],
      "nextHandoff": "SOUND-OSS-TOOLS-0 inventory and gap audit"
    },
    {
      "pr": 424,
      "title": "[sound] Open-source tool stack inventory and gap audit",
      "decision": "sound_oss_tools_0_stack_inventory_gap_audit_completed_ready_for_license_provenance_approval",
      "mergeCommit": "c295cf5fcfb655c8e5e922cf935cce9a1e105319",
      "acceptedEvidence": "SOUND OSS stack inventory, ownership split, and gap audit.",
      "warnings": ["handoff-only runtime owners remained blocked"],
      "blockedScope": ["tool execution", "runtime readiness", "Supabase/SQL"],
      "nextHandoff": "SOUND-OSS-TOOLS-1 license provenance approval"
    },
    {
      "pr": 431,
      "title": "[sound] Open-source tool license provenance approval",
      "decision": "sound_oss_tools_1_license_provenance_approval_completed_ready_for_approved_install_plan",
      "mergeCommit": "46353564d05ae7365a9463df441f9d49ad06b8f8",
      "acceptedEvidence": "License and provenance approval for install planning only.",
      "warnings": ["runtime execution remained blocked"],
      "blockedScope": ["install completion", "runtime readiness", "media processing"],
      "nextHandoff": "SOUND-OSS-TOOLS-2 approved install plan"
    },
    {
      "pr": 436,
      "title": "[sound] Open-source tool approved install plan",
      "decision": "sound_oss_tools_2_approved_install_plan_ready_for_controlled_dependency_install",
      "mergeCommit": "954c45c8d3cd9c028289b4a4f451e56c3909d08f",
      "acceptedEvidence": "Approved SOUND-owned dependency install plan.",
      "warnings": ["install plan only"],
      "blockedScope": ["media operations", "runtime readiness", "beta/production"],
      "nextHandoff": "SOUND-OSS-TOOLS-3 controlled dependency install"
    },
    {
      "pr": 442,
      "title": "[sound] Controlled OSS dependency install",
      "decision": "sound_oss_tools_3_controlled_dependency_install_completed_ready_for_binary_import_proof",
      "mergeCommit": "724e051027c6ede4e2d62cd8387f04ceea9e7946",
      "acceptedEvidence": "Controlled dependency manifest and install evidence.",
      "warnings": ["no import proof or runtime execution claimed"],
      "blockedScope": ["binary proof", "media processing", "runtime readiness"],
      "nextHandoff": "SOUND-OSS-TOOLS-4 binary import proof"
    },
    {
      "pr": 450,
      "title": "[sound] OSS binary import proof",
      "decision": "sound_oss_tools_4_binary_import_proof_passed_with_warnings_ready_for_synthetic_fixture_validation_plan",
      "mergeCommit": "a0abed62c23f9118f955051042b385650ff956cd",
      "acceptedEvidence": "No-op import proof for approved modules.",
      "warnings": ["pydub FFmpeg/avconv availability warning"],
      "blockedScope": ["pydub media operations", "FFmpeg/ffprobe", "runtime readiness"],
      "nextHandoff": "SOUND-OSS-TOOLS-5 synthetic fixture validation plan"
    },
    {
      "pr": 453,
      "title": "[sound] OSS synthetic fixture validation plan",
      "decision": "sound_oss_tools_5_synthetic_fixture_validation_plan_ready_with_warnings",
      "mergeCommit": "080513b8581909ff95f7c7ec1f51664940e41cd8",
      "acceptedEvidence": "Fixture validation plan with policy skips.",
      "warnings": ["audioread and pydub media-dependent surfaces blocked"],
      "blockedScope": ["file-open media validation", "pydub media operations"],
      "nextHandoff": "SOUND-OSS-TOOLS-6 synthetic fixture validation"
    },
    {
      "pr": 461,
      "title": "[sound] OSS synthetic fixture validation",
      "decision": "sound_oss_tools_6_synthetic_fixture_validation_passed_with_warnings_ready_for_owner_review",
      "mergeCommit": "72fb9b5d1ef5a30acd173e1c6949cd7a029ef0bd",
      "acceptedEvidence": "14 attempted, 12 passed, 2 skipped by policy, 0 failed.",
      "warnings": ["audioread file-open blocked", "pydub media operations blocked"],
      "blockedScope": ["real media files", "FFmpeg/ffprobe", "project-wide generated_local_fixture_passed"],
      "nextHandoff": "SOUND-OSS-TOOLS-7 owner review"
    },
    {
      "pr": 465,
      "title": "[sound] OSS synthetic fixture owner review",
      "decision": "sound_oss_tools_7_owner_review_passed_with_warnings_ready_for_scoped_gate_status",
      "mergeCommit": "efeff4f968778408a96b8861ddd98be41cc01264",
      "acceptedEvidence": "Owner review accepted SOUND-OSS-TOOLS-6 for governance only.",
      "warnings": ["fixture result stayed scoped"],
      "blockedScope": ["media processing", "dry_run_passed", "runtime readiness"],
      "nextHandoff": "SOUND-OSS-TOOLS-8 gate status"
    },
    {
      "pr": 470,
      "title": "[sound] OSS synthetic fixture gate status",
      "decision": "sound_oss_tools_8_scoped_synthetic_fixture_gate_status_recorded_with_warnings_ready_for_pass_review",
      "mergeCommit": "0ed6564ba6ca2ed15cbf3b45224853430f151dbe",
      "acceptedEvidence": "Scoped gate status recorded with warnings.",
      "warnings": ["audioread and pydub blockers preserved"],
      "blockedScope": ["generated_local_fixture_passed", "dry_run_passed", "beta/production"],
      "nextHandoff": "SOUND-OSS-TOOLS-9 pass review"
    },
    {
      "pr": 474,
      "title": "[sound] OSS scoped synthetic fixture pass review",
      "decision": "sound_oss_tools_9_scoped_synthetic_fixture_pass_review_passed_with_warnings_ready_for_status_owner_approval",
      "mergeCommit": "9b2920a5104c01374192d4dbec0fc556643127c2",
      "acceptedEvidence": "Scoped pass review accepted SOUND-OSS-TOOLS-8 evidence.",
      "warnings": ["warnings remained attached"],
      "blockedScope": ["runtime readiness", "media processing readiness", "public artifacts"],
      "nextHandoff": "SOUND-OSS-TOOLS-10 status owner approval"
    },
    {
      "pr": 479,
      "title": "[sound] OSS scoped status owner approval",
      "decision": "sound_oss_tools_10_scoped_status_owner_approval_passed_with_warnings_ready_for_downstream_status_sync",
      "mergeCommit": "61714ef7140348f273fb7c65b178ffa300a59ce3",
      "acceptedEvidence": "Owner approval for downstream status-doc references only.",
      "warnings": ["approval did not widen status"],
      "blockedScope": ["runtime", "media", "Supabase", "artifact", "billing", "beta/production"],
      "nextHandoff": "SOUND-OSS-TOOLS-11 downstream status sync"
    },
    {
      "pr": 483,
      "title": "[sound] OSS downstream scoped status sync",
      "decision": "sound_oss_tools_11_downstream_status_sync_passed_with_warnings_ready_for_next_owner_review",
      "mergeCommit": "a0c6d5f7a57bbb93c85c5b751b00cd1a416b1b05",
      "acceptedEvidence": "Scoped status synced only into the two approved downstream docs.",
      "warnings": ["downstream sync was metadata/status only"],
      "blockedScope": ["additional downstream propagation", "readiness widening"],
      "nextHandoff": "SOUND-OSS-TOOLS-12 downstream status sync owner review"
    },
    {
      "pr": 489,
      "title": "[sound] OSS downstream scoped status owner review",
      "decision": "sound_oss_tools_12_downstream_status_sync_owner_review_passed_with_warnings_ready_for_final_rollup",
      "mergeCommit": "922614fb9cda33010ac6365cbdec11bab0fdc5d7",
      "acceptedEvidence": "Owner review accepted PR #483 and the two downstream docs only.",
      "warnings": ["inherited blockers remain attached"],
      "blockedScope": ["runtime readiness", "media readiness", "project-wide generated_local_fixture_passed", "dry_run_passed"],
      "nextHandoff": "SOUND-OSS-TOOLS-13 final scoped evidence rollup"
    }
  ]
}
```
