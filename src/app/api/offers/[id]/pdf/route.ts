import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateOfferPDF } from "@/lib/pdf-generator";
import { mergePDFs } from "@/lib/pdf-merger";
import { readFile } from "@/lib/storage";
import type { OfferFull } from "@/types";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

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
        include: { extraOption: { include: { mapping: true } } },
        orderBy: { extraOption: { sortOrder: "asc" } },
      },
      files: true,
    },
  });

  if (!offer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.user.role === "AGENT" && offer.agentId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Format offer data
  const currentPrice = offer.product.prices[0];
  const offerData: OfferFull = {
    ...offer,
    mp: Number(offer.mp),
    ml: Number(offer.ml),
    discountPercent: Number(offer.discountPercent),
    eurRate: offer.eurRate ? Number(offer.eurRate) : null,
    priceSnapshotMaterialsRon: offer.priceSnapshotMaterialsRon
      ? Number(offer.priceSnapshotMaterialsRon)
      : null,
    priceSnapshotMontajRon: offer.priceSnapshotMontajRon
      ? Number(offer.priceSnapshotMontajRon)
      : null,
    product: {
      ...offer.product,
      currentPrice: currentPrice
        ? {
            pricePerMpRon: Number(currentPrice.pricePerMpRon),
            pricePerMlRon: Number(currentPrice.pricePerMlRon),
            montajPriceRon: Number(currentPrice.montajPriceRon),
          }
        : undefined,
    },
    extras: offer.extras.map((e) => ({
      ...e,
      quantity: Number(e.quantity),
      unitPriceRon: Number(e.unitPriceRon),
      totalRon: Number(e.totalRon),
      extraOption: {
        ...e.extraOption,
      },
    })),
  };

  // Generate main PDF
  let pdfBuffer = await generateOfferPDF(offerData);

  // Merge with tablou if exists
  const tablou = offer.files.find((f) => f.fileType === "TABLOU");
  if (tablou) {
    try {
      const tablauBuffer = await readFile(tablou.filePath);
      pdfBuffer = await mergePDFs(pdfBuffer, tablauBuffer);
    } catch (err) {
      console.error("Error merging tablou PDF:", err);
      // Continue without merge if error
    }
  }

  // Update pdfGeneratedAt
  await prisma.offer.update({ where: { id }, data: { pdfGeneratedAt: new Date() } });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "GENERATE_PDF",
      entityType: "Offer",
      entityId: id,
      newData: { offerNumber: offer.offerNumber, hasTablou: !!tablou },
    },
  });

  const filename = `Oferta-${offer.offerNumber.replace(/\//g, "-")}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(pdfBuffer.length),
    },
  });
}
