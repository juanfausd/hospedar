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

async function sendWhatsApp(phone: string, apikey: string, message: string) {
  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(apikey)}`
  const res = await fetch(url)
  return res.ok
}

export async function GET(req: NextRequest) {
  // Verify Vercel cron secret
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Tomorrow's date in Argentina (UTC-3)
  const now = new Date()
  const tomorrow = new Date(now.getTime() + (24 - 3) * 3600000)
  const tomorrowStr = tomorrow.toISOString().slice(0, 10)

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

  // Get notification phones from settings
  const settingsResult = await query(
    "SELECT value FROM settings WHERE key = 'notification_phones'"
  )
  const phones: { phone: string; apikey: string }[] =
    settingsResult.rows.length ? JSON.parse(settingsResult.rows[0].value) : []

  if (phones.length === 0) {
    return NextResponse.json({ ok: true, message: 'Sin teléfonos configurados.', sent: 0 })
  }

  // Build message
  const dateLabel = formatDate(tomorrowStr)
  const lines: string[] = [`🏠 *HospedAr — Reservas para mañana ${dateLabel}*`]

  for (const r of reservations) {
    const nights = nightsBetween(r.checkin instanceof Date ? r.checkin.toISOString().slice(0,10) : r.checkin, r.checkout instanceof Date ? r.checkout.toISOString().slice(0,10) : r.checkout)
    lines.push('')
    if (r.property_name) lines.push(`🏡 *${r.property_name}*`)
    lines.push(`👤 ${r.name}`)
    lines.push(`📅 Check-in: ${formatDate(r.checkin instanceof Date ? r.checkin.toISOString().slice(0,10) : r.checkin)}`)
    lines.push(`📅 Check-out: ${formatDate(r.checkout instanceof Date ? r.checkout.toISOString().slice(0,10) : r.checkout)}`)
    lines.push(`🌙 ${nights} noche${nights !== 1 ? 's' : ''} · 👥 ${r.guests} persona${r.guests !== 1 ? 's' : ''}`)
    if (Number(r.cost) > 0) lines.push(`💰 Total: ${formatARS(Number(r.cost))}`)
    if (r.phone) lines.push(`📞 ${r.phone}`)
    if (r.notes) lines.push(`📝 ${r.notes}`)
  }

  const message = lines.join('\n')

  // Send to all phones
  let sent = 0
  for (const { phone, apikey } of phones) {
    const ok = await sendWhatsApp(phone, apikey, message)
    if (ok) sent++
  }

  return NextResponse.json({ ok: true, reservations: reservations.length, sent })
}
