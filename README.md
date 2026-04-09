# Hospedando — Sistema de Reservas

App de administración de reservas turísticas construida con Next.js 14, TypeScript, Tailwind CSS y PostgreSQL.

## Requisitos

- Node.js 18+
- PostgreSQL 14+

## Instalación

### 1. Clonar / copiar el proyecto

```bash
cd hospedaje-colon
npm install
```

### 2. Configurar la base de datos

Crear una base de datos en PostgreSQL:

```sql
CREATE DATABASE hospedaje;
```

### 3. Configurar variables de entorno

Editar el archivo `.env.local` con tus datos:

```env
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/hospedaje
ICAL_URL=https://ical.booking.com/v1/export?t=aa20d00a-3f9e-4c61-8db1-bf28b19b4e26
```

### 4. Crear la tabla en la base de datos

```bash
npm run db:migrate
```

### 5. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## Funcionalidades

### Reservas
- **Listar** todas las reservas ordenadas por fecha de llegada
- **Crear** reservas manualmente con nombre, teléfono, fechas, personas, costo y estado
- **Editar** cualquier reserva existente
- **Eliminar** reservas con confirmación

### Sincronización con Booking.com
Dos métodos disponibles:

**Opción A — Sincronización automática:**
Presioná el botón *↻ Sincronizar* en la app. El servidor hace el pedido al calendario iCal de Booking.com directamente. Si Booking bloquea la solicitud, usá la Opción B.

**Opción B — Importar archivo .ics manualmente:**
1. Entrá a Booking.com → tu propiedad → Calendario
2. Buscá *Exportar / Sincronizar calendario* y descargá el archivo `.ics`
3. En la app, presioná *Subir .ics* y seleccioná el archivo

En ambos casos, las reservas importadas de Booking se crean con estado `Booking` y pueden editarse para agregar teléfono, costo u otros datos.

### Métricas del mes
- Reservas activas
- Noches ocupadas
- Huéspedes totales
- Ingresos del mes

### Recordatorio mensual
El primer día de cada mes, la app muestra automáticamente un banner recordándote revisar las reservas y contactar a los huéspedes.

---

## Estados de reserva

| Estado | Descripción |
|--------|-------------|
| `confirmed` | Reserva confirmada manualmente |
| `pending` | Pendiente de confirmación |
| `cancelled` | Cancelada |
| `booking` | Importada desde Booking.com |

---

## Estructura del proyecto

```
hospedaje-colon/
├── app/
│   ├── api/
│   │   ├── reservations/
│   │   │   ├── route.ts          # GET (listar), POST (crear)
│   │   │   └── [id]/route.ts     # PUT (editar), DELETE (borrar)
│   │   └── sync-ical/
│   │       └── route.ts          # POST (sincronizar Booking.com)
│   ├── components/
│   │   └── ReservationsClient.tsx  # UI principal (cliente)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                  # Server component (carga inicial)
├── lib/
│   ├── db.ts                     # Pool de conexión PostgreSQL
│   ├── migrate.js                # Script de migración
│   └── types.ts                  # Tipos TypeScript compartidos
├── .env.local                    # Variables de entorno (no commitear)
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## Deploy en producción

Para producción se recomienda [Vercel](https://vercel.com) + [Supabase](https://supabase.com) (PostgreSQL gratuito):

1. Crear proyecto en Supabase y copiar la `DATABASE_URL` desde *Settings → Database → Connection string*
2. Importar el repositorio en Vercel
3. Agregar las variables de entorno `DATABASE_URL` e `ICAL_URL` en Vercel
4. Correr la migración una vez: `npm run db:migrate`

