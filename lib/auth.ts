import { compare, hash } from 'bcrypt'
import { cookies } from 'next/headers'
import * as jose from 'jose'
import { cache } from 'react'
import { prisma } from "@/lib/db";

type UserWithPermissions = Awaited<ReturnType<typeof getCurrentUser>
>
// JWT types
interface JWTPayload {
  userId: number
  [key: string]: string | number | boolean | null | undefined
}

// Secret key for JWT signing (use an environment variable in production)
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-min-32-chars-long!!!'
)

// JWT expiration time
const JWT_EXPIRATION = '7d' // 7 days

// Token refresh threshold (refresh if less than this time left)
const REFRESH_THRESHOLD = 24 * 60 * 60 // 24 hours in seconds

// Hash a password
export async function hashPassword(password: string) {
  return hash(password, 10)
}

// Verify a password
export async function verifyPassword(password: string, hashedPassword: string) {
  return compare(password, hashedPassword)
}

// Generate a JWT token
export async function generateJWT(payload: JWTPayload) {
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRATION)
    .sign(JWT_SECRET)
}

// Verify a JWT token
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET)
    return payload as JWTPayload
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

// Check if token needs refresh
export async function shouldRefreshToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET, {
      clockTolerance: 15, // 15 seconds tolerance for clock skew
    })

    // Get expiration time
    const exp = payload.exp as number
    const now = Math.floor(Date.now() / 1000)

    // If token expires within the threshold, refresh it
    return exp - now < REFRESH_THRESHOLD
  } catch {
    // If verification fails, token is invalid or expired
    return false
  }
}

// Create a session using JWT
export async function createSession(userId: number) {
  try {
    // Create JWT with user data
    const token = await generateJWT({ userId })

    // Store JWT in a cookie
    const cookieStore = await cookies()
    cookieStore.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
      sameSite: 'lax',
    })

    return true
  } catch (error) {
    console.error('Error creating session:', error)
    return false
  }
}

// Get current session from JWT
export const getSession = cache(async () => {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) return null
    const payload = await verifyJWT(token)

    return payload ? { userId: payload.userId } : null
  } catch (error) {
    // Handle the specific prerendering error
    if (
      error instanceof Error &&
      error.message.includes('During prerendering, `cookies()` rejects')
    ) {
      console.log(
        'Cookies not available during prerendering, returning null session'
      )
      return null
    }

    console.error('Error getting session:', error)
    return null
  }
})

// Delete session by clearing the JWT cookie
export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('auth_token')
}

export const getCurrentUser = cache(async () => {
  const session = await getSession()
  if (!session) return null

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        Worker: {
          include: {
            Role: { include: { Permission: true } },
            Department: true,
          },
        },
      },
    })

    return user || null
  } catch (error) {
    console.error('Error getting user by ID:', error)
    return null
  }
})

export const getCurrentUserPermissions = cache(async () => {
  const session = await getSession()
  if (!session) return null

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        username: true,
        name: true,
        Worker: {
          select: {
            id: true,
            Role: { select: { Permission: { select: { name: true } } } },
          },
        },
      },
    })
    return user || null
  } catch (error) {
    console.error('Error getting user permissions by ID:', error)
    return null
  }
})

export function extractPermissions(user: UserWithPermissions | null): string[] {
  if (!user?.Worker) {
    return []
  }

  const permissions = user.Worker.Role.flatMap(role => 
    role.Permission.map(p => p.name)
  )
  
  return [...new Set(permissions)]
}

export function userHasPermission(
  user: UserWithPermissions | null, 
  permissionName: 'ALL' | 'DEPARTMENT' | 'WORKER'
): boolean {
  const permissions = extractPermissions(user)
  return permissions.includes(permissionName)
}

// Returns null when unrestricted (ALL), otherwise an array of allowed department IDs for DEPARTMENT users.
// Returns an empty array when the user has neither ALL nor DEPARTMENT.
export function getAllowedDepartmentIds(
  user: UserWithPermissions | null
): number[] | null {
  if (!user?.Worker) return []
  const permissions = extractPermissions(user)
  if (permissions.includes('ALL')) {
    return null
  }
  if (permissions.includes('DEPARTMENT')) {
    const deptIds = (user.Worker.Department ?? []).map((d: any) => d.id).filter((n: any) => Number.isFinite(n))
    return Array.from(new Set(deptIds))
  }
  return []
}

export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    return null
  }
  
  return user
}

export async function requirePermission(
  user: UserWithPermissions | null, 
  permissionName: 'ALL' | 'DEPARTMENT' | 'WORKER'
) {
  let candidate: any = user
  if (!candidate) {
    candidate = await getCurrentUserPermissions()
  }
  if (!candidate) {
    return null
  }

  // Extract permission names from either full or lightweight user shape
  const permNames = Array.from(
    new Set(
      (candidate?.Worker?.Role ?? [])
        .flatMap((r: any) => r?.Permission ?? [])
        .map((p: any) => p?.name)
        .filter(Boolean)
    )
  )

  if (!permNames.includes(permissionName)) {
    return null
  }

  return candidate
}