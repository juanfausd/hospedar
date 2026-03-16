import { query } from '@/lib/db'
import { Reservation, Property } from '@/lib/types'
import ReservationsClient from './components/ReservationsClient'

export const dynamic = 'force-dynamic'

export default async function Home() {
  let reservations: Reservation[] = []
  let properties: Property[] = []
  try {
    const [resR, resP] = await Promise.all([
      query('SELECT * FROM reservations ORDER BY checkin ASC'),
      query('SELECT * FROM properties ORDER BY name ASC'),
    ])
    reservations = resR.rows
    properties = resP.rows
  } catch (e) {
    console.error('DB error:', e)
  }
  return <ReservationsClient initialReservations={reservations} initialProperties={properties} />
}
