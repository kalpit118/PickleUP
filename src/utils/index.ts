/**
 * Shared utility functions.
 */

/**
 * Format a date to a locale-friendly short string.
 * Example: "Sep 24, 2026"
 */
export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Compute win rate as a percentage string.
 * Example: winRate(7, 3) → "70%"
 */
export function winRate(wins: number, total: number): string {
  if (total === 0) return '—'
  return `${Math.round((wins / total) * 100)}%`
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Generate initials from a player name (up to 2 chars).
 * Example: "Ravi Kumar" → "RK"
 */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
