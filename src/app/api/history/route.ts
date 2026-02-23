import { NextResponse } from "next/server";

// Replaced by GraphQL at /api/graphql — query `submissions`, mutation `createSubmission`
// Returning empty so the sidebar doesn't crash during the transition
export async function GET() {
  return NextResponse.json([]);
}

export async function POST() {
  return NextResponse.json(
    { error: "Use GraphQL mutation createSubmission instead" },
    { status: 410 },
  );
}
