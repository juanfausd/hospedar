import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const propertyId = req.nextUrl.searchParams.get('property_id')
  let sql = 'SELECT * FROM reservations'
  const params: unknown[] = []
  if (propertyId) {
    sql += ' WHERE property_id = $1'
    params.push(propertyId)
  }
  sql += ' ORDER BY checkin ASC'
  const res = await query(sql, params)
  return NextResponse.json(res.rows)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, phone, checkin, checkout, guests, cost, sena, status, source, notes, property_id } = body

  if (!name || !checkin || !checkout) {
    return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
  }

  const res = await query(
    `INSERT INTO reservations (name, phone, checkin, checkout, guests, cost, sena, status, source, notes, property_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [name, phone || '', checkin, checkout, guests || 1, cost || 0, sena || 0, status || 'confirmed', source || 'particular', notes || '', property_id || null]
  )
  return NextResponse.json(res.rows[0], { status: 201 })
}
