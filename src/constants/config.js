// Anthropic API configuration
// VITE_ANTHROPIC_KEY задаётся в .env локально и в Environment Variables на Vercel
export const API_KEY = (import.meta.env.VITE_ANTHROPIC_KEY || "").trim();

export const AI_MODELS = [
  { id: "claude-haiku-5-5",  label: "Claude Haiku 5.5",  short: "Haiku 5.5",  badge: "⚡", color: "#059669" },
  { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5", short: "Sonnet 5.5", badge: "🧠", color: "#7c3aed" },
  { id: "claude-opus-5-5",   label: "Claude Opus 5.5",   short: "Opus 5.5",   badge: "🏆", color: "#d97706" },
];

// Старые id (могли остаться в localStorage или в коде) переводим на новые
export const AI_MODEL_MAP = {
  "gpt-5": "claude-sonnet-5-5",
  "gemini-2.5-pro": "claude-sonnet-5-5",
  "claude-sonnet-4-20250514": "claude-sonnet-5-5",
  "claude-sonnet-4-5-20250929": "claude-sonnet-5-5",
  "claude-opus-4-6": "claude-opus-5-5",
};

export const resolveModel = (id) => AI_MODEL_MAP[id] || id;