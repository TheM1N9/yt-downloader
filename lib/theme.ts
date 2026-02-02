/** Client-only theme utilities. */

export const THEME_STORAGE_KEY = "theme"

export const THEMES = ["system", "light", "dark"] as const
export type Theme = (typeof THEMES)[number]

const themeSchema = { system: true, light: true, dark: true } as const
export function parseTheme(value: string | null): Theme {
  if (value === null || value === undefined) return "system"
  if (themeSchema[value as Theme]) return value as Theme
  return "system"
}

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system"
  return parseTheme(localStorage.getItem(THEME_STORAGE_KEY))
}

export function setStoredTheme(theme: Theme): void {
  if (typeof window === "undefined") return
  localStorage.setItem(THEME_STORAGE_KEY, theme)
}

export function getEffectiveDark(): boolean {
  if (typeof window === "undefined") return false
  const theme = getStoredTheme()
  if (theme === "dark") return true
  if (theme === "light") return false
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

export function applyTheme(theme: Theme): void {
  const dark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  document.documentElement.classList.toggle("dark", dark)
}
