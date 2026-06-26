#!/usr/bin/env python3
from __future__ import annotations

import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any, Dict


MODE = "qwen2_5_vl_cloud_run_gpu_source_spec_fail_closed"
MODEL_ID = "Qwen/Qwen2.5-VL-7B-Instruct"
MODEL_REVISION = "cc594898137f460bfe9f0759e9844b3ce807cfb5"
MODEL_AGGREGATE_SHA256 = "46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b"

FALSE_GATE_ENV = {
    "MODEL_DOWNLOADS_ENABLED": "false",
    "RAW_VLM_PROMPT_ENABLED": "false",
    "PROVIDER_EXECUTION_ENABLED": "false",
    "MEDIA_PROCESSING_ENABLED": "false",
    "PUBLIC_OUTPUT_ENABLED": "false",
    "TRACK_A_EXECUTION_ENABLED": "false",
    "QWEN_MODEL_IMPORT_ON_STARTUP": "false",
    "QWEN_INFERENCE_ENABLED": "false",
}

TRUE_GATE_ENV = {
    "QWEN_APPROVED_SNAPSHOT_REQUIRED": "true",
    "QWEN_QUEUE_LEASE_REQUIRED": "true",
}


def _env_value(name: str, default: str) -> str:
    return os.environ.get(name, default).strip().lower()


def build_status() -> Dict[str, Any]:
    false_gate_status = {
        name: _env_value(name, expected) == expected for name, expected in FALSE_GATE_ENV.items()
    }
    true_gate_status = {
        name: _env_value(name, expected) == expected for name, expected in TRUE_GATE_ENV.items()
    }
    return {
        "ok": all(false_gate_status.values()) and all(true_gate_status.values()),
        "mode": MODE,
        "modelId": MODEL_ID,
        "modelRevision": MODEL_REVISION,
        "modelAggregateSha256": MODEL_AGGREGATE_SHA256,
        "modelCacheMount": os.environ.get("QWEN_MODEL_CACHE_MOUNT", "/models/qwen2.5-vl-7b-instruct"),
        "modelImportOnStartup": False,
        "modelInferenceEnabled": False,
        "approvedSnapshotRequired": True,
        "queueLeaseRequired": True,
        "falseGateStatus": false_gate_status,
        "trueGateStatus": true_gate_status,
        "runtimeSideEffects": {
            "modelLoaded": False,
            "inferenceRun": False,
            "providerCallMade": False,
            "workerDispatchMade": False,
            "supabaseTouched": False,
            "sqlExecuted": False,
            "publicArtifactCreated": False,
            "signedUrlCreated": False,
            "creditMutationCreated": False,
        },
    }


class Handler(BaseHTTPRequestHandler):
    server_version = "ReeditProQwenSourceSpec/0"

    def _write_json(self, status: int, payload: Dict[str, Any]) -> None:
        encoded = json.dumps(payload, sort_keys=True).encode("utf-8")
        self.send_response(status)
        self.send_header("content-type", "application/json")
        self.send_header("cache-control", "no-store")
        self.send_header("content-length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def do_GET(self) -> None:
        if self.path in {"/", "/healthz", "/readyz"}:
            status_payload = build_status()
            self._write_json(200 if status_payload["ok"] else 503, status_payload)
            return
        self._write_json(404, {"ok": False, "mode": MODE, "reason": "not_found"})

    def do_POST(self) -> None:
        self._write_json(
            403,
            {
                "ok": False,
                "mode": MODE,
                "reason": "qwen_inference_disabled_in_source_spec",
                "modelInferenceEnabled": False,
                "approvedSnapshotRequired": True,
                "queueLeaseRequired": True,
            },
        )

    def log_message(self, format: str, *args: Any) -> None:
        return


def main() -> None:
    port = int(os.environ.get("PORT", "8080"))
    server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    server.serve_forever()


if __name__ == "__main__":
    main()
