export const AI_CONFIG = {
  model: "claude-sonnet-4-20250514",
  maxOutputTokens: 1024,
  synthesisMinChars: 50,
  synthesisDeltaMin: 100,
  synthesisDeltaRatio: 0.1,
  synthesisTypingPauseMs: 3000,   // wait for typing pause after delta threshold met
  profileRebuildInterval: 10,
  tagMaxLength: 30,
  tagMaxCount: 3,
} as const
