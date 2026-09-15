export const STORE_KEY = 'skillStats'
export const COMMAND_NAME = 'skill-stats'

export type SkillStats = Record<string, number>

export const isSkillStats = (value: unknown): value is SkillStats =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const formatSkillStats = (stats: SkillStats): string => {
  const rows = Object.entries(stats).sort(([, a], [, b]) => b - a)

  if (rows.length === 0) {
    return 'No skills used yet.'
  }

  return rows.map(([skill, count]) => `${skill}: ${count} calls`).join('\n')
}
