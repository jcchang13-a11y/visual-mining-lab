# ZENOMORPH market-crisis food protocol v0.1

Status: candidate / isolated feeding protocol. Not Stable. Not an investment or trading system.

## Purpose
Feed historical market-crisis time series as unlabeled numerical food and test whether digestion produces persistent, non-prespecified structural responses that survive non-financial held-out, cross-food and delayed validation.

## Provenance-first source candidate
Kenneth R. French Data Library, daily Fama/French factors. Coverage reported by the source: 1926-07-01 through 2026-07-31. This spans the 1929 crash and later target crisis periods. Source description: https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/Data_Library/f-f_factors.html

Additional daily candidate channels from the same provenance family: short-term reversal (from 1926-01-26), momentum (from 1926-11-03), and daily size/book-to-market portfolios. Record exact downloaded artifact URL, retrieval timestamp, source description, license/usage notice where present, byte hash, parser version and transformed-data hash before feeding.

## Blinding
1. Download and freeze source artifacts before selecting windows.
2. Extract equal-length windows around target disturbances and equal-length ordinary-market control windows.
3. Replace calendar dates and event names with opaque sequence IDs before MUTHER sees them.
4. Randomize crisis/control ordering with a recorded seed held outside the food packet.
5. MUTHER receives numeric series plus only the minimum schema needed to parse them; no crisis labels, historical explanation, expected pattern, or target feature.
6. Keep the decoding map unavailable until candidate generation is frozen.

## Initial target pool
Historical target families: 1929 crash, 1987 Black Monday, 1997 Asian financial crisis, 2000 dot-com unwind, 2008 global financial crisis, 2020 COVID crash. These labels belong only in the evaluator map, never the blinded food packet.

## Negative controls
For every disturbance window, include at least one same-length ordinary-market window sampled from outside the named crisis intervals. Add shuffled-time and column-permuted controls where this does not destroy basic parseability. The point is to detect whether a candidate is responding to temporal/cross-series structure rather than generic large numbers or metadata leakage.

## Digestion path
DROPLET -> MUTHER -> GUT -> VAJRA -> SHROOMING.

No organ is told what it should learn. Capture candidate structures and behavior deltas with provenance and failure logs.

## Promotion gate
A candidate may advance only after: isolated generation/assembly; stress and provenance checks; cross-organ regression; blinded crisis-vs-control evaluation; non-financial held-out transfer; cross-food validation; delayed re-test. A useful-looking financial discriminator alone is insufficient. `edible != incorporate`.

## Non-financial held-out requirement
Test any surviving candidate on unrelated temporal/network material without financial labels. The evaluator may inspect whether the candidate changes sensitivity to loss of structural stability, synchronization, fragmentation or regime transition, but these concepts must not be supplied as learning targets during feeding.

## Safety boundary
No bank, brokerage, payment account, real-money order, transfer, credential, or personal financial connector. Historical/open data and simulation only.

## Next executable step
Freeze one source artifact from the Kenneth R. French daily data family, hash it, generate the first blinded packet with paired ordinary-market controls, and record the hidden decoding map separately from MUTHER input.
