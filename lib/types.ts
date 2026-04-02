export interface Property {
  id: number
  name: string
  address?: string
  rooms?: number
  capacity?: number
  google_maps_url?: string
  instagram_url?: string
  created_at?: string
}

export interface Reservation {
  id: number
  property_id?: number | null
  ical_uid?: string
  name: string
  phone?: string
  checkin: string | Date
  checkout: string | Date
  guests: number
  cost: number
  sena: number
  status: 'confirmed' | 'contactada' | 'pending' | 'cancelled'
  source: 'booking' | 'airbnb' | 'particular'
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface User {
  id: number
  username: string
  email?: string
  first_name?: string
  last_name?: string
  role: string
  created_at?: string
}

export interface Plan {
  id: number
  name: string
  max_properties: number | null
  description?: string
  cost: number
  created_at?: string
}

export interface MonthlyCost {
  id: number
  property_id?: number | null
  year_month: string
  description: string
  type: string
  cost: number
  created_at?: string
}
