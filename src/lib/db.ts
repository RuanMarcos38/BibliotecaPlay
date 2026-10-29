import { PrismaClient } from "@prisma/client";
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
// Refuse a connection that could silently target the CRM public schema.
if (process.env.DATABASE_URL) {
 const connection = new URL(process.env.DATABASE_URL);
 if (connection.searchParams.get("schema") !== "bibliotecaplay") {
  throw new Error("DATABASE_URL must explicitly use schema=bibliotecaplay");
 }
}
export const db = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
