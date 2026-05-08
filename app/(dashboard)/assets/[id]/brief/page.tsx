"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ICBriefView } from "@/components/ICBriefView";

interface Brief {
  id: string;
  version: number;
  content: string;
  generatedAt: string;
  generatedBy: string;
}

export default function BriefPage() {
  const params = useParams<{ id: string }>();
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBriefs();
  }, [params.id]);

  async function fetchBriefs() {
    setLoading(true);
    const res = await fetch(`/api/assets/${params.id}/brief`);
    const data = await res.json();
    setBriefs(data);
    if (data.length > 0 && selectedVersion === null) {
      setSelectedVersion(data[0].version);
    }
    setLoading(false);
  }

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/assets/${params.id}/brief`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate brief");
      }
      await fetchBriefs();
      const updated = await fetch(`/api/assets/${params.id}/brief`).then((r) =>
        r.json()
      );
      if (updated.length > 0) {
        setSelectedVersion(updated[0].version);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  const currentBrief = briefs.find((b) => b.version === selectedVersion);

  return (
    <div className="space-y-6">
      <Link
        href={`/assets/${params.id}`}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        &larr; Back to Scorecard
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">IC Concept-Stage Brief</h1>
        <div className="flex items-center gap-3">
          {briefs.length > 0 && (
            <select
              className="border rounded-md px-3 py-1.5 text-sm"
              value={selectedVersion ?? ""}
              onChange={(e) => setSelectedVersion(Number(e.target.value))}
            >
              {briefs.map((b) => (
                <option key={b.version} value={b.version}>
                  Version {b.version}
                </option>
              ))}
            </select>
          )}
          <Button onClick={handleGenerate} disabled={generating}>
            {generating
              ? "Generating..."
              : briefs.length === 0
                ? "Generate Brief"
                : "Regenerate"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {generating && (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <div className="animate-pulse space-y-2">
            <p className="text-sm font-medium">
              Generating IC Brief with AI...
            </p>
            <p className="text-xs text-muted-foreground">
              This may take 15-30 seconds
            </p>
          </div>
        </div>
      )}

      {!generating && loading && (
        <div className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
          Loading...
        </div>
      )}

      {!generating && !loading && briefs.length === 0 && (
        <div className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
          No briefs generated yet. Click &ldquo;Generate Brief&rdquo; to create
          one.
        </div>
      )}

      {!generating && currentBrief && (
        <>
          <div className="flex gap-2">
            <a
              href={`/api/assets/${params.id}/brief/${currentBrief.version}/pdf`}
              download
            >
              <Button variant="outline" size="sm">
                Download PDF
              </Button>
            </a>
            <a
              href={`/api/assets/${params.id}/brief/${currentBrief.version}/docx`}
              download
            >
              <Button variant="outline" size="sm">
                Download DOCX
              </Button>
            </a>
          </div>
          <div className="rounded-lg border p-6 bg-white">
            <ICBriefView
              content={currentBrief.content}
              version={currentBrief.version}
              generatedAt={currentBrief.generatedAt}
              generatedBy={currentBrief.generatedBy}
            />
          </div>
        </>
      )}
    </div>
  );
}
