import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const { name, phone, checkin, checkout, guests, cost, sena, status, source, notes } = body

  const res = await query(
    `UPDATE reservations
     SET name=$1, phone=$2, checkin=$3, checkout=$4, guests=$5, cost=$6, sena=$7, status=$8, source=$9, notes=$10, updated_at=NOW()
     WHERE id=$11
     RETURNING *`,
    [name, phone || '', checkin, checkout, guests || 1, cost || 0, sena || 0, status || 'confirmed', source || 'particular', notes || '', params.id]
  )

  if (!res.rows.length) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }
  return NextResponse.json(res.rows[0])
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await query('DELETE FROM reservations WHERE id=$1', [params.id])
  return NextResponse.json({ success: true })
}
