# Future Package Command Plan

Future execution may add `fonts-noto-cjk` to the OCR runtime apt install list with this bounded command pattern:

```bash
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends fonts-noto-cjk
rm -rf /var/lib/apt/lists/*
```

`fonts-noto-cjk-extra` remains fallback-only if execution proves regular/bold coverage is insufficient. Exact PingFang, font binaries, model assets, uploads, public artifacts, and signed URLs remain blocked.
