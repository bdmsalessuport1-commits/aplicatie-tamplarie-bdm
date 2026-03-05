import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateOfferExtrasSchema } from "@/lib/validations";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const offer = await prisma.offer.findUnique({ where: { id } });
  if (!offer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.user.role === "AGENT" && offer.agentId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const extras = await prisma.offerExtra.findMany({
    where: { offerId: id },
    include: { extraOption: { include: { mapping: true } } },
    orderBy: { extraOption: { sortOrder: "asc" } },
  });

  return NextResponse.json(extras);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const offer = await prisma.offer.findUnique({ where: { id } });
  if (!offer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.user.role === "AGENT" && offer.agentId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (offer.status === "SENT" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Nu poți edita o ofertă trimisă." }, { status: 400 });
  }

  const body = await request.json();
  const parsed = updateOfferExtrasSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", details: parsed.error.flatten() }, { status: 400 });
  }

  // Replace all extras for this offer
  await prisma.$transaction([
    prisma.offerExtra.deleteMany({ where: { offerId: id } }),
    ...parsed.data.extras.map((extra) =>
      prisma.offerExtra.create({
        data: {
          offerId: id,
          extraOptionId: extra.extraOptionId,
          quantity: extra.quantity,
          unitPriceRon: extra.unitPriceRon,
          totalRon: extra.quantity * extra.unitPriceRon,
          notes: extra.notes ?? null,
        },
      })
    ),
  ]);

  const updatedExtras = await prisma.offerExtra.findMany({
    where: { offerId: id },
    include: { extraOption: { include: { mapping: true } } },
    orderBy: { extraOption: { sortOrder: "asc" } },
  });

  return NextResponse.json(updatedExtras);
}
