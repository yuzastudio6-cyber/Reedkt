from __future__ import annotations

import importlib.util
import inspect
import json
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional


def _safe_import(name: str) -> Dict[str, Any]:
    try:
        module = __import__(name)
        return {
            "name": name,
            "available": True,
            "path": getattr(module, "__file__", None),
            "version": getattr(module, "__version__", None),
        }
    except Exception as exc:
        return {
            "name": name,
            "available": False,
            "errorType": type(exc).__name__,
            "error": str(exc)[:240],
        }


def _module_spec(name: str) -> Dict[str, Any]:
    try:
        spec = importlib.util.find_spec(name)
        return {
            "name": name,
            "available": spec is not None,
            "origin": getattr(spec, "origin", None) if spec else None,
        }
    except Exception as exc:
        return {
            "name": name,
            "available": False,
            "errorType": type(exc).__name__,
            "error": str(exc)[:240],
        }


def _help_probe(command: List[str], timeout: int = 20) -> Dict[str, Any]:
    try:
        result = subprocess.run(command, check=False, capture_output=True, text=True, timeout=timeout)
        text = (result.stdout + "\n" + result.stderr).strip()
        lowered = text.lower()
        interesting = [
            "--guided-decoding-backend",
            "--reasoning-parser",
            "--enable-reasoning",
            "--chat-template",
            "--served-model-name",
            "--limit-mm-per-prompt",
            "structured",
            "grammar",
            "json",
            "xgrammar",
            "guidance",
        ]
        return {
            "command": command,
            "exitCode": result.returncode,
            "available": result.returncode == 0,
            "matchedTerms": [term for term in interesting if term in lowered],
            "safeExcerpt": text[:2400],
        }
    except Exception as exc:
        return {
            "command": command,
            "available": False,
            "errorType": type(exc).__name__,
            "error": str(exc)[:240],
        }


def inspect_vllm_structured_output_capabilities() -> Dict[str, Any]:
    capability: Dict[str, Any] = {
        "pythonVersion": sys.version,
        "pythonExecutable": sys.executable,
        "vllm": _safe_import("vllm"),
        "backendPackages": {
            "xgrammar": _module_spec("xgrammar"),
            "guidance": _module_spec("guidance"),
            "outlines": _module_spec("outlines"),
            "lm-format-enforcer": _module_spec("lmformatenforcer"),
        },
        "structuredOutputsParams": {
            "available": False,
            "constructorSignature": None,
            "jsonParam": "unknown",
            "grammarParam": "unknown",
            "structuralTagParam": "unknown",
            "errors": [],
        },
        "guidedDecodingParams": {
            "available": False,
            "constructorSignature": None,
            "jsonParam": "unknown",
            "grammarParam": "unknown",
            "errors": [],
        },
        "openAiServerHelp": {},
        "notes": [
            "This report reflects the installed runtime inside the Cloud Run image/job, not documentation alone.",
            "Local OpenAI-compatible checks bind only to localhost when executed by the compatibility harness.",
        ],
    }
    try:
        import vllm  # type: ignore

        capability["vllm"]["version"] = getattr(vllm, "__version__", None)
        capability["vllm"]["path"] = getattr(vllm, "__file__", None)
    except Exception as exc:
        capability["vllm"]["available"] = False
        capability["vllm"]["errorType"] = type(exc).__name__
        capability["vllm"]["error"] = str(exc)[:240]
    try:
        from vllm.sampling_params import StructuredOutputsParams  # type: ignore

        signature = str(inspect.signature(StructuredOutputsParams))
        capability["structuredOutputsParams"].update({
            "available": True,
            "constructorSignature": signature,
            "jsonParam": "supported" if "json" in signature else "not_in_signature",
            "grammarParam": "supported" if "grammar" in signature else "not_in_signature",
            "structuralTagParam": "supported" if "structural_tag" in signature or "structuralTag" in signature else "not_in_signature",
        })
    except Exception as exc:
        capability["structuredOutputsParams"]["errors"].append(f"{type(exc).__name__}:{str(exc)[:240]}")
    try:
        from vllm.sampling_params import GuidedDecodingParams  # type: ignore

        signature = str(inspect.signature(GuidedDecodingParams))
        capability["guidedDecodingParams"].update({
            "available": True,
            "constructorSignature": signature,
            "jsonParam": "supported" if "json" in signature else "not_in_signature",
            "grammarParam": "supported" if "grammar" in signature else "not_in_signature",
        })
    except Exception as exc:
        capability["guidedDecodingParams"]["errors"].append(f"{type(exc).__name__}:{str(exc)[:240]}")

    capability["openAiServerHelp"] = {
        "pythonModule": _help_probe([sys.executable, "-m", "vllm.entrypoints.openai.api_server", "--help"]),
        "vllmServe": _help_probe(["vllm", "serve", "--help"]) if Path("/usr/local/bin/vllm").exists() else {"available": False, "reason": "vllm_cli_not_found_at_usr_local_bin"},
    }
    return capability
