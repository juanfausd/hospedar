import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  const settings: Record<string, string> = {}
  try {
    const res = await query('SELECT key, value FROM settings')
    for (const row of res.rows) settings[row.key] = row.value
  } catch {
    // settings table may not exist yet
  }
  if (!settings.ical_url && process.env.ICAL_URL) {
    settings.ical_url = process.env.ICAL_URL
  }
  return NextResponse.json(settings)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  try {
    for (const [key, value] of Object.entries(body)) {
      await query(
        `INSERT INTO settings (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [key, value]
      )
    }
  } catch (err: any) {
    return NextResponse.json({ error: 'No se pudo guardar. Corré npm run db:migrate primero.' }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
