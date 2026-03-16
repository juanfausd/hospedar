import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const res = await query(
    'SELECT * FROM reservation_costs WHERE reservation_id = $1 ORDER BY created_at ASC',
    [params.id]
  )
  return NextResponse.json(res.rows)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const { description, type, cost } = body

  if (!description || !type) {
    return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
  }

  const res = await query(
    `INSERT INTO reservation_costs (reservation_id, description, type, cost)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [params.id, description, type, cost || 0]
  )
  return NextResponse.json(res.rows[0], { status: 201 })
}
