// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

/*
  Make one Prisma instance in dev to avoid connection leaks on HMR.
  Remember this file path: "@/lib/prisma"
*/
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // log: ["query", "error", "warn"], // uncomment while debugging
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
