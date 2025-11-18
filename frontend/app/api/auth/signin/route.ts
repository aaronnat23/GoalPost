// API Route: Sign In with Supabase Auth
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrCreatePrismaUser } from '@/lib/supabase/auth-helpers'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { success: false, error: 'Failed to sign in' },
        { status: 500 }
      )
    }

    // Sync with Prisma database
    const user = await getOrCreatePrismaUser(
      data.user.id,
      email,
      data.user.user_metadata?.name
    )

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
    })
  } catch (error: any) {
    console.error('Signin error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to sign in' },
      { status: 500 }
    )
  }
}
