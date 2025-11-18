// API Route: Get Current Session
import { NextRequest, NextResponse } from 'next/server'
import { getSession, getUser } from '@/lib/supabase/auth-helpers'
import { getOrCreatePrismaUser } from '@/lib/supabase/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    const supabaseUser = await getUser()

    if (!session || !supabaseUser) {
      return NextResponse.json({
        success: true,
        data: { session: null, user: null },
      })
    }

    // Get Prisma user
    const user = await getOrCreatePrismaUser(
      supabaseUser.id,
      supabaseUser.email!,
      supabaseUser.user_metadata?.name
    )

    return NextResponse.json({
      success: true,
      data: {
        session: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
        },
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
    })
  } catch (error: any) {
    console.error('Session error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get session' },
      { status: 500 }
    )
  }
}
