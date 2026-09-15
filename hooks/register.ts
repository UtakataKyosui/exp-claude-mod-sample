import type { Register } from 'claude-code'

const formatDuration = (durationMs: number): string =>
  durationMs < 1000
    ? `${Math.round(durationMs)} ms`
    : `${(durationMs / 1000).toFixed(1)} s`

export const register: Register = on => {
  on('tool.call', async ($, event, next) => {
    const startedAt = await $.clock.now()

    $.ui.notice(event.tool_use_id, `Timing ${event.tool}…`)

    try {
      return await next(event)
    } finally {
      const finishedAt = await $.clock.now()
      const duration = formatDuration(Math.max(0, finishedAt - startedAt))

      $.ui.notice(event.tool_use_id, undefined)
      $.ui.toast(`${event.tool} finished in ${duration}`)
    }
  })
}
