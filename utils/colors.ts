const ACCENT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#f97316', // orange
  '#14b8a6', // teal
  '#84cc16', // lime
  '#eab308', // yellow
  '#a855f7', // violet
  '#f43f5e', // rose
  '#06b6d4', // sky
  '#22c55e', // emerald
  '#6366f1', // indigo
  '#d946ef', // fuchsia
  '#fb923c', // orange-400
  '#2dd4bf', // teal-400
  '#facc15', // yellow-400
  '#c084fc', // purple-400
  '#fb7185', // rose-400
  '#38bdf8', // sky-400
  '#4ade80', // green-400
  '#818cf8', // indigo-400
  '#e879f9', // fuchsia-400
  '#94a3b8', // slate-400
  '#fbbf24', // amber-400
  '#34d399', // emerald-400
  '#60a5fa', // blue-400
  '#f472b6', // pink-400
  '#a78bfa', // violet-400
  '#fca5a5', // red-400
  '#67e8f9', // cyan-400
  '#fdba74', // orange-300
  '#5eead4', // teal-300
  '#fde047', // yellow-300
  '#d8b4fe', // purple-300
  '#fda4af', // rose-300
  '#7dd3fc', // sky-300
  '#86efac', // green-300
  '#a5b4fc', // indigo-300
  '#f0abfc', // fuchsia-300
  '#cbd5e1', // slate-300
  '#fcd34d', // amber-300
  '#6ee7b7', // emerald-300
  '#93c5fd', // blue-300
  '#f9a8d4', // pink-300
  '#c4b5fd', // violet-300
  '#fecaca', // red-300
] as const

export function getRandomAccentColor(): string {
  const index = Math.floor(Math.random() * ACCENT_COLORS.length)
  return ACCENT_COLORS[index]!
}
