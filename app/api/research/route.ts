import { NextResponse } from "next/server";
import { z } from "zod";
import { researchSite } from "@/lib/agents/research";

const RequestSchema = z.object({
  siteName: z.string().min(2),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { siteName } = RequestSchema.parse(body);

    const result = await researchSite(siteName);

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    console.error("[AfCEN] Research failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Research failed" },
      { status: 500 }
    );
  }
}
