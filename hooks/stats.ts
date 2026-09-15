import { formatDuration } from './format-duration'

export const STORE_KEY = 'toolStats'
export const COMMAND_NAME = 'tool-stats'

export type ToolStats = Record<string, { count: number; totalMs: number }>

export const isToolStats = (value: unknown): value is ToolStats =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const formatStats = (stats: ToolStats): string => {
  const rows = Object.entries(stats).sort(([, a], [, b]) => b.count - a.count)

  if (rows.length === 0) {
    return 'No tool calls recorded yet.'
  }

  return rows
    .map(
      ([tool, { count, totalMs }]) =>
        `${tool}: ${count} calls, ${formatDuration(totalMs)} total`,
    )
    .join('\n')
}
