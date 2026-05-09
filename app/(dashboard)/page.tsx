"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SECTOR_LABELS,
  OWNERSHIP_LABELS,
  SUBCATEGORY_LABELS,
  STATUS_LABELS,
} from "@/lib/scoring/labels";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  action?: string | null;
  siteName?: string | null;
}

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

type FlowPhase = "idle" | "researching" | "review" | "creating" | "running" | "done" | "error";

export default function HomePage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const [flowPhase, setFlowPhase] = useState<FlowPhase>("idle");
  const [siteData, setSiteData] = useState<SiteData | null>(null);
  const [assetId, setAssetId] = useState<string | null>(null);
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, flowPhase]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-10).map((m) => ({ role: m.role === "system" ? "assistant" : m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error("Failed to get response");

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.reply,
        action: data.action,
        siteName: data.siteName,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (data.action === "research_site" && data.siteName) {
        startResearch(data.siteName);
      } else if (data.action === "view_pipeline") {
        router.push("/pipeline");
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setSending(false);
    }
  }

  async function startResearch(siteName: string) {
    setFlowPhase("researching");
    setError(null);
    setMessages((prev) => [...prev, { role: "system", content: `Researching "${siteName}"...` }]);

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
      setFlowPhase("review");
      setMessages((prev) => [...prev, { role: "system", content: `Found ${data.name} (${data.country}). Review the details below and confirm to run the pre-feasibility pipeline.` }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Research failed");
      setFlowPhase("error");
      setMessages((prev) => [...prev, { role: "system", content: `Research failed: ${err instanceof Error ? err.message : "Unknown error"}` }]);
    }
  }

  async function handleCreateAndRun() {
    if (!siteData) return;
    setFlowPhase("creating");
    setError(null);
    setMessages((prev) => [...prev, { role: "system", content: "Creating asset and launching 23-agent pipeline..." }]);

    try {
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
      setFlowPhase("running");

      const pipelineRes = await fetch(`/api/assets/${asset.id}/prefeasibility`, {
        method: "POST",
      });

      if (!pipelineRes.ok) {
        const data = await pipelineRes.json();
        throw new Error(data.error || "Pipeline failed");
      }

      const result = await pipelineRes.json();
      setPipelineResult(result);
      setFlowPhase("done");
      setMessages((prev) => [...prev, { role: "system", content: `Pre-feasibility study complete. Signal: ${result.signal} | Composite: ${result.composite?.toFixed(2)}` }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
      setFlowPhase("error");
      setMessages((prev) => [...prev, { role: "system", content: `Pipeline failed: ${err instanceof Error ? err.message : "Unknown error"}` }]);
    }
  }

  function resetFlow() {
    setFlowPhase("idle");
    setSiteData(null);
    setAssetId(null);
    setPipelineResult(null);
    setError(null);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && flowPhase === "idle" && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 px-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">A</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">AfCEN Assistant</h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Tell me what you'd like to do. I can research infrastructure assets,
                run pre-feasibility studies, or help you explore the pipeline.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {[
                "Evaluate Bujagali Hydropower for asset recycling",
                "Run a pre-feasibility study on Karuma HPP",
                "Show me the asset pipeline",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => { setInput(suggestion); }}
                  className="text-xs border rounded-full px-3 py-1.5 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : msg.role === "system"
                  ? "bg-muted/60 text-muted-foreground italic border"
                  : "bg-card border"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="bg-card border rounded-2xl px-4 py-2.5 text-sm text-muted-foreground">
              <span className="inline-flex gap-1">
                <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
              </span>
            </div>
          </div>
        )}

        {flowPhase === "review" && siteData && (
          <div className="max-w-2xl space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Research Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="text-xs">{siteData.country}</Badge>
                  <Badge variant="secondary" className="text-xs">
                    {SECTOR_LABELS[siteData.sector as keyof typeof SECTOR_LABELS] ?? siteData.sector}
                  </Badge>
                  {siteData.capacityMW && (
                    <Badge variant="outline" className="text-xs">{siteData.capacityMW} MW</Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {OWNERSHIP_LABELS[siteData.ownershipType as keyof typeof OWNERSHIP_LABELS] ?? siteData.ownershipType}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {STATUS_LABELS[siteData.status as keyof typeof STATUS_LABELS] ?? siteData.status}
                  </Badge>
                  <Badge className="text-xs">
                    {SUBCATEGORY_LABELS[siteData.subCategory as keyof typeof SUBCATEGORY_LABELS] ?? siteData.subCategory}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Name</span>
                    <p className="font-medium">{siteData.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Country</span>
                    <p className="font-medium">{siteData.country}</p>
                  </div>
                  {siteData.commissionedYear && (
                    <div>
                      <span className="text-muted-foreground">Commissioned</span>
                      <p className="font-medium">{siteData.commissionedYear}</p>
                    </div>
                  )}
                  {siteData.originalCostUsd && (
                    <div>
                      <span className="text-muted-foreground">Original Cost</span>
                      <p className="font-medium">USD {(siteData.originalCostUsd / 1e6).toFixed(0)}M</p>
                    </div>
                  )}
                  {siteData.operator && (
                    <div>
                      <span className="text-muted-foreground">Operator</span>
                      <p className="font-medium">{siteData.operator}</p>
                    </div>
                  )}
                  {siteData.developer && (
                    <div>
                      <span className="text-muted-foreground">Developer</span>
                      <p className="font-medium">{siteData.developer}</p>
                    </div>
                  )}
                  {siteData.waterBody && (
                    <div>
                      <span className="text-muted-foreground">Water Body</span>
                      <p className="font-medium">{siteData.waterBody}</p>
                    </div>
                  )}
                  {siteData.region && (
                    <div>
                      <span className="text-muted-foreground">Region</span>
                      <p className="font-medium">{siteData.region}</p>
                    </div>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">{siteData.description}</p>

                <div className="rounded-lg bg-blue-50 border border-blue-200 p-2.5">
                  <p className="text-[10px] font-medium text-blue-800 mb-0.5">Strategic Context</p>
                  <p className="text-xs text-blue-700">{siteData.strategicContext}</p>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => { resetFlow(); }}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleCreateAndRun}>
                    Run Pre-Feasibility Pipeline
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {(flowPhase === "creating" || flowPhase === "running") && (
          <div className="max-w-2xl">
            <Card>
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="animate-spin text-xl">&#x27F3;</div>
                  <div>
                    <p className="text-sm font-medium">
                      {flowPhase === "creating" ? "Creating asset..." : "Running 23-agent pipeline"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      14 domain agents + 9 synthesis agents. This takes 2-4 minutes.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {flowPhase === "done" && pipelineResult && (
          <div className="max-w-3xl space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  Pre-Feasibility Complete
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
                    {pipelineResult.composite?.toFixed(2)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="whitespace-pre-wrap text-xs font-mono bg-muted/50 rounded-lg p-4 max-h-[500px] overflow-y-auto">
                  {pipelineResult.document}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => router.push(`/assets/${assetId}`)}>
                    View Asset
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => router.push(`/assets/${assetId}/brief`)}>
                    View IC Brief
                  </Button>
                  <Button size="sm" onClick={resetFlow}>
                    New Conversation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {flowPhase === "error" && (
          <div className="max-w-2xl">
            <Card className="border-red-200">
              <CardContent className="pt-5">
                <p className="text-red-600 text-sm">{error}</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={resetFlow}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <div className="border-t bg-background pt-4 pb-2">
        <div className="flex gap-2 max-w-3xl">
          <input
            ref={inputRef}
            className="flex-1 rounded-xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="What would you like to do?"
            disabled={sending || flowPhase === "researching" || flowPhase === "creating" || flowPhase === "running"}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || sending || flowPhase === "researching" || flowPhase === "creating" || flowPhase === "running"}
            className="rounded-xl px-5"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
