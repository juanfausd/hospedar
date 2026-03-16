const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
require('dotenv').config({ path: '.env.local' })

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reservations (
      id SERIAL PRIMARY KEY,
      ical_uid TEXT UNIQUE,
      name TEXT NOT NULL,
      phone TEXT,
      checkin DATE NOT NULL,
      checkout DATE NOT NULL,
      guests INTEGER DEFAULT 1,
      cost NUMERIC(10,2) DEFAULT 0,
      status TEXT DEFAULT 'confirmed',
      source TEXT DEFAULT 'particular',
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)
  // Add columns if migrating from an older version
  await pool.query(`
    ALTER TABLE reservations ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'particular';
  `)
  await pool.query(`
    ALTER TABLE reservations ADD COLUMN IF NOT EXISTS sena NUMERIC(10,2) DEFAULT 0;
  `)
  console.log('✅ Tabla reservations creada/actualizada.')

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)
  console.log('✅ Tabla users creada.')

  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)
  console.log('✅ Tabla settings creada.')

  await pool.query(`
    CREATE TABLE IF NOT EXISTS reservation_costs (
      id SERIAL PRIMARY KEY,
      reservation_id INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      type TEXT NOT NULL,
      cost NUMERIC(10,2) DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)
  console.log('✅ Tabla reservation_costs creada.')

  await pool.query(`
    CREATE TABLE IF NOT EXISTS monthly_costs (
      id SERIAL PRIMARY KEY,
      year_month TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL,
      cost NUMERIC(10,2) DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)
  console.log('✅ Tabla monthly_costs creada.')

  await pool.query(`
    CREATE TABLE IF NOT EXISTS properties (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      rooms INTEGER DEFAULT 1,
      capacity INTEGER DEFAULT 2,
      google_maps_url TEXT,
      instagram_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)
  console.log('✅ Tabla properties creada.')

  await pool.query(`
    ALTER TABLE reservations ADD COLUMN IF NOT EXISTS property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL;
  `)
  await pool.query(`
    ALTER TABLE monthly_costs ADD COLUMN IF NOT EXISTS property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL;
  `)
  console.log('✅ Columnas property_id agregadas.')

  // Insert default property if none exist
  await pool.query(`
    INSERT INTO properties (name)
    SELECT 'Apart Las Hermanas'
    WHERE NOT EXISTS (SELECT 1 FROM properties);
  `)
  console.log('✅ Alojamiento por defecto verificado.')

  // Assign all unassigned reservations and costs to the first property
  await pool.query(`
    UPDATE reservations
    SET property_id = (SELECT id FROM properties ORDER BY created_at ASC, id ASC LIMIT 1)
    WHERE property_id IS NULL;
  `)
  await pool.query(`
    UPDATE monthly_costs
    SET property_id = (SELECT id FROM properties ORDER BY created_at ASC, id ASC LIMIT 1)
    WHERE property_id IS NULL;
  `)
  console.log('✅ Reservas y costos asignados al alojamiento por defecto.')

  await pool.end()
}

migrate().catch(err => { console.error(err); process.exit(1) })
