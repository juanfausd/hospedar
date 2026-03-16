import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  const res = await query('SELECT * FROM properties ORDER BY name ASC')
  return NextResponse.json(res.rows)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, address, rooms, capacity, google_maps_url, instagram_url } = body
  if (!name) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
  const res = await query(
    `INSERT INTO properties (name, address, rooms, capacity, google_maps_url, instagram_url)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [name, address || null, rooms || 1, capacity || 2, google_maps_url || null, instagram_url || null]
  )
  return NextResponse.json(res.rows[0], { status: 201 })
}
