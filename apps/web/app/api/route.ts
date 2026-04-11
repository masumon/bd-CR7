import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      data: {
        service: "bd-cr7-api-proxy",
        status: "ok",
        endpoints: ["/api/health", "/api/health/db", "/api/ready"],
      },
    },
    { status: 200 }
  );
}
