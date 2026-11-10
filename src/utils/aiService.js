import { API_KEY, resolveModel } from "../constants/config";
import { generateSimulatedAIAnalysis, generateSmartChatReply } from "./aiFallback";

export const ANTHROPIC_KEY = API_KEY;
export const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY || "";

// true = только Claude, без Gemini и без симуляции
const CLAUDE_ONLY = true;
const CLAUDE_MODEL = "claude-sonnet-5-5";

// Общий вызов Claude. При любой проблеме кидает ошибку с понятным текстом
async function callClaude({ model = CLAUDE_MODEL, system, messages, maxTokens = 1000 }) {
  if (!ANTHROPIC_KEY) {
    throw new Error("Нет ключа Anthropic: проверь API_KEY в constants/config и .env");
  }

  const body = { model, max_tokens: maxTokens, messages };
  if (system) body.system = system;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(`Claude API ${res.status}: ${json.error?.message || "неизвестная ошибка"}`);
  }

  const text = (json.content || [])
    .filter(b => b.type === "text")
    .map(b => b.text)
    .join("\n");

  if (!text) throw new Error("Claude вернул пустой ответ");
  console.info("Ответ от модели:", json.model);
  return text;
}

// Достаёт JSON из ответа, даже если вокруг есть лишний текст
function extractJson(text) {
  const clean = text.replace(/```json|```/g, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("В ответе нет JSON: " + clean.slice(0, 200));
  return JSON.parse(clean.slice(start, end + 1));
}

// Claude не принимает роль system внутри messages и требует, чтобы первым был user
function cleanHistory(history) {
  const msgs = history
    .filter(m => m.role === "user" || m.role === "assistant")
    .map(m => ({ role: m.role, content: m.content }));
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  return msgs;
}

export async function analyzeFieldImage({ b64, mimeType = "image/jpeg", coordInfo = "", lang = "ru", bounds = null, hectares = null }) {
  const promptText = `Ты — агроаналитик DalaSpace. Проанализируй снимок земельного участка.${coordInfo}
Ответь СТРОГО в формате валидного JSON без markdown и без тройных кавычек:
{
  "land_type": "Пашня / Пастбище / Залежь / Заброшенный участок",
  "status": "active",
  "ndvi_estimate": 0.55,
  "moisture_estimate": 0.24,
  "vegetation_cover": 70,
  "erosion_risk": "low",
  "soil_condition": "описание почвы",
  "crops_detected": "культуры или их отсутствие",
  "problems": ["проблема 1", "проблема 2"],
  "recommendations": ["совет 1", "совет 2"],
  "recovery_potential": 85,
  "summary": "краткий вывод 2-3 предложения",
  "season_estimate": "сезон",
  "irrigation_needed": false,
  "usability_score": 80
}`;

  try {
    const text = await callClaude({
      maxTokens: 1500,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mimeType, data: b64 } },
          { type: "text", text: promptText },
        ],
      }],
    });
    return extractJson(text);
  } catch (e) {
    console.error("Claude (анализ снимка):", e.message);
    if (CLAUDE_ONLY) throw e;
  }

  if (GEMINI_KEY) {
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
      const res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ inlineData: { mimeType, data: b64 } }, { text: promptText }] }],
        }),
      });
      const json = await res.json();
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) return extractJson(rawText);
    } catch (e) {
      console.warn("Gemini fallback error:", e.message);
    }
  }

  return generateSimulatedAIAnalysis(bounds, hectares, lang);
}

export async function askAiAssistant({ text, history = [], systemPrompt = "", aiModel = CLAUDE_MODEL, selected = null, data = {}, lang = "ru" }) {
  try {
    const reply = await callClaude({
      model: resolveModel(aiModel) || CLAUDE_MODEL,
      system: systemPrompt,
      messages: cleanHistory(history),
      maxTokens: 800,
    });
    return reply.replace(/\*\*/g, "").replace(/\*/g, "");
  } catch (e) {
    console.error("Claude (чат):", e.message);
    if (CLAUDE_ONLY) throw e;
  }

  if (GEMINI_KEY) {
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
      const res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: history.map(m => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
        }),
      });
      const json = await res.json();
      const reply = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply) return reply.replace(/\*\*/g, "").replace(/\*/g, "");
    } catch (e) {
      console.warn("Gemini chat fallback error:", e.message);
    }
  }

  return generateSmartChatReply(text, selected, data, lang);
}