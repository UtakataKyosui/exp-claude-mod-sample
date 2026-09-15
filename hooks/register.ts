import type { Register } from 'claude-code'

import { COMMAND_NAME as AGENT_STATS_COMMAND_NAME, formatAgentStats } from './agent-stats'
import { formatDuration } from './format-duration'
import {
  COMMAND_NAME as SKILL_STATS_COMMAND_NAME,
  formatSkillStats,
  isSkillStats,
  STORE_KEY as SKILL_STORE_KEY,
} from './skill-stats'
import { COMMAND_NAME as TOOL_STATS_COMMAND_NAME, formatStats, isToolStats, STORE_KEY } from './stats'
import { formatLogLine, summarizeToolCall, workLogPathOf } from './work-log'

export const register: Register = on => {
  on('session.start', async ($, event, next) => {
    await $.command.register({
      name: TOOL_STATS_COMMAND_NAME,
      description: 'Shows per-tool call counts and total time so far.',
    })
    await $.command.register({
      name: SKILL_STATS_COMMAND_NAME,
      description: 'Shows per-skill call counts so far.',
    })
    await $.command.register({
      name: AGENT_STATS_COMMAND_NAME,
      description: 'Shows spawned agents by type and status this session.',
    })

    return next(event)
  })

  on('command.run', { command: TOOL_STATS_COMMAND_NAME }, async $ => {
    const stored = await $.store.get(STORE_KEY)

    return { text: formatStats(isToolStats(stored) ? stored : {}) }
  })

  on('command.run', { command: SKILL_STATS_COMMAND_NAME }, async $ => {
    const stored = await $.store.get(SKILL_STORE_KEY)

    return { text: formatSkillStats(isSkillStats(stored) ? stored : {}) }
  })

  on('command.run', { command: AGENT_STATS_COMMAND_NAME }, async $ => {
    const agents = await $.agent.list()

    return { text: formatAgentStats(agents) }
  })

  on('skill.prompt', async ($, event, next) => {
    const stored = await $.store.get(SKILL_STORE_KEY)
    const stats = isSkillStats(stored) ? stored : {}

    await $.store.set(SKILL_STORE_KEY, {
      ...stats,
      [event.skill]: (stats[event.skill] ?? 0) + 1,
    })

    return next(event)
  })

  on('tool.call', async ($, event, next) => {
    const startedAt = await $.clock.now()

    $.ui.notice(event.tool_use_id, `Timing ${event.tool}…`)

    try {
      return await next(event)
    } finally {
      const finishedAt = await $.clock.now()
      const durationMs = Math.max(0, finishedAt - startedAt)

      $.ui.notice(event.tool_use_id, undefined)
      $.ui.toast(`${event.tool} finished in ${formatDuration(durationMs)}`)

      const stored = await $.store.get(STORE_KEY)
      const stats = isToolStats(stored) ? stored : {}
      const current = stats[event.tool] ?? { count: 0, totalMs: 0 }

      await $.store.set(STORE_KEY, {
        ...stats,
        [event.tool]: {
          count: current.count + 1,
          totalMs: current.totalMs + durationMs,
        },
      })

      const logPath = workLogPathOf(finishedAt)
      const logExisted = await $.fs.exists(logPath)
      const logSoFar = logExisted ? await $.fs.read(logPath) : ''

      await $.fs.write(
        logPath,
        logSoFar + formatLogLine(finishedAt, event.tool, summarizeToolCall(event)),
      )
    }
  })
}
