/* =========================================================
   신강/신약 · 용신 · 조후 — 억부(抑扶)·조후 간이 판정.
   ⚠️ 실제 명리의 신강신약·용신은 격국·통근·투간·회합까지 종합해야 정밀하다.
   여기서는 오행 분포·월령·억부를 이용한 '간이 판정(참고용)'이다.
   ========================================================= */

const GEN = { wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood" };      // 아생(식상)
const CTRL = { wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood" };     // 아극(재성)
const RESOURCE = { wood: "water", fire: "wood", earth: "fire", metal: "earth", water: "metal" }; // 생아(인성)
const CTRL_BY = { wood: "metal", fire: "water", earth: "wood", metal: "fire", water: "earth" };  // 극아(관성)

const ELEM_KR = { wood: "목(木)", fire: "화(火)", earth: "토(土)", metal: "금(金)", water: "수(水)" };
const ELEM_TRAIT = { wood: "성장·추진", fire: "표현·열정", earth: "안정·중재", metal: "원칙·결단", water: "사고·유연" };
const ELEM_BRANCHES = { wood: [2, 3], fire: [5, 6], earth: [1, 4, 7, 10], metal: [8, 9], water: [11, 0] };
const ANIMAL = ["쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양", "원숭이", "닭", "개", "돼지"];
// 지지 index(자=0) → 오행
const BRANCH_ELEM = ["water", "earth", "wood", "wood", "earth", "fire", "fire", "earth", "metal", "metal", "earth", "water"];
const animalsOf = (elem) => ELEM_BRANCHES[elem].map((b) => ANIMAL[b] + "띠");

export function analyzeStrength(profile) {
  const dElem = profile.dayMasterElem;
  const counts = profile.elementCounts || {};
  const monthElem = BRANCH_ELEM[profile.pillars.month.branchIdx];

  // 억부: 나를 돕는(인성+비겁) vs 빼가는(식상+재성+관성)
  const support = (counts[dElem] || 0) + (counts[RESOURCE[dElem]] || 0);
  const drain = (counts[GEN[dElem]] || 0) + (counts[CTRL[dElem]] || 0) + (counts[CTRL_BY[dElem]] || 0);

  // 월령(계절) 가중 — 득령이면 크게 강해짐
  const deukryeong = monthElem === dElem || monthElem === RESOURCE[dElem];
  const netSupport = support + (deukryeong ? 2.5 : -2.5);

  let strength;
  if (netSupport >= drain + 1.5) strength = "신강";
  else if (netSupport <= drain - 1.5) strength = "신약";
  else strength = "중화";

  // 용신(억부)
  let yongsin, yongsinDesc;
  if (strength === "신강") {
    yongsin = [CTRL_BY[dElem], CTRL[dElem]]; // 관성·재성으로 눌러줌
    yongsinDesc = "기운이 강한 편이라, 그 힘을 ‘써서 덜어내는’ 오행이 용신입니다.";
  } else if (strength === "신약") {
    yongsin = [RESOURCE[dElem], dElem]; // 인성·비겁으로 도와줌
    yongsinDesc = "기운이 약한 편이라, 나를 ‘돕고 채워주는’ 오행이 용신입니다.";
  } else {
    yongsin = [RESOURCE[dElem]];
    yongsinDesc = "비교적 균형이 잡혀, 계절 보정(조후)과 흐름에 따라 도움 오행이 달라집니다.";
  }

  // 조후(계절 온도)
  const winter = [11, 0, 1], summer = [5, 6, 7];
  const mb = profile.pillars.month.branchIdx;
  let johu = null;
  if (winter.includes(mb)) johu = { element: "fire", note: "겨울에 태어나 사주가 차가운 편 — 따뜻한 화(火) 기운이 조후로 필요합니다." };
  else if (summer.includes(mb)) johu = { element: "water", note: "여름에 태어나 사주가 뜨거운 편 — 시원한 수(水) 기운이 조후로 필요합니다." };
  else johu = { element: null, note: "봄·가을 태생으로 온도는 비교적 무난합니다." };

  // 최종 도움 오행(용신 + 조후) 정리
  const helpful = Array.from(new Set([...yongsin, ...(johu.element ? [johu.element] : [])]));

  return {
    strength, deukryeong, support, drain,
    dayElem: dElem, dayElemKr: ELEM_KR[dElem],
    yongsin, yongsinKr: yongsin.map((e) => ELEM_KR[e]), yongsinDesc,
    yongsinAnimals: yongsin.flatMap(animalsOf),
    johu,
    helpful, helpfulKr: helpful.map((e) => ELEM_KR[e]),
    helpfulAnimals: helpful.flatMap(animalsOf),
    summary: buildSummary(strength, dElem, yongsin, johu),
    apply: buildApply(strength, yongsin, johu),
  };
}

function buildSummary(strength, dElem, yongsin, johu) {
  const s = {
    신강: `일간(${ELEM_KR[dElem]})의 기운이 강한 편이에요. 주체성·추진력이 강점이지만, 넘칠 땐 고집·독주로 흐르기 쉬워요.`,
    신약: `일간(${ELEM_KR[dElem]})의 기운이 약한 편이에요. 섬세하고 협조적이지만, 혼자 밀어붙이면 쉽게 지쳐요. 도움과 환경이 중요합니다.`,
    중화: `일간(${ELEM_KR[dElem]})의 기운이 비교적 균형 잡혀 있어요. 상황 적응력이 좋은 편입니다.`,
  }[strength];
  return `${s} 당신에게 힘이 되는 용신은 ${yongsin.map((e) => ELEM_KR[e]).join("·")}${johu.element ? `, 조후로는 ${ELEM_KR[johu.element]}` : ""} 기운이에요.`;
}

function buildApply(strength, yongsin, johu) {
  const yk = yongsin.map((e) => ELEM_TRAIT[e]).join("·");
  const lines = [];
  lines.push(`용신 오행(${yongsin.map((e) => ELEM_KR[e]).join("·")}, ‘${yk}’의 기운)이 강한 시기·사람·환경에서 일이 잘 풀리는 편이에요.`);
  if (strength === "신강") lines.push("에너지가 넘치니, 혼자 다 하기보다 성과로 ‘써서’ 풀고 사람과 나누면 균형이 잡혀요.");
  if (strength === "신약") lines.push("무리하게 혼자 감당하기보다, 도와줄 사람·안정된 환경을 곁에 두는 게 핵심이에요.");
  if (johu.element) lines.push(johu.note);
  return lines;
}

export { ELEM_KR as STRENGTH_ELEM_KR };
