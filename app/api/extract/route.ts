import { NextResponse } from "next/server";

export async function GET() {
  const sidecarUrl = process.env.PYTHON_SIDECAR_URL || "http://localhost:8000";

  try {
    const res = await fetch(`${sidecarUrl}/health`, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { status: "unavailable", error: "Python sidecar is not running" },
      { status: 502 }
    );
  }
}
