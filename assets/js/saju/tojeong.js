import { analyzeStrength } from "./strength.js";
/* =========================================================
   토정비결식 올해의 운세.
   음력 생월·생일 + 그해 태세로 상·중·하 괘를 세워(팔괘 상수법 방식) 144괘 중 하나를 얻고,
   상괘(팔괘)의 성질로 올해 흐름을 풀어 준다. 전통 토정비결 '원문'이 아니라 그 방식을 따른 참고 해석.
   ========================================================= */

const ELEM_COLOR = { wood: "초록", fire: "빨강·주황", earth: "노랑·베이지", metal: "흰색·골드", water: "검정·네이비" };
const RESOURCE = { wood: "water", fire: "wood", earth: "fire", metal: "earth", water: "metal" };
const ELEM_KR = { wood: "목(木)", fire: "화(火)", earth: "토(土)", metal: "금(金)", water: "수(水)" };

// 팔괘(상괘) — 이름·상징·올해 톤
const PAL = {
  1: { name: "건(乾)", sym: "하늘", verse: "용이 하늘에 오르니 만사가 형통하다", tone: "강",
    summary: "밀고 나가는 힘이 강한 해예요. 시작하고 넓히는 데 운이 따릅니다.",
    pros: ["새 일·확장·리더 역할에 유리해요.", "결단력이 성과로 이어져요."],
    cons: ["과욕·독단이 화를 부를 수 있어요.", "혼자 다 짊어지면 지칩니다."],
    advice: "크게 벌이되 사람을 얻으세요. 밀어붙이는 만큼 나눠야 오래갑니다." },
  2: { name: "태(兌)", sym: "못", verse: "연못에 물이 고이니 기쁜 소식이 온다", tone: "중강",
    summary: "기쁨·인연·재물의 기운이 도는 해예요. 사람으로 인해 일이 풀립니다.",
    pros: ["연애·인간관계·즐거운 만남이 늘어요.", "말과 매력이 기회를 만들어요."],
    cons: ["구설·과소비를 조심하세요.", "달콤함에 판단이 흐려질 수 있어요."],
    advice: "즐기되 입과 지갑을 단속하세요. 인연은 넓히고 씀씀이는 좁히기." },
  3: { name: "리(離)", sym: "불", verse: "불이 밝게 타오르니 이름이 드러난다", tone: "중강",
    summary: "명예·인정·표현의 해예요. 드러내고 인정받는 일에 운이 붙어요.",
    pros: ["시험·합격·발표·문서에 유리해요.", "이름을 알리기 좋은 시기예요."],
    cons: ["조급함·감정 기복이 발목을 잡아요.", "화려함에 실속을 놓칠 수 있어요."],
    advice: "빛날 때일수록 뿌리를 챙기세요. 감정은 한 박자 눌러서." },
  4: { name: "진(震)", sym: "우레", verse: "우레가 크게 울리니 변화가 시작된다", tone: "중",
    summary: "움직임·이동·새 출발의 해예요. 흔들림 속에서 기회가 생겨요.",
    pros: ["이직·이사·도전에 어울려요.", "묵은 것을 털고 새로 시작하기 좋아요."],
    cons: ["불안정·조급함으로 일을 그르치기 쉬워요.", "충동적인 결정은 금물."],
    advice: "변화는 받아들이되 방향을 정하고 움직이세요. 놀람은 곧 기회예요." },
  5: { name: "손(巽)", sym: "바람", verse: "바람이 두루 부니 사람과 재물이 따른다", tone: "중",
    summary: "인연·거래·유연함의 해예요. 부드럽게 스며들면 멀리 갑니다.",
    pros: ["협력·중개·영업·거래에 유리해요.", "관계로 기회가 열려요."],
    cons: ["우유부단하면 기회를 놓쳐요.", "귀가 얇아 휘둘리기 쉬워요."],
    advice: "부드럽되 심지는 세우세요. 결정은 스스로, 실행은 함께." },
  6: { name: "감(坎)", sym: "물", verse: "깊은 물을 건너니 지혜로 위기를 넘는다", tone: "약",
    summary: "인내와 지혜가 필요한 해예요. 무리하기보다 깊이를 더할 때.",
    pros: ["공부·연구·내실을 다지기 좋아요.", "위기를 넘기며 단단해져요."],
    cons: ["곤란·구설·건강을 조심하세요.", "큰 확장·투자는 특히 신중히."],
    advice: "물 흐르듯 낮추고 기다리세요. 지키는 것이 올해의 이김입니다." },
  7: { name: "간(艮)", sym: "산", verse: "산이 우뚝 멈추니 자리를 지켜 이롭다", tone: "중약",
    summary: "멈춤·정리·안정의 해예요. 벌이기보다 다지고 정돈할 때.",
    pros: ["부동산·정리·저축·마무리에 유리해요.", "묵묵히 지키면 신뢰가 쌓여요."],
    cons: ["정체감·고집이 답답함을 줄 수 있어요.", "새 시도는 힘이 덜 붙어요."],
    advice: "멈춤도 전략이에요. 내실을 다지며 다음 봄을 준비하세요." },
  8: { name: "곤(坤)", sym: "땅", verse: "너른 땅이 만물을 기르니 꾸준함이 복이 된다", tone: "중",
    summary: "포용·축적·꾸준함의 해예요. 서두르지 않으면 차곡차곡 쌓여요.",
    pros: ["성실히 모으고 기르는 데 유리해요.", "사람을 품어 신망을 얻어요."],
    cons: ["수동적이면 흐름을 놓쳐요.", "결단이 늦어 기회를 흘리기 쉬워요."],
    advice: "묵묵히 쌓되 결정할 땐 미루지 마세요. 꾸준함이 가장 큰 재능." },
};

export function tojeongYear(profile, year) {
  const lunar = profile.lunar || { month: 6, day: 15 };
  const age = year - (profile.solar ? profile.solar.Y : year) + 1; // 세는나이
  const yStem = ((year - 4) % 10 + 10) % 10;   // 0甲..9癸
  const yBranch = ((year - 4) % 12 + 12) % 12;  // 0子..11亥

  const up = ((age + lunar.month) % 8) + 1;                    // 1~8 상괘
  const mid = ((lunar.day + yBranch) % 6) + 1;                 // 1~6 중괘
  const low = ((lunar.month + lunar.day + yStem) % 3) + 1;     // 1~3 하괘
  const gwaeNo = (up - 1) * 18 + (mid - 1) * 3 + low;          // 1~144

  const p = PAL[up];
  const score = 46 + ((7 - Math.abs(4 - up)) * 4) + (mid % 3) * 3 + (low - 2) * 2;
  const luckyElem = RESOURCE[profile.dayMasterElem];

  // 강조 달 — 괘수 기반 결정적 선택
  const months = [];
  for (let i = 0; i < 3; i++) months.push(((gwaeNo + i * 4) % 12) + 1);

  return {
    year, gwaeNo, gwae: `${up}·${mid}·${low}`, palName: p.name, palSym: p.sym, verse: p.verse,
    score: Math.max(28, Math.min(92, score)),
    summary: p.summary, pros: p.pros, cons: p.cons, advice: p.advice,
    goodMonths: months.sort((a, b) => a - b),
    luckyColor: ELEM_COLOR[luckyElem], luckyElem: ELEM_KR[luckyElem],
  };
}

const S_EL = ["wood", "wood", "fire", "fire", "earth", "earth", "metal", "metal", "water", "water"];
const B_EL = ["water", "earth", "wood", "wood", "earth", "fire", "fire", "earth", "metal", "metal", "earth", "water"];
const EL_KR2 = { wood: "목", fire: "화", earth: "토", metal: "금", water: "수" };

/* =========================================================
   인생 흐름 — 초년·중년·장년·노년 + 10년 단위
   나이마다 그해 토정 괘를 세워 점수·주된 괘를 모아 본다. (세는나이 기준)
   ========================================================= */
export const LIFE_STAGES = [
  { id: "cho", name: "초년운", from: 1, to: 20, theme: "배움·가정·기초를 다지는 시기" },
  { id: "jung", name: "중년운", from: 21, to: 40, theme: "사회 진출·연애·결혼·자리 잡는 시기" },
  { id: "jang", name: "장년운", from: 41, to: 60, theme: "성취·책임·재물을 굳히는 시기" },
  { id: "no", name: "노년운", from: 61, to: 90, theme: "결실·건강·여유를 누리는 시기" },
];
const BAND = (s) => s >= 68 ? { k: "순풍", line: "순풍에 돛 단 듯 잘 풀리는 흐름이에요." }
  : s >= 60 ? { k: "상승", line: "무난하게 오르막을 타는 흐름이에요." }
  : s >= 52 ? { k: "굴곡", line: "오르내림이 있지만 그 속에서 단단해지는 흐름이에요." }
  : { k: "인내", line: "버티고 다지는 힘이 필요한 흐름이에요. 무리한 확장보다 내실이 답." };
const STAGE_TIP = {
  cho: { 순풍: "재능이 일찍 드러나요. 칭찬받는 분야를 깊게 파 두면 평생 무기가 돼요.", 상승: "기초를 성실히 쌓을수록 중년에 크게 돌아와요.", 굴곡: "환경의 흔들림이 있었을 수 있어요. 그 경험이 남다른 공감력이 됩니다.", 인내: "어린 시절 허전함이 있었다면, 스스로를 돌보는 법을 배운 시간이에요." },
  jung: { 순풍: "사회에서 이름을 알리기 좋아요. 기회가 오면 망설이지 말고 잡으세요.", 상승: "한 우물을 파면 30대 후반부터 탄탄해져요. 인연도 이때 무르익어요.", 굴곡: "이직·이사·관계 변화가 잦을 수 있어요. 방향만 잃지 않으면 모두 경험치.", 인내: "남보다 늦게 자리 잡아도 괜찮아요. 이 시기의 공부·저축이 장년을 받쳐 줘요." },
  jang: { 순풍: "그동안 쌓은 것이 성과·재물로 돌아오는 황금기예요. 나눌수록 더 커져요.", 상승: "안정 속 성장. 무리한 투자만 피하면 착실히 불어나요.", 굴곡: "책임이 커지는 만큼 부침도 있어요. 건강과 가족을 먼저 챙기세요.", 인내: "지키는 것이 버는 것. 보증·큰 투자는 특히 신중히." },
  no: { 순풍: "편안하고 존중받는 노년이에요. 취미·배움으로 삶이 풍성해져요.", 상승: "자녀·주변의 덕을 보며 여유가 생겨요.", 굴곡: "건강 관리가 곧 운 관리예요. 규칙적인 생활이 복을 지켜요.", 인내: "욕심을 내려놓을수록 마음이 편해져요. 작은 즐거움을 모으세요." },
};

export function tojeongLife(profile) {
  const birthY = profile.solar ? profile.solar.Y : new Date().getFullYear() - 30;
  const rows = [];
  for (let age = 1; age <= 90; age++) {
    const year = birthY + age - 1;
    const r = tojeongYear(profile, year);
    rows.push({ age, year, score: r.score, up: Number(r.gwae.split("·")[0]) });
  }
  const mode = (list) => { const c = {}; list.forEach((x) => { c[x.up] = (c[x.up] || 0) + 1; }); return Number(Object.entries(c).sort((a, b) => b[1] - a[1])[0][0]); };
  const avg = (list) => Math.round(list.reduce((a, x) => a + x.score, 0) / list.length);
  const palOf = (up) => ({ name: PAL[up].name, sym: PAL[up].sym, summary: PAL[up].summary.replace("해예요", "시기예요") });
  const nowAge = new Date().getFullYear() - birthY + 1;
  const daeunList = (profile.daeun && profile.daeun.list) || [];

  // 대운(10년 운)이 나에게 도움 되는 오행(용신·조후)인지 → 점수 보정
  let helpful = [];
  try { helpful = analyzeStrength(profile).helpful || []; } catch { /* ignore */ }
  const P = profile.pillars;
  const favOf = (sIdx, bIdx) => {
    const se = S_EL[sIdx], be = B_EL[bIdx];
    let f = 54;
    if (helpful.includes(se)) f += 13;
    if (helpful.includes(be)) f += 11;
    if (!helpful.includes(se) && !helpful.includes(be)) f -= 8;
    return { f, se, be };
  };
  const luckAt = (age) => {
    const d = [...daeunList].reverse().find((x) => x.age != null && age >= x.age);
    if (d) return { ...favOf(d.stemIdx, d.branchIdx), hanja: d.hanja };
    return { ...favOf(P.month.stemIdx, P.month.branchIdx), hanja: null }; // 대운 시작 전은 월주 기운
  };
  rows.forEach((x) => { const L = luckAt(x.age); x.mix = Math.max(32, Math.min(94, Math.round(x.score * 0.45 + L.f * 0.55))); x.luck = L; });
  const avgMix = (list) => Math.round(list.reduce((a, x) => a + x.mix, 0) / list.length);

  const decades = [];
  for (let d = 0; d < 9; d++) {
    const from = d * 10 + 1, to = d * 10 + 10;
    const part = rows.filter((x) => x.age >= from && x.age <= to);
    const a = avgMix(part), b = BAND(a), up = mode(part);
    const helpEl = [...new Set(part.flatMap((x) => [x.luck.se, x.luck.be]).filter((e) => helpful.includes(e)))];
    const best = [...part].sort((x, y) => y.mix - x.mix)[0];
    const worst = [...part].sort((x, y) => x.mix - y.mix)[0];
    const dy = daeunList.filter((x) => x.age != null && x.age <= to && x.age + 9 >= from).map((x) => x.hanja);
    decades.push({ from, to, years: `${birthY + from - 1}–${birthY + to - 1}`, score: a, band: b.k, line: b.line,
      pal: palOf(up), best, worst, daeun: dy, isNow: nowAge >= from && nowAge <= to,
      luckNote: helpEl.length ? `대운에 나를 돕는 ${helpEl.map((e) => EL_KR2[e]).join("·")} 기운이 들어와 힘이 붙어요.` : "대운이 나와 결이 달라 스스로 다지는 힘이 필요해요.",
      trend: d === 0 ? 0 : a - decades[d - 1].score });
  }
  const stages = LIFE_STAGES.map((st) => {
    const part = rows.filter((x) => x.age >= st.from && x.age <= st.to);
    const a = avgMix(part), b = BAND(a), up = mode(part);
    return { ...st, score: a, band: b.k, line: b.line, tip: STAGE_TIP[st.id][b.k], pal: palOf(up),
      years: `${birthY + st.from - 1}–${birthY + st.to - 1}`, isNow: nowAge >= st.from && nowAge <= st.to };
  });

  return { birthY, nowAge, stages, decades };
}
