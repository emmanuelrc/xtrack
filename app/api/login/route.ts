// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserByUsername } from '@/lib/db/users'
import { createSession, verifyPassword } from '@/lib/auth'

const authSchema = z.object({
  username: z.string(),
  password: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    // Parse JSON body
    const body = await request.json()
    
    // Validate with Zod
    const validationResult = authSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: z.treeifyError(validationResult.error),
        },
        { status: 400 }
      )
    }

    const { username, password } = validationResult.data

    // Find user by username
    const user = await getUserByUsername(username)

    console.log('no user')
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid username or password',
          errors: {
            username: ['Invalid username or password'],
          },
        },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password_hash)
    if (!isPasswordValid) {
      console.log('wrong password')
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid username or password',
          errors: {
            password: ['Invalid username or password'],
          },
        },
        { status: 401 }
      )
    }

    // Create session
    await createSession(user.id)

    return NextResponse.json(
      {
        success: true,
        message: 'Signed in successfully',
        // TODO: format a different response based on what's needed for permissions
        
        user 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Sign in error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while signing in',
        error: 'Failed to sign in',
      },
      { status: 500 }
    )
  }
}