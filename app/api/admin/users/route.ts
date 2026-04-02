import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { query } from '@/lib/db'

export async function GET() {
  const result = await query(
    'SELECT id, username, email, first_name, last_name, role, created_at FROM users ORDER BY created_at ASC'
  )
  return NextResponse.json(result.rows)
}

export async function POST(req: NextRequest) {
  const { email, first_name, last_name, password, role } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 })
  }

  const existing = await query('SELECT id FROM users WHERE username = $1', [email])
  if (existing.rows.length > 0) {
    return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 409 })
  }

  const password_hash = bcrypt.hashSync(password, 10)
  const validRole = role === 'admin' ? 'admin' : 'propietario'

  const result = await query(
    `INSERT INTO users (username, password_hash, email, first_name, last_name, role)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, username, email, first_name, last_name, role, created_at`,
    [email, password_hash, email, first_name || null, last_name || null, validRole]
  )

  return NextResponse.json(result.rows[0], { status: 201 })
}
