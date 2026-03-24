import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

function nightsBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}

function formatDate(d: string) {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function formatARS(n: number) {
  return '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function toDateStr(d: string | Date): string {
  if (typeof d === 'string') return d.slice(0, 10)
  return d.toISOString().slice(0, 10)
}

async function sendWhatsApp(phone: string, apikey: string, message: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(apikey)}`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    const body = await res.text()
    // CallMeBot returns 200 even on errors, check the body
    if (!res.ok || body.toLowerCase().includes('error') || body.toLowerCase().includes('wrong')) {
      return { ok: false, error: body.slice(0, 100) }
    }
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

async function sendEmail(to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY no configurado' }
  try {
    const from = process.env.RESEND_FROM_EMAIL || 'HospedAr <onboarding@resend.dev>'
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, html }),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) {
      const body = await res.text()
      return { ok: false, error: body.slice(0, 100) }
    }
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

function buildTextMessage(reservations: any[], dateLabel: string): string {
  const lines: string[] = [`🏠 *HospedAr — Reservas para mañana ${dateLabel}*`]
  for (const r of reservations) {
    const cin = toDateStr(r.checkin)
    const cout = toDateStr(r.checkout)
    const nights = nightsBetween(cin, cout)
    lines.push('')
    if (r.property_name) lines.push(`🏡 *${r.property_name}*`)
    lines.push(`👤 ${r.name}`)
    lines.push(`📅 Check-in: ${formatDate(cin)}`)
    lines.push(`📅 Check-out: ${formatDate(cout)}`)
    lines.push(`🌙 ${nights} noche${nights !== 1 ? 's' : ''} · 👥 ${r.guests} persona${r.guests !== 1 ? 's' : ''}`)
    if (Number(r.cost) > 0) lines.push(`💰 Total: ${formatARS(Number(r.cost))}`)
    if (r.phone) lines.push(`📞 ${r.phone}`)
    if (r.notes) lines.push(`📝 ${r.notes}`)
  }
  return lines.join('\n')
}

function buildHtmlEmail(reservations: any[], dateLabel: string): string {
  const rows = reservations.map(r => {
    const cin = toDateStr(r.checkin)
    const cout = toDateStr(r.checkout)
    const nights = nightsBetween(cin, cout)
    return `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #e7e5e4;font-weight:600;color:#1c1917">${r.name}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #e7e5e4;color:#57534e">${r.property_name || '—'}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #e7e5e4;color:#57534e">${formatDate(cin)}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #e7e5e4;color:#57534e">${formatDate(cout)}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #e7e5e4;color:#57534e;text-align:center">${nights}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #e7e5e4;color:#57534e;text-align:center">${r.guests}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #e7e5e4;color:#57534e">${Number(r.cost) > 0 ? formatARS(Number(r.cost)) : '—'}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #e7e5e4;color:#57534e">${r.phone || '—'}</td>
      </tr>`
  }).join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;background:#fafaf9;margin:0;padding:24px">
  <div style="max-width:700px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e7e5e4;overflow:hidden">
    <div style="background:#1c1917;padding:20px 24px">
      <h1 style="margin:0;color:#fff;font-size:18px;font-weight:600">🏠 HospedAr</h1>
      <p style="margin:4px 0 0;color:#a8a29e;font-size:14px">Reservas para mañana — ${dateLabel}</p>
    </div>
    <div style="padding:24px">
      <p style="margin:0 0 16px;color:#57534e;font-size:14px">
        Hay <strong>${reservations.length}</strong> reserva${reservations.length !== 1 ? 's' : ''} con check-in mañana.
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <thead>
          <tr style="background:#fafaf9">
            <th style="padding:10px 16px;text-align:left;color:#78716c;font-weight:500;font-size:12px;text-transform:uppercase;border-bottom:2px solid #e7e5e4">Huésped</th>
            <th style="padding:10px 16px;text-align:left;color:#78716c;font-weight:500;font-size:12px;text-transform:uppercase;border-bottom:2px solid #e7e5e4">Alojamiento</th>
            <th style="padding:10px 16px;text-align:left;color:#78716c;font-weight:500;font-size:12px;text-transform:uppercase;border-bottom:2px solid #e7e5e4">Llegada</th>
            <th style="padding:10px 16px;text-align:left;color:#78716c;font-weight:500;font-size:12px;text-transform:uppercase;border-bottom:2px solid #e7e5e4">Salida</th>
            <th style="padding:10px 16px;text-align:center;color:#78716c;font-weight:500;font-size:12px;text-transform:uppercase;border-bottom:2px solid #e7e5e4">Noches</th>
            <th style="padding:10px 16px;text-align:center;color:#78716c;font-weight:500;font-size:12px;text-transform:uppercase;border-bottom:2px solid #e7e5e4">Personas</th>
            <th style="padding:10px 16px;text-align:left;color:#78716c;font-weight:500;font-size:12px;text-transform:uppercase;border-bottom:2px solid #e7e5e4">Total</th>
            <th style="padding:10px 16px;text-align:left;color:#78716c;font-weight:500;font-size:12px;text-transform:uppercase;border-bottom:2px solid #e7e5e4">Teléfono</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div style="padding:16px 24px;background:#fafaf9;border-top:1px solid #e7e5e4">
      <p style="margin:0;color:#a8a29e;font-size:12px">Enviado automáticamente por HospedAr</p>
    </div>
  </div>
</body>
</html>`
}

export async function GET(req: NextRequest) {
  // Verify Vercel cron secret
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Tomorrow's date in Argentina (UTC-3)
  const tomorrowAR = new Date(Date.now() + (24 - 3) * 3600 * 1000)
  const tomorrowStr = tomorrowAR.toISOString().slice(0, 10)
  const dateLabel = formatDate(tomorrowStr)

  // Get tomorrow's reservations joined with property names
  const resResult = await query(
    `SELECT r.*, p.name AS property_name
     FROM reservations r
     LEFT JOIN properties p ON p.id = r.property_id
     WHERE r.checkin = $1 AND r.status != 'cancelled'
     ORDER BY r.checkin ASC`,
    [tomorrowStr]
  )
  const reservations = resResult.rows

  if (reservations.length === 0) {
    return NextResponse.json({ ok: true, message: 'No hay reservas para mañana.', sent: 0 })
  }

  // Get notification settings
  const settingsResult = await query(
    "SELECT key, value FROM settings WHERE key IN ('notification_phones', 'notification_email')"
  )
  const settingsMap: Record<string, string> = {}
  for (const row of settingsResult.rows) settingsMap[row.key] = row.value

  const phones: { phone: string; apikey: string }[] =
    settingsMap.notification_phones ? JSON.parse(settingsMap.notification_phones) : []
  const notifEmail: string = settingsMap.notification_email || ''

  const message = buildTextMessage(reservations, dateLabel)
  const emailHtml = buildHtmlEmail(reservations, dateLabel)
  const emailSubject = `HospedAr — ${reservations.length} reserva${reservations.length !== 1 ? 's' : ''} para mañana (${dateLabel})`

  // Send WhatsApp messages in parallel
  const whatsappResults = await Promise.all(
    phones.map(({ phone, apikey }) => sendWhatsApp(phone, apikey, message))
  )
  const whatsappSent = whatsappResults.filter(r => r.ok).length
  const whatsappErrors = whatsappResults.filter(r => !r.ok).map(r => r.error)

  // Send email
  let emailResult: { ok: boolean; error?: string } = { ok: false, error: 'Sin email configurado' }
  if (notifEmail) {
    emailResult = await sendEmail(notifEmail, emailSubject, emailHtml)
  }

  return NextResponse.json({
    ok: true,
    reservations: reservations.length,
    whatsappSent,
    whatsappErrors: whatsappErrors.length ? whatsappErrors : undefined,
    emailSent: emailResult.ok,
    emailError: emailResult.ok ? undefined : emailResult.error,
  })
}
