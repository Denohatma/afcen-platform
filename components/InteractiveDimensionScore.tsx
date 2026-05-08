"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { DIMENSION_LABELS } from "@/lib/scoring/labels";
import { DEFAULT_WEIGHTS } from "@/lib/scoring/weights";
import type { Dimension } from "@prisma/client";
import type { ScoreData } from "./Scorecard";

interface Props {
  assetId: string;
  dimension: Dimension;
  score: number;
  rationale: string;
  confidence: number;
  scoredBy: string;
  onUpdate: (updated: ScoreData) => void;
}

interface AISuggestion {
  score: number;
  rationale: string;
  confidence: number;
  evidenceCitations: string[];
}

export function InteractiveDimensionScore({
  assetId,
  dimension,
  score,
  rationale,
  confidence,
  scoredBy,
  onUpdate,
}: Props) {
  const weight = DEFAULT_WEIGHTS[dimension];
  const barColor =
    score >= 7
      ? "bg-emerald-500"
      : score >= 4
        ? "bg-amber-500"
        : "bg-red-500";

  const [editing, setEditing] = useState(false);
  const [editScore, setEditScore] = useState(score);
  const [editRationale, setEditRationale] = useState(rationale);
  const [saving, setSaving] = useState(false);

  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);

  async function saveScore(
    newScore: number,
    newRationale: string,
    newConfidence: number,
    newScoredBy: string
  ) {
    setSaving(true);
    try {
      const res = await fetch(`/api/assets/${assetId}/scores`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dimension,
          score: newScore,
          rationale: newRationale,
          confidence: newConfidence,
          scoredBy: newScoredBy,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save score");
      }

      onUpdate({
        dimension,
        score: newScore,
        rationale: newRationale,
        confidence: newConfidence,
        scoredBy: newScoredBy,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleManualSave() {
    await saveScore(editScore, editRationale, confidence, "analyst:manual");
    setEditing(false);
  }

  async function handleAiRescore() {
    setAiLoading(true);
    setAiError(null);
    setAiSuggestion(null);

    try {
      const res = await fetch(`/api/assets/${assetId}/score-with-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dimension }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "AI scoring failed");
      }

      const data = await res.json();
      setAiSuggestion(data.suggestion);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI scoring failed");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleAcceptAi() {
    if (!aiSuggestion) return;
    await saveScore(
      aiSuggestion.score,
      aiSuggestion.rationale,
      aiSuggestion.confidence,
      "ai-accepted"
    );
    setAiDialogOpen(false);
    setAiSuggestion(null);
  }

  function openAiDialog() {
    setAiDialogOpen(true);
    handleAiRescore();
  }

  return (
    <>
      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm">
              {DIMENSION_LABELS[dimension]}
            </h4>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {(weight * 100).toFixed(0)}%
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {confidence < 0.6 && (
              <span
                className="text-amber-600 text-xs font-medium"
                title="Low confidence — under-evidenced"
              >
                Low confidence
              </span>
            )}
            <span
              className={cn(
                "text-2xl font-bold tabular-nums",
                score >= 7
                  ? "text-emerald-700"
                  : score >= 4
                    ? "text-amber-700"
                    : "text-red-700"
              )}
            >
              {score}
            </span>
            <span className="text-sm text-muted-foreground">/10</span>
          </div>
        </div>

        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", barColor)}
            style={{ width: `${score * 10}%` }}
          />
        </div>

        {editing ? (
          <div className="space-y-3 pt-1">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">Score</label>
                <span className="text-sm font-bold tabular-nums">
                  {editScore}
                </span>
              </div>
              <Slider
                value={[editScore]}
                onValueChange={(v) =>
                  setEditScore(Array.isArray(v) ? v[0] : v)
                }
                min={1}
                max={10}
                step={1}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Rationale</label>
              <textarea
                className="w-full text-sm rounded-md border p-2 min-h-[60px] resize-y bg-background"
                value={editRationale}
                onChange={(e) => setEditRationale(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleManualSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditing(false);
                  setEditScore(score);
                  setEditRationale(rationale);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {rationale}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Scored by: {scoredBy}
              </span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-7"
                  onClick={() => {
                    setEditScore(score);
                    setEditRationale(rationale);
                    setEditing(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7"
                  onClick={openAiDialog}
                >
                  Re-score with AI
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              AI Re-score: {DIMENSION_LABELS[dimension]}
            </DialogTitle>
            <DialogDescription>
              AI analyzes uploaded documents and the asset profile to suggest a
              score.
            </DialogDescription>
          </DialogHeader>

          {aiLoading && (
            <div className="py-8 text-center space-y-2">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-sm text-muted-foreground">
                Analyzing documents and scoring...
              </p>
            </div>
          )}

          {aiError && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-700">{aiError}</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={handleAiRescore}
              >
                Retry
              </Button>
            </div>
          )}

          {aiSuggestion && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground">
                    Current:
                  </span>
                  <span className="text-lg font-bold">{score}</span>
                </div>
                <span className="text-muted-foreground">→</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground">
                    AI suggests:
                  </span>
                  <span
                    className={cn(
                      "text-lg font-bold",
                      aiSuggestion.score >= 7
                        ? "text-emerald-700"
                        : aiSuggestion.score >= 4
                          ? "text-amber-700"
                          : "text-red-700"
                    )}
                  >
                    {aiSuggestion.score}
                  </span>
                  <span className="text-sm text-muted-foreground">/10</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {(aiSuggestion.confidence * 100).toFixed(0)}% confidence
                </Badge>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium">Rationale</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {aiSuggestion.rationale}
                </p>
              </div>

              {aiSuggestion.evidenceCitations.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium">Evidence Citations</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {aiSuggestion.evidenceCitations.map((c, i) => (
                      <li key={i} className="flex gap-1.5">
                        <span className="text-muted-foreground/50">•</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {aiSuggestion && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setAiDialogOpen(false);
                  setEditScore(aiSuggestion.score);
                  setEditRationale(aiSuggestion.rationale);
                  setEditing(true);
                  setAiSuggestion(null);
                }}
              >
                Edit first
              </Button>
              <Button onClick={handleAcceptAi} disabled={saving}>
                {saving ? "Saving..." : "Accept"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
