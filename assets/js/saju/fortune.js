/* =========================================================
   운의 흐름 — 대운(10년) 타임라인 + 세운(연간) 미래 흐름.
   십신(十神)으로 각 시기의 테마를 뽑는다.
   원칙: 확정적 예언·공포 유발 금지. '가능성이 커지는 흐름'과
   그때 취할 수 있는 행동으로 서술한다. (믿거나 말거나, 참고용)
   ========================================================= */

import { computeSaju } from "./manse.js";

const STEM_ELEM = ["wood", "wood", "fire", "fire", "earth", "earth", "metal", "metal", "water", "water"];
const STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
const STEM_H = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const BRANCH_H = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

const GEN = { wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood" };
const CTRL = { wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood" };
// 나를 생하는 오행(인성=귀인), 나를 극하는 오행(관성=조심)
const RESOURCE = { wood: "water", fire: "wood", earth: "fire", metal: "earth", water: "metal" };
const CTRL_BY = { wood: "metal", fire: "water", earth: "wood", metal: "fire", water: "earth" };

const ELEM_KR = { wood: "목(木)", fire: "화(火)", earth: "토(土)", metal: "금(金)", water: "수(水)" };
const ELEM_COLOR = { wood: "초록", fire: "빨강", earth: "노랑·베이지", metal: "흰색·골드", water: "검정·파랑" };
const ELEM_BRANCHES = { wood: [2, 3], fire: [5, 6], earth: [1, 4, 7, 10], metal: [8, 9], water: [11, 0] };
const ANIMAL = ["쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양", "원숭이", "닭", "개", "돼지"];
const branchAnimals = (elem) => ELEM_BRANCHES[elem].map((b) => ANIMAL[b] + "띠");
// 천을귀인(天乙貴人): 일간 → 귀인 지지(띠)
const CHEONEUL = {
  0: [1, 7], 4: [1, 7], 6: [1, 7], // 甲戊庚 → 丑未
  1: [0, 8], 5: [0, 8],            // 乙己 → 子申
  2: [11, 9], 3: [11, 9],          // 丙丁 → 亥酉
  7: [2, 6],                       // 辛 → 寅午
  8: [5, 3], 9: [5, 3],            // 壬癸 → 巳卯
};

// 지장간 정기(지지 대표 천간) · 십이운성 · 12신살 (세운/대운 상세용)
const JIJANG_MAIN = [9, 5, 0, 1, 4, 2, 3, 5, 6, 7, 4, 8]; // 자..해 정기 stem
const CHANGSAENG = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3];
const STAGES12 = ["장생", "목욕", "관대", "건록", "제왕", "쇠", "병", "사", "묘", "절", "태", "양"];
const WANGJI = { 8: 0, 0: 0, 4: 0, 2: 6, 6: 6, 10: 6, 11: 3, 3: 3, 7: 3, 5: 9, 9: 9, 1: 9 };
const SINSAL12 = ["겁살", "재살", "천살", "지살", "도화살", "월살", "망신살", "장성살", "반안살", "역마살", "육해살", "화개살"];
const modN = (n, m) => ((n % m) + m) % m;
function stageOf(dayStem, branch) { const dir = dayStem % 2 === 0 ? 1 : -1; return STAGES12[modN((branch - CHANGSAENG[dayStem]) * dir, 12)]; }
function sinsalOf(base, target) { return SINSAL12[modN(target - modN(WANGJI[base] + 5, 12), 12)]; }
/** 세운/대운 한 칸의 상세 부가정보 (지지god·십이운성·신살·귀인) */
function pillarDetail(profile, s, b) {
  const dIdx = profile.pillars.day.stemIdx;
  const yB = profile.pillars.year ? profile.pillars.year.branchIdx : null;
  const dB = profile.pillars.day ? profile.pillars.day.branchIdx : null;
  const sinsal = [];
  if (yB != null) sinsal.push(sinsalOf(yB, b));
  if (dB != null) sinsal.push(sinsalOf(dB, b));
  const gu = (CHEONEUL[dIdx] || []).includes(b);
  return {
    branchGod: tenGod(dIdx, JIJANG_MAIN[b]),
    stage: stageOf(dIdx, b),
    sinsal: sinsal.filter((v, i, a) => a.indexOf(v) === i),
    guiin: gu,
  };
}

/** 일간 대비 대상 천간의 십신 */
export function tenGod(dayStemIdx, targetStemIdx) {
  const eD = STEM_ELEM[dayStemIdx], eT = STEM_ELEM[targetStemIdx];
  const same = (dayStemIdx % 2) === (targetStemIdx % 2);
  if (eT === eD) return same ? "비견" : "겁재";
  if (GEN[eD] === eT) return same ? "식신" : "상관";
  if (CTRL[eD] === eT) return same ? "편재" : "정재";
  if (CTRL[eT] === eD) return same ? "편관" : "정관";
  return same ? "편인" : "정인"; // GEN[eT] === eD
}

const GROUP = {
  비견: "비겁", 겁재: "비겁", 식신: "식상", 상관: "식상",
  정재: "재성", 편재: "재성", 정관: "관성", 편관: "관성", 정인: "인성", 편인: "인성",
};

// 십신 그룹별 시기 테마 (믿거나 말거나 톤, 공포 없음)
const THEME = {
  비겁: {
    label: "주체·경쟁·동료의 시기",
    line: "스스로 밀고 나가는 힘이 커집니다. 독립·창업·동료와의 협업에 어울리지만, 지출과 경쟁·의견 충돌도 늘 수 있어요.",
    do: "내 것을 지키되 필요한 곳엔 나누고, 큰 지출은 한 번 더 점검하세요.",
  },
  식상: {
    label: "표현·재능·활동의 시기",
    line: "하고 싶은 것을 펼치고 결과물을 내기 좋은 흐름입니다. 창작·이직·새 시도에 유리하지만, 말과 행동이 과하면 구설에 오를 수 있어요.",
    do: "재능을 구체적인 결과로 남기고, 감정적인 말은 한 박자 눌러서.",
  },
  재성: {
    label: "현실·재물의 시기",
    line: "돈과 실속, 새로운 인연에 기회가 열리기 쉽습니다. 다만 벌이는 만큼 관리가 중요하고, 욕심이 과하면 탈이 날 수 있어요.",
    do: "기회는 잡되 감당 가능한 규모로, 수입만큼 관리 시스템을 만드세요.",
  },
  관성: {
    label: "책임·명예·규율의 시기",
    line: "승진·인정·중요한 역할이 들어오기 쉬운 흐름입니다. 그만큼 압박과 스트레스도 함께 오니, 무게를 혼자 다 지지 않는 게 관건이에요.",
    do: "맡는 역할의 범위를 분명히 하고, 책임은 나눠 지세요.",
  },
  인성: {
    label: "배움·안정·후원의 시기",
    line: "공부·자격·문서·귀인의 도움이 따르기 쉬운 흐름입니다. 대신 추진력이 느슨해질 수 있으니, 배운 것에 실행을 붙이는 게 중요해요.",
    do: "배움과 휴식을 챙기되, 미루는 습관은 경계하세요.",
  },
};

/** 대운 타임라인 (현재 대운 표시) */
export function daeunTimeline(profile, currentAge) {
  const dIdx = profile.pillars.day.stemIdx;
  const list = (profile.daeun && profile.daeun.list) || [];
  return list.map((d, i) => {
    const sIdx = d.stemIdx != null ? d.stemIdx : STEMS.indexOf(d.gz ? d.gz[0] : "");
    const tg = tenGod(dIdx, sIdx);
    const g = GROUP[tg];
    const isCurrent = currentAge != null && currentAge >= d.age && currentAge < d.age + 10;
    const bIdx = d.branchIdx != null ? d.branchIdx : (d.gz ? BRANCHES.indexOf(d.gz[1]) : 0);
    const det = pillarDetail(profile, sIdx, bIdx);
    return {
      ageStart: d.age, ageEnd: d.age + 9,
      gz: d.gz, hanja: d.hanja,
      tenGod: tg, group: g,
      label: THEME[g].label, line: THEME[g].line, do: THEME[g].do,
      branchGod: det.branchGod, stage: det.stage, sinsal: det.sinsal, guiin: det.guiin,
      isCurrent,
    };
  });
}

/** 세운(연간) 미래 흐름 — fromYear 부터 count년 */
export function yearFlow(profile, fromYear, count, currentYear) {
  const dIdx = profile.pillars.day.stemIdx;
  const out = [];
  for (let k = 0; k < count; k++) {
    const Y = fromYear + k;
    const idx = ((Y - 1984) % 60 + 60) % 60;
    const s = idx % 10, b = idx % 12;
    const tg = tenGod(dIdx, s);
    const g = GROUP[tg];
    const det = pillarDetail(profile, s, b);
    out.push({
      year: Y, gz: STEMS[s] + BRANCHES[b], hanja: STEM_H[s] + BRANCH_H[b],
      tenGod: tg, group: g, label: THEME[g].label,
      line: THEME[g].line, do: THEME[g].do,
      branchGod: det.branchGod, stage: det.stage, sinsal: det.sinsal, guiin: det.guiin,
      isCurrent: Y === currentYear,
    });
  }
  return out;
}

/** 만 나이 (양력 기준) */
export function ageFromSolar(solar, today) {
  let age = today.getFullYear() - solar.Y;
  const m = today.getMonth() + 1, d = today.getDate();
  if (m < solar.M || (m === solar.M && d < solar.D)) age -= 1;
  return age;
}

const pad = (n) => String(n).padStart(2, "0");

// 오늘의 운세 — 십신 그룹별
const TODAY = {
  비겁: {
    theme: "스스로 밀고 나가기 좋은 날. 주체적으로 결정하면 흐름이 붙어요.",
    love: "먼저 다가가기 좋아요. 다만 내 고집이 세지지 않게.",
    work: "주도적으로 처리하기 좋은 날. 협업에선 공을 나누세요.",
    money: "지출·충동구매가 늘기 쉬운 날. 큰 결제는 하루 미루기.",
    advice: "‘내가 하면 된다’는 힘이 강한 날 — 다만 주변과 보조를 맞추세요.",
  },
  식상: {
    theme: "표현과 아이디어가 잘 통하는 날. 말·글·활동에 운이 따라요.",
    love: "매력을 발산하기 좋은 날. 솔직한 표현이 통합니다.",
    work: "발표·기획·새 시도에 어울리는 날. 말실수만 조심.",
    money: "재능이 돈으로 이어질 기회. 과한 자신감엔 브레이크.",
    advice: "떠오른 걸 실행에 옮기기 좋은 날 — 감정적인 말은 한 박자 눌러서.",
  },
  재성: {
    theme: "돈·실속·인연에 기회가 열리는 날. 현실 감각이 살아나요.",
    love: "새 인연·설레는 만남이 생기기 쉬운 날.",
    work: "성과·거래·실무에 유리한 날. 디테일을 챙기세요.",
    money: "수입 기회가 보이지만, 욕심내 무리하면 새어나갑니다.",
    advice: "기회를 잡되 감당 가능한 규모로 — 관리가 오늘의 관건.",
  },
  관성: {
    theme: "인정·책임·중요한 일이 들어오는 날. 무게감이 커져요.",
    love: "진지한 관계·약속에 어울리는 날. 부담은 나눠서.",
    work: "승진·평가·중요한 자리에 좋은 날. 무리한 책임은 경계.",
    money: "고정 지출·의무 지출이 늘기 쉬운 날.",
    advice: "책임을 다 짊어지지 말고 범위를 분명히 — 압박은 나눠 지세요.",
  },
  인성: {
    theme: "배우고 정리하고 회복하기 좋은 날. 귀인의 도움이 따르기도.",
    love: "편안하고 안정적인 교감에 어울리는 날.",
    work: "공부·문서·자격·준비에 유리한 날. 추진력은 약할 수 있어요.",
    money: "큰 움직임보다 지키고 관리하기 좋은 날.",
    advice: "서두르지 말고 배움과 휴식을 챙기되 — 실행은 미루지 마세요.",
  },
};

/** 오늘의 운세 (오늘 일진 기준) */
export function todayFortune(profile, today) {
  const dIdx = profile.pillars.day.stemIdx;
  const y = today.getFullYear(), m = today.getMonth() + 1, d = today.getDate();
  const t = computeSaju({ calendarType: "solar", birthDate: `${y}-${pad(m)}-${pad(d)}`, birthTime: "12:00", timeUnknown: true, gender: "male", timezone: "Asia/Seoul" });
  const dayGod = tenGod(dIdx, t.pillars.day.stemIdx);
  const g = GROUP[dayGod];
  const luckyElem = RESOURCE[profile.dayMasterElem];
  const c = TODAY[g];
  return {
    date: `${y}.${pad(m)}.${pad(d)}`, iljin: t.pillars.day.gz, iljinH: t.pillars.day.hanja, dayGod,
    theme: c.theme, love: c.love, work: c.work, money: c.money, advice: c.advice,
    luckyColor: ELEM_COLOR[luckyElem], luckyElem: ELEM_KR[luckyElem],
  };
}

/** 귀인 · 악연 — 오행·천을귀인·충 기반 */
export function benefactorFoe(profile) {
  const dElem = profile.dayMasterElem;
  const dStem = profile.pillars.day.stemIdx;
  const dayBranch = profile.pillars.day.branchIdx;
  const guiElem = RESOURCE[dElem];
  const foeElem = CTRL_BY[dElem];
  const cheoneul = (CHEONEUL[dStem] || []).map((b) => ANIMAL[b] + "띠");
  const chung = ANIMAL[(dayBranch + 6) % 12] + "띠";
  return {
    benefactor: {
      elem: ELEM_KR[guiElem], animals: branchAnimals(guiElem), cheoneul,
      desc: `당신(${ELEM_KR[dElem]})을 낳고 길러주는 ${ELEM_KR[guiElem]} 기운을 지닌 사람이 귀인이 되기 쉽습니다. 배움·안정·결정적인 도움을 줍니다.`,
    },
    peer: {
      elem: ELEM_KR[dElem], animals: branchAnimals(dElem),
      desc: `같은 ${ELEM_KR[dElem]} 기운의 사람은 잘 통하는 동료이자, 때로는 선의의 경쟁 상대가 됩니다.`,
    },
    foe: {
      elem: ELEM_KR[foeElem], animals: branchAnimals(foeElem), chung,
      desc: `당신을 누르는 ${ELEM_KR[foeElem]} 기운이 강한 사람, 그리고 ${chung}와는 부딪히거나 소모가 되기 쉬워 거리·경계가 필요합니다. 다만 자극을 통해 배울 점도 있어 ‘무조건 나쁜 사람’은 아닙니다.`,
    },
  };
}
