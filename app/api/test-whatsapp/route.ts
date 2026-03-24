import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { phone, apikey } = await req.json()

  if (!phone || !apikey) {
    return NextResponse.json({ error: 'Faltan phone o apikey.' }, { status: 400 })
  }

  try {
    const message = '🏠 *HospedAr* — Mensaje de prueba. Las notificaciones por WhatsApp están funcionando correctamente.'
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(apikey)}`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    const body = await res.text()

    if (!res.ok || body.toLowerCase().includes('error') || body.toLowerCase().includes('wrong')) {
      return NextResponse.json({ error: body.slice(0, 150) }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
