import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; costId: string } }) {
  await query(
    'DELETE FROM reservation_costs WHERE id = $1 AND reservation_id = $2',
    [params.costId, params.id]
  )
  return NextResponse.json({ success: true })
}
