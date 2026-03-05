import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const updateProfileSchema = z.object({
  name: z.string().min(2, "Minim 2 caractere").max(200).optional(),
  currentPassword: z.string().min(1, "Parola curentă este obligatorie"),
  newPassword: z
    .string()
    .min(8, "Minim 8 caractere")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Trebuie să conțină litere mari, mici și cifre")
    .optional(),
});

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", details: parsed.error.flatten() }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const isValid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: "Parola curentă este incorectă." }, { status: 400 });
  }

  const updateData: { name?: string; passwordHash?: string } = {};
  if (parsed.data.name) updateData.name = parsed.data.name;
  if (parsed.data.newPassword) updateData.passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true },
  });

  return NextResponse.json(updated);
}
