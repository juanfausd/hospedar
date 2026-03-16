import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const { name, address, rooms, capacity, google_maps_url, instagram_url } = body
  if (!name) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
  const res = await query(
    `UPDATE properties SET name=$1, address=$2, rooms=$3, capacity=$4, google_maps_url=$5, instagram_url=$6
     WHERE id=$7 RETURNING *`,
    [name, address || null, rooms || 1, capacity || 2, google_maps_url || null, instagram_url || null, params.id]
  )
  if (res.rowCount === 0) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(res.rows[0])
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await query('DELETE FROM properties WHERE id=$1', [params.id])
  return NextResponse.json({ ok: true })
}
