import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(req: NextRequest) {
  let body: { nombre?: string; apellido?: string; telefono?: string; motivo?: string; recaptcha?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 })
  }

  const { nombre, apellido, telefono, motivo, recaptcha } = body

  if (!nombre || !apellido || !motivo) {
    return NextResponse.json({ error: 'Nombre, apellido y motivo son requeridos.' }, { status: 400 })
  }

  // Verify reCAPTCHA if secret is configured
  const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY
  if (recaptchaSecret) {
    if (!recaptcha) {
      return NextResponse.json({ error: 'reCAPTCHA inválido.' }, { status: 400 })
    }
    try {
      const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret: recaptchaSecret, response: recaptcha }).toString(),
      })
      const verifyData = await verifyRes.json()
      if (!verifyData.success) {
        return NextResponse.json({ error: 'reCAPTCHA inválido.' }, { status: 400 })
      }
    } catch (e) {
      console.error('reCAPTCHA verification error:', e)
      return NextResponse.json({ error: 'Error al verificar reCAPTCHA.' }, { status: 500 })
    }
  }

  // Save to DB (best effort — table may not exist yet)
  try {
    await query(
      'INSERT INTO contacts (nombre, apellido, telefono, motivo) VALUES ($1, $2, $3, $4)',
      [nombre, apellido, telefono || null, motivo],
    )
  } catch (e) {
    console.error('DB insert error (contacts table may not exist yet):', e)
  }

  return NextResponse.json({ ok: true })
}
