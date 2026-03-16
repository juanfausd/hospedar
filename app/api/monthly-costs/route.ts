import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const month = req.nextUrl.searchParams.get('month')
  const propertyId = req.nextUrl.searchParams.get('property_id')
  if (!month) return NextResponse.json({ error: 'Falta parámetro month' }, { status: 400 })

  const params: unknown[] = [month]
  let sql = 'SELECT * FROM monthly_costs WHERE year_month = $1'
  if (propertyId) {
    sql += ' AND property_id = $2'
    params.push(propertyId)
  }
  sql += ' ORDER BY created_at ASC'

  const res = await query(sql, params)
  return NextResponse.json(res.rows)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { year_month, description, type, cost, property_id } = body

  if (!year_month || !description || !type) {
    return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
  }

  const res = await query(
    `INSERT INTO monthly_costs (year_month, description, type, cost, property_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [year_month, description, type, cost || 0, property_id || null]
  )
  return NextResponse.json(res.rows[0], { status: 201 })
}
