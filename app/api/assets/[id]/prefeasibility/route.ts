import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runPipeline } from "@/lib/agents/orchestrator";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  const study = await prisma.preFeasibilityStudy.create({
    data: {
      assetId: id,
      status: "RUNNING",
      currentAgent: "Initialising pipeline",
      completedAgents: [],
    },
  });

  // Run the pipeline (long-running — this blocks until done)
  try {
    const result = await runPipeline(
      {
        name: asset.name,
        country: asset.country,
        sector: asset.sector,
        capacityMW: asset.capacityMW,
        commissionedYear: asset.commissionedYear,
        originalCostUsd: asset.originalCostUsd,
        status: asset.status,
        ownershipType: asset.ownershipType,
        subCategory: asset.subCategory,
        description: asset.description,
        strategicContext: asset.strategicContext,
      },
      async (update) => {
        await prisma.preFeasibilityStudy.update({
          where: { id: study.id },
          data: {
            currentAgent: update.agent,
            completedAgents: { set: [...(update.completedCount > 0 ? [] : []), update.agent] },
          },
        }).catch(() => {});
      }
    );

    // Store scores in the Asset's DimensionScore records
    const scoringData = result.tier2.scoring.data as Record<string, unknown>;
    const dimensions = (scoringData.dimensions as Array<Record<string, unknown>>) ?? [];
    const pathToGo = (scoringData.path_to_go as Array<Record<string, unknown>>) ?? [];

    for (const dim of dimensions) {
      await prisma.dimensionScore.upsert({
        where: {
          assetId_dimension: {
            assetId: id,
            dimension: dim.dimension as string as never,
          },
        },
        update: {
          score: dim.score as number,
          rationale: dim.rationale as string,
          confidence: dim.confidence as number,
          scoredBy: "pre-feasibility-pipeline",
          scoredAt: new Date(),
        },
        create: {
          assetId: id,
          dimension: dim.dimension as string as never,
          score: dim.score as number,
          rationale: dim.rationale as string,
          confidence: dim.confidence as number,
          scoredBy: "pre-feasibility-pipeline",
        },
      });
    }

    // Store path-to-go actions
    await prisma.pathToGoAction.deleteMany({ where: { assetId: id } });
    for (const action of pathToGo) {
      await prisma.pathToGoAction.create({
        data: {
          assetId: id,
          description: action.action as string,
          affectsDimension: action.affects_dimension as string as never,
          scoreUplift: action.score_uplift as number,
          estimatedCost: action.estimated_cost as string | null,
          estimatedTime: action.estimated_time as string | null,
        },
      });
    }

    // Store the IC brief
    const latestBrief = await prisma.iCBrief.findFirst({
      where: { assetId: id },
      orderBy: { version: "desc" },
    });

    await prisma.iCBrief.create({
      data: {
        assetId: id,
        version: (latestBrief?.version ?? 0) + 1,
        content: result.document,
        generatedBy: "pre-feasibility-pipeline",
      },
    });

    // Update the study record
    await prisma.preFeasibilityStudy.update({
      where: { id: study.id },
      data: {
        status: "COMPLETED",
        agentOutputs: JSON.parse(JSON.stringify({
          tier1_summary: Object.fromEntries(
            Object.entries(result.tier1).map(([k, v]) => [k, {
              agentName: v.agentName,
              confidence: v.confidence,
              dataGaps: v.dataGaps,
              runTimeMs: v.runTimeMs,
            }])
          ),
          tier2_summary: Object.fromEntries(
            Object.entries(result.tier2).map(([k, v]) => [k, {
              agentName: v.agentName,
              confidence: v.confidence,
              runTimeMs: v.runTimeMs,
            }])
          ),
          validation: result.validation,
          provenance: result.provenance,
        })),
        document: result.document,
        currentAgent: null,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      studyId: study.id,
      status: "COMPLETED",
      composite: scoringData.composite,
      signal: scoringData.signal,
      document: result.document,
      provenance: result.provenance,
      validation: result.validation,
    });
  } catch (err) {
    await prisma.preFeasibilityStudy.update({
      where: { id: study.id },
      data: {
        status: "FAILED",
        error: err instanceof Error ? err.message : "Pipeline failed",
        currentAgent: null,
        completedAt: new Date(),
      },
    });

    console.error("[AfCEN] Pipeline failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Pipeline failed", studyId: study.id },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const studies = await prisma.preFeasibilityStudy.findMany({
    where: { assetId: id },
    orderBy: { startedAt: "desc" },
    take: 5,
  });

  return NextResponse.json(studies);
}
