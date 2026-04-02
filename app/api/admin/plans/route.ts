import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  const result = await query('SELECT * FROM plans ORDER BY cost ASC, created_at ASC')
  return NextResponse.json(result.rows)
}

export async function POST(req: NextRequest) {
  const { name, max_properties, description, cost } = await req.json()

  if (!name) {
    return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
  }

  const result = await query(
    `INSERT INTO plans (name, max_properties, description, cost)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [name, max_properties ?? null, description || null, cost ?? 0]
  )

  return NextResponse.json(result.rows[0], { status: 201 })
}
