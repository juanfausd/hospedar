import { NextResponse } from 'next/server'

export interface Holiday {
  fecha: string   // "2026-01-01"
  nombre: string
  tipo: string
}

export async function GET() {
  try {
    const currentYear = new Date().getFullYear()
    const nextYear = currentYear + 1

    const [r1, r2] = await Promise.all([
      fetch(`https://api.argentinadatos.com/v1/feriados/${currentYear}`, { next: { revalidate: 86400 } }),
      fetch(`https://api.argentinadatos.com/v1/feriados/${nextYear}`, { next: { revalidate: 86400 } }),
    ])

    const [d1, d2]: [Holiday[], Holiday[]] = await Promise.all([r1.json(), r2.json()])
    const holidays: Holiday[] = [...d1, ...d2]

    return NextResponse.json(holidays)
  } catch {
    return NextResponse.json([])
  }
}
