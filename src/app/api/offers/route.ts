import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createOfferSchema } from "@/lib/validations";
import { extractSpreadsheetId, generateUniqueOfferNumber } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const agentId = searchParams.get("agent_id");
  const productId = searchParams.get("product_id");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  // Agents only see their own offers
  const where: Record<string, unknown> = {};
  if (session.user.role === "AGENT") {
    where.agentId = session.user.id;
  } else if (agentId) {
    where.agentId = agentId;
  }

  if (status) where.status = status;
  if (productId) where.productId = productId;
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to + "T23:59:59.999Z") } : {}),
    };
  }

  const [offers, total] = await Promise.all([
    prisma.offer.findMany({
      where,
      include: {
        agent: { select: { id: true, name: true, email: true } },
        product: { select: { id: true, name: true, brand: true, systemName: true, profileType: true } },
        _count: { select: { extras: true, files: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.offer.count({ where }),
  ]);

  return NextResponse.json({
    offers,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = createOfferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const offerNumber = await generateUniqueOfferNumber(prisma);
  const spreadsheetId = data.googleSheetUrl ? extractSpreadsheetId(data.googleSheetUrl) : null;

  const offer = await prisma.offer.create({
    data: {
      offerNumber,
      title: data.title,
      clientName: data.clientName,
      clientPhone: data.clientPhone ?? null,
      clientEmail: data.clientEmail || null,
      clientAddress: data.clientAddress ?? null,
      agentId: session.user.id,
      productId: data.productId,
      mp: data.mp,
      ml: data.ml,
      googleSheetUrl: data.googleSheetUrl ?? null,
      spreadsheetId,
      currency: data.currency,
      eurRate: data.eurRate ?? null,
      discountPercent: data.discountPercent,
      notes: data.notes ?? null,
    },
    include: {
      agent: { select: { id: true, name: true, email: true } },
      product: true,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "CREATE",
      entityType: "Offer",
      entityId: offer.id,
      newData: { offerNumber, clientName: data.clientName },
    },
  });

  return NextResponse.json(offer, { status: 201 });
}
