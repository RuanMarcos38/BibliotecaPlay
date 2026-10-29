import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
 const site = process.env.NEXT_PUBLIC_SITE_URL || "https://bibliotecaplay.r2rmarketingdigital.com.br";
 const books = await db.ebook.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true }, orderBy: { updatedAt: "desc" }, take: 10000 });
 return [{ url: new URL("/", site).href }, ...books.map(book => ({ url: new URL("/ebook/" + encodeURIComponent(book.slug), site).href, lastModified: book.updatedAt }))];
}
