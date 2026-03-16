import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await query('DELETE FROM monthly_costs WHERE id = $1', [params.id])
  return NextResponse.json({ success: true })
}
