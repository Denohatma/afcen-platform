"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
  SECTOR_LABELS,
  OWNERSHIP_LABELS,
  SUBCATEGORY_LABELS,
  STATUS_LABELS,
} from "@/lib/scoring/labels";

type Phase = "search" | "researching" | "review" | "creating" | "running" | "done" | "error";

interface SiteData {
  name: string;
  country: string;
  sector: string;
  capacityMW: number | null;
  ownershipType: string;
  subCategory: string;
  status: string;
  commissionedYear: number | null;
  originalCostUsd: number | null;
  description: string;
  strategicContext: string;
  operator: string | null;
  developer: string | null;
  waterBody: string | null;
  region: string | null;
}

interface PipelineResult {
  studyId: string;
  status: string;
  composite: number;
  signal: string;
  document: string;
}

export default function ResearchPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("search");
  const [siteName, setSiteName] = useState("");
  const [siteData, setSiteData] = useState<SiteData | null>(null);
  const [assetId, setAssetId] = useState<string | null>(null);
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pipelineProgress, setPipelineProgress] = useState("");

  async function handleResearch() {
    setPhase("researching");
    setError(null);

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteName }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Research failed");
      }

      const data = await res.json();
      setSiteData(data);
      setPhase("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Research failed");
      setPhase("error");
    }
  }

  async function handleCreateAndRun() {
    if (!siteData) return;
    setPhase("creating");
    setError(null);

    try {
      // Create the asset
      const createRes = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: siteData.name,
          country: siteData.country,
          sector: siteData.sector,
          ownershipType: siteData.ownershipType,
          subCategory: siteData.subCategory,
          status: siteData.status,
          capacityMW: siteData.capacityMW,
          capacityValue: siteData.capacityMW,
          capacityUnit: "MW",
          commissionedYear: siteData.commissionedYear,
          originalCostUsd: siteData.originalCostUsd,
          description: siteData.description,
          strategicContext: siteData.strategicContext,
        }),
      });

      if (!createRes.ok) {
        const data = await createRes.json();
        throw new Error(data.error || "Failed to create asset");
      }

      const asset = await createRes.json();
      setAssetId(asset.id);
      setPhase("running");
      setPipelineProgress("Initialising 23-agent pipeline...");

      // Run the pre-feasibility pipeline
      const pipelineRes = await fetch(`/api/assets/${asset.id}/prefeasibility`, {
        method: "POST",
      });

      if (!pipelineRes.ok) {
        const data = await pipelineRes.json();
        throw new Error(data.error || "Pipeline failed");
      }

      const result = await pipelineRes.json();
      setPipelineResult(result);
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
      setPhase("error");
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        &larr; Back to Pipeline
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Pre-Feasibility Research</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enter an infrastructure asset name to research, score, and generate an IC document
        </p>
      </div>

      {/* Phase indicator */}
      <div className="flex gap-3 text-sm">
        {[
          { key: "search", label: "1. Search" },
          { key: "review", label: "2. Review" },
          { key: "running", label: "3. Agents" },
          { key: "done", label: "4. Report" },
        ].map((s, i) => {
          const isActive = s.key === phase || (s.key === "search" && phase === "researching") || (s.key === "running" && phase === "creating");
          const isDone = (
            (s.key === "search" && ["review", "creating", "running", "done"].includes(phase)) ||
            (s.key === "review" && ["creating", "running", "done"].includes(phase)) ||
            (s.key === "running" && phase === "done")
          );
          return (
            <div key={s.key} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                isActive ? "bg-primary text-primary-foreground" :
                isDone ? "bg-green-100 text-green-700" :
                "bg-muted text-muted-foreground"
              }`}>
                {isDone ? "✓" : i + 1}
              </div>
              <span className={isActive ? "font-medium" : "text-muted-foreground"}>{s.label}</span>
              {i < 3 && <div className="w-6 h-px bg-border" />}
            </div>
          );
        })}
      </div>

      {/* Phase: Search */}
      {(phase === "search" || phase === "researching") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search for an infrastructure asset</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <input
                className="flex-1 rounded-md border p-3 text-sm bg-background"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && siteName.length >= 2 && handleResearch()}
                placeholder="e.g. Bujagali Hydropower, Karuma HPP, Inga Dam..."
                disabled={phase === "researching"}
              />
              <Button
                onClick={handleResearch}
                disabled={siteName.length < 2 || phase === "researching"}
              >
                {phase === "researching" ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⟳</span> Researching...
                  </span>
                ) : (
                  "Research Site"
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              The system will fetch site details including capacity, commissioning year, capex, and operational status.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Phase: Review */}
      {phase === "review" && siteData && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Research Results — Review & Confirm</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary">{siteData.country}</Badge>
                <Badge variant="secondary">
                  {SECTOR_LABELS[siteData.sector as keyof typeof SECTOR_LABELS] ?? siteData.sector}
                </Badge>
                {siteData.capacityMW && (
                  <Badge variant="outline">{siteData.capacityMW} MW</Badge>
                )}
                <Badge variant="outline">
                  {OWNERSHIP_LABELS[siteData.ownershipType as keyof typeof OWNERSHIP_LABELS] ?? siteData.ownershipType}
                </Badge>
                <Badge variant="outline">
                  {STATUS_LABELS[siteData.status as keyof typeof STATUS_LABELS] ?? siteData.status}
                </Badge>
                <Badge>
                  {SUBCATEGORY_LABELS[siteData.subCategory as keyof typeof SUBCATEGORY_LABELS] ?? siteData.subCategory}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>
                  <p className="font-medium">{siteData.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Country:</span>
                  <p className="font-medium">{siteData.country}</p>
                </div>
                {siteData.commissionedYear && (
                  <div>
                    <span className="text-muted-foreground">Commissioned:</span>
                    <p className="font-medium">{siteData.commissionedYear}</p>
                  </div>
                )}
                {siteData.originalCostUsd && (
                  <div>
                    <span className="text-muted-foreground">Original Cost:</span>
                    <p className="font-medium">USD {(siteData.originalCostUsd / 1e6).toFixed(0)}M</p>
                  </div>
                )}
                {siteData.operator && (
                  <div>
                    <span className="text-muted-foreground">Operator:</span>
                    <p className="font-medium">{siteData.operator}</p>
                  </div>
                )}
                {siteData.developer && (
                  <div>
                    <span className="text-muted-foreground">Developer:</span>
                    <p className="font-medium">{siteData.developer}</p>
                  </div>
                )}
                {siteData.waterBody && (
                  <div>
                    <span className="text-muted-foreground">Water Body:</span>
                    <p className="font-medium">{siteData.waterBody}</p>
                  </div>
                )}
                {siteData.region && (
                  <div>
                    <span className="text-muted-foreground">Region:</span>
                    <p className="font-medium">{siteData.region}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-sm text-muted-foreground">Description:</span>
                <p className="text-sm">{siteData.description}</p>
              </div>

              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                <p className="text-xs font-medium text-blue-800 mb-1">Strategic Context</p>
                <p className="text-sm text-blue-700">{siteData.strategicContext}</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setPhase("search"); setSiteData(null); }}>
              Search Again
            </Button>
            <Button onClick={handleCreateAndRun}>
              Create Asset & Run Pre-Feasibility Pipeline
            </Button>
          </div>
        </div>
      )}

      {/* Phase: Creating / Running */}
      {(phase === "creating" || phase === "running") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {phase === "creating" ? "Creating asset..." : "Running Pre-Feasibility Pipeline"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="animate-spin text-2xl">⟳</div>
              <div>
                <p className="font-medium">{pipelineProgress}</p>
                <p className="text-sm text-muted-foreground">
                  Running 14 Tier-1 domain agents + 9 Tier-2 synthesis agents. This takes 2-4 minutes.
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground">
              <p>Tier 1: Hydrology, Topography & Civil, Electromechanical, Transmission & Grid, Energy Yield, Demand & Market, Commercial, Regulatory, ESG, Carbon, Comparables, Macro & Country, Financial, Modernisation Scope</p>
              <p>Tier 2: Scoring Engine, Capital Stack, Business Model, Returns, Risk Register, Strategic Rationale, Policy Brief, Questions Generator, Executive Summary</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phase: Done */}
      {phase === "done" && pipelineResult && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-3">
                Pre-Feasibility Study Complete
                <Badge
                  variant={
                    pipelineResult.signal === "GO" ? "default" :
                    pipelineResult.signal === "CONDITIONAL" ? "secondary" :
                    "destructive"
                  }
                  className={
                    pipelineResult.signal === "GO" ? "bg-green-600" :
                    pipelineResult.signal === "CONDITIONAL" ? "bg-orange-500 text-white" :
                    ""
                  }
                >
                  {pipelineResult.signal}
                </Badge>
                <Badge variant="outline">
                  Composite: {pipelineResult.composite?.toFixed(2)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div className="whitespace-pre-wrap text-sm font-mono bg-muted/50 rounded-lg p-6 max-h-[600px] overflow-y-auto">
                  {pipelineResult.document}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push(`/assets/${assetId}`)}>
              View Asset Detail
            </Button>
            <Button variant="outline" onClick={() => router.push(`/assets/${assetId}/brief`)}>
              View IC Brief
            </Button>
            <Button onClick={() => { setPhase("search"); setSiteData(null); setPipelineResult(null); setSiteName(""); }}>
              Research Another Asset
            </Button>
          </div>
        </div>
      )}

      {/* Phase: Error */}
      {phase === "error" && (
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <p className="text-red-600 text-sm">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setPhase("search")}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
