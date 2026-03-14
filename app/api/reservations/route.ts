import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  const res = await query(
    'SELECT * FROM reservations ORDER BY checkin ASC'
  )
  return NextResponse.json(res.rows)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, phone, checkin, checkout, guests, cost, sena, status, source, notes } = body

  if (!name || !checkin || !checkout) {
    return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
  }

  const res = await query(
    `INSERT INTO reservations (name, phone, checkin, checkout, guests, cost, sena, status, source, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [name, phone || '', checkin, checkout, guests || 1, cost || 0, sena || 0, status || 'confirmed', source || 'particular', notes || '']
  )
  return NextResponse.json(res.rows[0], { status: 201 })
}
