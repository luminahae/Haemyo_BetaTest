/* =========================================================
   궁합 분석 — 두 사람의 사주(일간 오행 + 오행 분포)로 '성향 조화도'를 본다.
   원칙: 운명적 길흉 판정이 아니라, 두 사람의 성향이 어떻게 맞물리고
   어디서 부딪히는지 현실적으로 설명한다. 좋은 관계에도 마찰 지점을,
   자극적인(극) 관계에도 강점을 함께 제시한다.
   ========================================================= */

import { harmonyBetween } from "./relationship.js";

const GEN = { wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood" }; // X가 생하는 것
const CTRL = { wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood" }; // X가 극하는 것
const ELEM_KR = { wood: "목(木)", fire: "화(火)", earth: "토(土)", metal: "금(金)", water: "수(水)" };
const ELEM_TRAIT = { wood: "성장·추진", fire: "표현·열정", earth: "안정·포용", metal: "원칙·결단", water: "사고·유연" };

/** 받침 여부 */
function hasBatchim(name) {
  if (!name) return false;
  const c = name.charCodeAt(name.length - 1);
  if (c < 0xac00 || c > 0xd7a3) return false; // 한글 음절 아니면 false
  return (c - 0xac00) % 28 !== 0;
}
/** 이름 뒤 조사를 받침에 맞게 교정 (정확히 이름+조사 경계만) */
function fixParticles(text, name) {
  if (!name) return text;
  const b = hasBatchim(name);
  const pairs = b
    ? [["가", "이"], ["를", "을"], ["는", "은"], ["와", "과"]]
    : [["이", "가"], ["을", "를"], ["은", "는"], ["과", "와"]];
  let out = text;
  for (const [wrong, right] of pairs) {
    out = out.split(name + wrong).join(name + right);
  }
  return out;
}
function fixAll(content, labels) {
  const fix = (s) => fixParticles(fixParticles(s, labels.a), labels.b);
  const fixArr = (arr) => arr.map(fix);
  return {
    title: fix(content.title), summary: fix(content.summary),
    good: fixArr(content.good), friction: fixArr(content.friction), advice: fixArr(content.advice),
  };
}

export function analyzeCompat(a, b, labels = { a: "A", b: "B" }) {
  const ea = a.dayMasterElem, eb = b.dayMasterElem;
  const rel = relationType(ea, eb);
  const content = fixAll(RELATION[rel.type](labels, ea, eb, rel), labels);
  const harmony = harmonyBetween(a, b, labels); // 합·충 궁합

  // 오행 보완도: 두 명식의 오행을 합쳐 얼마나 고르게 채워지는지
  const combined = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  for (const k of Object.keys(combined)) combined[k] = (a.elementCounts[k] || 0) + (b.elementCounts[k] || 0);
  const vals = Object.values(combined);
  const mean = vals.reduce((x, y) => x + y, 0) / 5;
  const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / 5;
  const missing = Object.entries(combined).filter(([, v]) => v === 0).map(([k]) => ELEM_KR[k]);
  const balanceScore = Math.max(0, 100 - variance * 9); // 고를수록 높음

  // 보완: 한쪽의 약한 오행을 다른 쪽이 채워주는가
  const compNote = complementNote(a, b, labels);

  // 성향 조화 강도(운명 판정 아님)
  let score = Math.round(rel.base * 0.62 + balanceScore * 0.38 + compNote.bonus);
  score = Math.max(38, Math.min(93, score));

  return {
    type: rel.type,
    aElem: ea, bElem: eb,
    aElemKr: ELEM_KR[ea], bElemKr: ELEM_KR[eb],
    score,
    title: content.title,
    summary: content.summary,
    good: content.good,
    friction: content.friction,
    advice: content.advice,
    combined, missing,
    complement: fixParticles(fixParticles(compNote.text, labels.a), labels.b),
    dayMasters: { a: a.dayMaster, b: b.dayMaster },
    harmony,
  };
}

function relationType(ea, eb) {
  if (ea === eb) return { type: "same", base: 74 };
  if (GEN[ea] === eb) return { type: "a_gen_b", base: 84 };
  if (GEN[eb] === ea) return { type: "b_gen_a", base: 84 };
  if (CTRL[ea] === eb) return { type: "a_ctrl_b", base: 62 };
  if (CTRL[eb] === ea) return { type: "b_ctrl_a", base: 62 };
  return { type: "same", base: 70 };
}

function complementNote(a, b, L) {
  const weakA = Object.entries(a.elementCounts).sort((x, y) => x[1] - y[1])[0];
  const weakB = Object.entries(b.elementCounts).sort((x, y) => x[1] - y[1])[0];
  const strongOtherForA = (b.elementCounts[weakA[0]] || 0) >= 2;
  const strongOtherForB = (a.elementCounts[weakB[0]] || 0) >= 2;
  let bonus = 0;
  const parts = [];
  if (strongOtherForA) { bonus += 3; parts.push(`${L.a}에게 부족한 ${ELEM_KR[weakA[0]]} 기운을 ${L.b}가 넉넉히 지녀 서로를 채워줍니다.`); }
  if (strongOtherForB) { bonus += 3; parts.push(`${L.b}에게 부족한 ${ELEM_KR[weakB[0]]} 기운을 ${L.a}가 보완해 줍니다.`); }
  if (!parts.length) parts.push("두 사람은 비슷한 오행 구성을 가져, 잘 통하는 만큼 같은 부분에서 함께 약해질 수 있습니다.");
  return { bonus, text: parts.join(" ") };
}

/* 관계 유형별 서술 (균형 잡힌 톤) */
const RELATION = {
  same: (L, ea) => ({
    title: "닮은 결 — 비화(比和) 관계",
    summary: `두 사람 모두 ${ELEM_KR[ea]}(${ELEM_TRAIT[ea]}) 기운이 중심이라, 말이 잘 통하고 가치관이 비슷합니다. 편안한 만큼, 닮은 단점이 함께 커지는 관계이기도 합니다.`,
    good: [
      "감정과 속도의 결이 비슷해, 설명하지 않아도 통하는 편안함이 있습니다.",
      "같은 것을 중요하게 여겨, 큰 방향에서 부딪힐 일이 적습니다.",
    ],
    friction: [
      "둘 다 잘하는 영역이 겹쳐, 정작 서로 채워줘야 할 부분이 비게 됩니다.",
      "같은 약점을 공유해, 한 사람이 무너질 때 함께 흔들리기 쉽습니다.",
      "비슷해서 경쟁심이 생기거나, ‘내가 맞다’로 부딪힐 수 있습니다.",
    ],
    advice: [
      "역할을 일부러 나누세요. 둘 다 피하는 일을 누가 맡을지 미리 정해 두면 좋습니다.",
      "닮은 점보다 서로 다른 점을 대화 주제로 삼아 관계에 폭을 더하세요.",
    ],
  }),
  a_gen_b: (L, ea, eb) => ({
    title: `${L.a}가 ${L.b}를 북돋는 — 상생(相生) 관계`,
    summary: `${L.a}의 ${ELEM_KR[ea]} 기운이 ${L.b}의 ${ELEM_KR[eb]} 기운을 살려주는 흐름입니다. ${L.a}가 먼저 베풀고 ${L.b}가 피어나는, 자연스러운 지지 관계입니다.`,
    good: [
      `${L.a}는 ${L.b}의 가능성을 끌어내고, ${L.b}는 그 지지 속에서 편안하게 자기 색을 냅니다.`,
      "한쪽이 방향을 주고 한쪽이 실현하는, 역할이 잘 맞물리는 조합입니다.",
    ],
    friction: [
      `베풂이 한쪽으로만 흐르면, ${L.a}가 ‘나만 준다’고 느껴 지칠 수 있습니다.`,
      `${L.b}가 지지에 익숙해져 스스로 결정하기를 미룰 수 있습니다.`,
    ],
    advice: [
      `${L.b}도 ${L.a}에게 돌려주는 방식을 찾으세요. 고마움을 말로 표현하는 것부터가 균형의 시작입니다.`,
      `${L.a}는 다 챙기려 하지 말고, ${L.b}가 스스로 할 몫을 남겨 두세요.`,
    ],
  }),
  b_gen_a: (L, ea, eb) => ({
    title: `${L.b}가 ${L.a}를 북돋는 — 상생(相生) 관계`,
    summary: `${L.b}의 ${ELEM_KR[eb]} 기운이 ${L.a}의 ${ELEM_KR[ea]} 기운을 살려주는 흐름입니다. ${L.b}가 먼저 베풀고 ${L.a}가 피어나는 지지 관계입니다.`,
    good: [
      `${L.b}는 ${L.a}의 가능성을 끌어내고, ${L.a}는 그 안에서 편안하게 자기 색을 냅니다.`,
      "한쪽이 힘을 주고 한쪽이 실현하는, 서로 기대기 좋은 조합입니다.",
    ],
    friction: [
      `${L.b}가 ‘나만 베푼다’고 느끼면 서운함이 쌓일 수 있습니다.`,
      `${L.a}가 받는 데 익숙해져 스스로 결정을 미룰 수 있습니다.`,
    ],
    advice: [
      `${L.a}도 ${L.b}에게 돌려주는 방식을 찾으세요. 표현과 인정이 균형의 시작입니다.`,
      `${L.b}는 다 짊어지지 말고, ${L.a}의 몫을 남겨 두세요.`,
    ],
  }),
  a_ctrl_b: (L, ea, eb) => ({
    title: `자극과 긴장이 있는 — 상극(相剋) 관계`,
    summary: `${L.a}의 ${ELEM_KR[ea]} 기운이 ${L.b}의 ${ELEM_KR[eb]} 기운을 누르는 흐름입니다. 극(剋)은 나쁜 것이 아니라 서로를 다듬는 자극입니다. 잘 쓰면 성장, 못 쓰면 소모가 됩니다.`,
    good: [
      `${L.a}는 ${L.b}가 흐트러질 때 기준을 잡아주고, 긴장감이 관계에 생기를 줍니다.`,
      "서로 다르기에, 상대에게서 자신에게 없는 것을 배울 수 있습니다.",
    ],
    friction: [
      `${L.a}의 방식이 강해지면 ${L.b}가 눌린다고 느껴 위축되거나 반발할 수 있습니다.`,
      "옳고 그름을 가리다 감정이 상하기 쉽고, 사소한 일이 기싸움이 됩니다.",
    ],
    advice: [
      `${L.a}는 바로잡기 전에 ${L.b}의 입장을 먼저 인정하는 한마디를 붙이세요.`,
      "서로의 방식이 ‘틀린 것’이 아니라 ‘다른 것’임을 전제로 대화하세요.",
    ],
  }),
  b_ctrl_a: (L, ea, eb) => ({
    title: `자극과 긴장이 있는 — 상극(相剋) 관계`,
    summary: `${L.b}의 ${ELEM_KR[eb]} 기운이 ${L.a}의 ${ELEM_KR[ea]} 기운을 누르는 흐름입니다. 극(剋)은 서로를 다듬는 자극입니다. 잘 쓰면 성장, 못 쓰면 소모가 됩니다.`,
    good: [
      `${L.b}는 ${L.a}가 흐트러질 때 중심을 잡아주고, 적당한 긴장이 관계에 활력을 줍니다.`,
      "다른 방식을 가진 만큼, 서로에게서 부족한 면을 배울 수 있습니다.",
    ],
    friction: [
      `${L.b}의 방식이 강해지면 ${L.a}가 눌린다고 느껴 위축되거나 반발할 수 있습니다.`,
      "누가 맞는지 따지다 감정이 상하고, 작은 일이 기싸움으로 번질 수 있습니다.",
    ],
    advice: [
      `${L.b}는 지적보다 인정을 먼저 건네세요. 상대가 방어를 풀어야 대화가 됩니다.`,
      "서로의 차이를 우열이 아니라 역할 분담으로 바꿔 보세요.",
    ],
  }),
};
