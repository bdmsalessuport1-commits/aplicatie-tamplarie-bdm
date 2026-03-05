import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readSheetValues } from "@/lib/google-sheets";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const offer = await prisma.offer.findUnique({ where: { id } });
  if (!offer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.user.role === "AGENT" && offer.agentId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!offer.googleSheetUrl) {
    return NextResponse.json(
      { error: "Oferta nu are un Google Sheet configurat." },
      { status: 400 }
    );
  }

  // Get all active extra options with their mappings
  const mappings = await prisma.extraOptionMapping.findMany({
    include: { extraOption: { select: { id: true, name: true, isActive: true } } },
  });

  const activeMappings = mappings
    .filter((m) => m.extraOption.isActive)
    .map((m) => ({
      extraOptionId: m.extraOptionId,
      name: m.extraOption.name,
      cellNotation: m.cellNotation,
    }));

  const result = await readSheetValues(offer.googleSheetUrl, activeMappings);

  if (!result.success) {
    return NextResponse.json(
      { synced: false, error: result.error, errorCode: result.errorCode },
      { status: result.errorCode === "SHEET_INACCESSIBLE" ? 403 : 400 }
    );
  }

  // Update offer extras with synced prices
  const pricesResult = activeMappings
    .map((mapping) => ({
      extraOptionId: mapping.extraOptionId,
      name: mapping.name,
      cell: mapping.cellNotation,
      priceRon: result.values[mapping.cellNotation] ?? 0,
    }))
    .filter((p) => p.priceRon > 0);

  // Update sheetSyncedAt
  await prisma.offer.update({
    where: { id },
    data: { sheetSyncedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "SYNC_SHEET",
      entityType: "Offer",
      entityId: id,
      newData: { spreadsheetId: offer.spreadsheetId, pricesCount: pricesResult.length },
    },
  });

  return NextResponse.json({
    synced: true,
    prices: pricesResult,
    warnings: result.warnings,
    syncedAt: new Date().toISOString(),
  });
}
