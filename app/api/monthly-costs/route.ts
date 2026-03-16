import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const month = req.nextUrl.searchParams.get('month')
  if (!month) return NextResponse.json({ error: 'Falta parámetro month' }, { status: 400 })

  const res = await query(
    'SELECT * FROM monthly_costs WHERE year_month = $1 ORDER BY created_at ASC',
    [month]
  )
  return NextResponse.json(res.rows)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { year_month, description, type, cost } = body

  if (!year_month || !description || !type) {
    return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
  }

  const res = await query(
    `INSERT INTO monthly_costs (year_month, description, type, cost)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [year_month, description, type, cost || 0]
  )
  return NextResponse.json(res.rows[0], { status: 201 })
}
