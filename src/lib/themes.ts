export interface Theme {
  id: string
  label: string
  isDark: boolean
  /** CSS swatch color for the picker */
  swatch: string
}

export const themes: Theme[] = [
  { id: "theme-pink", label: "Sakura", isDark: false, swatch: "hsl(340 65% 55%)" },
  { id: "theme-blue", label: "Ocean", isDark: false, swatch: "hsl(215 70% 50%)" },
  { id: "theme-dark", label: "Zinc", isDark: true, swatch: "hsl(240 5% 35%)" },
  { id: "theme-violet", label: "Violet", isDark: true, swatch: "hsl(270 60% 65%)" },
  { id: "theme-red", label: "Crimson", isDark: true, swatch: "hsl(0 65% 55%)" },
  { id: "theme-cyan", label: "Teal", isDark: true, swatch: "hsl(180 60% 50%)" },
]

export const DEFAULT_THEME = "theme-dark"
