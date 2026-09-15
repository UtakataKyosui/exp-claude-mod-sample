import type { Register } from 'claude-code'

import { formatDuration } from './format-duration'
import { COMMAND_NAME, formatStats, isToolStats, STORE_KEY } from './stats'
import { formatLogLine, summarizeToolCall, workLogPathOf } from './work-log'

export const register: Register = on => {
  on('session.start', async ($, event, next) => {
    await $.command.register({
      name: COMMAND_NAME,
      description: 'Shows per-tool call counts and total time so far.',
    })

    return next(event)
  })

  on('command.run', { command: COMMAND_NAME }, async $ => {
    const stored = await $.store.get(STORE_KEY)

    return { text: formatStats(isToolStats(stored) ? stored : {}) }
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
