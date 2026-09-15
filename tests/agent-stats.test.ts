import { describe, expect, test, tier } from 'claude-code/testing'

tier('user')

describe('agent-stats', () => {
  const presentation = { isFullscreen: false, columns: 80 }

  test('reports no agents yet when none have spawned', async ($, on) => {
    on('command.register', ($, event) => ({ value: { command: event.name } }))
    on('store.get', () => ({ value: undefined }))
    on('store.set', () => ({ value: undefined }))
    on('session.start', ($, event) => ({ cwd: event.cwd }))
    on('ui.notice', () => ({ value: undefined }))
    on('ui.toast', () => ({ value: undefined }))
    on('fs.exists', () => ({ value: false }))
    on('fs.read', () => ({ value: '' }))
    on('fs.write', () => ({ value: undefined }))
    on('tool.call', () => ({ result: { ok: true } }))
    on('agent.list', () => ({ value: [] }))

    await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })

    const result = await $.command.run({
      command: 'agent-stats',
      args: '',
      origin: { kind: 'composer' },
      presentation,
    })

    expect(result.text).toBe('No agents spawned yet this session.')
  })

  test('summarizes agents by type and status', async ($, on) => {
    on('command.register', ($, event) => ({ value: { command: event.name } }))
    on('store.get', () => ({ value: undefined }))
    on('store.set', () => ({ value: undefined }))
    on('session.start', ($, event) => ({ cwd: event.cwd }))
    on('ui.notice', () => ({ value: undefined }))
    on('ui.toast', () => ({ value: undefined }))
    on('fs.exists', () => ({ value: false }))
    on('fs.read', () => ({ value: '' }))
    on('fs.write', () => ({ value: undefined }))
    on('tool.call', () => ({ result: { ok: true } }))
    on('agent.list', () => ({
      value: [
        { id: 'a1', description: 'row a1', type: 'general-purpose', status: 'completed' },
        { id: 'a2', description: 'row a2', type: 'general-purpose', status: 'running' },
        { id: 'a3', description: 'row a3', type: 'general-purpose', status: 'completed' },
        { id: 'a4', description: 'row a4', type: 'Explore', status: 'completed' },
      ],
    }))

    await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })

    const result = await $.command.run({
      command: 'agent-stats',
      args: '',
      origin: { kind: 'composer' },
      presentation,
    })

    expect(result.text).toBe(
      'general-purpose: 3 (completed: 2, running: 1)\nExplore: 1 (completed: 1)',
    )
  })
})
