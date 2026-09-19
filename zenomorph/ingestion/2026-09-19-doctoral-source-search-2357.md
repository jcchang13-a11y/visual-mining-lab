# ZENOMORPH doctoral ingestion — source isolation check

Date: 2026-09-19
Status: BLOCKED_ON_SAFE_ISOLATION / SOURCE_UNTOUCHED

## Evidence checked

The latest ingestion gate correctly identifies the NTU dissertation inside `张荣哲_大陆高校应聘材料_完整合订本_2026.pdf` (Library file id `file_00000000923882119e2f3b8ea69b9451`, version 1) and forbids ingesting the employment bundle directly.

A fresh Library search using the exact dissertation title, English title, and DOI `10.6342/NTU201800732` returned only that same 396-page employment bundle. No dissertation-only Library file was established in this run.

## Decision

Do not feed the employment bundle to ZENOMORPH. It contains unrelated application material and identity documents. The dissertation source remains immutable and untouched.

Do not infer page boundaries and extract speculatively from snippets. A dissertation-only copy must first be established with defensible boundaries or located as a standalone source.

## Next safe executable step

1. Continue looking for a standalone dissertation source in accessible storage/public institutional sources.
2. If none exists, establish exact dissertation page boundaries from the bundle without modifying it.
3. Create a dissertation-only isolated artifact from a copy, record its SHA-256 and provenance, and verify first/last pages.
4. Only after that gate passes may DROPLET → MUTHER → GUT → VAJRA → SHROOMING begin.

No source mutation, rename, move, deletion, annotation-in-place, or ingestion occurred in this run.