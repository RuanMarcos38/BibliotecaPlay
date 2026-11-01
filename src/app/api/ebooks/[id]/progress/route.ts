import { NextResponse } from "next/server";
import { z } from "zod";
import { activeAccess } from "@/lib/access";
import { db } from "@/lib/db";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await activeAccess();
  if (!session) return NextResponse.json({ error: "Assinatura ativa obrigatória" }, { status: 403 });
  const input = z.object({ page: z.number().int().min(1).max(100000) }).safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Página inválida" }, { status: 400 });
  const { id } = await params;
  const book = await db.ebook.findFirst({ where: { id, status: "PUBLISHED", fileKey: { not: null } }, select: { id: true } });
  if (!book) return NextResponse.json({ error: "Livro indisponível" }, { status: 404 });
  const progress = await db.readingProgress.upsert({
    where: { userId_ebookId: { userId: session.id, ebookId: id } },
    create: { userId: session.id, ebookId: id, page: input.data.page },
    update: { page: input.data.page },
    select: { page: true, updatedAt: true },
  });
  return NextResponse.json(progress);
}
