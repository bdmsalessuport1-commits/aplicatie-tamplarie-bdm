import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateMappingsSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const mappings = await prisma.extraOptionMapping.findMany({
    include: { extraOption: true },
    orderBy: { extraOption: { sortOrder: "asc" } },
  });

  return NextResponse.json(mappings);
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = updateMappingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", details: parsed.error.flatten() }, { status: 400 });
  }

  const results = await Promise.all(
    parsed.data.mappings.map((m) =>
      prisma.extraOptionMapping.upsert({
        where: { extraOptionId: m.extraOptionId },
        update: {
          cellNotation: m.cellNotation,
          description: m.description ?? null,
        },
        create: {
          extraOptionId: m.extraOptionId,
          cellNotation: m.cellNotation,
          description: m.description ?? null,
        },
      })
    )
  );

  return NextResponse.json({ saved: results.length, mappings: results });
}
