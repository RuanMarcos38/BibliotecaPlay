import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { readingUrl } from "@/lib/storage";
export async function GET(_: Request, { params }: { params: Promise<{ key: string }> }) {
 const { key } = await params;
 if (!/^[a-z0-9-]+\.webp$/.test(key)) return new NextResponse(null, { status: 404 });
 const coverUrl = "/api/covers/" + key;
 const published = await db.ebook.findFirst({ where: { coverUrl, status: "PUBLISHED" }, select: { id: true } });
 if (!published && !await requireAdmin()) return new NextResponse(null, { status: 404 });
 try { return NextResponse.redirect(await readingUrl("covers/" + key), { status: 302, headers: { "Cache-Control": "no-store" } }); }
 catch { return new NextResponse(null, { status: 503 }); }
}
