# Phase 46C Controlled Media/Data Worker

This worker is activation-only. It processes exactly one approved private controlled real-video sample after the TypeScript activation runner has copied and SHA-256 verified it.

It must not accept arbitrary media, process broad user media, call providers, run OCR/VLM, write public artifacts, or commit media-derived images. Runtime dependencies are installed in temporary isolated environments only.
