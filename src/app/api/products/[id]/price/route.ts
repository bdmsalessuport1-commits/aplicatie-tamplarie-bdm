import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateProductPriceSchema } from "@/lib/validations";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const body = await request.json();
  const parsed = updateProductPriceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", details: parsed.error.flatten() }, { status: 400 });
  }

  const price = await prisma.productPrice.create({
    data: {
      productId: id,
      pricePerMpRon: parsed.data.pricePerMpRon,
      pricePerMlRon: parsed.data.pricePerMlRon,
      montajPriceRon: parsed.data.montajPriceRon,
      setByUserId: session.user.id,
    },
  });

  return NextResponse.json(price);
}
