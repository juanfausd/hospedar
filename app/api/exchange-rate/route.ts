import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch('https://dolarapi.com/v1/dolares/oficial', {
      next: { revalidate: 3600 },
    })
    if (!res.ok) throw new Error('upstream error')
    const data = await res.json()
    const mid = (data.compra + data.venta) / 2
    return NextResponse.json({ rate: mid, compra: data.compra, venta: data.venta })
  } catch {
    return NextResponse.json({ error: 'No se pudo obtener el tipo de cambio del BNA' }, { status: 502 })
  }
}
