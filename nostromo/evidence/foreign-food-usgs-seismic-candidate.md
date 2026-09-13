# ZENOMORPH foreign-food candidate — USGS seismic event specimen

Status: `CANDIDATE / NOT INCORPORATED`

## Food

Public USGS ANSS/ComCat earthquake event data, fixed historical query for 2014-01-01 UTC to 2014-01-02 UTC. A 10-record specimen is stored beside this note with source identity and canonical sample SHA-256.

## Neutral ingest observation

The specimen supplies event records with IDs, times, magnitudes and point coordinates. In the sampled representation there are **no explicit event-to-event edges**. Spatial closeness, temporal closeness, shared seismic network, similar magnitude, or any clustering performed later are not source topology.

## Candidate pressure exposed

The existing semantic distinction `relation != topology` needs a second independent axis:

- `relation_semantics`: what kind of relation is this? e.g. topology, membership, provenance, similarity.
- `relation_origin`: where did the relation come from? at minimum `source_explicit` vs `derived`.

A relation may be useful and still be derived. Derived relations must retain the derivation rule, parameters/thresholds and source record IDs. They must not satisfy any gate that specifically requires source-explicit topology.

## Why this is only a candidate

This sample does not prove the rule is worth incorporating. It only supplies a counterexample to an unsafe shortcut: coordinate/time fields can make graph construction easy, but ease of construction is not evidence that the source asserted a graph.

Before incorporation, test the candidate against at least:

1. a source with explicit structural edges (e.g. MaleCNS SWC parent-child);
2. a source with explicit non-topological membership relations (e.g. HCA metadata);
3. a second point/event dataset where proximity is tempting but not source-explicit topology (held-out domain, preferably astronomy, migration, AIS or another sensor/event catalogue);
4. delayed rerun after unrelated foods have been processed.

Required lifecycle remains:

`candidate → isolated generation/assembly → stress/provenance/cross-organ/regression validation → incorporation`

No body/wiring change is authorized by this note.
