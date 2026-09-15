import { describe, expect, test, tier } from 'claude-code/testing'

tier('user')

describe('tool-timer', () => {
  test('preserves the tool result and reports elapsed time', async ($, on) => {
    const notices: Array<{ toolUseId: string; text: string | undefined }> = []
    const toasts: string[] = []
    const times = [1_000, 2_250]

    on('clock.now', () => ({ value: times.shift() ?? 2_250 }))
    on('ui.notice', ($, event) => {
      notices.push({ toolUseId: event.tool_use_id, text: event.text })
      return { value: undefined }
    })
    on('ui.toast', ($, event) => {
      toasts.push(event.text)
      return { value: undefined }
    })
    on('store.get', () => ({ value: undefined }))
    on('store.set', () => ({ value: undefined }))
    on('tool.call', () => ({ result: { ok: true } }))

    const result = await $.tool.call({ tool: 'mcp__demo__ping' })

    expect(result).toEqual({ result: { ok: true } })
    expect(notices).toEqual([
      { toolUseId: expect.any(String), text: 'Timing mcp__demo__ping…' },
      { toolUseId: expect.any(String), text: undefined },
    ])
    expect(toasts).toEqual(['mcp__demo__ping finished in 1.3 s'])
  })
})
