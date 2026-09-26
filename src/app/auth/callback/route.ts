import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )
    
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && session?.user) {
      const user = session.user
      // Upsert User to Prisma
      await prisma.user.upsert({
        where: { id: user.id },
        update: {
          email: user.email || '',
          name: user.user_metadata?.full_name || '',
          avatarUrl: user.user_metadata?.avatar_url || '',
        },
        create: {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.full_name || '',
          avatarUrl: user.user_metadata?.avatar_url || '',
        },
      })
      
      return NextResponse.redirect(`http://localhost:3000${next}`)
    }
  }

  return NextResponse.redirect("http://localhost:3000/auth/auth-code-error")
}