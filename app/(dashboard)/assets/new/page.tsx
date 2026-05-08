"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SECTOR_LABELS,
  OWNERSHIP_LABELS,
  SUBCATEGORY_LABELS,
  STATUS_LABELS,
} from "@/lib/scoring/labels";
import Link from "next/link";

type Step = 1 | 2 | 3;

const STEPS = [
  { num: 1 as const, label: "Identify" },
  { num: 2 as const, label: "Details" },
  { num: 3 as const, label: "Review & Create" },
];

export default function NewAssetPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [sector, setSector] = useState("");
  const [ownershipType, setOwnershipType] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [status, setStatus] = useState("");
  const [capacityValue, setCapacityValue] = useState("");
  const [capacityUnit, setCapacityUnit] = useState("MW");
  const [commissionedYear, setCommissionedYear] = useState("");
  const [originalCostUsd, setOriginalCostUsd] = useState("");
  const [description, setDescription] = useState("");
  const [strategicContext, setStrategicContext] = useState("");

  const step1Valid =
    name && country && sector && ownershipType && subCategory && status;
  const step2Valid = description.length > 0;

  async function handleCreate() {
    setSubmitting(true);
    setError(null);

    try {
      const body: Record<string, unknown> = {
        name,
        country,
        sector,
        ownershipType,
        subCategory,
        status,
        description,
      };

      if (capacityValue) {
        body.capacityValue = parseFloat(capacityValue);
        body.capacityMW =
          capacityUnit === "MW" ? parseFloat(capacityValue) : undefined;
        body.capacityUnit = capacityUnit;
      }
      if (commissionedYear) body.commissionedYear = parseInt(commissionedYear);
      if (originalCostUsd)
        body.originalCostUsd = parseFloat(originalCostUsd) * 1e6;
      if (strategicContext) body.strategicContext = strategicContext;

      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create asset");
      }

      const asset = await res.json();
      router.push(`/assets/${asset.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Creation failed");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        &larr; Back to Pipeline
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Add New Asset</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enter asset details to add to the AfCEN pipeline
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2">
        {STEPS.map((s) => (
          <div key={s.num} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === s.num
                  ? "bg-primary text-primary-foreground"
                  : step > s.num
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {step > s.num ? "✓" : s.num}
            </div>
            <span
              className={`text-sm ${step === s.num ? "font-medium" : "text-muted-foreground"}`}
            >
              {s.label}
            </span>
            {s.num < 3 && (
              <div className="w-8 h-px bg-border mx-1" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Identify */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Asset Name *</label>
            <input
              className="w-full rounded-md border p-2 text-sm bg-background"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Karuma HPP"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Country *</label>
            <input
              className="w-full rounded-md border p-2 text-sm bg-background"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. Uganda"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Sector *</label>
              <Select value={sector} onValueChange={(v) => v && setSector(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sector" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SECTOR_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ownership *</label>
              <Select
                value={ownershipType}
                onValueChange={(v) => v && setOwnershipType(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select ownership" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(OWNERSHIP_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Sub-Category *</label>
              <Select
                value={subCategory}
                onValueChange={(v) => v && setSubCategory(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SUBCATEGORY_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status *</label>
              <Select
                value={status}
                onValueChange={(v) => v && setStatus(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={() => setStep(2)} disabled={!step1Valid}>
              Next: Details
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Details */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Capacity</label>
              <div className="flex gap-2">
                <input
                  className="w-full rounded-md border p-2 text-sm bg-background"
                  type="number"
                  value={capacityValue}
                  onChange={(e) => setCapacityValue(e.target.value)}
                  placeholder="e.g. 255"
                />
                <Select
                  value={capacityUnit}
                  onValueChange={(v) => v && setCapacityUnit(v)}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MW">MW</SelectItem>
                    <SelectItem value="km">km</SelectItem>
                    <SelectItem value="m">m</SelectItem>
                    <SelectItem value="TEU">TEU</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Commissioned Year</label>
              <input
                className="w-full rounded-md border p-2 text-sm bg-background"
                type="number"
                value={commissionedYear}
                onChange={(e) => setCommissionedYear(e.target.value)}
                placeholder="e.g. 2012"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Original Cost (USD M)</label>
              <input
                className="w-full rounded-md border p-2 text-sm bg-background"
                type="number"
                value={originalCostUsd}
                onChange={(e) => setOriginalCostUsd(e.target.value)}
                placeholder="e.g. 900"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description *</label>
            <textarea
              className="w-full rounded-md border p-2 text-sm min-h-[80px] resize-y bg-background"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the asset, its current state, and key characteristics..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Strategic Context</label>
            <textarea
              className="w-full rounded-md border p-2 text-sm min-h-[60px] resize-y bg-background"
              value={strategicContext}
              onChange={(e) => setStrategicContext(e.target.value)}
              placeholder="Why is this asset being considered for the AfCEN pipeline?"
            />
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={() => setStep(3)} disabled={!step2Valid}>
              Next: Review
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="font-semibold">{name}</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{country}</Badge>
              <Badge variant="secondary">
                {SECTOR_LABELS[sector as keyof typeof SECTOR_LABELS]}
              </Badge>
              {capacityValue && (
                <Badge variant="outline">
                  {capacityValue} {capacityUnit}
                </Badge>
              )}
              <Badge variant="outline">
                {
                  OWNERSHIP_LABELS[
                    ownershipType as keyof typeof OWNERSHIP_LABELS
                  ]
                }
              </Badge>
              <Badge variant="outline">
                {STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
              </Badge>
              <Badge>
                {
                  SUBCATEGORY_LABELS[
                    subCategory as keyof typeof SUBCATEGORY_LABELS
                  ]
                }
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
            {strategicContext && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                <p className="text-xs font-medium text-blue-800 mb-1">
                  Strategic Context
                </p>
                <p className="text-sm text-blue-700">{strategicContext}</p>
              </div>
            )}
            {commissionedYear && (
              <p className="text-xs text-muted-foreground">
                Commissioned: {commissionedYear}
              </p>
            )}
            {originalCostUsd && (
              <p className="text-xs text-muted-foreground">
                Original cost: ${originalCostUsd}M
              </p>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            After creation, you can upload documents and run AI scoring from the
            asset detail page.
          </p>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? "Creating..." : "Create Asset"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
