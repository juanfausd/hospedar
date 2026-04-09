import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { email } = await req.json()

  if (!email) {
    return NextResponse.json({ error: 'Falta el email.' }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY no está configurado en las variables de entorno.' }, { status: 500 })
  }

  const from = process.env.RESEND_FROM_EMAIL || 'Hospedando <onboarding@resend.dev>'

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;background:#fafaf9;margin:0;padding:24px">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e7e5e4;overflow:hidden">
    <div style="background:#1c1917;padding:20px 24px">
      <h1 style="margin:0;color:#fff;font-size:18px;font-weight:600">🏠 Hospedando</h1>
      <p style="margin:4px 0 0;color:#a8a29e;font-size:14px">Email de prueba</p>
    </div>
    <div style="padding:24px">
      <p style="margin:0 0 12px;color:#1c1917;font-size:15px;font-weight:600">¡Todo funciona correctamente!</p>
      <p style="margin:0;color:#57534e;font-size:14px;line-height:1.6">
        Este es un email de prueba enviado desde Hospedando. Si lo recibiste, las notificaciones por email están configuradas correctamente.
      </p>
    </div>
    <div style="padding:16px 24px;background:#fafaf9;border-top:1px solid #e7e5e4">
      <p style="margin:0;color:#a8a29e;font-size:12px">Enviado automáticamente por Hospedando</p>
    </div>
  </div>
</body>
</html>`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [email], subject: 'Hospedando — Email de prueba', html }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return NextResponse.json({ error: body.message || `Error Resend: ${res.status}` }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
