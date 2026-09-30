/* =========================================================
   귀인 체크 — "이 사람이 나에게 귀인/악연인가?"
   내 용신·천을귀인·오행 관계 + 두 사람의 합·충으로 '귀인 지수'를 낸다.
   재미·자기이해용 참고. 사람을 편 가르는 용도가 아님.
   ========================================================= */

import { analyzeStrength } from "./strength.js";

const CTRL = { wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood" };
const RESOURCE = { wood: "water", fire: "wood", earth: "fire", metal: "earth", water: "metal" };
const CTRL_BY = { wood: "metal", fire: "water", earth: "wood", metal: "fire", water: "earth" };
const ELEM_KR = { wood: "목(木)", fire: "화(火)", earth: "토(土)", metal: "금(金)", water: "수(水)" };

// 천을귀인: 일간 index → 지지
const CHEONEUL = { 0: [1, 7], 4: [1, 7], 6: [1, 7], 1: [0, 8], 5: [0, 8], 2: [11, 9], 3: [11, 9], 7: [2, 6], 8: [5, 3], 9: [5, 3] };
const HAP6 = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]];
const SAMHAP = [[8, 0, 4], [2, 6, 10], [5, 9, 1], [11, 3, 7]];
const HYEONG = [[2, 5, 8], [1, 10, 7], [0, 3]];
const SELF_HYEONG = [4, 6, 9, 11];
const HAE = [[0, 7], [1, 6], [2, 5], [3, 4], [8, 11], [9, 10]];
const inPair = (list, a, b) => list.some((p) => (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a));
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

function classifyBranch(a, b) {
  if (a === b) return SELF_HYEONG.includes(a) ? "자형" : "동일";
  if (Math.abs(a - b) === 6) return "충";
  if (inPair(HAP6, a, b)) return "육합";
  if (SAMHAP.some((g) => g.includes(a) && g.includes(b))) return "삼합";
  if (HYEONG.some((g) => g.includes(a) && g.includes(b))) return "형";
  if (inPair(HAE, a, b)) return "해";
  return "무관";
}

export function benefactorCheck(me, other, labels = { me: "나", other: "상대" }) {
  const s = analyzeStrength(me);
  const myElem = me.dayMasterElem, theirElem = other.dayMasterElem;
  const yong = s.yongsin;
  const guiElem = RESOURCE[myElem], foeElem = CTRL_BY[myElem];

  let score = 50;
  const pros = [], cons = [];

  // 1) 상대 오행 vs 내 용신/인성/관성
  if (yong.includes(theirElem)) { score += 22; pros.push(`상대의 ${ELEM_KR[theirElem]} 기운이 당신의 용신(가장 힘이 되는 기운)이에요. 곁에 있으면 실제로 힘이 됩니다.`); }
  else if (theirElem === guiElem) { score += 15; pros.push(`상대의 ${ELEM_KR[theirElem]} 기운이 당신을 돕는 인성이라, 배움·안정·정서적 지지를 줍니다.`); }
  else if (theirElem === myElem) { score += 6; pros.push(`같은 ${ELEM_KR[myElem]} 기운이라 말이 잘 통하지만, 닮은 만큼 경쟁이나 같은 약점을 공유하기도 해요.`); }
  if (theirElem === foeElem) { score -= 18; cons.push(`상대의 ${ELEM_KR[theirElem]} 기운은 당신을 누르는 관성이라, 함께 있으면 은근한 압박·소모가 되기 쉬워요.`); }

  // 2) 천간합 (일간)
  if (Math.abs(me.pillars.day.stemIdx - other.pillars.day.stemIdx) === 5) {
    score += 12; pros.push("두 사람의 일간이 천간합을 이뤄, 자연스럽게 끌리고 서로를 붙잡아 주는 인연이에요.");
  }

  // 3) 일지(배우자궁) 관계
  const rel = classifyBranch(me.pillars.day.branchIdx, other.pillars.day.branchIdx);
  if (rel === "육합" || rel === "삼합") { score += 12; pros.push(`일지가 ‘${rel}’이라 실제 생활에서 잘 맞고 편안한 사이예요.`); }
  else if (rel === "충") { score -= 10; cons.push("일지가 ‘충’이라 강하게 끌리지만 부딪힘도 커요. 가까울수록 거리 조절이 필요합니다."); }
  else if (rel === "형" || rel === "해" || rel === "자형") { score -= 6; cons.push(`일지가 ‘${rel}’이라 서로 예민한 지점을 건드리기 쉬워요.`); }

  // 4) 천을귀인 — 상대 띠가 내 천을귀인?
  const myCheon = CHEONEUL[me.pillars.day.stemIdx] || [];
  const theirBranches = [other.pillars.year.branchIdx, other.pillars.day.branchIdx];
  if (theirBranches.some((b) => myCheon.includes(b))) {
    score += 16; pros.push("상대의 띠가 당신의 천을귀인(天乙貴人)에 해당해요 — 결정적인 순간에 돕는 귀인 인연입니다.");
  }

  score = clamp(Math.round(score), 5, 98);
  let verdict, emoji = "";
  if (score >= 72) { verdict = "귀인"; }
  else if (score >= 58) { verdict = "좋은 인연"; }
  else if (score >= 44) { verdict = "무난한 사이"; }
  else { verdict = "조심할 인연"; }

  if (!pros.length) pros.push("특별히 강한 인연의 기운은 없지만, 그만큼 서로 노력한 만큼 관계가 만들어져요.");
  if (!cons.length) cons.push("큰 충돌 요소는 적어요. 편하게 지내기 좋은 사이예요.");

  return {
    verdict, emoji, score,
    myElemKr: ELEM_KR[myElem], theirElemKr: ELEM_KR[theirElem],
    dayMasters: { me: me.pillars.day.stem, other: other.pillars.day.stem },
    yongsinKr: yong.map((e) => ELEM_KR[e]),
    pros, cons,
    summary: `${labels.other}은(는) 당신에게 ‘${verdict}’ — 귀인 지수 ${score}점.`,
    advice: verdict === "귀인" || verdict === "좋은 인연"
      ? "곁에 두면 힘이 되는 인연이에요. 먼저 다가가고 관계를 소중히 가꿔 보세요."
      : verdict === "무난한 사이"
        ? "무난한 사이예요. 기대보다 노력이 관계를 만들어요."
        : "자극이 큰 인연이에요. 거리와 대화 방식을 정리하면 배울 점도 많아요. ‘무조건 나쁜 사람’은 아니에요.",
  };
}
