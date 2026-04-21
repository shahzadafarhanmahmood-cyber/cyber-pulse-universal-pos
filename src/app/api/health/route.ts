import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "cyber-pulse-pos",
    timestamp: new Date().toISOString()
  });
}
