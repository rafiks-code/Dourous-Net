import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const gmailUser = process.env.GMAIL_USER
    const gmailPass = process.env.GMAIL_APP_PASSWORD

    if (!supabaseUrl || !serviceKey) {
      console.error('Missing env vars:', { supabaseUrl: !!supabaseUrl, serviceKey: !!serviceKey })
      return NextResponse.json(
        { error: 'Configuration serveur manquante: SUPABASE_SERVICE_ROLE_KEY introuvable. Ajoutez-la dans Vercel → Settings → Environment Variables.' },
        { status: 500 }
      )
    }

    if (!gmailUser || !gmailPass) {
      return NextResponse.json(
        { error: 'Configuration email manquante: GMAIL_USER ou GMAIL_APP_PASSWORD introuvable dans Vercel.' },
        { status: 500 }
      )
    }

    // Check if user exists
    const listRes = await fetch(
      `${supabaseUrl}/auth/v1/admin/users?page=1&per_page=1000`,
      {
        method: 'GET',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!listRes.ok) {
      const err = await listRes.text()
      console.error('Supabase list users error:', err)
      return NextResponse.json({ error: 'Erreur serveur Supabase' }, { status: 500 })
    }

    const listData = await listRes.json()
    const users = listData.users ?? []
    const userExists = users.some(
      (u: any) => u.email?.toLowerCase() === email.toLowerCase()
    )

    if (!userExists) {
      return NextResponse.json(
        { error: "Cet email n'existe pas dans notre système" },
        { status: 404 }
      )
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // Delete old codes
    await fetch(
      `${supabaseUrl}/rest/v1/password_reset_codes?email=eq.${encodeURIComponent(email.toLowerCase())}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    // Save new code (expires in 15 minutes)
    const insertRes = await fetch(
      `${supabaseUrl}/rest/v1/password_reset_codes`,
      {
        method: 'POST',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          code: code,
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          used: false,
        }),
      }
    )

    if (!insertRes.ok) {
      const err = await insertRes.text()
      console.error('Insert code error:', err)
      return NextResponse.json({ error: 'Erreur sauvegarde du code' }, { status: 500 })
    }

    // Send email
    const nodemailer = require('nodemailer')
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
      tls: { rejectUnauthorized: false },
    })

    await transporter.sendMail({
      from: `"Dourous-Net" <${gmailUser}>`,
      to: email,
      subject: 'Code de vérification - Dourous-Net',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;
          margin:0 auto;background:#0f0f1a;color:white;
          padding:40px;border-radius:16px;">
          <h1 style="text-align:center;color:#818cf8;">Dourous-Net</h1>
          <p style="text-align:center;color:#94a3b8;margin-bottom:32px;">
            Réinitialisation du mot de passe
          </p>
          <p style="color:#e2e8f0;margin-bottom:16px;">
            Voici votre code de vérification à 6 chiffres :
          </p>
          <div style="background:#1e1b4b;border:2px solid #4f46e5;
            border-radius:12px;padding:32px;text-align:center;margin:24px 0;">
            <span style="font-size:52px;font-weight:bold;
              letter-spacing:20px;color:#818cf8;">
              ${code}
            </span>
          </div>
          <p style="color:#94a3b8;font-size:14px;">
            ⏱ Ce code expire dans <strong>15 minutes</strong>.
          </p>
          <p style="color:#94a3b8;font-size:14px;margin-top:12px;">
            Si vous n'avez pas demandé ce code, ignorez cet email.
          </p>
          <hr style="border:1px solid #1e1b4b;margin:24px 0;">
          <p style="color:#475569;font-size:12px;text-align:center;">
            Dourous-Net — Plateforme scolaire algérienne
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Send code error:', error.message)
    return NextResponse.json(
      { error: "Erreur lors de l'envoi: " + error.message },
      { status: 500 }
    )
  }
}
