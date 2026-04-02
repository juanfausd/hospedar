import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { query } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  const { email, first_name, last_name, password, role } = await req.json()

  if (!email) {
    return NextResponse.json({ error: 'Email es requerido' }, { status: 400 })
  }

  const existing = await query('SELECT id FROM users WHERE username = $1 AND id != $2', [email, id])
  if (existing.rows.length > 0) {
    return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 409 })
  }

  const validRole = role === 'admin' ? 'admin' : 'propietario'

  if (password) {
    const password_hash = bcrypt.hashSync(password, 10)
    await query(
      `UPDATE users SET username = $1, email = $2, first_name = $3, last_name = $4, role = $5, password_hash = $6
       WHERE id = $7`,
      [email, email, first_name || null, last_name || null, validRole, password_hash, id]
    )
  } else {
    await query(
      `UPDATE users SET username = $1, email = $2, first_name = $3, last_name = $4, role = $5
       WHERE id = $6`,
      [email, email, first_name || null, last_name || null, validRole, id]
    )
  }

  const result = await query(
    'SELECT id, username, email, first_name, last_name, role, created_at FROM users WHERE id = $1',
    [id]
  )
  return NextResponse.json(result.rows[0])
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  await query('DELETE FROM users WHERE id = $1', [id])
  return NextResponse.json({ ok: true })
}
