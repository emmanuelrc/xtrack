import { prisma } from "@/lib/db";
import { User } from "@prisma/client";


export async function getUserByUsername (userName: string): Promise<User | null> {

  try {
    const user = await prisma.user.findUnique({
      where: {
        username: userName
      },
      include: {
        Worker: {
          include: {
            Role: {
              include: {
                Permission: true
              }
            }
          }
        }
      }
    });
    return user;
  } catch (e) {
    console.error(e);
    return null
  }
}