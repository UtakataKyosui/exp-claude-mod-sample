import { describe, expect, test, tier } from 'claude-code/testing'

tier('user')

describe('tool-stats', () => {
  test('registers /tool-stats and tallies per-tool call counts and total time', async ($, on) => {
    const registered: string[] = []
    const store = new Map<string, unknown>()
    const times = [1_000, 1_200, 1_200, 1_500, 1_500, 1_800]
    const presentation = { isFullscreen: false, columns: 80 }

    on('clock.now', () => ({ value: times.shift() ?? 1_800 }))
    on('command.register', ($, event) => {
      registered.push(event.name)
      return { value: { command: event.name } }
    })
    on('store.get', ($, event) => ({ value: store.get(event.key) }))
    on('store.set', ($, event) => {
      store.set(event.key, event.value)
      return { value: undefined }
    })
    on('session.start', ($, event) => ({ cwd: event.cwd }))
    on('ui.notice', () => ({ value: undefined }))
    on('ui.toast', () => ({ value: undefined }))
    on('fs.exists', () => ({ value: false }))
    on('fs.read', () => ({ value: '' }))
    on('fs.write', () => ({ value: undefined }))
    on('tool.call', () => ({ result: { ok: true } }))

    await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })

    expect(registered).toEqual(['tool-stats'])

    const before = await $.command.run({
      command: 'tool-stats',
      args: '',
      origin: { kind: 'composer' },
      presentation,
    })

    expect(before.text).toBe('No tool calls recorded yet.')

    await $.tool.call({ tool: 'mcp__demo__ping' })
    await $.tool.call({ tool: 'mcp__demo__ping' })
    await $.tool.call({ tool: 'mcp__demo__pong' })

    const after = await $.command.run({
      command: 'tool-stats',
      args: '',
      origin: { kind: 'composer' },
      presentation,
    })

    expect(after.text).toBe(
      'mcp__demo__ping: 2 calls, 500 ms total\nmcp__demo__pong: 1 calls, 300 ms total',
    )
  })
})
