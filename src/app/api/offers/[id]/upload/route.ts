import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveFile, MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from "@/lib/storage";
import { validatePDF } from "@/lib/pdf-merger";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const offer = await prisma.offer.findUnique({ where: { id } });
  if (!offer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.user.role === "AGENT" && offer.agentId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Niciun fișier furnizat." }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Doar fișierele PDF sunt acceptate." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `Fișierul depășește limita de ${MAX_FILE_SIZE / 1024 / 1024}MB.` },
      { status: 413 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const isValidPdf = await validatePDF(buffer);
  if (!isValidPdf) {
    return NextResponse.json({ error: "Fișierul PDF este corupt sau invalid." }, { status: 400 });
  }

  const { filename, filePath, fileSize } = await saveFile(buffer, file.name, id, file.type);

  // Remove previous TABLOU file if exists
  const existing = await prisma.offerFile.findFirst({
    where: { offerId: id, fileType: "TABLOU" },
  });
  if (existing) {
    await prisma.offerFile.delete({ where: { id: existing.id } });
  }

  const offerFile = await prisma.offerFile.create({
    data: {
      offerId: id,
      fileType: "TABLOU",
      filename,
      originalName: file.name,
      filePath,
      fileSize,
      mimeType: file.type,
    },
  });

  return NextResponse.json(offerFile, { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const offer = await prisma.offer.findUnique({ where: { id } });
  if (!offer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.user.role === "AGENT" && offer.agentId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get("fileId");
  if (!fileId) return NextResponse.json({ error: "fileId required" }, { status: 400 });

  await prisma.offerFile.delete({ where: { id: fileId, offerId: id } });
  return NextResponse.json({ success: true });
}
