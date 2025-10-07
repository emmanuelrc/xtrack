import { prisma } from '@/lib/db';


export async function getRoles(  options?: {
    q?: string;                         // optional search by name
    sort?: 'name' | 'createdAt' | 'updatedAt';
    order?: 'asc' | 'desc';
  }
) {
  const { q, sort = 'name', order = 'asc' } = options ?? {};

  return prisma.role.findMany({
    where: {
      ...(q
        ? { name: { contains: q, mode: 'insensitive' } }
        : {}),
    },
    orderBy: { [sort]: order },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}