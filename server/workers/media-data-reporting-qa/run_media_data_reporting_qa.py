#!/usr/bin/env python3
"""Phase 46D metadata-only DuckDB/Polars reporting QA worker."""

from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

import duckdb
import polars as pl


TABLE_COLUMNS: dict[str, list[str]] = {
    "phase_runs": [
        "phase_id",
        "run_id",
        "pr_number",
        "branch",
        "status",
        "started_at",
        "completed_at",
        "artifact_prefix",
        "beta_status",
    ],
    "tool_results": [
        "phase_id",
        "run_id",
        "tool_id",
        "tool_version",
        "fixture_or_sample_id",
        "result_status",
        "required_or_optional",
        "qa_score",
        "warnings_count",
        "blockers_count",
    ],
    "fixture_results": [
        "phase_id",
        "run_id",
        "fixture_id",
        "fixture_type",
        "generated_or_controlled",
        "status",
        "metrics_json",
        "privacy_class",
    ],
    "controlled_sample_results": [
        "sample_id",
        "chain_id",
        "time_window",
        "frame_count",
        "approved_offsets_hash",
        "status",
        "privacy_status",
    ],
    "dependency_risks": [
        "tool_id",
        "dependency",
        "risk_type",
        "severity",
        "production_blocker",
        "beta_blocker",
        "mitigation",
    ],
    "blockers": [
        "blocker_id",
        "phase_id",
        "tool_id",
        "severity",
        "status",
        "reason",
        "next_action",
    ],
    "artifact_objects": [
        "phase_id",
        "run_id",
        "artifact_type",
        "object_count",
        "total_size_bytes",
        "private_prefix_hash_or_safe_path",
        "privacy_status",
    ],
    "readiness_scorecard": [
        "family",
        "phase",
        "criterion",
        "status",
        "evidence_ref",
        "next_action",
    ],
    "beta_gate_inputs": [
        "criterion",
        "required",
        "status",
        "evidence",
        "blocker",
    ],
}


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=False) + "\n", encoding="utf-8")


def normalize_row(table_name: str, row: dict[str, Any]) -> tuple[Any, ...]:
    values: list[Any] = []
    for column in TABLE_COLUMNS[table_name]:
        value = row.get(column)
        if column in {"qa_score"}:
            values.append(float(value or 0))
        elif column in {"warnings_count", "blockers_count", "frame_count", "object_count", "total_size_bytes"}:
            values.append(int(value or 0))
        elif column == "required":
            values.append(bool(value))
        else:
            values.append("" if value is None else str(value))
    return tuple(values)


def create_duckdb_tables(input_tables: dict[str, list[dict[str, Any]]]) -> tuple[duckdb.DuckDBPyConnection, dict[str, int]]:
    con = duckdb.connect(database=":memory:")
    con.execute("PRAGMA disable_progress_bar")
    row_counts: dict[str, int] = {}
    for table_name, columns in TABLE_COLUMNS.items():
        column_sql = []
        for column in columns:
            if column == "qa_score":
                column_sql.append(f"{column} DOUBLE")
            elif column in {"warnings_count", "blockers_count", "frame_count", "object_count", "total_size_bytes"}:
                column_sql.append(f"{column} BIGINT")
            elif column == "required":
                column_sql.append(f"{column} BOOLEAN")
            else:
                column_sql.append(f"{column} VARCHAR")
        con.execute(f"CREATE TABLE {table_name} ({', '.join(column_sql)})")
        rows = [normalize_row(table_name, row) for row in input_tables.get(table_name, [])]
        if rows:
            placeholders = ", ".join(["?"] * len(columns))
            con.executemany(f"INSERT INTO {table_name} VALUES ({placeholders})", rows)
        row_counts[table_name] = len(rows)
    return con, row_counts


def fetch_rows(con: duckdb.DuckDBPyConnection, table_name: str) -> list[dict[str, Any]]:
    columns = TABLE_COLUMNS[table_name]
    result = con.execute(f"SELECT * FROM {table_name}").fetchall()
    return [dict(zip(columns, row)) for row in result]


def duckdb_summary(con: duckdb.DuckDBPyConnection, row_counts: dict[str, int]) -> dict[str, Any]:
    tool_counts = con.execute(
        "SELECT result_status, COUNT(*) FROM tool_results GROUP BY result_status ORDER BY result_status"
    ).fetchall()
    phase_counts = con.execute(
        "SELECT status, COUNT(*) FROM phase_runs GROUP BY status ORDER BY status"
    ).fetchall()
    blocker_counts = con.execute(
        "SELECT severity, status, COUNT(*) FROM blockers GROUP BY severity, status ORDER BY severity, status"
    ).fetchall()
    artifact_counts = con.execute(
        "SELECT phase_id, SUM(object_count), SUM(total_size_bytes) FROM artifact_objects GROUP BY phase_id ORDER BY phase_id"
    ).fetchall()
    beta_counts = con.execute(
        "SELECT status, COUNT(*) FROM beta_gate_inputs GROUP BY status ORDER BY status"
    ).fetchall()
    return {
        "status": "passed",
        "duckdbVersion": duckdb.__version__,
        "database": "in_memory",
        "extensionPolicy": {
            "networkExtensionsLoaded": False,
            "httpfsUsed": False,
            "s3OrGcsReadsUsed": False,
        },
        "rowCounts": row_counts,
        "toolStatusCounts": dict(tool_counts),
        "phaseStatusCounts": dict(phase_counts),
        "blockerCounts": [
            {"severity": severity, "status": status, "count": count}
            for severity, status, count in blocker_counts
        ],
        "artifactObjectCounts": [
            {"phaseId": phase, "objectCount": int(objects or 0), "totalSizeBytes": int(size or 0)}
            for phase, objects, size in artifact_counts
        ],
        "betaGateStatusCounts": dict(beta_counts),
    }


def polars_tables(input_tables: dict[str, list[dict[str, Any]]]) -> tuple[dict[str, list[dict[str, Any]]], dict[str, int]]:
    table_rows: dict[str, list[dict[str, Any]]] = {}
    row_counts: dict[str, int] = {}
    for table_name in TABLE_COLUMNS:
        rows = input_tables.get(table_name, [])
        df = pl.DataFrame(rows) if rows else pl.DataFrame(schema={column: pl.String for column in TABLE_COLUMNS[table_name]})
        table_rows[table_name] = df.to_dicts()
        row_counts[table_name] = df.height
    return table_rows, row_counts


def polars_summary(table_rows: dict[str, list[dict[str, Any]]], row_counts: dict[str, int]) -> dict[str, Any]:
    tool_status_counts = Counter(str(row.get("result_status", "")) for row in table_rows["tool_results"])
    phase_status_counts = Counter(str(row.get("status", "")) for row in table_rows["phase_runs"])
    beta_counts = Counter(str(row.get("status", "")) for row in table_rows["beta_gate_inputs"])
    blocker_counts = Counter((str(row.get("severity", "")), str(row.get("status", ""))) for row in table_rows["blockers"])
    artifact_totals: dict[str, dict[str, int]] = defaultdict(lambda: {"objectCount": 0, "totalSizeBytes": 0})
    for row in table_rows["artifact_objects"]:
        phase_id = str(row.get("phase_id", ""))
        artifact_totals[phase_id]["objectCount"] += int(row.get("object_count") or 0)
        artifact_totals[phase_id]["totalSizeBytes"] += int(row.get("total_size_bytes") or 0)
    return {
        "status": "passed",
        "polarsVersion": pl.__version__,
        "cloudObjectStoreReadsUsed": False,
        "rowCounts": row_counts,
        "toolStatusCounts": dict(tool_status_counts),
        "phaseStatusCounts": dict(phase_status_counts),
        "blockerCounts": [
            {"severity": severity, "status": status, "count": count}
            for (severity, status), count in sorted(blocker_counts.items())
        ],
        "artifactObjectCounts": [
            {"phaseId": phase_id, **totals}
            for phase_id, totals in sorted(artifact_totals.items())
        ],
        "betaGateStatusCounts": dict(beta_counts),
    }


def compare_summaries(duck: dict[str, Any], polars: dict[str, Any]) -> dict[str, Any]:
    differences: list[dict[str, Any]] = []
    for key in ["rowCounts", "toolStatusCounts", "phaseStatusCounts", "betaGateStatusCounts"]:
        if duck.get(key) != polars.get(key):
            differences.append({"severity": "block", "field": key, "duckdb": duck.get(key), "polars": polars.get(key)})
    if duck.get("blockerCounts") != polars.get("blockerCounts"):
        differences.append({"severity": "block", "field": "blockerCounts", "duckdb": duck.get("blockerCounts"), "polars": polars.get("blockerCounts")})
    if duck.get("artifactObjectCounts") != polars.get("artifactObjectCounts"):
        differences.append({"severity": "block", "field": "artifactObjectCounts", "duckdb": duck.get("artifactObjectCounts"), "polars": polars.get("artifactObjectCounts")})
    return {
        "status": "passed" if not differences else "blocked",
        "checks": {
            "rowCountsMatch": duck.get("rowCounts") == polars.get("rowCounts"),
            "toolStatusCountsMatch": duck.get("toolStatusCounts") == polars.get("toolStatusCounts"),
            "blockerCountsMatch": duck.get("blockerCounts") == polars.get("blockerCounts"),
            "phaseReadinessStatusesMatch": duck.get("phaseStatusCounts") == polars.get("phaseStatusCounts"),
            "artifactObjectCountsMatch": duck.get("artifactObjectCounts") == polars.get("artifactObjectCounts"),
            "betaGateInputStatusesMatch": duck.get("betaGateStatusCounts") == polars.get("betaGateStatusCounts"),
        },
        "differences": differences,
    }


def readiness_scorecard(input_data: dict[str, Any], consistency: dict[str, Any]) -> dict[str, Any]:
    rows = input_data["tables"]["readiness_scorecard"]
    blocked = [row for row in rows if row.get("status") == "block"]
    warnings = [row for row in rows if row.get("status") == "warn"]
    private_read = input_data.get("privateArtifactReadReport", {})
    status = "passed" if not blocked and consistency["status"] == "passed" and private_read.get("status") == "passed" else "blocked"
    return {
        "phase": input_data["phase"],
        "runId": input_data["runId"],
        "status": status,
        "criteria": rows,
        "blockedCriteria": blocked,
        "warningCriteria": warnings,
        "privateArtifactReadStatus": private_read.get("status"),
        "consistencyStatus": consistency["status"],
        "mediaDataToolFamilyBetaStatus": "phase-complete but tool-family incomplete" if status == "passed" else "blocked",
        "nextPhaseDecision": "Media/data internal beta-readiness gate is next." if status == "passed" else "Resolve Phase 46D reporting blockers before beta-readiness gate.",
    }


def blocker_report(input_data: dict[str, Any], consistency: dict[str, Any], scorecard: dict[str, Any]) -> dict[str, Any]:
    blockers = list(input_data["tables"]["blockers"])
    if consistency["status"] != "passed":
        blockers.append({
            "blocker_id": "phase46d-duckdb-polars-consistency",
            "phase_id": "46D",
            "tool_id": "duckdb_polars",
            "severity": "block",
            "status": "open",
            "reason": "DuckDB and Polars reporting summaries disagree.",
            "next_action": "Repair deterministic reporting schema or transform parity.",
        })
    private_read = input_data.get("privateArtifactReadReport", {})
    if private_read.get("status") != "passed":
        blockers.append({
            "blocker_id": "phase46d-private-artifact-read",
            "phase_id": "46D",
            "tool_id": "private_artifacts",
            "severity": "block",
            "status": "open",
            "reason": f"Private artifact read status is {private_read.get('status')}.",
            "next_action": "Restore exact Phase 46B/46C private JSON metadata read access.",
        })
    open_blocks = [row for row in blockers if row.get("severity") == "block" and row.get("status") not in {"closed", "tracked"}]
    return {
        "phase": input_data["phase"],
        "runId": input_data["runId"],
        "status": "passed" if not open_blocks and scorecard["status"] == "passed" else "blocked",
        "blockers": blockers,
        "blockedScopes": input_data.get("blockedScopes", []),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-json", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--run-id", required=True)
    args = parser.parse_args()

    input_data = json.loads(Path(args.input_json).read_text(encoding="utf-8"))
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    tables = input_data["tables"]

    con, duck_row_counts = create_duckdb_tables(tables)
    duck_tables = {table_name: fetch_rows(con, table_name) for table_name in TABLE_COLUMNS}
    duck_summary_report = duckdb_summary(con, duck_row_counts)
    duck_blocker_summary = {
        "phase": input_data["phase"],
        "runId": input_data["runId"],
        "status": "passed",
        "blockersBySeverity": duck_summary_report["blockerCounts"],
    }

    polars_table_rows, polars_row_counts = polars_tables(tables)
    polars_summary_report = polars_summary(polars_table_rows, polars_row_counts)
    polars_blocker_summary = {
        "phase": input_data["phase"],
        "runId": input_data["runId"],
        "status": "passed",
        "blockersBySeverity": polars_summary_report["blockerCounts"],
    }

    consistency = compare_summaries(duck_summary_report, polars_summary_report)
    scorecard = readiness_scorecard(input_data, consistency)
    blockers = blocker_report(input_data, consistency, scorecard)
    integration_status = "passed" if scorecard["status"] == "passed" and blockers["status"] == "passed" else "blocked"

    storage_privacy = {
        "phase": input_data["phase"],
        "runId": input_data["runId"],
        "status": "passed",
        "noMediaProcessing": True,
        "noFrameReads": True,
        "noThumbnailReads": True,
        "noSignedUrls": True,
        "noPublicOutput": True,
        "privateArtifactPrefix": input_data["privateArtifactPrefix"],
        "allowedInputs": "committed safe metadata and exact Phase 46B/46C private JSON reports only",
    }
    beta_gate = {
        "phase": input_data["phase"],
        "runId": input_data["runId"],
        "status": "ready_for_gate" if integration_status == "passed" else "blocked",
        "inputs": tables["beta_gate_inputs"],
        "mediaDataToolFamilyBetaStatus": "phase-complete but tool-family incomplete" if integration_status == "passed" else "blocked",
        "nextPhase": "Phase 46E media/data internal beta-readiness gate" if integration_status == "passed" else "Phase 46D blocker follow-up",
    }
    private_manifest = {
        "phase": input_data["phase"],
        "runId": input_data["runId"],
        "status": "pending_upload",
        "privateArtifactPrefix": input_data["privateArtifactPrefix"],
        "localArtifactCount": 0,
        "privateUpload": {"status": "pending"},
    }
    integration_report = {
        "phase": input_data["phase"],
        "runId": input_data["runId"],
        "status": integration_status,
        "sourcePhase46aPr": input_data["sourcePhase46aPr"],
        "sourcePhase46bPr": input_data["sourcePhase46bPr"],
        "sourcePhase46cPr": input_data["sourcePhase46cPr"],
        "privateArtifactReadStatus": input_data.get("privateArtifactReadReport", {}).get("status"),
        "duckdbVersion": duckdb.__version__,
        "polarsVersion": pl.__version__,
        "tableRowCounts": duck_row_counts,
        "consistencyStatus": consistency["status"],
        "readinessScorecardStatus": scorecard["status"],
        "privacyStorageStatus": storage_privacy["status"],
        "privateArtifactStatus": "pending_upload",
        "noMediaProcessing": True,
        "noProviderCalls": True,
        "mediaDataToolFamilyBetaStatus": "phase-complete but tool-family incomplete" if integration_status == "passed" else "blocked",
        "nextPhaseDecision": "Media/data internal beta-readiness gate is next." if integration_status == "passed" else "Resolve Phase 46D blockers before beta-readiness gate.",
    }

    write_json(output_dir / "phase_46d_reporting_input_manifest.json", input_data["inputManifest"])
    write_json(output_dir / "phase_46d_private_artifact_read_report.json", input_data["privateArtifactReadReport"])
    write_json(output_dir / "phase_46d_reporting_schema.json", {"phase": input_data["phase"], "runId": input_data["runId"], "tables": TABLE_COLUMNS})
    write_json(output_dir / "phase_46d_duckdb_reporting_tables.json", {"phase": input_data["phase"], "runId": input_data["runId"], "status": "passed", "tables": duck_tables, "rowCounts": duck_row_counts})
    write_json(output_dir / "phase_46d_duckdb_qa_summary.json", duck_summary_report)
    write_json(output_dir / "phase_46d_duckdb_blocker_summary.json", duck_blocker_summary)
    write_json(output_dir / "phase_46d_polars_reporting_tables.json", {"phase": input_data["phase"], "runId": input_data["runId"], "status": "passed", "tables": polars_table_rows, "rowCounts": polars_row_counts})
    write_json(output_dir / "phase_46d_polars_qa_summary.json", polars_summary_report)
    write_json(output_dir / "phase_46d_polars_blocker_summary.json", polars_blocker_summary)
    write_json(output_dir / "phase_46d_duckdb_polars_consistency_report.json", consistency)
    write_json(output_dir / "phase_46d_media_data_readiness_scorecard.json", scorecard)
    write_json(output_dir / "phase_46d_beta_gate_input_manifest.json", beta_gate)
    write_json(output_dir / "phase_46d_storage_privacy_report.json", storage_privacy)
    write_json(output_dir / "phase_46d_private_artifact_manifest.json", private_manifest)
    write_json(output_dir / "phase_46d_blocker_report.json", blockers)
    write_json(output_dir / "phase_46d_reporting_qa_integration_report.json", integration_report)


if __name__ == "__main__":
    main()
