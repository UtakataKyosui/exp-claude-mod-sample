export const formatDuration = (durationMs: number): string =>
  durationMs < 1000
    ? `${Math.round(durationMs)} ms`
    : `${(durationMs / 1000).toFixed(1)} s`
