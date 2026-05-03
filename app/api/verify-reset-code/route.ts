import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: 'Configuration serveur manquante' },
        { status: 500 }
      )
    }

    const now = new Date().toISOString()

    // Find valid code using REST API
    const findRes = await fetch(
      `${supabaseUrl}/rest/v1/password_reset_codes` +
      `?email=eq.${encodeURIComponent(email.toLowerCase())}` +
      `&code=eq.${encodeURIComponent(code)}` +
      `&used=eq.false` +
      `&expires_at=gte.${encodeURIComponent(now)}` +
      `&limit=1`,
      {
        method: 'GET',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!findRes.ok) {
      return NextResponse.json(
        { error: 'Erreur de vérification' },
        { status: 500 }
      )
    }

    const rows = await findRes.json()

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: 'Code incorrect ou expiré' },
        { status: 400 }
      )
    }

    const row = rows[0]

    // Mark code as used
    await fetch(
      `${supabaseUrl}/rest/v1/password_reset_codes?id=eq.${row.id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ used: true }),
      }
    )

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Verify code error:', error.message)
    return NextResponse.json(
      { error: 'Erreur serveur: ' + error.message },
      { status: 500 }
    )
  }
}
