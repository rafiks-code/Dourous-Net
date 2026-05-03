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
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      )
    }

    // Check if user exists
    const { data: usersData, error: listError } =
      await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      })

    if (listError) {
      return NextResponse.json(
        { error: 'Erreur serveur' },
        { status: 500 }
      )
    }

    const userExists = usersData.users.some(
      u => u.email?.toLowerCase() === email.toLowerCase()
    )

    if (!userExists) {
      return NextResponse.json(
        { error: "Cet email n'existe pas dans notre système" },
        { status: 404 }
      )
    }

    // Generate 6-digit code
    const code = Math.floor(
      100000 + Math.random() * 900000
    ).toString()

    // Delete old codes for this email
    await supabaseAdmin
      .from('password_reset_codes')
      .delete()
      .eq('email', email.toLowerCase())

    // Save new code — expires in 15 minutes
    const { error: insertError } = await supabaseAdmin
      .from('password_reset_codes')
      .insert({
        email: email.toLowerCase(),
        code: code,
        expires_at: new Date(
          Date.now() + 15 * 60 * 1000
        ).toISOString(),
        used: false,
      })

    if (insertError) {
      console.error('Insert code error:', insertError)
      return NextResponse.json(
        { error: 'Erreur lors de la sauvegarde du code' },
        { status: 500 }
      )
    }

    // Send email with nodemailer
    const nodemailer = require('nodemailer')

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    })

    await transporter.sendMail({
      from: `"Dourous-Net" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Code de vérification - Dourous-Net',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;
          margin:0 auto;background:#0f0f1a;color:white;
          padding:40px;border-radius:16px;">
          <h1 style="text-align:center;color:#818cf8;">
            Dourous-Net
          </h1>
          <p style="text-align:center;color:#94a3b8;
            margin-bottom:32px;">
            Réinitialisation du mot de passe
          </p>
          <p style="color:#e2e8f0;margin-bottom:16px;">
            Voici votre code de vérification à 6 chiffres :
          </p>
          <div style="background:#1e1b4b;border:2px solid #4f46e5;
            border-radius:12px;padding:32px;text-align:center;
            margin:24px 0;">
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
    console.error('Send reset code error:', error.message)
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi: ' + error.message },
      { status: 500 }
    )
  }
}
