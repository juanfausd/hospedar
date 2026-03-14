import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

async function getIcalUrl(): Promise<string> {
  try {
    const res = await query("SELECT value FROM settings WHERE key='ical_url'")
    if (res.rows.length && res.rows[0].value) return res.rows[0].value
  } catch {
    // settings table may not exist yet — fall back to env var
  }
  return process.env.ICAL_URL || ''
}

function parseDate(str: string): string | null {
  if (!str) return null
  const s = str.replace(/T.*/, '').replace(/\D/g, '')
  if (s.length < 8) return null
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
}

function unfold(raw: string): string {
  return raw.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '')
}

function parseICal(raw: string) {
  const unfolded = unfold(raw)
  const events: any[] = []
  const blocks = unfolded.split(/BEGIN:VEVENT/i)
  blocks.shift()

  for (const block of blocks) {
    const get = (key: string) => {
      const m = block.match(new RegExp(`(?:^|\\n)${key}(?:;[^:]*)?:([^\\r\\n]+)`, 'i'))
      return m ? m[1].trim() : ''
    }

    const uid = get('UID')
    const summary = get('SUMMARY') || 'Reserva Booking'
    const icalStatus = get('STATUS').toLowerCase()
    const dtstart = parseDate(get('DTSTART'))
    const dtend = parseDate(get('DTEND'))
    const description = get('DESCRIPTION')
    const gm = description.match(/(\d+)\s*(persona|guest|hu[eé]sped)/i)
    const guests = gm ? parseInt(gm[1]) : 1

    const lowerSummary = summary.toLowerCase().trim()

    // Skip property-blocking entries:
    // 1. Exact known block keywords
    // 2. Any entry lasting 90+ days (Booking's "CLOSED until further notice" blocks)
    const BLOCK_SUMMARIES = new Set(['closed', 'blocked', 'not available', 'no disponible', 'bloqueado'])
    const isExactBlock = BLOCK_SUMMARIES.has(lowerSummary)
    const hasBlockKeyword = ['closed', 'blocked', 'not available', 'no disponible', 'bloqueado'].some(k => lowerSummary.includes(k))
    const durationDays = dtstart && dtend
      ? Math.round((new Date(dtend).getTime() - new Date(dtstart).getTime()) / 86400000)
      : 0
    const isLongBlock = hasBlockKeyword && durationDays >= 90
    if (isExactBlock || isLongBlock) continue

    let status = 'pending'
    if (icalStatus === 'cancelled' || lowerSummary.includes('cancel')) {
      status = 'cancelled'
    }

    if (dtstart && dtend) {
      events.push({ uid, name: summary, checkin: dtstart, checkout: dtend, guests, status })
    }
  }
  return events
}

async function syncEvents(raw: string) {
  if (!raw.includes('BEGIN:VCALENDAR')) throw new Error('Respuesta inválida')

  // Remove previously imported blocking entries:
  // exact name match OR long-duration blocks with keyword in name
  await query(
    `DELETE FROM reservations WHERE source='booking' AND (
      LOWER(TRIM(name)) IN ('closed','blocked','not available','no disponible','bloqueado')
      OR (
        (checkout - checkin) >= 90 AND (
          LOWER(name) LIKE '%closed%' OR LOWER(name) LIKE '%blocked%' OR
          LOWER(name) LIKE '%not available%' OR LOWER(name) LIKE '%no disponible%' OR
          LOWER(name) LIKE '%bloqueado%'
        )
      )
    )`
  )

  const events = parseICal(raw)
  let added = 0, updated = 0, skipped = 0

  for (const ev of events) {
    const existing = await query(
      'SELECT id, source, status FROM reservations WHERE ical_uid=$1',
      [ev.uid]
    )

    if (existing.rows.length) {
      const row = existing.rows[0]
      // Don't overwrite confirmed reservations or manually edited entries
      const isConfirmed = row.status === 'confirmed'
      const isManuallyEdited =
        row.source !== 'booking' &&
        (row.status === 'confirmed' || row.status === 'pending')

      if (isConfirmed || isManuallyEdited) {
        skipped++
        continue
      }

      await query(
        `UPDATE reservations
         SET name=$1, checkin=$2, checkout=$3, guests=$4, status=$5, updated_at=NOW()
         WHERE ical_uid=$6`,
        [ev.name, ev.checkin, ev.checkout, ev.guests, ev.status, ev.uid]
      )
      updated++
    } else {
      // Skip if a confirmed reservation already covers this date range
      const overlap = await query(
        `SELECT id FROM reservations
         WHERE status = 'confirmed'
           AND checkin < $1 AND checkout > $2`,
        [ev.checkout, ev.checkin]
      )
      if (overlap.rows.length) {
        skipped++
        continue
      }

      await query(
        `INSERT INTO reservations (ical_uid, name, checkin, checkout, guests, status, source)
         VALUES ($1, $2, $3, $4, $5, $6, 'booking')`,
        [ev.uid, ev.name, ev.checkin, ev.checkout, ev.guests, ev.status]
      )
      added++
    }
  }

  return { added, updated, skipped, total: events.length }
}

export async function POST(req: NextRequest) {
  try {
    // Support uploading raw .ics content via header
    const icsHeader = req.headers.get('X-ICS-Content')
    if (icsHeader) {
      const raw = decodeURIComponent(icsHeader)
      const result = await syncEvents(raw)
      return NextResponse.json({ success: true, ...result })
    }

    // Otherwise fetch from Booking.com directly
    const icalUrl = await getIcalUrl()
    if (!icalUrl) throw new Error('No hay URL de iCal configurada. Configurala en Ajustes.')
    const res = await fetch(icalUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; calendar-sync/1.0)' },
      next: { revalidate: 0 },
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const raw = await res.text()
    const result = await syncEvents(raw)
    return NextResponse.json({ success: true, ...result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
