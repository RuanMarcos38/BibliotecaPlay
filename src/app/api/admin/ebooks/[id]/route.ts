import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { verifyStoredFile } from "@/lib/storage";
import { NextResponse } from "next/server";
import { z } from "zod";
const schema = z.object({
 title: z.string().trim().min(2).max(220).optional(), author: z.string().trim().min(2).max(220).optional(),
 description: z.string().min(20).max(50000).optional(), categoryId: z.string().min(1).optional(),
 coverKey: z.string().regex(/^covers\/[a-z0-9-]+\.webp$/).optional(),
 fileKey: z.string().regex(/^ebooks\/[a-z0-9-]+\.pdf$/).optional(),
 status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
}).strict();
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
 if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 const input = schema.safeParse(await request.json().catch(() => null));
 if (!input.success) return NextResponse.json({ error: input.error.flatten() }, { status: 400 });
 const { id } = await params;
 const old = await db.ebook.findUnique({ where: { id } });
 if (!old) return NextResponse.json({ error: "Not found" }, { status: 404 });
 const { coverKey, ...fields } = input.data;
 const coverUrl = coverKey ? "/api/" + coverKey : old.coverUrl;
 const fileKey = fields.fileKey ?? old.fileKey;
 const status = fields.status ?? old.status;
 if (status === "PUBLISHED" && (!fileKey || !coverUrl)) return NextResponse.json({ error: "PDF e capa são obrigatórios" }, { status: 400 });
 try {
  if (fields.fileKey || status === "PUBLISHED") await verifyStoredFile(fileKey!, "ebook");
  if (coverKey) await verifyStoredFile(coverKey, "cover");
  return NextResponse.json(await db.ebook.update({ where: { id }, data: { ...fields, coverUrl, publishedAt: status === "PUBLISHED" ? old.publishedAt ?? new Date() : null } }));
 } catch { return NextResponse.json({ error: "Não foi possível validar o arquivo ou salvar o e-book" }, { status: 400 }); }
}
