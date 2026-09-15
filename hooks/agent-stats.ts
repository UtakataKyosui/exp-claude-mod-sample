import type { AgentInfo } from 'claude-code'

export const COMMAND_NAME = 'agent-stats'

export const formatAgentStats = (agents: readonly AgentInfo[]): string => {
  const byType = new Map<string, AgentInfo[]>()

  for (const agent of agents) {
    const group = byType.get(agent.type) ?? []

    group.push(agent)
    byType.set(agent.type, group)
  }

  const rows = [...byType.entries()].sort(
    ([, a], [, b]) => b.length - a.length,
  )

  if (rows.length === 0) {
    return 'No agents spawned yet this session.'
  }

  return rows
    .map(([type, group]) => {
      const byStatus = new Map<string, number>()

      for (const agent of group) {
        byStatus.set(agent.status, (byStatus.get(agent.status) ?? 0) + 1)
      }

      const breakdown = [...byStatus.entries()]
        .map(([status, count]) => `${status}: ${count}`)
        .join(', ')

      return `${type}: ${group.length} (${breakdown})`
    })
    .join('\n')
}
