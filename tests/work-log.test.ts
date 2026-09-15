import { describe, expect, test, tier } from 'claude-code/testing'

tier('user')

describe('work-log', () => {
  test('appends each tool call to a daily work log file', async ($, on) => {
    const fs = new Map<string, string>()
    const times = [
      Date.parse('2026-09-15T01:02:03Z'),
      Date.parse('2026-09-15T01:02:04Z'),
      Date.parse('2026-09-15T02:00:00Z'),
      Date.parse('2026-09-15T02:00:01Z'),
    ]

    on('clock.now', () => ({ value: times.shift() ?? 0 }))
    on('ui.notice', () => ({ value: undefined }))
    on('ui.toast', () => ({ value: undefined }))
    on('store.get', () => ({ value: undefined }))
    on('store.set', () => ({ value: undefined }))
    on('fs.exists', ($, event) => ({ value: fs.has(event.path) }))
    on('fs.read', ($, event) => ({ value: fs.get(event.path) ?? '' }))
    on('fs.write', ($, event) => {
      fs.set(event.path, event.text)
      return { value: undefined }
    })
    on('tool.call', () => ({ result: { ok: true } }))

    await $.tool.call({ tool: 'Read', file_path: '/repo/README.md' })
    await $.tool.call({ tool: 'Bash', command: 'ls' })

    // $.fs.write receives the path resolved to an absolute one under the
    // working directory, not the relative path register.ts passed in.
    const [loggedPath, loggedText] = [...fs.entries()][0] ?? []

    expect(loggedPath?.endsWith('.claude/work-log/2026-09-15.md')).toBe(true)
    expect(loggedText).toBe(
      '- 01:02:04 Read `/repo/README.md`\n- 02:00:01 Bash `ls`\n',
    )
  })
})
