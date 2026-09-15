import { describe, expect, test, tier } from 'claude-code/testing'

tier('user')

describe('skill-stats', () => {
  test('registers /skill-stats and tallies per-skill call counts', async ($, on) => {
    const registered: string[] = []
    const store = new Map<string, unknown>()
    const presentation = { isFullscreen: false, columns: 80 }

    on('clock.now', () => ({ value: 0 }))
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
    on('skill.prompt', ($, event) => ({ text: event.text }))
    on('ui.notice', () => ({ value: undefined }))
    on('ui.toast', () => ({ value: undefined }))
    on('fs.exists', () => ({ value: false }))
    on('fs.read', () => ({ value: '' }))
    on('fs.write', () => ({ value: undefined }))
    on('tool.call', () => ({ result: { ok: true } }))

    await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })

    expect(registered).toEqual(['tool-stats', 'skill-stats', 'agent-stats'])

    const before = await $.command.run({
      command: 'skill-stats',
      args: '',
      origin: { kind: 'composer' },
      presentation,
    })

    expect(before.text).toBe('No skills used yet.')

    await $.skill.prompt({ skill: 'commit', text: 'do the commit' })
    await $.skill.prompt({ skill: 'commit', text: 'do the commit again' })
    await $.skill.prompt({ skill: 'code-review', text: 'review this' })

    const after = await $.command.run({
      command: 'skill-stats',
      args: '',
      origin: { kind: 'composer' },
      presentation,
    })

    expect(after.text).toBe('commit: 2 calls\ncode-review: 1 calls')
  })
})
