# Investment Committee — Concept Stage Brief
## {{asset.name}} — {{asset.country}}

**Prepared by:** AfCEN Asset Recycling Module
**Generated:** {{generatedAt}}
**Asset Sub-Category:** {{asset.subCategory}}
**AfCEN Composite Score:** {{composite}} / 10
**Recommendation Signal:** {{signal}}

---

## 1. Investment Overview

| Field | Value |
|---|---|
| Asset | {{asset.name}} |
| Country / Region | {{asset.country}} |
| Sector | {{asset.sector}} |
| Capacity | {{asset.capacityValue}} {{asset.capacityUnit}} |
| Ownership | {{asset.ownershipType}} |
| Status | {{asset.status}} |
| Commissioned | {{asset.commissionedYear}} |
| Original Cost | USD {{asset.originalCostUsd}} |
| Transaction Type | Asset recycling / brownfield refinancing |

## 2. Strategic Rationale

{{strategicNarrative}}

## 3. AfCEN Scorecard

{{#each scores}}
### {{dimension}} — {{score}}/10
{{rationale}}
{{/each}}

**Composite:** {{composite}}/10 — **{{signal}}**

## 4. Path to GO

{{#each pathActions}}
{{@index}}. {{description}} (impact: +{{scoreUplift}} on {{affectsDimension}}; cost: {{estimatedCost}}; time: {{estimatedTime}})
{{/each}}

## 5. Comparable Transactions

{{comparables}}

## 6. Risks & Conditions Precedent

{{risks}}

## 7. Recommendation

{{recommendation}}
