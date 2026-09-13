# ZENOMORPH foreign-food held-out — Open Exoplanet Catalogue astronomy specimen

Status: `HELD-OUT SUPPORT / CANDIDATE NOT INCORPORATED`

## Food

One complete public XML record from the Open Exoplanet Catalogue (`systems/11 Com.xml`), retrieved from the public GitHub repository. Exact source identity is retained by Git blob SHA `814c01f58ad2c8784c1cac6feaa14096272d2f4d`; observed repository head at retrieval was `b0e27e5deed742d7925b647d7154b58b19652816`. The catalogue declares an MIT license.

## Neutral ingest observation

The source record contains positional fields for the planetary system (right ascension, declination, distance) and an explicit XML hierarchy in which a `system` contains a `star`, and that `star` contains a `planet` (`11 Com b`). The record does not assert any edge from this system to another planetary system.

## Held-out pressure test

The previous seismic-food candidate split relation handling into two independent axes:

- `relation_semantics`: topology / membership / provenance / similarity / other;
- `relation_origin`: `source_explicit` vs `derived`.

This astronomy specimen supports that split without requiring a biological or urban-network analogy:

1. star→planet hosting/containment is source-explicit in the XML hierarchy;
2. sky-coordinate or distance proximity between two different systems would be a derived relation unless explicitly asserted by the source;
3. therefore the presence of coordinates does not authorize a topology edge, while explicit hierarchy can still be retained as a real source relation.

This is a useful held-out result because one food contains both temptations at once: real source-explicit structure and fields from which additional relations could easily be computed. The system must not collapse them.

## Cross-food status

The candidate has now survived materially different relation cases:

- MaleCNS: explicit structural parent-child relation;
- HCA metadata: explicit non-topological membership relation;
- USGS seismic events: coordinates/time with no explicit event-to-event topology;
- Open Exoplanet Catalogue: explicit hierarchical hosting relation plus positional fields that can tempt derived proximity edges.

The observed behavior is therefore no longer tied to one domain or one data shape. However, this still does **not** authorize incorporation.

## Remaining validation before incorporation

- delayed rerun after unrelated foods;
- a case where source-explicit relation and derived relation conflict or compete for routing;
- cross-organ regression showing GUT/VAJRA/MUTHER preserve both `relation_semantics` and `relation_origin` without provenance loss;
- CI-backed isolated gate test rather than documentation-only evidence.

Lifecycle remains:

`candidate → isolated generation/assembly → stress/provenance/cross-organ/regression validation → incorporation`

No body/wiring change is authorized by this note.
