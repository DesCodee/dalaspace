// Anthropic API configuration
// Set VITE_ANTHROPIC_KEY in your .env file or Vercel Environment Variables
export const API_KEY = import.meta.env.VITE_ANTHROPIC_KEY || "";

export const AI_MODELS = [
  { id: "claude-sonnet-4-20250514",   label: "Claude Sonnet 4",   short: "Sonnet 4",   badge: "⚡", color: "#059669" },
  { id: "claude-sonnet-4-5-20250929", label: "Claude Sonnet 4.5", short: "Sonnet 4.5", badge: "🧠", color: "#7c3aed" },
  { id: "claude-opus-4-6",            label: "Claude Opus 4.6",   short: "Opus 4.6",   badge: "🏆", color: "#d97706" },
];

export const AI_MODEL_MAP = {
  "gpt-5": "claude-sonnet-4-5-20250929",
  "gemini-2.5-pro": "claude-sonnet-4-5-20250929",
};

export const resolveModel = (id) => AI_MODEL_MAP[id] || id;
