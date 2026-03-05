import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      prices: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(
    products.map((p) => ({
      ...p,
      currentPrice: p.prices[0]
        ? {
            pricePerMpRon: Number(p.prices[0].pricePerMpRon),
            pricePerMlRon: Number(p.prices[0].pricePerMlRon),
            montajPriceRon: Number(p.prices[0].montajPriceRon),
          }
        : null,
    }))
  );
}
