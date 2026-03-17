import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { phones } = body
  if (!Array.isArray(phones)) {
    return NextResponse.json({ error: 'phones must be an array' }, { status: 400 })
  }
  try {
    await query(
      `INSERT INTO settings (key, value, updated_at)
       VALUES ('notification_phones', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [JSON.stringify(phones)]
    )
  } catch (err: any) {
    return NextResponse.json({ error: 'No se pudo guardar. Corré npm run db:migrate primero.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
