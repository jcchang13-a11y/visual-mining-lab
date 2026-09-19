# ZENOMORPH ingestion gate — doctoral source

Date: 2026-09-19
Status: SOURCE_IDENTIFIED / INGESTION_NOT_STARTED

## Immutable-source rule
The user's original files are immutable. No source file may be overwritten, renamed, moved, deleted, annotated in place, or used as an experimental output target. All transformation must occur on an isolated copy/artifact.

## Source located
Library source used only for identification/materialization:
- `张荣哲_大陆高校应聘材料_完整合订本_2026.pdf`
- Library file id: `file_00000000923882119e2f3b8ea69b9451`
- Library version: `1`
- Materialized read-only working artifact size: `36,901,734 bytes`
- SHA-256: `8c194174a8fc750d7bf4c16f7a38d0c23b8b68ac2fc849d58b541c220b0e0f82`

The bundle contains the NTU dissertation:
- 張榮哲, 《文萌樓的鬼——都市性產業空間，從主流社會的它者到打造激進政治的原點》
- *Ghosts in Wen-Meng-Lou: From the Othering of a Brothel to the Grounding of a Political Radicalism*
- National Taiwan University, Graduate Institute of Building and Planning, April 2018
- DOI: `10.6342/NTU201800732`

The same library evidence also identifies an earlier Essex PhD thesis draft:
- Jung-Che Chang, *Desperately Looking for the Taiwanese*, thesis draft submitted for the degree of PhD, Department of Government, University of Essex, 2001-10-03.

## Safety decision
Do **not** ingest from the 396-page employment bundle yet. It contains unrelated application material and identity documents. Treat the bundle only as evidence that identifies the dissertation. Before feeding ZENOMORPH, locate a dissertation-only source or create a dissertation-only isolated extract/copy without modifying the bundle.

## Next executable step
1. Locate the dissertation-only file in the user's Library/Drive, preferring an exact thesis file over the employment bundle.
2. Record source identity/version/hash.
3. Create an isolated ingestion copy.
4. Only then run DROPLET → MUTHER → GUT → VAJRA → SHROOMING.
5. Preserve outputs under ZENOMORPH's own workspace; never write back to source.

No mutation of the user's source occurred in this run.
