import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, code } = body

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email et code requis' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('password_reset_codes')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('code', code)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Code incorrect ou expiré' },
        { status: 400 }
      )
    }

    // Mark code as used
    await supabaseAdmin
      .from('password_reset_codes')
      .update({ used: true })
      .eq('id', data.id)

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Verify code error:', error)
    return NextResponse.json(
      { error: 'Erreur de vérification: ' + error.message },
      { status: 500 }
    )
  }
}
