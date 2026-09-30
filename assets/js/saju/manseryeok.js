import { tenGod } from "./fortune.js";
import { jdnFromDate, jdFromUT, solarTermJD, localDateFromJD, solarToLunar } from "./astro.js";
/* =========================================================
   상세 만세력 — 십신·지장간·십이운성·납음. 명식을 정통 방식으로 펼친다.
   (타 앱보다 친절하게: 각 요소가 뭔지 설명까지 함께.)
   ========================================================= */


const STEM_H = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const STEM_KR = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const BRANCH_H = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const BRANCH_KR = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
const STEM_ELEM = ["wood", "wood", "fire", "fire", "earth", "earth", "metal", "metal", "water", "water"];
const BRANCH_ELEM = ["water", "earth", "wood", "wood", "earth", "fire", "fire", "earth", "metal", "metal", "earth", "water"];
const ZODIAC = ["쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양", "원숭이", "닭", "개", "돼지"];

// 지장간 (여기→중기→정기 순, stem index)
const JIJANG = [
  [8, 9], [9, 7, 5], [4, 2, 0], [0, 1], [1, 9, 4], [4, 6, 2],
  [2, 5, 3], [3, 1, 5], [4, 8, 6], [6, 7], [7, 3, 4], [4, 0, 8],
];
// 십이운성 — 일간별 장생 지지 + 방향
const CHANGSAENG = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3];
const STAGES12 = ["장생", "목욕", "관대", "건록", "제왕", "쇠", "병", "사", "묘", "절", "태", "양"];
// 납음 (30쌍) — 이름(오행은 끝 글자)
const NAPEUM = ["해중금", "노중화", "대림목", "노방토", "검봉금", "산두화", "간하수", "성두토", "백랍금", "양류목",
  "정천수", "옥상토", "벽력화", "송백목", "장류수", "사중금", "산하화", "평지목", "벽상토", "금박금",
  "복등화", "천하수", "대역토", "채천금", "상자목", "대계수", "사중토", "천상화", "석류목", "대해수"];

const mod = (n, m) => ((n % m) + m) % m;
function sexIdx(stem, branch) { for (let n = 0; n < 60; n++) if (n % 10 === stem && n % 12 === branch) return n; return 0; }
function twelveStage(dayStem, branch) {
  const dir = dayStem % 2 === 0 ? 1 : -1;
  return STAGES12[mod((branch - CHANGSAENG[dayStem]) * dir, 12)];
}

/* ===== 지지 관계(합·충·형·해·파) ===== */
const YUKHAP = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]]; // 육합
const SAMHAP = [{ b: [8, 0, 4], el: "水" }, { b: [2, 6, 10], el: "火" }, { b: [11, 3, 7], el: "木" }, { b: [5, 9, 1], el: "金" }];
const HAE = [[0, 7], [1, 6], [2, 5], [3, 4], [8, 11], [9, 10]]; // 해(害)
const PA = [[0, 9], [6, 3], [4, 1], [10, 7], [2, 11], [8, 5]];   // 파(破)
const HYEONG_GROUPS = [[2, 5, 8], [1, 10, 7], [0, 3]];          // 형(인사신·축술미·자묘)
const SELF_HYEONG = [4, 6, 9, 11];                              // 자형(진오유해)
const inPair = (list, a, b) => list.some((p) => (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a));

/** 두 지지의 관계 (없으면 null) */
function branchRel(a, b) {
  if (a === b) return null;
  if (Math.abs(a - b) === 6) return { kind: "충", cls: "warn" };
  if (inPair(YUKHAP, a, b)) return { kind: "육합", cls: "good" };
  for (const s of SAMHAP) if (s.b.includes(a) && s.b.includes(b)) return { kind: "삼합", el: s.el, cls: "good" };
  if (HYEONG_GROUPS.some((g) => g.includes(a) && g.includes(b))) return { kind: "형", cls: "warn" };
  if (inPair(HAE, a, b)) return { kind: "해", cls: "warn" };
  if (inPair(PA, a, b)) return { kind: "파", cls: "warn" };
  return null;
}

/* ===== 12신살 ===== */
const WANGJI = { 8: 0, 0: 0, 4: 0, 2: 6, 6: 6, 10: 6, 11: 3, 3: 3, 7: 3, 5: 9, 9: 9, 1: 9 };
const SINSAL12 = ["겁살", "재살", "천살", "지살", "도화살", "월살", "망신살", "장성살", "반안살", "역마살", "육해살", "화개살"];
function sinsalOf(baseBranch, target) {
  const geop = mod(WANGJI[baseBranch] + 5, 12);
  return SINSAL12[mod(target - geop, 12)];
}

/* ===== 길신·흉살 (일간·지지 기준) ===== */
// 천을귀인 (일간 → 지지 2개)
const CHEONEUL = [[1, 7], [0, 8], [11, 9], [11, 9], [1, 7], [0, 8], [1, 7], [2, 6], [5, 3], [5, 3]];
// 건록 / 양인(양간) / 금여 / 문창귀인 (일간 → 지지)
const LOK = [2, 3, 5, 6, 5, 6, 8, 9, 11, 0];
const YANGIN = { 0: 3, 2: 6, 4: 6, 6: 9, 8: 0 };
const GEUMYEO = [4, 5, 7, 8, 7, 8, 10, 11, 1, 2];
const MUNCHANG = [5, 6, 8, 9, 8, 9, 11, 0, 2, 3];
// 현침살: 천간 甲辛 / 지지 卯午申
const HYEONCHIM_STEM = [0, 7], HYEONCHIM_BRANCH = [3, 6, 8];

/** 명식 → 상세 만세력 데이터 */
export function buildManse(profile) {
  const P = profile.pillars;
  const dayStem = P.day.stemIdx;
  const order = [
    { key: "hour", pos: "시주", posH: "時" },
    { key: "day", pos: "일주", posH: "日" },
    { key: "month", pos: "월주", posH: "月" },
    { key: "year", pos: "년주", posH: "年" },
  ];
  // 기준 지지들
  const yearB = P.year ? P.year.branchIdx : null;
  const dayB = P.day ? P.day.branchIdx : null;
  const present = order.filter(({ key }) => P[key]);
  const guiin = CHEONEUL[dayStem]; // 천을귀인 지지 2개

  const pillars = order.map(({ key, pos, posH }) => {
    const p = P[key];
    if (!p) return { pos, posH, empty: true };
    const s = p.stemIdx, b = p.branchIdx;
    const isDay = key === "day";
    const jj = JIJANG[b].map((hs) => ({ hanja: STEM_H[hs], god: tenGod(dayStem, hs) }));
    const sex = sexIdx(s, b);
    const nap = NAPEUM[Math.floor(sex / 2)];

    // 다른 기둥 지지와의 관계(합·충·형·해·파)
    const relations = [];
    present.forEach((o) => {
      if (o.key === key) return;
      const r = branchRel(b, P[o.key].branchIdx);
      if (r) relations.push({ with: o.pos, kind: r.kind + (r.el ? `(${r.el})` : ""), cls: r.cls });
    });

    // 12신살 (년지 기준 / 일지 기준)
    const sinsal = [];
    if (yearB != null) sinsal.push({ base: "년", name: sinsalOf(yearB, b) });
    if (dayB != null) sinsal.push({ base: "일", name: sinsalOf(dayB, b) });

    // 길신·흉살
    const spirits = [];
    if (guiin.includes(b)) spirits.push("천을귀인");
    if (LOK[dayStem] === b) spirits.push("건록");
    if (YANGIN[dayStem] === b) spirits.push("양인");
    if (GEUMYEO[dayStem] === b) spirits.push("금여");
    if (MUNCHANG[dayStem] === b) spirits.push("문창귀인");
    if (HYEONCHIM_STEM.includes(s) || HYEONCHIM_BRANCH.includes(b)) spirits.push("현침살");

    return {
      pos, posH, key,
      stemH: STEM_H[s], stemKr: STEM_KR[s], stemElem: STEM_ELEM[s],
      branchH: BRANCH_H[b], branchKr: BRANCH_KR[b], branchElem: BRANCH_ELEM[b],
      zodiac: ZODIAC[b],
      stemGod: isDay ? "일간(我)" : tenGod(dayStem, s),
      branchGod: tenGod(dayStem, JIJANG[b][JIJANG[b].length - 1]), // 지지 정기 기준
      jijang: jj,
      stage: twelveStage(dayStem, b),
      napeum: nap, napeumElem: nap.slice(-1),
      relations, sinsal, spirits,
      isGuiin: guiin.includes(b),
      isDay,
    };
  });

  // 지지 관계 요약(쌍 단위, 중복 제거)
  const pairRels = [];
  for (let i = 0; i < present.length; i++) for (let j = i + 1; j < present.length; j++) {
    const A = present[i], B = present[j];
    const r = branchRel(P[A.key].branchIdx, P[B.key].branchIdx);
    if (r) pairRels.push({ a: A.pos, b: B.pos, kind: r.kind + (r.el ? `(${r.el})` : ""), cls: r.cls,
      ah: BRANCH_H[P[A.key].branchIdx], bh: BRANCH_H[P[B.key].branchIdx] });
  }

  // 공망 (년주·일주 순중)
  const gongmang = (pillarKey) => {
    const p = P[pillarKey]; if (!p) return null;
    const D = sexIdx(p.stemIdx, p.branchIdx);
    const headB = mod(D - mod(D, 10), 12);
    return [mod(headB + 10, 12), mod(headB + 11, 12)];
  };
  const gmYear = gongmang("year"), gmDay = gongmang("day");
  const wollyeong = P.month ? STEM_H[JIJANG[P.month.branchIdx][JIJANG[P.month.branchIdx].length - 1]] : null;

  const summary = {
    guiinH: guiin.map((x) => BRANCH_H[x]),
    guiinHit: present.some((o) => guiin.includes(P[o.key].branchIdx)),
    gongmangYearH: gmYear ? gmYear.map((x) => BRANCH_H[x]) : null,
    gongmangDayH: gmDay ? gmDay.map((x) => BRANCH_H[x]) : null,
    wollyeongH: wollyeong,
    elementCounts: profile.elementCounts,
  };

  return { pillars, pairRels, summary, dayMaster: STEM_KR[dayStem] + "(" + STEM_H[dayStem] + ")", elementCounts: profile.elementCounts };
}

/* 신살·길신 한 줄 뜻 (마우스 오버 툴팁용) */
export const SINSAL_MEANING = {
  "천을귀인": "최고의 길신. 위기에 귀인의 도움을 받고 흉을 길로 바꾸는 힘.",
  "건록": "스스로 벌어 자리를 만드는 자수성가의 힘. 성실하고 독립적.",
  "양인": "칼처럼 강한 추진력·승부욕. 과하면 사고·다툼을 조심.",
  "금여": "배우자 복·재물 복의 길신. 편안하고 귀한 인연이 따름.",
  "문창귀인": "학문·시험·문서운. 머리가 맑고 글재주가 있음.",
  "현침살": "바늘처럼 예리한 재주. 의료·기술·손재주, 말·글이 날카로움.",
  "장성살": "리더십·중심. 무리를 이끌고 책임지는 자리.",
  "반안살": "말안장 — 승진·안정·출세의 기운. 윗사람의 도움.",
  "역마살": "이동·이사·해외·변화. 한곳에 머물기보다 움직일 때 풀림.",
  "화개살": "예술·종교·학문·고독. 남다른 감성과 재능, 혼자만의 세계.",
  "도화살": "매력·인기·이성운. 사람을 끄는 힘(과하면 구설).",
  "육해살": "소모·발목잡힘. 건강·관계에서 신경 쓸 일이 생기기 쉬움.",
  "겁살": "예기치 못한 손실·빼앗김. 욕심을 조절할 자리.",
  "재살(수옥살)": "구속·송사·경쟁. 다툼과 시비를 조심.",
  "재살": "구속·송사·경쟁. 다툼과 시비를 조심.",
  "천살": "하늘이 내린 변수. 내 힘 밖의 일, 겸손이 약.",
  "지살": "이동·역마의 시작. 분주하게 움직이며 자리를 넓힘.",
  "월살(고초살)": "메마름·정체. 결실 직전 힘 빠지기 쉬워 꾸준함이 필요.",
  "월살": "메마름·정체. 결실 직전 힘 빠지기 쉬워 꾸준함이 필요.",
  "망신살": "체면·실수 노출. 말과 처신을 조심할 자리.",
  "홍염살": "은은한 색기·분위기 미남미녀. 가만히 있어도 눈길을 끄는 매력.",
};

/* 용어 설명 (타 앱보다 친절하게) */
export const MANSE_GLOSSARY = [
  { term: "천간·지지 (天干·地支)", desc: "위 글자가 천간(하늘 기운·드러난 나), 아래 글자가 지지(땅 기운·속마음·환경)예요. 둘을 합쳐 ‘간지’, 네 기둥이 사주팔자(四柱八字)입니다." },
  { term: "일간 (日干)", desc: "일주의 천간 = 바로 ‘나 자신’. 사주 해석의 기준점이에요. 나머지 글자들은 모두 이 일간과의 관계로 읽습니다." },
  { term: "십신 (十神)", desc: "각 글자가 나(일간)에게 어떤 역할인지예요. 재성=재물·이성, 관성=직위·규율, 인성=문서·학문·보호, 식상=표현·재능, 비겁=경쟁·동료." },
  { term: "지장간 (支藏干)", desc: "지지 속에 숨어 있는 천간이에요. 겉(지지)과 속(지장간)이 달라, 드러나지 않은 성향·잠재력을 봅니다." },
  { term: "십이운성 (十二運星)", desc: "일간이 각 지지에서 얼마나 기운이 센지(장생→제왕→묘…)를 12단계로 본 것. 제왕·건록은 강, 묘·절·사는 약." },
  { term: "납음오행 (納音五行)", desc: "간지 한 쌍에 붙는 상징 오행(예: 대림목=큰 숲의 나무). 옛 이름풀이·궁합에서 참고해요." },
  { term: "오행 분포", desc: "목·화·토·금·수의 개수. 많은 기운은 강점이자 과잉, 없는 기운은 채워야 할 부분(용신·처방과 연결)이에요." },
  { term: "합·충 (合·沖)", desc: "지지끼리의 관계예요. 육합·삼합은 힘을 합쳐 안정·협력, 충은 강하게 부딪혀 변화·이동, 형·해·파는 마찰·소모를 뜻해요. 내 팔자 안에서, 그리고 그해 운(세운)과의 관계로 사건이 드러납니다." },
  { term: "천을귀인 (天乙貴人)", desc: "가장 귀한 길신. 내 사주에 있으면 위기 때 귀인의 도움을 받고, 흉을 길로 바꾸는 힘이 있다고 봐요. 그해 운에서 만나도 도움이 들어옵니다." },
  { term: "공망 (空亡)", desc: "‘비어 있는’ 지지예요. 그 자리(년·일 기준)의 기운은 채워지지 않아 허전하거나, 집착을 내려놓아야 편해지는 영역을 뜻해요." },
  { term: "12신살 (十二神殺)", desc: "년지·일지를 기준으로 각 지지에 붙는 12가지 기운. 도화살=매력·인기, 역마살=이동·해외, 화개살=예술·종교·고독, 장성살=리더십, 망신살·겁살·재살 등은 조심할 자리예요." },
  { term: "건록·양인·금여·문창·현침", desc: "건록=자수성가의 힘, 양인=강한 추진력(과하면 사고), 금여=배우자·재물 복, 문창귀인=학문·시험운, 현침살=날카로운 재주(의료·기술)이자 말·글의 예리함이에요." },
  { term: "월령 (月令)", desc: "태어난 달(월지)의 기운. 일간이 이 계절 기운을 얻었는지(득령)가 신강·신약 판단의 핵심이에요." },
];

/* =========================================================
   명식 심화 — 오행과 십성 / 천간·지지 관계 / 신살과 길성
   기둥 순서: 0 시주 · 1 일주 · 2 월주 · 3 년주 (화면 순서와 같음)
   ========================================================= */
const ELEMS5 = ["wood", "fire", "earth", "metal", "water"];
const ELEM_KR5 = { wood: "목", fire: "화", earth: "토", metal: "금", water: "수" };
const ELEM_H5 = { wood: "木", fire: "火", earth: "土", metal: "金", water: "水" };
const GEN5 = { wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood" };
const CTRL5 = { wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood" };
const GROUP_OF = (dm, e) => e === dm ? "비겁" : GEN5[dm] === e ? "식상" : CTRL5[dm] === e ? "재성" : CTRL5[e] === dm ? "관성" : "인성";
const GROUP_GODS = { 비겁: ["비견", "겁재"], 식상: ["식신", "상관"], 재성: ["편재", "정재"], 관성: ["편관", "정관"], 인성: ["편인", "정인"] };
export const GROUP_MEANING = {
  비겁: "나와 같은 기운 — 자존심·독립심·경쟁·동료",
  식상: "내가 만들어 내는 기운 — 표현·재능·말·먹을 복",
  재성: "내가 다루는 기운 — 재물·현실감각·이성(남자에겐 여자)",
  관성: "나를 다스리는 기운 — 직장·명예·규칙(여자에겐 남자)",
  인성: "나를 돕는 기운 — 학문·문서·어머니·보호",
};
const STATUS_TIP = {
  없음: "이 기운이 사주에 없어요. 의식적으로 채우거나, 이 기운을 가진 사람의 도움을 받으면 좋아요.",
  부족: "조금 모자라요. 이 기운과 관련된 일은 연습·습관으로 보완하면 좋아요.",
  적정: "알맞게 있어요. 무난하게 잘 쓰는 영역이에요.",
  발달: "힘 있게 발달했어요. 나의 강점이자 자주 쓰는 무기예요.",
  과다: "넘칠 만큼 많아요. 장점이지만 과하면 단점이 되니 덜어내는 연습이 필요해요.",
};
function statusOf(pct) {
  if (pct <= 0) return "없음";
  if (pct < 20) return "부족";
  if (pct < 30) return "적정";
  if (pct < 45) return "발달";
  return "과다";
}

function elementsAndGods(P) {
  const dm = STEM_ELEM[P.day.stemIdx];
  const chars = [];
  ["hour", "day", "month", "year"].forEach((k) => {
    const p = P[k]; if (!p) return;
    chars.push({ elem: STEM_ELEM[p.stemIdx], god: k === "day" ? "비견" : tenGod(P.day.stemIdx, p.stemIdx) });
    const jj = JIJANG[p.branchIdx];
    chars.push({ elem: BRANCH_ELEM[p.branchIdx], god: tenGod(P.day.stemIdx, jj[jj.length - 1]) });
  });
  const total = chars.length || 1;
  const pct = (n) => Math.round((n / total) * 1000) / 10;
  return ELEMS5.map((e) => {
    const n = chars.filter((c) => c.elem === e).length;
    const group = GROUP_OF(dm, e);
    const p = pct(n);
    const status = statusOf(p);
    return {
      key: e, kr: ELEM_KR5[e], h: ELEM_H5[e], count: n, pct: p, group, status,
      gods: GROUP_GODS[group].map((g) => ({ name: g, pct: pct(chars.filter((c) => c.god === g).length) })),
      meaning: GROUP_MEANING[group], tip: STATUS_TIP[status], isMe: e === dm,
    };
  });
}

/* --- 천간 관계: 합 > 충 > 극 --- */
const STEM_HAP = { "0-5": "토", "1-6": "금", "2-7": "수", "3-8": "목", "4-9": "화" };
const STEM_CHUNG = ["0-6", "1-7", "2-8", "3-9"];
function stemRel(a, b) {
  const k = a < b ? `${a}-${b}` : `${b}-${a}`;
  const n = STEM_KR[a] + STEM_KR[b];
  if (STEM_HAP[k]) return [{ label: `${n}합(${STEM_HAP[k]})`, cls: "good" }];
  if (STEM_CHUNG.includes(k)) return [{ label: `${n}충`, cls: "warn" }];
  const ea = STEM_ELEM[a], eb = STEM_ELEM[b];
  if (a % 2 === b % 2) {
    if (CTRL5[ea] === eb) return [{ label: `${n}극`, cls: "warn" }];
    if (CTRL5[eb] === ea) return [{ label: `${STEM_KR[b] + STEM_KR[a]}극`, cls: "warn" }];
  }
  return [];
}
/* --- 지지 관계: 충·육합·삼합/반합·방합·형·해·파·원진 (여러 개 가능) --- */
const BANGHAP = [[2, 3, 4], [5, 6, 7], [8, 9, 10], [11, 0, 1]];
const WONJIN = [[0, 7], [1, 6], [2, 9], [3, 8], [4, 11], [5, 10]];
const SAMHAP_EL = [{ b: [8, 0, 4], el: "수" }, { b: [2, 6, 10], el: "화" }, { b: [11, 3, 7], el: "목" }, { b: [5, 9, 1], el: "금" }];
const YUKHAP_EL = { "0-1": "토", "2-11": "목", "3-10": "화", "4-9": "금", "5-8": "수", "6-7": "화" };
function branchRels(a, b, presentSet) {
  const n = BRANCH_KR[a] + BRANCH_KR[b];
  const out = [];
  const k = a < b ? `${a}-${b}` : `${b}-${a}`;
  if (a === b) { if (SELF_HYEONG.includes(a)) out.push({ label: `${n}자형`, cls: "warn" }); return out; }
  if (Math.abs(a - b) === 6) out.push({ label: `${n}충`, cls: "warn" });
  if (YUKHAP_EL[k]) out.push({ label: `${n}합(${YUKHAP_EL[k]})`, cls: "good" });
  for (const s of SAMHAP_EL) if (s.b.includes(a) && s.b.includes(b)) {
    const full = s.b.every((x) => presentSet.has(x));
    out.push({ label: `${n}${full ? "삼합" : "반합"}(${s.el})`, cls: "good" });
  }
  if (BANGHAP.some((g) => g.includes(a) && g.includes(b))) out.push({ label: `${n}방합`, cls: "good" });
  if (HYEONG_GROUPS.some((g) => g.includes(a) && g.includes(b))) out.push({ label: `${n}형`, cls: "warn" });
  if (inPair(HAE, a, b)) out.push({ label: `${n}해`, cls: "warn" });
  if (inPair(PA, a, b)) out.push({ label: `${n}파`, cls: "warn" });
  if (inPair(WONJIN, a, b)) out.push({ label: `${n}원진`, cls: "warn" });
  return out;
}

/* --- 신살과 길성 --- */
const CHEONDEOK = { 2: ["s", 3], 3: ["b", 8], 4: ["s", 8], 5: ["s", 7], 6: ["b", 11], 7: ["s", 0], 8: ["s", 9], 9: ["b", 2], 10: ["s", 2], 11: ["s", 1], 0: ["b", 5], 1: ["s", 6] };
const WOLDEOK = { 2: 2, 6: 2, 10: 2, 8: 8, 0: 8, 4: 8, 11: 0, 3: 0, 7: 0, 5: 6, 9: 6, 1: 6 }; // 월지 → 천간
const TAEGEUK = [[0, 6], [0, 6], [3, 9], [3, 9], [4, 10, 1, 7], [4, 10, 1, 7], [2, 11], [2, 11], [5, 8], [5, 8]];
const MUNGOK = [11, 0, 2, 3, 2, 3, 5, 6, 8, 9];
const HAKDANG = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3];
const AMROK = [11, 10, 8, 7, 8, 7, 5, 4, 2, 1];
const HONGYEOM = [6, 6, 2, 7, 4, 4, 10, 9, 0, 8];
const CHEONJU = [5, 6, 5, 6, 8, 9, 11, 0, 2, 3];
const GEUPGAK = { 2: [11, 0], 3: [11, 0], 4: [11, 0], 5: [3, 7], 6: [3, 7], 7: [3, 7], 8: [2, 10], 9: [2, 10], 10: [2, 10], 11: [1, 4], 0: [1, 4], 1: [1, 4] };
const GOEGANG = ["6-4", "6-10", "8-4", "8-10", "4-10"];
const BAEKHO = ["0-4", "1-7", "2-10", "3-1", "4-4", "8-10", "9-1"];
const YEOKMA = { 8: 2, 0: 2, 4: 2, 2: 8, 6: 8, 10: 8, 11: 5, 3: 5, 7: 5, 5: 11, 9: 11, 1: 11 };
const DOHWA = { 8: 9, 0: 9, 4: 9, 2: 3, 6: 3, 10: 3, 11: 0, 3: 0, 7: 0, 5: 6, 9: 6, 1: 6 };
const HWAGAE = { 8: 4, 0: 4, 4: 4, 2: 10, 6: 10, 10: 10, 11: 7, 3: 7, 7: 7, 5: 1, 9: 1, 1: 1 };

function spiritsTable(P) {
  const keys = ["hour", "day", "month", "year"];
  const ds = P.day.stemIdx, db = P.day.branchIdx, mb = P.month ? P.month.branchIdx : null, yb = P.year ? P.year.branchIdx : null;
  const stems = [], branches = [];
  keys.forEach((k, i) => {
    const p = P[k];
    if (!p) { stems.push(null); branches.push(null); return; }
    const s = p.stemIdx, b = p.branchIdx, pk = `${s}-${b}`;
    const S = [], B = [];
    // 천간 쪽
    if (mb != null) {
      const cd = CHEONDEOK[mb];
      if (cd[0] === "s" && cd[1] === s) S.push("천덕귀인");
      if (cd[0] === "b" && cd[1] === b) B.push("천덕귀인");
      if (WOLDEOK[mb] === s) S.push("월덕귀인");
    }
    if (GOEGANG.includes(pk)) { S.push("괴강살"); B.push("괴강살"); }
    if (BAEKHO.includes(pk)) { S.push("백호살"); B.push("백호살"); }
    if (HYEONCHIM_STEM.includes(s)) S.push("현침살");
    // 지지 쪽 (일간 기준)
    if (CHEONEUL[ds].includes(b)) B.push("천을귀인");
    if (TAEGEUK[ds].includes(b)) B.push("태극귀인");
    if (MUNCHANG[ds] === b) B.push("문창귀인");
    if (MUNGOK[ds] === b) B.push("문곡귀인");
    if (HAKDANG[ds] === b) B.push("학당귀인");
    if (CHEONJU[ds] === b) B.push("천주귀인");
    if (LOK[ds] === b) B.push("건록");
    if (AMROK[ds] === b) B.push("암록");
    if (GEUMYEO[ds] === b) B.push("금여");
    if (YANGIN[ds] === b) B.push("양인");
    if (HONGYEOM[ds] === b) B.push("홍염살");
    if (HYEONCHIM_BRANCH.includes(b)) B.push("현침살");
    if (mb != null && k !== "month" && GEUPGAK[mb].includes(b)) B.push("급각살");
    // 역마·도화·화개 (년지·일지 기준, 자기 자리 제외)
    const bases = [[yb, "year"], [db, "day"]].filter(([x, kk]) => x != null && kk !== k);
    if (bases.some(([x]) => YEOKMA[x] === b)) B.push("역마살");
    if (bases.some(([x]) => DOHWA[x] === b)) B.push("도화살");
    if (bases.some(([x]) => HWAGAE[x] === b)) B.push("화개살");
    stems.push([...new Set(S)]); branches.push([...new Set(B)]);
  });
  return { stems, branches };
}

export function sajuDeep(profile) {
  const P = profile.pillars;
  const keys = ["hour", "day", "month", "year"];
  const cols = keys.map((k) => P[k] || null);
  const present = new Set(cols.filter(Boolean).map((p) => p.branchIdx));
  const stemRels = [], branchRelsList = [];
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
    if (!cols[i] || !cols[j]) continue;
    const sr = stemRel(cols[i].stemIdx, cols[j].stemIdx);
    if (sr.length) stemRels.push({ i, j, items: sr });
    const br = branchRels(cols[i].branchIdx, cols[j].branchIdx, present);
    if (br.length) branchRelsList.push({ i, j, items: br });
  }
  return {
    cols: cols.map((p, i) => p ? {
      pos: ["시", "일", "월", "년"][i],
      stemH: STEM_H[p.stemIdx], stemKr: STEM_KR[p.stemIdx], stemElem: STEM_ELEM[p.stemIdx],
      branchH: BRANCH_H[p.branchIdx], branchKr: BRANCH_KR[p.branchIdx], branchElem: BRANCH_ELEM[p.branchIdx],
    } : null),
    elements: elementsAndGods(P),
    stemRels, branchRels: branchRelsList,
    spirits: spiritsTable(P),
  };
}

Object.assign(SINSAL_MEANING, {
  "천덕귀인": "하늘의 덕 — 큰 사고·흉을 피하고 도움을 받는 복.",
  "월덕귀인": "달의 덕 — 온화한 인덕, 어려울 때 해결의 손길.",
  "태극귀인": "시작과 끝을 잘 맺는 복. 조상·종교·명예의 도움.",
  "문곡귀인": "문학·예술·말재주. 글과 말로 인정받는 재능.",
  "학당귀인": "배움의 별. 공부·자격증·연구에 좋은 머리.",
  "천주귀인": "먹을 복·식록. 의식주가 풍족하고 대접받음.",
  "암록": "숨은 재물·보이지 않는 도움. 위기에 뜻밖의 지원.",
  "괴강살": "강한 카리스마·결단력. 리더형이지만 고집을 조심.",
  "백호살": "강렬한 에너지·추진력. 피·사고·수술을 조심할 자리.",
  "급각살": "다리·관절·발목을 조심. 서두르면 넘어지기 쉬움.",
});

/* =========================================================
   만세력 정보판 + 대운·세운 표
   ========================================================= */
const SAMJAE = { 8: [2, 3, 4], 0: [2, 3, 4], 4: [2, 3, 4], 2: [8, 9, 10], 6: [8, 9, 10], 10: [8, 9, 10], 5: [11, 0, 1], 9: [11, 0, 1], 1: [11, 0, 1], 11: [5, 6, 7], 3: [5, 6, 7], 7: [5, 6, 7] };
const gzInfo = (s, b) => ({ stemH: STEM_H[s], stemKr: STEM_KR[s], stemElem: STEM_ELEM[s], branchH: BRANCH_H[b], branchKr: BRANCH_KR[b], branchElem: BRANCH_ELEM[b] });

export function manseInfo(profile) {
  const P = profile.pillars, ds = P.day.stemIdx, yb = P.year.branchIdx, mb = P.month.branchIdx;
  const out = [];
  const B = (i) => `${BRANCH_H[i]}(${BRANCH_KR[i]})`;
  const S = (i) => `${STEM_H[i]}(${STEM_KR[i]})`;
  out.push(["천을귀인", CHEONEUL[ds].map(B).join(" · "), SINSAL_MEANING["천을귀인"]]);
  const cd = CHEONDEOK[mb];
  out.push(["천덕귀인", cd[0] === "s" ? S(cd[1]) : B(cd[1]), SINSAL_MEANING["천덕귀인"]]);
  out.push(["월덕귀인", S(WOLDEOK[mb]), SINSAL_MEANING["월덕귀인"]]);
  out.push(["문창귀인", B(MUNCHANG[ds]), SINSAL_MEANING["문창귀인"]]);
  out.push(["천의성", B(mod(mb - 1, 12)), "하늘의 의사 — 치유·돌봄의 별. 의료·상담·교육에 인연."]);
  // 명궁 (월장법: 태어난 시에 월장을 놓고 卯에 닿는 궁)
  const m = profile.meta || {};
  if (m.timeKnown && P.hour && m.sunLon != null) {
    const W = mod(10 - Math.floor(m.sunLon / 30), 12);
    const g = mod(W + 3 - P.hour.branchIdx, 12);
    const ys = mod(profile.saJuYear - 4, 10);
    const gs = mod((ys % 5) * 2 + 2 + mod(g - 2, 12), 10); // 오호둔으로 명궁 천간
    out.push(["명궁", `${STEM_H[gs]}${BRANCH_H[g]}(${STEM_KR[gs]}${BRANCH_KR[g]})`, "타고난 운명의 집 — 평생의 성향·그릇을 보여주는 자리."]);
  }
  // 공망
  const gm = (p) => { const D = sexIdx(p.stemIdx, p.branchIdx); const h = mod(D - mod(D, 10), 12); return [mod(h + 10, 12), mod(h + 11, 12)]; };
  out.push(["공망", `년 ${gm(P.year).map(B).join("")} · 일 ${gm(P.day).map(B).join("")}`, "비어 있는 자리 — 채우려 해도 덜 채워지니 욕심을 내려놓으면 편해져요."]);
  // 삼재
  const sj = SAMJAE[yb];
  const now = new Date().getFullYear();
  let next = null;
  for (let y = now; y < now + 13; y++) { if (sj.includes(mod(y - 4, 12))) { next = y; break; } }
  const inNow = sj.includes(mod(now - 4, 12));
  const first = next != null ? next - sj.indexOf(mod(next - 4, 12)) : null;
  out.push(["삼재", `${sj.map(B).join("")}년${first ? ` · ${inNow ? "지금 삼재 중" : "다음"} ${first}~${first + 2}` : ""}`, "3년 동안 들어오는 조심수 — 들삼재·눌삼재·날삼재. 큰 결정은 신중히."]);
  return out;
}

/** 대운 10개 열 */
export function daeunColumns(profile) {
  const P = profile.pillars, ds = P.day.stemIdx, yb = P.year.branchIdx;
  const list = (profile.daeun && profile.daeun.list) || [];
  const age = new Date().getFullYear() - (profile.solar ? profile.solar.Y : 0);
  return list.map((d) => ({
    age: d.age, startYear: d.startYear, ...gzInfo(d.stemIdx, d.branchIdx), hanja: d.hanja,
    stemGod: tenGod(ds, d.stemIdx), branchGod: tenGod(ds, JIJANG[d.branchIdx][JIJANG[d.branchIdx].length - 1]),
    stage: twelveStage(ds, d.branchIdx), sinsal: sinsalOf(yb, d.branchIdx),
    guiin: CHEONEUL[ds].includes(d.branchIdx),
    isNow: age >= d.age && age < d.age + 10,
  }));
}
/** 세운 — fromYear부터 10년 */
export function yearColumns(profile, fromYear, count = 10) {
  const P = profile.pillars, ds = P.day.stemIdx, yb = P.year.branchIdx;
  const birthY = profile.solar ? profile.solar.Y : 0, now = new Date().getFullYear();
  const out = [];
  for (let k = 0; k < count; k++) {
    const Y = fromYear + k, s = mod(Y - 4, 10), b = mod(Y - 4, 12);
    out.push({ year: Y, age: Y - birthY, ...gzInfo(s, b), stemGod: tenGod(ds, s), branchGod: tenGod(ds, JIJANG[b][JIJANG[b].length - 1]),
      stage: twelveStage(ds, b), sinsal: sinsalOf(yb, b), sinsal2: sinsalOf(P.day.branchIdx, b), guiin: CHEONEUL[ds].includes(b), isNow: Y === now,
      samjae: SAMJAE[yb].includes(b) });
  }
  return out;
}


/* ================= 월운(12달) · 일진 달력 ================= */
const TERM_NAME = { 315: "입춘", 330: "우수", 345: "경칩", 0: "춘분", 15: "청명", 30: "곡우", 45: "입하", 60: "소만", 75: "망종", 90: "하지", 105: "소서", 120: "대서",
  135: "입추", 150: "처서", 165: "백로", 180: "추분", 195: "한로", 210: "상강", 225: "입동", 240: "소설", 255: "대설", 270: "동지", 285: "소한", 300: "대한" };
function lineCol(profile, s, b, extra) {
  const P = profile.pillars, ds = P.day.stemIdx, yb = P.year.branchIdx;
  return { ...gzInfo(s, b), stemGod: tenGod(ds, s), branchGod: tenGod(ds, JIJANG[b][JIJANG[b].length - 1]),
    stage: twelveStage(ds, b), sinsal: sinsalOf(yb, b), sinsal2: sinsalOf(P.day.branchIdx, b), guiin: CHEONEUL[ds].includes(b), samjae: false, ...extra };
}
/** 그해 양력 1~12월의 월운 (그 달에 들어오는 절기 기준 월주) */
export function monthColumns(profile, Y) {
  const now = new Date();
  const out = [];
  for (let M = 1; M <= 12; M++) {
    const order = mod(M - 2, 12); // 0=寅(2월)
    const sajuY = M === 1 ? Y - 1 : Y; // 1월(축월)은 전년도 간지의 달
    const ys = mod(sajuY - 4, 10);
    const s = mod(ys * 2 + 2 + order, 10), b = mod(order + 2, 12);
    const deg = mod(315 + order * 30, 360);
    const jd = solarTermJD(deg, jdFromUT(Y, M, 3, 0));
    const d = localDateFromJD(jd, 9);
    out.push(lineCol(profile, s, b, { month: M, year: Y, top: `${M}월`, termName: TERM_NAME[deg], termDay: d.D, isNow: now.getFullYear() === Y && now.getMonth() + 1 === M }));
  }
  return out;
}
/** 양력 Y년 M월 일진 달력 */
export function dayCalendar(profile, Y, M) {
  const last = new Date(Y, M, 0).getDate();
  const first = new Date(Y, M - 1, 1).getDay();
  const terms = {};
  [mod(315 + (M - 2) * 30, 360), mod(315 + (M - 2) * 30 + 15, 360)].forEach((deg, i) => {
    const jd = solarTermJD(deg, jdFromUT(Y, M, i ? 20 : 5, 0));
    const d = localDateFromJD(jd, 9);
    if (d.Y === Y && d.M === M) terms[d.D] = TERM_NAME[deg];
  });
  const now = new Date();
  const days = [];
  for (let D = 1; D <= last; D++) {
    const idx = mod(jdnFromDate(Y, M, D) + 49, 60);
    const lu = solarToLunar(Y, M, D, 9);
    days.push(lineCol(profile, idx % 10, idx % 12, { day: D, dow: (first + D - 1) % 7, lunar: lu ? `${lu.isLeap ? "윤" : ""}${lu.month}.${lu.day}` : "", term: terms[D] || null,
      isToday: now.getFullYear() === Y && now.getMonth() + 1 === M && now.getDate() === D }));
  }
  return { Y, M, first, days };
}
