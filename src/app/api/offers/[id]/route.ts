import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateOfferSchema } from "@/lib/validations";
import { extractSpreadsheetId } from "@/lib/utils";

async function getOfferWithAuth(id: string, userId: string, role: string) {
  const offer = await prisma.offer.findUnique({
    where: { id },
    include: {
      agent: { select: { id: true, name: true, email: true } },
      product: {
        include: {
          prices: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
      extras: {
        include: {
          extraOption: { include: { mapping: true } },
        },
        orderBy: { extraOption: { sortOrder: "asc" } },
      },
      files: { orderBy: { uploadedAt: "desc" } },
    },
  });

  if (!offer) return null;
  if (role === "AGENT" && offer.agentId !== userId) return "FORBIDDEN";
  return offer;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const offer = await getOfferWithAuth(id, session.user.id, session.user.role);

  if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  if (offer === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Format offer with current price
  const currentPrice = offer.product.prices[0];
  return NextResponse.json({
    ...offer,
    product: {
      ...offer.product,
      currentPrice: currentPrice
        ? {
            pricePerMpRon: Number(currentPrice.pricePerMpRon),
            pricePerMlRon: Number(currentPrice.pricePerMlRon),
            montajPriceRon: Number(currentPrice.montajPriceRon),
          }
        : null,
    },
    mp: Number(offer.mp),
    ml: Number(offer.ml),
    discountPercent: Number(offer.discountPercent),
    eurRate: offer.eurRate ? Number(offer.eurRate) : null,
    extras: offer.extras.map((e) => ({
      ...e,
      quantity: Number(e.quantity),
      unitPriceRon: Number(e.unitPriceRon),
      totalRon: Number(e.totalRon),
    })),
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const offer = await getOfferWithAuth(id, session.user.id, session.user.role);
  if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  if (offer === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();

  // Status change
  if (body.status && body.status !== offer.status) {
    // Prevent editing SENT offers (except status changes by admin)
    if (offer.status === "SENT" && session.user.role !== "ADMIN" && body.status !== offer.status) {
      return NextResponse.json({ error: "Nu poți edita o ofertă trimisă." }, { status: 400 });
    }

    let updateData: Record<string, unknown> = { status: body.status };

    // Snapshot prices when sending
    if (body.status === "SENT" && offer.status === "DRAFT") {
      const currentPrice = offer.product.prices[0];
      if (currentPrice) {
        const mp = Number(offer.mp);
        const ml = Number(offer.ml);
        updateData = {
          ...updateData,
          status: "SENT",
          sentAt: new Date(),
          priceSnapshotMaterialsRon: mp * Number(currentPrice.pricePerMpRon) + ml * Number(currentPrice.pricePerMlRon),
          priceSnapshotMontajRon: (mp + ml) * Number(currentPrice.montajPriceRon),
        };
      }
    }

    const updated = await prisma.offer.update({ where: { id }, data: updateData });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "Offer",
        entityId: id,
        oldData: { status: offer.status },
        newData: { status: body.status },
      },
    });

    return NextResponse.json(updated);
  }

  // Field update
  const parsed = updateOfferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const spreadsheetId = data.googleSheetUrl ? extractSpreadsheetId(data.googleSheetUrl) : undefined;

  const updated = await prisma.offer.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.clientName !== undefined ? { clientName: data.clientName } : {}),
      ...(data.clientPhone !== undefined ? { clientPhone: data.clientPhone } : {}),
      ...(data.clientEmail !== undefined ? { clientEmail: data.clientEmail || null } : {}),
      ...(data.clientAddress !== undefined ? { clientAddress: data.clientAddress } : {}),
      ...(data.productId !== undefined ? { productId: data.productId } : {}),
      ...(data.mp !== undefined ? { mp: data.mp } : {}),
      ...(data.ml !== undefined ? { ml: data.ml } : {}),
      ...(data.googleSheetUrl !== undefined
        ? { googleSheetUrl: data.googleSheetUrl, spreadsheetId: spreadsheetId ?? null }
        : {}),
      ...(data.currency !== undefined ? { currency: data.currency } : {}),
      ...(data.eurRate !== undefined ? { eurRate: data.eurRate } : {}),
      ...(data.discountPercent !== undefined ? { discountPercent: data.discountPercent } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "UPDATE",
      entityType: "Offer",
      entityId: id,
      newData: data,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const offer = await getOfferWithAuth(id, session.user.id, session.user.role);
  if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  if (offer === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (offer.status === "SENT" || offer.status === "ACCEPTED") {
    return NextResponse.json(
      { error: "Nu poți șterge o ofertă trimisă sau acceptată." },
      { status: 400 }
    );
  }

  await prisma.offer.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "DELETE",
      entityType: "Offer",
      entityId: id,
      oldData: { offerNumber: offer.offerNumber, clientName: offer.clientName },
    },
  });

  return NextResponse.json({ success: true });
}
