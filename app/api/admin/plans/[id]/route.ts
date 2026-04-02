import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  const { name, max_properties, description, cost } = await req.json()

  if (!name) {
    return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
  }

  const result = await query(
    `UPDATE plans SET name = $1, max_properties = $2, description = $3, cost = $4
     WHERE id = $5 RETURNING *`,
    [name, max_properties ?? null, description || null, cost ?? 0, id]
  )

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })
  }

  return NextResponse.json(result.rows[0])
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  await query('DELETE FROM plans WHERE id = $1', [id])
  return NextResponse.json({ ok: true })
}
