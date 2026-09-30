/* =========================================================
   AI 대화형 상담 — 사용자의 실제 명식을 근거로 자유 질문에 답한다.
   정적 앱이므로 백엔드 없이, 사용자가 입력한 API 키로 브라우저에서
   직접 LLM(Anthropic / OpenAI)을 호출한다.
   ⚠️ API 키는 이 브라우저(localStorage)에만 저장된다. 공용 기기 금지.
   사용료는 사용자 본인 키로 청구된다.
   ========================================================= */

import { analyzeStrength } from "./strength.js";
import { daeunTimeline, ageFromSolar } from "./fortune.js";

const AI_KEY = "str.ai.v1";

function safeParse(raw, fb) { try { return raw ? JSON.parse(raw) : fb; } catch { return fb; } }
export function getAIConfig() { return safeParse(localStorage.getItem(AI_KEY), null); }
export function setAIConfig(cfg) { localStorage.setItem(AI_KEY, JSON.stringify(cfg)); }
export function clearAIConfig() { localStorage.removeItem(AI_KEY); }
export function isAIConfigured() { const c = getAIConfig(); return !!(c && c.apiKey); }

const SYSTEM_PROMPT =
`당신은 30년 경력의 따뜻하고 현실적인 한국의 사주·명리 상담가입니다.
아래에 주어진 사용자의 '실제 사주 명식'을 근거로만 해석하세요. 명식에 없는 사실을 지어내지 마세요.
답변 원칙:
- 좋은 말만 늘어놓지 말고, 강점과 함께 조심할 점·현실적 갈등도 구체적으로 짚으세요.
- 막연한 표현 대신 실제 상황·행동 사례로 설명하세요.
- 미래의 사건을 확정적으로 예언하거나 공포·불안을 조장하지 마세요. '가능성이 커지는 흐름'과 그때의 현실적 대응으로 말하세요.
- 의료·법률·투자·결혼 등 중대한 결정은 실제 정보와 전문가 조언을 함께 검토하라고 안내하세요.
- 한국어로, 친근하지만 신뢰감 있게. 너무 길지 않게 핵심 위주로.`;

/** 명식을 텍스트 컨텍스트로 */
export function buildChartContext(profile, input) {
  const p = profile.pillars;
  const s = analyzeStrength(profile);
  const today = new Date();
  const age = profile.solar ? ageFromSolar(profile.solar, today) : null;
  const daeun = daeunTimeline(profile, age).find((d) => d.isCurrent);
  const el = profile.elements;
  const lines = [
    `- 성별: ${input.gender === "male" ? "남성" : "여성"}`,
    `- 생년월일: 양력 ${profile.solar ? `${profile.solar.Y}-${profile.solar.M}-${profile.solar.D}` : input.birthDate}${profile.lunar ? ` (음력 ${profile.lunar.year}.${profile.lunar.month}.${profile.lunar.day}${profile.lunar.isLeap ? "윤" : ""})` : ""}${input.timeUnknown ? " · 출생시간 모름(시주 제외)" : ` · ${input.birthTime}`}`,
    `- 사주 명식(팔자): 년주 ${p.year.hanja}, 월주 ${p.month.hanja}, 일주 ${p.day.hanja}${p.hour ? `, 시주 ${p.hour.hanja}` : " (시주 없음)"}`,
    `- 일간(나): ${p.day.stem}(${p.day.hanja[0]}), 오행 ${profile.dayMasterElem}`,
    `- 오행 분포(%): 목 ${el.wood}, 화 ${el.fire}, 토 ${el.earth}, 금 ${el.metal}, 수 ${el.water}`,
    `- 신강/신약(간이): ${s.strength}, 용신 ${s.yongsinKr.join("·")}${s.johu.element ? `, 조후 ${s.johu.element}` : ""}`,
    daeun ? `- 현재 대운: ${daeun.hanja} (${daeun.tenGod}, ${daeun.ageStart}~${daeun.ageEnd}세)` : null,
    age != null ? `- 현재 만나이: ${age}세` : null,
    `- 계산 방식: 절기·삭을 천문 계산한 실제 만세력. 신강신약은 억부·조후 간이 판정.`,
  ].filter(Boolean);
  return lines.join("\n");
}

/** SSE 스트림 파서(fetch 응답) → onToken(text) */
async function readSSE(res, onEvent) {
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const chunks = buf.split("\n\n");
    buf = chunks.pop();
    for (const chunk of chunks) {
      const line = chunk.split("\n").find((l) => l.startsWith("data:"));
      if (!line) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") return;
      try { onEvent(JSON.parse(data)); } catch { /* ignore */ }
    }
  }
}

/**
 * 스트리밍 채팅. messages: [{role:'user'|'assistant', content}]
 * onToken(text) 호출. 반환: 전체 텍스트.
 */
export async function streamChat({ messages, profile, input, onToken, signal }) {
  const cfg = getAIConfig();
  if (!cfg || !cfg.apiKey) throw new Error("AI가 설정되지 않았습니다.");
  const system = SYSTEM_PROMPT + "\n\n[사용자 명식]\n" + buildChartContext(profile, input);
  let full = "";

  if (cfg.provider === "openai") {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", signal,
      headers: { "content-type": "application/json", authorization: "Bearer " + cfg.apiKey },
      body: JSON.stringify({
        model: cfg.model || "gpt-4o-mini", stream: true,
        messages: [{ role: "system", content: system }, ...messages],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI 오류 ${res.status}: ${(await res.text()).slice(0, 200)}`);
    await readSSE(res, (ev) => {
      const t = ev.choices && ev.choices[0] && ev.choices[0].delta && ev.choices[0].delta.content;
      if (t) { full += t; onToken(t); }
    });
  } else {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", signal,
      headers: {
        "content-type": "application/json", "x-api-key": cfg.apiKey,
        "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: cfg.model || "claude-3-5-haiku-latest", max_tokens: 1200, stream: true,
        system, messages,
      }),
    });
    if (!res.ok) throw new Error(`Anthropic 오류 ${res.status}: ${(await res.text()).slice(0, 200)}`);
    await readSSE(res, (ev) => {
      if (ev.type === "content_block_delta" && ev.delta && ev.delta.text) {
        full += ev.delta.text; onToken(ev.delta.text);
      }
    });
  }
  return full;
}
