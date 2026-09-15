const SUMMARY_KEYS = ['file_path', 'command', 'path', 'pattern', 'query'] as const

const MAX_SUMMARY_LENGTH = 120

export const summarizeToolCall = (
  event: Record<string, unknown>,
): string | undefined => {
  for (const key of SUMMARY_KEYS) {
    const value = event[key]

    if (typeof value === 'string' && value.length > 0) {
      return value.length > MAX_SUMMARY_LENGTH
        ? `${value.slice(0, MAX_SUMMARY_LENGTH - 3)}...`
        : value
    }
  }

  return undefined
}

export const workLogPathOf = (nowMs: number): string =>
  `.claude/work-log/${new Date(nowMs).toISOString().slice(0, 10)}.md`

export const formatLogLine = (
  nowMs: number,
  tool: string,
  summary: string | undefined,
): string => {
  const time = new Date(nowMs).toISOString().slice(11, 19)

  return summary ? `- ${time} ${tool} \`${summary}\`\n` : `- ${time} ${tool}\n`
}
