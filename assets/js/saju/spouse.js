/* =========================================================
   인연·이상형·배우자 초상 — 사주 기반 '재미·참고용' 해석.
   배우자성(남=재성, 여=관성)의 오행·십신과 배우자궁(일지),
   그리고 매력 신살(도화·홍염·화개)로 이상형과 배우자 이미지를 그린다.
   원칙: 확정 예언 금지. 사주로 상상한 이미지일 뿐, 실제 인물 사진이 아님을 명시.
   ========================================================= */

import { tenGod } from "./fortune.js";
import { analyzeStrength } from "./strength.js";

const STEM_ELEM = ["wood", "wood", "fire", "fire", "earth", "earth", "metal", "metal", "water", "water"];
const BRANCH_ELEM = ["water", "earth", "wood", "wood", "earth", "fire", "fire", "earth", "metal", "metal", "earth", "water"];
const JIJANG_MAIN = [9, 5, 0, 1, 4, 2, 3, 5, 6, 7, 4, 8]; // 지지 정기 stem
const GOD_GROUP = { 비견: "비겁", 겁재: "비겁", 식신: "식상", 상관: "식상", 정재: "재성", 편재: "재성", 정관: "관성", 편관: "관성", 정인: "인성", 편인: "인성" };

/** 사주 전체의 십신 개수(그룹별 + 개별) */
export function godTally(profile) {
  const d = profile.pillars.day.stemIdx;
  const group = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };
  const each = {};
  const add = (g) => { group[GOD_GROUP[g]]++; each[g] = (each[g] || 0) + 1; };
  for (const k of ["year", "month", "day", "hour"]) {
    const p = profile.pillars[k]; if (!p) continue;
    if (k !== "day") add(tenGod(d, p.stemIdx));
    add(tenGod(d, JIJANG_MAIN[p.branchIdx]));
  }
  return { group, each };
}
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const ELEM_KR = { wood: "목(木)", fire: "화(火)", earth: "토(土)", metal: "금(金)", water: "수(水)" };
const BRANCH_H = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

// 홍염살(紅艶殺): 일간 → 지지
const HONGYEOM = [6, 6, 2, 7, 4, 4, 10, 9, 0, 8];
// 도화살(년살)·화개살은 12신살로 판정 (삼합 왕지 기준)
const WANGJI = { 8: 0, 0: 0, 4: 0, 2: 6, 6: 6, 10: 6, 11: 3, 3: 3, 7: 3, 5: 9, 9: 9, 1: 9 };
const mod = (n, m) => ((n % m) + m) % m;
const sinsalName = (base, target) => ["겁살", "재살", "천살", "지살", "도화살", "월살", "망신살", "장성살", "반안살", "역마살", "육해살", "화개살"][mod(target - mod(WANGJI[base] + 5, 12), 12)];

// 배우자성 = 남자는 재성(내가 극하는 오행), 여자는 관성(나를 극하는 오행)
const CTRL = { wood: "earth", fire: "metal", earth: "water", metal: "wood", water: "fire" }; // 내가 극하는
const CTRL_BY = { wood: "metal", fire: "water", earth: "wood", metal: "fire", water: "earth" }; // 나를 극하는
const RESOURCE = { wood: "water", fire: "wood", earth: "fire", metal: "earth", water: "metal" }; // 나를 생하는(인성)
const OUTPUT = { wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood" }; // 내가 생하는(식상)

const ELEM_LOOK = {
  wood: { build: "키가 크고 늘씬한 편, 손발이 곧고 자세가 반듯", vibe: "선하고 성장 지향적", face: "이마가 시원하고 눈매가 부드러운", color: "#6fae7d" },
  fire: { build: "이목구비가 또렷하고 화사한 인상", vibe: "밝고 표현이 풍부한", face: "눈빛이 반짝이고 웃을 때 매력적인", color: "#e08a7a" },
  earth: { build: "체격이 든든하고 안정감 있는", vibe: "믿음직하고 포용력 있는", face: "둥글고 편안해 정이 가는", color: "#d8b878" },
  metal: { build: "선이 분명하고 단정한", vibe: "깔끔하고 자기관리가 확실한", face: "콧대가 서고 인상이 또렷한", color: "#c8ccd2" },
  water: { build: "부드럽고 유연한 실루엣", vibe: "총명하고 분위기 있는", face: "눈매가 그윽하고 피부가 맑은", color: "#7aa0c8" },
};

const IDEAL_BY_GOD = {
  재성: "현실감각이 있고 나를 편안하게 챙겨 주는 사람. 함께 무언가를 만들어 갈 때 안정을 느껴요.",
  관성: "듬직하고 책임감 있는, 나를 이끌어 주면서도 존중해 주는 사람에게 끌려요.",
};

function has(profile, predicateBranch) {
  const P = profile.pillars;
  return ["year", "month", "day", "hour"].some((k) => P[k] && predicateBranch(P[k].branchIdx));
}

/** 매력 신살 — 도화·홍염·화개 유무 */
export function charmSpirits(profile) {
  const P = profile.pillars;
  const dayStem = P.day.stemIdx;
  const yearB = P.year ? P.year.branchIdx : null;
  const dayB = P.day ? P.day.branchIdx : null;
  const branches = ["year", "month", "day", "hour"].filter((k) => P[k]).map((k) => P[k].branchIdx);

  const dohwa = branches.some((b) => (yearB != null && sinsalName(yearB, b) === "도화살") || (dayB != null && sinsalName(dayB, b) === "도화살"));
  const hwagae = branches.some((b) => (yearB != null && sinsalName(yearB, b) === "화개살") || (dayB != null && sinsalName(dayB, b) === "화개살"));
  const hongyeom = branches.includes(HONGYEOM[dayStem]);

  return {
    dohwa, hongyeom, hwagae,
    items: [
      { key: "도화살", on: dohwa, desc: dohwa ? "매력과 인기가 타고났어요. 이성에게 호감을 사고 사람을 끄는 힘이 있어요. (과하면 구설·복잡한 인연을 조심)" : "도화살은 뚜렷하지 않아요. 은근하고 진중하게 매력을 쌓는 타입이에요." },
      { key: "홍염살", on: hongyeom, desc: hongyeom ? "은은한 색기·분위기 미남미녀 기운. 가만히 있어도 눈길을 끄는 매력이 있어요." : "홍염살은 없어요. 화려함보다 편안함으로 다가가는 매력이에요." },
      { key: "화개살", on: hwagae, desc: hwagae ? "예술·감성·영성이 깊어요. 남다른 취향과 재능이 있지만, 고독과 사색을 즐겨 인연에선 마음의 문을 여는 게 관건이에요." : "화개살은 뚜렷하지 않아요. 관계에서 비교적 담백하고 현실적인 편이에요." },
    ],
  };
}

/** 이상형 — 배우자성의 오행·십신으로 */
export function idealType(profile, gender) {
  const dayElem = STEM_ELEM[profile.pillars.day.stemIdx];
  const spouseGod = gender === "male" ? "재성" : "관성";
  const spouseElem = gender === "male" ? CTRL[dayElem] : CTRL_BY[dayElem];
  const look = ELEM_LOOK[spouseElem];
  return {
    god: spouseGod,
    elem: spouseElem, elemKr: ELEM_KR[spouseElem],
    line: IDEAL_BY_GOD[spouseGod],
    look: `${look.vibe} 분위기에, ${look.build} 사람에게 끌리는 편이에요.`,
  };
}

/** 배우자 초상 — 배우자궁(일지)·배우자성 오행으로 이미지를 그린다 */
export function spousePortrait(profile, gender) {
  const dayBranch = profile.pillars.day.branchIdx; // 배우자궁
  const dayElem = STEM_ELEM[profile.pillars.day.stemIdx];
  const spouseElem = gender === "male" ? CTRL[dayElem] : CTRL_BY[dayElem];
  const seatElem = BRANCH_ELEM[dayBranch]; // 배우자궁 오행
  const look = ELEM_LOOK[spouseElem];
  const seat = ELEM_LOOK[seatElem];

  const traits = [
    `${look.face} 얼굴에 ${seat.build} 인상`,
    `${look.vibe} 성향에, ${seat.vibe} 면이 함께 있어요`,
  ];
  const summary = `배우자궁(일지 ${BRANCH_H[dayBranch]})과 배우자성 ${ELEM_KR[spouseElem]}으로 그려 본 이미지예요. ` +
    `${look.face} 얼굴, ${look.build} 몸매의 ${look.vibe} 사람일 가능성이 커요. 첫인상보다 함께 지낼수록 편해지는 인연이에요.`;

  return {
    summary, traits,
    palette: { face: look.color, accent: seat.color },
    elem: spouseElem, hairElem: seatElem === spouseElem ? rotElem(spouseElem, 2) : seatElem, mood: "spouse", seed: seedOf(profile, "spouse"), sex: gender === "male" ? "female" : "male",
    elemKr: ELEM_KR[spouseElem], seatKr: ELEM_KR[seatElem], seatH: BRANCH_H[dayBranch],
  };
}

/** 낮져밤이 — 겉(식상·비겁)과 속(관성·인성)의 균형으로 본 반전 스타일 */
export function dayNightStyle(profile) {
  const { group } = godTally(profile);
  const expr = group.식상 + group.비겁; // 드러남·표현·활동
  const hold = group.관성 + group.인성; // 절제·내면
  let key, title, line;
  if (expr >= hold + 2) { key = "겉바속바"; title = "낮에도 밤에도 직진형"; line = "감정을 숨기지 못해요. 좋으면 티가 나고 표현이 빨라, 밀당보다 솔직한 돌직구가 매력이에요."; }
  else if (hold >= expr + 2) { key = "낮져밤이"; title = "낮엔 얌전, 밤엔 대담"; line = "겉으론 차분하고 예의 바른데, 가까워지면 확 달라지는 반전형이에요. 아는 사람만 아는 매력."; }
  else if (expr >= 3 && hold >= 3) { key = "낮이밤이"; title = "늘 주도하는 타입"; line = "낮이든 밤이든 관계를 리드해요. 에너지가 세서 상대가 끌려오는 편이에요."; }
  else { key = "낮져밤져"; title = "은근·슬로우 스며듦"; line = "천천히 스며드는 타입. 편해지기까지 시간이 걸리지만, 한번 열면 깊고 오래가요."; }
  return { key, title, line, expr, hold };
}

/** 바람기 지수 — 재미용(도덕 판단 아님). 도화·홍염·편재/편관·상관·비겁 과다로 본 '끼'와 '자유분방함' */
export function cheatIndex(profile, gender) {
  const { group, each } = godTally(profile);
  const charm = charmSpirits(profile);
  let s = 24;
  if (charm.dohwa) s += 18;
  if (charm.hongyeom) s += 14;
  s += (each.편재 || 0) * 6 + (each.편관 || 0) * 6; // 다양한 이성 인연 기운
  s += (each.상관 || 0) * 5;                        // 자유분방·구속 싫어함
  s += clamp(group.비겁 - 2, 0, 3) * 4;             // 비겁 과다 = 분산·경쟁
  s -= (each.정관 || 0) * 5 + (each.정재 || 0) * 5;  // 정도·안정 지향
  s = clamp(Math.round(s), 3, 96);
  const tier = s >= 68 ? "높음" : s >= 42 ? "보통" : "낮음";
  const line = s >= 68
    ? "타고난 매력과 자유로운 기질이 커요. 인기가 많은 만큼 유혹도 많아, 관계에선 선을 지키려는 의지가 중요해요."
    : s >= 42
      ? "상황에 따라 흔들릴 여지는 있지만, 대체로 균형을 지키는 편이에요. 마음이 식었을 때가 진짜 고비예요."
      : "한 사람에게 정착하는 안정형이에요. 한눈팔기보다 깊게 오래 가는 걸 편안해해요.";
  return { score: s, tier, line };
}

/** 연애할 사람(끌리는 상대) 초상 — 배우자성 오행 + 도화 기운 */
export function datePortrait(profile, gender) {
  const dayElem = STEM_ELEM[profile.pillars.day.stemIdx];
  const attractElem = gender === "male" ? CTRL[dayElem] : CTRL_BY[dayElem];
  const look = ELEM_LOOK[attractElem];
  return {
    title: "연애할 사람 (끌리는 상대)",
    summary: `${look.face} 얼굴에 ${look.vibe} 분위기의 사람에게 자꾸 눈이 가요. 연애 상대로는 ${look.build} 사람과 자주 엮이는 편이에요.`,
    traits: [`${look.vibe} 매력에 약함`, `${look.build} 스타일에 끌림`],
    palette: { face: look.color, accent: ELEM_LOOK[OUTPUT[dayElem]].color },
    elem: attractElem, hairElem: rotElem(attractElem, 1), mood: "date", seed: seedOf(profile, "date"), sex: gender === "male" ? "female" : "male",
    elemKr: ELEM_KR[attractElem],
  };
}

/** 만나면 안 될 사람(나를 소모시키는 상대) 초상 — 기신 오행 */
export function avoidPortrait(profile, gender) {
  const s = analyzeStrength(profile);
  const dayElem = s.dayElem;
  // 신강이면 나를 더 부추기는 인성, 신약이면 나를 짓누르는 관성이 소모의 축
  const avoidElem = s.strength === "신강" ? RESOURCE[dayElem] : CTRL_BY[dayElem];
  const look = ELEM_LOOK[avoidElem];
  const why = s.strength === "신강"
    ? "이미 강한 나를 더 부추겨, 함께 있으면 고집·과열로 치닫기 쉬운 결이에요."
    : "안 그래도 여린 나를 은근히 짓눌러, 함께 있으면 기가 빨리고 눈치 보게 되는 결이에요.";
  return {
    title: "만나면 안 될 사람 (조심)",
    summary: `${look.face} 얼굴, ${look.vibe} 매력에 처음엔 끌리기 쉬워요. 하지만 ${ELEM_KR[avoidElem]} 기운이 강한 사람은 ${why}`,
    traits: [`${look.vibe} 매력에 홀리기 쉬움`, "처음엔 좋지만 갈수록 소모됨"],
    palette: { face: look.color, accent: "#9a8590" },
    elem: avoidElem, hairElem: rotElem(avoidElem, 3), mood: "avoid", seed: seedOf(profile, "avoid"), sex: gender === "male" ? "female" : "male",
    elemKr: ELEM_KR[avoidElem], warn: true,
  };
}

/* ---------- 초상화 SVG ----------
   오행별 얼굴형·눈매·눈썹·입·헤어스타일을 달리 그려, 결과마다 다른 인상이 보이게 한다.
   (사주로 상상한 일러스트일 뿐 실제 인물이 아님) */
function seedOf(profile, kind) {
  const P = profile.pillars; const key = [P.year, P.month, P.day, P.hour].filter(Boolean).map((x) => x.gz).join("") + kind;
  let h = 2166136261 >>> 0; for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0;
}
const ELEM_ORDER = ["wood", "fire", "earth", "metal", "water"];
function rotElem(e, n) { return ELEM_ORDER[(ELEM_ORDER.indexOf(e) + n) % 5]; }
const HAIR_COLORS = ["#1b1716", "#2f2220", "#4a3326", "#6a4a36", "#3a2a2a", "#5c2f25", "#231d24"];
const SKINS = [["#f8e3d4", "#e6bfa5"], ["#f3d6c2", "#dfb192"], ["#ecc9ad", "#d29f7d"], ["#e0b594", "#c38b67"], ["#f6dccb", "#e4b69b"]];
const HAIR_COLOR = { wood: "#3b2a1e", fire: "#6a2c1c", earth: "#4a3526", metal: "#1c1c22", water: "#22283a" };
const ELEM_HANJA = { wood: "木", fire: "火", earth: "土", metal: "金", water: "水" };
const FACE = {
  earth: `<ellipse cx="100" cy="95" rx="38" ry="40"/>`,
  wood: `<ellipse cx="100" cy="95" rx="32" ry="44"/>`,
  water: `<ellipse cx="100" cy="95" rx="35" ry="42"/>`,
  fire: `<path d="M65 84 Q65 53 100 53 Q135 53 135 84 Q135 114 100 137 Q65 114 65 84Z"/>`,
  metal: `<path d="M66 80 Q66 53 100 53 Q134 53 134 80 L132 104 Q126 127 100 137 Q74 127 68 104Z"/>`,
};
const HAIR = {
  female: {
    wood: { back: "M57 82 Q57 42 100 42 Q143 42 143 82 L147 196 L53 196Z", front: "M60 86 Q61 45 100 45 Q139 45 140 86 Q127 63 98 61 Q78 63 60 86Z" },
    fire: { back: "M50 86 Q46 38 100 38 Q154 38 150 86 Q162 110 151 132 Q162 154 146 176 L54 176 Q38 154 49 132 Q38 110 50 86Z", front: "M61 88 Q58 46 100 46 Q142 46 139 88 Q131 66 113 61 Q96 75 76 69 Q66 76 61 88Z" },
    earth: { back: "M57 92 Q55 45 100 45 Q145 45 143 92 L145 126 Q131 132 120 124 L80 124 Q69 132 55 126Z", front: "M61 86 Q59 47 100 47 Q141 47 139 86 Q121 73 100 75 Q79 73 61 86Z" },
    metal: { back: "M59 90 Q57 45 100 45 Q143 45 141 90 L141 120 L127 120 L127 102 L73 102 L73 120 L59 120Z", front: "M61 88 Q61 47 104 47 Q141 49 139 88 Q129 61 95 63 Q75 69 61 88Z" },
    water: { back: "M56 84 Q56 42 100 42 Q144 42 144 84 Q150 120 142 150 Q152 176 140 200 L60 200 Q48 176 58 150 Q50 120 56 84Z", front: "M60 90 Q60 45 100 45 Q140 45 140 90 Q134 66 116 60 Q104 70 86 64 Q66 70 60 90Z" },
    pony: { back: "M128 66 Q162 86 152 150 Q146 176 132 160 Q146 116 124 82Z", front: "M62 92 Q60 46 100 44 Q140 46 138 92 Q134 60 100 56 Q66 60 62 92Z" },
    pixie: { back: "", front: "M61 94 Q57 45 100 41 Q145 45 139 94 Q137 66 118 60 Q100 74 80 64 Q66 72 61 94Z" },
    layer: { back: "M56 88 Q54 42 100 42 Q146 42 144 88 L152 152 Q132 140 120 152 L80 152 Q68 140 48 152Z", front: "M60 90 Q60 45 100 45 Q140 45 140 90 Q128 60 104 60 Q108 72 96 76 Q88 64 60 90Z" },
  },
  male: {
    wood: { back: "", front: "M63 86 Q61 45 100 43 Q141 45 137 84 Q133 63 118 59 Q96 66 72 63 Q65 72 63 86Z" },
    fire: { back: "", front: "M63 86 Q59 52 84 44 Q98 34 118 40 Q142 46 137 86 Q132 64 116 58 Q104 66 88 60 Q70 64 63 86Z" },
    earth: { back: "", front: "M63 84 Q61 47 100 47 Q139 47 137 84 Q127 63 100 63 Q73 63 63 84Z" },
    metal: { back: "", front: "M65 82 L65 60 Q71 43 104 43 Q137 45 135 66 L135 82 Q129 59 100 59 Q77 59 65 82Z" },
    water: { back: "M59 94 Q57 45 100 45 Q143 45 141 94 L137 106 L63 106Z", front: "M61 90 Q59 47 100 47 Q141 47 139 90 Q131 70 111 70 Q97 79 85 70 Q70 74 61 90Z" },
    twoblock: { back: "", front: "M62 88 Q60 46 100 44 Q140 46 138 88 Q134 72 128 70 Q110 78 86 70 Q70 72 62 88Z" },
    buzz: { back: "", front: "M64 80 Q62 50 100 48 Q138 50 136 80 Q120 62 100 62 Q80 62 64 80Z" },
    longwave: { back: "M58 96 Q54 44 100 44 Q146 44 142 96 Q148 122 138 136 L62 136 Q52 122 58 96Z", front: "M60 92 Q58 48 100 46 Q142 48 140 92 Q132 64 110 62 Q98 74 86 66 Q66 70 60 92Z" },
  },
};
/* ---------- 반실사 초상 ----------
   실제 얼굴 비율(눈 위치·코·입술·음영)로 그린 일러스트. 오행별로 얼굴형·눈매·코·입술이 다르다. */
const FACE_P = { // w: 광대 폭, jaw: 턱선 폭, chin: 턱 끝 y, cw: 턱 끝 폭
  wood: { w: 31, jaw: 25, chin: 158, cw: 9 },
  fire: { w: 34, jaw: 20, chin: 152, cw: 5 },
  earth: { w: 37, jaw: 33, chin: 150, cw: 14 },
  metal: { w: 35, jaw: 33, chin: 153, cw: 12 },
  water: { w: 33, jaw: 25, chin: 154, cw: 9 },
};
const EYE_P = { // w 반폭, h 높이, t 눈꼬리(음수=올라감), crease 쌍꺼풀
  wood: { w: 8.5, h: 5.2, t: 0, crease: true },
  fire: { w: 9, h: 6.6, t: -1, crease: true },
  earth: { w: 8.2, h: 5.4, t: 1.2, crease: true },
  metal: { w: 9.2, h: 4, t: -2.6, crease: false },
  water: { w: 8.6, h: 4.6, t: 1.6, crease: false },
};
const LIP_P = { wood: { w: 11, u: 3.2, l: 4.5 }, fire: { w: 12, u: 4, l: 6 }, earth: { w: 13, u: 3.2, l: 5 }, metal: { w: 11.5, u: 2.4, l: 3.6 }, water: { w: 10, u: 3.6, l: 5.4 } };
const NOSE_W = { wood: 7, fire: 7.5, earth: 9, metal: 7, water: 7.5 };

function facePath(f, male) {
  const w = f.w + (male ? 2 : 0), jaw = f.jaw + (male ? 4 : 0), cw = f.cw + (male ? 2 : 0), top = 44, cy = 102, ch = f.chin + (male ? 2 : 0);
  return `M100 ${top} C${100 + w * 0.95} ${top} ${100 + w} ${top + 24} ${100 + w} ${cy} C${100 + w} ${cy + 22} ${100 + jaw} ${ch - 16} ${100 + cw} ${ch - 3} Q100 ${ch + 2} ${100 - cw} ${ch - 3} C${100 - jaw} ${ch - 16} ${100 - w} ${cy + 22} ${100 - w} ${cy} C${100 - w} ${top + 24} ${100 - w * 0.95} ${top} 100 ${top}Z`;
}
function eyeSvg(x, e, side, uid, male, iris) {
  const y = 104, w = e.w, h = e.h, t = e.t * side; // side: -1 왼쪽, 1 오른쪽 (눈꼬리는 바깥쪽)
  const inX = x - w * side, outX = x + w * side;
  const outY = y + t;
  const shape = `M${inX} ${y} Q${x} ${y - h * 1.25} ${outX} ${outY} Q${x} ${y + h * 0.8} ${inX} ${y}Z`;
  const id = `${uid}e${side}`;
  const r = Math.min(h * 0.95, 4.6);
  return `<clipPath id="${id}"><path d="${shape}"/></clipPath>
    <path d="${shape}" fill="#f7f1ec"/>
    <g clip-path="url(#${id})"><circle cx="${x + side * 0.4}" cy="${y - 0.3}" r="${r}" fill="${iris}"/><circle cx="${x + side * 0.4}" cy="${y - 0.3}" r="${r * 0.48}" fill="#140e0c"/><circle cx="${x + side * 0.4 + 1.3}" cy="${y - 1.6}" r="1.1" fill="#fff" opacity=".9"/>
      <path d="M${inX} ${y - h} L${outX} ${outY - h} L${outX} ${outY - h * 0.2} Q${x} ${y - h * 0.9} ${inX} ${y - h * 0.1}Z" fill="#6b4a3c" opacity=".18"/></g>
    <path d="M${inX} ${y} Q${x} ${y - h * 1.25} ${outX} ${outY}" stroke="#2a1d19" stroke-width="${male ? 1.5 : 1.9}" fill="none" stroke-linecap="round"/>
    ${male ? "" : `<path d="M${outX - side * 1} ${outY - 0.6} l${side * 2.6} -1.8" stroke="#2a1d19" stroke-width="1.2" stroke-linecap="round"/>`}
    <path d="M${inX + side * 2} ${y + 1.2} Q${x} ${y + h * 0.95} ${outX - side * 1} ${outY + 0.8}" stroke="#a9745f" stroke-width=".8" fill="none" opacity=".7"/>
    ${e.crease ? `<path d="M${inX + side * 2} ${y - h * 0.9} Q${x} ${y - h * 1.95} ${outX} ${outY - h * 0.55}" stroke="#b07f6a" stroke-width=".9" fill="none" opacity=".8"/>` : ""}`;
}
function browSvg(x, elem, side, hair, male, mood, th0, lift = 0) {
  const y = 90 - (elem === "fire" ? 1.5 : 0) - lift * 0.5;
  const inX = x - 10 * side, outX = x + 10 * side;
  let peakY = -lift + { wood: y - 3.5, fire: y - 5, earth: y - 1.5, metal: y - 4, water: y - 2 }[elem];
  let outY = { wood: y + 0.5, fire: y + 1, earth: y + 1.5, metal: y + 0.5, water: y + 2 }[elem];
  if (mood === "avoid" && side === 1) { peakY -= 3; outY -= 2; }
  const th = th0 || (male ? 3.2 : 2.3);
  return `<path d="M${inX} ${y + 1} Q${x + side * 1} ${peakY - th / 2} ${outX} ${outY} Q${x + side * 1} ${peakY + th / 2} ${inX} ${y + 1 + th}Z" fill="${hair}" opacity=".92"/>`;
}
function noseSvg(n, shade) {
  const nw = n.w, dy = n.y - 124;
  return `<g transform="translate(0 ${dy})"><path d="M96 ${100 - dy} Q94.5 114 93 121" stroke="${shade}" stroke-width="1.4" fill="none" opacity=".55" stroke-linecap="round"/>
    <path d="M${100 - nw} 124 Q${100 - nw - 1.5} 129 ${100 - nw * 0.45} 129.5 Q100 131 ${100 + nw * 0.45} 129.5 Q${100 + nw + 1.5} 129 ${100 + nw} 124" stroke="${shade}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <ellipse cx="${100 - nw * 0.45}" cy="128.3" rx="1.6" ry="0.9" fill="#8a5a4a" opacity=".55"/><ellipse cx="${100 + nw * 0.45}" cy="128.3" rx="1.6" ry="0.9" fill="#8a5a4a" opacity=".55"/>
    <ellipse cx="100" cy="124" rx="2.6" ry="2" fill="#fff" opacity=".22"/></g>`;
}
function lipsSvg(L, male, mood) {
  const y = 140, w = L.w - (male ? 1 : 0);
  const up = male ? "#b77a6c" : "#c9646b", lo = male ? "#c98c7e" : "#d8787c";
  let lc = 0, rc = 0; // 입꼬리
  if (mood === "date") { lc = -2; rc = -2; }
  if (mood === "avoid") { lc = 0.5; rc = -2.6; }
  return `<path d="M${100 - w} ${y + lc} Q${100 - w * 0.45} ${y - L.u - 0.5} ${100 - 1.5} ${y - L.u + 1} Q100 ${y - L.u + 1.8} ${100 + 1.5} ${y - L.u + 1} Q${100 + w * 0.45} ${y - L.u - 0.5} ${100 + w} ${y + rc} Q100 ${y + 1} ${100 - w} ${y + lc}Z" fill="${up}"/>
    <path d="M${100 - w} ${y + lc} Q100 ${y + 1} ${100 + w} ${y + rc} Q${100 + w * 0.5} ${y + L.l} 100 ${y + L.l + 0.6} Q${100 - w * 0.5} ${y + L.l} ${100 - w} ${y + lc}Z" fill="${lo}"/>
    <path d="M${100 - w} ${y + lc} Q100 ${y + 1.4} ${100 + w} ${y + rc}" stroke="#7a3b38" stroke-width="1" fill="none" opacity=".75"/>
    <ellipse cx="100" cy="${y + L.l * 0.55}" rx="${w * 0.35}" ry="1" fill="#fff" opacity=".25"/>`;
}
const IRIS = { wood: "#4a3325", fire: "#5a3620", earth: "#4d3a2a", metal: "#2e2724", water: "#3a2f2c" };

function drawPortraitSvg(p, H = 240) {
  const elem = p.elem || "earth";
  const male = p.sex === "male";
  const sex = male ? "male" : "female";
  const mood = p.mood || "date";
  const uid = "pt" + Math.random().toString(36).slice(2, 8);
  // 시드 — 같은 사람·같은 초상은 늘 같은 얼굴, 다른 초상은 다른 얼굴
  let sd = (p.seed != null ? p.seed : Math.floor(Math.random() * 1e9)) >>> 0;
  const rnd = () => { sd = (Math.imul(sd ^ (sd >>> 15), 2246822519) + 0x9e3779b9) >>> 0; return (sd % 10000) / 10000; };
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const vary = (v, d) => v + (rnd() * 2 - 1) * d;

  const styles = Object.keys(HAIR[sex]);
  const baseIdx = styles.indexOf(p.hairElem || elem);
  const hs = HAIR[sex][styles[(baseIdx + Math.floor(rnd() * 3) * 2) % styles.length]];
  const hair = pick(HAIR_COLORS);
  const [skinL, skinD] = pick(SKINS);
  const cloth = mood === "avoid" ? "#3f3746" : p.palette.face, bg = p.palette.accent;
  const F0 = FACE_P[elem];
  const f = { w: vary(F0.w, 3), jaw: vary(F0.jaw, 4), chin: vary(F0.chin, 5), cw: Math.max(3, vary(F0.cw, 3)) };
  const E0 = EYE_P[elem], es = vary(1, 0.16);
  const e = { w: E0.w * es, h: E0.h * vary(es, 0.12), t: vary(E0.t, 1.2), crease: rnd() < (E0.crease ? 0.8 : 0.3) };
  const eyeGap = vary(18, 2.2);
  const browTh = (male ? 3.2 : 2.2) * vary(1, 0.3);
  const browLift = vary(0, 2.2);
  const nose = { w: NOSE_W[elem] * vary(1, 0.18), y: vary(124, 3) };
  const lip = { ...LIP_P[elem], w: LIP_P[elem].w * vary(1, 0.14), u: LIP_P[elem].u * vary(1, 0.25), l: LIP_P[elem].l * vary(1, 0.25) };
  const iris = pick(["#4a3325", "#5a3620", "#3a2f2c", "#2e2724", "#6a4a2c"]);
  const stubble = male && rnd() < 0.35;
  const shade = "#c08a70";
  const face = facePath(f, male);
  const hairT = `translate(100 100) scale(1.1 1.17) translate(-100 -95)`;
  const earX = f.w + (male ? 2 : 0);
  const shoulders = male ? `M30 ${H} Q34 192 76 181 L100 188 L124 181 Q166 192 170 ${H}Z` : `M38 ${H} Q42 194 80 183 Q100 196 120 183 Q158 194 162 ${H}Z`;
  return `<svg viewBox="0 0 200 ${H}" width="100%" height="${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="사주로 그려 본 ${p.elemKr || ""} 기운의 ${male ? "남성" : "여성"} 초상 일러스트">
    <defs>
      <linearGradient id="${uid}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg}" stop-opacity=".5"/><stop offset="1" stop-color="#1c1620" stop-opacity=".6"/></linearGradient>
      <radialGradient id="${uid}s" cx=".45" cy=".42" r=".65"><stop offset="0" stop-color="${skinL}"/><stop offset=".7" stop-color="#efcbb3"/><stop offset="1" stop-color="${skinD}"/></radialGradient>
      <linearGradient id="${uid}h" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${hair}"/><stop offset=".45" stop-color="${hair}" stop-opacity=".82"/><stop offset="1" stop-color="#0d0a0a"/></linearGradient>
      <linearGradient id="${uid}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${cloth}"/><stop offset="1" stop-color="#1a151c" stop-opacity=".85"/></linearGradient>
      <clipPath id="${uid}r"><rect width="200" height="${H}" rx="18"/></clipPath>
    </defs>
    <g clip-path="url(#${uid}r)">
      <rect width="200" height="${H}" fill="url(#${uid}b)"/>
      ${hs.back ? `<path d="${hs.back}" fill="url(#${uid}h)" transform="${hairT}"/>` : ""}
      <path d="${shoulders}" fill="url(#${uid}c)"/>
      <path d="M86 140 L86 178 Q100 192 114 178 L114 140Z" fill="${skinD}"/>
      <path d="M86 150 Q100 166 114 150 L114 160 Q100 172 86 160Z" fill="#b98468" opacity=".45"/>
      ${male ? `<path d="M80 181 L100 204 L93 186Z M120 181 L100 204 L107 186Z" fill="#f2efe9"/>` : `<path d="M82 182 Q100 200 118 182" stroke="${cloth}" stroke-width="3" fill="none"/>`}
      <ellipse cx="${100 - earX}" cy="110" rx="5.5" ry="10" fill="${skinD}"/><ellipse cx="${100 + earX}" cy="110" rx="5.5" ry="10" fill="${skinD}"/>
      <path d="${face}" fill="url(#${uid}s)"/>
      <path d="${face}" fill="none" stroke="#c48c70" stroke-width=".8" opacity=".5"/>
      <ellipse cx="${100 - f.w * 0.62}" cy="124" rx="9" ry="6" fill="${male ? "#d9967e" : "#ef9a93"}" opacity="${male ? ".12" : ".28"}"/>
      <ellipse cx="${100 + f.w * 0.62}" cy="124" rx="9" ry="6" fill="${male ? "#d9967e" : "#ef9a93"}" opacity="${male ? ".12" : ".28"}"/>
      <path d="M${100 - f.w + 3} 112 Q${100 - f.jaw + 4} 140 ${100 - f.cw} ${f.chin - 4}" stroke="#c28a6e" stroke-width="5" fill="none" opacity=".18"/>
      <path d="M${100 + f.w - 3} 112 Q${100 + f.jaw - 4} 140 ${100 + f.cw} ${f.chin - 4}" stroke="#c28a6e" stroke-width="5" fill="none" opacity=".18"/>
      ${browSvg(100 - eyeGap, elem, -1, hair, male, mood, browTh, browLift)}${browSvg(100 + eyeGap, elem, 1, hair, male, mood, browTh, browLift)}
      ${eyeSvg(100 - eyeGap, e, -1, uid, male, iris)}${eyeSvg(100 + eyeGap, e, 1, uid, male, iris)}
      ${noseSvg(nose, shade)}
      ${lipsSvg(lip, male, mood)}${stubble ? `<path d="M${100 - f.jaw + 2} 128 Q${100 - f.jaw + 4} ${f.chin - 6} 100 ${f.chin + 1} Q${100 + f.jaw - 4} ${f.chin - 6} ${100 + f.jaw - 2} 128 Q100 150 ${100 - f.jaw + 2} 128Z" fill="#5a4a44" opacity=".13"/>` : ""}
      <path d="${hs.front}" fill="url(#${uid}h)" transform="${hairT}"/>
      <circle cx="26" cy="26" r="15" fill="rgba(0,0,0,.32)"/>
      <text x="26" y="31.5" text-anchor="middle" font-size="16" font-weight="700" fill="#fff" font-family="serif">${ELEM_HANJA[elem]}</text>
    </g>
  </svg>`;
}

/* 실사 얼굴 이미지 — 성별마다 이미지 시트 한 장 (파일 수 줄이기)
   assets/img/face-female.webp · male.webp : 5열(목·화·토·금·수) × 3행(1=연애할 사람, 2=결혼할 배우자, 3=만나면 안 될 사람)
   FACE_HAVE 에 있는 칸만 사진으로 쓰고, 없으면 일러스트로 대신한다. (사진 추가 시 이 목록도 같이 갱신) */
const FACE_COLS = ["wood", "fire", "earth", "metal", "water"];
const FACE_HAVE = {
  female: ["wood-1", "wood-2", "wood-3", "fire-1", "fire-2", "fire-3", "earth-1", "earth-2", "earth-3", "metal-1", "metal-2", "metal-3", "water-1", "water-2", "water-3"],
  male: ["wood-1", "wood-2", "wood-3", "fire-1", "fire-2", "fire-3", "earth-1", "earth-2", "earth-3", "metal-1", "metal-2", "metal-3", "water-1", "water-2", "water-3"],
};
const MOOD_IDX = { date: 1, spouse: 2, avoid: 3 };
export function portraitSvg(p, H = 240) {
  const sex = p.sex === "male" ? "male" : "female";
  const elem = p.elem || "earth";
  let row = MOOD_IDX[p.mood] || 1;
  const have = FACE_HAVE[sex] || [];
  if (!have.includes(`${elem}-${row}`)) row = have.includes(`${elem}-1`) ? 1 : 0;
  if (!row) return drawPortraitSvg(p, H);
  const col = FACE_COLS.indexOf(elem);
  const bg = `background-image:url('assets/img/face-${sex}.webp');background-repeat:no-repeat;background-size:500% 300%;background-position:${col * 25}% ${(row - 1) * 50}%;`;
  return `<div class="pt-wrap" role="img" aria-label="사주로 그려 본 ${p.elemKr || ""} 기운의 인상 이미지 (AI로 만든 가상 인물)" style="width:100%; max-width:${Math.round(H * 300 / 350)}px; margin:0 auto; aspect-ratio:300/350; border-radius:18px; ${bg}"></div>`;
}
