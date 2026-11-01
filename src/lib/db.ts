import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { readFileSync } from "node:fs";
import { join } from "node:path";
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
function createClient() {
 const raw = process.env.DATABASE_URL;
 if (!raw) throw new Error("DATABASE_URL is required");
 const connection = new URL(raw);
 if (!["postgresql:", "postgres:"].includes(connection.protocol) || connection.searchParams.get("schema") !== "bibliotecaplay") {
   throw new Error("DATABASE_URL must explicitly use schema=bibliotecaplay");
 }
 if (connection.username !== "bibliotecaplay_runtime") {
   throw new Error("Use the dedicated bibliotecaplay_runtime database role");
 }
 // pg receives explicit TLS and pool settings; Prisma-only URL parameters are removed.
 for (const parameter of ["schema", "sslmode", "sslaccept", "sslcert", "sslkey", "sslrootcert", "connection_limit", "connect_timeout"]) connection.searchParams.delete(parameter);
 const adapter = new PrismaPg({
   connectionString: connection.href,
   max: 3,
   connectionTimeoutMillis: 10000,
   idleTimeoutMillis: 30000,
   ssl: {
     rejectUnauthorized: true,
     ca: process.env.DATABASE_CA_CERT?.replace(/\\n/g, "\n") ?? readFileSync(join(process.cwd(), "certs", "supabase-prod-ca-2021.crt"), "utf8"),
   },
 }, { schema: "bibliotecaplay" });
 return new PrismaClient({ adapter, log: [] });
}
export const db = globalForPrisma.prisma ?? createClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
