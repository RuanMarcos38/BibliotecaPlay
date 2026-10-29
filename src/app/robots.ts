import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
 const site = process.env.NEXT_PUBLIC_SITE_URL || "https://bibliotecaplay.r2rmarketingdigital.com.br";
 return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/ler/", "/minha-biblioteca"] }, sitemap: new URL("/sitemap.xml", site).href };
}
