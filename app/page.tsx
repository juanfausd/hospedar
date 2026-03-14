import { query } from '@/lib/db'
import { Reservation } from '@/lib/types'
import ReservationsClient from './components/ReservationsClient'

export const dynamic = 'force-dynamic'

export default async function Home() {
  let reservations: Reservation[] = []
  try {
    const res = await query('SELECT * FROM reservations ORDER BY checkin ASC')
    reservations = res.rows
  } catch (e) {
    console.error('DB error:', e)
  }
  return <ReservationsClient initialReservations={reservations} />
}
