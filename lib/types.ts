export interface Reservation {
  id: number
  ical_uid?: string
  name: string
  phone?: string
  checkin: string | Date
  checkout: string | Date
  guests: number
  cost: number
  sena: number
  status: 'confirmed' | 'pending' | 'cancelled'
  source: 'booking' | 'airbnb' | 'particular'
  notes?: string
  created_at?: string
  updated_at?: string
}
