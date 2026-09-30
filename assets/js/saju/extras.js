/* =========================================================
   부가 운세 — 띠(60간지) · 별자리 · 바이오리듬.
   모두 생년월일로 계산. 재미·참고용.
   ========================================================= */

import { majorBgStyle } from "../tarot/cardArt.js";
import { computeSaju } from "./manse.js";
import { tenGod } from "./fortune.js";

/* ---------------- 띠 (60간지) ---------------- */
const ZODIAC = ["쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양", "원숭이", "닭", "개", "돼지"];
const ZTRAIT = {
  쥐: { p: "영리하고 재빨라 기회를 잘 잡아요.", s: "적응력·생활력·눈치", c: "잔걱정이 많고 인색해 보일 수 있어요." },
  소: { p: "성실하고 뚝심 있게 밀고 나가요.", s: "끈기·신뢰·인내", c: "고집스럽고 변화에 느릴 수 있어요." },
  호랑이: { p: "당당하고 추진력 있는 리더예요.", s: "용기·카리스마·정의감", c: "욱하거나 독단이 될 수 있어요." },
  토끼: { p: "온화하고 센스 있어 인기가 많아요.", s: "친화력·감각·배려", c: "우유부단하고 상처를 잘 받아요." },
  용: { p: "스케일이 크고 자신감이 넘쳐요.", s: "야망·매력·주도력", c: "허세·기복이 클 수 있어요." },
  뱀: { p: "깊고 지혜로우며 통찰이 뛰어나요.", s: "직관·집중·신비로움", c: "속을 잘 안 보여 오해받기도." },
  말: { p: "밝고 활동적이며 자유로워요.", s: "열정·추진·사교성", c: "싫증을 잘 내고 참을성이 약해요." },
  양: { p: "부드럽고 예술적이며 정이 많아요.", s: "감성·배려·심미안", c: "의존적이고 걱정이 많아요." },
  원숭이: { p: "재치 있고 영리해 문제 해결이 빨라요.", s: "기지·응용력·유머", c: "변덕·잔꾀로 보일 수 있어요." },
  닭: { p: "부지런하고 꼼꼼하며 완벽을 추구해요.", s: "성실·계획·미의식", c: "잔소리·비판이 셀 수 있어요." },
  개: { p: "의리 있고 정직하며 헌신적이에요.", s: "충실·정의·책임감", c: "예민하고 걱정을 안고 살아요." },
  돼지: { p: "너그럽고 복스러우며 정이 깊어요.", s: "포용·재복·낙천", c: "물러 터지거나 과하게 베풀어요." },
};
// 지지 관계: 삼합/육합/충/해
const HAP6 = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]];
const SAMHAP = [[8, 0, 4], [2, 6, 10], [5, 9, 1], [11, 3, 7]];
const HAE = [[0, 7], [1, 6], [2, 5], [3, 4], [8, 11], [9, 10]];
const inP = (list, a, b) => list.some((p) => (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a));
function branchRel(a, b) {
  if (Math.abs(a - b) === 6) return { rel: "충", good: false, line: "부딪힘·변동이 큰 날. 감정이 앞서기 쉬워요." };
  if (inP(HAP6, a, b)) return { rel: "육합", good: true, line: "잘 맞고 편안한 날. 인연·협력이 순조로워요." };
  if (SAMHAP.some((g) => g.includes(a) && g.includes(b)) && a !== b) return { rel: "삼합", good: true, line: "기운이 잘 통해 일이 술술 풀리는 날." };
  if (inP(HAE, a, b)) return { rel: "해", good: false, line: "사소한 마찰·오해를 조심할 날." };
  if (a === b) return { rel: "동일", good: true, line: "내 기운이 도드라지는 날. 주도적으로!" };
  return { rel: "무난", good: true, line: "무난한 하루. 평소 페이스대로 가면 좋아요." };
}

export function zodiacFortune(profile, today = new Date()) {
  const yb = profile.pillars.year.branchIdx;
  const p = (n) => String(n).padStart(2, "0");
  const t = computeSaju({ calendarType: "solar", birthDate: `${today.getFullYear()}-${p(today.getMonth() + 1)}-${p(today.getDate())}`, birthTime: "12:00", timeUnknown: true, gender: "male", timezone: "Asia/Seoul" });
  const tb = t.pillars.day.branchIdx;
  const rel = branchRel(yb, tb);
  const tr = ZTRAIT[ZODIAC[yb]];
  return {
    name: ZODIAC[yb] + "띠", gapja: profile.pillars.year.gz + "년생",
    persona: tr.p, strength: tr.s, caution: tr.c,
    todayRel: rel.rel, todayGood: rel.good, todayLine: rel.line,
    todayZodiac: ZODIAC[tb] + "띠",
    score: rel.good ? 66 + (tb % 5) * 4 : 44 + (tb % 5) * 3,
  };
}

/* ---------------- 별자리 ---------------- */
const SIGNS = [
  { name: "물병자리", from: [1, 20], to: [2, 18], p: "독창적이고 자유로운 아이디어 뱅크예요.", love: "친구 같은 편안한 연애를 좋아해요." },
  { name: "물고기자리", from: [2, 19], to: [3, 20], p: "감성 깊고 상상력이 풍부해요.", love: "헌신적이고 낭만적인 사랑을 해요." },
  { name: "양자리", from: [3, 21], to: [4, 19], p: "열정적이고 도전을 즐겨요.", love: "직진! 솔직하고 빠른 연애." },
  { name: "황소자리", from: [4, 20], to: [5, 20], p: "안정적이고 끈기 있어요.", love: "느리지만 깊고 오래가는 사랑." },
  { name: "쌍둥이자리", from: [5, 21], to: [6, 21], p: "호기심 많고 말솜씨가 좋아요.", love: "지루할 틈 없는 대화형 연애." },
  { name: "게자리", from: [6, 22], to: [7, 22], p: "따뜻하고 가족적이에요.", love: "포근하게 챙겨주는 사랑." },
  { name: "사자자리", from: [7, 23], to: [8, 22], p: "당당하고 주목받는 걸 즐겨요.", love: "표현 확실한 화려한 연애." },
  { name: "처녀자리", from: [8, 23], to: [9, 22], p: "꼼꼼하고 분석적이에요.", love: "세심하게 챙기는 현실 연애." },
  { name: "천칭자리", from: [9, 23], to: [10, 22], p: "균형 감각과 미적 센스가 좋아요.", love: "매너 있고 조화로운 사랑." },
  { name: "전갈자리", from: [10, 23], to: [11, 22], p: "깊고 강렬하며 집중력이 커요.", love: "올인하는 진한 연애." },
  { name: "사수자리", from: [11, 23], to: [12, 24], p: "자유롭고 낙천적인 모험가예요.", love: "구속 없는 쿨한 연애." },
  { name: "염소자리", from: [12, 25], to: [1, 19], p: "성실하고 목표 지향적이에요.", love: "진지하고 책임감 있는 사랑." },
];
export function starSign(profile) {
  const s = profile.solar; const m = s.M, d = s.D;
  const sign = SIGNS.find((sg) => {
    const [fm, fd] = sg.from, [tm, td] = sg.to;
    if (fm === tm) return m === fm && d >= fd && d <= td;
    if (fm < tm) return (m === fm && d >= fd) || (m === tm && d <= td) || (m > fm && m < tm);
    return (m === fm && d >= fd) || (m === tm && d <= td); // 해 넘어감(염소)
  }) || SIGNS[0];
  return { name: sign.name, persona: sign.p, love: sign.love, date: `${m}월 ${d}일생` };
}

/* ---------------- 십신 그룹(공용) ---------------- */
const GEN2 = { wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood" };
const CTRL2 = { wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood" };
const CTRL_BY2 = { wood: "metal", fire: "water", earth: "wood", metal: "fire", water: "earth" };
const RES2 = { wood: "water", fire: "wood", earth: "fire", metal: "earth", water: "metal" };
function sipG(profile) {
  const e = profile.dayMasterElem, c = profile.elementCounts || {};
  return { peer: c[e] || 0, output: c[GEN2[e]] || 0, wealth: c[CTRL2[e]] || 0, officer: c[CTRL_BY2[e]] || 0, resource: c[RES2[e]] || 0 };
}
function hashN(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0x7fffffff; return h; }
const clampS = (n) => Math.max(28, Math.min(98, Math.round(n)));

/* ---------------- 매력 스타일 가이드 — 일간 오행 + 매력 기운 ---------------- */
const CHARM_STYLE = {
  wood: {
    talk: ["상대의 목표·요즘 하는 일을 먼저 물어보는 말투가 잘 통해요.", "‘그거 좋다, 해 보자’처럼 응원하고 같이 시작하자는 말이 매력 포인트예요.", "너무 가르치듯 말하는 건 피하기 — 조언보다 공감 먼저."],
    look: ["색: 올리브·세이지 그린, 베이지, 크림", "스타일: 셔츠·니트·린넨처럼 자연스러운 소재, 깔끔한 일자 실루엣", "헤어: 결 살린 생머리나 자연스러운 C컬, 이마가 살짝 보이게", "향: 우디·그린티·풀내음 계열"],
  },
  fire: {
    talk: ["리액션을 크게 — 웃음과 감탄이 당신의 최대 무기예요.", "칭찬은 바로바로, 구체적으로 (‘오늘 그 색 진짜 잘 어울린다’).", "흥분해서 말이 빨라질 땐 한 박자 쉬고 상대 말을 끝까지 들어 주기."],
    look: ["색: 코랄·레드 포인트, 화이트, 선명한 컬러 한 가지", "스타일: 포인트 아이템 하나(립·가방·니트)로 시선 모으기", "헤어: 볼륨감 있는 웨이브나 생기 있는 컬", "향: 시트러스·스파이시·과일 계열"],
  },
  earth: {
    talk: ["느긋하고 차분한 말투, 약속을 꼭 지키는 모습이 신뢰를 줘요.", "‘밥은 먹었어?’처럼 일상을 챙기는 한마디가 가장 강해요.", "다 맞춰 주기만 하지 말고, 내 취향도 가끔 분명하게 말하기."],
    look: ["색: 카멜·브라운·아이보리·베이지 톤온톤", "스타일: 부드러운 니트·가디건·코트, 편안하지만 단정하게", "헤어: 단정한 단발이나 자연스러운 웨이브, 둥근 느낌", "향: 바닐라·머스크·파우더리 계열"],
  },
  metal: {
    talk: ["짧고 분명한 말투 — 빈말 없이 진심만 말하는 게 매력이에요.", "내 기준과 취향을 또렷하게 말할수록 더 궁금해해요.", "평가하는 말투(‘그건 아니지’)는 부드럽게 바꾸기 — ‘나는 이게 더 좋더라’."],
    look: ["색: 화이트·그레이·블랙·실버, 모노톤", "스타일: 재킷·셔츠처럼 선이 분명한 옷, 미니멀한 액세서리", "헤어: 깔끔한 단발·슬릭한 스타일·투블럭, 잔머리 정리", "향: 깨끗한 코튼·알데하이드·화이트 머스크"],
  },
  water: {
    talk: ["천천히, 낮은 톤으로 — 여운을 남기는 말투가 잘 어울려요.", "상대 감정을 먼저 알아봐 주는 공감형 대화가 강점이에요.", "속마음을 너무 숨기면 무관심으로 오해받으니, 좋을 땐 좋다고 말하기."],
    look: ["색: 네이비·딥블루·블랙·차콜", "스타일: 흐르는 소재(실크·저지), 톤 다운된 무드", "헤어: 긴 웨이브나 자연스럽게 떨어지는 머리, 촉촉한 광", "향: 아쿠아·머스크·은은한 플로럴"],
  },
};
export function charmStyle(profile) {
  const e = profile.dayMasterElem;
  const s = sipG(profile);
  const extra = s.output >= 2 ? "표현의 기운이 강해서, 말과 리액션이 곧 매력이에요. 대화할 때 가장 빛나요."
    : s.wealth >= 2 ? "함께하는 시간을 즐겁게 만드는 힘이 있어요. 같이 뭔가를 ‘해 보는’ 데이트가 잘 맞아요."
      : s.resource >= 2 ? "품어 주는 분위기가 매력이에요. 차분하게 들어 주는 모습에 상대가 마음을 열어요."
        : s.officer >= 2 ? "단정하고 믿음직한 인상이 매력이에요. 흐트러짐 없는 모습이 신뢰를 줘요."
          : "자연스러운 모습이 제일 매력적인 타입이에요. 과한 꾸밈보다 나다운 스타일이 통해요.";
  return { ...CHARM_STYLE[e], extra };
}

/* ---------------- 매력 지수 (오늘/이달) ---------------- */
export function charmIndex(profile, period = "today", today = new Date()) {
  const s = sipG(profile);
  // 도화(자오묘유) 개수
  const dohwa = [profile.pillars.year, profile.pillars.month, profile.pillars.day, profile.pillars.hour]
    .filter(Boolean).filter((p) => [0, 3, 6, 9].includes(p.branchIdx)).length;
  const base = 46 + dohwa * 9 + s.output * 5 + s.wealth * 4;
  const key = period === "today" ? `${today.getFullYear()}${today.getMonth()}${today.getDate()}` : `${today.getFullYear()}${today.getMonth()}`;
  const j = hashN((profile.pillars.day.gz || "") + key) % 16 - 6;
  const score = clampS(base + j);
  const grade = score >= 88 ? "A+" : score >= 78 ? "A" : score >= 68 ? "A-" : score >= 58 ? "B+" : score >= 48 ? "B" : "C";
  return {
    period, label: period === "today" ? "오늘" : "이달",
    score, grade,
    line: score >= 78 ? "매력이 반짝이는 시기! 사람들이 당신에게 끌려요. 먼저 다가가도 좋아요."
      : score >= 58 ? "은은한 매력이 통하는 흐름이에요. 자연스러운 모습이 제일 예뻐요."
        : "무리해서 어필하기보다 나를 가꾸며 컨디션을 채울 때예요.",
    tip: dohwa >= 2 ? "타고난 도화(매력) 기운이 있어 표현할수록 빛나요." : "말·스타일에 조금만 신경 쓰면 호감도가 확 올라요.",
  };
}

/* ---------------- 행운 카드 (오늘의 럭키 타로) ---------------- */
const MAJORS = ["바보", "마법사", "여사제", "여황제", "황제", "교황", "연인", "전차", "힘", "은둔자", "운명의 수레바퀴", "정의", "매달린 사람", "죽음", "절제", "악마", "탑", "별", "태양", "달", "심판", "세계"];
const LUCKY_MSG = ["새로 시작해 봐, 두려워 말고.", "네 능력을 믿고 실행할 때야.", "직관을 믿어, 답은 이미 알아.", "풍요와 애정이 함께해.", "중심을 잡으면 흐름이 붙어.", "배움과 조언이 행운을 불러.", "좋은 인연·선택이 기다려.", "밀어붙이면 이겨.", "부드러운 용기가 통해.", "잠깐의 성찰이 길을 밝혀.", "전환점! 기회를 잡아.", "공정하게, 결과가 따라와.", "관점을 바꾸면 풀려.", "끝은 새 시작이야.", "중용을 지키면 안정돼.", "얽매인 걸 끊어낼 때.", "묵은 걸 무너뜨려 새로.", "희망을 놓지 마, 곧 회복돼.", "환하게 풀리는 날!", "혼란은 곧 걷혀.", "다시 일어설 기회가 와.", "드디어 완성·성취!"];
export function luckyCard(profile, today = new Date()) {
  const seed = hashN(`${profile.pillars.day.gz}_${today.getFullYear()}${today.getMonth()}${today.getDate()}`);
  const idx = seed % 22;
  return { idx, name: MAJORS[idx], bgStyle: majorBgStyle(idx), message: LUCKY_MSG[idx], luckyColor: ["빨강", "주황", "노랑", "초록", "파랑", "보라", "분홍", "흰색"][seed % 8] };
}

/* ---------------- 오늘의 운세 레이더 (5분야) ---------------- */
export function radarScores(profile, today = new Date()) {
  const s = sipG(profile);
  const total = s.peer + s.output + s.wealth + s.officer + s.resource || 1;
  const dohwa = [profile.pillars.year, profile.pillars.month, profile.pillars.day, profile.pillars.hour]
    .filter(Boolean).filter((p) => [0, 3, 6, 9].includes(p.branchIdx)).length;
  const key = `${today.getFullYear()}${today.getMonth()}${today.getDate()}`;
  const jit = (name) => hashN(profile.pillars.day.gz + key + name) % 20 - 8;
  const norm = (v, name) => clampS(45 + (v / total) * 90 + jit(name));
  return [
    { key: "재물운", v: norm(s.wealth + s.output * 0.4, "money") },
    { key: "연애운", v: norm(s.wealth * 0.5 + s.officer * 0.5 + dohwa, "love") },
    { key: "사업운", v: norm(s.officer + s.wealth * 0.6, "work") },
    { key: "건강운", v: norm(s.peer + s.resource * 0.5, "health") },
    { key: "학업운", v: norm(s.resource + s.output * 0.4, "study") },
  ];
}
export function radarSvg(scores) {
  const W = 260, cx = W / 2, cy = 140, R = 92, n = scores.length;
  const pt = (i, r) => { const a = -Math.PI / 2 + (2 * Math.PI * i) / n; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
  let rings = "";
  for (const f of [1, 0.66, 0.33]) rings += `<polygon points="${scores.map((_, i) => pt(i, R * f).map((x) => x.toFixed(1)).join(",")).join(" ")}" fill="none" stroke="rgba(255,255,255,0.10)"/>`;
  let axes = "", labels = "";
  scores.forEach((sc, i) => {
    const [ex, ey] = pt(i, R); axes += `<line x1="${cx}" y1="${cy}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="rgba(255,255,255,0.08)"/>`;
    const [lx, ly] = pt(i, R + 18);
    labels += `<text x="${lx.toFixed(1)}" y="${(ly + 3).toFixed(1)}" text-anchor="middle" font-size="11" fill="#d7c4c8">${sc.key} ${sc.v}</text>`;
  });
  const poly = scores.map((sc, i) => pt(i, R * (sc.v / 100)).map((x) => x.toFixed(1)).join(",")).join(" ");
  return `<svg viewBox="0 0 ${W} ${W}" width="100%" role="img" aria-label="오늘의 운세 레이더">${rings}${axes}<polygon points="${poly}" fill="rgba(236,171,176,0.28)" stroke="#ecabb0" stroke-width="2"/>${labels}</svg>`;
}

/* ---------------- 바이오리듬 ---------------- */
export function biorhythm(profile, today = new Date()) {
  const s = profile.solar;
  const birth = new Date(s.Y, s.M - 1, s.D);
  const days = Math.floor((Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) - Date.UTC(birth.getFullYear(), birth.getMonth(), birth.getDate())) / 86400000);
  const cyc = (period, d = days) => Math.round(Math.sin((2 * Math.PI * d) / period) * 100);
  const phys = cyc(23), emo = cyc(28), intel = cyc(33);
  const lv = (v) => v >= 60 ? "좋음" : v >= 20 ? "무난" : v >= -20 ? "주의(전환)" : v >= -60 ? "낮음" : "저조";

  // 곡선용 시계열 (오늘 기준 -15 ~ +15일, 31점)
  const SPAN = 15;
  const physical = [], emotional = [], intellectual = [], xdates = [];
  for (let o = -SPAN; o <= SPAN; o++) {
    physical.push(cyc(23, days + o));
    emotional.push(cyc(28, days + o));
    intellectual.push(cyc(33, days + o));
    const dt = new Date(today); dt.setDate(dt.getDate() + o);
    xdates.push({ i: o + SPAN, day: dt.getDate(), isToday: o === 0 });
  }
  return {
    days, span: SPAN, todayIndex: SPAN,
    series: { physical, emotional, intellectual }, xdates,
    physical: { v: phys, level: lv(phys), desc: "체력·활력·컨디션" },
    emotional: { v: emo, level: lv(emo), desc: "감정·기분·직감" },
    intellectual: { v: intel, level: lv(intel), desc: "집중·판단·논리" },
    tip: phys < -20 || emo < -20 || intel < -20
      ? "곡선이 0을 지나는 ‘전환일’ 근처예요. 무리한 결정·과로는 피하고 컨디션 관리를 우선하세요."
      : "전반적으로 안정적인 흐름이에요. 좋은 리듬을 활용해 계획한 일을 밀어붙여 보세요.",
  };
}

/* 바이오리듬 곡선 SVG — 부드러운 베지어 곡선 + 은은한 글로우 */
export function bioSvg(b, H = 150) {
  const W = 320, padX = 12, botPad = 18, mid = (H - botPad) / 2 + 4, amp = (H - botPad) / 2 - 8;
  const n = b.series.physical.length;
  const X = (i) => padX + (i / (n - 1)) * (W - padX * 2);
  const Y = (v) => mid - (v / 100) * amp;
  // Catmull-Rom → 부드러운 곡선 path
  const smooth = (arr) => {
    const p = arr.map((v, i) => [X(i), Y(v)]);
    let d = `M ${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p[i + 1];
      const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d;
  };
  const curve = (arr, color) => `<path d="${smooth(arr)}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" filter="url(#bioGlow)"/>`;
  const dot = (arr, color) => { const cx = X(b.todayIndex).toFixed(1), cy = Y(arr[b.todayIndex]).toFixed(1); return `<circle cx="${cx}" cy="${cy}" r="4.5" fill="${color}" stroke="#fff" stroke-width="1.6"/>`; };
  let grid = "";
  for (const gy of [amp, amp / 2, -amp / 2, -amp]) grid += `<line x1="${padX}" y1="${(mid - gy).toFixed(1)}" x2="${W - padX}" y2="${(mid - gy).toFixed(1)}" stroke="rgba(255,230,240,0.16)" stroke-dasharray="1 6"/>`;
  const zero = `<line x1="${padX}" y1="${mid}" x2="${W - padX}" y2="${mid}" stroke="rgba(255,217,194,0.55)" stroke-width="1"/><text x="${W - padX}" y="${mid - 4}" text-anchor="end" font-size="8.5" fill="rgba(255,225,205,0.9)">0 · 전환선</text>`;
  const tx = X(b.todayIndex).toFixed(1);
  const todayLine = `<line x1="${tx}" y1="2" x2="${tx}" y2="${H - botPad}" stroke="rgba(255,195,209,0.7)" stroke-width="1" stroke-dasharray="2 4"/>`;
  let labels = "";
  b.xdates.forEach((d) => { if (d.i % 5 === 0 || d.isToday) labels += `<text x="${X(d.i).toFixed(1)}" y="${H - 3}" text-anchor="middle" font-size="9" font-weight="${d.isToday ? "700" : "400"}" fill="${d.isToday ? "#ffd9c2" : "#e8c6d6"}">${d.isToday ? "오늘" : d.day}</text>`; });
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="바이오리듬 곡선">`
    + `<defs><filter id="bioGlow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="0" stdDeviation="2.2" flood-color="#5a2a50" flood-opacity="0.35"/></filter></defs>`
    + `${grid}${zero}${todayLine}`
    + curve(b.series.intellectual, "#ffd39a") + curve(b.series.emotional, "#dcb6ff") + curve(b.series.physical, "#ffa3b5")
    + dot(b.series.intellectual, "#ffd39a") + dot(b.series.emotional, "#dcb6ff") + dot(b.series.physical, "#ffa3b5")
    + `${labels}</svg>`;
}

/* ---------------- 운세 캘린더 (월별 날짜 점수) ---------------- */
const GROUP_BASE = { 비견: 58, 겁재: 55, 식신: 70, 상관: 66, 정재: 74, 편재: 70, 정관: 64, 편관: 60, 정인: 68, 편인: 64 };
const p2 = (n) => String(n).padStart(2, "0");
export function monthScores(profile, year, month) {
  const dim = new Date(year, month, 0).getDate();
  const myStem = profile.pillars.day.stemIdx;
  const out = [];
  for (let d = 1; d <= dim; d++) {
    const t = computeSaju({ calendarType: "solar", birthDate: `${year}-${p2(month)}-${p2(d)}`, birthTime: "12:00", timeUnknown: true, gender: "male", timezone: "Asia/Seoul" });
    const god = tenGod(myStem, t.pillars.day.stemIdx);
    const base = GROUP_BASE[god] || 60;
    const j = hashN((profile.pillars.day.gz || "") + year + month + d) % 16 - 8;
    out.push({ day: d, score: clampS(base + j), iljin: t.pillars.day.gz, god });
  }
  return out;
}

/* ---------------- 택일 (좋은 날 잡기) ---------------- */
export const TAEGIL_PURPOSES = [
  { id: "meet", name: "약속·만남", good: [0, 3, 6, 9], tip: "편안하고 즐거운 만남·모임에 좋은 날이에요." },
  { id: "date", name: "데이트·고백", good: [3, 9, 6, 5], tip: "설렘과 끌림이 커지는 날이에요. 데이트·소개팅·고백하기 좋아요." },
  { id: "move", name: "이사", good: [2, 8, 5, 11], tip: "이동·새 출발에 힘이 실리는 날이에요." },
  { id: "contract", name: "계약·서명", good: [4, 10, 1, 7], tip: "안정적으로 도장 찍기 좋은 날이에요." },
  { id: "open", name: "개업·오픈", good: [2, 6, 10], tip: "재물·번영의 기운이 도는 날이에요." },
  { id: "travel", name: "여행", good: [2, 8, 5, 11], tip: "길 위에서 운이 트이는 날이에요." },
];
export function taegilMonth(profile, year, month, purposeId) {
  const P = TAEGIL_PURPOSES.find((x) => x.id === purposeId) || TAEGIL_PURPOSES[0];
  const myB = profile.pillars.day.branchIdx;
  const dim = new Date(year, month, 0).getDate();
  const days = [];
  for (let d = 1; d <= dim; d++) {
    const t = computeSaju({ calendarType: "solar", birthDate: `${year}-${p2(month)}-${p2(d)}`, birthTime: "12:00", timeUnknown: true, gender: "male", timezone: "Asia/Seoul" });
    const b = t.pillars.day.branchIdx;
    let s = 52;
    if (inP(HAP6, myB, b)) s += 14; else if (SAMHAP.some((g) => g.includes(myB) && g.includes(b)) && myB !== b) s += 12;
    else if (Math.abs(myB - b) === 6) s -= 16; else if (inP(HAE, myB, b)) s -= 8;
    if (P.good.includes(b)) s += 12;
    s += hashN(profile.pillars.day.gz + year + month + d + purposeId) % 10 - 5;
    days.push({ day: d, score: clampS(s), iljin: t.pillars.day.gz });
  }
  const sorted = [...days].sort((a, b) => b.score - a.score);
  return { purpose: P, tip: P.tip, days, best: sorted.slice(0, 5).sort((a, b) => a.day - b.day), caution: sorted.slice(-3).sort((a, b) => a.day - b.day) };
}
