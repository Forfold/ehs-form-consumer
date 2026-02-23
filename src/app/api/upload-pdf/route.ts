import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const submissionId = formData.get("submissionId") as string | null;

  if (!file || file.type !== "application/pdf") {
    return NextResponse.json({ error: "A PDF file is required" }, { status: 400 });
  }

  const key = submissionId
    ? `submissions/${submissionId}.pdf`
    : `submissions/${crypto.randomUUID()}.pdf`;
  const blob = await put(key, file, { access: "public", allowOverwrite: true });

  return NextResponse.json({ url: blob.url });
}
