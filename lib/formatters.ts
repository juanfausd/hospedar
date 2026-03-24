export function toDateStr(d: string | Date): string {
  if (!d) return ""
  if (typeof d === "string") return d
  return d.toISOString()
}

export function nightsBetween(a: string | Date, b: string | Date) {
  return Math.max(0, Math.round((new Date(toDateStr(b)).getTime() - new Date(toDateStr(a)).getTime()) / 86400000))
}

export function formatDate(d: string | Date) {
  if (!d) return "—"
  const s = toDateStr(d)
  const [y, m, day] = s.split("T")[0].split("-")
  return `${day}/${m}/${y}`
}

export function formatARS(n: number) {
  return '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function monthKey(d: string | Date) {
  const s = toDateStr(d)
  return s ? s.slice(0, 7) : ""
}
