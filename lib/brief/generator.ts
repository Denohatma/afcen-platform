import { prisma } from "@/lib/db";
import { getLLMAdapter } from "@/lib/llm/adapter";
import { generateBriefPrompt } from "@/lib/llm/prompts";

export async function generateICBrief(assetId: string): Promise<string> {
  const asset = await prisma.asset.findUniqueOrThrow({
    where: { id: assetId },
    include: {
      scores: true,
      pathActions: true,
    },
  });

  const adapter = getLLMAdapter();
  const prompt = generateBriefPrompt(asset, asset.scores, asset.pathActions);
  const content = await adapter.complete(prompt);

  const latestBrief = await prisma.iCBrief.findFirst({
    where: { assetId },
    orderBy: { version: "desc" },
  });

  const brief = await prisma.iCBrief.create({
    data: {
      assetId,
      version: (latestBrief?.version ?? 0) + 1,
      content,
      generatedBy: "ai:claude",
    },
  });

  return brief.id;
}
