import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const to = searchParams.get("to") ?? new Date().toISOString();
  const agentId = searchParams.get("agent_id");

  const where: Record<string, unknown> = {
    createdAt: { gte: new Date(from), lte: new Date(to) },
  };

  if (session.user.role === "AGENT") {
    where.agentId = session.user.id;
  } else if (agentId) {
    where.agentId = agentId;
  }

  const [allOffers, acceptedOffers, recentOffers, byProductRaw] = await Promise.all([
    prisma.offer.findMany({
      where,
      include: {
        extras: true,
        product: { select: { name: true, profileType: true } },
      },
    }),
    prisma.offer.count({ where: { ...where, status: "ACCEPTED" } }),
    prisma.offer.findMany({
      where,
      include: {
        agent: { select: { id: true, name: true } },
        product: { select: { id: true, name: true, profileType: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.offer.groupBy({
      by: ["productId"],
      where,
      _count: { id: true },
    }),
  ]);

  // Calculate total values
  function calcOfferTotal(offer: {
    mp: unknown; ml: unknown; priceSnapshotMaterialsRon: unknown;
    priceSnapshotMontajRon: unknown; discountPercent: unknown;
    extras: { totalRon: unknown }[];
    product: { name: string; profileType: string };
  }) {
    const mp = Number(offer.mp);
    const ml = Number(offer.ml);
    const materialsRon = offer.priceSnapshotMaterialsRon
      ? Number(offer.priceSnapshotMaterialsRon)
      : 0;
    const montajRon = offer.priceSnapshotMontajRon
      ? Number(offer.priceSnapshotMontajRon)
      : 0;
    const extrasTotal = offer.extras.reduce((s, e) => s + Number(e.totalRon), 0);
    const subtotal = materialsRon + montajRon + extrasTotal;
    const discount = (subtotal * Number(offer.discountPercent)) / 100;
    return subtotal - discount;
  }

  const totalValueRon = allOffers.reduce((sum, o) => sum + calcOfferTotal(o), 0);

  // Group by product
  const productIds = [...new Set(allOffers.map((o) => o.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, profileType: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const byProduct = byProductRaw.map((row) => {
    const product = productMap.get(row.productId);
    const offersForProduct = allOffers.filter((o) => o.productId === row.productId);
    const value = offersForProduct.reduce((sum, o) => sum + calcOfferTotal(o), 0);
    return {
      productName: product?.name ?? "Necunoscut",
      profileType: product?.profileType ?? "–",
      count: row._count.id,
      value: Math.round(value),
    };
  });

  // Group by day
  const byDayMap = new Map<string, { count: number; value: number }>();
  for (const offer of allOffers) {
    const day = offer.createdAt.toISOString().slice(0, 10);
    const existing = byDayMap.get(day) ?? { count: 0, value: 0 };
    byDayMap.set(day, {
      count: existing.count + 1,
      value: existing.value + calcOfferTotal(offer),
    });
  }
  const byDay = [...byDayMap.entries()]
    .map(([date, data]) => ({ date, count: data.count, value: Math.round(data.value) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const draftCount = allOffers.filter((o) => o.status === "DRAFT").length;
  const sentCount = allOffers.filter((o) => o.status === "SENT").length;

  return NextResponse.json({
    kpis: {
      totalOffers: allOffers.length,
      totalValueRon: Math.round(totalValueRon),
      acceptedCount: acceptedOffers,
      acceptedRate: allOffers.length > 0 ? Math.round((acceptedOffers / allOffers.length) * 1000) / 10 : 0,
      draftCount,
      sentCount,
    },
    byProduct,
    byDay,
    recentOffers: recentOffers.map((o) => ({
      id: o.id,
      offerNumber: o.offerNumber,
      title: o.title,
      clientName: o.clientName,
      status: o.status,
      createdAt: o.createdAt,
      agent: o.agent,
      product: o.product,
    })),
  });
}
